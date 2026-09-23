import * as THREE from 'three';
import { ROAD_ANGLE_RANGE, ROAD_CENTER_MODEL, ROAD_SCALE, STREET_WIDTH, roadRadiiAt } from './heroConfig';

// The road model is a crescent with pointed tips. Each tip is continued by a procedural street:
// it keeps the road's radius and width round to the tip (covering the taper), then eases out of
// the bend and runs away from the house, so the street reads as continuing off into the distance.

const CX = ROAD_CENTER_MODEL.x * ROAD_SCALE;
const CZ = ROAD_CENTER_MODEL.z * ROAD_SCALE;
const STEP = 0.5;
const LENGTH = 90; // metres beyond the model's tip
const BEND_RADIUS = 20;
export const ROAD_TOP = 0.046; // just above the model's surface where the two overlap

export type RoadExtension = {
  joinDeg: number;
  width: number;
  tipS: number; // distance from the join to the model's tip
  length: number;
  pts: THREE.Vector3[]; // centreline from the join outward
  across: THREE.Vector3[]; // unit vectors, inner edge → outer edge
  dist: number[]; // cumulative length along the centreline
  point(s: number, lane: number, target?: THREE.Vector3): THREE.Vector3;
};

export function buildExtensionPath(side: 'right' | 'left'): RoadExtension {
  const [a0, a1] = ROAD_ANGLE_RANGE;
  const right = side === 'right';
  // join where the model is exactly carriageway-wide, so edges and markings line up
  const joinDeg = right ? a0 + 12 : a1 - 30;
  const tipDeg = right ? a0 : a1;
  const [ri] = roadRadiiAt(joinDeg);
  const width = STREET_WIDTH;
  const rc = ri * ROAD_SCALE + width / 2;
  const pts: THREE.Vector3[] = [];
  const across: THREE.Vector3[] = [];

  // 1) round the bend to the tip at the join's radius and width
  const arcLen = (Math.abs(tipDeg - joinDeg) * Math.PI * rc) / 180;
  const nArc = Math.max(2, Math.ceil(arcLen / STEP));
  for (let i = 0; i <= nArc; i++) {
    const a = THREE.MathUtils.degToRad(joinDeg + ((tipDeg - joinDeg) * i) / nArc);
    pts.push(new THREE.Vector3(CX + Math.cos(a) * rc, ROAD_TOP, CZ + Math.sin(a) * rc));
    across.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
  }
  // 2) ease out of the bend and head away from the house
  const ta = THREE.MathUtils.degToRad(tipDeg);
  const dir = right ? -1 : 1;
  const heading = new THREE.Vector3(-Math.sin(ta) * dir, 0, Math.cos(ta) * dir);
  const goal = new THREE.Vector3(right ? 0.96 : -0.96, 0, -0.28).normalize();
  const maxTurn = STEP / BEND_RADIUS;
  const p = pts[pts.length - 1].clone();
  for (let s = 0; s < LENGTH; s += STEP) {
    const ang = Math.atan2(heading.x * goal.z - heading.z * goal.x, heading.dot(goal));
    heading.applyAxisAngle(new THREE.Vector3(0, 1, 0), -THREE.MathUtils.clamp(ang, -maxTurn, maxTurn));
    p.addScaledVector(heading, STEP);
    pts.push(p.clone());
    across.push(right ? new THREE.Vector3(-heading.z, 0, heading.x) : new THREE.Vector3(heading.z, 0, -heading.x));
  }
  const dist = [0];
  for (let i = 1; i < pts.length; i++) dist.push(dist[i - 1] + pts[i].distanceTo(pts[i - 1]));

  const point = (s: number, lane: number, target = new THREE.Vector3()) => {
    s = THREE.MathUtils.clamp(s, 0, dist[dist.length - 1]);
    let i = 1;
    while (i < dist.length - 1 && dist[i] < s) i++;
    const t = (s - dist[i - 1]) / Math.max(dist[i] - dist[i - 1], 1e-6);
    const off = (lane - 0.5) * width;
    const ax = THREE.MathUtils.lerp(across[i - 1].x, across[i].x, t);
    const az = THREE.MathUtils.lerp(across[i - 1].z, across[i].z, t);
    return target.set(
      THREE.MathUtils.lerp(pts[i - 1].x, pts[i].x, t) + ax * off,
      ROAD_TOP,
      THREE.MathUtils.lerp(pts[i - 1].z, pts[i].z, t) + az * off
    );
  };
  return { joinDeg, width, tipS: dist[nArc], length: dist[dist.length - 1], pts, across, dist, point };
}

/**
 * How much the ground dissolves into the white backdrop at (x, z): close in front of the road
 * (the island look), far away to the sides and behind, where the streets and terrain continue.
 */
export function groundFade(x: number, z: number) {
  const dx = x - CX;
  const dz = z - CZ;
  const r = Math.hypot(dx, dz);
  const front = THREE.MathUtils.smoothstep(dz / Math.max(r, 1e-6), 0.15, 0.7); // 1 in front of the house
  const r0 = THREE.MathUtils.lerp(38, 19.8, front);
  const r1 = THREE.MathUtils.lerp(85, 22.5, front);
  return THREE.MathUtils.smoothstep(r, r0, r1);
}

/** Distance in plan from (x, z) to the nearest street centreline. */
export function distToStreets(exts: RoadExtension[], x: number, z: number) {
  let best = Infinity;
  for (const e of exts) {
    for (let i = 1; i < e.pts.length; i++) {
      const a = e.pts[i - 1];
      const b = e.pts[i];
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const t = THREE.MathUtils.clamp(((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz), 0, 1);
      best = Math.min(best, Math.hypot(x - a.x - abx * t, z - a.z - abz * t));
    }
  }
  return best;
}

/** Street surface: a ribbon with `aRib` = (across 0–1, along metres, backdrop fade). */
export function buildStreetGeometry(e: RoadExtension) {
  const acrossSegs = 4;
  const positions: number[] = [];
  const rib: number[] = [];
  const index: number[] = [];
  const row = acrossSegs + 1;
  // wind the triangles counter-clockwise seen from above on either side
  const h = e.pts[1].clone().sub(e.pts[0]);
  const flip = e.across[0].z * h.x - e.across[0].x * h.z < 0;
  e.pts.forEach((c, i) => {
    for (let j = 0; j <= acrossSegs; j++) {
      const u = j / acrossSegs;
      const off = (u - 0.5) * e.width;
      const x = c.x + e.across[i].x * off;
      const z = c.z + e.across[i].z * off;
      positions.push(x, ROAD_TOP, z);
      rib.push(u, e.dist[i], groundFade(x, z));
    }
    if (i > 0) {
      for (let j = 0; j < acrossSegs; j++) {
        const p = (i - 1) * row + j;
        const q = i * row + j;
        if (flip) index.push(p, q, p + 1, q, q + 1, p + 1);
        else index.push(p, p + 1, q, q, p + 1, q + 1);
      }
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aRib', new THREE.Float32BufferAttribute(rib, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

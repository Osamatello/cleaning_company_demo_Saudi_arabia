import * as THREE from 'three';
import { NOISE_GLSL, injectObjectSpaceVaryings } from './materials';

// The van's foam trail — a separate effect from the house-cleaning foam.
//
// One ribbon of geometry is laid along the van's precomputed driving line, on the road surface.
// Its shader decides, per point, how much wet foam is there: dense lather right behind the van's
// rear, spreading and breaking up into patches over the next few metres, with a darker wet film
// around it, and nothing beyond the trail's length — so it follows the van, never stays on the
// road, and disappears as the van slows to park. The foam has real volume (the vertices lift into
// soft lumps) and is lit like the rest of the scene. Only the few metres behind the van are drawn.

type DriveLine = { length: number; sample(s: number, target: THREE.Vector3): { yaw: number; curvature: number } };

export type VanTrail = {
  mesh: THREE.Mesh;
  /** rearS: metres along the line of the van's rear; returns true while any foam is showing */
  update(rearS: number, length: number, strength: number, time: number): boolean;
};

const HALF_WIDTH = 1.25; // metres either side of the van's centre line
const LIFT = 0.058; // just above both road surfaces

const TRAIL_GLSL = /* glsl */ `
  uniform float uHead;
  uniform float uLen;
  uniform float uStrength;
  uniform float uTime;
  // x = foam coverage, y = lumpiness, z = wet film. st = (metres along the line, −1…1 across)
  vec3 trailFoam(vec2 st, vec3 w) {
    float behind = uHead - st.x;
    float age = clamp(behind / max(uLen, 0.001), 0.0, 1.0);
    float live = smoothstep(-0.2, 0.5, behind) * (1.0 - smoothstep(0.6, 1.0, age)) * uStrength;
    float halfW = mix(0.36, 0.85, sqrt(age)); // it spreads out as it settles
    float side = 1.0 - smoothstep(halfW - 0.3, halfW, abs(st.y));
    vec3 q = w * vec3(1.1, 1.0, 1.1) + vec3(0.0, uTime * 0.15, 0.0);
    float n = h_noise(q) * 0.65 + h_noise(q * 2.7) * 0.35;
    // dense right behind the van, then it breaks up into soft patches and fades
    float cover = smoothstep(0.32 + 0.4 * age, 0.58 + 0.4 * age, live * side * (0.4 + 1.05 * n));
    float wet = live * (1.0 - smoothstep(halfW, halfW + 0.35, abs(st.y))) * (1.0 - age * 0.5);
    return vec3(cover, n, wet);
  }
`;

export function createVanTrail(line: DriveLine, detail = 1): VanTrail {
  const step = 0.25 / Math.max(0.25, detail);
  const across = Math.max(4, Math.round(10 * detail));
  const rows = Math.ceil(line.length / step) + 1;
  const positions = new Float32Array(rows * (across + 1) * 3);
  const trail = new Float32Array(rows * (across + 1) * 2);
  const normals = new Float32Array(rows * (across + 1) * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < rows; i++) {
    const s = Math.min(i * step, line.length);
    const { yaw } = line.sample(s, p);
    const rx = Math.sin(yaw); // the van's right-hand side (see vehicle.ts)
    const rz = Math.cos(yaw);
    for (let j = 0; j <= across; j++) {
      const u = (j / across) * 2 - 1;
      const k = i * (across + 1) + j;
      positions.set([p.x + rx * u * HALF_WIDTH, LIFT, p.z + rz * u * HALF_WIDTH], k * 3);
      normals.set([0, 1, 0], k * 3);
      trail.set([s, u], k * 2);
    }
  }
  // wind every quad counter-clockwise seen from above
  const p0 = new THREE.Vector3(positions[0], 0, positions[2]);
  const pAcross = new THREE.Vector3(positions[3], 0, positions[5]).sub(p0);
  const pAlong = new THREE.Vector3(positions[(across + 1) * 3], 0, positions[(across + 1) * 3 + 2]).sub(p0);
  const flip = pAcross.z * pAlong.x - pAcross.x * pAlong.z < 0;
  const index: number[] = [];
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * (across + 1) + j;
      const b = a + across + 1;
      if (flip) index.push(a, b, a + 1, b, b + 1, a + 1);
      else index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('aTrail', new THREE.BufferAttribute(trail, 2));
  geo.setIndex(index);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); // it moves with the van; never cull it

  const uniforms = {
    uHead: { value: 0 },
    uLen: { value: 1 },
    uStrength: { value: 0 },
    uTime: { value: 0 },
  };
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  mat.customProgramCacheKey = () => 'van-trail';
  mat.onBeforeCompile = (shader) => {
    injectObjectSpaceVaryings(shader);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aTrail;\nvarying vec2 vTrail;\n' + NOISE_GLSL + TRAIL_GLSL)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vTrail = aTrail;
        vec3 tfv = trailFoam(aTrail, position);
        transformed.y += tfv.x * (0.04 + 0.1 * tfv.y); // soft lumps with real volume`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'varying vec2 vTrail;\n' + TRAIL_GLSL + '\nvoid main() {')
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        vec3 tf = trailFoam(vTrail, vWPos);
        float foamA = smoothstep(0.02, 0.3, tf.x);
        if (foamA <= 0.0 && tf.z <= 0.01) discard;
        float fpx = length(fwidth(vWPos));
        float suds = h_noise(vWPos * 14.0 + vec3(0.0, uTime * 0.2, 0.0)) * (1.0 - smoothstep(0.01, 0.04, fpx));
        vec3 foamC = vec3(0.9, 0.91, 0.92) * (0.7 + 0.3 * tf.y) * (0.9 + 0.1 * suds) * mix(0.82, 1.0, smoothstep(0.3, 1.0, tf.x));
        diffuseColor.rgb = mix(vec3(0.03, 0.032, 0.035), foamC, foamA); // wet asphalt around the foam
        diffuseColor.a = max(foamA, tf.z * 0.3);`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.12, 0.5, foamA);`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = h_bump(-vViewPosition, normal, tf.x * (0.04 + 0.1 * tf.y) + suds * 0.004 * foamA);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(0.08) * foamA; // foam scatters light: never grey in the shade`
      );
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.visible = false;
  mesh.renderOrder = 1;
  const quadsPerRow = across * 6;

  return {
    mesh,
    update(rearS, length, strength, time) {
      const on = strength > 0.002;
      mesh.visible = on;
      if (!on) return false;
      uniforms.uHead.value = rearS;
      uniforms.uLen.value = length;
      uniforms.uStrength.value = strength;
      uniforms.uTime.value = time;
      // draw only the rows the trail can occupy
      const r0 = Math.max(0, Math.floor((rearS - length - 1) / step));
      const r1 = Math.min(rows - 1, Math.ceil((rearS + 0.6) / step));
      geo.setDrawRange(r0 * quadsPerRow, Math.max(0, r1 - r0) * quadsPerRow);
      return r1 > r0;
    },
  };
}

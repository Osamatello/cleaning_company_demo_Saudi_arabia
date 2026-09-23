import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// A broadleaf tree built like a real one: a tapered, slightly crooked trunk that forks into main
// limbs and smaller branches, with foliage clustered at the branch tips (so the crown is irregular
// and lets light through). Foliage is rendered as leaf-spray cards with:
//  • "bent" normals pointing out of the crown, so the canopy shades as a soft volume
//  • per-card occlusion (darker deep inside and underneath the crown)
//  • light transmission when the sun is behind the leaves
// Wind is layered and non-periodic: a slow gust envelope, branch sway whose amplitude grows
// towards the tips (the trunk barely moves), and fast, tiny leaf flutter — each branch and card on
// its own phase, so nothing moves in lockstep.

export type WindUniforms = { uWind: { value: number }; uSunDir: { value: THREE.Vector3 } };

type Branch = { curve: THREE.CatmullRomCurve3; r0: number; r1: number; level: number; phase: number };

function rng(seed: number) {
  let s = (seed * 9301 + 49297) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Tapered tube along a curve, carrying per-vertex wind data (weight along the tree, branch phase).
function taperedTube(b: Branch, lenSeg: number, radSeg: number, weightAt: (t: number) => number) {
  const frames = b.curve.computeFrenetFrames(lenSeg, false);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const wind: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= lenSeg; i++) {
    const t = i / lenSeg;
    b.curve.getPointAt(t, p);
    const r = THREE.MathUtils.lerp(b.r0, b.r1, t) * (1 + 0.25 * Math.pow(1 - t, 6) * (b.level === 0 ? 1 : 0)); // root flare
    for (let j = 0; j <= radSeg; j++) {
      const a = (j / radSeg) * Math.PI * 2;
      n.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a)).normalize();
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      nor.push(n.x, n.y, n.z);
      uv.push(j / radSeg, t * 4);
      wind.push(weightAt(t), b.phase, b.level);
    }
  }
  for (let i = 0; i < lenSeg; i++) {
    for (let j = 0; j < radSeg; j++) {
      const a = i * (radSeg + 1) + j;
      const c = a + radSeg + 1;
      idx.push(a, c, a + 1, c, c + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aWind', new THREE.Float32BufferAttribute(wind, 3));
  g.setIndex(idx);
  return g;
}

let sprayTexture: THREE.Texture | null = null;
/** Two leaf-spray variants side by side: small leaves along a twig, with veins and colour shifts. */
function getSprayTexture() {
  if (sprayTexture) return sprayTexture;
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = S * 2;
  cv.height = S;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, S * 2, S);
  const r = rng(5);
  for (let v = 0; v < 2; v++) {
    const ox = v * S;
    // twig
    g.strokeStyle = '#4f4031';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ox + S * 0.5, S * 0.98);
    g.quadraticCurveTo(ox + S * (0.45 + v * 0.1), S * 0.55, ox + S * 0.52, S * 0.12);
    g.stroke();
    const leaves = 11 + v * 3;
    for (let i = 0; i < leaves; i++) {
      const t = 0.12 + (i / leaves) * 0.82;
      const bx = ox + S * (0.5 + (v ? 0.03 : -0.02) * Math.sin(t * 3));
      const by = S * (0.98 - t * 0.86);
      const side = i % 2 === 0 ? 1 : -1;
      const ang = -Math.PI / 2 + side * (0.6 + r() * 0.5) + (r() - 0.5) * 0.3;
      const len = S * (0.17 + r() * 0.08) * (1 - t * 0.35);
      const wid = len * (0.34 + r() * 0.08);
      g.save();
      g.translate(bx, by);
      g.rotate(ang);
      const l = 16 + r() * 13;
      const hue = 88 + r() * 22;
      const grd = g.createLinearGradient(0, 0, len, 0);
      grd.addColorStop(0, `hsl(${hue}, 42%, ${l + 8}%)`);
      grd.addColorStop(1, `hsl(${hue + 6}, 48%, ${l - 4}%)`);
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(len * 0.45, -wid, len, 0);
      g.quadraticCurveTo(len * 0.45, wid, 0, 0);
      g.fill();
      g.strokeStyle = `hsla(${hue}, 40%, ${l + 22}%, 0.5)`;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(2, 0);
      g.lineTo(len * 0.92, 0);
      g.stroke();
      g.restore();
    }
  }
  sprayTexture = new THREE.CanvasTexture(cv);
  sprayTexture.colorSpace = THREE.SRGBColorSpace;
  sprayTexture.anisotropy = 4;
  return sprayTexture;
}

let barkTexture: THREE.Texture | null = null;
function getBarkTexture() {
  if (barkTexture) return barkTexture;
  const W = 256;
  const H = 512;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#5b4a3b';
  g.fillRect(0, 0, W, H);
  const r = rng(9);
  // vertical fissures and plates
  for (let i = 0; i < 180; i++) {
    const x = r() * W;
    const y = r() * H;
    const h = 30 + r() * 120;
    g.strokeStyle = `rgba(${30 + r() * 20},${24 + r() * 16},${18 + r() * 12},${0.4 + r() * 0.4})`;
    g.lineWidth = 1 + r() * 3;
    g.beginPath();
    g.moveTo(x, y);
    g.bezierCurveTo(x + (r() - 0.5) * 10, y + h * 0.3, x + (r() - 0.5) * 10, y + h * 0.7, x + (r() - 0.5) * 8, y + h);
    g.stroke();
  }
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(${120 + r() * 40},${110 + r() * 30},${95 + r() * 25},${0.12 + r() * 0.15})`;
    g.fillRect(r() * W, r() * H, 6 + r() * 16, 20 + r() * 50);
  }
  barkTexture = new THREE.CanvasTexture(cv);
  barkTexture.wrapS = barkTexture.wrapT = THREE.RepeatWrapping;
  barkTexture.colorSpace = THREE.SRGBColorSpace;
  return barkTexture;
}

// Shared wind displacement (tree space). aWind = (weight 0–1, phase, level).
const WIND_GLSL = /* glsl */ `
  uniform float uWind;
  vec3 treeWind(vec3 p, vec3 w) {
    float t = uWind;
    // slow, non-repeating gust envelope
    float gust = 0.55 + 0.45 * (0.5 + 0.5 * sin(t * 0.21 + 1.3)) * (0.65 + 0.35 * sin(t * 0.073 + 0.4));
    vec3 dir = normalize(vec3(1.0, 0.0, 0.35));
    float sway = sin(t * 0.83 + w.y) * 0.55 + sin(t * 1.37 + w.y * 1.7) * 0.3 + sin(t * 2.31 + w.y * 0.6) * 0.15;
    vec3 d = dir * (0.05 * gust + 0.045 * sway) * w.x;
    d.y += sin(t * 1.13 + w.y * 2.1) * 0.012 * w.x;
    d += cross(dir, vec3(0.0, 1.0, 0.0)) * sin(t * 0.97 + w.y * 1.3) * 0.02 * w.x;
    return d;
  }
`;

function windMaterial(mat: THREE.MeshStandardMaterial, u: WindUniforms, leaves: boolean) {
  mat.customProgramCacheKey = () => (leaves ? 'tree-leaves-v2' : 'tree-bark-v2');
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        ${WIND_GLSL}
        attribute vec3 aWind;
        ${leaves ? 'attribute vec3 aBent; attribute float aAO; attribute float aTile; varying float vAO;' : ''}`
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        ${leaves ? '#ifdef USE_MAP\n vMapUv.x = (vMapUv.x + aTile) * 0.5;\n #endif' : ''}`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        ${
          leaves
            ? `// leaf flutter: quick, tiny tilts of each spray around its own axes
        float flA = sin(uWind * 5.3 + aWind.y * 7.0) * 0.6 + sin(uWind * 8.9 + aWind.y * 3.1) * 0.4;
        float flB = sin(uWind * 4.1 + aWind.y * 5.3) * 0.5 + sin(uWind * 7.3 + aWind.y * 1.9) * 0.5;
        float ca = cos(flA * 0.1), sa = sin(flA * 0.1), cb = cos(flB * 0.07), sb = sin(flB * 0.07);
        transformed = vec3(transformed.x * ca - transformed.z * sa, transformed.y, transformed.x * sa + transformed.z * ca);
        transformed = vec3(transformed.x, transformed.y * cb - transformed.z * sb, transformed.y * sb + transformed.z * cb);
        vAO = aAO;`
            : ''
        }`
      )
      .replace(
        '#include <project_vertex>',
        `vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition.xyz += treeWind(mvPosition.xyz, aWind);
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`
      );
    if (leaves) {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <defaultnormal_vertex>',
        `#include <defaultnormal_vertex>
        // bent normals: shade the crown as a soft volume instead of thousands of flat cards
        transformedNormal = normalize(mix(transformedNormal, normalMatrix * aBent, 0.78));`
      );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vAO;\nuniform vec3 uSunDir;')
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal);')
        .replace(
          '#include <lights_fragment_end>',
          `#include <lights_fragment_end>
          reflectedLight.indirectDiffuse *= vAO;
          reflectedLight.directDiffuse *= mix(0.55, 1.0, vAO);
          // light transmitted through the leaves when the sun is behind them
          vec3 sunV = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
          float back = pow(clamp(dot(normalize(-vViewPosition), sunV), 0.0, 1.0), 4.0);
          reflectedLight.directDiffuse += diffuseColor.rgb * vec3(1.0, 0.95, 0.6) * back * 0.8 * vAO;`
        );
    }
  };
}

export function buildTree(position: THREE.Vector3, scale: number, seed: number, u: WindUniforms) {
  const r = rng(seed);
  const group = new THREE.Group();

  // --- skeleton -----------------------------------------------------------------------------
  const branches: Branch[] = [];
  const tips: { p: THREE.Vector3; size: number; phase: number; dir: THREE.Vector3 }[] = [];
  const trunkTop = new THREE.Vector3(0.12, 2.7, 0.05);
  branches.push({
    curve: new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 1.1, -0.04), new THREE.Vector3(-0.02, 2.0, 0.05), trunkTop]),
    r0: 0.26,
    r1: 0.17,
    level: 0,
    phase: 0,
  });
  const mains = 7;
  for (let i = 0; i < mains; i++) {
    const az = (i / mains) * Math.PI * 2 + r() * 0.6;
    const up = 0.55 + r() * 0.35;
    const len = 1.7 + r() * 0.7;
    const dir = new THREE.Vector3(Math.cos(az) * (1 - up * 0.6), up, Math.sin(az) * (1 - up * 0.6)).normalize();
    const start = trunkTop.clone().add(new THREE.Vector3(0, (r() - 0.5) * 0.4 - 0.2, 0));
    const mid = start.clone().addScaledVector(dir, len * 0.5).add(new THREE.Vector3((r() - 0.5) * 0.3, 0.1, (r() - 0.5) * 0.3));
    const end = start.clone().addScaledVector(dir, len).add(new THREE.Vector3(0, 0.25, 0));
    const phase = r() * 6.28;
    const main: Branch = { curve: new THREE.CatmullRomCurve3([start, mid, end]), r0: 0.12, r1: 0.045, level: 1, phase };
    branches.push(main);
    tips.push({ p: end, size: 1.1 + r() * 0.3, phase, dir });
    const subs = 3 + Math.floor(r() * 2);
    for (let k = 0; k < subs; k++) {
      const t = 0.45 + r() * 0.4;
      const s0 = main.curve.getPointAt(t);
      const saz = az + (r() - 0.5) * 2.2;
      const sdir = new THREE.Vector3(Math.cos(saz), 0.5 + r() * 0.5, Math.sin(saz)).normalize();
      const slen = 0.8 + r() * 0.6;
      const s1 = s0.clone().addScaledVector(sdir, slen * 0.5).add(new THREE.Vector3(0, 0.08, 0));
      const s2 = s0.clone().addScaledVector(sdir, slen);
      const sphase = phase + (r() - 0.5) * 1.5;
      branches.push({ curve: new THREE.CatmullRomCurve3([s0, s1, s2]), r0: 0.05, r1: 0.02, level: 2, phase: sphase });
      tips.push({ p: s2, size: 0.85 + r() * 0.3, phase: sphase, dir: sdir });
    }
  }

  // --- bark ------------------------------------------------------------------------------------
  const H = 5.5;
  const barkGeos = branches.map((b) => {
    const weight = (t: number) => {
      if (b.level === 0) return Math.pow(t, 3) * 0.06; // trunk: practically still
      const y0 = b.curve.getPointAt(0).y / H;
      return THREE.MathUtils.clamp(0.1 + y0 * 0.2 + t * (b.level === 1 ? 0.5 : 0.75), 0, 1);
    };
    return taperedTube(b, b.level === 0 ? 14 : 8, b.level === 0 ? 14 : 7, weight);
  });
  const barkMat = new THREE.MeshStandardMaterial({ map: getBarkTexture(), bumpMap: getBarkTexture(), bumpScale: 3, roughness: 0.95, color: 0xcfc4b8 });
  windMaterial(barkMat, u, false);
  const bark = new THREE.Mesh(mergeGeometries(barkGeos), barkMat);
  bark.castShadow = true;
  bark.receiveShadow = true;
  group.add(bark);

  // --- foliage -----------------------------------------------------------------------------------
  const crown = tips.reduce((acc, t) => acc.add(t.p), new THREE.Vector3()).divideScalar(tips.length);
  crown.y += 0.2;
  const outer = tips.slice();
  for (let i = 0; i < 14; i++) {
    const a = outer[i % outer.length];
    const b = outer[(i * 5 + 3) % outer.length];
    const p = a.p.clone().lerp(b.p, 0.5).lerp(crown, 0.25);
    p.y += 0.15 + r() * 0.3;
    tips.push({ p, size: 0.9 + r() * 0.3, phase: (a.phase + b.phase) / 2, dir: p.clone().sub(crown).normalize() });
  }
  const perTip = 140;
  const count = tips.length * perTip;
  const card = new THREE.PlaneGeometry(0.72, 0.72);
  const leafMat = new THREE.MeshStandardMaterial({
    map: getSprayTexture(),
    alphaTest: 0.45,
    alphaToCoverage: true, // anti-aliased leaf edges with MSAA
    side: THREE.DoubleSide,
    roughness: 0.62,
  });
  windMaterial(leafMat, u, true);
  const leaves = new THREE.InstancedMesh(card, leafMat, count);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  const bent = new Float32Array(count * 3);
  const ao = new Float32Array(count);
  const wind = new Float32Array(count * 3);
  const tile = new Float32Array(count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const d = new THREE.Vector3();
  const out = new THREE.Vector3();
  let k = 0;
  let maxR = 0;
  tips.forEach((tp) => (maxR = Math.max(maxR, tp.p.distanceTo(crown) + tp.size)));
  tips.forEach((tp) => {
    for (let i = 0; i < perTip; i++) {
      d.set(r() * 2 - 1, r() * 1.6 - 0.6, r() * 2 - 1).normalize();
      const rad = tp.size * (0.35 + 0.65 * Math.sqrt(r()));
      dummy.position.copy(tp.p).addScaledVector(d, rad);
      out.copy(dummy.position).sub(crown).normalize();
      dummy.lookAt(dummy.position.clone().add(out.clone().lerp(d, 0.5)));
      dummy.rotateZ(r() * Math.PI * 2);
      dummy.rotateX((r() - 0.5) * 0.9);
      dummy.scale.setScalar(0.75 + r() * 0.55);
      dummy.updateMatrix();
      leaves.setMatrixAt(k, dummy.matrix);
      bent.set([out.x, out.y * 0.8 + 0.2, out.z], k * 3);
      // occlusion: deeper inside the crown and on its underside
      const depth = dummy.position.distanceTo(crown) / maxR;
      const under = THREE.MathUtils.clamp((dummy.position.y - crown.y) / maxR + 0.6, 0, 1);
      ao[k] = THREE.MathUtils.clamp(0.25 + 0.75 * Math.pow(depth, 1.3) * (0.55 + 0.45 * under), 0.25, 1);
      wind.set([THREE.MathUtils.clamp(0.55 + depth * 0.45, 0, 1), tp.phase + r() * 0.8, 3], k * 3);
      tile[k] = r() < 0.5 ? 0 : 1;
      color.setHSL(0.23 + r() * 0.06, 0.45 + r() * 0.2, 0.19 + r() * 0.12);
      leaves.setColorAt(k, color);
      k++;
    }
  });
  card.setAttribute('aBent', new THREE.InstancedBufferAttribute(bent, 3));
  card.setAttribute('aAO', new THREE.InstancedBufferAttribute(ao, 1));
  card.setAttribute('aWind', new THREE.InstancedBufferAttribute(wind, 3));
  card.setAttribute('aTile', new THREE.InstancedBufferAttribute(tile, 1));
  group.add(leaves);

  // --- shrubs at the base ------------------------------------------------------------------------
  const shrubSpots: [number, number, number][] = [[1.7, 0.8, 0.7], [-1.5, 1.1, 0.6], [0.4, 1.9, 0.65], [2.4, -0.6, 0.5], [-1.0, -1.5, 0.55]];
  const perShrub = 150;
  const sCount = shrubSpots.length * perShrub;
  const sCard = new THREE.PlaneGeometry(0.42, 0.42);
  const shrubs = new THREE.InstancedMesh(sCard, leafMat, sCount);
  shrubs.castShadow = true;
  const sBent = new Float32Array(sCount * 3);
  const sAO = new Float32Array(sCount);
  const sWind = new Float32Array(sCount * 3);
  const sTile = new Float32Array(sCount);
  let j = 0;
  shrubSpots.forEach(([x, z, rr]) => {
    const c = new THREE.Vector3(x, rr * 0.45, z);
    const ph = r() * 6.28;
    for (let i = 0; i < perShrub; i++) {
      d.set(r() * 2 - 1, r() * 1.3 - 0.2, r() * 2 - 1).normalize();
      dummy.position.copy(c).addScaledVector(d, rr * (0.4 + 0.6 * Math.sqrt(r())));
      dummy.position.y = Math.max(0.12, dummy.position.y);
      dummy.lookAt(dummy.position.clone().add(d));
      dummy.rotateZ(r() * Math.PI * 2);
      dummy.scale.setScalar(0.7 + r() * 0.5);
      dummy.updateMatrix();
      shrubs.setMatrixAt(j, dummy.matrix);
      sBent.set([d.x, d.y * 0.8 + 0.2, d.z], j * 3);
      sAO[j] = THREE.MathUtils.clamp(0.35 + 0.65 * (dummy.position.y / (rr * 1.1)), 0.3, 1);
      sWind.set([0.15, ph + r(), 3], j * 3);
      sTile[j] = r() < 0.5 ? 0 : 1;
      color.setHSL(0.24 + r() * 0.05, 0.42 + r() * 0.16, 0.19 + r() * 0.1);
      shrubs.setColorAt(j, color);
      j++;
    }
  });
  sCard.setAttribute('aBent', new THREE.InstancedBufferAttribute(sBent, 3));
  sCard.setAttribute('aAO', new THREE.InstancedBufferAttribute(sAO, 1));
  sCard.setAttribute('aWind', new THREE.InstancedBufferAttribute(sWind, 3));
  sCard.setAttribute('aTile', new THREE.InstancedBufferAttribute(sTile, 1));
  group.add(shrubs);

  group.position.copy(position);
  group.scale.setScalar(scale);
  group.rotation.y = r() * Math.PI * 2;
  return group;
}

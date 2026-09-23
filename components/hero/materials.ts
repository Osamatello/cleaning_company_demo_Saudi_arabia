import * as THREE from 'three';
import { HOUSE_SCALE, ROAD_CENTER_MODEL, ROAD_PROFILE, ROAD_SCALE, STREET_WIDTH, roadPointModel, roadRadiiAt } from './heroConfig';
import {
  CLEAN_HOUSE_DOOR,
  CLEAN_HOUSE_GLASS,
  DIRTY_HOUSE_DOOR,
  DIRTY_HOUSE_GLASS,
  VAN_GLASS,
  VAN_WHEELS,
  type Rect,
} from './assetMaps';
import { type GroundUniforms, injectGroundShading } from './groundShading';

// The Meshy draft GLBs ship with no materials, textures, UVs or vertex colours — just geometry.
// Everything below is physically based shading derived from object-space position/normal and the
// measured regions in assetMaps.ts: per-material albedo, roughness and relief (bump), glass with
// real reflections and a parallax room interior, grounding occlusion, and weathering.

export type SharedUniforms = {
  uDissolve: { value: number }; // 0 = dirty house, 1 = clean house
  uWetIn: { value: number }; // 0 → 1: the washing water flows down over the house
  uWetOut: { value: number }; // 0 → 1: it drains off and the house dries, top down
  uTime: { value: number }; // seconds, for the running water
  uFoam: { value: number }; // 0 → 1: cleaning foam spreads over the house until fully coated
  uFoamOut: { value: number }; // 0 → 1: the foam slides down and off
};

// Value noise from a small tiling 3D texture: one hardware-filtered fetch instead of eight hashes
// (identical character to the arithmetic version, a fraction of the cost on every surface).
let noiseTexture: THREE.Data3DTexture | null = null;
function getNoiseTexture() {
  if (noiseTexture) return noiseTexture;
  const N = 64;
  const data = new Uint8Array(N * N * N);
  let seed = 1234567;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = seed >>> 24;
  }
  const t = new THREE.Data3DTexture(data, N, N, N);
  t.format = THREE.RedFormat;
  t.type = THREE.UnsignedByteType;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping;
  t.unpackAlignment = 1;
  t.needsUpdate = true;
  noiseTexture = t;
  return t;
}

// ---------------------------------------------------------------------------------------------
// GLSL helpers

const NOISE_GLSL = /* glsl */ `
  float h_hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  uniform highp sampler3D uNoiseTex;
  float h_noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return texture(uNoiseTex, (i + f + 0.5) / 64.0).r;
  }
  float h_fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * h_noise(p); p *= 2.03; a *= 0.5; } return v; }
  float h_fbm2(vec3 p) { return h_noise(p) * 0.667 + h_noise(p * 2.03) * 0.333; }
  // cellular noise: distance to the nearest / second-nearest feature point
  vec2 h_worley(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); float d1 = 8.0, d2 = 8.0;
    for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
      vec3 g = vec3(float(x), float(y), float(z));
      vec3 o = vec3(h_hash(i + g), h_hash(i + g + 19.1), h_hash(i + g + 47.3));
      vec3 r = g + o - f; float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
    return vec2(sqrt(d1), sqrt(d2));
  }
`;

// Bump mapping from a procedural height (world units) via screen-space derivatives.
const FOAM_GLSL = /* glsl */ `
  // Cleaning-foam coverage at world point w: soft masses grow from the roof and upper walls and
  // merge into one thick coat, then the coat slides down and off. Shared by the vertex (volume)
  // and fragment (look) stages so they always agree. Returns (coverage, lumpiness).
  vec2 foamAt(vec3 w) {
    float yN = w.y / 8.0;
    vec3 fp = w + vec3(0.0, uFoamOut * 3.5 + uTime * 0.02, 0.0);
    float n1 = h_noise(fp * 0.5);
    float n2 = h_noise(fp * 1.6);
    float mass = n1 * 0.6 + n2 * 0.4;
    float cover = smoothstep(-0.05, 0.05, uFoam * 1.7 - 0.35 + 0.35 * yN - mass);
    float top = 1.12 - uFoamOut * 1.45 + (mass - 0.5) * 0.18;
    float keep = smoothstep(-0.03, 0.03, top - yN) * (1.0 - smoothstep(0.75, 1.0, uFoamOut));
    return vec2(cover * keep, n2 * 0.75 + n1 * 0.25); // coverage, lumpiness (two lookups in all)
  }
`;

const BUMP_GLSL = /* glsl */ `
  vec3 h_bump(vec3 surfPos, vec3 surfNorm, float h) {
    vec3 sx = dFdx(surfPos), sy = dFdy(surfPos);
    vec3 r1 = cross(sy, surfNorm), r2 = cross(surfNorm, sx);
    float det = dot(sx, r1);
    vec2 dh = vec2(dFdx(h), dFdy(h));
    vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2);
    return normalize(abs(det) * surfNorm - grad);
  }
`;

function injectObjectSpaceVaryings(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.uniforms.uNoiseTex = { value: getNoiseTexture() };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;\nvarying vec3 vWPos;')
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvObjPos = position;\nvObjNormal = normal;\nvWPos = (modelMatrix * vec4(position, 1.0)).xyz;'
    );
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    '#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;\nvarying vec3 vWPos;\n' + NOISE_GLSL + BUMP_GLSL
  );
}

/** Dissolve: world-space noise threshold. `keepAbove` = dirty side (disappears as uDissolve → 1). */
function injectDissolve(shader: THREE.WebGLProgramParametersWithUniforms, shared: SharedUniforms, keepAbove: boolean) {
  shader.uniforms.uDissolve = shared.uDissolve;
  shader.uniforms.uWetIn = shared.uWetIn;
  shader.uniforms.uWetOut = shared.uWetOut;
  shader.uniforms.uTime = shared.uTime;
  shader.uniforms.uFoam = shared.uFoam;
  shader.uniforms.uFoamOut = shared.uFoamOut;
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nuniform float uDissolve;\nuniform float uWetIn;\nuniform float uWetOut;\nuniform float uTime;\nuniform float uFoam;\nuniform float uFoamOut;'
    )
    .replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
      float dEdge = 0.0;
      if (uDissolve > 0.0 && uDissolve < 1.0) {
        float dN = mix(h_fbm2(vWPos * 0.55), 1.0 - clamp(vWPos.y / 8.0, 0.0, 1.0), 0.55);
        float dT = uDissolve * 1.3 - 0.15;
        ${keepAbove ? 'if (dN < dT) discard;' : 'if (dN >= dT) discard;'}
        dEdge = 1.0 - smoothstep(0.0, 0.05, abs(dN - dT));
      } else if (${keepAbove ? 'uDissolve >= 1.0' : 'uDissolve <= 0.0'}) {
        discard;
      }`
    )
    .replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.16) * dEdge * step(0.001, uDissolve) * step(uDissolve, 0.999);'
    );
}

// Rectangles measured on the models become uniform arrays. `<name>Hit` returns
// x = 1 inside a pane, y = 1 within `margin` of a pane (its frame), z = pane index,
// w = rain-streak weight on the wall just below a pane's sill.
function rectUniforms(rects: Rect[]) {
  return {
    a: rects.map((r) => new THREE.Vector4(r[1], r[2], r[3], r[4])),
    b: rects.map((r) => {
      const t = (r[0] * Math.PI) / 180;
      return new THREE.Vector4(Math.cos(t), Math.sin(t), r[5], r[6]);
    }),
  };
}
const rectGLSL = (name: string, count: number) => /* glsl */ `
  uniform vec4 ${name}A[${count}];
  uniform vec4 ${name}B[${count}];
  vec4 ${name}Hit(vec3 p, vec3 n, float margin) {
    vec4 hit = vec4(0.0);
    for (int i = 0; i < ${count}; i++) {
      vec4 a = ${name}A[i]; vec4 b = ${name}B[i];
      float u = p.x * b.x - p.z * b.y;
      float d = p.x * b.y + p.z * b.x;
      float facing = dot(n, vec3(b.y, 0.0, b.x));
      if (u > a.x - margin && u < a.y + margin && p.y > a.z - margin && p.y < a.w + margin && abs(d - b.z) < b.w + 0.025) {
        hit.y = 1.0;
        if (facing > 0.8 && u > a.x && u < a.y && p.y > a.z && p.y < a.w && abs(d - b.z) < b.w) { hit.x = 1.0; hit.z = float(i); }
      }
      if (facing > 0.6 && u > a.x && u < a.y && p.y < a.z - margin && p.y > a.z - 0.2 && abs(d - b.z) < b.w + 0.08) {
        hit.w = max(hit.w, 1.0 - (a.z - p.y) / 0.2);
      }
    }
    return hit;
  }`;

// Object-space lookup grid: each cell lists (up to 8) panes whose frame or sill region reaches
// into it, so a pixel tests only those panes instead of every pane on the house.
type PaneGrid = { texture: THREE.Data3DTexture; min: THREE.Vector3; inv: number; dim: THREE.Vector3 };

function buildPaneGrid(rects: Rect[], margin: number): PaneGrid {
  const cell = 0.025; // model units (~11 cm on the placed house)
  const regions = rects.map((r) => {
    const t = (r[0] * Math.PI) / 180;
    return {
      c: Math.cos(t),
      s: Math.sin(t),
      u0: r[1] - margin,
      u1: r[2] + margin,
      y0: r[3] - 0.2,
      y1: r[4] + margin,
      d0: r[5] - r[6] - 0.08,
      d1: r[5] + r[6] + 0.08,
    };
  });
  // bounds: union of every region's axis-aligned box (x = u·c + d·s, z = −u·s + d·c)
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const g of regions) {
    for (const u of [g.u0, g.u1])
      for (const d of [g.d0, g.d1]) {
        min.min(new THREE.Vector3(u * g.c + d * g.s, g.y0, -u * g.s + d * g.c));
        max.max(new THREE.Vector3(u * g.c + d * g.s, g.y1, -u * g.s + d * g.c));
      }
  }
  min.subScalar(cell);
  max.addScalar(cell);
  const nx = Math.ceil((max.x - min.x) / cell);
  const ny = Math.ceil((max.y - min.y) / cell);
  const nz = Math.ceil((max.z - min.z) / cell);
  const data = new Uint8Array(nx * 2 * ny * nz * 4).fill(255); // two RGBA texels (8 slots) per cell
  const used = new Uint8Array(nx * ny * nz);
  const reach = cell * 0.75; // half the cell's diagonal in plan, so any pixel in the cell is covered
  regions.forEach((g, i) => {
    for (let iz = 0; iz < nz; iz++)
      for (let ix = 0; ix < nx; ix++) {
        const x = min.x + (ix + 0.5) * cell;
        const z = min.z + (iz + 0.5) * cell;
        const u = x * g.c - z * g.s;
        const d = x * g.s + z * g.c;
        if (u < g.u0 - reach || u > g.u1 + reach || d < g.d0 - reach || d > g.d1 + reach) continue;
        for (let iy = 0; iy < ny; iy++) {
          const y = min.y + iy * cell;
          if (y + cell < g.y0 || y > g.y1) continue;
          const c = (iz * ny + iy) * nx + ix;
          const k = used[c];
          if (k >= 8) continue;
          used[c] = k + 1;
          data[((iz * ny + iy) * nx * 2 + ix * 2 + (k >> 2)) * 4 + (k & 3)] = i;
        }
      }
  });
  const texture = new THREE.Data3DTexture(data, nx * 2, ny, nz);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return { texture, min, inv: 1 / cell, dim: new THREE.Vector3(nx, ny, nz) };
}

const paneGridGLSL = (name: string) => /* glsl */ `
  uniform highp sampler3D ${name}Grid;
  uniform vec3 ${name}GridMin;
  uniform float ${name}GridInv;
  uniform vec3 ${name}GridDim;
  void ${name}TestList(vec3 p, vec3 n, float margin, vec4 list, inout vec4 hit) {
    for (int k = 0; k < 4; k++) {
      if (list[k] > 254.5) break;
      int i = int(list[k] + 0.5);
      vec4 a = ${name}A[i]; vec4 b = ${name}B[i];
      float u = p.x * b.x - p.z * b.y;
      float d = p.x * b.y + p.z * b.x;
      float facing = dot(n, vec3(b.y, 0.0, b.x));
      if (u > a.x - margin && u < a.y + margin && p.y > a.z - margin && p.y < a.w + margin && abs(d - b.z) < b.w + 0.025) {
        hit.y = 1.0;
        if (facing > 0.8 && u > a.x && u < a.y && p.y > a.z && p.y < a.w && abs(d - b.z) < b.w) { hit.x = 1.0; hit.z = float(i); }
      }
      if (facing > 0.6 && u > a.x && u < a.y && p.y < a.z - margin && p.y > a.z - 0.2 && abs(d - b.z) < b.w + 0.08) {
        hit.w = max(hit.w, 1.0 - (a.z - p.y) / 0.2);
      }
    }
  }
  vec4 ${name}HitGrid(vec3 p, vec3 n, float margin) {
    vec4 hit = vec4(0.0);
    vec3 g = floor((p - ${name}GridMin) * ${name}GridInv);
    if (any(lessThan(g, vec3(0.0))) || any(greaterThanEqual(g, ${name}GridDim))) return hit;
    ivec3 c = ivec3(g);
    vec4 l0 = floor(texelFetch(${name}Grid, ivec3(c.x * 2, c.y, c.z), 0) * 255.0 + 0.5);
    if (l0.x > 254.5) return hit;
    ${name}TestList(p, n, margin, l0, hit);
    if (l0.w < 254.5) {
      vec4 l1 = floor(texelFetch(${name}Grid, ivec3(c.x * 2 + 1, c.y, c.z), 0) * 255.0 + 0.5);
      ${name}TestList(p, n, margin, l1, hit);
    }
    return hit;
  }`;

// Parallax "interior mapping": a room behind each pane (back wall, side walls, floor, ceiling,
// optional curtains), traced per pixel so it shifts with the viewpoint like a real interior.
const INTERIOR_GLSL = /* glsl */ `
  vec3 roomBehind(vec3 p, vec3 V, vec4 a, vec4 b, float seed) {
    vec3 N = vec3(b.y, 0.0, b.x);
    vec3 T = vec3(b.x, 0.0, -b.y);
    float u = dot(p, T);
    float W = a.y - a.x;
    vec3 ro = vec3(u - 0.5 * (a.x + a.y), p.y - 0.5 * (a.z + a.w), 0.0);
    vec3 rd = vec3(dot(V, T), V.y, -dot(V, N));
    rd.z = max(rd.z, 0.03);
    float rw = max(W * 0.5 + 0.07, 0.14);
    vec3 bmin = vec3(-rw, -0.13, 0.0), bmax = vec3(rw, 0.15, 0.55);
    vec3 tA = (bmin - ro) / rd, tB = (bmax - ro) / rd;
    vec3 tf = max(tA, tB);
    float t = min(min(tf.x, tf.y), tf.z);
    vec3 h = ro + rd * t;
    vec3 wallC = mix(vec3(0.8, 0.74, 0.64), vec3(0.66, 0.7, 0.74), h_hash(vec3(seed, 4.0, 1.0)));
    vec3 col;
    if (t == tf.z) {
      col = wallC;
      // a picture or shelf on the back wall of some rooms
      vec2 q = abs(h.xy - vec2(0.02, 0.03));
      col = mix(col, mix(vec3(0.3, 0.25, 0.2), vec3(0.45, 0.5, 0.55), h_hash(vec3(seed, 3.0, 3.0))), step(q.x, 0.05) * step(q.y, 0.035) * step(0.5, h_hash(vec3(seed, 8.0, 8.0))));
    } else if (t == tf.y) {
      col = rd.y > 0.0 ? vec3(0.92) : mix(vec3(0.45, 0.32, 0.21), vec3(0.62, 0.55, 0.46), h_hash(vec3(seed, 2.0, 6.0)));
    } else {
      col = wallC * 0.8;
    }
    col *= mix(0.6, 0.14, clamp(h.z / 0.55, 0.0, 1.0)); // daylight falls off away from the window
    float cu = abs(ro.x) / max(W * 0.5, 0.001);
    float curtain = step(0.45, h_hash(vec3(seed, 7.0, 2.0))) * smoothstep(0.66, 0.78, cu);
    vec3 curtainC = mix(vec3(0.86, 0.83, 0.77), vec3(0.5, 0.56, 0.62), h_hash(vec3(seed, 9.0, 5.0)));
    col = mix(col, curtainC * (0.42 + 0.08 * sin(ro.x * 700.0)), curtain);
    return col;
  }`;

// Running-bond brickwork in object space; returns colour, writes relief into `relief`.
const BRICK_GLSL = /* glsl */ `
  vec3 brickwork(vec3 p, vec3 n, vec3 base, vec3 mortarC, out float relief) {
    float bh = 0.0135, bw = 0.045;
    float row = floor(p.y / bh);
    float u = (abs(n.x) > abs(n.z) ? p.z : p.x) / bw + mod(row, 2.0) * 0.5;
    float fu = fract(u), fv = fract(p.y / bh);
    float edge = min(min(fu, 1.0 - fu) * bw, min(fv, 1.0 - fv) * bh);
    float brick = smoothstep(0.0012, 0.0024, edge);
    relief = brick;
    float v = h_hash(vec3(floor(u), row, 3.0));
    vec3 c = base * mix(0.8, 1.14, v) * mix(vec3(1.0), vec3(1.05, 0.95, 0.9), step(0.8, v));
    c *= 0.92 + 0.08 * h_noise(p * 400.0);
    return mix(mortarC, c, brick);
  }`;

// ---------------------------------------------------------------------------------------------
// House

export function createHouseMaterial(shared: SharedUniforms, dirty: boolean, baseY: number) {
  const glass = rectUniforms(dirty ? DIRTY_HOUSE_GLASS : CLEAN_HOUSE_GLASS);
  const door = rectUniforms([dirty ? DIRTY_HOUSE_DOOR : CLEAN_HOUSE_DOOR]);
  const grid = buildPaneGrid(dirty ? DIRTY_HOUSE_GLASS : CLEAN_HOUSE_GLASS, 0.02);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0 });
  mat.customProgramCacheKey = () => (dirty ? 'house-dirty-v4' : 'house-clean-v4');
  mat.addEventListener('dispose', () => grid.texture.dispose());
  mat.onBeforeCompile = (shader) => {
    injectObjectSpaceVaryings(shader);
    injectDissolve(shader, shared, dirty);
    shader.uniforms.uGlassA = { value: glass.a };
    shader.uniforms.uGlassB = { value: glass.b };
    shader.uniforms.uDoorA = { value: door.a };
    shader.uniforms.uDoorB = { value: door.b };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uFoam;\nuniform float uFoamOut;\nuniform float uTime;\n' + NOISE_GLSL + FOAM_GLSL
      )
      .replace(
        '#include <project_vertex>',
        `if (uFoam > 0.0 && uFoamOut < 1.0) {
          vec2 fm = foamAt((modelMatrix * vec4(transformed, 1.0)).xyz);
          transformed += normalize(objectNormal) * fm.x * (0.1 + 0.32 * fm.y) / ${HOUSE_SCALE.toFixed(2)};
        }
        #include <project_vertex>`
      );
    shader.uniforms.uGlassGrid = { value: grid.texture };
    shader.uniforms.uGlassGridMin = { value: grid.min };
    shader.uniforms.uGlassGridInv = { value: grid.inv };
    shader.uniforms.uGlassGridDim = { value: grid.dim };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        FOAM_GLSL +
          rectGLSL('uGlass', glass.a.length) +
          paneGridGLSL('uGlass') +
          rectGLSL('uDoor', 1) +
          INTERIOR_GLSL +
          BRICK_GLSL +
          '\nvoid main() {'
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
      vec3 n = normalize(vObjNormal);
      vec3 p = vObjPos;
      float y = p.y;
      // under a full coat of foam nothing of the facade shows: skip windows, bricks and weathering
      vec2 fmTop = (uFoam > 0.0 && uFoamOut < 1.0) ? foamAt(vWPos) : vec2(0.0);
      bool coated = fmTop.x > 0.995;
      bool paneBand = !coated && n.y < 0.42 && y > -0.87 && y < 0.2;
      vec4 gHit = paneBand ? uGlassHitGrid(p, n, 0.02) : vec4(0.0);
      vec4 dHit = paneBand ? uDoorHit(p, n, 0.0) : vec4(0.0);
      float isDoor = dHit.y * step(0.5, n.z);
      float isGlass = gHit.x * (1.0 - isDoor);
      float isFrame = gHit.y * (1.0 - gHit.x) * (1.0 - isDoor);
      float paneSeed = gHit.z + ${dirty ? '31.0' : '0.0'};
      bool roof = n.y > 0.42 && y > 0.12;
      bool chimney = y > 0.44 && n.y < 0.42;
      bool plinth = y < -0.6;
      // relief (world metres) for bump mapping, faded out where it would alias
      float relief = 0.0;
      float reliefScale = 0.0;
      float px = length(fwidth(p));
      float stucco = h_fbm2(p * 45.0);
      float tile = fract(p.y * 90.0);
      float brickRelief = 0.0;
      ${
        dirty
          ? /* glsl */ `
      vec3 wall = vec3(0.38, 0.3, 0.19) * mix(0.88, 1.08, stucco);
      vec3 roofC = vec3(0.11, 0.1, 0.085) * mix(0.78, 1.15, h_hash(vec3(floor(p.y * 90.0), floor((p.x + p.z) * 30.0), 5.0)));
      vec3 frameC = vec3(0.5, 0.42, 0.28);
      vec3 doorC = vec3(0.1, 0.19, 0.12);
      vec3 masonry = coated ? vec3(0.4) : brickwork(p, n, vec3(0.42, 0.22, 0.15), vec3(0.42, 0.4, 0.36), brickRelief);`
          : /* glsl */ `
      vec3 wall = vec3(0.64, 0.43, 0.24) * mix(0.95, 1.04, stucco);
      vec3 roofC = mix(vec3(0.035, 0.045, 0.07), vec3(0.07, 0.085, 0.12), h_hash(vec3(floor(p.y * 90.0), floor((p.x + p.z) * 30.0), 5.0)));
      vec3 frameC = vec3(0.985, 0.985, 0.975);
      vec3 doorC = vec3(0.02, 0.08, 0.26);
      vec3 masonry = coated ? vec3(0.4) : brickwork(p, n, vec3(0.52, 0.2, 0.11), vec3(0.78, 0.74, 0.66), brickRelief);`
      }
      vec3 c = roof ? roofC : ((chimney || plinth) ? masonry : wall);
      // heights in model units (× house scale → metres): tile steps ~2 cm, mortar ~1 cm, render ~5 mm
      relief = roof ? (tile * tile) * 0.0045 + h_noise(p * 300.0) * 0.0006
                    : ((chimney || plinth) ? brickRelief * 0.0022 : stucco * 0.0011);
      reliefScale = 1.0 - smoothstep(0.004, 0.012, px);
      c = mix(c, frameC, isFrame);
      c = mix(c, doorC, isDoor);
      relief *= (1.0 - isFrame) * (1.0 - isDoor) * (1.0 - isGlass);
      ${
        dirty
          ? /* glsl */ `
      // weathering in colour, not just darkness: rain runs under every sill, sooty streaks from the
      // eaves, green algae low down, rust stains, moss on the roof, filthy glass
      float streak = 0.0;
      if (!coated) {
      streak = 1.0 - smoothstep(0.3, 0.7, h_noise(vec3(p.x * 22.0, p.y * 2.5, p.z * 22.0)));
      float grime = smoothstep(0.45, 0.75, h_fbm2(p * 6.0));
      float blot = smoothstep(0.42, 0.7, h_fbm2(p * 2.5 + 3.0));
      float low = 1.0 - smoothstep(-0.75, -0.2, y);
      float eaveRun = smoothstep(-0.1, 0.12, y) * smoothstep(0.55, 0.85, h_noise(vec3(p.x * 55.0, p.y * 3.0, p.z * 55.0)));
      float sill = gHit.w * smoothstep(0.35, 0.75, h_noise(vec3(p.x * 80.0, p.y * 4.0, p.z * 80.0)));
      float rust = smoothstep(0.72, 0.85, h_fbm2(p * 11.0 + 9.0));
      float onWall = roof ? 0.0 : 1.0;
      c = mix(c, vec3(0.34, 0.28, 0.2), (0.4 * streak + 0.55 * eaveRun + 0.75 * sill) * onWall * (1.0 - isGlass));
      c = mix(c, vec3(0.2, 0.18, 0.15), 0.5 * grime * (1.0 - isGlass));
      c = mix(c, vec3(0.3, 0.26, 0.2), 0.3 * blot);
      c = mix(c, vec3(0.28, 0.36, 0.19), 0.6 * low * smoothstep(0.35, 0.65, h_fbm2(p * 8.0)) * onWall);
      c = mix(c, vec3(0.5, 0.3, 0.14), 0.5 * rust * onWall * (1.0 - isGlass));
      float moss = roof ? smoothstep(0.5, 0.75, h_fbm2(p * 14.0)) : 0.0;
      c = mix(c, vec3(0.26, 0.32, 0.15), moss * 0.75);
      relief += moss * 0.002 * h_noise(p * 500.0) + grime * 0.0006;
      if (chimney) c = mix(c, vec3(0.08, 0.07, 0.06), smoothstep(0.55, 0.75, y) * 0.8);
      }
      `
          : ''
      }
      // ambient occlusion: creases, the foot of the walls (ground contact) and under the eaves
      float cav = clamp(length(fwidth(n)) * 2.4, 0.0, 1.0);
      float footAO = mix(0.55, 1.0, smoothstep(0.0, 0.09, y - (${baseY.toFixed(3)})));
      float eaveAO = roof ? 1.0 : mix(1.0, 0.72, smoothstep(0.04, 0.15, y) * (1.0 - smoothstep(0.15, 0.2, y)));
      float houseAO = (1.0 - cav * 0.5) * footAO * eaveAO;
      c *= mix(1.0, 1.0 - cav * 0.35, 1.0 - isGlass);
      // glass: albedo comes from the room behind it (added as emission below) and grime on it
      ${dirty ? 'vec3 glassDirt = mix(vec3(0.3, 0.28, 0.23), vec3(0.2, 0.19, 0.16), streak);' : ''}
      c = mix(c, ${dirty ? 'glassDirt * 0.55' : 'vec3(0.0)'}, isGlass);
      // --- cleaning foam: soft masses grow from the roof and upper walls and merge into one thick,
      // creamy coat (hiding the dirty → clean change), then slide down and off in sheets
      float foam = 0.0;
      float foamH = 0.0;
      if (uFoam > 0.0 && uFoamOut < 1.0) {
        vec2 fm = fmTop;
        foam = fm.x;
        vec3 fp = vWPos + vec3(0.0, uFoamOut * 3.5 + uTime * 0.02, 0.0);
        float fpx = length(fwidth(vWPos));
        // fine bubbles only where they can resolve; the heaps themselves come from the volume
        float suds = h_noise(fp * 11.0) * 0.6 + h_noise(fp * 30.0) * 0.4 * (1.0 - smoothstep(0.01, 0.03, fpx));
        foamH = foam * ((0.1 + 0.32 * fm.y) * 0.25 + 0.02 * suds);
        float thin = 1.0 - smoothstep(0.15, 0.6, foam); // thin lather edges are grey-translucent
        vec3 foamC = vec3(0.95, 0.955, 0.96) * mix(0.8, 1.0, fm.y) * (0.9 + 0.1 * suds);
        foamC = mix(foamC, mix(c, vec3(0.8, 0.83, 0.86), 0.6), thin * 0.6);
        c = mix(c, foamC, smoothstep(0.0, 0.3, foam));
      }
      float wet = 0.0;
      float wetFlow = 0.0;
      if (uWetIn > 0.0 && uWetOut < 1.0) {
        float yN = vWPos.y / 8.0;
        float lane = h_noise(vec3(vWPos.x * 3.2, 0.0, vWPos.z * 3.2));
        float lead = lane * lane * 0.16 + h_noise(vWPos * 0.8) * 0.05; // rivulets run ahead
        float frontIn = 1.08 - uWetIn * 1.3;
        float e = yN - (frontIn - lead);
        float reached = smoothstep(-0.012, 0.012, e);
        float frontOut = 1.08 - uWetOut * 1.3;
        float dried = smoothstep(-0.02, 0.02, yN - (frontOut + lead * 0.6)); // streaks dry last
        wet = reached * (1.0 - dried);
        // running water: streaks sliding down the walls and the roof
        float run = h_noise(vec3(vWPos.x * 7.0, vWPos.y * 0.9 + uTime * 1.6, vWPos.z * 7.0));
        float fine = h_noise(vec3(vWPos.x * 22.0, vWPos.y * 2.5 + uTime * 3.1, vWPos.z * 22.0));
        wetFlow = wet * (run * 0.7 + fine * 0.3) * 0.02;
        float lather = smoothstep(-0.004, 0.004, e) * (1.0 - smoothstep(0.0, 0.035, e)) * (1.0 - dried);
        lather *= 0.55 + 0.45 * h_noise(vWPos * 9.0 + vec3(0.0, uTime * 0.8, 0.0));
        c = mix(c, c * vec3(0.55, 0.58, 0.62), wet * (1.0 - isGlass) * (0.85 + 0.15 * run));
        c = mix(c, vec3(0.88, 0.91, 0.94), lather * 0.75);
      }
      diffuseColor.rgb = c;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
      roughnessFactor = roof ? ${dirty ? '0.88' : '0.72'} : ((chimney || plinth) ? 0.88 : ${dirty ? '0.92' : '0.82'});
      roughnessFactor = mix(roughnessFactor, ${dirty ? '0.5' : '0.28'}, isFrame);
      roughnessFactor = mix(roughnessFactor, ${dirty ? '0.6' : '0.22'}, isDoor);
      roughnessFactor = mix(roughnessFactor, ${dirty ? '0.38' : '0.025'}, isGlass);
      roughnessFactor = mix(roughnessFactor, 0.05 + wetFlow * 4.0, wet);
      roughnessFactor = mix(roughnessFactor, 0.42, smoothstep(0.0, 0.3, foam));`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
      normal = h_bump(-vViewPosition, normal, relief * reliefScale * ${(4.6).toFixed(1)} * (1.0 - smoothstep(0.0, 0.3, foam)) + wetFlow + foamH);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
      if (isGlass > 0.5) {
        int gi = int(gHit.z + 0.5);
        vec3 Vd = normalize(vWPos - cameraPosition);
        vec3 room = roomBehind(p, Vd, uGlassA[gi], uGlassB[gi], paneSeed);
        float cosT = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        float F = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);
        totalEmissiveRadiance += room * (1.0 - F) * ${dirty ? '0.35' : '0.9'} * (1.0 - smoothstep(0.0, 0.3, foam));
      }
      if (foam > 0.0) totalEmissiveRadiance += vec3(pow(h_noise(vWPos * 70.0), 12.0) * 0.9 * foam);`
      )
      .replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
      reflectedLight.indirectDiffuse *= mix(houseAO, 1.0, foam);
      reflectedLight.indirectDiffuse += vec3(0.1, 0.105, 0.11) * smoothstep(0.0, 0.4, foam);
      reflectedLight.indirectSpecular *= mix(1.0, houseAO, 0.7);
      reflectedLight.directDiffuse *= mix(1.0, footAO, 0.5);`
      );
  };
  return mat;
}

/** Plain coloured material that dissolves away together with the dirty house (used for litter). */
export function createLitterMaterial(shared: SharedUniforms, color: THREE.ColorRepresentation, roughness = 0.6) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  mat.customProgramCacheKey = () => 'litter';
  mat.onBeforeCompile = (shader) => {
    injectObjectSpaceVaryings(shader);
    injectDissolve(shader, shared, true);
  };
  return mat;
}

// ---------------------------------------------------------------------------------------------
// Van

// Sky gradient with a crisp horizon, mirrored in glass (view space), strongest at grazing angles.
const GLASS_SKY_GLSL = /* glsl */ `
  vec3 glassSky(vec3 nView, vec3 toCam) {
    vec3 r = reflect(-toCam, nView);
    vec3 up = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    float k = dot(r, up);
    vec3 sky = mix(vec3(0.82, 0.86, 0.9), vec3(0.38, 0.56, 0.82), smoothstep(0.02, 0.6, k));
    vec3 ground = mix(vec3(0.22, 0.26, 0.2), vec3(0.1, 0.11, 0.1), smoothstep(-0.05, -0.5, k));
    vec3 c = mix(ground, sky, smoothstep(-0.02, 0.02, k));
    return c * (0.25 + 0.75 * pow(1.0 - max(dot(nView, toCam), 0.0), 3.0));
  }`;

/**
 * Van body: white solid paint under clearcoat, tinted glass, rubber, textured black trim, chrome
 * headlamp reflectors with a daytime-running-light strip, glossy red tail lenses and a vinyl livery.
 * The model's nose points to −X and it is mirror-symmetric in Z, so flank lookups use |z|.
 * `lights.value`: x = headlights (0–1), y = brake lights (0–1).
 */
export function createVanMaterial(lights: { value: THREE.Vector2 }) {
  const livery = createLiveryTexture();
  const glass = rectUniforms(VAN_GLASS);
  const [w0, w1] = VAN_WHEELS.centers;
  const f = (v: number) => v.toFixed(4);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.0,
  });
  mat.onBeforeCompile = (shader) => {
    injectObjectSpaceVaryings(shader);
    shader.uniforms.uLivery = { value: livery };
    shader.uniforms.uVGlassA = { value: glass.a };
    shader.uniforms.uVGlassB = { value: glass.b };
    shader.uniforms.uLights = lights;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform sampler2D uLivery;\nuniform vec2 uLights;\n' + rectGLSL('uVGlass', glass.a.length) + GLASS_SKY_GLSL + '\nvoid main() {')
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        vec3 n = normalize(vObjNormal);
        vec3 p = vObjPos;
        vec3 ps = vec3(p.x, p.y, abs(p.z));
        vec3 ns = vec3(n.x, n.y, abs(n.z));
        vec3 c = vec3(0.84, 0.85, 0.86);
        vec2 wc = p.x < 0.0 ? vec2(${f(w0[0])}, ${f(w0[1])}) : vec2(${f(w1[0])}, ${f(w1[1])});
        float wr = length(p.xy - wc);
        float isTyre = step(wr, ${f(VAN_WHEELS.tyre)}) * step(0.2, ps.z);
        float wheelWell = step(wr, 0.092) * step(0.3, ps.z) * step(0.5, ns.z); // dark recess behind the alloy
        float arch = step(wr, ${f(VAN_WHEELS.tyre + 0.03)}) * step(0.18, ps.z) * (1.0 - isTyre) * step(ns.z, 0.6);
        float isGlass = uVGlassHit(ps, ns, 0.0).x;
        if (n.x < -0.2 && n.y > 0.12 && p.y > 0.06 && p.x > -0.68) isGlass = 1.0;
        bool front = n.x < -0.4;
        float grille = (front && ps.z < 0.17 && p.y > -0.19 && p.y < -0.03) ? 1.0 : 0.0;
        float head = (front && ps.z > 0.17 && ps.z < 0.29 && p.y > -0.12 && p.y < -0.02) ? 1.0 : 0.0;
        float drl = head * smoothstep(-0.048, -0.042, p.y) * (1.0 - smoothstep(-0.03, -0.024, p.y));
        float tail = (p.x > 0.86 && n.x > 0.3 && p.y > -0.08 && p.y < 0.14 && ps.z > 0.27) ? 1.0 : 0.0;
        float trim = (p.y < -0.2 && (p.x < -0.8 || p.x > 0.86)) ? 1.0 : 0.0;
        trim = max(trim, (p.y < -0.3) ? 1.0 : 0.0);
        trim = max(trim, (ps.z > 0.37 && p.x < -0.25 && p.y > -0.08) ? 1.0 : 0.0);
        trim = max(trim, arch);
        float trimTex = 0.85 + 0.15 * h_noise(p * 900.0); // grained plastic
        c = mix(c, vec3(0.055, 0.058, 0.062) * trimTex, trim);
        c = mix(c, vec3(0.018) * (0.7 + 0.3 * step(0.5, fract(p.y * 90.0))), grille);
        c = mix(c, vec3(0.8, 0.81, 0.83), head);
        c = mix(c, vec3(0.32, 0.015, 0.015), tail);
        c = mix(c, vec3(0.025, 0.025, 0.028) * (0.9 + 0.1 * h_noise(p * 600.0)), isTyre);
        c = mix(c, vec3(0.01), wheelWell);
        c = mix(c, vec3(0.012, 0.016, 0.02), isGlass);
        float body = (1.0 - trim) * (1.0 - isTyre) * (1.0 - isGlass) * (1.0 - tail);
        // road dust and spray on the lower body and behind the wheels
        float dust = (1.0 - smoothstep(-0.3, -0.1, p.y)) * body;
        dust = max(dust, (1.0 - smoothstep(0.0, 0.1, wr - ${f(VAN_WHEELS.tyre)})) * step(0.3, ps.z) * body * 0.6);
        c = mix(c, c * vec3(0.78, 0.75, 0.7), dust * (0.45 + 0.25 * h_noise(p * 40.0)));
        // vinyl livery, sampled in uniform control flow so its mip level (sharpness) is right
        vec2 livUv = vec2((p.x + 0.2) / 1.14, (p.y + 0.3) / 0.62);
        if (n.z < 0.0) livUv.x = 1.0 - livUv.x;
        vec4 liv = texture2D(uLivery, clamp(livUv, 0.0, 1.0));
        float inLiv = step(0.0, livUv.x) * step(livUv.x, 1.0) * step(0.0, livUv.y) * step(livUv.y, 1.0);
        float livA = liv.a * inLiv * step(0.8, ns.z) * step(0.5, body);
        c = mix(c, liv.rgb, livA);
        float sideP = step(0.8, ns.z) * (1.0 - isGlass) * (1.0 - isTyre) * (1.0 - trim);
        float gw = max(fwidth(p.x) * 1.2, 0.0022);
        float hw = max(fwidth(p.y) * 1.2, 0.0022);
        float gap = (1.0 - smoothstep(0.0, gw, abs(p.x + 0.215))) * step(-0.285, p.y) * step(p.y, 0.3);
        gap = max(gap, (1.0 - smoothstep(0.0, gw, abs(p.x - 0.262))) * step(-0.285, p.y) * step(p.y, 0.3));
        gap = max(gap, (1.0 - smoothstep(0.0, gw, abs(p.x + 0.47))) * step(-0.12, p.y) * step(p.y, 0.045));
        gap = max(gap, (1.0 - smoothstep(0.0, hw, abs(p.y + 0.285))) * step(-0.47, p.x) * step(p.x, 0.262));
        gap *= sideP;
        float handle = sideP * step(abs(p.y + 0.005), 0.008) * max(step(abs(p.x + 0.29), 0.028), step(abs(p.x + 0.16), 0.028));
        c = mix(c, vec3(0.015), gap * 0.85);
        c = mix(c, vec3(0.05, 0.052, 0.056), handle);
        diffuseColor.rgb = c;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.62, trim);
        roughnessFactor = mix(roughnessFactor, 0.82, isTyre);
        roughnessFactor = mix(roughnessFactor, 0.02, isGlass);
        roughnessFactor = mix(roughnessFactor, 0.08, max(head, tail));
        roughnessFactor = mix(roughnessFactor, 0.4, livA * 0.5);
        roughnessFactor = mix(roughnessFactor, 0.85, gap);
        float geoVar = clamp(length(fwidth(normalize(vNormal))) * 1.6, 0.0, 1.0);
        roughnessFactor = max(roughnessFactor, mix(roughnessFactor, 0.7, geoVar) * (1.0 - isGlass * 0.5));`
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 1.0, head * (1.0 - drl));`
      )
      .replace(
        '#include <lights_physical_fragment>',
        `#include <lights_physical_fragment>
        // no lacquer on rubber and plastic
        material.clearcoat *= (1.0 - trim) * (1.0 - isTyre) * (1.0 - wheelWell);
        material.clearcoatRoughness = max(material.clearcoatRoughness, geoVar * 0.45);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += glassSky(normal, normalize(vViewPosition)) * isGlass * 0.75;
        totalEmissiveRadiance += vec3(1.0, 0.97, 0.92) * drl * (0.2 + 7.0 * uLights.x);
        totalEmissiveRadiance += vec3(1.0, 0.05, 0.03) * tail * (0.25 + 3.2 * uLights.y);`
      );
  };
  return mat;
}

/** Vinyl wrap: logo + tagline + phone, with navy / sky-blue sweeps along the lower flank. */
function createLiveryTexture() {
  const W = 2048;
  const H = 1114; // matches the 1.14 × 0.62 flank area so the lettering isn't stretched
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, W, H);
  const yv = (v: number) => H * (1 - v); // v = 0 at the bottom of the flank
  const NAVY = '#0a2a5e';
  const SKY = '#1e8fdc';

  g.fillStyle = NAVY;
  g.beginPath();
  g.moveTo(0, yv(0.15));
  g.bezierCurveTo(W * 0.35, yv(0.1), W * 0.62, yv(0.22), W, yv(0.55));
  g.lineTo(W, yv(0.33));
  g.bezierCurveTo(W * 0.7, yv(0.08), W * 0.4, yv(0.0), 0, yv(0.05));
  g.closePath();
  g.fill();
  g.fillStyle = SKY;
  g.beginPath();
  g.moveTo(W * 0.08, yv(0.21));
  g.bezierCurveTo(W * 0.42, yv(0.18), W * 0.66, yv(0.3), W, yv(0.64));
  g.lineTo(W, yv(0.57));
  g.bezierCurveTo(W * 0.68, yv(0.24), W * 0.42, yv(0.15), W * 0.08, yv(0.19));
  g.closePath();
  g.fill();

  const lx = W * 0.17;
  g.textBaseline = 'alphabetic';
  g.font = '800 176px Inter, Helvetica, Arial, sans-serif';
  g.fillStyle = NAVY;
  g.fillText('Fresh', lx, yv(0.44));
  const fw = g.measureText('Fresh').width;
  g.fillStyle = SKY;
  g.fillText('Spaces', lx + fw, yv(0.44));
  const logoW = fw + g.measureText('Spaces').width;
  const star = (cx: number, cy: number, r: number) => {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.3;
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  };
  star(lx + logoW + 76, yv(0.51), 52);
  star(lx + logoW + 140, yv(0.58), 25);
  g.fillStyle = '#1f2937';
  g.font = '600 64px Inter, Helvetica, Arial, sans-serif';
  g.fillText('Home & Villa Cleaning  ·  Riyadh', lx + 6, yv(0.335));
  g.fillStyle = NAVY;
  g.font = '700 70px Inter, Helvetica, Arial, sans-serif';
  g.fillText('+966 50 123 4567', lx + 6, yv(0.25));

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

// ---------------------------------------------------------------------------------------------
// Road, grass, paving

// Road paint in metres (the model's canvas maps 1.92 model units → 2048 px, 1 px ≈ 1.1 cm).
const DASH_ON = 2.9;
const DASH_OFF = 4.0;
const M_PER_PX = (1.92 * ROAD_SCALE) / 2048;

/**
 * Road: asphalt with aggregate relief, worn markings and kerb grime, grounded by contact shading.
 * Without `street` it shades the road model (markings traced along its crescent); with `street`
 * it shades a ribbon continuation (`aRib` = across 0–1, along metres, backdrop fade).
 */
export function createRoadMaterial(ground: GroundUniforms, street?: { width: number }) {
  const cv = document.createElement('canvas');
  const g = cv.getContext('2d')!;
  // `off` = metres from the street's inner edge
  let trace: (off: number, widthPx: number, style: string, dashed?: boolean) => void;
  if (!street) {
    const size = 2048;
    cv.width = cv.height = size;
    const toPx = (v: number) => ((v + 0.96) / 1.92) * size;
    trace = (off, width, style, dashed) => {
      g.strokeStyle = style;
      g.lineWidth = width;
      g.lineCap = 'butt';
      g.setLineDash(dashed ? [DASH_ON / M_PER_PX, DASH_OFF / M_PER_PX] : []);
      g.beginPath();
      const a0 = ROAD_PROFILE[0][0] + 1.5;
      const a1 = ROAD_PROFILE[ROAD_PROFILE.length - 1][0] - 1;
      for (let a = a0; a <= a1; a += 0.25) {
        const p = roadPointModel(a, 0, true);
        const t = (a * Math.PI) / 180;
        const k = off / ROAD_SCALE;
        if (a === a0) g.moveTo(toPx(p.x + Math.cos(t) * k), toPx(p.z + Math.sin(t) * k));
        else g.lineTo(toPx(p.x + Math.cos(t) * k), toPx(p.z + Math.sin(t) * k));
      }
      g.stroke();
    };
    // lay-by: the model's extra width beyond the carriageway, paved in concrete slabs behind a kerb
    const cw = STREET_WIDTH / ROAD_SCALE;
    const ring = (a: number, outer: boolean) => {
      const [ri, ro] = roadRadiiAt(a, true);
      const r = outer ? ro + 0.01 : Math.min(ri + cw, ro + 0.01);
      const t = (a * Math.PI) / 180;
      return [toPx(ROAD_CENTER_MODEL.x + Math.cos(t) * r), toPx(ROAD_CENTER_MODEL.z + Math.sin(t) * r)];
    };
    const layBy = () => {
      g.beginPath();
      const first = ROAD_PROFILE[0][0];
      const last = ROAD_PROFILE[ROAD_PROFILE.length - 1][0];
      for (let a = first; a <= last; a += 0.5) g.lineTo(...(ring(a, false) as [number, number]));
      for (let a = last; a >= first; a -= 0.5) g.lineTo(...(ring(a, true) as [number, number]));
      g.closePath();
    };
    g.save();
    g.fillStyle = '#5f6064';
    g.fillRect(0, 0, size, size);
    layBy();
    g.fillStyle = '#8e8a83';
    g.fill();
    g.clip();
    const slab = 0.45 / M_PER_PX;
    g.strokeStyle = 'rgba(58,56,52,0.55)';
    g.lineWidth = 1.6;
    g.beginPath();
    for (let x = 0; x < size; x += slab) (g.moveTo(x, 0), g.lineTo(x, size));
    for (let y = 0; y < size; y += slab) (g.moveTo(0, y), g.lineTo(size, y));
    g.stroke();
    g.restore();
  } else {
    // the width of the street × one dash period, repeated along it
    const pxPerM = 256 / street.width;
    cv.width = 256;
    cv.height = Math.round((DASH_ON + DASH_OFF) * pxPerM);
    const k = M_PER_PX * pxPerM;
    trace = (off, width, style, dashed) => {
      g.fillStyle = style;
      const w = Math.max(1, width * k);
      g.fillRect((off / street.width) * 256 - w / 2, 0, w, dashed ? DASH_ON * pxPerM : cv.height);
    };
    g.fillStyle = '#5f6064';
    g.fillRect(0, 0, cv.width, cv.height);
  }
  // grime along the kerbs and polished wheel tracks
  const W = STREET_WIDTH;
  trace(0.08, 26, 'rgba(38,36,34,0.35)');
  trace(W - 0.08, 26, 'rgba(38,36,34,0.35)');
  trace(1.3, 44, 'rgba(30,30,34,0.12)');
  trace(W - 1.3, 44, 'rgba(30,30,34,0.12)');
  if (!street) trace(W + 0.07, 14, 'rgba(182,178,170,1)'); // kerb stones along the lay-by
  // paint: alpha 1 marks it for the shader
  trace(0.3, 10, 'rgba(240,238,230,1)');
  trace(W - 0.3, 10, 'rgba(240,238,230,1)');
  trace(W / 2, 10, 'rgba(240,238,230,1)', true);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  if (street) tex.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
  mat.customProgramCacheKey = () => (street ? 'street' : 'road');
  mat.onBeforeCompile = (shader) => {
    injectObjectSpaceVaryings(shader);
    if (street) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 aRib;\nvarying vec3 vRib;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRib = aRib;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRib;');
    }
    injectGroundShading(shader, ground, street ? 'vRib.z' : '0.0');
    shader.uniforms.uRoadTex = { value: tex };
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform sampler2D uRoadTex;\nvoid main() {')
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        vec2 roadUv = ${
          street
            ? `vec2(vRib.x, vRib.y / ${(DASH_ON + DASH_OFF).toFixed(2)})`
            : 'vec2((vObjPos.x + 0.96) / 1.92, 1.0 - (vObjPos.z + 0.96) / 1.92)'
        };
        vec3 rc = texture2D(uRoadTex, roadUv).rgb;
        float paint = smoothstep(0.6, 0.75, dot(rc, vec3(0.333)));
        float wear = smoothstep(0.35, 0.6, h_fbm2(vWPos * 3.0));
        float agg = h_noise(vWPos * 55.0);
        vec3 asphalt = rc * mix(0.86, 1.1, agg) * mix(0.94, 1.04, h_fbm2(vWPos * 0.6));
        diffuseColor.rgb = mix(asphalt, rc * mix(0.82, 1.0, wear), paint * mix(0.55, 1.0, wear));
        float roadRelief = (agg * 0.004 + h_noise(vWPos * 14.0) * 0.003) * (1.0 - paint * 0.6);
        roadRelief *= 1.0 - smoothstep(0.02, 0.06, length(fwidth(vWPos)));`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.92 - 0.1 * (1.0 - agg), 0.62, paint);`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = h_bump(-vViewPosition, normal, roadRelief);`
      );
  };
  return mat;
}

let grassTexture: THREE.Texture | null = null;
function getGrassTexture() {
  if (grassTexture) return grassTexture;
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#4a7430';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 22000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const l = 18 + Math.random() * 28;
    const h = 78 + Math.random() * 26;
    g.strokeStyle = `hsl(${h}, ${34 + Math.random() * 22}%, ${l}%)`;
    g.lineWidth = 0.8 + Math.random() * 1.4;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() - 0.5) * 4, y - 3 - Math.random() * 7);
    g.stroke();
  }
  grassTexture = new THREE.CanvasTexture(cv);
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.colorSpace = THREE.SRGBColorSpace;
  grassTexture.anisotropy = 8;
  return grassTexture;
}

/**
 * Lawn: painted-grass texture with large-scale colour variation, fine relief and a soft sheen.
 * `fadeAttr`: geometry has an `aFade` attribute (0–1) for dissolving its outer edge into the backdrop.
 */
export function createGrassMaterial(ground: GroundUniforms, opts: { fadeAttr: boolean; roadEnds: boolean }) {
  const tex = getGrassTexture();
  const mat = new THREE.MeshStandardMaterial({ color: 0xe4ebdc, map: tex, bumpMap: tex, bumpScale: 2.2, roughness: 0.92 });
  mat.customProgramCacheKey = () => `grass-${opts.fadeAttr}-${opts.roadEnds}`;
  mat.onBeforeCompile = (shader) => {
    injectObjectSpaceVaryings(shader);
    const fadeExpr = [opts.fadeAttr ? 'vFade' : '0.0', opts.roadEnds ? 'gsRoadEnds(vWPos)' : '0.0'].join(', ');
    injectGroundShading(shader, ground, `max(${fadeExpr})`);
    if (opts.fadeAttr) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aFade;\nvarying float vFade;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade = aFade;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFade;');
    }
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `#include <color_fragment>
        float lush = h_fbm2(vWPos * 0.35);
        float fine = h_fbm2(vWPos * 1.7);
        diffuseColor.rgb *= mix(0.84, 1.1, fine);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.08, 1.05, 0.82), smoothstep(0.45, 0.7, lush) * 0.55);`
    );
  };
  return mat;
}

/** Concrete paving slab with grain and soft grounding. */
export function createPavingMaterial(ground: GroundUniforms) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd2cfc8, roughness: 0.92 });
  mat.onBeforeCompile = (shader) => {
    injectObjectSpaceVaryings(shader);
    injectGroundShading(shader, ground, '0.0');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float pv = h_noise(vWPos * 40.0) * 0.5 + h_fbm2(vWPos * 2.0) * 0.5;
        diffuseColor.rgb *= mix(0.9, 1.05, pv);
        // expansion joints every metre
        float joint = 1.0 - smoothstep(0.0, 0.015, abs(fract(vWPos.z) - 0.5) - 0.485);
        diffuseColor.rgb *= 1.0 - 0.25 * joint;`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = h_bump(-vViewPosition, normal, h_noise(vWPos * 40.0) * 0.002 - joint * 0.004);`
      );
  };
  return mat;
}

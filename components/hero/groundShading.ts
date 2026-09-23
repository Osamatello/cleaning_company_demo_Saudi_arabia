import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

// Grounding for everything that touches the ground (lawn, verge, road, path):
//  • contact occlusion — soft darkening under/around houses, trees and litter, baked once from
//    below into a top-down texture (like a studio "contact shadow")
//  • van contact occlusion + van sun shadow — the van's silhouette is baked once in its own frame;
//    ground shaders project it along the sun direction every frame, so the moving van casts a
//    believable soft shadow without re-rendering the multi-million-triangle shadow map
//  • edge fade — outer edges and the road's ends dissolve into the white backdrop instead of
//    ending in hard, floating edges

export type GroundUniforms = {
  uAOTex: { value: THREE.Texture | null };
  uAOMatrix: { value: THREE.Matrix4 };
  uVanTex: { value: THREE.Texture | null };
  uVanMatrix: { value: THREE.Matrix4 };
  uVanOn: { value: number };
  uSunOffset: { value: THREE.Vector2 }; // horizontal shadow offset per metre of height
  uFadeColor: { value: THREE.Color };
  uFadeArc: { value: THREE.Vector4 }; // road-end fade: centre x, z, start angle, end angle (radians)
  uWetRect: { value: THREE.Vector4 }; // house footprint: min x, min z, max x, max z
  uWetGround: { value: THREE.Vector2 }; // runoff: wetness, how far it has spread (m)
  uFoamGround: { value: THREE.Vector2 }; // foam spilling round the house: amount, how far (m)
};

export function createGroundUniforms(sunDir: THREE.Vector3, fadeColorSRGB: THREE.Color, arc: THREE.Vector4): GroundUniforms {
  return {
    uAOTex: { value: null },
    uAOMatrix: { value: new THREE.Matrix4() },
    uVanTex: { value: null },
    uVanMatrix: { value: new THREE.Matrix4() },
    uVanOn: { value: 0 },
    uSunOffset: { value: new THREE.Vector2(-sunDir.x / sunDir.y, -sunDir.z / sunDir.y) },
    uFadeColor: { value: fadeColorSRGB },
    uFadeArc: { value: arc },
    uWetRect: { value: new THREE.Vector4() },
    uWetGround: { value: new THREE.Vector2() },
    uFoamGround: { value: new THREE.Vector2() },
  };
}

/**
 * Injects grounding into a MeshStandard/Physical shader that already has `vWPos` (world position).
 * `fade`: GLSL expression (0–1) evaluated in main() for how much to dissolve into the backdrop.
 */
export function injectGroundShading(shader: THREE.WebGLProgramParametersWithUniforms, u: GroundUniforms, fade: string) {
  Object.assign(shader.uniforms, u);
  shader.fragmentShader = shader.fragmentShader
    .replace(
      'void main() {',
      /* glsl */ `
      uniform sampler2D uAOTex; uniform mat4 uAOMatrix;
      uniform sampler2D uVanTex; uniform mat4 uVanMatrix; uniform float uVanOn;
      uniform vec2 uSunOffset; uniform vec3 uFadeColor; uniform vec4 uFadeArc;
      uniform vec4 uWetRect; uniform vec2 uWetGround; uniform vec2 uFoamGround;
      float gsFoam(vec3 w) {
        if (uFoamGround.x <= 0.0) return 0.0;
        vec2 q = max(max(uWetRect.xy - w.xz, w.xz - uWetRect.zw), 0.0);
        float reach = uFoamGround.y * (0.6 + 0.8 * h_noise(w * 0.45));
        return uFoamGround.x * (1.0 - smoothstep(reach * 0.55, reach, length(q)));
      }
      vec2 gsProj(mat4 m, vec3 w) { vec4 c = m * vec4(w, 1.0); return c.xy / c.w * 0.5 + 0.5; }
      float gsInside(vec2 uv) { return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0); }
      float gsRoadEnds(vec3 w) {
        float a = atan(w.z - uFadeArc.y, w.x - uFadeArc.x);
        if (a < uFadeArc.z - 1.2) a += 6.2831853;
        return max(1.0 - smoothstep(uFadeArc.z + 0.05, uFadeArc.z + 0.3, a), smoothstep(uFadeArc.w - 0.3, uFadeArc.w - 0.05, a));
      }
      void main() {`
    )
    .replace(
      '#include <lights_fragment_end>',
      /* glsl */ `#include <lights_fragment_end>
      {
        vec2 aoUv = gsProj(uAOMatrix, vWPos);
        float ao = texture2D(uAOTex, aoUv).r * gsInside(aoUv);
        float vanAO = 0.0, vanSh = 0.0;
        vec2 vUv = gsProj(uVanMatrix, vWPos);
        vec2 vMid = gsProj(uVanMatrix, vWPos + vec3(uSunOffset.x, 0.0, uSunOffset.y) * 1.4);
        if (uVanOn > 0.5 && (gsInside(vUv) > 0.5 || gsInside(vMid) > 0.5)) {
          vanAO = texture2D(uVanTex, vUv).r * gsInside(vUv);
          // march up the sun ray: the ground point is shaded if the van occupies any height on it
          for (int i = 1; i <= 7; i++) {
            float h = 0.35 + float(i) * 0.33;
            vec3 q = vWPos + vec3(uSunOffset.x * h, 0.0, uSunOffset.y * h);
            vec2 sUv = gsProj(uVanMatrix, q);
            vanSh = max(vanSh, texture2D(uVanTex, sUv).g * gsInside(sUv));
          }
        }
        float occl = clamp(ao + vanAO, 0.0, 1.0);
        reflectedLight.indirectDiffuse *= 1.0 - 0.75 * occl;
        reflectedLight.indirectSpecular *= 1.0 - 0.6 * occl;
        reflectedLight.directDiffuse *= (1.0 - 0.35 * occl) * (1.0 - 0.8 * vanSh);
        reflectedLight.directSpecular *= 1.0 - vanSh;
        // washing water running off the house soaks the ground around it
        if (uWetGround.x > 0.0) {
          vec2 q = max(max(uWetRect.xy - vWPos.xz, vWPos.xz - uWetRect.zw), 0.0);
          float reach = uWetGround.y * (0.75 + 0.5 * h_noise(vWPos * 0.7));
          float soak = uWetGround.x * (1.0 - smoothstep(reach * 0.6, reach, length(q)));
          reflectedLight.directDiffuse *= 1.0 - 0.42 * soak;
          reflectedLight.indirectDiffuse *= 1.0 - 0.42 * soak;
          reflectedLight.directSpecular *= 1.0 + 1.5 * soak;
        }
      }`
    )
    .replace(
      '#include <colorspace_fragment>',
      `#include <colorspace_fragment>
      {
        float gf = gsFoam(vWPos);
        if (gf > 0.0) {
          float suds = h_noise(vWPos * 7.0) * 0.6 + h_noise(vWPos * 19.0) * 0.4;
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.9, 0.915, 0.93) * (0.86 + 0.14 * suds), smoothstep(0.05, 0.45, gf));
        }
      }
      gl_FragColor.rgb = mix(gl_FragColor.rgb, uFadeColor, clamp(${fade}, 0.0, 1.0));`
    );
}

// --- baking ------------------------------------------------------------------------------------

// Occluders rendered from below: the lowest surface wins the depth test; occlusion falls off with
// its height above ground. G channel = plain silhouette (used for the van's sun shadow).
function createOccluderMaterial(maxHeight: number, groundY: number) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uMaxH: { value: maxHeight }, uGround: { value: groundY } },
    vertexShader: /* glsl */ `
      varying float vH;
      void main() {
        vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        vec4 w = modelMatrix * p;
        vH = w.y;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uMaxH; uniform float uGround; varying float vH;
      void main() {
        float occ = pow(1.0 - smoothstep(0.0, uMaxH, vH - uGround), 1.6);
        gl_FragColor = vec4(occ, 1.0, 0.0, 1.0);
      }`,
  });
}

function blurTarget(renderer: THREE.WebGLRenderer, rt: THREE.WebGLRenderTarget, passes: number[]) {
  const tmp = rt.clone();
  const h = new THREE.ShaderMaterial(HorizontalBlurShader);
  const v = new THREE.ShaderMaterial(VerticalBlurShader);
  const quad = new FullScreenQuad();
  const prevTarget = renderer.getRenderTarget();
  for (const radius of passes) {
    quad.material = h;
    h.uniforms.tDiffuse.value = rt.texture;
    h.uniforms.h.value = radius / rt.width;
    renderer.setRenderTarget(tmp);
    quad.render(renderer);
    quad.material = v;
    v.uniforms.tDiffuse.value = tmp.texture;
    v.uniforms.v.value = radius / rt.height;
    renderer.setRenderTarget(rt);
    quad.render(renderer);
  }
  renderer.setRenderTarget(prevTarget);
  tmp.dispose();
  h.dispose();
  v.dispose();
  quad.dispose();
}

function renderFromBelow(
  renderer: THREE.WebGLRenderer,
  objects: THREE.Object3D[],
  rt: THREE.WebGLRenderTarget,
  cam: THREE.OrthographicCamera,
  material: THREE.Material
) {
  const tmpScene = new THREE.Scene();
  const parents = objects.map((o) => o.parent);
  objects.forEach((o) => tmpScene.add(o));
  tmpScene.overrideMaterial = material;
  const prevTarget = renderer.getRenderTarget();
  const prevClear = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  const prevShadow = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(tmpScene, cam);
  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClear, prevAlpha);
  renderer.shadowMap.enabled = prevShadow;
  objects.forEach((o, i) => parents[i]?.add(o));
}

/** Orthographic camera below the ground looking straight up over a world-space XZ rectangle. */
function belowCamera(cx: number, cz: number, halfX: number, halfZ: number, height: number) {
  const cam = new THREE.OrthographicCamera(-halfX, halfX, halfZ, -halfZ, 0.01, height + 1);
  cam.position.set(cx, -0.5, cz);
  cam.up.set(0, 0, 1);
  cam.lookAt(cx, 10, cz);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
}

export function bakeContactAO(
  renderer: THREE.WebGLRenderer,
  u: GroundUniforms,
  occluders: THREE.Object3D[],
  rect: { cx: number; cz: number; half: number }
) {
  const rt = new THREE.WebGLRenderTarget(1024, 1024, { type: THREE.HalfFloatType });
  const cam = belowCamera(rect.cx, rect.cz, rect.half, rect.half, 6);
  const mat = createOccluderMaterial(3.2, 0.05);
  const vis = occluders.map((o) => o.visible);
  occluders.forEach((o) => (o.visible = true));
  renderFromBelow(renderer, occluders, rt, cam, mat);
  occluders.forEach((o, i) => (o.visible = vis[i]));
  blurTarget(renderer, rt, [3, 6, 10]);
  mat.dispose();
  u.uAOMatrix.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  return rt.texture;
}

/**
 * Bakes the van's footprint (R = contact occlusion, G = silhouette) in its own frame. Returns a
 * function that, given the van's world placement, updates the projection used by ground shaders.
 */
export function bakeVanFootprint(renderer: THREE.WebGLRenderer, u: GroundUniforms, van: THREE.Object3D, halfLen: number, halfWid: number) {
  const rt = new THREE.WebGLRenderTarget(512, 256, { type: THREE.HalfFloatType });
  const cam = belowCamera(0, 0, halfLen, halfWid, 4);
  const mat = createOccluderMaterial(1.1, 0.0);
  const pos = van.position.clone();
  const rot = van.rotation.clone();
  van.position.set(0, pos.y, 0);
  van.rotation.set(0, 0, 0);
  van.updateMatrixWorld(true);
  renderFromBelow(renderer, [van], rt, cam, mat);
  van.position.copy(pos);
  van.rotation.copy(rot);
  van.updateMatrixWorld(true);
  blurTarget(renderer, rt, [1.5, 3]);
  mat.dispose();
  u.uVanTex.value = rt.texture;
  const bakeVP = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const place = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  const at = new THREE.Vector3();
  return (x: number, z: number, yaw: number, visible: boolean) => {
    q.setFromAxisAngle(up, yaw);
    place.compose(at.set(x, 0, z), q, one).invert();
    u.uVanMatrix.value.multiplyMatrices(bakeVP, place);
    u.uVanOn.value = visible ? 1 : 0;
  };
}

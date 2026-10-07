import * as THREE from 'three';

// Ground effects for everything that touches the ground (floor, road, path). No shadows of any kind:
//  • wet ground and foam — washing water and suds spreading round the house during the clean
//  • edge fade — outer edges and the road's ends dissolve into the backdrop instead of ending in
//    hard, floating edges

export type GroundUniforms = {
  uFadeColor: { value: THREE.Color };
  uFadeArc: { value: THREE.Vector4 }; // road-end fade: centre x, z, start angle, end angle (radians)
  uWetRect: { value: THREE.Vector4 }; // house footprint: min x, min z, max x, max z
  uWetGround: { value: THREE.Vector2 }; // runoff: wetness, how far it has spread (m)
  uFoamGround: { value: THREE.Vector2 }; // foam spilling round the house: amount, how far (m)
};

export function createGroundUniforms(fadeColorSRGB: THREE.Color, arc: THREE.Vector4): GroundUniforms {
  return {
    uFadeColor: { value: fadeColorSRGB },
    uFadeArc: { value: arc },
    uWetRect: { value: new THREE.Vector4() },
    uWetGround: { value: new THREE.Vector2() },
    uFoamGround: { value: new THREE.Vector2() },
  };
}

/**
 * Injects the ground effects into a MeshStandard/Physical shader that already has `vWPos` (world position).
 * `fade`: GLSL expression (0–1) evaluated in main() for how much to dissolve into the backdrop.
 */
export function injectGroundShading(shader: THREE.WebGLProgramParametersWithUniforms, u: GroundUniforms, fade: string) {
  Object.assign(shader.uniforms, u);
  shader.fragmentShader = shader.fragmentShader
    .replace(
      'void main() {',
      /* glsl */ `
      uniform vec3 uFadeColor; uniform vec4 uFadeArc;
      uniform vec4 uWetRect; uniform vec2 uWetGround; uniform vec2 uFoamGround;
      float gsFoam(vec3 w) {
        if (uFoamGround.x <= 0.0) return 0.0;
        vec2 q = max(max(uWetRect.xy - w.xz, w.xz - uWetRect.zw), 0.0);
        float reach = uFoamGround.y * (0.6 + 0.8 * h_noise(w * 0.45));
        return uFoamGround.x * (1.0 - smoothstep(reach * 0.55, reach, length(q)));
      }
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
      // washing water running off the house soaks the ground around it
      if (uWetGround.x > 0.0) {
        vec2 q = max(max(uWetRect.xy - vWPos.xz, vWPos.xz - uWetRect.zw), 0.0);
        float reach = uWetGround.y * (0.75 + 0.5 * h_noise(vWPos * 0.7));
        float soak = uWetGround.x * (1.0 - smoothstep(reach * 0.6, reach, length(q)));
        reflectedLight.directDiffuse *= 1.0 - 0.42 * soak;
        reflectedLight.indirectDiffuse *= 1.0 - 0.42 * soak;
        reflectedLight.directSpecular *= 1.0 + 1.5 * soak;
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

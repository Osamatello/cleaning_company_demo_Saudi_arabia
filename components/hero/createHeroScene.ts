import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import {
  ASSETS,
  CAMERA,
  HOUSE_POS,
  HOUSE_SCALE,
  ROAD_ANGLE_RANGE,
  ROAD_CENTER_MODEL,
  ROAD_ROTATION_DEG,
  ROAD_SCALE,
  TIMELINE,
  VAN_ROUTE,
  VAN_SCALE,
  roadPointModel,
  roadRadiiAt,
} from './heroConfig';
import {
  type SharedUniforms,
  createGrassMaterial,
  createHouseMaterial,
  createLitterMaterial,
  createPavingMaterial,
  createRoadMaterial,
  createVanMaterial,
} from './materials';
import { type GroundUniforms, bakeContactAO, bakeVanFootprint, createGroundUniforms } from './groundShading';
import { buildTree, type WindUniforms } from './tree';
import { createDriveProfile, rigVan } from './vehicle';
import { type RoadExtension, buildExtensionPath, buildStreetGeometry, distToStreets, groundFade } from './roadExtension';

// ---------------------------------------------------------------------------
// GLB loading is cached per page so React StrictMode's double-mount (dev) and
// remounts never download or parse the ~220 MB of models twice.
type Entry = { promise: Promise<GLTF> };
const cache = new Map<string, Entry>();
function loadGLB(url: string): Entry {
  let e = cache.get(url);
  if (!e) {
    const entry: Entry = { promise: new GLTFLoader().loadAsync(url) };
    // don't keep a failed download cached; the next mount retries it
    entry.promise.catch(() => cache.delete(url));
    cache.set(url, entry);
    e = entry;
  }
  return e;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const range = (r: readonly [number, number], p: number) => clamp01((p - r[0]) / (r[1] - r[0]));

const roadWorld = (deg: number, lane: number, y = 0) => {
  const m = roadPointModel(deg, lane);
  return new THREE.Vector3(m.x * ROAD_SCALE, y, m.z * ROAD_SCALE);
};
const ROAD_CX = ROAD_CENTER_MODEL.x * ROAD_SCALE;
const ROAD_CZ = ROAD_CENTER_MODEL.z * ROAD_SCALE;
/** Point on the road `off` metres out from its inner edge at angle `deg` (edge smoothed over ±10°,
 *  so the measured model's small wiggles don't turn into steering corrections). */
const roadWorldAt = (deg: number, off: number, y = 0) => {
  let ri = 0;
  for (let k = -10; k <= 10; k++) ri += roadRadiiAt(deg + k)[0];
  const r = (ri / 21) * ROAD_SCALE + off;
  const t = THREE.MathUtils.degToRad(deg);
  return new THREE.Vector3(ROAD_CX + Math.cos(t) * r, y, ROAD_CZ + Math.sin(t) * r);
};

// Daylight: sun from the front-left, fairly high, like a late-morning shoot.
const SUN_DIR = new THREE.Vector3(-0.45, 0.72, 0.53).normalize();
const BACKDROP = new THREE.Color('#ffffff');
// Pixel-ratio ceiling: sharp on high-DPI screens without tripling the shading cost.
const MAX_PIXEL_RATIO = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 1.5);

export type HeroScene = {
  setProgress: (p: number) => void;
  resize: () => void;
  setActive: (active: boolean) => void;
  dispose: () => void;
};

export function createHeroScene(
  canvas: HTMLCanvasElement,
  opts: { /** called once the first complete frame (all models, compiled shaders) is on the canvas */ onReady?: () => void }
): HeroScene {
  // No MSAA: with multi-million-triangle models it cost 25–30% of the frame. Edges are smoothed
  // by an FXAA pass on the final image instead (see present()).
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(MAX_PIXEL_RATIO);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap; // soft, wide penumbrae like real daylight
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.background = BACKDROP;

  // Image-based lighting from a physical sky (blue zenith, bright horizon, sun, green-grey ground)
  // so paint, glass and metal reflect a believable outdoor world.
  const envTex = createSkyEnvironment(renderer, SUN_DIR);
  scene.environment = envTex;
  scene.environmentIntensity = 0.55; // less flat fill → deeper, richer colours

  const camera = new THREE.PerspectiveCamera(CAMERA.start.fov, 1, 0.5, 400);

  scene.add(new THREE.HemisphereLight(0xeef4ff, 0xb9b09a, 0.18));
  const sun = new THREE.DirectionalLight(0xffeed6, 3.0);
  const sunTarget = new THREE.Vector3(1.5, 0, -3);
  sun.position.copy(sunTarget).addScaledVector(SUN_DIR, 45);
  sun.target.position.copy(sunTarget);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -21;
  sun.shadow.camera.right = 21;
  sun.shadow.camera.top = 21;
  sun.shadow.camera.bottom = -21;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 90;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 7;
  sun.shadow.blurSamples = 16;
  scene.add(sun, sun.target);

  // Invisible floor that only catches soft shadow beyond the scenery, on the white backdrop.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShadowMaterial({ opacity: 0.08 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.09;
  floor.receiveShadow = true;
  scene.add(floor);

  const shared: SharedUniforms = {
    uDissolve: { value: 0 },
    uWetIn: { value: 0 },
    uWetOut: { value: 0 },
    uTime: { value: 0 },
    uFoam: { value: 0 },
    uFoamOut: { value: 0 },
  };
  const [a0, a1] = ROAD_ANGLE_RANGE;
  const ground = createGroundUniforms(
    SUN_DIR,
    BACKDROP.clone(), // sRGB output colour, compared after colour-space conversion
    new THREE.Vector4(ROAD_CX, ROAD_CZ, THREE.MathUtils.degToRad(a0), THREE.MathUtils.degToRad(a1))
  );
  const wind: WindUniforms = { uWind: { value: 0 }, uSunDir: { value: SUN_DIR.clone() } };

  // --- van route: entirely on the road, from its right-hand end round the bend to the front
  const houseFrontZ = HOUSE_POS.zFront;
  const houseBackZ = houseFrontZ - 6.4;
  // the road model's tips continue as streets running off into the distance on both sides
  const streets = [buildExtensionPath('right'), buildExtensionPath('left')];
  const [streetR] = streets;
  const route: THREE.Vector3[] = [];
  // the van approaches from far down the right-hand street, so it is seen arriving, not appearing
  for (let s = streetR.tipS + VAN_ROUTE.approach; s > 0.5; s -= 1.5) route.push(streetR.point(s, VAN_ROUTE.lane).setY(0));
  // in its lane round the bend, then it pulls in to the kerb beside the house and parks
  const laneOff = VAN_ROUTE.lane * streetR.width;
  const offAt = (a: number) => laneOff + (VAN_ROUTE.parkOffset - laneOff) * smooth(VAN_ROUTE.parkDeg - 30, VAN_ROUTE.parkDeg - 2, a);
  for (let a = streetR.joinDeg; a < VAN_ROUTE.parkDeg; a += 3) route.push(roadWorldAt(a, offAt(a)));
  route.push(roadWorldAt(VAN_ROUTE.parkDeg, VAN_ROUTE.parkOffset));
  const driveLine = buildDriveLine(new THREE.CatmullRomCurve3(route, false, 'centripetal'));
  const pathLength = driveLine.length;
  const drive = createDriveProfile();

  // --- environment
  const groundMesh = buildGround(ground, houseFrontZ, houseBackZ, streets);
  scene.add(groundMesh.mesh);
  scene.add(buildVerge(ground));
  scene.add(buildApron(ground, streets));
  for (const st of streets) {
    const m = new THREE.Mesh(buildStreetGeometry(st), createRoadMaterial(ground, { width: st.width }));
    m.receiveShadow = true;
    scene.add(m);
  }
  const inwardFrom = (p: THREE.Vector3, d: number) =>
    p.addScaledVector(new THREE.Vector3(ROAD_CX, 0, ROAD_CZ).sub(p).setY(0).normalize(), d);
  const treeR = inwardFrom(roadWorld(a0 + 9, 0), 2.0);
  treeR.y = groundMesh.heightAt(treeR.x, treeR.z) - 0.05;
  const treeL = inwardFrom(roadWorld(a1 - 8, 0), 2.0);
  treeL.y = groundMesh.heightAt(treeL.x, treeL.z) - 0.05;
  const treeRight = buildTree(treeR, 1.05, 3, wind);
  const treeLeft = buildTree(treeL, 0.88, 8, wind);
  scene.add(treeRight, treeLeft);
  // concrete path from the front door down to the road
  const doorX = HOUSE_POS.x - 0.63 * HOUSE_SCALE;
  const padDepth = roadWorld(VAN_ROUTE.parkDeg, 0).z - houseFrontZ + 0.4;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, padDepth), createPavingMaterial(ground));
  pad.position.set(doorX, 0.1, houseFrontZ + padDepth / 2 - 0.1);
  pad.receiveShadow = true;
  scene.add(pad);

  const litter = buildLitter(shared, houseFrontZ);
  scene.add(litter);
  let aoDirty: THREE.Texture | null = null;
  let aoClean: THREE.Texture | null = null;

  // --- models
  const entries = {
    road: loadGLB(ASSETS.road),
    dirty: loadGLB(ASSETS.dirtyHouse),
    clean: loadGLB(ASSETS.cleanHouse),
    van: loadGLB(ASSETS.van),
  };

  let dirtyHouse: THREE.Object3D | null = null;
  let cleanHouse: THREE.Object3D | null = null;
  let van: THREE.Object3D | null = null;
  let rig: ReturnType<typeof rigVan> | null = null;
  let placeVanShadow: ((x: number, z: number, yaw: number, visible: boolean) => void) | null = null;
  let ready = false;
  let announceReady = false;
  let disposed = false;
  const vanLights = { value: new THREE.Vector2(0, 0) };


  Promise.all([entries.road.promise, entries.dirty.promise, entries.clean.promise, entries.van.promise])
    .then(([roadG, dirtyG, cleanG, vanG]) => {
      if (disposed) return;

      // Road: the model is flat; it is turned about its inner centre (see ROAD_ROTATION_DEG).
      const road = roadG.scene;
      road.scale.setScalar(ROAD_SCALE);
      road.position.y = -0.005 * ROAD_SCALE + 0.03;
      const rot = THREE.MathUtils.degToRad(ROAD_ROTATION_DEG);
      const pivot = new THREE.Vector3(ROAD_CX, 0, ROAD_CZ);
      const turned = pivot.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -rot);
      road.rotation.y = -rot;
      road.position.x = pivot.x - turned.x;
      road.position.z = pivot.z - turned.z;
      const roadMat = createRoadMaterial(ground);
      road.traverse((c) => {
        const m = c as THREE.Mesh;
        if (!m.isMesh) return;
        m.material = roadMat;
        m.receiveShadow = true;
      });
      scene.add(road);

      // Houses share placement so the dissolve lines up: same scale, front walls and base aligned.
      const placeHouse = (g: GLTF, frontZ: number, minY: number, dirty: boolean) => {
        const h = g.scene;
        h.scale.setScalar(HOUSE_SCALE);
        h.position.set(HOUSE_POS.x, -minY * HOUSE_SCALE, houseFrontZ - frontZ * HOUSE_SCALE);
        const mat = createHouseMaterial(shared, dirty, minY);
        h.traverse((c) => {
          const m = c as THREE.Mesh;
          if (!m.isMesh) return;
          m.material = mat;
          m.castShadow = true;
          m.receiveShadow = true;
        });
        scene.add(h);
        return h;
      };
      dirtyHouse = placeHouse(dirtyG, 0.694, -0.765, true);
      cleanHouse = placeHouse(cleanG, 0.497, -0.733, false);
      cleanHouse.visible = false;

      van = vanG.scene;
      van.scale.setScalar(VAN_SCALE);
      van.rotation.order = 'YXZ'; // yaw, then roll / pitch in the van's own frame
      const vanMat = createVanMaterial(vanLights);
      van.traverse((c) => {
        const m = c as THREE.Mesh;
        if (!m.isMesh) return;
        m.material = vanMat;
        m.receiveShadow = true;
      });
      rig = rigVan(van, VAN_SCALE, 0.4 * VAN_SCALE + 0.03);
      van.position.set(0, 0.4 * VAN_SCALE + 0.03, 0);
      scene.add(van);
      placeVanShadow = bakeVanFootprint(renderer, ground, van, 4.4, 2.4);

      scene.updateMatrixWorld(true);
      // soft contact occlusion under houses, trees (and the litter, before the clean-up)
      const aoRect = { cx: 1.4, cz: -6, half: 22 };
      aoDirty = bakeContactAO(renderer, ground, [dirtyHouse, cleanHouse, litter, treeRight, treeLeft], aoRect);
      aoClean = bakeContactAO(renderer, ground, [dirtyHouse, cleanHouse, treeRight, treeLeft], aoRect);
      ground.uAOTex.value = aoDirty;
      const houseBox = new THREE.Box3().setFromObject(dirtyHouse);
      ground.uWetRect.value.set(houseBox.min.x, houseBox.min.z, houseBox.max.x, houseBox.max.z);

      ready = true;
      // Soft sun shadows are baked once, from both house states together (they share a footprint),
      // so the multi-million-triangle shadow pass never re-runs while scrolling.
      dirtyHouse.visible = true;
      cleanHouse.visible = true;
      renderer.compile(scene, camera); // compile every shader now so the first scroll doesn't hitch
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      cleanHouse.visible = false;
      applyScene(current, current, current, 0);
      needsRender = true;
      announceReady = true; // revealed after the next full frame (FXAA and all) has been drawn
    })
    .catch((err) => {
      console.error('Hero scene failed to load', err);
    });

  // --- camera
  const camFrom = orbit(CAMERA.start);
  const camTo = orbit(CAMERA.end);
  const camTarget = new THREE.Vector3();
  let viewW = 1;
  let viewH = 1;

  function orbit(k: typeof CAMERA.start) {
    return { target: new THREE.Vector3(...(k.target as [number, number, number])), az: k.azimuth, el: k.elevation, dist: k.distance, fov: k.fov };
  }

  function placeCamera(p: number) {
    const t = easeInOut(range(TIMELINE.camera, p));
    const az = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(camFrom.az, camTo.az, t));
    const el = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(camFrom.el, camTo.el, t));
    const aspect = viewW / viewH;
    // Portrait screens: pull back so the house still fits the width.
    const fit = aspect < 1.2 ? Math.pow(1.2 / aspect, 0.95) : 1;
    const dist = THREE.MathUtils.lerp(camFrom.dist, camTo.dist, t) * fit;
    camTarget.lerpVectors(camFrom.target, camTo.target, t);
    camera.position.set(
      camTarget.x + Math.sin(az) * Math.cos(el) * dist,
      camTarget.y + Math.sin(el) * dist,
      camTarget.z + Math.cos(az) * Math.cos(el) * dist
    );
    camera.fov = THREE.MathUtils.lerp(camFrom.fov, camTo.fov, t);
    camera.lookAt(camTarget);
    // Composition: push the scene left on wide screens (headline on the right), down on portrait (headline on top).
    const shift = THREE.MathUtils.lerp(CAMERA.shiftDesktop[0], CAMERA.shiftDesktop[1], t);
    if (aspect >= 1.2) camera.setViewOffset(viewW, viewH, viewW * shift, 0, viewW, viewH);
    else camera.setViewOffset(viewW, viewH, 0, -viewH * 0.14, viewW, viewH);
    camera.updateProjectionMatrix();
  }

  // --- scene state. The camera, the van and the effects each follow the scroll with their own
  // smoothing, so they overlap naturally instead of moving in lockstep.
  let vanT = 0;
  let vanSettling = false;
  const vanPos = new THREE.Vector3();
  function applyScene(pFx: number, pCam: number, pVan: number, dt: number) {
    placeCamera(pCam);
    if (!ready || !van || !rig || !dirtyHouse || !cleanHouse || !placeVanShadow) return;

    // van: eased acceleration, cruise and braking along the road; suspension reacts to it
    const d = range(TIMELINE.vanDrive, pVan);
    vanT = drive.at(d);
    const line = driveLine.sample(vanT * pathLength, vanPos);
    vanSettling = rig.update(vanPos, line.yaw, vanT * pathLength, dt, drive.accel(d), line.curvature);
    van.visible = true;
    placeVanShadow(vanPos.x, vanPos.z, van.rotation.y, true);
    // daytime running lights while driving (fading after it stops); brake lights as it pulls in
    const lightsOn = 1 - smooth(0.985, 1.0, d) * 0.9;
    const brake = smooth(0.58, 0.72, d) * (1 - smooth(0.985, 1.0, d));
    vanLights.value.set(lightsOn, brake);

    // cleaning: foam spreads over the house (and spills round it), the dirt goes under it, the foam
    // slides off, rinse water follows it down, then everything drains and dries
    const foamIn = smooth(TIMELINE.foamIn[0], TIMELINE.foamIn[1], pFx);
    const foamOut = smooth(TIMELINE.foamOut[0], TIMELINE.foamOut[1], pFx);
    shared.uFoam.value = foamIn;
    shared.uFoamOut.value = foamOut;
    ground.uFoamGround.value.set(foamIn * (1 - smooth(TIMELINE.foamOut[0] + 0.05, TIMELINE.foamOut[1], pFx)), 0.4 + 2.2 * foamIn + 1.2 * foamOut);
    const wetIn = smooth(TIMELINE.washIn[0], TIMELINE.washIn[1], pFx);
    const wetOut = smooth(TIMELINE.washOut[0], TIMELINE.washOut[1], pFx);
    shared.uWetIn.value = wetIn;
    shared.uWetOut.value = wetOut;
    // runoff soaks the ground around the house, spreads, then dries
    const runoff = smooth(TIMELINE.washIn[0], TIMELINE.washIn[1], pFx);
    ground.uWetGround.value.set(runoff * (1 - smooth(TIMELINE.washOut[0] + 0.04, TIMELINE.washOut[1], pFx)), 1.0 + 2.6 * runoff);
    washing = (foamIn > 0 && foamOut < 1) || (wetIn > 0 && wetOut < 1) || ground.uWetGround.value.x > 0;
    const dis = smooth(TIMELINE.dissolve[0], TIMELINE.dissolve[1], pFx);
    shared.uDissolve.value = dis;
    dirtyHouse.visible = dis < 0.999;
    cleanHouse.visible = dis > 0.001;
    litter.visible = dis < 0.999;
    ground.uAOTex.value = dis < 0.5 ? aoDirty : aoClean;
  }

  // --- render loop
  const clock = new THREE.Clock();
  let target = 0;
  let current = 0;
  let camP = 0;
  let vanP = 0;
  let lastKey = '';
  let active = true;
  let needsRender = true;
  let washing = false;
  let raf = 0;
  let lastFrame = 0;
  let lastIdle = 0;

  // Adaptive resolution: if back-to-back frames run slow (heavy GPU / high-DPI screen), render a
  // little softer; recover sharpness when there is headroom. Rate-limited so it never "pumps".
  let prScale = 1;
  let slowRun = 0;
  let fastRun = 0;
  let lastPRChange = 0;
  let renderedLastFrame = false;
  let lastRenderAt = 0;
  const adaptResolution = (now: number) => {
    const gap = (now - lastRenderAt) / 1000;
    if (gap > 1 / 38) {
      slowRun++;
      fastRun = 0;
    } else if (gap < 1 / 55) {
      fastRun++;
      slowRun = 0;
    }
    if (now - lastPRChange < 1500) return;
    let next = prScale;
    if (slowRun > 10 && prScale > 0.75) next = Math.max(0.75, prScale * 0.85);
    else if (fastRun > 120 && prScale < 1) next = Math.min(1, prScale * 1.1);
    if (next !== prScale) {
      prScale = next;
      renderer.setPixelRatio(MAX_PIXEL_RATIO * prScale);
      resize();
      lastPRChange = now;
      slowRun = fastRun = 0;
    }
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (!active) return;
    const dt = Math.min(0.1, (now - lastFrame) / 1000 || 0.016);
    lastFrame = now;
    const follow = (x: number, rate: number) => {
      const y = x + (target - x) * (1 - Math.exp(-dt * rate));
      return Math.abs(target - y) < 0.00015 ? target : y;
    };
    current = follow(current, 6.5);
    vanP = follow(vanP, 5.2);
    camP = follow(camP, 3.2);

    const key = `${current.toFixed(5)}|${vanP.toFixed(5)}|${camP.toFixed(5)}`;
    const moved = key !== lastKey;
    const idleDue = now - lastIdle > 33; // trees keep swaying at ~30 fps when nothing else moves
    if (moved || washing || vanSettling || needsRender) {
      applyScene(current, camP, vanP, dt);
      lastKey = key;
    }
    const continuous = moved || washing || vanSettling;
    if (ready && (continuous || needsRender || idleDue)) {
      // only consecutive frames say anything about GPU load (idle frames are throttled on purpose)
      if (continuous && renderedLastFrame) adaptResolution(now);
      wind.uWind.value = clock.getElapsedTime();
      shared.uTime.value = wind.uWind.value;
      present();
      needsRender = false;
      if (announceReady) {
        announceReady = false;
        opts.onReady?.();
      }
      lastIdle = now;
      lastRenderAt = now;
      renderedLastFrame = continuous;
    } else {
      renderedLastFrame = false;
    }
  };
  raf = requestAnimationFrame(loop);

  // --- output: the frame, then FXAA over the final (tone-mapped, sRGB) image
  const fxaa = new THREE.ShaderMaterial(FXAAShader);
  fxaa.toneMapped = false;
  const fxaaQuad = new FullScreenQuad(fxaa);
  const bufSize = new THREE.Vector2();
  let frameTex: THREE.FramebufferTexture | null = null;
  function present() {
    renderer.render(scene, camera);
    renderer.getDrawingBufferSize(bufSize);
    if (!frameTex || frameTex.image.width !== bufSize.x || frameTex.image.height !== bufSize.y) {
      frameTex?.dispose();
      frameTex = new THREE.FramebufferTexture(bufSize.x, bufSize.y);
      frameTex.minFilter = frameTex.magFilter = THREE.LinearFilter;
    }
    renderer.copyFramebufferToTexture(frameTex);
    fxaa.uniforms.tDiffuse.value = frameTex;
    fxaa.uniforms.resolution.value.set(1 / bufSize.x, 1 / bufSize.y);
    fxaaQuad.render(renderer);
  }

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    viewW = w;
    viewH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    placeCamera(camP);
    needsRender = true;
  };
  resize();


  return {
    setProgress: (p) => {
      target = clamp01(p);
    },
    resize,
    setActive: (a) => {
      active = a;
      if (a) needsRender = true;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
        mats.forEach((mat) => {
          Object.values(mat).forEach((v) => (v instanceof THREE.Texture ? v.dispose() : undefined));
          mat.dispose();
        });
      });
      // keep cached GLB scenes reusable by a future mount
      [dirtyHouse, cleanHouse, van].forEach((o) => o && scene.remove(o));
      aoDirty?.dispose();
      aoClean?.dispose();
      ground.uVanTex.value?.dispose();
      envTex.dispose();
      fxaa.dispose();
      fxaaQuad.dispose();
      frameTex?.dispose();
      renderer.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
function createSkyEnvironment(renderer: THREE.WebGLRenderer, sunDir: THREE.Vector3) {
  const envScene = new THREE.Scene();
  const sky = new Sky();
  sky.scale.setScalar(900);
  const u = sky.material.uniforms;
  u.turbidity.value = 3.2;
  u.rayleigh.value = 1.1;
  u.mieCoefficient.value = 0.005;
  u.mieDirectionalG.value = 0.82;
  u.sunPosition.value.copy(sunDir);
  envScene.add(sky);
  const groundDisc = new THREE.Mesh(
    new THREE.CircleGeometry(800, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0x6a7658) })
  );
  groundDisc.position.y = -3;
  envScene.add(groundDisc);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(envScene, 0.015, 0.1, 2000);
  pm.dispose();
  sky.geometry.dispose();
  sky.material.dispose();
  groundDisc.geometry.dispose();
  (groundDisc.material as THREE.Material).dispose();
  return rt.texture;
}

// Ground: a lawn inside the road's inner curve and, well behind the house, a rolling
// grassy ridge as a backdrop. `aFade` dissolves its outer edge into the white backdrop.
function buildGround(u: GroundUniforms, houseFrontZ: number, houseBackZ: number, streets: RoadExtension[]) {
  const [firstDeg, lastDeg] = ROAD_ANGLE_RANGE;
  const rings = 56;
  const segs = 240;
  const BACK_R = 14.5;

  const wrap = (deg: number) => {
    let d = ((deg % 360) + 360) % 360;
    if (d < firstDeg) d += 360;
    return d;
  };
  const boundary = (deg: number) => {
    const d = wrap(deg);
    if (d <= lastDeg) return roadRadiiAt(d)[0] * ROAD_SCALE - 0.1;
    // behind the house (no road): widen into a larger, softly irregular island for the ridge
    const t = (d - lastDeg) / (firstDeg + 360 - lastDeg);
    const a = roadRadiiAt(lastDeg)[0] * ROAD_SCALE;
    const b = roadRadiiAt(firstDeg)[0] * ROAD_SCALE;
    const base = THREE.MathUtils.lerp(a, b, t);
    return base + (BACK_R - base) * Math.pow(Math.sin(Math.PI * t), 0.5) + Math.sin(t * 11) * 0.45 + Math.sin(t * 23 + 1) * 0.2;
  };

  const height = (x: number, z: number, edge: number) => {
    const r = Math.hypot(x - ROAD_CX, z - ROAD_CZ);
    const k = clamp01(r / edge);
    const edgeFall = Math.cos((Math.PI / 2) * Math.pow(k, 3.2));
    // ridge starts a few metres behind the house and rolls along its length
    const back = smooth(houseBackZ - 2.5, houseBackZ - 9, z);
    const ridge = back * (3.4 + Math.sin(x * 0.33 + 1.2) * 1.3 + Math.sin(x * 0.71 + 0.4) * 0.5);
    // gentle lawn undulation elsewhere, kept flat in front of the facade
    const lawn = 0.14 + (Math.sin(x * 0.5) * Math.cos(z * 0.45) + 1) * 0.06 * smooth(houseFrontZ + 0.5, houseFrontZ - 2, z);
    // the terrain settles to the level of the streets where they pass
    const nearStreet = smooth(3.2, 8, distToStreets(streets, x, z));
    return Math.max(0, (lawn + ridge) * edgeFall * nearStreet) + 0.02 - (r > edge - 0.3 ? 0.05 : 0);
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const fades: number[] = [];
  const index: number[] = [];
  for (let s = 0; s <= segs; s++) {
    const a = (s / segs) * Math.PI * 2;
    const deg = (a * 180) / Math.PI;
    const edge = boundary(deg);
    for (let ri = 0; ri <= rings; ri++) {
      const k = ri / rings;
      const rr = (1 - Math.pow(1 - k, 1.6)) * edge; // denser rings near the edge
      const x = ROAD_CX + Math.cos(a) * rr;
      const z = ROAD_CZ + Math.sin(a) * rr;
      positions.push(x, height(x, z, edge), z);
      uvs.push(x / 3.2, z / 3.2);
      fades.push(groundFade(x, z));
    }
  }
  const row = rings + 1;
  for (let s = 0; s < segs; s++) {
    for (let ri = 0; ri < rings; ri++) {
      const a = s * row + ri;
      const b = (s + 1) * row + ri;
      index.push(a, b, a + 1, b, b + 1, a + 1); // counter-clockwise seen from above
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aFade', new THREE.Float32BufferAttribute(fades, 1));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, createGrassMaterial(u, { fadeAttr: true, roadEnds: false }));
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return {
    mesh,
    heightAt: (x: number, z: number) => height(x, z, boundary((Math.atan2(z - ROAD_CZ, x - ROAD_CX) * 180) / Math.PI)),
  };
}

// Grass verge along the road's outer edge, flush with the road surface, so the road reads as
// laid into the ground; its outer half dissolves into the backdrop.
function buildVerge(u: GroundUniforms) {
  const [a0, a1] = ROAD_ANGLE_RANGE;
  const steps = 220;
  const across = 8;
  const width = 1.8;
  const top = 0.036;
  const positions: number[] = [];
  const uvs: number[] = [];
  const fades: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const deg = a0 + ((a1 - a0) * i) / steps;
    const a = (deg * Math.PI) / 180;
    const rOut = roadRadiiAt(deg)[1] * ROAD_SCALE - 0.06;
    for (let j = 0; j <= across; j++) {
      const t = j / across;
      const r = rOut + width * t;
      const x = ROAD_CX + Math.cos(a) * r;
      const z = ROAD_CZ + Math.sin(a) * r;
      positions.push(x, top - 0.07 * t * t, z);
      uvs.push(x / 3.2, z / 3.2);
      fades.push(groundFade(x, z));
    }
  }
  const row = across + 1;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < across; j++) {
      const p = i * row + j;
      const q = (i + 1) * row + j;
      index.push(p, q, p + 1, q, q + 1, p + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aFade', new THREE.Float32BufferAttribute(fades, 1));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mat = createGrassMaterial(u, { fadeAttr: true, roadEnds: false });
  mat.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// Terrain beyond the island: continuous lawn under everything that carries on around the
// streets and rolls into low hills far to the sides, dissolving into the white backdrop only in
// the distance (close in front of the road, the island look is kept).
function buildApron(u: GroundUniforms, streets: RoadExtension[]) {
  const rings = 80;
  const segs = 200;
  const R = 110;
  const positions: number[] = [];
  const uvs: number[] = [];
  const fades: number[] = [];
  const index: number[] = [];
  for (let s = 0; s <= segs; s++) {
    const a = (s / segs) * Math.PI * 2;
    for (let ri = 0; ri <= rings; ri++) {
      const k = ri / rings;
      const r = Math.pow(k, 1.5) * R;
      const x = ROAD_CX + Math.cos(a) * r;
      const z = ROAD_CZ + Math.sin(a) * r;
      const fade = groundFade(x, z);
      const front = Math.pow(Math.max(0, Math.sin(a)), 2);
      const hills =
        smooth(24, 42, r) *
        (1 - front) *
        smooth(7, 16, distToStreets(streets, x, z)) *
        (1.6 + Math.sin(x * 0.085 + 1.3) * 1.1 + Math.sin(z * 0.11 + 0.4) * 0.8 + Math.sin((x + z) * 0.21) * 0.3);
      positions.push(x, -0.06 + Math.max(0, hills), z); // below the verge and island rims, never coplanar
      uvs.push(x / 3.2, z / 3.2);
      fades.push(fade);
    }
  }
  const row = rings + 1;
  for (let s = 0; s < segs; s++) {
    for (let ri = 0; ri < rings; ri++) {
      const p = s * row + ri;
      const q = (s + 1) * row + ri;
      index.push(p, q, p + 1, q, q + 1, p + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aFade', new THREE.Float32BufferAttribute(fades, 1));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, createGrassMaterial(u, { fadeAttr: true, roadEnds: false }));
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * The van's driving line: the raw route resampled every 25 cm and low-passed, with a heading and
 * curvature per sample, all precomputed. At run time the van just reads it — no tangents are
 * re-derived per frame, so its steering is exactly one smooth input per bend.
 */
function buildDriveLine(curve: THREE.Curve<THREE.Vector3>) {
  const n = Math.max(16, Math.ceil(curve.getLength() / 0.25));
  const pts = curve.getSpacedPoints(n);
  const smoothArr = (a: Float64Array, radius: number, passes: number) => {
    for (let pass = 0; pass < passes; pass++) {
      const src = a.slice();
      for (let i = 1; i < a.length - 1; i++) {
        const r = Math.min(radius, i, a.length - 1 - i); // shrink at the ends: start and parking spot stay exact
        let sum = 0;
        for (let k = -r; k <= r; k++) sum += src[i + k];
        a[i] = sum / (2 * r + 1);
      }
    }
  };
  const xs = Float64Array.from(pts, (p) => p.x);
  const zs = Float64Array.from(pts, (p) => p.z);
  smoothArr(xs, 8, 3);
  smoothArr(zs, 8, 3);
  const count = xs.length;
  const dist = new Float64Array(count);
  for (let i = 1; i < count; i++) dist[i] = dist[i - 1] + Math.hypot(xs[i] - xs[i - 1], zs[i] - zs[i - 1]);
  // heading (model nose points to −X), unwrapped and smoothed, then curvature = dYaw / ds
  const yaw = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(count - 1, i + 1);
    yaw[i] = Math.atan2(zs[i1] - zs[i0], -(xs[i1] - xs[i0]));
    if (i > 0) yaw[i] = yaw[i - 1] + Math.atan2(Math.sin(yaw[i] - yaw[i - 1]), Math.cos(yaw[i] - yaw[i - 1]));
  }
  smoothArr(yaw, 6, 2);
  const curv = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(count - 1, i + 1);
    curv[i] = (yaw[i1] - yaw[i0]) / Math.max(dist[i1] - dist[i0], 1e-6);
  }
  const length = dist[count - 1];
  const out = { yaw: 0, curvature: 0 };
  return {
    length,
    /** position at `s` metres along the line into `target`; returns its heading and curvature */
    sample(s: number, target: THREE.Vector3) {
      s = Math.min(Math.max(s, 0), length);
      let lo = 0;
      let hi = count - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (dist[mid] <= s) lo = mid;
        else hi = mid;
      }
      const t = (s - dist[lo]) / Math.max(dist[hi] - dist[lo], 1e-9);
      target.set(xs[lo] + (xs[hi] - xs[lo]) * t, 0, zs[lo] + (zs[hi] - zs[lo]) * t);
      out.yaw = yaw[lo] + (yaw[hi] - yaw[lo]) * t;
      out.curvature = curv[lo] + (curv[hi] - curv[lo]) * t;
      return out;
    },
  };
}

// Rubbish bags and flattened boxes in front of the weathered house ("chaos" state).
function buildLitter(shared: SharedUniforms, houseFrontZ: number) {
  const group = new THREE.Group();
  const bagGeo = new THREE.SphereGeometry(1, 28, 20);
  const p = bagGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    // plastic wrinkles + a pinched, tied-off top
    const wob = 1 + Math.sin(x * 9 + z * 5) * 0.07 + Math.sin(y * 13 + x * 4) * 0.05 + Math.sin(z * 11 - y * 6) * 0.04;
    const knot = y > 0.82 ? THREE.MathUtils.lerp(1, 0.4, (y - 0.82) / 0.18) : 1;
    p.setXYZ(i, x * wob * knot, y < 0 ? y * 0.5 : y * 0.8, z * wob * knot);
  }
  bagGeo.computeVertexNormals();
  const colors = ['#9fb0bd', '#1f2124', '#c3cad0', '#7e95a6', '#2a2d31'];
  const mats = colors.map((c) => createLitterMaterial(shared, c, 0.28));
  const box = createLitterMaterial(shared, '#a88a60', 0.95);
  const hx = HOUSE_POS.x;
  const bags: [number, number, number, number][] = [
    [-4.6, 0.3, 0.7, 0], [-3.9, 0.9, 0.55, 1], [-3.2, 0.2, 0.6, 2], [-5.3, -0.6, 0.5, 3], [-2.6, 1.1, 0.45, 4],
    [3.8, 1.0, 0.55, 0], [4.4, 0.4, 0.5, 2], [-1.2, 1.4, 0.4, 3], [-4.4, 1.6, 0.42, 1],
  ];
  bags.forEach(([x, z, s, c], i) => {
    const m = new THREE.Mesh(bagGeo, mats[c]);
    m.scale.setScalar(s * 0.7);
    m.position.set(hx + x, s * 0.4 + 0.1, houseFrontZ + z);
    m.rotation.set((i % 3) * 0.12, i * 1.7, (i % 2) * 0.1);
    group.add(m);
  });
  const boards: [number, number, number][] = [[-2.0, 1.6, 0.4], [1.2, 1.3, -0.3], [-5.8, 1.2, 0.9], [2.8, 1.8, 1.2]];
  boards.forEach(([x, z, r]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.8), box);
    m.position.set(hx + x, 0.17, houseFrontZ + z);
    m.rotation.set(0.04, r, 0.06);
    group.add(m);
  });
  return group;
}

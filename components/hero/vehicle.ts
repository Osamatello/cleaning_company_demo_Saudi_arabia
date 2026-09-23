import * as THREE from 'three';
import { VAN_WHEELS } from './assetMaps';

// Vehicle behaviour for the provided van (its geometry is used untouched):
//  • 3D alloy wheels (tyre sidewall, rim lip, five twin spokes, hub) laid over the model's flat
//    wheel faces and rolled by exactly distance / radius, so rotation always matches speed
//  • a drive profile with real acceleration and braking (no instant starts or stops)
//  • spring-damped suspension: the body squats, dives and leans from the van's actual
//    acceleration and overshoots slightly before settling — secondary motion, not a canned wobble

/** Distance fraction along the route for a drive fraction 0–1: eases in, cruises, brakes gently to rest. */
export function createDriveProfile() {
  const N = 512;
  const table = new Float32Array(N + 1);
  const speed = (d: number) => {
    // rolling when first seen, then it pulls hard up to cruising speed, holds it, and brakes
    // firmly all the way to the kerb (deceleration peaks at the stop, like a loaded van)
    const pull = 0.4 + 0.6 * THREE.MathUtils.smoothstep(d, 0, 0.16);
    const x = THREE.MathUtils.clamp((d - 0.58) / 0.42, 0, 1);
    return pull * Math.pow(1 - x, 0.8) * (1 - 0.15 * THREE.MathUtils.smoothstep(x, 0, 0.3));
  };
  // longitudinal acceleration felt by the body, normalised to [-1, 1] (+ = speeding up)
  const accelRaw = (d: number) => {
    const e = 1 / N;
    return ((speed(Math.min(1, d + e)) - speed(Math.max(0, d - e))) / (2 * e)) * speed(d);
  };
  let peak = 1e-6;
  for (let i = 0; i <= N; i++) peak = Math.max(peak, Math.abs(accelRaw(i / N)));
  let sum = 0;
  for (let i = 1; i <= N; i++) {
    sum += speed((i - 0.5) / N);
    table[i] = sum;
  }
  for (let i = 0; i <= N; i++) table[i] /= sum;
  return {
    /** path fraction reached at drive progress `d` */
    at: (d: number) => {
      const x = THREE.MathUtils.clamp(d, 0, 1) * N;
      const i = Math.floor(x);
      return i >= N ? 1 : THREE.MathUtils.lerp(table[i], table[i + 1], x - i);
    },
    /** scripted longitudinal acceleration at `d`, −1 (hardest braking) … 1 (hardest pull) */
    accel: (d: number) => (d <= 0 || d >= 1 ? 0 : accelRaw(d) / peak),
  };
}

function alloyWheel(mats: { alloy: THREE.Material; rubber: THREE.Material; cap: THREE.Material }) {
  const g = new THREE.Group();
  const R = VAN_WHEELS.tyre + 0.003;
  // tyre sidewall: a gently bulged ring
  const profile = [
    new THREE.Vector2(0.088, 0.0),
    new THREE.Vector2(0.095, 0.004),
    new THREE.Vector2(0.115, 0.0065),
    new THREE.Vector2(R - 0.008, 0.005),
    new THREE.Vector2(R, 0.0),
    new THREE.Vector2(R + 0.001, -0.01),
  ];
  const tyre = new THREE.Mesh(new THREE.LatheGeometry(profile, 64).rotateX(Math.PI / 2), mats.rubber);
  g.add(tyre);
  // rim lip
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.0042, 10, 64), mats.alloy);
  lip.position.z = 0.004;
  g.add(lip);
  // five twin spokes, slightly dished towards the hub
  const spokeGeo = new THREE.BoxGeometry(0.064, 0.0085, 0.006);
  spokeGeo.translate(0.032 + 0.021, 0, 0);
  for (let i = 0; i < 5; i++) {
    for (const off of [-0.11, 0.11]) {
      const s = new THREE.Mesh(spokeGeo, mats.alloy);
      s.rotation.z = (i / 5) * Math.PI * 2 + off;
      s.rotation.y = -0.06;
      s.position.z = 0.004;
      g.add(s);
    }
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.008, 32).rotateX(Math.PI / 2), mats.alloy);
  hub.position.z = 0.006;
  g.add(hub);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.014, 32), mats.cap);
  cap.position.z = 0.0105;
  g.add(cap);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.006, 6).rotateX(Math.PI / 2), mats.alloy);
    nut.position.set(Math.cos(a) * 0.019, Math.sin(a) * 0.019, 0.011);
    g.add(nut);
  }
  g.traverse((o) => ((o as THREE.Mesh).castShadow = false));
  return g;
}

export type VanRig = {
  wheels: THREE.Group[];
  wheelRadius: number;
  /** place the van; dt = 0 for a static pose (no suspension simulation). Returns true while the body is still settling. */
  update: (pos: THREE.Vector3, yaw: number, distance: number, dt: number, drive: number, curvature: number) => boolean;
};

export function rigVan(van: THREE.Object3D, vanScale: number, rideHeight: number): VanRig {
  const alloy = new THREE.MeshPhysicalMaterial({ color: 0xd9dde1, metalness: 1, roughness: 0.24, clearcoat: 0.6, clearcoatRoughness: 0.1 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.8 });
  const cap = new THREE.MeshPhysicalMaterial({ color: 0x0a2a5e, metalness: 0.3, roughness: 0.2, clearcoat: 1 });
  const wheels: THREE.Group[] = [];
  for (const [wx, wy] of VAN_WHEELS.centers) {
    for (const side of [1, -1]) {
      const w = alloyWheel({ alloy, rubber, cap });
      w.position.set(wx, wy, side * 0.3495);
      w.rotation.y = side > 0 ? 0 : Math.PI;
      w.userData.side = side;
      van.add(w);
      wheels.push(w);
    }
  }
  const wheelRadius = (VAN_WHEELS.tyre + 0.003) * vanScale;

  // suspension state (radians / metres), low-passed speed and the body's eased heading
  const s = { pitch: 0, pitchV: 0, roll: 0, rollV: 0, heave: 0, heaveV: 0 };
  let prevDist = 0;
  let speed = 0;
  let yawS = 0;
  let hasPrev = false;

  const spring = (x: number, v: number, target: number, w: number, z: number, dt: number) => {
    const a = w * w * (target - x) - 2 * z * w * v;
    v += a * dt;
    return [x + v * dt, v] as const;
  };

  const update = (pos: THREE.Vector3, yaw: number, distance: number, dt: number, drive: number, curvature: number) => {
    // wheels roll by arc length (angle = distance / radius): they slow with the van and stop with it
    const spin = distance / wheelRadius;
    for (const w of wheels) w.rotation.z = w.userData.side > 0 ? spin : -spin;

    if (dt > 0 && hasPrev) {
      const h = Math.min(dt, 1 / 30);
      speed += (Math.min(Math.abs(distance - prevDist) / dt, 40) - speed) * (1 - Math.exp(-dt / 0.12));
      // heading: the driving line's own smooth tangent, eased so a fast scroll never snaps the body
      let dy = yaw - yawS;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      yawS += dy * (1 - Math.exp(-dt * 14));
      const moving = THREE.MathUtils.clamp(speed / 2.5, 0, 1);
      // weight transfer: squat pulling away, dive under braking (scripted, so it reads at any scroll speed)
      const targetPitch = THREE.MathUtils.clamp(-drive * (drive < 0 ? 0.042 : 0.026) * moving, -0.045, 0.05);
      // body roll from the line's curvature (a = v²·κ), leaning out of each bend exactly once
      const targetRoll = THREE.MathUtils.clamp(speed * speed * curvature * 0.0065, -0.04, 0.04);
      // a heavy body on soft but well-damped springs: it settles, it doesn't rock
      [s.pitch, s.pitchV] = spring(s.pitch, s.pitchV, targetPitch, 5.6, 0.36, h);
      [s.roll, s.rollV] = spring(s.roll, s.rollV, targetRoll, 5.0, 0.62, h);
      // road surface through the tyres, stronger with speed; the body sinks a touch when braking
      const road =
        (Math.sin(distance * 7.3) * 0.6 + Math.sin(distance * 13.7 + 1.1) * 0.4) * 0.004 * Math.min(1, speed / 4) -
        Math.max(0, -drive) * 0.012 * moving;
      [s.heave, s.heaveV] = spring(s.heave, s.heaveV, road, 12, 0.5, h);
    } else {
      yawS = yaw;
      speed = 0;
      if (dt <= 0) s.pitch = s.roll = s.heave = s.pitchV = s.rollV = s.heaveV = 0;
    }
    prevDist = distance;
    hasPrev = dt > 0;
    van.position.set(pos.x, rideHeight + s.heave, pos.z);
    van.rotation.set(s.roll, yawS, s.pitch);
    return (
      Math.abs(s.pitch) + Math.abs(s.roll) + Math.abs(s.pitchV) + Math.abs(s.rollV) + Math.abs(s.heaveV) > 1e-4 ||
      Math.abs(Math.atan2(Math.sin(yaw - yawS), Math.cos(yaw - yawS))) > 1e-3
    );
  };

  return { wheels, wheelRadius, update };
}

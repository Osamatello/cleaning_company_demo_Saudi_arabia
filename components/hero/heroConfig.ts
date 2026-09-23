// Static configuration for the scroll-driven hero scene.
// Units: world units ≈ metres. All GLB models are normalised by Meshy to ~1.9 units wide,
// so each one gets its own scale factor here.

export const ASSETS = {
  road: '/assets/Curved_Empty_Road_Draft.glb',
  dirtyHouse: '/assets/Weathered_Suburban_Duplex_Draft.glb',
  cleanHouse: '/assets/Suburban_Semi_Detached_House_Draft.glb',
  van: '/assets/FreshSpaces_Cleaning_Services_Van_Draft.glb',
} as const;

export const ROAD_SCALE = 12;
export const HOUSE_SCALE = 4.6;
export const VAN_SCALE = 3.3;

// The road mesh is a flat crescent. Its footprint was measured by ray-marching outwards from
// the centre of its inner edge (model space): [angle°, inner radius, outer radius].
// Angles run from the right-hand tip (33°) around the front (90° = +Z) to the left-hand tip (195°).
export const ROAD_CENTER_MODEL = { x: 0.12, z: -0.64 };
export const ROAD_PROFILE: [number, number, number][] = [
  [33, 0.736, 0.872], [36, 0.714, 1.032], [39, 0.724, 1.066], [42, 0.718, 1.1], [45, 0.716, 1.134],
  [48, 0.712, 1.18], [51, 0.71, 1.214], [54, 0.706, 1.256], [57, 0.71, 1.306], [60, 0.71, 1.338],
  [63, 0.72, 1.372], [66, 0.728, 1.41], [69, 0.728, 1.44], [72, 0.732, 1.474], [75, 0.744, 1.49],
  [78, 0.748, 1.518], [81, 0.76, 1.53], [84, 0.76, 1.552], [87, 0.77, 1.572], [90, 0.776, 1.576],
  [93, 0.782, 1.59], [96, 0.786, 1.596], [99, 0.792, 1.602], [102, 0.792, 1.598], [105, 0.796, 1.592],
  [108, 0.796, 1.59], [111, 0.796, 1.578], [114, 0.792, 1.564], [117, 0.784, 1.548], [120, 0.776, 1.546],
  [123, 0.764, 1.504], [126, 0.752, 1.49], [129, 0.742, 1.466], [132, 0.736, 1.424], [135, 0.726, 1.394],
  [138, 0.718, 1.368], [141, 0.712, 1.334], [144, 0.708, 1.296], [147, 0.694, 1.266], [150, 0.694, 1.234],
  [153, 0.688, 1.206], [156, 0.686, 1.176], [159, 0.692, 1.15], [162, 0.692, 1.13], [165, 0.696, 1.106],
  [168, 0.7, 1.092], [171, 0.706, 1.076], [174, 0.708, 1.062], [177, 0.718, 1.056], [180, 0.728, 1.056],
  [183, 0.736, 1.044], [186, 0.752, 1.042], [189, 0.77, 1.03], [192, 0.792, 1.026], [195, 0.808, 0.994],
];

// The crescent is turned about its inner centre so it wraps symmetrically around the front of
// the house: from the right-hand side, across the front, to the left-hand side.
export const ROAD_ROTATION_DEG = -24;
/** First/last road angle in scene orientation. */
export const ROAD_ANGLE_RANGE = [
  ROAD_PROFILE[0][0] + ROAD_ROTATION_DEG,
  ROAD_PROFILE[ROAD_PROFILE.length - 1][0] + ROAD_ROTATION_DEG,
] as const;

/** Inner/outer road radius (model units). `deg` is in scene orientation unless `modelSpace`. */
export function roadRadiiAt(deg: number, modelSpace = false): [number, number] {
  const p = ROAD_PROFILE;
  const d = modelSpace ? deg : deg - ROAD_ROTATION_DEG;
  if (d <= p[0][0]) return [p[0][1], p[0][2]];
  for (let i = 1; i < p.length; i++) {
    if (d <= p[i][0]) {
      const t = (d - p[i - 1][0]) / (p[i][0] - p[i - 1][0]);
      return [p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t, p[i - 1][2] + (p[i][2] - p[i - 1][2]) * t];
    }
  }
  const l = p[p.length - 1];
  return [l[1], l[2]];
}

/** Point on the road (model units, centred like the model) at angle `deg`; `lane` 0 = inner edge … 1 = outer edge. */
export function roadPointModel(deg: number, lane: number, modelSpace = false): { x: number; z: number } {
  const [ri, ro] = roadRadiiAt(deg, modelSpace);
  const r = ri + (ro - ri) * lane;
  const a = (deg * Math.PI) / 180;
  return { x: ROAD_CENTER_MODEL.x + Math.cos(a) * r, z: ROAD_CENTER_MODEL.z + Math.sin(a) * r };
}

// The street is a constant-width two-lane carriageway (metres). Where the road model bulges wider
// in front of the house, the extra width is paved as a lay-by / forecourt.
export const STREET_WIDTH = 5.0;

// World placement
export const HOUSE_POS = { x: ROAD_CENTER_MODEL.x * ROAD_SCALE, zFront: -0.6 };

// The van approaches from far down the street that continues the road's right-hand end
// (`approach` metres beyond the model's tip), rounds the bend and parks in front of the house
// facing left (−X), matching the reference.
// `lane`: fraction of the street width from its inner edge; `parkOffset`: metres from the inner edge
// (inside the lay-by) where it stops.
export const VAN_ROUTE = { approach: 36, parkDeg: 76, lane: 0.42, parkOffset: 1.6 };

// Scroll timeline (0 → 1 across the pinned hero)
export const TIMELINE = {
  // every phase finishes by ~0.93, so the pinned section releases right after the end state
  vanDrive: [0.02, 0.42] as const,
  camera: [0.06, 0.55] as const,
  foamIn: [0.36, 0.53] as const, // foam spreads over the house until it is fully coated
  dissolve: [0.52, 0.58] as const, // dirty → clean, quickly, while fully hidden under the foam
  foamOut: [0.6, 0.8] as const, // the foam slides down and off
  washIn: [0.62, 0.76] as const, // rinse water follows it down the walls
  washOut: [0.74, 0.93] as const, // it drains away and the house dries
};

// Camera keyframes expressed as an orbit around a target (so the move is an arc, not a dolly).
export const CAMERA = {
  start: { target: [2.4, 3.3, -1.6], azimuth: -27, elevation: 9, distance: 20, fov: 32 },
  end: { target: [1.6, 2.8, -0.8], azimuth: 0, elevation: 13, distance: 28, fov: 28 },
  // fraction of the viewport the scene is pushed left to leave room for the headline (start → end)
  shiftDesktop: [0.17, 0.1] as const,
};

/** 2.35:1 canvas for login waves */
export const LOGIN_WAVES_VIEWBOX = "0 0 423 180";
export const LOGIN_WAVES_DISPLAY_HEIGHT = 88;
export const LOGIN_WAVES_DISPLAY_WIDTH = Math.round(
  LOGIN_WAVES_DISPLAY_HEIGHT * 2.35,
);

/** Dense enough that longer phase travel still steps smoothly. */
const FRAME_COUNT = 40;
/** Crest travel per full loop (was 1). Longer path = more motion before it repeats. */
const TRAVEL_CYCLES = 5;

type SegmentSpec = {
  midY: number;
  x0: number;
  x1: number;
  wavelength: number;
  amp: number;
  phase: number;
  speed: number;
  /** Amplitude scale at left / right ends (1 = full). Softly lerps along the segment. */
  ampStart?: number;
  ampEnd?: number;
};

/**
 * Top: continuous, smaller toward the right.
 * Middle: full continuous swell, phase offset so crests don't grid with others.
 * Bottom: one connected swell again (staggered left/right extent).
 */
const SEGMENTS: SegmentSpec[] = [
  {
    midY: 24,
    x0: 56,
    x1: 378,
    wavelength: 100,
    amp: 10.5,
    phase: 0.55,
    speed: 1,
    ampStart: 1,
    ampEnd: 0.38,
  },
  {
    midY: 72,
    x0: 10,
    x1: 413,
    wavelength: 90,
    amp: 9.5,
    phase: 2.15,
    speed: 0.9,
  },
  {
    midY: 120,
    x0: 16,
    x1: 386,
    wavelength: 76,
    amp: 9,
    // ~π/2 off the middle line so it isn't a mirror / counter-swell
    phase: 0.7,
    speed: 1.05,
  },
];

function pathFrom(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function sampleSegment(
  spec: SegmentSpec,
  time: number,
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const { x0, x1 } = spec;
  const ampStart = spec.ampStart ?? 1;
  const ampEnd = spec.ampEnd ?? 1;
  const span = Math.max(1, x1 - x0);

  for (let x = x0; x <= x1; x += 2.5) {
    const u = (x - x0) / span;
    const ampScale = ampStart + (ampEnd - ampStart) * u;

    const theta =
      (x / spec.wavelength) * Math.PI * 2 -
      time * Math.PI * 2 * spec.speed +
      spec.phase;

    const wave = Math.sin(theta) + 0.12 * Math.sin(theta * 2 + 0.35);
    const ink = Math.sin(x * 0.09 + spec.phase * 1.7) * 0.25;

    const y = spec.midY - spec.amp * ampScale * wave + ink;
    pts.push([x, y]);
  }

  return pts;
}

function buildFrames(): string[][] {
  const frames: string[][] = [];
  for (let f = 0; f < FRAME_COUNT; f++) {
    // Advance farther in phase space than one cycle so crests travel farther
    const time = (f / FRAME_COUNT) * TRAVEL_CYCLES;
    frames.push(
      SEGMENTS.map((spec) => pathFrom(sampleSegment(spec, time))),
    );
  }
  return frames;
}

export const LOGIN_WAVES_FRAMES: readonly (readonly string[])[] =
  buildFrames();

/** A random number source in [0, 1), passed in so the movement is the same every time under test. */
export type Random = () => number;

export interface Point {
  readonly x: number;
  readonly y: number;
}

interface Vertex extends Point {
  readonly vx: number;
  readonly vy: number;
}

export interface Shape {
  readonly vertices: readonly Vertex[];
  /** Earlier positions of the corners, oldest first. */
  readonly trail: readonly (readonly Point[])[];
}

export interface Mystify {
  readonly width: number;
  readonly height: number;
  readonly shapes: readonly [Shape, Shape];
}

export const cornerCount = 4;
export const trailLength = 6;
/** The saver draws at most this often, which keeps it light on weak devices. */
export const minFrameIntervalMs = 34;
const speed = { min: 60, max: 140 };

const between = (random: Random, low: number, high: number) => low + random() * (high - low);

function newShape(width: number, height: number, random: Random): Shape {
  const vertices = Array.from({ length: cornerCount }, (): Vertex => {
    const angle = random() * Math.PI * 2;
    const pace = between(random, speed.min, speed.max);
    return {
      x: random() * width,
      y: random() * height,
      vx: Math.cos(angle) * pace,
      vy: Math.sin(angle) * pace,
    };
  });
  return { vertices, trail: [] };
}

export function createMystify(width: number, height: number, random: Random): Mystify {
  const size = { width: Math.max(1, width), height: Math.max(1, height) };
  return {
    ...size,
    shapes: [newShape(size.width, size.height, random), newShape(size.width, size.height, random)],
  };
}

/** One coordinate moving at `velocity` for `seconds`, turning round at 0 and `limit`. */
function bounce(position: number, velocity: number, seconds: number, limit: number) {
  let next = position + velocity * seconds;
  let v = velocity;
  // A long step may cross an edge more than once, so keep reflecting until it is inside.
  for (let guard = 0; guard < 8 && (next < 0 || next > limit); guard++) {
    if (next < 0) {
      next = -next;
      v = -v;
    } else {
      next = 2 * limit - next;
      v = -v;
    }
  }
  return { position: Math.min(limit, Math.max(0, next)), velocity: v };
}

function stepShape(shape: Shape, seconds: number, width: number, height: number): Shape {
  const vertices = shape.vertices.map((vertex): Vertex => {
    const along = bounce(vertex.x, vertex.vx, seconds, width);
    const down = bounce(vertex.y, vertex.vy, seconds, height);
    return { x: along.position, y: down.position, vx: along.velocity, vy: down.velocity };
  });
  const before = shape.vertices.map(({ x, y }): Point => ({ x, y }));
  return { vertices, trail: [...shape.trail, before].slice(-trailLength) };
}

/** Moves both shapes by `elapsedMs`. The state it is given is not changed. */
export function stepMystify(state: Mystify, elapsedMs: number): Mystify {
  const seconds = Math.max(0, Math.min(elapsedMs, 250)) / 1000;
  return {
    ...state,
    shapes: [
      stepShape(state.shapes[0], seconds, state.width, state.height),
      stepShape(state.shapes[1], seconds, state.width, state.height),
    ],
  };
}

/** Fits the shapes into a new size. Corners outside it are pulled in and the trails start again. */
export function resizeMystify(state: Mystify, width: number, height: number): Mystify {
  const size = { width: Math.max(1, width), height: Math.max(1, height) };
  const fit = (shape: Shape): Shape => ({
    trail: [],
    vertices: shape.vertices.map((vertex) => ({
      ...vertex,
      x: Math.min(size.width, vertex.x),
      y: Math.min(size.height, vertex.y),
    })),
  });
  return { ...size, shapes: [fit(state.shapes[0]), fit(state.shapes[1])] };
}

/** True when enough time has passed since the last frame was drawn. */
export function isFrameDue(lastDrawnAt: number | null, now: number): boolean {
  return lastDrawnAt === null || now - lastDrawnAt >= minFrameIntervalMs;
}

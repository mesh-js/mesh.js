interface RendererOptions {
  contextType?: 'webgl2' | 'webgl' | '2d';
  width?: number;
  height?: number;
  autoUpdate?: boolean;
  preserveDrawingBuffer?: boolean;
  bufferSize?: number;
}

export class Renderer {
  constructor(canvas: HTMLCanvasElement, options?: RendererOptions);
}

interface Figure2DOptions {
  path?: string;
  simplify?: number;
  scale?: number;
}

export class Figure2D {
  constructor(options?: string | Figure2DOptions);

  readonly contours: Figure2DOptions[] | null;

  /**
   * Append a svg path to current Figure2D paths.
   */
  addPath(
    /**
     * a SVG Path String
     */
    path: string,
  ): void;

  /**
   * Clear all paths in the Figure2D.
   */
  clear(): void;

  /**
   * Clear all paths in the Figure2D.
   */
  beginPath(): void;

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: 0 | 1,
  ): void;

  arcTo(
    rx: number,
    ry: number,
    xAxisRotation: 0 | 1,
    largeArcFlag: 0 | 1,
    sweepFlag: 0 | 1,
    x: number,
    y: number,
  ): void;

  moveTo(x: number, y: number): void;

  lineTo(x: number, y: number): void;

  bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number,
  ): void;

  quadraticCurveTo(x1: number, y1: number, x: number, y: number): void;

  rect(x: number, y: number, width: number, height: number): void;
}

export class Mesh2D {
  constructor(figure: Figure2D);
}

export class MeshCloud {
  constructor(node: Mesh2D, amount?: number, options?: {buffer?: number});
}

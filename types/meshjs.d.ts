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

interface ContourOptions {
  path?: string;
  simplify?: number;
  scale?: number;
}

export class Figure2D {
  constructor(options?: string | ContourOptions);

  readonly contours: ContourOptions[] | null;

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

  readonly width: number;
  readonly height: number;
  readonly contours: ContourOptions[];
  readonly boundingBox: [[number, number], [number, number]] | null;
  readonly boundingCenter: [number, number] | null;
  readonly lineWidth: number;
  readonly lineCap: string;
  readonly lineJoin: string;
  readonly miterLimit: number;
  readonly transformMatrix: [number, number, number, number, number, number];
  readonly uniforms: Object;
  readonly meshData: Object;

  setStroke(options: {
    thickness?: number;
    cap?: 'butt' | 'square';
    join?: 'miter' | 'bevel';
    miterLimit?: number;
    color?: [number, number, number, number];
  }): void;

  setFill(options: {
    rule?: string;
    color?: [number, number, number, number];
  }): void;

  setTexture(
    texture: WebGLTexture,
    options?: {
      scale?: boolean;
      repeat?: boolean;
      rect?: [number, number, number, number];
      srcRect?: [number, number, number, number];
    },
  ): void;

  setCircularGradient(options: {
    vector?: [number, number, number];
    colors?: {
      offset: number;
      color: string | [number, number, number, number];
    }[];
    type?: 'stroke' | 'fill';
  }): void;

  setLinearGradient(options: {
    vector?: [number, number, number, number];
    colors?: {
      offset: number;
      color: string | [number, number, number, number];
    }[];
    type?: 'stroke' | 'fill';
  }): void;

  setRadialGradient(options: {
    vector?: [number, number, number, number, number, number];
    colors?: {
      offset: number;
      color: string | [number, number, number, number];
    }[];
    type?: 'stroke' | 'fill';
  }): void;

  setUniforms(uniforms: Object): Mesh2D;

  setTransform(...matrix: number[]): Mesh2D;

  transform(...matrix: number[]): Mesh2D;

  translate(x: number, y: number): Mesh2D;

  rotate(deg: number, origin?: [number, number]): Mesh2D;

  scale(x: number, y?: number, origin?: [number, number]): Mesh2D;

  skew(x: number, y?: number, origin?: [number, number]): Mesh2D;

  blur(length: number): Mesh2D;

  brightness(p?: number): Mesh2D;

  contrast(p?: number): Mesh2D;

  dropShadow(
    offsetX: number,
    offsetY: number,
    blurRadius?: number,
    color = string | [number, number, number, number],
  ): Mesh2D;

  grayscale(p?: number): Mesh2D;

  hueRotate(deg?: number): Mesh2D;

  invert(p?: number): Mesh2D;

  opacity(p?: number): Mesh2D;

  saturate(p?: number): Mesh2D;

  sepia(p?: number): Mesh2D;

  url(svgFilter: string): Mesh2D;

  isPointInFill(x: number, y: numbers): boolean;

  isPointInStroke(x: number, y: numbers): boolean;
}

export class MeshCloud {
  constructor(node: Mesh2D, amount?: number, options?: {buffer?: number});
}

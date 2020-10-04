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
}

export class Mesh2D {
  constructor(figure: Figure2D);
}

export class MeshCloud {
  constructor(node: Mesh2D, amount?: number, options?: {buffer?: number});
}

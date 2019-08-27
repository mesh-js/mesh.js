## Renderer

new Renderer(canvas, options = {})

- option properties

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| contextType | String | _optional, '2d' or 'webgl' or 'webgl2'_ | undefined | |
| bufferSize | Number | _optional | 1500 | |
| alpha | Boolean | _optional_ | true | |
| antialias | Boolean | _optional_ | false | |
| depth | Boolean | _optional_ | true | |
| desynchronized | Boolean | _optional_ | false | |
| failIfMajorPerformanceCaveat | Boolean | _optional_ | false | |
| powerPreference | String | _optional_ | 'default' | |
| premultipliedAlpha | Boolean | _optional_ | true | |
| preserveDrawingBuffer | Boolean| _optional_ | false | |
| stencil | Boolean | _optional_ | false | |

### propreties

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| canvas | HTMLCanvasElement or OffscreenCanvas | _readonly_ | | |
| canvasRenderer | CanvasRenderingContext2D | _readonly_ | null | |
| glRenderer | WebGLRenderingContext or WebGL2RenderingContext | _readonly_ | null | |
| isWebGL2 | Boolean | _readonly_ | | |

### methods

#### loadTexture

_async_ loadTexture(textureURL, {useImageBitmap = false})

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| textureURL | String | _URL_ | | |
| useImageBitmap | Boolean | _optional_ | false | |

- returns

texture: WebGLTexture

#### deleteTexture

deleteTexture(texture)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| texture | WebGLTexture | | | |

#### clear

clear(...rect)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| rect | Array | _optional_ | null | |

#### drawMeshes

drawMeshes(meshes, {program = null, attributeOptions = {}})

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| meshes | Array |  |  | |
| program | WebGLProgram | _optional_ | null | |
| attributeOptions | Object | _optional_ | {} | |

#### setGlobalTransform

setGlobalTransform(...matrix)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| matrix | Array |  |  |  |

#### globalTransform

globalTransform(...matrix)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| matrix | Array |  |  |  |

#### globalTranslate

translate(x, y)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |

#### globalRotate

rotate(deg, [originX, originY] = [0, 0])

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| deg | Number |  |  |  |
| originX | Number | _optional_ | 0 |  |
| originY | Number | _optional_ | 0 |  |

#### globalScale

scale(x, y, [originX, originY] = [0, 0])

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |
| originX | Number | _optional_ | 0 |  |
| originY | Number | _optional_ | 0 |  |

#### globalSkew

skew(x, y, [originX, originY] = [0, 0])

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |
| originX | Number | _optional_ | 0 |  |
| originY | Number | _optional_ | 0 |  |

#### transformPoint

transformPoint(x, y)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |

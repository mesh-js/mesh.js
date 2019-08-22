## Mesh2D

new Mesh2D(figure, {width = 300, height = 150})

- contructor parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| figure | [Figure2D](/en/api/figure2D) |  |  | |
| width | Number | _optional_ | 300 | |
| height | Number | _optional_ | 150 | |

### propreties

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| width | Number | _readonly_ | 300 | |
| height | Number | _readonly_ | 150 | |
| contours | Array | | | |
| boundingBox | Array | _readonly_ | null | |
| boundingCenter | Array | _readonly_ | null | |
| lineWidth | Number | _readonly_ | 0 | |
| lineCap | String | _readonly_ | empty string | |
| lineJoin | String | _readonly_ | empty string | |
| miterLimit | Number | _readonly_ | 0 | |
| transformMatrix | Array | _readonly_ | [1, 0, 0, 1, 0, 0] | |
| uniforms | Object | _readonly_ | {} | |
| meshData | Object | _readonly_ | null | |

### methods

#### setStroke

setStroke({thickness = 1, cap = 'butt', join = 'miter', miterLimit = 10, color = [0, 0, 0, 0]})

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| thickness | Number | _optional_ | 1 | |
| cap | String | _optional_ | 1 | |
| join | String | _optional_ | 1 | |
| miterLimit | String | _optional_ | 1 | |
| color | Array | _optional_ | [0, 0, 0, 0] | |

#### setFill

setFill({delaunay = true, clean = true, randomization = 0, color = [0, 0, 0, 0]})

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| delaunay | Boolean | _optional_ | true | |
| clean | Boolean | _optional_ | true | |
| randomization | Number | _optional_ | 0 | |
| color | Array | _optional_ | [0, 0, 0, 0] | |

#### setTexture

setTexture(texture, options = {scale: false, repeat: false, rect: [0, 0, ...imageSize], srcRect: null})

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| texture | WebGLTexture |  |  |  |
| scale | Boolean | _optional_ | false |  |
| repeat | Boolean | _optional_ | false |  |
| rect | Array | _optional_ | [0, 0, ...imageSize] |  |
| srcRect | Array | _optional_ | null |  |

#### setLinearGradient

setLinearGradient({vector, colors, type = 'fill'})

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| vector | Array |  |  |  |
| colors | Array |  |  |  |
| type | String | _'stroke' or 'fill'_ | 'fill' |  |

#### setRadialGradient

setRadialGradient({vector, colors, type = 'fill'})

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| vector | Array |  |  |  |
| colors | Array |  |  |  |
| type | String | _'stroke' or 'fill'_ | 'fill' |  |

#### setUniforms

setUniforms(uniforms)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| uniforms | Object |  |  |  |

#### setTransform

setTransform(...matrix)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| matrix | Array |  |  |  |

#### transform

transform(...matrix)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| matrix | Array |  |  |  |

#### translate

translate(x, y)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |

#### rotate

rotate(deg, [originX, originY] = [0, 0])

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| deg | Number |  |  |  |
| originX | Number | _optional_ | 0 |  |
| originY | Number | _optional_ | 0 |  |

#### scale

scale(x, y, [originX, originY] = [0, 0])

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |
| originX | Number | _optional_ | 0 |  |
| originY | Number | _optional_ | 0 |  |

#### skew

skew(x, y, [originX, originY] = [0, 0])

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |
| originX | Number | _optional_ | 0 |  |
| originY | Number | _optional_ | 0 |  |

#### blur

blur(length)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| length | Number |  |  |  |

#### brightness

brightness(p = 1.0)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| p | Number |  _0 to 1_ |  |  |

#### contrast

contrast(p = 1.0)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| p | Number |  _0 to 1_ |  |  |

#### dropShadow

dropShadow(offsetX, offsetY, blurRadius = 0, color = [0, 0, 0, 1])

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| offsetX | Number | | | |
| offsetY | Number | | | |
| blurRadius | Number | _optional_ | 0 | |
| color | Array | _optional_ | [0, 0, 0, 1] | |

#### grayscale

grayscale(p = 1.0)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| p | Number |  _0 to 1_ |  |  |

#### hueRotate

hueRotate(deg = 0)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| deg | Number |  _0 to 360_ |  |  |

#### invert

invert(p = 1.0)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| p | Number |  _0 to 1_ |  |  |

#### opacity

opacity(p = 1.0)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| p | Number |  _0 to 1_ |  |  |

#### saturate

saturate(p = 1.0)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| p | Number |  _0 to 1_ |  |  |

#### sepia

sepia(p = 1.0)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| p | Number |  _0 to 1_ |  |  |

#### url

url(svgFilter)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| svgFilter | String |  URL |  |  |

#### isPointInPath

isPointInPath(x, y)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |

#### isPointInStroke(x, y)

isPointInStroke(x, y)

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |

## Figure2D

new Figure2D({path='', simplify=0})

- contructor parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| path | String | _optional_ | empty string | |
| simplify | Number | _optional_ | 0 | |

### properties

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| contours | Array | _readonly_, _immutable_ | null | |

### methods

#### addPath

addPath(path)

- parameters

| Name | Type | Description |
| --- | --- | --- |
| path | String | a SVG Path String |

Append a svg path to current Figure2D paths.

#### clear

clear()

Clear all paths in the Figure2D.

*alias: beginPath*

#### arc

arc(x, y, radius, startAngle, endAngle, anticlockwise = 0)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| x | Number |  |  |  |
| y | Number |  |  |  |
| radius | Number |  |  |  |
| startAngle | Number |  |  |  |
| endAngle | Number |  |  |  |
| anticlockwise | Number | _optional_, _0 or 1_ | 0 |  |

#### arcTo

arcTo(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y)

- parameters

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| rx | Number |  |  |  |
| ry | Number |  |  |  |
| xAxisRotation | Number | _0 or 1_ |  |  |
| largeArcFlag | Number | _0 or 1_ |  |  |
| sweepFlag | Number | _0 or 1_  | |  |
| x | Number |  |  |  |
| y | Number |  |  |  |

#### moveTo

moveTo(x, y)

- parameters

| Name | Type | Description |
| --- | --- | --- |
| x | Number | |
| y | Number | |


#### lineTo

lineTo(x, y)

- parameters

| Name | Type | Description |
| --- | --- | --- |
| x | Number | |
| y | Number | |

#### bezierCurveTo()

bezierCurveTo(x1, y1, x2, y2, x, y)

- parameters

| Name | Type | Description |
| --- | --- | --- |
| x1 | Number | |
| y1 | Number | |
| x2 | Number | |
| y2 | Number | |
| x | Number | |
| y | Number | |

#### quadraticCurveTo

quadraticCurveTo(x1, y1, x, y)

- parameters

| Name | Type | Description |
| --- | --- | --- |
| x1 | Number | |
| y1 | Number | |
| x | Number | |
| y | Number | |

#### rect

rect(x, y, width, height)

- parameters

| Name | Type | Description |
| --- | --- | --- |
| x | Number | |
| y | Number | |
| width | Number | |
| height | Number | |

#### closePath

closePath()
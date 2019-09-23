// https://github.com/mattdesl/svg-path-contours
/* eslint-disable */

var bezier = require('adaptive-bezier-curve')
var vec2 = require('../extrude-polyline/vecutil')
var simplify = require('simplify-path')

function set(out, x, y) {
    out[0] = x
    out[1] = y
    return out
}

var tmp1 = [0,0],
    tmp2 = [0,0],
    tmp3 = [0,0]

function bezierTo(points, scale, start, seg) {
    bezier(start, 
        set(tmp1, seg[1], seg[2]), 
        set(tmp2, seg[3], seg[4]),
        set(tmp3, seg[5], seg[6]), scale, points)
}

module.exports = function contours(svg, scale, simp) {
    var paths = []

    var points = []
    var pen = [0, 0]
    svg.forEach(function(segment, i, self) {
        if (segment[0] === 'M') {
            vec2.copy(pen, segment.slice(1))
            if (points.length>0) {
                paths.push(points)
                points = []
            }
        } else if (segment[0] === 'C') {
            bezierTo(points, scale, pen, segment)
            set(pen, segment[5], segment[6])
        } else {
            throw new Error('illegal type in SVG: '+segment[0])
        }
    })
    if (points.length>0)
        paths.push(points)

    return paths.map(function (points) {
        return simplify(points, simp || 0);
    })
}
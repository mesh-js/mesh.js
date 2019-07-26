/* eslint-disable */
function clone(arr) {
    return [arr[0], arr[1]]
}

function create() {
    return [0, 0]
}

module.exports = {
    create: create,
    clone: clone,
    copy: require('gl-vec2/copy'),
    scaleAndAdd: require('gl-vec2/scaleAndAdd'),
    dot: require('gl-vec2/dot')
}
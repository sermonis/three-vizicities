/*
 * Color helpers
 */
import * as THREE from 'three'

var Color = (function() {

    var random = function (color) {

        let $_color = color || 0xffffff

        return color = new THREE.Color($_color * Math.random())

    }

    return {

        random: random,

    }

})()

export default Color

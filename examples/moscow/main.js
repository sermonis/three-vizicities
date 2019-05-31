// Moscow
var coords = [55.75222, 37.61556];

var world = VIZI.world('world', {

    skybox: false,
    postProcessing: false,
    // attribution: '<a href="http://vizicities.com" target="_blank">МосТрансПроект</a>',

}).setView(coords)

// Add controls
VIZI.Controls.orbit().addTo(world)

// How to move from city to city?
// https://github.com/UDST/vizicities/issues/134

// CartoDB basemap
VIZI.imageTileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
// VIZI.imageTileLayer('http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
// VIZI.imageTileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {

    // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    attribution: null,

}).addTo(world)

// Chroma scale for height-based colours
var colorScale = chroma.scale('YlOrBr').domain([0,350])

// Moscow administrative boundary polygons
// VIZI.geoJSONLayer('https://gist.github.com/sermonis/640e1902c850d49fe05c46f9a1eb23fc/raw/cff7940eeeaee4c94b895cc1fc8a738c2729fe52/moscow-ao.geojson', {
// Moscow munitipal boundary polygons
VIZI.geoJSONLayer('https://gist.github.com/sermonis/0ca99dc8e4e4c4078402f35abceb9b9c/raw/f40c53afe32d91788d4b8c240261efec650d4809/moscow-mo.geojson', {

    output: true,
    interactive: true,
    style: ( feature ) => {

        var value = feature.properties.OKATO
        var color = colorScale(value).hex()

        return {

            // color: color,
            color: '#4B70F5',
            opacity: 0.1,
            transparent: true,
            outline: true,
            // outlineColor: '#fff',
            outlineColor: '#545672',
            outlineWidth: 3,
            // height: 5,

        }
    },

    onEachFeature: ( feature, layer ) => {

        layer.on('click', (layer, point2d, point3d, intersects) => {

            let id = layer.feature.properties.NAME
            // var id = layer.feature.properties.ABBREV
            let value = layer.feature.properties.OKATO

            console.log(id + ': ' + value, layer, point2d, point3d, intersects)

        })

        layer.on('hover', (layer, point2d, point3d, intersects) => {

            // console.dir(layer)
            // console.dir(point2d)
            // console.dir(point3d)
            // console.dir(intersects)

            // console.dir(intersects[0])
            //
            // let mesh = intersects[0].object
            //
            // console.dir(mesh)
            // mesh.visible = false

            if (intersects[0]) {

                // console.log('hover', 'object', 'material', intersects[0].object.material)
                // console.log('hover', 'object', 'material', intersects[0].object.material.wrapRGB)

                // intersects[0].object.visible = false
                // console.dir(world._engine._scene)
                console.log('hover', 'object', 'defaultAttributeValues', intersects[0].object.material.defaultAttributeValues)
                // intersects[0].object.material.defaultAttributeValues.color = [0, 0, 0]
                // intersects[0].object.material = null
                // console.log('hover', 'object', 'material.uniforms', intersects[0].object.material.uniforms)

                // intersects[0].object.material.opacity = 0
                // intersects[0].object.material.color.set('#000')

            }

            // intersects[0].object.material.transparent = true
            // intersects[0].object.material.color = 'red'
            // intersects[0].object.material.opacity = 0

            // intersects[0].object.material.needsUpdate = true

            // intersects[0].object.material.color = 'red'

            // intersects[0].object.material.setHex(0xff0000)
            // intersects[0].object.material.emissive.setHex( 0xff0000 );

            // world.terminate()

            // console.dir(intersects[0].object)
            // intersects[0].object.visible = false

            // console.dir(intersects[0].object.material.emissive)

            // layer._options.style.transparent = false
            // layer.hide();
            // console.dir(intersects)

            // let id = layer.feature.properties.NAME
            // var id = layer.feature.properties.ABBREV
            // let value = layer.feature.properties.OKATO

            console.log('hover', 'feature', 'NAME', layer.feature.properties.NAME)
            console.log('hover', 'feature', 'OKATO', layer.feature.properties.OKATO)

            // console.log(id + '!!!!!: ' + value, layer, point2d, point3d, intersects)
            // console.log(id + '!!!!!: ')

        })

    }

}).addTo(world)

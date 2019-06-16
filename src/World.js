import EventEmitter from './engine/EventEmitter';
import extend from 'lodash.assign';

import { point as Point } from './geo/Point';
import { latLon as LatLon } from './geo/LatLon';

import Geo from './geo/Geo';
import Engine from './engine/Engine';
import EnvironmentLayer from './layer/environment/EnvironmentLayer';
import Worker from './util/Worker';

/**
 * TODO: Make sure nothing is left behind
 * in the heap after calling destroy().
 */

/**
 * Pretty much any event someone using ViziCities
 * would need will be emitted or proxied by World (eg. render events, etc).
 */
class World extends EventEmitter {

    /**
     *
     */
    constructor( domId, options ) {

        console.log('Init', 'World');

        super()

        var defaults = {

            skybox: false,
            postProcessing: false,
            attribution: null,

        };

        this.options = extend( {}, defaults, options );

        this._layers = [];
        this._controls = [];

        this._initContainer( domId );
        this._initAttribution();
        this._initEngine();

        this._initEnvironment().then( () => {

            this._initEvents();

            this._pause = false;

            /**
             * Kick off the update and render loop.
             */
            this._update();

        } );

    }

    /**
     *
     */
    createWorkers( maxWorkers, workerScript ) {

        return Worker.createWorkers( maxWorkers, workerScript );

    }

    /**
     *
     */
    _initContainer( domId ) {

        this._container = document.getElementById( domId );

    }

    /**
     *
     */
    _initAttribution() {

        var message = [];

        if ( this.options.attribution ) {

            message.push( this.options.attribution );
            message.push( '<a id="show-attr" href="#">ГИС</a>' );

            var element = document.createElement( 'div' );
            element.classList.add( 'vizicities-attribution' );

            var additionalElem = document.createElement( 'div' );
            additionalElem.id = 'attribution-container';

            element.innerHTML = message.join( ' | ' );
            element.appendChild( additionalElem );

            this._container.appendChild( element );

            document.getElementById( 'show-attr' ).addEventListener( 'click', function (e) {

                e.currentTarget.parentNode.classList.toggle('is-visible');

            } );

        }

    }

    /**
     *
     */
    _initEngine() {

        this._engine = new Engine( this._container, this );

        // Engine events
        //
        // Consider proxying these through events on World for public access
        // this._engine.on('preRender', () => {});
        // this._engine.on('postRender', () => {});

    }

    /**
     *
     */
    _initEnvironment() {

        /**
         * Not sure if I want to keep this as a private API.
         *
         * Makes sense to allow others to customise their environment so perhaps
         * add some method of disable / overriding the environment settings.
         */
        this._environment = new EnvironmentLayer( {

            skybox: this.options.skybox,

        } );

        return this._environment.addTo( this );

    }

    /**
     *
     */
    _initEvents() {

        this.on( 'controlsMoveEnd', this._onControlsMoveEnd );

    }

    /**
     *
     */
    _onControlsMoveEnd( point ) {

        let _point = Point( point.x, point.z );
        this._resetView( this.pointToLatLon(_point), _point );

    }

    /**
     * Reset world view.
     */
    _resetView( latlon, point ) {

        this.emit( 'preResetView' );

        this._moveStart();
        this._move(latlon, point);
        this._moveEnd();

        this.emit( 'postResetView' );

    }

    /**
     *
     */
    _moveStart() {

        this.emit( 'moveStart' );

    }

    /**
     *
     */
    _move( latlon, point ) {

        this._lastPosition = latlon;
        this.emit( 'move', latlon, point );

    }

    /**
     *
     */
    _moveEnd() {

        this.emit( 'moveEnd' );

    }

    /**
     *
     */
    _update() {

        if ( this._pause ) {

            return;

        }

        let _delta = this._engine.clock.getDelta();

        /**
         * Once _update is called it will run forever, for now.
         */
        window.requestAnimationFrame( this._update.bind( this ) );

        /**
         * Update controls.
         *
         * TODO: Update controls.
         */
        // this._controls.forEach(controls => {
        //
        //     controls.update(delta)
        //
        // })

        this.emit( 'preUpdate', _delta );
        this._engine.update( _delta );
        this.emit( 'postUpdate', _delta );

    }

    /**
     *
     */
    _addAttribution( id, message ) {

        let _container = document.getElementById( 'attribution-container' );
        let _span = document.createElement( 'p' );

        _span.dataset.layer = id;
        _span.innerHTML = message;

        _container.appendChild( _span );

    }

    /**
     *
     */
    _removeAttribution( id ) {

        let _elem = document.querySelectorAll( '#attribution-container [data-layer="' + id + '"]' )[ 0 ];

        if ( _elem ) {

            _elem.remove();

        }

    }

    /**
     *  Set world view.
     */
    setView( latlon ) {

        /**
         * Store initial geographic coordinate for the [0,0,0] world position.
         *
         * The origin point doesn't move in three.js / 3D space so only set it once
         * here instead of every time _resetView is called.
         *
         * If it was updated every time then coorindates would shift over time and
         * would be out of place / context with previously-placed points (0, 0) would
         * refer to a different point each time.
         */
        this._originLatlon = latlon;
        this._originPoint = this.project( latlon );

        this._resetView( latlon );
        return this;

    }

    /**
     *  Return world geographic position.
     */
    getPosition() {

        return this._lastPosition;

    }

    /**
     * Transform geographic coordinate to world point.
     *
     * This doesn't take into account the origin offset.
     *
     * For example, this takes a geographic coordinate and returns a point
     * relative to the origin point of the projection (not the world).
     */
    project( latlon ) {

        return Geo.latLonToPoint( LatLon( latlon ) );

    }

    /**
     * Transform world point to geographic coordinate.
     *
     * This doesn't take into account the origin offset.
     *
     * For example, this takes a point relative to the origin point of the
     * projection (not the world) and returns a geographic coordinate.
     */
    unproject( point ) {

        return Geo.pointToLatLon( Point( point ) );

    }

    /**
     * Takes into account the origin offset.
     *
     * For example, this takes a geographic coordinate and returns a point
     * relative to the three.js / 3D origin (0, 0).
     */
    latLonToPoint( latlon ) {

        let _projectedPoint = this.project( LatLon( latlon ) );
        return _projectedPoint._subtract( this._originPoint );

    }

    /**
     * Takes into account the origin offset.
     *
     * For example, this takes a point relative to the three.js / 3D origin (0, 0)
     * and returns the exact geographic coordinate at that point.
     */
    pointToLatLon( point ) {

        let _projectedPoint = Point( point ).add( this._originPoint );
        return this.unproject( _projectedPoint );

    }

    /**
     *  Return pointscale for a given geographic coordinate.
     */
    pointScale( latlon, accurate ) {

        return Geo.pointScale( latlon, accurate );

    }

    /**
     * Convert from real meters to world units.
     *
     * TODO: Would be nice not to have to pass in a pointscale here.
     */
    metresToWorld( metres, pointScale, zoom ) {

        return Geo.metresToWorld( metres, pointScale, zoom );

    }

    /**
     * Convert from world units to real meters.
     *
     * TODO: Would be nice not to have to pass in a pointscale here.
     */
    worldToMetres( worldUnits, pointScale, zoom ) {

        return Geo.worldToMetres( worldUnits, pointScale, zoom );

    }

    /**
     * Unsure if it's a good idea to expose this here for components like
     * GridLayer to use (eg. to keep track of a frustum).
     */
    getCamera() {

        return this._engine._camera;

    }

    /**
     *
     */
    addLayer( layer ) {

        /**
         * Is is right to assume that there will always be some other layer
         * managing layers with output set to false?
         */
        this._layers.push( layer );

        if ( layer.isOutput() && layer.isOutputToScene() ) {

            /**
             *  Could move this into Layer but
             *  it'll do here for now.
             */
            this._engine._scene.add( layer._object3D );
            this._engine._domScene3D.add( layer._domObject3D );
            this._engine._domScene2D.add( layer._domObject2D );

        }

        return new Promise( ( resolve, reject ) => {

            layer._addToWorld( this ).then( () => {

                // if ( layer._options.attribution ) {
                //
                //     this._addAttribution( layer._options.id, layer._options.attribution );
                //
                // }

                if ( this.options.attribution ) {

                    this._addAttribution( layer._options.id, this.options.attribution );

                }

                /**
                 * TODO: Consider moving this so it doesn't fire for layers that are
                 * actually managed by a parent layer (eg. tiles).
                 */
                this.emit( 'layerAdded', layer );

                resolve( this );

            } ).catch( reject );

        } )

    }

    /**
     *  Remove layer from world and scene
     *  but don't destroy it entirely
     */
    removeLayer( layer ) {

        let _layerIndex = this._layers.indexOf( layer );

        if ( _layerIndex > -1 ) {

            this._layers.splice( _layerIndex, 1 );

        }

        if ( layer._options.attribution ) {

            this._removeAttribution(layer._options.id);

        }

        if ( layer.isOutput() && layer.isOutputToScene() ) {

            this._engine._scene.remove( layer._object3D );
            this._engine._domScene3D.remove( layer._domObject3D );
            this._engine._domScene2D.remove( layer._domObject2D );

        }

        this.emit( 'layerRemoved' );

        return Promise.resolve( this );

    }

    /**
     *
     */
    addControls( controls ) {

        controls._addToWorld( this );

        this._controls.push( controls );

        this.emit( 'controlsAdded', controls );

        return Promise.resolve( this );

    }

    /**
     *  Remove controls from world
     *  but don't destroy them entirely
     */
    removeControls( controls ) {

        let _controlsIndex = this._controls.indexOf( controls );

        if ( _controlsIndex > -1 ) {

            this._controls.splice( _controlsIndex, 1 );

        }

        this.emit( 'controlsRemoved', controls );

        return Promise.resolve( this );

    }

    /**
     *
     */
    stop() {

        this._pause = true;

    }

    /**
     *
     */
    start() {

        this._pause = false;
        this._update();

    }

    /**
     *
     */
    // debug () {
    //
    //     // // Remove listeners
    //     // this.off('controlsMoveEnd', this._onControlsMoveEnd)
    //     //
    //     // console.log('destroy', 'this._controls.length', this._controls.length)
    //     // console.log('destroy', 'this._controls', this._controls)
    //     //
    //     // this._controls.forEach(controls => {
    //     //
    //     //     this.removeControls(controls)
    //     //
    //     //     // Destroys (disposes) the controls
    //     //     // and removes them from memory
    //     //     controls.destroy()
    //     //
    //     // })
    //     //
    //     // console.log('destroy', 'this._controls', this._controls)
    //     // console.log('destroy', 'this._controls.length', this._controls.length)
    //
    //     // -------------------------------------------------------------------------
    //     // -------------------------------------------------------------------------
    //     // -------------------------------------------------------------------------
    //
    //     // console.log('destroy', 'this._layers.length', this._layers.length)
    //     // console.log('destroy', 'this._layers', this._layers)
    //
    //     // // Remove all layers
    //     // this._layers.forEach(layer => {
    //     //
    //     //     this.removeLayer(layer)
    //     //
    //     //     // Destroys (disposes) the controls
    //     //     // and removes them from memory
    //     //     layer.destroy()
    //     //
    //     // })
    //     //
    //     // console.log('destroy', 'this._layers.length', this._layers.length)
    //     // console.log('destroy', 'this._layers', this._layers)
    //
    //     // -------------------------------------------------------------------------
    //     // -------------------------------------------------------------------------
    //     // -------------------------------------------------------------------------
    //
    //     // console.dir(this._container)
    //
    // }

    /**
     *  Destroys the world(!) and removes it
     *  from the scene and memory.
     *
     *  TODO: World out why so much three.js
     *  stuff is left in the heap after this
     */
    destroy() {

        this.stop();

        // Remove listeners
        this.off( 'controlsMoveEnd', this._onControlsMoveEnd );

        this._controls.forEach( controls => {

            this.removeControls( controls );

            /**
             *  Destroys (disposes) the controls
             *  and removes it from memory.
             */
            controls.destroy();

        } )

        /**
         *  Remove all layers.
         */
        this._layers.forEach( layer => {

            this.removeLayer( layer );

            /**
             *  Destroys (disposes) the layer
             *  and removes it from memory.
             */
            layer.destroy();

        } );

        /**
         *  Environment layer is removed with the other layers.
         */
        this._environment = null;

        this._engine.destroy();
        this._engine = null;

        /**
         *  Clean the container / remove the canvas.
         */
        while ( this._container.firstChild ) {

            this._container.removeChild( this._container.firstChild );

        }

        this._container = null;

    }

    /**
     *  Proxy to destroy().
     */
    terminate() {

        this.destroy();

    }

}

export default World;

var noNew = function ( domId, options ) {

    return new World( domId, options );

}

/**
 * Initialise without requiring new keyword.
 */
export { noNew as world };

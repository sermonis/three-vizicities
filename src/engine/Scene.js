import * as THREE from 'three';

/**
 * This can be imported from anywhere and will still reference the same scene,
 * though there is a helper reference in Engine.scene.
 */
export default ( function () {

    var scene = new THREE.Scene();

    /**
     * TODO: Re-enable when this works with the skybox.
     * TODO: Move fog to somewere else engine / world.
     * TODO: Make fog settings optional.
     */
    scene.fog = new THREE.Fog( 0xffffff, 1, 45000 );
    return scene;

} )();

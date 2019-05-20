var Visual = ( function() {
    var settings = {
        speed: 1.0,
        totalBubbles: 10,
        resolution: 60,
        isolation: 60,
        scale: 700,

        colorDuration: 4000,

        mouseRotation: 60
    }

    var selector = {}

    var state = {
        shotIndex: 0,
        mouse: {
            x: 0,
            y: 0
        }
    }

    var colors = [
        // red
        [
            [235,50,50],
            [230,200,140],
        ],
        // purple
        [
            [165,50,235],
            [230,145,200]
        ],
        // green
        [
            [230,235,50],
            [170,230,145]
        ],
        // blue
        [
            [50,235,215],
            [150,170,225]
        ]
    ]

    var rotations = [
        [
            THREE.Math.degToRad( 0 ),
            THREE.Math.degToRad( 45 ),
            THREE.Math.degToRad( 0 ),
        ],
        [
            THREE.Math.degToRad( 60 ),
            THREE.Math.degToRad( 135 ),
            THREE.Math.degToRad( 0 ),
        ],
        [
            THREE.Math.degToRad( -15 ),
            THREE.Math.degToRad( 15 ),
            THREE.Math.degToRad( 0 ),
        ],
        [
            THREE.Math.degToRad( 15 ),
            THREE.Math.degToRad( -45 ),
            THREE.Math.degToRad( 0 ),
        ],
    ]

    var scales = [
        1,
        2,
        1.25,
        1.5
    ]

    var CAMERA;
    var SCENE;
    var RENDERER;
    var GROUP;
    var BUBBLES;
    var COMPOSER;
    var GRADIENTMAP;
    var NOISEPASS;

    var LINE;

    var time = 0;
    var timer;
  var clock = new THREE.Clock();
    var gradientTexture;

    var init = function() {
        setupScene();

        bindEvents();

        tick();
    }

    var bindEvents = function() {
        $( window )
            .on( 'resize', function() {
                onResize();
            } )
            .on( 'mousemove', function( event ) {
                state.mouse.x = ( 2 * ( 0.5 - ( event.clientX / window.innerWidth ) ) );
                state.mouse.y = ( 2 * ( 0.5 - ( event.clientY / window.innerHeight ) ) );
            } );

        $( document )
            .on( 'click', 'canvas', function() {
                cut();
            } );
    }

    var onResize = function() {
        if( RENDERER ) {
            RENDERER.setSize( window.innerWidth, window.innerHeight );
        }

        if( COMPOSER ) {
            COMPOSER.setSize( window.innerWidth, window.innerHeight );
        }

        if( CAMERA ) {
            CAMERA.aspect = ( window.innerWidth / window.innerHeight );
      CAMERA.updateProjectionMatrix();
        }
    }

    var setupScene = function() {
        // CAMERA
        CAMERA = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        CAMERA.position.set( 0, 0, 1500 );
        CAMERA.lookAt( 0,0,0 );

        // SCENE
        SCENE = new THREE.Scene();
        SCENE.background = new THREE.Color( 0xaaaaaa );
        SCENE.background = new THREE.Color( 0x000000 );

        // LIGHTS
        pointLight = new THREE.PointLight( 0xffffff );
        pointLight.position.set( 0, 0, 1000 );
        SCENE.add( pointLight );

        ambientLight = new THREE.AmbientLight( 0x080808 );
        SCENE.add( ambientLight );

        // Matcap
        var loader = new THREE.TextureLoader();
        var matcap = loader.load( 'matcap.png', function () {
      matcap.encoding = THREE.sRGBEncoding;
        } );


        // MARCHING CUBES
        material = new THREE.MeshMatcapMaterial( {
            matcap: matcap,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0,
            // depthWrite: true,
            // flatShading: false,
        } );

        BUBBLES = new THREE.MarchingCubes( settings.resolution, material, true, true );
        BUBBLES.position.set( 0, 0, 0 );

        BUBBLES.scale.set(
            settings.scale * scales[0],
            settings.scale * scales[0],
            settings.scale * scales[0]
        );

        BUBBLES.rotation.set(
            rotations[0][0],
            rotations[0][1],
            rotations[0][2]
        );

        BUBBLES.enableUvs = false;
        BUBBLES.enableColors = false;
        BUBBLES.isolation = settings.isolation;


        GROUP = new THREE.Group();

        GROUP.add( BUBBLES );

        SCENE.add( GROUP );


        // RENDERER
        RENDERER = new THREE.WebGLRenderer( {
            antialias: true
        } );
        RENDERER.setPixelRatio( window.devicePixelRatio );
        RENDERER.setPixelRatio( 1 );
        RENDERER.setSize( window.innerWidth, window.innerHeight );

        RENDERER.gammaInput = true;
        RENDERER.gammaOutput = true;
        RENDERER.setClearColor( 0xffffff, 1.0 );
        // RENDERER.autoClear = false;

        $( 'body' ).append( $( RENDERER.domElement ) );

        // COMPOSER
/*
        COMPOSER = new THREE.EffectComposer( RENDERER );
        COMPOSER.setSize( window.innerWidth, window.innerHeight );

        COMPOSER.addPass( new THREE.RenderPass( SCENE, CAMERA ) );

        // NOISE PASS
        var vertShader = document.getElementById( 'noise--vertexShader' ).textContent;
        var fragShader = document.getElementById( 'noise--fragmentShader' ).textContent;
        var counter = 0.0;
        var noise = {
            uniforms: {
                tDiffuse: { value: null },
                amount: {
                    type: 'f',
                    value: 100.0
                },
                strength: {
                    type: 'f',
                    value: 0.05
                },
                uMouse: {
                    type: 'v2',
                    value: state.mouse
                }
          },
          vertexShader: vertShader,
          fragmentShader: fragShader
        }

        NOISEPASS = new THREE.ShaderPass( noise );
        NOISEPASS.renderToScreen = true;
        COMPOSER.addPass( NOISEPASS );
*/
        // var copyShader = new THREE.ShaderPass( THREE.CopyShader );
        // copyShader.renderToScreen = true;
        // COMPOSER.addPass( copyShader );

        timer = setTimeout( function() {
            cut();
        }, settings.colorDuration );
    }

    var cut = function() {
        state.shotIndex = ( state.shotIndex < colors.length - 1 ) ? state.shotIndex + 1 : 0;

        // color
        // GRADIENTMAP.uniforms.color1.value = colors[state.shotIndex][0];
        // GRADIENTMAP.uniforms.color2.value = colors[state.shotIndex][1];

        // rotation
        BUBBLES.rotation.set(
            rotations[state.shotIndex][0],
            rotations[state.shotIndex][1],
            rotations[state.shotIndex][2]
        );

        // scale
        BUBBLES.scale.set(
            settings.scale * scales[state.shotIndex],
            settings.scale * scales[state.shotIndex],
            settings.scale * scales[state.shotIndex]
        );

        if( timer ) {
            clearTimeout( timer );
        }

        timer = setTimeout( function() {
            cut();
        }, settings.colorDuration );
    }

    var updateBubbles = function( time, mousePosition ) {

        BUBBLES.reset();

        // fill the field with some metaballs
        var i, ballx, bally, ballz, subtract, strength;

        subtract = 10;
        for( i = 0; i < settings.totalBubbles; i ++ ) {
            strength = 0.5 + ( 2 * i / settings.totalBubbles );

            ballx = Math.sin( i + 0.26 * time * ( 1.0 + 0.5 * Math.cos( 0.001 * i ) ) ) * 0.27 + 0.5;
            bally = Math.abs( Math.cos( i + 1.12 * time * Math.cos( 2.0 + 0.1424 * i ) ) ) * 0.77; // dip into the floor
            ballz = Math.cos( i + 1.32 * time * 0.9 * Math.sin( ( 0.92 + 0.53 * i ) ) ) * 0.7 + 0.1;

            BUBBLES.addBall( ballx, bally, ballz, strength, subtract );

            if( i === 0 ) {
                // console.log( 'ball', ballx, bally, ballz );
            }
        }

        BUBBLES.addPlaneY( 10, 16 );
    }

    var tick = function() {
        requestAnimationFrame( function() {
            tick();
        } );

        render();
    }

    var _vec = new THREE.Vector3();
    var _pos = new THREE.Vector3();
    var render = function() {
        var delta = clock.getDelta();

        time += delta * settings.speed * 0.3;

        // calculate mouse position
        _vec.set(
            state.mouse.x,
            -1 * state.mouse.y,
            0.5
        );

        _vec.unproject( CAMERA );
        _vec.sub( CAMERA.position ).normalize();
        // targetZ : 0
        _pos.copy( CAMERA.position ).add( _vec.multiplyScalar( ( 0 - CAMERA.position.z ) / _vec.z ) );


        updateBubbles( time, _pos );

        // NOISEPASS.uniforms['amount'].value = NOISEPASS.uniforms['amount'].value + 0.001;
        // NOISEPASS.uniforms['uMouse'].value = state.mouse;

        BUBBLES.rotation.y = state.mouse.x * THREE.Math.degToRad( 60 );
        BUBBLES.rotation.x = ( state.mouse.y + 0.5 ) * THREE.Math.degToRad( 30 );

        RENDERER.clear();
        RENDERER.render( SCENE, CAMERA );
        // COMPOSER.render();
    }

    return {
        init: function() { init() }
    }

} )();


$( function() {
    Visual.init();
} );




var gradient = 'data:image/png;base64,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';



var gradient2 = 'data:image/png;base64,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';

var gradient3 = 'data:image/png;base64,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';

var gradient4 = 'data:image/png;base64,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';

var gradient5 = 'data:image/png;base64,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';

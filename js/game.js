function Game(spec){
	var {
	} = spec;

    var gameElement = document.getElementById("game");

    // Pixi stuff

    var renderer = PIXI.autoDetectRenderer(document.clientWidth, document.clientHeight);
    document.getElementById("game").appendChild(renderer.view);
    var scene = new PIXI.Container();
    scene.interactive = true;
    scene.interactiveChildre = false;

    renderer.backgroundColor = 0xFFFFFF;
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.autoResize = true;
    renderer.resize(window.innerWidth, window.innerHeight);
    renderer.autoResize = true;

    var interaction = renderer.plugins.interaction;

    var pixi = {
        scene,
        renderer,
        interaction,
        TextureCache: PIXI.utils.TextureCache,
        loader: PIXI.loader,
        resources: PIXI.loader.resources,
        Sprite: PIXI.Sprite,
        Container: PIXI.Container,
    }

    var zoom = 12;

    let x = parseInt(window.innerWidth)/2;
    let y = parseInt(window.innerHeight)/2;
    let w = Math.min(x, y)/zoom;
    let h = Math.min(x, y)/zoom;

    console.log("xywh: %s, %s, %s, %s", x, y, w, h);

    var aspect = x/y;

    var boundary = {
    	x: zoom*aspect,
    	y: zoom,
        zoom,
    	aspect,
    }

    var worldToScreen = Transform({x, y, w, h});

    var time = 0;
    var timeDelta;
    var drawTime = 0;

    var FPS = 60;
    var timerId = 0;
    var animationTimestamp = 0;
    var redraw = true;

    var start = function(){
        timeDelta = 1/FPS;
        timerId = setInterval(function() {
          update();
        }, 1000/FPS);

        update();
        window.requestAnimationFrame(step);
    }

    var step = function(timestamp) {
        if (redraw) {
            renderer.render(scene);
            redraw = false;
        }
        animationTimestamp = timestamp;
        window.requestAnimationFrame(step);
    }

    var update = function() {
        time = time+timeDelta;
        population.update(time, timeDelta);
        redraw = true;
    }

    var reset = function(){
        publish("/reset");
        // publish("/sim/state", [false]);
    }

    var setZoom = function(ZOOM){
        zoom = ZOOM;

        w = Math.min(x, y)/zoom;
        h = Math.min(x, y)/zoom;

        worldToScreen.setWH(w, h);

        boundary.x = zoom*aspect;
        boundary.y = zoom;
        boundary.zoom = zoom;
        boundary.aspect = aspect;
    }

    var getPathogenSpec = function(){
        return {
            pixi,

            incubationTransmission: 0.2,
            incubationDuration: 1,

            symptomaticTransmission: 0.5,
            symptomaticDuration: 3,

            afterglowTransmission: 0.2,
            afterglowDuration: 1,
        }
    }

    var onMouseDown = function(event){
        population.onPointerDown(event);
    }

    var onMouseUp = function(event){
    }

    var onMouseMove = function(event){
    }

    var onTouchStart = function(event){
        event.preventDefault();
        var touch = event.touches[0];

        var mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        gameElement.dispatchEvent(mouseEvent);
    }

    var onTouchEnd = function(event){
        var mouseEvent = new MouseEvent("mouseup");
        gameElement.dispatchEvent(mouseEvent);
    }

    var onTouchMove = function(event){
        event.preventDefault();
        var touch = event.touches[0];

        var mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        gameElement.dispatchEvent(mouseEvent);
    }

    var onTouchCancel = function(event){
        var mouseEvent = new MouseEvent("mouseup");
        gameElement.dispatchEvent(mouseEvent);
    }

    var onPopulationSliderChange = function(){
        var p = parseInt(populationSlider.value);
        p = Math.pow(2, p);

        setZoom(Math.sqrt(p)/2+4);

        population.setAgentCount(0);
        population.setAgentCount(p);

        reset();
    }

    var onImmunitySliderChange = function(){
        var i = immunitySlider.value/immunitySlider.max;

        population.setImmunity(i);
    }

    var populationSlider = document.getElementById("populationSlider");
    populationSlider.addEventListener("change", onPopulationSliderChange);
    populationSlider.min = 1;
    populationSlider.max = 10;
    populationSlider.step = 1;
    populationSlider.value = 10;

    var immunitySlider = document.getElementById("immunitySlider");
    immunitySlider.addEventListener("change", onImmunitySliderChange);
    immunitySlider.min = 0;
    immunitySlider.max = 256;
    immunitySlider.step = 1;
    immunitySlider.value = 0;
    
    var emissionSlider = document.getElementById("emissionSlider");
    emissionSlider.min = 0;
    emissionSlider.max = 0.05;
    emissionSlider.step = 0.0025;
    emissionSlider.value = 0.01;

    var mortalitySlider = document.getElementById("mortalitySlider");
    mortalitySlider.min = 0;
    mortalitySlider.max = 1;
    mortalitySlider.step = 0.05;
    mortalitySlider.value = 0.1;

    var survivalDurationSlider = document.getElementById("survivalDurationSlider");
    survivalDurationSlider.min = 1;
    survivalDurationSlider.max = 10;
    survivalDurationSlider.step = 1;
    survivalDurationSlider.value = 5;

    var infectionDurationSlider = document.getElementById("infectionDurationSlider");
    infectionDurationSlider.min = 1;
    infectionDurationSlider.max = 10;
    infectionDurationSlider.step = 1;
    infectionDurationSlider.value = 5;

    var resistanceDurationSlider = document.getElementById("resistanceDurationSlider");
    resistanceDurationSlider.min = 1;
    resistanceDurationSlider.max = 10;
    resistanceDurationSlider.step = 1;
    resistanceDurationSlider.value = 5;

    var mobilitySlider = document.getElementById("mobilitySlider");
    mobilitySlider.min = 0;
    mobilitySlider.max = 1;
    mobilitySlider.step = 1;
    mobilitySlider.value = 5;


    var sliders = {
        populationSlider,
        immunitySlider,

        emissionSlider,
        mortalitySlider,
        mobilitySlider,
        survivalDurationSlider,
        infectionDurationSlider,
        resistanceDurationSlider,
    }

    gameElement.addEventListener("mousedown", onMouseDown, false);
    gameElement.addEventListener("mouseup", onMouseUp, false);
    gameElement.addEventListener("mousemove", onMouseMove, false);

    gameElement.addEventListener("touchstart", onTouchStart, false);
    gameElement.addEventListener("touchend", onTouchEnd, false);
    gameElement.addEventListener("touchcancel", onTouchCancel, false);
    gameElement.addEventListener("touchmove", onTouchMove, false);

    var population = Population({
        pixi,
        boundary,
        worldToScreen,
        agentCount: 32,
        sliders,
    });

    onPopulationSliderChange();
    onImmunitySliderChange();

    start();

	return Object.freeze({
        reset,
	});
}
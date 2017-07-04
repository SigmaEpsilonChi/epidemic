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

    var FPS = 30;
    var timerId = 0;
    var animationTimestamp = 0;
    var redraw = true;

    var gizmos = new PIXI.Graphics();
    // scene.addChild(gizmos);

    var statTimer = 0;
    var statInterval = 1;
    var statSamples = 30;

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

        statTimer += statInterval*timeDelta;

        if (statTimer >= statInterval) {
            while (stats.values.length < statSamples) stats = population.getStats(statSamples);
            while (statTimer >= statInterval) {
                stats = population.getStats(statSamples);
                statTimer -= statInterval;
            }
            /*
            var cx = d3.scaleLinear()
                .domain([0, stats.length - 1])
                .range([0, width]);

            var cy = d3.scaleLinear()
                .domain([d3.min(layers0, stackMin), d3.max(layers0, stackMax)])
                .range([height, 0]);

            var z = d3.interpolateCool;
            */

            var stack = d3.stack()
                .keys(stats.colors)
                .offset(d3.stackOffsetExpand)(stats.values);

            var paths = chart.selectAll("path")
                .data(stack);

            var area = d3.area()
                .x(function(d, i) { return cx(i); })
                .y0(function(d) { return cy(d[0]); })
                .y1(function(d) { return cy(d[1]); });

            paths.attr("class", "update");
            paths.enter().append("path")
                .attr("d", area)
                .attr("fill", function(d, i) { return stats.colors[i]; })
                .merge(paths)
                    .attr("d", area)
                    .attr("fill", function(d, i) { return stats.colors[i]});

            paths.exit().remove();
            /*

            var columns = chart.selectAll("g")
                .data(stack);
            columns.attr("class", "update");

            columns.enter().append("g")
                .attr("class", "enter")
                .attr("width", width/30)
                .attr("height", height)
                .attr("transform", function(d, i){return "translate(" + i*width/30 + ", 0)";});

            var rows = columns.selectAll("rect")
                .data(function(d){return d;})
                .enter().append("rect")
                    .attr("width", width/30)
                    // .attr("height", function(d){return cy(d);})
                    .attr("fill", function(d, i, g) { return z(i/4)});
                    // .attr("y", function(d, i, g) { return cy(g[1]); })
                    // .attr("height", function(d, i, g) { return cy(g[0]) - cy(g[1]); });
            // columns.exit.remove();
            */
        }

        /*
        stats = population.getStats();
        layers0 = stack(stats);


        cx = d3.scaleLinear()
            .domain([0, stats.length - 1])
            .range([0, width]);

        cy = d3.scaleLinear()
            .domain([d3.min(layers0, stackMin), d3.max(layers0, stackMax)])
            .range([height, 0]);

        z = d3.interpolateCool;

        area = d3.area()
            .x(function(d, i) { return cx(i); })
            .y0(function(d) { return cy(d[0]); })
            .y1(function(d) { return cy(d[1]); });
        */

        /*
        svg.selectAll("path")
          .data(layers0)
          .enter().append("path")
            .attr("d", area)
            .attr("fill", function() { return z(Math.random()); });
        */

        // layers0 = stack(d3.range(n).map(function() { return bumps(m, k); }));
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

        gizmos.clear();
        gizmos.lineStyle(4, 0xFF0000, 1);
        let x0 = worldToScreen.transformX(-boundary.x);
        let x1 = worldToScreen.transformX(boundary.x);
        let y0 = worldToScreen.transformY(-boundary.y);
        let y1 = worldToScreen.transformY(boundary.y);
        gizmos.moveTo(x0, y0);
        gizmos.lineTo(x0, y1);
        gizmos.lineTo(x1, y1);
        gizmos.lineTo(x1, y0);
        gizmos.lineTo(x0, y0);
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

        setZoom(Math.sqrt(p)/3+1);

        // reset();

        population.setAgentCount(0);
        population.setAgentCount(p);

        // reset();
    }

    var onImmunitySliderChange = function(){
        var i = immunitySlider.value/immunitySlider.max;

        population.setImmunity(i);
    }

    var onMobilitySliderChange = function(){
        population.setMobility(mobilitySlider.value);
    }

    var populationSlider = document.getElementById("populationSlider");
    populationSlider.addEventListener("change", onPopulationSliderChange);
    populationSlider.min = 1;
    populationSlider.max = 11;
    populationSlider.step = 1;
    populationSlider.value = 11;

    var immunitySlider = document.getElementById("immunitySlider");
    immunitySlider.addEventListener("change", onImmunitySliderChange);
    immunitySlider.min = 0;
    immunitySlider.max = 256;
    immunitySlider.step = 1;
    immunitySlider.value = 0;

    var mobilitySlider = document.getElementById("mobilitySlider");
    mobilitySlider.addEventListener("change", onMobilitySliderChange);
    mobilitySlider.min = 0;
    mobilitySlider.max = 6;
    mobilitySlider.step = 1;
    mobilitySlider.value = 3;
    
    var emissionSlider = document.getElementById("emissionSlider");
    emissionSlider.min = 0;
    emissionSlider.max = 0.03;
    emissionSlider.step = 0.0025;
    emissionSlider.value = 0.01;

    var mortalitySlider = document.getElementById("mortalitySlider");
    mortalitySlider.min = 0;
    mortalitySlider.max = 1;
    mortalitySlider.step = 0.05;
    mortalitySlider.value = 0;

    var survivalDurationSlider = document.getElementById("survivalDurationSlider");
    survivalDurationSlider.min = 1;
    survivalDurationSlider.max = 11;
    survivalDurationSlider.step = 1;
    survivalDurationSlider.value = 6;

    var infectionDurationSlider = document.getElementById("infectionDurationSlider");
    infectionDurationSlider.min = 1;
    infectionDurationSlider.max = 11;
    infectionDurationSlider.step = 1;
    infectionDurationSlider.value = 6;

    var resistanceDurationSlider = document.getElementById("resistanceDurationSlider");
    resistanceDurationSlider.min = 0;
    resistanceDurationSlider.max = 1;
    resistanceDurationSlider.step = 0.1;
    resistanceDurationSlider.value = 0.5;

    var paralysisSlider = document.getElementById("paralysisSlider");
    paralysisSlider.min = 0;
    paralysisSlider.max = 0.8;
    paralysisSlider.step = 0.1;
    paralysisSlider.value = 0.4;

    var colors = [
        "rgb(16, 16, 16)",
        "rgb(234, 192, 32)",
        "rgb(32, 192, 234)",
        "rgb(212, 212, 220)",
        "rgb(230, 230, 230)",
    ];

    var sliders = {
        populationSlider,
        immunitySlider,
        mobilitySlider,

        emissionSlider,
        mortalitySlider,
        paralysisSlider,
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
    onMobilitySliderChange();

    var z = d3.interpolateCool;
    var stats = population.getStats();

    var width = 480;
    var height = 160;

    var chart = d3.select(".chart");
    chart.attr("width", width);
    chart.attr("height", height);
    var cx = d3.scaleLinear()
        .domain([0, statSamples-1])
        .range([0, width]);

    var cy = d3.scaleLinear()
        .domain([0, 1])
        .range([0, height]);
    /*
    */

        
    function stackMax(layer) {
      return d3.max(layer, function(d) { return d[1]; });
    }

    function stackMin(layer) {
      return d3.min(layer, function(d) { return d[0]; });
    }
    
    /*
    var n = 3, // number of layers
        m = 200, // number of samples per layer
        k = 10; // number of bumps per layer

    var stack = d3.stack().keys(d3.range(stats[0].length)).offset(d3.stackOffsetExpand),
        layers0 = stack(stats);
        // layers0 = stack(d3.transpose(d3.range(n).map(function() { return bumps(m, k); }))),

    var svg = d3.select(".chart"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var cx = d3.scaleLinear()
        .domain([0, stats.length - 1])
        .range([0, width]);

    var cy = d3.scaleLinear()
        .domain([d3.min(layers0, stackMin), d3.max(layers0, stackMax)])
        .range([height, 0]);

    var z = d3.interpolateCool;

    var area = d3.area()
        .x(function(d, i) { return cx(i); })
        .y0(function(d) { return cy(d[0]); })
        .y1(function(d) { return cy(d[1]); });

    svg.selectAll("path")
      .data(layers0)
      .enter().append("path")
        .attr("d", area)
        .attr("fill", function() { return z(Math.random()); });

    function stackMax(layer) {
      return d3.max(layer, function(d) { return d[1]; });
    }

    function stackMin(layer) {
      return d3.min(layer, function(d) { return d[0]; });
    }

    function transition() {
      var t;
      d3.selectAll("path")
        .data((t = layers1, layers1 = layers0, layers0 = t))
        .transition()
          .duration(2500)
          .attr("d", area);
    }

    // Inspired by Lee Byron’s test data generator.
    function bumps(n, m) {
      var a = [], i;
      for (i = 0; i < n; ++i) a[i] = 0;
      for (i = 0; i < m; ++i) bump(a, n);
      return a;
    }

    function bump(a, n) {
      var x = 1 / (0.1 + Math.random()),
          y = 2 * Math.random() - 0.5,
          z = 10 / (0.1 + Math.random());
      for (var i = 0; i < n; i++) {
        var w = (i / n - y) * z;
        a[i] += x * Math.exp(-w * w);
      }
    }
    */


    // START!
    start();

	return Object.freeze({
        reset,
	});
}
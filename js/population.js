function Population(spec){
	var {
		pixi,
		mainLayer,
		boundary,
		worldToScreen,
		sliders,
	} = spec;

	var agentCount = 0;
	var agents = [];

	var pathogens = [];
	var discardedPathogens = [];

    var seed = Math.random();
    // var seed = 0.7;

    var immunity = 0;

    noise.seed(seed);

    var uniforms = {
    	radius0: {
    		type: "f",
    		value: 1,
    	},
    	radius1: {
    		type: "f",
    		value: 1,
    	},
    }

   	var agentShader = new PIXI.Filter(
   		'',
   		// pixi.resources["gl/agent.vert"].data,
   		pixi.resources["gl/agent.frag"].data,
   		uniforms
   	);

    var start = function(){
    	var a = agentCount;
		setAgentCount(0);
		setAgentCount(a);
    }

    var update = function(time, timeDelta){
    	for (var i = 0; i < pathogens.length; i++) {
    		pathogens[i].update(time, timeDelta);
    	}
    	for (var i = 0; i < agents.length; i++) {
    		agents[i].update(time, timeDelta);
    	}
    	for (var i = 0; i < discardedPathogens.length; i++) {
    		removePathogen(discardedPathogens[i]);
    	}
    	discardedPathogens.length = 0;
    }

	var setAgentCount = function(AGENTCOUNT){
		if (agentCount != AGENTCOUNT) {
			clearPathogens();
			agentCount = AGENTCOUNT;

			seed = Math.random();
    		noise.seed(seed);

			while (agents.length < agentCount) {
				agents.push(Agent({
					pixi,
					boundary,
					worldToScreen,
					shader: agentShader,
					agentIndex: agents.length,
					immune: agents.length/agentCount < immunity,
				}));
			}
			while (agents.length > agentCount) {
				let agent = agents[agents.length-1];
				agents.splice(agents.indexOf(agent), 1);
				agent.destroy();
			}
		}
	}

	var setImmunity = function(IMMUNITY){
		if (immunity != IMMUNITY) {
			immunity = IMMUNITY;
			for (var i = 0; i < agents.length; i++) {
				agents[i].setImmune(i/agents.length < immunity);
			}
		}
	}

	var clearPathogens = function(){
		for (var i = 0; i < pathogens.length; i++) pathogens[i].destroy();
		discardedPathogens.length = 0;
		pathogens.length = 0;
	}

	var discardPathogen = function(pathogen){
		discardedPathogens.push(pathogen);
	}

	var addPathogen = function(pathogen = null){
		if (pathogen == null) {
			pathogen = Pathogen({
				pixi,
				worldToScreen,
				agents,
				addPathogen,
				discardPathogen,

				survivalDuration: sliders.survivalDurationSlider.value,
				infectionDuration: sliders.infectionDurationSlider.value,
				resistanceDuration: sliders.resistanceDurationSlider.value,
				
				mobility: sliders.mobilitySlider.value,
				mortality: sliders.mortalitySlider.value,
				emission: sliders.emissionSlider.value,
			});
		}
		pathogens.push(pathogen);
		return pathogen;
	}

	var removePathogen = function(pathogen){
		if (pathogens.includes(pathogen)) {
			// console.log("Removing pathogen "+pathogens.indexOf(pathogen));
			pathogens.splice(pathogens.indexOf(pathogen), 1);
			pathogen.destroy();
		}
	}

	var onPointerDown = function(e){
		var x = worldToScreen.untransformX(e.clientX);
		var y = worldToScreen.untransformY(e.clientY);

		console.log("Clicking population, x=%s, y=%s", x, y);

		var d = 0;
		var agent = null;
		for (var i = 0; i < agents.length; i++) {
			let a = agents[i];
			if (!a.getImmune() && !a.getPathogen()) {
				let s = sqrmagnitude(x-a.position.x, y-a.position.y);
				if (agent == null || s < d) {
					agent = a;
					d = s;
				}
			}
		}

		if (agent != null) {
			addPathogen().infect(agent);
		}
	}

	subscribe("/reset", clearPathogens);

	// pixi.interaction.on('pointerdown', onPointerDown);

	return {
		// Fields

		// Methods
		update,

		clearPathogens,

		setAgentCount,
		setImmunity,

		onPointerDown,
	}
}
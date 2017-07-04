function Population(spec){
	var {
		pixi,
		mainLayer,
		boundary,
		worldToScreen,
		sliders,
	} = spec;

	var agents = [];
	var agentCount = 0;
	var susceptibleAgents = [];

	var pathogens = [];
	var discardedPathogens = [];

    var seed = Math.random();
    // var seed = 0.7;

    var immunity = 0;
    var mobility = 0;

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

   	var genomes = [];

    var start = function(){
    	var a = agentCount;
		setAgentCount(0);
		setAgentCount(a);
    }

    var update = function(time, timeDelta){
		// console.log("susceptibleAgents Length: %s", susceptibleAgents.length);

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
			// console.log("BEGIN SETTING AGENT COUNT susceptibleAgents Length: %s", susceptibleAgents.length);
			
			clearPathogens();
			agentCount = AGENTCOUNT;

			// seed = Math.random();
    		// noise.seed(seed);

			while (agents.length < agentCount) {
				agents.push(Agent({
					pixi,
					boundary,
					worldToScreen,
					shader: agentShader,
					agentIndex: agents.length,
					immune: agents.length/agentCount < immunity,
					susceptibleAgents,
					mobility,
				}));
			}
			while (agents.length > agentCount) {
				// let agent = agents[agents.length-1];
				// agents.splice(agents.indexOf(agent), 1);
				// agent.destroy();
				agents.pop().destroy();
			}

			// console.log("END SETTING AGENT COUNT susceptibleAgents Length: %s", susceptibleAgents.length);
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

	var setMobility = function(MOBILITY){
		if (mobility != MOBILITY) {
			mobility = MOBILITY;
			for (var i = 0; i < agents.length; i++) {
				agents[i].setMobility(mobility);
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

	var addPathogen = function(rna){
		if (rna == null) rna = addRna();
		pathogen = Pathogen({
			pixi,
			worldToScreen,
			agents: susceptibleAgents,
			addPathogen,
			discardPathogen,

			survivalDuration: sliders.survivalDurationSlider.value,
			infectionDuration: sliders.infectionDurationSlider.value,
			resistanceDuration: 0,
			mutation: sliders.resistanceDurationSlider.value,

			paralysis: sliders.paralysisSlider.value,
			mortality: sliders.mortalitySlider.value,
			emission: sliders.emissionSlider.value,

			rna,
			addRna,
		});
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

	var values = [];
	var colors = [];
	var stats = {values, colors}

	var healthyRgb = "rgb(0, 0, 0)";
	var immuneRgb = "rgb(192, 192, 220)";
	var deadRgb = "rgb(255, 255, 255)";

	colors.push(deadRgb);
	colors.push(immuneRgb);
	colors.push(healthyRgb);

	var getStats = function(samples){
		// return [{a: 0, b: 1, c: 2, d: 3, e: 4}];
		var unusedColors = colors.slice();

		var s = {};
		s[deadRgb] = 0;
		s[immuneRgb] = 0;
		s[healthyRgb] = 0;

		unusedColors.splice(unusedColors.indexOf(healthyRgb), 1);
		unusedColors.splice(unusedColors.indexOf(immuneRgb), 1);
		unusedColors.splice(unusedColors.indexOf(deadRgb), 1);

		var rgb;
        for (var i = 0; i < agents.length; i++) {
        	rgb = agents[i].getRgbString();
        	if (!s[rgb]) {
        		// console.log("Pushing new color: %s", rgb);
        		// colors.push(rgb);
        		s[rgb] = 0;
        	}
        	if (!colors.includes(rgb)) colors.push(rgb);
        	s[rgb]++;
        }
		values.push(s);

		/*
		var hex;
		var rna;
		for (var i = 0; i < genomes.length; i++) {
			rna = genomes[i];
			hex = rna.getRgbString();
			s[hex] = rna.hosts.length;
			colors.push(rna.getRgbString());
		}
		*/

		// Trim out in-use colors to make list of unused colors
		for (var i = 0; i < values.length; i++) {
			let keys = Object.keys(values[i]);
			for (var j = 0; j < keys.length; j++) {
				if (unusedColors.includes(keys[j])) {
					unusedColors.splice(unusedColors.indexOf(keys[j]), 1);

				}
				// if (!colors.includes(keys[j])) {
					// colors.push(keys[j]);
				// }
			}
		}

		// Remove old, unused colors from color list
		for (var i = 0; i < unusedColors.length; i++) {
			colors.splice(colors.indexOf(unusedColors[i]), 1);
		}

		// Add empty values to any old samples that do not contain a newly-added color
		for (var i = 0; i < values.length; i++) {
			for (var j = 0; j < colors.length; j++) {
				if (!values[i][colors[j]]) values[i][colors[j]] = 0;
			}
		}

        // console.log("Reading %s states: "+Object.values(s), Object.values(s).length);
        // console.log("Reading %s colors: "+colors.toString(), colors.length);

		while (values.length > samples) values.shift();

		return stats;
		/*
		var s = [0, 0, 0, 0, 0];
		for (var i = 0; i < agents.length; i++) {
			s[agents[i].getState()]++;
		}
		stats.push(s);
		while (stats.length > samples) stats.shift();
		return stats;
		*/
		// var s = {healthy: 0, infected: 0, resistand: 0, immune: 0, dead: 0};
		// for (var i = 0; i < agents.length; i++) {
		// 	// s[Object.keys(s)[agents[i].getState()]]++;
		// }
		// stats.push(s);
	}

	var getAgentCount = function(){
		return agentCount;
	}

	var addRna = function(){
		var rna = Rna({
			removeRna,
		});
		console.log("Creating new RNA with signature "+rna.signature);
		genomes.push(rna);
		return rna;
	}

	var removeRna = function(rna){
		if (genomes.includes(rna)) {
			console.log("Removing RNA with signature "+rna.signature);
			genomes.splice(genomes.indexOf(rna), 1);

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
		setMobility,

		getAgentCount,

		onPointerDown,

		getStats,
	}
}
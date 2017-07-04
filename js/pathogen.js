function Pathogen(spec){
	var {
		pixi,
		worldToScreen,
		agents,
		addPathogen,
		discardPathogen,

		emission = 0.01,

		survivalDuration = 2,
		infectionDuration = 4,
		resistanceDuration = 16,

		mortality = 0,
		paralysis = 0.1,
		mutation = 0.1,

		addRna,
	} = spec;

	var survivalProgress = 0;
	var infectionProgress = 0;

	var position = {
		x: 0,
		y: 0,
	}

	var symptomatic = false;

	var incubationColor = "#AD2";
	var symptomaticColor = "#2C4";
	var afterglowFill = "#CC2";


	var radius = 0.2;

    var sprite = new pixi.Sprite(pixi.resources["res/agent.png"].texture);
    pixi.scene.addChild(sprite);

    sprite.tint = 0xFF0000;
	sprite.scale.set(0.5, 0.5);
	sprite.anchor.set(0.5, 0.5);

    var host = null;
    var emissionTimer = 0;

    var gauss = gaussian(0, paralysis);

	var update = function(time, timeDelta){
		if (!destroyed) {
			if (host == null) {
				// console.log("Updating hostless pathogen");
				survivalProgress = tickProgress(survivalProgress, survivalDuration, timeDelta);

				var x = worldToScreen.transformX(position.x);
				var y = worldToScreen.transformY(position.y);
				var r = worldToScreen.scaleX(radius);
				var p = 1-Math.pow(survivalProgress, 1);
				sprite.x = x;
				sprite.y = y;
				sprite.width = r*p;
				sprite.height = r*p;

				if (survivalProgress >= 1) {
					destroy();
				}
				else {
					// console.log("Checking %s agents", agents.length);
			    	for (var i = 0; i < agents.length; i++) {
			    		if (contact(agents[i])) break;
			    	}
				}
			}
			else {
				// console.log("Updating hosted pathogen: host=%s", host.agentIndex);
				emissionTimer += timeDelta;
				if (Math.random() < emissionTimer*emission) {
					emissionTimer = 0;
					emit();
				}

				infectionProgress = tickProgress(infectionProgress, infectionDuration, timeDelta);

				if (infectionProgress >= 1) {
					if (Math.random() < mortality) host.kill();
					else recover();
				}
			}
		}
	}

	// Check for contact with an agent and attempt to infect them
	var contact = function(agent){
		if (host != null) return false;
		// if (agent.hasAntibody(rna)) return false;
		// if (agent.getInfected()) return false;

		if (agent.overlap(position.x, position.y)) {
			if (agent.getInfected()) destroy();
			else if (agent.hasAntibody(rna)) destroy();
			else infect(agent);
			return true;
		}
		return false;
	}

	var infect = function(agent){
		if (host != agent) {
			if (agent.getInfected()) {
				console.log("Agent is already infected (Agent "+agent.agentIndex+")");
				return;
			}
		// console.log("Agent %s is infecting agent %s", host.agentIndex, agent.agentIndex);
			if (Math.random() < Math.pow(mutation/16, 2)) {
				setRna(addRna());
				// setRna(Rna((rna.signature+0.25+Math.random()/4)%1));
				console.log("Mutating to "+rna.signature);
			}
			host = agent;
			rna.addHost(host);
			pixi.scene.removeChild(sprite);
			agent.infect(self);
		}
	}

	var recover = function(){
		if (host != null) {
			// console.log("Pathogen recovering: Agent "+host.agentIndex);
			host.recover();
			host = null;
			destroy();
		}
	}

	var kill = function(){
		destroy();
	}

	var setRna = function(RNA){
		if (rna != RNA) {
			if (rna != null) rna.removePathogen(self);

			rna = RNA;

			rna.addPathogen(self);
			sprite.tint = rna.getHexValue();

		}
	}

	var getRna = function(){
		return rna;
	}

	var setPosition = function(x, y){
		position.x = x;
		position.y = y;
	}

	var emit = function(){
		/*
		var pathogen;
		if (Math.random() < Math.pow(mutation/15, 2)) {
			pathogen = addPathogen();
			console.log("Mutating to "+pathogen.getRna().signature);
		}
		else pathogen = addPathogen(rna);
		*/
		var pathogen = addPathogen(rna);
		var x = host.position.x;
		var y = host.position.y;
		var a = Math.random()*Math.PI*2;
		var r = Math.random();
		x += Math.cos(a)*r;
		y += Math.sin(a)*r;
		pathogen.setPosition(
			host.position.x,
			host.position.y
			// host.position.x+Math.sign(-host.direction.x)*(host.radius+0.01),
			// host.position.y+Math.sign(-host.direction.y)*(host.radius+0.01)
		);
	}

	var destroyed = false;
	var destroy = function(){
		if (!destroyed) {
			destroyed = true;
			// unsubscribe(destroy);
			if (host != null) {
				rna.removeHost(host);
				host.recover();
				host = null;
			}
			rna.removePathogen(self);
			discardPathogen(self);
			if (sprite.parent != null) sprite.parent.removeChild(sprite);
			sprite.destroy();
		}
	}

	var rna = null;
	setRna(spec.rna);

	var self = Object.freeze({
		// Fields
		position,
		resistanceDuration,
		paralysis,

		// Methods
		update,
		gauss,

		contact,
		infect,
		recover,
		kill,

		setPosition,

		setRna,
		getRna,

		destroy,
	});

	return self;
}
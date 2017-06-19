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
		mobility = 0.1,
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

    var gauss = gaussian(0, mobility);

	var update = function(time, timeDelta){
		if (host == null) {
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
				kill();
			}
			else {
		    	for (var i = 0; i < agents.length; i++) {
		    		contact(agents[i]);
		    	}
			}
		}
		else {
			emissionTimer += timeDelta;
			if (Math.random() < emissionTimer*emission) {
				emissionTimer = 0;
				emit();
			}

			infectionProgress = tickProgress(infectionProgress, infectionDuration, timeDelta);

			if (infectionProgress >= 1) recover();
		}
	}

	var getMobility = function(){
		return mobility;
	}

	// Check for contact with an agent and attempt to infect them
	var contact = function(agent){
		if (host != null) return false;
		if (agent.getPathogen() != null) return false;
		if (agent.getImmune()) return false;

		if (agent.overlap(position.x, position.y)) {
			if (agent.getImmune()) destroy();
			else {
				infect(agent);
				return true;
			}
		}
		return false;
	}

	var infect = function(agent){
		// console.log("Agent %s is infecting agent %s", host.agentIndex, agent.agentIndex);
		pixi.scene.removeChild(sprite);
		host = agent;
		agent.infect(self);
	}

	var recover = function(){
		if (host != null) {
			host.recover();
			host = null;
			destroy();
		}
	}

	var kill = function(){
		destroy();
	}

	var setPosition = function(x, y){
		position.x = x;
		position.y = y;
	}

	var emit = function(){
		var pathogen = addPathogen();
		// var pathogen = addPathogen(Pathogen(spec));
		var x = host.position.x;
		var y = host.position.y;
		var a = Math.random()*Math.PI*2;
		var r = Math.random();
		x += Math.cos(a)*r;
		y += Math.sin(a)*r;
		pathogen.setPosition(host.position.x, host.position.y);
	}

	var destroyed = false;
	var destroy = function(){
		if (!destroyed) {
			destroyed = true;
			// console.log("Destroying pathogen");
			if (host != null) host.recover();
			unsubscribe(destroy);
			discardPathogen(self);
			if (sprite.parent != null) sprite.parent.removeChild(sprite);
			sprite.destroy();
		}
	}

	var self = Object.freeze({
		// Fields
		position,
		resistanceDuration,

		// Methods
		update,
		gauss,
		
		contact,
		infect,
		recover,
		kill,

		setPosition,

		getMobility,

		destroy,
	});

	return self;
}
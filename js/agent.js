function Agent(spec){
	var {
		pixi,
		layer,
		boundary,
		worldToScreen,
		shader,
		agentIndex,
		susceptibleAgents,
	} = spec;

	var origin = {
		x: 0,
		y: 0,
	}
	var position = {
		x: 0,
		y: 0,
	}
	var direction = {
		x: 0,
		y: 0,
	}
	var destination = {
		x: 0,
		y: 0,
	}

	var TAG = "Agent "+agentIndex+": ";

	var radius = 0.5;
	var immune = false;

	var baseFill = "#000";
	var focusFill = "#F80";
	var incubationFill = "#AD2";
	var symptomaticFill = "#2C4";
	var afterglowFill = "#CC2";
	var immuneFill = "#24B";

	var baseStroke = "#444";

	var speed = 3;
	var gauss = null;
	var mobility = 0;

	var focus = false;
	var click = false;

	var dead = false;


	var noiseScale = boundary.zoom;
	var noisePower = 1;

	var pathogen = null;

	var simState = true;

    var resistanceDuration = 1;
    var resistanceProgress = 1;

    var baseTint = 0x000000;
    var immuneTint = 0xAABBCC;
    var infectedTint = 0xEE6600;
    var deadTint = 0xEEEEEE;
    var resistantTint = 0x4488EE;

    var sprite = new pixi.Sprite(pixi.resources["res/agent.png"].texture);
    pixi.scene.addChild(sprite);

    // var sprite = new PIXI.Graphics();
    // sprite.beginFill(0xFFFFFF);
    // sprite.lineStyle(4, 0x000000, 1);
    // sprite.drawCircle(0, 0, 60);
    // sprite.endFill();

    sprite.tint = 0x000000;
	sprite.scale.set(0.5, 0.5);
	sprite.anchor.set(0.5, 0.5);

	var susceptible = false;

	var vertical = false;

    var antibodies = [];

	var update = function(time, timeDelta){
		// console.log("Updating agent %s", agentIndex);

		var d = manhattan(position, destination);
		
		if (!simState) {
			position.x = lerp(position.x, origin.x, 0.08);
			position.y = lerp(position.y, origin.y, 0.08);
		}
		else if (d < speed*timeDelta) {
			position.x = destination.x;
			position.y = destination.y;

			randomizeDestination();
		}
		else if (!dead) {
			var dx = direction.x*speed;
			var dy = direction.y*speed;
			position.x += dx*timeDelta;
			position.y += dy*timeDelta;
		}

		var x = worldToScreen.transformX(position.x);
		var y = worldToScreen.transformY(position.y);
		var r = worldToScreen.scaleX(radius);

		if (resistanceProgress < 1) {
			//resistanceProgress = tickProgress(resistanceProgress, resistanceDuration, timeDelta);
			if (resistanceProgress == 1) {
				//setSusceptible(true);
				//refreshTint();
			}
		}

		sprite.x = x;
		sprite.y = y;
		sprite.width = r;
		sprite.height = r;

		colliding = false;

		refreshTint();


		return true;
	}

	var refreshTint = function(){
		var tint = baseTint;
		if (dead) tint = deadTint;
		else if (immune) tint = immuneTint;
		else if (pathogen != null) tint = pathogen.getRna().getHexValue();//infectedTint;
		// else if (resistanceProgress < 1) tint = resistantTint;
		sprite.tint = tint;
	}

	var overlap = function(x, y){
		if (position.x+radius < x) return false;
		if (position.x-radius > x) return false;
		if (position.y+radius < y) return false;
		if (position.y-radius > y) return false;
		return true;

		x = position.x-x;
		y = position.y-y;
		if (Math.abs(x) > radius) return false;
		if (Math.abs(y) > radius) return false;
		return true;
		return sqrmagnitude(x, y) < radius*radius;
	}

	var contact = function(CONTACTAGENT){
		//contactAgent = CONTACTAGENT;
		// contactProgress = 0;

		if (pathogen != null) {
			pathogen.contact(CONTACTAGENT);
		}

		// console.log(TAG+"Making contact with agent %s", contactAgent.agentIndex);

		return true;
	}

	var infect = function(PATHOGEN){
		if (pathogen != null) console.log(TAG+"Already infected!");
		else {
			pathogen = PATHOGEN;
			setSusceptible(false);
			refreshTint();
			return true;
		}
		return false;
	}

	var kill = function(){
		setSusceptible(false);
		dead = true;
		if (pathogen != null) pathogen.destroy();
		pathogen = null;
		refreshTint();
	}

	var recover = function(){
		if (pathogen != null) {
			antibodies.push(pathogen.getRna());
			// resistanceDuration = pathogen.resistanceDuration;
			// resistanceProgress = 0;
			setSusceptible(true);
			pathogen = null;
		}
		refreshTint();
		// console.log(TAG+"Recovering: "+sprite.tint);
	}

	var setPosition = function(x, y){
		position.x = x;
		position.y = y;
		layer.refresh();
	}

	var setDestination = function(x, y){
		destination.x = x;
		destination.y = y;

		direction.x = destination.x-position.x;
		direction.y = destination.y-position.y;

		var m = magnitude(direction.x, direction.y);
		direction.x /= m;
		direction.y /= m;
		//console.log(TAG+"Setting destination=%s, direction=%s", pointString(destination), pointString(direction));
	}

	var randomizeDestination = function(){
		var dx;
		var dy;

		dx = gauss();
		dy = gauss();

		// For some reason my gaussians won't return negative numbers? Fudging it for now...
		if (Math.random() < 0.5) dx *= -1;
		if (Math.random() < 0.5) dy *= -1;
		// console.log(TAG+"Randomizing dx=%s, dy=%s", dx, dy);

		if (pathogen != null) {
			dx *= (1-pathogen.paralysis); 
			dy *= (1-pathogen.paralysis); 
			// dx = pathogen.gauss();
			// dy = pathogen.gauss();
		}
		else {
			// dx = gauss();
			// dy = gauss();
		}

		if (vertical) dx = position.x-origin.x;
		else dy = position.y-origin.y;
		vertical = !vertical;

		var ox = origin.x+dx;
		var oy = origin.y+dy;

		ox = clamp(-boundary.x, boundary.x, ox);
		oy = clamp(-boundary.y, boundary.y, oy);

		setDestination(ox, oy);
		// setDestination(origin.x+dx, origin.y+dy);
	}

	var setOrigin = function(x, y){
		origin.x = x;
		origin.y = y;

		setPosition(origin.x, origin.y);

		randomizeDestination();

		//console.log(TAG+"Setting origin=%s", pointString(origin));
	}

	var randomizeOrigin = function(){
		var n = 0;
		var rx = 0;
		var ry = 0;
		while (Math.random() >= n) {
			rx = lerp(-boundary.x, boundary.x, Math.random())*3/4;
			ry = lerp(-boundary.y, boundary.y, Math.random())*3/4;
			n = Math.pow(noise.simplex2(rx/noiseScale, ry/noiseScale), noisePower);
		}
		var ox = rx;
		var oy = ry;
		setOrigin(ox, oy);
	}

	var setPosition = function(x, y){
		position.x = x;
		position.y = y;
	}

	var setMobility = function(MOBILITY){
		mobility = Math.abs(gaussian(0, MOBILITY/2+0.1)())+0.5;
		gauss = gaussian(0, mobility);
	}

	var setImmune = function(IMMUNE){
		if (immune != IMMUNE) {
			immune = IMMUNE;
			if (immune) {
				if (pathogen != null) {
					pathogen.destroy();
					pathogen = null;
				}
				resistanceProgress = 1;
				setSusceptible(false);
			}
			else {
				setSusceptible(true);
			}
			refreshTint();
		}
	}

	var hasAntibody = function(antibody){
		return antibodies.includes(antibody);
	}

	var getImmune = function(){
		return immune;// || resistanceProgress < 1;
	}

	var getState = function(){
		if (dead) return 4;
		else if (immune) return 3;
		// else if (resistanceProgress < 1) return 2;
		else if (pathogen != null) return 1;
		return 0;
	}

	var getPathogen = function(){
		return pathogen;
	}

	var getInfected = function(){
		return pathogen != null;
	}

	var destroy = function(){
		recover();
		setSusceptible(false);
		// console.log("SusceptibleLength: %s", susceptibleAgents.length);
		// console.log("Destroying agent %s", agentIndex);
		unsubscribe(resetHandle);
		pixi.scene.removeChild(sprite);
	}

	var reset = function(){
		if (pathogen != null) {
			pathogen.destroy();
			pathogen = null;
		}

		antibodies.length = 0;

		setSusceptible(!immune);

		resistanceProgress = 1;
		dead = false;

		refreshTint();
	}

	var setSusceptible = function(SUSCEPTIBLE){
		if (susceptible != SUSCEPTIBLE) {
			susceptible = SUSCEPTIBLE;
			// console.log(TAG+"Setting susceptible=%s", susceptible);
			if (susceptible) susceptibleAgents.push(self);
			else susceptibleAgents.splice(susceptibleAgents.indexOf(self), 1);
		}
	}

	var getRgbString = function(){
		if (pathogen != null) return pathogen.getRna().getRgbString();
		if (immune) return "rgb(192, 192, 220)";
		if (dead) return "rgb(255, 255, 255)";
		return "rgb(0, 0, 0)";
	}

	var self = Object.freeze({
		// Fields
		TAG,
		agentIndex,

		origin,
		position,
		direction,
		destination,

		radius,

		// Methods
		update,
		overlap,
		infect,
		recover,
		kill,

		setMobility,
		setImmune,
		getImmune,
		hasAntibody,

		getRgbString,
		getPathogen,
		getInfected,
		getState,

		destroy,
	});

	setSusceptible(true);
	setImmune(spec.immune);
	setMobility(spec.mobility);

	var resetHandle = subscribe("/reset", reset);

	randomizeOrigin();

	refreshTint();

	return self;
}

var agent_states = Object.freeze({
	healthy: 0,
	infected: 1,
	resistant: 2,
	immune: 3,
	dead: 4,
});

function Agent_Healthy(){



	return Object.freeze({

	});
}
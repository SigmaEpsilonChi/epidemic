function Collision(spec){
	var {
		objectA,
		objectB,
	} = spec;

	var matches = function(collision){
		if (objectA == collision.objectA && objectB == collision.objectB) return true;
		if (objectB == collision.objectA && objectA == collision.objectB) return true;
		return false;
	}

	var contains = function(a, b = null){
		if (objectA == a || objectB == a) {
			if (b == null) return true;
			if (objectA == b || objectB == b) return true;
		}
		return false;
	}

	var opponent = function(object){
		if (object == objectA) return objectB;
		if (object == objectB) return objectA;
		return null;
	}

	return Object.freeze({
		// Fields
		objectA,
		objectB,

		// Methods
		matches,
		contains,
		opponent,
	})
}
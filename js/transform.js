function Transform(spec){
	var {
		x = 0,
		y = 0,
		w = 1,
		h = 1,
	} = spec;


	var scaleX = function(v){
		return v*w;
	}

	var scaleY = function(v){
		return v*h;
	}

	var unscaleX = function(v){
		return v/w;
	}

	var unscaleY = function(v){
		return v/h;
	}

	var transformX = function(v){
		return remap(0, 1, 0, w, v)+x;
	}

	var transformY = function(v){
		return remap(0, 1, 0, h, v)+y;
	}

	var untransformX = function(v){
		return remap(0, w, 0, 1, v-x);
	}

	var untransformY = function(v){
		return remap(0, h, 0, 1, v-y);
	}

	var setXY = function(X, Y){
		x = X;
		y = Y;
	}

	var setWH = function(W, H){
		w = W;
		h = H;
	}

	var getX = function(){return x;}
	var getY = function(){return y;}
	var getW = function(){return w;}
	var getH = function(){return h;}

	return {
		getX,
		getY,
		getW,
		getH,

		scaleX,
		scaleY,
		unscaleX,
		unscaleY,

		transformX,
		transformY,
		untransformX,
		untransformY,

		setWH,
	}
}
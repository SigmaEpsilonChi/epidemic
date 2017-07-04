function Rna(spec = {}){
	var {
		removeRna,
		signature = Math.random(),
	} = spec;
	var rgbString = d3.interpolateRainbow(signature);
	var a = rgbString.split("(")[1].split(")")[0];
	a = a.split(",");
	var b = a.map(function(x){             //For each array element
    	x = parseInt(x).toString(16);      //Convert to a base16 string
    	return (x.length==1) ? "0"+x : x;  //Add zero if we get only one character
	});
	b = "0x"+b.join("");

	var hexValue = b;

	var pathogens = [];
	var hosts = [];
	
	var getRgbString = function(){
		return rgbString;
	}
	var getHexString = function(){
		return hexValue;
	}
	var getHexValue = function(){
		return hexValue;
	}

	var addHost = function(host){
		if (!hosts.includes(host)) {
			hosts.push(host);
		}
	}

	var removeHost = function(host){
		if (hosts.includes(host)) {
			hosts.splice(hosts.indexOf(host), 1);
		}
	}

	var addPathogen = function(pathogen){
		if (!pathogens.includes(pathogen)) {
			pathogens.push(pathogen);
		}
	}
	var removePathogen = function(pathogen){
		if (pathogens.includes(pathogen)) {
			pathogens.splice(pathogens.indexOf(pathogen), 1);
			if (pathogens.length == 0) destroy();
		}
	}

	var destroy = function(){
		removeRna(self);
	}

	return Object.freeze({
		signature,
		pathogens,
		hosts,
		
		addHost,
		removeHost,

		addPathogen,
		removePathogen,

		getRgbString,
		getHexString,
		getHexValue,

		destroy,
	});
}
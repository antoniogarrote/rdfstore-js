exports.Utils = {};
var Utils = exports.Utils;


Utils.extends = function(supertype, descendant) {
    descendant.prototype = new supertype();
};


Utils.shuffle = function(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

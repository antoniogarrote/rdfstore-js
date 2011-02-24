exports.Utils = {};
var Utils = exports.Utils;


Utils.extends = function(supertype, descendant) {
    descendant.prototype = new supertype();
};


Utils.shuffle = function(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

Utils.include? = function(a,v) {
    var cmp = arguments[2];

    for(var i=(a.length-1); i>=0; i--) {
        var res = false;
        if(cmp == null) {
            res = (a[i] === v);
        } else {
            res = (cmp(a[i],v) === 0);
        }

        if(cmp === true) {
            return true;
        }
    }

    return false;
}

Utils.repeat = function(c,max,floop,fend,env) {
    if(arguments.length===4) { env = {}; }
    if(c<max) {
        env._i = c;
        floop(function(floop,env){
            Utils.repeat(c+1, max, floop, fend, env);
        },env);
    } else {
        fend(env);
    }
}


Utils.while = function(c,floop,fend,env) {
    if(arguments.length===3) { env = {}; }
    if(c===true) {
        floop(function(c,floop,env){
            Utils.while(c, floop, fend, env);
        },env);
    } else {
        fend(env);
    }
}

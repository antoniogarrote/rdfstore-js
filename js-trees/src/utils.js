exports.Utils = {};
var Utils = exports.Utils;


Utils.extends = function(supertype, descendant) {
    descendant.prototype = new supertype();
};


Utils.shuffle = function(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

Utils.include = function(a,v) {
    var cmp = arguments[2];

    for(var i=(a.length-1); i>=0; i--) {
        var res = false;
        if(cmp == null) {
            res = (a[i] === v);
        } else {
            res = (cmp(a[i],v) === 0);
        }

        if(res === true) {
            return true;
        }
    }

    return false;
};

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
};


Utils.while = function(c,floop,fend,env) {
    if(arguments.length===3) { env = {}; }
    if(c===true) {
        floop(function(c,floop,env){
            Utils.while(c, floop, fend, env);
        },env);
    } else {
        fend(env);
    }
};

Utils.seq = function() {
    var fs = arguments;
    return function(callback) {
        Utils.repeat(0, fs.length, function(k,env){
            var floop = arguments.callee;
            fs[env._i](function(){
                k(floop, env);
            });
        }, function(){
            callback();
        });
    }
};


Utils.partition = function(c, n) {
    var rem = c.length % n;
    var currentGroup = [];
    for(var i=0; i<rem; i++) {
        currentGroup.push(null);
    }

    var groups = [];
    var groupCounter = rem;
    for(var i=0; i<c.length; i++) {
        currentGroup.push(c[i]);
        if(currentGroup.length % n == 0) {
            groups.push(currentGroup);
            currentGroup = [];
        }
    }
    return groups;
};

Utils.keys = function(obj) {
    var variables = [];
    for(var variable in obj) {
        variables.push(variable);
    }

    return variables;
};

Utils.iso8601 = function(date) {
    function pad(n){
        return n<10 ? '0'+n : n;
    }    
    return date.getUTCFullYear()+'-'
        + pad(date.getUTCMonth()+1)+'-'
        + pad(date.getUTCDate())+'T'
        + pad(date.getUTCHours())+':'
        + pad(date.getUTCMinutes())+':'
        + pad(date.getUTCSeconds())+'Z';
};


Utils.parseStrictISO8601 = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = str.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); } else { throw "missing ISO8061 component" }
    if (d[5]) { date.setDate(d[5]);  } else { throw "missing ISO8061 component" }
    if (d[7]) { date.setHours(d[7]);  } else { throw "missing ISO8061 component" }
    if (d[8]) { date.setMinutes(d[8]);  } else { throw "missing ISO8061 component" }
    if (d[10]) { date.setSeconds(d[10]);  } else { throw "missing ISO8061 component" }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    var toReturn = new Date();
    toReturn.setTime(Number(time));
    return toReturn;
}


Utils.parseISO8601 = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = str.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]);  }
    if (d[7]) { date.setHours(d[7]);  }
    if (d[8]) { date.setMinutes(d[8]);  }
    if (d[10]) { date.setSeconds(d[10]);  }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    var toReturn = new Date();
    toReturn.setTime(Number(time));
    return toReturn;
};

Utils.parseISO8601Components = function (str) {
    var regexp = "([0-9]{4})(-([0-9]{2}))(-([0-9]{2}))(T([0-9]{2}):([0-9]{2})(:([0-9]{2}))?(\.([0-9]+))?)?(Z|([-+])([0-9]{2})(:([0-9]{2}))?)?";
    var d = str.match(new RegExp(regexp));
    var year, month, date, hours, minutes, seconds, millisecs, timezone;
    year = Number(d[1]);
    month = d[3] - 1;
    date  = Number(d[5]);
    hours = Number(d[7]);
    minutes = Number(d[8]);
    seconds = Number(d[10]);

    if(d[12]) { millisecs = Number("0." + d[12]) * 1000 }

    if(d[13]==="Z") {
        timezone = 0;
    } else if (d[14]) {
        var timezone = 0;
        if(d[17]) {
            timezone = Number(d[17]);
        }
        timezone = timezone+(Number(d[15]) * 60);
        timezone *= ((d[14] == '-') ? -1 : +1);
    } else if(d[14]==null && d[11]) {
        timezone = Number(d[12])*60;
    }    

    return {'year': isNaN(year) ? null : year,
            'month': isNaN(month) ? null : month,
            'date': isNaN(date) ? null : date,
            'hours': isNaN(hours) ? null : hours,
            'minutes': isNaN(minutes) ? null : minutes,
            'seconds': isNaN(seconds) ? null : seconds,
            'millisecs':isNaN(millisecs) ? null : millisecs,
            'timezone': isNaN(timezone) ? null : timezone};
};

Utils.compareDateComponents = function(stra,strb) {
    var a = Utils.parseISO8601Components(stra);
    var b = Utils.parseISO8601Components(strb);

    if((a.timezone == null && b.timezone == null) ||
       (a.timezone != null && b.timezone != null)) {        
        da = Utils.parseISO8601(stra);
        db = Utils.parseISO8601(strb);
        
        if(da.getTime() == db.getTime()) {
            return 0;
        } else if(da.getTime() < db.getTime()){
            return -1;
        } else {
            return 1;
        }
    } else if (a.timezone != null && b.timezone == null){
        da = Utils.parseISO8601(stra);
        db = Utils.parseISO8601(strb);
        ta = da.getTime();
        tb = db.getTime();

        var offset = 14*60*60;

        if(ta < tb && ta < (tb + offset)) {
            return -1;
        } else if(ta > tb && ta > (tb - offset)) {
            return 1;
        } else {
        return null;
        }
    } else {
        da = Utils.parseISO8601(stra);
        db = Utils.parseISO8601(strb);
        ta = da.getTime();
        tb = db.getTime();

        var offset = 14*60*60;
        if(ta < tb && (ta + offset)  < tb) {
            return -1;
        } else if(ta > tb && (ta + offset) > tb) {
            return 1;
        } else {
        return null;
        }
    }
};

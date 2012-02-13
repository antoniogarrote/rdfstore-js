// imports
var QueryEngine = require("./../../js-query-engine/src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;
var Utils = require("./../../js-trees/src/utils").Utils;

var MicrographQuery = require('./micrograph_query').MicrographQuery;
var MicrographQL = require('./micrograph_ql').MicrographQL;

// Store
var Micrograph = function(options, callback) {
    if(options['treeOrder'] == null) {
        options['treeOrder'] = 15;
    }

    var that = this;

    for(var i=0; i<Micrograph.vars.length; i++) {
	this['_'+Micrograph.vars[i]] = this._(Micrograph.vars[i]);
    }


    new Lexicon.Lexicon(function(lexicon){
        if(options['overwrite'] === true) {
            // delete lexicon values
            lexicon.clear();
        }
        new QuadBackend.QuadBackend(options, function(backend){
            if(options['overwrite'] === true) {
                // delete index values
                backend.clear();
            }
            options.backend = backend;
            options.lexicon =lexicon;
            that.engine = new QueryEngine.QueryEngine(options);      

	    that.engine.abstractQueryTree.oldParseQueryString = that.engine.abstractQueryTree.parseQueryString;
	    that.engine.abstractQueryTree.parseQueryString = function(toParse) {

		if(typeof(toParse) === 'string') {
		    return this.oldParseQueryString(toParse);
		} else {
		    return toParse;
		}
	    };

            if(callback) {
                callback(that);
            }
        });
    },options['name']);
};
exports.Micrograph = Micrograph;

Micrograph.vars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];

Micrograph.create = function() {
    var callback, options;

    if(arguments.length == 0) {
	throw "A callback function and an optional options map must be provided";
    } else if(arguments.length == 1) {
	options = {'treeOrder': 15, 'name': 'micrograph_instance', 'overwrite':false};
	callback = arguments[0];
    } else {
	options = arguments[0];
	callback = arguments[1];
    }
    
    new Micrograph(options, callback);
};


Micrograph.prototype.execute = function(query, callback) {
    this.engine.execute(query,callback);
};




Micrograph.prototype.where = function(query) {
    var queryObj =  new MicrographQuery(query);
    queryObj.setStore(this);
    return queryObj;
};

Micrograph.prototype._ = function(varName) {
    return {'token': 'var', 'value':varName };
};

Micrograph.prototype.load = function() {
    var mediaType;
    var data;
    var graph;
    var callback;
    var that = this;

    if(arguments.length == 1)
	callback = function(){};

    if(arguments.length < 3) {
	if(MicrographQL.isUri(typeof(arguments[0]) === "string" && arguments[0])) {
	    mediaType = "remote";
	} else {
	    mediaType = "application/json";
	}

        graph = {'token':'uri', 'value': this.engine.lexicon.defaultGraphUri};

	data = arguments[0];
	callback = arguments[1];
    } else {
	throw "Data to be loaded and an optional callback function must be specified";
    }

    if(mediaType === 'remote') {
        data = this.rdf.createNamedNode(data);
        var query = "LOAD <"+data.valueOf()+"> INTO GRAPH <"+graph.valueOf()+">";

        this.engine.execute(query, callback);
    } else {
	if(typeof(data) === "object") {
	    if(data.constructor !== Array) {
		data = [data];
	    }
	    var quads;
	    var that = this;

	    //Utils.repeat(0,data.length, function(k,env) {
	    // 	var floop = arguments.callee;
	    for(var i=0; i<data.length; i++) {
		quads = MicrographQL.parseJSON(data[i],graph);

		//console.log("LOAD");
		//console.log(quads);

		that.engine.batchLoad(quads,function(){ 
		    //k(floop,env); 
		});
	    }
	    //}, function() {
	     	callback(data);
	    //});
	} else {

            var parser = this.engine.rdfLoader.parsers[mediaType];

            var that = this;

            this.engine.rdfLoader.tryToParse(parser, {'token':'uri', 'value':graph.valueOf()}, data, function(success, quads) {
		if(success) {
                    that.engine.batchLoad(quads,callback);
		} else {
                    callback(success, quads);
		}
            });
	}
    }

    return this;

};

Micrograph.prototype.save = function(json,cb) {
    this.load(json, function(objects){
	if(cb)
	    cb(objects[0]);
    });
    return this;
};

/*
Micrograph.prototype.remove = function(query) {
    console.log("REMOVING!");
    var queryObj = this._parseModify(query);
    queryObj.setStore(this);
    queryObj.setKind('delete');
    return queryObj;
};
*/
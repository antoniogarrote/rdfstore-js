// exports
exports.Store = {};
var Store = exports.Store;

// imports
var QueryEngine = require("./../../js-query-engine/src/query_engine").QueryEngine;
var QuadBackend = require("./../../js-rdf-persistence/src/quad_backend").QuadBackend;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;


Store.Store = function(arg1, arg2) {
    var callback = null;
    var params   = null;

    if(arguments.length == 1) {
        params   = {};
        callback = arg1;
    } else if(arguments.length > 1) {
        params   = arg1;
        callback = arg2;
    } else {
        throw("An optional argument map and a callback must be provided");
    }

    if(params['treeOrder'] == null) {
        params['treeOrder'] = 2;
    }

    var that = this;
    new Lexicon.Lexicon(function(lexicon){
        new QuadBackend.QuadBackend(params, function(backend){
            params.backend = backend;
            params.lexicon =lexicon;
            that.engine = new QueryEngine.QueryEngine(params);      
            callback(that);
        })
    });
};


Store.Store.prototype.execute = function(queryString, callback) {
    this.engine.execute(queryString, callback);
};

// exports
exports.QueryEngine = {};
var QueryEngine = exports.QueryEngine;

//imports
var AbstractQueryTree = require("./../js-sparql-parser/abstract_query_tree").AbstractQueryTree;

var QueryEngine = function(params) {
    if(arguments.length != 0) {
        this.backend = params.backend;
        this.lexicon = params.lexicon;
    }
}


QueryEngine.prototype.execute = function(pattern, env, callback){
    if(pattern.kind === 'BGP') {
        return this.executeBGP(pattern, env, function(result){
            callback(result);
        })
    }
}

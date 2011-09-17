// exports
exports.TurtleParser = {};
var TurtleParser = exports.TurtleParser;

var statementCounter = 0;
var timer = new Date().getTime();
var printTime = function() {
    var newTimer = new Date().getTime();
    console.log("ellapsed: "+((newTimer-timer)/1000)+" secs");
    timer = newTimer;
};

// imports
var Utils = require("./../../js-trees/src/utils").Utils;
var SparqlParser = require("./../../js-sparql-parser/src/sparql_parser").SparqlParser;

TurtleParser.combined_parser = SparqlParser.parser;

TurtleParser.parser = {};
TurtleParser.parser.parse = function(data, graph) {
    var quads = [];

    var result = TurtleParser.combined_parser.parse(data);
    var namespaces = {};
    var env = {namespaces: namespaces, base:'', blankCounter: 0};

    statementCounter = 0;

    for(var i=0; i<result.length; i++) {
        var unit = result[i];
        if(unit.token === 'base') {
            env.base = unit.value;
        } else if(unit.token === 'prefix') {
            namespaces[unit.prefix] = unit.local;
        } else if(unit.token === 'triples' || unit.token === 'triplespattern') {
            for(var j=0; j<unit.triplesContext.length; j++) {
                var triple = unit.triplesContext[j];
                var quad = { subject: Utils.lexicalFormTerm(triple.subject, env),
                             predicate: Utils.lexicalFormTerm(triple.predicate, env),
                             object: Utils.lexicalFormTerm(triple.object, env),
                             graph: graph };
     
                quads.push(quad);
            }
        }
    }

    return quads;
};


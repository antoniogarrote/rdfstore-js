// exports
exports.AbstractQueryTree = {};
var AbstractQueryTree = exports.AbstractQueryTree;

// imports
var SparqlParser = require("./sparql_parser").SparqlParser;

/**
 * @doc
 *
 * Based on <http://www.w3.org/2001/sw/DataAccess/rq23/rq24-algebra.html>
 * W3C's note
 */

AbstractQueryTree.parseSelect = function(query_string){
    var syntaxTree  = SparqlParser.parser.parse(query_string);
    if(syntaxTree == null) {
        return null;
    } else {
        var env = {};
        this.build(syntaxTree.pattern, env);
    }
}

AbstractQueryTree.build = function(node, env) {
    if(node.token === 'groupgraphpattern') {
        AbstractQueryTree._buildGroupGraphPattern(node, env);
    }
}

AbstractQueryTree._buildGroupGraphPattern = function(node, env) {
    var f = (node.filters || []);
    var g = {kind: "EMPTY_PATTERN"};

    for(var i=0; i<node.patterns.length; i++) {
        var pattern = node.patterns[i];
        var parsedPattern = this.build(pattern,env);
        if(pattern.token === 'OptionalGraphPattern') {
            if(parsedPattern.kind === 'FILTER') {
                g =  { kind:'LEFT_JOIN',
                       lvalue: g,
                       rvalue: parsedPattern.value,
                       filter: parsedPattern.filter }
            } else {
                g = { kind:'LEFT_JOIN',
                      lvalue: g,
                      rvalue: parsedPattern,
                      filter: true }
            }
        } else {
            g = { kind: 'JOIN',
                  lvalue: g,
                  rvalue: parsedPattern }
        }
    }

    if(f.length != 0) {
        if(g.kind === 'EMPTY_PATTERN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g}
        } else if(g.kind == 'LEFT_JOIN' && g.filter === true) {
            g.filter = f;
            return g;
        } else if() {

        }
    }
}

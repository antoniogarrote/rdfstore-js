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
        console.log("error parsing query");
        return null;
    } else {
        var env = {};
        syntaxTree.pattern = this.build(syntaxTree.pattern, env);
        console.log(syntaxTree);
        return syntaxTree;
    }
}

AbstractQueryTree.build = function(node, env) {
    if(node.token === 'groupgraphpattern') {
        return AbstractQueryTree._buildGroupGraphPattern(node, env);
    } else if (node.token === 'basicgraphpattern') {
        return { kind: 'BGP',
                 value: node.triplesContext };
    } else if (node.token === 'graphunionpattern') {
        var a = AbstractQueryTree.build(node.value[0],env);
        var b = AbstractQueryTree.build(node.value[1],env);

        return { kind: 'UNION',
                 value: [a,b] };
    } else if(node.token === 'graphgraphpattern') {
        var c = AbstractQueryTree.build(node.value, env);
        return { kind: 'GRAPH',
                 value: c,
                 graph: node.graph };
    } else {
        throw new Error("not supported token in query:"+node.token);
    }
}

AbstractQueryTree._buildGroupGraphPattern = function(node, env) {
    var f = (node.filters || []);
    var g = {kind: "EMPTY_PATTERN"};

    for(var i=0; i<node.patterns.length; i++) {
        var pattern = node.patterns[i];
        if(pattern.token === 'optionalgraphpattern') {
            var parsedPattern = this.build(pattern.value,env);
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
            var parsedPattern = this.build(pattern,env);
            if(g.kind == "EMPTY_PATTERN") {
                g = parsedPattern;
            } else {
                g = { kind: 'JOIN',
                      lvalue: g,
                      rvalue: parsedPattern }
            }
        }
    }

    if(f.length != 0) {
        if(g.kind === 'EMPTY_PATTERN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'LEFT_JOIN' && g.filter === true) {
            g.filter = f;
            return g;
        } else if(g.kind === 'JOIN') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'UNION') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'GRAPH') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else if(g.kind === 'BGP') {
            return { kind: 'FILTER',
                     filter: f,
                     value: g};
        } else {
            throw new Error("Unknow kind of algebra expression: "+ g.kind);
        }
    } else {
        return g;
    }
}

var AbstractQueryTree = require("./../src/abstract_query_tree").AbstractQueryTree;
var Lexicon = require("./../../js-rdf-persistence/src/lexicon").Lexicon;
var sys = null;
try {
    sys = require("util");
} catch(e) {
    sys = require("sys");
}
var aqt = new AbstractQueryTree.AbstractQueryTree();
exports.example1 = function(test) {
    var query = "SELECT * { ?s ?p ?o }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseExecutableUnit(query.units[0]);
    test.ok(result.pattern.kind==='BGP');
    test.ok(result.pattern.value.length === 1);

    test.done();
}


exports.example2 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);
    test.ok(result.pattern.kind==='BGP');
    test.ok(result.pattern.value.length === 2);

    test.done();
}

exports.example3 = function(test) {
    var query = "SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);
    test.ok(result.pattern.kind ==='UNION');
    test.ok(result.pattern.value.length === 2);
    test.ok(result.pattern.value[0].kind === 'BGP');
    test.ok(result.pattern.value[0].value.length === 1);
    test.ok(result.pattern.value[1].kind === 'BGP');
    test.ok(result.pattern.value[1].value.length === 1);

    test.done();
}

exports.example4 = function(test) {
    var query = "SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } UNION {?s :p3 ?v3 } }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);

    test.ok(result.pattern.kind ==='UNION');
    test.ok(result.pattern.value.length === 2);

    test.ok(result.pattern.value[0].kind === 'UNION');
    test.ok(result.pattern.value[0].value.length === 2);

    test.ok(result.pattern.value[1].kind === 'BGP');
    test.ok(result.pattern.value[1].value.length === 1);
    test.ok(result.pattern.value[1].value[0].object.value === 'v3');
    test.ok(result.pattern.value[1].value[0].object.token === 'var');

    test.ok(result.pattern.value[0].value[0].kind === 'BGP');
    test.ok(result.pattern.value[0].value[0].value.length === 1);
    test.ok(result.pattern.value[0].value[0].value[0].object.value === 'v1');
    test.ok(result.pattern.value[0].value[1].kind === 'BGP');
    test.ok(result.pattern.value[0].value[1].value.length === 1);
    test.ok(result.pattern.value[0].value[1].value[0].object.value === 'v2');

    test.done();
}


exports.example5 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);


    test.ok(result.pattern.kind === "LEFT_JOIN");
    test.ok(result.pattern.filter === true);
    test.ok(result.pattern.lvalue.kind === "BGP");
    test.ok(result.pattern.lvalue.value.length === 1);
    test.ok(result.pattern.rvalue.kind === "BGP");
    test.ok(result.pattern.rvalue.value.length === 1);
    test.done();
}


exports.example6 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } OPTIONAL { ?s :p3 ?v3 } }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);

    test.ok(result.pattern.kind === "LEFT_JOIN");
    test.ok(result.pattern.lvalue.kind === "LEFT_JOIN");
    test.ok(result.pattern.lvalue.lvalue.kind === "BGP");
    test.ok(result.pattern.lvalue.rvalue.kind === "BGP");
    test.ok(result.pattern.rvalue.kind === "BGP");
    test.done();
}

exports.example7 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3) } }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);
    test.ok(result.pattern.kind === "LEFT_JOIN");
    test.ok(result.pattern.filter.length === 1);
    test.ok(result.pattern.filter[0].token === 'filter');
    test.ok(result.pattern.lvalue.kind === "BGP");
    test.ok(result.pattern.rvalue.kind === "BGP");

    test.done();
}

exports.example8 = function(test) {
    var query = "SELECT * { {?s :p1 ?v1} UNION {?s :p2 ?v2} OPTIONAL {?s :p3 ?v3} }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);

    test.ok(result.pattern.kind === "LEFT_JOIN");
    test.ok(result.pattern.lvalue.kind === "UNION");
    test.ok(result.pattern.rvalue.kind === "BGP");

    test.done();
}

exports.examples9 = function(test) {
    var query = "PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                 SELECT ?nameX ?nameY ?nickY\
                 WHERE\
                 { ?x foaf:knows ?y ;\
                   foaf:name ?nameX .\
                   ?y foaf:name ?nameY .\
                   OPTIONAL { ?y foaf:nick ?nickY }  }";
    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);

    test.ok(result.pattern.kind === "LEFT_JOIN");
    test.ok(result.pattern.lvalue.kind === "BGP");
    test.ok(result.pattern.rvalue.kind === "BGP");

    test.done();
}


exports.exampleCollect1 = function(test) {
    var query = "SELECT * { ?s ?p ?o }";

    var query = aqt.parseQueryString(query);
    var parsed = aqt.parseExecutableUnit(query.units[0]);
    var patterns = aqt.collectBasicTriples(parsed);
    
    test.ok(patterns.length === 1);
    test.done();
}


exports.exampleCollect2 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }";

    var query = aqt.parseQueryString(query);
    var parsed = aqt.parseSelect(query.units[0]);

    var patterns = aqt.collectBasicTriples(parsed);
    
    test.ok(patterns.length === 2);

    test.done();
}

exports.exampleCollect9 = function(test) {
    var query = "PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                 SELECT ?nameX ?nameY ?nickY\
                 WHERE\
                 { ?x foaf:knows ?y ;\
                   foaf:name ?nameX .\
                   ?y foaf:name ?nameY .\
                   OPTIONAL { ?y foaf:nick ?nickY }  }";
    var query = aqt.parseQueryString(query);
    var parsed = aqt.parseSelect(query.units[0]);

    var patterns = aqt.collectBasicTriples(parsed);

    test.ok(patterns.length === 4);    

    test.done();
}



exports.exampleCollectG1 = function(test) {
    var query = "PREFIX : <http://example/>\
                 SELECT * { GRAPH ?g { ?s ?p ?o } }";
    var query = aqt.parseQueryString(query);
    var parsed = aqt.parseSelect(query.units[0]);

    var patterns = aqt.collectBasicTriples(parsed);
    
    test.ok(patterns.length === 1);    
    test.ok(patterns[0].graph != null);    

    test.done();
}

exports.exampleCollectG2 = function(test) {
    var query = "PREFIX : <http://example/>\
                 SELECT * { GRAPH <http://test.com/graph1> { ?s ?p ?o } }";
    var query = aqt.parseQueryString(query);
    var parsed = aqt.parseSelect(query.units[0]);

    var patterns = aqt.collectBasicTriples(parsed);

    test.ok(patterns.length === 1);    
    test.ok(patterns[0].graph.value === "http://test.com/graph1");    

    test.done();
}

exports.bind1 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3) } }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);
    //console.log(sys.inspect(result,true,10));

    test.ok(result.pattern.kind === "LEFT_JOIN");
    test.ok(result.pattern.filter.length === 1);
    test.ok(result.pattern.filter[0].token === 'filter');
    test.ok(result.pattern.lvalue.kind === "BGP");
    test.ok(result.pattern.rvalue.kind === "BGP");

    result = aqt.bind(result, { v1: { token: 'uri', value: 'http://test.com/somevalue' }});
    test.ok(result.pattern.filter[0].value.op1.value.value === 'http://test.com/somevalue');    
    test.ok(result.pattern.lvalue.value[0].object.value === 'http://test.com/somevalue');    
    test.done();
}


exports.bind2 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3 && (?v1+?v1) < (5*?v1) && STR(?v1)) } }";

    var query = aqt.parseQueryString(query);
    var result = aqt.parseSelect(query.units[0]);

    test.ok(result.pattern.kind === "LEFT_JOIN");
    test.ok(result.pattern.filter.length === 1);
    test.ok(result.pattern.filter[0].token === 'filter');
    test.ok(result.pattern.lvalue.kind === "BGP");
    test.ok(result.pattern.rvalue.kind === "BGP");

    result = aqt.bind(result, { v1: { token: 'uri', value: 'http://test.com/somevalue' }});
    //console.log(sys.inspect(result,true,20));
    test.ok(result.pattern.filter[0].value.operands[0].op1.value.value === 'http://test.com/somevalue');    
    test.ok(result.pattern.filter[0].value.operands[1].op1.summand.value.value === 'http://test.com/somevalue');    
    test.ok(result.pattern.filter[0].value.operands[1].op1.summands[0].expression.value.value === 'http://test.com/somevalue');    
    test.ok(result.pattern.filter[0].value.operands[1].op2.factors[0].expression.value.value === 'http://test.com/somevalue');    
    test.ok(result.pattern.filter[0].value.operands[2].args[0].value.value === 'http://test.com/somevalue');    
    test.done();
}

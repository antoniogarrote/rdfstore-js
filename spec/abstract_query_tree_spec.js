var AbstractQueryTree = require("../src/abstract_query_tree").AbstractQueryTree;
var Lexicon = require("../src/lexicon").Lexicon;

var sys = null;
try {
    sys = require("util");
} catch(e) {
    sys = require("sys");
}
var aqt = new AbstractQueryTree();


describe("Parser", function() {

    it("Should be possible to parse 'SELECT * { ?s ?p ?o }'.", function () {
        var query = "SELECT * { ?s ?p ?o }";

        query = aqt.parseQueryString(query);
        var result = aqt.parseExecutableUnit(query.units[0]);
        expect(result.pattern.kind).toBe('BGP');
        expect(result.pattern.value.length).toBe(1);
    });

    it("Should be possible to parse 'SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }'.", function () {
        var query = "SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }";

        query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);
        //console.log(sys.inspect(result,true,20));
        expect(result.pattern.kind).toBe('BGP');
        expect(result.pattern.value.length).toBe(2);
    });

    it("Should be possible to parse 'SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } }'.", function () {
        var query = "SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);
        expect(result.pattern.kind).toBe('UNION');
        expect(result.pattern.value.length).toBe(2);
        expect(result.pattern.value[0].kind).toBe('BGP');
        expect(result.pattern.value[0].value.length).toBe(1);
        expect(result.pattern.value[1].kind).toBe('BGP');
        expect(result.pattern.value[1].value.length).toBe(1);

    });

    it("Should be possible to parse 'SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } UNION {?s :p3 ?v3 } }'.", function () {
        var query = "SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } UNION {?s :p3 ?v3 } }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);

        expect(result.pattern.kind).toBe('UNION');
        expect(result.pattern.value.length).toBe(2);

        expect(result.pattern.value[0].kind).toBe('UNION');
        expect(result.pattern.value[0].value.length).toBe(2);

        expect(result.pattern.value[1].kind).toBe('BGP');
        expect(result.pattern.value[1].value.length).toBe(1);
        expect(result.pattern.value[1].value[0].object.value).toBe('v3');
        expect(result.pattern.value[1].value[0].object.token).toBe('var');

        expect(result.pattern.value[0].value[0].kind).toBe('BGP');
        expect(result.pattern.value[0].value[0].value.length).toBe(1);
        expect(result.pattern.value[0].value[0].value[0].object.value).toBe('v1');
        expect(result.pattern.value[0].value[1].kind).toBe('BGP');
        expect(result.pattern.value[0].value[1].value.length).toBe(1);
        expect(result.pattern.value[0].value[1].value[0].object.value).toBe('v2');
    });

    it("Should be possible to parse 'SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } }'.", function () {
        var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);


        expect(result.pattern.kind).toBe("LEFT_JOIN");
        expect(result.pattern.filter).toBe(true);
        expect(result.pattern.lvalue.kind).toBe("BGP");
        expect(result.pattern.lvalue.value.length).toBe(1);
        expect(result.pattern.rvalue.kind).toBe("BGP");
        expect(result.pattern.rvalue.value.length).toBe(1);
    });

    it("Should be possible to parse 'SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } OPTIONAL { ?s :p3 ?v3 } }'.", function () {
        var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } OPTIONAL { ?s :p3 ?v3 } }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);

        expect(result.pattern.kind).toBe("LEFT_JOIN");
        expect(result.pattern.lvalue.kind).toBe("LEFT_JOIN");
        expect(result.pattern.lvalue.lvalue.kind).toBe("BGP");
        expect(result.pattern.lvalue.rvalue.kind).toBe("BGP");
        expect(result.pattern.rvalue.kind).toBe("BGP");
    });

    it("Should be possible to parse 'SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3) } }'.", function () {
        var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3) } }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);
        expect(result.pattern.kind).toBe("LEFT_JOIN");
        expect(result.pattern.filter.length).toBe(1);
        expect(result.pattern.filter[0].token).toBe('filter');
        expect(result.pattern.lvalue.kind).toBe("BGP");
        expect(result.pattern.rvalue.kind).toBe("BGP");
    });

    it("Should be possible to parse 'SELECT * { {?s :p1 ?v1} UNION {?s :p2 ?v2} OPTIONAL {?s :p3 ?v3} }'.", function () {
        var query = "SELECT * { {?s :p1 ?v1} UNION {?s :p2 ?v2} OPTIONAL {?s :p3 ?v3} }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);

        expect(result.pattern.kind).toBe("LEFT_JOIN");
        expect(result.pattern.lvalue.kind).toBe("UNION");
        expect(result.pattern.rvalue.kind).toBe("BGP");
    });

    it("Should be possible to parse a complex expression example 1.", function () {


        var query = "PREFIX foaf:    <http://xmlns.com/foaf/0.1/>\
                 SELECT ?nameX ?nameY ?nickY\
                 WHERE\
                 { ?x foaf:knows ?y ;\
                   foaf:name ?nameX .\
                   ?y foaf:name ?nameY .\
                   OPTIONAL { ?y foaf:nick ?nickY }  }";
        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);

        expect(result.pattern.kind).toBe("LEFT_JOIN");
        expect(result.pattern.lvalue.kind).toBe("BGP");
        expect(result.pattern.rvalue.kind).toBe("BGP");
    });


    it("Should be possible to collect triples for 'SELECT * { ?s ?p ?o }'", function () {
        var query = "SELECT * { ?s ?p ?o }";

        var query = aqt.parseQueryString(query);
        var parsed = aqt.parseExecutableUnit(query.units[0]);
        var patterns = aqt.collectBasicTriples(parsed);

        expect(patterns.length).toBe(1);
    });


    it("Should be possible to collect triples for 'SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }'", function () {
        var query = "SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }";

        var query = aqt.parseQueryString(query);
        var parsed = aqt.parseSelect(query.units[0]);

        var patterns = aqt.collectBasicTriples(parsed);

        expect(patterns.length).toBe(2);
    });

    it("Should be possible to collect triples for a complex expression example 1.", function () {
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

        expect(patterns.length).toBe(4);
    });


    it("Should be possible to collect basic triples for 'SELECT * { GRAPH ?g { ?s ?p ?o } }'", function () {
        var query = "PREFIX : <http://example/>\
                 SELECT * { GRAPH ?g { ?s ?p ?o } }";
        var query = aqt.parseQueryString(query);
        var parsed = aqt.parseSelect(query.units[0]);

        var patterns = aqt.collectBasicTriples(parsed);

        expect(patterns.length).toBe(1);
        expect(patterns[0].graph != null).toBe(true);
    });

    it("Should be possible to collect basic triples for 'SELECT * { GRAPH <http://test.com/graph1> { ?s ?p ?o } }'", function () {
        var query = "PREFIX : <http://example/>\
                 SELECT * { GRAPH <http://test.com/graph1> { ?s ?p ?o } }";
        var query = aqt.parseQueryString(query);
        var parsed = aqt.parseSelect(query.units[0]);

        var patterns = aqt.collectBasicTriples(parsed);

        expect(patterns.length).toBe(1);
        expect(patterns[0].graph.value).toBe("http://test.com/graph1");
    });


    it("Should be possible to bind variables in a result example 1", function(){
        var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3) } }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);
        //console.log(sys.inspect(result,true,10));

        expect(result.pattern.kind).toBe("LEFT_JOIN");
        expect(result.pattern.filter.length).toBe(1);
        expect(result.pattern.filter[0].token).toBe('filter');
        expect(result.pattern.lvalue.kind).toBe("BGP");
        expect(result.pattern.rvalue.kind).toBe("BGP");

        result = aqt.bind(result, { v1: { token: 'uri', value: 'http://test.com/somevalue' }});
        expect(result.pattern.filter[0].value.op1.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.lvalue.value[0].object.value).toBe('http://test.com/somevalue');

    });


    it("Should be possible to bind variables in a result example 1", function(){
        var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3 && (?v1+?v1) < (5*?v1) && STR(?v1)) } }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);

        expect(result.pattern.kind).toBe("LEFT_JOIN");
        expect(result.pattern.filter.length).toBe(1);
        expect(result.pattern.filter[0].token).toBe('filter');
        expect(result.pattern.lvalue.kind).toBe("BGP");
        expect(result.pattern.rvalue.kind).toBe("BGP");

        result = aqt.bind(result, { v1: { token: 'uri', value: 'http://test.com/somevalue' }});
        //console.log(sys.inspect(result,true,20));
        expect(result.pattern.filter[0].value.operands[0].op1.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.filter[0].value.operands[1].op1.summand.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.filter[0].value.operands[1].op1.summands[0].expression.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.filter[0].value.operands[1].op2.factors[0].expression.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.filter[0].value.operands[2].args[0].value.value).toBe('http://test.com/somevalue');
    });

    it("Should be possible to parse URIS with unescaped blank spaces", function(){
        var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 <http://prauw.cs.vu.nl/foaf/Jan Top.rdf> FILTER(?v1<3 && (?v1+?v1) < (5*?v1) && STR(?v1)) } }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);

        expect(result.pattern.kind).toBe("LEFT_JOIN");
        expect(result.pattern.filter.length).toBe(1);
        expect(result.pattern.filter[0].token).toBe('filter');
        expect(result.pattern.lvalue.kind).toBe("BGP");
        expect(result.pattern.rvalue.kind).toBe("BGP");

        result = aqt.bind(result, { v1: { token: 'uri', value: 'http://test.com/somevalue' }});
        //console.log(sys.inspect(result,true,20));
        expect(result.pattern.filter[0].value.operands[0].op1.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.filter[0].value.operands[1].op1.summand.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.filter[0].value.operands[1].op1.summands[0].expression.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.filter[0].value.operands[1].op2.factors[0].expression.value.value).toBe('http://test.com/somevalue');
        expect(result.pattern.filter[0].value.operands[2].args[0].value.value).toBe('http://test.com/somevalue');
    });

    it("Should be possible to parse a simple path expression", function(){
        var query = "SELECT * { ?s :p1/:p2/:p3 ?v1 }";

        var query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);

        expect(result.pattern.kind).toBe('BGP');
        expect(result.pattern.value.length).toBe(3);
        expect(result.pattern.value[0].subject.value).toBe('s');
        expect(result.pattern.value[0].object.value.indexOf("fresh:")).toBe(0);
        expect(result.pattern.value[0].predicate.suffix).toBe('p1');
        expect(result.pattern.value[0].object.value).toBe(result.pattern.value[1].subject.value);
        expect(result.pattern.value[1].object.value).toBe(result.pattern.value[2].subject.value);
        expect(result.pattern.value[1].predicate.suffix).toBe('p2');
        expect(result.pattern.value[2].object.value).toBe('v1');
        expect(result.pattern.value[2].predicate.suffix).toBe('p3');
    });

    it("Should be possible to parse a custom function", function(){
        var query = "SELECT ?givenName WHERE { ?x foaf:givenName  ?givenName . filter(custom:hey(3,?date)) }";

        query = aqt.parseQueryString(query);
        var result = aqt.parseSelect(query.units[0]);

        expect(result.pattern.filter[0].value.token).toBe('expression');
        expect(result.pattern.filter[0].value.expressionType).toBe('custom');
        expect(result.pattern.filter[0].value.name).toBe('hey');
        expect(result.pattern.filter[0].value.args.length).toBe(2);
    });

    it("Should be possible to parse isUri isURI and ISURI functions", function(){
        expect(function() {
            var query1 = "SELECT ?givenName WHERE { ?x foaf:givenName  ?givenName . filter(isURI(?x)) }";
            var query2 = "SELECT ?givenName WHERE { ?x foaf:givenName  ?givenName . filter(isuri(?x)) }";
            var query3 = "SELECT ?givenName WHERE { ?x foaf:givenName  ?givenName . filter(ISURI(?x)) }";
            var queries = [query1, query2, query3];
            for(var i=0; i<queries.length; i++) {
                var parsed = aqt.parseQueryString(queries[i]);
            }
        }).not.toThrow();
    });
});

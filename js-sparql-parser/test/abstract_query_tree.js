var aqt = require("./../src/abstract_query_tree").AbstractQueryTree;

exports.example1 = function(test) {
    var query = "SELECT * { ?s ?p ?o }";

    var result = aqt.parseSelect(query);

    test.ok(result.kind==='BGP');
    test.ok(result.value.length === 1);

    test.done();
}


exports.example2 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }";

    var result = aqt.parseSelect(query);

    test.ok(result.kind==='BGP');
    test.ok(result.value.length === 2);

    test.done();
}

exports.example3 = function(test) {
    var query = "SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } }";

    var result = aqt.parseSelect(query);

    test.ok(result.kind ==='UNION');
    test.ok(result.value.length === 2);
    test.ok(result.value[0].kind === 'BGP');
    test.ok(result.value[0].value.length === 1);
    test.ok(result.value[1].kind === 'BGP');
    test.ok(result.value[1].value.length === 1);

    test.done();
}

exports.example4 = function(test) {
    var query = "SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } UNION {?s :p3 ?v3 } }";

    var result = aqt.parseSelect(query);

    test.ok(result.kind ==='UNION');
    test.ok(result.value.length === 2);

    test.ok(result.value[0].kind === 'UNION');
    test.ok(result.value[0].value.length === 2);

    test.ok(result.value[1].kind === 'BGP');
    test.ok(result.value[1].value.length === 1);
    test.ok(result.value[1].value[0].object.value === 'v3');
    test.ok(result.value[1].value[0].object.token === 'var');

    test.ok(result.value[0].value[0].kind === 'BGP');
    test.ok(result.value[0].value[0].value.length === 1);
    test.ok(result.value[0].value[0].value[0].object.value === 'v1');
    test.ok(result.value[0].value[1].kind === 'BGP');
    test.ok(result.value[0].value[1].value.length === 1);
    test.ok(result.value[0].value[1].value[0].object.value === 'v2');

    test.done();
}


exports.example5 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } }";

    var result = aqt.parseSelect(query);

    test.ok(result.kind === "LEFT_JOIN");
    test.ok(result.filter === true);
    test.ok(result.lvalue.kind === "BGP");
    test.ok(result.lvalue.value.length === 1);
    test.ok(result.rvalue.kind === "BGP");
    test.ok(result.rvalue.value.length === 1);
    test.done();
}


exports.example6 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } OPTIONAL { ?s :p3 ?v3 } }";

    var result = aqt.parseSelect(query);

    test.ok(result.kind === "LEFT_JOIN");
    test.ok(result.lvalue.kind === "LEFT_JOIN");
    test.ok(result.lvalue.lvalue.kind === "BGP");
    test.ok(result.lvalue.rvalue.kind === "BGP");
    test.ok(result.rvalue.kind === "BGP");
    test.done();
}

exports.example7 = function(test) {
    var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3) } }";

    var result = aqt.parseSelect(query);

    test.ok(result.kind === "LEFT_JOIN");
    test.ok(result.filter.length === 1);
    test.ok(result.filter[0].token === 'filter');
    test.ok(result.lvalue.kind === "BGP");
    test.ok(result.rvalue.kind === "BGP");

    test.done();
}

exports.example8 = function(test) {
    var query = "SELECT * { {?s :p1 ?v1} UNION {?s :p2 ?v2} OPTIONAL {?s :p3 ?v3} }";

    var result = aqt.parseSelect(query);

    console.log(result);
//    test.ok(result.kind === "LEFT_JOIN");
//    test.ok(result.filter.length === 1);
//    test.ok(result.filter[0].token === 'filter');
//    test.ok(result.lvalue.kind === "BGP");
//    test.ok(result.rvalue.kind === "BGP");

    test.done();
}

var Micrograph = require("./../src/micrograph").Micrograph;
var MicrographQL = require("./../src/micrograph_ql").MicrographQL;
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;

var sys = null;
try {
    sys = require("util");
} catch(e) {
    sys = require("sys");
}

var aqt = new AbstractQueryTree.AbstractQueryTree();

exports.bgp1 = function(test) {
    MicrographQL.counter = 0;
    var pattern = Micrograph.prototype._parseQuery({name: "john"});
    var parsedQuery = aqt.parseQueryString("SELECT ?id0 ?id0p ?id0o { ?id0 <name> \"john\" ; ?id0p ?id0o . }");
    test.ok(pattern.varsMap['id0'] === 'id0');
    test.ok(sys.inspect(pattern.query,true,20) == sys.inspect(parsedQuery,true,20));
    test.done();

};

exports.bgp2 = function(test) {
    MicrographQL.counter = 0;
    MicrographQL.counter = 0;
    var pattern = Micrograph.prototype._parseQuery({name: "john", friend: {name: "mary"}});

    var parsedQuery = aqt.parseQueryString("SELECT ?id0 ?id1 { ?id0 <name> \"john\" ; ?id0p ?id0o . ?id0 <friend> ?id1 . ?id1 <name> <mary> ; ?id1p ?id1o }");
    test.ok(pattern.varsMap['id0'] === 'id0');
    test.ok(pattern.varsMap['id1'] === 'id1');
    test.ok(pattern.query.units[0].pattern.patterns.length === parsedQuery.units[0].pattern.patterns.length);
    test.done();

};
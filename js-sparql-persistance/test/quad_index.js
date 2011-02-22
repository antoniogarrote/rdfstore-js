var QuadIndex = require("./../src/quad_index").QuadIndex;
var QuadIndexCommon = require("./../src/quad_index_common").QuadIndexCommon;

var quadBuilder = function(s,p,o) {
    return new QuadIndexCommon.NodeKey({subject: s, predicate:p, object:o}, ['subject', 'predicate', 'object']);
}

var patternBuiler = function(s,p,o) {
    return new QuadIndexCommon.Pattern({subject: s, predicate:p, object:o});
}

exports.rangeQuery = function(test) {
    var t = new QuadIndex.Tree({order: 2});

    for(var i=0; i< 10; i++) {
        t.insert(quadBuilder(i,0,0));
    }

    for(var i=5; i< 10; i++) {
        t.insert(quadBuilder(5,i,0));
    }

    var results = t.range(patternBuiler(5,null,null));

    console.log(results.length)
    for(var i=0; i<results.length; i++) {
        console.log(results[i]);
    }
    test.ok(results.length === 6);

    test.done();
}

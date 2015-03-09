var QuadIndexCommon = require("./../src/quad_index_common").QuadIndexCommon;

exports.nodeKeyComparator = function(test) {
    var order = ['subject', 'predicate', 'object'];

    var comps1 = {subject:1, predicate:2, object:3, graph:4};
    var comps2 = {subject:1, predicate:2, object:5, graph:4};

    var quad1 = new QuadIndexCommon.NodeKey(comps1, order);
    var quad2 = new QuadIndexCommon.NodeKey(comps2, order);

    test.ok(quad1.comparator(quad2) === -1);

    quad1['object'] = 6;
    test.ok(quad1.comparator(quad2) === 1);

    quad1['object'] = quad2['object'];
    test.ok(quad1.comparator(quad2) === 0);

    quad2['object'] = null;
    test.ok(quad1.comparator(quad2) === 0);
    quad1['predicate'] = 0;
    test.ok(quad1.comparator(quad2) === -1);
    quad1['predicate'] = 10;
    test.ok(quad1.comparator(quad2) === 1);

    test.done();
};

exports.quadPatternBuild = function(test) {
    var comps1 = {subject:1, predicate:'p', object:3, graph:4};

    var pattern = new QuadIndexCommon.Pattern(comps1);

    test.ok(pattern.subject===1);
    test.ok(pattern.predicate==='p');
    test.ok(pattern.object===3);
    test.ok(pattern.graph===4);

    test.ok(pattern.keyComponents.subject===1)
    test.ok(pattern.keyComponents.predicate===null)
    test.ok(pattern.keyComponents.object===3)
    test.ok(pattern.keyComponents.graph===4)

    test.ok(pattern.order[0] === 'subject');
    test.ok(pattern.order[1] === 'object');
    test.ok(pattern.order[2] === 'graph');
    test.ok(pattern.order[3] === 'predicate');
    test.ok(pattern.order.length === 4);

    test.done();
}


exports.quadPatternIndexKey = function(test) {
    var comps1 = {subject:1, predicate:'p', object:3, graph:4};
    var pattern = new QuadIndexCommon.Pattern(comps1);
    test.ok(pattern.indexKey[0] === "subject");
    test.ok(pattern.indexKey[1] === "object");
    test.ok(pattern.indexKey[2] === "graph");
    test.ok(pattern.indexKey.length === 3);

    var comps1 = {subject:1, predicate:'p', object:3, graph:'g'};
    var pattern = new QuadIndexCommon.Pattern(comps1);

    test.ok(pattern.indexKey[0] === "subject");
    test.ok(pattern.indexKey[1] === "object");
    test.ok(pattern.indexKey.length === 2);

    var comps1 = {subject:1, predicate:4, object:3, graph:5};
    var pattern = new QuadIndexCommon.Pattern(comps1);
    test.ok(pattern.indexKey[0] === "subject");
    test.ok(pattern.indexKey[1] === "predicate");
    test.ok(pattern.indexKey[2] === "object");
    test.ok(pattern.indexKey[3] === "graph");

    test.ok(pattern.indexKey.length === 4);

    test.done();
}

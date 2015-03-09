var QuadBackend = require("./../src/quad_backend").QuadBackend;
var QuadIndexCommon = require("./../src/quad_index_common").QuadIndexCommon;

exports.indexForPatternTest = function(test) {

    var backend = new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
        var comps = {subject:1, predicate:'p', object:3, graph:4};
        var pattern = new QuadIndexCommon.Pattern(comps);
        test.ok(backend._indexForPattern(pattern)==="OGS");


        var comps = {subject:1, predicate:'p', object:3, graph:'g'};
        var pattern = new QuadIndexCommon.Pattern(comps);
        test.ok(backend._indexForPattern(pattern)==="OS");


        var comps = {subject:'s', predicate:'p', object:3, graph:3};
        var pattern = new QuadIndexCommon.Pattern(comps);
        test.ok(backend._indexForPattern(pattern)==="OGS");

        var comps = {subject:1, predicate:3, object:3, graph:3};
        var pattern = new QuadIndexCommon.Pattern(comps);
        test.ok(backend._indexForPattern(pattern)==="SPOG");


        var comps = {subject:'s', predicate:3, object:3, graph:3};
        var pattern = new QuadIndexCommon.Pattern(comps);
        test.ok(backend._indexForPattern(pattern)==="POG");

        var comps = {subject:'s', predicate:3, object:'o', graph:4};
        var pattern = new QuadIndexCommon.Pattern(comps);
        test.ok(backend._indexForPattern(pattern)==="GP");

        var comps = {subject:'s', predicate:'p', object:5, graph:6};
        var pattern = new QuadIndexCommon.Pattern(comps);
        test.ok(backend._indexForPattern(pattern)==="OGS");

        var comps = {subject:0, predicate:'p', object:'o', graph:6};
        var pattern = new QuadIndexCommon.Pattern(comps);
        test.ok(backend._indexForPattern(pattern)==="GSP");

        test.done();
    });
}

exports.indexAndRetrievalTest = function(test) {
    var backend = new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
        var key = new QuadIndexCommon.NodeKey({subject:1, predicate:2, object:3, graph:4})

        backend.index(key, function(result){
            for(var i=0; i<backend.indices.length; i++) {
                var indexKey = backend.indices[i];
                var index = backend.indexMap[indexKey];

                test.ok(index.root.numberActives === 1);
                test.ok(index.root.keys.length === 1);

                test.ok(index.root.keys[0].key.subject === 1);
                test.ok(index.root.keys[0].key.predicate === 2);
                test.ok(index.root.keys[0].key.object === 3);
                test.ok(index.root.keys[0].key.graph === 4);
            }

            var pattern = new QuadIndexCommon.Pattern({subject:null, object:2, predicate:3, graph:4});
            backend.range(pattern, function(results){
                test.ok(results.length===1);

                backend.delete(results[0]);
                for(var i=0; i<backend.indices.length; i++) {
                    var indexKey = backend.indices[i];
                    var index = backend.indexMap[indexKey];

                    test.ok(index.root.numberActives === 0);
                    test.ok(index.root.keys.length === 0);
                }

                test.done();
            });
        });
    });
}

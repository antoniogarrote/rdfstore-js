var QuadBackend = require("./../src/quad_backend").QuadBackend;
var QuadIndexCommon = require("./../src/quad_index_common").QuadIndexCommon;

exports.indexForPatternTest = function(test) {
    
    var backend = new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
        var comps = {subject:1, predicate:'p', object:3, graph:4};
        var pattern = new QuadIndexCommon.Pattern(comps);

        console.log(backend._indexForPattern(pattern));
        test.ok(backend._indexForPattern(pattern)==="OGS");

        test.done();
    });    
}

var QuadBackend = require('../src/quad_backend').QuadBackend;
var Pattern = require('../src/quad_index').Pattern;
var NodeKey = require('../src/quad_index').NodeKey;

describe("QuadBackend", function(){

    it("Should choose the right index for the provided pattern", function(done) {
        new QuadBackend({treeOrder: 2}, function(backend){
            var comps = {subject:1, predicate:'p', object:3, graph:4};
            var pattern = new Pattern(comps);
            expect(backend._indexForPattern(pattern)).toBe("OGS");


            comps = {subject:1, predicate:'p', object:3, graph:'g'};
            pattern = new Pattern(comps);
            expect(backend._indexForPattern(pattern)).toBe("OS");


            comps = {subject:'s', predicate:'p', object:3, graph:3};
            pattern = new Pattern(comps);
            expect(backend._indexForPattern(pattern)).toBe("OGS");

            comps = {subject:1, predicate:3, object:3, graph:3};
            pattern = new Pattern(comps);
            expect(backend._indexForPattern(pattern)).toBe("SPOG");


            comps = {subject:'s', predicate:3, object:3, graph:3};
            pattern = new Pattern(comps);
            expect(backend._indexForPattern(pattern)).toBe("POG");

            comps = {subject:'s', predicate:3, object:'o', graph:4};
            pattern = new Pattern(comps);
            expect(backend._indexForPattern(pattern)).toBe("GP");

            comps = {subject:'s', predicate:'p', object:5, graph:6};
            pattern = new Pattern(comps);
            expect(backend._indexForPattern(pattern)).toBe("OGS");

            comps = {subject:0, predicate:'p', object:'o', graph:6};
            pattern = new Pattern(comps);
            expect(backend._indexForPattern(pattern)).toBe("GSP");

            done();
        });
    });

    it("Should be possible to index, retrieve and delete quads from the backend", function(done){
        new QuadBackend({treeOrder: 2}, function(backend){
            var key = new NodeKey({subject:1, predicate:2, object:3, graph:4});

            backend.index(key, function(){
                for(var i=0; i<backend.indices.length; i++) {
                    var indexKey = backend.indices[i];
                    var index = backend.indexMap[indexKey];

                    expect(index.root.numberActives).toBe(1);
                    expect(index.root.keys.length).toBe(1);

                    expect(index.root.keys[0].key.subject).toBe(1);
                    expect(index.root.keys[0].key.predicate).toBe(2);
                    expect(index.root.keys[0].key.object).toBe(3);
                    expect(index.root.keys[0].key.graph).toBe(4);
                }

                var pattern = new Pattern({subject:'s', predicate:2, object:3, graph:4});
                backend.range(pattern, function(results){
                    expect(results.length).toBe(1);

                    backend.delete(results[0], function(){

                        for(var i=0; i<backend.indices.length; i++) {
                            var indexKey = backend.indices[i];
                            var index = backend.indexMap[indexKey];

                            expect(index.root.numberActives).toBe(0);
                            expect(index.root.keys.length).toBe(0);
                        }

                        done();
                    });
                });
            });
        });
    });
});
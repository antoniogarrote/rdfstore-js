var QuadBackend = require('../src/persistent_quad_backend').QuadBackend;
var Pattern = require('../src/quad_index').Pattern;
var NodeKey = require('../src/quad_index').NodeKey;
/*
describe("PersistentQuadBackend", function(){


    it("Should be possible to index, retrieve and delete quads from the backend", function(done){
        new QuadBackend({}, function(backend){
            var key = new NodeKey({subject:1, predicate:2, object:3, graph:4});

            backend.index(key, function(){

                var pattern = new Pattern({subject:'s', predicate:2, object:3, graph:4});
                backend.range(pattern, function(results){
                    expect(results.length).toBe(1);

                    backend.delete(results[0], function(){
                        backend.db.close();
                        done();
                    });
                });
            });
        });
    });

});
*/

var QuadIndex = require('../src/quad_index').QuadIndex;
var NodeKey = require('../src/quad_index').NodeKey;
var Pattern = require('../src/quad_index').Pattern;
var async = require('async');

describe("NodeKey", function(){

    it("Should be possible compare NodeKey objects", function(){

        var order = ['subject', 'predicate', 'object'];

        var comps1 = {subject:1, predicate:2, object:3, graph:4};
        var comps2 = {subject:1, predicate:2, object:5, graph:4};

        var quad1 = new NodeKey(comps1, order);
        var quad2 = new NodeKey(comps2, order);

        expect(quad1.comparator(quad2)).toBe(-1);

        quad1['object'] = 6;
        expect(quad1.comparator(quad2)).toBe(1);

        quad1['object'] = quad2['object'];
        expect(quad1.comparator(quad2)).toBe(0);

        quad2['object'] = null;
        expect(quad1.comparator(quad2)).toBe(0);

        quad1['predicate'] = 0;
        expect(quad1.comparator(quad2)).toBe(-1);

        quad1['predicate'] = 10;
        expect(quad1.comparator(quad2)).toBe(1);

    });

});

describe("Pattern", function(){

    it("Should be possible to build patterns", function(){
            var comps1 = {subject:1, predicate:'p', object:3, graph:4};

            var pattern = new Pattern(comps1);

            expect(pattern.subject).toBe(1);
            expect(pattern.predicate).toBe('p');
            expect(pattern.object).toBe(3);
            expect(pattern.graph).toBe(4);

            expect(pattern.keyComponents.subject).toBe(1);
            expect(pattern.keyComponents.predicate).toBe(null);
            expect(pattern.keyComponents.object).toBe(3);
            expect(pattern.keyComponents.graph).toBe(4);

            expect(pattern.order[0]).toBe('subject');
            expect(pattern.order[1]).toBe('object');
            expect(pattern.order[2]).toBe('graph');
            expect(pattern.order[3]).toBe('predicate');
            expect(pattern.order.length).toBe(4);

    });



    it("Should be possible to build patterns with the right indexKey", function(){
        var comps1 = {subject:1, predicate:'p', object:3, graph:4};
        var pattern = new Pattern(comps1);

        expect(pattern.indexKey[0]).toBe("subject");
        expect(pattern.indexKey[1]).toBe("object");
        expect(pattern.indexKey[2]).toBe("graph");
        expect(pattern.indexKey.length).toBe(3);

        comps1 = {subject:1, predicate:'p', object:3, graph:'g'};
        pattern = new Pattern(comps1);

        expect(pattern.indexKey[0]).toBe("subject");
        expect(pattern.indexKey[1]).toBe("object");
        expect(pattern.indexKey.length).toBe(2);

        comps1 = {subject:1, predicate:4, object:3, graph:5};
        pattern = new Pattern(comps1);

        expect(pattern.indexKey[0]).toBe("subject");
        expect(pattern.indexKey[1]).toBe("predicate");
        expect(pattern.indexKey[2]).toBe("object");
        expect(pattern.indexKey[3]).toBe("graph");

        expect(pattern.indexKey.length).toBe(4);
    });

});

describe("QuadIndex", function(){

    var quadBuilder = function(s,p,o) {
        return new NodeKey({subject: s, predicate:p, object:o});
    };

    var patternBuiler = function(s,p,o) {
        return new Pattern({subject: s, predicate:p, object:o});
    };

    var repeat = function(c,max,floop,fend,env) {
        if(arguments.length===4) { env = {}; }
        if(c<max) {
            env._i = c;
            floop(function(floop,env){
                repeat(c+1, max, floop, fend, env);
            },env);
        } else {
            fend(env);
        }
    }


    it("Should be possible to run range queries over the QuadIndex", function(done){

        new QuadIndex({order: 2, componentOrder:['subject', 'predicate', 'object']}, function(index){

            async.timesSeries(10, function(i,k){
                index.insert(quadBuilder(i,0,0), function(){
                    k();
                });
            }, function(){
                async.timesSeries(5, function(i,k){
                    index.insert(quadBuilder(5,5+i,0), function(){
                        k();
                    });
                }, function(){
                    index.range(patternBuiler(5,null,null), function(results){
                        for(var i=0; i<results.length; i++) {
                            expect(results[i].subject).toBe(5);
                        }
                        expect(results.length).toBe(6);
                        done();
                    });
                })
            });

        });

    });

});
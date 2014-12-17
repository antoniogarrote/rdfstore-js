var QuadIndex = require('../src/quad_index').QuadIndex;
var NodeKey = require('../src/quad_index').NodeKey;
var Pattern = require('../src/quad_index').Pattern;

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
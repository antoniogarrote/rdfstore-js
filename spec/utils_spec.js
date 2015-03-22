var Utils = require("../src/utils");

describe("Utils", function () {

    it("Should compute the size of objects", function (done) {
        expect(Utils.size([1,2,3,4])).toBe(4);
        expect(Utils.size({a:1,b:2})).toBe(2);
        done()
    });

    it("Should return the values of an object", function(done){
        var values = Utils.values({a:1,b:'c'});
        expect(values[0]).toBe(1);
        expect(values[1]).toBe('c');
        done();
    })
});
var RVN3Parser = require('../src/rvn3_parser').RVN3Parser;
var path = require('path');

describe("RVN3Parser#parsing", function(){

    it("Should be able to parse N3 data with a provided graph", function(done){
        fs = require('fs');
        fs.readFile(path.resolve(__dirname, "data/sp2b_10k.n3"), function(err, data) {
            if(err) throw err;
            data = data.toString('utf8');
            RVN3Parser.parser.parse(data, 'http://test.com/graph1', {}, function(err, result){
                expect(err == null);
                expect(result.length).toBe(43);

                for(var i=0; i<result.length; i++) {
                    expect(result[i].graph['value']).toBe('http://test.com/graph1');
                }
                done();
            });
        });
    });

    it("Should be able to parse N3 data with a null graph", function(done){
        fs = require('fs');
        fs.readFile(path.resolve(__dirname, "data/sp2b_10k.n3"), function(err, data) {
            if(err) throw err;
            data = data.toString('utf8');
            RVN3Parser.parser.parse(data, {}, function(err, result){
                expect(err == null);
                expect(result.length).toBe(43);

                for(var i=0; i<result.length; i++) {
                    expect(result[i].graph).toBe(null);
                }
                done();
            });
        });
    });

});
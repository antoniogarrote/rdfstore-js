var N3Parser = require("./../src/n3_parser.js").N3Parser;


exports.testParsing1 = function(test) {

        fs = require('fs');
        fs.readFile("./data/sp2b_10k.n3", function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            console.log("DATA:"+data.length);
            var result = N3Parser.parser.parse(data);
            console.log(result.length+" triples parsed");
            test.ok(result.length===43);
            test.done();
        });

};

exports.testParsing2 = function(test) {

        fs = require('fs');
        fs.readFile("./data/with_comments.n3", function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            console.log("DATA:"+data.length);
            var result = N3Parser.parser.parse(data);
            test.ok(result.length===9);
            test.done();
        });

};

exports.testParsing3 = function(test) {

        fs = require('fs');
        fs.readFile("./data/sp2b_1M.n3", function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            console.log("DATA:"+data.length);
            var result = N3Parser.parser.parse(data);
            console.log(result.length+" triples parsed");
            test.ok(result.length===10303);
            test.done();
        });

};

var Utils = require("./../src/utils").Utils;

exports.testSeq = function(test){
    acum = [];
    Utils.seq(function(k){
        acum.push(1);
        k();
    }, function(k){
        acum.push(2);
        k();
    })(function(){
        test.ok(acum.length === 2);
        test.ok(acum[0] === 1);
        test.ok(acum[1] === 2);

        test.done();
    });
}

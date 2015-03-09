var QuadIndex = require("./../src/quad_index").QuadIndex;
var QuadIndexCommon = require("./../src/quad_index_common").QuadIndexCommon;

var quadBuilder = function(s,p,o) {
    return new QuadIndexCommon.NodeKey({subject: s, predicate:p, object:o});
}

var patternBuiler = function(s,p,o) {
    return new QuadIndexCommon.Pattern({subject: s, predicate:p, object:o});
}

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

exports.testRepeat = function(test){
    var acum = [];
    repeat(0,10, function(c,env){
        acum.push(env._i);
        c(arguments.callee,env);
    }, function(env){
        test.ok(acum.length==10);
        test.done();
    });
}


exports.rangeQuery = function(test) {

    new QuadIndex.Tree({order: 2, componentOrder:['subject', 'predicate', 'object']}, function(t){

        repeat(0, 10, function(k,env){
            var floop = arguments.callee;
            t.insert(quadBuilder(env._i,0,0), function(){
                k(floop, env);
            });
        }, function(env){
            repeat(5, 10, function(k,env){
                var floop = arguments.callee;
                t.insert(quadBuilder(5,env._i,0), function(){
                    k(floop, env);
                });
            }, function(env){
                t.range(patternBuiler(5,null,null), function(results){
                    for(var i=0; i<results.length; i++) {
                        test.ok(results[i].subject === 5);
                    }
                    test.ok(results.length === 6);
                    test.done();
                });
            })
        });

    });
}


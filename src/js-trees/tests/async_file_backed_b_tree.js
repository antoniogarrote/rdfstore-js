var AsyncFileBackedBTree = require('./../src/async_file_backed_b_tree').AsyncFileBackedBTree;
var Utils = require("./../src/utils").Utils;
var fs = require('fs');


exports.testCreateTree = function(test) {
    var i =  Math.floor(Math.random()* 10000);
    var tmpFileName = "/tmp/disk_manager_test_"+i+".tmp";

    t = new AsyncFileBackedBTree.AsyncFileBackedFloatFloatBTree({path: tmpFileName, order: 2}, function(){
        t.init(function(t){
            t.insert(11,11, function(){
                t.insert(6,6, function(){
                    t.insert(5,5, function(){
                        t.search(6, function(result) {
                            test.ok(result===6);
                            t.close(function(){
                                new AsyncFileBackedBTree.AsyncFileBackedFloatFloatBTree({path: tmpFileName, order: 2}, function(){
                                    t.load(function(t){
                                        t.search(6, function(result){
                                            test.ok(result===6);
                                            t.delete(5, function(){
                                                t.search(6, function(result){
                                                    test.ok(result===6);
                                                    t.search(11, function(result){
                                                        test.ok(result===11);
                                                        t.search(5, function(result){
                                                            test.ok(result===null);
                                                            fs.unlinkSync(tmpFileName);
                                                            test.done();
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

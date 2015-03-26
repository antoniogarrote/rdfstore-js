var HashTree = require('btree_hash').Tree;
var MemBTree = require('../btree').Tree;
var async = require('../utils');

var shuffle = function(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var data = [];
var max_data = 100000;
for(var j=0; j<max_data; j++)
    data.push(j);
shuffle(data);


console.log("TESTING Mem BTree");
var before = (new Date()).getTime();
async.seq(function(_,c){
        new MemBTree(2,function(tree){
            c(null,tree);
        })
    },
    function(tree,c){
        j=0;
        async.whilst(function(){
                return j<max_data;
            },
            function(cc){
                tree.insert(data[j],data[j], function(){
                    j++;
                    cc();
                })
            },
            function() {
                c(null, tree);
            });
    },function(tree,c){
        j=0;
        async.whilst(function(){
            return j<max_data;
        }, function(cc){
            tree.delete(data[j],function(){
                j++;
                cc();
            })
        }, function(){
            var after = (new Date()).getTime();
            console.log("USED: "+(after - before));

            var found = [];
            tree.walk(function(n) {
                found.push(n);
            }, function(){
                if(found.length === 0) {
                    console.log("CORRECT...")
                } else {
                    console.log("INCORRECT...");
                }
                c();
            });

        });
    })(null,function(){


    console.log("TESTING Hash BTree");
    var before = (new Date()).getTime();
    async.seq(function(_,c){
            new HashTree(parseInt,function(tree){
                c(null,tree);
            })
        },
        function(tree,c){
            j=0;
            async.whilst(function(){
                    return j<max_data;
                },
                function(cc){
                    tree.insert(data[j],data[j], function(){
                        j++;
                        cc();
                    })
                },
                function() {
                    c(null, tree);
                });
        },function(tree,c){
            j=0;
            async.whilst(function(){
                return j<max_data;
            }, function(cc){
                tree.delete(data[j],function(){
                    j++;
                    cc();
                })
            }, function(){
                var after = (new Date()).getTime();
                console.log("USED: "+(after - before));

                var found = [];
                tree.walk(function(n) {
                    found.push(n);
                }, function(){
                    if(found.length === 0) {
                        console.log("CORRECT...")
                    } else {
                        console.log("INCORRECT...");
                    }
                    c();
                });

            });
        })(null,function(){
        console.log("**** FINISHED");
    });

});





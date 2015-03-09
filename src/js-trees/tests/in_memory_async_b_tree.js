var btree = require("./../src/in_memory_async_b_tree").InMemoryAsyncBTree;
var Utils = require("./../src/utils").Utils;

exports.testInsertionSearchWalk = function(test) {
    var t = new btree.Tree(2);

    var data = [];
    var isReady = function(){
        if(data.length === 11) {
            mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 11, 14, 15 ];

            for(var i=0; i<mustFind.length; i++) {
                test.ok(mustFind[i] === data[i]);
            }

            test.done();
        }
    }

    t.insert(11,11,function(){
    t.insert(2,2, function(){
    t.insert(14,14, function(){
    t.insert(15,15,function(){
    t.insert(1,1, function(){
    t.insert(7,7, function(){
    t.insert(5,5, function(){
    t.insert(8,8, function(){
    t.insert(4,4, function(){
    t.insert(6,6, function(){
    t.insert(3,3, function(){


        t.search(5, function(r){
            test.ok(r,5);

            t.walk(function(n) {
                data.push(n.data);
                isReady();
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


exports.testDeletions = function(test) {
    var t = new btree.Tree(2);

    t.insert(9,9,function(){
    t.insert(2,2,function(){
    t.insert(10,10,function(){
    t.insert(11,11,function(){
    t.insert(1,1,function(){
    t.insert(7,7,function(){
    t.insert(5,5,function(){
    t.insert(8,8,function(){
    t.insert(14,14,function(){
    t.insert(15,15,function(){
    t.insert(4,4,function(){
    t.insert(6,6,function(){
    t.insert(3,3,function(){


    t.search(9,function(d){
        test.ok(d===9)

        t.delete(9,function(){
        t.delete(2,function(){
        t.delete(10,function(){
        t.delete(11,function(){
        t.delete(1,function(){
        t.delete(7,function(){
        t.delete(5,function(){
        t.delete(8,function(){
        t.delete(14,function(){
        t.delete(15,function(){
        t.delete(4,function(){
        t.delete(6,function(){
        t.delete(3,function(){

            test.ok(t.root.numberActives===0);
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

var shuffle = function(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};


exports.testDeletionBig = function(test) {
    var t = new btree.Tree(15);
    var acum = [];
    var limit = 150000;
    for(var i=0; i<limit; i++) {
        acum.push(i);
    }

    acum = shuffle(acum);

    for(var i=0; i<limit; i++) {
        t.insert(acum[i],acum[i],function(){});
    }

    t.search(9,function(d){
        test.ok(d===9)
        
        acum = shuffle(acum);
        var before = new Date().getTime();
        console.log("*** DELETING");
        for(var i=0; i<limit; i++) {
            t.delete(acum[i],function(){});
        }
        
        var after = new Date().getTime();
        console.log("*** DELETED -> "+(after-before));
        test.ok(t.root.numberActives===0);
        test.done();
       
    });
}

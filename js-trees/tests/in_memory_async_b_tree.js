var btree = require("./../src/in_memory_async_b_tree").InMemoryAsyncBTree;
var Utils = require("./../src/utils").Utils;

exports.testInsertionSearchWalk = function(test) {
    var t = new btree.Tree(2);

    t.insert(11,11,function(){
    t.insert(2,2, function(){
    t.insert(14,14, function(){
    t.insert(14,14, function(){
    t.insert(15,15,function(){
    t.insert(1,1, function(){
    t.insert(7,7, function(){
    t.insert(5,5, function(){
    t.insert(8,8, function(){
    t.insert(4,4, function(){
    t.insert(6,6, function(){
    t.insert(3,3, function(){


        t.search(50, function(r){
            test.ok(r,50);

            var data = [];
            t.walk(function(n) {
                console.log(n.data)
                data.push(n.data);
            });
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

/*
    var data = [];
    t.walk(function(n) {
        data.push(n.data);
    });

    mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 11, 14, 15 ];

    for(var i=0; i<mustFind.length; i++) {
        test.ok(mustFind[i] === data[i]);
    }

    test.done();
*/
}

/*
exports.testDeletions = function(test) {
    var t = new btree.Tree(2);

    t.insert(9,9);
    t.insert(2,2);
    t.insert(10,10);
    t.insert(11,11);
    t.insert(1,1);
    t.insert(7,7);
    t.insert(5,5);
    t.insert(8,8);
    t.insert(14,14);
    t.insert(15,15);
    t.insert(4,4);
    t.insert(6,6);
    t.insert(3,3);

    test.ok(t.search(9)===9);


    mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15 ];

    var data = [];
    t.walk(function(n) {
        data.push(n);
    });

    for(var i=0; i<mustFind.length; i++) {
        test.ok(mustFind[i] === data[i].data);
    }

    t.delete(9);

    mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 14, 15 ];

    var data = [];
    t.walk(function(n) {
        data.push(n);
    });

    for(var i=0; i<mustFind.length; i++) {
        test.ok(mustFind[i] === data[i].data);
    }

    t.delete(3);

    mustFind = [ 1, 2, 4, 5, 6, 7, 8, 10, 11, 14, 15 ];

    var data = [];
    t.walk(function(n) {
        data.push(n);
    });

    for(var i=0; i<mustFind.length; i++) {
        test.ok(mustFind[i] === data[i].data);
    }

    for(var i=0; i<mustFind.length; i++) {
        t.delete(mustFind[i]);
    }

    var data = [];
    t.walk(function(n) {
        data.push(n);
    });

    test.ok(data.length===0);

    test.done();
}

exports.randomArrays = function(test) {
    var max = 50;
    var max_data = 10000;


    for(var i=0; i<max; i++) {
        var next = i * 100 /max;
        console.log(next+"%.");

        var t = new btree.Tree(2);

        var data = [];
        for(var j=0; j<max_data; j++) {
            data.push(j);
        }
        Utils.shuffle(data);

        //console.log("-- Trial:");
        for(var z=0; z<data.length; z++) {
            t.insert(data[z]);
            //console.log(data[z]);
        }
        data = Utils.shuffle(data);

        //console.log("-- Removal order:")
        for(var z=0; z<data.length; z++) {
            //console.log(data[z]);
            t.delete(data[z]);
        }

        var acum = [];
        t.walk(function(n) { acum.push(n); });
        test.ok(t.audit(false).length===0);

        if(acum.length != 0) {
            //console.log("-------------------------------------");
            //console.log("!");
        }
        test.ok(acum.length===0);
    }
    test.done();
}
*/

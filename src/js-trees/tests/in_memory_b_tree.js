var btree = require("./../src/in_memory_b_tree").InMemoryBTree;
var Utils = require("./../src/utils").Utils;

exports.testInsertionSearchWalk = function(test) {
    var t = new btree.Tree(2);

    t.insert(11,11);
    t.insert(2,2);
    t.insert(14,14);
    t.insert(15,15);
    t.insert(1,1);
    t.insert(7,7);
    t.insert(5,5);
    t.insert(8,8);
    t.insert(4,4);
    t.insert(6,6);
    t.insert(3,3);

    test.ok(t.search(6)===6);

    var data = [];
    t.walk(function(n) {
        data.push(n.data);
    });

    mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 11, 14, 15 ];

    for(var i=0; i<mustFind.length; i++) {
        test.ok(mustFind[i] === data[i]);
    }

    test.done();
}


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
        t.insert(acum[i],acum[i]);
    }

    var d = t.search(9);
    test.ok(d===9)
        
    acum = shuffle(acum);
    var before = new Date().getTime();
    console.log("*** DELETING");
    for(var i=0; i<limit; i++) {
        t.delete(acum[i]);
    }
        
    var after = new Date().getTime();
    console.log("*** DELETED -> "+(after-before));
    test.ok(t.root.numberActives===0);
    test.done();
       
}


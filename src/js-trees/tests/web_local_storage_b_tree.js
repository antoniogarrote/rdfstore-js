var btree = require("./../src/web_local_storage_b_tree").WebLocalStorageBTree;
var Utils = require("./../src/utils").Utils;
var PriorityQueue = require("./../src/priority_queue").PriorityQueue;

exports.testDecodeEncode = function(test) {
    var input = "1:test6:1:0:1:591:n::2:test2:test8";
    res = btree.LocalStorageManager.prototype._decode(input);
    test.ok(res.children.length==2);
    test.ok(btree.LocalStorageManager.prototype._encode(res)===input);
    test.done();
};

exports.testEncodeDecode = function(test) {
    var input = {keys:[{key: {subject:1,object:2,predicate:3}, data:null}], 
                 children: ['a','b'],
                 isLeaf: false,
                 pointer: 'pointer',
                 numberActives: 1,
                 level: 0};
    var encoded = btree.LocalStorageManager.prototype._encode(input);
    var decoded = btree.LocalStorageManager.prototype._decode(encoded);
    test.ok(input.keys.length === decoded.keys.length);
    test.ok(input.isLeaf === decoded.isLeaf);
    test.ok(input.pointer === decoded.pointer);
    test.ok(input.level === decoded.level);
    test.ok(input.numberActives === decoded.numberActives);
    test.ok(input.children.length === decoded.children.length);
    for(var i=0; i<input.children.length; i++) {
        test.ok(input.children[i] === decoded.children[i]);
    }
    for(var i=0; i<input.keys.length; i++) {
        var keyInput = input.keys[i];
        var keyDec = decoded.keys[i];
        test.ok(keyInput['subject'] === keyDec['subject']);
        test.ok(keyInput['predicate'] === keyDec['predicate']);
        test.ok(keyInput['object'] === keyDec['object']);
        test.ok(keyInput['graph'] === keyDec['graph']);
        test.ok(keyInput.data == keyDec.data);
    }

    test.ok(encoded === btree.LocalStorageManager.prototype._encode(decoded));

    test.done();
};

exports.testBufferCache = function(test) {

    var pq = new PriorityQueue.PriorityQueue({maxSize: 3});

    var testPriorities = function(store, contents) {
        if(contents.length > 1) {
            for(var i=1; i<contents.length; i++) {
                //console.log(contents[i]+" ("+store[contents[i]].priority+") vs "+contents[i-1]+" ("+store[contents[i-1]].priority+")");
                test.ok(store[contents[i]].priority < store[contents[i-1]].priority);
            }
        }
    }
    pq.push('a',1);
    pq.debugSort();
    testPriorities(pq.debugStore, pq.debugContents);
    pq.push('b',2);
    pq.debugSort();
    testPriorities(pq.debugStore, pq.debugContents);
    test.ok(pq.fetch('a') === 1);
    pq.debugSort();
    testPriorities(pq.debugStore, pq.debugContents);
    pq.push('c',3);
    pq.debugSort();
    testPriorities(pq.debugStore, pq.debugContents);
    test.ok(pq.fetch('b') === 2);
    pq.debugSort();
    testPriorities(pq.debugStore, pq.debugContents);
    pq.push('d',4);
    test.ok(pq.debugContents.length === 3);
    pq.debugSort();
    testPriorities(pq.debugStore, pq.debugContents);
    pq.remove('a'); 
    pq.remove('c'); 
    pq.remove('d'); 
    pq.remove('b'); 
    test.ok(pq.debugContents.length === 0);
    test.done();
};



exports.testInsertionSearchWalk = function(test) {
    var t = new btree.Tree(2, 'test', false);

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
    var t = new btree.Tree(2, 'test', false);

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
        test.ok(t.search(mustFind[i])===mustFind[i]);
        t.delete(mustFind[i]);
        test.ok(t.search(mustFind[i])===null);
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
    var max_data = 1000;


    var t = new btree.Tree(2, 'test', false);
    i = 0;
    for(var i=0; i<max; i++) {
        var next = i * 100 /max;
        console.log(next+"%.");

        var data = [];
        for(var j=0; j<max_data; j++) {
            data.push(j);
        }

        Utils.shuffle(data);

        //console.log("-- Trial:");
        for(var z=0; z<data.length; z++) {
            //console.log(z+"/"+data.length);
            t.insert(data[z]);
        }

        data = Utils.shuffle(data);

        //console.log("-- Removal order:")
        for(var z=0; z<data.length; z++) {
            //console.log(z+"/"+data.length);
            t.delete(data[z]);
        }

        var acum = [];
        t.walk(function(n) { acum.push(n); });
        test.ok(t.audit(false).length===0);

        if(acum.length != 0) {
            console.log("-------------------------------------");
            console.log("!");
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
    var t = new btree.Tree(2, 'test', false);
    var acum = [];
    var limit = 15000;
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
    test.ok(t._diskRead(t.root).numberActives===0);
    test.done();
       
}


exports.testReadCache = function(test) {
    var t = new btree.Tree(15, 'test', false);
    var acum = [];
    var limit = 15000;
    for(var i=0; i<limit; i++) {
        acum.push(i);
    }

    acum = shuffle(acum);

    for(var i=0; i<limit; i++) {
        t.insert(acum[i],acum[i]);
    }


    var before = new Date().getTime();
    for(var i=0; i<10000; i++) {
        var toLook = parseInt(Math.random()*15000);
        var found = t.search(toLook);
        test.ok(found == toLook);        
    }
    var after = new Date().getTime();

    console.log("SECS "+(after-before));

    test.done();
}


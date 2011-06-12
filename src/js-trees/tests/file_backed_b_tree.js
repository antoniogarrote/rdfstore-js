var FileBackedBTree = require('./../src/file_backed_b_tree').FileBackedBTree;
var Utils = require("./../src/utils").Utils;
var fs = require('fs');

exports.testCreateTree = function(test) {
    var i =  Math.floor(Math.random()* 10000);
    var tmpFileName = "/tmp/disk_manager_test_"+i+".tmp";

    var t = new FileBackedBTree.FileBackedFloatFloatBTree({path: tmpFileName, order: 2});
    t.init();


    t.insert(11,11);
    t.insert(6,6);
    t.insert(5,5);

    test.ok(t.search(6)===6);

    t.close();

    t = new FileBackedBTree.FileBackedFloatFloatBTree({path: tmpFileName, order: 2});
    t.load();

    test.ok(t.search(6)===6);

    fs.unlinkSync(tmpFileName);

    test.done();
}


exports.testSimpleTestManagement = function(test) {
    var i =  Math.floor(Math.random()* 10000);
    var tmpFileName = "/tmp/disk_manager_test_"+i+".tmp";

    var t = new FileBackedBTree.FileBackedFloatFloatBTree({path: tmpFileName, order: 2});
    t.init();

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

    t.close();

    t = new FileBackedBTree.FileBackedFloatFloatBTree({path: tmpFileName, order: 2});
    t.load();

    var data = [];
    t.walk(function(n) {
        data.push(n.data);
    });

    mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 11, 14, 15 ];

    for(var i=0; i<mustFind.length; i++) {
        test.ok(mustFind[i] === data[i]);
    }
    fs.unlinkSync(tmpFileName);
    test.done();
}

exports.testHighLoad = function(test) {
    var i =  Math.floor(Math.random()* 10000);

    var max = 50;
    var max_data = 100;


    for(var i=0; i<max; i++) {
        var tmpFileName = "/tmp/disk_manager_test_"+i+".tmp";
        var next = i * 100 /max;
        console.log(next+"%.");

        var t = new FileBackedBTree.FileBackedFloatFloatBTree({path: tmpFileName, order: 80});
        t.init();

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

        t.close();
        t = new FileBackedBTree.FileBackedFloatFloatBTree({path: tmpFileName, order: 80});
        t.load();

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
        fs.unlinkSync(tmpFileName);
    }

    test.done();
}


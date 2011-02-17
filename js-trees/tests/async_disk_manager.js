var fs = require('fs');
var AsyncDiskManager = require("./../src/async_disk_manager").AsyncDiskManager;
var DiskManager = require("./../src/disk_manager").DiskManager;


exports.testReadWriteNodes = function(test) {
    var i =  Math.floor(Math.random()* 10000);
    var tmpFileName = "/tmp/disk_manager_test_"+i+".tmp";

    new AsyncDiskManager.Container(tmpFileName, new DiskManager.FloatFloatNodeSchema(2), function(c) {
        c.format(4,4,2, function(){
            c.close(function(){
                new AsyncDiskManager.Container(tmpFileName, new DiskManager.FloatFloatNodeSchema(2), function(c){
                    c._readSuperBlock(function(){
                        var node1 = {};

                        node1.keys = [{key:1, data:1},{key:2, data:2}];
                        node1.children = [10,11,12];
                        node1.isLeaf = false;
                        node1.level = 1;
                        node1.numberActives = 2;

                        var node2 = {};

                        node2.keys = [{key:21, data:21},{key:22, data:22}];
                        node2.children = [210,211,212];
                        node2.isLeaf = false;
                        node2.level = 1;
                        node2.numberActives = 2;

                        c.writeNode(node1, function(){
                            c.writeNode(node2, function(){
                                c.updateRoot(node1, function(){
                                    c.close(function(){
                                        new AsyncDiskManager.Container(tmpFileName, new DiskManager.FloatFloatNodeSchema(2), function(c){
                                            c._readSuperBlock(function(){
                                                c.readNode(c.rootNode, function(node1b){
                                                    test.ok(node1b.isLeaf===node1.isLeaf);
                                                    test.ok(node1b.level === node1.level);
                                                    test.ok(node1b.numberActives === node1.numberActives);
                                                    for(var i=0; i<node1b.keys.length; i++) {
                                                        test.ok(node1b.keys[i].key === node1.keys[i].key);
                                                        test.ok(node1b.keys[i].data === node1.keys[i].data);
                                                    }

                                                    for(var i=0; i< node1.children.length; i++) {
                                                        test.ok(node1b.children[i] === node1.children[i]);
                                                    }

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
}


exports.testBufferCache = function(test) {
    var i =  Math.floor(Math.random()* 10000);
    var tmpFileName = "/tmp/disk_manager_test_"+i+".tmp";

    new AsyncDiskManager.Container(tmpFileName, new DiskManager.FloatFloatNodeSchema(2), function(c){
        c.bufferCache.cacheSize = 2;
        c.format(4,4,2, function(){

            var node1 = {};

            node1.keys = [{key:1, data:1},{key:2, data:2}];
            node1.children = [10,11,12];
            node1.isLeaf = false;
            node1.level = 1;
            node1.numberActives = 2;

            var node2 = {};

            node2.keys = [{key:21, data:21},{key:22, data:22}];
            node2.children = [210,211,212];
            node2.isLeaf = false;
            node2.level = 1;
            node2.numberActives = 2;

            var node3 = {};

            node3.keys = [{key:5, data:4},{key:5, data:5}];
            node3.children = [30,31,32];
            node3.isLeaf = false;
            node3.level = 1;
            node3.numberActives = 2;

            c.writeNode(node1, function(){
                c.writeNode(node2, function(){
                    c.updateRoot(node1, function(){

                        test.ok(c.bufferCache.cacheList.length===2)
                        test.ok(c.bufferCache.cacheList[0]=== node1.nodeKey);
                        test.ok(c.bufferCache.cacheList[1]=== node2.nodeKey);

                        c.writeNode(node3, function(){

                            test.ok(c.bufferCache.cacheList.length===2)
                            test.ok(c.bufferCache.cacheList[0]=== node2.nodeKey);
                            test.ok(c.bufferCache.cacheList[1]=== node3.nodeKey);

                            c.readNode(node1.nodeKey, function(){

                                test.ok(c.bufferCache.cacheList.length===2)
                                test.ok(c.bufferCache.cacheList[0]=== node3.nodeKey);
                                test.ok(c.bufferCache.cacheList[1]=== node1.nodeKey);


                                c.bufferCache.invalidate(node3);

                                test.ok(c.bufferCache.cacheList.length===1)
                                test.ok(c.bufferCache.cacheList[0]=== node1.nodeKey);

                                fs.unlinkSync(tmpFileName);

                                test.done();

                            });
                        });
                    });
                });
            });
        });
    });
}


exports.testDeletionFreeBlocksManager = function(test) {
    var i =  Math.floor(Math.random()* 10000);
    var tmpFileName = "/tmp/disk_manager_test_"+i+".tmp";

    new AsyncDiskManager.Container(tmpFileName, new DiskManager.FloatFloatNodeSchema(2), function(c){
        c.bufferCache.cacheSize = 1;
        c.format(4,4,2, function(){

            var node1 = {};

            node1.keys = [{key:1, data:1},{key:2, data:2}];
            node1.children = [10,11,12];
            node1.isLeaf = false;
            node1.level = 1;
            node1.numberActives = 2;

            var node2 = {};

            node2.keys = [{key:21, data:21},{key:22, data:22}];
            node2.children = [210,211,212];
            node2.isLeaf = false;
            node2.level = 1;
            node2.numberActives = 2;

            var node3 = {};

            node3.keys = [{key:5, data:4},{key:5, data:5}];
            node3.children = [30,31,32];
            node3.isLeaf = false;
            node3.level = 1;
            node3.numberActives = 2;

            var node4 = {};

            node4.keys = [{key:7, data:7},{key:8, data:8}];
            node4.children = [40,41,42];
            node4.isLeaf = false;
            node4.level = 1;
            node4.numberActives = 2;


            c.writeNode(node1, function(){
                c.updateRoot(node1, function(){
                    c.writeNode(node2, function(){
                        c.readNode(c.rootNode, function(node1b){
                            c.deleteNode(node1b, function(){
                                c.writeNode(node3, function(){


                                    c.readNode(c.rootNode, function(node3b){


                                        test.ok(node3b.isLeaf===node3.isLeaf);
                                        test.ok(node3b.level === node3.level);
                                        test.ok(node3b.numberActives === node3.numberActives);
                                        for(var i=0; i<node3b.keys.length; i++) {
                                            test.ok(node3b.keys[i].key === node3.keys[i].key);
                                            test.ok(node3b.keys[i].data === node3.keys[i].data);
                                        }

                                        for(var i=0; i< node3.children.length; i++) {
                                            test.ok(node3b.children[i] === node3.children[i]);
                                        }

                                        c.deleteNode(node2, function(){
                                            c.writeNode(node4, function(){

                                                c.readNode(node2.nodeKey, function(node4b){

                                                    test.ok(node4b.isLeaf===node4.isLeaf);
                                                    test.ok(node4b.level === node4.level);
                                                    test.ok(node4b.numberActives === node4.numberActives);
                                                    for(var i=0; i<node4b.keys.length; i++) {
                                                        test.ok(node4b.keys[i].key === node4.keys[i].key);
                                                        test.ok(node4b.keys[i].data === node4.keys[i].data);
                                                    }

                                                    for(var i=0; i< node4.children.length; i++) {
                                                        test.ok(node4b.children[i] === node4.children[i]);
                                                    }

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
}

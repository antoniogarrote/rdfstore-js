var bst = require("./../src/binary_search_tree").BinarySearchTree;


exports.testInsertSearch = function(test){
    var tree = new bst.Tree();

    tree.insert(1,"first");
    tree.insert(5, "five");
    tree.insert(-2,"minustwo");
    tree.insert(7, "seven");

    test.ok(tree.root.key === 1, "The root node must have key 1");
    test.ok(tree.root.data === "first", "The root node must have data 'first'");

    test.ok(tree.root.left.key === -2, "");
    test.ok(tree.root.left.data === "minustwo", "");

    test.ok(tree.root.right.key === 5, "");
    test.ok(tree.root.right.data === "five", "");

    test.ok(tree.root.right.right.key === 7, "");
    test.ok(tree.root.right.right.data === "seven", "");

    test.ok(tree.search(1).data==="first")
    test.ok(tree.search(-2).data==="minustwo")
    test.ok(tree.search(5).data==="five")
    test.ok(tree.search(7).data==="seven")

    test.throws(function() {
        tree.insert(1,"duplicated");
    });

    test.done();
}

exports.testDelete = function(test){
    var tree = new bst.Tree();

    tree.insert(100,"100");

    tree.delete(100);
    test.ok(tree.root==null);

    tree = new bst.Tree();
    tree.insert(100,"100");
    tree.insert(150,"150");
    tree.insert(10,"10");
    tree.delete(100);
    test.ok(tree.root.key==150);
    test.ok(tree.root.parent==null);
    test.ok(tree.root.right==null);
    test.ok(tree.root.left.key==10);
    test.ok(tree.root.left.parent.key==150);
    test.ok(tree.root.left.left==null);
    test.ok(tree.root.left.right==null);


    tree = new bst.Tree();
    tree.insert(100,"100");
    tree.insert(150,"150");
    tree.insert(10,"10");
    tree.insert(5, "5");
    tree.insert(3, "3");
    tree.insert(7,"7");
    tree.insert(6,"6");

    tree.delete(10,"10");

    test.ok(tree.root.left.key===5);
    test.ok(tree.root.left.left.key===3);
    test.ok(tree.root.left.right.key===7);
    test.ok(tree.root.left.parent.key===100);

    tree = new bst.Tree();
    tree.insert(100,"100");
    tree.insert(150,"150");
    tree.insert(10,"10");
    tree.insert(5, "5");
    tree.insert(3, "3");
    tree.insert(7,"7");
    tree.insert(6,"6");
    tree.insert(15, "15");
    tree.insert(12, "12");
    tree.insert(17,"17");

    tree.delete(10)

    test.ok(tree.root.left.key===12);
    test.ok(tree.root.left.left.key===5);
    test.ok(tree.root.left.right.key===15);
    test.ok(tree.root.left.right.right.key===17);

    test.ok(tree.root.left.parent.key===100);
    test.ok(tree.root.left.left.parent.key===12);
    test.ok(tree.root.left.right.parent.key===12);
    test.ok(tree.root.left.right.right.parent.key===15);

    test.done();
}
exports.testInsertReplace = function(test){

    tree = new bst.Tree();
    tree.merger = function(k,v1,v2) {
        return v2;
    };

    tree.insert(100,"100");
    tree.insert(150,"150");
    tree.insert(170,"150");
    tree.insert(10,"10");

    tree.insert(150,"updated");

    test.ok(tree.root.right.key===150);
    test.ok(tree.root.right.data==="updated");
    test.ok(tree.root.right.right.key===170);

    test.done();
}


exports.testMinimum = function(test) {
    tree = new bst.Tree();
    tree.insert(100,"100");
    tree.insert(150,"150");
    tree.insert(10,"10");
    tree.insert(5, "5");
    tree.insert(3, "3");
    tree.insert(7,"7");
    tree.insert(6,"6");
    tree.insert(15, "15");
    tree.insert(12, "12");
    tree.insert(17,"17");

    test.ok(tree.minimum().data=="3");


    var node = tree.search(7);
    test.ok(node.treeRoot().treeMinimum().data=="3")

    tree = new bst.Tree();
    test.ok(tree.minimum()==null);

    test.done();
}

exports.testMaximum = function(test) {
    tree = new bst.Tree();
    tree.insert(100,"100");
    tree.insert(150,"150");
    tree.insert(10,"10");
    tree.insert(5, "5");
    tree.insert(3, "3");
    tree.insert(7,"7");
    tree.insert(6,"6");
    tree.insert(15, "15");
    tree.insert(12, "12");
    tree.insert(17,"17");

    var node = tree.search(7);
    test.ok(node.key==7);
    test.ok(node.treeRoot().treeMaximum().data=="150")

    tree = new bst.Tree();
    test.ok(tree.maximum()==null);

    test.done();
}


exports.testSuccessor = function(test) {
    tree = new bst.Tree();
    for(var i=0; i<10; i++) {
        tree.insert(i,i);
    }

    var min = tree.minimum();

    for(var i=0; i<10; i++) {
        test.ok(min.data===i);
        min = min.treeSuccessor();
    }
    test.ok(min===null);


    tree = new bst.Tree();
    tree.insert(5,5);
    tree.insert(2,2);
    tree.insert(7,7);
    tree.insert(1,1);
    tree.insert(4,4);

    tree.insert(6,6);
    tree.insert(8,8);

    var min = tree.minimum();

    test.ok(min.data===1)
    min=min.treeSuccessor();
    test.ok(min.data===2)
    min=min.treeSuccessor();
    test.ok(min.data===4)
    min=min.treeSuccessor();
    test.ok(min.data===5)
    min=min.treeSuccessor();
    test.ok(min.data===6)
    min=min.treeSuccessor();
    test.ok(min.data===7)
    min=min.treeSuccessor();
    test.ok(min.data===8)
    min=min.treeSuccessor();
    test.ok(min===null)


    test.done();
}

exports.testPredecessor = function(test) {
    tree = new bst.Tree();
    for(var i=0; i<10; i++) {
        tree.insert(i,i);
    }

    var max = tree.maximum();

    for(var i=9; i>=0; i--) {
        test.ok(max.data===i);
        max = max.treePredecessor();
    }
    test.ok(max===null);


    tree = new bst.Tree();
    tree.insert(5,5);
    tree.insert(2,2);
    tree.insert(7,7);
    tree.insert(1,1);
    tree.insert(4,4);

    tree.insert(6,6);
    tree.insert(8,8);

    var max = tree.maximum();

    test.ok(max.data===8)
    max=max.treePredecessor();
    test.ok(max.data===7)
    max=max.treePredecessor();
    test.ok(max.data===6)
    max=max.treePredecessor();
    test.ok(max.data===5)
    max=max.treePredecessor();
    test.ok(max.data===4)
    max=max.treePredecessor();
    test.ok(max.data===2)
    max=max.treePredecessor();
    test.ok(max.data===1)
    max=max.treePredecessor();
    test.ok(max===null)


    tree = new bst.Tree();
    tree.insert(5,5);
    tree.insert(2,2);
    tree.insert(7,7);
    tree.insert(1,1);
    tree.insert(4,4);

    tree.insert(6,6);
    tree.insert(8,8);

    tree.delete(2);

    var max = tree.maximum();

    test.ok(max.data===8)
    max=max.treePredecessor();
    test.ok(max.data===7)
    max=max.treePredecessor();
    test.ok(max.data===6)
    max=max.treePredecessor();
    test.ok(max.data===5)
    max=max.treePredecessor();
    test.ok(max.data===4)
    max=max.treePredecessor();
    test.ok(max.data===1)
    max=max.treePredecessor();
    test.ok(max===null)


    test.done();
}

exports.testDeletions = function(test) {

    var tree = new bst.Tree();
    tree.comparator = function(a,b) {
        if(a===b) {
            return 0;
        } else if(a < b) {
            return -1;
        } else {
            return 1;
        }
    }

    tree.insert(11,11);
    tree.insert(2,2);
    tree.insert(14,14);
    tree.insert(15,15);
    tree.insert(1,1);
    tree.insert(7,7);
    tree.insert(5,5);
    tree.insert(8,8);
    tree.insert(4,4);

    tree.delete(4);
    tree.delete(14);
    tree.delete(2);
    tree.delete(5);
    tree.delete(8);
    tree.delete(1);
    tree.delete(11);
    tree.delete(7);

    test.ok(tree.root.data===15);

    test.done();
}

var rbt = require("./../src/red_black_tree").RedBlackTree;

exports.testCreationNode = function(test) {
    var node = new rbt.Node(1,2,rbt.red);

    test.ok(node.key===1);
    test.ok(node.data===2);
    test.ok(node.color===rbt.red);
    test.ok(node.color===1);

    test.done();
}


exports.testRotation = function(test) {
    var x = new rbt.Node(1,"x",1);
    var y = new rbt.Node(2,"y",0);
    var alfa = new rbt.Node(3,"alfa",1);
    var beta = new rbt.Node(4,"beta",1);
    var gamma = new rbt.Node(5,"gamma",1);

    var tree = new rbt.Tree();
    tree.root = x;
    x.parent = tree.nil;
    x.left = alfa;
    alfa.parent = x;
    alfa.left = tree.nil;
    alfa.right = tree.nil;
    x.right = y;
    y.parent = x;
    y.left = beta;
    beta.parent = y;
    beta.left = tree.nil;
    beta.right = tree.nil;
    y.right = gamma;
    gamma.parent = y;
    gamma.left = tree.nil;
    gamma.right = tree.nil;

    tree.rotateLeft(x);

    test.ok(tree.root===y);
    test.ok(y.left===x);
    test.ok(x.parent===y);
    test.ok(y.right===gamma);
    test.ok(gamma.parent===y);
    test.ok(x.left===alfa);
    test.ok(alfa.parent===x);
    test.ok(x.right===beta);
    test.ok(beta.parent===x);
    test.ok(y.parent===tree.nil);

    tree.rotateRight(y);

    test.ok(tree.root===x);
    test.ok(y.left===beta);
    test.ok(x.parent===tree.nil);
    test.ok(y.right===gamma);
    test.ok(gamma.parent===y);
    test.ok(x.left===alfa);
    test.ok(alfa.parent===x);
    test.ok(x.right===y);
    test.ok(beta.parent===y);
    test.ok(x.parent===tree.nil);

    test.done();
}

exports.testInsertion = function(test) {

    var tree = new rbt.Tree();
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

    test.ok(tree.root.left.right.left.color===rbt.red);
    test.ok(tree.root.left.right.right.color===rbt.red);
    test.ok(tree.root.left.right.color===rbt.black);
    test.ok(tree.root.left.color===rbt.red);
    test.ok(tree.root.color===rbt.black);

    tree.insert(4,4);

    test.ok(tree.root.color===rbt.black);
    test.ok(tree.root.data===7);

    var result = [1,2,4,5,7,8,11,14,15];
    var collected = [];

    tree.walk(function(n){ collected.push(n.data)});

    for(var i=0; i<collected.length; i++) {
        test.ok(result[i]==collected[i]);
    }

    test.done();
}


exports.testDeletion = function(test) {

    var tree = new rbt.Tree();
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

// Exports
exports.RedBlackTree = {};
var RedBlackTree = exports.RedBlackTree;

// Imports
var BinarySearchTree = require("./binary_search_tree").BinarySearchTree;
var Utils = require("./utils").Utils;

// Constants
RedBlackTree.red   = 1;
RedBlackTree.black = 0;
var red   = RedBlackTree.red;
var black = RedBlackTree.black;

/**
 * Tree
 * 
 * Inherits from BinarySearchTree.Tree
 * 
 * An implementation of a Red-Black tree.
 */

RedBlackTree.Tree = function() {
    BinarySearchTree.Tree.call(this);
    this.nil = new RedBlackTree.Node();
    this.nil.isNilNode = true;
    this.root = this.nil;
};

Utils.extends(BinarySearchTree.Tree, RedBlackTree.Tree);

RedBlackTree.Tree.prototype.rotateLeft = function(x) {
    var y = x.right;
    x.right = y.left;
    y.left.parent = x;
    y.parent = x.parent;

    if(x.parent === this.nil) {
        this.root = y;
    } else if(x === x.parent.left) {
        x.parent.left = y;
    } else {
        x.parent.right = y;
    }

    y.left = x;
    x.parent = y;
};

RedBlackTree.Tree.prototype.rotateRight = function(y) {
    var x = y.left;
    y.left = x.right;
    x.right.parent = y;
    x.parent = y.parent;

    if(y.parent === this.nil) {
        this.root = x;
    } else if(y === y.parent.left) {
        y.parent.left = x;
    } else {
        y.parent.right = x;
    }
    
    x.right = y;
    y.parent = x;
};

/**
 * insertNode
 * 
 * Modified version of inserNode, that inserts the node, colors
 * it, and fix the red-black status of the tree nodes.
 */
RedBlackTree.Tree.prototype.insertNode = function(node) {
    var y = this.nil;
    var x = this.root;

    while(x!=this.nil) {
        y = x;
        if(this.comparator(x.key,node.key)==-1) {
            x = x.right;
        } else if(this.comparator(x.key,node.key)==1){
            x = x.left;
        } else {
            if(this.merger != null) {
                node.data = this.merger(x.key, x.data, node.data);
                return null;
            } else {
                throw(new Error("Duplicated key " + node.key));                
            }

        }
    }

    node.parent = y;
    if(y === this.nil) {
        this.root = node;
    } else {
        if(this.comparator(node.parent.key,node.key) === -1) {
            node.parent.right = node;
        } else {
            node.parent.left = node;
        }
    }

    node.left = this.nil;
    node.right = this.nil;
    node.color = red;

    this.__insertFixUp(node);

    return this;
};

/**
 * __walk
 * 
 * Modified version of the inner walk function.
 * It does not invoke the callback for nil nodes.
 */
BinarySearchTree.Tree.prototype.__walk = function(f,n) {    
    if(n.left != this.nil) {
        this.__walk(f,n.left);
    }
    
    f(n);

    if(n.right != this.nil) {
        this.__walk(f,n.right);
    }
};


RedBlackTree.Tree.prototype.__insertFixUp = function(node) {
    while(node.parent.color===red) {
        if(node.parent === node.parent.parent.left) {
            var y = node.parent.parent.right;
            if(y.color === red) {
                node.parent.color = black;
                y.color =black;
                node.parent.parent.color = red;
                node = node.parent.parent;
            } else {
                if(node === node.parent.right) {
                    node = node.parent;
                    this.rotateLeft(node);
                }
                node.parent.color = black;
                node.parent.parent.color = red;
                this.rotateRight(node.parent.parent);
            }
        } else {
            var y = node.parent.parent.left;
            if(y.color === red) {
                node.parent.color = black;
                y.color =black;
                node.parent.parent.color = red;
                node = node.parent.parent;
            } else {
                if(node === node.parent.left) {
                    node = node.parent;
                    this.rotateRight(node);
                }
                node.parent.color = black;
                node.parent.parent.color = red;
                this.rotateLeft(node.parent.parent);
            }
        }
    }

    this.root.color = black;
};

/**
 * delete
 * Removes the node with the provided key from the tree.
 */
RedBlackTree.Tree.prototype.delete = function(key) {
    var node = this.search(key);
    var y = null;
    var x = null;

    if(node.left === this.nil || node.right === this.nil) {
        y = node;
    } else {
        y = node.treeSuccessor();
    }

    if(y.left != this.nil) {
        x = y.left;
    } else {
        x = y.right;
    }

    x.parent = y.parent;

    if(y.parent === this.nil) {
        this.root = x;
    } else {
        if(y === y.parent.left) {
            y.parent.left = x;
        } else {
            y.parent.right = x;
        }
    }

    if(y != node) {
        node.key = y.key;
        node.data = y.data;
    }

    if(y.color === black) {
        this.__deleteFixUp(x);
    }

    return this;
};

RedBlackTree.Tree.prototype.__deleteFixUp = function(node) {
    var w = null;

    while(node != this.root && node.color == black) {
        if(node == node.parent.left) {
            w = node.parent.right;
            if(w.color == red) {
                w.color = black;
                node.parent.color = red;
                this.rotateLeft(node.parent);
                w = node.parent.right;
            }
            if(w.left.color == black && w.right.color == black) {
                w.color = red;
                node = node.parent;
            } else {
                if(w.right.color == black) {
                    w.left.color = black;
                    w.color = red;
                    this.rotateRight(w);
                    w = node.parent.right;
                }
                w.color = node.parent.color;
                node.parent.color = black;
                w.right.color = black;
                this.rotateLeft(node.parent);
                node = this.root;
            }
        } else {
            w = node.parent.left;
            if(w.color == red) {
                w.color = black;
                node.parent.color = red;
                this.rotateRight(node.parent);
                w = node.parent.left;
            }
            if(w.right.color == black && w.left.color == black) {
                w.color = red;
                node = node.parent;
            } else {
                if(w.left.color == black) {
                    w.right.color = black;
                    w.color = red;
                    this.rotateleft(w);
                    w = node.parent.left;
                }
                w.color = node.parent.color;
                node.parent.color = black;
                w.left.color = black;
                rotateRight(node.parent);
                node = this.root;
            }
        }
    }
    node.color = black;
};

/**
 * Node
 * 
 * Inherits from BinarySearchTree.Node
 * 
 * A Tree node augmented with color.
 * Color can be an integer red(1) or black(0)
 */
RedBlackTree.Node = function(key, data, color) {
    BinarySearchTree.Node.call(this,key,data);
    this.color = color;
};

/**
 * Checks if a out of tree value
 */
BinarySearchTree.Node.prototype.isNil = function(node) {    
    return node.isNilNode===true;
};


Utils.extends(BinarySearchTree.Node, RedBlackTree.Node);

exports.BinarySearchTree = {};
var BinarySearchTree = exports.BinarySearchTree;

/**
 * Tree object
 * 
 * A Binary tree, with support for comparison
 * between numbers.
 *
 * Options:
 *  - comparator: 
 *    A function receiving two keys and returning -1,0,1
 *
 *  - merger: 
 *    A function that will be inovoked when trying to
 *    to insert a node and a duplicated key is found.
 *    The function will receive the key and the values
 *    and must return the new value for the node.
 *    If no function is set, an exception will be
 *    thrown.
 */
BinarySearchTree.Tree = function() {
    this.root = null;
    this.comparator = function(a,b) {
        if(a < b) {
            return -1;
        } else if(a > b){
            return 1;
        } else {
            return 0;
        }
    };
    this.merger = null;
};

/**
 * insertNode
 * Inserts the a node in the binary tree.
 */
BinarySearchTree.Tree.prototype.insertNode = function(node) {
    var parent = this.root;
    var tmp = parent;

    while(tmp!=null) {
        parent = tmp;
        if(this.comparator(tmp.key,node.key) == -1) {
            tmp = tmp.right;
        } else if(this.comparator(tmp.key,node.key)==1){
            tmp = tmp.left;
        } else {
            if(this.merger != null) {
                tmp.data = this.merger(tmp.key, tmp.data, node.data);
                return null;
            } else {
                throw(new Error("Duplicated key " + node.key));                
            }

        }
    }

    if(parent === null) {
        this.root = node;
    } else {
        node.parent = parent;
        if(this.comparator(parent.key,node.key) === -1) {
            parent.right = node;
        } else {
            parent.left = node;
        }
    }
    return this;
};


/**
 * insert
 * Creates a new node with value key and data and inserts it
 * into the tree.
 */
BinarySearchTree.Tree.prototype.insert = function(key,data) {
    this.insertNode(new BinarySearchTree.Node(key,data));
};

/**
 * delete
 * Removes the node with the provided key from the tree.
 */
BinarySearchTree.Tree.prototype.delete = function(key) {
    var tmp = this.root;

    while(tmp.key!=key && tmp!=null) {
        if(this.comparator(key,tmp.key) === -1) {
            tmp = tmp.left;
        } else {
            tmp = tmp.right;
        }
    }

    var parentNextValue = null;

    if(tmp!=null) {
        if(tmp.left===null && tmp.right!=null) {
            parentNextValue = tmp.right;
        } else if(tmp.left!=null && tmp.right===null) {
            parentNextValue = tmp.left;
        } else if(tmp.left===null && tmp.right=== null){
            parentNextValue = null;
        } else {
            var successor = tmp.right;
            //console.log("successor init " + successor.key);
            while(successor.left != null) {
                successor = successor.left;
            }
            //console.log("successor " + successor.key);
            
            if(successor != tmp.right) {
                successor.parent.left = successor.right;
                if(successor.right != null) {
                    successor.right.parent = successor.parent;                    
                    //console.log("successor parent left  " + successor.parent.key + " vale " + successor.right.key);
                }              

                successor.right =  tmp.right;
                //console.log("successor " + successor.key + " right vale " + tmp.right.key);
                tmp.right.parent = successor;

            }
            successor.left = tmp.left;
            //console.log("successor " + successor.key + " left vale " + tmp.left.key);
            tmp.left.parent = successor;

            parentNextValue = successor;

        };

        if(tmp.parent != null) {
            if(tmp.parent.left === tmp) {
                tmp.parent.left = parentNextValue;            
            } else {
                tmp.parent.right = parentNextValue;
            }
        } else {
            if(parentNextValue != null) {
                parentNextValue.parent = null;                
            }
            this.root = parentNextValue;
        }
        if(parentNextValue != null) {
            parentNextValue.parent = tmp.parent;            
        }

        tmp.parent = null;
        tmp.left = null;
        tmp.right = null;
        tmp.data = null;
    }
};

BinarySearchTree.Tree.prototype.__walk = function(f,n) {    
    if(n.left != null) {
        this.__walk(f,n.left);
    }
    
    f(n);

    if(n.right != null) {
        this.__walk(f,n.right);
    }
};

/**
 * walk
 * Applies a function to all the nodes in the the
 * tree in key order.
 */
BinarySearchTree.Tree.prototype.walk = function(f) {    
    this.__walk(f,this.root);
};

/**
 * search
 * Retrieves the node matching the given value.
 * If no node is found, null is returned.
 */
BinarySearchTree.Tree.prototype.search = function(key) {
    var tmp = this.root;
    while(tmp!=null && tmp.key!=key) {
        if(this.comparator(tmp.key,key) === -1) {
            tmp = tmp.right;
        } else {
            tmp = tmp.left;
        }
    }

    return tmp;
};

/**
 * searchData
 * Finds the node with the provided key in the tree, and returns
 * its data value.
 * If no node is found, nill is returned.
 */
BinarySearchTree.Tree.prototype.searchData = function(key) {
    var found = this.search(key);

    if(found === null) {
        return null;
    } else {
        return found.data;
    }
};

/**
 * minimum
 * Returns the node storing the minimum value for
 * the tree.
 */
BinarySearchTree.Tree.prototype.minimum = function(key) {
    var tmp = this.root;
    var to_return = this.root;

    while(tmp != null) {
        to_return = tmp;
        tmp = tmp.left;
    }

    return to_return;
};

/**
 * maximum
 * Returns the node storing the maximum value for
 * the tree.
 */
BinarySearchTree.Tree.prototype.maximum = function(key) {
    var tmp = this.root;
    var to_return = this.root;

    while(tmp != null) {
        to_return = tmp;
        tmp = tmp.right;
    }

    return to_return;
};


/** 
 * Node object
 * 
 * A generic node structure with key, data,
 * parent, left and right fields.
 */
BinarySearchTree.Node = function(key, data) {
    this.key    = key;
    this.data   = data;

    this.parent = null;
    this.left   = null;
    this.right  = null;
};


/**
 * Checks if a out of tree value
 */

BinarySearchTree.Node.prototype.isNil = function(node) {    
    return node === null;
};

/**
 * treeRoot
 *
 * Returns the root node for the tree where this
 * node is inserted
 */
BinarySearchTree.Node.prototype.treeRoot = function() {
    var tmp = this.parent;
    var toReturn = this;
    while(!this.isNil(tmp)) {
        toReturn = tmp;
        tmp = tmp.parent;
    }

    return toReturn;
};

/**
 * treeMinimum
 *
 * Returns the minimum node for the tree where this
 * node is inserted
 */
BinarySearchTree.Node.prototype.treeMinimum = function() {
    var toReturn = this;

    if(!this.isNil(root)) {
        var tmp = toReturn.left;
        while(!this.isNil(tmp)) {
            toReturn = tmp;
            tmp = tmp.left;
        }
    }

    return toReturn;
};

/**
 * treeMaximum
 *
 * Returns the minimum node for the tree where this
 * node is inserted
 */
BinarySearchTree.Node.prototype.treeMaximum = function() {
    var toReturn = this;

    if(!this.isNil(root)) {
        var tmp = toReturn.right;
        while(!this.isNil(tmp)) {
            toReturn = tmp;
            tmp = tmp.right;
        }
    }

    return toReturn;
};

/**
 * treeSuccessor
 *
 * Returns the successor node for this node in the tree
 */
BinarySearchTree.Node.prototype.treeSuccessor = function() {    
    if(this.isNil(this.right)) {
        var tmp = this.parent;
        var toReturn = this;
        while(!this.isNil(tmp) && tmp.right == toReturn) {
            toReturn = tmp;
            tmp = tmp.parent;
        }
        return tmp;            
    } else {
        var tmp = this.right;
        var toReturn = tmp;
        while(!this.isNil(tmp)) {
            toReturn = tmp;
            tmp = tmp.left;
        }
        return toReturn;
    }
};

/**
 * treePredecessor
 *
 * Returns the predecessor node for this node in the tree
 */
BinarySearchTree.Node.prototype.treePredecessor = function() {    
    if(this.isNil(this.left)) {
        var tmp = this.parent;
        var toReturn = this;
        while(!this.isNil(tmp) && tmp.left == toReturn) {
            toReturn = tmp;
            tmp = tmp.parent;
        }
        return tmp;            
    } else {
        var tmp = this.left;
        var toReturn = tmp;
        while(!this.isNil(tmp)) {
            toReturn = tmp;
            tmp = tmp.right;
        }
        return toReturn;
    }
};

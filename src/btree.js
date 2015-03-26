"use strict";

var utils = require('./utils');
var async = utils;
var nextTick = utils.nextTick;

var left = -1;
var right = 1;

/**
 * @doc
 * Implementation based on <http://www.gossamer-threads.com/lists/linux/kernel/667935>
 *
 */

/**
 * Tree
 *
 * Implements the interface of BinarySearchTree.Tree
 *
 * An implementation of an in memory B-Tree.
 */
var Tree = function(order,f) {
    if(arguments.length != 0) {
        this.order = order;
        this.root = this._allocateNode();
        this.root.isLeaf = true;
        this.root.level = 0;
        var that = this;
        this._diskWrite(this.root, function(root){
            that.root = root;
            that._updateRootNode(that.root, function(n){
                that.comparator = function(a,b) {
                    if(a < b) {
                        return -1;
                    } else if(a > b){
                        return 1;
                    } else {
                        return 0;
                    }
                };
                that.merger = null;
                // we notify we are ready
                if(f!=null) {
                    f(that);
                }
            })});
    }
};

/**
 * Creates the new node.
 *
 * This class can be overwritten by different versions of
 * the tree t select the right kind of node to be used
 *
 * @returns the new alloacted node
 */
Tree.prototype._allocateNode = function() {
    return new Node();
};

/**
 * _diskWrite
 *
 * Persists the node to secondary memory.
 */
Tree.prototype._diskWrite= function(node, f) {
    // dummy implementation;
    // no-op
    nextTick(function(){
        f(node);
    });
};


/**
 * _diskRead
 *
 * Retrieves a node from secondary memory using the provided
 * pointer
 */
Tree.prototype._diskRead = function(pointer, f) {
    // dummy implementation;
    // no-op
    nextTick(function() {
        f(pointer);
    });
};

Tree.prototype._diskDelete= function(node,f) {
    // dummy implementation
    // no-op
    nextTick(function() {
        f();
    });
};


/**
 * _updateRootNode
 *
 * Updates the pointer to the root node stored in disk.
 */
Tree.prototype._updateRootNode = function(node,f) {
    // dummy implementation;
    // no-op
    f(node)
};


/**
 * search
 *
 * Retrieves the node matching the given value.
 * If no node is found, null is returned.
 */
Tree.prototype.search = function(key,f, checkExists) {
    var node = this.root;
    var tree = this;
    tree.__search(tree,key,node,f, checkExists);
};
Tree.prototype.__search = function (tree, key, node, f, checkExists) {
    var idx = 0;
    while (idx < node.numberActives && tree.comparator(key, node.keys[idx].key) === 1) {
        idx++;
    }

    if (idx < node.numberActives && tree.comparator(node.keys[idx].key, key) === 0) {
        if (checkExists != null && checkExists == true) {
            f(true);
        } else {
            f(node.keys[idx].data);
        }
    } else {
        if (node.isLeaf === true) {
            f(null)
        } else {
            tree._diskRead(node.children[idx], function (node) {
                tree.__search(tree, key, node, f, checkExists)
            });
        }
    }
};


/**
 * walk
 * Applies a function to all the nodes key and data in the the
 * tree in key order.
 */
Tree.prototype.walk = function(f,e) {
    this.__walk(this,this.root,f,e);
};
Tree.prototype.__walk = function(tree,node,f,callback) {
    var max = node.numberActives;
    var i = 0;
    if(node.isLeaf) {
        for(i=0; i<node.numberActives; i++) {
            f(node.keys[i]);
        }
        return callback();
    } else {
        async.whilst(function(){
            return i < max;
        },function(c){
            tree._diskRead(node.children[i], function(n){
                tree.__walk(tree,n,f,function(){
                    tree._diskRead(node.keys[i], function(n){
                        f(n);
                        i++;
                        c();
                    })
                });
            });
        },function(){
            tree._diskRead(node.children[max],function(node){
                tree.__walk(tree,node,f,function(){callback();});
            });
        });
    }
};


/**
 * walkNodes
 * Applies a function to all the nodes in the the
 * tree in key order.
 */
Tree.prototype.walkNodes = function(f) {
    this.__walkNodes(this,root,f,function(){});
};
Tree.prototype.__walkNodes = function(tree,node,f,callback) {
    if(node.isLeaf) {
        f(node);
        return callback();
    } else {
        f(node);
        var max = node.numberActives;
        var i = 0;
        async.whilst(function(){
            return i<max;
        }, function(c){
            tree._diskRead(node.children[i], function(n){
                tree.__walkNodes(tree,n,f,function(){
                    i++;
                    c();
                });
            });
        },function(){
            tree._diskRead(node.children[max],function(n){
                tree.__walkNodes(tree,n,f,function(){});
            });
        });
    }
};

/**
 * _splitChild
 *
 * Split the child node and adjusts the parent.
 */
Tree.prototype._splitChild = function(parent, index, child, callback) {
    var newChild = this._allocateNode();
    newChild.isLeaf = child.isLeaf;
    newChild.level = child.level;
    newChild.numberActives = this.order - 1;

    // Copy the higher order keys to the new child
    var newParentChild = child.keys[this.order-1];
    child.keys[this.order-1] = null;

    for(var i=0; i< this.order-1; i++) {
        newChild.keys[i]=child.keys[i+this.order];
        child.keys[i+this.order] = null;
        if(!child.isLeaf) {
            newChild.children[i] = child.children[i+this.order];
            child.children[i+this.order] = null;
        }
    }

    // Copy the last child pointer
    if(!child.isLeaf) {
        newChild.children[i] = child.children[i+this.order];
        child.children[i+this.order] = null;
    }

    child.numberActives = this.order - 1;


    for(i = parent.numberActives + 1; i>index+1; i--) {
        parent.children[i] = parent.children[i-1];
    }

    parent.children[index+1] = newChild;

    for(i = parent.numberActives; i>index; i--) {
        parent.keys[i] = parent.keys[i-1];
    }

    parent.keys[index] = newParentChild;
    parent.numberActives++;

    var that = this;
    this._diskWrite(newChild,function(newChild){
        that._diskWrite(parent,function(parent){
            parent.children[index+1] = newChild;
            that._diskWrite(child,function(child){
                return callback(parent);
            });
        });
    });
};

/**
 * insert
 *
 * Creates a new node with value key and data and inserts it
 * into the tree.
 */
Tree.prototype.insert = function(key,data,callback) {

    if(this.root.numberActives === (2 * this.order - 1)) {
        var newRoot = this._allocateNode();
        newRoot.isLeaf = false;
        newRoot.level = this.root.level + 1;
        newRoot.numberActives = 0;
        newRoot.children[0] = this.root;

        var that = this;
        this._splitChild(newRoot, 0, this.root, function(updatedParent){
            newRoot = updatedParent; // @warning tricky!
            that.root = newRoot;
            that._updateRootNode(newRoot, function(newRoot){
                that._insertNonFull(newRoot, key, data, callback);
            });
        });
    } else {
        this._insertNonFull(this.root, key, data,callback);
    }
};

/**
 * _insertNonFull
 *
 * Recursive function that tries to insert the new key in
 * in the provided node, or splits it and go deeper
 * in the BTree hierarchy.
 */
Tree.prototype._insertNonFull = function (node, key, data, callback) {
    var idx = node.numberActives - 1;
    this.__insertNonFull(this, node, idx, key, data, callback);
};
Tree.prototype.__insertNonFull = function(tree,node,idx,key,data,callback) {
    if(!node.isLeaf) {
        while(idx>=0 && tree.comparator(key,node.keys[idx].key) === -1) {
            idx--;
        }
        idx++;
        var that = tree;
        tree._diskRead(node.children[idx],function(child) {
            if(child.numberActives === 2*that.order -1) {
                that._splitChild(node,idx,child,function(){
                    if(that.comparator(key, node.keys[idx].key)===1) {
                        idx++;
                    }
                    that._diskRead(node.children[idx], function(node){
                        idx = node.numberActives -1;
                        that.__insertNonFull(tree,node,idx,key,data,callback);
                    });
                });
            } else {
                that._diskRead(node.children[idx], function(node){
                    idx = node.numberActives -1;
                    that.__insertNonFull(tree,node,idx,key,data,callback);
                });
            }
        });

    } else {
        while(idx>=0 && tree.comparator(key,node.keys[idx].key) === -1) {
            node.keys[idx+1] = node.keys[idx];
            idx--;
        }

        if(idx>=0 && tree.comparator(key,node.keys[idx].key) === 0){
            node.keys[idx] = {key:key, data:data};
        } else {
            node.keys[idx + 1] = {key:key, data:data};
            node.numberActives++;
        }
        tree._diskWrite(node, function(node){
            return callback(node);
        });
    }
};

/**
 * delete
 *
 * Deletes the key from the
 * If the key is not found, an exception is thrown.
 *
 * @param key the key to be deleted
 * @returns true if the key is deleted false otherwise
 */
Tree.prototype.delete = function(key,callback) {
    var node = this.root;
    Tree.prototype.__deleteSearchNode(this,key,node,callback);
};
Tree.prototype.__deleteSearchNode = function(tree,key,node,callback) {
    var i = 0;

    if(node.numberActives === 0) {
        return callback(false);
    }

    while(i<node.numberActives && tree.comparator(key, node.keys[i].key) === 1) {
        i++;
    }

    var idx = i;

    if(i<node.numberActives && tree.comparator(key, node.keys[i].key) === 0) {
        return tree.__deleteNodeFound(tree,idx,key,node,callback);
    }

    if(node.isLeaf === true) {
        return callback(false);
    }

    var parent = node;
    tree._diskRead(node.children[i], function(node){
        if(node===null) {
            return callback(false);
        }

        var isLsiblingNull = false;
        var isRsiblingNull = false;
        var rsiblingIndex = null;
        var lsiblingIndex = null;

        if(idx === parent.numberActives) {
            isRsiblingNull = true;
            lsiblingIndex = parent.children[idx - 1];
            rsiblingIndex = parent.children[idx-1]
        } else if(idx === 0) {
            isLsiblingNull = true;
            rsiblingIndex = parent.children[1];
            lsiblingIndex = parent.children[1];
        } else {
            lsiblingIndex = parent.children[idx-1];
            rsiblingIndex = parent.children[idx+1];
        }

        tree._diskRead(lsiblingIndex, function(lsibling){
            tree._diskRead(rsiblingIndex, function(rsibling){
                if(isRsiblingNull===true) {
                    rsibling = null;
                }
                if(isLsiblingNull===true) {
                    lsibling = null;
                }

                if(node.numberActives === (tree.order-1) && parent != null) {
                    if(rsibling != null && rsibling.numberActives > (tree.order-1)) {
                        // The current node has (t - 1) keys but the right sibling has > (t - 1) keys
                        tree._moveKey(parent,i,left, function(parent){
                            tree.__deleteSearchNode(tree,key,node,callback);
                        });
                    } else if(lsibling != null && lsibling.numberActives > (tree.order-1)) {
                        // The current node has (t - 1) keys but the left sibling has > (t - 1) keys
                        tree._moveKey(parent,i,right, function(parent){
                            tree.__deleteSearchNode(tree,key,node,callback);
                        });
                    } else if(lsibling != null && lsibling.numberActives === (tree.order-1)) {
                        // The current node has (t - 1) keys but the left sibling has (t - 1) keys
                        tree._mergeSiblings(parent,i,left,function(node) {
                            tree.__deleteSearchNode(tree,key,node,callback);
                        });
                    } else if(rsibling != null && rsibling.numberActives === (tree.order-1)){
                        // The current node has (t - 1) keys but the left sibling has (t - 1) keys
                        tree._mergeSiblings(parent,i,right,function(node) {
                            tree.__deleteSearchNode(tree,key,node,callback);
                        });
                    }
                } else {
                    tree.__deleteSearchNode(tree,key,node,callback);
                }
            });
        })
    });
};
Tree.prototype.__deleteNodeFound = function (tree, idx, key, node, callback) {
    //Case 1 : The node containing the key is found and is the leaf node.
    //Also the leaf node has keys greater than the minimum required.
    //Simply remove the key
    if (node.isLeaf && (node.numberActives > (tree.order - 1))) {
        tree._deleteKeyFromNode(node, idx, function () {
            callback(true);
        });
        return true;
    }


    //If the leaf node is the root permit deletion even if the number of keys is
    //less than (t - 1)
    if (node.isLeaf && (node === tree.root)) {
        tree._deleteKeyFromNode(node, idx, function () {
            callback(true);
        });
        return true;
    }


    //Case 2: The node containing the key is found and is an internal node
    if (node.isLeaf === false) {
        tree._diskRead(node.children[idx], function (tmpNode) {
            if (tmpNode.numberActives > (tree.order - 1)) {
                tree._getMaxKeyPos(tree, tmpNode, function (subNodeIdx) {
                    key = subNodeIdx.node.keys[subNodeIdx.index];

                    node.keys[idx] = key;

                    tree._diskWrite(node, function (node) {
                        node = tmpNode;
                        key = key.key;
                        tree.__deleteSearchNode(tree, key, node, callback);
                    });
                });
            } else {
                tree._diskRead(node.children[idx + 1], function (tmpNode2) {
                    if (tmpNode2.numberActives > (tree.order - 1)) {
                        tree._getMinKeyPos(tree, tmpNode2, function (subNodeIdx) {
                            key = subNodeIdx.node.keys[subNodeIdx.index];

                            node.keys[idx] = key;

                            tree._diskWrite(node, function (node) {
                                node = tmpNode2;
                                key = key.key;
                                tree.__deleteSearchNode(tree, key, node, callback);
                            });
                        });
                    } else if (tmpNode.numberActives === (tree.order - 1) && tmpNode2.numberActives === (tree.order - 1)) {

                        tree._mergeNodes(tmpNode, node.keys[idx], tmpNode2, function (combNode) {

                            node.children[idx] = combNode;

                            idx++;
                            for (var i = idx; i < node.numberActives; i++) {
                                node.children[i] = node.children[i + 1];
                                node.keys[i - 1] = node.keys[i];
                            }
                            // freeing unused references
                            node.children[i] = null;
                            node.keys[i - 1] = null;

                            node.numberActives--;
                            if (node.numberActives === 0 && tree.root === node) {
                                tree.root = combNode;
                            }

                            tree._diskWrite(node, function (node) {
                                tree.__deleteSearchNode(tree, key, combNode, callback);
                            });
                        });
                    }
                });
            }
        });
    } // end case 2

    // Case 3:
    // In this case start from the top of the tree and continue
    // moving to the leaf node making sure that each node that
    // we encounter on the way has atleast 't' (order of the tree)
    // keys
    if (node.isLeaf && (node.numberActives > tree.order - 1)) {
        tree._deleteKeyFromNode(node, idx, function (node) {
            tree.__deleteSearchNode(tree, key, node, callback);
        });
    }
};

/**
 * _moveKey
 *
 * Move key situated at position i of the parent node
 * to the left or right child at positions i-1 and i+1
 * according to the provided position
 *
 * @param parent the node whose is going to be moved to a child
 * @param i Index of the key in the parent
 * @param position left, or right
 */
Tree.prototype._moveKey = function (parent, i, position, callback) {

    if (position === right) {
        i--;
    }

    var that = this;
    //var lchild = parent.children[i-1];
    that._diskRead(parent.children[i], function (lchild) {
        that._diskRead(parent.children[i + 1], function (rchild) {

            if (position == left) {
                lchild.keys[lchild.numberActives] = parent.keys[i];
                lchild.children[lchild.numberActives + 1] = rchild.children[0];
                rchild.children[0] = null;
                lchild.numberActives++;

                parent.keys[i] = rchild.keys[0];

                for (var _i = 1; _i < rchild.numberActives; _i++) {
                    rchild.keys[_i - 1] = rchild.keys[_i];
                    rchild.children[_i - 1] = rchild.children[_i];
                }
                rchild.children[rchild.numberActives - 1] = rchild.children[rchild.numberActives];
                rchild.numberActives--;
            } else {
                rchild.children[rchild.numberActives + 1] = rchild.children[rchild.numberActives];
                for (var _i = rchild.numberActives; _i > 0; _i--) {
                    rchild.children[_i] = rchild.children[_i - 1];
                    rchild.keys[_i] = rchild.keys[_i - 1];
                }
                rchild.keys[0] = null;
                rchild.children[0] = null;

                rchild.children[0] = lchild.children[lchild.numberActives];
                rchild.keys[0] = parent.keys[i];
                rchild.numberActives++;

                lchild.children[lchild.numberActives] = null;
                parent.keys[i] = lchild.keys[lchild.numberActives - 1];
                lchild.keys[lchild.numberActives - 1] = null;
                lchild.numberActives--;
            }

            that._diskWrite(lchild, function (lchild) {
                that._diskWrite(rchild, function (rchild) {
                    that._diskWrite(parent, function (parent) {
                        return callback(parent);
                    });
                });
            });
        });
    });
};

/**
 * _mergeSiblings
 *
 * Merges two nodes at the left and right of the provided
 * index in the parent node.
 *
 * @param parent the node whose children will be merged
 * @param i Index of the key in the parent pointing to the nodes to merge
 */
Tree.prototype._mergeSiblings = function(parent,index,pos,callback) {
    var i,j;
    var n1, n2;
    var tolookn1, tolookn2;

    if (index === (parent.numberActives)) {
        index--;
        tolookn1 = parent.children[parent.numberActives - 1];
        tolookn2 = parent.children[parent.numberActives]
    } else {
        tolookn1 = parent.children[index];
        tolookn2 = parent.children[index + 1];
    }

    var that = this;
    that._diskRead(tolookn1, function(n1){
        that._diskRead(tolookn2, function(n2){

            //Merge the current node with the left node
            var newNode = that._allocateNode();
            newNode.isLeaf = n1.isLeaf;
            newNode.level = n1.level;

            for(j=0; j<that.order-1; j++) {
                newNode.keys[j] = n1.keys[j];
                newNode.children[j] = n1.children[j];
            }

            newNode.keys[that.order-1] = parent.keys[index];
            newNode.children[that.order-1] = n1.children[that.order-1];

            for(j=0; j<that.order-1; j++) {
                newNode.keys[j+that.order] = n2.keys[j];
                newNode.children[j+that.order] = n2.children[j];
            }
            newNode.children[2*that.order-1] = n2.children[that.order-1];

            parent.children[index] = newNode;

            for(j=index; j<parent.numberActives;j++) {
                parent.keys[j] = parent.keys[j+1];
                parent.children[j+1] = parent.children[j+2];
            }

            newNode.numberActives = n1.numberActives + n2.numberActives+1;
            parent.numberActives--;

            for(i=parent.numberActives; i<2*that.order-1; i++) {
                parent.keys[i] = null;
            }

            if (parent.numberActives === 0 && that.root === parent) {
                that.root = newNode;
                if(newNode.level) {
                    newNode.isLeaf = false;
                } else {
                    newNode.isLeaf = true;
                }
            }

            that._diskWrite(newNode, function(newNode){
                that._diskWrite(parent,function(parent){
                    that._diskDelete(n1,function(){
                        that._diskDelete(n2,function(){
                            if(that.root === newNode) {
                                that._updateRootNode(that.root,function(){
                                    return callback(newNode);
                                });
                            } else {
                                return callback(newNode);
                            }
                        });
                    });
                });
            });
        });
    });
};

/**
 * _deleteKeyFromNode
 *
 * Deletes the key at position index from the provided node.
 *
 * @param node The node where the key will be deleted.
 * @param index The index of the key that will be deletd.
 * @return true if the key can be deleted, false otherwise
 */
Tree.prototype._deleteKeyFromNode = function (node, index, callback) {
    var keysMax = (2 * this.order) - 1;
    if (node.numberActives < keysMax) {
        keysMax = node.numberActives;
    }
    ;

    var i;

    if (node.isLeaf === false) {
        return false;
    }

    var key = node.keys[index];

    for (i = index; i < keysMax - 1; i++) {
        node.keys[i] = node.keys[i + 1];
    }

    // cleaning invalid reference
    node.keys.pop();

    node.numberActives--;

    this._diskWrite(node, function (node) {
        return callback(node);
    });
};

Tree.prototype._mergeNodes = function(n1, key, n2, callback) {
    var newNode;
    var i;

    newNode = this._allocateNode();
    newNode.isLeaf = true;

    for(i=0; i<n1.numberActives; i++) {
        newNode.keys[i]   = n1.keys[i];
        newNode.children[i]   = n1.children[i];
    }
    newNode.children[n1.numberActives] = n1.children[n1.numberActives];
    newNode.keys[n1.numberActives] = key;

    for(i=0; i<n2.numberActives; i++) {
        newNode.keys[i+n1.numberActives+1] = n2.keys[i];
        newNode.children[i+n1.numberActives+1] = n2.children[i];
    }
    newNode.children[(2*this.order)-1] = n2.children[n2.numberActives];

    newNode.numberActives = n1.numberActives + n2.numberActives + 1;
    newNode.isLeaf = n1.isLeaf;
    newNode.level = n1.level;


    var that = this;
    this._diskWrite(newNode, function(newNode){
        that._diskDelete(n1, function(){
            that._diskDelete(n2, function(){
                return callback(newNode);
            });
        })
    });
};

/**
 * audit
 *
 * Checks that the tree data structure is
 * valid.
 */
Tree.prototype.audit = function (showOutput) {
    var errors = [];
    var alreadySeen = [];
    var that = this;

    var foundInArray = function (data) {
        for (var i = 0; i < alreadySeen.length; i++) {
            if (that.comparator(alreadySeen[i], data) === 0) {
                var error = " !!! duplicated key " + data;
                if (showOutput === true) {
                    console.log(error);
                }
                errors.push(error);
            }
        }
    };

    var length = null;
    var that = this;
    this.walkNodes(function (n) {
        if (showOutput === true) {
            console.log("--- Node at " + n.level + " level");
            console.log(" - leaf? " + n.isLeaf);
            console.log(" - num actives? " + n.numberActives);
            console.log(" - keys: ");
        }
        for (var i = n.numberActives; i < n.keys.length; i++) {
            if (n.keys[i] != null) {
                if (showOutput === true) {
                    console.log(" * warning : redundant key data");
                    errors.push(" * warning : redundant key data");
                }
            }
        }

        for (var i = n.numberActives + 1; i < n.children.length; i++) {
            if (n.children[i] != null) {
                if (showOutput === true) {
                    console.log(" * warning : redundant children data");
                    errors.push(" * warning : redundant key data");
                }
            }
        }


        if (n.isLeaf === false) {
            for (var i = 0; i < n.numberActives; i++) {
                var maxLeft = this._diskRead(n.children[i]).keys[this._diskRead(n.children[i]).numberActives - 1 ].key;
                var minRight = this._diskRead(n.children[i + 1]).keys[0].key;
                if (showOutput === true) {
                    console.log("   " + n.keys[i].key + "(" + maxLeft + "," + minRight + ")");
                }
                if (that.comparator(n.keys[i].key, maxLeft) === -1) {
                    var error = " !!! value max left " + maxLeft + " > key " + n.keys[i].key;
                    if (showOutput === true) {
                        console.log(error);
                    }
                    errors.push(error);
                }
                if (that.comparator(n.keys[i].key, minRight) === 1) {
                    var error = " !!! value min right " + minRight + " < key " + n.keys[i].key;
                    if (showOutput === true) {
                        console.log(error);
                    }
                    errors.push(error);
                }

                foundInArray(n.keys[i].key);
                alreadySeen.push(n.keys[i].key);
            }
        } else {
            if (length === null) {
                length = n.level;
            } else {
                if (length != n.level) {
                    var error = " !!! Leaf node with wrong level value";
                    if (showOutput === true) {
                        console.log(error);
                    }
                    errors.push(error);
                }
            }
            for (var i = 0; i < n.numberActives; i++) {
                if (showOutput === true) {
                    console.log(" " + n.keys[i].key);
                }
                foundInArray(n.keys[i].key);
                alreadySeen.push(n.keys[i].key);

            }
        }

        if (n != that.root) {
            if (n.numberActives > ((2 * that.order) - 1)) {
                if (showOutput === true) {
                    var error = " !!!! MAX num keys restriction violated ";
                }
                console.log(error);
                errors.push(error);
            }
            if (n.numberActives < (that.order - 1)) {
                if (showOutput === true) {
                    var error = " !!!! MIN num keys restriction violated ";
                }
                console.log(error);
                errors.push(error);
            }

        }
    });

    return errors;
};

/**
 *  _getMaxKeyPos
 *
 *  Used to get the position of the MAX key within the subtree
 *  @return An object containing the key and position of the key
 */
Tree.prototype._getMaxKeyPos = function (tree, node, callback) {
    var node_pos = {};

    if (node === null) {
        return callback(null);
    }

    if (node.isLeaf === true) {
        node_pos.node = node;
        node_pos.index = node.numberActives - 1;
        return callback(node_pos);
    } else {
        node_pos.node = node;
        node_pos.index = node.numberActives - 1;
        tree._diskRead(node.children[node.numberActives], function (node) {
            return tree._getMaxKeyPos(tree, node, callback);
        });
    }
};

/**
 *  _getMinKeyPos
 *
 *  Used to get the position of the MAX key within the subtree
 *  @return An object containing the key and position of the key
 */
Tree.prototype._getMinKeyPos = function (tree, node, callback) {
    var node_pos = {};

    if (node === null) {
        callback(null);
    }

    if (node.isLeaf === true) {
        node_pos.node = node;
        node_pos.index = 0;
        return callback(node_pos);
    } else {
        node_pos.node = node;
        node_pos.index = 0;
        tree._diskRead(node.children[0], function (node) {
            return tree._getMinKeyPos(tree, node, callback);
        });
    }
};


/**
 * Node
 *
 * Implements the interface of BinarySearchTree.Node
 *
 * A Tree node augmented with BTree
 * node structures
 */
var Node = function() {
    this.numberActives = 0;
    this.isLeaf = null;
    this.keys = [];
    this.children = [];
    this.level = 0;
};

module.exports = {
    Tree: Tree,
    Node: Node
};
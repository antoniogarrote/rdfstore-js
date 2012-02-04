// exports
exports.InMemoryBTree = {};
var InMemoryBTree = exports.InMemoryBTree;

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

InMemoryBTree.Tree = function(order) {
    if(arguments.length != 0) {
        this.order = order;
        this.root = this._allocateNode();
        this.root.isLeaf = true;
        this.root.level = 0;
        this._diskWrite(this.root);
        this._updateRootNode(this.root);

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
InMemoryBTree.Tree.prototype._allocateNode = function () {
    return new InMemoryBTree.Node();
};

/**
 * _diskWrite
 *
 * Persists the node to secondary memory.
 */
InMemoryBTree.Tree.prototype._diskWrite= function(node) {
    // dummy implementation;
    // no-op
};


/**
 * _diskRead
 *
 * Retrieves a node from secondary memory using the provided
 * pointer
 */
InMemoryBTree.Tree.prototype._diskRead = function(pointer) {
    // dummy implementation;
    // no-op
    return pointer;
};


InMemoryBTree.Tree.prototype._diskDelete= function(node) {
    // dummy implmentation
    // no-op
};

/**
 * _updateRootNode
 *
 * Updates the pointer to the root node stored in disk.
 */
InMemoryBTree.Tree.prototype._updateRootNode = function(node) {
    // dummy implementation;
    // no-op
    return node;
};

InMemoryBTree.Tree.prototype.clear = function() {
        this.root = this._allocateNode();
        this.root.isLeaf = true;
        this.root.level = 0;
        this._updateRootNode(this.root);
};

/**
 * search
 *
 * Retrieves the node matching the given value.
 * If no node is found, null is returned.
 */
InMemoryBTree.Tree.prototype.search = function(key, checkExists) {
    var searching = true;
    var node = this.root;

    while(searching) {
        var idx = 0;
        while(idx < node.numberActives && this.comparator(key, node.keys[idx].key) === 1) {
            idx++;
        }

        if(idx < node.numberActives && this.comparator(node.keys[idx].key,key) === 0) {
            if(checkExists != null && checkExists == true) {
                return true;
            } else {
                return node.keys[idx].data;
            }
        } else {
            if(node.isLeaf === true) {
                searching = false;
            } else {
                node = this._diskRead(node.children[idx]);
            }
        }
    }

    return null;
};


/**
 * walk
 * Applies a function to all the nodes key and data in the the
 * tree in key order.
 */
InMemoryBTree.Tree.prototype.walk = function(f) {
    this._walk(f,this.root);
};

InMemoryBTree.Tree.prototype._walk = function(f,node) {
    if(node.isLeaf) {
        for(var i=0; i<node.numberActives; i++) {
            f(node.keys[i]);
        }
    } else {
        for(var i=0; i<node.numberActives; i++) {
            this._walk(f,this._diskRead(node.children[i]));
            f(node.keys[i]);
        }
        this._walk(f,this._diskRead(node.children[node.numberActives]));
    }
};

/**
 * walkNodes
 * Applies a function to all the nodes in the the
 * tree in key order.
 */
InMemoryBTree.Tree.prototype.walkNodes = function(f) {
    this._walkNodes(f,this.root);
};

InMemoryBTree.Tree.prototype._walkNodes = function(f,node) {
    if(node.isLeaf) {
        f(node);
    } else {
        f(node);
        for(var i=0; i<node.numberActives; i++) {
            this._walkNodes(f,this._diskRead(node.children[i]));
        }
        this._walkNodes(f,this._diskRead(node.children[node.numberActives]));
    }
};

/**
 * _splitChild
 *
 * Split the child node and adjusts the parent.
 */
InMemoryBTree.Tree.prototype._splitChild = function(parent, index, child) {
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

    this._diskWrite(newChild);
    this._diskWrite(parent);
    this._diskWrite(child);
};

/**
 * insert
 *
 * Creates a new node with value key and data and inserts it
 * into the tree.
 */
InMemoryBTree.Tree.prototype.insert = function(key,data) {
    if(this.root.numberActives === (2 * this.order - 1)) {
        var newRoot = this._allocateNode();
        newRoot.isLeaf = false;
        newRoot.level = this.root.level + 1;
        newRoot.numberActives = 0;
        newRoot.children[0] = this.root;

        this._splitChild(newRoot, 0, this.root);
        this.root = newRoot;
        this._updateRootNode(this.root);
        this._insertNonFull(newRoot, key, data);
    } else {
        this._insertNonFull(this.root, key, data);
    }
};

/**
 * _insertNonFull
 *
 * Recursive function that tries to insert the new key in
 * in the prvided node, or splits it and go deeper
 * in the BTree hierarchy.
 */
InMemoryBTree.Tree.prototype._insertNonFull = function(node,key,data) {
    var idx = node.numberActives - 1;

    while(!node.isLeaf) {
        while(idx>=0 && this.comparator(key,node.keys[idx].key) === -1) {
            idx--;
        }
        idx++;
        var child = this._diskRead(node.children[idx]);

        if(child.numberActives === 2*this.order -1) {
            this._splitChild(node,idx,child);
            if(this.comparator(key, node.keys[idx].key)===1) {
                idx++;
            }
        }
        node = this._diskRead(node.children[idx]);
        idx = node.numberActives -1;
    }

    while(idx>=0 && this.comparator(key,node.keys[idx].key) === -1) {
        node.keys[idx+1] = node.keys[idx];
        idx--;
    }

    node.keys[idx + 1] = {key:key, data:data};
    node.numberActives++;
    this._diskWrite(node);
};

/**
 * delete
 *
 * Deletes the key from the BTree.
 * If the key is not found, an exception is thrown.
 *
 * @param key the key to be deleted
 * @returns true if the key is deleted false otherwise
 */
InMemoryBTree.Tree.prototype.delete = function(key) {
    var node = this.root;
    var parent = null;
    var searching = true;
    var idx = null;
    var lsibling = null;
    var rsibling = null;
    var shouldContinue = true;

    while(shouldContinue === true) {
        shouldContinue = false;

        while(searching === true) {
            i = 0;

            if(node.numberActives === 0) {
                return false;
            }

            while(i<node.numberActives && this.comparator(key, node.keys[i].key) === 1) {
                i++;
            }

            idx = i;

            if(i<node.numberActives && this.comparator(key, node.keys[i].key) === 0) {
                searching = false;
            }

            if(searching === true) {

                if(node.isLeaf === true) {
                    return false;
                }

                parent = node;
                node = this._diskRead(node.children[i]);

                if(node===null) {
                    return false;
                }

                if(idx === parent.numberActives) {
                    lsibling = this._diskRead(parent.children[idx-1]);
                    rsibling = null;
                } else if(idx === 0) {
                    lsibling = null;
                    rsibling = this._diskRead(parent.children[1]);
                } else {
                    lsibling = this._diskRead(parent.children[idx-1]);
                    rsibling = this._diskRead(parent.children[idx+1]);
                }


                if(node.numberActives === (this.order-1) && parent != null) {
                    if(rsibling != null && rsibling.numberActives > (this.order-1)) {
                        // The current node has (t - 1) keys but the right sibling has > (t - 1) keys
                        this._moveKey(parent,i,left);
                    } else if(lsibling != null && lsibling.numberActives > (this.order-1)) {
                        // The current node has (t - 1) keys but the left sibling has > (t - 1) keys
                        this._moveKey(parent,i,right);
                    } else if(lsibling != null && lsibling.numberActives === (this.order-1)) {
                        // The current node has (t - 1) keys but the left sibling has (t - 1) keys
                        node = this._mergeSiblings(parent,i,left);
                    } else if(rsibling != null && rsibling.numberActives === (this.order-1)){
                        // The current node has (t - 1) keys but the left sibling has (t - 1) keys
                        node = this._mergeSiblings(parent,i,right);
                    }
                }
            }
        }


        //Case 1 : The node containing the key is found and is the leaf node.
        //Also the leaf node has keys greater than the minimum required.
        //Simply remove the key
        if(node.isLeaf && (node.numberActives > (this.order-1))) {
            this._deleteKeyFromNode(node,idx);
            return true;
        }


        //If the leaf node is the root permit deletion even if the number of keys is
        //less than (t - 1)
        if(node.isLeaf && (node === this.root)) {
            this._deleteKeyFromNode(node,idx);
            return true;
        }


        //Case 2: The node containing the key is found and is an internal node
        if(node.isLeaf === false) {
            var tmpNode = null;
            var tmpNode2 = null;
            if((tmpNode=this._diskRead(node.children[idx])).numberActives > (this.order-1)) {
                var subNodeIdx = this._getMaxKeyPos(tmpNode);
                key = subNodeIdx.node.keys[subNodeIdx.index];

                node.keys[idx] = key;

                //this._delete(node.children[idx],key.key);
                this._diskWrite(node);
                node = tmpNode;
                key = key.key;
                shouldContinue = true;
                searching = true;
            } else if ((tmpNode = this._diskRead(node.children[idx+1])).numberActives >(this.order-1)) {
                var subNodeIdx = this._getMinKeyPos(tmpNode);
                key = subNodeIdx.node.keys[subNodeIdx.index];

                node.keys[idx] = key;

                //this._delete(node.children[idx+1],key.key);
                this._diskWrite(node);
                node = tmpNode;
                key = key.key;
                shouldContinue = true;
                searching = true;
            } else if((tmpNode = this._diskRead(node.children[idx])).numberActives === (this.order-1) &&
                      (tmpNode2 = this._diskRead(node.children[idx+1])).numberActives === (this.order-1)) {

                var combNode = this._mergeNodes(tmpNode, node.keys[idx], tmpNode2);
                node.children[idx] = combNode;

                idx++;
                for(var i=idx; i<node.numberActives; i++) {
          	    node.children[i] = node.children[i+1];
          	    node.keys[i-1] = node.keys[i];
                }
                // freeing unused references
                node.children[i] = null;
                node.keys[i-1] = null;

                node.numberActives--;
                if (node.numberActives === 0 && this.root === node) {
                    this.root = combNode;
                }

                this._diskWrite(node);

                node = combNode;
                shouldContinue = true;
                searching = true;
            }
        }


        // Case 3:
	// In this case start from the top of the tree and continue
	// moving to the leaf node making sure that each node that
	// we encounter on the way has atleast 't' (order of the tree)
	// keys
	if(node.isLeaf && (node.numberActives > this.order - 1) && searching===false) {
            this._deleteKeyFromNode(node,idx);
	}

        if(shouldContinue === false) {
            return true;
        }
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
InMemoryBTree.Tree.prototype._moveKey = function (parent, i, position) {

    if (position === right) {
        i--;
    }

    //var lchild = parent.children[i-1];
    var lchild = this._diskRead(parent.children[i]);
    var rchild = this._diskRead(parent.children[i + 1]);


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

    this._diskWrite(lchild);
    this._diskWrite(rchild);
    this._diskWrite(parent);
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
InMemoryBTree.Tree.prototype._mergeSiblings = function (parent, index, pos) {
    var i, j;
    var n1, n2;

    if (index === (parent.numberActives)) {
        index--;
        n1 = this._diskRead(parent.children[parent.numberActives - 1]);
        n2 = this._diskRead(parent.children[parent.numberActives]);
    } else {
        n1 = this._diskRead(parent.children[index]);
        n2 = this._diskRead(parent.children[index + 1]);
    }

    //Merge the current node with the left node
    var newNode = this._allocateNode();
    newNode.isLeaf = n1.isLeaf;
    newNode.level = n1.level;

    for (j = 0; j < this.order - 1; j++) {
        newNode.keys[j] = n1.keys[j];
        newNode.children[j] = n1.children[j];
    }

    newNode.keys[this.order - 1] = parent.keys[index];
    newNode.children[this.order - 1] = n1.children[this.order - 1];

    for (j = 0; j < this.order - 1; j++) {
        newNode.keys[j + this.order] = n2.keys[j];
        newNode.children[j + this.order] = n2.children[j];
    }
    newNode.children[2 * this.order - 1] = n2.children[this.order - 1];

    parent.children[index] = newNode;

    for (j = index; j < parent.numberActives; j++) {
        parent.keys[j] = parent.keys[j + 1];
        parent.children[j + 1] = parent.children[j + 2];
    }

    newNode.numberActives = n1.numberActives + n2.numberActives + 1;
    parent.numberActives--;

    for (i = parent.numberActives; i < 2 * this.order - 1; i++) {
        parent.keys[i] = null;
    }

    if (parent.numberActives === 0 && this.root === parent) {
        this.root = newNode;
        if (newNode.level) {
            newNode.isLeaf = false;
        } else {
            newNode.isLeaf = true;
        }
    }

    this._diskWrite(newNode);
    if (this.root === newNode) {
        this._updateRootNode(this.root);
    }
    this._diskWrite(parent);
    this._diskDelete(n1);
    this._diskDelete(n2);

    return newNode;
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
InMemoryBTree.Tree.prototype._deleteKeyFromNode = function (node, index) {
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

    this._diskWrite(node);

    return true;
};

InMemoryBTree.Tree.prototype._mergeNodes = function (n1, key, n2) {
    var newNode;
    var i;

    newNode = this._allocateNode();
    newNode.isLeaf = true;

    for (i = 0; i < n1.numberActives; i++) {
        newNode.keys[i] = n1.keys[i];
        newNode.children[i] = n1.children[i];
    }
    newNode.children[n1.numberActives] = n1.children[n1.numberActives];
    newNode.keys[n1.numberActives] = key;

    for (i = 0; i < n2.numberActives; i++) {
        newNode.keys[i + n1.numberActives + 1] = n2.keys[i];
        newNode.children[i + n1.numberActives + 1] = n2.children[i];
    }
    newNode.children[(2 * this.order) - 1] = n2.children[n2.numberActives];

    newNode.numberActives = n1.numberActives + n2.numberActives + 1;
    newNode.isLeaf = n1.isLeaf;
    newNode.level = n1.level;


    this._diskWrite(newNode);
    // @todo
    // delte old nodes from disk
    return newNode;
};

/**
 * audit
 *
 * Checks that the tree data structure is
 * valid.
 */
InMemoryBTree.Tree.prototype.audit = function (showOutput) {
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
                var maxLeft = that._diskRead(n.children[i]).keys[that._diskRead(n.children[i]).numberActives - 1 ].key;
                var minRight = that._diskRead(n.children[i + 1]).keys[0].key;
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
InMemoryBTree.Tree.prototype._getMaxKeyPos = function (node) {
    var node_pos = {};

    while (true) {
        if (node === null) {
            break;
        }

        if (node.isLeaf === true) {
            node_pos.node = node;
            node_pos.index = node.numberActives - 1;
            return node_pos;
        } else {
            node_pos.node = node;
            node_pos.index = node.numberActives - 1;
            node = this._diskRead(node.children[node.numberActives]);
        }
    }

    return node_pos;
};

/**
 *  _getMinKeyPos
 *
 *  Used to get the position of the MAX key within the subtree
 *  @return An object containing the key and position of the key
 */
InMemoryBTree.Tree.prototype._getMinKeyPos = function (node) {
    var node_pos = {};

    while (true) {
        if (node === null) {
            break;
        }

        if (node.isLeaf === true) {
            node_pos.node = node;
            node_pos.index = 0;
            return node_pos;
        } else {
            node_pos.node = node;
            node_pos.index = 0;
            node = this._diskRead(node.children[0]);
        }
    }

    return node_pos;
};


/**
 * Node
 *
 * Implements the interface of BinarySearchTree.Node
 *
 * A Tree node augmented with BTree
 * node structures
 */
InMemoryBTree.Node = function() {
    this.numberActives = 0;
    this.isLeaf = null;
    this.keys = [];
    this.children = [];
    this.level = 0;
};

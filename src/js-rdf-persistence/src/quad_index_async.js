// exports
exports.QuadIndex = {};
var QuadIndex = exports.QuadIndex;

// imports
var BaseTree = require("./../../js-trees/src/in_memory_async_b_tree").InMemoryAsyncBTree;
var Utils = require("./../../js-trees/src/utils").Utils;
var QuadIndexCommon = require("./quad_index_common").QuadIndexCommon;

QuadIndex.Tree = function (params, callback) {
    if (arguments != 0) {
        this.componentOrder = params.componentOrder;

        // @todo change this if using the file backed implementation
        BaseTree.Tree.call(this, params.order, function (tree) {
            tree.comparator = function (a, b) {
                for (var i = 0; i < tree.componentOrder.length; i++) {
                    var component = tree.componentOrder[i];

                    var vala = a[component];
                    var valb = b[component];

                    if (vala < valb) {
                        return -1;
                    } else if (vala > valb) {
                        return 1;
                    }
                }

                return 0;
            };

            tree.rangeComparator = function (a, b) {
                for (var i = 0; i < tree.componentOrder.length; i++) {
                    var component = tree.componentOrder[i];
                    if (b[component] == null || a[component] == null) {
                        return 0;
                    } else {
                        if (a[component] < b[component]) {
                            return -1
                        } else if (a[component] > b[component]) {
                            return 1
                        }
                    }
                }

                return 0;
            };
            callback(tree);
        });
    }
};

Utils.extends(BaseTree.Tree, QuadIndex.Tree);

QuadIndex.Tree.prototype.insert = function(quad, callback) {
    BaseTree.Tree.prototype.insert.call(this, quad, null, function(result){
        callback(result);
    });
};

QuadIndex.Tree.prototype.search = function(quad, callback) {
    BaseTree.Tree.prototype.search.call(this, quad, function(result){
        callback(result);
    }, true); // true -> check exists : hack only present in the inMemoryAsyncBTree implementation
};

QuadIndex.Tree.prototype.range = function (pattern, callback) {
    this._rangeTraverse(this, this.root, pattern, callback);
};

QuadIndex.Tree.prototype._rangeTraverse = function(tree,node, pattern, callback) {
    var patternKey  = pattern.key;
    var acum = [];
    var pendingNodes = [node];

    Utils.meanwhile(pendingNodes.length > 0, function(k,em){
        var mainLoopf = arguments.callee;
        var node = pendingNodes.shift();
        var idxMin = 0;

        while(idxMin < node.numberActives && tree.rangeComparator(node.keys[idxMin].key,patternKey) === -1) {
            idxMin++;
        }
        if(node.isLeaf === true) {
            var idxMax = idxMin;

            while(idxMax < node.numberActives && tree.rangeComparator(node.keys[idxMax].key,patternKey) === 0) {
                acum.push(node.keys[idxMax].key);
                idxMax++;
            }

            if(pendingNodes.length === 0) {
                k(false,mainLoopf,em);
            } else {
                k(true,mainLoopf,em);
            }
        } else {
            tree._diskRead(node.children[idxMin], function(childNode){
                pendingNodes.push(childNode);

                Utils.meanwhile(true,
                            function(kk,e){
                                var loopf = arguments.callee;
                                if(e.idxMax < node.numberActives && tree.rangeComparator(node.keys[e.idxMax].key,patternKey) === 0) {
                                    acum.push(node.keys[e.idxMax].key);
                                    e.idxMax++;
                                    tree._diskRead(node.children[e.idxMax], function(childNode){
                                        pendingNodes.push(childNode);
                                        kk(true,loopf,e);
                                    })
                                } else {
                                    kk(false,loopf,e);
                                }
                            },
                            function(e){
                                if(pendingNodes.length===0) {
                                    k(false,mainLoopf,em);
                                } else {
                                    k(true,mainLoopf,em);
                                }
                            },
                            {idxMax: idxMin});
            })
        }
    }, function(e) {
        callback(acum);
    })
};

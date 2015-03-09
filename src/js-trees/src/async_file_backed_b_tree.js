// exports
exports.AsyncFileBackedBTree = {};
var AsyncFileBackedBTree = exports.AsyncFileBackedBTree;

// imports
var InMemoryAsyncBTree = require("./in_memory_async_b_tree").InMemoryAsyncBTree;
var DiskManager = require("./disk_manager").DiskManager;
var AsyncDiskManager = require("./async_disk_manager").AsyncDiskManager;
var Utils = require("./utils").Utils;

/**
 * Tree
 *
 * Implements the interface of BinarySearchTree.Tree
 *
 * An implementation of an in memory B-Tree.
 */
AsyncFileBackedBTree.Tree = function(params, callback) {
    if(arguments.length != 0) {
        this.order = params.order;
        this.path = params.path;
        this.keyLength = params.keyLength;
        this.valueLength = params.valueLength;
        this.NodeSchema = params.nodeSchema;
        this.paramscomparator = params.comparator;
        this.cacheSize = (params.cacheSize || 0);

        this.nodeSchema = new this.NodeSchema(this.order);
        var that = this;
        this.container = new AsyncDiskManager.Container(this.path, this.nodeSchema, function() {
            that.container.cacheSize = that.cacheSize;
            callback(that);
        });
    }
};

Utils.extends(InMemoryAsyncBTree.Tree, AsyncFileBackedBTree.Tree);

/**
 * init
 *
 * Creates a new file backed memory Tree with the information passed to
 * the constructor of the object.
 */
AsyncFileBackedBTree.Tree.prototype.init = function (callback) {
    var that = this;
    this.container.format(this.keyLength, this.valueLength, this.order, function () {
        InMemoryAsyncBTree.Tree.call(that, that.order, function () {
            that.comparator = that.paramscomparator;
            callback(that);
        });
    });
};


/**
 * load
 *
 * Restores the BTree from the provided file path
 */
AsyncFileBackedBTree.Tree.prototype.load = function (callback) {
    var that = this;
    this.container.load(function () {
        that.comparator = that.paramscomparator;
        that.container.readNode(that.container.rootNode, function (node) {
            that.root = node;
            callback(that);
        });
    });
};

AsyncFileBackedBTree.Tree.prototype.close = function (callback) {
    this.container.close(function () {
        callback();
    });
};


AsyncFileBackedBTree.Tree.prototype._diskWrite = function (node, callback) {
    this.container.writeNode(node, function (result) {
        callback(result);
    });
};

AsyncFileBackedBTree.Tree.prototype._diskRead = function (nodeOrKey, callback) {
    var toRead = nodeOrKey;
    if (typeof(nodeOrKey) === 'object') {
        toRead = nodeOrKey.nodeKey
    }
    this.container.readNode(toRead, function (node) {
        callback(node);
    });
};

AsyncFileBackedBTree.Tree.prototype._diskDelete= function(node,callback) {
    this.container.deleteNode(node, function(){
        callback();
    });
};

AsyncFileBackedBTree.Tree.prototype._updateRootNode = function (node, callback) {
    this.container.updateRoot(node, function () {
        callback();
    });
};


/**
 * A sample tree working with floats as keys and values
 */
AsyncFileBackedBTree.AsyncFileBackedFloatFloatBTree = function (params, callback) {
    params.keyLength = 4;
    params.valueLength = 4;
    params.nodeSchema = DiskManager.FloatFloatNodeSchema;
    params.comparator = function (a, b) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    };

    AsyncFileBackedBTree.Tree.call(this, params, callback)
};

Utils.extends(AsyncFileBackedBTree.Tree, AsyncFileBackedBTree.AsyncFileBackedFloatFloatBTree);

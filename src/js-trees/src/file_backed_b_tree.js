// exports
exports.FileBackedBTree = {};
var FileBackedBTree = exports.FileBackedBTree;

// imports
var InMemoryBTree = require("./in_memory_b_tree").InMemoryBTree;
var DiskManager = require("./disk_manager").DiskManager;
var Utils = require("./utils").Utils;

/**
 * Tree
 *
 * Stores all the information for the file backed BTree.
 * The actual tree will be created or loaded after a
 * a call to init or load.
 */
FileBackedBTree.Tree = function(params) {
    if(arguments.length != 0) {
        this.order = params.order;
        this.path = params.path;
        this.keyLength = params.keyLength;
        this.valueLength = params.valueLength;
        this.NodeSchema = params.nodeSchema;
        this.paramscomparator = params.comparator;
        this.cacheSize = (params.cacheSize || 0);

        this.nodeSchema = new this.NodeSchema(this.order);
        this.container = new DiskManager.Container(this.path, this.nodeSchema);
        this.container.cacheSize = this.cacheSize;
    }
};

Utils.extends(InMemoryBTree.Tree, FileBackedBTree.Tree);

/**
 * init
 *
 * Creates a new file backed memory Tree with the information passed to
 * the constructor of the object.
 */
FileBackedBTree.Tree.prototype.init = function () {
    this.container.format(this.keyLength, this.valueLength, this.order);
    InMemoryBTree.Tree.call(this, this.order);
    this.comparator = this.paramscomparator;
};


/**
 * load
 *
 * Restores the BTree from the provided file path
 */
FileBackedBTree.Tree.prototype.load = function () {
    this.container.load();
    this.comparator = this.paramscomparator;
    this.root = this.container.readNode(this.container.rootNode);
};

FileBackedBTree.Tree.prototype.close = function () {
    this.container.close();
};


FileBackedBTree.Tree.prototype._diskWrite = function (node) {
    this.container.writeNode(node);
};

FileBackedBTree.Tree.prototype._diskRead = function (nodeOrKey) {
    if (typeof(nodeOrKey) === 'object') {
        return this.container.readNode(nodeOrKey.nodeKey);
    } else {
        return this.container.readNode(nodeOrKey);
    }
};

FileBackedBTree.Tree.prototype._diskDelete= function(node) {
    this.container.deleteNode(node);
};

FileBackedBTree.Tree.prototype._updateRootNode = function (node) {
    this.container.updateRoot(node);
};


/**
 * A sample tree working with floats as keys and values
 */
FileBackedBTree.FileBackedFloatFloatBTree = function (params) {
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

    FileBackedBTree.Tree.call(this, params)
};

Utils.extends(FileBackedBTree.Tree, FileBackedBTree.FileBackedFloatFloatBTree);

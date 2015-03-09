// expots
exports.AsyncDiskManager = {};
var AsyncDiskManager = exports.AsyncDiskManager;

// imports
var fs = require('fs');
var Put = require('put');
var Binary = require('binary');
var DiskManager = require('./disk_manager').DiskManager;
var Utils = require('./utils').Utils;



AsyncDiskManager.Container = function(path, nodeSchema, callback) {
    var that = this;
    fs.open(path, 'a+', function(err, fd){
        that.wfd = fd;
        fs.open(path, 'r+', function(err, fd){
            that.rfd = fd;
            that.freeNodePointer = 0;
            that.keyLength = null;
            that.valueLength = null;
            that.treeOrder = null;
            that.rootNode = 0;
            that.nodeSchema = nodeSchema;
            that.nodeSchema.container = that;
            fs.stat(path, function(err,stats){
                that.stats = stats;
                that.endPosition = that.stats.size;
                // superBlockSize = treeOrder + keyLength + valueLength + freeNodePointer
                that.superBlockSize = 4 + 4 + 4 + 4 + 4;

                 new AsyncDiskManager.FreeBlocksManager(that, function(fbm){
                     that.freeBlocksManager = fbm;
                     that.bufferCache = new DiskManager.BufferCache(that);
                     callback(that);
                });
            });
        });
    });
};

AsyncDiskManager.Container.prototype.close = function(callback) {
    var that = this;
    this._writeSuperBlock(function(){
        fs.close(that.wfd, function(){
            fs.close(that.rfd, function(){
                callback();
            });
        });
    });
};

AsyncDiskManager.Container.prototype.format = function(keyLength, valueLength, treeOrder, callback) {
    this.keyLength = keyLength;
    this.valueLength = valueLength;
    this.treeOrder = treeOrder;
    this.endPosition = this.superBlockSize;
    var that = this;
    this._writeSuperBlock(function(){
        that.freeBlocksManager.init(function(){
            callback();
        });
    });
};

AsyncDiskManager.Container.prototype.load = function(callback) {
    var that = this;
    this._readSuperBlock(function(){
        that.freeBlocksManager.init(function(){
            callback();
        });
    });
};

AsyncDiskManager.Container.prototype._writeSuperBlock = function(callback) {
    var b = Put().word32le(this.treeOrder).
        word32le(this.rootNode).
        word32le(this.keyLength).
        word32le(this.valueLength).
        word32le(this.freeNodePointer).buffer();

    var that = this;
    fs.write(this.wfd,b, 0, this.superBlockSize, 0, function(err, written){
        if(written!=that.superBlockSize) {
            console.log("Error writing superblock");
            callback(false);
        } else {
            callback(true)
        }
    });
};

AsyncDiskManager.Container.prototype._ensureNodeKey = function (nodeOrKey, callback) {
    if (typeof(nodeOrKey) === 'object') {
        this.container.readNode(nodeOrKey.nodeKey, function (res) {
            callback(res);
        });
    } else {
        this.container.readNode(nodeOrKey, function (res) {
            callback(res);
        });
    }
};

AsyncDiskManager.Container.prototype._readSuperBlock = function(callback) {
    var b = new Buffer(this.superBlockSize);
    var that = this;
    fs.read(this.rfd, b, 0, this.superBlockSize, 0, function(rs,read){
        if(read === that.superBlockSize) {
            var readValues = Binary.parse(b).
                word32le('treeOrder').
                word32le('rootNode').
                word32le('keyLength').
                word32le('valueLength').
                word32le('freeNodePointer').vars;

            that.treeOrder = readValues.treeOrder;
            that.rootNode = readValues.rootNode;
            that.keyLength = readValues.keyLength;
            that.valueLength = readValues.valueLength;
            that.freeNodePointer = readValues.freeNodePointer;

            if(that.treeOrder === 0 || that.keyLength === 0 || that.valueLength === 0) {
                console.log("read invalid block");
                callback(false)
            } else {
                callback(true);
            }
        } else {
            console.log("erro reading block");
            callback(false)
        }
    });
};

AsyncDiskManager.Container.prototype._readFreeBlock = function(position, callback) {
    var b = new Buffer(this.nodeSchema.encodedSize);
    var that = this;

    fs.read(that.rfd, b, 0, that.nodeSchema.encodedSize, position, function(err, read){
        if(read != that.nodeSchema.encodedSize) {
            console.log("error reading free block");
            callback(false);
        } else {
            var parsing = Binary.parse().word8('free_used'); // free/used byte
            parsing.word32le('nextPointer');
            var vars = parsing.vars;
            vars.position = position;

            callback(vars);
        }
    });
};

AsyncDiskManager.Container.prototype.writeNode = function(node, callback) {
    var that = this;
    var position = this.endPosition;

    this.freeBlocksManager.next(function(freePosition){
        if(freePosition!=false) {
            position = freePosition;
        }

        var encodedNode = that.nodeSchema.encode(node);
        fs.write(that.wfd, encodedNode, 0, that.nodeSchema.encodedSize, position, function(err,written){
            if(written === that.nodeSchema.encodedSize) {
                node.nodeKey = position;
                that.bufferCache.insert(node);
                if(position === that.endPosition) {
                    that.endPosition = that.endPosition + that.nodeSchema.encodedSize;
                }
                callback(node);
            } else {
                console.log("error writing node");
                callback(false);
            }
        });
    });
};


AsyncDiskManager.Container.prototype.readNode = function(nodeKey,callback) {
    var node = this.bufferCache.fetch(nodeKey);
    var that = this;
    if(node == null) {
        var b = new Buffer(that.nodeSchema.encodedSize);
        fs.read(that.rfd, b, 0, that.nodeSchema.encodedSize, nodeKey, function(err,read){

            if(read != that.nodeSchema.encodedSize) {
                console.log("error reading node");
                callback(false);
            } else {
                node = that.nodeSchema.decode(b);
                node.nodeKey = nodeKey;
                that.bufferCache.insert(node);
                callback(node);
            }
        });
    } else {
        callback(node);
    }
};

AsyncDiskManager.Container.prototype.deleteNode = function(node, callback) {
    this.bufferCache.invalidate(node.nodeKey);
    this.freeBlocksManager.release(node, function(){
        callback();
    });
};

AsyncDiskManager.Container.prototype.updateRoot = function (node, callback) {
    this.rootNode = node.nodeKey;
    this._writeSuperBlock(function () {
        callback();
    });
};



/**
 * FreeBlocksManager
 *
 * Mantains the list of free blocks and manage
 * the allocation and release of blocks.
 *
 * @param container the container where this cache
 * will be used.
 */
AsyncDiskManager.FreeBlocksManager = function(container, callback) {
    this.container = container;
    this.freeBlocksCache = [];
    callback(this);
};

AsyncDiskManager.FreeBlocksManager.prototype.init = function(callback) {
    var nextPointer = this.container.freeNodePointer;
    this.__init(nextPointer, this, callback);
};
AsyncDiskManager.FreeBlocksManager.prototype.__init = function (nextPointer, tree, callback) {
    if (nextPointer != 0 && tree.freeBlocksCache.length < tree.container.cacheSize) {
        var that = tree;
        container._readFreeBlock(nextPointer, function (freeBlock) {
            nextPointer = freeBlock.nextPointer;
            that.freeBlocksCache.push(freeBlock);
            tree.__init(nextPointer, tree, callback);
        });
    } else {
        callback();
    }

};


AsyncDiskManager.FreeBlocksManager.prototype.next = function(callback) {
    if(this.freeBlocksCache.length === 0) {
        callback(false);
    } else {
        var nextBlock = this.freeBlocksCache.shift();
        var toReturn = this.container.freeNodePointer;
        this.container.freeNodePointer = nextBlock.nextPointer;

        // try to load another page of free blocks
        if(this.freeBlocksCache.length===0 && this.container.freeNodePointer!=0) {
            console.log("loading more free nodes");
            var that = this;
            this.init(function(){
                that.container._writeSuperBlock(function(){
                    callback(toReturn);
                });
            });
        } else {
            callback(toReturn);
        }
    }
};

AsyncDiskManager.FreeBlocksManager.prototype.release = function(node, callback) {
    var position = node.nodeKey;
    var remainingPadding = this.container.nodeSchema.encodedSize - 5;
    var blankNodeBuffer = Put().word8(0).word32le(this.container.freeNodePointer).pad(remainingPadding).buffer();


    this.freeBlocksCache.push({nextPointer: this.container.freeNodePointer});
    this.container.freeNodePointer = position;
    var that = this;

    fs.write(that.container.wfd, blankNodeBuffer, 0, that.container.nodeSchema.encodedSize, position, function(err, written){
        if(written === that.container.nodeSchema.encodedSize) {
            that.container._writeSuperBlock(function(){
                callback();
            });
        } else {
            console.log("Error releasing free block");
            callback(false);
        }
    });
};

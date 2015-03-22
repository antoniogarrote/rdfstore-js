"use strict";

var utils = require('./../utils');
var _ = utils;
var nextTick = utils.nextTick;

var Tree = function(keyFun, f) {
    this.keyFun = keyFun;
    if(this.keyFun == null || typeof(keyFun) !== 'function')
        this.keyFun = function(x) { return x };

    this.data = {};
    if(f != null)
        return f(this);
};

/**
 * search
 *
 * Retrieves the node matching the given value.
 * If no node is found, null is returned.
 */
Tree.prototype.search = function(key, f, checkExists) {
    var that = this;
    nextTick(function(){
        var data = that.data[key];
        if(data != null) {
            if(checkExists != null && checkExists == true)
                f(true);
            else
                f(data);
        } else {
            f(null);
        }
    });
};

Tree.prototype.walk = function(f,e) {
    var that = this;
    var keys = _.chain(this.data).keys().sortBy(this.keyFun).value();

    _.forEach(keys,function(key){
        var node = {'key':key,'data':that.data[key]};
        f(node);
        that.data[key] = node['data']
    });

    if(e != null)
        nextTick(function(){ e(); });
};


Tree.prototype.insert = function(key,data,callback) {
    this.data[key] = data;
    nextTick(function(){
        callback({'key':key,'data':data});
    });
};

Tree.prototype.delete = function(key,callback) {
    delete this.data[key];
    nextTick(function(){
        callback();
    });
};


module.exports = {
    'Tree': Tree
};

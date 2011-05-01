// exports
exports.Lexicon = {};
var Lexicon = exports.Lexicon;

// imports
var QuadIndexCommon = require("./quad_index_common").QuadIndexCommon

/**
 * Temporal implementation of the lexicon
 */


Lexicon.Lexicon = function(callback){

    this.uriToOID = {};
    this.OIDToUri = {};

    this.literalToOID = {};
    this.OIDToLiteral = {};

    this.uriCounter = 0;
    this.literalCounter = 0;
    
    if(callback != null) {
        callback(this);
    }
};

Lexicon.Lexicon.prototype.registerUri = function(uri, callback) {
    if(this.uriToOID[uri] == null){
        var oid = 'u'+this.uriCounter;
        this.uriCounter++;

        this.uriToOID[uri] = oid;
        this.OIDToUri[oid] = uri;

        callback(oid);
    } else {
        callback(this.uriToOID[uri]);
    }
};

Lexicon.Lexicon.prototype.registerLiteral = function(literal, callback) {
    if(this.literalToOID[literal] == null){
        var oid = 'l'+this.literalCounter;
        this.literalCounter++;

        this.literalToOID[literal] = oid;
        this.OIDToLiteral[oid] = literal;
        callback(oid);
    } else {
        callback(this.literalToOID[literal]);
    }
};

Lexicon.Lexicon.prototype.retrieve = function(oid,callback) {
    if(oid[0]==='l') {
        callback(this.OIDToLiteral[oid]);
    } else if(oid[0]==='u') {
        callback(this.OIDToUri[oid]);
    } else {
        throw new Error("Unknown OID:"+oid);
    }
};



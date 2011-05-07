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

    this.blankToOID = {};
    this.OIDToBlank = {};

    this.oidCounter = 0;
    
    if(callback != null) {
        callback(this);
    }
};

Lexicon.Lexicon.prototype.registerUri = function(uri, callback) {
    if(this.uriToOID[uri] == null){
        var oid = this.oidCounter
        var oidStr = 'u'+oid;
        this.oidCounter++;

        this.uriToOID[uri] = oid;
        this.OIDToUri[oidStr] = uri;

        callback(oid);
    } else {
        callback(this.uriToOID[uri]);
    }
};

Lexicon.Lexicon.prototype.registerBlank = function(label, callback) {
    var oid = this.oidCounter;
    this.oidCounter++;
    var oidStr = ""+oid;
    this.OIDToBlank[oidStr] = true;
    callback(oidStr);
};

Lexicon.Lexicon.prototype.registerLiteral = function(literal, callback) {
    if(this.literalToOID[literal] == null){
        var oid = this.oidCounter;
        var oidStr =  'l'+ oid;
        this.oidCounter++;

        this.literalToOID[literal] = oid;
        this.OIDToLiteral[oidStr] = literal;

        callback(oid);
    } else {
        callback(this.literalToOID[literal]);
    }
};

Lexicon.Lexicon.prototype.parseLiteral = function(literalString) {
    var parts = literalString.lastIndexOf("@");
    if(parts!=-1 && literalString[parts-1]==='"' && literalString.length - parts === 3) {
        var value = literalString.substring(1,parts-1);
        var lang = literalString.substring(parts+1, literalString.length);
        return {token: "literal", value:value, lang:lang};
    }

    var parts = literalString.lastIndexOf("^^");
    if(parts!=-1 && literalString[parts-1]==='"' && literalString[parts+2] === '<' && literalString[literalString.length-1] === '>') {
        var value = literalString.substring(1,parts-1);
        var type = literalString.substring(parts+3, literalString.length-1);
        return {token: "literal", value:value, type:type};
    }

    var value = literalString.substring(1,literalString.length-1);
    return {token:"literal", value:value};
};

Lexicon.Lexicon.prototype.parseUri = function(uriString) {
    return {token: "uri", value:uriString};
};

Lexicon.Lexicon.prototype.retrieve = function(oid,callback) {
    try {
        var maybeUri = this.OIDToUri['u'+oid];
        if(maybeUri) {
            callback(this.parseUri(maybeUri));
        } else {
            var maybeLiteral = this.OIDToLiteral['l'+oid];
            if(maybeLiteral) {
                callback(this.parseLiteral(maybeLiteral));
            } else {
                var maybeBlank = this.OIDToBlank[""+oid];
                if(maybeBlank) {
                    callback({token:"blank", value:"_:"+oid});
                } else {
                    throw("Null value for OID");
                }
            }
        }
    } catch(e) {
        throw new Error("Unknown OID:"+oid);

    }
};



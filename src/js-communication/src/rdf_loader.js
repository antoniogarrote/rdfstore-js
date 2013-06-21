// exports
exports.RDFLoader = {};
var RDFLoader = exports.RDFLoader;

// imports
var NetworkTransport = require("./tcp_transport").NetworkTransport;
var N3Parser = require("./rvn3_parser").RVN3Parser;
var JSONLDParser = require("./jsonld_parser").JSONLDParser;
var Utils = require("../../js-trees/src/utils").Utils;

RDFLoader.RDFLoader = function (params) {
    this.precedences = ["text/turtle", "text/n3", "application/ld+json", "application/json"];
    this.parsers = {"text/turtle":N3Parser.parser, "text/n3":N3Parser.parser, "application/ld+json":JSONLDParser.parser, "application/json":JSONLDParser.parser};
    if (params != null) {
        for (var mime in params["parsers"]) {
            this.parsers[mime] = params["parsers"][mime];
        }
    }

    if (params && params["precedences"] != null) {
        this.precedences = params["precedences"];
        for (var mime in params["parsers"]) {
            if (!Utils.include(this.precedences, mime)) {
                this.precedences.push(mime);
            }
        }
    }

    this.acceptHeaderValue = "";
    for (var i = 0; i < this.precedences.length; i++) {
        if (i != 0) {
            this.acceptHeaderValue = this.acceptHeaderValue + "," + this.precedences[i];
        } else {
            this.acceptHeaderValue = this.acceptHeaderValue + this.precedences[i];
        }
    }
};

RDFLoader.RDFLoader.prototype.registerParser = function(mediaType, parser) {
    this.parsers[mediaType] = parser;
    this.precedences.push(mediaType);
};

RDFLoader.RDFLoader.prototype.unregisterParser = function(mediaType) {
    delete this.parsers[mediaType];
    var mediaTypes = [];
    for(var i=0; i<this.precedences.length; i++) {
        if(this.precedences[i] != mediaType) {
            mediaTypes.push(this.precedences[i]);
        }
    }

    this.precedences = mediaTypes;
};

RDFLoader.RDFLoader.prototype.setAcceptHeaderPrecedence = function(mediaTypes) {
    this.precedences = mediaTypes;
};

RDFLoader.RDFLoader.prototype.load = function(uri, graph, callback) {
    var that = this;
    NetworkTransport.load(uri, this.acceptHeaderValue, function(success, results){
        if(success == true) {
            var mime = results["headers"]["Content-Type"] || results["headers"]["content-type"];
            var data = results['data'];
            if(mime != null) {
                mime = mime.split(";")[0];
                for(var m in that.parsers) {
                    if(m.indexOf("/")!=-1) {
                        var mimeParts = m.split("/");
                        if(mimeParts[1] === '*') {
                            if(mime.indexOf(mimeParts[0])!=-1) {
                                return that.tryToParse(that.parsers[m], graph, data, callback);
                            }
                        } else {
                            if(mime.indexOf(m)!=-1) {
                                return that.tryToParse(that.parsers[m], graph, data, callback);
                            } else if(mime.indexOf(mimeParts[1])!=-1) {
                                return that.tryToParse(that.parsers[m], graph, data, callback);
                            }
                        }
                    } else {
                        if(mime.indexOf(m)!=-1) {
                            return that.tryToParse(that.parsers[m], uri, graph, callback);
                        }
                    }
                }
                callback(false, "Unknown media type : "+mime);
            } else {
                console.log("Unknown media type");
                console.log(results["headers"]);
                callback(false, "Uknown media type");
            }
        } else {
            callback(false, "Network error: "+results);
        }});
};

RDFLoader.RDFLoader.prototype.loadFromFile = function(parser, graph, uri, callback) {
    try {
        var that = this;
        var fs = require('fs');
        fs.readFile(uri.split("file:/")[1], function(err, data) {
            if(err) throw err;
            var data = data.toString('utf8');
            that.tryToParse(parser, graph, data, callback);
        });
    } catch(e) {
        callback(false, e);
    }
};

RDFLoader.RDFLoader.prototype.tryToParse = function(parser, graph, input, callback) {
    try {
        if(typeof(input) === 'string') {
            input = Utils.normalizeUnicodeLiterals(input);
        }
        if(parser.async) {
            parser.parse(input, graph, callback);
        } else {
            var parsed = parser.parse(input, graph);

            if(parsed != null) {
                callback(true, parsed);
            } else {
                callback(false, "parsing error");
            }
        }
    } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        callback(false, "parsing error with mime type : " + e);
    }
};



// var loader = require("./js-communication/src/rdf_loader").RDFLoader; loader = new loader.RDFLoader(); loader.load('http://dbpedialite.org/titles/Lisp_%28programming_language%29', function(success, results){console.log("hey"); console.log(success); console.log(results)})

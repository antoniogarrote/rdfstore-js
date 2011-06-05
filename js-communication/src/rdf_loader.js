// exports
exports.RDFLoader = {};
var RDFLoader = exports.RDFLoader;

// imports
var NetworkTransport = require("./tcp_transport").NetworkTransport;
var TurtleParser = require("./turtle_parser").TurtleParser;
var Utils = require("../../js-trees/src/utils").Utils;

RDFLoader.RDFLoader = function(params) {
    this.precedences = ["text/turtle", "text/n3"];
    this.parsers = {"text/turtle": TurtleParser.parser, "text/n3":TurtleParser.parser};
    if(params != null) {
      for(var mime in params["parsers"]) {
          this.parsers[mime] = params["parsers"][mime];
      }
    }

    if(params && params["precedences"] != null) {
        this.precedences = params["precedences"];
        for(var mime in params["parsers"]) {
            if(!Utils.include(this.precedences, mime)) {
                this.precedences.push(mime);
            }
        }
    }

    this.acceptHeaderValue = "";
    for(var i=0; i<this.precedences.length; i++) {
        if(i!=0) {
            this.acceptHeaderValue = this.acceptHeaderValue + "," + this.precedences[i];
        } else {
            this.acceptHeaderValue = this.acceptHeaderValue + this.precedences[i];
        }
    }
}

RDFLoader.RDFLoader.prototype.load = function(uri, graph, callback) {
    var that = this;
    NetworkTransport.load(uri, this.acceptHeaderValue, function(success, results){
        if(success == true) {
            var mime = results["headers"]["Content-Type"] || results["headers"]["content-type"];
            var data = results['data'];
            if(mime != null) {
                mime.split(";")[0]
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

RDFLoader.RDFLoader.prototype.tryToParse = function(parser, graph, input, callback) {
    try {
        var parsed = parser.parse(input, graph);
        if(parsed != null) {
            callback(true, parsed);
        } else {
            callback(false, "parsing error with mime type : "+e);
        }
    } catch(e) {
        callback(false, "parsing error with mime type : " + e);
    }
};



// var loader = require("./js-communication/src/rdf_loader").RDFLoader; loader = new loader.RDFLoader(); loader.load('http://dbpedialite.org/titles/Lisp_%28programming_language%29', function(success, results){console.log("hey"); console.log(success); console.log(results)})

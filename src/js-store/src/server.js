// exports
exports.Server = {};

/**
 * @namespace
 * 
 * The Server module handles networking for the HTTP services offered by the store.
 * These services are defined in different modules and loaded here on demand.
 */
var Server = exports.Server;

var https = require('https'); 
var http = require('http'); 
var fs = require('fs'); 
var url = require('url');
var querystring = require("querystring");

// development or production?
var Store;
try {
    Store = require('./store').Store;
}catch(e) {
    Store = require('./index'); 
}

/**
 * Configuration options for the store's server and default values
 */
Server.defaultOptions = {
    "port": {desc:"server port", def: "8080", validate: function(arg){ return(arg.match(/^[0-9]+$/) != null) } },
    "protocol": {desc:"protocol to use http | https", def: "http", validate: function(arg){return arg==='https' || arg==='http'} },
    "path": {desc:"Path where the SPARQL endpoint will be accessible", def:"/sparql", validate: function(arg){ return true} },
    "ssl-key": {desc:"Path to the SSL private key file", def:"./ssl/privatekye.pem", validate: function(arg){ return true} },
    "ssl-cert": {desc:"Path to the SSL certfiviate file", def:"./ssl/certificate.pem", validate: function(arg){ return true} },
    "cors-enabled": {desc:"Should the server accept CORS requests", def:"true", validate: function(arg){ return arg==='true' || arg==='false'} },
    "store-engine": {desc:"What backend should the store use: 'memory' and 'mongodb' are possible values", def:'memory', validate: function(arg){ return arg==='memory' || arg==='mongodb'} },
    "store-tree-order": {desc:"BTree index tree order used in the in memory backend", def:'15', validate:function(arg){ return(arg.match(/^[0-9]+$/) != null) } },
    "store-name": {desc:"Name to be used to store the quad data in the persistent backend", def:'rdfstore_js', validate:function(arg){ return arg.match(/-\./) == null }},
    "store-overwrite": {desc:"If set to 'true' previous data in the persistent storage will be removed at startup", def:'false', validate:function(arg){ return arg==='true' || arg==='false' }},
    "store-mongo-domain": {desc:"If store-engine is set to 'mongodb', location of the MongoDB server", def:'localhost', validate:function(arg){ return true} },
    "store-mongo-port": {desc:"If store-engine is set to 'mongodb', port where the MongoDB server is running", def:'27017', validate:function(arg){ return(arg.match(/^[0-9]+$/) != null) } },
    "media-type": {desc:"When loading a local RDF file or loading from input stream, media type of the data to load", def:"application/rdf+xml", validate:function(arg){ return true} }
};

/**
 * Command line switches for the store's server configuration options
 */
Server.optionSwitches = {
    "-p": "port",
    "--webserver-port": "port",
    "-prot": "protocol",
    "--webserver-protocol": "protocol",
    "--webserver-path": "path",
    "--webserver-ssl-key": "ssl-key",
    "--webserver-ssl-cert": "ssl-cert",
    "-cors": "cors-enabled",
    "--webserver-cors-enabled": "cors-enabled",
    "--store-tree-order": "store-tree-order",
    "--store-engine": "store-engine",
    "--store-name": "store-name",
    "--store-overwrite": "store-overwrite",
    "--store-mongo-domain": "store-mongo-domain",
    "--store-mongo-port": "store-mongo-port",
    "-mime": "media-type",
    "--media-type": "media-type"
};


/**
 * Parses the command passed to the server
 */
Server.parseCommand = function() {
    var command = process.argv[2];
    if(command === 'webserver') {
        return 'webserver';
    } else if(command === 'load') {
        return 'load';
    } else if(command === 'clear') {
        return 'clear';
    } else {
        if(command != null) 
            console.log("Error: Unrecognized command "+command);
        Server.printUsage();
        process.exit(1);
    }
};

/**
 * Merge command line configuration with the default server options
 */
Server.parseOptions = function() {
    var options = {};
    var lastSwitch = null;
    var currentOption = null;
    var currentValidator = null;

    for(var i=3; i<process.argv.length; i++) {
        var arg = process.argv[i];
        if(currentOption != null) {
            if(currentValidator == null || currentValidator(arg)) {
                options[currentOption] = arg;
                currentOption = null;
                currentValidator = null;
                lastSwitch = null;
            } else {
                console.log("Error: Invalid value "+arg+" for options "+lastSwitch+" ["+currentOption+"]");
                Server.printUsage();
                process.exit(1);
            }
        } else if(arg.indexOf("-") == 0) {
            if(Server.optionSwitches[arg] != null) {
                currentOption = Server.optionSwitches[arg];
                currentValidator = Server.defaultOptions[currentOption].validate;
                lastSwitch = arg;
            } else {
                console.log("Error: Unregognized option "+arg);
                Server.printUsage();
                process.exit(1);
            }
        }
    }
    
    for(var p in Server.defaultOptions) {
        if(options[p] == null) {
            options[p] = Server.defaultOptions[p].def;
        }
    }

    return options;
};


/**
 * Prints the 'usage' message of the server
 */
Server.printUsage = function() {
    console.log("\nUsage: rdfstorejs Command [Args] [Options]");
    console.log("\nCommands:");
    console.log("   * webserver: starts the HTTP frontend for the store");
    console.log("   * load URI|stdin [dstGraphURI]: load the graph pointed by the URI argument into the store. The graph will be loaded in the 'dstGraphURI' graph or the default graph if none specified");
    console.log("   * clear: removes all data from the store");
    console.log("\nOptions:");
    for(var p in Server.optionSwitches) {
        var option = Server.defaultOptions[Server.optionSwitches[p]];
        console.log("   "+p+": "+option.desc+" ["+option.def+"]");
    }
};


/**
 * RDFStore-JS instance used by this server
 */
Server.store = null;


/**
 * Creates the connection to the RDF store according to the configuration
 * passed as parameters to the server.
 * </br>
 * The store instance created can be accessed at the property
 * <code>Server.store</code>
 */
Server.startStore = function(options, callback) {
    var storeOptions = {};

    if(options['store-engine'] == 'memory') {
        storeOptions['persistent'] = false;
        storeOptions['treeOrder'] == parseInt(options['store-tree-order']);
    } else {
        storeOptions['persistent'] = true;
        storeOptions['engine'] = 'mongodb';

        if(options['store-overwrite'] == 'true') {
            storeOptions['overwrite'] = true;
        } else {
            storeOptions['overwrite'] = false;
        }

        storeOptions['name'] = options['store-name'];
        if(options['store-mongo-domain']) {
            storeOptions['mongoDomain'] = options['store-mongo-domain'];
        }
        if(options['store-mongo-port']) {
            storeOptions['mongoPort'] = parseInt(options['store-mongo-port']);
        }
    }

    new Store.Store(storeOptions,function(store) {
        if(store!=null) {
            Server.store = store;
            callback();
        } else {
            console.log("(!!) Error creating RDFStore");
            process.exit(2);
        }
    });
};

/**
 * Starts the server, parsing the options and handling requests
 * using the right handler function.
 */
Server.start = function() {
    var options = Server.parseOptions();
    var command = Server.parseCommand();
    
    if(process.argv.length<3) {
        Server.printUsage();
        process.exit(0);
    } else {
        if(command === 'webserver') {
            Server.startStore(options,function(){
                if(options['protocol']==='http') {
                    http.createServer(Server.routeRequest(options)).listen(parseInt(options['port']))
                } else if(options['protocol']==='https') {
                    var httpsOptions = {
                        key: fs.readFileSync(options['ssl-key']),
                        cert: fs.readFileSync(options['ssl-cert']),
                        requestCert: false
                    };
                    https.createServer(httpsOptions,Server.routeRequest(options)).listen(parseInt(options['port']))
                }
            });
        } else if(command === 'clear') {
            options['store-overwrite'] = 'true';
            console.log(options);
            Server.startStore(options,function(){
                process.exit(0);
            });
        } else if(command === 'load') {
            Server.startStore(options,function(){
                var toLoad = process.argv[3];
                var dstGraph = process.argv[4];
                if(dstGraph != null && dstGraph[0]==='-')
                    dstGraph = null;

                if(toLoad === 'stdin') {
                    var mediaType = options['media-type'];
                    if(mediaType != null) {
                        var data = "";
                        process.stdin.resume();
                        process.stdin.setEncoding('utf8');
                        process.stdin.on('data', function (chunk) {
                            data = data + chunk;
                        });

                        process.stdin.on('end', function () {
                            if(dstGraph != null) {
                                Server.store.load(mediaType, data, dstGraph, function(){
                                    process.exit(0);
                                });
                            } else {
                                Server.store.load(mediaType, data, function(){
                                    process.exit(0);
                                });
                            }
                        });                    
                    } else {
                        console.log("Error: Media type used to encode incoming data must be specified using the --media-type flag when loading data from disk or stdin");
                        process.exit(3);
                    }
                } else {
                    if(toLoad.indexOf("file:/")==0) {
                        var mediaType = options['media-type'];
                        if(mediaType != null) {
                            if(dstGraph != null) {
                                Server.store.load(mediaType, toLoad, dstGraph, function(){
                                    process.exit(0);
                                });
                            } else {
                                Server.store.load(mediaType, toLoad, function(){
                                    process.exit(0);
                                });
                            }
                        } else {
                            console.log("Error: Media type used to encode incoming data must be specified using the --media-type flag when loading data from disk or stdin");
                            process.exit(3);
                        }
                    } else {
                            if(dstGraph != null) {
                                Server.store.load('remote', toLoad, dstGraph, function(){
                                    process.exit(0);
                                });
                            } else {
                                Server.store.load('remote', toLoad, function(){
                                    process.exit(0);
                                });
                            }
                    }
                }
            });
        }
    }
};

/**
 * Add HTTP beaders required for CORS requests
 */
Server.withCORSHeader = function(status, headers) {
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control";
    this.writeHead(status, headers);
};

/**
 * Parses the 'Accept' HTTP header and returns an array of media types
 */
Server.mediaTypes = function(request) {
    var mediaTypes = request.headers['Accept'] || request.headers['accept'] || "application/rdf+xml";
    mediaTypes = mediaTypes.split(";")[0];
    mediaTypes = mediaTypes.split(',');

    if(mediaTypes.length == 0) {
        mediaTypes[0] = defaultMediaType;
    }

    return mediaTypes;
};

/**
 * Escapes XML chars
 */
Server.xmlEncode = function (data) {
    return data.replace(/\&/g, '&' + 'amp;').replace(/</g, '&' + 'lt;')
        .replace(/>/g, '&' + 'gt;').replace(/\'/g, '&' + 'apos;').replace(/\"/g, '&' + 'quot;');
};

/**
 * Adds a coercion annotation to a json-ld object
 *
 * @arguments
 * @param obj jsonld Object where the coerced property will be added
 * @param prpoerty URI of the property to be coerced
 * @param type coercion type
 */
Server.jsonldCoerce = function(obj, property, type) {
    if(obj['@context'] == null) {
        obj['@context'] = {};
    }
    if(obj['@context']['@coerce'] == null) {
        obj['@context']['@coerce'] = {};
        obj['@context']['@coerce'][type] = property;
    } else if(typeof(obj['@context']['@coerce'][type]) === 'string' &&
              obj['@context']['@coerce'][type] != property) {
        var oldValue = obj['@context']['@coerce'][type];
        obj['@context']['@coerce'][type] = [oldValue, property];
    } else if(typeof(obj['@context']['@coerce'][type]) === 'object') {
        for(var i=0; i<obj['@context']['@coerce'][type].length; i++) {
            if(obj['@context']['@coerce'][type][i] === property)  {
                return obj;
            }
        }

        obj['@context']['@coerce'][type].push(property);
    } else {
        obj['@context']['@coerce'][type] = property;
    }

    return obj;
};

/**
 * Transforms a RDF JS Interfaces API Graph object into a JSON-LD serialization
 *
 * @arguments
 * @param graph JS RDF Interface graph object to be serialized
 * @param rdf JS RDF Interface RDF environment object
 */
Server.graphToJSONLD = function(graph, rdf) {
    var nodes = {};
    
    graph.forEach(function(triple) {
        var subject = triple.subject.valueOf();
        var node = nodes[subject];
        if(node == null) {
            node = {"@subject" : subject, "@context": {}};
            nodes[subject] = node;
        }

        var predicate = triple.predicate.valueOf();
        if(predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
            predicate = "@type";
        }

        var property  = null;
        var isCURIE = false;
        property = rdf.prefixes.shrink(predicate);

        if(property != predicate) {
            isCURIE = true;
        }
        if(property.indexOf("#") != -1) {
            property = property.split("#")[1];
        } else {
            property = property.split("/");
            property = property[property.length-1];
        }

        var object = triple.object.valueOf();

        if(node[property] != null) {
            if(!isCURIE) {
                if(node["@context"][property] != null || property[0] === '@') {
                    if(typeof(node[property]) === "object") {
                        node[property].push(object);
                    } else {
                        object = [ node[property], object];
                        node[property] = object;
                    }
                } else {
                    property = triple.predicate.valueOf();
                    if(node[property] == null) {
                        node[property] = object;
                    } else {
                        if(typeof(node[property]) === "object") {
                            node[property].push(object);
                        } else {
                            object = [ node[property], object ];
                            node[property] = object;
                        }
                    }

                    if(typeof(object) === 'string' &&
                       (object.indexOf("http://") == 0 || object.indexOf("https://") == 0)) {
                        Server.jsonldCoerce(node, property, "@iri");
                    }
                }
            } else {
                var prefix = property.split(":")[0];
                if(typeof(node[property]) === "object") {
                    node[property].push(object);
                } else {
                    object = [ node[property], object];
                    node[property] = object;
                }
            }
        } else {
            node[property] = object;
            if(property[0] != '@') {
                if(isCURIE == true) {
                    // saving prefix
                    var prefix = property.split(":")[0];
                    node["@context"][prefix] = rdf.prefixes[prefix];
                } else {
                    // saving whole URI in context
                    node["@context"][property] = triple.predicate.valueOf();
                }

                if(typeof(object) === 'string' &&
                   (object.indexOf("http://") == 0 || object.indexOf("https://") == 0)) {
                    Server.jsonldCoerce(node, property, "@iri");
                }
                
            }
        }
    });

    var results = [];
    for(var p in nodes) {
        results.push(nodes[p]);
    }

    return results;
};

/**
 * Returns a function that route HTTP requests according to the configuration
 * options passed as arguments
 *
 * @arguments
 * @param {Object} options map of configuration options with parameters passed to the server.
 */
Server.routeRequest = function(options) {
    var CORSEnabled = options['cors-enabled'] === 'true';
    
    // Routes -> handlers mapping
    var routes = {};
    routes[options['path']] = "SPARQLProtocolHandler";
    
    // routing logic
    return function(req,res) {
        try {
            if(CORSEnabled)
                res.withCORSHeader = Server.withCORSHeader;

            var data = "";
            req.on('data', function(chunk){
                data = data + chunk;
            });

            req.on('end', function(){
                req.data = data;

                var handler = null;

                for(var path in routes) {
                    var handlerString = routes[path];
                    var requestPath = url.parse(req.url,true,true)['pathname'];
                    req.requestPath = requestPath;

                    if(requestPath && requestPath[requestPath.length-1] == '/') {
                        requestPath = requestPath.substring(0,requestPath.length-1);
                    }

                    if(requestPath === path ) {
                        handler = handlerString;
                        break;
                    }
                }

                if(handler != null) {
                    Server[handler](req, res, data);
                } else {
                    res.writeHead(404, {"Content-Type":"text/plain"});
                    res.end();
                }
            });

        } catch(e) {
            console.log("(!!) Error: "+e.message);
            console.log(e.stack);
            res.withCORSHeader(500,{"Content-Type":"text/plain"});
            res.end();
        }
    };
};

/**
 * Handler function that executes a SPARQL query and build a response according
 * to the SPARQL HTTP Protocol
 *
 * @arguments
 * @param req Node.JS request object
 * @param res Node.JS response object
 * @param data textual data send the in the HTTP request
 */
Server.SPARQLProtocolHandler = function(req, res, data) {
    var params;
    var accepts = Server.mediaTypes(req);

    if(req.method === 'GET') {
        params = url.parse(req.url,true,true)['query'];
    } else if(req.method === 'POST') {
        var mediaType = req.headers['content-type'] || req.headers['Content-Type'];
        if(mediaType == 'application/xml') {
            // not supported
            
        } else {
            // media type must be application/x-www-form-urlencoded
            params = querystring.parse(data);
        }
    }
    var query = params['query'];
    var defaultGraphUris = params['default-graph-uri'] || [];
    var namedGraphUris = params['named-graph-uri'] || [];
    if(typeof(namedGraphUris) === 'string')
        namedGraphUris = [namedGraphUris];
    if(typeof(defaultGraphUris) === 'string')
        defaultGraphUris = [defaultGraphUris];

    try {
        // Run the query
        Server.store.execute(query, defaultGraphUris, namedGraphUris, function(success, results) {
            try {
                // Check if this is a RDF JS Interfaces graph or a collection of bindings
                if(success) {
                    if(results.constructor == Array) {
                        // bindings
                        Server.buildResponseBindings(accepts, results, res);
                    } else if(results.constructor == Boolean) {
                        // ask
                        Server.buildResponseBoolean(accepts, results, res);
                    } else {
                        // construct
                        Server.buildResponseGraph(accepts, results, res);
                    }
                } else {
                    if(res.withCORSHeader != null) {
                        res.withCORSHeader(200, {"Content-Type":"application/rdf+xml"});
                    } else {
                        res.writeHead(200,{"Content-Type":"application/rdf+xml"});
                    }
                    res.end(new Buffer("Query malformed"), 'utf-8');
                }
            } catch(e) {
                console.log("(!!) Error: "+e.message);
                console.log(e.stack);
                if(res.withCORSHeader != null) {
                    res.withCORSHeader(500, {"Content-Type":"text/plain"});
                } else {
                    res.writeHead(500,{"Content-Type":"text/plain"});
                }
                res.end(new Buffer("Query refused"), 'utf-8');
            }
        });
    } catch(e) {
        console.log("(!!) Error: "+e.message);
        console.log(e.stack);

        if(res.withCORSHeader != null) {
            res.withCORSHeader(500, {"Content-Type":"text/plain"});
        } else {
            res.writeHead(500,{"Content-Type":"text/plain"});
        }
        res.end(new Buffer("Query refused"), 'utf-8');
    }
};

/**
 * Builds an SPARQL HTTP protocol response for a collection of bindings
 * returned by the RDF store
 */
Server.buildResponseBindings = function(mediaTypes, bindings, res) {
    var accepts;

    for(var i=0; i<mediaTypes.length; i++) {
        if(mediaTypes[i] === 'application/json') {
            accepts = mediaTypes[i];
            break;
        }
    } 
    if(accepts == null) {
        // by default xml
        accepts = 'application/rdf+xml';
    };

    if(accepts === 'application/json') {
        var varNames = {};
        var genBindings = [];
        for(var i=0; i<bindings.length; i++) {
            var result = bindings[i];
            for(var p in bindings[i]) {
                varNames[p] = true;
            }
        }
        var head = {'variables':[]};
        for(var p in varNames) {
            head['variables'].push({'name':p});
        }

        if(res.withCORSHeader != null) {
            res.withCORSHeader(200, {"Content-Type":"application/json"});
        } else {
            res.writeHead(200,{"Content-Type":"application/json"});
        }
        res.end(new Buffer(JSON.stringify({'head':head,'results':bindings})), 'utf-8');
    } else {
        var response = '<?xml version="1.0" encoding="UTF-8"?><sparql xmlns="http://www.w3.org/2005/sparql-results#">';
        var results = '<results>';

        var varNames = {};
        for(var i=0; i<bindings.length; i++) {               
            var nextResult = '<result>';

            var result = bindings[i];
            
            for(var p in result) {
                varNames[p] = true;
                nextResult = nextResult+'<binding name="'+Server.xmlEncode(p)+'">';
                if(result[p].token === 'uri') {
                    nextResult = nextResult+"<uri>"+result[p].value+"</uri>";
                } else if(result[p].token === 'literal') {
                    nextResult = nextResult+"<literal ";
                    if(result[p].lang != null ) {
                        nextResult = nextResult + ' xml:lang="'+result[p].lang+'" ';
                    }
                    if(result[p].type != null ) {
                        nextResult = nextResult + ' datatype="'+result[p].type+'" ';
                    }
                    nextResult = nextResult+">"+Server.xmlEncode(result[p].value)+"</literal>";
                } else {
                    nextResult = nextResult+"<bnode>"+result[p].value+"</bnode>";
                }
                nextResult = nextResult+'</binding>';
            }

            nextResult = nextResult+'</result>';
            results = results+nextResult;
        }
        results = results + '</results>';

        var head = '<head>';
        for(var varName in varNames) {
            head = head + '<variable name="'+Server.xmlEncode(varName)+'"/>';
        }
        head = head + '</head>';
        
        response = response + head + results + '</sparql>';

        if(res.withCORSHeader != null) {
            res.withCORSHeader(200, {"Content-Type":"application/sparql-results+xml"});
        } else {
            res.writeHead(200,{"Content-Type":"application/sparql-results+xml"});
        }
        res.end(new Buffer(response), 'utf-8');
    }

};

/**
 * Builds an SPARQL HTTP protocol response for a boolean value
 * returned by the RDF store
 */
Server.buildResponseBoolean = function(mediaTypes, boolValue, res) {
    var accepts;

    for(var i=0; i<mediaTypes.length; i++) {
        if(mediaTypes[i] === 'application/json') {
            accepts = mediaTypes[i];
            break;
        }
    } 
    if(accepts == null) {
        // by default xml
        accepts = 'application/rdf+xml';
    };

    if(accepts === 'application/json') {
        if(res.withCORSHeader != null) {
            res.withCORSHeader(200, {"Content-Type":"application/json"});
        } else {
            res.writeHead(200,{"Content-Type":"application/json"});
        }
        res.end(new Buffer(JSON.stringify({'head':{},'boolean':boolValue})), 'utf-8');
    } else {
        var response = '<?xml version="1.0" encoding="UTF-8"?><sparql xmlns="http://www.w3.org/2005/sparql-results#"><head></head><boolean>'+boolValue+'</boolean></sparql>';
        if(res.withCORSHeader != null) {
            res.withCORSHeader(200, {"Content-Type":"application/sparql-results+xml"});
        } else {
            res.writeHead(200,{"Content-Type":"application/sparql-results+xml"});
        }
        res.end(new Buffer(response), 'utf-8');
    }
};

/**
 * Builds an SPARQL HTTP protocol response for RDF JS interface graph
 * returned by the RDF store
 */
Server.buildResponseGraph = function(mediaTypes, graph, res) {
    var accepts;

    for(var i=0; i<mediaTypes.length; i++) {
        if(mediaTypes[i] === 'application/json') {
            accepts = mediaTypes[i];
            break;
        } else if(mediaTypes[i] === 'text/turtle' || mediaTypes[i] === 'text/ttl' || mediaTypes[i] === 'text/n3' || mediaTypes[i] === 'text/plain') {
            accepts = mediaTypes[i];
            break;
        }
    } 
    if(accepts == null) {
        // by default xml
        accepts = 'application/rdf+xml';
    };

    if(accepts === 'application/json') {
        var jsonld = Server.graphToJSONLD(graph,Server.store.rdf);
        if(res.withCORSHeader != null) {
            res.withCORSHeader(200, {"Content-Type":"application/json"});
        } else {
            res.writeHead(200,{"Content-Type":"application/json"});
        }
        res.end(new Buffer(JSON.stringify(jsonld)), 'utf-8');
    } else if(accepts === 'text/turtle' || accepts === 'text/ttl' || accepts === 'text/n3' || accepts === 'text/plain') {
        var text = graph.toNT();
        if(res.withCORSHeader != null) {
            res.withCORSHeader(200, {"Content-Type":accepts});
        } else {
            res.writeHead(200,{"Content-Type":accepts});
        }
        res.end(new Buffer(text), 'utf-8');
    } else {
        var ns = {};
        var nsCounter = 0;
        var triples = graph.toArray();
        var triple, predicate, parts, prefix, suffix;
        var subject, xmlPredicate, tripleXML;

        var acum  = "";

        for(var i=0; i<triples.length; i++) {
            triple = triples[i];

            if(triple.subject.interfaceName === 'BlankNode') {
                tripleXML = '<rdf:Description rdf:nodeID="blank'+triple.subject.bnodeId;
                tripleXML = tripleXML+'">';
            } else {
                tripleXML = '<rdf:Description rdf:about="'+triple.subject.valueOf();
                tripleXML = tripleXML+'">';
            }

            predicate = triple.predicate.valueOf();
            if(predicate.indexOf("#") != -1) {
                parts = predicate.split("#");
                prefix = parts[0]+"#";
                suffix = parts[1];
            } else {
                parts = predicate.split("/");
                suffix = parts.pop();
                prefix = parts.join("/")+"/";
            }
     
            if(ns[prefix] == null) {
                xmlPredicate = "ns"+nsCounter;
                nsCounter++;
                ns[prefix] = xmlPredicate;
            } else {
                xmlPredicate = ns[prefix];
            }
            xmlPredicate = xmlPredicate+":"+suffix;

            
            if(triple.object.interfaceName === "Literal") {
                if(triple.object.datatype != null && triple.object.language != null) {
                    tripleXML = tripleXML + '<'+xmlPredicate+'>'+Server.xmlEncode(triple.object.nominalValue)+'</'+xmlPredicate+'>';
                } else if(triple.object.datatype != null) {
                    tripleXML = tripleXML + '<'+xmlPredicate+' rdf:datatype="'+triple.object.datatype+'">'+Server.xmlEncode(triple.object.nominalValue)+'</'+xmlPredicate+'>';                    
                } else {
                    tripleXML = tripleXML + '<'+xmlPredicate+' xml:lang="'+triple.object.language+'">'+Server.xmlEncode(triple.object.nominalValue)+'</'+xmlPredicate+'>';                    
                }
            } else if(triple.object.interfaceName === 'NamedNode') {
                    tripleXML = tripleXML + '<'+xmlPredicate+' rdf:resource="'+triple.object.valueOf()+'"/>';
            } else if(triple.object.interfaceName === 'BlankNode') {
                    tripleXML = tripleXML + '<'+xmlPredicate+' rdf:nodeID="blank'+triple.object.bnodeId+'"/>';
            }

            tripleXML = tripleXML + "</rdf:Description>";
            acum = acum + tripleXML;
        }

        var xml = '<?xml version="1.0"  encoding="UTF-8"?>';
        xml = xml + '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"';
        for(var prefix in ns) {
            var prefixNs = ns[prefix];
            xml = xml + ' xmlns:'+prefixNs+'="'+prefix+'"';
        }
        xml = xml+'>'+acum+'</rdf:RDF>';

        if(res.withCORSHeader != null) {
            res.withCORSHeader(200, {"Content-Type":"application/rdf+xml"});
        } else {
            res.writeHead(200,{"Content-Type":"application/rdf+xml"});
        }
        res.end(new Buffer(xml), 'utf-8');
    }
};

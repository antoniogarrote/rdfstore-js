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
var Store = require('./store').Store;

/**
 * Configuration options for the store's server and default values
 */
Server.defaultOptions = {
    "port": {desc:"server port", def: "8080", validate: function(arg){ return(arg.match(/^[0-9]+$/) != null) } },
    "protocol": {desc:"protocol to use http | https", def: "http", validate: function(arg){return arg==='https' || arg==='http'} },
    "path": {desc:"Path where the SPARQL endpoint will be accessible", def:"/sparql", validate: function(arg){ return true} },
    "ssl-key": {desc:"Path to the SSL private key file", def:"./ssl/privatekye.pem", validate: function(arg){ return true} },
    "ssl-cert": {desc:"Path to the SSL certfiviate file", def:"./ssl/certificate.pem", validate: function(arg){ return true} },
    "cors-enabled": {desc:"Should the server accepts CORS requests", def:"true", validate: function(arg){ return arg==='true' || arg==='false'} },
    "store-engine": {desc:"What backend should the store use: 'memory' and 'mongodb' are possible values", def:'memory', validate: function(arg){ return arg==='memory' || arg==='mongodb'} },
    "store-tree-order": {desc:"BTree index tree order used in the in memory backend", def:'15', validate:function(arg){ return(arg.match(/^[0-9]+$/) != null) } },
    "store-name": {desc:"Name to be used to store the quad data in the persistent backend", def:'rdfstore_js', validate:function(arg){ return arg.match(/-\./) == null }},
    "store-overwrite": {desc:"If set to 'true' previous data in the persistent storage will be removed at startup", def:'false', validate:function(arg){ return arg==='true' || arg==='false' }},
    "store-mongo-domain": {desc:"If store-engine is set to 'mongodb', location of the MongoDB server", def:'localhost', validate:function(arg){ return true} },
    "store-mongo-port": {desc:"If store-engine is set to 'mongodb', port where the MongoDB server is running", def:'27017', validate:function(arg){ return(arg.match(/^[0-9]+$/) != null) } }
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
    "--store-mongo-port": "store-mongo-port"
};


/**
 * Parses the command passed to the server
 */
Server.parseCommand = function() {
    var command = process.argv[2];
    if(command === 'webserver') {
        return 'webserver';
    } else {
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
    console.log("\nUsage: rdfstorejs Command [Args...] [Options]");
    console.log("\nCommands:");
    console.log("   webserver: starts the HTTP frontend for the store");
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
Server.xmlEncode = function(data) {
    return data.replace(/\&/g,'&'+'amp;').replace(/</g,'&'+'lt;')
        .replace(/>/g,'&'+'gt;').replace(/\'/g,'&'+'apos;').replace(/\"/g,'&'+'quot;');
}

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
    var routes = {}
    routes[options['path']] = "SPARQLProtocolHandler"
    
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
                var components = null;

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
                    response.writeHead(404, {"Content-Type":"text/plain"});
                    response.end();
                }
            });

        } catch(e) {
            console.log("(!!) Error");
            console.log(e);
            res.withCORSHeader(500,{"Content-Type":"text/plain"});
            res.end();
        }
    };
};

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
            // Check if this is a RDF JS Interfaces graph or a collection of bindings
            if(success) {
                if(results.constructor == Array) {
                    // bindings
                    Server.buildResponseBindings(accepts, results, res);
                } else if(results.constructor == Boolean) {
                    // ask
                } else {
                    // construct
                }
            } else {
                if(res.withCORSHeader != null) {
                    res.withCORSHeader(200, {"Content-Type":"application/rdf+xml"});
                } else {
                    res.writeHead(200,{"Content-Type":"application/rdf+xml"});
                }
                res.end(new Buffer(response), 'utf-8');
            }
        });
    } catch(e) {
        console.log(e.message);
        console.log(e.stack);
    }
};

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
        var response = '<?xml version="1.0" encoding="UTF-8"?><sparql xmlns="http://www.w3.org/2005/sparql-results#">'
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
                    nextResult = nextResult+"<literal";
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
                nextResult + nextResult+'</binding>';
            }

            nextResult = nextResult+'</result>';
            results = results+nextResult;
        }
        results = results + '</results>';

        var head = '<head>'
        for(var varName in varNames) {
            head = head + '<variable name="'+Server.xmlEncode(varName)+'"/>';
        }
        head = head + '</head>';
        
        response = response + head + results + '</sparql>';

        if(res.withCORSHeader != null) {
            res.withCORSHeader(200, {"Content-Type":"application/rdf+xml"});
        } else {
            res.writeHead(200,{"Content-Type":"application/rdf+xml"});
        }
        res.end(new Buffer(response), 'utf-8');

    }

};


Server.start();

// exports
exports.NetworkTransport = {};
var NetworkTransport = exports.NetworkTransport;

// imports
var http = require("http");
var url = require("url");

NetworkTransport.load = function(uri, accept, callback, redirect) {
    var redirection = redirect==null ? 3 : redirect;
    var parts = url.parse(uri);
    var client = http.createClient((parts.port || 80), parts.hostname);

    var path = parts.pathname || "/";
    var search = parts.search || "";

    var request = client.request('GET',path+search, {'host':parts.hostname, 'Accept':accept});

    request.end();

    request.on('response', function(response){
        var headers = response.headers;
        var data = "";

        if((""+response.statusCode)[0] == '2') {
            response.on('end', function() {
                callback(true, {headers: headers, data: data});
            });
            response.on('data', function(chunk) {
                data = data + chunk;
            });
        } else if((""+response.statusCode)[0] == '3'){            
            if(redirection == 0) {
                callback(false, 500);
            } else {
                var location = (headers["Location"] || headers["location"])
                if(location != null) {
                    NetworkTransport.load(location, accept, callback, (redirection -1));
                } else {
                    callback(false, 500);
                }
            }
        } else {
            callback(false, response.statusCode);
        }
    });
}

// var NetworkTransport = require("./src/tcp_transport").NetworkTransport; NetworkTransport.load("http://google.es/", function(success, data) { console.log(success); console.log(data)})
// http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
//var NetworkTransport = require("./src/tcp_transport").NetworkTransport; NetworkTransport.load("http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html", function(success, data) { console.log(success); console.log(data)})

var path = require('path');
var parse = require('url').parse;
var mime = require('mime');
var zlib = require('zlib');
var http = require('http'); 
var fs = require('fs'); 

Utils = {};

/**
 * Strip `Content-*` headers from `res`.
 *
 * @param {ServerResponse} res
 * @api public
 */

var removeContentHeaders = function(res){
	Object.keys(res._headers).forEach(function(field){
		if (0 === field.indexOf('content')) {
			res.removeHeader(field);
		}
	});
};

/**
 * gzipped cache.
 */

var gzippoCache = {};

/**
 * gzip file.
 */

var gzippo = function(filename, charset, callback) {

	fs.readFile(filename, function (err, data) {
		if (err) throw err;
	    zlib.gzip(data, function(err, result) {
		callback(result);
	    });
	});


};

Utils.serveFileRaw = function(docroot, request, response, contentType) {
    var filePath = process.cwd()+'/'+docroot+request.url;
    if(filePath[filePath.length-1] === '/')
        filePath = filePath+"index.html";

    if(contentType == null) {
        var extname = path.extname(filePath);
        if(extname === '.js') {
            contentType = 'text/javascript';
        } else if(extname === '.css'){
            contentType = 'text/css'
        } else if(extname === '.html' || extname === '.htm') {
            contentType = 'text/html'
        }
    }

    path.exists(filePath, function(exists){        
        if(!exists) {
            response.writeHead(404);
            response.end();
        } else {
            fs.readFile(filePath, function(error, content){
                if(error) {
                    response.writeHead(500);
                    response.end();

                } else {
                    if(contentType != null) 
                        response.writeHead(200,{'Content-Type': contentType});
                    response.end(content, 'utf-8')
                }
            });
        }
    });
};



Utils.serveFile = function staticGzip(dirPath, options){
	options = options || {};
	var
		maxAge = options.maxAge || 86400000,
		contentTypeMatch = options.contentTypeMatch || /text|javascript|css|json/,
		clientMaxAge = options.clientMaxAge || 604800000,
		prefix = options.prefix || '';

	if (!dirPath) throw new Error('You need to provide the directory to your static content.');
	if (!contentTypeMatch.test) throw new Error('contentTypeMatch: must be a regular expression.');

  return function staticGzip(req, res){
		var url, filename, contentType, acceptEncoding, charset;

		function pass(name) {
                    Utils.serveFileRaw(dirPath, req, res);
		}

		function setHeaders(cacheObj) {
			res.setHeader('Content-Type', contentType);
			res.setHeader('Content-Encoding', 'gzip');
			res.setHeader('Vary', 'Accept-Encoding');
			res.setHeader('Content-Length', cacheObj.content.length);
			res.setHeader('Last-Modified', cacheObj.mtime.toUTCString());
			res.setHeader('Date', new Date().toUTCString());
			res.setHeader('Expires', new Date(Date.now() + clientMaxAge).toUTCString());
			res.setHeader('Cache-Control', 'public, max-age=' + (clientMaxAge / 1000));
			res.setHeader('ETag', '"' + cacheObj.content.length + '-' + Number(cacheObj.mtime) + '"');
		}

		function sendGzipped(cacheObj) {
			setHeaders(cacheObj);
			res.end(cacheObj.content, 'binary');
		}

		function gzipAndSend(filename, gzipName, mtime) {
			gzippo(filename, charset, function(gzippedData) {
				gzippoCache[gzipName] = {
					'ctime': Date.now(),
					'mtime': mtime,
					'content': gzippedData
				};
				sendGzipped(gzippoCache[gzipName]);
			});
		}

		if (req.method !== 'GET' && req.method !== 'HEAD') {
		    //return next();
                    res.writeHead(500);
                    res.end();
		}

		url = parse(req.url);

		// Allow a url path prefix
		if (url.pathname.substring(0, prefix.length) !== prefix) {
                    //res.writeHead(500);
                    res.end();
		}

		filename = path.join(dirPath, url.pathname.substring(prefix.length));

		contentType = mime.lookup(filename);
		charset = mime.charsets.lookup(contentType, 'UTF-8');
		contentType = contentType + (charset ? '; charset=' + charset : '');
		acceptEncoding = req.headers['accept-encoding'] || '';

		if (!contentTypeMatch.test(contentType)) {
			return pass(filename);
		}

		if (!~acceptEncoding.indexOf('gzip')) {
			return pass(filename);
		}

		//This is storing in memory for the moment, need to think what the best way to do this.
		//Check file is not a directory

		fs.stat(filename, function(err, stat) {
			if (err || stat.isDirectory()) {
				return pass(filename);
			}

			var base = path.basename(filename),
					dir = path.dirname(filename),
					gzipName = path.join(dir, base + '.gz');

			if (req.headers['if-modified-since'] &&
				gzippoCache[gzipName] &&
				+stat.mtime <= new Date(req.headers['if-modified-since']).getTime()) {
				setHeaders(gzippoCache[gzipName]);
				removeContentHeaders(res);
				res.statusCode = 304;
				return res.end();
			}

			//TODO: check for pre-compressed file
			if (typeof gzippoCache[gzipName] === 'undefined') {
				gzipAndSend(filename, gzipName, stat.mtime);
			} else {
				if ((gzippoCache[gzipName].mtime < stat.mtime) ||
				((gzippoCache[gzipName].ctime + maxAge) < Date.now())) {
					gzipAndSend(filename, gzipName, stat.mtime);
				} else {
					sendGzipped(gzippoCache[gzipName]);
				}
			}
		});
	};
};

var serveFile = Utils.serveFile(".");

// HTTP server

var startHttp = function() {
    console.log("trying to create server 8080");

    http.createServer(function (req, res) { 
        try {
            var data = "";
            req.on('data', function(chunk){
                data = data + chunk;
            });
            req.on('end', function(){
                req.data = data;
                if(req.url.indexOf("\.atom") != -1) {
                    req.url = req.url.replace(".atom","");
                    req.headers['Accept'] = "application/atom+xml";
                }

                serveFile(req, res);
            });
        } catch(e) {
            console.log("(!!) Error");
            console.log(e);
            res.withCORSHeader(500,{"Content-Type":"text/plain"});
            res.end();
        }
    }).listen(8080);

    console.log("public server running at "+8080);
};

startHttp();

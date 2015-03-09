// exports
exports.NetworkTransport = {};
var NetworkTransport = exports.NetworkTransport;

NetworkTransport.load = function (uri, accept, callback, redirect) {
    var transport = jQuery;

    transport.ajax({
        url:uri,
        headers:{"Accept":accept},

        success:function (data, status, xhr) {
            if (("" + xhr.status)[0] == '2') {
                var headers = xhr.getAllResponseHeaders().split("\n");
                var acum = {};
                for (var i = 0; i < headers.length; i++) {
                    var header = headers[i].split(":");
                    acum[header[0]] = header[1];
                }

                callback(true, {headers:acum,
                                data:data});
            }
        },

        error:function (xhr, textStatus, ex) {
            if (("" + xhr.status)[0] == '3') {
                if (redirection == 0) {
                    callback(false, 500);
                } else {
                    var location = (xhr.getAllResponseHeaders()["Location"] || xhr.getAllResponseHeaders()["location"]);
                    if (location != null) {
                        NetworkTransport.load(location, accept, callback, (redirection - 1));
                    } else {
                        callback(false, 500);
                    }
                }
            } else {
                callback(false, xhr.statusCode());
            }
        }
    });
};

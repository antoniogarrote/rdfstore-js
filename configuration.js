exports.Configuration = {};
var Configuration = exports.Configuration;

Configuration.NetworkTransport = require("./js-communication/src/tcp_transport").TCPTransport;

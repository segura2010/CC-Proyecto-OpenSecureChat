
// Get config file (config.json)
var config = require('./config.json');

// Libs for MongoDB
var mongo = require('mongodb');
var monk = require('monk');

// Libs for RedisDB
var redis = require("redis");

// Libs for HTTP Server (Web)
var express = require('express');
var app = express();
var http = require('http').Server(app);

// Libs for SocketIO (using the http server)
var io = require('socket.io')(http);

// Initialize dbmongo
var dbmongo = monk('localhost:27017/opensecurechat');
// Initialize redis
var dbredis = redis.createClient();

// Get DB
var users = dbmongo.get("users");


// Initialize HTTP Server
app.use(express.static('public_html'));
// Listen on port
http.listen(config.httpServer.port, function(){
	console.log('listening on *:'+ config.httpServer.port);
});






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
var usersdb = dbmongo.get("users");

// Import my libraries
var UserLib = require('./lib/User.js').UserController;
var ChatLib = require('./lib/Chat.js').ChatController;

// Create controllers
var User = new UserLib(usersdb, dbredis);
var Chat = new ChatLib(dbredis);

// Prepare DB Indexes
User.prepareIndexes();


var testuser = {username:"testuser", email:"testuser@opensecurechat.com", password:"12345", pk:"public_key", privKey:"private_key"}
User.add(testuser, function(err, result){
	console.log(err);
});


// Initialize HTTP Server
app.use(express.static('public_html'));
// Listen on port
http.listen(config.httpServer.port, function(){
	console.log('listening on *:'+ config.httpServer.port);
});



// SocketIO Events
io.on('connection', function (socket) {
	socket.emit('something', { hello: 'world' });
	socket.on('hello', function (data){
		console.log(data);
	});
});







// Get config from enviroment vars
var PORT = process.env.PORT || 3000;
var URI = process.env.URI || "localhost";


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


// Initialize HTTP Server
app.use(express.static('public_html'));
// Listen on port
http.listen(PORT, function(){
	console.log('listening on *:'+ PORT);
});

app.get("/api/config", function(req, res){
	p = PORT;
	if(URI.indexOf("heroku")>=0)
	{
		p = 80;
	}

	var url = "http://" + URI + ":" + PORT + "/";

	res.send('{"SOCKETIO_URL":"'+url+'", "KEY_SIZE":"1024"}');
});


// SocketIO Events
io.on('connection', function (socket) {
	socket.on('register', function (data, cb){
		console.log(data);
		User.add(data, cb);
	});
});




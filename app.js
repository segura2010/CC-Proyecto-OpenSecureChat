
// Get config from enviroment vars
var PORT = process.env.PORT || 3000;
var URI = process.env.URI || "localhost";
var KEY_SIZE = process.env.KEY_SIZE || 2048;
var MONGODB_URL = process.env.MONGODB_URL || 'localhost:27017/opensecurechat';
var REDIS_URL = process.env.REDIS_URL || null;

// Parse redis URL
var url = require('url');

// Libs for MongoDB
var mongo = require('mongodb');
var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;

// Libs for RedisDB
var redis = require("redis");

// Libs for HTTP Server (Web)
var express = require('express');
var app = express();
var http = require('http').Server(app);
// JSON Parser
var bodyParser = require('body-parser')

// Libs for SocketIO (using the http server)
var io = require('socket.io')(http);

// Initialize dbmongo
var dbmongo = monk(MONGODB_URL);
var dbredis = null;
// Initialize redis
if(REDIS_URL)
{
	var redisURL = url.parse(REDIS_URL);
	dbredis = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true, auth_pass: redisURL.auth.split(":")[1]});

}
else
{
	dbredis = redis.createClient();
}

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
app.use( bodyParser.json() ); 

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

	var url = "http://" + URI + ":" + p + "/";

	res.end('{"SOCKETIO_URL":"'+url+'", "KEY_SIZE":"'+KEY_SIZE+'"}');
});



// SocketIO Events
io.on('connection', function (socket) {
	socket.on('register', function (data, cb){
		//console.log(data);
		User.add(data, cb);
	});

	socket.on('login', function (password, cb){
		//console.log(password);
		User.getByPassword(password, function(err, data){
			if(data.length <= 0)
			{
				return cb("User Not Found", null);
			}
			cb(null, data[0]);
		});
	});

	socket.on('getUserPublicKey', function (username, cb){
		//console.log(data);
		User.getByUsername(username, function(err, user){
			user = user[0];
			if(err || !user)
			{
				return cb("Unable to get PublicKey for user", null);
			}
			
			return cb(null, user.public_key);
		});
	});

	socket.on('getUserInfo', function (username, cb){
		//console.log(data);
		User.getByUsername(username, function(err, user){
			user = user[0];
			if(err || !user)
			{
				return cb("Unable to get PublicKey for user", null);
			}
			
			// remove private information
			user.email = "";
			user.password = "";
			user.private_key = "";

			return cb(null, user);
		});
	});

	socket.on('sendMessage', function (data, cb){
		//console.log(data);
		User.getByUsername(data.username, function(err, userTo){
			userTo = userTo[0];
			if(err || !userTo)
			{
				return cb("User does not exists", null);
			}

			User.getByPassword(data.token, function(err, userFrom){
				userFrom = userFrom[0];
				if(err || !userFrom)
				{
					return cb("Invalid token", null);
				}

				var encryptedMsgUser = data.msgFrom;
				var encryptedMsgToUser = data.msgTo;

				Chat.add(userFrom._id, userTo._id, encryptedMsgUser, encryptedMsgToUser, function(){
					
					// Send real time message
					io.sockets.in(userTo.password).emit('newMessage', {message: encryptedMsgToUser, username:userFrom.username} );
					
					cb(null, "");
				});
			});
		});
	});

	socket.on('getChats', function (data, cb){
		User.getByPassword(data.token, function(err, user){
			user = user[0];
			if(err || !user)
			{
				return cb("Invalid token", null);
			}

			Chat.getChatsForUser(user._id, function(err, chats){
				if(err)
				{
					return cb("Error obtaining chats", null);
				}

				var users = [];
				for(c in chats)
				{
					users.push( new ObjectID(c) );
				}

				User.getUsersById(users, function(err, usersResult){
					for(u in usersResult)
					{	// add unread count and remove private data
						//usersResult[u]["unread"] = users[usersResult._id];
						usersResult[u].email = "";
						usersResult[u].password = "";
						usersResult[u].private_key = "";
					}

					cb(null, usersResult);
				});
			});
		});
	});

	socket.on('getMessagesWith', function (data, cb){
		User.getByUsername(data.username, function(err, userWith){
			userWith = userWith[0];
			if(err || !userWith)
			{
				return cb("User does not exists", null);
			}
			User.getByPassword(data.token, function(err, user){
				user = user[0];
				if(err || !user)
				{
					return cb("Invalid token", null);
				}

				Chat.getChatMessages(user._id, userWith._id, cb);
			});
		});
	});

	socket.on('deleteMessagesWith', function (data, cb){
		User.getByUsername(data.username, function(err, userWith){
			userWith = userWith[0];
			if(err || !userWith)
			{
				return cb("User does not exists", null);
			}
			User.getByPassword(data.token, function(err, user){
				user = user[0];
				if(err || !user)
				{
					return cb("Invalid token", null);
				}

				Chat.deleteChatMessages(user._id, userWith._id, cb);
			});
		});
	});

	socket.on('updateProfile', function (data, cb){
		User.getByPassword(data.token, function(err, user){
			user = user[0];
			if(err || !user)
			{
				return cb("Invalid token", null);
			}

			var newUser = {
				picture: data.picture
			};
			
			User.update(user._id, newUser, cb);
		});
	});

	socket.on('join', function (room, cb){
		socket.join(room);
	});

});





// Get config from enviroment vars
var PORT = process.env.PORT || 3000;
var URI = process.env.URI || "localhost";
var KEY_SIZE = process.env.KEY_SIZE || 2048;
var MONGODB_URL = process.env.MONGODB_URL || 'localhost:27017/opensecurechat';
var REDIS_URL = process.env.REDIS_URL || null;
var PROFILE_PICTURE_MAX_SIZE = process.env.PROFILE_PICTURE_MAX_SIZE || 1000000; // in bytes; default = 1MB = 1000000
var FILE_MAX_SIZE = process.env.FILE_MAX_SIZE || 800000; // in bytes; default = 800KB

// Push Notification with PushBullet
var PUSH_CLIENT_ID = process.env.PUSH_CLIENT_ID || "";
var PUSH_CLIENT_SECRET = process.env.PUSH_CLIENT_SECRET || "";
var PUSH_REDIRECT_URL = process.env.PUSH_REDIRECT_URL || "http://localhost:3000/auth.html";
var PUSH_SIGN_UP = "https://www.pushbullet.com/authorize?client_id={clientid}&redirect_uri={redirect_uri}&response_type=token&scope=everything"
PUSH_SIGN_UP = PUSH_SIGN_UP.replace("{clientid}", PUSH_CLIENT_ID).replace("{redirect_uri}", PUSH_REDIRECT_URL);

// Async
var async = require('async');

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

// PushBullet
var PushBullet = require('pushbullet');

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
var filesdb = dbmongo.get("files");

// Import my libraries
var UserLib = require('./lib/User.js').UserController;
var ChatLib = require('./lib/Chat.js').ChatController;
var UploadedFileLib = require('./lib/UploadedFile.js').UploadedFileController;

// Create controllers
var User = new UserLib(usersdb, dbredis);
var Chat = new ChatLib(dbredis);
var UploadedFile = new UploadedFileLib(filesdb);

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

	res.end('{"SOCKETIO_URL":"'+url+'", "KEY_SIZE":"'+KEY_SIZE+'", "pushbullet":"'+ PUSH_SIGN_UP +'"}');
});



// SocketIO Events
io.on('connection', function (socket) {
	socket.on('register', function (data, cb){
		//console.log(data);
		User.add(data, cb);
	});

	socket.on('login', function (password, cb){
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

			User.getByPassword(socket.token, function(err, userFrom){
				userFrom = userFrom[0];
				if(err || !userFrom)
				{
					return cb("Invalid token", null);
				}

				var encryptedMsgUser = data.msgFrom;
				var encryptedMsgToUser = data.msgTo;

				Chat.add(userFrom._id, userTo._id, encryptedMsgUser, encryptedMsgToUser, 0, function(){
					
					// Send real time message
					io.sockets.in(userTo.password).emit('newMessage', {message: encryptedMsgToUser, username:userFrom.username} );
					
					// check if a room for the user exists, if it exists the user is online
					var isConnected = (io.sockets.adapter.rooms[userTo.password] || false);

					if(!userTo.pushbullet_token || isConnected)
					{
						return cb(null, 1);
					}

					// Send push notification
					var pusher = new PushBullet(userTo.pushbullet_token);
					pusher.devices(function(err, response) {
					    if(err)
						{
							return cb(null, 1);
						}

					    async.each(response.devices, function(device, callback){
							pusher.link(device.iden, 'New message from '+ userFrom.username + ' on OpenSecureChat', URI, function(error, response) { callback(); });
						}, function(err){
							cb(null, 1);
						});
					});
				});
			});
		});
	});

	socket.on('getChats', function (data, cb){
		User.getByPassword(socket.token, function(err, user){
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
					async.each(usersResult, function(u, callback){
						Chat.getChatsForUser(u._id, function(err, unread){
							u["unread"] = chats[u._id.toString()]; // my unread messages from other user
							u["ounread"] = unread ? unread[user._id.toString()] : 0; // the other user unread messages from me
							u.email = "";
							u.password = "";
							u.private_key = "";
							callback();
						});
					}, function(err){
						cb(null, usersResult);
					});

					/*
					for(u in usersResult)
					{	// add unread count and remove private data
						usersResult[u]["unread"] = chats[usersResult[u]._id.toString()];
						usersResult[u].email = "";
						usersResult[u].password = "";
						usersResult[u].private_key = "";
					}
					*/

					//cb(null, usersResult);
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
			User.getByPassword(socket.token, function(err, user){
				user = user[0];
				if(err || !user)
				{
					return cb("Invalid token", null);
				}

				Chat.getChatMessages(user._id, userWith._id, data.start, cb);
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
			User.getByPassword(socket.token, function(err, user){
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
		User.getByPassword(socket.token, function(err, user){
			user = user[0];
			if(err || !user)
			{
				return cb("Invalid token", null);
			}

			if(data.picture.length > PROFILE_PICTURE_MAX_SIZE)
			{
				return cb("Profile picture is too large :(", null);
			}

			var newUser = {
				picture: data.picture
			};
			
			User.update(user._id, newUser, cb);
		});
	});

	socket.on('markAsRead', function (data, cb){
		User.getByUsername(data.username, function(err, userWith){
			userWith = userWith[0];
			if(err || !userWith)
			{
				return cb("User does not exists", null);
			}
			User.getByPassword(socket.token, function(err, user){
				user = user[0];
				if(err || !user)
				{
					return cb("Invalid token", null);
				}

				Chat.markAsRead(user._id, userWith._id, function(err, r){
					if(err)
					{
						return cb("Error marking as read", null);
					}

					io.sockets.in(userWith.password).emit('readMessage', user.username );
				});
			});
		});
	});

	socket.on('sendFile', function (data, cb){

		if(data.content.length > FILE_MAX_SIZE)
		{
			return cb("File size exceeded", null);
		}

		User.getByUsername(data.username, function(err, userTo){
			userTo = userTo[0];
			if(err || !userTo)
			{
				return cb("User does not exists", null);
			}

			User.getByPassword(socket.token, function(err, userFrom){
				userFrom = userFrom[0];
				if(err || !userFrom)
				{
					return cb("Invalid token", null);
				}

				var encryptedMsgUser = data.fileFrom;
				var encryptedMsgToUser = data.fileTo;

				var f = { name:data.name,
					content:data.content,
					keys:{}
				};
				f.keys[userTo._id.toString()] = data.fileTo;
				f.keys[userFrom._id.toString()] = data.fileFrom;
				
				UploadedFile.add(f, function(err, uFile){
					if(err)
					{
						return cb("Error saving file", null);
					}

					Chat.add(userFrom._id, userTo._id, uFile._id.toString(), uFile._id.toString(), 1, function(){
						
						// Send real time message
						io.sockets.in(userTo.password).emit('newMessage', {message: uFile._id.toString(), username:userFrom.username, isFile:1} );
						
						cb(null, uFile._id.toString());
					});
				});
			});
		});
	});

	socket.on('downloadFile', function (id, cb){
		User.getByPassword(socket.token, function(err, user){
			user = user[0];
			if(err || !user)
			{
				return cb("Invalid token", null);
			}
			
			UploadedFile.getById(id, function(err, uFile){
				uFile = uFile[0];
				if(err || !uFile)
				{
					return cb("Error getting file", null);
				}

				uFile.key = uFile.keys[user._id.toString()];
				uFile.keys = null;

				cb(null, uFile);
			});
		});
	});

	socket.on('deleteFile', function (id, cb){
		User.getByPassword(socket.token, function(err, user){
			user = user[0];
			if(err || !user)
			{
				return cb("Invalid token", null);
			}
			
			UploadedFile.isOwner(user._id.toString(), id, function(err, isOwner){
				if(err)
				{
					return cb("Error getting file", null);
				}
				if(!isOwner)
				{
					return cb("Error: You do not have permission", null);
				}

				UploadedFile.delete(id, function(err,r){
					if(err)
					{
						return cb("Error deleting file", null);
					}

					cb(null, 1);
				});
			});
		});
	});

	socket.on('pushAuth', function (code, cb){
		User.getByPassword(socket.token, function(err, user){
			user = user[0];
			if(err || !user)
			{
				return cb("Invalid token", null);
			}

			var pusher = new PushBullet(code);
			pusher.devices(function(err, response) {
			    if(err)
				{
					return cb("Invalid pushbullet token", null);
				}

			    User.update(user._id, {pushbullet_token:code}, function(){
				    if(err)
					{
						return cb("Error saving token", null);
					}

				    async.each(response.devices, function(device, callback){
						pusher.link(device.iden, 'Successfuly signed up on OpenSecureChat!', URI, function(error, response) { callback(); });
					}, function(err){
						cb(null, 1);
					});
				});
			});
		});
	});

	socket.on('join', function (room, cb){
		socket.token = room;
		socket.join(room);
	});

});




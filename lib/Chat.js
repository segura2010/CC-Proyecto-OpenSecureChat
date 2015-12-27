exports.ChatController = function(db){

	// Redis Client
	this.dbredis = db;

	this.add = function(userid, touserid, encryptedMsgUser, encryptedMsgToUser, cb){
		// Adds message to DB

		var redis = this.dbredis;
		// Increment unread user chat messages
		redis.hgetall("chats:"+ touserid, function(err, result){
			var unread = 0;
			if(result && result[userid])
			{
				unread = parseInt(result[userid]) + 1;
			}
			// Add chats
			redis.hmset("chats:"+ touserid, userid.toString(), unread);
			redis.hmset("chats:"+ userid, touserid.toString(), 0);

			var date = parseInt(Date.now()); // to preserve the date and order

			// Add messages to USERID messages in DB
			//redis.hmset(userid +":"+ touserid, date+encryptedMsgUser, 1);
			redis.zadd(userid +":"+ touserid, date, "[1]"+encryptedMsgUser);

			// Add messages to TOUSERID messages in DB
			//redis.hmset(touserid +":"+ userid, date+encryptedMsgToUser, 0);
			redis.zadd(touserid +":"+ userid, date, "[0]"+encryptedMsgToUser);

			cb();
		});
	};

	this.getChatsForUser = function(uid, cb){
		// Get user chats by USERID
		this.dbredis.hgetall("chats:"+ uid, cb);
	};

	this.getChatMessages = function(uid, withotheruid, start, cb){
		// Get user chat messages with other user
		// and set as read
		this.dbredis.hmset("chats:"+ uid, withotheruid.toString(), 0);
		this.dbredis.zrevrange(uid +":"+ withotheruid, start, start+9, /*"WITHSCORES",*/ cb);
	};

	this.deleteChatMessages = function(uid, withotheruid, cb){
		// Get user chat messages with other user
		this.dbredis.del(uid +":"+ withotheruid);
		this.dbredis.del("chats:"+ uid, withotheruid.toString(), cb);
	};

	this.markAsRead = function(uid, withotheruid, cb){
		// mark messages as read
		this.dbredis.hmset("chats:"+ uid, withotheruid.toString(), 0);
		cb(null, 1);
	};

};


// Test redis
/*
dbredis.set("test:1", 0);
dbredis.get("test:1", function(err, result){
	console.log(result);
});
*/

// Chat index example
// It contains an object like this:
// {"USERID1":0, "USERID2":2, "USERID3":1}
// the number counts how many unread messages from the USERID are
/*
dbredis.hmset("chats:USERID", "USERID1", 0, "USERID2", 0, "USERID3", 0);
dbredis.hgetall("chats:USERID", function(err, result){
	console.log(result);
	console.log(err);
});
*/


// Users Chat Messages example
// It contains an object with the messages encrypted with public key of user USERID
// for the chat between USERID and OTHERUSERID.
// When USERID sends a message to OTHERUSERID we must save the message in objects: 
// 		"USERID:OTHERUSERID" (encrypted with public key of USERID) -> this chat messages will be send to USERID when log in
// 		"OTHERUSERID:USERID" (encrypted with public key of OTHERUSERID) -> this chat messages will be send to OTHERUSERID when log in
// {"MESSAGE1":0, "MESSAGE2":1, "MESSAGE3":0}
// the number of each message:
// 		1 -> Send by me
//		0 -> Send by OTHERUSERID
/*
dbredis.hmset("USERID:OTHERUSERID", "MESSAGE1", 0, "MESSAGE2", 0, "MESSAGE3", 0);
dbredis.hgetall("USERID:OTHERUSERID", function(err, result){
	console.log(result);
	console.log(err);
});
*/



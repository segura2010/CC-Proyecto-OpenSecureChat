exports.ChatController = function(db){

	// Redis Client
	this.dbredis = db;

	this.add = function(userid, touserid, encryptedMsgUser, encryptedMsgToUser, cb){
		// Adds message to DB

		// Increment unread user chat messages
		dbredis.hgetall("chats:"+ touserid, function(err, result){
			var unread = 0;
			if(result && result[touserid])
			{
				unread = result[touserid] + 1;
			}
			dbredis.hmset("chats:"+ touserid, userid, unread);
		});

		// Add messages to USERID messages in DB
		dbredis.hmset(userid +":"+ touserid, encryptedMsgUser, 1);

		// Add messages to TOUSERID messages in DB
		dbredis.hmset(touserid +":"+ userid, encryptedMsgToUser, 0);
	};

	this.getChatsForUser = function(uid, cb){
		// Get user chats by USERID
		dbredis.hgetall("chats:"+ uid, cb);
	};

	this.getChatMessages = function(uid, withotheruid, cb){
		// Get user chat messages with other user
		dbredis.hgetall(uid +":"+ withotheruid, cb);
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



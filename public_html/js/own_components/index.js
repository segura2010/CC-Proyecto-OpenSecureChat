
var JSE = null;
var socket = null;

var SOCKETIO_URL = "";
var KEY_SIZE = 2048;

var PLAIN_PASSWORD = "";
var MIN_PASSWORD_LENGTH = 8;

// save a cache of chats
var CHATS = {};

function init()
{
	getConfig();
}

function setUpSocketIOEvents()
{
	socket.on("newMessage", newMessageRecived);
}

function getConfig()
{
	$.getJSON("/api/config", function(data){

		SOCKETIO_URL = data.SOCKETIO_URL;
		KEY_SIZE = data.KEY_SIZE;

		socket = io(SOCKETIO_URL);
		JSE = new JSEncrypt({default_key_size: KEY_SIZE});

		showWelcome();
		setUpIORooms();
		setUpSocketIOEvents();

	}).fail(function(e){
		dangerAlert("Unable to load configuration info");
	});
}

// Show danger alert
function dangerAlert(msg)
{
	Materialize.toast(msg, 4000);
}
// Show Success alert
function successAlert(msg)
{
	Materialize.toast(msg, 4000);
}

function showRegisterUserModal()
{
	$("#loginAndRegister").openModal();
}

function registerUser()
{
	PLAIN_PASSWORD = $("#passwordRegTxt").val();
	var email = $("#emailRegTxt").val();
	var username = $("#usernameRegTxt").val();

	if(PLAIN_PASSWORD.length < MIN_PASSWORD_LENGTH)
	{
		return dangerAlert("Your password must be at least "+ MIN_PASSWORD_LENGTH +" characters!");
	}

	// user password will be the plain password and email Hash
	var password = CryptoJS.SHA256(email + PLAIN_PASSWORD);
	password = password.toString(CryptoJS.enc.Base64);


	successAlert("Generating your encryption keys, please wait..");
	// Generate public/private keys
	JSE.getKey(function () {
		var private_key = JSE.getPrivateKey();
		var public_key = JSE.getPublicKey();

		successAlert("Encryption keys generated! Contacting to the server..");

		// encrypt private key
		var private_keyEnc = CryptoJS.AES.encrypt(private_key, PLAIN_PASSWORD).toString();
		//alert(private_keyEnc);

		var registrationData = {
			username: username,
			email: email,
			password: password,
			public_key: public_key,
			private_key: private_keyEnc,
			picture: null
		};

		socket.emit("register", registrationData, resgistrationResponse);

	});
}


function resgistrationResponse(err, r)
{
	if(err)
	{
		return dangerAlert(err);
	}

	successAlert("Successfuly!");

	localStorage.setItem("username", r.username);
	localStorage.setItem("password", r.password);
	localStorage.setItem("public_key", r.public_key);
	localStorage.setItem("private_keyEnc", r.private_key); // Encrypted with plain text password!

	var private_key = CryptoJS.enc.Latin1.stringify( CryptoJS.AES.decrypt(r.private_key, PLAIN_PASSWORD) );
	localStorage.setItem("private_key", private_key);

	// Reset for security
	PLAIN_PASSWORD = "";

	showWelcome();

}

function logInUser()
{
	PLAIN_PASSWORD = $("#passwordLogInTxt").val();
	var email = $("#emailLogInTxt").val();

	// user password will be the plain password and email Hash
	var password = CryptoJS.SHA256(email + PLAIN_PASSWORD);
	password = password.toString(CryptoJS.enc.Base64);

	socket.emit("login", password, resgistrationResponse);
}

function isLoggedIn()
{
	return localStorage.username && localStorage.password && localStorage.private_key && localStorage.public_key;
}

function showWelcome()
{
	if(isLoggedIn())
	{
		$("#logInBtn").hide();

		$("#logOutBtn").show();
		$("#welcomeMsg").show();

		$("#welcomeUsername").html(localStorage.getItem("username"));

		getChats();
	}
}

function setUpIORooms()
{
	if(isLoggedIn())
	{
		socket.emit("join", localStorage.getItem("password"));
	}
}

function logOut()
{
	localStorage.clear();

	location.reload();
}

function scrollToRecentMessage()
{
	var conversation = document.getElementById("chatWindow");
	conversation.scrollTop = conversation.scrollHeight;
}

function sendMessage()
{
	var username = $("#chatWith").html();
	var message = $("#messageTxt").val();

	$("#messageTxt").val("");
	$("#chatWindow").prepend(getMessageChatTemplate(username, message, 1));
	sendMessageTo(username, message);
}

function newMessageRecived(data)
{
	var username = $("#chatWith").html();

	saveMessageOnCache( "[0]"+data.message, data.username );

	if(username == data.username)
	{
		JSE.setPrivateKey(localStorage.getItem("private_key"));
		var message = JSE.decrypt(data.message);
		$("#chatWindow").prepend(getMessageChatTemplate(username, message, 0));
	}
	else
	{
		successAlert("New message from " + data.username);
	}
}

function saveMessageOnCache(msg, username)
{
	CHATS[username].splice(0, 0, msg);
}

function deleteMessages()
{
	if(confirm("Sure?"))
	{
		var username = $("#chatWith").html();
		deleteMessagesWith(username);
	}
}

function deleteMessagesWith(username)
{
	var data = {
		token: localStorage.getItem("password"),
		username: username
	};

	socket.emit("deleteMessagesWith", data, function(err, messages){
		if(err)
		{
			return dangerAlert(err);
		}

		successAlert("Deleted!");
		/*
		console.log(messages);
		for(m in messages)
		{
			JSE.setPrivateKey(localStorage.getItem("private_key"));
			message = JSE.decrypt(m);
			console.log(message);
		}
		*/
	});
}

function sendMessageTo(username, msg)
{

	var messageData = {
		token: localStorage.getItem("password"),
		username: username,
		msgFrom: "", // After of encrypt
		msgTo: "" // After of encrypt
	};

	socket.emit("getUserPublicKey", username, function(err, public_key){
		if(err)
		{
			return dangerAlert(err);
		}

		// Encrypt message to send
		JSE.setPublicKey(public_key);
		messageData.msgTo = JSE.encrypt(msg);
		JSE.setPublicKey(localStorage.getItem("public_key"));
		messageData.msgFrom = JSE.encrypt(msg);
	
		socket.emit("sendMessage", messageData, function(err, r){
			if(err)
			{
				return dangerAlert(err);
			}

			saveMessageOnCache( "[1]"+messageData.msgFrom, username );
		});
	});

}



function getChats()
{
	var data = {
		token: localStorage.getItem("password")
	};

	socket.emit("getChats", data, function(err, r){
		if(err)
		{
			return dangerAlert(err);
		}
		renderRecentChats(r);
	});
}

function renderRecentChats(chats)
{
	$("#userChats").html("");
	for(c in chats)
	{
		var username = chats[c].username;
		var picture = chats[c].picture;
		//var unread = chats[c].unread;
		$("#userChats").append(getRecentChatTemplate(picture, username));
	}
}


function getRecentChatTemplate(picture, username)
{
	var template = '<a href="#!" style="color:#92959E"><li class="clearfix" onclick="getMessagesWith(\'{username}\')">'
	          +'<img src="{picture}" alt="avatar" onerror="setDefaultPicture(this)" class="circle" style="width:50px" />'
	          +'<div class="about">'
	          +'<div class="name">{username}</div>'
	          +'  <div class="status">'
	          +'    ...'
	          +'  </div>'
	          +'</div>'
	        +'</li></a>';

	template = template.replace(/\{username\}/g, username).replace(/\{picture\}/g, picture);

	return template;
}


function setDefaultPicture(obj)
{
	obj.src = "data:image/jpeg;base64,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";
}

function getMessagesWith(username)
{
	var data = {
		token: localStorage.getItem("password"),
		username: username
	};

	if(CHATS[username])
	{
		return renderChatMessages(CHATS[username], username);
	}

	socket.emit("getMessagesWith", data, function(err, messages){
		if(err)
		{
			return dangerAlert(err);
		}
		CHATS[username] = messages;
		renderChatMessages(messages, username);
		/*
		console.log(messages);
		for(m in messages)
		{
			JSE.setPrivateKey(localStorage.getItem("private_key"));
			message = JSE.decrypt(m);
			console.log(message);
		}
		*/
	});
}

function renderChatMessages(messages, username)
{
	$("#chatWindow").html("");
	$("#chatWith").html(username);
	$("#chatPicture").html("");
	$("#chatNumMessages").html(messages.length);
	for(m in messages)
	{	// Message Schema: [sender]encryptedMessage -> Sender = 1 (if is me) or = 0 is not me
		var msg = messages[m];
		JSE.setPrivateKey(localStorage.getItem("private_key"));
		var isMe = parseInt( msg[1] );
		var realMessage = msg.replace(/\[[0-9]\]/g, "");
		var message = JSE.decrypt(realMessage);
		$("#chatWindow").append(getMessageChatTemplate(username, message, isMe));
	}
}

function getMessageChatTemplate(username, message, isMe)
{
	var alignClass = "align-right";
	var myMessage = "message my-message";
	var otherMessage = "message other-message float-right";

	var messageClass = otherMessage;
	var usernamePosition = '<span class="message-data-name"><i class="fa fa-circle online"></i> {username}</span><span class="message-data-time"></span>';
	if(isMe == 0)
	{
		alignClass = "";
		messageClass = myMessage;
		usernamePosition = '<span class="message-data-time" ></span> &nbsp; &nbsp;<span class="message-data-name" >{username}</span> <i class="fa fa-circle me"></i>';
	}
	else
	{
		username = localStorage.getItem("username");
	}

	var template = '<li class="clearfix">'
    +'<div class="message-data '+alignClass+'">'
      + usernamePosition
    +'</div>'
    +'<div class="'+ messageClass +'">'
      +'{message}'
    +'</div>'
  	+'</li>';


  	template = template.replace(/\{username\}/g, username).replace(/\{message\}/g, message);

	return template;
}

init();

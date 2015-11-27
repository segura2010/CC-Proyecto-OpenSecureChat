
var JSE = null;
var socket = null;

var SOCKETIO_URL = "";
var KEY_SIZE = 1024;

function init()
{
	getConfig();
}

function getConfig()
{
	$.getJSON("/api/config", function(data){

		SOCKETIO_URL = data.SOCKETIO_URL;
		KEY_SIZE = data.KEY_SIZE;

		socket = io(SOCKETIO_URL);
		JSE = new JSEncrypt({default_key_size: KEY_SIZE});

	}).fail(function(e){
		dangerAlert("Unable to load configuration info");
	});
}

// Show danger alert
function dangerAlert(msg)
{
	alert(msg);
}
// Show Success alert
function successAlert(msg)
{
	alert(msg);
}

function showRegisterUserModal()
{
	$("#loginAndRegister").openModal();
}

function registerUser()
{
	var plainPassword = $("#passwordRegTxt").val();
	var email = $("#emailRegTxt").val();
	var username = $("#usernameRegTxt").val();

	// user password will be the plain password and email Hash
	var password = CryptoJS.SHA256(email + plainPassword);
	password = password.toString(CryptoJS.enc.Base64);

	// Generate public/private keys
	JSE.getKey(function () {
		var private_key = JSE.getPrivateKey();
		var public_key = JSE.getPublicKey();

		// encrypt private key
		var private_keyEnc = CryptoJS.AES.encrypt(private_key, plainPassword).toString();
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
	localStorage.setItem("private_key", r.private_key); // Encrypted with plain text password!
}


init();


var JSE = null;
var socket = null;

var SOCKETIO_URL = "";
var KEY_SIZE = 2048;

var PLAIN_PASSWORD = "";
var MIN_PASSWORD_LENGTH = 8;

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

		showWelcome();

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
	}
}

function logOut()
{
	localStorage.clear();

	location.reload();
}


init();

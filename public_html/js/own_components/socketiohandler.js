
var socket = io('http://localhost:3000/');
socket.on('something', function (data) {
	alert("something received!");
	socket.emit('hello', { my: 'data' });
});

var express = require('express');
var unique = require('node-uuid')
var app = express();
var serv = require('http').Server(app);
const bodyParser = require('body-parser');

app.get('/',function(req, res) {
	res.sendFile(__dirname, 'public/index.html');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

serv.listen(process.env.PORT || 8000);
console.log("Server started.");

 // io connection 
var io = require('socket.io')(serv,{});

io.sockets.on('connection', function(socket){
   console.log('0.0');
});
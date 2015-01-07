var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);

// var io = require('socket.io')(app);

// serve static files from the current directory
app.use(express.static(__dirname));

//we'll keep clients data here
var clients = {};
  
// Save Score
var theWinner={"id": "0", "score": "0"};

//get EurecaServer class
var EurecaServer = require('eureca.io').EurecaServer;

//create an instance of EurecaServer
var eurecaServer = new EurecaServer({allow:['setId', 'spawnEnemy', 'kill', 'updateState', 'updateBurger', 'updateScore']});

//attach eureca.io to our http server
eurecaServer.attach(server);




//eureca.io provides events to detect clients connect/disconnect

//detect client connection
eurecaServer.onConnect(function (conn) {    
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);
	
	//the getClient method provide a proxy allowing us to call remote client functions
     var remote = eurecaServer.getClient(conn.id);    
	
	//register the client
	clients[conn.id] = {id:conn.id, remote:remote}
	
	//here we call setId (defined in the client side)
	remote.setId(conn.id);	

    // // on connection close event
    //   conn.on('close', function() {
    //     console.log('Bye!');
    //   });

    //   // on receive new data from client event
    //   conn.on('data', function(message) {
    //     console.log(message);
    //   });
  // notifyBackUpServer(clients);
});

//detect client disconnection
eurecaServer.onDisconnect(function (conn) {    
    console.log('Client disconnected ', conn.id);
	
	var removeId = clients[conn.id].id;
	
	delete clients[conn.id];
	
	for (var c in clients)
	{
		var remote = clients[c].remote;
		
		//here we call kill() method defined in the client side
		remote.kill(conn.id);
    // notifyBackUpServer(clients);
	}	 
});





eurecaServer.exports.handshake = function()
{
    for (var c in clients)
    {
        var remote = clients[c].remote;
        for (var cc in clients)
        {        
            //send latest known position
            var x = clients[cc].laststate; 
            var y = clients[cc].laststate;
 
            remote.spawnEnemy(clients[cc].id, x, y);        
        }
    }
}




eurecaServer.exports.handleKeys = function (burgerEaten, keys) {
    var conn = this.connection;
    var updatedClient = clients[conn.id];
    for (var c in clients)
    {
        var remote = clients[c].remote;
        remote.updateState(updatedClient.id, keys);
        remote.updateBurger(burgerEaten);
        remote.updateScore(theWinner);
    }
}

eurecaServer.exports.saveScore=function(id, score)
{
    // console.log(theWinner);
    if(theWinner.score<score)
    {
         theWinner.id=id;
         theWinner.score=score;
    }
}



// const net = require("net");


// // Create a socket (client) that connects to the server
// var socket = new net.Socket();
// socket.connect(8001, "localhost", function () {
//     console.log("Client: Connected to server");
// });




// function notifyBackUpServer(sentData)
// {
//   // Let's handle the data we get from the server
//   socket.on("data", function (data) {
//       data = JSON.parse(data);
//       console.log("Response from server : "+data.response);
//       // Respond back
//       socket.write(JSON.stringify({ response: sentData}));
//       // Close the connection
//       // socket.end();
//   });
// }

server.listen(process.env.PORT);





// // var sockets = io.listen(server);
// // sockets.on('connection', function (socket) {
// //   socket.on('Coucou', function (data) {
// //     // faire ce qu'il y a à faire
// //     console.log("message :" + data);
// //   });
// // });


// ﻿/// <reference path="../Ezelia/EurecaServer.class.js" />

// var express = require('express')
//   , app = express()
//   , server = require('http').createServer(app)
//   //, io = require('engine.io').attach(server, { path: '/eureca.io' });

// var EurecaServer = require('eureca.io').EurecaServer;

// var eurecaServer = new EurecaServer({ allow: ['sub', 'ns.hello', 'ns2.ns3.h2'], debuglevel: 4 });

// eurecaServer.attach(server);

// eurecaServer.onMessage(function (msg) {
//     console.log('RECV', msg);
// });
// eurecaServer.onConnect(function (conn) {
    
//     console.log('new Client');
//     var client = eurecaServer.getClient(conn.id);
    
//     client.ns.hello();
//     client.ns2.ns3.h2();

    
//     client.sub(10, 4).onReady(function (r) {
//         console.log('> 10 - 4 = ', r);
//     });
    
// });

// eurecaServer.exports.ns = {
//     v: 5,
//     ar : [1,2,3],
//     play: function ()
//     {
//         console.log('play');
//     },
//     stop: function ()
//     {
//         console.log('stop');
//     }
// }


// eurecaServer.exports.foo = function () {
//     return ('bar');
// }
// //onCall is triggered on the server side when a client calls foo()
// eurecaServer.exports.foo.onCall = function(conn)
// {
//     console.log('Client called foo', conn.id);
// }


// eurecaServer.exports.add = function (a, b) {
//     console.log('add', this.user, this.somevar);
//     return a+b;
// }



// app.get('/', function (req, res, next) {
//     res.sendfile('index.html');
// });


// server.listen(process.env.PORT || 8000, function () {
//     console.log('\033[96mlistening on localhost:8000 \033[39m');
// });

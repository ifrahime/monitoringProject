var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);



var connectedPort=process.env.PORT;
var outputFilename = 'server'+connectedPort+'.json';
var fs = require('fs');
var burgerBackUp;
// serve static files from the current directory
app.use(express.static(__dirname));

//we'll keep clients data here
var clients = {};
  
// Save Score
var theWinner={"id": "0", "score": "0"};

//get EurecaServer class
var EurecaServer = require('eureca.io').EurecaServer;

//create an instance of EurecaServer
var eurecaServer = new EurecaServer({allow:['setId', 'spawnEnemy', 'kill', 'updateState', 'updateBurger', 'updateScore', 'updateGame']});

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
  var data={'listOfClient' : clients};
  saveData(data);

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
        if(connectedPort!=8000)
        {

            fs.readFile( __dirname + '/server8000.json', function (err, data) {
            if (err) {
              throw err; 
            }
             burgerBackUp=JSON.parse(data).burgerEaten;
             console.log(burgerBackUp);
            });
            remote.updateBurger(burgerBackUp);
        }
    }

  var myData = {'burgerEaten':burgerEaten}
  saveData(myData);
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


eurecaServer.exports.getPort=function()
{
  return connectedPort;
}


// exec('nodejs serverBackUp.js', 
//     { env: evn }, 
//     function (err, stdout, stderr) {
//         if (err) {
//             throw err;
//         }
//         console.log(stdout);
//     }
// );


// Send data to the child process via its stdin stream
// child.stdin.write(clients);

// // Listen for any response from the child:
// child.stdout.on('message', function (data) {
//     console.log('We received a reply: ' + data);
// }); 

// // Listen for any errors:
// child.stderr.on('data', function (data) {
//     console.log('There was an error: ' + data);
// });


server.listen(connectedPort);


function saveData(myData)
{

    fs.writeFile(outputFilename, JSON.stringify(myData, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
}); 
}
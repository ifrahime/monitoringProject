var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);



var connectedPort=process.env.PORT;
var outputFilename = 'server8000.json';
var fs = require('fs');

var myData={
  clients : [],
  burgerEaten : [],
  score : []
};



// serve static files from the current directory
app.use(express.static(__dirname));

//we'll keep clients data here
var clients = {};
  
// Save Score
var theWinner={"id": "0", "score": "0"};

//get EurecaServer class
var EurecaServer = require('eureca.io').EurecaServer;

//create an instance of EurecaServer
var eurecaServer = new EurecaServer({allow:['setId', 'spawnEnemy', 'kill', 'updateState', 'updateBurger', 'updateWinner', 'updateScore', 'updateGame', 'getPortConnected']});

//attach eureca.io to our http server
eurecaServer.attach(server);




//eureca.io provides events to detect clients connect/disconnect

//detect client connection
eurecaServer.onConnect(function (conn) { 
    // deleteContentFile();
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);
	//the getClient method provide a proxy allowing us to call remote client functions
     var remote = eurecaServer.getClient(conn.id);    
	//register the client
	clients[conn.id] = {id:conn.id, remote:remote}
	// updateGame();
	//here we call setId (defined in the client side)
	remote.setId(conn.id);
  addDataToJsonObject("clients", clients);

});

//detect client disconnection
eurecaServer.onDisconnect(function (conn) {    
    console.log('Client disconnected ', conn.id);
	
	var removeId = clients[conn.id].id;
	
	delete clients[conn.id];
	
	for (var c in clients)
	{
		var remote = clients[c].remote;
		console.log("remote : "+JSON.stringify(remote));
		//here we call kill() method defined in the client side
		remote.kill(conn.id);
    // remote.backUpGame();
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
        remote.updateWinner(theWinner);
       
    }
    
    for(var i=0;i<burgerEaten.length;i++)
    {
      var couple=burgerEaten[i];
      addDataToJsonObject("burgerEaten", couple);
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
    addDataToJsonObject("score", theWinner);
    saveData(myData);
}


eurecaServer.exports.updateGame=function()
{
  console.log("I am in updateGame");
  for (var c in clients)
  {
    var remote = clients[c].remote;
    console.log("remote : "+JSON.stringify(remote));

     if(connectedPort!=8000)
          {

              fs.readFile( __dirname + '/server8000.json', function (err, data) {
              if (err) {
                throw err; 
              }
               var burgerBackUp=JSON.parse(data).burgerEaten;
               var sizeOfScoreList=getSizeOfJsonObject(JSON.parse(data).score);
               var sizeOfClientsList=getSizeOfJsonObject(JSON.parse(data).clients);
               var scoreBackUp=JSON.parse(data).score[sizeOfScoreList-1];
               var clientBackUp=JSON.parse(data).clients[sizeOfClientsList-1];

               remote.updateBurger(burgerBackUp);
               remote.updateScore(scoreBackUp);
               remote.updateState(clientBackUp.id, clientBackUp.laststate);
               console.log(clientBackUp);
              });      
          }
    }
}

eurecaServer.exports.getPortConnected=function(){
  return connectedPort;
}

server.listen(connectedPort);


function saveData(myData)
{

    if(connectedPort==8000)
    {
      fs.writeFile(outputFilename, JSON.stringify(myData, null, 4), function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("JSON saved to " + outputFilename);
      }
      }); 
    }  
}


function deleteContentFile()
{
  fs.truncate(outputFilename, 0, function(){console.log('done')})
}


function addDataToJsonObject(key, value)
{
  myData[key].push(value);
}


function getSizeOfJsonObject(data)
{
  var key, count = 0;
  for(key in data) {
  if(data.hasOwnProperty(key)) {
    count++;
  }
  }
  return count;
}


var ready = false;
var eurecaServer;
var player;
var playerList;   
var myId=0;
var cursors;
var burgers;
var broccolis;
var player;
var scoreText;
var burgerEaten=[];
var burgerCount=0;


var eurecaClientSetup = function() {
    //create an instance of eureca.io client
    var eurecaClient = new Eureca.Client();
    
    eurecaClient.ready(function (proxy) { 
        // envoyerMessage(); 
        console.log('function ready is called');      
        eurecaServer = proxy;
        eurecaServer.startGame();
    });
    

     eurecaClient.onConnectionRetry(function (socket) {
            console.log("Change server");
            // quitGame();
            document.location.href="http://localhost:3000";
        });

    //methods defined under "exports" namespace become available in the server side
    
    eurecaClient.exports.setId = function(id)
    { 
        myId = id;
        create();
        eurecaServer.handshake();
        ready = true;
    }    
    
    eurecaClient.exports.spawnEnemy = function(i, x, y)
    {
        
        if (i == myId) return; 
        var peng=new player(i, game, player);
        playerList[i] = peng;
        // console.log(playerList);

    }

    eurecaClient.exports.kill = function(id)
    {   
        if (playerList[id]) {
            playerList[id].kill();
            console.log('killing ', id, playerList[id]);
        }
    }

    eurecaClient.exports.updateState = function(id, state)
    {
    
        if (playerList[id])  {
            playerList[id].cursor = state;
            playerList[id].player.x = state.x;
            playerList[id].player.y = state.y;
            playerList[id].update();
        }
        eurecaServer.saveScore(id, playerList[id].player.score);
        eurecaServer.savePosition({"x": playerList[id].player.x, "y" : playerList[id].player.y});
    }


    eurecaClient.exports.updateBurger=function(burgerEaten)
    {
        // console.log("burgerEaten : "+JSON.stringify(burgerEaten));
        for(var s in burgerEaten)
        {
            for(var i=0; i<burgers.length;i++)
                {
                    var myBurger=burgers.getAt(i).body;
                     if(myBurger.x==burgerEaten[s].x && myBurger.y==burgerEaten[s].y)
                    {
                        console.log("I am in updateBurger :) ");
                        burgers.getAt(i).kill();
                    }

                }
        }
    }

    eurecaClient.exports.updateWinner=function(theWinner)
    {
        // 8 burger for each 10 point ---> score = 400
        console.log("Maximum score: "+burgerCount*10);
        console.log("Winner score: "+theWinner.score);
        console.log("Available count: "+burgers.length);
        if(burgers.length==0){
             if(playerList[theWinner.id].player.score==burgerCount*10)
            {
                scoreText.text="The winner's ID is : "+theWinner.id;
            }
        }
    }

    eurecaClient.exports.updateScore=function(id, jsonScore)
    {
        console.log("trace player list: "+playerList[id]);
        playerList[id].player.score=jsonScore.score;
        scoreText.text='Score: ' + jsonScore.score;
    }

    eurecaClient.exports.getPositionOfplayer=function(id)
    {
        return {"x": playerList[id].player.x, "y": playerList[id].player.y};
    }

    eurecaClient.exports.updatePositionOfplayer=function(id, peng)
    {
        playerList[id].player.x = peng.x;
        playerList[id].player.y = peng.y;
    }
}

    


var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', { preload: preload, create: eurecaClientSetup, update: update, quitGame: quitGame});

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('burger', 'assets/burger.png');
    game.load.image('broccoli', 'assets/broccoli.png');
    game.load.image('ground', 'assets/platform.png');
    //game.load.spritesheet('player', 'assets/dude.png');
    game.load.spritesheet('player', 'assets/dude.png', 32, 48);
}

player = function (index, game) {
    
    this.cursor = {
        left:false,
        right:false,
        up:false,
        down:false,

    }

    this.input = {
        left:false,
        right:false,
        up:false,
        down:false
    }

    this.game = game;
    this.player = game.add.sprite(48, game.world.height - 150, 'player');
    
    this.player.animations.add('left', [0, 1, 2, 3], 10, true);
    this.player.animations.add('turn', [4], 20, true);
    this.player.animations.add('right', [5, 6, 7, 8], 10, true);


    game.physics.enable(this.player, Phaser.Physics.ARCADE);
    game.camera.follow(this.player);


    this.player.body.collideWorldBounds = true;
    this.player.body.bounce.y = 0.2;
    this.player.body.setSize(20, 32, 5, 16);

    this.player.score=0;
    this.player.id = index;
   
};


player.prototype.kill = function() {
    this.player.kill();
}


player.prototype.update = function() {
      var inputChanged = (
        this.cursor.left != this.input.left ||
        this.cursor.right != this.input.right ||
        this.cursor.up != this.input.up ||
        this.cursor.down != this.input.down
    );
    
    
    if (inputChanged)
    {
        console.log("in input changed condition");
        //Handle input change here
        //send new values to the server        
        if (this.player.id == myId)
        {
            // send latest valid state to the server
            this.input.x = this.player.x;
            this.input.y = this.player.y;
            eurecaServer.handleKeys(burgerEaten, this.input);
        }
    }

   
    if(this.input.up) {
      this.player.y -= 10;
    }
    else if(this.input.down) {
      this.player.y += 10;
    }
    if(this.input.left) {
      this.player.animations.play('left');
      this.player.x -= 10;
    }
    else if(this.input.right) {
     this.player.animations.play('right');
      this.player.x += 10;
    }

};



function create() {
    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //A simple background for our game
    game.add.sprite(0, 0, 'sky');

    //  Finally some burgers to collect
    burgers = game.add.group();

    // Broccolis group
    broccolis = game.add.group();

    //  We will enable physics for any burger that is created in this group
    burgers.enableBody = true;
    broccolis.enableBody = true;

    playerList = {};
    
    player = new player(myId, game);
    playerList[myId] = player;

    
    createBurgers();
    createBroccolis();

    //  Our controls
    cursors = game.input.keyboard.createCursorKeys();

    //  The score
    scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });


}



function createBurgers(){
     for (var i = 0; i < 9; i++)
    {
       //  Create a burger inside of the 'burgers' group
       for(var j=0;j<5;j++)
       {
         if(j%2 == 0){
              var burger = burgers.create(i * 95, 150+50*j, 'burger');
              burgerCount++;
         }
       
       }
    }
}

function createBroccolis(){
     for (var i = 0; i < 9; i++)
    {
       //  Create a burger inside of the 'burgers' group
       for(var j=0;j<5;j++)
       {
        if(j%2 != 0){
            broccolis.create(i * 95, 150+50*j, 'broccoli');
        }
       }
    }
}


function update() {

     //do not update if client not ready

    if (!ready) return;

    player.input.left = cursors.left.isDown;
    player.input.right = cursors.right.isDown;
    player.input.up = cursors.up.isDown;
    player.input.down=cursors.down.isDown;

    for(var i in playerList)
    {
        //  call the collectStar function when a player overlaps with a s
        game.physics.arcade.overlap(playerList[i].player, burgers, eatBurger, null, this);
        playerList[i].update();
       
    }


}

 function eatBurger (player, burger) {
    burger.kill();
    var obj={"x" : "0", "y": "0"};
    obj.x=burger.x;
    obj.y=burger.y;

    //save (x,y) of burgers 
    burgerEaten.push(obj);
    player.score+=10;

    scoreText.text = 'Score: ' + player.score;

    //Remove the eaten burger
    burgers.remove(burger);
}

function eatBroccoli(player, broccoli) {
    broccoli.kill();
    var obj={"x" : "0", "y": "0"};
    obj.x=broccoli.x;
    obj.y=broccoli.y;

    player.score+=10;
    scoreText.text = 'Score: ' + player.score;

    //Remove the eaten broccoli
    broccolis.remove(broccoli);
}



function quitGame(){
    console.log("in quitGame");
    game.destroy();
}



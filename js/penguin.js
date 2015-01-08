var ready = false;
var eurecaServer;
var penguin;
var penguinList;   
var myId=0;
var cursors;
var burgers;
var player;
var scoreText;
var burgerEaten=[];


var eurecaClientSetup = function() {
    // var uRi='http://localhost:'+port;
    //create an instance of eureca.io client
    var eurecaClient = new Eureca.Client();
    
    eurecaClient.ready(function (proxy) { 
        // envoyerMessage(); 
        console.log('function ready is called');      
        eurecaServer = proxy;
        eurecaServer.updateGame();
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
        var peng=new Penguin(i, game, penguin);
        penguinList[i] = peng;
        // console.log(penguinList);

    }

    eurecaClient.exports.kill = function(id)
    {   
        if (penguinList[id]) {
            penguinList[id].kill();
            console.log('killing ', id, penguinList[id]);
        }
    }

    eurecaClient.exports.updateState = function(id, state)
    {
    
        if (penguinList[id])  {
            penguinList[id].cursor = state;
            penguinList[id].penguin.x = state.x;
            penguinList[id].penguin.y = state.y;
            penguinList[id].update();
        }
        eurecaServer.saveScore(id, penguinList[id].penguin.score);
        eurecaServer.savePosition({"x": penguinList[id].penguin.x, "y" : penguinList[id].penguin.y});
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
        if(burgers.countLiving()==0)
        {
            scoreText.text="The winner's ID is : "+theWinner.id;
        }
    }

    eurecaClient.exports.updateScore=function(id, jsonScore)
    {
        penguinList[id].penguin.score=jsonScore.score;
        scoreText.text='Score: ' + jsonScore.score;
    }

    eurecaClient.exports.getPositionOfPenguin=function(id)
    {
        return {"x": penguinList[id].penguin.x, "y": penguinList[id].penguin.y};
    }

    eurecaClient.exports.updatePositionOfPenguin=function(id, peng)
    {
        // console.log("ID : "+id);
        // console.log("penguin.x : "+peng.x+"penguin.y : "+peng.y);
        // console.log("penguin : "+penguinList[id].penguin.x);
        penguinList[id].penguin.x = peng.x;
        penguinList[id].penguin.y = peng.y;
    }
}

    


var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', { preload: preload, create: eurecaClientSetup, update: update, quitGame: quitGame});

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('burg', 'assets/burger.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.spritesheet('pengo', 'assets/peng.png');
}

Penguin = function (index, game) {
    
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
    this.penguin = game.add.sprite(48, game.world.height - 150, 'pengo');
    game.physics.enable(this.penguin, Phaser.Physics.ARCADE);
    this.penguin.body.collideWorldBounds = true;
    this.penguin.score=0;
    this.penguin.id = index;
   
};


Penguin.prototype.kill = function() {
    this.penguin.kill();
}


Penguin.prototype.update = function() {
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
        if (this.penguin.id == myId)
        {
            // send latest valid state to the server
            this.input.x = this.penguin.x;
            this.input.y = this.penguin.y;
            eurecaServer.handleKeys(burgerEaten, this.input);
        }
    }

   
    if(this.input.up) {
      this.penguin.y -= 10;
    }
    else if(this.input.down) {
      this.penguin.y += 10;
    }
    if(this.input.left) {
      this.penguin.x -= 10;
    }
    else if(this.input.right) {
      this.penguin.x += 10;
    }

};



function create() {

   
    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //A simple background for our game

    game.add.sprite(0, 0, 'sky');

    //  Finally some burgers to collect

    burgers = game.add.group();

    //  We will enable physics for any burger that is created in this group
        
    burgers.enableBody = true;


    penguinList = {};
    
    player = new Penguin(myId, game);
    penguinList[myId] = player;

    
    
    for (var i = 0; i < 9; i++)
    {
       //  Create a burger inside of the 'burgers' group
       for(var j=0;j<5;j++)
       {
         var burger = burgers.create(i * 95, 150+50*j, 'burg');
       }
    }

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    //  The score

    scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });


}

function update() {

     //do not update if client not ready

    if (!ready) return;

    player.input.left = cursors.left.isDown;
    player.input.right = cursors.right.isDown;
    player.input.up = cursors.up.isDown;
    player.input.down=cursors.down.isDown;

    for(var i in penguinList)
    {
        //  call the collectStar function when a penguin overlaps with a s
        game.physics.arcade.overlap(penguinList[i].penguin, burgers, eatBurger, null, this);
        penguinList[i].update();
       
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
    // console.log("Player ID is : "+player.id+" The Score is : "+player.score);
    scoreText.text = 'Score: ' + player.score;
}



function quitGame(){
    console.log("in quitGame");
    game.destroy();
} //end quitGame function



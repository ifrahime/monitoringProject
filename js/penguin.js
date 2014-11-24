var ready = false;
var eurecaServer;
var penguin;
var penguinList;   
var myId=0;
var cursors;
var burgers;
var player;
var scoreText;
var burgerNumber=45;
var burgerEaten=[];

var eurecaClientSetup = function() {
    //create an instance of eureca.io client
     var eurecaClient = new Eureca.Client();
    
    eurecaClient.ready(function (proxy) {        
        eurecaServer = proxy;
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
        console.log(penguinList);

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
    }


    eurecaClient.exports.updateBurger=function(burgerEaten)
    {
        for(var s in burgerEaten)
        {
            for(var i=0; i<burgers.length;i++)
                {
                    var myBurger=burgers.getAt(i).body;
                     if(myBurger.x==burgerEaten[s].x && myBurger.y==burgerEaten[s].y)
                    {
                        burgers.getAt(i).kill();
                    }

                }
        }
         
    }

   



}




var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', { preload: preload, create: eurecaClientSetup, update: update });

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('burg', 'assets/burger.png');
    game.load.image('pengo', 'assets/peng.png');
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
    this.penguin.score=0;

    this.penguin.id = index;
    game.physics.enable(this.penguin);
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


//  A simple background for our game

    game.add.sprite(0, 0, 'sky');

    penguinList = {};
    
    player = new Penguin(myId, game);
    penguinList[myId] = player;


    //  Finally some burgers to collect

    burgers = game.add.group();

    //  We will enable physics for any burger that is created in this group
        
    burgers.enableBody = true;

    
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
    
    // Removes the burger from the screen

    burger.kill();
    var obj={"x" : "0", "y": "0"};
    obj.x=burger.x;
    obj.y=burger.y;
    //save (x,y) of burgers 
    burgerEaten.push(obj);
    player.score+=10;
    // console.log("The score of the player is : "+player.score);
    burgerNumber--;
    scoreText.text = 'Score: ' + player.score;

    // if(starNumber==0)
    // {
    //     scoreText.text='Congratulations you Win!';
    // }

}

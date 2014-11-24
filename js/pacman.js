var ready = false;
var eurecaServer;
var dude;
var dudeList;   
var myId=0;
var cursors;
var stars;
var player;
var score=0;
var scoreText;
var starNumber=45;
var starKilled=[];

var eurecaClientSetup = function() {
    //create an instance of eureca.io client
    var eurecaClient = new Eureca.Client();
    
    eurecaClient.ready(function (proxy) {        
        eurecaServer = proxy;
    });
    
    
    //methods defined under "exports" namespace become available in the server side
    
    eurecaClient.exports.setId = function(id)
    {
        //create() is moved here to make sure nothing is created before uniq id assignation
        myId = id;
        create();
        eurecaServer.handshake();
        ready = true;
    }    
    
    eurecaClient.exports.spawnEnemy = function(i, x, y)
    {
        
        if (i == myId) return; //this is me
        
        console.log('SPAWN');
        var dd=new Penguin(i, game, dude);
        dudeList[i] = dd;
        console.log(dudeList);

    }

    eurecaClient.exports.kill = function(id)
    {   
        if (dudeList[id]) {
            dudeList[id].kill();
            console.log('killing ', id, dudeList[id]);
        }
    }

    eurecaClient.exports.updateState = function(id, state)
    {
    
        if (dudeList[id])  {
            dudeList[id].cursor = state;
            dudeList[id].penguin.x = state.x;
            dudeList[id].penguin.y = state.y;
            dudeList[id].update();
            // for(var z in starKilled)
            // {
            //     for(var i=0; i<stars.length;i++)
            //     {
            //         var monStar=stars.getAt(i).body;
            //         if(monStar.x==starKilled[z].x && monStar.y==starKilled[z].y)
            //         {
            //             stars.getAt(i).body.kill();
            //         }
            //     }
            // }
        }
    }
    eurecaClient.exports.updateStars=function(starKilled)
    {
        for(var s in starKilled)
        {
            // console.log(starKilled[s]);
            for(var i=0; i<stars.length;i++)
                {
                    var monStar=stars.getAt(i).body;
                     if(monStar.x==starKilled[s].x && monStar.y==starKilled[s].y)
                    {
                        stars.getAt(i).kill();
                        // console.log("X of Star : "+monStar.x+"Y of star : "+monStar.y)
                    }

                }
        }
         
    }
}





var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', { preload: preload, create: eurecaClientSetup, update: update });

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('star', 'assets/star.png');
    game.load.image('dude', 'assets/peng.png');
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

    var score=0;

    this.game = game;
    this.penguin = game.add.sprite(48, game.world.height - 150, 'dude');

    this.penguin.id = index;
    game.physics.enable(this.penguin);
};


Penguin.prototype.kill = function() {
    this.penguin.kill();
}


Penguin.prototype.update = function() {
    
    // for (var i in this.input) this.cursor[i] = this.input[i];   
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

            eurecaServer.handleKeys(starKilled, this.input);
            
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

    dudeList = {};
    
    player = new Penguin(myId, game);
    dudeList[myId] = player;


    //  Finally some stars to collect
    stars = game.add.group();

    //  We will enable physics for any star that is created in this group
    stars.enableBody = true;

    
    for (var i = 0; i < 9; i++)
    {
       //  Create a star inside of the 'stars' group
       for(var j=0;j<5;j++)
       {
         var star = stars.create(i * 95, 150+50*j, 'star');
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

    for(var i in dudeList)
    {
        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        game.physics.arcade.overlap(dudeList[i].penguin, stars, collectStar, null, this);
        dudeList[i].update();
        // update stars in the game 
        // for(var k in stars._container.children.length)
        // {
            // console.log("nombre de star : "+stars.children.length);
        // }

        // stars.update();
    }
}

 function collectStar (player, star) {
    
    // Removes the star from the screen
    star.kill();
    var obj={"x" : "0", "y": "0"};
    obj.x=star.x;
    obj.y=star.y;
    starKilled.push(obj);
    //save (x,y) star 
    // starKilled[]
    // starNumber--;
    // //  Add and update the score
    // score += 10;
    // scoreText.text = 'Score: ' + score;

    // if(starNumber==0)
    // {
    //     scoreText.text='Congratulations you Win!';
    // }

}

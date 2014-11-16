var ready = false;
var eurecaServer;
var dude;
var dudeList;   
var myId=0;
 
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
        var dd=new Pacman(i, game, dude);
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
            dudeList[id].pacman.x = state.x;
            dudeList[id].pacman.y = state.y;
            dudeList[id].update();
        }
    }
    
}


var player;
var cursors;
var stars;
var score = 0;
var scoreText;
var fraiseNumber=40;



var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: eurecaClientSetup, update: update });

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/peng.png', 48, 48);
}

Pacman = function (index, game, player) {
    this.cursor = {
        left:false,
        right:false,
        up:false,
        down:false      
    }

    this.input = {
        left:false,
        right:false,
        up:false,
        down:false
    }

    var x = 48;
    var y = game.world.height - 150;

    this.game = game;
    this.player = player;
    this.pacman = game.add.sprite(x, y, 'dude');

    this.pacman.id = index;
    game.physics.arcade.enable(this.pacman);
    // //  Player physics properties. Give the little guy a slight bounce.
    this.pacman.body.bounce.y = 0.2;
    // player.body.gravity.y =300;
    this.pacman.body.collideWorldBounds = true;


};


Pacman.prototype.kill = function() {
    this.pacman.kill();
}


Pacman.prototype.update = function() {
    
    // for (var i in this.input) this.cursor[i] = this.input[i];   
      var inputChanged = (
        this.cursor.left != this.input.left ||
        this.cursor.right != this.input.right ||
        this.cursor.up != this.input.up ||
        this.cursor.down != this.input.down
    );
    
    
    if (inputChanged)
    {
        //Handle input change here
        //send new values to the server        
        if (this.pacman.id == myId)
        {
            // send latest valid state to the server
            this.input.x = this.pacman.x;
            this.input.y = this.pacman.y;
            
            
            eurecaServer.handleKeys(this.input);
            
        }
    }

    this.pacman.body.velocity.y = 0;
    this.pacman.body.velocity.x = 0;

    if(this.cursor.up) {
      this.pacman.body.velocity.y -= 50;
    }
    else if(this.cursor.down) {
      this.pacman.body.velocity.y += 50;
    }
    if(this.cursor.left) {
      this.pacman.body.velocity.x -= 50;
    }
    else if(this.cursor.right) {
      this.pacman.body.velocity.x += 50;
    }
};



function create() {


//  A simple background for our game
    game.add.sprite(0, 0, 'sky');

    dudeList = {};
    
    player = new Pacman(myId, game, dude);
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
        game.physics.arcade.overlap(dudeList[i].pacman, stars, collectStar, null, this);
        dudeList[i].update();
    }
}

 function collectStar (player, star) {
    
    // Removes the star from the screen
    star.kill();
    fraiseNumber--;
    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;

    if(fraiseNumber==0)
    {
        scoreText.text='Congratulations you Win!';
    }

}

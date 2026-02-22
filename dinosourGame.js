let player;

//dinosaur class
class Dinosaur extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'dino');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true); // Prevents walking off left/right
    }
}

//obstical class
class Obstacle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'obstacle');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
    }
    
}

//preload() characters
function preload() {
    this.load.image('dino', 'assets/dino.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.image('obstacle', 'assets/cactus.png');
}

let cursors; 

function create() {
    //Static group for ground so it stays in gplace
    let platforms = this.physics.add.staticGroup();
    
    // Capture arrow keys for movement
    cursors = this.input.keyboard.createCursorKeys();
  
    // Create ground at the bottom of the screem
    let ground = platforms.create(1200, 530, 'ground');
    ground.setScale(1.2).refreshBody();  

    //create dino coord 100 200
    player = new Dinosaur(this, 500, 200);

    //obsticale coord 3000 500
    obsticale = new Obstacle(this, 3000, 500);
    obsticale.setScale(0.2).refreshBody(); // Scale down the obstacle if needed

    //allow to collide with ground and NOT fall
    this.physics.add.collider(player, platforms);
}

function update() 
{
    obsticale.setVelocityX(-350); // Adjust speed as needed
    // Reset obstacle position when it goes off screen
    if (obsticale.x < 110) { // Assuming obstacle width is less than 50
        obsticale.setX(3000); // Reset to starting position

    }

    // Check for spacebar input to jump
    if (cursors.space.isDown) { // Only jump if on the ground
        player.setVelocityY(-600); // Adjust jump strength as needed
    }

    //if it collides with obstical restart the game
    this.physics.add.collider(player, obsticale, () => {
        console.log('Game Over!');
        this.scene.restart(); // Restart the scene on collision
    }, null, this);
    
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 2375,
    height: 1000,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 }, // Increased gravity for a better "jump" feel
            debug: true 
        }
    },
    scene: { preload: preload, create: create, update: update }
};
const game = new Phaser.Game(config);

// Add this to the bottom of dinosourGame.js
window.dinoJump = function() {
    if (player && (player.body.touching.down || player.body.blocked.down)) {
        player.setVelocityY(-600);
    }
}

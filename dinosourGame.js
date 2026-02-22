let player;
let jumpCounter = 0;
let isJumping = false;
let gameOverText;

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
    this.load.image('ground', 'assets/ground1.png');
    this.load.image('obstacle', 'assets/cactus.png');
}

let cursors; 
let jumpText;


function create() {
    //Static group for ground so it stays in gplace
    let platforms = this.physics.add.staticGroup();
    
    // Capture arrow keys for movement
    cursors = this.input.keyboard.createCursorKeys();
  
    // Create ground at the bottom of the screem
    let ground = platforms.create(3000, 2400, 'ground');
    ground.setScale(25, 15).refreshBody();  

    //create dino coord 100 200
    player = new Dinosaur(this, 2500, 2300);

    //obsticale coord 3000 500
    obsticale = new Obstacle(this, 5000, 2500);
    obsticale.setScale(0.5).refreshBody(); // Scale down the obstacle if needed

    //allow to collide with ground and NOT fall
    this.physics.add.collider(player, platforms);

    jumpText = this.add.text(2640, 150, 'Jump Counter: 0', {
        font: '64px Arial',     // Font size and family
        fill: '#000000',        // Text color
        fontStyle: 'bold'       // Make the text bold
    });
    jumpText.setDepth(10);      // Make sure it appears above other objects
    jumpText.setScrollFactor(0); // Keep text fixed on camera

    gameOverText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'GAME OVER\n Jumps: ' + jumpCounter + '\nRestarting...',
        {
            font: '96px Arial',       // Big font
            fill: '#FF0000',          // Red color
            fontStyle: 'bold',        // Bold
            align: 'center'
        }
    );

    gameOverText.setOrigin(0.5);       // Center the text
    gameOverText.setScrollFactor(0);   // Stay fixed on camera
    gameOverText.setVisible(false);    // Hide initially
}

function update() 
{
    if (player.body.touching.down || player.body.blocked.down) {
        isJumping = false;
    }
    obsticale.setVelocityX(-500); // Adjust speed as needed
    // Reset obstacle position when it goes off screen
    if (obsticale.x < 1200) { // Assuming obstacle width is less than 50
        obsticale.setX(5000); // Reset to starting position

    }

    // Check for spacebar input to jump
    if (cursors.space.isDown && (player.body.touching.down || player.body.blocked.down)) { // Only jump if on the ground
        player.setVelocityY(-650); // Adjust jump strength as needed
    }

    //if it collides with obstical restart the game
    this.physics.add.collider(player, obsticale, () => {
        console.log('Game Over');

        if (gameOverText) {
            gameOverText.setText('GAME OVER\n Jumps: ' + jumpCounter + '\nRestarting...'); // Update text with jump count
            gameOverText.setVisible(true); // Show "Game Over" text
        }
        player.setVelocity(0, 0); // Stop player movement
        obsticale.setVelocity(0, 0); // Stop obstacle movement
        player.body.moves = false; // Prevent player from moving
        obsticale.body.moves = false; // Prevent obstacle from moving

        this.time.delayedCall(2000, () => {
            jumpCounter = 0; // Reset jump counter
            this.scene.restart(); // Restart the scene on collision
        });
        
    }, null, this);
    
}

//Configuration of game parameters, the brain basically
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
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
    // Only jump if player is on the ground AND not currently jumping
    if (player && (player.body.touching.down || player.body.blocked.down) && !isJumping) {
        player.setVelocityY(-600); // Make the dino jump
        isJumping = true;          // Flag that dino is in the air

        // Increment jump counter
        jumpCounter++;

        // Update the on-screen counter if it exists
        if (jumpText) {
            jumpText.setText('Jump Counter: ' + jumpCounter);
        }
    }
}
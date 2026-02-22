let player;
let obsticale;
let jumpCounter = 0;
let isJumping = false;
let jumpText;
let isGameOver = false;
let scoreResetReady = true;

function preload() {
    this.load.spritesheet('dino', 'assets/dinoGame/dinoS.png', {
        frameWidth: 100,
        frameHeight: 100

    
    });
    this.load.image('ground', 'assets/dinoGame/floor.png');
    this.load.image('obstacle', 'assets/dinoGame/cactus.png');
}

function create() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let platforms = this.physics.add.staticGroup();


    jumpText = this.add.text(this.cameras.main.width - 20, 20, 'Jump Counter: 0', {
        fontFamily: 'sans', 
        fontSize: '32px',
        fill: '#FFFFFF',
        fontStyle: 'bold'
    });
    
    jumpText.setOrigin(1, 0); 
    jumpText.setDepth(100);
    jumpText.setScrollFactor(0);



    gameOverText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'GAME OVER',
        {
            fontFamily: 'sans',
            fontSize: '80px',
            fill: 'red',
            align: 'center'
        }
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setVisible(false);
    gameOverText.setDepth(100);


    let ground = platforms.create(width / 2, height - 20, 'ground');
    ground.setDisplaySize(width, 40).refreshBody();


    // animation
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('dino', { start: 0, end: 1 }), 
            frameRate: 10,
            repeat: -1 
        });
    
        this.anims.create({
            key: 'jump',
            frames: [{ key: 'dino', frame: 2 }],
            frameRate: 10
        });
    
        player = this.physics.add.sprite(100, window.innerHeight - 100, 'dino');
        player.setCollideWorldBounds(true);
        player.setScale(0.5);
        player.refreshBody();
        player.play('run');
        
    obsticale = this.physics.add.sprite(width + 200, height - 80, 'obstacle');
    obsticale.setDepth(2);

    obsticale.setScale(0.2); 
    obsticale.refreshBody();

    obsticale.body.setAllowGravity(false); 
    obsticale.setImmovable(true);

    this.physics.add.collider(player, platforms);
}

function update() {
    if (isGameOver) return; 

    const width = this.cameras.main.width;

    if (player.body.touching.down || player.body.blocked.down) {
        isJumping = false;
        if (player.anims.currentAnim.key !== 'run') player.play('run');
    } else {
        player.play('jump', true);
    }

    obsticale.setVelocityX(-450); 

    if (obsticale.x < player.x && scoreResetReady) {
        jumpCounter++;
        jumpText.setText('Score: ' + jumpCounter);
        scoreResetReady = false;
    }

    if (obsticale.x < -100) {
        obsticale.x = width + Math.random() * 400;
        scoreResetReady = true;
    }

    this.physics.add.overlap(player, obsticale, () => {
        die.call(this);
    }, null, this);
}

function die() {
    isGameOver = true;
    
    this.physics.pause();
    
    player.anims.stop();
    player.setTint(0xff0000); 

    if (gameOverText) {
        gameOverText.setText('GAME OVER\nScore: ' + jumpCounter + '\nRestarting...');
        gameOverText.setVisible(true);
    }

    this.time.delayedCall(2000, () => {
        isGameOver = false;
        jumpCounter = 0;
        scoreResetReady = true;
        this.scene.restart();
    });
}


const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

window.dinoJump = function() {
    if (!isGameOver && player && (player.body.touching.down || player.body.blocked.down)) {
        player.setVelocityY(-850); 
    }
}
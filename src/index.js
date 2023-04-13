const Phaser = window.Phaser;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 850 },
      debug: true
    },
  },
  backgroundColor: 0xabcdef,
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);
// Add the platform dimensions
const platformWidth = 100;
const platformHeight = 32;

function preload() {
  this.load.image('background', './assets/space.png');
  this.load.image('player', './assets/MC.png');
  this.load.image('platform', './assets/platform.png');
  this.load.image('basePlatform', './assets/basePlatform.png');
  this.load.image('spikes', './assets/spikes.png');
  //music files
  this.load.audio('backgroundMusic', './assets/CelesteMIDI.mp3');
  this.load.audio('gameOverMusic', './assets/DustMIDI.mp3');
}

let background;
let player;
let platforms;
let totalPlatforms = 0;
let cursors;
let score = 0;
let scoreText;
let backgroundMusic;
let gameOverMusic;
let isGameOver = false;
let highscore = 0;
let rotationSpeed = 0.01;


function create() {
// Add background image
background = this.add.image(400, 300, 'background');
background.setDepth(-1);
background.setScale(config.width / background.width * 1.5, config.height / background.height * 1.5);


// Create platforms group with physics
platforms = this.physics.add.group({
  allowGravity: false,
  immovable: true,
});

// Create base platform
const basePlatform = this.physics.add.staticGroup();
const base = basePlatform.create(config.width / 2, config.height - 10, 'basePlatform').setScale(1.5, .8);
base.refreshBody();

// Change base platform to spikes after 5 seconds
this.time.delayedCall(10000, () => {
  basePlatform.remove(base, true, true);
  const spikes = this.physics.add.staticGroup();
  const spike = spikes.create(config.width / 2, config.height - 10, 'spikes').setScale(1.5, .8);
  spike.refreshBody();
  this.physics.add.collider(player, spikes, gameOver, null, this);
});

// Create player
player = this.physics.add.sprite(100, 450, 'player').setBounce(0.0).setCollideWorldBounds(true).setScale(1.5);
player.setCollideWorldBounds(true);
player.setDepth(1);
this.jumps = 0; //track jumps for the double jump feature
// Add collider between player and base platform
this.physics.add.collider(player, basePlatform);
// Create cursor keys for player movement
cursors = this.input.keyboard.createCursorKeys();
createPlatforms(this);

// Create score text
scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '36px', fill: '#ffffff' });
// Reset score
score = 0;
// Collision

this.lastPlatformY = config.height;
this.lastPlatformX = 0;

// Add background music
backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.3 });
backgroundMusic.play();

}

function createPlatforms(context) {
const platformSpeed = 2250000; // Changes the platform speed
addPlatform(context, platformSpeed);
}

function addPlatform(scene, platformTravelTime) {
const minYDistance = 200; // Minimum vertical distance between platforms
const y = Phaser.Math.Between(250, 650); // Random gap between 100 and 500
let x;

for (var i =0 ; i< 8; i++){
  const side = Phaser.Math.Between(0, 1); // Randomly choose left (0) or right (1) side
  if (side === 0) {
    x = 0;
  } else {
    x = config.width - platformWidth;
  }
  var topY = getTop();
  console.log(scene);
  var platform = scene.physics.add.sprite(x, topY - minYDistance, 'platform').setScale(1, 1);
 
  //const platformYVelocity = (config.height + platformHeight) / (platformTravelTime / 1000) * (score / 10 + 1);
  //platform.setVelocityY(platformYVelocity); // Increase the speed of platforms based on the score
  scene.physics.add.collider(player, platform);
  platforms.add(platform);
  totalPlatforms++;
  platforms.setVelocityY(50);
}
}
function getTop(){
var top = config.height;
platforms.children.iterate((current)=>{
  top = Math.min(top, current.y);
});

return top;
}

function gameOver() {
isGameOver = true;
player.setTint(0xff0000); // Tint the player red to indicate game over
scoreText.setTint(0xff0000); // Tint the score text red to indicate game over

// Stop all platform movement
platforms.setVelocityY(0);

// Stop background music and play game over music
backgroundMusic.stop();
gameOverMusic = this.sound.add('gameOverMusic', { loop: false, volume: 0.3 });
gameOverMusic.play();

// Display game over text
const gameOverText = this.add.text(config.width / 2, config.height / 2, 'GAME OVER', {
  fontSize: '64px',
  color: '#ffffff',
  align: 'center',
}).setOrigin(0.5);

const retryText = this.add.text(config.width / 2, config.height / 2 + 80, 'Press any key to retry', {
  fontSize: '32px',
  color: '#ffffff',
  align: 'center',
}).setOrigin(0.5);
if (score > highscore) {
  highscore = score;
}

// Display highscore text
const highscoreText = this.add.text(config.width / 2, config.height / 2 - 80, 'Highscore: ' + highscore, {
  fontSize: '32px',
  color: '#ffffff',
  align: 'center',
}).setOrigin(0.5);
// Pause the game and wait for any key press to restart
this.physics.pause();
this.input.keyboard.once('keydown', () => {
  // Stop game over music
  gameOverMusic.stop();

  // Restart background music
  backgroundMusic.play();

  // Restart the scene
  this.scene.restart();
  isGameOver = false;
});


}

function update() {
//console.log("In Update");
background.angle += rotationSpeed;

// Player movement
if (cursors.left.isDown) {
  player.setVelocityX(-260);
  player.setFlipX(true);
} else if (cursors.right.isDown) {
  player.setVelocityX(260);
  player.setFlipX(false);
} else {
  player.setVelocityX(0);
}

// Double jump
if (cursors.up.isDown && this.jumps < 2 && player.body.touching.down) {
  player.setVelocityY(-695);
  this.jumps = 1;
} else if (cursors.up.isDown && this.jumps === 1 && !player.body.touching.down) {
  player.setVelocityY(-695);
  this.jumps = 2;
}

// Reset when touching ground
if (player.body.touching.down) {
  this.jumps = 0;
}

// Move platforms down
platforms.children.iterate((platform) => {
  //console.log("***In Platform Iterate");

  //platform.y += 1;

  // Reset platform when it goes off the screen
  if (platform.y > config.height && !isGameOver) {
    //console.log("***Off Scrren?");
    platform.y = 0 - platform.width/2;
    platform.x = Phaser.Math.Between(40, 800);
    score++;
    scoreText.setText('score: ' + score);
  }
});
}



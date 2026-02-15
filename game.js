let platforms;
let isRespawning = false;

let npcs;
let interactKey;
let dialogueText;

let checkpointX = 100;
let checkpointY = 300;

// ✅ Eksik değişkenler eklendi
let giftCount = 0;
let giftText;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#ffffff',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let player;
let cursors;

function preload() {
  this.load.spritesheet(
    'player',
    'assets/player/player.png',
    { frameWidth: 32, frameHeight: 32 }
  );
}

function create() {
  platforms = this.physics.add.staticGroup();

  // ANA ZEMİN
  const groundLeft = this.add.rectangle(250, 430, 300, 40, 0x555555);
  this.physics.add.existing(groundLeft, true);
  platforms.add(groundLeft);

  const groundRight = this.add.rectangle(700, 430, 300, 40, 0x555555);
  this.physics.add.existing(groundRight, true);
  platforms.add(groundRight);

  // PLATFORMLAR
  const p1 = this.add.rectangle(300, 330, 120, 20, 0x777777);
  this.physics.add.existing(p1, true);
  platforms.add(p1);

  const p2 = this.add.rectangle(500, 260, 120, 20, 0x777777);
  this.physics.add.existing(p2, true);
  platforms.add(p2);

  const p3 = this.add.rectangle(650, 190, 120, 20, 0x777777);
  this.physics.add.existing(p3, true);
  platforms.add(p3);

  // ANİMASYONLAR
  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('player', { start: 1, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'idle',
    frames: [{ key: 'player', frame: 0 }],
    frameRate: 10
  });

  // OYUNCU
  player = this.physics.add.sprite(100, 300, 'player');
  player.setCollideWorldBounds(true);
  this.physics.world.setBounds(0, 0, 800, 1000);
  player.body.setSize(32, 32);

  this.physics.add.collider(player, platforms);

  // CHECKPOINT
  const checkpoint = this.add.rectangle(500, 220, 20, 40, 0xffff00);
  this.physics.add.existing(checkpoint, true);

  this.physics.add.overlap(player, checkpoint, () => {
    checkpointX = checkpoint.x;
    checkpointY = checkpoint.y - 50;
    checkpoint.fillColor = 0x00ff00;
  });

  // NPCler
  npcs = this.physics.add.staticGroup();

  function createNPC(scene, x, y, message, giftType) {
    const npc = scene.add.rectangle(x, y, 32, 48, 0x00ff00);
    scene.physics.add.existing(npc, true);
    npc.message = message;
    npc.giftType = giftType;
    npc.given = false;
    npcs.add(npc);
  }

  createNPC(this, 350, 290, 'İşte sana kedi! 🐱', 'cat');
  createNPC(this, 600, 160, 'Şapka aldın! 🎩', 'hat');

  // E tuşu
  interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

  // ✅ UI elementleri eklendi
  dialogueText = this.add.text(16, 50, '', { 
    fontSize: '18px', 
    fill: '#000',
    backgroundColor: '#ffffffdd',
    padding: { x: 10, y: 5 }
  });

  giftText = this.add.text(16, 16, 'Gifts: 0', { 
    fontSize: '20px', 
    fill: '#000',
    backgroundColor: '#ffffffdd',
    padding: { x: 10, y: 5 }
  });

  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (isRespawning) return;

  player.body.setVelocityX(0);

  if (cursors.left.isDown) {
    player.body.setVelocityX(-200);
    player.anims.play('walk', true);
    player.setFlipX(true);
  }
  else if (cursors.right.isDown) {
    player.body.setVelocityX(200);
    player.anims.play('walk', true);
    player.setFlipX(false);
  }
  else {
    player.anims.play('idle', true);
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.body.setVelocityY(-400);
  }

  if (player.y > 600 && !isRespawning) {
    respawnPlayer(this);
  }

  // ✅ NPC etkileşimi düzeltildi
  let nearNPC = false;

  npcs.getChildren().forEach(npc => {
    const distance = Phaser.Math.Distance.Between(
      player.x, player.y, npc.x, npc.y
    );

    if (distance < 50) {
      nearNPC = true;
      
      // E tuşuna basıldığında ve daha önce verilmediyse
      if (Phaser.Input.Keyboard.JustDown(interactKey) && !npc.given) {
        dialogueText.setText(npc.message);
        npc.given = true;
        npc.setFillStyle(0x888888); // renk değiştir (kullanıldı)

        giftCount++;
        giftText.setText('Gifts: ' + giftCount);

        // 2 saniye sonra diyalogu temizle
        this.time.delayedCall(2000, () => {
          dialogueText.setText('');
        });
      }
    }
  });

  // Yakında NPC yoksa diyalogu temizle
  if (!nearNPC) {
    dialogueText.setText('');
  }
}

function respawnPlayer(scene) {
  isRespawning = true;
  player.setVelocity(0, 0);
  player.setVisible(false);

  scene.time.delayedCall(300, () => {
    player.setPosition(checkpointX, checkpointY);
    player.setVisible(true);
    isRespawning = false;
  });
}
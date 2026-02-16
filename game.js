let platforms;
let isRespawning = false;
let isTalking = false; // Oyuncu konuşuyor mu?
let npcs;
let portals;
let checkpoints = [];
let interactKey; // E tuşu
let enterKey;    // Enter tuşu
let dialogueBox; 
let dialogueText;
let promptText; // "E'ye bas" yazısı
let giftCount = 0;
let giftText;
let checkpointX = 100;
let checkpointY = 350;
let currentLevel = 1;
let gameFinished = false;

const config = {
    type: Phaser.AUTO,
    // Ekran boyutlarını pencere boyutuna eşitle
    width: window.innerWidth, 
    height: window.innerHeight,
    backgroundColor: '#87CEEB',
    scale: {
        // Oyunun ekrana sığmasını sağlayan mod
        mode: Phaser.Scale.FIT,
        // Oyunu hem yatay hem dikeyde ortala
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: true
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
let currentScene;
let nearbyInteractive = null; // Yanında durduğumuz obje (NPC veya Portal)

function preload() {
    this.load.spritesheet('player', 'assets/player/player.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('portal', 'assets/portal/portal.png');
    this.load.image('npc1', 'assets/npc/npc1.png');
    this.load.image('longWood', 'assets/platforms/long_wood.png');
    this.load.image('middleWood', 'assets/platforms/middle_wood.png');
    this.load.image('shortWood', 'assets/platforms/short_wood.png');
    this.load.image('skyBg', 'assets/background/skyBg.png');
}

function create() {
    currentScene = this;
    
    // Animasyonlar
    if (!this.anims.exists('walk')) {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    }
    if (!this.anims.exists('idle')) {
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 10
        });
    }

    // Tuş Tanımları
    cursors = this.input.keyboard.createCursorKeys();
    interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // UI Elemanları
    giftText = this.add.text(16, 16, 'Gifts: ' + giftCount, { 
        fontSize: '20px', fill: '#fff', backgroundColor: '#000000aa', padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(100);

    promptText = this.add.text(400, 300, '[E] Etkileşime Geç', {
        fontSize: '16px', fill: '#ffff00', backgroundColor: '#000', padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    createDialogueBox(this);

    // Bölümü Başlat (Oyuncu burada oluşuyor)
    setupLevel(this, currentLevel);

    window.addEventListener('resize', () => {
        this.scale.resize(window.innerWidth, window.innerHeight);
    });
}

function setupLevel(scene, level) {
    if (platforms) platforms.clear(true, true);
    if (npcs) npcs.clear(true, true);
    if (portals) portals.clear(true, true);
let bg = scene.add.image(window.innerWidth / 2, window.innerHeight / 2, 'skyBg'); 
    
    // Görseli tarayıcının o anki genişlik ve yüksekliğine zorla
    bg.setDisplaySize(window.innerWidth, window.innerHeight);
    
    bg.setScrollFactor(0); // Kamera ilerlese de arka plan takip etmesin, sabit kalsın
    bg.setDepth(-1);       // En arkada dursun
    checkpoints = [];

    platforms = scene.physics.add.staticGroup();
    npcs = scene.physics.add.staticGroup();
    portals = scene.physics.add.staticGroup();

    scene.physics.world.setBounds(0, 0, 2000, 600);
    scene.physics.world.checkCollision.down = false; 
    scene.cameras.main.setBounds(0, 0, 2000, 600);

    if (level === 1) {
        scene.cameras.main.setBackgroundColor('#87CEEB'); 
        createLongWood(scene, 200, 500);
        createMiddleWood(scene, 450, 420);
        createShortWood(scene, 650, 360);
        createMiddleWood(scene, 850, 300);
        createLongWood(scene, 1100, 500);

        createNPC(scene, 1150, 440, '🎩 Merhaba!\nBu senin ilk hediyen.\n(Devam etmek için ENTER\'a bas)', 'hat');

        createShortWood(scene, 1400, 450, 100, 20, 0x8B4513);
        createLongWood(scene, 1600, 500, 200, 40, 0x6B8E23);
        createPortal(scene, 1650, 430, 2);

        playerReset(scene, 100, 400);
    }
    else if (level === 2) {
        scene.cameras.main.setBackgroundColor('#FFA07A'); 
        createLongWood(scene, 100, 500, 200, 40, 0x8B4513);
        createCheckpoint(scene, 100, 440);
        createShortWood(scene, 350, 450, 100, 20, 0xA0522D);
        createShortWood(scene, 550, 380, 100, 20, 0xA0522D);
        createShortWood(scene, 750, 300, 100, 20, 0xA0522D);
        createLongWood(scene, 1000, 300, 300, 20, 0xA0522D);
        createNPC(scene, 1050, 240, '🐱 İşte tatlı bir kedi!\nYanında götür.\n(Devam etmek için ENTER\'a bas)', 'cat');
        createShortWood(scene, 1300, 380, 80, 20, 0xA0522D);
        createShortWood(scene, 1500, 450, 80, 20, 0xA0522D);
        createLongWood(scene, 1800, 500, 200, 40, 0x8B4513);
        createPortal(scene, 1850, 430, 3);
        playerReset(scene, 100, 400);
    }
    else if (level === 3) {
        scene.cameras.main.setBackgroundColor('#9370DB'); 
        createLongWood(scene, 100, 500, 200, 40, 0x483D8B);
        createCheckpoint(scene, 100, 440);
        createShortWood(scene, 400, 500, 80, 20, 0x6A5ACD);
        createShortWood(scene, 600, 450, 80, 20, 0x6A5ACD);
        createShortWood(scene, 800, 400, 80, 20, 0x6A5ACD);
        createShortWood(scene, 1000, 350, 80, 20, 0x6A5ACD);
        createLongWood(scene, 1400, 500, 400, 40, 0x483D8B);
        const cake = scene.add.text(1400, 430, '🎂', { fontSize: '60px' }).setOrigin(0.5);
        const finisher = scene.add.rectangle(1400, 450, 50, 50, 0x000000, 0);
        scene.physics.add.existing(finisher, true);
        scene.physics.add.overlap(player, finisher, () => {
             if (!gameFinished) showFinalMessage(scene);
        });
        playerReset(scene, 100, 400);
    }

    scene.physics.add.collider(player, platforms);
    scene.physics.add.overlap(player, checkpoints, activateCheckpoint, null, scene);

    
}

function update() {
    if (isRespawning || gameFinished) return;

    if (isTalking) {
        player.setVelocityX(0);
        player.anims.play('idle', true);
        if (Phaser.Input.Keyboard.JustDown(enterKey)) {
            closeDialogue();
        }
        return;
    }

    checkInteractions();

    if (Phaser.Input.Keyboard.JustDown(interactKey) && nearbyInteractive) {
        if (nearbyInteractive.type === 'npc') {
            startDialogue(nearbyInteractive.obj);
        } else if (nearbyInteractive.type === 'portal') {
            usePortal(currentScene, nearbyInteractive.obj);
        }
    }

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
        player.body.setVelocityY(-550);
    }

    if (player.y > 650) {
        respawnPlayer(currentScene);
    }
}

function checkInteractions() {
    nearbyInteractive = null;
    promptText.setVisible(false);

    let closestNPC = null;
    npcs.getChildren().forEach(npc => {
        if (Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y) < 80) {
            closestNPC = npc;
        }
    });

    if (closestNPC && !closestNPC.given) {
        nearbyInteractive = { type: 'npc', obj: closestNPC };
        promptText.setText('[E] Konuş');
        promptText.setVisible(true);
        return;
    }

    let closestPortal = null;
    portals.getChildren().forEach(portal => {
        if (Phaser.Math.Distance.Between(player.x, player.y, portal.x, portal.y) < 60) {
            closestPortal = portal;
        }
    });

    if (closestPortal) {
        nearbyInteractive = { type: 'portal', obj: closestPortal };
        promptText.setText('[E] Gir');
        promptText.setVisible(true);
    }
}

function startDialogue(npc) {
    isTalking = true;
    npc.given = true; 
    npc.setTint(0x999999);
    giftCount++;
    giftText.setText('Gifts: ' + giftCount);
    dialogueBox.visible = true;
    dialogueText.setText(npc.message);
    dialogueText.visible = true;
    promptText.setVisible(false);
}

function closeDialogue() {
    isTalking = false;
    dialogueBox.visible = false;
    dialogueText.visible = false;
}

function usePortal(scene, portal) {
    if (portal.used) return;
    portal.used = true;
    player.setVelocity(0, 0);
    isRespawning = true;
    scene.cameras.main.fadeOut(1000, 0, 0, 0);
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
        currentLevel = portal.targetLevel;
        setupLevel(scene, currentLevel);
        scene.cameras.main.fadeIn(1000, 0, 0, 0);
        isRespawning = false;
    });
}

function createPlatform(scene, x, y, width, height, color) {
    const platform = scene.add.rectangle(x, y, width, height, color);
    scene.physics.add.existing(platform, true);
    platforms.add(platform);
}

function createNPC(scene, x, y, message, giftType) {
    const npc = scene.physics.add.staticSprite(x, y, 'npc1');
    npc.setOrigin(0.5, 1);
    npc.body.setSize(20, 40);
    npc.message = message;
    npc.giftType = giftType;
    npc.given = false;
    npcs.add(npc);
}

function createPortal(scene, x, y, targetLevel) {
    const portal = scene.physics.add.staticSprite(x, y, 'portal');
    portal.setOrigin(0.5, 1);
    portal.body.setSize(32, 64);
    portal.targetLevel = targetLevel;
    portal.used = false;
    portals.add(portal);
}

function createCheckpoint(scene, x, y) {
    const cp = scene.add.rectangle(x, y, 20, 60, 0xffff00);
    scene.physics.add.existing(cp, true);
    cp.activated = false;
    checkpoints.push(cp);
}

function activateCheckpoint(player, cp) {
    if (!cp.activated) {
        cp.activated = true;
        checkpointX = cp.x;
        checkpointY = cp.y - 50;
        cp.fillColor = 0x00ff00;
    }
}

function playerReset(scene, x, y) {
    if (!player) {
        player = scene.physics.add.sprite(x, y, 'player');
        player.setCollideWorldBounds(false);
        player.body.setSize(20, 32);
        player.setDepth(10);
    } else {
        player.setPosition(x, y);
        player.setVelocity(0, 0);
        player.setVisible(true);
    }
    scene.cameras.main.startFollow(player, true, 0.1, 0.1);
    checkpointX = x;
    checkpointY = y;
    isRespawning = false;
}

function respawnPlayer(scene) {
    if(isRespawning) return;
    isRespawning = true;
    player.setVisible(false);
    player.setVelocity(0, 0);
    scene.time.delayedCall(1000, () => {
        player.setPosition(checkpointX, checkpointY);
        player.setVisible(true);
        player.setVelocity(0, 0);
        isRespawning = false;
    });
}

function createDialogueBox(scene) {
    dialogueBox = scene.add.graphics().setScrollFactor(0).setDepth(200);
    dialogueBox.fillStyle(0x000000, 0.9);
    dialogueBox.fillRect(50, 340, 700, 100);
    dialogueBox.lineStyle(4, 0xffffff, 1);
    dialogueBox.strokeRect(50, 340, 700, 100);
    dialogueBox.visible = false;

    dialogueText = scene.add.text(400, 390, '', { 
        fontSize: '20px', fill: '#fff', align: 'center', wordWrap: { width: 680 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    dialogueText.visible = false;
}

function showFinalMessage(scene) {
    gameFinished = true;
    player.setVelocity(0, 0);
    const overlay = scene.add.rectangle(400, 225, 800, 450, 0x000000, 0.8).setScrollFactor(0).setDepth(300);
    scene.add.text(400, 225, '🎉 Happy Birthday! 🎉\n\nOyunu bitirdin!', { 
        fontSize: '32px', fill: '#fff', align: 'center' 
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
}

function createLongWood(scene, x, y) {
    const p = scene.physics.add.staticImage(x, y, 'longWood');
    p.setOrigin(0.5, 1);
    p.body.updateFromGameObject();

    // Platformu 2 kat genişletmek ve 1.5 kat uzatmak istersen:
    p.setScale(2, 1.5); 
    
    // ÖNEMLİ: Fizik kutusunu yeni boyuta göre günceller
    p.refreshBody();
    platforms.add(p);
}

function createMiddleWood(scene, x, y) {
    const p = scene.physics.add.staticImage(x, y, 'middleWood');
    p.setOrigin(0.5, 1);
    p.body.updateFromGameObject();

    // Platformu 2 kat genişletmek ve 1.5 kat uzatmak istersen:
    p.setScale(2, 1.5); 
    
    // ÖNEMLİ: Fizik kutusunu yeni boyuta göre günceller
    p.refreshBody();
    platforms.add(p);
}

function createShortWood(scene, x, y) {
    const p = scene.physics.add.staticImage(x, y, 'shortWood');
    p.setOrigin(0.5, 1);
    p.body.updateFromGameObject();

    // Platformu 2 kat genişletmek ve 1.5 kat uzatmak istersen:
    p.setScale(2, 1.5); 
    
    // ÖNEMLİ: Fizik kutusunu yeni boyuta göre günceller
    p.refreshBody();
    platforms.add(p);
}
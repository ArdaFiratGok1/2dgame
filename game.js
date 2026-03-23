/**
 * Cyber Cat: The Orange Odyssey
 * Redesigned for snappy, hardcore platforming.
 * Goal: Help the orange cat reach the Cake at the top.
 */

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game Variables
let player;
let platforms;
let cursors;
let keys;
let dashEmitter;
let timerText;
let deathText;
let startTime;
let deaths = 0;
let canDash = true;
let isDashing = false;
let wallSliding = false;
let cake;
let gameWon = false;

function preload() {
    const graphics = this.make.graphics();

    // Cat Body (Orange)
    graphics.clear();
    graphics.fillStyle(0xffa500, 1);
    graphics.fillRect(0, 8, 32, 24); // Body
    graphics.fillTriangle(0, 8, 8, 8, 4, 0); // Left Ear
    graphics.fillTriangle(24, 8, 32, 8, 28, 0); // Right Ear
    graphics.generateTexture('catTexture', 32, 32);

    // Box Platform (Cardboard Brown)
    graphics.clear();
    graphics.fillStyle(0x8b4513, 1);
    graphics.lineStyle(2, 0x5d2e0a, 1);
    graphics.strokeRect(0, 0, 100, 20);
    graphics.fillRect(0, 0, 100, 20);
    graphics.generateTexture('boxTexture', 100, 20);

    // Curtain Wall (Deep Red)
    graphics.clear();
    graphics.fillStyle(0x800000, 1);
    graphics.lineStyle(2, 0x4d0000, 1);
    graphics.strokeRect(0, 0, 20, 200);
    graphics.fillRect(0, 0, 20, 200);
    graphics.generateTexture('curtainTexture', 20, 200);

    // Water Hazard (Blue)
    graphics.clear();
    graphics.fillStyle(0x00ffff, 0.8);
    graphics.beginPath();
    graphics.moveTo(0, 32);
    graphics.lineTo(8, 16);
    graphics.lineTo(16, 32);
    graphics.lineTo(24, 16);
    graphics.lineTo(32, 32);
    graphics.closePath();
    graphics.fill();
    graphics.generateTexture('waterTexture', 32, 32);

    // Fur Particle
    graphics.clear();
    graphics.fillStyle(0xffa500, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('furParticle', 8, 8);
}

function create() {
    platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();

    // --- EXTENDED LEVEL DESIGN ---
    // Floor
    createPlatform(this, 600, 780, 12, 1); 

    // LIVING ROOM SECTION (0 to -1000)
    createPlatform(this, 300, 650, 2, 1);
    createPlatform(this, 500, 520, 2, 1);
    createPlatform(this, 800, 450, 2, 1);
    createWall(this, 1000, 300, 1, 2);
    createPlatform(this, 900, 200, 1, 1);
    createPlatform(this, 600, 100, 4, 1);
    createHazard(this, 550, 84);
    createHazard(this, 650, 84);

    // KITCHEN SECTION (-1000 to -2000)
    createPlatform(this, 300, -50, 2, 1);
    createWall(this, 150, -250, 1, 3);
    createPlatform(this, 400, -450, 1, 1);
    createPlatform(this, 700, -600, 2, 1);
    createHazard(this, 700, -616);
    createPlatform(this, 1000, -750, 1, 1);
    createWall(this, 1150, -1000, 1, 4);
    createPlatform(this, 900, -1150, 2, 1);
    createPlatform(this, 500, -1300, 2, 1);
    createHazard(this, 500, -1316);

    // ATTIC SECTION (-2000 to -3500)
    createWall(this, 300, -1600, 1, 5);
    createPlatform(this, 500, -1800, 1, 1);
    createPlatform(this, 800, -2000, 1, 1);
    createPlatform(this, 500, -2200, 1, 1);
    createWall(this, 200, -2500, 1, 6);
    createWall(this, 1000, -2800, 1, 6);
    createPlatform(this, 600, -3100, 2, 1);
    createHazard(this, 600, -3116);

    // FINAL ROOF SECTION
    createPlatform(this, 300, -3300, 1, 1);
    createPlatform(this, 900, -3500, 1, 1);
    createPlatform(this, 600, -3800, 6, 2);
    
    // The Cake Platform
    cake = this.add.text(600, -3860, '🎂', { fontSize: '120px' }).setOrigin(0.5);
    this.physics.add.existing(cake);
    cake.body.setAllowGravity(false);
    cake.body.setSize(100, 100);

    // --- PLAYER SETUP ---
    player = this.physics.add.sprite(600, 700, 'catTexture');
    player.setCollideWorldBounds(false);
    player.body.setBounce(0);
    player.body.setDragX(1200); // Cats are nimble
    
    // Dash Trail
    dashEmitter = this.add.particles(0, 0, 'furParticle', {
        speed: { min: -100, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 400,
        frequency: -1,
        follow: player
    });

    // --- INPUTS ---
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys({
        jump: Phaser.Input.Keyboard.KeyCodes.Z,
        dash: Phaser.Input.Keyboard.KeyCodes.X,
        reset: Phaser.Input.Keyboard.KeyCodes.R
    });

    // --- CAMERA ---
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // --- COLLISIONS ---
    this.physics.add.collider(player, platforms);
    this.physics.add.overlap(player, this.hazards, hitHazard, null, this);
    this.physics.add.overlap(player, cake, reachCake, null, this);

    // --- UI ---
    startTime = this.time.now;
    timerText = this.add.text(20, 20, 'TIME: 0.0s', { fontSize: '24px', color: '#ffa500', fontStyle: 'bold' }).setScrollFactor(0);
    deathText = this.add.text(20, 50, 'NAPS: 0', { fontSize: '24px', color: '#ff4500', fontStyle: 'bold' }).setScrollFactor(0);
    this.add.text(20, 80, 'ARROWS: Move | Z: Jump | X: Dash | R: Reset', { fontSize: '16px', color: '#ffffff', alpha: 0.6 }).setScrollFactor(0);

    // Section Labels (Visual guide)
    this.add.text(100, 600, 'LIVING ROOM', { fontSize: '40px', color: '#ffffff', alpha: 0.1 });
    this.add.text(100, -500, 'KITCHEN', { fontSize: '40px', color: '#ffffff', alpha: 0.1 });
    this.add.text(100, -2000, 'ATTIC', { fontSize: '40px', color: '#ffffff', alpha: 0.1 });
    this.add.text(100, -3500, 'ROOF', { fontSize: '40px', color: '#ffffff', alpha: 0.1 });
}

function update() {
    if (Phaser.Input.Keyboard.JustDown(keys.reset)) {
        if (gameWon) {
            this.scene.restart();
            gameWon = false;
            deaths = 0;
            return;
        }
        respawnPlayer(this);
    }

    if (gameWon) return;

    const elapsed = (this.time.now - startTime) / 1000;
    timerText.setText(`TIME: ${elapsed.toFixed(1)}s`);

    // --- MOVEMENT LOGIC ---
    const onGround = player.body.touching.down;
    const onWall = (player.body.touching.left || player.body.touching.right) && !onGround;

    if (!isDashing) {
        if (cursors.left.isDown) {
            player.setVelocityX(-450);
            player.setFlipX(true);
        } else if (cursors.right.isDown) {
            player.setVelocityX(450);
            player.setFlipX(false);
        }

        if (Phaser.Input.Keyboard.JustDown(keys.jump) || Phaser.Input.Keyboard.JustDown(cursors.up)) {
            if (onGround) {
                player.setVelocityY(-750);
            } else if (onWall) {
                player.setVelocityY(-650);
                player.setVelocityX(player.body.touching.left ? 500 : -500);
            }
        }

        if (onWall && player.body.velocity.y > 0) {
            player.setVelocityY(150);
            wallSliding = true;
        } else {
            wallSliding = false;
        }

        if (Phaser.Input.Keyboard.JustDown(keys.dash) && canDash) {
            initiateDash(this);
        }
    }

    if (onGround) {
        canDash = true;
        player.setTint(0xffffff);
    } else if (canDash) {
        player.setTint(0xffd700);
    } else {
        player.setTint(0x888888);
    }

    if (player.y > 1000) {
        respawnPlayer(this);
    }
}

function initiateDash(scene) {
    isDashing = true;
    canDash = false;
    
    let dashX = 0;
    let dashY = 0;

    if (cursors.left.isDown) dashX = -1;
    else if (cursors.right.isDown) dashX = 1;
    if (cursors.up.isDown) dashY = -1;
    else if (cursors.down.isDown) dashY = 1;

    if (dashX === 0 && dashY === 0) dashX = (player.flipX ? -1 : 1);

    const speed = 1100;
    player.body.setAllowGravity(false);
    player.setVelocity(dashX * speed, dashY * speed);
    
    dashEmitter.start();

    // "MEOW!" text effect
    const meow = scene.add.text(player.x, player.y - 20, 'MEOW!', { fontSize: '16px', color: '#ffa500', fontStyle: 'bold' });
    scene.tweens.add({
        targets: meow,
        y: meow.y - 50,
        alpha: 0,
        duration: 500,
        onComplete: () => meow.destroy()
    });
    
    scene.time.delayedCall(200, () => {
        isDashing = false;
        player.body.setAllowGravity(true);
        player.setVelocity(player.body.velocity.x * 0.4, player.body.velocity.y * 0.4);
        dashEmitter.stop();
    });
}

function hitHazard(player, hazard) {
    respawnPlayer(this);
}

function respawnPlayer(scene) {
    deaths++;
    deathText.setText(`NAPS: ${deaths}`);
    scene.cameras.main.shake(150, 0.02);
    
    player.setPosition(600, 700);
    player.setVelocity(0, 0);
    canDash = true;
    isDashing = false;
    player.body.setAllowGravity(true);
}

function reachCake(player, cake) {
    if (gameWon) return;
    gameWon = true;
    
    const elapsed = (this.time.now - startTime) / 1000;
    this.physics.pause();
    player.setTint(0xffffff);
    
    const winBg = this.add.rectangle(600, -3800, 1200, 800, 0x000000, 0.8).setScrollFactor(0);
    this.add.text(600, -3800, `PURR-FECT!\nTIME: ${elapsed.toFixed(2)}s\nNAPS: ${deaths}`, {
        fontSize: '64px',
        color: '#ffa500',
        align: 'center',
        fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(600, -3700, 'Press R to play again', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0);
}

function createPlatform(scene, x, y, scaleX, scaleY) {
    const p = platforms.create(x, y, 'boxTexture');
    p.setScale(scaleX, scaleY).refreshBody();
    return p;
}

function createWall(scene, x, y, scaleX, scaleY) {
    const w = platforms.create(x, y, 'curtainTexture');
    w.setScale(scaleX, scaleY).refreshBody();
    return w;
}

function createHazard(scene, x, y) {
    const h = scene.hazards.create(x, y, 'waterTexture');
    h.setOrigin(0.5, 1);
    h.refreshBody();
    return h;
}

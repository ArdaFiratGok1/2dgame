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
    width: 800,
    height: 450,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
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
let currentScene;
let nearbyInteractive = null; // Yanında durduğumuz obje (NPC veya Portal)

function preload() {
    // 16x16 çizdiysen frameWidth: 16 yap, 32 ise 32 kalsın.
    this.load.spritesheet('player', 'assets/player/player.png', { frameWidth: 32, frameHeight: 32 });
    
    // Eğer zemin görselin varsa burayı aç:
    // this.load.image('ground', 'assets/ground.png');

    this.load.image(
    'portal',
    'assets/portal/portal.png'
  );

  this.load.image('npc1', 'assets/npc/npc1.png');

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

    // UI - Hediye Sayacı
    giftText = this.add.text(16, 16, 'Gifts: ' + giftCount, { 
        fontSize: '20px', fill: '#fff', backgroundColor: '#000000aa', padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(100);

    // UI - "E'ye Bas" Uyarısı (Başta gizli)
    promptText = this.add.text(400, 300, '[E] Etkileşime Geç', {
        fontSize: '16px', fill: '#ffff00', backgroundColor: '#000', padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    // UI - Diyalog Kutusu (Başta gizli)
    createDialogueBox(this);

    // Bölümü Başlat
    setupLevel(this, currentLevel);
}

function setupLevel(scene, level) {
    // Eski objeleri temizle
    if (platforms) platforms.clear(true, true);
    if (npcs) npcs.clear(true, true);
    if (portals) portals.clear(true, true); // Portalları da temizle
    checkpoints = [];

    // Yeni Gruplar
    platforms = scene.physics.add.staticGroup();
    npcs = scene.physics.add.staticGroup();
    portals = scene.physics.add.staticGroup(); // Portallar için grup

    // DÜNYA SINIRLARI - ÖNEMLİ DEĞİŞİKLİK
    // Genişlik: 2000 (Daha uzun parkur)
    // checkCollision.down = false yaptık. Böylece oyuncu aşağı düşünce zemine çarpmaz, düşmeye devam eder ve ölür.
    scene.physics.world.setBounds(0, 0, 2000, 600);
    scene.physics.world.checkCollision.down = false; 
    scene.cameras.main.setBounds(0, 0, 2000, 600);

    // ---------------------------------------------------------
    // 🎮 LEVEL 1: Öğretici (Daha geniş)
    // ---------------------------------------------------------
    if (level === 1) {
        scene.cameras.main.setBackgroundColor('#87CEEB'); 
        
        // Başlangıç Zemini
        createPlatform(scene, 200, 500, 400, 40, 0x6B8E23);

        // Boşluklu Parkur
        createPlatform(scene, 600, 450, 150, 20, 0x8B4513); // İlk atlama
        createPlatform(scene, 850, 400, 150, 20, 0x8B4513); // İkinci atlama (Yüksek)
        createPlatform(scene, 1100, 500, 400, 40, 0x6B8E23); // Güvenli alan (NPC burada)

        // NPC 1 (Uzakta)
        createNPC(scene, 1150, 440, '🎩 Merhaba!\nBu senin ilk hediyen.\n(Devam etmek için ENTER\'a bas)', 'hat');

        // Portal (En sonda)
        createPlatform(scene, 1400, 450, 100, 20, 0x8B4513);
        createPlatform(scene, 1600, 500, 200, 40, 0x6B8E23); // Portal zemini
        createPortal(scene, 1650, 430, 2); // Portal burada

        // Oyuncu Başlangıç
        playerReset(scene, 100, 400);
    }
    // ---------------------------------------------------------
    // 🎮 LEVEL 2: Yüksek Zıplamalar
    // ---------------------------------------------------------
    else if (level === 2) {
        scene.cameras.main.setBackgroundColor('#FFA07A'); 

        // Başlangıç
        createPlatform(scene, 100, 500, 200, 40, 0x8B4513);
        createCheckpoint(scene, 100, 440);

        // Merdiven gibi yükselen parkur
        createPlatform(scene, 350, 450, 100, 20, 0xA0522D);
        createPlatform(scene, 550, 380, 100, 20, 0xA0522D);
        createPlatform(scene, 750, 300, 100, 20, 0xA0522D);
        
        // Uzun bir düzlük (NPC burada)
        createPlatform(scene, 1000, 300, 300, 20, 0xA0522D);
        createNPC(scene, 1050, 240, '🐱 İşte tatlı bir kedi!\nYanında götür.\n(Devam etmek için ENTER\'a bas)', 'cat');
        

        // Aşağı inen zor parkur
        createPlatform(scene, 1300, 380, 80, 20, 0xA0522D);
        createPlatform(scene, 1500, 450, 80, 20, 0xA0522D);
        
        // Portal Çıkışı
        createPlatform(scene, 1800, 500, 200, 40, 0x8B4513);
        createPortal(scene, 1850, 430, 3);

        playerReset(scene, 100, 400);
    }
    // ---------------------------------------------------------
    // 🎮 LEVEL 3: Final
    // ---------------------------------------------------------
    else if (level === 3) {
        scene.cameras.main.setBackgroundColor('#9370DB'); 

        createPlatform(scene, 100, 500, 200, 40, 0x483D8B);
        createCheckpoint(scene, 100, 440);

        // Zorlu tek bloklar
        createPlatform(scene, 400, 500, 80, 20, 0x6A5ACD);
        createPlatform(scene, 600, 450, 80, 20, 0x6A5ACD);
        createPlatform(scene, 800, 400, 80, 20, 0x6A5ACD);
        createPlatform(scene, 1000, 350, 80, 20, 0x6A5ACD);

        // Final Pastası Platformu
        createPlatform(scene, 1400, 500, 400, 40, 0x483D8B);

        // 🎂 PASTA (Sadece görüntü, çarpışma yok)
        const cake = scene.add.text(1400, 430, '🎂', { fontSize: '60px' }).setOrigin(0.5);
        
        // Gizli bitiş tetikleyicisi (Pastanın üzerine gelince)
        const finisher = scene.add.rectangle(1400, 450, 50, 50, 0x000000, 0);
        scene.physics.add.existing(finisher, true);
        scene.physics.add.overlap(player, finisher, () => {
             if (!gameFinished) showFinalMessage(scene);
        });

        playerReset(scene, 100, 400);
    }

    // Fizik İlişkileri
    scene.physics.add.collider(player, platforms);
    scene.cameras.main.startFollow(player, true, 0.1, 0.1);

    // Çarpışmalar (Overlap yerine artık kontrol yapıyoruz)
    scene.physics.add.overlap(player, checkpoints, activateCheckpoint, null, scene);
}

function update() {
    // 1. Durum Kontrolleri
    if (isRespawning || gameFinished) return;

    // Diyalogdaysak hareket edemeyiz
    if (isTalking) {
        player.setVelocityX(0);
        player.anims.play('idle', true);
        
        // ENTER'a basınca diyaloğu kapat
        if (Phaser.Input.Keyboard.JustDown(enterKey)) {
            closeDialogue();
        }
        return; // Aşağıdaki hareket kodlarını çalıştırma
    }

    // 2. Etkileşim Kontrolü (Sürekli yakındakileri tara)
    checkInteractions();

    // E Tuşuna basılınca ne olacak?
    if (Phaser.Input.Keyboard.JustDown(interactKey) && nearbyInteractive) {
        if (nearbyInteractive.type === 'npc') {
            startDialogue(nearbyInteractive.obj);
        } else if (nearbyInteractive.type === 'portal') {
            usePortal(currentScene, nearbyInteractive.obj);
        }
    }

    // 3. Hareket Kodları
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

    // 4. Düşme ve Ölme (Koordinat 600'ü geçerse)
    if (player.y > 650) {
        respawnPlayer(currentScene);
    }
}

// ═══════════════════════════════════════════
// 🛠️ YARDIMCI FONKSİYONLAR (GÜNCELLENDİ)
// ═══════════════════════════════════════════

function checkInteractions() {
    // Önce kimseye yakın değiliz varsayalım
    nearbyInteractive = null;
    promptText.setVisible(false);

    // NPC Kontrolü
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
        return; // Bir şey bulduk, çıkalım
    }

    // Portal Kontrolü
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
    npc.given = true; // Hediye alındı
    npc.setTint(0x999999);//griye çevir
    
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

    // Oyuncuyu dondur
    player.setVelocity(0, 0);
    isRespawning = true; // Hareket etmesini engellemek için bu flag'i kullanıyoruz

    // Ekran Karartma (Fade Out)
    scene.cameras.main.fadeOut(1000, 0, 0, 0);

    // Kararma bitince level değiştir
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
    npc.y += 40; // Görselin altını yere hizalamak için ince ayar

    npc.setOrigin(0.5, 1); // AYAKLARI YERE BASAR
    npc.body.setSize(20, 40); // hitbox
    npc.body.setOffset(6, 8);

    npc.message = message;
    npc.giftType = giftType;
    npc.given = false;

    npcs.add(npc);
}

function createPortal(scene, x, y, targetLevel) {
    // 🔁 ARTIK rectangle DEĞİL, sprite kullanıyoruz
    const portal = scene.physics.add.staticSprite(x, y, 'portal');
    portal.setOrigin(0.5, 1); // ALTINDAN HİZALA
portal.y += 50;           // İNCE AYAR (istersen 3–10 arası dene)

    // 🔧 Hitbox ayarı (çok önemli)
    portal.body.setSize(32, 64);
    portal.body.setOffset(0, 0);

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
        player.setCollideWorldBounds(false); // DÜNYA SINIRINA ÇARPMASIN, DÜŞEBİLSİN
        player.body.setSize(20, 32); // Hitbox'ı biraz daralttım, daha rahat hareket etsin
    } else {
        player.setPosition(x, y);
        player.setVelocity(0, 0);
        player.setVisible(true);
        player.setFlipX(false);
    }
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
    // Siyah kutu
    dialogueBox = scene.add.graphics().setScrollFactor(0).setDepth(200);
    dialogueBox.fillStyle(0x000000, 0.9);
    dialogueBox.fillRect(50, 340, 700, 100);
    dialogueBox.lineStyle(4, 0xffffff, 1);
    dialogueBox.strokeRect(50, 340, 700, 100);
    dialogueBox.visible = false;

    // Yazı
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
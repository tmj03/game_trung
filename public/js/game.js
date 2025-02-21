const socket = io();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 500;

let player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 3,
    bulletCount: 1, // Number of bullets the player can shoot
};


let playerImage = new Image();
playerImage.src = '/img/player/player.png'; // Replace with your image path

let bulletImage = new Image();
bulletImage.src = '/img/player/new_bullet.png'; // Đường dẫn đến hình ảnh đạn

let enemyImage = new Image();
enemyImage.src = '/img/enemies/2.png'; 

let bossImage = new Image();
bossImage.src = '/img/enemies/9.png';

let bulletBossImage = new Image();
bulletBossImage.src = '/img/boss/fire_prev.png';

let goldEnemyImg = new Image();
goldEnemyImg.src = '/img/enemies/3.png'; // Đường dẫn tới ảnh địch "gold"


let itemImage = new Image();
itemImage.src = '/img/star.png';


let bullets = [];
let enemies = [];
let items = [];
let score = 0;
let boss = null;
let enemySpeed = 0.5;
let spawnEnemyTimer = 0;
let bossAlive = false;


let isPaused = true; // Trạng thái tạm dừng
let gameInterval, shootInterval;

let keys = {
    left: false,
    right: false,
};

// Hàm bắt đầu trò chơi
function startGame() {
    isPaused = false;
    document.getElementById('startScreen').style.display = 'none';
    gameInterval = setInterval(gameLoop, 1000 / 60);
    shootInterval = setInterval(autoShoot, 500);
}

// Hàm tạm dừng trò chơi
function pauseGame() {
    isPaused = true;
    clearInterval(gameInterval);
    clearInterval(shootInterval);
    document.getElementById('pauseScreen').style.display = 'flex';
}

// Hàm thoát trò chơi
function exitGame() {
    clearInterval(gameInterval);
    clearInterval(shootInterval);
    document.location.reload();
}

// Create an enemy
function createEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: enemySpeed,
        type: 'red',
        health: 5,
    };
    enemies.push(enemy);
}

// Create item
function createItem(x, y) {
    const item = {
        x,
        y,
        width: 20,
        height: 38,
    };
    items.push(item);
}

// Create boss
function createBoss() {
    boss = {
        x: canvas.width / 2 - 50,
        y: -100,
        width: 100,
        height: 100,
        speed: 0.1,
        fireRate: 4000,
        bulletSpeed: 0.5,
        health: 200,
    };
}

// Create boss bullets
function createBossBullets() {
    const spread = 0.3; // Điều chỉnh mức độ phân tán theo chiều ngang (tốc độ ngang)
    const numBullets = 6; // Số lượng đạn bắn ra

    for (let i = 0; i < numBullets; i++) {
        const offsetX = (i - (numBullets - 1) / 2) * spread; // Tạo phân tán ngang

        const bullet = {
            x: boss.x + boss.width / 2, // Đạn bắn ra từ giữa boss
            y: boss.y + boss.height, // Bắn từ đáy của boss
            width: 20,
            height: 20,
            speedX: offsetX, // Tốc độ ngang, phân tán ra hai bên
            speedY: boss.bulletSpeed, // Tốc độ đi xuống
            isBossBullet: true,
        };

        bullets.push(bullet);
    }
}

// Game over function
function gameOver() {
    const message = `Game Over! Tổng điểm của bạn là: ${score}\nBạn có muốn thoát trò chơi?`;
    if (confirm(message)) {
        document.location.reload(); // Tải lại trang
    }
}

// Game loop
function gameLoop() {
    if (isPaused) return; // Dừng nếu trò chơi tạm dừng
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player movement
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Draw the player image
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

    // Update bullets
    bullets.forEach((bullet, index) => {
        if (bullet.isBossBullet) {
            ctx.drawImage(bulletBossImage, bullet.x, bullet.y, bullet.width, bullet.height);
        } else {
            ctx.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
        }
    
        bullet.y += bullet.isBossBullet ? bullet.speedY : -bullet.speed;
        bullet.x += bullet.speedX || 0;
    
        // Remove bullet if out of bounds
        if (bullet.y < 0 || bullet.y > canvas.height) bullets.splice(index, 1);
    });
    

    // Update enemies
    enemies.forEach((enemy, index) => {
        if (enemy.type === 'gold') {
            ctx.drawImage(goldEnemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height); // Hình ảnh mặc định cho các địch khác
        }
        enemy.y += enemy.speed;

        // Player-enemy collision detection
        if (isColliding(player, enemy)) {
            gameOver(); // End game on collision
        }

        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
            score++;
        }
    });

   // Bullet-enemy collision detection with health system
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(bullet, enemy)) {
                bullets.splice(bulletIndex, 1); // Xóa đạn khi va chạm
                enemy.health--; // Giảm máu của kẻ địch

                // Kiểm tra nếu kẻ địch hết máu (health <= 0)
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1); // Xóa kẻ địch khỏi mảng
                    score += 10; // Tăng điểm khi kẻ địch bị tiêu diệt

                    // Tạo item nếu kẻ địch là "gold"
                    if (enemy.type === 'gold') {
                        createItem(enemy.x, enemy.y);
                    }
                }
            }
            if (boss && isColliding(bullet, boss)) {
                bullets.splice(bulletIndex, 1); // Xóa đạn khi va chạm với boss
                boss.health--; // Giảm máu của boss
        
                // Kiểm tra nếu boss hết máu (health <= 0)
                if (boss.health <= 0) {
                    bossAlive = false; // Boss chết
                    boss = null; // Xóa boss khỏi màn hình
                    score += 100; // Tăng điểm khi tiêu diệt boss
                }
            }
            if (bullet.isBossBullet && isColliding(bullet, player)) {
                gameOver(); // Game over khi đạn của boss va chạm với người chơi
            }
        });
    });


    // Handle boss logic
    if (boss) {
        ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height);
        boss.y += boss.speed;

        // Boss bullet firing
        if (Date.now() % boss.fireRate < 50) {
            createBossBullets();
        }


        // Boss-player collision
        if (isColliding(player, boss)) {
            gameOver();
        }

        
    }

    // Update items
    items.forEach((item, index) => {
        ctx.drawImage(itemImage, item.x, item.y, item.width, item.height);

        item.y += 2;

        if (isColliding(item, player)) {
            items.splice(index, 1);
            player.bulletCount++;
        }

        if (item.y > canvas.height) items.splice(index, 1);
    });

    // Draw score and bullet count
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Bullets: ${player.bulletCount}`, canvas.width - 100, 20);
}

// Collision detection helper function
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startScreen').style.display = 'flex'; // Hiện màn hình bắt đầu
    document.getElementById('startButton').addEventListener('click', startGame);
    
    // Các sự kiện khác
});

// Các sự kiện cho nút bấm
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('resumeButton').addEventListener('click', () => {
    isPaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    gameInterval = setInterval(gameLoop, 1000 / 60);
    shootInterval = setInterval(autoShoot, 500);
});

document.getElementById('exitButton').addEventListener('click', exitGame);

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') keys.left = true;
    if (event.key === 'ArrowRight') keys.right = true;
    if (event.key === 'Escape') pauseGame(); // Nhấn Esc để tạm dừng trò chơi
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') keys.left = false;
    if (event.key === 'ArrowRight') keys.right = false;
});

// Auto shoot function
// Auto shoot function
function autoShoot() {
    if (player.bulletCount > 0) {
        for (let i = 0; i < player.bulletCount; i++) {
            const bullet = {
                // Tính toán vị trí x để căn giữa
                x: player.x + (player.width - (player.bulletCount * 6)) / 2 + (i * 6),
                y: player.y,
                width: 6,
                height: 6,
                speed: 10,
                isBossBullet: false,
            };
            bullets.push(bullet);
            socket.emit('bulletFired', bullet);
        }
    }
}


// Gold enemy creation
setInterval(() => {
    const goldEnemy = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: Math.random() * 3 + 1,
        type: 'gold',
        health: 5,

    };
    enemies.push(goldEnemy);
}, 10000);

// Main game loop
setInterval(() => {
    
    spawnEnemyTimer += 1000;

    // Increase enemy speed every 10 seconds
    if (spawnEnemyTimer % 10000 === 0) {
        enemySpeed += 0.5;
    }

    // Spawn boss after 60 seconds
    if (spawnEnemyTimer >= 60000 && !bossAlive) {
        bossAlive = true;
        createBoss();
        spawnEnemyTimer = 0;
    }

    // Spawn enemies regularly
    createEnemy();
}, 1000);

// Keydown and Keyup event listeners
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') keys.left = true;
    if (event.key === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') keys.left = false;
    if (event.key === 'ArrowRight') keys.right = false;
});

// Set intervals for shooting and game loop
setInterval(autoShoot, 200);
setInterval(gameLoop, 1000 / 60);

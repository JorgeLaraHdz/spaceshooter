const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let highScore = localStorage.getItem("highScore") || 0; // Obtiene la puntuación más alta guardada o 0

// Configuración del juego
canvas.width = 800;
canvas.height = 600;

const playerWidth = 60;
const playerHeight = 40;
let playerX = canvas.width / 2 - playerWidth / 2;
const playerY = canvas.height - playerHeight - 10;
const playerSpeed = 10;

const bulletWidth = 5;
const bulletHeight = 10;
const bulletSpeed = 15;
let bullets = [];

const enemyWidth = 40;
const enemyHeight = 30;
const enemyRows = 6;
const enemyCols = 8;
let enemySpeed = 3; // Velocidad inicial de los enemigos
let enemyBulletSpeed = 5; // Velocidad de las balas enemigas
let enemies = [];
let enemyDirection = 1;
let enemyBullets = [];

let rightPressed = false;
let leftPressed = false;
let spacePressed = false;
let gameStarted = false;
let gameOver = false;
let paused = false;
let victoryMessage = "";
let score = 0;
let level = 1; // Nuevo: Nivel actual

// Temporizador del juego
let gameInterval;
let updateInterval = 1000 / 60; // Inicialmente 60 FPS

// Cargar sonidos
const shootSound = new Audio('./shoot.wav');
const explosionSound = new Audio('./exp.mp3');
const backgroundMusic = new Audio('./background.mp3');
backgroundMusic.loop = true;

// Cargar sprites
const enemySprite = new Image();
enemySprite.src = './lighter.gif';

const starSprite = new Image();
starSprite.src = './starship.gif';

// Crear enemigos
function createEnemies() {
    enemies = [];
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: col * (enemyWidth + 10) + 50,
                y: row * (enemyHeight + 10) + 30,
                width: enemyWidth,
                height: enemyHeight
            });
        }
    }
}

// Dibuja al jugador
function drawPlayer() {
    ctx.drawImage(starSprite, playerX, playerY, playerWidth, playerHeight);
}

// Dibuja las balas del jugador
function drawBullets() {
    ctx.fillStyle = "white";
    bullets.forEach((bullet, index) => {
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
        bullet.y -= bulletSpeed;

        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });
}

// Dibuja las balas de los enemigos
function drawEnemyBullets() {
    ctx.fillStyle = "red";
    enemyBullets.forEach((bullet, index) => {
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
        bullet.y += enemyBulletSpeed;

        if (bullet.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
    });
}

// Dibuja a los enemigos
function drawEnemies() {
    enemies.forEach((enemy, index) => {
        ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);

        enemy.x += enemySpeed * enemyDirection;

        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
            enemyDirection *= -1;
            enemies.forEach(e => e.y += enemyHeight);
        }

        // Disparo aleatorio de los enemigos
        if (Math.random() < 0.002 + level * 0.001) { // Aumenta la probabilidad con el nivel
            enemyBullets.push({
                x: enemy.x + enemyWidth / 2 - bulletWidth / 2,
                y: enemy.y + enemyHeight
            });
        }
    });
}

// Dibuja la puntuación y nivel
function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Puntuación: " + score, 80, 30);
    ctx.fillText("Highscore: " + highScore, 230, 30);
    ctx.fillText("Nivel: " + level, 400, 30); // Nuevo: Muestra el nivel
}

// Pantallas
function drawStartScreen() {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Presiona Enter para empezar", canvas.width / 2, canvas.height / 2);
}

function drawEndScreen() {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(victoryMessage, canvas.width / 2, canvas.height / 2);
    ctx.fillText("Presiona Enter para reiniciar", canvas.width / 2, canvas.height / 2 + 40);
}

function drawPauseScreen() {
    ctx.fillStyle = "yellow";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Juego en pausa", canvas.width / 2, canvas.height / 2);
}

// Control de teclas
function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    } else if (e.key === " " || e.key === "Spacebar") {
        spacePressed = true;
        if (gameStarted && !gameOver && !paused) {
            bullets.push({ x: playerX + playerWidth / 2 - bulletWidth / 2, y: playerY });
            shootSound.play();
        }
    } else if (e.key === "Enter") {
        if (!gameStarted) {
            startGame();
        } else if (gameOver) {
            resetGame();
        } else {
            togglePause();
        }
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

// Ajusta la velocidad del juego
function adjustGameSpeed() {
    clearInterval(gameInterval);
    updateInterval = Math.max(1000 / 30, 1000 / (60 + level * 5));
    gameInterval = setInterval(update, updateInterval);
}

// Actualización del juego
function update() {
    if (!gameStarted) {
        drawStartScreen();
        return; // Detén el bucle de actualización hasta que se inicie el juego
    }
    if (paused) {
        drawPauseScreen();
        return;
    }

    if (rightPressed && playerX < canvas.width - playerWidth) {
        playerX += playerSpeed;
    } else if (leftPressed && playerX > 0) {
        playerX -= playerSpeed;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        drawStartScreen();
    } else if (!gameOver) {
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawEnemyBullets();
        drawScore();
        checkCollisions();

        if (enemies.length === 0) {
            level++;
            enemySpeed += 0.5;
            enemyBulletSpeed += 0.5;
            createEnemies();
            adjustGameSpeed();
        }
    } else {
        drawEndScreen();
    }
}

// Verificar colisiones
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = bullets[i];
            const enemy = enemies[j];

            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bulletWidth > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bulletHeight > enemy.y
            ) {
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                explosionSound.play();
                score += 100;
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("highScore", highScore);
                }
                break;
            }
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (
            bullet.x < playerX + playerWidth &&
            bullet.x + bulletWidth > playerX &&
            bullet.y < playerY + playerHeight &&
            bullet.y + bulletHeight > playerY
        ) {
            gameOver = true;
            victoryMessage = "Perdiste";
            backgroundMusic.pause();
            break;
        }
    }

    enemies.forEach(enemy => {
        if (enemy.y + enemy.height >= playerY) {
            gameOver = true;
            victoryMessage = "Perdiste";
            backgroundMusic.pause();
        }
    });
}

// Iniciar juego
function startGame() {
    gameStarted = true;
    gameOver = false;
    paused = false;
    victoryMessage = "";
    backgroundMusic.play();
    createEnemies();
    adjustGameSpeed();
}

// Reiniciar juego
function resetGame() {
    playerX = canvas.width / 2 - playerWidth / 2;
    bullets = [];
    enemyBullets = [];
    score = 0;
    level = 1;
    enemySpeed = 3;
    enemyBulletSpeed = 5;
    startGame();
}

// Pausar/Despausar
function togglePause() {
    paused = !paused;
    if (!paused) adjustGameSpeed();
}
window.onload = function () {
    backgroundMusic.play(); // Opcional: Reproducir música de fondo si se quiere desde el principio
    createEnemies();
    drawStartScreen(); // Muestra la pantalla de inicio
};
// Eventos del teclado
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

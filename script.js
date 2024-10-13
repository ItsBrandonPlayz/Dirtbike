const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreElement = document.getElementById('score');
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const mobileControls = document.getElementById('mobile-controls');

canvas.width = 800;
canvas.height = 400;

const bike = {
    x: 50,
    y: canvas.height - 80,
    width: 60,
    height: 45,
    speed: 0.5,
    maxSpeed: 5,
    velocityY: 0
};

let obstacles = [];
let score = 0;
let gameLoop;
let isGameRunning = false;
let difficultyLevel = 1;
let obstacleSpeed = 3; // Reduced from 5
let obstacleSpawnRate = 0.01; // Reduced from 0.02;

// Background layers
const backgroundLayers = [
    { speed: 1, elements: [] },
    { speed: 2, elements: [] },
    { speed: 3, elements: [] }
];

// Initialize background
function initBackground() {
    const colors = ['#87CEEB', '#4682B4', '#1E90FF'];
    backgroundLayers.forEach((layer, index) => {
        for (let i = 0; i < 5; i++) {
            layer.elements.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 50 + 10,
                color: colors[index]
            });
        }
    });
}

// Draw background
function drawBackground() {
    ctx.fillStyle = '#F0F8FF'; // Light sky blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    backgroundLayers.forEach(layer => {
        layer.elements.forEach(element => {
            ctx.fillStyle = element.color;
            ctx.beginPath();
            ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}

// Update background
function updateBackground() {
    backgroundLayers.forEach(layer => {
        layer.elements.forEach(element => {
            element.x -= layer.speed;
            if (element.x + element.size < 0) {
                element.x = canvas.width + element.size;
                element.y = Math.random() * canvas.height;
            }
        });
    });
}

function drawBike() {
    ctx.save();
    ctx.translate(bike.x, bike.y);
    ctx.scale(0.75, 0.75);

    // Frame
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(40, 30);
    ctx.lineTo(50, 10);
    ctx.lineTo(30, 0);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fillStyle = '#ff4500';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Seat
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.quadraticCurveTo(45, -5, 60, 5);
    ctx.lineTo(50, 10);
    ctx.closePath();
    ctx.fillStyle = '#333';
    ctx.fill();

    // Front fork
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(0, 40);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rear suspension
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.lineTo(50, 40);
    ctx.stroke();

    // Wheels
    function drawWheel(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Spokes
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 18 * Math.cos(i * Math.PI / 4), y + 18 * Math.sin(i * Math.PI / 4));
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawWheel(0, 40);  // Front wheel
    drawWheel(50, 40); // Rear wheel

    // Handlebars
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(0, 0);
    ctx.lineTo(20, 0);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Exhaust
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.lineTo(70, 35);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
}

// Define more obstacle types
const obstacleTypes = [
    { type: 'rock', width: 30, height: 30, color: '#808080', speed: 5 },
    { type: 'tree', width: 20, height: 80, color: '#228B22', speed: 5 },
    { type: 'bird', width: 40, height: 20, color: '#4169E1', speed: 8 },
    { type: 'cactus', width: 25, height: 50, color: '#006400', speed: 5 },
    { type: 'bush', width: 40, height: 40, color: '#32CD32', speed: 5 },
    { type: 'log', width: 60, height: 20, color: '#8B4513', speed: 5 },
    { type: 'boulder', width: 50, height: 50, color: '#A9A9A9', speed: 4 },
    { type: 'eagle', width: 50, height: 30, color: '#8B4513', speed: 9 }
];

function createObstacle() {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const obstacle = {
        x: canvas.width,
        y: Math.random() * (canvas.height - type.height), // Place obstacles anywhere vertically
        width: type.width,
        height: type.height,
        color: type.color,
        speed: obstacleSpeed * (type.speed / 5), // Adjust speed based on obstacle type
        type: type.type
    };
    obstacles.push(obstacle);
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add details to obstacles
        switch(obstacle.type) {
            case 'tree':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(obstacle.x + obstacle.width / 3, obstacle.y + obstacle.height * 0.8, obstacle.width / 3, obstacle.height * 0.2);
                break;
            case 'cactus':
                ctx.fillStyle = '#98FB98';
                ctx.fillRect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height * 0.2, obstacle.width / 4, obstacle.height * 0.6);
                break;
            case 'bird':
            case 'eagle':
                // Draw wings
                ctx.beginPath();
                ctx.moveTo(obstacle.x, obstacle.y + obstacle.height / 2);
                ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height / 2);
                ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'log':
                // Draw wood grain
                ctx.strokeStyle = '#A0522D';
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(obstacle.x, obstacle.y + (i + 1) * obstacle.height / 4);
                    ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + (i + 1) * obstacle.height / 4);
                    ctx.stroke();
                }
                break;
        }
    });
}

function moveObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacle.speed;
        // Remove the up and down movement for flying obstacles
    });
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
}

function checkCollision() {
    return obstacles.some(obstacle => 
        bike.x < obstacle.x + obstacle.width &&
        bike.x + bike.width > obstacle.x &&
        bike.y < obstacle.y + obstacle.height &&
        bike.y + bike.height > obstacle.y
    );
}

function updateScore() {
    score++;
    scoreElement.textContent = `Score: ${score}`;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
    
    // Increase difficulty every 1000 points, but only after reaching 1000
    if (score >= 1000 && score % 1000 === 0) {
        increaseDifficulty();
    }
}

function increaseDifficulty() {
    difficultyLevel++;
    obstacleSpeed += 0.3; // Reduced from 0.5
    obstacleSpawnRate += 0.001; // Reduced from 0.002
    
    // Update speed of existing obstacles
    obstacles.forEach(obstacle => {
        obstacle.speed = obstacleSpeed;
    });

    // Log difficulty increase to console (optional)
    console.log(`Difficulty increased to level ${difficultyLevel}`);
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
    startBtn.textContent = 'Restart Game';

    // Display final score and high score
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 70, canvas.height / 2 + 40);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2 - 70, canvas.height / 2 + 70);

    // Hide mobile controls
    mobileControls.style.display = 'none';
}

function updateBikePosition() {
    // Apply velocity to position
    bike.y += bike.velocityY;

    // Clamp position to canvas boundaries
    if (bike.y < 0) {
        bike.y = 0;
        bike.velocityY = 0;
    } else if (bike.y > canvas.height - bike.height) {
        bike.y = canvas.height - bike.height;
        bike.velocityY = 0;
    }

    // Apply friction to gradually slow down
    bike.velocityY *= 0.95;
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    updateBackground();
    updateBikePosition();
    drawBike();
    drawObstacles();
    moveObstacles();
    updateScore();

    if (checkCollision()) {
        gameOver();
    }

    // Increase obstacle spawn rate
    if (Math.random() < obstacleSpawnRate * 1.5) {
        createObstacle();
    }
}

// Add this function to check if the device is mobile or tablet
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

function startGame() {
    if (isGameRunning) return;

    isGameRunning = true;
    obstacles = [];
    score = 0;
    difficultyLevel = 1;
    obstacleSpeed = 3;
    obstacleSpawnRate = 0.01;
    bike.y = canvas.height - bike.height;
    scoreElement.textContent = 'Score: 0';
    highScoreElement.textContent = `High Score: ${highScore}`;
    startBtn.textContent = 'Game Running';
    initBackground();
    gameLoop = setInterval(update, 1000 / 60);

    // Show mobile controls if on a mobile device
    if (isMobileDevice()) {
        mobileControls.style.display = 'flex';
    }
}

startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;

    switch (e.key) {
        case 'ArrowUp':
            bike.velocityY = Math.max(bike.velocityY - bike.speed, -bike.maxSpeed);
            break;
        case 'ArrowDown':
            bike.velocityY = Math.min(bike.velocityY + bike.speed, bike.maxSpeed);
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (!isGameRunning) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            // Start slowing down when key is released
            bike.velocityY *= 0.5;
            break;
    }
});

// Add touch event listeners for mobile buttons
upBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isGameRunning) {
        bike.velocityY = Math.max(bike.velocityY - bike.speed, -bike.maxSpeed);
    }
});

downBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isGameRunning) {
        bike.velocityY = Math.min(bike.velocityY + bike.speed, bike.maxSpeed);
    }
});

upBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (isGameRunning) {
        bike.velocityY *= 0.5;
    }
});

downBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (isGameRunning) {
        bike.velocityY *= 0.5;
    }
});

// Add these lines near the top of the file, after the initial variable declarations
let highScore = localStorage.getItem('highScore') || 0;
const highScoreElement = document.createElement('p');
highScoreElement.id = 'high-score';
highScoreElement.textContent = `High Score: ${highScore}`;
document.getElementById('game-container').appendChild(highScoreElement);
const config = {
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),
    gridSize: 40,
    towers: [],
    enemies: [],
    path: [
        {x: 0, y: 3},
        {x: 7, y: 3},
        {x: 7, y: 7},
        {x: 0, y: 7},
        {x: 0, y: 11},
        {x: 7, y: 11},
        {x: 7, y: 15}
    ],
    money: 100,
    lives: 10,
    gameRunning: false,
    enemySpawnInterval: null,
    currentWave: 1,
    enemiesToSpawn: 5,
    enemiesSpawned: 0,
    enemiesKilled: 0
};

class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 150;
        this.damage = 10;
        this.cooldown = 1000; // ms
        this.lastShot = 0;
    }

    draw() {
        config.ctx.fillStyle = '#3498db';
        config.ctx.beginPath();
        config.ctx.arc(
            this.x * config.gridSize + config.gridSize/2,
            this.y * config.gridSize + config.gridSize/2,
            config.gridSize/2,
            0,
            Math.PI * 2
        );
        config.ctx.fill();
    }

    update(currentTime) {
        if (currentTime - this.lastShot > this.cooldown) {
            this.shoot();
            this.lastShot = currentTime;
        }
    }

    shoot() {
        for (let enemy of config.enemies) {
            const dx = (this.x * config.gridSize + config.gridSize/2) - enemy.x;
            const dy = (this.y * config.gridSize + config.gridSize/2) - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.range) {
                enemy.health -= this.damage;
                break;
            }
        }
    }
}

class Enemy {
    constructor() {
        this.pathIndex = 0;
        this.x = config.path[0].x * config.gridSize + config.gridSize/2;
        this.y = config.path[0].y * config.gridSize + config.gridSize/2;
        this.speed = Enemy.prototype.speed || 2;
        this.health = 100;
        this.maxHealth = 100;
    }

    draw() {
        config.ctx.fillStyle = '#e74c3c';
        config.ctx.beginPath();
        config.ctx.arc(this.x, this.y, config.gridSize/3, 0, Math.PI * 2);
        config.ctx.fill();

        // Barra de vida
        config.ctx.fillStyle = '#2ecc71';
        config.ctx.fillRect(
            this.x - config.gridSize/2,
            this.y - config.gridSize/2 - 10,
            (this.health / this.maxHealth) * config.gridSize,
            5
        );
    }

    update() {
        if (this.pathIndex < config.path.length - 1) {
            const targetX = config.path[this.pathIndex + 1].x * config.gridSize + config.gridSize/2;
            const targetY = config.path[this.pathIndex + 1].y * config.gridSize + config.gridSize/2;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.speed) {
                this.pathIndex++;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        } else {
            config.lives--;
            config.enemies = config.enemies.filter(e => e !== this);
        }
    }
}

function drawGrid() {
    config.ctx.strokeStyle = '#ddd';
    config.ctx.lineWidth = 1;
    
    for (let i = 0; i < config.canvas.width; i += config.gridSize) {
        config.ctx.beginPath();
        config.ctx.moveTo(i, 0);
        config.ctx.lineTo(i, config.canvas.height);
        config.ctx.stroke();
        
        config.ctx.beginPath();
        config.ctx.moveTo(0, i);
        config.ctx.lineTo(config.canvas.width, i);
        config.ctx.stroke();
    }
}

function drawPath() {
    config.ctx.strokeStyle = '#95a5a6';
    config.ctx.lineWidth = config.gridSize;
    
    config.ctx.beginPath();
    config.ctx.moveTo(
        config.path[0].x * config.gridSize + config.gridSize/2,
        config.path[0].y * config.gridSize + config.gridSize/2
    );
    
    for (let i = 1; i < config.path.length; i++) {
        config.ctx.lineTo(
            config.path[i].x * config.gridSize + config.gridSize/2,
            config.path[i].y * config.gridSize + config.gridSize/2
        );
    }
    
    config.ctx.stroke();
}

function drawUI() {
    config.ctx.fillStyle = '#000';
    config.ctx.font = '20px Arial';
    config.ctx.fillText(`Dinheiro: $${config.money}`, 10, 30);
    config.ctx.fillText(`Vidas: ${config.lives}`, 10, 60);
    config.ctx.fillText(`Fase: ${config.currentWave}`, 10, 90);
    config.ctx.fillText(`Inimigos: ${config.enemiesToSpawn - config.enemiesKilled}/${config.enemiesToSpawn}`, 10, 120);
}

function resetGame() {
    config.towers = [];
    config.enemies = [];
    config.money = 100;
    config.lives = 10;
    config.gameRunning = true;
    config.currentWave = 1;
    config.enemiesToSpawn = 5;
    config.enemiesSpawned = 0;
    config.enemiesKilled = 0;
    Enemy.prototype.speed = 2;

    config.enemySpawnInterval = setInterval(() => {
        if (config.enemiesSpawned < config.enemiesToSpawn && config.enemies.length < 10) {
            config.enemies.push(new Enemy());
            config.enemiesSpawned++;
        }
    }, 2000);

    gameLoop();
}

function stopGame() {
    config.gameRunning = false;
    clearInterval(config.enemySpawnInterval);
}

function gameLoop(timestamp) {
    if (!config.gameRunning) return;

    config.ctx.clearRect(0, 0, config.canvas.width, config.canvas.height);

    drawGrid();
    drawPath();
    drawUI();

    for (let tower of config.towers) {
        tower.update(timestamp);
        tower.draw();
    }

    for (let enemy of config.enemies) {
        enemy.update();
        enemy.draw();
    }
    
    const enemiesBefore = config.enemies.length;
    config.enemies = config.enemies.filter(enemy => enemy.health > 0);
    config.enemiesKilled += enemiesBefore - config.enemies.length;
    
    if (config.enemiesKilled >= config.enemiesToSpawn && config.enemies.length === 0) {
        startNewWave();
    }

    if (config.lives <= 0) {
        stopGame();
        alert(`Game Over! Você chegou até a fase ${config.currentWave}`);
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    resetGame();
});

function startNewWave() {
    config.currentWave++;
    config.enemiesToSpawn = 5 + (config.currentWave - 1) * 2;
    config.enemiesSpawned = 0;
    config.enemiesKilled = 0;
    config.money += 50 + (config.currentWave - 1) * 10;

    if (config.currentWave % 3 === 0) {
        Enemy.prototype.speed += 0.5;
    }
} 

config.canvas.addEventListener('click', (e) => {
    if (!config.gameRunning) return;
    
    const rect = config.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / config.gridSize);
    const y = Math.floor((e.clientY - rect.top) / config.gridSize);
    
    // Verificar se é um local válido para construir
    const isValidLocation = !config.path.some(point => 
        point.x === x && point.y === y
    ) && !config.towers.some(tower => 
        tower.x === x && tower.y === y
    );
    
    if (isValidLocation && config.money >= 50) {
        config.towers.push(new Tower(x, y));
        config.money -= 50;
    }
});
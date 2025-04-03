const config = {
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),
    gridSize: 40,
    towers: [],
    enemies: [],
    path: [],
    money: 100,
    lives: 10,
    gameRunning: false,
};

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

function drawUI() {
    config.ctx.fillStyle = '#000';
    config.ctx.font = '20px Arial';
    config.ctx.fillText(`Dinheiro: $${config.money}`, 10, 30);
    config.ctx.fillText(`Vidas: ${config.lives}`, 10, 60);
}

function resetGame() {
    config.towers = [];
    config.enemies = [];
    config.money = 100;
    config.lives = 10;
    config.gameRunning = true;
    
    gameLoop();
}

function stopGame() {
    config.gameRunning = false;
}

function gameLoop(timestamp) {
    if (!config.gameRunning) return;
    
    config.ctx.clearRect(0, 0, config.canvas.width, config.canvas.height);
    
    drawGrid();
 
    drawUI();
    
    requestAnimationFrame(gameLoop);
}

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    resetGame();
});

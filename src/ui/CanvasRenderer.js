import { Config } from '../game/core/Config';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    drawGrid() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.canvas.width; i += Config.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }

    drawPath() {
        this.ctx.strokeStyle = '#95a5a6';
        this.ctx.lineWidth = Config.gridSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(
            Config.path[0].x * Config.gridSize + Config.gridSize/2,
            Config.path[0].y * Config.gridSize + Config.gridSize/2
        );
        
        for (let i = 1; i < Config.path.length; i++) {
            this.ctx.lineTo(
                Config.path[i].x * Config.gridSize + Config.gridSize/2,
                Config.path[i].y * Config.gridSize + Config.gridSize/2
            );
        }
        
        this.ctx.stroke();
    }

    drawUI(gameState, waveManager) {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Dinheiro: $${gameState.money}`, 10, 30);
        this.ctx.fillText(`Vidas: ${gameState.lives}`, 10, 60);
        this.ctx.fillText(`Fase: ${waveManager.currentWave}`, 10, 90);
        this.ctx.fillText(`Inimigos: ${waveManager.enemiesToSpawn - waveManager.enemiesKilled}/${waveManager.enemiesToSpawn}`, 10, 120);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
} 
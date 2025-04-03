import { Config } from '../core/Config';

export class Enemy {
    constructor() {
        this.pathIndex = 0;
        this.x = Config.path[0].x * Config.gridSize + Config.gridSize/2;
        this.y = Config.path[0].y * Config.gridSize + Config.gridSize/2;
        this.speed = Config.enemySpeed;
        this.health = Config.enemyHealth;
        this.maxHealth = Config.enemyHealth;
    }

    draw(ctx) {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x, this.y, Config.gridSize/3, 0, Math.PI * 2);
        ctx.fill();

        // Barra de vida
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(
            this.x - Config.gridSize/2,
            this.y - Config.gridSize/2 - 10,
            (this.health / this.maxHealth) * Config.gridSize,
            5
        );
    }

    update() {
        if (this.pathIndex < Config.path.length - 1) {
            const targetX = Config.path[this.pathIndex + 1].x * Config.gridSize + Config.gridSize/2;
            const targetY = Config.path[this.pathIndex + 1].y * Config.gridSize + Config.gridSize/2;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.speed) {
                this.pathIndex++;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }
} 
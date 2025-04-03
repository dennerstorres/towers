import { Config } from '../core/Config.js';

export class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = Config.towerRange;
        this.damage = Config.towerDamage;
        this.cooldown = Config.towerCooldown;
        this.lastShot = 0;
    }

    draw(ctx) {
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(
            this.x * Config.gridSize + Config.gridSize/2,
            this.y * Config.gridSize + Config.gridSize/2,
            Config.gridSize/2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    update(currentTime, enemies) {
        if (currentTime - this.lastShot > this.cooldown) {
            this.shoot(enemies);
            this.lastShot = currentTime;
        }
    }

    shoot(enemies) {
        for (let enemy of enemies) {
            const dx = (this.x * Config.gridSize + Config.gridSize/2) - enemy.x;
            const dy = (this.y * Config.gridSize + Config.gridSize/2) - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.range) {
                enemy.health -= this.damage;
                break;
            }
        }
    }
} 
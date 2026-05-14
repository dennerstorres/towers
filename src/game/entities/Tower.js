import { Config } from '../core/Config.js';
import { Projectile } from './Projectile.js';

export class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = Config.towerRange;
        this.damage = Config.towerDamage;
        this.cooldown = Config.towerCooldown;
        this.lastShot = 0;
    }

    update(currentTime, enemies) {
        if (currentTime - this.lastShot > this.cooldown) {
            const projectile = this.shoot(enemies);
            if (projectile) {
                this.lastShot = currentTime;
                return projectile;
            }
        }
        return null;
    }

    shoot(enemies) {
        for (let enemy of enemies) {
            const centerX = this.x * Config.gridSize + Config.gridSize / 2;
            const centerY = this.y * Config.gridSize + Config.gridSize / 2;

            const dx = centerX - enemy.x;
            const dy = centerY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.range) {
                return new Projectile(centerX, centerY, enemy, this.damage);
            }
        }
        return null;
    }
} 
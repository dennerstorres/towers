import { Config } from '../core/Config.js';
import { Projectile } from './Projectile.js';

export class Tower {
    constructor(x, y, type = 'archer') {
        this.x = x;
        this.y = y;
        this.type = type;

        const stats = Config.TOWERS[type.toUpperCase()] || Config.TOWERS.ARCHER;

        this.range = stats.range;
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.projectileSpeed = stats.projectileSpeed;
        this.splashRadius = stats.splashRadius || 0;

        this.baseCost = stats.cost;
        this.totalInvested = stats.cost;
        this.level = 1;
        this.maxLevel = 3;

        this.lastShot = 0;
    }

    upgrade() {
        if (this.level >= this.maxLevel) return false;

        const upgradeCost = this.getUpgradeCost();
        this.totalInvested += upgradeCost;
        this.level++;

        // Melhora de stats: +50% dano, +10% alcance por nível
        this.damage = Math.floor(this.damage * 1.5);
        this.range = Math.floor(this.range * 1.1);

        return true;
    }

    getUpgradeCost() {
        if (this.level >= this.maxLevel) return Infinity;
        return Math.floor(this.baseCost * Math.pow(Config.UPGRADE_MULTIPLIER, this.level));
    }

    getSellValue() {
        return Math.floor(this.totalInvested * Config.SELL_REFUND_PERCENTAGE);
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
                const projectile = new Projectile(centerX, centerY, enemy, this.damage);
                projectile.type = this.type;
                projectile.speed = this.projectileSpeed;
                projectile.splashRadius = this.splashRadius;
                return projectile;
            }
        }
        return null;
    }
} 
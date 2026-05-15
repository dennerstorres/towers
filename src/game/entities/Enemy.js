import { Config } from '../core/Config.js';

export class Enemy {
    constructor(type = 'goblin') {
        this.type = type;
        this.pathIndex = 0;
        this.x = Config.path[0].x * Config.gridSize + Config.gridSize/2;
        this.y = Config.path[0].y * Config.gridSize + Config.gridSize/2;

        // Base stats
        this.speed = Config.enemySpeed;
        this.health = Config.enemyHealth;

        // Apply type multipliers or stats
        if (type === 'orc') {
            this.health *= 2;
            this.speed *= 0.7;
        } else if (type === 'scout') {
            this.health *= 0.5;
            this.speed *= 1.5;
        }

        this.maxHealth = this.health;
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
                if (this.pathIndex >= Config.path.length - 1) {
                    this.reachedEnd = true;
                }
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }
} 
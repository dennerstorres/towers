import { Config } from '../core/Config.js';

export class Enemy {
    constructor(type = 'goblin', data = null) {
        this.type = type;
        this.pathIndex = 0;
        this.x = Config.path[0].x * Config.gridSize + Config.gridSize/2;
        this.y = Config.path[0].y * Config.gridSize + Config.gridSize/2;

        // Base stats
        this.speed = Config.enemySpeed;
        this.health = Config.enemyHealth;
        this.ac = 10; // Default Armor Class

        // Apply data from enemies.json if available
        if (data) {
            this.health = data.hp || this.health;
            this.ac = data.ac || this.ac;
            this.speed = data.speed || this.speed;
        } else {
            // Fallback for types without explicit data
            if (type === 'orc') {
                this.health *= 2;
                this.speed *= 0.7;
                this.ac = 13;
            } else if (type === 'scout') {
                this.health *= 0.5;
                this.speed *= 1.5;
                this.ac = 12;
            }
        }

        this.maxHealth = this.health;
    }

    update() {
        if (this.pathIndex < Config.path.length - 1) {
            const targetX = Config.path[this.pathIndex + 1].x * Config.gridSize + Config.gridSize/2;
            const targetY = Config.path[this.pathIndex + 1].y * Config.gridSize + Config.gridSize/2;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distanceSq = dx * dx + dy * dy;
            
            if (distanceSq < this.speed * this.speed) {
                this.pathIndex++;
                if (this.pathIndex >= Config.path.length - 1) {
                    this.reachedEnd = true;
                }
            } else {
                const distance = Math.sqrt(distanceSq);
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }
} 
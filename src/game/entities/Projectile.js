import { Config } from '../core/Config.js';

export class Projectile {
    constructor(x, y, target, damage) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = Config.projectileSpeed || 5;
        this.radius = 4;
        this.reached = false;
    }

    update() {
        if (!this.target || this.target.health <= 0) {
            this.reached = true;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.x = this.target.x;
            this.y = this.target.y;
            this.target.health -= this.damage;
            this.reached = true;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }
}

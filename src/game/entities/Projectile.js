import { Config } from '../core/Config.js';

export class Projectile {
    constructor(x, y, target, damage, attacker = null, damageType = 'piercing') {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.attacker = attacker;
        this.damageType = damageType;
        this.speed = 5;
        this.radius = 4;
        this.reached = false;
        this.type = 'archer';
        this.splashRadius = 0;
    }

    update() {
        if (!this.target || (this.target.health <= 0 && !this.reached)) {
            // Se o alvo morreu antes do projétil chegar, marcamos como atingido
            // Futuramente poderia continuar até a última posição conhecida
            this.reached = true;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.x = this.target.x;
            this.y = this.target.y;
            this.reached = true;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }
}

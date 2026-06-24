import { Projectile } from '../entities/Projectile.js';

export class ProjectileManager {
    constructor() {
        this.pool = [];
        this.maxPoolSize = 200;
    }

    get(x, y, target, damage, attacker = null, damageType = 'piercing') {
        let p;
        if (this.pool.length > 0) {
            p = this.pool.pop();
            p.x = x;
            p.y = y;
            p.prevX = x;
            p.prevY = y;
            p.target = target;
            p.damage = damage;
            p.attacker = attacker;
            p.damageType = damageType;
            p.reached = false;
            p.speed = 5;
            p.radius = 4;
            p.type = 'archer';
            p.splashRadius = 0;
            p.tauntDuration = 0;
            p.slowEffect = 0;
        } else {
            p = new Projectile(x, y, target, damage, attacker, damageType);
        }
        return p;
    }

    release(projectile) {
        if (this.pool.length < this.maxPoolSize) {
            this.pool.push(projectile);
        }
    }

    clear() {
        this.pool = [];
    }
}

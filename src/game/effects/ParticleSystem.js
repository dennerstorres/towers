export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        this.maxPoolSize = 500;
    }

    emit(x, y, color, count = 8, type = 'explosion') {
        for (let i = 0; i < count; i++) {
            let angle, speed, decay, size, gravity = 0;

            if (type === 'spark') {
                angle = -Math.PI / 2 + (Math.random() - 0.5);
                speed = 2 + Math.random() * 4;
                decay = 0.05 + Math.random() * 0.05;
                size = 1 + Math.random() * 2;
                gravity = 0.1;
            } else if (type === 'smoke') {
                angle = Math.random() * Math.PI * 2;
                speed = 0.2 + Math.random() * 0.5;
                decay = 0.01 + Math.random() * 0.02;
                size = 4 + Math.random() * 6;
            } else { // explosion
                angle = Math.random() * Math.PI * 2;
                speed = 1 + Math.random() * 3;
                decay = 0.02 + Math.random() * 0.03;
                size = 2 + Math.random() * 3;
            }

            let p;
            if (this.pool.length > 0) {
                p = this.pool.pop();
                p.x = x;
                p.y = y;
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                p.gravity = gravity;
                p.life = 1.0;
                p.decay = decay;
                p.color = color;
                p.size = size;
                p.type = type;
                p.active = true;
            } else {
                p = {
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity,
                    life: 1.0,
                    decay,
                    color,
                    size,
                    type,
                    active: true
                };
            }
            this.particles.push(p);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += p.gravity;

            p.life -= p.decay;

            // Smoke expands and fades
            if (p.type === 'smoke') {
                p.size += 0.1;
            }

            if (p.life <= 0) {
                p.active = false;
                if (this.pool.length < this.maxPoolSize) {
                    this.pool.push(p);
                }
                this.particles.splice(i, 1);
            }
        }
    }

    getParticles() {
        return this.particles;
    }
}

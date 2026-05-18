export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        this.maxPoolSize = 500;
    }

    emit(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;

            let p;
            if (this.pool.length > 0) {
                p = this.pool.pop();
                p.x = x;
                p.y = y;
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                p.life = 1.0;
                p.decay = 0.02 + Math.random() * 0.03;
                p.color = color;
                p.size = 2 + Math.random() * 3;
                p.active = true;
            } else {
                p = {
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    decay: 0.02 + Math.random() * 0.03,
                    color,
                    size: 2 + Math.random() * 3,
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
            p.life -= p.decay;

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

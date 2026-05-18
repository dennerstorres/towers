export class FloatingText {
    constructor() {
        this.texts = [];
        this.pool = [];
        this.maxPoolSize = 100;
    }

    /**
     * Adiciona um novo texto flutuante
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {string} text - Conteúdo do texto
     * @param {string} color - Cor do texto (hex ou nome)
     */
    add(x, y, text, color) {
        let t;
        const vx = (Math.random() - 0.5) * 0.6;
        const vy = -0.8 - Math.random() * 0.5;

        if (this.pool.length > 0) {
            t = this.pool.pop();
            t.x = x;
            t.y = y;
            t.text = text;
            t.color = color;
            t.life = 1.0;
            t.vx = vx;
            t.vy = vy;
            t.active = true;
        } else {
            t = {
                x: x,
                y: y,
                text: text,
                color: color,
                life: 1.0,
                decay: 0.02,
                vx: vx,
                vy: vy,
                active: true
            };
        }
        this.texts.push(t);
    }

    update() {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.x += t.vx;
            t.y += t.vy;
            t.life -= t.decay;

            if (t.life <= 0) {
                t.active = false;
                if (this.pool.length < this.maxPoolSize) {
                    this.pool.push(t);
                }
                this.texts.splice(i, 1);
            }
        }
    }
}

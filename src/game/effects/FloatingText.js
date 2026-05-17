export class FloatingText {
    constructor() {
        this.texts = [];
    }

    /**
     * Adiciona um novo texto flutuante
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {string} text - Conteúdo do texto
     * @param {string} color - Cor do texto (hex ou nome)
     */
    add(x, y, text, color) {
        this.texts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 1.0,
            decay: 0.02,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -0.8 - Math.random() * 0.5
        });
    }

    update() {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.x += t.vx;
            t.y += t.vy;
            t.life -= t.decay;

            if (t.life <= 0) {
                this.texts.splice(i, 1);
            }
        }
    }
}

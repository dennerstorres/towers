export class FloatingText {
    constructor() {
        this.texts = [];
        this.pool = [];
        this.maxPoolSize = 100;
        // Teto duro de textos ativos para evitar acúmulo infinito.
        this.maxTexts = 150;
    }

    /**
     * Adiciona um novo texto flutuante
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {string} text - Conteúdo do texto
     * @param {string} color - Cor do texto (hex ou nome)
     */
    add(x, y, text, color, isCrit = false) {
        let t;
        const vx = (Math.random() - 0.5) * 0.6;
        const vy = isCrit ? -2.0 : (-0.8 - Math.random() * 0.5);
        const decay = isCrit ? 0.012 : 0.02;

        if (this.pool.length > 0) {
            t = this.pool.pop();
            t.x = x;
            t.y = y;
            t.text = text;
            t.color = color;
            t.isCrit = isCrit;
            t.life = 1.0;
            t.decay = decay;
            t.vx = vx;
            t.vy = vy;
            t.active = true;
        } else {
            t = {
                x: x,
                y: y,
                text: text,
                color: color,
                isCrit: isCrit,
                life: 1.0,
                decay: decay,
                vx: vx,
                vy: vy,
                active: true
            };
        }
        // Respeita o teto: descarta se já estiver no limite.
        if (this.texts.length >= this.maxTexts) return;
        this.texts.push(t);
    }

    update() {
        // Compactação in-place (swap-pop): O(n), sem splice.
        let write = 0;
        for (let i = 0; i < this.texts.length; i++) {
            const t = this.texts[i];
            t.x += t.vx;
            t.y += t.vy;
            t.life -= t.decay;

            if (t.life > 0) {
                this.texts[write++] = t;
            } else {
                t.active = false;
                if (this.pool.length < this.maxPoolSize) {
                    this.pool.push(t);
                }
            }
        }
        this.texts.length = write;
    }
}

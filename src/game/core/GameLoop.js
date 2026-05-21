export class GameLoop {
    constructor(callbacks = {}) {
        this.onUpdate = callbacks.onUpdate || (() => {});
        this.onRender = callbacks.onRender || (() => {});
        this.shouldRun = callbacks.shouldRun || (() => true);
        this.getGameSpeed = callbacks.getGameSpeed || (() => 1);
        this.isPaused = callbacks.isPaused || (() => false);

        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = 1000 / 60; // 16.67ms
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = 0;
        this.accumulator = 0;
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    stop() {
        this.isRunning = false;
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        if (this.lastTime === 0) this.lastTime = timestamp;
        let deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Limita o deltaTime para evitar "espirais da morte"
        if (deltaTime > 100) deltaTime = 100;

        if (this.shouldRun() && !this.isPaused()) {
            this.accumulator += deltaTime * this.getGameSpeed();

            while (this.accumulator >= this.timeStep) {
                this.onUpdate(this.timeStep);
                this.accumulator -= this.timeStep;
            }
        } else if (!this.shouldRun()) {
            // Se não deve estar rodando, para o loop e limpa lastTime
            this.isRunning = false;
            this.lastTime = 0;
            return;
        }

        // Renderização ocorre independente de pausa (para manter UI responsiva)
        this.onRender();

        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }
}

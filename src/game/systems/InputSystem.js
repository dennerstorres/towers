export class InputSystem {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.callbacks = callbacks;
        this.setupEventListeners();
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.callbacks.onKeyDown) {
                this.callbacks.onKeyDown(e);
            }
        });

        const handleMove = (e) => {
            const pos = this.getMousePos(e);
            if (this.callbacks.onMouseMove) {
                this.callbacks.onMouseMove(pos.x, pos.y);
            }
        };

        this.canvas.addEventListener('mousemove', handleMove);
        this.canvas.addEventListener('touchmove', (e) => {
            handleMove(e);
            if (e.cancelable) e.preventDefault();
        }, { passive: false });

        const handleClick = (e) => {
            const pos = this.getMousePos(e);
            if (this.callbacks.onClick) {
                this.callbacks.onClick(pos.x, pos.y);
            }
        };

        this.canvas.addEventListener('click', handleClick);
        this.canvas.addEventListener('touchstart', (e) => {
            handleMove(e);
            handleClick(e);
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
    }
}

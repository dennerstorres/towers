export class InputSystem {
    constructor(canvas, callbacks = {}, settings = null) {
        this.canvas = canvas;
        this.callbacks = callbacks;
        this.settings = settings;
        this.gamepads = {};
        this.prevGamepadState = {};

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

    isActionTriggered(event, action) {
        const defaultBinds = {
            'pause': 'Space',
            'speed': 'KeyT'
        };

        const bind = this.settings ? this.settings.state.keybinds[action] : defaultBinds[action];
        return event.code === bind;
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

        // Gamepad support
        window.addEventListener("gamepadconnected", (e) => {
            this.gamepads[e.gamepad.index] = e.gamepad;
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            delete this.gamepads[e.gamepad.index];
        });
    }

    update() {
        this.pollGamepads();
    }

    pollGamepads() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let gp of gamepads) {
            if (!gp) continue;

            const prevState = this.prevGamepadState[gp.index] || { buttons: [] };

            // Map buttons to actions
            // 0: A/Cross -> Click
            if (gp.buttons[0].pressed && !prevState.buttons[0]?.pressed) {
                if (this.callbacks.onClick) {
                    this.callbacks.onClick(this.lastMouseX || 0, this.lastMouseY || 0);
                }
            }

            // 9: Start -> Pause
            if (gp.buttons[9].pressed && !prevState.buttons[9]?.pressed) {
                if (this.callbacks.onKeyDown) {
                    this.callbacks.onKeyDown({ code: 'Space', preventDefault: () => {} });
                }
            }

            // Stick movement (emulate mouse)
            const stickX = gp.axes[0];
            const stickY = gp.axes[1];
            if (Math.abs(stickX) > 0.1 || Math.abs(stickY) > 0.1) {
                this.lastMouseX = (this.lastMouseX || 0) + stickX * 10;
                this.lastMouseY = (this.lastMouseY || 0) + stickY * 10;

                // Clamp
                this.lastMouseX = Math.max(0, Math.min(this.canvas.width, this.lastMouseX));
                this.lastMouseY = Math.max(0, Math.min(this.canvas.height, this.lastMouseY));

                if (this.callbacks.onMouseMove) {
                    this.callbacks.onMouseMove(this.lastMouseX, this.lastMouseY);
                }
            }

            this.prevGamepadState[gp.index] = {
                buttons: gp.buttons.map(b => ({ pressed: b.pressed }))
            };
        }
    }
}

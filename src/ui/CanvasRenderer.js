import { Config } from '../game/core/Config.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    drawGrid() {
        this.ctx.strokeStyle = Config.THEME.colors.grid;
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.canvas.width; i += Config.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }

    drawPath() {
        this.ctx.strokeStyle = Config.THEME.colors.path;
        this.ctx.lineWidth = Config.gridSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(
            Config.path[0].x * Config.gridSize + Config.gridSize/2,
            Config.path[0].y * Config.gridSize + Config.gridSize/2
        );
        
        for (let i = 1; i < Config.path.length; i++) {
            this.ctx.lineTo(
                Config.path[i].x * Config.gridSize + Config.gridSize/2,
                Config.path[i].y * Config.gridSize + Config.gridSize/2
            );
        }
        
        this.ctx.stroke();
    }

    drawUI(gameState, waveManager, ui) {
        const hudHeight = ui.hudHeight;
        const padding = 20;
        const itemWidth = 160;

        // HUD Background
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.globalAlpha = 0.9;
        this.ctx.fillRect(0, 0, this.canvas.width, hudHeight);
        this.ctx.globalAlpha = 1.0;

        // HUD Bottom Border
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, hudHeight);
        this.ctx.lineTo(this.canvas.width, hudHeight);
        this.ctx.stroke();

        const items = ui.getHUDData(gameState, waveManager);

        items.forEach((item, index) => {
            const x = padding + index * itemWidth;
            const y = hudHeight / 2;

            this.drawIcon(item.icon, x, y, 20, item.color);

            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = `bold 18px ${Config.THEME.font}`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';

            // Add a small shadow to text
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;

            this.ctx.fillText(item.value, x + 30, y);

            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        });
    }

    drawIcon(type, x, y, size, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        switch (type) {
            case 'gold':
                // Draw Coin
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y, size/2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#d4ac0d';
                this.ctx.stroke();
                this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
                this.ctx.font = `bold ${size*0.8}px serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('$', x + size/2, y);
                break;
            case 'heart':
                // Draw Heart
                const hX = x;
                const hY = y - size/2;
                this.ctx.beginPath();
                this.ctx.moveTo(hX + size/2, hY + size/4);
                this.ctx.bezierCurveTo(hX + size/2, hY, hX, hY, hX, hY + size/4);
                this.ctx.bezierCurveTo(hX, hY + size/2, hX + size/2, hY + size*0.75, hX + size/2, hY + size);
                this.ctx.bezierCurveTo(hX + size/2, hY + size*0.75, hX + size, hY + size/2, hX + size, hY + size/4);
                this.ctx.bezierCurveTo(hX + size, hY, hX + size/2, hY, hX + size/2, hY + size/4);
                this.ctx.fill();
                break;
            case 'wave':
                // Draw Shield
                const sX = x;
                const sY = y - size/2;
                this.ctx.beginPath();
                this.ctx.moveTo(sX, sY);
                this.ctx.lineTo(sX + size, sY);
                this.ctx.lineTo(sX + size, sY + size/2);
                this.ctx.quadraticCurveTo(sX + size, sY + size, sX + size/2, sY + size);
                this.ctx.quadraticCurveTo(sX, sY + size, sX, sY + size/2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.strokeStyle = '#f1c40f';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                break;
            case 'enemy':
                // Draw simple skull-ish shape
                const eX = x;
                const eY = y - size/2;
                this.ctx.beginPath();
                this.ctx.arc(eX + size/2, eY + size/3, size/3, Math.PI, 0);
                this.ctx.lineTo(eX + size*0.8, eY + size);
                this.ctx.lineTo(eX + size*0.2, eY + size);
                this.ctx.closePath();
                this.ctx.fill();
                // Eyes
                this.ctx.fillStyle = Config.THEME.colors.darkStone;
                this.ctx.beginPath();
                this.ctx.arc(eX + size*0.35, eY + size/3, size/8, 0, Math.PI*2);
                this.ctx.arc(eX + size*0.65, eY + size/3, size/8, 0, Math.PI*2);
                this.ctx.fill();
                break;
        }
        this.ctx.restore();
    }

    drawTower(tower) {
        const x = tower.x * Config.gridSize;
        const y = tower.y * Config.gridSize;
        const size = Config.gridSize;

        this.ctx.save();

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2 + 2, y + size - 5, 12, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Tower Body
        this.ctx.fillStyle = Config.THEME.colors.stone;
        this.ctx.fillRect(x + 8, y + 10, 24, 25);

        // Tower Top (the platform)
        this.ctx.fillStyle = Config.THEME.colors.stone;
        this.ctx.fillRect(x + 5, y + 5, 30, 7);

        // Battlements (merlons)
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.fillRect(x + 5, y + 2, 6, 3);
        this.ctx.fillRect(x + 17, y + 2, 6, 3);
        this.ctx.fillRect(x + 29, y + 2, 6, 3);

        // Decorative line under battlements
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.fillRect(x + 5, y + 12, 30, 1);

        // Window
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(x + 18, y + 18, 4, 6);

        // Base/Foundation
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.fillRect(x + 6, y + 35, 28, 3);

        this.ctx.restore();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
} 
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

        this.drawTowerSelectionPanel(gameState, ui);

        if (gameState.selectedPlacedTower) {
            this.drawTowerMenu(gameState.selectedPlacedTower, gameState.money, ui);
        }
    }

    drawTowerMenu(tower, money, ui) {
        const layout = ui.getTowerMenuLayout(tower);
        const upgradeCost = tower.getUpgradeCost();
        const sellValue = tower.getSellValue();

        this.ctx.save();
        this.ctx.font = `bold 12px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw Upgrade Button
        if (tower.level < tower.maxLevel) {
            const canAfford = money >= upgradeCost;
            this.drawButton(layout.upgrade, canAfford ? Config.THEME.colors.gold : Config.THEME.colors.bloodRed, `${layout.upgrade.label} (${upgradeCost}G)`);
        } else {
            this.drawButton(layout.upgrade, Config.THEME.colors.stone, 'Nível Máximo', true);
        }

        // Draw Sell Button
        this.drawButton(layout.sell, Config.THEME.colors.bloodRed, `${layout.sell.label} (${sellValue}G)`);

        this.ctx.restore();
    }

    drawButton(btn, color, label, disabled = false) {
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
        this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

        this.ctx.fillStyle = disabled ? '#95a5a6' : '#ecf0f1';
        this.ctx.fillText(label, btn.x + btn.width / 2, btn.y + btn.height / 2);
    }

    drawTowerSelectionPanel(gameState, ui) {
        const panelWidth = ui.panelWidth;
        const x = this.canvas.width - panelWidth;
        const y = ui.hudHeight;
        const height = this.canvas.height - ui.hudHeight;

        // Panel Background
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.globalAlpha = 0.8;
        this.ctx.fillRect(x, y, panelWidth, height);
        this.ctx.globalAlpha = 1.0;

        // Panel Left Border
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();

        const towerData = ui.getTowerSelectionData(gameState.towerManager);
        const itemHeight = 80;
        const padding = 10;

        towerData.forEach((tower, index) => {
            const itemY = y + padding + index * (itemHeight + padding);
            const itemX = x + padding;
            const itemWidth = panelWidth - padding * 2;

            // Highlight if selected
            if (tower.isSelected) {
                this.ctx.fillStyle = 'rgba(241, 196, 15, 0.2)';
                this.ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
                this.ctx.strokeStyle = Config.THEME.colors.gold;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);
            } else {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);
            }

            // Draw Mini Tower Icon
            this.drawTowerIcon(tower.type, itemX + itemWidth / 2, itemY + 30);

            // Cost
            this.ctx.fillStyle = gameState.money >= tower.cost ? Config.THEME.colors.gold : Config.THEME.colors.bloodRed;
            this.ctx.font = `bold 14px ${Config.THEME.font}`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${tower.cost} G`, itemX + itemWidth / 2, itemY + 65);
        });
    }

    drawTowerIcon(type, x, y) {
        this.ctx.save();
        this.ctx.translate(x - 15, y - 15);
        this.ctx.scale(0.8, 0.8);

        // Mock a tower object for drawTower
        const mockTower = { x: 0, y: 0, type: type };
        const originalGridSize = Config.gridSize;

        // Temporarily adjust gridSize for icon drawing
        const tempGridSize = 40;

        this.drawTower(mockTower, true);

        this.ctx.restore();
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

    drawProjectile(projectile) {
        this.ctx.save();

        let color = Config.THEME.colors.gold;
        let radius = projectile.radius;
        let glow = true;

        if (projectile.type === 'cannon') {
            color = '#34495e';
            radius = 6;
            glow = false;
        } else if (projectile.type === 'mage') {
            color = Config.THEME.colors.mage;
            radius = 5;
        }

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(projectile.x, projectile.y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (glow) {
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = color;
            this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawParticles(particles) {
        this.ctx.save();
        for (const p of particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawTower(tower, isIcon = false) {
        const x = isIcon ? 0 : tower.x * Config.gridSize;
        const y = isIcon ? 0 : tower.y * Config.gridSize;
        const size = Config.gridSize; // Base size for drawing

        this.ctx.save();

        if (!isIcon) {
            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(x + size/2 + 2, y + size - 5, 12, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Distinct colors based on type
        let primaryColor = Config.THEME.colors.stone;
        let accentColor = Config.THEME.colors.gold;

        if (tower.type === 'archer') accentColor = Config.THEME.colors.archer;
        if (tower.type === 'cannon') {
            primaryColor = '#95a5a6';
            accentColor = Config.THEME.colors.cannon;
        }
        if (tower.type === 'mage') {
            primaryColor = '#34495e';
            accentColor = Config.THEME.colors.mage;
        }

        // Tower Body
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(x + 8, y + 10, 24, 25);

        // Tower Top (the platform)
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(x + 5, y + 5, 30, 7);

        // Battlements (merlons)
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.fillRect(x + 5, y + 2, 6, 3);
        this.ctx.fillRect(x + 17, y + 2, 6, 3);
        this.ctx.fillRect(x + 29, y + 2, 6, 3);

        // Decorative line under battlements
        this.ctx.fillStyle = accentColor;
        this.ctx.fillRect(x + 5, y + 12, 30, 2);

        // Type specific visual elements
        if (tower.type === 'mage') {
            // Glowing orb for mage tower
            this.ctx.fillStyle = accentColor;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = accentColor;
            this.ctx.beginPath();
            this.ctx.arc(x + 20, y - 2, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        } else if (tower.type === 'cannon') {
            // Bulky cannon barrel
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(x + 15, y + 15, 10, 10);
        } else {
            // Archer Window
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(x + 18, y + 18, 4, 6);
        }

        // Base/Foundation
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.fillRect(x + 6, y + 35, 28, 3);

        // Level Indicators
        if (!isIcon) {
            for (let i = 0; i < tower.level; i++) {
                this.ctx.fillStyle = Config.THEME.colors.gold;
                this.ctx.beginPath();
                this.ctx.arc(x + 10 + i * 10, y + 32, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    drawEnemy(enemy) {
        const size = Config.gridSize * 0.7;
        const x = enemy.x - size / 2;
        const y = enemy.y - size / 2;

        this.ctx.save();

        // Body color based on type
        let bodyColor = '#27ae60'; // Goblin (Green)
        if (enemy.type === 'orc') bodyColor = '#8e44ad'; // Orc (Purple/Dark)
        if (enemy.type === 'scout') bodyColor = '#d35400'; // Scout (Orange)

        // Body
        this.ctx.fillStyle = bodyColor;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 5, y + 5, size - 10, size - 10, 5);
        this.ctx.fill();

        // Ears (different for Orc)
        this.ctx.beginPath();
        if (enemy.type === 'orc') {
            // Orc has horn-like ears
            this.ctx.moveTo(x + 8, y + 5);
            this.ctx.lineTo(x + 2, y - 2);
            this.ctx.lineTo(x + 12, y + 8);

            this.ctx.moveTo(x + size - 8, y + 5);
            this.ctx.lineTo(x + size - 2, y - 2);
            this.ctx.lineTo(x + size - 12, y + 8);
        } else {
            // Goblin/Scout has pointed ears
            this.ctx.moveTo(x + 5, y + 10);
            this.ctx.lineTo(x, y + 5);
            this.ctx.lineTo(x + 5, y + 15);

            this.ctx.moveTo(x + size - 5, y + 10);
            this.ctx.lineTo(x + size, y + 5);
            this.ctx.lineTo(x + size - 5, y + 15);
        }
        this.ctx.fill();

        // Eyes (Orc has red eyes)
        const eyeColor = enemy.type === 'orc' ? '#e74c3c' : '#fff';
        this.ctx.fillStyle = eyeColor;
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.35, y + size * 0.4, 3, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.65, y + size * 0.4, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.35, y + size * 0.4, 1.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.65, y + size * 0.4, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Mouth (different for each)
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        if (enemy.type === 'orc') {
            // Orc tusks
            this.ctx.moveTo(x + size * 0.3, y + size * 0.8);
            this.ctx.lineTo(x + size * 0.35, y + size * 0.6);
            this.ctx.moveTo(x + size * 0.7, y + size * 0.8);
            this.ctx.lineTo(x + size * 0.65, y + size * 0.6);
        } else {
            // Goblin/Scout teeth
            this.ctx.moveTo(x + size * 0.4, y + size * 0.7);
            this.ctx.lineTo(x + size * 0.45, y + size * 0.65);
            this.ctx.lineTo(x + size * 0.5, y + size * 0.7);
            this.ctx.lineTo(x + size * 0.55, y + size * 0.65);
            this.ctx.lineTo(x + size * 0.6, y + size * 0.7);
        }
        this.ctx.stroke();

        // Health Bar
        const healthPercent = enemy.health / enemy.maxHealth;
        const barWidth = Config.gridSize * 0.8;
        const barHeight = 4;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - size / 2 - 8;

        // Bar Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Bar Fill
        // Color interpolation (Green -> Yellow -> Red)
        let color;
        if (healthPercent > 0.5) {
            color = '#2ecc71'; // Green
        } else if (healthPercent > 0.2) {
            color = '#f1c40f'; // Yellow
        } else {
            color = '#e74c3c'; // Red
        }

        this.ctx.fillStyle = color;
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Bar Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        this.ctx.restore();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
} 
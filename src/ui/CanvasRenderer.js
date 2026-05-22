import { Config } from '../game/core/Config.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Canvas offscreen para pré-renderizar o fundo
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = canvas.width;
        this.bgCanvas.height = canvas.height;
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.isBgRendered = false;
    }

    preRenderBackground() {
        if (this.isBgRendered) return;

        const ctx = this.bgCtx;
        const width = this.bgCanvas.width;
        const height = this.bgCanvas.height;

        // Fundo base (Grama)
        ctx.fillStyle = Config.THEME.colors.grass;
        ctx.fillRect(0, 0, width, height);

        // Adiciona variações de grama (manchas mais escuras)
        ctx.fillStyle = Config.THEME.colors.grassDark;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 20 + Math.random() * 40;
            ctx.globalAlpha = 0.2 + Math.random() * 0.3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Adiciona manchas de terra
        ctx.fillStyle = Config.THEME.colors.dirt;
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 10 + Math.random() * 20;
            ctx.globalAlpha = 0.1 + Math.random() * 0.2;
            ctx.beginPath();
            ctx.ellipse(x, y, size * 2, size, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pequenas pedras decorativas
        ctx.fillStyle = Config.THEME.colors.stone;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;

        // Renderiza o caminho no buffer do fundo para evitar flickering
        this.renderPathToCtx(ctx);

        // Renderiza a grade no buffer do fundo
        this.renderGridToCtx(ctx, width, height);

        this.isBgRendered = true;
    }

    renderGridToCtx(ctx, width, height) {
        ctx.save();
        ctx.strokeStyle = Config.THEME.colors.grid;
        ctx.lineWidth = 1;

        for (let i = 0; i < width; i += Config.gridSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }

        for (let i = 0; i < height; i += Config.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
        ctx.restore();
    }

    renderPathToCtx(ctx) {
        const halfGrid = Config.gridSize / 2;

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Borda do caminho (efeito de profundidade/pedra)
        ctx.strokeStyle = Config.THEME.colors.pathEdge;
        ctx.lineWidth = Config.gridSize + 4;

        ctx.beginPath();
        ctx.moveTo(
            Config.path[0].x * Config.gridSize + halfGrid,
            Config.path[0].y * Config.gridSize + halfGrid
        );

        for (let i = 1; i < Config.path.length; i++) {
            ctx.lineTo(
                Config.path[i].x * Config.gridSize + halfGrid,
                Config.path[i].y * Config.gridSize + halfGrid
            );
        }
        ctx.stroke();

        // 2. Caminho principal
        ctx.strokeStyle = Config.THEME.colors.path;
        ctx.lineWidth = Config.gridSize;

        ctx.beginPath();
        ctx.moveTo(
            Config.path[0].x * Config.gridSize + halfGrid,
            Config.path[0].y * Config.gridSize + halfGrid
        );

        for (let i = 1; i < Config.path.length; i++) {
            ctx.lineTo(
                Config.path[i].x * Config.gridSize + halfGrid,
                Config.path[i].y * Config.gridSize + halfGrid
            );
        }
        ctx.stroke();

        // 3. Detalhes decorativos no caminho (pedregulhos e desgaste)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < Config.path.length - 1; i++) {
            const start = Config.path[i];
            const end = Config.path[i+1];

            const dx = (end.x - start.x);
            const dy = (end.y - start.y);
            const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;

            for (let s = 0; s <= steps; s++) {
                const px = (start.x + (dx * s / steps)) * Config.gridSize + halfGrid;
                const py = (start.y + (dy * s / steps)) * Config.gridSize + halfGrid;

                if (Math.random() > 0.7) {
                    const offsetX = (Math.random() - 0.5) * (Config.gridSize * 0.6);
                    const offsetY = (Math.random() - 0.5) * (Config.gridSize * 0.6);
                    const size = 1 + Math.random() * 3;
                    ctx.beginPath();
                    ctx.arc(px + offsetX, py + offsetY, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }

    drawGrid() {
        if (!this.isBgRendered) {
            this.preRenderBackground();
        }

        // Desenha o fundo pré-renderizado (incluindo a grade e o caminho)
        this.ctx.drawImage(this.bgCanvas, 0, 0);
    }

    drawPath() {
        // O caminho agora é desenhado no preRenderBackground para evitar flickering
        // e melhorar a performance, já que é estático.
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
        this.drawControls(gameState, ui);

        if (gameState.selectedPlacedTower) {
            this.drawTowerMenu(gameState.selectedPlacedTower, gameState.money, ui);
        }

        if (gameState.isGameOver || gameState.isVictory) {
            this.drawEndGameScreen(gameState, waveManager, ui);
        } else if (gameState.isPaused) {
            this.drawPauseOverlay(ui);
        } else if (waveManager.isWaiting) {
            this.drawWaveCountdown(waveManager, ui);
        }
    }

    drawControls(gameState, ui) {
        const layout = ui.getControlButtonsLayout(this.canvas);

        // Botão de Pausa
        const pauseLabel = gameState.isPaused ? 'Continuar' : 'Pausar';
        this.drawButton(layout.pause, Config.THEME.colors.gold, pauseLabel);

        // Botão de Velocidade
        const speedLabel = `${gameState.gameSpeed}x`;
        this.drawButton(layout.speed, Config.THEME.colors.gold, speedLabel);
    }

    drawPauseOverlay(ui) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, ui.hudHeight, this.canvas.width - ui.panelWidth, this.canvas.height - ui.hudHeight);

        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 40px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('PAUSADO', (this.canvas.width - ui.panelWidth) / 2, this.canvas.height / 2);

        this.ctx.font = `18px ${Config.THEME.font}`;
        this.ctx.fillText('Pressione ESPAÇO para continuar', (this.canvas.width - ui.panelWidth) / 2, this.canvas.height / 2 + 50);
    }

    drawWaveCountdown(waveManager, ui) {
        const layout = ui.getWaveCountdownLayout(this.canvas);
        const seconds = Math.ceil(waveManager.countdown / 60);

        this.ctx.save();

        // Background overlay for the play area only
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, ui.hudHeight, this.canvas.width - ui.panelWidth, this.canvas.height - ui.hudHeight);

        // Text
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.font = `bold 30px ${Config.THEME.font}`;
        this.ctx.fillText(`Onda ${waveManager.currentWave} chegando em ${seconds}...`,
            (this.canvas.width - ui.panelWidth) / 2,
            this.canvas.height / 2 - 30
        );

        // Skip Button
        this.drawButton(layout.button, Config.THEME.colors.gold, layout.button.label);

        this.ctx.restore();
    }

    drawTowerMenu(tower, money, ui) {
        const layout = ui.getTowerMenuLayout(tower);
        const sellValue = tower.getSellValue();

        this.ctx.save();
        this.ctx.font = `bold 12px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

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

    drawRangeCircle(x, y, range) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, range, 0, Math.PI * 2);

        // Fill semi-transparent
        this.ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = 'rgba(241, 196, 15, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();

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
        } else if (projectile.type === 'wizard') {
            color = Config.THEME.colors.wizard;
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
        if (tower.type === 'wizard') {
            primaryColor = '#34495e';
            accentColor = Config.THEME.colors.wizard;
        }
        if (tower.type === 'fighter') {
            primaryColor = '#5d6d7e';
            accentColor = Config.THEME.colors.fighter;
        }
        if (tower.type === 'ranger') {
            primaryColor = '#1e8449';
            accentColor = Config.THEME.colors.ranger;
        }
        if (tower.type === 'cleric') {
            primaryColor = '#ecf0f1';
            accentColor = Config.THEME.colors.cleric;
        }
        if (tower.type === 'rogue') {
            primaryColor = '#2c3e50';
            accentColor = Config.THEME.colors.rogue;
        }
        if (tower.type === 'paladin') {
            primaryColor = '#f39c12';
            accentColor = Config.THEME.colors.paladin;
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
        if (tower.type === 'wizard') {
            // Glowing orb for wizard tower
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
        } else if (tower.type === 'fighter') {
            // Fighter Shield
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.beginPath();
            this.ctx.moveTo(x + 15, y + 15);
            this.ctx.lineTo(x + 25, y + 15);
            this.ctx.lineTo(x + 25, y + 23);
            this.ctx.quadraticCurveTo(x + 20, y + 28, x + 15, y + 23);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        } else if (tower.type === 'ranger') {
            // Ranger Leaf-like banner
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 20, y + 15);
            this.ctx.quadraticCurveTo(x + 30, y + 15, x + 30, y + 25);
            this.ctx.quadraticCurveTo(x + 20, y + 35, x + 10, y + 25);
            this.ctx.quadraticCurveTo(x + 10, y + 15, x + 20, y + 15);
            this.ctx.fill();
            this.ctx.strokeStyle = '#0e6251';
            this.ctx.stroke();
        } else if (tower.type === 'cleric') {
            // Cleric Holy Cross
            this.ctx.fillStyle = accentColor;
            this.ctx.fillRect(x + 18, y + 14, 4, 12);
            this.ctx.fillRect(x + 14, y + 18, 12, 4);
        } else if (tower.type === 'rogue') {
            // Rogue Dagger
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.beginPath();
            this.ctx.moveTo(x + 20, y + 14);
            this.ctx.lineTo(x + 23, y + 24);
            this.ctx.lineTo(x + 20, y + 28);
            this.ctx.lineTo(x + 17, y + 24);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.fillRect(x + 16, y + 24, 8, 2);
        } else if (tower.type === 'paladin') {
            // Paladin Hammer
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.fillRect(x + 18, y + 20, 4, 10);
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.fillRect(x + 14, y + 14, 12, 6);
        } else {
            // Archer Window
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(x + 18, y + 18, 4, 6);
        }

        // Base/Foundation
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.fillRect(x + 6, y + 35, 28, 3);

        // Aura indicator for Paladin
        if (!isIcon && tower.type === 'paladin') {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(x + 20, y + 20, tower.auraRange, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(241, 196, 15, 0.2)';
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Paladin Aura visual on ally
        if (!isIcon && tower.hasPaladinAura) {
            this.ctx.strokeStyle = Config.THEME.colors.gold;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 5, y + 5, 30, 30);
        }

        // Level Indicators
        if (!isIcon) {
            const dots = Math.min(tower.level, 5);
            for (let i = 0; i < dots; i++) {
                this.ctx.fillStyle = Config.THEME.colors.gold;
                this.ctx.beginPath();
                this.ctx.arc(x + 10 + i * 5, y + 32, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            if (tower.level > 5) {
                this.ctx.fillStyle = Config.THEME.colors.gold;
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText(`+${tower.level - 5}`, x + 30, y + 35);
            }

            // Pending Level Up Indicator
            if (tower.pendingLevelUps > 0) {
                this.ctx.save();
                const bounce = Math.sin(Date.now() / 200) * 5;
                this.ctx.fillStyle = Config.THEME.colors.gold;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = Config.THEME.colors.gold;

                // Draw a gold star or exclamation mark
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('!', x + size / 2, y - 10 + bounce);
                this.ctx.restore();
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

        // Taunt Indicator
        if (enemy.tauntTimer > 0) {
            this.ctx.fillStyle = Config.THEME.colors.gold;
            this.ctx.font = `bold 20px ${Config.THEME.font}`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('!', enemy.x, enemy.y - size / 2 - 15);
        }

        this.ctx.restore();
    }

    drawEndGameScreen(gameState, waveManager, ui) {
        const layout = ui.getEndGameLayout(this.canvas);
        const { modal, restartButton } = layout;

        // Overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Modal Background
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(modal.x, modal.y, modal.width, modal.height);
        this.ctx.strokeRect(modal.x, modal.y, modal.width, modal.height);

        // Title
        this.ctx.fillStyle = gameState.isVictory ? Config.THEME.colors.gold : Config.THEME.colors.bloodRed;
        this.ctx.font = `bold 40px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const title = gameState.isVictory ? 'VITÓRIA!' : 'GAME OVER';
        this.ctx.fillText(title, this.canvas.width / 2, modal.y + 50);

        // Stats
        const stats = ui.getEndGameStats(gameState, waveManager);
        this.ctx.font = `20px ${Config.THEME.font}`;

        stats.forEach((stat, index) => {
            const y = modal.y + 110 + (index * 35);

            // Label
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(stat.label, this.canvas.width / 2 - 10, y);

            // Value
            this.ctx.fillStyle = stat.color || '#ecf0f1';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(stat.value, this.canvas.width / 2 + 10, y);
        });

        // Restart Button
        this.ctx.fillStyle = Config.THEME.colors.bloodRed;
        this.ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);

        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 20px ${Config.THEME.font}`;
        this.ctx.fillText(restartButton.label, restartButton.x + restartButton.width / 2, restartButton.y + restartButton.height / 2);
    }

    drawFloatingTexts(texts) {
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.font = `bold 16px ${Config.THEME.font}`;

        for (const t of texts) {
            this.ctx.globalAlpha = t.life;
            this.ctx.fillStyle = t.color;

            // Sombra para melhor legibilidade
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;

            this.ctx.fillText(t.text, t.x, t.y);
        }
        this.ctx.restore();
    }

    /**
     * Desenha o modal de Level Up
     */
    drawLevelUpModal(tower, ui, dataManager = null) {
        if (!tower) return;

        const layout = ui.getLevelUpModalLayout(this.canvas);
        const { modal, options } = layout;

        // Overlay escuro
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Modal container
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(modal.x, modal.y, modal.width, modal.height);
        this.ctx.strokeRect(modal.x, modal.y, modal.width, modal.height);

        // Título
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = 'bold 28px ' + Config.THEME.font;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LEVEL UP: ${tower.name.toUpperCase()}`, modal.x + modal.width / 2, modal.y + 40);

        this.ctx.font = '16px ' + Config.THEME.font;
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillText(`Escolha uma melhoria para o Nível ${tower.level}`, modal.x + modal.width / 2, modal.y + 65);

        // Opções dinâmicas baseadas na torre (Data-driven)
        let optionLabels = [
            `+2 ${tower.primaryAbility.toUpperCase()} (Aumenta Acerto e Dano)`,
            `Novo Talento Aleatório (Ex: Sharpshooter, Lucky)`,
            `Especialização (Bônus massivo em Dano ou Alcance)`
        ];

        // Se houver DataManager, poderíamos buscar labels mais específicas se necessário
        if (dataManager) {
            // Futuramente: extrair labels do feats.json ou locale.json
        }

        options.forEach((opt, index) => {
            this.drawButton(opt, Config.THEME.colors.gold, optionLabels[index]);
        });

        this.ctx.textAlign = 'start'; // Reset alignment
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
} 
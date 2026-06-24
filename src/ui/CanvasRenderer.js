import { Config } from '../game/core/Config.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Feedback Visual
        this.shakeIntensity = 0;
        this.shakeTimer = 0;

        // Canvas offscreen para pré-renderizar o fundo
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = canvas.width;
        this.bgCanvas.height = canvas.height;
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.isBgRendered = false;

        // Cache para bases de torres
        this.towerCache = new Map(); // type -> canvas
    }

    preRenderBackground(gameState) {
        if (this.isBgRendered) return;

        const ctx = this.bgCtx;
        const width = this.bgCanvas.width;
        const height = this.bgCanvas.height;

        const currentMap = gameState?.currentMap;
        const theme = currentMap ? currentMap.theme : Config.THEME.colors;

        // Fundo base (Grama/Terreno)
        ctx.fillStyle = theme.grass || Config.THEME.colors.grass;
        ctx.fillRect(0, 0, width, height);

        // Adiciona variações de terreno (manchas mais escuras)
        ctx.fillStyle = theme.grassDark || Config.THEME.colors.grassDark;
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
        ctx.fillStyle = theme.dirt || Config.THEME.colors.dirt;
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
        ctx.fillStyle = theme.stone || Config.THEME.colors.stone;
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
        this.renderPathToCtx(ctx, gameState);

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

    renderPathToCtx(ctx, gameState) {
        const halfGrid = Config.gridSize / 2;
        const currentMap = gameState?.currentMap;
        const theme = currentMap ? currentMap.theme : Config.THEME.colors;
        const paths = currentMap ? currentMap.paths : [Config.path];

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        paths.forEach((path, pathIndex) => {
            // 1. Borda do caminho (efeito de profundidade/pedra)
            ctx.strokeStyle = theme.pathEdge || Config.THEME.colors.pathEdge;
            ctx.lineWidth = Config.gridSize + 4;

            ctx.beginPath();
            ctx.moveTo(
                path[0].x * Config.gridSize + halfGrid,
                path[0].y * Config.gridSize + halfGrid
            );

            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(
                    path[i].x * Config.gridSize + halfGrid,
                    path[i].y * Config.gridSize + halfGrid
                );
            }
            ctx.stroke();

            // 2. Caminho principal
            ctx.strokeStyle = theme.path || Config.THEME.colors.path;
            ctx.lineWidth = Config.gridSize;

            ctx.beginPath();
            ctx.moveTo(
                path[0].x * Config.gridSize + halfGrid,
                path[0].y * Config.gridSize + halfGrid
            );

            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(
                    path[i].x * Config.gridSize + halfGrid,
                    path[i].y * Config.gridSize + halfGrid
                );
            }
            ctx.stroke();

            // 3. Detalhes decorativos no caminho (pedregulhos e desgaste)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            for (let i = 0; i < path.length - 1; i++) {
                const start = path[i];
                const end = path[i+1];

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

            this.drawPathEndpoints(ctx, path, theme, pathIndex);
        });

        ctx.restore();
    }

    drawPathEndpoints(ctx, path, theme, pathIndex = 0) {
        if (!path || path.length < 2) return;

        const start = path[0];
        const end = path[path.length - 1];
        const next = path[1];
        const previous = path[path.length - 2];
        const startX = start.x * Config.gridSize + Config.gridSize / 2;
        const startY = start.y * Config.gridSize + Config.gridSize / 2;
        const endX = end.x * Config.gridSize + Config.gridSize / 2;
        const endY = end.y * Config.gridSize + Config.gridSize / 2;

        this.drawEndpointMarker(ctx, {
            x: startX,
            y: startY,
            towardX: next.x - start.x,
            towardY: next.y - start.y,
            label: pathIndex > 0 ? `ENTRADA ${pathIndex + 1}` : 'ENTRADA',
            fill: '#153726',
            stroke: theme.pathEdge || Config.THEME.colors.pathEdge,
            accent: Config.THEME.colors.gold
        });

        this.drawEndpointMarker(ctx, {
            x: endX,
            y: endY,
            towardX: end.x - previous.x,
            towardY: end.y - previous.y,
            label: pathIndex > 0 ? `BASE ${pathIndex + 1}` : 'BASE',
            fill: '#3d1717',
            stroke: '#f4d03f',
            accent: '#e74c3c'
        });
    }

    drawEndpointMarker(ctx, marker) {
        const radius = 17;
        const directionLength = Math.hypot(marker.towardX, marker.towardY) || 1;
        const dx = marker.towardX / directionLength;
        const dy = marker.towardY / directionLength;
        const arrowX = marker.x + dx * 9;
        const arrowY = marker.y + dy * 9;
        const labelX = Math.max(8, Math.min(this.canvas.width - 92, marker.x + (dx >= 0 ? 16 : -92)));
        const labelY = Math.max(24, Math.min(this.canvas.height - 8, marker.y - 24));

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = marker.fill;
        ctx.strokeStyle = marker.stroke;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = marker.accent;
        ctx.beginPath();
        ctx.moveTo(arrowX + dx * 9, arrowY + dy * 9);
        ctx.lineTo(arrowX - dx * 8 - dy * 6, arrowY - dy * 8 + dx * 6);
        ctx.lineTo(arrowX - dx * 8 + dy * 6, arrowY - dy * 8 - dx * 6);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 12px Georgia, serif';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(16, 21, 26, 0.88)';
        ctx.strokeStyle = marker.stroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(labelX, labelY - 12, 84, 24, 6);
        } else {
            ctx.rect(labelX, labelY - 12, 84, 24);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = marker.accent;
        ctx.textAlign = 'center';
        ctx.fillText(marker.label, labelX + 42, labelY);
        ctx.restore();
    }

    drawGrid(gameState) {
        if (!this.isBgRendered) {
            this.preRenderBackground(gameState);
        }

        // Desenha o fundo pré-renderizado (incluindo a grade e o caminho)
        this.ctx.drawImage(this.bgCanvas, 0, 0);
    }

    /**
     * Triggers a screen shake effect
     * @param {number} intensity - Pixels to shake
     * @param {number} duration - Frames to shake
     */
    triggerShake(intensity = 5, duration = 10) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    drawPath() {
        // O caminho agora é desenhado no preRenderBackground para evitar flickering
        // e melhorar a performance, já que é estático.
    }

    drawUI(gameState, waveManager, ui) {
        if (gameState.htmlUIEnabled) {
            const boss = gameState.enemies.find(e => e.isBoss);
            if (boss) this.drawBossHealthBar(boss, ui);
            if (gameState.selectedPlacedTower) {
                this.drawTowerMenu(gameState.selectedPlacedTower, gameState.money, ui);
            }
            if (gameState.isGameOver || gameState.isVictory) {
                this.drawEndGameScreen(gameState, waveManager, ui);
            } else if (gameState.showTavern) {
                this.drawTavern(gameState, ui);
            } else if (gameState.showCamp) {
                this.drawCamp(gameState, ui);
            } else if (gameState.showSettings) {
                this.drawSettings(gameState, ui);
            } else if (gameState.isPaused) {
                this.drawPauseOverlay(ui);
            } else if (waveManager.isWaiting) {
                this.drawWaveCountdown(waveManager, ui);
            }
            return;
        }

        const hudHeight = ui.hudHeight;
        const padding = 15;
        const itemWidth = 85;
        const localeManager = window.game?.localeManager;

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

        const items = ui.getHUDData(gameState, waveManager, localeManager);

        items.forEach((item, index) => {
            const x = padding + index * (index < 6 ? itemWidth : itemWidth * 1.3);
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

        // Draw Boss Health Bar if a boss exists
        const boss = gameState.enemies.find(e => e.isBoss);
        if (boss) {
            this.drawBossHealthBar(boss, ui);
        }

        if (gameState.selectedPlacedTower) {
            this.drawTowerMenu(gameState.selectedPlacedTower, gameState.money, ui);
        }

        if (gameState.isGameOver || gameState.isVictory) {
            this.drawEndGameScreen(gameState, waveManager, ui);
        } else if (gameState.showTavern) {
            this.drawTavern(gameState, ui);
        } else if (gameState.showCamp) {
            this.drawCamp(gameState, ui);
        } else if (gameState.showSettings) {
            this.drawSettings(gameState, ui);
        } else if (gameState.isPaused) {
            this.drawPauseOverlay(ui);
        } else if (waveManager.isWaiting) {
            this.drawWaveCountdown(waveManager, ui);
        }
    }

    drawControls(gameState, ui) {
        const localeManager = window.game?.localeManager;
        const layout = ui.getControlButtonsLayout(this.canvas, gameState, localeManager);

        this.drawButton(layout.pause, Config.THEME.colors.gold, layout.pause.label);
        this.drawButton(layout.speed, Config.THEME.colors.gold, layout.speed.label);
    }

    drawPauseOverlay(ui) {
        const localeManager = window.game?.localeManager;
        const t = (key) => localeManager ? localeManager.t(key) : key;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, ui.hudHeight, this.canvas.width - ui.panelWidth, this.canvas.height - ui.hudHeight);

        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 40px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(t('ui_pause').toUpperCase(), (this.canvas.width - ui.panelWidth) / 2, this.canvas.height / 2);

        this.ctx.font = `18px ${Config.THEME.font}`;
        this.ctx.fillText(`${t('action_pause')}: ${t('ui_resume')}`, (this.canvas.width - ui.panelWidth) / 2, this.canvas.height / 2 + 50);
    }

    drawWaveCountdown(waveManager, ui) {
        const localeManager = window.game?.localeManager;
        const layout = ui.getWaveCountdownLayout(this.canvas, localeManager);
        const seconds = Math.ceil(waveManager.countdown / 60);
        const t = (key) => localeManager ? localeManager.t(key) : key;

        this.ctx.save();

        // Background overlay for the visible canvas.
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Text
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.font = `bold 30px ${Config.THEME.font}`;
        this.ctx.fillText(`${t('ui_wave')} ${waveManager.currentWave} ${seconds}...`,
            this.canvas.width / 2,
            this.canvas.height / 2 - 30
        );

        // Skip Button
        this.drawButton(layout.button, Config.THEME.colors.gold, layout.button.label);

        this.ctx.restore();
    }

    drawTowerMenu(tower, money, ui) {
        const localeManager = window.game?.localeManager;
        const layout = ui.getTowerMenuLayout(tower, localeManager);
        const sellValue = tower.getSellValue();

        this.ctx.save();
        this.ctx.font = `bold 12px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw Target Mode Button
        const targetLabel = tower.targetMode.toUpperCase();
        this.drawButton(layout.target, Config.THEME.colors.gold, `${layout.target.label} ${targetLabel}`);

        // Draw Sell Button
        this.drawButton(layout.sell, Config.THEME.colors.bloodRed, `${layout.sell.label} (${sellValue}G)`);

        this.ctx.restore();
    }

    drawButton(btn, color, label, disabled = false) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
        this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

        this.ctx.fillStyle = disabled ? '#95a5a6' : '#ecf0f1';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        let fontSize = Math.max(12, Math.min(18, Math.floor(btn.height * 0.42)));
        this.ctx.font = `bold ${fontSize}px ${Config.THEME.font}`;
        while (fontSize > 11 && this.ctx.measureText(String(label)).width > btn.width - 16) {
            fontSize--;
            this.ctx.font = `bold ${fontSize}px ${Config.THEME.font}`;
        }
        this.ctx.fillText(label, btn.x + btn.width / 2, btn.y + btn.height / 2);
        this.ctx.restore();
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
            const costMultiplier = gameState.metaBonuses ? gameState.metaBonuses.costMultiplier : 1.0;
            const actualCost = Math.floor(tower.cost * costMultiplier);
            this.drawTowerIcon(tower.type, itemX + itemWidth / 2, itemY + 30, costMultiplier);

            // Cost
            this.ctx.fillStyle = gameState.money >= actualCost ? Config.THEME.colors.gold : Config.THEME.colors.bloodRed;
            this.ctx.font = `bold 14px ${Config.THEME.font}`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${actualCost} G`, itemX + itemWidth / 2, itemY + 65);
        });
    }

    drawTowerIcon(type, x, y, costMultiplier = 1.0) {
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
            case 'party':
                // Draw simple user group icon
                const pX = x;
                const pY = y - size/2;
                this.ctx.beginPath();
                // Head
                this.ctx.arc(pX + size/2, pY + size/3, size/4, 0, Math.PI * 2);
                // Body
                this.ctx.moveTo(pX + size/4, pY + size);
                this.ctx.quadraticCurveTo(pX + size/2, pY + size/2, pX + size*0.75, pY + size);
                this.ctx.fill();
                break;
            case 'ascension':
                // Up Arrow
                this.ctx.beginPath();
                this.ctx.moveTo(x + size/2, y - size/2);
                this.ctx.lineTo(x + size, y + size/2);
                this.ctx.lineTo(x, y + size/2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'modifier':
                // Gear / Star
                this.ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI) / 4;
                    const r = i % 2 === 0 ? size/2 : size/4;
                    this.ctx.lineTo(x + size/2 + Math.cos(angle) * r, y + Math.sin(angle) * r);
                }
                this.ctx.closePath();
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

        // Trail effect
        if (glow) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;
        }

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(projectile.x, projectile.y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (glow) {
            this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            // Outer glow for extra juice
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, radius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
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

    /**
     * Pre-renderiza e cacheia a base visual de uma torre
     */
    getTowerBaseCanvas(type) {
        if (this.towerCache.has(type)) return this.towerCache.get(type);

        const canvas = document.createElement('canvas');
        canvas.width = Config.gridSize;
        canvas.height = Config.gridSize;
        const ctx = canvas.getContext('2d');

        // Distinct colors based on type
        let primaryColor = Config.THEME.colors.stone;
        let accentColor = Config.THEME.colors.gold;

        if (type === 'archer') accentColor = Config.THEME.colors.archer;
        if (type === 'cannon') {
            primaryColor = '#95a5a6';
            accentColor = Config.THEME.colors.cannon;
        }
        if (type === 'wizard') {
            primaryColor = '#34495e';
            accentColor = Config.THEME.colors.wizard;
        }
        if (type === 'fighter') {
            primaryColor = '#5d6d7e';
            accentColor = Config.THEME.colors.fighter;
        }
        if (type === 'ranger') {
            primaryColor = '#1e8449';
            accentColor = Config.THEME.colors.ranger;
        }
        if (type === 'cleric') {
            primaryColor = '#ecf0f1';
            accentColor = Config.THEME.colors.cleric;
        }
        if (type === 'rogue') {
            primaryColor = '#2c3e50';
            accentColor = Config.THEME.colors.rogue;
        }
        if (type === 'paladin') {
            primaryColor = '#f39c12';
            accentColor = Config.THEME.colors.paladin;
        }

        // Tower Body
        ctx.fillStyle = primaryColor;
        ctx.fillRect(8, 10, 24, 25);

        // Tower Top (the platform)
        ctx.fillStyle = primaryColor;
        ctx.fillRect(5, 5, 30, 7);

        // Battlements (merlons)
        ctx.fillStyle = Config.THEME.colors.darkStone;
        ctx.fillRect(5, 2, 6, 3);
        ctx.fillRect(17, 2, 6, 3);
        ctx.fillRect(29, 2, 6, 3);

        // Decorative line under battlements
        ctx.fillStyle = accentColor;
        ctx.fillRect(5, 12, 30, 2);

        // Base/Foundation
        ctx.fillStyle = Config.THEME.colors.darkStone;
        ctx.fillRect(6, 35, 28, 3);

        this.towerCache.set(type, canvas);
        return canvas;
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

        // Draw cached tower base
        const baseCanvas = this.getTowerBaseCanvas(tower.type);
        this.ctx.drawImage(baseCanvas, x, y);

        // Distinct colors based on type for specific visual elements
        let accentColor = Config.THEME.colors.gold;
        if (tower.type === 'archer') accentColor = Config.THEME.colors.archer;
        if (tower.type === 'cannon') accentColor = Config.THEME.colors.cannon;
        if (tower.type === 'wizard') accentColor = Config.THEME.colors.wizard;
        if (tower.type === 'fighter') accentColor = Config.THEME.colors.fighter;
        if (tower.type === 'ranger') accentColor = Config.THEME.colors.ranger;
        if (tower.type === 'cleric') accentColor = Config.THEME.colors.cleric;
        if (tower.type === 'rogue') accentColor = Config.THEME.colors.rogue;
        if (tower.type === 'paladin') accentColor = Config.THEME.colors.paladin;

        // Synergy Glow
        if (!isIcon && tower.activeSynergies && tower.activeSynergies.length > 0) {
            this.ctx.save();
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = Config.THEME.colors.gold;
            this.ctx.strokeStyle = Config.THEME.colors.gold;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 5, y + 5, 30, 30);
            this.ctx.restore();
        }

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

        // Positioning Indicators (FASE 5)
        if (!isIcon) {
            this.ctx.save();
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            if (tower.positioning === 'frontline') {
                this.ctx.fillStyle = '#e74c3c'; // Red for Frontline
                this.ctx.fillText('🛡️', x + size - 5, y + size - 5);
            } else {
                this.ctx.fillStyle = '#3498db'; // Blue for Backline
                this.ctx.fillText('🎯', x + size - 5, y + size - 5);
            }
            this.ctx.restore();
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

            // Cast Bar (FASE 7)
            if (tower.isCasting) {
                this.drawCastBar(tower, x, y);
            }
        }

        this.ctx.restore();
    }

    /**
     * Draws a casting progress bar above the tower
     */
    drawCastBar(tower, x, y) {
        const barWidth = Config.gridSize;
        const barHeight = 6;
        const barX = x;
        const barY = y - 15;

        const progress = 1 - (tower.castTimer / tower.initialCastTime);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        this.ctx.fillStyle = Config.THEME.colors.wizard || '#9b59b6';
        this.ctx.fillRect(barX, barY, barWidth * Math.max(0, Math.min(1, progress)), barHeight);

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    drawEnemy(enemy) {
        const size = Config.gridSize * 0.7;
        const x = enemy.x - size / 2;
        const y = enemy.y - size / 2;

        this.ctx.save();

        // Shadow under enemy
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.beginPath();
        this.ctx.ellipse(enemy.x, enemy.y + size / 2 - 2, size / 3, size / 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Impact Flash
        if (enemy.flashTimer > 0) {
            this.ctx.filter = 'brightness(2) contrast(1.5)';
            enemy.flashTimer--;
        } else {
            this.ctx.filter = 'none';
        }

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

        // Status Effects Indicators
        if (enemy.activeEffects && enemy.activeEffects.size > 0) {
            let effectIndex = 0;
            const effectIconSize = 10;
            const startX = enemy.x - (enemy.activeEffects.size * effectIconSize) / 2;
            const effectY = enemy.y + size / 2 + 5;

            for (const [key, effect] of enemy.activeEffects) {
                this.ctx.fillStyle = effect.color || '#fff';
                this.ctx.beginPath();
                this.ctx.arc(startX + effectIndex * effectIconSize + effectIconSize / 2, effectY, effectIconSize / 3, 0, Math.PI * 2);
                this.ctx.fill();

                // Small glow/border for the effect icon
                this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                effectIndex++;
            }

            // Optional: apply a subtle tint to the enemy based on prominent effects
            if (enemy.activeEffects.has('burn')) {
                this.ctx.fillStyle = 'rgba(230, 126, 34, 0.2)';
                this.ctx.beginPath();
                this.ctx.roundRect(x + 5, y + 5, size - 10, size - 10, 5);
                this.ctx.fill();
            } else if (enemy.activeEffects.has('freeze') || enemy.activeEffects.has('slow')) {
                this.ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
                this.ctx.beginPath();
                this.ctx.roundRect(x + 5, y + 5, size - 10, size - 10, 5);
                this.ctx.fill();
            }
        }

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
        const localeManager = window.game?.localeManager;
        const layout = ui.getEndGameLayout(this.canvas, gameState.isVictory, localeManager);
        const { modal, restartButton, continueButton } = layout;

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
        const t = (key) => localeManager ? localeManager.t(key) : key;
        const title = gameState.isVictory ? t('notification_victory') : t('notification_game_over');
        this.ctx.fillText(title, this.canvas.width / 2, modal.y + 50);

        // Stats
        const stats = ui.getEndGameStats(gameState, waveManager, localeManager);
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

        // Buttons
        if (continueButton) {
            this.ctx.fillStyle = Config.THEME.colors.archer;
            this.ctx.fillRect(continueButton.x, continueButton.y, continueButton.width, continueButton.height);
            this.ctx.strokeStyle = Config.THEME.colors.gold;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(continueButton.x, continueButton.y, continueButton.width, continueButton.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = `bold 18px ${Config.THEME.font}`;
            this.ctx.fillText(continueButton.label, continueButton.x + continueButton.width / 2, continueButton.y + continueButton.height / 2);
        }

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

        for (const t of texts) {
            this.ctx.save();
            this.ctx.globalAlpha = t.life;
            this.ctx.fillStyle = t.color;

            // Critical Hit visual feedback
            const isCrit = t.isCrit || (t.text && t.text.includes('!'));
            const fontSize = isCrit ? 22 : 16;
            this.ctx.font = `bold ${fontSize}px ${Config.THEME.font}`;

            if (isCrit) {
                this.ctx.shadowColor = '#f1c40f';
                this.ctx.shadowBlur = 10;
                // Add a small scale/bounce for crits
                const scale = 1 + (t.life * 0.2);
                this.ctx.translate(t.x, t.y);
                this.ctx.scale(scale, scale);
                this.ctx.fillText(t.text, 0, 0);
            } else {
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                this.ctx.shadowBlur = 4;
                this.ctx.shadowOffsetX = 1;
                this.ctx.shadowOffsetY = 1;
                this.ctx.fillText(t.text, t.x, t.y);
            }
            this.ctx.restore();
        }
        this.ctx.restore();
    }

    /**
     * Desenha a tela da Taverna (Meta Progressão)
     */
    drawTavern(gameState, ui) {
        const metaData = gameState.dataManager.get('meta');
        const localeManager = window.game?.localeManager;
        const layout = ui.getTavernLayout(this.canvas, metaData, gameState.metaManager, localeManager);
        const { modal, tabs, upgradeButtons, backButton } = layout;

        // Overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Modal
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(modal.x, modal.y, modal.width, modal.height);
        this.ctx.strokeRect(modal.x, modal.y, modal.width, modal.height);

        // Title
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 32px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TAVERNA DO AVENTUREIRO', modal.x + modal.width / 2, modal.y + 40);

        // Currency
        this.ctx.font = `bold 18px ${Config.THEME.font}`;
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.fillText(`Fragmentos Arcanos: ${gameState.metaManager.state.arcaneShards} ✨`, modal.x + modal.width / 2 - 120, modal.y + 65);
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.fillText(`Ouro Persistente: ${gameState.metaManager.state.gold} G`, modal.x + modal.width / 2 + 120, modal.y + 65);

        // Tabs
        tabs.forEach(tab => {
            this.ctx.save();
            this.ctx.fillStyle = tab.isActive ? 'rgba(241, 196, 15, 0.2)' : 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(tab.x, tab.y, tab.width, tab.height);
            this.ctx.strokeStyle = tab.isActive ? Config.THEME.colors.gold : 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = tab.isActive ? 2 : 1;
            this.ctx.strokeRect(tab.x, tab.y, tab.width, tab.height);
            this.ctx.fillStyle = tab.isActive ? Config.THEME.colors.gold : '#bdc3c7';
            this.ctx.font = `bold 14px ${Config.THEME.font}`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(tab.label.toUpperCase(), tab.x + tab.width / 2, tab.y + tab.height / 2);
            this.ctx.restore();
        });

        // Upgrades
        upgradeButtons.forEach(btn => {
            this.ctx.save();

            const isLocked = btn.type === 'unlock' && !btn.isUnlocked;
            const isOwned = (btn.type === 'unlock' && btn.isUnlocked) || (btn.type === 'talent' && btn.isOwned) || (btn.type === 'relic' && btn.isOwned);
            const isMaxed = btn.isMaxed;
            const canBuy = btn.canAfford && (btn.type !== 'talent' || btn.hasPrereqs);

            // Button Background
            this.ctx.fillStyle = canBuy ? 'rgba(44, 62, 80, 0.9)' : 'rgba(20, 20, 20, 0.9)';
            if (isOwned || isMaxed) this.ctx.fillStyle = 'rgba(39, 174, 96, 0.2)';
            this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

            this.ctx.strokeStyle = canBuy ? Config.THEME.colors.gold : '#555';
            if (isOwned || isMaxed) this.ctx.strokeStyle = '#27ae60';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

            // Name & Level/Status
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = (isOwned || isMaxed) ? '#27ae60' : '#ecf0f1';
            this.ctx.font = `bold 16px ${Config.THEME.font}`;
            let label = btn.name;
            if (btn.level !== undefined) label += ` (Nv. ${btn.level}/${btn.maxLevel})`;
            this.ctx.fillText(label, btn.x + 15, btn.y + 25);

            // Description
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.font = `12px ${Config.THEME.font}`;
            this.ctx.fillText(btn.description, btn.x + 15, btn.y + 45);

            // Cost / Status
            this.ctx.textAlign = 'right';
            if (isMaxed || isOwned) {
                this.ctx.fillStyle = '#27ae60';
                this.ctx.fillText('ADQUIRIDO', btn.x + btn.width - 15, btn.y + btn.height / 2 + 5);
            } else if (btn.type === 'talent' && !btn.hasPrereqs) {
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(`REQUER: ${btn.requires.join(', ')}`, btn.x + btn.width - 15, btn.y + btn.height / 2 + 5);
            } else {
                this.ctx.fillStyle = btn.canAfford ? '#9b59b6' : '#e74c3c';
                this.ctx.font = `bold 16px ${Config.THEME.font}`;
                this.ctx.fillText(`${btn.cost} ✨`, btn.x + btn.width - 15, btn.y + btn.height / 2 + 5);
            }

            this.ctx.restore();
        });

        // Back Button
        this.drawButton(backButton, Config.THEME.colors.gold, backButton.label);
    }

    /**
     * Desenha o Acampamento (Camp Hub)
     */
    drawCamp(gameState, ui) {
        const localeManager = window.game?.localeManager;
        const layout = ui.getCampLayout(this.canvas, gameState, gameState.dataManager, localeManager);
        const { modal, tabs, buttons, nextWaveButton } = layout;

        // Overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Modal
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(modal.x, modal.y, modal.width, modal.height);
        this.ctx.strokeRect(modal.x, modal.y, modal.width, modal.height);

        // Title
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 32px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ACAMPAMENTO', modal.x + modal.width / 2, modal.y + 40);

        // Money
        this.ctx.font = `bold 18px ${Config.THEME.font}`;
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.fillText(`Ouro: ${gameState.money} G`, modal.x + modal.width / 2, modal.y + 65);

        // Tabs
        tabs.forEach(tab => {
            this.ctx.save();
            this.ctx.fillStyle = tab.isActive ? 'rgba(241, 196, 15, 0.2)' : 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(tab.x, tab.y, tab.width, tab.height);
            this.ctx.strokeStyle = tab.isActive ? Config.THEME.colors.gold : 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = tab.isActive ? 2 : 1;
            this.ctx.strokeRect(tab.x, tab.y, tab.width, tab.height);
            this.ctx.fillStyle = tab.isActive ? Config.THEME.colors.gold : '#bdc3c7';
            this.ctx.font = `bold 14px ${Config.THEME.font}`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(tab.label.toUpperCase(), tab.x + tab.width / 2, tab.y + tab.height / 2);
            this.ctx.restore();
        });

        // Content
        buttons.forEach(btn => {
            if (btn.type === 'recruit') {
                this.drawRecruitCard(btn);
            } else if (btn.type === 'buy_item_pool') {
                this.drawItemCard(btn);
            } else {
                this.drawButton(btn, btn.canAfford === false ? '#7f8c8d' : Config.THEME.colors.gold, btn.label);
            }
        });

        // Next Wave Button
        this.drawButton(nextWaveButton, Config.THEME.colors.gold, nextWaveButton.label);
    }

    drawItemCard(btn) {
        const item = btn.item;
        const rarity = item.rarityData || { name: 'Comum', color: '#bdc3c7' };

        this.ctx.save();

        // Background
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
        this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        // Border based on rarity
        this.ctx.strokeStyle = rarity.color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

        // Item Name
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = rarity.color;
        this.ctx.font = `bold 14px ${Config.THEME.font}`;
        this.ctx.fillText(item.name.toUpperCase(), btn.x + 10, btn.y + 10);

        // Rarity Label
        this.ctx.font = `10px ${Config.THEME.font}`;
        this.ctx.fillText(rarity.name.toUpperCase(), btn.x + 10, btn.y + 26);

        // Affixes / Stats
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.font = `11px ${Config.THEME.font}`;
        let statText = "";
        if (item.damage) statText += `Dano: +${item.damage} `;
        if (item.ac) statText += `AC: +${item.ac} `;
        if (item.attackBonus) statText += `Hit: +${item.attackBonus} `;
        this.ctx.fillText(statText, btn.x + 10, btn.y + 40);

        // Cost
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = btn.canAfford ? Config.THEME.colors.gold : '#e74c3c';
        this.ctx.font = `bold 16px ${Config.THEME.font}`;
        this.ctx.fillText(`${btn.cost} G`, btn.x + btn.width - 10, btn.y + btn.height / 2);

        this.ctx.restore();
    }

    drawRecruitCard(btn) {
        const hero = btn.hero;
        this.ctx.save();

        // Card Background
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
        this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
        this.ctx.strokeStyle = btn.canAfford ? Config.THEME.colors.gold : '#555';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

        // Hero Name
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 18px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(hero.name.toUpperCase(), btn.x + btn.width / 2, btn.y + 30);

        // Hero Info
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.font = `14px ${Config.THEME.font}`;
        this.ctx.fillText(`${hero.race.toUpperCase()}`, btn.x + btn.width / 2, btn.y + 50);

        // Draw Icon
        this.ctx.save();
        this.ctx.translate(btn.x + btn.width / 2, btn.y + 110);
        this.ctx.scale(1.5, 1.5);
        const mockTower = { x: -0.5, y: -0.5, type: hero.type, traits: [] };
        this.drawTower(mockTower, true);
        this.ctx.restore();

        // Stats
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = `12px ${Config.THEME.font}`;
        const stats = Config.TOWERS[hero.type.toUpperCase()];
        this.ctx.fillText(`Dano: ${stats.damage} | Alcance: ${stats.range}`, btn.x + btn.width / 2, btn.y + 180);
        this.ctx.fillText(`Vida: ${stats.maxHealth}`, btn.x + btn.width / 2, btn.y + 200);

        // Cost
        this.ctx.fillStyle = btn.canAfford ? Config.THEME.colors.gold : '#e74c3c';
        this.ctx.font = `bold 20px ${Config.THEME.font}`;
        this.ctx.fillText(`${btn.cost} G`, btn.x + btn.width / 2, btn.y + 250);

        this.ctx.restore();
    }

    /**
     * Desenha a barra de vida do Boss no topo da tela
     */
    drawBossHealthBar(boss, ui) {
        const layout = ui.getBossHealthBarLayout(this.canvas);
        const { x, y, width, height } = layout;

        this.ctx.save();

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(x, y, width, height);

        // Fill
        const healthPercent = boss.health / boss.maxHealth;
        const gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
        gradient.addColorStop(0, '#c0392b');
        gradient.addColorStop(1, '#e74c3c');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width * healthPercent, height);

        // Border
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        // Name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `bold 16px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(boss.name.toUpperCase(), x + width / 2, y - 5);

        // Legendary Resistances
        const lrSize = 10;
        const lrSpacing = 5;
        const lrTotalWidth = (boss.legendaryResistances * lrSize) + ((boss.legendaryResistances - 1) * lrSpacing);
        const lrX = x + width / 2 - lrTotalWidth / 2;
        const lrY = y + height + 10;

        for (let i = 0; i < boss.legendaryResistances; i++) {
            this.ctx.fillStyle = Config.THEME.colors.gold;
            this.ctx.beginPath();
            this.ctx.arc(lrX + i * (lrSize + lrSpacing) + lrSize/2, lrY, lrSize/2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Desenha a interface do Editor
     */
    drawEditor(gameState, ui) {
        const editor = gameState.editorSystem;
        if (!editor) return;

        if (gameState.htmlUIEnabled) {
            if (editor.mode === 'map') {
                this.drawMapEditorHighlights(editor);
            }
            return;
        }

        const layout = ui.getEditorLayout(this.canvas, editor);

        // Sidebar Background
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.globalAlpha = 0.95;
        this.ctx.fillRect(layout.sidebar.x, layout.sidebar.y, layout.sidebar.width, layout.sidebar.height);
        this.ctx.globalAlpha = 1.0;

        // Border
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(layout.sidebar.x, layout.sidebar.y, layout.sidebar.width, layout.sidebar.height);

        // Tabs
        layout.tabs.forEach(tab => {
            this.drawButton(tab, Config.THEME.colors.gold, tab.label, !tab.isActive);
        });

        // Actions
        layout.actions.forEach(btn => {
            this.drawButton(btn, btn.action === 'exit' ? Config.THEME.colors.bloodRed : Config.THEME.colors.gold, btn.label);
        });

        // Editor Workspace Rendering
        this.ctx.save();
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 24px ${Config.THEME.font}`;
        this.ctx.fillText(`EDITOR DE ${editor.mode.toUpperCase()}`, 20, ui.hudHeight + 35);

        if (editor.mode === 'map') {
            this.drawMapEditorVisuals(editor, ui);
        } else if (editor.mode === 'enemies') {
            this.drawEnemyEditorVisuals(editor, ui);
        } else if (editor.mode === 'spells') {
            this.drawSpellEditorVisuals(editor, ui);
        } else if (editor.mode === 'waves') {
            this.drawWaveEditorVisuals(editor, ui);
        } else {
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = `18px ${Config.THEME.font}`;
            this.ctx.fillText(`Interface do Editor de ${editor.mode} em desenvolvimento...`, 20, ui.hudHeight + 80);
        }
        this.ctx.restore();
    }

    drawEnemyEditorVisuals(editor, ui) {
        const hudHeight = ui.hudHeight;
        const keys = Object.keys(editor.draftEnemies);

        this.drawButton({ x: 20, y: hudHeight + 60, width: 150, height: 30 }, Config.THEME.colors.gold, '+ Novo Inimigo');

        keys.forEach((key, i) => {
            const isActive = editor.selectedEnemyKey === key;
            this.drawButton({ x: 20, y: hudHeight + 100 + i * 35, width: 150, height: 30 }, isActive ? Config.THEME.colors.gold : '#555', key);
        });

        if (editor.selectedEnemyKey) {
            const enemy = editor.draftEnemies[editor.selectedEnemyKey];
            const fields = [
                { label: 'Nome', key: 'name' },
                { label: 'HP', key: 'hp', type: 'number' },
                { label: 'AC', key: 'ac', type: 'number' },
                { label: 'Velocidade', key: 'speed', type: 'number' },
                { label: 'XP', key: 'xp', type: 'number' },
                { label: 'Ouro', key: 'gold', type: 'number' }
            ];

            fields.forEach((f, i) => {
                const fy = hudHeight + 100 + i * 45;
                this.ctx.fillStyle = '#bdc3c7';
                this.ctx.font = '14px Arial';
                this.ctx.fillText(f.label, 200, fy - 5);
                this.drawButton({ x: 200, y: fy, width: 300, height: 35 }, Config.THEME.colors.gold, String(enemy[f.key]));
            });
        }
    }

    drawWaveEditorVisuals(editor, ui) {
        const hudHeight = ui.hudHeight;
        const wave = editor.draftWaves;

        const fields = [
            { label: 'Inimigos Iniciais', key: 'initialEnemies' },
            { label: 'Aumento por Onda', key: 'increasePerWave' }
        ];

        fields.forEach((f, i) => {
            const fy = hudHeight + 100 + i * 45;
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(f.label, 200, fy - 5);
            this.drawButton({ x: 200, y: fy, width: 300, height: 35 }, Config.THEME.colors.gold, String(wave[f.key]));
        });

        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 18px ${Config.THEME.font}`;
        this.ctx.fillText('ONDAS DE BOSS:', 200, hudHeight + 230);

        const bossKeys = Object.keys(wave.bossWaves);
        bossKeys.forEach((w, i) => {
            const fy = hudHeight + 250 + i * 45;
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Onda ${w}`, 200, fy - 5);
            this.drawButton({ x: 200, y: fy, width: 300, height: 35 }, Config.THEME.colors.gold, wave.bossWaves[w]);
        });

        this.drawButton({ x: 200, y: hudHeight + 250 + bossKeys.length * 45, width: 300, height: 40 }, Config.THEME.colors.gold, '+ Adicionar Onda de Boss');
    }

    drawSpellEditorVisuals(editor, ui) {
        const hudHeight = ui.hudHeight;
        const keys = Object.keys(editor.draftSpells);

        this.drawButton({ x: 20, y: hudHeight + 60, width: 150, height: 30 }, Config.THEME.colors.gold, '+ Nova Magia');

        keys.forEach((key, i) => {
            const isActive = editor.selectedSpellKey === key;
            this.drawButton({ x: 20, y: hudHeight + 100 + i * 35, width: 150, height: 30 }, isActive ? Config.THEME.colors.gold : '#555', key);
        });

        if (editor.selectedSpellKey) {
            const spell = editor.draftSpells[editor.selectedSpellKey];
            const fields = [
                { label: 'Nome', key: 'name' },
                { label: 'Dano', key: 'damage', type: 'number' },
                { label: 'Raio', key: 'radius', type: 'number' },
                { label: 'Cooldown', key: 'cooldown', type: 'number' },
                { label: 'Cast Time', key: 'castTime', type: 'number' },
                { label: 'Tipo', key: 'type' },
                { label: 'Dano Tipo', key: 'damageType' }
            ];

            fields.forEach((f, i) => {
                const fy = hudHeight + 100 + i * 45;
                this.ctx.fillStyle = '#bdc3c7';
                this.ctx.font = '14px Arial';
                this.ctx.fillText(f.label, 200, fy - 5);
                this.drawButton({ x: 200, y: fy, width: 300, height: 35 }, Config.THEME.colors.gold, String(spell[f.key]));
            });
        }
    }

    drawMapEditorVisuals(editor, ui) {
        const map = editor.draftMap;
        const hudHeight = ui.hudHeight;

        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = `14px ${Config.THEME.font}`;
        this.ctx.fillText(`Nome: ${map.name}`, 20, hudHeight + 60);
        this.ctx.fillText(`Clique no grid para desenhar o caminho.`, 20, hudHeight + 80);

        // Toolbar
        this.drawButton({ x: 20, y: hudHeight + 100, width: 130, height: 30 }, Config.THEME.colors.gold, 'Mudar Nome');
        this.drawButton({ x: 20, y: hudHeight + 140, width: 130, height: 30 }, Config.THEME.colors.gold, 'Novo Caminho');
        this.drawButton({ x: 20, y: hudHeight + 180, width: 130, height: 30 }, editor.selectedTool === 'path' ? Config.THEME.colors.gold : '#555', 'Tool: Path');
        this.drawButton({ x: 20, y: hudHeight + 220, width: 130, height: 30 }, editor.selectedTool === 'hazard' ? Config.THEME.colors.gold : '#555', 'Tool: Hazard');
        this.drawButton({ x: 20, y: hudHeight + 260, width: 130, height: 30 }, Config.THEME.colors.gold, `Tipo: ${editor.selectedHazard}`);

        // Highlight existing path points for all paths
        map.paths.forEach((path, pathIdx) => {
            const color = pathIdx === map.paths.length - 1 ? 'rgba(241, 196, 15, 0.4)' : 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillStyle = color;
            path.forEach(p => {
                this.ctx.fillRect(p.x * Config.gridSize, p.y * Config.gridSize, Config.gridSize, Config.gridSize);
                this.ctx.strokeStyle = Config.THEME.colors.gold;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(p.x * Config.gridSize, p.y * Config.gridSize, Config.gridSize, Config.gridSize);
            });
        });

        // Hazards indicators
        map.hazards.forEach(h => {
            this.ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
            this.ctx.fillRect(h.x * Config.gridSize, h.y * Config.gridSize, Config.gridSize, Config.gridSize);
            this.ctx.strokeStyle = '#e74c3c';
            this.ctx.strokeRect(h.x * Config.gridSize, h.y * Config.gridSize, Config.gridSize, Config.gridSize);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(h.type.substring(0, 5), h.x * Config.gridSize + Config.gridSize/2, h.y * Config.gridSize + Config.gridSize/2);
        });
    }

    drawMapEditorHighlights(editor) {
        const map = editor.draftMap;
        if (!map) return;

        this.ctx.save();
        map.paths.forEach((path, pathIdx) => {
            const color = pathIdx === map.paths.length - 1 ? 'rgba(241, 196, 15, 0.34)' : 'rgba(255, 255, 255, 0.16)';
            this.ctx.fillStyle = color;
            path.forEach(p => {
                this.ctx.fillRect(p.x * Config.gridSize, p.y * Config.gridSize, Config.gridSize, Config.gridSize);
                this.ctx.strokeStyle = Config.THEME.colors.gold;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(p.x * Config.gridSize, p.y * Config.gridSize, Config.gridSize, Config.gridSize);
            });
        });

        map.hazards.forEach(h => {
            this.ctx.fillStyle = 'rgba(192, 57, 43, 0.52)';
            this.ctx.fillRect(h.x * Config.gridSize, h.y * Config.gridSize, Config.gridSize, Config.gridSize);
            this.ctx.strokeStyle = '#ffb3a7';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(h.x * Config.gridSize, h.y * Config.gridSize, Config.gridSize, Config.gridSize);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(h.type.substring(0, 5), h.x * Config.gridSize + Config.gridSize / 2, h.y * Config.gridSize + Config.gridSize / 2);
        });
        this.ctx.restore();
    }

    /**
     * Desenha o modal de Level Up
     */
    drawLevelUpModal(tower, ui, dataManager = null) {
        if (!tower) return;

        const localeManager = window.game?.localeManager;
        const t = (key) => localeManager ? localeManager.t(key) : key;
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
        this.ctx.fillText(`${t('notification_level_up')}: ${tower.name.toUpperCase()}`, modal.x + modal.width / 2, modal.y + 40);

        this.ctx.font = '16px ' + Config.THEME.font;
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillText(`${t('ui_level')} ${tower.level}`, modal.x + modal.width / 2, modal.y + 65);

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

    drawSettings(gameState, ui) {
        const localeManager = window.game?.localeManager;
        const layout = ui.getSettingsLayout(this.canvas, gameState.settingsManager.state, localeManager);
        const { modal, language, volumes, keybinds, backButton } = layout;

        // Overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Modal
        this.ctx.fillStyle = Config.THEME.colors.darkStone;
        this.ctx.strokeStyle = Config.THEME.colors.gold;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(modal.x, modal.y, modal.width, modal.height);
        this.ctx.strokeRect(modal.x, modal.y, modal.width, modal.height);

        // Title
        this.ctx.fillStyle = Config.THEME.colors.gold;
        this.ctx.font = `bold 32px ${Config.THEME.font}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(modal.title, modal.x + modal.width / 2, modal.y + 40);

        // Language
        this.drawButton(language, Config.THEME.colors.gold, language.label);

        // Volumes
        volumes.forEach(vol => {
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.font = `15px ${Config.THEME.font}`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'alphabetic';
            this.ctx.fillText(vol.label, vol.x, vol.y - 14);

            // Bar background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(vol.x, vol.y, vol.width, vol.height);

            // Bar fill
            this.ctx.fillStyle = Config.THEME.colors.gold;
            this.ctx.fillRect(vol.x, vol.y, vol.width * vol.value, vol.height);

            this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(vol.x, vol.y, vol.width, vol.height);
        });

        // Keybinds
        this.drawButton(keybinds, Config.THEME.colors.gold, keybinds.label);

        // Back
        this.drawButton(backButton, Config.THEME.colors.gold, backButton.label);
    }

    clear() {
        // Reset transform from Screen Shake before clearing
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

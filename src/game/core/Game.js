import { Config } from './Config.js';
import { Tower } from '../entities/Tower.js';
import { WaveManager } from '../managers/WaveManager.js';
import { TowerManager } from '../managers/TowerManager.js';
import { CanvasRenderer } from '../../ui/CanvasRenderer.js';
import { GameUI } from '../../ui/GameUI.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new CanvasRenderer(canvas);
        this.ui = new GameUI();
        this.waveManager = new WaveManager();
        this.towerManager = new TowerManager();
        this.particleSystem = new ParticleSystem();
        
        this.state = {
            enemies: [],
            projectiles: [],
            money: Config.initialMoney,
            lives: Config.initialLives,
            gameRunning: false,
            towerManager: this.towerManager,
            selectedPlacedTower: null,
            mouseX: 0,
            mouseY: 0
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.state.mouseX = e.clientX - rect.left;
            this.state.mouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', (e) => {
            if (!this.state.gameRunning) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Verifica clique no painel lateral
            const panelX = this.canvas.width - this.ui.panelWidth;
            if (clickX >= panelX) {
                this.handlePanelClick(clickY);
                return;
            }

            // Clique no grid para posicionar torre
            const x = Math.floor(clickX / Config.gridSize);
            const y = Math.floor(clickY / Config.gridSize);
            
            if (this.state.selectedPlacedTower) {
                if (this.handleContextMenuClick(clickX, clickY)) {
                    return;
                }
            }

            const existingTower = this.towerManager.getTowerAt(x, y);
            if (existingTower) {
                this.state.selectedPlacedTower = existingTower;
            } else if (this.canPlaceTower(x, y)) {
                this.placeTower(x, y);
                this.state.selectedPlacedTower = null;
            } else {
                this.state.selectedPlacedTower = null;
            }
        });
    }

    handleContextMenuClick(clickX, clickY) {
        const layout = this.ui.getTowerMenuLayout(this.state.selectedPlacedTower);

        // Verifica Upgrade
        if (clickX >= layout.upgrade.x && clickX <= layout.upgrade.x + layout.upgrade.width &&
            clickY >= layout.upgrade.y && clickY <= layout.upgrade.y + layout.upgrade.height) {

            const cost = this.state.selectedPlacedTower.getUpgradeCost();
            if (this.state.money >= cost && this.state.selectedPlacedTower.upgrade()) {
                this.state.money -= cost;
            }
            return true;
        }

        // Verifica Venda
        if (clickX >= layout.sell.x && clickX <= layout.sell.x + layout.sell.width &&
            clickY >= layout.sell.y && clickY <= layout.sell.y + layout.sell.height) {

            const value = this.state.selectedPlacedTower.getSellValue();
            this.state.money += value;
            this.towerManager.removeTower(this.state.selectedPlacedTower);
            this.state.selectedPlacedTower = null;
            return true;
        }

        return false;
    }

    handlePanelClick(y) {
        const itemHeight = 80;
        const padding = 10;
        const startY = this.ui.hudHeight + padding;

        const index = Math.floor((y - startY) / (itemHeight + padding));

        if (index >= 0 && index < this.towerManager.availableTowers.length) {
            const towerType = this.towerManager.availableTowers[index].type;
            this.towerManager.selectTower(towerType);
        }
    }

    canPlaceTower(x, y) {
        const selectedTower = this.towerManager.getSelectedTower();
        if (this.state.money < selectedTower.cost) return false;
        
        // Verifica se clicou fora da área de jogo (painel lateral)
        if (x * Config.gridSize >= this.canvas.width - this.ui.panelWidth) return false;
        if (y * Config.gridSize < this.ui.hudHeight) return false;

        // Verifica se está no caminho
        for (let point of Config.path) {
            if (point.x === x && point.y === y) return false;
        }
        
        // Verifica se já existe uma torre
        if (this.towerManager.getTowerAt(x, y)) return false;
        
        return true;
    }

    placeTower(x, y) {
        const selectedTower = this.towerManager.getSelectedTower();
        this.towerManager.addTower(x, y, selectedTower.type);
        this.state.money -= selectedTower.cost;
    }

    start() {
        console.log('Game iniciado');
        this.state.gameRunning = true;
        this.waveManager.startWave(this.state);
        this.gameLoop();
    }

    stop() {
        this.state.gameRunning = false;
        this.waveManager.endWave(this.state);
    }

    gameLoop(timestamp = 0) {
        if (!this.state.gameRunning) return;

        this.renderer.clear();
        this.renderer.drawGrid();
        this.renderer.drawPath();
        this.drawRangeVisuals();
        this.renderer.drawUI(this.state, this.waveManager, this.ui);

        // Atualiza e desenha torres
        for (let tower of this.towerManager.placedTowers) {
            const projectile = tower.update(timestamp, this.state.enemies);
            if (projectile) {
                this.state.projectiles.push(projectile);
            }
            this.renderer.drawTower(tower);
        }

        // Atualiza projéteis
        for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
            const p = this.state.projectiles[i];
            p.update();

            if (p.reached) {
                this.applyDamage(p);
                this.state.projectiles.splice(i, 1);
            } else {
                this.renderer.drawProjectile(p);
            }
        }

        // Atualiza e desenha inimigos
        for (let enemy of this.state.enemies) {
            enemy.update();
            this.renderer.drawEnemy(enemy);
        }

        // Atualiza e desenha partículas
        this.particleSystem.update();
        this.renderer.drawParticles(this.particleSystem.getParticles());

        // Remove inimigos mortos
        const enemiesBefore = this.state.enemies.length;
        this.state.enemies = this.state.enemies.filter(enemy => enemy.health > 0);
        this.waveManager.enemiesKilled += enemiesBefore - this.state.enemies.length;

        // Verifica se o jogo acabou
        if (this.state.lives <= 0) {
            this.stop();
            alert(`Game Over! Você chegou até a fase ${this.waveManager.currentWave}`);
            return;
        }

        // Atualiza o gerenciador de ondas
        this.waveManager.update(this.state);

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    drawRangeVisuals() {
        // 1. Preview de alcance para nova torre sendo posicionada
        const mouseGridX = Math.floor(this.state.mouseX / Config.gridSize);
        const mouseGridY = Math.floor(this.state.mouseY / Config.gridSize);
        const selectedType = this.towerManager.getSelectedTower();
        const panelX = this.canvas.width - this.ui.panelWidth;

        if (selectedType && this.state.mouseX < panelX && this.state.mouseY > this.ui.hudHeight) {
            this.renderer.drawRangeCircle(
                mouseGridX * Config.gridSize + Config.gridSize / 2,
                mouseGridY * Config.gridSize + Config.gridSize / 2,
                selectedType.range
            );
        }

        // 2. Alcance da torre selecionada (com menu aberto)
        if (this.state.selectedPlacedTower) {
            this.renderer.drawRangeCircle(
                this.state.selectedPlacedTower.x * Config.gridSize + Config.gridSize / 2,
                this.state.selectedPlacedTower.y * Config.gridSize + Config.gridSize / 2,
                this.state.selectedPlacedTower.range
            );
        }

        // 3. Alcance ao passar o mouse sobre uma torre já posicionada
        const hoveredTower = this.towerManager.getTowerAt(mouseGridX, mouseGridY);
        if (hoveredTower && hoveredTower !== this.state.selectedPlacedTower) {
            this.renderer.drawRangeCircle(
                hoveredTower.x * Config.gridSize + Config.gridSize / 2,
                hoveredTower.y * Config.gridSize + Config.gridSize / 2,
                hoveredTower.range
            );
        }
    }

    applyDamage(projectile) {
        if (projectile.splashRadius > 0) {
            // Splash Damage
            this.state.enemies.forEach(enemy => {
                const dx = enemy.x - projectile.x;
                const dy = enemy.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= projectile.splashRadius) {
                    enemy.health -= projectile.damage;
                    this.particleSystem.emit(enemy.x, enemy.y, Config.THEME.colors.bloodRed, 3);
                }
            });
            // Visual feedback for splash
            this.particleSystem.emit(projectile.x, projectile.y, Config.THEME.colors.mage, 15);
        } else if (projectile.target && projectile.target.health > 0) {
            // Single target damage
            projectile.target.health -= projectile.damage;

            if (projectile.target.health <= 0) {
                this.particleSystem.emit(projectile.x, projectile.y, Config.THEME.colors.bloodRed, Config.particleCount);
            } else {
                const color = projectile.type === 'cannon' ? Config.THEME.colors.cannon : '#f1c40f';
                this.particleSystem.emit(projectile.x, projectile.y, color, 5);
            }
        }
    }
} 
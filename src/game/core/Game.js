import { Config } from './Config.js';
import { Tower } from '../entities/Tower.js';
import { WaveManager } from '../managers/WaveManager.js';
import { TowerManager } from '../managers/TowerManager.js';
import { CanvasRenderer } from '../../ui/CanvasRenderer.js';
import { GameUI } from '../../ui/GameUI.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { FloatingText } from '../effects/FloatingText.js';
import { AudioManager } from '../../audio/AudioManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new CanvasRenderer(canvas);
        this.ui = new GameUI();
        this.waveManager = new WaveManager();
        this.towerManager = new TowerManager();
        this.particleSystem = new ParticleSystem();
        this.floatingTexts = new FloatingText();
        this.audio = new AudioManager();
        
        this.state = {
            enemies: [],
            projectiles: [],
            money: Config.initialMoney,
            lives: Config.initialLives,
            gameRunning: false,
            isGameOver: false,
            isVictory: false,
            towerManager: this.towerManager,
            selectedPlacedTower: null,
            mouseX: 0,
            mouseY: 0,
            isPaused: false,
            gameSpeed: 1,
            logicalTime: 0,
            highscore: parseInt(localStorage.getItem('towers_highscore')) || 0
        };

        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = 1000 / 60; // 16.67ms

        this.isLoopRunning = false;
        this.setupEventListeners();
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Calcula a posição relativa ao tamanho real do canvas (resolução interna)
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
            }
        });

        const handleMove = (e) => {
            const pos = this.getMousePos(e);
            this.state.mouseX = pos.x;
            this.state.mouseY = pos.y;
        };

        this.canvas.addEventListener('mousemove', handleMove);
        this.canvas.addEventListener('touchmove', (e) => {
            handleMove(e);
            if (e.cancelable) e.preventDefault();
        }, { passive: false });

        const handleClick = (e) => {
            const pos = this.getMousePos(e);
            const clickX = pos.x;
            const clickY = pos.y;

            if (this.state.isGameOver || this.state.isVictory) {
                const layout = this.ui.getEndGameLayout(this.canvas);
                if (clickX >= layout.restartButton.x && clickX <= layout.restartButton.x + layout.restartButton.width &&
                    clickY >= layout.restartButton.y && clickY <= layout.restartButton.y + layout.restartButton.height) {
                    this.restart();
                }
                return;
            }

            if (!this.state.gameRunning) return;

            // Verifica clique no botão de Iniciar Agora (countdown)
            if (this.waveManager.isWaiting) {
                const countdownLayout = this.ui.getWaveCountdownLayout(this.canvas);
                if (clickX >= countdownLayout.button.x && clickX <= countdownLayout.button.x + countdownLayout.button.width &&
                    clickY >= countdownLayout.button.y && clickY <= countdownLayout.button.y + countdownLayout.button.height) {
                    this.waveManager.skipCountdown();
                    return;
                }
            }

            // Verifica clique nos botões de controle
            if (this.handleControlsClick(clickX, clickY)) {
                return;
            }

            // Se estiver pausado, não permite outras interações no canvas (exceto controles)
            if (this.state.isPaused) return;

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
        };

        this.canvas.addEventListener('click', handleClick);
        this.canvas.addEventListener('touchstart', (e) => {
            // Em mobile, simulamos o move para que o preview de alcance apareça no toque
            handleMove(e);
            handleClick(e);
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
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

    handleControlsClick(clickX, clickY) {
        const layout = this.ui.getControlButtonsLayout(this.canvas);

        // Clique Pausa
        if (clickX >= layout.pause.x && clickX <= layout.pause.x + layout.pause.width &&
            clickY >= layout.pause.y && clickY <= layout.pause.y + layout.pause.height) {
            this.togglePause();
            return true;
        }

        // Clique Velocidade
        if (clickX >= layout.speed.x && clickX <= layout.speed.x + layout.speed.width &&
            clickY >= layout.speed.y && clickY <= layout.speed.y + layout.speed.height) {
            this.toggleSpeed();
            return true;
        }

        return false;
    }

    togglePause() {
        if (this.state.isGameOver || this.state.isVictory) return;
        this.state.isPaused = !this.state.isPaused;
        console.log(this.state.isPaused ? 'Jogo Pausado' : 'Jogo Retomado');
    }

    toggleSpeed() {
        this.state.gameSpeed = this.state.gameSpeed === 1 ? 2 : 1;
        console.log(`Velocidade: ${this.state.gameSpeed}x`);
    }

    updateHighscore() {
        const wavesSurvived = this.waveManager.currentWave - 1;
        if (wavesSurvived > this.state.highscore) {
            this.state.highscore = wavesSurvived;
            localStorage.setItem('towers_highscore', wavesSurvived);
        }
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
        this.audio.resume();
        this.state.gameRunning = true;
        this.waveManager.startCountdown();

        if (!this.isLoopRunning) {
            this.isLoopRunning = true;
            this.gameLoop();
        }
    }

    stop() {
        this.state.gameRunning = false;
        this.waveManager.endWave(this.state);
    }

    restart() {
        this.state.money = Config.initialMoney;
        this.state.lives = Config.initialLives;
        this.state.enemies = [];
        this.state.projectiles = [];
        this.state.isGameOver = false;
        this.state.isVictory = false;
        this.state.isPaused = false;
        this.state.gameSpeed = 1;
        this.state.logicalTime = 0;
        this.state.selectedPlacedTower = null;
        this.towerManager.reset();
        this.waveManager.reset();
        this.particleSystem.particles = [];
        this.floatingTexts.texts = [];
        this.start();
    }

    gameLoop(timestamp = 0) {
        if (!this.state.gameRunning && !this.state.isGameOver && !this.state.isVictory) {
            this.isLoopRunning = false;
            this.lastTime = 0;
            return;
        }

        if (this.lastTime === 0) this.lastTime = timestamp;
        let deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Limita o deltaTime para evitar "espirais da morte" em travamentos
        if (deltaTime > 100) deltaTime = 100;

        if (!this.state.isPaused && this.state.gameRunning) {
            this.accumulator += deltaTime * this.state.gameSpeed;

            while (this.accumulator >= this.timeStep) {
                this.updateLogic();
                this.accumulator -= this.timeStep;
            }
        }

        // Renderização (sempre ocorre para manter UI responsiva)
        this.renderer.drawGrid();
        this.drawRangeVisuals();

        // Desenha torres
        for (let tower of this.towerManager.placedTowers) {
            this.renderer.drawTower(tower);
        }

        // Desenha projéteis
        for (let p of this.state.projectiles) {
            this.renderer.drawProjectile(p);
        }

        // Desenha inimigos
        for (let enemy of this.state.enemies) {
            this.renderer.drawEnemy(enemy);
        }

        // Desenha partículas
        this.renderer.drawParticles(this.particleSystem.getParticles());

        // Desenha textos flutuantes
        this.renderer.drawFloatingTexts(this.floatingTexts.texts);

        // Desenha UI por cima de tudo
        this.renderer.drawUI(this.state, this.waveManager, this.ui);

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    updateLogic() {
        if (!this.state.gameRunning || this.state.isPaused || this.state.isGameOver || this.state.isVictory) return;

        this.state.logicalTime += this.timeStep;

        // Atualiza torres
        for (let tower of this.towerManager.placedTowers) {
            const projectile = tower.update(this.state.logicalTime, this.state.enemies);
            if (projectile) {
                this.state.projectiles.push(projectile);
                this.audio.playShoot(tower.type);
            }
        }

        // Atualiza projéteis
        for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
            const p = this.state.projectiles[i];
            p.update();

            if (p.reached) {
                this.applyDamage(p);
                this.state.projectiles.splice(i, 1);
            }
        }

        // Atualiza inimigos
        for (let enemy of this.state.enemies) {
            enemy.update();
        }

        // Atualiza partículas
        this.particleSystem.update();

        // Atualiza textos flutuantes
        this.floatingTexts.update();

        // Remove inimigos mortos ou que chegaram ao fim
        const enemiesBefore = this.state.enemies.length;
        this.state.enemies = this.state.enemies.filter(enemy => {
            if (enemy.reachedEnd) {
                this.state.lives--;
                this.floatingTexts.add(enemy.x, enemy.y, '-1 ❤️', Config.THEME.colors.bloodRed);
                return false;
            }
            if (enemy.health <= 0) {
                this.audio.playEnemyDeath();
                return false;
            }
            return true;
        });
        this.waveManager.enemiesKilled += enemiesBefore - this.state.enemies.length;

        // Verifica vitória
        if (this.waveManager.currentWave > Config.maxWaves) {
            this.state.isVictory = true;
            this.state.gameRunning = false;
            this.audio.playVictory();
            this.updateHighscore();
        }

        // Verifica derrota
        if (this.state.lives <= 0) {
            this.state.lives = 0; // Garante que não fique negativo
            this.state.isGameOver = true;
            this.state.gameRunning = false;
            this.audio.playGameOver();
            this.updateHighscore();
        }

        // Atualiza o gerenciador de ondas se o jogo ainda estiver rodando
        if (this.state.gameRunning) {
            const waveBefore = this.waveManager.currentWave;
            const waveResult = this.waveManager.update(this.state);

            if (waveResult && waveResult.type === 'wave_complete') {
                this.floatingTexts.add(this.canvas.width / 2, this.canvas.height / 2, `+${waveResult.reward} G`, Config.THEME.colors.gold);
            }

            if (this.waveManager.currentWave > waveBefore && this.waveManager.currentWave <= Config.maxWaves) {
                this.audio.playWaveStart();
            }
        }
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
            const splashRadiusSq = projectile.splashRadius * projectile.splashRadius;
            this.state.enemies.forEach(enemy => {
                const dx = enemy.x - projectile.x;
                const dy = enemy.y - projectile.y;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq <= splashRadiusSq) {
                    enemy.health -= projectile.damage;
                    this.floatingTexts.add(enemy.x, enemy.y, `-${projectile.damage}`, Config.THEME.colors.bloodRed);
                    this.particleSystem.emit(enemy.x, enemy.y, Config.THEME.colors.bloodRed, 3);
                }
            });
            // Visual feedback for splash
            this.particleSystem.emit(projectile.x, projectile.y, Config.THEME.colors.mage, 15);
        } else if (projectile.target && projectile.target.health > 0) {
            // Single target damage
            projectile.target.health -= projectile.damage;
            this.floatingTexts.add(projectile.target.x, projectile.target.y, `-${projectile.damage}`, Config.THEME.colors.bloodRed);

            if (projectile.target.health <= 0) {
                this.particleSystem.emit(projectile.x, projectile.y, Config.THEME.colors.bloodRed, Config.particleCount);
            } else {
                const color = projectile.type === 'cannon' ? Config.THEME.colors.cannon : '#f1c40f';
                this.particleSystem.emit(projectile.x, projectile.y, color, 5);
            }
        }
    }
}

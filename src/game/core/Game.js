import { Config } from './Config.js';
import { StateStore } from './StateStore.js';
import { GameLoop } from './GameLoop.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SpellSystem } from '../systems/SpellSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { PartySystem } from '../systems/PartySystem.js';
import { TowerManager } from '../managers/TowerManager.js';
import { DataManager } from '../managers/DataManager.js';
import { MetaManager } from '../managers/MetaManager.js';
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
        this.waveSystem = new WaveSystem();
        this.partySystem = new PartySystem();
        this.towerManager = new TowerManager();
        this.dataManager = new DataManager();
        this.metaManager = new MetaManager();
        this.particleSystem = new ParticleSystem();
        this.floatingTexts = new FloatingText();
        this.audio = new AudioManager();
        
        this.stateStore = new StateStore();
        this.state = this.stateStore.state;
        this.state.towerManager = this.towerManager;
        this.state.dataManager = this.dataManager;
        this.state.metaManager = this.metaManager;

        this.renderSystem = new RenderSystem(this.renderer, this.ui);
        this.inputSystem = new InputSystem(canvas, {
            onKeyDown: (e) => this.handleKeyDown(e),
            onMouseMove: (x, y) => this.handleMouseMove(x, y),
            onClick: (x, y) => this.handleClick(x, y)
        });

        this.gameLoopController = new GameLoop({
            onUpdate: (timeStep) => this.updateLogic(timeStep),
            onRender: () => this.renderSystem.render(this.state, this.waveSystem, this.particleSystem, this.floatingTexts, this.canvas),
            shouldRun: () => this.state.gameRunning || this.state.isGameOver || this.state.isVictory || this.state.showTavern,
            isPaused: () => this.state.isPaused,
            getGameSpeed: () => this.state.gameSpeed
        });
    }

    async init() {
        console.log('Inicializando sistemas de dados...');

        // Carrega configurações globais
        const configData = await this.dataManager.loadJSON('config', 'src/game/data/config.json');
        if (configData) {
            Config.load(configData);

            // Carrega dados de inimigos para o DataManager
            await this.dataManager.loadJSON('enemies', 'src/game/data/enemies.json');
            await this.dataManager.loadJSON('classes', 'src/game/data/classes.json');
            await this.dataManager.loadJSON('races', 'src/game/data/races.json');
            await this.dataManager.loadJSON('feats', 'src/game/data/feats.json');
            await this.dataManager.loadJSON('effects', 'src/game/data/effects.json');

            // Atualiza managers que dependem do Config
            this.waveSystem.reset();
            this.towerManager.reset(this.metaManager);
            // Carrega dados de meta-progressão
            await this.dataManager.loadJSON('meta', 'src/game/data/meta.json');

            this.stateStore.reset();
            this.state = this.stateStore.state;
            this.state.towerManager = this.towerManager;
            this.state.dataManager = this.dataManager;
            this.state.metaManager = this.metaManager;

            // Aplica bônus de meta-progressão ao estado inicial
            this.applyMetaBonuses(true);
        }

        return true;
    }

    handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
        }
    }

    handleMouseMove(x, y) {
        this.state.mouseX = x;
        this.state.mouseY = y;
    }

    handleClick(clickX, clickY) {
        if (this.state.showTavern) {
            this.handleTavernClick(clickX, clickY);
            return;
        }

        if (this.state.isGameOver || this.state.isVictory) {
            const layout = this.ui.getEndGameLayout(this.canvas);
            if (clickX >= layout.restartButton.x && clickX <= layout.restartButton.x + layout.restartButton.width &&
                clickY >= layout.restartButton.y && clickY <= layout.restartButton.y + layout.restartButton.height) {
                this.restart();
            }
            return;
        }

        if (!this.state.gameRunning) return;

        // Verifica clique no modal de Level Up
        if (this.state.levelUpTower) {
            const layout = this.ui.getLevelUpModalLayout(this.canvas);
            for (let i = 0; i < layout.options.length; i++) {
                const opt = layout.options[i];
                if (clickX >= opt.x && clickX <= opt.x + opt.width &&
                    clickY >= opt.y && clickY <= opt.y + opt.height) {

                    this.applyLevelUpSelection(this.state.levelUpTower, i);
                    this.state.levelUpTower.pendingLevelUps--;

                    if (this.state.levelUpTower.pendingLevelUps <= 0) {
                        this.state.levelUpTower = null;
                        this.state.isPaused = false;
                    }
                    return;
                }
            }
            return; // Bloqueia outros cliques enquanto o modal está aberto
        }

        // Verifica clique no botão de Iniciar Agora (countdown)
        if (this.waveSystem.isWaiting) {
            const countdownLayout = this.ui.getWaveCountdownLayout(this.canvas);
            if (clickX >= countdownLayout.button.x && clickX <= countdownLayout.button.x + countdownLayout.button.width &&
                clickY >= countdownLayout.button.y && clickY <= countdownLayout.button.y + countdownLayout.button.height) {
                this.waveSystem.skipCountdown();
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
            if (existingTower.pendingLevelUps > 0) {
                console.log('Opening Level Up Modal for', existingTower.name);
                this.state.levelUpTower = existingTower;
                this.state.isPaused = true;
                return;
            }
            this.state.selectedPlacedTower = existingTower;
        } else if (this.canPlaceTower(x, y)) {
            this.placeTower(x, y);
            this.state.selectedPlacedTower = null;
        } else {
            this.state.selectedPlacedTower = null;
        }
    }

    handleContextMenuClick(clickX, clickY) {
        const tower = this.state.selectedPlacedTower;
        const layout = this.ui.getTowerMenuLayout(tower);

        // Verifica Clique no Alvo (Target Mode)
        if (clickX >= layout.target.x && clickX <= layout.target.x + layout.target.width &&
            clickY >= layout.target.y && clickY <= layout.target.y + layout.target.height) {

            const currentIndex = tower.targetModes.indexOf(tower.targetMode);
            const nextIndex = (currentIndex + 1) % tower.targetModes.length;
            tower.targetMode = tower.targetModes[nextIndex];

            this.floatingTexts.add(tower.x * Config.gridSize + 20, tower.y * Config.gridSize - 10, tower.targetMode.toUpperCase().replace('_', ' '), Config.THEME.colors.gold);
            return true;
        }

        // Verifica Venda
        if (clickX >= layout.sell.x && clickX <= layout.sell.x + layout.sell.width &&
            clickY >= layout.sell.y && clickY <= layout.sell.y + layout.sell.height) {

            const value = tower.getSellValue();
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

    applyMetaBonuses(isStartOfRun = false) {
        const metaData = this.dataManager.get('meta');
        const bonuses = this.metaManager.getBonuses(metaData);

        if (isStartOfRun) {
            this.state.money += bonuses.startingGold;
            this.state.lives += bonuses.extraLives;
        }

        this.state.metaBonuses = bonuses;
    }

    handleTavernClick(clickX, clickY) {
        const metaData = this.dataManager.get('meta');
        const layout = this.ui.getTavernLayout(this.canvas, metaData, this.metaManager);

        // Voltar
        if (clickX >= layout.backButton.x && clickX <= layout.backButton.x + layout.backButton.width &&
            clickY >= layout.backButton.y && clickY <= layout.backButton.y + layout.backButton.height) {
            this.state.showTavern = false;
            if (!this.state.gameRunning) {
                // If we came from the start screen, go back there
                this.canvas.style.display = 'none';
                document.getElementById('startScreen').style.display = 'block';
                this.gameLoopController.stop();
            }
            return;
        }

        // Tabs
        layout.tabs.forEach(tab => {
            if (clickX >= tab.x && clickX <= tab.x + tab.width &&
                clickY >= tab.y && clickY <= tab.y + tab.height) {
                this.state.tavernCategory = tab.category;
            }
        });

        // Upgrades
        if (layout.upgradeButtons) {
            layout.upgradeButtons.forEach(btn => {
                if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                    clickY >= btn.y && clickY <= btn.y + btn.height) {
                    let success = false;
                    if (btn.type === 'upgrade') success = this.metaManager.upgrade(btn.key, btn.cost);
                    else if (btn.type === 'unlock') success = this.metaManager.unlockClass(btn.key, btn.cost);
                    else if (btn.type === 'talent') success = this.metaManager.buyTalent(btn.key, btn.cost, btn.requires, metaData);
                    else if (btn.type === 'research') success = this.metaManager.buyResearch(btn.key, metaData);
                    else if (btn.type === 'relic') success = this.metaManager.buyRelic(btn.key, btn.cost);

                    if (success) {
                        this.audio.playWaveStart();
                        this.applyMetaBonuses(false);
                        // Re-filter towers if a class was unlocked
                        if (btn.type === 'unlock') this.towerManager.reset(this.metaManager);
                    }
                }
            });
        }
    }

    applyLevelUpSelection(tower, index) {
        if (index === 0) {
            // Atributo: +2 no Atributo Primário
            const attr = tower.primaryAbility;
            tower.attributes[attr] += 2;
            this.floatingTexts.add(tower.x * Config.gridSize + 20, tower.y * Config.gridSize, `+2 ${attr.toUpperCase()}`, Config.THEME.colors.gold);
        } else if (index === 1) {
            // Feat: Escolha um Talento Aleatório (Data-driven)
            const allFeats = this.dataManager.get('feats');
            const featKeys = Object.keys(allFeats || {});

            if (featKeys.length > 0) {
                // Evita duplicatas se possível
                const availableFeats = featKeys.filter(f => !tower.traits.includes(f));
                const randomFeatKey = availableFeats.length > 0 ?
                    availableFeats[Math.floor(Math.random() * availableFeats.length)] :
                    featKeys[Math.floor(Math.random() * featKeys.length)];

                const featData = allFeats[randomFeatKey];
                tower.traits.push(randomFeatKey);

                // Aplica bônus do feat (Data-driven)
                if (featData.bonuses) {
                    const b = featData.bonuses;
                    if (b.range) tower.range += b.range;
                    if (b.damage) tower.damage += b.damage;
                    if (b.cooldownMultiplier) tower.cooldown *= b.cooldownMultiplier;
                    if (b.spellCooldownMultiplier) tower.spellCooldown *= b.spellCooldownMultiplier;
                    if (b.damageMultiplier) tower.damage = Math.floor(tower.damage * b.damageMultiplier);
                }

                this.floatingTexts.add(tower.x * Config.gridSize + 20, tower.y * Config.gridSize, (featData.name || randomFeatKey).toUpperCase() + '!', Config.THEME.colors.gold);
            }
        } else if (index === 2) {
            // Especialização: Bônus massivo em Dano ou Alcance
            if (Math.random() > 0.5) {
                tower.damage = Math.floor(tower.damage * 1.5);
                this.floatingTexts.add(tower.x * Config.gridSize + 20, tower.y * Config.gridSize, '+50% DANO', Config.THEME.colors.gold);
            } else {
                tower.range += 60;
                this.floatingTexts.add(tower.x * Config.gridSize + 20, tower.y * Config.gridSize, '+60 ALCANCE', Config.THEME.colors.gold);
            }
        }
    }

    togglePause() {
        if (this.state.isGameOver || this.state.isVictory || this.state.levelUpTower) return;
        this.state.isPaused = !this.state.isPaused;
        console.log(this.state.isPaused ? 'Jogo Pausado' : 'Jogo Retomado');
    }

    toggleSpeed() {
        this.state.gameSpeed = this.state.gameSpeed === 1 ? 2 : 1;
        console.log(`Velocidade: ${this.state.gameSpeed}x`);
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
        const costMultiplier = this.state.metaBonuses ? this.state.metaBonuses.costMultiplier : 1.0;
        const actualCost = Math.floor(selectedTower.cost * costMultiplier);

        if (this.state.money < actualCost) return false;

        // Limite de Party Slots
        if (this.towerManager.placedTowers.length >= Config.maxPartySlots) return false;
        
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
        const costMultiplier = this.state.metaBonuses ? this.state.metaBonuses.costMultiplier : 1.0;
        const actualCost = Math.floor(selectedTower.cost * costMultiplier);

        // Randomly assign a race for variety (FASE 2 requirement)
        const races = this.dataManager.get('races');
        const raceKeys = Object.keys(races || { 'human': {} });
        const randomRaceKey = raceKeys[Math.floor(Math.random() * raceKeys.length)];
        const raceData = races ? races[randomRaceKey] : null;

        const tower = this.towerManager.addTower(x, y, selectedTower.type, randomRaceKey, raceData);

        // Aplica bônus de meta-progressão se existirem
        if (this.state.metaBonuses) {
            tower.metaCritBonus = this.state.metaBonuses.critThresholdBonus;
        }

        this.state.money -= actualCost;
    }

    start() {
        console.log('Game iniciado');
        this.audio.resume();
        this.state.gameRunning = true;
        this.waveSystem.startCountdown();

        this.gameLoopController.start();
    }

    stop() {
        this.state.gameRunning = false;
        this.waveSystem.endWave(this.state);
    }

    restart() {
        this.towerManager.reset(this.metaManager);
        this.waveSystem.reset();
        this.stateStore.reset();
        this.state = this.stateStore.state;
        this.state.towerManager = this.towerManager;
        this.state.dataManager = this.dataManager;
        this.state.metaManager = this.metaManager;
        this.applyMetaBonuses(true);

        this.particleSystem.particles = [];
        this.floatingTexts.texts = [];
        this.start();
    }

    updateLogic(timeStep) {
        if (!this.state.gameRunning || this.state.isPaused || this.state.isGameOver || this.state.isVictory) return;

        this.state.logicalTime += timeStep;

        // Atualiza Sinergias a cada 30 frames ou quando a composição muda
        if (this.state.logicalTime % 30 === 0) {
            this.partySystem.update(this.towerManager.placedTowers);
        }

        // Reset Paladin Aura effects before recalculating
        for (let tower of this.towerManager.placedTowers) {
            tower.hasPaladinAura = false;
        }

        // Atualiza torres
        for (let tower of this.towerManager.placedTowers) {
            const result = tower.update(
                this.state.logicalTime,
                timeStep,
                this.state.enemies,
                this.towerManager.placedTowers,
                this.state
            );
            if (result) {
                if (result.type === 'spell_cast') {
                    SpellSystem.execute(
                        result.spell,
                        result.tower,
                        this.state,
                        this.floatingTexts,
                        this.particleSystem,
                        this.dataManager
                    );
                } else {
                    this.state.projectiles.push(result);
                    this.audio.playShoot(tower.type);
                }
            }
        }

        // Atualiza projéteis
        for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
            const p = this.state.projectiles[i];
            p.update();

            if (p.reached) {
                CombatSystem.applyDamage(p, this.state, this.floatingTexts, this.particleSystem, this.dataManager);
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
                // Award XP to the tower that killed the enemy
                if (enemy.lastHitBy && typeof enemy.lastHitBy.addXp === 'function') {
                    const xpMultiplier = this.state.metaBonuses ? this.state.metaBonuses.xpMultiplier : 1.0;
                    enemy.lastHitBy.addXp((enemy.xp || 10) * xpMultiplier);
                }
                return false;
            }
            return true;
        });
        this.waveSystem.enemiesKilled += enemiesBefore - this.state.enemies.length;

        // Verifica vitória
        if (this.waveSystem.currentWave > Config.maxWaves) {
            this.state.isVictory = true;
            this.state.gameRunning = false;
            this.audio.playVictory();
            this.stateStore.updateHighscore(this.waveSystem.currentWave - 1);
        }

        // Verifica derrota
        if (this.state.lives <= 0) {
            this.state.lives = 0; // Garante que não fique negativo
            this.state.isGameOver = true;
            this.state.gameRunning = false;
            this.audio.playGameOver();
            this.stateStore.updateHighscore(this.waveSystem.currentWave - 1);
        }

        // Atualiza o gerenciador de ondas se o jogo ainda estiver rodando
        if (this.state.gameRunning) {
            const waveBefore = this.waveSystem.currentWave;
            const waveResult = this.waveSystem.update(this.state, this.dataManager);

            if (waveResult && waveResult.type === 'wave_complete') {
                this.floatingTexts.add(this.canvas.width / 2, this.canvas.height / 2, `+${waveResult.reward} G`, Config.THEME.colors.gold);

                // Ganha Arcane Shards baseado na onda
                const shardsGained = Math.max(1, Math.floor(waveResult.wave / 2));
                if (shardsGained > 0) {
                    this.metaManager.addShards(shardsGained);
                    this.floatingTexts.add(this.canvas.width / 2, this.canvas.height / 2 + 30, `+${shardsGained} ✨`, '#9b59b6');
                }
            }

            if (this.waveSystem.currentWave > waveBefore && this.waveSystem.currentWave <= Config.maxWaves) {
                this.audio.playWaveStart();
            }
        }
    }
}

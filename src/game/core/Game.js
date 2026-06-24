import { Config } from './Config.js';
import { StateStore } from './StateStore.js';
import { GameLoop } from './GameLoop.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SpellSystem } from '../systems/SpellSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { PartySystem } from '../systems/PartySystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { SpatialSystem } from '../systems/SpatialSystem.js';
import { TowerManager } from '../managers/TowerManager.js';
import { ProjectileManager } from '../managers/ProjectileManager.js';
import { DataManager } from '../managers/DataManager.js';
import { MetaManager } from '../managers/MetaManager.js';
import { LocaleManager } from '../managers/LocaleManager.js';
import { SettingsManager } from '../managers/SettingsManager.js';
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
        this.spatialSystem = new SpatialSystem(canvas.width, canvas.height);
        this.towerManager = new TowerManager();
        this.projectileManager = new ProjectileManager();
        this.dataManager = new DataManager();
        this.metaManager = new MetaManager();
        this.particleSystem = new ParticleSystem();
        this.floatingTexts = new FloatingText();
        this.audio = new AudioManager();
        
        this.stateStore = new StateStore();
        this.state = this.stateStore.state;
        this.renderSystem = new RenderSystem(this.renderer, this.ui);

        // Initialize Managers before systems that depend on them
        this.localeManager = new LocaleManager();
        this.settingsManager = new SettingsManager();
        this.syncStateReferences();

        this.inputSystem = new InputSystem(canvas, {
            onKeyDown: (e) => this.handleKeyDown(e),
            onMouseMove: (x, y) => this.handleMouseMove(x, y),
            onClick: (x, y) => this.handleClick(x, y)
        }, this.settingsManager);

        this.gameLoopController = new GameLoop({
            onUpdate: (timeStep) => this.updateLogic(timeStep),
            onRender: () => this.renderSystem.render(this.state, this.waveSystem, this.particleSystem, this.floatingTexts, this.canvas),
            shouldRun: () => this.state.gameRunning || this.state.isSetupPhase || this.state.isGameOver || this.state.isVictory || this.state.showTavern || this.state.showCamp || this.state.showEditor || this.state.showSettings,
            isPaused: () => this.state.isPaused,
            getGameSpeed: () => this.state.gameSpeed
        });
    }

    attachHtmlUI(elements, callbacks = {}) {
        this.htmlUI = elements;
        this.htmlCallbacks = callbacks;
        this.state.htmlUIEnabled = true;
    }

    syncStateReferences() {
        this.state.towerManager = this.towerManager;
        this.state.spatialSystem = this.spatialSystem;
        this.state.projectileManager = this.projectileManager;
        this.state.dataManager = this.dataManager;
        this.state.metaManager = this.metaManager;
        this.state.settingsManager = this.settingsManager;
        this.state.htmlUIEnabled = !!this.htmlUI;
    }

    resize(width, height) {
        this.spatialSystem = new SpatialSystem(width, height);
        this.renderer.bgCanvas.width = width;
        this.renderer.bgCanvas.height = height;
        this.renderer.bgCtx = this.renderer.bgCanvas.getContext('2d');
        this.renderer.isBgRendered = false;
        this.syncStateReferences();
        this.syncHtmlUI();
    }

    syncHtmlUI() {
        if (!this.htmlUI) return;

        const shell = this.htmlUI.shell;
        if (shell) {
            shell.classList.toggle('editor-active', !!this.state.showEditor);
            shell.classList.toggle('modal-active', !!(this.state.showTavern || this.state.showCamp || this.state.showSettings || this.state.isGameOver || this.state.isVictory));
        }

        this.renderHudHtml();
        this.renderTowerPanelHtml();
        this.renderHintHtml();
        this.renderEditorHtml();
    }

    renderHudHtml() {
        const ui = this.htmlUI;
        if (!ui.hudStats) return;

        const stats = [
            { icon: 'G', label: 'Ouro', value: this.state.money, hint: 'Ouro disponivel para contratar e posicionar defesas.' },
            { icon: 'HP', label: 'Vidas', value: this.state.lives, hint: 'Se inimigos chegarem ao fim, voce perde vidas.' },
            { icon: 'W', label: 'Onda', value: this.waveSystem.currentWave, hint: 'Onda atual da partida.' },
            { icon: 'K', label: 'Inimigos', value: `${this.waveSystem.enemiesKilled}/${this.waveSystem.enemiesToSpawn}`, hint: 'Inimigos derrotados nesta onda.' },
            { icon: 'P', label: 'Grupo', value: `${this.towerManager.placedTowers.length}/${Config.maxPartySlots}`, hint: 'Quantidade de herois posicionados.' },
            { icon: 'A', label: 'Asc', value: this.metaManager.state.currentAscension || 0, hint: 'Nivel de ascensao ativo.' },
            { icon: 'M', label: 'Mod', value: this.state.activeModifier ? this.state.activeModifier.name : 'Nenhum', hint: 'Modificador desta run.' }
        ];

        ui.hudStats.innerHTML = stats.map(stat => `
            <div class="stat-pill" data-hint="${stat.hint}">
                <span class="stat-icon">${stat.icon}</span>
                <span>${stat.label}: ${stat.value}</span>
            </div>
        `).join('');

        if (ui.pauseButton) ui.pauseButton.textContent = this.state.isPaused ? 'Retomar' : 'Pausar';
        if (ui.speedButton) ui.speedButton.textContent = `${this.state.gameSpeed}x`;
    }

    renderTowerPanelHtml() {
        const ui = this.htmlUI;
        if (!ui.towerList) return;

        const selected = this.towerManager.selectedTowerType;
        const costMultiplier = this.state.metaBonuses ? this.state.metaBonuses.costMultiplier : 1.0;
        ui.towerList.innerHTML = this.towerManager.availableTowers.map(tower => {
            const cost = Math.floor(tower.cost * costMultiplier);
            const canAfford = this.state.money >= cost;
            const hint = `${tower.type}: custo ${cost}G, dano ${tower.damage}, alcance ${tower.range}. Clique para selecionar.`;
            return `
                <button class="tower-card ${tower.type === selected ? 'active' : ''} ${canAfford ? '' : 'disabled'}"
                    data-tower-type="${tower.type}"
                    data-hint="${hint}">
                    <span class="tower-icon">${this.getTowerGlyph(tower.type)}</span>
                    <span>
                        <span class="tower-name">${tower.type}</span>
                        <span class="tower-meta">Dano ${tower.damage} | Alcance ${tower.range}</span>
                    </span>
                    <span class="tower-cost">${cost}G</span>
                </button>
            `;
        }).join('');

        ui.towerList.querySelectorAll('[data-tower-type]').forEach(button => {
            button.addEventListener('click', () => {
                this.towerManager.selectTower(button.getAttribute('data-tower-type'));
                this.syncHtmlUI();
            });
        });
    }

    getTowerGlyph(type) {
        const glyphs = {
            archer: 'A',
            ranger: 'R',
            fighter: 'F',
            wizard: 'W',
            cannon: 'C',
            cleric: '+',
            rogue: 'D',
            paladin: 'P'
        };
        return glyphs[type] || type.charAt(0).toUpperCase();
    }

    renderHintHtml() {
        const ui = this.htmlUI;
        if (!ui.hintText || !ui.startWaveButton) return;

        let text = 'Escolha uma defesa, clique no mapa para posicionar e use os controles quando a onda comecar.';
        if (this.state.isSetupPhase) {
            text = this.towerManager.placedTowers.length === 0
                ? 'Preparacao: selecione uma defesa no painel e posicione sua primeira torre antes de iniciar a onda.'
                : 'Preparacao pronta: ajuste posicionamento ou clique em Iniciar Onda quando estiver satisfeito.';
        } else if (this.waveSystem.isWaiting) {
            text = 'A onda esta prestes a comecar. Voce ainda pode clicar em Iniciar agora no centro do mapa.';
        } else if (this.state.showCamp) {
            text = 'Acampamento: recrute, equipe, treine ou avance para a proxima onda.';
        } else if (this.state.showEditor) {
            text = 'Editor: use os paineis para escolher modo, editar dados e importar/exportar JSON.';
        } else if (this.state.showTavern) {
            text = 'Taverna: gaste progresso permanente para liberar melhorias.';
        }

        ui.hintText.textContent = text;
        ui.startWaveButton.disabled = !this.state.isSetupPhase || this.towerManager.placedTowers.length === 0;
        ui.startWaveButton.style.display = this.state.showEditor || this.state.showTavern || this.state.showSettings || this.state.showCamp ? 'none' : 'inline-flex';
    }

    renderEditorHtml() {
        const ui = this.htmlUI;
        if (!ui.editorOverlay || !this.editorSystem) return;

        ui.editorOverlay.classList.toggle('active', !!this.state.showEditor);
        if (!this.state.showEditor) return;

        const editor = this.editorSystem;
        ui.editorOverlay.classList.toggle('map-mode', editor.mode === 'map');
        const tabs = [
            { label: 'Mapa', mode: 'map', hint: 'Editar caminhos e perigos do mapa.' },
            { label: 'Inimigos', mode: 'enemies', hint: 'Editar atributos de inimigos.' },
            { label: 'Magias', mode: 'spells', hint: 'Editar magias e parametros.' },
            { label: 'Ondas', mode: 'waves', hint: 'Editar crescimento e bosses.' }
        ];

        ui.editorTabs.innerHTML = tabs.map(tab => `
            <button class="editor-tab ${editor.mode === tab.mode ? 'active' : ''}" data-editor-mode="${tab.mode}" data-hint="${tab.hint}">
                ${tab.label}
            </button>
        `).join('');
        ui.editorTabs.querySelectorAll('[data-editor-mode]').forEach(button => {
            button.addEventListener('click', () => {
                editor.setMode(button.getAttribute('data-editor-mode'));
                this.syncHtmlUI();
            });
        });

        if (editor.mode === 'map') this.renderMapEditorHtml();
        else if (editor.mode === 'enemies') this.renderEntityEditorHtml('enemy');
        else if (editor.mode === 'spells') this.renderEntityEditorHtml('spell');
        else this.renderWaveEditorHtml();
    }

    renderMapEditorHtml() {
        const { editorWorkspace, editorSide } = this.htmlUI;
        const editor = this.editorSystem;
        const map = editor.draftMap;

        editorWorkspace.innerHTML = `
            <h2>Editor de Mapa</h2>
            <p class="editor-help">Clique direto no mapa para adicionar/remover pontos da ferramenta ativa. O caminho atual fica destacado no canvas.</p>
            <div class="tool-grid">
                <button class="tool-button" data-editor-action="rename-map" data-hint="Renomeia o mapa atual.">Nome: ${map.name}</button>
                <button class="tool-button" data-editor-action="new-path" data-hint="Cria um novo caminho alternativo.">Novo Caminho</button>
                <button class="tool-button ${editor.selectedTool === 'path' ? 'active' : ''}" data-editor-tool="path" data-hint="Clique no grid para adicionar/remover pontos do caminho.">Ferramenta: Caminho</button>
                <button class="tool-button ${editor.selectedTool === 'hazard' ? 'active' : ''}" data-editor-tool="hazard" data-hint="Clique no grid para adicionar/remover perigos.">Ferramenta: Perigo</button>
            </div>
        `;

        editorSide.innerHTML = `
            <h3>Mapa</h3>
            <p class="editor-help">Caminhos: ${map.paths.length}<br>Perigos: ${map.hazards.length}</p>
            <div class="tool-grid">
                ${['thick_brush', 'lava_pool', 'spike_trap', 'poison_cloud', 'slippery_ice'].map(type => `
                    <button class="tool-button ${editor.selectedHazard === type ? 'active' : ''}" data-editor-hazard="${type}">
                        ${type}
                    </button>
                `).join('')}
            </div>
            ${this.editorActionsHtml()}
        `;

        this.bindEditorCommonButtons();
    }

    renderEntityEditorHtml(kind) {
        const { editorWorkspace, editorSide } = this.htmlUI;
        const editor = this.editorSystem;
        const isEnemy = kind === 'enemy';
        const data = isEnemy ? editor.draftEnemies : editor.draftSpells;
        const selectedKey = isEnemy ? editor.selectedEnemyKey : editor.selectedSpellKey;
        const keys = Object.keys(data);
        const fields = isEnemy
            ? [
                { label: 'Nome', key: 'name' },
                { label: 'HP', key: 'hp', type: 'number' },
                { label: 'AC', key: 'ac', type: 'number' },
                { label: 'Velocidade', key: 'speed', type: 'number' },
                { label: 'XP', key: 'xp', type: 'number' },
                { label: 'Ouro', key: 'gold', type: 'number' }
            ]
            : [
                { label: 'Nome', key: 'name' },
                { label: 'Dano', key: 'damage', type: 'number' },
                { label: 'Raio', key: 'radius', type: 'number' },
                { label: 'Cooldown', key: 'cooldown', type: 'number' },
                { label: 'Cast Time', key: 'castTime', type: 'number' },
                { label: 'Tipo', key: 'type' },
                { label: 'Dano Tipo', key: 'damageType' }
            ];
        const selected = selectedKey ? data[selectedKey] : null;

        editorWorkspace.innerHTML = `
            <h2>Editor de ${isEnemy ? 'Inimigos' : 'Magias'}</h2>
            <p class="editor-help">Selecione um registro e clique em um campo para editar. Alteracoes ficam no draft ate exportar.</p>
            <div class="editor-list">
                <button data-editor-create="${kind}" data-hint="Cria um novo registro no draft.">+ Novo ${isEnemy ? 'Inimigo' : 'Magia'}</button>
                ${keys.map(key => `
                    <button class="${selectedKey === key ? 'active' : ''}" data-editor-select-${kind}="${key}">
                        ${key}
                    </button>
                `).join('')}
            </div>
        `;

        editorSide.innerHTML = `
            <h3>${selectedKey || 'Nada selecionado'}</h3>
            <p class="editor-help">${selected ? 'Clique em qualquer campo para alterar.' : 'Selecione um item na lista.'}</p>
            <div class="field-grid">
                ${selected ? fields.map(field => `
                    <button class="field-button" data-editor-field-kind="${kind}" data-editor-field="${field.key}" data-editor-field-type="${field.type || 'text'}">
                        <strong>${field.label}</strong>
                        <span>${selected[field.key] ?? ''}</span>
                    </button>
                `).join('') : ''}
            </div>
            ${this.editorActionsHtml()}
        `;

        this.bindEditorCommonButtons();
    }

    renderWaveEditorHtml() {
        const { editorWorkspace, editorSide } = this.htmlUI;
        const editor = this.editorSystem;
        const wave = editor.draftWaves;
        const bossKeys = Object.keys(wave.bossWaves);

        editorWorkspace.innerHTML = `
            <h2>Editor de Ondas</h2>
            <p class="editor-help">Ajuste a quantidade base de inimigos e os encontros especiais.</p>
            <div class="field-grid">
                <button class="field-button" data-editor-wave-field="initialEnemies" data-editor-field-type="number"><strong>Inimigos Iniciais</strong><span>${wave.initialEnemies}</span></button>
                <button class="field-button" data-editor-wave-field="increasePerWave" data-editor-field-type="number"><strong>Aumento por Onda</strong><span>${wave.increasePerWave}</span></button>
            </div>
        `;

        editorSide.innerHTML = `
            <h3>Bosses</h3>
            <p class="editor-help">Clique para editar o boss de uma onda ou adicione outro encontro.</p>
            <div class="field-grid">
                ${bossKeys.map(key => `
                    <button class="field-button" data-editor-boss-wave="${key}"><strong>Onda ${key}</strong><span>${wave.bossWaves[key]}</span></button>
                `).join('')}
                <button class="tool-button" data-editor-action="add-boss-wave">+ Adicionar Onda de Boss</button>
            </div>
            ${this.editorActionsHtml()}
        `;

        this.bindEditorCommonButtons();
    }

    editorActionsHtml() {
        return `
            <div class="editor-actions">
                <button class="ui-button" data-editor-action="import">Importar JSON</button>
                <button class="ui-button" data-editor-action="export">Exportar JSON</button>
                <button class="ui-button danger" data-editor-action="exit">Sair</button>
            </div>
        `;
    }

    bindEditorCommonButtons() {
        const root = this.htmlUI.editorOverlay;
        root.querySelectorAll('[data-editor-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-editor-action');
                if (action === 'rename-map') this.editorSystem.promptRenameMap();
                else if (action === 'new-path') this.editorSystem.addPath();
                else if (action === 'add-boss-wave') this.editorSystem.addBossWave();
                else this.editorSystem.handleAction(action);
                this.syncHtmlUI();
            });
        });
        root.querySelectorAll('[data-editor-tool]').forEach(button => {
            button.addEventListener('click', () => {
                this.editorSystem.setTool(button.getAttribute('data-editor-tool'));
                this.syncHtmlUI();
            });
        });
        root.querySelectorAll('[data-editor-hazard]').forEach(button => {
            button.addEventListener('click', () => {
                this.editorSystem.selectedHazard = button.getAttribute('data-editor-hazard');
                this.syncHtmlUI();
            });
        });
        root.querySelectorAll('[data-editor-select-enemy]').forEach(button => {
            button.addEventListener('click', () => {
                this.editorSystem.selectedEnemyKey = button.getAttribute('data-editor-select-enemy');
                this.syncHtmlUI();
            });
        });
        root.querySelectorAll('[data-editor-select-spell]').forEach(button => {
            button.addEventListener('click', () => {
                this.editorSystem.selectedSpellKey = button.getAttribute('data-editor-select-spell');
                this.syncHtmlUI();
            });
        });
        root.querySelectorAll('[data-editor-create]').forEach(button => {
            button.addEventListener('click', () => {
                this.editorSystem.createRecord(button.getAttribute('data-editor-create'));
                this.syncHtmlUI();
            });
        });
        root.querySelectorAll('[data-editor-field]').forEach(button => {
            button.addEventListener('click', () => {
                this.editorSystem.editField(
                    button.getAttribute('data-editor-field-kind'),
                    button.getAttribute('data-editor-field'),
                    button.getAttribute('data-editor-field-type')
                );
                this.syncHtmlUI();
            });
        });
        root.querySelectorAll('[data-editor-wave-field]').forEach(button => {
            button.addEventListener('click', () => {
                this.editorSystem.editWaveField(
                    button.getAttribute('data-editor-wave-field'),
                    button.getAttribute('data-editor-field-type')
                );
                this.syncHtmlUI();
            });
        });
        root.querySelectorAll('[data-editor-boss-wave]').forEach(button => {
            button.addEventListener('click', () => {
                this.editorSystem.editBossWave(button.getAttribute('data-editor-boss-wave'));
                this.syncHtmlUI();
            });
        });
    }

    async init() {
        console.log('Inicializando sistemas de dados...');

        // Localização e Configurações
        await this.localeManager.init(this.dataManager);
        this.audio.updateVolumes(this.settingsManager.state);

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
            await this.dataManager.loadJSON('items', 'src/game/data/items.json');
            await this.dataManager.loadJSON('maps', 'src/game/data/maps.json');
            await this.dataManager.loadJSON('modifiers', 'src/game/data/modifiers.json');

            // Atualiza managers que dependem do Config
            this.waveSystem.reset();
            this.towerManager.reset(this.metaManager);
            // Carrega dados de meta-progressão
            await this.dataManager.loadJSON('meta', 'src/game/data/meta.json');

            this.stateStore.reset();
            this.state = this.stateStore.state;
            this.syncStateReferences();
            // Aplica bônus de meta-progressão ao estado inicial
            this.applyMetaBonuses(true);
            this.updateCurrentMap();
            this.generateBlacksmithPool();
        }

        return true;
    }

    updateCurrentMap() {
        const maps = this.dataManager.get('maps');
        if (!maps) return;

        const mapKeys = Object.keys(maps);
        // Muda de mapa a cada 5 ondas
        const mapIndex = Math.min(mapKeys.length - 1, Math.floor((this.waveSystem.currentWave - 1) / 5));
        const mapKey = mapKeys[mapIndex];
        const mapData = maps[mapKey];

        if (this.state.currentMap && this.state.currentMap.id === mapData.id) return;

        this.state.currentMap = mapData;
        // Pega o primeiro caminho como padrão para o Config (compatibilidade)
        Config.path = mapData.paths[0];

        // Se houver renderer, reseta o fundo
        if (this.renderer) {
            this.renderer.isBgRendered = false;
        }

        console.log(`Mapa atualizado para: ${mapData.name}`);
    }

    handleKeyDown(e) {
        if (this.inputSystem.isActionTriggered(e, 'pause')) {
            e.preventDefault();
            this.togglePause();
        }
        if (this.inputSystem.isActionTriggered(e, 'speed')) {
            e.preventDefault();
            this.toggleSpeed();
        }
    }

    handleMouseMove(x, y) {
        this.state.mouseX = x;
        this.state.mouseY = y;
    }

    handleClick(clickX, clickY) {
        if (this.state.showSettings) {
            this.handleSettingsClick(clickX, clickY);
            return;
        }

        if (this.state.showCamp) {
            this.handleCampClick(clickX, clickY);
            this.syncHtmlUI();
            return;
        }

        if (this.state.isMovingTower) {
            this.handleMoveTowerClick(clickX, clickY);
            return;
        }

        if (this.state.showTavern) {
            this.handleTavernClick(clickX, clickY);
            return;
        }

        if (this.state.isGameOver || this.state.isVictory) {
            const layout = this.ui.getEndGameLayout(this.canvas, this.state.isVictory);
            if (clickX >= layout.restartButton.x && clickX <= layout.restartButton.x + layout.restartButton.width &&
                clickY >= layout.restartButton.y && clickY <= layout.restartButton.y + layout.restartButton.height) {
                this.restart();
            }
            if (this.state.isVictory && layout.continueButton) {
                if (clickX >= layout.continueButton.x && clickX <= layout.continueButton.x + layout.continueButton.width &&
                    clickY >= layout.continueButton.y && clickY <= layout.continueButton.y + layout.continueButton.height) {
                    this.state.isVictory = false;
                    this.state.gameRunning = true;
                    this.state.endlessConfirmed = true;
                    this.state.showCamp = true;
                    this.towerManager.generateRecruitmentPool(this.dataManager);
                    this.generateBlacksmithPool();
                }
            }
            return;
        }

        if (this.state.showEditor) {
            this.handleEditorClick(clickX, clickY);
            return;
        }

        if (!this.state.gameRunning && !this.state.isSetupPhase) return;

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

        if (this.state.isPlacingRecruit) {
            const x = Math.floor(clickX / Config.gridSize);
            const y = Math.floor(clickY / Config.gridSize);
            if (this.canPlaceTower(x, y)) {
                this.placeRecruitedTower(x, y);
                this.state.isPlacingRecruit = false;
                this.state.showCamp = true;
            }
            return;
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

        if (!this.state.htmlUIEnabled && this.handleControlsClick(clickX, clickY)) return;

        // Se estiver pausado, não permite outras interações no canvas (exceto controles)
        if (this.state.isPaused) return;

        // Verifica clique no painel lateral
        const panelX = this.canvas.width - this.ui.panelWidth;
        if (!this.state.htmlUIEnabled && clickX >= panelX) {
            this.handlePanelClick(clickY);
            return;
        }

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
            this.syncHtmlUI();
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
        const layout = this.ui.getControlButtonsLayout(this.canvas, this.state, this.localeManager);

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
            if (this.state.isHardcore) {
                this.state.lives = 1;
            } else {
                this.state.lives += bonuses.extraLives;
            }
        }

        this.state.metaBonuses = bonuses;
    }

    handleCampClick(clickX, clickY) {
        const layout = this.ui.getCampLayout(this.canvas, this.state, this.dataManager, this.localeManager);

        // Próxima Onda
        if (clickX >= layout.nextWaveButton.x && clickX <= layout.nextWaveButton.x + layout.nextWaveButton.width &&
            clickY >= layout.nextWaveButton.y && clickY <= layout.nextWaveButton.y + layout.nextWaveButton.height) {
            this.state.showCamp = false;
            this.state.isSetupPhase = true;
            this.state.gameRunning = false;
            this.waveSystem.isWaiting = false;
            this.waveSystem.countdown = 0;
            return;
        }

        // Tabs
        layout.tabs.forEach(tab => {
            if (clickX >= tab.x && clickX <= tab.x + tab.width &&
                clickY >= tab.y && clickY <= tab.y + tab.height) {
                this.state.campTab = tab.id;
            }
        });

        // Buttons
        layout.buttons.forEach(btn => {
            if (clickX >= btn.x && clickX <= btn.x + btn.width &&
                clickY >= btn.y && clickY <= btn.y + btn.height) {

                if (btn.type === 'recruit' && btn.canAfford) {
                    if (this.towerManager.placedTowers.length < Config.maxPartySlots) {
                        this.state.money -= btn.cost;
                        this.state.pendingRecruit = btn.hero;
                        this.state.showCamp = false;
                        this.state.isPlacingRecruit = true;
                    } else {
                        this.floatingTexts.add(this.canvas.width / 2, this.canvas.height / 2, 'LIMITE DE GRUPO ATINGIDO!', Config.THEME.colors.bloodRed);
                    }
                } else if (btn.type === 'heal_all' && btn.canAfford) {
                    this.state.money -= btn.cost;
                    this.towerManager.placedTowers.forEach(t => t.health = t.maxHealth);
                    this.audio.playWaveStart();
                } else if (btn.type === 'move_hero') {
                    this.state.showCamp = false;
                    this.state.isMovingTower = true;
                    this.state.towerToMove = btn.tower;
                } else if (btn.type === 'buy_item_pool' && btn.canAfford) {
                    const item = btn.item;
                    let slot = item.category;
                    if (slot === 'weapons') slot = 'weapon';
                    if (slot === 'armor') slot = 'armor';
                    if (slot === 'accessory') slot = 'accessory';
                    if (slot === 'ring') slot = this.towerManager.placedTowers.some(t => t.equipment.ring1 === null) ? 'ring1' : 'ring2';
                    if (slot === 'amulet') slot = 'amulet';

                    const targetHero = this.towerManager.placedTowers.find(t => t.equipment[slot] === null);
                    if (targetHero) {
                        this.state.money -= btn.cost;
                        targetHero.equipment[slot] = item;
                        this.state.blacksmithPool = this.state.blacksmithPool.filter(i => i !== item);
                        this.floatingTexts.add(targetHero.x * Config.gridSize + 20, targetHero.y * Config.gridSize, `${item.name} EQUIPADO!`, Config.THEME.colors.gold);
                    } else {
                        this.floatingTexts.add(this.canvas.width / 2, this.canvas.height / 2, 'SEM ESPAÇO NO SLOT!', Config.THEME.colors.bloodRed);
                    }
                } else if (btn.type === 'buy_xp' && btn.canAfford) {
                    this.state.money -= btn.cost;
                    btn.tower.addXp(btn.xp);
                    this.floatingTexts.add(btn.tower.x * Config.gridSize + 20, btn.tower.y * Config.gridSize, `+${btn.xp} XP`, '#3498db');
                } else if (btn.type === 'upgrade_spell_slots' && btn.canAfford) {
                    this.state.money -= btn.cost;
                    btn.tower.maxSpellSlots = (btn.tower.maxSpellSlots || 1) + 1;
                    btn.tower.spellSlots = btn.tower.maxSpellSlots;
                    this.floatingTexts.add(btn.tower.x * Config.gridSize + 20, btn.tower.y * Config.gridSize, '+1 SLOT DE MAGIA', '#9b59b6');
                }
            }
        });
    }

    handleMoveTowerClick(clickX, clickY) {
        const x = Math.floor(clickX / Config.gridSize);
        const y = Math.floor(clickY / Config.gridSize);

        if (this.canPlaceMovedTower(x, y)) {
            const tower = this.state.towerToMove;
            tower.x = x;
            tower.y = y;
            tower.calculatePositioning(Config.path);
            this.partySystem.update(this.towerManager.placedTowers);

            this.state.isMovingTower = false;
            this.state.towerToMove = null;
            this.state.showCamp = true;
        }
    }

    canPlaceMovedTower(x, y) {
        if (x * Config.gridSize >= this.canvas.width - this.ui.panelWidth) return false;
        if (y * Config.gridSize < this.ui.hudHeight) return false;

        for (let point of Config.path) {
            if (point.x === x && point.y === y) return false;
        }

        const existing = this.towerManager.getTowerAt(x, y);
        if (existing && existing !== this.state.towerToMove) return false;

        return true;
    }

    async openEditor() {
        this.state.showEditor = true;
        if (!this.editorSystem) {
            const module = await import('../systems/EditorSystem.js');
            this.editorSystem = new module.EditorSystem(this);
            this.state.editorSystem = this.editorSystem;
        }
        this.gameLoopController.start();
        this.syncHtmlUI();
    }

    handleEditorClick(clickX, clickY) {
        if (this.editorSystem) {
            this.editorSystem.handleClick(clickX, clickY);
        }
    }

    handleTavernClick(clickX, clickY) {
        const metaData = this.dataManager.get('meta');
        const layout = this.ui.getTavernLayout(this.canvas, metaData, this.metaManager, this.localeManager);

        // Voltar
        if (clickX >= layout.backButton.x && clickX <= layout.backButton.x + layout.backButton.width &&
            clickY >= layout.backButton.y && clickY <= layout.backButton.y + layout.backButton.height) {
            this.state.showTavern = false;
            if (!this.state.gameRunning) {
                // If we came from the start screen, go back there
                if (this.htmlCallbacks?.showStartScreen) {
                    this.htmlCallbacks.showStartScreen();
                } else {
                    this.canvas.style.display = 'none';
                    document.getElementById('startScreen').style.display = 'block';
                }
                this.gameLoopController.stop();
            }
            this.syncHtmlUI();
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

                    if (btn.type === 'export_save') {
                        const json = SaveSystem.exportSave();
                        navigator.clipboard.writeText(json).then(() => {
                            alert('Save copiado para a área de transferência!');
                        });
                    } else if (btn.type === 'import_save') {
                        const json = prompt('Cole aqui o seu código de save:');
                        if (json && SaveSystem.importSave(json)) {
                            alert('Save importado com sucesso! Recarregando...');
                            location.reload();
                        } else if (json) {
                            alert('Erro ao importar save. Verifique se o código está correto.');
                        }
                    } else if (btn.type === 'delete_run') {
                        if (confirm('Deseja realmente apagar o progresso da run atual?')) {
                            SaveSystem.clearRun();
                            alert('Run apagada. Recarregando...');
                            location.reload();
                        }
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

    handleSettingsClick(clickX, clickY) {
        const layout = this.ui.getSettingsLayout(this.canvas, this.settingsManager.state, this.localeManager);

        // Language toggle
        if (clickX >= layout.language.x && clickX <= layout.language.x + layout.language.width &&
            clickY >= layout.language.y && clickY <= layout.language.y + layout.language.height) {
            const nextLang = this.settingsManager.state.language === 'pt-BR' ? 'en-US' : 'pt-BR';
            this.settingsManager.state.language = nextLang;
            this.localeManager.setLocale(nextLang);
            this.settingsManager.save();

            // Sync HTML buttons
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                el.textContent = this.localeManager.t(key);
            });
            return;
        }

        // Volume sliders
        layout.volumes.forEach(vol => {
            if (clickX >= vol.x && clickX <= vol.x + vol.width &&
                clickY >= vol.y && clickY <= vol.y + vol.height) {
                const newValue = (clickX - vol.x) / vol.width;
                this.settingsManager.setVolume(vol.id, newValue);
                this.audio.updateVolumes(this.settingsManager.state);
            }
        });

        // Keybinds
        if (clickX >= layout.keybinds.x && clickX <= layout.keybinds.x + layout.keybinds.width &&
            clickY >= layout.keybinds.y && clickY <= layout.keybinds.y + layout.keybinds.height) {
            const action = prompt('Qual ação deseja redefinir? (pause, speed)');
            if (action && this.settingsManager.state.keybinds[action]) {
                const newCode = prompt('Digite o código da tecla (ex: KeyP, Space, ShiftLeft):');
                if (newCode) {
                    this.settingsManager.setKeybind(action, newCode);
                }
            }
            return;
        }

        // Back
        if (clickX >= layout.backButton.x && clickX <= layout.backButton.x + layout.backButton.width &&
            clickY >= layout.backButton.y && clickY <= layout.backButton.y + layout.backButton.height) {
            this.state.showSettings = false;
            if (!this.state.gameRunning && !this.state.isSetupPhase) {
                if (this.htmlCallbacks?.showStartScreen) {
                    this.htmlCallbacks.showStartScreen();
                } else {
                    this.canvas.style.display = 'none';
                    document.getElementById('startScreen').style.display = 'block';
                }
                this.gameLoopController.stop();
            }
            this.syncHtmlUI();
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
        const costMultiplier = this.state.metaBonuses ? this.state.metaBonuses.costMultiplier : 1.0;
        const actualCost = Math.floor(selectedTower.cost * costMultiplier);

        if (this.state.money < actualCost) return false;

        // Limite de Party Slots
        if (this.towerManager.placedTowers.length >= Config.maxPartySlots) return false;
        
        // Verifica se clicou fora da área de jogo (painel lateral)
        if (!this.state.htmlUIEnabled && x * Config.gridSize >= this.canvas.width - this.ui.panelWidth) return false;
        if (!this.state.htmlUIEnabled && y * Config.gridSize < this.ui.hudHeight) return false;

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

        const tower = this.towerManager.addTower(x, y, selectedTower.type, randomRaceKey, raceData, this.state.activeModifier);

        // Aplica bônus de meta-progressão se existirem
        if (this.state.metaBonuses) {
            tower.metaCritBonus = this.state.metaBonuses.critThresholdBonus;
        }

        this.state.money -= actualCost;
        this.syncHtmlUI();
    }

    generateBlacksmithPool() {
        const itemData = this.dataManager.get('items');
        if (!itemData) return;

        const pool = [];
        const categories = ['weapons', 'armor', 'accessory', 'ring', 'amulet'];

        for (let i = 0; i < 4; i++) {
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const items = itemData[cat];
            const itemKeys = Object.keys(items);
            const randomItemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            const baseItem = { ...items[randomItemKey], category: cat };

            // Determine Rarity
            const roll = Math.random();
            let rarityKey = 'common';
            if (roll > 0.95) rarityKey = 'legendary';
            else if (roll > 0.8) rarityKey = 'epic';
            else if (roll > 0.5) rarityKey = 'rare';

            const rarity = itemData.rarities[rarityKey];
            const item = { ...baseItem, rarity: rarityKey, rarityData: rarity };

            // Apply Rarity Multipliers
            if (item.damage) item.damage = Math.floor(item.damage * rarity.multiplier);
            if (item.ac) item.ac = Math.floor(item.ac * rarity.multiplier);
            if (item.attackBonus) item.attackBonus = Math.floor(item.attackBonus * rarity.multiplier);
            item.cost = Math.floor(item.cost * rarity.multiplier);

            // Add Affixes
            const numAffixes = rarity.affixes;
            const availableAffixes = [...itemData.affixes];
            for (let j = 0; j < numAffixes; j++) {
                if (availableAffixes.length === 0) break;
                const affixIndex = Math.floor(Math.random() * availableAffixes.length);
                const affix = availableAffixes.splice(affixIndex, 1)[0];

                item.name += ` ${affix.name}`;
                if (affix.damage) item.damage = (item.damage || 0) + affix.damage;
                if (affix.ac) item.ac = (item.ac || 0) + affix.ac;
                if (affix.attackBonus) item.attackBonus = (item.attackBonus || 0) + affix.attackBonus;
                if (affix.critBonus) item.critBonus = (item.critBonus || 0) + affix.critBonus;
                if (affix.spellPower) item.spellPower = (item.spellPower || 0) + affix.spellPower;
                if (affix.spellSlots) item.spellSlots = (item.spellSlots || 0) + affix.spellSlots;
            }

            pool.push(item);
        }

        this.state.blacksmithPool = pool;
    }

    placeRecruitedTower(x, y) {
        const hero = this.state.pendingRecruit;
        const tower = this.towerManager.addTower(x, y, hero.type, hero.race, hero.raceData, this.state.activeModifier);

        // Remove from pool
        this.towerManager.recruitmentPool = this.towerManager.recruitmentPool.filter(h => h !== hero);
        this.state.pendingRecruit = null;

        if (this.state.metaBonuses) {
            tower.metaCritBonus = this.state.metaBonuses.critThresholdBonus;
        }
    }

    prepareNewRun(options = {}) {
        this.towerManager.reset(this.metaManager);
        this.waveSystem.reset();
        this.stateStore.reset();
        this.state = this.stateStore.state;
        this.syncStateReferences();
        this.state.isHardcore = !!options.hardcore;
        this.metaManager.state.currentAscension = options.ascension || 0;
        this.applyMetaBonuses(true);
        this.updateCurrentMap();
        this.generateBlacksmithPool();
        this.state.isSetupPhase = true;
        this.state.gameRunning = false;
        this.state.activeModifier = null;
        this.particleSystem.particles = [];
        this.floatingTexts.texts = [];
        this.gameLoopController.start();
        this.syncHtmlUI();
    }

    startPreparedWave() {
        if (!this.state.isSetupPhase || this.towerManager.placedTowers.length === 0) return;
        this.state.isSetupPhase = false;
        this.start();
    }

    start() {
        console.log('Game iniciado');
        this.audio.resume();
        this.state.gameRunning = true;
        this.state.isSetupPhase = false;

        // Pick random modifier ONLY if not already set (e.g. from a continue or load)
        if (!this.state.activeModifier) {
            const modifiers = this.dataManager.get('modifiers');
            if (modifiers) {
                const keys = Object.keys(modifiers);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                this.state.activeModifier = modifiers[randomKey];
                console.log(`Active Modifier: ${this.state.activeModifier.name}`);
            }
        }

        this.waveSystem.startCountdown();

        this.gameLoopController.start();
        this.syncHtmlUI();
    }

    stop() {
        this.state.gameRunning = false;
        this.waveSystem.endWave(this.state);
    }

    loadAndStart() {
        const runData = SaveSystem.loadRun();
        if (!runData) {
            this.start();
            return;
        }

        console.log('Loading saved run...', runData);

        // Reset systems first
        this.towerManager.reset(this.metaManager);
        this.waveSystem.reset();
        this.stateStore.reset();
        this.state = this.stateStore.state;
        this.syncStateReferences();
        // Restore Run Data
        this.state.money = runData.money;
        this.state.lives = runData.lives;
        this.waveSystem.currentWave = runData.currentWave;
        this.waveSystem.enemiesKilled = runData.enemiesKilled || 0;
        this.state.activeModifier = runData.activeModifier || null;
        this.state.isHardcore = runData.isHardcore || false;
        if (this.metaManager && runData.ascension !== undefined) {
            this.metaManager.state.currentAscension = runData.ascension;
        }

        // Restore Map
        const maps = this.dataManager.get('maps');
        if (maps && runData.currentMapId) {
            const mapData = Object.values(maps).find(m => m.id === runData.currentMapId);
            if (mapData) {
                this.state.currentMap = mapData;
                Config.path = mapData.paths[0];
            }
        }
        if (this.renderer) this.renderer.isBgRendered = false;

        // Restore Towers
        const races = this.dataManager.get('races');
        runData.towers.forEach(tData => {
            const raceData = races ? races[tData.race] : null;
            const tower = this.towerManager.addTower(tData.x, tData.y, tData.type, tData.race, raceData, this.state.activeModifier);
            tower.hydrate(tData, this.state.activeModifier);
        });

        this.applyMetaBonuses(false);
        this.partySystem.update(this.towerManager.placedTowers);

        // Resume in Camp Hub; the player explicitly starts the next wave.
        this.state.showCamp = true;
        this.state.gameRunning = false;
        this.state.isSetupPhase = false;
        this.towerManager.generateRecruitmentPool(this.dataManager);
        this.generateBlacksmithPool();
        this.gameLoopController.start();
        this.syncHtmlUI();
    }

    restart() {
        SaveSystem.clearRun();
        this.towerManager.reset(this.metaManager);
        this.waveSystem.reset();
        this.stateStore.reset();
        this.state = this.stateStore.state;
        this.syncStateReferences();
        this.applyMetaBonuses(true);

        this.particleSystem.particles = [];
        this.floatingTexts.texts = [];
        this.start();
    }

    updateLogic(timeStep) {
        this.inputSystem.update();
        if (this.state.isSetupPhase) return;
        if (this.state.showCamp || this.state.showSettings || this.state.showTavern || this.state.showEditor) return;
        if (!this.state.gameRunning || this.state.isPaused || this.state.isGameOver || this.state.isVictory) return;

        // Hit Stop Logic
        if (this.state.isHitStop) {
            this.state.hitStopTimer--;
            if (this.state.hitStopTimer <= 0) {
                this.state.isHitStop = false;
            }
            return; // Skip logic update during hit stop
        }

        this.state.logicalTime += timeStep;

        // Atualiza o sistema espacial
        this.spatialSystem.update(this.state.enemies);

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
                    // result is now handled within Tower.shoot which calls projectileManager.get()
                    // or it could be returned. In our plan, we'll make Tower.shoot use the manager.
                    // If Tower.update returns a projectile, we should ensure it's from the pool.
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
                CombatSystem.applyDamage(p, this.state, this.floatingTexts, this.particleSystem, this.dataManager, this.spatialSystem);
                this.projectileManager.release(p);
                this.state.projectiles.splice(i, 1);
            }
        }

        // Atualiza inimigos
        for (let enemy of this.state.enemies) {
            enemy.update(this.state);
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
        if (this.waveSystem.currentWave > Config.maxWaves && !this.state.endlessConfirmed) {
            this.state.isVictory = true;
            this.state.gameRunning = false;
            this.audio.playVictory();
            this.stateStore.updateHighscore(this.waveSystem.currentWave - 1);

            // Handle Ascension unlocking
            const meta = this.metaManager;
            if (meta.state.currentAscension === meta.state.maxAscension) {
                meta.state.maxAscension++;
                meta.save();
            }
        }

        // Verifica derrota
        if (this.state.lives <= 0) {
            this.state.lives = 0; // Garante que não fique negativo
            this.state.isGameOver = true;
            this.state.gameRunning = false;
            this.audio.playGameOver();
            this.stateStore.updateHighscore(this.waveSystem.currentWave - 1);
            this.syncHtmlUI();
        }

        // Atualiza o gerenciador de ondas se o jogo ainda estiver rodando
        if (this.state.gameRunning) {
            const waveBefore = this.waveSystem.currentWave;
            const waveResult = this.waveSystem.update(this.state, this.dataManager);

            if (waveResult && waveResult.type === 'wave_complete') {
                this.floatingTexts.add(this.canvas.width / 2, this.canvas.height / 2, `+${waveResult.reward} G`, Config.THEME.colors.gold);

                // Autosave
                SaveSystem.saveRun(this);

                // Atualiza mapa se necessário
                this.updateCurrentMap();

                // Enter Camp Mode
                this.state.showCamp = true;
                this.state.gameRunning = false;
                this.state.isSetupPhase = false;
                this.waveSystem.isWaiting = false;
                this.waveSystem.countdown = 0;
                this.towerManager.generateRecruitmentPool(this.dataManager);
                this.generateBlacksmithPool();

                // Ganha Arcane Shards baseado na onda
                const shardsGained = Math.max(1, Math.floor(waveResult.wave / 2));
                if (shardsGained > 0) {
                    this.metaManager.addShards(shardsGained);
                    this.floatingTexts.add(this.canvas.width / 2, this.canvas.height / 2 + 30, `+${shardsGained} ✨`, '#9b59b6');
                }
                this.syncHtmlUI();
            }

            if (this.state.gameRunning && this.waveSystem.currentWave > waveBefore && this.waveSystem.currentWave <= Config.maxWaves) {
                this.audio.playWaveStart();
            }
        }
    }
}

import { Config } from '../core/Config.js';

export class EditorSystem {
    constructor(game) {
        this.game = game;
        this.mode = 'map'; // map, enemies, spells, waves
        this.selectedTool = 'path'; // path, hazard, theme
        this.selectedHazard = 'thick_brush';
        this.selectedEnemyKey = null;
        this.selectedSpellKey = null;
        this.draftMap = null;
        this.draftEnemies = {};
        this.draftSpells = {};
        this.draftWaves = {};

        this.initDrafts();
    }

    initDrafts() {
        const dm = this.game.dataManager;

        // Map Draft
        const maps = dm.get('maps') || {};
        const firstMap = Object.values(maps)[0];
        this.draftMap = JSON.parse(JSON.stringify(firstMap || {
            id: 'new_map',
            name: 'Novo Mapa',
            theme: Config.THEME.colors,
            paths: [[{"x": 0, "y": 7}, {"x": 19, "y": 7}]],
            hazards: []
        }));

        // Enemies Draft
        const enemies = dm.get('enemies') || {};
        this.draftEnemies = JSON.parse(JSON.stringify(enemies));

        // Spells Draft
        const spells = dm.get('spells') || {};
        this.draftSpells = JSON.parse(JSON.stringify(spells));

        // Waves Draft (Mock or from config if available)
        this.draftWaves = {
            initialEnemies: Config.initialEnemiesPerWave,
            increasePerWave: Config.waveEnemyIncrease,
            bossWaves: Config.bossWaves || {}
        };
    }

    handleClick(x, y) {
        const ui = this.game.ui;
        const layout = ui.getEditorLayout(this.game.canvas, this);

        // Sidebar Tabs
        for (const tab of layout.tabs) {
            if (x >= tab.x && x <= tab.x + tab.width && y >= tab.y && y <= tab.y + tab.height) {
                this.mode = tab.mode;
                this.game.state.editorMode = tab.mode;
                return;
            }
        }

        // Action Buttons (Export/Import/Exit)
        for (const btn of layout.actions) {
            if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
                this.handleAction(btn.action);
                return;
            }
        }

        // Mode-specific clicks
        if (this.mode === 'map') {
            this.handleMapClick(x, y, layout);
        } else if (this.mode === 'enemies') {
            this.handleEnemyClick(x, y, layout);
        } else if (this.mode === 'spells') {
            this.handleSpellClick(x, y, layout);
        } else if (this.mode === 'waves') {
            this.handleWaveClick(x, y, layout);
        }
    }

    handleAction(action) {
        if (action === 'exit') {
            this.game.state.showEditor = false;
            this.game.gameLoopController.stop();
            this.game.canvas.style.display = 'none';
            document.getElementById('startScreen').style.display = 'block';
        } else if (action === 'export') {
            const data = this.getDataToExport();
            const json = JSON.stringify(data, null, 2);

            // Try to use clipboard as fallback
            navigator.clipboard.writeText(json).then(() => {
                alert(`${this.mode.toUpperCase()} exportado para o clipboard!`);
            }).catch(err => {
                prompt('Copie o JSON abaixo:', json);
            });

            // Standard download trigger
            try {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `editor_${this.mode}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (e) {}
        } else if (action === 'import') {
            const json = prompt(`Cole o JSON para importar (${this.mode}):`);
            if (json) {
                try {
                    const data = JSON.parse(json);
                    this.importData(data);
                    alert('Importado com sucesso!');
                    this.game.renderer.isBgRendered = false;
                } catch (e) {
                    alert('Erro ao processar JSON: ' + e.message);
                }
            }
        }
    }

    importData(data) {
        if (this.mode === 'map') this.draftMap = data;
        else if (this.mode === 'enemies') this.draftEnemies = data;
        else if (this.mode === 'spells') this.draftSpells = data;
        else if (this.mode === 'waves') this.draftWaves = data;
    }

    getDataToExport() {
        if (this.mode === 'map') return this.draftMap;
        if (this.mode === 'enemies') return this.draftEnemies;
        if (this.mode === 'spells') return this.draftSpells;
        if (this.mode === 'waves') return this.draftWaves;
        return {};
    }

    handleMapClick(x, y, layout) {
        const gridSize = Config.gridSize;
        const sidebarX = this.game.canvas.width - 200;
        const hudHeight = this.game.ui.hudHeight;

        // Interactive Toolbar for Map Editor
        if (x >= 20 && x <= 150 && y >= hudHeight + 100 && y <= hudHeight + 130) {
            const newName = prompt('Nome do mapa:', this.draftMap.name);
            if (newName) this.draftMap.name = newName;
            return;
        }

        if (x >= 20 && x <= 150 && y >= hudHeight + 140 && y <= hudHeight + 170) {
            this.draftMap.paths.push([{"x": 0, "y": 0}, {"x": 19, "y": 14}]);
            this.game.renderer.isBgRendered = false;
            return;
        }

        // Tool selection
        if (x >= 20 && x <= 150 && y >= hudHeight + 180 && y <= hudHeight + 210) {
            this.selectedTool = 'path';
            return;
        }
        if (x >= 20 && x <= 150 && y >= hudHeight + 220 && y <= hudHeight + 250) {
            this.selectedTool = 'hazard';
            return;
        }
        if (x >= 20 && x <= 150 && y >= hudHeight + 260 && y <= hudHeight + 290) {
            const h = prompt('Tipo de perigo (thick_brush, lava_pool, spike_trap, poison_cloud, slippery_ice):', this.selectedHazard);
            if (h) this.selectedHazard = h;
            return;
        }

        if (x < sidebarX && y > hudHeight) {
            const gx = Math.floor(x / gridSize);
            const gy = Math.floor(y / gridSize);

            if (this.selectedTool === 'path') {
                const path = this.draftMap.paths[this.draftMap.paths.length - 1];
                const existingIndex = path.findIndex(p => p.x === gx && p.y === gy);

                if (existingIndex !== -1) {
                    if (path.length > 2) path.splice(existingIndex, 1);
                } else {
                    path.push({ x: gx, y: gy });
                }
            } else if (this.selectedTool === 'hazard') {
                const existingIndex = this.draftMap.hazards.findIndex(h => h.x === gx && h.y === gy);
                if (existingIndex !== -1) {
                    this.draftMap.hazards.splice(existingIndex, 1);
                } else {
                    this.draftMap.hazards.push({
                        x: gx,
                        y: gy,
                        type: this.selectedHazard,
                        effect: this.getEffectForHazard(this.selectedHazard),
                        value: 0.5
                    });
                }
            }

            // Re-render background if it was cached
            this.game.renderer.isBgRendered = false;
        }
    }

    getEffectForHazard(type) {
        const effects = {
            thick_brush: 'slow',
            lava_pool: 'burn',
            spike_trap: 'damage',
            poison_cloud: 'poison',
            slippery_ice: 'speed_boost'
        };
        return effects[type] || 'slow';
    }

    handleEnemyClick(x, y, layout) {
        const hudHeight = this.game.ui.hudHeight;
        const keys = Object.keys(this.draftEnemies);

        // List Sidebar for Enemies
        for (let i = 0; i < keys.length; i++) {
            const bx = 20;
            const by = hudHeight + 100 + i * 35;
            const bw = 150;
            const bh = 30;

            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
                this.selectedEnemyKey = keys[i];
                return;
            }
        }

        if (this.selectedEnemyKey) {
            const enemy = this.draftEnemies[this.selectedEnemyKey];
            const fields = [
                { label: 'Nome', key: 'name' },
                { label: 'HP', key: 'hp', type: 'number' },
                { label: 'AC', key: 'ac', type: 'number' },
                { label: 'Velocidade', key: 'speed', type: 'number' },
                { label: 'XP', key: 'xp', type: 'number' },
                { label: 'Ouro', key: 'gold', type: 'number' }
            ];

            for (let i = 0; i < fields.length; i++) {
                const f = fields[i];
                const fx = 200;
                const fy = hudHeight + 100 + i * 45;
                const fw = 300;
                const fh = 40;

                if (x >= fx && x <= fx + fw && y >= fy && y <= fy + fh) {
                    const newVal = prompt(`${f.label}:`, enemy[f.key]);
                    if (newVal !== null) {
                        enemy[f.key] = f.type === 'number' ? parseFloat(newVal) : newVal;
                    }
                    return;
                }
            }
        }

        // Add New Enemy Button
        if (x >= 20 && x <= 150 && y >= hudHeight + 60 && y <= hudHeight + 90) {
            const key = prompt('Chave do novo inimigo:');
            if (key && !this.draftEnemies[key]) {
                this.draftEnemies[key] = { name: 'Novo Inimigo', hp: 50, ac: 10, speed: 1.0, xp: 50, gold: 10 };
                this.selectedEnemyKey = key;
            }
        }
    }

    handleSpellClick(x, y, layout) {
        const hudHeight = this.game.ui.hudHeight;
        const keys = Object.keys(this.draftSpells);

        // List Sidebar for Spells
        for (let i = 0; i < keys.length; i++) {
            const bx = 20;
            const by = hudHeight + 100 + i * 35;
            const bw = 150;
            const bh = 30;

            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
                this.selectedSpellKey = keys[i];
                return;
            }
        }

        if (this.selectedSpellKey) {
            const spell = this.draftSpells[this.selectedSpellKey];
            const fields = [
                { label: 'Nome', key: 'name' },
                { label: 'Dano', key: 'damage', type: 'number' },
                { label: 'Raio', key: 'radius', type: 'number' },
                { label: 'Cooldown', key: 'cooldown', type: 'number' },
                { label: 'Cast Time', key: 'castTime', type: 'number' },
                { label: 'Tipo', key: 'type' },
                { label: 'Dano Tipo', key: 'damageType' }
            ];

            for (let i = 0; i < fields.length; i++) {
                const f = fields[i];
                const fx = 200;
                const fy = hudHeight + 100 + i * 45;
                const fw = 300;
                const fh = 40;

                if (x >= fx && x <= fx + fw && y >= fy && y <= fy + fh) {
                    const newVal = prompt(`${f.label}:`, spell[f.key]);
                    if (newVal !== null) {
                        spell[f.key] = f.type === 'number' ? parseFloat(newVal) : newVal;
                    }
                    return;
                }
            }
        }

        // Add New Spell Button
        if (x >= 20 && x <= 150 && y >= hudHeight + 60 && y <= hudHeight + 90) {
            const key = prompt('Chave da nova magia:');
            if (key && !this.draftSpells[key]) {
                this.draftSpells[key] = { name: 'Nova Magia', damage: 20, radius: 50, cooldown: 5000, castTime: 1000, type: 'aoe', damageType: 'fire' };
                this.selectedSpellKey = key;
            }
        }
    }

    handleWaveClick(x, y, layout) {
        const hudHeight = this.game.ui.hudHeight;
        const wave = this.draftWaves;

        const fields = [
            { label: 'Inimigos Iniciais', key: 'initialEnemies', type: 'number' },
            { label: 'Aumento por Onda', key: 'increasePerWave', type: 'number' }
        ];

        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            const fx = 200;
            const fy = hudHeight + 100 + i * 45;
            const fw = 300;
            const fh = 40;

            if (x >= fx && x <= fx + fw && y >= fy && y <= fy + fh) {
                const newVal = prompt(`${f.label}:`, wave[f.key]);
                if (newVal !== null) {
                    wave[f.key] = f.type === 'number' ? parseFloat(newVal) : newVal;
                }
                return;
            }
        }

        // Edit Boss Waves
        const bossKeys = Object.keys(wave.bossWaves);
        for (let i = 0; i < bossKeys.length; i++) {
            const fx = 200;
            const fy = hudHeight + 250 + i * 45;
            const fw = 300;
            const fh = 40;

            if (x >= fx && x <= fx + fw && y >= fy && y <= fy + fh) {
                const newBoss = prompt(`Boss da Onda ${bossKeys[i]}:`, wave.bossWaves[bossKeys[i]]);
                if (newBoss !== null) wave.bossWaves[bossKeys[i]] = newBoss;
                return;
            }
        }

        // Add Boss Wave Button
        if (x >= 200 && x <= 500 && y >= hudHeight + 250 + bossKeys.length * 45 && y <= hudHeight + 290 + bossKeys.length * 45) {
            const waveNum = prompt('Número da onda para o boss:');
            if (waveNum) {
                wave.bossWaves[waveNum] = 'boss_1';
            }
        }
    }
}

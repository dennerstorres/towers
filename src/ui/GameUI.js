import { Config } from '../game/core/Config.js';

export class GameUI {
    constructor() {
        this.hudHeight = 60;
        this.panelWidth = 100;
    }

    /**
     * Retorna os dados formatados para exibição no HUD
     */
    getHUDData(gameState, waveManager) {
        return [
            {
                icon: 'gold',
                value: gameState.money,
                color: Config.THEME.colors.gold
            },
            {
                icon: 'heart',
                value: gameState.lives,
                color: Config.THEME.colors.bloodRed
            },
            {
                icon: 'wave',
                value: `Onda ${waveManager.currentWave}`,
                color: Config.THEME.colors.gold
            },
            {
                icon: 'enemy',
                value: `${waveManager.enemiesToSpawn - waveManager.enemiesKilled}/${waveManager.enemiesToSpawn}`,
                color: '#ecf0f1'
            },
            {
                icon: 'party',
                value: `${gameState.towerManager.placedTowers.length}/${Config.maxPartySlots}`,
                color: '#3498db'
            }
        ];
    }

    /**
     * Retorna os dados para o painel de seleção de torres
     */
    getTowerSelectionData(towerManager) {
        return towerManager.availableTowers.map(tower => ({
            ...tower,
            isSelected: tower.type === towerManager.selectedTowerType
        }));
    }

    /**
     * Retorna o layout dos botões do menu de contexto de uma torre
     */
    getTowerMenuLayout(tower) {
        const x = tower.x * Config.gridSize;
        const y = tower.y * Config.gridSize;
        const buttonWidth = 110;
        const buttonHeight = 44;
        const spacing = 5;

        // Verifica se há espaço acima (considerando o HUD)
        const totalHeight = (buttonHeight * 2) + spacing;
        const canFitAbove = (y - totalHeight) > this.hudHeight;

        let targetY, sellY;

        if (canFitAbove) {
            // Posiciona acima
            targetY = y - totalHeight;
            sellY = y - buttonHeight;
        } else {
            // Posiciona abaixo da torre
            sellY = y + Config.gridSize + spacing;
            targetY = sellY + buttonHeight;
        }

        return {
            target: {
                x: x + Config.gridSize / 2 - buttonWidth / 2,
                y: targetY,
                width: buttonWidth,
                height: buttonHeight,
                label: 'Alvo: '
            },
            sell: {
                x: x + Config.gridSize / 2 - buttonWidth / 2,
                y: sellY,
                width: buttonWidth,
                height: buttonHeight,
                label: 'Vender'
            }
        };
    }

    /**
     * Retorna o layout para os botões de controle (Pausa e Velocidade)
     */
    getControlButtonsLayout(canvas) {
        const padding = 10;
        const buttonWidth = 90;
        const buttonHeight = 44;
        const panelX = canvas.width - this.panelWidth;

        return {
            pause: {
                x: panelX - (buttonWidth * 2) - (padding * 2),
                y: (this.hudHeight - buttonHeight) / 2,
                width: buttonWidth,
                height: buttonHeight,
                label: 'Pausar'
            },
            speed: {
                x: panelX - buttonWidth - padding,
                y: (this.hudHeight - buttonHeight) / 2,
                width: buttonWidth,
                height: buttonHeight,
                label: '1x'
            }
        };
    }

    /**
     * Retorna o layout para o anúncio de onda e countdown
     */
    getWaveCountdownLayout(canvas) {
        const width = 300;
        const height = 150;
        const buttonWidth = 160;
        const buttonHeight = 44;

        return {
            container: {
                x: (canvas.width - this.panelWidth) / 2 - width / 2,
                y: canvas.height / 2 - height / 2,
                width: width,
                height: height
            },
            button: {
                x: (canvas.width - this.panelWidth) / 2 - buttonWidth / 2,
                y: canvas.height / 2 + 20,
                width: buttonWidth,
                height: buttonHeight,
                label: 'Iniciar agora'
            }
        };
    }

    /**
     * Retorna os dados das estatísticas finais para a tela de fim de jogo
     */
    getEndGameStats(gameState, waveManager) {
        return [
            { label: 'Ondas Sobrevividas:', value: waveManager.currentWave - 1 },
            { label: 'Inimigos Derrotados:', value: waveManager.enemiesKilled },
            { label: 'Seu Recorde:', value: `${gameState.highscore} Ondas`, color: Config.THEME.colors.gold }
        ];
    }

    /**
     * Retorna o layout para o modal de Level Up
     */
    getLevelUpModalLayout(canvas) {
        const width = 500;
        const height = 350;
        const x = (canvas.width - this.panelWidth) / 2 - width / 2;
        const y = canvas.height / 2 - height / 2;

        const buttonWidth = 400;
        const buttonHeight = 60;
        const spacing = 20;

        return {
            modal: { x, y, width, height },
            options: [
                {
                    x: x + (width - buttonWidth) / 2,
                    y: y + 80,
                    width: buttonWidth,
                    height: buttonHeight,
                    type: 'attribute'
                },
                {
                    x: x + (width - buttonWidth) / 2,
                    y: y + 80 + buttonHeight + spacing,
                    width: buttonWidth,
                    height: buttonHeight,
                    type: 'feat'
                },
                {
                    x: x + (width - buttonWidth) / 2,
                    y: y + 80 + (buttonHeight + spacing) * 2,
                    width: buttonWidth,
                    height: buttonHeight,
                    type: 'stat'
                }
            ]
        };
    }

    /**
     * Retorna o layout para a Taverna (Meta Progressão)
     */
    getTavernLayout(canvas, metaData, metaManager) {
        const width = 650;
        const height = 500;
        const x = (canvas.width - this.panelWidth) / 2 - width / 2;
        const y = canvas.height / 2 - height / 2;

        const category = window.game?.state?.tavernCategory || 'upgrades';
        const tabs = [
            { label: 'Upgrades', category: 'upgrades' },
            { label: 'Unlocks', category: 'unlocks' },
            { label: 'Talents', category: 'talents' },
            { label: 'Research', category: 'research' },
            { label: 'Relics', category: 'relics' }
        ];

        const tabWidth = 120;
        const tabHeight = 35;
        const tabsX = x + (width - (tabWidth * tabs.length)) / 2;
        const tabsY = y + 80;

        const formattedTabs = tabs.map((t, i) => ({
            ...t,
            x: tabsX + i * tabWidth,
            y: tabsY,
            width: tabWidth,
            height: tabHeight,
            isActive: t.category === category
        }));

        const upgradeButtons = [];
        const buttonWidth = 550;
        const buttonHeight = 65;
        const spacing = 10;
        const contentY = tabsY + tabHeight + 20;

        if (metaData) {
            if (category === 'upgrades' && metaData.upgrades) {
                Object.keys(metaData.upgrades).forEach((key, i) => {
                    const upgrade = metaData.upgrades[key];
                    const level = metaManager.getUpgradeLevel(key);
                    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
                    upgradeButtons.push({
                        type: 'upgrade', key, name: upgrade.name, description: upgrade.description,
                        level, maxLevel: upgrade.maxLevel, cost,
                        canAfford: metaManager.state.arcaneShards >= cost,
                        isMaxed: level >= upgrade.maxLevel,
                        x: x + (width - buttonWidth) / 2, y: contentY + i * (buttonHeight + spacing), width: buttonWidth, height: buttonHeight
                    });
                });
            } else if (category === 'unlocks' && metaData.classUnlocks) {
                Object.keys(metaData.classUnlocks).forEach((key, i) => {
                    const unlock = metaData.classUnlocks[key];
                    const isUnlocked = metaManager.state.unlockedClasses.includes(key);
                    upgradeButtons.push({
                        type: 'unlock', key, name: unlock.name, description: unlock.description,
                        cost: unlock.cost, isUnlocked,
                        canAfford: metaManager.state.arcaneShards >= unlock.cost,
                        x: x + (width - buttonWidth) / 2, y: contentY + i * (buttonHeight + spacing), width: buttonWidth, height: buttonHeight
                    });
                });
            } else if (category === 'talents' && metaData.talents) {
                Object.keys(metaData.talents).forEach((key, i) => {
                    const talent = metaData.talents[key];
                    const isOwned = metaManager.state.talents.includes(key);
                    const hasPrereqs = !talent.requires || talent.requires.every(req => metaManager.state.talents.includes(req));
                    upgradeButtons.push({
                        type: 'talent', key, name: talent.name, description: talent.description,
                        cost: talent.cost, isOwned, hasPrereqs, requires: talent.requires,
                        canAfford: metaManager.state.arcaneShards >= talent.cost,
                        x: x + (width - buttonWidth) / 2, y: contentY + i * (buttonHeight + spacing), width: buttonWidth, height: buttonHeight
                    });
                });
            } else if (category === 'research' && metaData.research) {
                Object.keys(metaData.research).forEach((key, i) => {
                    const res = metaData.research[key];
                    const level = metaManager.getResearchLevel(key);
                    const cost = Math.floor(res.baseCost * Math.pow(res.costMultiplier, level));
                    upgradeButtons.push({
                        type: 'research', key, name: res.name, description: res.description,
                        level, maxLevel: res.maxLevel, cost,
                        canAfford: metaManager.state.arcaneShards >= cost,
                        isMaxed: level >= res.maxLevel,
                        x: x + (width - buttonWidth) / 2, y: contentY + i * (buttonHeight + spacing), width: buttonWidth, height: buttonHeight
                    });
                });
            } else if (category === 'relics' && metaData.relics) {
                Object.keys(metaData.relics).forEach((key, i) => {
                    const relic = metaData.relics[key];
                    const isOwned = metaManager.state.relics.includes(key);
                    upgradeButtons.push({
                        type: 'relic', key, name: relic.name, description: relic.description,
                        cost: relic.cost, isOwned,
                        canAfford: metaManager.state.arcaneShards >= relic.cost,
                        x: x + (width - buttonWidth) / 2, y: contentY + i * (buttonHeight + spacing), width: buttonWidth, height: buttonHeight
                    });
                });
            }
        }

        return {
            modal: { x, y, width, height },
            tabs: formattedTabs,
            upgradeButtons,
            backButton: {
                x: x + width / 2 - 100,
                y: y + height - 55,
                width: 200,
                height: 40,
                label: 'Voltar'
            }
        };
    }

    /**
     * Retorna o layout para as telas de vitória e derrota
     */
    getEndGameLayout(canvas) {
        const width = 400;
        const height = 300;
        const buttonWidth = 200;
        const buttonHeight = 50;

        return {
            modal: {
                x: canvas.width / 2 - width / 2,
                y: canvas.height / 2 - height / 2,
                width: width,
                height: height
            },
            restartButton: {
                x: canvas.width / 2 - buttonWidth / 2,
                y: canvas.height / 2 + 50,
                width: buttonWidth,
                height: buttonHeight,
                label: 'Jogar Novamente'
            }
        };
    }
}

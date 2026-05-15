import { Config } from '../game/core/Config.js';

export class GameUI {
    constructor() {
        this.hudHeight = 50;
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
        const buttonWidth = 100;
        const buttonHeight = 30;
        const spacing = 5;

        // Posiciona o menu acima da torre
        return {
            upgrade: {
                x: x + Config.gridSize / 2 - buttonWidth / 2,
                y: y - buttonHeight * 2 - spacing,
                width: buttonWidth,
                height: buttonHeight,
                label: 'Upgrade'
            },
            sell: {
                x: x + Config.gridSize / 2 - buttonWidth / 2,
                y: y - buttonHeight,
                width: buttonWidth,
                height: buttonHeight,
                label: 'Vender'
            }
        };
    }
}

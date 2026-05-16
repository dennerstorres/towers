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

    /**
     * Retorna o layout para os botões de controle (Pausa e Velocidade)
     */
    getControlButtonsLayout(canvas) {
        const padding = 10;
        const buttonWidth = 80;
        const buttonHeight = 30;
        const panelX = canvas.width - this.panelWidth;

        return {
            pause: {
                x: panelX - (buttonWidth * 2) - (padding * 2),
                y: padding,
                width: buttonWidth,
                height: buttonHeight,
                label: 'Pausar'
            },
            speed: {
                x: panelX - buttonWidth - padding,
                y: padding,
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
        const buttonHeight = 40;

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

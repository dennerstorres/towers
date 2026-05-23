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

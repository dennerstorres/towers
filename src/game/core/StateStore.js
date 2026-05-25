import { Config } from './Config.js';

export class StateStore {
    constructor(metaManager = null) {
        this.metaManager = metaManager;
        this.state = this.getInitialState();
    }

    getInitialState() {
        const metaBonuses = this.metaManager ? this.metaManager.getBonuses() : {};
        return {
            enemies: [],
            projectiles: [],
            money: Config.initialMoney + (metaBonuses.starting_gold || 0),
            lives: Config.initialLives + (metaBonuses.extra_lives || 0),
            gameRunning: false,
            isGameOver: false,
            isVictory: false,
            towerManager: null, // Will be set by Game
            selectedPlacedTower: null,
            mouseX: 0,
            mouseY: 0,
            isPaused: false,
            gameSpeed: 1,
            logicalTime: 0,
            highscore: parseInt(localStorage.getItem('towers_highscore')) || 0
        };
    }

    reset() {
        const initialState = this.getInitialState();
        // Preserve some properties like highscore and towerManager reference
        const towerManager = this.state.towerManager;
        const highscore = this.state.highscore;

        this.state = {
            ...initialState,
            towerManager,
            highscore
        };
    }

    updateHighscore(wavesSurvived) {
        if (wavesSurvived > this.state.highscore) {
            this.state.highscore = wavesSurvived;
            localStorage.setItem('towers_highscore', wavesSurvived);
        }
    }
}

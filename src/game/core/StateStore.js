import { Config } from './Config.js';

export class StateStore {
    constructor() {
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            enemies: [],
            projectiles: [],
            money: Config.initialMoney,
            lives: Config.initialLives,
            gameRunning: false,
            isSetupPhase: false,
            isGameOver: false,
            isVictory: false,
            towerManager: null, // Will be set by Game
            selectedPlacedTower: null,
            mouseX: 0,
            mouseY: 0,
            isPaused: false,
            gameSpeed: 1,
            logicalTime: 0,
            highscore: parseInt(localStorage.getItem('towers_highscore')) || 0,
            showTavern: false,
            tavernCategory: 'upgrades',
            showCamp: false,
            campTab: 'recruit',
            showEditor: false,
            editorMode: 'map',
            editorSystem: null,
            isHardcore: false,
            endlessConfirmed: false,
            activeModifier: null
        };
    }

    reset() {
        const initialState = this.getInitialState();
        // Preserve some properties
        const towerManager = this.state.towerManager;
        const dataManager = this.state.dataManager;
        const metaManager = this.state.metaManager;
        const highscore = this.state.highscore;

        this.state = {
            ...initialState,
            towerManager,
            dataManager,
            metaManager,
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

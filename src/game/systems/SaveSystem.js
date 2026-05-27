export class SaveSystem {
    static SAVE_VERSION = '1.0';
    static RUN_STORAGE_KEY = 'towers_current_run';
    static META_STORAGE_KEY = 'towers_meta_progression';

    /**
     * Saves the current game state (current run)
     */
    static saveRun(game) {
        const state = game.state;
        const waveSystem = game.waveSystem;

        const saveData = {
            version: this.SAVE_VERSION,
            timestamp: Date.now(),
            runData: {
                money: state.money,
                lives: state.lives,
                currentWave: waveSystem.currentWave,
                currentMapId: state.currentMap?.id,
                enemiesKilled: waveSystem.enemiesKilled,
                activeModifier: state.activeModifier,
                isHardcore: state.isHardcore,
                ascension: state.metaManager?.state.currentAscension || 0,
                towers: state.towerManager.placedTowers.map(tower => tower.serialize())
            }
        };

        localStorage.setItem(this.RUN_STORAGE_KEY, JSON.stringify(saveData));
        console.log('Run autosaved.');
    }

    /**
     * Loads the current game state
     */
    static loadRun() {
        const saved = localStorage.getItem(this.RUN_STORAGE_KEY);
        if (!saved) return null;

        try {
            const data = JSON.parse(saved);
            // Basic version check
            if (data.version !== this.SAVE_VERSION) {
                console.warn('Save version mismatch. Attempting to load anyway...');
            }
            return data.runData;
        } catch (e) {
            console.error('Failed to load run:', e);
            return null;
        }
    }

    /**
     * Clears the current run save
     */
    static clearRun() {
        localStorage.removeItem(this.RUN_STORAGE_KEY);
    }

    /**
     * Exports all save data (Run + Meta) to a JSON string
     */
    static exportSave() {
        const runData = localStorage.getItem(this.RUN_STORAGE_KEY);
        const metaData = localStorage.getItem(this.META_STORAGE_KEY);

        const fullExport = {
            version: this.SAVE_VERSION,
            run: runData ? JSON.parse(runData) : null,
            meta: metaData ? JSON.parse(metaData) : null
        };

        return JSON.stringify(fullExport);
    }

    /**
     * Imports save data from a JSON string
     */
    static importSave(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.run) localStorage.setItem(this.RUN_STORAGE_KEY, JSON.stringify(data.run));
            if (data.meta) localStorage.setItem(this.META_STORAGE_KEY, JSON.stringify(data.meta));
            return true;
        } catch (e) {
            console.error('Failed to import save:', e);
            return false;
        }
    }
}

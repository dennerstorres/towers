import { Config } from '../core/Config.js';
import { Tower } from '../entities/Tower.js';

export class TowerManager {
    constructor() {
        this.reset();
    }

    reset(metaManager = null) {
        this.selectedTowerType = 'archer';

        // Filter available towers based on meta progression
        const allTowers = Object.values(Config.TOWERS);
        if (metaManager && metaManager.state.unlockedClasses) {
            this.availableTowers = allTowers.filter(t =>
                metaManager.state.unlockedClasses.includes(t.type)
            );
        } else {
            this.availableTowers = allTowers;
        }

        this.placedTowers = [];
    }

    addTower(x, y, type, race = 'human', raceData = null) {
        const tower = new Tower(x, y, type, race, raceData);
        this.placedTowers.push(tower);
        return tower;
    }

    removeTower(tower) {
        this.placedTowers = this.placedTowers.filter(t => t !== tower);
    }

    getTowerAt(x, y) {
        return this.placedTowers.find(t => t.x === x && t.y === y);
    }

    selectTower(type) {
        if (Config.TOWERS[type.toUpperCase()]) {
            this.selectedTowerType = type;
        }
    }

    getSelectedTower() {
        return Config.TOWERS[this.selectedTowerType.toUpperCase()];
    }
}

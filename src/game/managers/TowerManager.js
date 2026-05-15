import { Config } from '../core/Config.js';

export class TowerManager {
    constructor() {
        this.selectedTowerType = 'archer';
        this.availableTowers = Object.values(Config.TOWERS);
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

import { Config } from '../core/Config.js';

import { Tower } from '../entities/Tower.js';

export class TowerManager {
    constructor() {
        this.selectedTowerType = 'archer';
        this.availableTowers = Object.values(Config.TOWERS);
        this.placedTowers = [];
    }

    addTower(x, y, type) {
        const tower = new Tower(x, y, type);
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

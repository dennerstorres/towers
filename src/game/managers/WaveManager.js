import { Config } from '../core/Config.js';
import { Enemy } from '../entities/Enemy.js';

export class WaveManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentWave = Config.initialWave;
        this.enemiesToSpawn = Config.initialEnemiesPerWave;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        if (this.enemySpawnInterval) {
            clearInterval(this.enemySpawnInterval);
            this.enemySpawnInterval = null;
        }
    }

    startWave(gameState) {
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        
        this.enemySpawnInterval = setInterval(() => {
            if (this.enemiesSpawned < this.enemiesToSpawn && gameState.enemies.length < 10) {
                const types = ['goblin', 'goblin', 'orc', 'scout'];
                const randomType = types[Math.floor(Math.random() * types.length)];
                gameState.enemies.push(new Enemy(randomType));
                this.enemiesSpawned++;
            }
        }, 2000);
    }

    endWave(gameState) {
        clearInterval(this.enemySpawnInterval);
        this.currentWave++;
        this.enemiesToSpawn = Config.initialEnemiesPerWave + (this.currentWave - 1) * Config.waveEnemyIncrease;
        gameState.money += Config.waveMoneyReward + (this.currentWave - 1) * Config.waveMoneyIncrease;

        if (this.currentWave % 3 === 0) {
            Enemy.prototype.speed += Config.enemySpeedIncrease;
        }
    }

    update(gameState) {
        if (this.enemiesKilled >= this.enemiesToSpawn && gameState.enemies.length === 0) {
            this.endWave(gameState);
            this.startWave(gameState);
        }
    }
} 
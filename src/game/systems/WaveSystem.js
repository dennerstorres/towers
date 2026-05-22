import { Config } from '../core/Config.js';
import { Enemy } from '../entities/Enemy.js';

export class WaveSystem {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentWave = Config.initialWave;
        this.enemiesToSpawn = Config.initialEnemiesPerWave;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 120; // Aproximadamente 2 segundos a 60fps
        this.isWaiting = false;
        this.countdown = 0;
    }

    startWave(gameState) {
        // Reset per-wave traits
        if (gameState && gameState.towerManager) {
            for (let tower of gameState.towerManager.placedTowers) {
                if (typeof tower.resetForNewWave === 'function') {
                    tower.resetForNewWave();
                }
            }
        }

        this.isWaiting = false;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
    }

    startCountdown() {
        this.isWaiting = true;
        this.countdown = Config.waveCountdown * 60; // 5 segundos a 60fps
    }

    skipCountdown() {
        if (this.isWaiting) {
            this.countdown = 0;
        }
    }

    spawnEnemy(gameState, dataManager = null) {
        const types = ['goblin', 'goblin', 'orc', 'scout'];
        const randomType = types[Math.floor(Math.random() * types.length)];

        let enemyData = null;
        if (dataManager) {
            const allEnemies = dataManager.get('enemies');
            if (allEnemies && allEnemies[randomType]) {
                enemyData = allEnemies[randomType];
            }
        }

        gameState.enemies.push(new Enemy(randomType, enemyData));
        this.enemiesSpawned++;
    }

    endWave(gameState) {
        const reward = Config.waveMoneyReward + (this.currentWave - 1) * Config.waveMoneyIncrease;
        gameState.money += reward;
        this.currentWave++;
        this.enemiesToSpawn = Config.initialEnemiesPerWave + (this.currentWave - 1) * Config.waveEnemyIncrease;

        if (this.currentWave % 3 === 0) {
            Enemy.prototype.speed += Config.enemySpeedIncrease;
        }

        return reward;
    }

    update(gameState, dataManager = null) {
        if (this.isWaiting) {
            this.countdown--;
            if (this.countdown <= 0) {
                this.startWave(gameState);
            }
            return null;
        }

        // Lógica de spawn baseada em frames
        if (this.enemiesSpawned < this.enemiesToSpawn) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                if (gameState.enemies.length < 10) {
                    this.spawnEnemy(gameState, dataManager);
                    this.spawnTimer = 0;
                }
            }
        }

        // Verifica fim da onda
        if (this.enemiesKilled >= this.enemiesToSpawn && gameState.enemies.length === 0) {
            const reward = this.endWave(gameState);
            if (this.currentWave <= Config.maxWaves) {
                this.startCountdown();
            }
            return { type: 'wave_complete', reward };
        }

        return null;
    }
}

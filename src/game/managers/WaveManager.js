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
        this.spawnTimer = 0;
        this.spawnInterval = 120; // Aproximadamente 2 segundos a 60fps
    }

    startWave(gameState) {
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
    }

    spawnEnemy(gameState) {
        const types = ['goblin', 'goblin', 'orc', 'scout'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        gameState.enemies.push(new Enemy(randomType));
        this.enemiesSpawned++;
    }

    endWave(gameState) {
        this.currentWave++;
        this.enemiesToSpawn = Config.initialEnemiesPerWave + (this.currentWave - 1) * Config.waveEnemyIncrease;
        gameState.money += Config.waveMoneyReward + (this.currentWave - 1) * Config.waveMoneyIncrease;

        if (this.currentWave % 3 === 0) {
            Enemy.prototype.speed += Config.enemySpeedIncrease;
        }
    }

    update(gameState) {
        // Lógica de spawn baseada em frames
        if (this.enemiesSpawned < this.enemiesToSpawn) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                if (gameState.enemies.length < 10) {
                    this.spawnEnemy(gameState);
                    this.spawnTimer = 0;
                }
            }
        }

        // Verifica fim da onda
        if (this.enemiesKilled >= this.enemiesToSpawn && gameState.enemies.length === 0) {
            this.endWave(gameState);
            this.startWave(gameState);
        }
    }
}

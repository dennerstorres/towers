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

        // Meta progression rewards
        if (gameState.metaManager) {
            // Gold persistent based on wave
            const persistentGold = Math.floor(reward / 2);
            gameState.metaManager.addGold(persistentGold);

            // Shards on milestones
            if (this.currentWave % 2 === 0) {
                const shards = Math.max(1, Math.floor(this.currentWave / 2));
                gameState.metaManager.addShards(shards);
            }

            // Relic drop chance on boss waves (every 5 waves)
            if (this.currentWave % 5 === 0) {
                const relicChance = 0.2; // 20%
                if (Math.random() < relicChance) {
                    const metaData = gameState.dataManager ? gameState.dataManager.get('meta') : null;
                    if (metaData && metaData.relics) {
                        const relicKeys = Object.keys(metaData.relics);
                        const unownedRelics = relicKeys.filter(k => !gameState.metaManager.state.relics.includes(k));
                        if (unownedRelics.length > 0) {
                            const randomRelic = unownedRelics[Math.floor(Math.random() * unownedRelics.length)];
                            gameState.metaManager.state.relics.push(randomRelic);
                            gameState.metaManager.save();
                            console.log(`Relic dropped: ${randomRelic}`);
                        }
                    }
                }
            }
        }

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
            const completedWave = this.currentWave;
            const reward = this.endWave(gameState);
            if (this.currentWave <= Config.maxWaves) {
                this.startCountdown();
            }
            return { type: 'wave_complete', reward, wave: completedWave };
        }

        return null;
    }
}

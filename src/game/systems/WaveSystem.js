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
        let type;

        // Boss Spawning Logic (Data-driven)
        const bossWaves = Config.bossWaves || {};
        if (bossWaves[this.currentWave]) {
            type = bossWaves[this.currentWave];
        } else {
            const types = ['goblin', 'goblin', 'orc', 'scout'];
            type = types[Math.floor(Math.random() * types.length)];
        }

        let enemyData = null;
        if (dataManager) {
            const allEnemies = dataManager.get('enemies');
            if (allEnemies && allEnemies[type]) {
                // Clone to avoid modifying original data
                enemyData = { ...allEnemies[type] };

                // Apply Scaling and Ascension
                const scaling = this.getDifficultyScaling(gameState);
                enemyData.hp = Math.floor(enemyData.hp * scaling.hp);
                enemyData.ac = (enemyData.ac || 10) + scaling.ac;
                enemyData.speed = (enemyData.speed || 1.0) * scaling.speed;
                enemyData.xp = Math.floor(enemyData.xp * scaling.rewards);
                enemyData.gold = Math.floor(enemyData.gold * scaling.rewards);
            }
        }

        // Seleciona um caminho aleatório do mapa atual se disponível
        let path = Config.path;
        const currentMap = gameState?.currentMap;
        if (currentMap && currentMap.paths && currentMap.paths.length > 0) {
            const pathIndex = Math.floor(Math.random() * currentMap.paths.length);
            path = currentMap.paths[pathIndex];
        }

        gameState.enemies.push(new Enemy(type, enemyData, path));
        this.enemiesSpawned++;
    }

    getDifficultyScaling(gameState) {
        const wave = this.currentWave;
        const isEndless = wave > Config.maxWaves;
        const ascension = gameState?.metaManager?.state?.currentAscension || 0;

        let hpMult = 1.0;
        let acBonus = 0;
        let speedMult = 1.0;
        let rewardMult = 1.0;

        // Ascension Scaling (FASE 17)
        hpMult += ascension * 0.2; // +20% HP per Ascension
        acBonus += Math.floor(ascension / 2);
        speedMult += ascension * 0.05;

        // Endless Scaling (FASE 17)
        if (isEndless) {
            const endlessWaves = wave - Config.maxWaves;
            hpMult *= Math.pow(1.15, endlessWaves); // +15% HP per endless wave
            acBonus += Math.floor(endlessWaves / 3);
            speedMult *= Math.pow(1.02, endlessWaves);
            rewardMult *= Math.pow(1.1, endlessWaves);
        }

        return { hp: hpMult, ac: acBonus, speed: speedMult, rewards: rewardMult };
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
                        }
                    }
                }
            }
        }

        this.currentWave++;

        // Endless wave generation
        if (this.currentWave > Config.maxWaves) {
            this.enemiesToSpawn = Math.floor(Config.initialEnemiesPerWave + (Config.maxWaves - 1) * Config.waveEnemyIncrease + (this.currentWave - Config.maxWaves) * 2);
        } else {
            this.enemiesToSpawn = Config.initialEnemiesPerWave + (this.currentWave - 1) * Config.waveEnemyIncrease;
        }

        if (this.currentWave % 3 === 0 && this.currentWave <= Config.maxWaves) {
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
        const bossWaves = Config.bossWaves || {};
        const isBossWave = !!bossWaves[this.currentWave];
        const maxEnemies = isBossWave ? 1 : this.enemiesToSpawn;

        if (this.enemiesSpawned < maxEnemies) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                if (gameState.enemies.length < 10) {
                    this.spawnEnemy(gameState, dataManager);
                    this.spawnTimer = 0;
                }
            }
        }

        // Verifica fim da onda
        const targetKills = isBossWave ? 1 : this.enemiesToSpawn;
        if (this.enemiesSpawned >= targetKills && gameState.enemies.length === 0) {
            const completedWave = this.currentWave;
            const reward = this.endWave(gameState);
            return { type: 'wave_complete', reward, wave: completedWave };
        }

        return null;
    }
}

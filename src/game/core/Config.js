export const Config = {
    gridSize: 40,
    path: [], // Agora carregado via mapas (compatibilidade — primeiro caminho)
    // Set de células "x,y" bloqueadas pelo caminho (todos os caminhos do mapa).
    // Pré-calculado ao carregar o mapa para validação barata de placement.
    pathCells: null,
    // Folga em células ao redor do caminho considerada bloqueada (0 = exato).
    pathBlockMargin: 0,
    initialMoney: 100,
    initialLives: 10,
    UPGRADE_MULTIPLIER: 1.5,
    SELL_REFUND_PERCENTAGE: 0.7,
    initialWave: 1,
    initialEnemiesPerWave: 5,
    maxWaves: 10,
    waveCountdown: 5,
    TOWERS: {
        ARCHER: {
            type: 'archer',
            cost: 40,
            range: 150,
            damage: 15,
            cooldown: 800,
            projectileSpeed: 8
        },
        CANNON: {
            type: 'cannon',
            cost: 80,
            range: 120,
            damage: 45,
            cooldown: 2000,
            projectileSpeed: 5
        },
        WIZARD: {
            type: 'wizard',
            cost: 120,
            range: 180,
            damage: 25,
            cooldown: 1500,
            projectileSpeed: 4,
            splashRadius: 60
        }
    },
    particleCount: 10,
    enemyHealth: 110,
    enemySpeed: 1.6,
    enemySpeedIncrease: 0.6,
    waveEnemyIncrease: 4,
    waveMoneyReward: 40,
    waveMoneyIncrease: 8,
    THEME: {
        colors: {
            stone: '#7f8c8d',
            darkStone: '#2c3e50',
            gold: '#f1c40f',
            bloodRed: '#c0392b',
            archer: '#2ecc71',
            cannon: '#e67e22',
            wizard: '#9b59b6',
            wizardSplash: 'rgba(155, 89, 182, 0.3)',
            grass: '#27ae60',
            grassDark: '#229958',
            dirt: '#8d6e63',
            path: '#95a5a6',
            pathEdge: '#7f8c8d',
            grid: 'rgba(0, 0, 0, 0.05)',
            text: '#2c3e50'
        },
        font: "'MedievalSharp', cursive, serif"
    },

    /**
     * Carrega dados externos para o objeto Config
     * @param {Object} data Dados vindos do JSON
     */
    load(data) {
        if (!data) return;

        const isObject = (item) => (item && typeof item === 'object' && !Array.isArray(item));

        const mergeDeep = (target, source) => {
            if (isObject(target) && isObject(source)) {
                Object.keys(source).forEach(key => {
                    if (isObject(source[key])) {
                        if (!target[key]) Object.assign(target, { [key]: {} });
                        mergeDeep(target[key], source[key]);
                    } else {
                        Object.assign(target, { [key]: source[key] });
                    }
                });
            }
        };

        mergeDeep(this, data);
    }
};

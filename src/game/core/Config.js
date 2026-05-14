export const Config = {
    gridSize: 40,
    path: [
        {x: 0, y: 4},
        {x: 11, y: 4},
        {x: 11, y: 1},
        {x: 15, y: 1},
        {x: 15, y: 9},
        {x: 9, y: 9},
        {x: 9, y: 15}
    ],
    initialMoney: 100,
    initialLives: 10,
    initialWave: 1,
    initialEnemiesPerWave: 5,
    towerCost: 40,
    towerRange: 150,
    towerDamage: 18,
    towerCooldown: 1000,
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
            grass: '#27ae60',
            path: '#95a5a6',
            grid: 'rgba(0, 0, 0, 0.05)',
            text: '#2c3e50'
        },
        font: "'MedievalSharp', cursive, serif"
    }
}; 
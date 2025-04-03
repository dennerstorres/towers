import { Config } from './Config';
import { Tower } from '../entities/Tower';
import { WaveManager } from '../managers/WaveManager';
import { CanvasRenderer } from '../../ui/CanvasRenderer';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new CanvasRenderer(canvas);
        this.waveManager = new WaveManager();
        
        this.state = {
            towers: [],
            enemies: [],
            money: Config.initialMoney,
            lives: Config.initialLives,
            gameRunning: false
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.state.gameRunning) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / Config.gridSize);
            const y = Math.floor((e.clientY - rect.top) / Config.gridSize);
            
            if (this.canPlaceTower(x, y)) {
                this.placeTower(x, y);
            }
        });
    }

    canPlaceTower(x, y) {
        if (this.state.money < Config.towerCost) return false;
        
        // Verifica se está no caminho
        for (let point of Config.path) {
            if (point.x === x && point.y === y) return false;
        }
        
        // Verifica se já existe uma torre
        for (let tower of this.state.towers) {
            if (tower.x === x && tower.y === y) return false;
        }
        
        return true;
    }

    placeTower(x, y) {
        this.state.towers.push(new Tower(x, y));
        this.state.money -= Config.towerCost;
    }

    start() {
        this.state.gameRunning = true;
        this.waveManager.startWave(this.state);
        this.gameLoop();
    }

    stop() {
        this.state.gameRunning = false;
        this.waveManager.endWave(this.state);
    }

    gameLoop(timestamp = 0) {
        if (!this.state.gameRunning) return;

        this.renderer.clear();
        this.renderer.drawGrid();
        this.renderer.drawPath();
        this.renderer.drawUI(this.state, this.waveManager);

        // Atualiza e desenha torres
        for (let tower of this.state.towers) {
            tower.update(timestamp, this.state.enemies);
            tower.draw(this.renderer.ctx);
        }

        // Atualiza e desenha inimigos
        for (let enemy of this.state.enemies) {
            enemy.update();
            enemy.draw(this.renderer.ctx);
        }

        // Remove inimigos mortos
        const enemiesBefore = this.state.enemies.length;
        this.state.enemies = this.state.enemies.filter(enemy => enemy.health > 0);
        this.waveManager.enemiesKilled += enemiesBefore - this.state.enemies.length;

        // Verifica se o jogo acabou
        if (this.state.lives <= 0) {
            this.stop();
            alert(`Game Over! Você chegou até a fase ${this.waveManager.currentWave}`);
            return;
        }

        // Atualiza o gerenciador de ondas
        this.waveManager.update(this.state);

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
} 
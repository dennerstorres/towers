import { Config } from '../core/Config.js';

export class SpatialSystem {
    constructor(canvasWidth, canvasHeight, cellSize = Config.gridSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(canvasWidth / cellSize);
        this.rows = Math.ceil(canvasHeight / cellSize);
        this.grid = new Array(this.cols * this.rows).fill(null).map(() => []);
    }

    /**
     * Atualiza a posição de todos os inimigos no grid
     * @param {Array} enemies
     */
    update(enemies) {
        // Limpa o grid
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i].length = 0;
        }

        // Insere inimigos no grid
        for (const enemy of enemies) {
            const col = Math.floor(enemy.x / this.cellSize);
            const row = Math.floor(enemy.y / this.cellSize);

            if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                this.grid[row * this.cols + col].push(enemy);
            }
        }
    }

    /**
     * Retorna inimigos dentro do alcance circular
     * @param {number} x
     * @param {number} y
     * @param {number} range
     * @returns {Array}
     */
    getEnemiesInRange(x, y, range) {
        const results = [];
        const rangeSq = range * range;

        const startCol = Math.max(0, Math.floor((x - range) / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor((x + range) / this.cellSize));
        const startRow = Math.max(0, Math.floor((y - range) / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor((y + range) / this.cellSize));

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cell = this.grid[r * this.cols + c];
                for (const enemy of cell) {
                    const dx = enemy.x - x;
                    const dy = enemy.y - y;
                    if (dx * dx + dy * dy <= rangeSq) {
                        results.push(enemy);
                    }
                }
            }
        }

        return results;
    }
}

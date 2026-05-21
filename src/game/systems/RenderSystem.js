import { Config } from '../core/Config.js';

export class RenderSystem {
    constructor(renderer, ui) {
        this.renderer = renderer;
        this.ui = ui;
    }

    /**
     * Orchestrates the full rendering of the game
     * @param {Object} gameState - Current game state
     * @param {Object} waveSystem - Wave system for UI data
     * @param {Object} particleSystem - Particle system for drawing
     * @param {Object} floatingTexts - Floating texts for drawing
     * @param {HTMLCanvasElement} canvas - Main canvas
     */
    render(gameState, waveSystem, particleSystem, floatingTexts, canvas) {
        this.renderer.drawGrid();
        this.drawRangeVisuals(gameState, canvas);

        // Draw Towers
        for (let tower of gameState.towerManager.placedTowers) {
            this.renderer.drawTower(tower);
        }

        // Draw Projectiles
        for (let p of gameState.projectiles) {
            this.renderer.drawProjectile(p);
        }

        // Draw Enemies
        for (let enemy of gameState.enemies) {
            this.renderer.drawEnemy(enemy);
        }

        // Draw Particles
        this.renderer.drawParticles(particleSystem.getParticles());

        // Draw Floating Texts
        this.renderer.drawFloatingTexts(floatingTexts.texts);

        // Draw UI overlay
        this.renderer.drawUI(gameState, waveSystem, this.ui);
    }

    /**
     * Draws range circles for towers (preview, selected, hovered)
     * @param {Object} gameState
     * @param {HTMLCanvasElement} canvas
     */
    drawRangeVisuals(gameState, canvas) {
        const mouseGridX = Math.floor(gameState.mouseX / Config.gridSize);
        const mouseGridY = Math.floor(gameState.mouseY / Config.gridSize);
        const selectedType = gameState.towerManager.getSelectedTower();
        const panelX = canvas.width - this.ui.panelWidth;

        if (selectedType && gameState.mouseX < panelX && gameState.mouseY > this.ui.hudHeight) {
            this.renderer.drawRangeCircle(
                mouseGridX * Config.gridSize + Config.gridSize / 2,
                mouseGridY * Config.gridSize + Config.gridSize / 2,
                selectedType.range
            );
        }

        if (gameState.selectedPlacedTower) {
            this.renderer.drawRangeCircle(
                gameState.selectedPlacedTower.x * Config.gridSize + Config.gridSize / 2,
                gameState.selectedPlacedTower.y * Config.gridSize + Config.gridSize / 2,
                gameState.selectedPlacedTower.range
            );
        }

        const hoveredTower = gameState.towerManager.getTowerAt(mouseGridX, mouseGridY);
        if (hoveredTower && hoveredTower !== gameState.selectedPlacedTower) {
            this.renderer.drawRangeCircle(
                hoveredTower.x * Config.gridSize + Config.gridSize / 2,
                hoveredTower.y * Config.gridSize + Config.gridSize / 2,
                hoveredTower.range
            );
        }
    }
}

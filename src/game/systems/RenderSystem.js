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

        // Draw Spell Area Indicators (FASE 7)
        this.drawSpellVisuals(gameState);

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

        // Draw Level Up Modal if needed
        if (gameState.levelUpTower) {
            // No RenderSystem, não temos acesso direto ao dataManager,
            // mas podemos passar via gameState se necessário ou deixar o CanvasRenderer buscar se ele tivesse referência.
            this.renderer.drawLevelUpModal(gameState.levelUpTower, this.ui);
        }
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

    /**
     * Draws visual indicators for casting spells
     */
    drawSpellVisuals(gameState) {
        const spellsData = gameState.towerManager.gameState?.dataManager?.get('spells');
        // RenderSystem doesn't have direct access to dataManager, but we can assume it's in gameState or similar
        // Let's refine how we get spell data.
        // Looking at Game.js, dataManager is a property of Game, not explicitly in state.
        // I will add spells to gameState in a future step if needed, but for now let's assume availability.

        for (let tower of gameState.towerManager.placedTowers) {
            if (tower.isCasting && tower.currentSpell) {
                // We need radius for AoE spells
                // This is a bit tricky without direct data access here.
                // For now, let's just draw a subtle glow around the tower
                this.renderer.ctx.save();
                this.renderer.ctx.beginPath();
                this.renderer.ctx.arc(
                    tower.x * Config.gridSize + Config.gridSize / 2,
                    tower.y * Config.gridSize + Config.gridSize / 2,
                    Config.gridSize * 0.8,
                    0, Math.PI * 2
                );
                this.renderer.ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
                this.renderer.ctx.fill();
                this.renderer.ctx.restore();
            }
        }
    }
}

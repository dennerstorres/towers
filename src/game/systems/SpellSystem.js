import { Config } from '../core/Config.js';
import { Projectile } from '../entities/Projectile.js';

export const SpellSystem = {
    /**
     * Executes a spell after casting is complete
     * @param {string} spellKey - Key of the spell to cast
     * @param {Object} tower - Tower/Character casting the spell
     * @param {Object} gameState - Current game state
     * @param {Object} floatingTexts - Floating text system
     * @param {Object} particleSystem - Particle system
     * @param {Object} dataManager - Data manager for spell and effect data
     */
    execute(spellKey, tower, gameState, floatingTexts, particleSystem, dataManager) {
        const spell = dataManager.get('spells')[spellKey];
        if (!spell) return;

        console.log(`Executing spell: ${spell.name}`);

        // Visual feedback for spell start
        particleSystem.emit(
            tower.x * Config.gridSize + Config.gridSize / 2,
            tower.y * Config.gridSize + Config.gridSize / 2,
            spell.color || Config.THEME.colors.gold,
            10
        );

        switch (spell.type) {
            case 'aoe':
                this.executeAoE(spell, tower, gameState, floatingTexts, particleSystem, dataManager);
                break;
            case 'multi':
                this.executeMulti(spell, tower, gameState, floatingTexts, particleSystem, dataManager);
                break;
            case 'heal':
                this.executeHeal(spell, tower, gameState, floatingTexts, particleSystem);
                break;
            case 'buff':
                this.executeBuff(spell, tower, gameState, floatingTexts, particleSystem);
                break;
            case 'single':
                this.executeSingle(spell, tower, gameState, floatingTexts, particleSystem, dataManager);
                break;
        }
    },

    executeAoE(spell, tower, gameState, floatingTexts, particleSystem, dataManager) {
        const centerX = tower.x * Config.gridSize + Config.gridSize / 2;
        const centerY = tower.y * Config.gridSize + Config.gridSize / 2;
        const radiusSq = spell.radius * spell.radius;
        const effects = dataManager.get('effects');

        // Visual effect for AoE
        particleSystem.emit(centerX, centerY, spell.color, 20);

        gameState.enemies.forEach(enemy => {
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                // Apply damage
                let damage = spell.damage;

                // Check resistance
                if (typeof enemy.hasResistance === 'function' && enemy.hasResistance(spell.damageType)) {
                    damage = Math.floor(damage / 2);
                }

                enemy.health -= damage;
                enemy.lastHitBy = tower;
                floatingTexts.add(enemy.x, enemy.y, `-${damage}`, spell.color);
                particleSystem.emit(enemy.x, enemy.y, spell.color, 5);

                // Apply status effect
                if (spell.effect && effects && effects[spell.effect]) {
                    enemy.applyEffect(spell.effect, effects[spell.effect], tower);
                }
            }
        });
    },

    executeMulti(spell, tower, gameState, floatingTexts, particleSystem, dataManager) {
        const centerX = tower.x * Config.gridSize + Config.gridSize / 2;
        const centerY = tower.y * Config.gridSize + Config.gridSize / 2;

        // Find top N targets in range
        const targets = gameState.enemies
            .filter(e => {
                const dx = centerX - e.x;
                const dy = centerY - e.y;
                return (dx * dx + dy * dy) <= (tower.range * tower.range);
            })
            .slice(0, spell.projectiles || 3);

        targets.forEach(target => {
            const p = new Projectile(centerX, centerY, target, spell.damage, tower, spell.damageType);
            p.color = spell.color;
            p.type = 'wizard'; // Use wizard-style projectile
            gameState.projectiles.push(p);
        });
    },

    executeHeal(spell, tower, gameState, floatingTexts, particleSystem) {
        const prevLives = gameState.lives;
        gameState.lives = Math.min(Config.initialLives, gameState.lives + (spell.value || 1));

        if (gameState.lives > prevLives) {
            floatingTexts.add(
                tower.x * Config.gridSize + Config.gridSize / 2,
                tower.y * Config.gridSize,
                `+${gameState.lives - prevLives} ❤️`,
                '#2ecc71'
            );
            particleSystem.emit(
                tower.x * Config.gridSize + Config.gridSize / 2,
                tower.y * Config.gridSize + Config.gridSize / 2,
                '#2ecc71',
                15
            );
        }
    },

    executeBuff(spell, tower, gameState, floatingTexts, particleSystem) {
        const centerX = tower.x * Config.gridSize + Config.gridSize / 2;
        const centerY = tower.y * Config.gridSize + Config.gridSize / 2;
        const radiusSq = spell.radius * spell.radius;

        gameState.towerManager.placedTowers.forEach(t => {
            const tx = t.x * Config.gridSize + Config.gridSize / 2;
            const ty = t.y * Config.gridSize + Config.gridSize / 2;
            const dx = tx - centerX;
            const dy = ty - centerY;

            if (dx * dx + dy * dy <= radiusSq) {
                if (spell.attribute === 'attackBonus') {
                    // Apply logical timer for the buff
                    t.blessedTimer = (t.blessedTimer || 0) + spell.duration;
                    if (!t.traits.includes('blessed')) {
                        t.traits.push('blessed');
                    }

                    floatingTexts.add(tx, ty, 'BLESSED!', spell.color);
                    particleSystem.emit(tx, ty, spell.color, 8);
                }
            }
        });
    },

    executeSingle(spell, tower, gameState, floatingTexts, particleSystem, dataManager) {
        const centerX = tower.x * Config.gridSize + Config.gridSize / 2;
        const centerY = tower.y * Config.gridSize + Config.gridSize / 2;

        const target = tower.getTarget(gameState.enemies);
        if (target) {
            const p = new Projectile(centerX, centerY, target, spell.damage, tower, spell.damageType);
            p.color = spell.color;
            p.speed = 12; // Fast lightning bolt
            gameState.projectiles.push(p);
        }
    }
};

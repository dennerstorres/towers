import { Config } from '../core/Config.js';

export class Enemy {
    constructor(type = 'goblin', data = null) {
        this.type = type;
        this.pathIndex = 0;
        this.x = Config.path[0].x * Config.gridSize + Config.gridSize/2;
        this.y = Config.path[0].y * Config.gridSize + Config.gridSize/2;

        // Base stats
        this.speed = Config.enemySpeed;
        this.health = Config.enemyHealth;
        this.ac = 10; // Default Armor Class
        this.resistances = []; // Default resistances

        // Boss properties
        this.isBoss = false;
        this.legendaryResistances = 0;
        this.currentPhase = 0;
        this.phases = [];
        this.specialActions = {};
        this.actionTimers = {};

        // Apply data from enemies.json if available
        if (data) {
            this.name = data.name || type;
            this.health = data.hp || this.health;
            this.ac = data.ac || this.ac;
            this.speed = data.speed || this.speed;
            this.xp = data.xp || 10;
            this.gold = data.gold || 10;
            this.resistances = data.resistances || [];

            this.isBoss = data.isBoss || false;
            this.legendaryResistances = data.legendaryResistances || 0;
            this.phases = data.phases || [];
            this.specialActions = data.specialActions || {};

            // Initialize action timers
            if (this.specialActions) {
                for (const key in this.specialActions) {
                    this.actionTimers[key] = this.specialActions[key].cooldown || 600;
                }
            }
        } else {
            this.xp = 10;
            this.gold = 10;
            // Fallback for types without explicit data
            if (type === 'orc') {
                this.health *= 2;
                this.speed *= 0.7;
                this.ac = 13;
            } else if (type === 'scout') {
                this.health *= 0.5;
                this.speed *= 1.5;
                this.ac = 12;
            }
        }

        this.maxHealth = this.health;
        this.tauntTimer = 0;
        this.activeEffects = new Map(); // Effect name -> effect object
    }

    /**
     * Applies a status effect to the enemy
     * @param {string} effectKey - Key from effects.json
     * @param {Object} effectData - Properties of the effect
     * @param {Object} attacker - Attacker who applied the effect
     */
    applyEffect(effectKey, effectData, attacker = null) {
        if (!effectData) return;

        // If effect already exists, refresh duration and attacker
        if (this.activeEffects.has(effectKey)) {
            const existing = this.activeEffects.get(effectKey);
            existing.timer = effectData.duration;
            if (attacker) existing.attacker = attacker;
            return;
        }

        // Add new effect
        this.activeEffects.set(effectKey, {
            ...effectData,
            timer: effectData.duration,
            nextTick: effectData.tickInterval || 0,
            attacker: attacker
        });
    }

    /**
     * Returns the enemy's Armor Class (AC)
     * @returns {number}
     */
    getArmorClass() {
        let currentAC = this.ac;

        // Apply phase AC bonus
        if (this.isBoss && this.phases[this.currentPhase - 1] && this.phases[this.currentPhase - 1].acBonus) {
            currentAC += this.phases[this.currentPhase - 1].acBonus;
        }

        // Armor Break effect
        for (const [key, effect] of this.activeEffects) {
            if (effect.acReduction) {
                currentAC -= effect.acReduction;
            }
        }

        return Math.max(0, currentAC);
    }

    /**
     * Checks if the enemy has resistance to a specific damage type
     * @param {string} damageType
     * @returns {boolean}
     */
    hasResistance(damageType) {
        return this.resistances.includes(damageType);
    }

    /**
     * Update loop for the enemy
     * @param {Object} gameState - Full game state for managers and context
     */
    update(gameState) {
        // Update status effects
        for (const [key, effect] of this.activeEffects) {
            effect.timer--;

            // Handle periodic damage (DOTs)
            if (effect.tickInterval) {
                effect.nextTick--;
                if (effect.nextTick <= 0) {
                    let tickDamage = effect.damage;
                    if (effect.damageType && this.hasResistance(effect.damageType)) {
                        tickDamage = Math.floor(tickDamage / 2);
                    }
                    this.health -= tickDamage;
                    if (effect.attacker) this.lastHitBy = effect.attacker;
                    effect.nextTick = effect.tickInterval;
                }
            }

            if (effect.timer <= 0) {
                this.activeEffects.delete(key);
            }
        }

        if (this.tauntTimer > 0) {
            this.tauntTimer--;
            return;
        }

        // Boss Logic: Phase Transitions
        if (this.isBoss) {
            this.updateBossPhases(gameState);
            this.updateBossActions(gameState);
        }

        // Apply movement modifiers from effects
        let currentSpeed = this.speed;

        // Boss Phase Speed Multiplier
        if (this.isBoss && this.phases[this.currentPhase - 1] && this.phases[this.currentPhase - 1].speedMultiplier) {
            currentSpeed *= this.phases[this.currentPhase - 1].speedMultiplier;
        }

        for (const [key, effect] of this.activeEffects) {
            if (typeof effect.speedMultiplier !== 'undefined') {
                currentSpeed *= effect.speedMultiplier;
            }
        }

        if (this.pathIndex < Config.path.length - 1) {
            const targetX = Config.path[this.pathIndex + 1].x * Config.gridSize + Config.gridSize/2;
            const targetY = Config.path[this.pathIndex + 1].y * Config.gridSize + Config.gridSize/2;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distanceSq = dx * dx + dy * dy;
            
            if (distanceSq < currentSpeed * currentSpeed) {
                this.pathIndex++;
                if (this.pathIndex >= Config.path.length - 1) {
                    this.reachedEnd = true;
                }
            } else {
                const distance = Math.sqrt(distanceSq);
                this.x += (dx / distance) * currentSpeed;
                this.y += (dy / distance) * currentSpeed;
            }
        }
    }

    updateBossPhases(gameState) {
        const healthPercent = this.health / this.maxHealth;

        for (let i = this.currentPhase; i < this.phases.length; i++) {
            if (healthPercent <= this.phases[i].threshold) {
                this.currentPhase = i + 1;
                const phaseAction = this.phases[i].action;

                if (gameState && gameState.floatingTexts) {
                    gameState.floatingTexts.add(this.x, this.y - 40, `FASE ${this.currentPhase}!`, "#e74c3c");
                }

                // Immediate action on phase change
                if (phaseAction) {
                    this.executeAction(phaseAction, gameState);
                }
            }
        }
    }

    updateBossActions(gameState) {
        for (const key in this.actionTimers) {
            this.actionTimers[key]--;
            if (this.actionTimers[key] <= 0) {
                this.executeAction(key, gameState);
                this.actionTimers[key] = this.specialActions[key].cooldown || 600;
            }
        }
    }

    executeAction(actionKey, gameState) {
        const action = this.specialActions[actionKey];
        if (!action || !gameState) return;

        switch (action.type) {
            case 'summon':
                this.summonMinions(action, gameState);
                break;
            case 'aoe_attack':
                this.aoeAttack(action, gameState);
                break;
            case 'buff':
                this.applyEffect('enraged', {
                    duration: action.duration,
                    damageMultiplier: action.damageMultiplier,
                    color: '#e74c3c'
                });
                break;
        }
    }

    summonMinions(action, gameState) {
        if (!gameState.enemies || !gameState.dataManager) return;

        const enemyData = gameState.dataManager.get('enemies')[action.enemyType];
        for (let i = 0; i < action.count; i++) {
            const minion = new Enemy(action.enemyType, enemyData);
            // Spawn slightly behind or near the boss
            minion.pathIndex = Math.max(0, this.pathIndex - 1);
            minion.x = this.x + (Math.random() - 0.5) * 40;
            minion.y = this.y + (Math.random() - 0.5) * 40;
            gameState.enemies.push(minion);
        }

        if (gameState.floatingTexts) {
            gameState.floatingTexts.add(this.x, this.y - 20, "INVOCAR!", "#8e44ad");
        }
        if (gameState.particleSystem) {
            gameState.particleSystem.emit(this.x, this.y, "#8e44ad", 10);
        }
    }

    aoeAttack(action, gameState) {
        if (!gameState.towerManager || !gameState.towerManager.placedTowers) return;

        const radiusSq = action.radius * action.radius;
        gameState.towerManager.placedTowers.forEach(tower => {
            const tx = tower.x * Config.gridSize + Config.gridSize/2;
            const ty = tower.y * Config.gridSize + Config.gridSize/2;
            const dx = tx - this.x;
            const dy = ty - this.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                tower.health -= action.damage;
                if (gameState.floatingTexts) {
                    gameState.floatingTexts.add(tx, ty, `-${action.damage}`, "#e74c3c");
                }
            }
        });

        if (gameState.floatingTexts) {
            gameState.floatingTexts.add(this.x, this.y - 20, "ATAQUE EM ÁREA!", "#e67e22");
        }
        if (gameState.particleSystem) {
            gameState.particleSystem.emit(this.x, this.y, "#e67e22", 20);
        }
    }
}

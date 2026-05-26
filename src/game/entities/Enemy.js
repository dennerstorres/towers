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
        this.phases = [];
        this.currentPhaseIndex = -1;
        this.specialActions = [];
        this.actionCooldowns = {};

        // Apply data from enemies.json if available
        if (data) {
            this.name = data.name || type;
            this.health = data.hp || this.health;
            this.ac = data.ac || this.ac;
            this.speed = data.speed || this.speed;
            this.xp = data.xp || 10;
            this.gold = data.gold || 0;
            this.resistances = data.resistances || [];

            // Boss data
            this.isBoss = data.isBoss || false;
            this.legendaryResistances = data.legendaryResistances || 0;
            this.phases = data.phases || [];
            this.specialActions = data.specialActions || [];

            // Initialize action cooldowns
            this.specialActions.forEach((action, index) => {
                this.actionCooldowns[index] = action.cooldown; // Start on cooldown
            });
        } else {
            this.xp = 10;
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

        // Legendary Resistance check
        if (this.isBoss && this.legendaryResistances > 0) {
            this.legendaryResistances--;
            console.log(`${this.name} used Legendary Resistance to ignore ${effectKey}! (${this.legendaryResistances} left)`);
            return;
        }

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

        // Apply Phase AC Bonus
        if (this.currentPhaseIndex >= 0) {
            for (let i = 0; i <= this.currentPhaseIndex; i++) {
                if (this.phases[i].acBonus) {
                    currentAC += this.phases[i].acBonus;
                }
            }
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

    update(game) {
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

        // Phase Transition Logic
        const healthPercent = this.health / this.maxHealth;
        for (let i = 0; i < this.phases.length; i++) {
            if (healthPercent <= this.phases[i].hpThreshold && i > this.currentPhaseIndex) {
                this.currentPhaseIndex = i;
                console.log(`${this.name} entered Phase ${i + 1}!`);
            }
        }

        // Special Actions Logic
        if (game) {
            this.specialActions.forEach((action, index) => {
                if (this.actionCooldowns[index] > 0) {
                    this.actionCooldowns[index]--;
                } else {
                    this.executeSpecialAction(action, game);
                    this.actionCooldowns[index] = action.cooldown;
                }
            });
        }

        if (this.tauntTimer > 0) {
            this.tauntTimer--;
            return;
        }

        // Apply movement modifiers from effects
        let currentSpeed = this.speed;

        // Apply Phase Speed Multiplier
        if (this.currentPhaseIndex >= 0) {
            for (let i = 0; i <= this.currentPhaseIndex; i++) {
                if (this.phases[i].speedMultiplier) {
                    currentSpeed *= this.phases[i].speedMultiplier;
                }
            }
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

    executeSpecialAction(action, game) {
        const state = game.state;
        const dataManager = game.dataManager;
        const floatingTexts = game.floatingTexts;
        const particleSystem = game.particleSystem;
        const towerManager = game.towerManager;

        if (action.type === 'summon') {
            console.log(`${this.name} is summoning ${action.count} ${action.enemyType}s!`);
            for (let i = 0; i < action.count; i++) {
                const enemyData = dataManager.get('enemies')[action.enemyType];
                const spawned = new Enemy(action.enemyType, enemyData);
                spawned.pathIndex = this.pathIndex;
                spawned.x = this.x - (i * 10);
                spawned.y = this.y;
                state.enemies.push(spawned);
            }
            if (floatingTexts) {
                floatingTexts.add(this.x, this.y - 30, "SUMMON!", Config.THEME.colors.gold);
            }
        } else if (action.type === 'aoe_attack') {
            console.log(`${this.name} performs AOE attack!`);
            const rangeSq = action.range * action.range;
            towerManager.placedTowers.forEach(tower => {
                const tx = tower.x * Config.gridSize + Config.gridSize / 2;
                const ty = tower.y * Config.gridSize + Config.gridSize / 2;
                const dx = this.x - tx;
                const dy = this.y - ty;
                if (dx * dx + dy * dy <= rangeSq) {
                    let damage = action.damage;
                    tower.health -= damage;
                    if (floatingTexts) {
                        floatingTexts.add(tx, ty, `-${damage}`, Config.THEME.colors.bloodRed);
                    }
                    if (particleSystem) {
                        particleSystem.emit(tx, ty, Config.THEME.colors.bloodRed, 5);
                    }
                }
            });
            if (floatingTexts) {
                floatingTexts.add(this.x, this.y - 30, "AOE ATTACK!", Config.THEME.colors.bloodRed);
            }
        }
    }
}

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

        // Apply data from enemies.json if available
        if (data) {
            this.health = data.hp || this.health;
            this.ac = data.ac || this.ac;
            this.speed = data.speed || this.speed;
            this.xp = data.xp || 10;
            this.resistances = data.resistances || [];
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

    update() {
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

        // Apply movement modifiers from effects
        let currentSpeed = this.speed;
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
}

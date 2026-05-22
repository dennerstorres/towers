import { Config } from '../core/Config.js';
import { Projectile } from './Projectile.js';
import { Character } from './Character.js';

export class Tower extends Character {
    constructor(x, y, type = 'archer', race = 'human', raceData = null) {
        const stats = Config.TOWERS[type.toUpperCase()] || Config.TOWERS.ARCHER;

        super(x, y, {
            name: type.charAt(0).toUpperCase() + type.slice(1),
            race: race,
            class: type,
            level: 1,
            xp: 0,
            primaryAbility: stats.primaryAbility || 'dex',
            attributes: stats.attributes || {},
            traits: [],
            critThreshold: stats.critThreshold || 20
        });

        this.type = type;

        this.range = stats.range;
        this.damage = stats.damage;
        this.damageType = stats.damageType || 'piercing';
        this.cooldown = stats.cooldown;
        this.projectileSpeed = stats.projectileSpeed;
        this.splashRadius = stats.splashRadius || 0;
        this.critThresholdDecreasePerLevel = stats.critThresholdDecreasePerLevel || 0;
        this.rangeIncreasePerLevel = stats.rangeIncreasePerLevel || 0;
        this.armorBonus = stats.armorBonus || 0;
        this.tauntDuration = stats.tauntDuration || 0;

        // Class specific
        this.auraRange = stats.auraRange || 0;
        this.buffDuration = stats.buffDuration || 0;
        this.spellSlots = type === 'wizard' ? 1 : 0;
        this.maxSpellSlots = type === 'wizard' ? 1 : 0;
        this.spellCooldown = 5000; // 5 seconds for special spells
        this.lastSpellTime = 0;

        this.baseCost = stats.cost;
        this.totalInvested = stats.cost;
        this.maxLevel = 10; // Increased max level for RPG progression

        this.lastShot = 0;
        this.pendingLevelUps = 0;
        this.requiredXp = this.calculateRequiredXp();

        // Aplicar bônus raciais
        if (raceData && raceData.bonuses) {
            const bonuses = raceData.bonuses;
            if (bonuses.attributes) {
                for (let attr in bonuses.attributes) {
                    this.attributes[attr] = (this.attributes[attr] || 10) + bonuses.attributes[attr];
                }
            }
            if (bonuses.range) this.range += bonuses.range;
            if (bonuses.critThreshold) this.critThreshold += bonuses.critThreshold;
            if (bonuses.damage) this.damage += bonuses.damage;
            this.resistances = bonuses.resistances || [];
        } else {
            this.resistances = [];
        }
    }

    /**
     * Adiciona XP ao herói e verifica level up
     * @param {number} amount
     */
    addXp(amount) {
        if (this.level >= this.maxLevel) return;

        this.xp += amount;
        while (this.xp >= this.requiredXp && this.level < this.maxLevel) {
            this.xp -= this.requiredXp;
            this.level++;
            this.pendingLevelUps++;
            this.requiredXp = this.calculateRequiredXp();
            this.upgrade(); // Aplica melhorias base de nível
        }

        if (this.level >= this.maxLevel) {
            this.xp = 0;
        }
    }

    /**
     * Calcula XP necessário para o próximo nível
     * @returns {number}
     */
    calculateRequiredXp() {
        if (this.level >= this.maxLevel) return Infinity;
        return this.level * 100;
    }

    /**
     * Reseta habilidades temporárias (ex: Lucky) no início de uma onda
     */
    resetForNewWave() {
        if (this.traits.includes('lucky')) {
            this.luckyUsedThisWave = false;
        }
    }

    upgrade() {
        // Melhora de stats base ao subir de nível via XP
        this.damage = Math.floor(this.damage * 1.3);
        this.range = Math.floor(this.range * 1.05);

        // Data-driven unique progression: Crit build
        if (this.critThresholdDecreasePerLevel > 0) {
            this.critThreshold = Math.max(1, this.critThreshold - this.critThresholdDecreasePerLevel);
        }

        return true;
    }

    getUpgradeCost() {
        if (this.level >= this.maxLevel) return Infinity;
        return Math.floor(this.baseCost * Math.pow(Config.UPGRADE_MULTIPLIER, this.level));
    }

    getSellValue() {
        return Math.floor(this.totalInvested * Config.SELL_REFUND_PERCENTAGE);
    }

    /**
     * Retorna o bônus de ataque da torre baseado em D&D 5e
     * @returns {number}
     */
    getAttackBonus() {
        const proficiency = this.getProficiencyBonus();
        const modifier = this.getModifier(this.primaryAbility);

        // Rogue Backstab bonus: if level 2+, add extra bonus
        let bonus = proficiency + modifier;
        if (this.type === 'rogue' && this.level >= 2) bonus += 2;

        return bonus;
    }

    /**
     * Calcula a Classe de Armadura (AC) baseado em D&D 5e (10 + Modificador de DEX + Bônus de Armadura)
     * @returns {number}
     */
    getArmorClass() {
        let ac = 10 + this.getModifier('dex') + this.armorBonus;

        // Paladin Aura bonus to AC if nearby
        if (this.hasPaladinAura) {
            ac += 2; // +2 AC bonus from Aura of Protection
        }

        return ac;
    }

    /**
     * Retorna o valor necessário no d20 para um acerto crítico
     * @returns {number}
     */
    getCritThreshold() {
        let threshold = this.critThreshold;
        // Rogue burst: higher crit at level 3
        if (this.type === 'rogue' && this.level >= 3) threshold -= 1;
        return threshold;
    }

    update(currentTime, enemies, towers, gameState) {
        // Special logic for classes
        this.handleSpecialLogic(currentTime, towers, gameState);

        if (currentTime - this.lastShot > this.cooldown) {
            const projectile = this.shoot(enemies, currentTime);
            if (projectile) {
                this.lastShot = currentTime;
                return projectile;
            }
        }
        return null;
    }

    handleSpecialLogic(currentTime, towers, gameState) {
        // Paladin Aura: Buff nearby allies
        if (this.type === 'paladin' && this.auraRange > 0) {
            const auraRangeSq = this.auraRange * this.auraRange;
            const centerX = this.x * Config.gridSize + Config.gridSize / 2;
            const centerY = this.y * Config.gridSize + Config.gridSize / 2;

            for (let tower of towers) {
                if (tower === this) continue;
                const tx = tower.x * Config.gridSize + Config.gridSize / 2;
                const ty = tower.y * Config.gridSize + Config.gridSize / 2;
                const dx = centerX - tx;
                const dy = centerY - ty;
                if (dx * dx + dy * dy <= auraRangeSq) {
                    // Apply aura effect (e.g., +1 AC placeholder)
                    tower.hasPaladinAura = true;
                }
            }
        }

        // Cleric Healing: Every 5 seconds, small chance to restore 1 life if level 2+
        if (this.type === 'cleric' && this.level >= 2 && currentTime % 300 === 0) {
            if (Math.random() < 0.05 && gameState.lives < Config.initialLives) {
                gameState.lives++;
                // We'd need a way to show floating text here, maybe return an effect object
            }
        }
    }

    shoot(enemies, currentTime) {
        const centerX = this.x * Config.gridSize + Config.gridSize / 2;
        const centerY = this.y * Config.gridSize + Config.gridSize / 2;
        const rangeSq = this.range * this.range;

        for (let enemy of enemies) {
            const dx = centerX - enemy.x;
            const dy = centerY - enemy.y;
            const distanceSq = dx * dx + dy * dy;
            
            if (distanceSq < rangeSq) {
                let damage = this.damage;
                let splash = this.splashRadius;
                let type = this.type;
                let taunt = this.tauntDuration;

                // Wizard Spell Slots logic
                if (this.type === 'wizard' && currentTime - this.lastSpellTime > this.spellCooldown) {
                    splash *= 2; // Empowered fireball
                    damage *= 1.5;
                    this.lastSpellTime = currentTime;
                }

                // Rogue Backstab: extra damage to first hit
                if (this.type === 'rogue') {
                    damage += this.getModifier('dex');
                }

                const projectile = new Projectile(centerX, centerY, enemy, damage, this, this.damageType);
                projectile.type = type;
                projectile.speed = this.projectileSpeed;
                projectile.splashRadius = splash;

                // Sentinel Feat
                if (this.traits.includes('sentinel')) {
                    taunt += 30;
                    projectile.slowEffect = 0.2; // 20% slow
                }

                projectile.tauntDuration = taunt;

                // Cleric Buff: projectiles from towers with Cleric buff could do something?
                // For now, Cleric just shoots radiant damage

                return projectile;
            }
        }
        return null;
    }
}

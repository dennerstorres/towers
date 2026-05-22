import { Config } from '../core/Config.js';
import { Projectile } from './Projectile.js';

export class Tower {
    constructor(x, y, type = 'archer', race = 'human', raceData = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.race = race;

        const stats = Config.TOWERS[type.toUpperCase()] || Config.TOWERS.ARCHER;

        this.range = stats.range;
        this.damage = stats.damage;
        this.damageType = stats.damageType || 'piercing';
        this.cooldown = stats.cooldown;
        this.projectileSpeed = stats.projectileSpeed;
        this.splashRadius = stats.splashRadius || 0;
        this.primaryAbility = stats.primaryAbility || 'dex';
        this.critThreshold = stats.critThreshold || 20;
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
        this.level = 1;
        this.maxLevel = 3;

        this.lastShot = 0;

        // Atributos baseados em D&D 5e para cálculo de bônus
        const defaultAttributes = {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10
        };

        // Inicializa atributos com os valores da configuração se disponíveis
        this.attributes = {
            ...defaultAttributes,
            ...(stats.attributes || {})
        };

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
     * Retorna o valor de um atributo
     * @param {string} attr
     * @returns {number}
     */
    getAttribute(attr) {
        return this.attributes[attr.toLowerCase()] || 10;
    }

    /**
     * Calcula o modificador de um atributo (D&D 5e)
     * @param {string} attr
     * @returns {number}
     */
    getModifier(attr) {
        const value = this.getAttribute(attr);
        return Math.floor((value - 10) / 2);
    }

    /**
     * Calcula o bônus de proficiência baseado no nível
     * @returns {number}
     */
    getProficiencyBonus() {
        return Math.floor((this.level - 1) / 4) + 2;
    }

    upgrade() {
        if (this.level >= this.maxLevel) return false;

        const upgradeCost = this.getUpgradeCost();
        this.totalInvested += upgradeCost;
        this.level++;

        // Melhora de stats: +50% dano por nível
        this.damage = Math.floor(this.damage * 1.5);

        // Data-driven unique progression: Range
        if (this.rangeIncreasePerLevel > 0) {
            this.range += this.rangeIncreasePerLevel;
        } else {
            // Padrão: +10% alcance por nível
            this.range = Math.floor(this.range * 1.1);
        }

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
                projectile.tauntDuration = taunt;

                // Cleric Buff: projectiles from towers with Cleric buff could do something?
                // For now, Cleric just shoots radiant damage

                return projectile;
            }
        }
        return null;
    }
}

import { Config } from '../core/Config.js';
import { Projectile } from './Projectile.js';

export class Tower {
    constructor(x, y, type = 'archer') {
        this.x = x;
        this.y = y;
        this.type = type;

        const stats = Config.TOWERS[type.toUpperCase()] || Config.TOWERS.ARCHER;

        this.range = stats.range;
        this.damage = stats.damage;
        this.damageType = stats.damageType || 'piercing';
        this.cooldown = stats.cooldown;
        this.projectileSpeed = stats.projectileSpeed;
        this.splashRadius = stats.splashRadius || 0;
        this.primaryAbility = stats.primaryAbility || 'dex';
        this.critThreshold = stats.critThreshold || 20;
        this.armorBonus = stats.armorBonus || 0;

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

        // Melhora de stats: +50% dano, +10% alcance por nível
        this.damage = Math.floor(this.damage * 1.5);
        this.range = Math.floor(this.range * 1.1);

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
        return proficiency + modifier;
    }

    /**
     * Calcula a Classe de Armadura (AC) baseado em D&D 5e (10 + Modificador de DEX + Bônus de Armadura)
     * @returns {number}
     */
    getArmorClass() {
        return 10 + this.getModifier('dex') + this.armorBonus;
    }

    /**
     * Retorna o valor necessário no d20 para um acerto crítico
     * @returns {number}
     */
    getCritThreshold() {
        return this.critThreshold;
    }

    update(currentTime, enemies) {
        if (currentTime - this.lastShot > this.cooldown) {
            const projectile = this.shoot(enemies);
            if (projectile) {
                this.lastShot = currentTime;
                return projectile;
            }
        }
        return null;
    }

    shoot(enemies) {
        const centerX = this.x * Config.gridSize + Config.gridSize / 2;
        const centerY = this.y * Config.gridSize + Config.gridSize / 2;
        const rangeSq = this.range * this.range;

        for (let enemy of enemies) {
            const dx = centerX - enemy.x;
            const dy = centerY - enemy.y;
            const distanceSq = dx * dx + dy * dy;
            
            if (distanceSq < rangeSq) {
                const projectile = new Projectile(centerX, centerY, enemy, this.damage, this, this.damageType);
                projectile.type = this.type;
                projectile.speed = this.projectileSpeed;
                projectile.splashRadius = this.splashRadius;
                return projectile;
            }
        }
        return null;
    }
}

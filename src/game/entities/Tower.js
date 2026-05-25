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

        // Class specific & Spell System (FASE 7)
        this.auraRange = stats.auraRange || 0;
        this.buffDuration = stats.buffDuration || 0;
        this.spells = raceData?.spells || stats.spells || [];

        // Ensure class spells are also included if not already there
        if (stats.spells) {
            stats.spells.forEach(s => {
                if (!this.spells.includes(s)) this.spells.push(s);
            });
        }

        this.spellSlots = this.spells.length > 0 ? 1 : 0;
        this.maxSpellSlots = this.spells.length > 0 ? 1 : 0;
        this.lastSpellTime = 0;
        this.isCasting = false;
        this.castTimer = 0;
        this.currentSpell = null;
        this.spellCooldowns = {};

        this.baseCost = stats.cost;
        this.totalInvested = stats.cost;
        this.maxLevel = 10; // Increased max level for RPG progression

        this.lastShot = 0;
        this.pendingLevelUps = 0;
        this.requiredXp = this.calculateRequiredXp();

        // Modos de Alvo (FASE 6)
        this.targetMode = 'first';
        this.targetModes = ['first', 'last', 'strongest', 'weakest', 'closest', 'farthest', 'highest_hp', 'lowest_hp'];

        // Sinergias e Posicionamento (FASE 5)
        this.synergyBonuses = { ac: 0, range: 0, damage: 0 };
        this.positioningBonuses = { ac: 0, damage: 0 };
        this.activeSynergies = [];

        // Inicializa posicionamento no constructor (FASE 5)
        this.calculatePositioning(Config.path);

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
     * Calcula o posicionamento baseado na proximidade com o caminho
     * @param {Array} path
     */
    calculatePositioning(path) {
        const centerX = this.x * Config.gridSize + Config.gridSize / 2;
        const centerY = this.y * Config.gridSize + Config.gridSize / 2;
        const threshold = Config.gridSize * 1.5;
        const thresholdSq = threshold * threshold;

        let isFrontline = false;

        // Verifica se está perto de qualquer segmento do caminho
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i+1];

            // Distância de um ponto a um segmento de reta
            const distSq = this.distToSegmentSquared(
                centerX, centerY,
                p1.x * Config.gridSize + Config.gridSize / 2,
                p1.y * Config.gridSize + Config.gridSize / 2,
                p2.x * Config.gridSize + Config.gridSize / 2,
                p2.y * Config.gridSize + Config.gridSize / 2
            );

            if (distSq <= thresholdSq) {
                isFrontline = true;
                break;
            }
        }

        this.positioning = isFrontline ? 'frontline' : 'backline';
    }

    distToSegmentSquared(px, py, x1, y1, x2, y2) {
        const l2 = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
        if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        const dx = px - (x1 + t * (x2 - x1));
        const dy = py - (y1 + t * (y2 - y1));
        return dx * dx + dy * dy;
    }

    /**
     * Retorna o alcance atual dinâmico
     */
    getRange() {
        return this.range + (this.synergyBonuses.range || 0);
    }

    /**
     * Retorna o dano atual dinâmico
     */
    getDamage() {
        let totalDamage = this.damage + (this.synergyBonuses.damage || 0);

        // Positioning bonus for ranged in backline (Data-driven)
        const rangedRoles = Config.ROLES ? Config.ROLES.ranged : [];
        const backlineBonus = Config.POSITIONING_BONUSES?.backline?.ranged;
        if (this.positioning === 'backline' && rangedRoles.includes(this.type) && backlineBonus?.damageMultiplier) {
            totalDamage = Math.floor(totalDamage * backlineBonus.damageMultiplier);
        }

        return totalDamage;
    }

    /**
     * Retorna o bônus de ataque da torre baseado em D&D 5e
     * @returns {number}
     */
    getAttackBonus() {
        const proficiency = this.getProficiencyBonus();
        const modifier = this.getModifier(this.primaryAbility);

        // Rogue Backstab bonus: if level 2+
        let bonus = proficiency + modifier;
        if (this.type === 'rogue' && this.level >= 2) bonus += 2;

        return bonus;
    }

    /**
     * Calcula a Classe de Armadura (AC) baseado em D&D 5e
     * @returns {number}
     */
    getArmorClass() {
        let ac = 10 + this.getModifier('dex') + this.armorBonus;

        // Synergy Bonus
        ac += (this.synergyBonuses.ac || 0);

        // Positioning bonus for tanks in frontline (Data-driven)
        const tankRoles = Config.ROLES ? Config.ROLES.tanks : [];
        const frontlineBonus = Config.POSITIONING_BONUSES?.frontline?.tanks;
        if (this.positioning === 'frontline' && tankRoles.includes(this.type) && frontlineBonus?.ac) {
            ac += frontlineBonus.ac;
        }

        // Paladin Aura bonus
        if (this.hasPaladinAura) {
            ac += 2;
        }

        return ac;
    }

    /**
     * Retorna o valor necessário no d20 para um acerto crítico
     * @returns {number}
     */
    getCritThreshold() {
        let threshold = this.critThreshold;

        // Bonus de meta-progressão
        if (this.metaCritBonus) {
            threshold -= this.metaCritBonus;
        }

        // Rogue burst: higher crit at level 3
        if (this.type === 'rogue' && this.level >= 3) threshold -= 1;
        return threshold;
    }

    /**
     * Seleciona um alvo baseado no targetMode atual (Busca Linear O(N))
     * @param {Array} enemies
     * @returns {Object|null}
     */
    getTarget(enemies) {
        const centerX = this.x * Config.gridSize + Config.gridSize / 2;
        const centerY = this.y * Config.gridSize + Config.gridSize / 2;
        const currentRange = this.getRange();
        const rangeSq = currentRange * currentRange;

        let bestTarget = null;
        let bestValue = null;

        for (const enemy of enemies) {
            const dx = centerX - enemy.x;
            const dy = centerY - enemy.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > rangeSq) continue;

            let currentValue;
            switch (this.targetMode) {
                case 'first':
                case 'last':
                    // Valor de progresso = (index * fator) + (distância percorrida no segmento)
                    const nextPoint = Config.path[enemy.pathIndex + 1];
                    let distToNext = 0;
                    if (nextPoint) {
                        const nextX = nextPoint.x * Config.gridSize + Config.gridSize / 2;
                        const nextY = nextPoint.y * Config.gridSize + Config.gridSize / 2;
                        distToNext = Math.sqrt((enemy.x - nextX) ** 2 + (enemy.y - nextY) ** 2);
                    }
                    currentValue = (enemy.pathIndex * 1000) + (1000 - distToNext);
                    break;

                case 'strongest':
                case 'weakest':
                    currentValue = enemy.maxHealth;
                    break;

                case 'highest_hp':
                case 'lowest_hp':
                    currentValue = enemy.health;
                    break;

                case 'closest':
                case 'farthest':
                    currentValue = distSq;
                    break;

                default:
                    currentValue = 0;
            }

            if (!bestTarget) {
                bestTarget = enemy;
                bestValue = currentValue;
                continue;
            }

            let isBetter = false;
            switch (this.targetMode) {
                case 'first':
                case 'strongest':
                case 'highest_hp':
                case 'farthest':
                    isBetter = currentValue > bestValue;
                    break;
                case 'last':
                case 'weakest':
                case 'lowest_hp':
                case 'closest':
                    isBetter = currentValue < bestValue;
                    break;
            }

            if (isBetter) {
                bestTarget = enemy;
                bestValue = currentValue;
            }
        }

        return bestTarget;
    }

    update(currentTime, deltaTime, enemies, towers, gameState) {
        // Update Timers
        if (this.blessedTimer > 0) {
            this.blessedTimer -= deltaTime;
            if (this.blessedTimer <= 0) {
                const index = this.traits.indexOf('blessed');
                if (index > -1) this.traits.splice(index, 1);
            }
        }

        // Update Spell Cooldowns
        for (let spellKey in this.spellCooldowns) {
            if (this.spellCooldowns[spellKey] > 0) {
                this.spellCooldowns[spellKey] -= deltaTime;
            }
        }

        // Special logic for classes (Auras should work even while casting)
        this.handleSpecialLogic(currentTime, towers, gameState);

        // Handle Casting
        if (this.isCasting) {
            this.castTimer -= deltaTime;
            if (this.castTimer <= 0) {
                this.isCasting = false;
                const spell = this.currentSpell;
                this.currentSpell = null;
                return { type: 'spell_cast', spell, tower: this };
            }
            return null;
        }

        // Try to cast a spell if available
        if (this.spells.length > 0 && enemies.length > 0) {
            const spellToCast = this.selectSpellToCast(enemies, gameState);
            if (spellToCast) {
                return this.startCasting(spellToCast, gameState);
            }
        }

        if (currentTime - this.lastShot > this.cooldown) {
            const projectile = this.shoot(enemies, currentTime);
            if (projectile) {
                this.lastShot = currentTime;
                return projectile;
            }
        }
        return null;
    }

    startCasting(spell, gameState) {
        const spellData = gameState.dataManager.get('spells')[spell];
        if (!spellData) return null;

        this.isCasting = true;
        this.initialCastTime = spellData.castTime;
        this.castTimer = spellData.castTime;
        this.currentSpell = spell;
        this.spellCooldowns[spell] = spellData.cooldown;

        return null;
    }

    selectSpellToCast(enemies, gameState) {
        const spellsData = gameState.dataManager.get('spells');
        if (!spellsData) return null;

        for (let spellKey of this.spells) {
            if (this.spellCooldowns[spellKey] > 0) continue;

            const spell = spellsData[spellKey];

            // Basic AI: Cast if there are enemies in range
            if (spell.type === 'aoe' || spell.type === 'single' || spell.type === 'multi') {
                const inRange = enemies.some(e => {
                    const dx = (this.x * Config.gridSize + Config.gridSize / 2) - e.x;
                    const dy = (this.y * Config.gridSize + Config.gridSize / 2) - e.y;
                    return dx * dx + dy * dy <= this.range * this.range;
                });
                if (inRange) return spellKey;
            } else if (spell.type === 'heal' && gameState.lives < Config.initialLives) {
                return spellKey;
            } else if (spell.type === 'buff') {
                return spellKey;
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
                    tower.hasPaladinAura = true;
                }
            }
        }
    }

    shoot(enemies, currentTime) {
        const centerX = this.x * Config.gridSize + Config.gridSize / 2;
        const centerY = this.y * Config.gridSize + Config.gridSize / 2;

        const enemy = this.getTarget(enemies);

        if (enemy) {
            let damage = this.getDamage();
            let splash = this.splashRadius;
            let type = this.type;
            let taunt = this.tauntDuration;

            // Frontline taunt bonus (Data-driven)
            const tankRoles = Config.ROLES ? Config.ROLES.tanks : [];
            const frontlineBonus = Config.POSITIONING_BONUSES?.frontline?.tanks;
            if (this.positioning === 'frontline' && tankRoles.includes(this.type) && frontlineBonus?.tauntMultiplier) {
                taunt = Math.floor(taunt * frontlineBonus.tauntMultiplier);
            }

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
        return null;
    }
}

export class MetaManager {
    constructor() {
        this.storageKey = 'towers_meta_progression';
        this.state = this.load();
    }

    /**
     * Loads meta progression from localStorage or returns default state
     */
    load() {
        if (typeof localStorage === 'undefined') return this.getDefaultState();
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with default state to ensure new properties are present
                return { ...this.getDefaultState(), ...parsed };
            } catch (e) {
                console.error('Failed to parse meta progression:', e);
            }
        }
        return this.getDefaultState();
    }

    getDefaultState() {
        return {
            arcaneShards: 0,
            gold: 0, // Persistent gold earned across runs
            upgrades: {
                startingGold: 0,
                extraLives: 0,
                xpBonus: 0,
                critEfficiency: 0
            },
            unlockedClasses: ['fighter', 'ranger'], // Only basic classes unlocked by default
            talents: [], // Array of talent keys
            research: {}, // Key-value for research levels
            relics: [] // Array of relic keys
        };
    }

    save() {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    /**
     * Resets meta progression (useful for debugging)
     */
    reset() {
        this.state = this.getDefaultState();
        this.save();
    }

    addShards(amount) {
        this.state.arcaneShards += amount;
        this.save();
    }

    addGold(amount) {
        this.state.gold += amount;
        this.save();
    }

    spendShards(amount) {
        if (this.state.arcaneShards >= amount) {
            this.state.arcaneShards -= amount;
            this.save();
            return true;
        }
        return false;
    }

    spendGold(amount) {
        if (this.state.gold >= amount) {
            this.state.gold -= amount;
            this.save();
            return true;
        }
        return false;
    }

    upgrade(upgradeKey, cost) {
        if (this.spendShards(cost)) {
            this.state.upgrades[upgradeKey] = (this.state.upgrades[upgradeKey] || 0) + 1;
            this.save();
            return true;
        }
        return false;
    }

    unlockClass(classKey, cost) {
        if (!this.state.unlockedClasses.includes(classKey) && this.spendShards(cost)) {
            this.state.unlockedClasses.push(classKey);
            this.save();
            return true;
        }
        return false;
    }

    buyTalent(talentKey, cost, requires, metaData) {
        // Check if already owned
        if (this.state.talents.includes(talentKey)) return false;

        // Check prerequisites
        if (requires && requires.length > 0) {
            const hasPrereqs = requires.every(req => this.state.talents.includes(req));
            if (!hasPrereqs) return false;
        }

        if (this.spendShards(cost)) {
            this.state.talents.push(talentKey);
            this.save();
            return true;
        }
        return false;
    }

    buyResearch(researchKey, metaData) {
        const research = metaData.research[researchKey];
        if (!research) return false;

        const currentLevel = this.state.research[researchKey] || 0;
        if (currentLevel >= research.maxLevel) return false;

        const cost = Math.floor(research.baseCost * Math.pow(research.costMultiplier, currentLevel));

        if (this.spendShards(cost)) {
            this.state.research[researchKey] = currentLevel + 1;
            this.save();
            return true;
        }
        return false;
    }

    buyRelic(relicKey, cost) {
        if (!this.state.relics.includes(relicKey) && this.spendShards(cost)) {
            this.state.relics.push(relicKey);
            this.save();
            return true;
        }
        return false;
    }

    getUpgradeLevel(key) {
        return this.state.upgrades[key] || 0;
    }

    getResearchLevel(key) {
        return this.state.research[key] || 0;
    }

    /**
     * Returns calculated bonuses based on current state and meta data
     * @param {Object} metaData - Content of meta.json
     */
    getBonuses(metaData) {
        const bonuses = {
            startingGold: 0,
            extraLives: 0,
            xpMultiplier: 1.0,
            critThresholdBonus: 0,
            damageMultiplier: 1.0,
            attackBonus: 0,
            acBonus: 0,
            projectileSpeedMultiplier: 1.0,
            elementalFireMultiplier: 1.0,
            elementalIceMultiplier: 1.0,
            costMultiplier: 1.0
        };

        if (!metaData) return bonuses;

        // Upgrades
        if (metaData.upgrades) {
            const u = metaData.upgrades;
            if (u.startingGold) bonuses.startingGold = this.getUpgradeLevel('startingGold') * u.startingGold.bonusPerLevel;
            if (u.extraLives) bonuses.extraLives = this.getUpgradeLevel('extraLives') * u.extraLives.bonusPerLevel;
            if (u.xpBonus) bonuses.xpMultiplier = 1.0 + (this.getUpgradeLevel('xpBonus') * u.xpBonus.bonusPerLevel);
            if (u.critEfficiency) bonuses.critThresholdBonus = this.getUpgradeLevel('critEfficiency') * u.critEfficiency.bonusPerLevel;
        }

        // Talents
        if (metaData.talents) {
            this.state.talents.forEach(talentKey => {
                if (talentKey === 'offense_1') bonuses.damageMultiplier += 0.1;
                if (talentKey === 'offense_2') bonuses.attackBonus += 5;
                if (talentKey === 'defense_1') bonuses.acBonus += 2;
                if (talentKey === 'utility_1') bonuses.projectileSpeedMultiplier += 0.1;
            });
        }

        // Research
        if (metaData.research) {
            for (let key in this.state.research) {
                const level = this.state.research[key];
                const resData = metaData.research[key];
                if (resData) {
                    if (key === 'elemental_fire') bonuses.elementalFireMultiplier += level * resData.bonusPerLevel;
                    if (key === 'elemental_ice') bonuses.elementalIceMultiplier += level * resData.bonusPerLevel;
                }
            }
        }

        // Relics
        if (metaData.relics) {
            this.state.relics.forEach(relicKey => {
                if (relicKey === 'dragons_heart') bonuses.extraLives += 2;
                if (relicKey === 'golden_quill') bonuses.costMultiplier *= 0.75;
            });
        }

        return bonuses;
    }
}

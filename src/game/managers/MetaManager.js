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
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse meta progression:', e);
            }
        }
        return this.getDefaultState();
    }

    getDefaultState() {
        return {
            arcaneShards: 0,
            relics: 0,
            gold: 0, // Persistent gold if applicable
            upgrades: {
                startingGold: 0,
                extraLives: 0,
                xpBonus: 0,
                critEfficiency: 0
            },
            unlockedClasses: ['fighter', 'ranger', 'wizard', 'cleric', 'rogue', 'paladin'], // Currently all unlocked for testing
            talents: []
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

    spendShards(amount) {
        if (this.state.arcaneShards >= amount) {
            this.state.arcaneShards -= amount;
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

    getUpgradeLevel(key) {
        return this.state.upgrades[key] || 0;
    }

    /**
     * Returns calculated bonuses based on current upgrade levels and meta data
     * @param {Object} metaData - Content of meta.json
     */
    getBonuses(metaData) {
        const bonuses = {
            startingGold: 0,
            extraLives: 0,
            xpMultiplier: 1.0,
            critThresholdBonus: 0
        };

        if (!metaData || !metaData.upgrades) return bonuses;

        const u = metaData.upgrades;

        if (u.startingGold) {
            bonuses.startingGold = this.getUpgradeLevel('startingGold') * u.startingGold.bonusPerLevel;
        }
        if (u.extraLives) {
            bonuses.extraLives = this.getUpgradeLevel('extraLives') * u.extraLives.bonusPerLevel;
        }
        if (u.xpBonus) {
            bonuses.xpMultiplier = 1.0 + (this.getUpgradeLevel('xpBonus') * u.xpBonus.bonusPerLevel);
        }
        if (u.critEfficiency) {
            bonuses.critThresholdBonus = this.getUpgradeLevel('critEfficiency') * u.critEfficiency.bonusPerLevel;
        }

        return bonuses;
    }
}

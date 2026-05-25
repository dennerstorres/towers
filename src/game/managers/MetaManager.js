export class MetaManager {
    constructor() {
        this.shards = parseInt(localStorage.getItem('towers_shards')) || 0;
        this.relics = parseInt(localStorage.getItem('towers_relics')) || 0;
        this.upgrades = JSON.parse(localStorage.getItem('towers_upgrades')) || {};
        this.metaConfig = null;
    }

    setMetaConfig(config) {
        this.metaConfig = config;
    }

    save() {
        localStorage.setItem('towers_shards', this.shards);
        localStorage.setItem('towers_relics', this.relics);
        localStorage.setItem('towers_upgrades', JSON.stringify(this.upgrades));
    }

    addShards(amount) {
        this.shards += amount;
        this.save();
    }

    addRelics(amount) {
        this.relics += amount;
        this.save();
    }

    getUpgradeRank(id) {
        return this.upgrades[id] || 0;
    }

    buyUpgrade(id) {
        if (!this.metaConfig || !this.metaConfig.upgrades[id]) return false;

        const upgrade = this.metaConfig.upgrades[id];
        const currentRank = this.getUpgradeRank(id);

        if (currentRank >= upgrade.maxRank) return false;

        const cost = upgrade.costPerRank * (currentRank + 1);
        if (this.shards < cost) return false;

        this.shards -= cost;
        this.upgrades[id] = currentRank + 1;
        this.save();
        return true;
    }

    getBonus(id) {
        if (!this.metaConfig || !this.metaConfig.upgrades[id]) return 0;
        const upgrade = this.metaConfig.upgrades[id];
        const rank = this.getUpgradeRank(id);
        return rank * upgrade.bonusPerRank;
    }

    getBonuses() {
        const bonuses = {};
        if (this.metaConfig) {
            for (let id in this.metaConfig.upgrades) {
                bonuses[id] = this.getBonus(id);
            }
        }
        return bonuses;
    }
}

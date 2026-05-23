import { Config } from '../core/Config.js';

export class PartySystem {
    constructor() {
        this.activeSynergies = [];
    }

    /**
     * Updates synergies for all placed towers
     * @param {Array} towers - List of placed towers
     */
    update(towers) {
        this.resetSynergies(towers);
        this.activeSynergies = [];

        if (towers.length < 2) return;

        const counts = this.getPartyComposition(towers);
        const synergyRules = Config.SYNERGIES || [];

        for (const rule of synergyRules) {
            if (this.checkRequirement(rule.requirement, counts)) {
                this.applySynergyRule(towers, rule);
            }
        }
    }

    resetSynergies(towers) {
        for (let tower of towers) {
            tower.synergyBonuses = { ac: 0, range: 0, damage: 0 };
            tower.activeSynergies = [];
        }
    }

    getPartyComposition(towers) {
        const composition = {
            classes: {},
            races: {}
        };

        for (let tower of towers) {
            composition.classes[tower.type] = (composition.classes[tower.type] || 0) + 1;
            composition.races[tower.race] = (composition.races[tower.race] || 0) + 1;
        }

        return composition;
    }

    checkRequirement(req, counts) {
        if (req.classes) {
            for (const cls of req.classes) {
                if (!counts.classes[cls]) return false;
            }
        }
        if (req.races) {
            for (const race of req.races) {
                if (!counts.races[race]) return false;
            }
        }
        return true;
    }

    applySynergyRule(towers, rule) {
        this.activeSynergies.push(rule.name);

        for (let tower of towers) {
            let affected = false;

            if (rule.affects.classes && rule.affects.classes.includes(tower.type)) affected = true;
            if (rule.affects.races && rule.affects.races.includes(tower.race)) affected = true;

            if (affected) {
                if (rule.bonuses.ac) tower.synergyBonuses.ac += rule.bonuses.ac;
                if (rule.bonuses.range) tower.synergyBonuses.range += rule.bonuses.range;
                if (rule.bonuses.damage) tower.synergyBonuses.damage += rule.bonuses.damage;
                tower.activeSynergies.push(rule.name);
            }
        }
    }
}

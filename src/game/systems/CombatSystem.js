export const CombatSystem = {
    /**
     * Rola um dado de 20 faces
     * @returns {number} 1-20
     */
    rollD20() {
        return Math.floor(Math.random() * 20) + 1;
    },

    /**
     * Calcula se um ataque atingiu o alvo baseado em D&D 5e
     * @param {Object} attacker - Entidade que ataca (deve ter getAttackBonus())
     * @param {Object} target - Entidade que defende (deve ter ac)
     * @returns {Object} { hit: boolean, crit: boolean, fail: boolean, roll: number }
     */
    calculateHit(attacker, target) {
        const roll = this.rollD20();
        const attackBonus = (typeof attacker.getAttackBonus === 'function') ? attacker.getAttackBonus() : 0;

        let targetAC = 10;
        if (typeof target.getArmorClass === 'function') {
            targetAC = target.getArmorClass() || 10;
        } else if (target.ac !== undefined) {
            targetAC = target.ac || 10;
        }

        // Regra de acerto crítico (usando threshold do atacante)
        const critThreshold = (typeof attacker.getCritThreshold === 'function') ? attacker.getCritThreshold() : 20;
        if (roll >= critThreshold) {
            return { hit: true, crit: true, fail: false, roll };
        }

        // Regra de 1 natural (Falha Crítica)
        if (roll === 1) {
            return { hit: false, crit: false, fail: true, roll };
        }

        const total = roll + attackBonus;
        const hit = total >= targetAC;

        return { hit, crit: false, fail: false, roll, total };
    }
};

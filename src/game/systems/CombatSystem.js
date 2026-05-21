import { Config } from '../core/Config.js';

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
    },

    /**
     * Aplica dano a um alvo baseado no projétil
     * @param {Object} projectile - O projétil que atingiu o alvo
     * @param {Object} gameState - Estado atual do jogo
     * @param {Object} floatingTexts - Sistema de textos flutuantes
     * @param {Object} particleSystem - Sistema de partículas
     */
    applyDamage(projectile, gameState, floatingTexts, particleSystem) {
        const currentDamageType = projectile.damageType || 'piercing';

        if (projectile.splashRadius > 0) {
            // Splash Damage (Mage)
            const splashRadiusSq = projectile.splashRadius * projectile.splashRadius;
            gameState.enemies.forEach(enemy => {
                const dx = enemy.x - projectile.x;
                const dy = enemy.y - projectile.y;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq <= splashRadiusSq) {
                    let finalDamage = projectile.damage;

                    // Checks for resistance (D&D 5e: half damage)
                    if (typeof enemy.hasResistance === 'function' && enemy.hasResistance(currentDamageType)) {
                        finalDamage = Math.floor(finalDamage / 2);
                    }

                    enemy.health -= finalDamage;
                    floatingTexts.add(enemy.x, enemy.y, `-${finalDamage}`, Config.THEME.colors.bloodRed);
                    particleSystem.emit(enemy.x, enemy.y, Config.THEME.colors.bloodRed, 3);
                }
            });
            // Visual feedback for splash
            particleSystem.emit(projectile.x, projectile.y, Config.THEME.colors.mage, 15);
        } else if (projectile.target && projectile.target.health > 0) {
            // Single target damage com sistema D20
            const attackResult = this.calculateHit(projectile.attacker || {}, projectile.target);

            if (attackResult.hit) {
                let damage = projectile.damage;
                let color = Config.THEME.colors.bloodRed;

                if (attackResult.crit) {
                    damage *= 2;
                    color = Config.THEME.colors.gold;
                }

                // Checks for resistance (D&D 5e: half damage)
                if (typeof projectile.target.hasResistance === 'function' && projectile.target.hasResistance(currentDamageType)) {
                    damage = Math.floor(damage / 2);
                }

                let text = attackResult.crit ? `CRIT! -${damage}` : `-${damage}`;

                projectile.target.health -= damage;
                floatingTexts.add(projectile.target.x, projectile.target.y, text, color);

                if (projectile.target.health <= 0) {
                    particleSystem.emit(projectile.x, projectile.y, Config.THEME.colors.bloodRed, Config.particleCount);
                } else {
                    const particleColor = projectile.type === 'cannon' ? Config.THEME.colors.cannon : '#f1c40f';
                    particleSystem.emit(projectile.x, projectile.y, particleColor, 5);
                }
            } else {
                // Errou o ataque
                const missText = attackResult.fail ? 'FALHA!' : 'ERROU';
                floatingTexts.add(projectile.target.x, projectile.target.y, missText, '#95a5a6');
                particleSystem.emit(projectile.x, projectile.y, '#95a5a6', 3);
            }
        }
    }
};

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
        let hit = total >= targetAC;

        // Lucky Feat
        if (!hit && attacker.traits && attacker.traits.includes('lucky') && !attacker.luckyUsedThisWave) {
            attacker.luckyUsedThisWave = true;
            const secondRoll = this.rollD20();
            const secondTotal = secondRoll + attackBonus;
            const secondHit = secondTotal >= targetAC;

            return {
                hit: secondHit,
                crit: secondRoll >= critThreshold,
                fail: secondRoll === 1,
                roll: secondRoll,
                total: secondTotal,
                isLucky: true
            };
        }

        return { hit, crit: false, fail: false, roll, total };
    },

    /**
     * Aplica dano a um alvo baseado no projétil
     * @param {Object} projectile - O projétil que atingiu o alvo
     * @param {Object} gameState - Estado atual do jogo
     * @param {Object} floatingTexts - Sistema de textos flutuantes
     * @param {Object} particleSystem - Sistema de partículas
     * @param {Object} dataManager - Gerenciador de dados para efeitos
     */
    applyDamage(projectile, gameState, floatingTexts, particleSystem, dataManager) {
        const currentDamageType = projectile.damageType || 'piercing';
        const effects = dataManager ? dataManager.get('effects') : null;

        if (projectile.splashRadius > 0) {
            // AoE Spell (Wizard)
            const splashRadiusSq = projectile.splashRadius * projectile.splashRadius;
            gameState.enemies.forEach(enemy => {
                const dx = enemy.x - projectile.x;
                const dy = enemy.y - projectile.y;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq <= splashRadiusSq) {
                    let finalDamage = projectile.damage;

                    // Weakness effect
                    for (const [key, effect] of enemy.activeEffects) {
                        if (effect.damageTakenMultiplier) {
                            finalDamage = Math.floor(finalDamage * effect.damageTakenMultiplier);
                        }
                    }

                    // Checks for resistance (D&D 5e: half damage)
                    if (typeof enemy.hasResistance === 'function' && enemy.hasResistance(currentDamageType)) {
                        finalDamage = Math.floor(finalDamage / 2);
                    }

                    enemy.health -= finalDamage;
                    enemy.lastHitBy = projectile.attacker;
                    floatingTexts.add(enemy.x, enemy.y, `-${finalDamage}`, Config.THEME.colors.bloodRed);
                    particleSystem.emit(enemy.x, enemy.y, Config.THEME.colors.bloodRed, 3);

                    // Chance to apply status effects from splash
                    if (effects) {
                        if (currentDamageType === 'fire' && Math.random() < 0.3) {
                            enemy.applyEffect('burn', effects.burn, projectile.attacker);
                        }
                    }
                }
            });
            // Visual feedback for splash
            particleSystem.emit(projectile.x, projectile.y, Config.THEME.colors.wizard, 15);
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

                // Weakness effect
                for (const [key, effect] of projectile.target.activeEffects) {
                    if (effect.damageTakenMultiplier) {
                        damage = Math.floor(damage * effect.damageTakenMultiplier);
                    }
                }

                // Checks for resistance (D&D 5e: half damage)
                if (typeof projectile.target.hasResistance === 'function' && projectile.target.hasResistance(currentDamageType)) {
                    damage = Math.floor(damage / 2);
                }

                let text = attackResult.crit ? `CRIT! -${damage}` : `-${damage}`;
                if (attackResult.isLucky) text = `LUCKY! ${text}`;

                projectile.target.health -= damage;
                projectile.target.lastHitBy = projectile.attacker;
                floatingTexts.add(projectile.target.x, projectile.target.y, text, color);

                // Taunt logic for entities with tauntDuration
                if (projectile.tauntDuration > 0 && typeof projectile.target.tauntTimer !== 'undefined') {
                    projectile.target.tauntTimer = projectile.tauntDuration;
                    floatingTexts.add(projectile.target.x, projectile.target.y - 15, 'TAUNTED!', '#f1c40f');
                }

                // Status Effects Logic
                if (effects) {
                    // Feedback for Legendary Resistance if it was used inside applyEffect
                    const previousResistances = projectile.target.legendaryResistances;

                    if (currentDamageType === 'fire' && Math.random() < 0.2) {
                        projectile.target.applyEffect('burn', effects.burn, projectile.attacker);
                    }
                    if (currentDamageType === 'radiant' && Math.random() < 0.1) {
                        projectile.target.applyEffect('weakness', effects.weakness, projectile.attacker);
                    }
                    if (projectile.attacker && projectile.attacker.type === 'rogue') {
                        if (Math.random() < 0.3) projectile.target.applyEffect('poison', effects.poison, projectile.attacker);
                        if (Math.random() < 0.2) projectile.target.applyEffect('bleed', effects.bleed, projectile.attacker);
                    }
                    if (projectile.attacker && projectile.attacker.type === 'cannon') {
                        if (Math.random() < 0.2) projectile.target.applyEffect('stun', effects.stun, projectile.attacker);
                    }
                    if (projectile.attacker && (projectile.attacker.type === 'archer' || projectile.attacker.type === 'ranger') && Math.random() < 0.15) {
                        projectile.target.applyEffect('slow', effects.slow, projectile.attacker);
                    }
                    if (projectile.attacker && projectile.attacker.type === 'fighter' && Math.random() < 0.25) {
                        projectile.target.applyEffect('armor_break', effects.armor_break, projectile.attacker);
                    }

                    if (projectile.target.isBoss && projectile.target.legendaryResistances < previousResistances) {
                        floatingTexts.add(projectile.target.x, projectile.target.y - 30, 'RESISTÊNCIA LENDÁRIA!', '#f1c40f');
                    }
                }

                // Slow logic for Sentinel feat
                if (projectile.slowEffect > 0 && effects) {
                    projectile.target.applyEffect('slow', effects.slow, projectile.attacker);
                }

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

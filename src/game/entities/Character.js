export class Character {
    /**
     * @param {number} x - Posição X no grid
     * @param {number} y - Posição Y no grid
     * @param {Object} data - Dados opcionais para inicializar o personagem
     */
    constructor(x, y, data = {}) {
        this.x = x;
        this.y = y;

        // Propriedades RPG core
        this.name = data.name || 'Hero';
        this.race = data.race || 'human';
        this.class = data.class || 'fighter';
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        this.maxHealth = data.maxHealth || 50;
        this.health = data.health || this.maxHealth;
        this.primaryAbility = data.primaryAbility || 'str';

        this.equipment = data.equipment || {
            weapon: null,
            armor: null,
            accessory: null,
            ring1: null,
            ring2: null,
            amulet: null
        };

        // Atributos D&D 5e (padrão 10)
        const defaultAttributes = {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10
        };
        this.attributes = { ...defaultAttributes, ...(data.attributes || {}) };

        // Características e habilidades passivas
        this.traits = data.traits || [];

        // Chance de acerto crítico (valor no d20 necessário para crítico)
        this.critThreshold = data.critThreshold || 20;
    }

    /**
     * Retorna o valor necessário no d20 para um acerto crítico
     * @returns {number}
     */
    getCritThreshold() {
        return this.critThreshold;
    }

    /**
     * Retorna o valor base de um atributo
     * @param {string} attr - Nome do atributo (str, dex, con, int, wis, cha)
     * @returns {number}
     */
    getAttribute(attr) {
        return this.attributes[attr.toLowerCase()] || 10;
    }

    /**
     * Calcula o modificador de um atributo conforme regra D&D 5e: floor((valor - 10) / 2)
     * @param {string} attr - Nome do atributo
     * @returns {number}
     */
    getModifier(attr) {
        const value = this.getAttribute(attr);
        return Math.floor((value - 10) / 2);
    }

    /**
     * Calcula o bônus de proficiência baseado no nível (D&D 5e inspiration)
     * @returns {number}
     */
    getProficiencyBonus() {
        return Math.floor((this.level - 1) / 4) + 2;
    }

    /**
     * Calcula o bônus de ataque total (Proficiência + Modificador de Atributo)
     * @returns {number}
     */
    getAttackBonus() {
        const proficiency = this.getProficiencyBonus();
        const modifier = this.getModifier(this.primaryAbility);
        let total = proficiency + modifier;

        // Buff: Blessed
        if (this.traits.includes('blessed')) total += 2;

        return total;
    }

    /**
     * Calcula a Classe de Armadura (AC) baseado em D&D 5e (10 + Modificador de DEX)
     * @returns {number}
     */
    getArmorClass() {
        return 10 + this.getModifier('dex');
    }

    /**
     * Atualiza a lógica da entidade
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(deltaTime) {
        // Implementação básica a ser expandida em tarefas futuras
    }
}

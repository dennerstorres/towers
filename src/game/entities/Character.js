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
        this.primaryAbility = data.primaryAbility || 'str';

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
        return proficiency + modifier;
    }

    /**
     * Atualiza a lógica da entidade
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(deltaTime) {
        // Implementação básica a ser expandida em tarefas futuras
    }
}

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
     * Atualiza a lógica da entidade
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(deltaTime) {
        // Implementação básica a ser expandida em tarefas futuras
    }
}

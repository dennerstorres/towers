export class Character {
    /**
     * @param {number} x - Posição X no grid
     * @param {number} y - Posição Y no grid
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Atualiza a lógica da entidade
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(deltaTime) {
        // Implementação básica a ser expandida em tarefas futuras
    }
}

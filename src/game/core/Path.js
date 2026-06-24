/**
 * Utilitários de caminho (path) do mapa.
 *
 * Centraliza o cálculo das células de grade percorridas pelos inimigos,
 * usado tanto para validação de placement de torres quanto para o
 * preview visual (ghost tile).
 */

/**
 * Calcula o conjunto de células de grade que um caminho percorre.
 *
 * O caminho é uma lista de waypoints em coordenadas de grade. Os inimigos
 * viajam em linha reta entre waypoints consecutivos, pelo centro das células.
 * Este método rasteriza cada segmento marcando TODAS as células atravessadas
 * (não apenas os waypoints), para que torres não possam ser colocadas sobre
 * a rota dos inimigos.
 *
 * Suporta segmentos alinhados aos eixos (caso comum) e diagonais (Bresenham).
 *
 * @param {Array<{x:number,y:number}[]>} paths - lista de caminhos; cada caminho é um array de waypoints.
 * @param {number} [margin=0] - folga em células ao redor do caminho (0 = exato).
 * @returns {Set<string>} Set com chaves "x,y" de todas as células bloqueadas.
 */
export function computePathCells(paths, margin = 0) {
    const cells = new Set();
    if (!paths || !paths.length) return cells;

    const add = (x, y) => {
        for (let dy = -margin; dy <= margin; dy++) {
            for (let dx = -margin; dx <= margin; dx++) {
                cells.add(`${x + dx},${y + dy}`);
            }
        }
    };

    for (const path of paths) {
        if (!path || path.length === 0) continue;
        for (let i = 0; i < path.length - 1; i++) {
            rasterizeSegment(path[i], path[i + 1], add);
        }
        // Garante que o último waypoint também esteja marcado.
        const last = path[path.length - 1];
        add(last.x, last.y);
    }

    return cells;
}

/**
 * Rasteriza um segmento entre dois waypoints, chamando `add(x,y)` para cada célula.
 * - Segmentos alinhados aos eixos: caminhada exata célula a célula.
 * - Diagonais: algoritmo de Bresenham (cobertura contígua).
 */
function rasterizeSegment(a, b, add) {
    const x0 = a.x, y0 = a.y, x1 = b.x, y1 = b.y;

    if (x0 === x1) {
        const step = y1 >= y0 ? 1 : -1;
        for (let y = y0; y !== y1 + step; y += step) add(x0, y);
        return;
    }
    if (y0 === y1) {
        const step = x1 >= x0 ? 1 : -1;
        for (let x = x0; x !== x1 + step; x += step) add(x, y0);
        return;
    }

    // Diagonal — Bresenham
    let dx = Math.abs(x1 - x0);
    let dy = -Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let cx = x0, cy = y0;
    // Limite de segurança contra loops infinitos.
    const limit = (Math.abs(dx) + Math.abs(dy)) * 2 + 4;
    let count = 0;
    while (count++ < limit) {
        add(cx, cy);
        if (cx === x1 && cy === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; cx += sx; }
        if (e2 <= dx) { err += dx; cy += sy; }
    }
}

/**
 * Verifica se uma célula está no conjunto de células bloqueadas pelo caminho.
 * @param {Set<string>} pathCells
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function isOnPath(pathCells, x, y) {
    return pathCells ? pathCells.has(`${x},${y}`) : false;
}

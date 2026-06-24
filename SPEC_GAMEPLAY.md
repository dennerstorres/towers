# Spec — Parte Jogável (Gameplay)

> Escopo: **somente a camada jogável** (lógica de jogo, UX, UI, visual, performance de runtime).
> Fora de escopo: editor de conteúdo, service worker/PWA, meta-progression persistente avulsa, i18n, gamepad mapping novo.

Este documento descreve **como o jogo deve se comportar** quando estiver "prontinho para jogar". O `PLAN_GAMEPLAY.md` descreve **como chegar lá**.

---

## 1. Estado atual (diagnóstico)

### 1.1 BUG crítico — torres podem ser colocadas no caminho
`Game.canPlaceTower(x, y)` (`src/game/core/Game.js:1034-1057`) só bloqueia células que coincidem **exatamente** com um waypoint:
```js
for (let point of Config.path) {
    if (point.x === x && point.y === y) return false;
}
```
O caminho é uma lista de waypoints em espaço de grade (`maps.json`). Inimigos viajam em **segmentos retos** entre waypoints (centro das células), atravessando dezenas de células que **não** são waypoints. Essas células não são bloqueadas → o jogador posiciona torres em cima da rota dos inimigos.
- O mesmo bug existe em `Game.canPlaceMovedTower()` (`Game.js:805`).
- O `Tower.calculatePositioning` (`Tower.js:164-193`) já calcula distância a segmentos — a lógica existe, só não é reaproveitada na validação de placement.

### 1.2 Performance / lentidão / travamento
- **Hot loops com `splice`**: remoção de partículas (`ParticleSystem.js:79-82`), textos flutuantes (`FloatingText.js:51-64`) e projéteis (`Game.js:1333-1342`) usam `splice` O(n) dentro do loop por frame.
- **Arrays sem born Superior**: partículas e textos criam novos objetos quando o pool estoura e crescem sem limite sob carga pesada.
- **Canvas caro por frame**: `ctx.shadowBlur`/`ctx.shadowColor` (CanvasRenderer ~229, 696, 840) e `ctx.filter = 'brightness(2)...'` (`CanvasRenderer.js:1024`) causam sync de GPU a cada frame.
- **Targeting O(n²)**: cada torre itera todos os inimigos por frame (`Tower.js:347-430`), embora exista `SpatialSystem` que nem sempre é usado (`CombatSystem.js:84` cai pra lista completa).
- **Listeners acumulando**: `renderTowerPanelHtml`/`bindEditorCommonButtons` (`Game.js:154-430`) fazem `addEventListener` sem remoção — vazamento de closures.
- **DOM por frame**: HUD e painel refeitos via `innerHTML`.
- **Risco de congelamento**: acumulador de fixed-timestep (`GameLoop.js:40-42`) pode entrar em espiral se updates passarem de 16,6 ms; `addXp` com `while` (`Game.js:107-113`).

### 1.3 UX / UI
- **Sem preview fantasma (ghost tower)**: ao posicionar, não há tile verde/vermelho indicando se o local é válido. Só aparece o círculo de alcance (`RenderSystem.js:97-103`).
- **Sem feedback de falha**: clicar em local inválido não diz o motivo (sem ouro / no caminho / sem slot).
- **Fluxo de placement truncado**: clica na carta → clica no grid. Sem drag-and-drop, sem tooltip de carta.
- **Sem indicador de cooldown** de magias/ataques.
- **Level-up abre modal que pausa** o jogo, quebrando o ritmo.

### 1.4 Lógica / balance
- **Ouro de inimigo nunca é coletado**: `Enemy.gold` (`Enemy.js:32`) existe mas `Game.js` não soma ao matar — economia deficitária.
- **Onda 1 apertada demais**: 100 ouro inicial, torre mais barata 40 → 1–2 torres para a primeira onda.
- **Lucky Feat** uma vez por onda em vez de por combate.
- **18 `console.log`** deixados em código de runtime (`Config.js:90`, `Game.js` vários, `WaveSystem.js:143`, `SpellSystem.js:18`).

### 1.5 Visual / feel
- Torres estáticas ao atirar (sem animação de tiro/recuo).
- Inimigos somem ao morrer (sem animação de morte; só partículas).
- Sem trilha de projétil.
- O que já existe e é bom: screen shake em crítico, hit-stop, partículas de morte, números de dano, barra de chefe com resistências lendárias.

---

## 2. Requisitos — "Prontinho para jogar"

### R1 — Placement correto (resolve o bug do caminho)
- **R1.1** Nenhuma torre pode ser colocada sobre **qualquer célula** que um inimigo percorre (segmentos entre waypoints), com folga configurável.
- **R1.2** A validação deve ser **barata**: as células ocupadas pelo caminho são pré-calculadas **uma vez** ao carregar o mapa (rasterização de segmentos → `Set` de `"x,y"`), não recalculadas por clique.
- **R1.3** A mesma validação vale para **mover torre** (`canPlaceMovedTower`) — DRY, função única `isCellBlocked(x,y)`.
- **R1.4** Torres não podem se sobrepor; respeitar limite de `maxPartySlots`; bloquear área de HUD/painel; bloquear sem ouro.
- **R1.5** Pré-calcular também decoração/hazards marcados como não-construíveis se o mapa informar.

### R2 — Feedback visual de placement
- **R2.1** Enquanto uma torre está selecionada, o tile sob o cursor mostra um **ghost** verde (válido) ou vermelho (inválido) + círculo de alcance.
- **R2.2** Clique inválido produz **feedback**: shake leve / som de erro / flash vermelho no tile.
- **R2.3** Cartas de torre mostram tooltip/legenda com custo, dano, alcance e status de "sem ouro".

### R3 — Performance estável a 60 fps com o jogo cheio
- **R3.1** Remoção por troca-in-place (swap-pop) em vez de `splice` para partículas, textos e projéteis.
- **R3.2** Pools com teto duro; excesso descartado, não alocado indefinidamente.
- **R3.3** Reduzir/eliminar `shadowBlur` e `ctx.filter` do hot path (pré-renderizar glows em offscreen canvas em cache por cor/tamanho).
- **R3.4** Targeting usa o `SpatialSystem` em todos os caminhos (CombatSystem incluso).
- **R3.5** Listeners de UI removidos antes de re-render (`removeEventListener` ou delegate único).
- **R3.6** HUD atualizado por diff (texto de elementos específicos), não `innerHTML` inteiro.
- **R3.7** Cap de passos do fixed-timestep para evitar espiral de morte (máx. N updates/frame).

### R4 — UX/UI jogável e limpa
- **R4.1** HUD claro: ouro, vidas, onda, kills, grupo, ascensão, modificador — legíveis, sem trepidação.
- **R4.2** Seleção de torre posicionada: menu de contexto com modo de mira, upgrade e vender — com custo visível.
- **R4.3** Level-up sem travar o fluxo: preferir pill/barra de escolha sobre o canvas ou fila de level-ups sem pausar combate crítico.
- **R4.4** Remover todos os `console.log` de runtime.

### R5 — Lógica / balance / economia
- **R5.1** Coletar `enemy.gold` ao matar (renda por kill, além do bônus de onda).
- **R5.2** Ajustar economia inicial para a onda 1 ser viável com ≥2 torres (ou renda passiva leve).
- **R5.3** Revisar Lucky Feat para frequência coerente.
- **R5.4** Validação de NaN/inválido em dano/vida (defensivo).

### R6 — Visual / game feel
- **R6.1** Recuo/mira animada na torre ao atirar.
- **R6.2** Inimigos com animação curta de morte (fade/scale + partículas) antes de sumir.
- **R6.3** Trilha simples no projétil.
- **R6.4** Manter screen shake/hit-stop existentes (não regredir).

### R7 — Robustez
- **R7.1** Nenhum erro de console em uma run completa (onda 1 → vitória/game over).
- **R7.2** Fim de jogo (vitória/derrota) sempre alcançável e com tela final funcional.

---

## 3. Critérios de aceite (definição de pronto)
1. **Não é possível** posicionar torre em nenhuma célula do caminho (testado em todos os mapas).
2. Ghost verde/vermelho aparece ao posicionar; clique inválido dá feedback e **não** gasta ouro.
3. Frame time médio < 16,6 ms com 30+ inimigos, 6 torres, partículas ativas (sem travadas).
4. Economia sustenta pelo menos 2 torres na onda 1; ouro por kill é creditado.
5. Zero `console.log` em runtime; zero exceções em run completa.
6. Torres reagem ao atirar; inimigos têm morte visual; sem regressão de shake/hit-stop.

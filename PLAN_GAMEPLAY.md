# Plano de Execução — Parte Jogável

Execução em **6 fases** com dependências. Cada fase é independente para commit. **Ordem recomendada**: F1 (bug bloqueador) → F2 (performance) → F3 (feedback placement) → F4 (UX/UI) → F5 (lógica/balance) → F6 (visual feel). Validar com `npm test` ao fim de cada fase e jogar manualmente.

---

## Fase F1 — Corrigir placement no caminho (BLOQUEADOR)
**Resolve:** R1, bug reportado. **Arquivos:** `src/game/core/Config.js`, `src/game/core/Game.js`, `src/game/entities/Tower.js`.

- **F1.1** Em `Config.js`, adicionar campo de cache: `Config.pathCells = null` e `Config.pathBlockMargin = 0` (folga em células; 0 = exato).
- **F1.2** Criar utilitário `computePathCells(paths)` que, dada lista de waypoints, rasteriza cada segmento (algoritmo de Bresenham ou amostragem centro-a-centro) e devolve um `Set` de chaves `"x,y"`. Colocar em `Config.js` ou em um `src/game/core/Path.js` novo.
  - Considerar **todos** os caminhos do mapa (`mapData.paths`), não só `paths[0]` (hoje `Game.js:486` usa só o primeiro).
- **F1.3** Em `Game.js`, onde o mapa é carregado (~`Game.js:486`), chamar `Config.pathCells = computePathCells(mapData.paths)`.
- **F1.4** Extrair método único `Game.isCellBlocked(x, y)` que retorna `true` se:
  - `Config.pathCells.has(x+","+y)` (no caminho);
  - fora dos limites jogáveis (painel/HUD);
  - já existe torre (`towerManager.getTowerAt`).
- **F1.5** Reescrever `canPlaceTower` e `canPlaceMovedTower` usando `isCellBlocked` + checagens de ouro/slot. Elimina os dois loops `for (point of Config.path)`.
- **F1.6** Expor `Game.isCellBlocked` no `gameState` para o `RenderSystem` usar no ghost (F3).

**Teste manual:** em cada mapa, tentar posicionar sobre o trajeto inteiro — deve estar sempre bloqueado. Verificar que ainda é possível posicionar fora do caminho.

---

## Fase F2 — Performance (resolver lentidão/travamento)
**Resolve:** R3. **Arquivos:** `ParticleSystem.js`, `FloatingText.js`, `Game.js`, `Tower.js`, `CombatSystem.js`, `RenderSystem.js`, `src/ui/CanvasRenderer.js`, `GameLoop.js`, UI HTML.

- **F2.1 (swap-pop)** Trocar remoção por `splice` por troca-in-place:
  - `ParticleSystem.update`: iterar com índice, mover o último vivo para a posição do morto, `pop`.
  - Idem em `FloatingText.update`.
  - Em `Game.js` (loop de projéteis ~`1333-1342`): mesma técnica.
- **F2.2 (pools com teto)** Definir `MAX_PARTICLES`/`MAX_TEXTS`; quando o pool estourar, **reciclar o mais antigo** em vez de alocar infinito. `emit()` respeita o teto (descarta ou sobrescreve o mais velho).
- **F2.3 (glow cache)** Pré-renderizar círculos de glow em offscreen canvas por (cor, raio) em um `Map` cache. Substituir `shadowBlur` por `drawImage` do cache em projéteis, torres e HUD. Remover `ctx.filter` do flash de inimigo → trocar por `globalAlpha`/overlay de cor.
- **F2.4 (spatial em tudo)** Em `CombatSystem` splash (`CombatSystem.js:84`) e em qualquer fallback de "lista completa", usar `spatialSystem.getEnemiesInRange`. Garantir que o grid é rebuildado uma vez por frame (não por torre).
- **F2.5 (UI listeners)** Refatorar `renderTowerPanelHtml`/`bindEditorCommonButtons` para **event delegation** (um listener no container pai) ou `removeEventListener` antes de re-render. Evitar rebind por atualização.
- **F2.6 (HUD diff)** Atualizar HUD setando `textContent` nos elementos fixos em vez de `innerHTML` inteiro.
- **F2.7 (cap timestep)** Em `GameLoop.js`, limitar o `while (accumulator >= timeStep)` a no máx. 5 iterações; descartar o resto.

**Teste:** rodar onda densa (30+ inimigos), DevTools Performance → frame time médio < 16,6 ms, sem GC spikes grandes.

---

## Fase F3 — Feedback visual de placement
**Resolve:** R2. **Arquivos:** `RenderSystem.js`, `src/ui/CanvasRenderer.js`, `Game.js`.

- **F3.1** Em `drawRangeVisuals`, quando há torre selecionada, chamar `renderer.drawPlacementGhost(gridX, gridY, valid)` onde `valid = !game.isCellBlocked(...) && podePagar`.
- **F3.2** Em `CanvasRenderer`, implementar `drawPlacementGhost`: tile semi-transparente verde/vermelho + borda + ícone da torre + círculo de alcance (que já existe).
- **F3.3** No clique inválido (`Game.js` handle de click), emitir feedback: `particleSystem.emit` curto vermelho no tile, som de erro (`AudioManager`), e shake leve.
- **F3.4** Tooltips nas cartas: `title`/overlay com custo, dano, alcance; marcar carta como indisponível (opacidade) quando `money < custo`.

**Teste:** posicionar o mouse sobre o caminho → vermelho; fora → verde; clique no vermelho → feedback e sem débito.

---

## Fase F4 — UX/UI jogável
**Resolve:** R4. **Arquivos:** `index.html`, `Game.js`, `src/ui/GameUI.js`, `RenderSystem.js`.

- **F4.1 (HUD legível)** Confirmar/ajustar os 7 campos do HUD com cores/ícones fixos; garantir atualização por diff (já coberto em F2.6).
- **F4.2 (menu de torre posicionada)** Padronizar o menu de contexto: Modo de mira (dropdown com 8 modos), Upgrade (com custo), Vender (com valor). Tornar os botões claros e com hit-area confortável.
- **F4.3 (level-up sem travar)** Trocar modal bloqueante por overlay não-pausante ou fila de level-ups resolvida ao fim da onda; manter pausa só se o jogador abrir manualmente.
- **F4.4 (limpar console)** Remover os 18 `console.log` de runtime (`Config.js:90`, `Game.js` ~433/493/627/954/959/1174/1186/1208, `WaveSystem.js:143`, `SpellSystem.js:18`, `InputSystem.js:72/77`).

**Teste:** fluxo completo menu → onda 1 → camp → onda 2 sem ruído no console.

---

## Fase F5 — Lógica / balance / economia
**Resolve:** R5. **Arquivos:** `Game.js` (morte de inimigo ~1357), `Config.js`, `CombatSystem.js`, `WaveSystem.js`.

- **F5.1 (ouro por kill)** Na morte do inimigo, somar `enemy.gold` (com multiplicador de meta se houver) ao `state.money`; emitir floating text "+N".
- **F5.2 (economia inicial)** Ajustar `Config.initialMoney` e/ou `waveMoneyReward` para viabilizar ≥2 torres na onda 1. Documentar valores escolhidos no spec.
- **F5.3 (lucky)** Revisar flag `luckyUsedThisWave` → frequência coerente (ex.: por combate ou com cooldown curto).
- **F5.4 (defensivo)** Guarda em cálculos de dano/vida contra NaN (`Number.isFinite`), especialmente em scaling de ascensão/endless.

**Teste:** matar inimigos aumenta ouro; onda 1 completável; valores de dano nunca NaN.

---

## Fase F6 — Visual / game feel
**Resolve:** R6. **Arquivos:** `Tower.js`, `Enemy.js`, `Projectile.js`, `CanvasRenderer.js`, `RenderSystem.js`.

- **F6.1 (recuo da torre)** Adicionar `recoilTimer` à `Tower`, decrementado por frame; no render, aplicar offset/scale pequeno na direção do alvo ao atirar.
- **F6.2 (morte do inimigo)** Em vez de remover imediatamente, entrar em estado "morrendo" por N frames com scale-down/alpha + partículas já existentes; só então remover do array.
- **F6.3 (trilha de projétil)** `Projectile` guarda últimas N posições; render desenha trilha com alpha decrescente (sem shadowBlur — usar F2.3 cache).
- **F6.4 (regressão)** Confirmar screen shake e hit-stop continuam funcionando após F2/F6.

**Teste:** sentir a diferença de "juice": tiro com recuo, morte suave, rastro visível.

---

## Validação final (Definition of Done)
- [ ] `npm test` (sintaxe + smoke) passa.
- [ ] Smoke de run completa (onda 1 → fim) sem exceções no console.
- [ ] Checklist do `SPEC_GAMEPLAY.md` §3 (critérios de aceite) todos verdes.
- [ ] Jogar manualmente 2–3 mapas confirmando placement, performance e feel.

## Riscos / observações
- **F1.2**: se houver caminhos com segmentos diagonais longos, Bresenham garante cobertura contígua; validar contra a posição real dos inimigos (centro da célula).
- **F2.3**: glow cache consome memória proporcional a (cores × raios) distintos — limitar variantes.
- **F4.3**: nivelar level-up para não-pausante pode mudar dificuldade; ajustar IA de auto-escolha se necessário.
- **F5.2**: qualquer mudança de economia pode afetar meta-progression; manter registrado.

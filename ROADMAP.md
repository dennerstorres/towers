# 🏰 Towers — Roadmap v1.0

> Jogo Tower Defense em JavaScript puro com Canvas API.
> Objetivo: primeira versão pública jogável, visualmente polida e funcional.
>
> **Como funciona este roadmap:**
> - Tarefas são executadas **uma por vez**, em ordem, via Jules (agente de IA)
> - Quando uma tarefa começa a ser executada, o checkbox é marcado com `[x]`
> - A tarefa só é considerada concluída após o PR ser aprovado e mergeado
> - **Nunca iniciar uma nova tarefa com PR anterior ainda aberto**

---

## Fase 1 — Fundação Visual & Feedback (dias 1–6)

- [x] **T01** — Design system e tema visual
  Definir paleta de cores medieval (pedra, ouro, vermelho sangue), tipografia temática e aplicar ao canvas. Substituir fundo `#f0f0f0` e border `#333` por um tema coeso. Atualizar `index.html` e `CanvasRenderer.js`.

- [x] **T02** — Redesign da tela inicial (Start Screen)
  Substituir o card branco básico por uma tela de título temática com logo, arte de fundo e botão estilizado. Modificar o bloco `#startScreen` no `index.html` e seus estilos.

- [x] **T03** — Redesign do HUD in-game
  Painel lateral ou barra superior com ícones para ouro, vidas e onda atual. Substituir texto puro por elementos visuais com ícones e contadores estilizados. Modificar `GameUI.js` e `CanvasRenderer.js`.

- [x] **T04** — Sprites e visual das torres
  Desenhar torres com Canvas 2D API usando formas temáticas (torre de pedra, torre de arqueiro, etc.). Substituir retângulos simples. Modificar `CanvasRenderer.js` e `Tower.js`.

- [x] **T05** — Visual dos inimigos e barra de vida
  Sprites distintos por tipo de inimigo. Barra de vida mais elegante com cor variando de verde para vermelho conforme HP cai. Modificar `CanvasRenderer.js` e `Enemy.js`.

- [x] **T06** — Efeitos visuais de tiro e impacto
  Projéteis visíveis no canvas (bola de fogo, flecha, etc.) e partículas ou flash de impacto ao acertar inimigos. Adicionar sistema de partículas leve em `CanvasRenderer.js` ou novo arquivo `src/game/effects/ParticleSystem.js`.

---

## Fase 2 — Mecânicas Essenciais (dias 7–12)

- [x] **T07** — Múltiplos tipos de torre com painel de seleção
  Pelo menos 3 tipos (arqueiro rápido/fraco, canhão lento/forte, mágica com splash). Painel lateral para selecionar qual torre construir antes de clicar no grid. Atualizar `TowerManager.js`, `Tower.js`, `Config.js` e `GameUI.js`.

- [x] **T08** — Venda e upgrade de torres
  Clique em torre existente para abrir menu de contexto: vender (recuperar parte do ouro) ou fazer upgrade (nível 1→2→3 com aumento de stats visível). Modificar `TowerManager.js`, `Tower.js` e `GameUI.js`.

- [x] **T09** — Visualização de alcance das torres
  Ao passar o mouse ou selecionar uma torre, mostrar círculo de alcance semi-transparente. Ao posicionar nova torre, mostrar preview de alcance antes de confirmar. Modificar `CanvasRenderer.js` e `Game.js`.

- [x] **T10** — Telas de Game Over e vitória
  Substituir estado silencioso de derrota por tela com score, ondas sobrevividas e botão de reiniciar. Adicionar tela de vitória se atingir onda máxima. Modificar `GameUI.js` e `Game.js`.

- [x] **T11** — Pausa e controle de velocidade
  Botão de pausa (tecla Espaço ou botão na UI) e opção de 2× velocidade. Modificar `Game.js` e `GameUI.js`.

- [x] **T12** — Efeitos sonoros básicos
  Sons de tiro, morte de inimigo, game over e início de onda usando Web Audio API ou arquivos de áudio curtos. Criar `src/audio/AudioManager.js` e integrar nos managers relevantes.

---

## Fase 3 — Experiência & Polimento (dias 13–17)

- [x] **T13** — Countdown e anúncio de onda
  Tela "Onda 3 chegando em 5..." com contagem regressiva visual e botão "Iniciar agora". Modificar `WaveManager.js` e `GameUI.js`.

- [x] **T14** — Mapa temático e caminho decorado
  Substituir grid cinza por mapa com textura (grama, terra, pedra). Caminho dos inimigos visualmente mais orgânico. Modificar `CanvasRenderer.js` e `Config.js`.

- [x] **T15** — Floating text e feedback de dano
  Números de dano flutuando ao causar/receber dano. "+50 ouro" ao completar onda. Adicionar sistema de floating text em `CanvasRenderer.js` ou `src/game/effects/FloatingText.js`.

- [ ] **T16** — Responsividade básica e suporte mobile  
  Canvas com escala adaptativa para telas menores. Botões e HUD com tamanho mínimo de toque. Modificar `index.html`, `CanvasRenderer.js` e `GameUI.js`.

- [ ] **T17** — Highscore com localStorage  
  Salvar melhor pontuação no localStorage. Exibir na tela de Game Over ("Seu recorde: 12 ondas"). Modificar `GameUI.js` e `Game.js`.

---

## Fase 4 — Deploy & Produção (dias 18–20)

- [ ] **T18** — Performance e otimização do loop  
  Garantir 60fps estável com muitos inimigos. Revisar `requestAnimationFrame`, evitar redraws desnecessários, limitar objetos ativos. Profiling básico e ajustes no `Game.js` e `CanvasRenderer.js`.

- [ ] **T19** — SEO, meta tags e PWA manifest  
  Adicionar title, description e `og:image` para compartilhamento. Revisar `manifest.json`. Usar screenshot do jogo como `og:image`. Modificar `index.html` e `assets/icons/manifest.json`.

- [ ] **T20** — Deploy público em GitHub Pages ou Vercel  
  Configurar deploy automático via GitHub Actions. Testar em múltiplos browsers (Chrome, Firefox, Safari). Atualizar README com link de play e instruções.

---

## Changelog

| Tarefa | Status | PR | Data |
|--------|--------|----|------|
| T01 | Em revisão | #1 | 14/05/2026 |
| T02 | Em revisão | #2 | 14/05/2026 |
| T03 | Em revisão | #3 | 14/05/2026 |
| T04 | Em revisão | #4 | 14/05/2026 |
| T05 | Em revisão | #5 | 14/05/2026 |
| T06 | Em revisão | #6 | 14/05/2026 |
| T08 | Em revisão | #7 | 15/05/2026 |
| T09 | Em revisão | #8 | 15/05/2026 |
| T11 | Em revisão | #9 | 15/05/2026 |
| T13 | Em revisão | #14 | 16/05/2026 |
| T14 | Em revisão | #15 | 16/05/2026 |
| T15 | Em revisão | #17 | 17/05/2026 |

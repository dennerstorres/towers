# Towers — RPG Party Defense Roadmap

## Visão do Projeto

Transformar o projeto atual de Tower Defense em um:
# “RPG Party Defense inspirado em D&D 5e”

Onde:
- Cada “torre” é um personagem
- Personagens possuem raça, classe, nível e atributos
- O combate usa adaptações simplificadas de D&D 5e
- O foco é progressão, builds, party synergy e nostalgia RPG

---

# FASE 1 — Fundação do Novo Core RPG

## Objetivo
Preparar a arquitetura para suportar:
- atributos
- classes
- raças
- progressão
- efeitos
- builds

## Tarefas

### Estrutura de Dados
- [x] Criar sistema data-driven
- [x] Externalizar configs para JSON
- [x] Criar:
  - races.json
  - classes.json
  - enemies.json
  - spells.json
  - feats.json
  - items.json

### Character System
- [x] Criar entidade Character
- [x] Adicionar:
  - nome
  - raça
  - classe
  - nível
  - XP
  - atributos
  - traits

### Attributes
- [x] Implementar:
  - [x] STR
  - [x] DEX
  - [x] CON
  - [x] INT
  - [x] WIS
  - [x] CHA

### D20 Combat
- [x] Sistema de hit usando:
  - d20
  - attack bonus
  - armor class (AC)
- [x] Critical hit (20 natural)
- [x] Critical fail (1 natural)

### Combat Stats
- [x] Attack Bonus
- [x] Armor Class
- [x] Crit Chance
- [x] Damage Types
- [x] Resistências

### Refatoração Arquitetural
- [x] Separar:
  - GameLoop
  - CombatSystem
  - RenderSystem
  - InputSystem
  - StateStore
  - WaveSystem

---

# FASE 2 — Classes e Raças Base

## Objetivo
Criar as primeiras builds jogáveis.

## Classes Iniciais

### Fighter
- [x] Tank melee
- [x] Armor bonus
- [x] Taunt

### Ranger
- [x] Ranged DPS
- [x] Crit build
- [x] Long range

### Wizard
- [x] AoE spells
- [x] Elemental damage
- [x] Spell slots

### Cleric
- [x] Healing
- [x] Buffs
- [x] Holy damage

### Rogue
- [x] Burst damage
- [x] Backstab
- [x] Dodge

### Paladin
- [x] Hybrid tank/support
- [x] Aura
- [x] Smite

---

## Raças Iniciais

### Human
- [x] All-rounder

### Elf
- [x] +DEX
- [x] +Range

### Dwarf
- [x] +CON
- [x] Resistance

### Halfling
- [x] Luck
- [x] Crit bonus

### Orc
- [x] +STR
- [x] Rage passive

---

# FASE 3 — Sistema de Progressão

## Objetivo
Criar vínculo entre jogador e personagens.

## XP e Níveis
- [x] XP individual
- [x] Curva de progressão
- [x] Tela de level up

## Escolhas por Nível
- [x] Upgrade de atributos
- [x] Nova habilidade
- [x] Spell unlock
- [x] Feats

## Feats Iniciais
- [x] Sharpshooter
- [x] Lucky
- [x] Sentinel
- [x] Mobile
- [x] War Caster

## Especializações
- [x] Subclasses simples
- [x] Evoluções únicas

---

# FASE 4 — Sistema de Efeitos

## Objetivo
Adicionar profundidade estratégica.

## Status Effects
- [x] Burn
- [x] Freeze
- [x] Poison
- [x] Bleed
- [x] Stun
- [x] Slow
- [x] Weakness
- [x] Armor Break

## Regras
- [x] Stack rules
- [x] Duration
- [x] Tick system
- [x] Resistances

---

# FASE 5 — Party System

## Objetivo
Transformar “torres” em grupo de heróis.

## Party Composition
- [x] Slots de party
- [x] Sinergias
- [x] Aura bonuses

## Positioning
- [x] Frontline
- [x] Backline
- [x] Range priority

## Synergy Examples
- [x] Cleric + Paladin
- [x] Elf + Ranger
- [x] Orc + Fighter

---

# FASE 6 — Targeting Avançado

## Objetivo
Aumentar profundidade tática.

## Target Modes
- [x] First
- [x] Last
- [x] Strongest
- [x] Weakest
- [x] Closest
- [x] Farthest
- [x] Highest HP
- [x] Lowest HP

---

# FASE 7 — Sistema de Magias

## Objetivo
Trazer identidade D&D.

## Spellcasting
- [x] Spell slots
- [x] Cooldowns
- [x] Cast time
- [x] AoE indicators

## Spells Iniciais
- [x] Fireball
- [x] Magic Missile
- [x] Heal
- [x] Bless
- [x] Ice Storm
- [x] Lightning Bolt

---

# FASE 8 — Meta Progression

## Objetivo
Criar replay infinito.

## Progressão Permanente
- [x] Talent tree
- [x] Unlocks
- [x] Research
- [x] Persistent upgrades

## Currency
- [x] Gold
- [x] Arcane shards
- [x] Relics

---

# FASE 9 — Tavern System

## Objetivo
Criar hub entre waves.

## Tavern
- [x] Recruit characters
- [x] Upgrade gear
- [x] Heal party
- [x] Change formation

## Camp Features
- [x] Shop
- [x] Blacksmith
- [x] Mage tower
- [x] Training grounds

---

# FASE 10 — Loot & Equipamentos

## Objetivo
Adicionar RPG pesado.

## Equipment
- [x] Weapons
- [x] Armor
- [x] Rings
- [x] Amulets

## Rarity
- [x] Common
- [x] Rare
- [x] Epic
- [x] Legendary

## Affixes
- [x] +Crit
- [x] +Spell Power
- [x] +Armor
- [x] +Attack Speed

---

# FASE 11 — Bosses RPG

## Objetivo
Criar encounters memoráveis.

## Boss Mechanics
- [x] Multiple phases
- [x] Resistances
- [x] Summons
- [x] Area attacks
- [x] Enrage

## Legendary Mechanics
- [x] Legendary resistance
- [x] Special actions

---

# FASE 12 — Sistema de Mapas

## Objetivo
Expandir variedade do gameplay.

## Maps
- [x] Forest
- [x] Ice
- [x] Lava
- [x] Dungeon
- [x] Swamp

## Mechanics
- [x] Hazards
- [x] Split paths
- [x] Dynamic terrain

---

# FASE 13 — Visual & Game Feel

## Objetivo
Dar sensação AAA indie.

## Feedback
- [x] Screen shake
- [x] Hit stop
- [x] Impact flash
- [x] Damage numbers
- [x] Crit effects

## VFX
- [x] Explosions
- [x] Magic effects
- [x] Light glow
- [x] Shadows fake

---

# FASE 14 — Performance

## Objetivo
Preparar para crescimento.

## Optimization
- [x] Object pooling
- [x] Spatial partitioning
- [x] Render culling
- [x] Offscreen canvas

---

# FASE 15 — Save System

## Objetivo
Persistência real.

## Save Features
- [x] Full save
- [x] Autosave
- [x] Save versioning
- [x] Import/export

---

# FASE 16 — Editor de Conteúdo

## Objetivo
Criar longevidade infinita.

## Editor
- [x] Map editor
- [x] Wave editor
- [x] Enemy editor
- [x] Spell editor

---

# FASE 17 — Endgame

## Objetivo
Replayability.

## Features
- [ ] Endless mode
- [ ] Hardcore mode
- [ ] Roguelite runs
- [ ] Random modifiers
- [ ] Ascension levels

---

# FASE 18 — Polimento Final

## Objetivo
Transformar em produto.

## UX
- [ ] Settings
- [ ] Audio menu
- [ ] Keybinds
- [ ] Controller support
- [ ] Localization

## Plataforma
- [ ] PWA
- [ ] Steam build
- [ ] Electron/Tauri

---

# PRIORIDADE REAL

## PRIORIDADE MÁXIMA
1. Data-driven architecture
2. Character system
3. D20 combat
4. Classes/races
5. XP progression

## SEGUNDA PRIORIDADE
6. Effects
7. Spells
8. Party synergy
9. Tavern
10. Loot

## TERCEIRA PRIORIDADE
11. Meta progression
12. Map variety
13. Editor
14. Endgame

---

# VISÃO FINAL

O objetivo não é:
“mais um tower defense”.

O objetivo é:
# “um RPG estratégico de defesa de território inspirado em D&D”.

Misturando:
- Tower Defense
- RPG
- Party Builder
- Roguelite
- Auto Battler
- D&D nostalgia

---

# Changelog

| Task | Status | PR | Date |
|------|--------|----|------|
| FASE 16 — Editor de Conteúdo | Concluído | # | 2026-06-08 |
| FASE 15 — Save System | Concluído | # | 2026-06-07 |
| FASE 14 — Performance | Concluído | # | 2026-06-05 |
| FASE 13 — Visual & Game Feel | In Review | # | 2026-05-26 |
| FASE 12 — Sistema de Mapas | In Review | #11 | 2026-05-26 |
| FASE 11 — Bosses RPG | Concluído | # | 2026-06-03 |
| FASE 10 — Loot & Equipamentos | Concluído | # | 2026-06-02 |
| FASE 9 — Tavern System | Concluído | # | 2026-06-01 |
| FASE 8 — Meta Progression | Concluído | # | 2026-05-30 |
| FASE 7 — Sistema de Magias | Concluído | # | 2026-05-29 |
| FASE 6 — Targeting Avançado | Concluído | # | 2026-05-28 |
| FASE 5 — Party System | Concluído | #5 | 2026-05-27 |
| FASE 4 — Sistema de Efeitos | Concluído | #4 | 2026-05-26 |
| FASE 3 — Sistema de Progressão | Concluído | #3 | 2026-05-25 |
| FASE 2 — Classes e Raças Base | Concluído | #2 | 2026-05-24 |
| Criar sistema data-driven | Em revisão | #23 | 2026-05-18 |
| Criar arquivos de dados RPG | In Review | # | 2026-05-18 |
| Criar entidade Character | In Review | # | 2026-05-19 |
| Adicionar propriedades RPG ao Character | In Review | # | 2026-05-19 |
| Attributes | In Review | # | 2025-05-22 |
| D20 Combat | In Review | # | 2026-05-24 |
| Attack Bonus | In Review | # | 2026-05-20 |
| Armor Class | In Review | # | 2026-05-20 |
| Crit Chance | In Review | # | 2025-02-14 |
| Damage Types | In Review | # | 2026-05-20 |
| Resistências | In Review | # | 2026-05-20 |
| Separar Sistemas de Core | In Review | # | 2026-05-21 |
| Tank melee | In Review | # | 2026-05-21 |
| Armor bonus | In Progress | # | 2026-05-22 |
| Taunt | In Review | # | 2026-05-21 |
| Ranged DPS | In Review | # | 2026-05-21 |
| Crit build | In Review | # | 2026-05-22 |
| Long range | In Progress | # | 2026-05-22 |
| AoE spells | In Review | # | 2026-05-22 |

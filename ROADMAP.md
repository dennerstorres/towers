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
- [ ] Criar:
  - races.json
  - classes.json
  - enemies.json
  - spells.json
  - feats.json
  - items.json

### Character System
- [ ] Criar entidade Character
- [ ] Adicionar:
  - nome
  - raça
  - classe
  - nível
  - XP
  - atributos
  - traits

### Attributes
- [ ] Implementar:
  - STR
  - DEX
  - CON
  - INT
  - WIS
  - CHA

### D20 Combat
- [ ] Sistema de hit usando:
  - d20
  - attack bonus
  - armor class (AC)
- [ ] Critical hit (20 natural)
- [ ] Critical fail (1 natural)

### Combat Stats
- [ ] Attack Bonus
- [ ] Armor Class
- [ ] Crit Chance
- [ ] Damage Types
- [ ] Resistências

### Refatoração Arquitetural
- [ ] Separar:
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
- [ ] Tank melee
- [ ] Armor bonus
- [ ] Taunt

### Ranger
- [ ] Ranged DPS
- [ ] Crit build
- [ ] Long range

### Wizard
- [ ] AoE spells
- [ ] Elemental damage
- [ ] Spell slots

### Cleric
- [ ] Healing
- [ ] Buffs
- [ ] Holy damage

### Rogue
- [ ] Burst damage
- [ ] Backstab
- [ ] Dodge

### Paladin
- [ ] Hybrid tank/support
- [ ] Aura
- [ ] Smite

---

## Raças Iniciais

### Human
- [ ] All-rounder

### Elf
- [ ] +DEX
- [ ] +Range

### Dwarf
- [ ] +CON
- [ ] Resistance

### Halfling
- [ ] Luck
- [ ] Crit bonus

### Orc
- [ ] +STR
- [ ] Rage passive

---

# FASE 3 — Sistema de Progressão

## Objetivo
Criar vínculo entre jogador e personagens.

## XP e Níveis
- [ ] XP individual
- [ ] Curva de progressão
- [ ] Tela de level up

## Escolhas por Nível
- [ ] Upgrade de atributos
- [ ] Nova habilidade
- [ ] Spell unlock
- [ ] Feats

## Feats Iniciais
- [ ] Sharpshooter
- [ ] Lucky
- [ ] Sentinel
- [ ] Mobile
- [ ] War Caster

## Especializações
- [ ] Subclasses simples
- [ ] Evoluções únicas

---

# FASE 4 — Sistema de Efeitos

## Objetivo
Adicionar profundidade estratégica.

## Status Effects
- [ ] Burn
- [ ] Freeze
- [ ] Poison
- [ ] Bleed
- [ ] Stun
- [ ] Slow
- [ ] Weakness
- [ ] Armor Break

## Regras
- [ ] Stack rules
- [ ] Duration
- [ ] Tick system
- [ ] Resistências

---

# FASE 5 — Party System

## Objetivo
Transformar “torres” em grupo de heróis.

## Party Composition
- [ ] Slots de party
- [ ] Sinergias
- [ ] Aura bonuses

## Positioning
- [ ] Frontline
- [ ] Backline
- [ ] Range priority

## Synergy Examples
- [ ] Cleric + Paladin
- [ ] Elf + Ranger
- [ ] Orc + Fighter

---

# FASE 6 — Targeting Avançado

## Objetivo
Aumentar profundidade tática.

## Target Modes
- [ ] First
- [ ] Last
- [ ] Strongest
- [ ] Weakest
- [ ] Closest
- [ ] Farthest
- [ ] Highest HP
- [ ] Lowest HP

---

# FASE 7 — Sistema de Magias

## Objetivo
Trazer identidade D&D.

## Spellcasting
- [ ] Spell slots
- [ ] Cooldowns
- [ ] Cast time
- [ ] AoE indicators

## Spells Iniciais
- [ ] Fireball
- [ ] Magic Missile
- [ ] Heal
- [ ] Bless
- [ ] Ice Storm
- [ ] Lightning Bolt

---

# FASE 8 — Meta Progression

## Objetivo
Criar replay infinito.

## Progressão Permanente
- [ ] Talent tree
- [ ] Unlocks
- [ ] Research
- [ ] Persistent upgrades

## Currency
- [ ] Gold
- [ ] Arcane shards
- [ ] Relics

---

# FASE 9 — Tavern System

## Objetivo
Criar hub entre waves.

## Tavern
- [ ] Recruit characters
- [ ] Upgrade gear
- [ ] Heal party
- [ ] Change formation

## Camp Features
- [ ] Shop
- [ ] Blacksmith
- [ ] Mage tower
- [ ] Training grounds

---

# FASE 10 — Loot & Equipamentos

## Objetivo
Adicionar RPG pesado.

## Equipment
- [ ] Weapons
- [ ] Armor
- [ ] Rings
- [ ] Amulets

## Rarity
- [ ] Common
- [ ] Rare
- [ ] Epic
- [ ] Legendary

## Affixes
- [ ] +Crit
- [ ] +Spell Power
- [ ] +Armor
- [ ] +Attack Speed

---

# FASE 11 — Bosses RPG

## Objetivo
Criar encounters memoráveis.

## Boss Mechanics
- [ ] Multiple phases
- [ ] Resistances
- [ ] Summons
- [ ] Area attacks
- [ ] Enrage

## Legendary Mechanics
- [ ] Legendary resistance
- [ ] Special actions

---

# FASE 12 — Sistema de Mapas

## Objetivo
Expandir variedade do gameplay.

## Maps
- [ ] Forest
- [ ] Ice
- [ ] Lava
- [ ] Dungeon
- [ ] Swamp

## Mechanics
- [ ] Hazards
- [ ] Split paths
- [ ] Dynamic terrain

---

# FASE 13 — Visual & Game Feel

## Objetivo
Dar sensação AAA indie.

## Feedback
- [ ] Screen shake
- [ ] Hit stop
- [ ] Impact flash
- [ ] Damage numbers
- [ ] Crit effects

## VFX
- [ ] Explosions
- [ ] Magic effects
- [ ] Light glow
- [ ] Shadows fake

---

# FASE 14 — Performance

## Objetivo
Preparar para crescimento.

## Optimization
- [ ] Object pooling
- [ ] Spatial partitioning
- [ ] Render culling
- [ ] Offscreen canvas

---

# FASE 15 — Save System

## Objetivo
Persistência real.

## Save Features
- [ ] Full save
- [ ] Autosave
- [ ] Save versioning
- [ ] Import/export

---

# FASE 16 — Editor de Conteúdo

## Objetivo
Criar longevidade infinita.

## Editor
- [ ] Map editor
- [ ] Wave editor
- [ ] Enemy editor
- [ ] Spell editor

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
| Criar sistema data-driven | Em revisão | #23 | 2026-05-18 |

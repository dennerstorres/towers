# Boss Mechanics Technical Design

## Legendary Resistances
- Bosses start with a fixed number of Legendary Resistance (LR) charges (e.g., 3).
- When a status effect would be applied to the boss, if it has LR charges, one is consumed, and the effect is ignored.
- Visual feedback: A "RESISTED!" floating text with a distinct color.

## Multi-Phase Logic
- Bosses have HP thresholds for phase transitions (e.g., Phase 2 at 60% HP, Phase 3 at 30% HP).
- Phase transitions can trigger:
  - Immediate special actions (Summoning minions).
  - Stat changes (Increased speed, armor, or damage).
  - Visual changes (Scale increase, color shift).

## Special Actions (Cooldown-based)
- `summon`: Spawns a set of smaller enemies near the boss.
- `aoe_attack`: Deals damage to all towers within a certain radius.
- `enrage`: Temporary boost to speed and damage when health is low.

## Wave Integration
- Wave 5: First Boss encounter (The Goblin King).
- Wave 10: Final Boss encounter (Ancient Dragon).
- Bosses spawn alone as the only enemy of the wave.

## UI Requirements
- Dedicated Boss Health Bar at the top of the screen.
- LR indicators (small icons or dots near the boss health bar).

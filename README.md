# NeverlessRPG

NeverlessRPG is a Discord-native RPG/gacha prototype inspired by Genshin-style progression. The current build is locked to the private test channel and uses generated image cards instead of text-heavy embeds for the main game UI.

## V2 UI / gameplay

- Start with `-neverless` in channel `1539226931319545936`.
- Dynamic PNG dashboard generated per player: Discord avatar, account Lv. 1–20, XP bar, PWR, resources, MMR and a framed roster grid.
- Main navigation is one Discord select-menu box instead of eight large buttons.
- Character roster cards show portraits, rarity, level and PWR.
- Character detail card shows full art, combat stats, weapon, constellation and Normal / Skill / Burst descriptions and multipliers.
- Wish ×1 / ×10 creates a visual results board with one tile per character or weapon, rarity framing and duplicate state.
- Inventory card displays character and weapon grids.
- Domain cards show recommended PWR, Resin cost, reward range and enemy portraits (Slimes, Hilichurls, Abyss/Ruin enemies).
- Battle cards show both teams, portraits, HP bars, Energy, turn owner and the latest action.
- Battle actions also produce a Discord combat message such as `@player used Bennett — Fantastic Voyage!` with damage/heal/shield information.
- PWR is calculated from the strongest roster, levels, stats, weapon rarity/level, Artifacts, Constellations and permanent upgrades.
- Expanded Wish pools with a much larger character and weapon roster.

## Setup

```bash
cp .env.example .env
npm install
npm start
```

Set:

- `DISCORD_TOKEN`
- `GAME_CHANNEL_ID=1539226931319545936`
- `DATA_FILE=./runtime/players.json`

Enable **Message Content Intent** in Discord Developer Portal because the current entry point uses `-neverless`.

## Image cards

The generated interface is implemented in `src/ui/cards.js` with `sharp`. It downloads character/weapon/enemy art at runtime when available and falls back cleanly if an external image fails. The final theme uses Neverless purple with muted Genshin-like gold on a dark game panel.

The dashboard design went through multiple layout/color iterations before the final dark purple/gold version was selected. The layout follows the requested sketch: profile column on the left, account level/XP/PWR/resources underneath, and framed character slots on the right.

## Architecture

- `src/data/` — character, weapon, Artifact and Domain definitions.
- `src/game/` — battle engine, wishing, power/stat calculations and progression.
- `src/ui/cards.js` — generated PNG game interface.
- `src/ui/components.js` — Discord select menus/buttons.
- `src/ui/render.js` — text/embed fallback renderer.
- `src/db/` — persistence adapter.
- `src/index.js` — Discord routing and session state.

## Persistence

For Railway production persistence, mount a volume at `/app/runtime` and set:

`DATA_FILE=/app/runtime/players.json`

The JSON persistence layer remains isolated so it can later be migrated to PostgreSQL/Redis for public PvP queues and durable matchmaking.

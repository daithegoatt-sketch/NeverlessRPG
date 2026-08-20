# NeverlessRPG

A Discord-native RPG prototype inspired by Genshin Impact systems: wishing, character ownership, weapons, artifacts, domains, progression, a speed-based turn engine and a CPU arena.

## Current test scope

- Locked to Discord channel `1539226931319545936` by default.
- Start command: `-neverless`.
- One persistent panel message per invocation; buttons/select menus edit the same embed instead of creating a chain of new embeds.
- Character and weapon wishing (`x1` / `x10`) with 4★ and 5★ pity.
- Starter account with four characters and test Primogems/Mora.
- Character inventory, weapon equipping and artifact equipping.
- Artifact farming through Domains.
- Character leveling and permanent passive upgrades (ATK / HP / CRIT / SPD).
- CPU Arena using the same combat engine intended to power PvP.
- Speed/initiative-based turns, Normal / Skill / Burst, healing, shields, buffs, debuffs and targeting.
- Battle history and MMR scaffold.

## Setup

```bash
cp .env.example .env
npm install
npm start
```

Set `DISCORD_TOKEN` in `.env` or in Railway Variables. The token must never be committed.

### Discord Developer Portal

Enable **Message Content Intent** for the bot, because the current test entry point is the prefix command `-neverless`.

## Railway

Use Node 20+ and set:

- `DISCORD_TOKEN`
- `GAME_CHANNEL_ID=1539226931319545936`
- `DATA_FILE=./runtime/players.json`

For persistent production data, mount a Railway Volume at `/app/runtime` and set `DATA_FILE=/app/runtime/players.json`. The JSON store is intentionally isolated behind `JsonStore`, so it can later be replaced by PostgreSQL without rewriting the game engine.

## Assets

The prototype references remote game-data image endpoints rather than committing copied image files into this repository. Character/weapon images use `genshin.jmp.blue` routes and artifact icons use Enka-compatible UI asset paths. This keeps assets replaceable and the codebase small.

## Architecture

- `src/data/` — character, weapon, artifact and domain definitions.
- `src/game/` — battle engine, wishing, stats, progression and CPU AI.
- `src/ui/` — Discord embed renderers and components.
- `src/db/` — persistence adapter.
- `src/index.js` — Discord event routing and session state.

## PvP direction

The engine already supports two teams and target selection. The CPU side is intentionally implemented through the same battle engine that a human opponent will use. The next production layer is the queue/draft wrapper: 30-second accept window, snake draft, ownership validation and 15-second action timers. That layer should use a durable queue store such as PostgreSQL or Redis before public rollout.

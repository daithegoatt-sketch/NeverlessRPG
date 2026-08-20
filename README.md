# NeverlessRPG

NeverlessRPG is a Discord-native Genshin-inspired RPG/gacha prototype for the Neverless server. The current build is the **V2 refresh** of the original prototype and is locked to the private test channel by default.

## V2 changes

- `-neverless` now opens or refreshes one persistent **profile panel** instead of creating a new profile every time.
- Opening Wish, Domains, CPU Arena, Characters, Inventory, Artifacts or Upgrades from the persistent profile creates a separate active panel, so the profile remains in the channel.
- New generated PNG theme with a layered dark fantasy background, purple/gold Neverless borders, clearer hierarchy, readable labels and rarity frames.
- Bundled Noto Sans runtime font through `@fontsource/noto-sans` to avoid missing-glyph square boxes in generated images.
- Faster image rendering through raw-asset caching, resized-image caching, Promise de-duplication, concurrent remote image loading and lower PNG compression overhead.
- Profile shows Discord avatar, account level/XP, account PWR, Resin, MMR, official-style Primogem/Mora icons and a configurable character showcase.
- Character showcase can be selected from the Characters screen and survives restarts.
- Character development supports multi-level upgrades and talent levels for Normal / Skill / Burst. Talent levels increase combat multipliers and character PWR.
- Wish UI shows current Primogem balance, 5★/4★ pity, pull costs, visual ten-pull results, names, rarity marks and duplicate state.
- Domains now include recommended PWR, user PWR, team setup, enemy lineup, artifact sets, first-clear Primogem bonuses, clear tracking, fastest-turn tracking and Quick Clear after the first normal clear when PWR is high enough.
- Domain progress, selected profile showcase and UI profile message ID are migrated into existing player saves without resetting accounts.
- Battle cards keep character/enemy names, HP/Energy/SPD, current turn emphasis and talent levels on battle buttons.

## Start

```bash
npm install
npm start
```

Environment variables:

- `DISCORD_TOKEN`
- `GAME_CHANNEL_ID=1539226931319545936`
- `DATA_FILE=/app/runtime/players.json` for Railway persistent storage

Enable **Message Content Intent** because the current entry command is `-neverless`.

## Tests

```bash
npm test
npm run check
```

The V2 test suite covers wishing, CPU battle initialization, multi-level character development, talent upgrades, profile showcase validation and Domain clear/first-clear/Quick Clear progress.

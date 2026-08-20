# NeverlessRPG

NeverlessRPG is a Discord-native mini RPG/gacha built for the Neverless server. The current build is **V4.1** and is locked to the private test channel by default.

## V4.1

- `-neverless` owns one persistent panel per Discord user. Re-running the command refreshes that same panel and old bot panels are cleaned up.
- Profile, Wish, Domains, Characters, Inventory, Artifacts, Upgrades and battles all update the same active message.
- The PNG renderer no longer depends on runtime fonts for important labels. Names, HP values, XP, PWR and resource counts use a built-in vector pixel alphabet so Railway font availability cannot turn them into square glyphs.
- Profile has a programmed dark-fantasy background with stars, moon glow, mountain silhouettes, ruins and purple/gold Neverless framing.
- Profile displays Discord avatar, username, account level, XP bar, account PWR, character count, Resin, MMR, Primogems, Mora and configurable character showcase slots.
- Character cards display Level, role and PWR. Levels, talents, weapon stats and artifacts affect actual combat power.
- Combat roles matter: DPS characters deal bonus damage, Supports heal/buff more and generate team Energy, Tanks take less damage and can draw enemy attacks.
- Balanced DPS + Support + Tank teams gain a starting synergy bonus. Double-DPS and double-Support teams have their own smaller bonuses.
- Domain bonus elements deal extra damage and same-element attacks can be resisted.
- The new starter Domain, **Windrise Training Ground**, costs only 10 Resin and is tuned for a fast starter clear. Automated tests verify a Lv.20 starter roster can clear it quickly and that leveling characters improves clear time.
- Domain progress stores clear count and fastest turn record. Higher PWR can unlock Quick Clear after the first normal clear.
- Wish keeps Primogem balance, 4★/5★ pity, visual pull results, duplicates, Constellations and weapon Refinement.
- Daily rewards, saved roster, weapons, artifacts, pity, Domain history, MMR, showcase and UI panel ID are persisted in the player save file.

## Start

```bash
npm install
npm start
```

Environment variables:

- `DISCORD_TOKEN`
- `GAME_CHANNEL_ID=1539226931319545936`
- `DATA_FILE=/data/players.json` recommended when using a Railway persistent volume

Enable **Message Content Intent** because the entry command is `-neverless`.

For a production deployment, mount a Railway persistent volume and point `DATA_FILE` to that mounted path so player accounts survive service redeploys.

## Tests

```bash
npm test
npm run check
```

The test suite covers wishing, CPU battle initialization, starter-domain pacing and progression value.

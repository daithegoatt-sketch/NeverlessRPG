# Neverless Adventure

Neverless Adventure is the Discord-native RPG/gacha project for the Neverless server. The current build is **V6** and still uses `-neverless` as the entry command in the private test channel.

## V6

- One persistent Discord panel per user. Re-running `-neverless` refreshes the same active message.
- Main identity changed from **Neverless RPG** to **Neverless Adventure**.
- Profile UI was rebuilt with a cleaner layout and a more alive fantasy background: sky, moon, mountains, fog and village silhouettes.
- Profile shows Discord avatar, username, account level, XP bar, PWR, Resin, Primogems, Mora and a configurable showcase of up to 8 owned characters.
- Resin now has a 180 cap and regenerates automatically at 1 Resin every 8 minutes.
- Domain UI was rebuilt with cleaner spacing, visible enemy tiles/fallbacks, reward previews and domain-specific purposes.
- Starter Windrise Training Ground remains fast and forgiving. Later Domains scale into artifact, talent-book and mixed farming routes.
- Domain rewards can now drop multiple artifacts, Level Books and Talent Books in addition to Mora and Primogems.
- Character leveling now consumes both Mora and Level Books.
- Talent upgrading now consumes both Mora and Talent Books.
- Inventory UI shows Primogems, Mora, Resin, Level Books, Talent Books, weapons and collection totals.
- Character detail UI shows the PNG portrait, 5 artifact slots, equipped weapon, stats, PWR, role value and skill names.
- Showcase characters can be selected from the owned roster.
- Combat buttons use the actual skill names instead of generic Normal/Skill/Burst labels.
- Added an Energy-based **Double Skill / Combo** action for more active combat decisions.
- Battle cards show HP, Energy, hit target emphasis, damage text and centered victory rewards.
- Victory reward panel summarizes Mora, artifact count, Level Books and Talent Books.
- DPS, Support and Tank roles continue to affect real battle calculations.
- Wish, Domains, Characters, Inventory, Artifacts, Upgrades and battles all continue to update the same persistent panel.

## Start

```bash
npm install
npm start
```

Required environment variable:

```env
DISCORD_TOKEN=your_bot_token
```

The test-channel lock and command prefix remain configured in `src/config/constants.js`.

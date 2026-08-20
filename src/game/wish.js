import { WISH_COST, PITY } from '../config/constants.js';
import { fourStarCharacters, fiveStarCharacters } from '../data/characters.js';
import { threeStarWeapons, fourStarWeapons, fiveStarWeapons } from '../data/weapons.js';

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

function fiveRate(pity) {
  if (pity + 1 >= PITY.fiveStarHard) return 1;
  if (pity + 1 < PITY.fiveStarSoft) return 0.006;
  return Math.min(1, 0.006 + (pity + 1 - PITY.fiveStarSoft + 1) * 0.06);
}

function fourRate(pityFour) {
  if (pityFour + 1 >= PITY.fourStarHard) return 1;
  return 0.051;
}

function grant(player, kind, id) {
  if (kind === 'character') {
    if (!player.characters[id]) {
      player.characters[id] = { id, level: 1, constellation: 0, weaponId: null, artifactIds: [] };
      return { duplicate: false };
    }
    player.characters[id].constellation = Math.min(6, player.characters[id].constellation + 1);
    player.mora += 5000;
    return { duplicate: true };
  }

  if (!player.weapons[id]) player.weapons[id] = { id, copies: 1, level: 1, refinement: 1 };
  else {
    player.weapons[id].copies += 1;
    player.weapons[id].refinement = Math.min(5, player.weapons[id].refinement + 1);
  }
  return { duplicate: player.weapons[id].copies > 1 };
}

export function performWishes(player, banner, count, rng = Math.random) {
  const totalCost = WISH_COST * count;
  if (player.primogems < totalCost) throw new Error('NOT_ENOUGH_PRIMOGEMS');
  player.primogems -= totalCost;
  const results = [];

  for (let i = 0; i < count; i += 1) {
    const pityKey = banner === 'weapon' ? 'weapon' : 'character';
    const fourKey = banner === 'weapon' ? 'weaponFour' : 'characterFour';
    let rarity = 3;

    if (rng() < fiveRate(player.pity[pityKey])) rarity = 5;
    else if (rng() < fourRate(player.pity[fourKey])) rarity = 4;

    player.pity[pityKey] += 1;
    player.pity[fourKey] += 1;

    let kind;
    let id;
    if (rarity === 5) {
      player.pity[pityKey] = 0;
      player.pity[fourKey] = 0;
      if (banner === 'weapon') {
        kind = 'weapon';
        id = pick(fiveStarWeapons, rng);
      } else {
        kind = 'character';
        id = pick(fiveStarCharacters, rng);
      }
    } else if (rarity === 4) {
      player.pity[fourKey] = 0;
      if (banner === 'weapon' || rng() < 0.5) {
        kind = 'weapon';
        id = pick(fourStarWeapons, rng);
      } else {
        kind = 'character';
        id = pick(fourStarCharacters, rng);
      }
    } else {
      kind = 'weapon';
      id = pick(threeStarWeapons, rng);
    }

    const grantMeta = grant(player, kind, id);
    const item = { kind, id, rarity, ...grantMeta, at: Date.now() };
    results.push(item);
    player.history.wishes.unshift({ banner, ...item });
    player.history.wishes = player.history.wishes.slice(0, 100);
  }
  return results;
}

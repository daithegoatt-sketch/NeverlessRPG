import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { artifactSets } from '../data/artifacts.js';

const add = (a, b) => (a || 0) + (b || 0);
const pctValue = (v) => (typeof v === 'number' ? v : 0);

export function buildCharacterStats(player, charId) {
  const baseDef = characters[charId];
  const owned = player.characters[charId];
  if (!baseDef || !owned) return null;

  const levelScale = 1 + Math.max(0, owned.level - 1) * 0.035;
  const stats = {
    hp: Math.round(baseDef.base.hp * levelScale),
    atk: Math.round(baseDef.base.atk * levelScale),
    def: Math.round(baseDef.base.def * (1 + Math.max(0, owned.level - 1) * 0.02)),
    spd: baseDef.base.spd,
    critRate: baseDef.base.critRate,
    critDmg: baseDef.base.critDmg,
    elementDmg: 0,
  };

  const pct = { hpPct: 0, atkPct: 0 };
  const flat = { hpFlat: 0, atkFlat: 0 };

  const weapon = owned.weaponId ? weapons[owned.weaponId] : null;
  if (weapon) {
    stats.atk += weapon.atk + Math.max(0, (player.weapons[weapon.id]?.level || 1) - 1) * 2;
    for (const [k, v] of Object.entries(weapon.bonus || {})) {
      if (k in pct) pct[k] += v;
      else stats[k] = add(stats[k], v);
    }
  }

  const setCounts = {};
  for (const aid of owned.artifactIds || []) {
    const art = player.artifacts[aid];
    if (!art) continue;
    setCounts[art.setId] = (setCounts[art.setId] || 0) + 1;
    const mainScale = 1 + art.level * 0.12;
    const { key, value } = art.main;
    if (key in pct) pct[key] += value * mainScale;
    else if (key in flat) flat[key] += value * mainScale;
    else stats[key] = add(stats[key], value * mainScale);
    for (const [k, v] of Object.entries(art.subs || {})) {
      if (k in pct) pct[k] += v;
      else stats[k] = add(stats[k], v);
    }
  }

  for (const [setId, count] of Object.entries(setCounts)) {
    if (count < 2) continue;
    const bonus = artifactSets[setId]?.twoPiece || {};
    for (const [k, v] of Object.entries(bonus)) {
      if (k in pct) pct[k] += v;
      else stats[k] = add(stats[k], v);
    }
  }

  stats.hp = Math.round((stats.hp + flat.hpFlat) * (1 + pct.hpPct) * (1 + (player.passive.hp || 0) * 0.01));
  stats.atk = Math.round((stats.atk + flat.atkFlat) * (1 + pct.atkPct) * (1 + (player.passive.atk || 0) * 0.01));
  stats.spd += player.passive.spd || 0;
  stats.critRate = Math.min(0.95, stats.critRate + (player.passive.critRate || 0) * 0.01);
  stats.critDmg += (player.passive.critDmg || 0) * 0.02;

  return { definition: baseDef, owned, stats };
}

export function characterPower(player, charId) {
  const built = buildCharacterStats(player, charId);
  if (!built) return 0;
  const { stats, owned, definition } = built;
  const weapon = owned.weaponId ? weapons[owned.weaponId] : null;
  const artifactScore = (owned.artifactIds || []).reduce((sum, id) => {
    const a = player.artifacts[id];
    if (!a) return sum;
    const subs = Object.values(a.subs || {}).reduce((s, v) => s + (typeof v === 'number' ? Math.abs(v) : 0), 0);
    return sum + a.rarity * 120 + a.level * 34 + Math.round(subs * 420);
  }, 0);
  const gear = (weapon?.rarity || 0) * 230 + (player.weapons[weapon?.id]?.level || 0) * 16 + artifactScore;
  const combat = stats.atk * 4.2 + stats.hp * 0.34 + stats.def * 1.25 + stats.spd * 7.5
    + pctValue(stats.critRate) * 2100 + pctValue(stats.critDmg) * 850;
  const progression = owned.level * 58 + owned.constellation * 280 + definition.rarity * 350;
  return Math.max(1, Math.round(combat + gear + progression));
}

export function calculatePlayerPower(player) {
  const powers = Object.keys(player.characters).map((id) => characterPower(player, id)).sort((a, b) => b - a);
  const topFour = powers.slice(0, 4).reduce((a, b) => a + b, 0);
  const bench = powers.slice(4).reduce((a, b) => a + Math.round(b * 0.08), 0);
  const permanent = Object.values(player.passive || {}).reduce((a, b) => a + Number(b || 0), 0) * 75;
  return Math.round(topFour + bench + permanent);
}

export function playerLevelInfo(player) {
  const maxLevel = 20;
  const xp = Math.max(0, player.adventureXp || 0);
  let level = 1;
  let spent = 0;
  while (level < maxLevel) {
    const need = 400 + level * 180;
    if (xp < spent + need) break;
    spent += need;
    level += 1;
  }
  const nextNeed = level >= maxLevel ? 0 : 400 + level * 180;
  const currentXp = level >= maxLevel ? 0 : xp - spent;
  return {
    level,
    maxLevel,
    currentXp,
    nextNeed,
    progress: level >= maxLevel ? 1 : Math.max(0, Math.min(1, currentXp / nextNeed)),
  };
}

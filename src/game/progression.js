import { artifactSets, generateArtifact } from '../data/artifacts.js';
import { domains } from '../data/domains.js';

const DAY = 86_400_000;

export function characterLevelCost(level) {
  return 2500 + Math.max(1, level) * 450;
}

export function talentUpgradeCost(level) {
  return 12000 + Math.max(1, level) * 6500;
}

export function grantDomainRewards(player, domainId, rng = Math.random, options = {}) {
  const domain = domains[domainId];
  if (!domain) return null;
  player.domainProgress ||= {};
  const progress = player.domainProgress[domainId] ||= { clears: 0, fastestTurns: null, quickClears: 0 };
  const firstClear = progress.clears === 0;
  const [min,max] = domain.rewards.mora;
  const mora = Math.floor(min + (max-min+1)*rng());
  const setId = domain.setIds[Math.floor(rng()*domain.setIds.length)];
  const rarity = domain.level >= 3 ? 5 : (rng() < 0.72 ? 5 : 4);
  const artifact = generateArtifact(setId,rarity,rng);
  const basePrimos = domain.rewards.primogems;
  const firstClearBonus = firstClear ? (domain.firstClearPrimogems || 40) : 0;
  const primogems = basePrimos + firstClearBonus;
  const adventureXp = domain.rewards.adventureXp || 100;

  player.mora += mora;
  player.primogems += primogems;
  player.artifacts[artifact.id] = artifact;
  player.adventureXp += adventureXp;

  progress.clears += 1;
  if (options.quick) progress.quickClears += 1;
  if (Number.isFinite(options.turns)) progress.fastestTurns = progress.fastestTurns == null ? options.turns : Math.min(progress.fastestTurns, options.turns);
  progress.lastClearAt = Date.now();

  return { mora, primogems, basePrimos, firstClearBonus, adventureXp, artifact, set: artifactSets[setId], clears: progress.clears };
}

export function levelCharacter(player, charId, amount = 1) {
  const owned = player.characters[charId];
  if (!owned) return { ok:false, reason:'NOT_OWNED' };
  const requested = Math.max(1, Math.min(10, Number(amount) || 1));
  if (owned.level >= 90) return { ok:false, reason:'MAX_LEVEL' };
  let levels = 0;
  let totalCost = 0;
  for (let i = 0; i < requested && owned.level + levels < 90; i += 1) {
    totalCost += characterLevelCost(owned.level + levels);
    levels += 1;
  }
  if (player.mora < totalCost) return { ok:false, reason:'NO_MORA', cost:totalCost };
  player.mora -= totalCost;
  owned.level += levels;
  player.adventureXp += 12 * levels;
  return { ok:true, cost:totalCost, level:owned.level, levels };
}

export function upgradeTalent(player, charId, talent) {
  const owned = player.characters[charId];
  if (!owned) return { ok:false, reason:'NOT_OWNED' };
  if (!['normal','skill','burst'].includes(talent)) return { ok:false, reason:'INVALID_TALENT' };
  owned.talents ||= { normal:1, skill:1, burst:1 };
  const current = owned.talents[talent] || 1;
  if (current >= 10) return { ok:false, reason:'TALENT_MAX' };
  const cost = talentUpgradeCost(current);
  if (player.mora < cost) return { ok:false, reason:'NO_MORA', cost };
  player.mora -= cost;
  owned.talents[talent] = current + 1;
  player.adventureXp += 24;
  return { ok:true, cost, level:owned.talents[talent] };
}

export function setShowcase(player, ids) {
  const owned = new Set(Object.keys(player.characters || {}));
  const unique = [...new Set(ids || [])].filter((id) => owned.has(id)).slice(0, 10);
  if (!unique.length) return { ok:false, reason:'EMPTY_SHOWCASE' };
  player.showcase = unique;
  return { ok:true, showcase:unique };
}

export function claimDaily(player, now = Date.now()) {
  player.daily ||= { lastClaimAt: 0, streak: 0 };
  if (player.daily.lastClaimAt && now - player.daily.lastClaimAt < DAY) {
    return { ok:false, reason:'DAILY_ALREADY_CLAIMED', nextAt:player.daily.lastClaimAt + DAY };
  }
  const continued = player.daily.lastClaimAt && now - player.daily.lastClaimAt < DAY * 2;
  player.daily.streak = continued ? Math.min(7, (player.daily.streak || 0) + 1) : 1;
  player.daily.lastClaimAt = now;
  const primogems = 160 + player.daily.streak * 20;
  const mora = 12000 + player.daily.streak * 2000;
  const resin = 20;
  player.primogems += primogems;
  player.mora += mora;
  player.resin = Math.min(160, player.resin + resin);
  player.adventureXp += 80;
  return { ok:true, primogems, mora, resin, streak:player.daily.streak };
}

export function upgradePassive(player, stat) {
  const valid = ['atk','hp','critRate','critDmg','spd'];
  if (!valid.includes(stat)) return { ok:false, reason:'INVALID_STAT' };
  const current = player.passive[stat] || 0;
  const caps = { atk:20, hp:20, critRate:15, critDmg:15, spd:20 };
  if (current >= caps[stat]) return { ok:false, reason:'CAP' };
  const cost = 5000 + current * 2500;
  if (player.mora < cost) return { ok:false, reason:'NO_MORA', cost };
  player.mora -= cost;
  player.passive[stat] = current + 1;
  player.adventureXp += 8;
  return { ok:true, cost, level:player.passive[stat] };
}

export function equipWeapon(player, charId, weaponId) {
  const char = player.characters[charId];
  const weapon = player.weapons[weaponId];
  if (!char || !weapon) return { ok:false, reason:'NOT_OWNED' };
  char.weaponId = weaponId;
  return { ok:true };
}

export function equipArtifact(player, charId, artifactId) {
  const char = player.characters[charId];
  const artifact = player.artifacts[artifactId];
  if (!char || !artifact) return { ok:false, reason:'NOT_OWNED' };
  for (const oldId of [...(char.artifactIds || [])]) {
    const old = player.artifacts[oldId];
    if (old?.slot === artifact.slot) {
      old.equippedTo = null;
      char.artifactIds = char.artifactIds.filter((id) => id !== oldId);
    }
  }
  if (artifact.equippedTo && player.characters[artifact.equippedTo]) {
    const previous = player.characters[artifact.equippedTo];
    previous.artifactIds = previous.artifactIds.filter((id) => id !== artifact.id);
  }
  artifact.equippedTo = charId;
  if (!char.artifactIds.includes(artifact.id)) char.artifactIds.push(artifact.id);
  return { ok:true };
}

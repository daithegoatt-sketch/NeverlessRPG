import { artifactSets, generateArtifact } from '../data/artifacts.js';
import { domains } from '../data/domains.js';

export function grantDomainRewards(player, domainId, rng = Math.random) {
  const domain = domains[domainId];
  if (!domain) return null;
  const [min,max] = domain.rewards.mora;
  const mora = Math.floor(min + (max-min+1)*rng());
  const setId = domain.setIds[Math.floor(rng()*domain.setIds.length)];
  const artifact = generateArtifact(setId,5,rng);
  player.mora += mora;
  player.primogems += domain.rewards.primogems;
  player.artifacts[artifact.id] = artifact;
  player.adventureXp += domain.rewards.adventureXp || 100;
  return { mora, primogems:domain.rewards.primogems, adventureXp:domain.rewards.adventureXp || 100, artifact, set:artifactSets[setId] };
}

export function levelCharacter(player, charId) {
  const owned = player.characters[charId];
  if (!owned) return { ok:false, reason:'NOT_OWNED' };
  if (owned.level >= 90) return { ok:false, reason:'MAX_LEVEL' };
  const cost = 2500 + owned.level * 450;
  if (player.mora < cost) return { ok:false, reason:'NO_MORA', cost };
  player.mora -= cost;
  owned.level += 1;
  player.adventureXp += 12;
  return { ok:true, cost, level:owned.level };
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

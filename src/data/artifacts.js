export const artifactSets = {
  gladiator: {
    id: 'gladiator', name: "Gladiator's Finale", twoPiece: { atkPct: 0.18 },
    image: 'https://enka.network/ui/UI_RelicIcon_15001_4.png',
  },
  wanderer: {
    id: 'wanderer', name: "Wanderer's Troupe", twoPiece: { critDmg: 0.12 },
    image: 'https://enka.network/ui/UI_RelicIcon_15002_4.png',
  },
};

export const artifactSlots = ['Flower', 'Plume', 'Sands', 'Goblet', 'Circlet'];

const mainStats = {
  Flower: ['hpFlat'],
  Plume: ['atkFlat'],
  Sands: ['atkPct', 'hpPct', 'spd'],
  Goblet: ['atkPct', 'hpPct', 'elementDmg'],
  Circlet: ['critRate', 'critDmg', 'atkPct', 'hpPct'],
};

const subStats = ['atkPct', 'hpPct', 'critRate', 'critDmg', 'spd'];

const ranges = {
  atkPct: [0.045, 0.07], hpPct: [0.045, 0.07], critRate: [0.025, 0.04], critDmg: [0.05, 0.08], spd: [2, 5],
  hpFlat: [180, 300], atkFlat: [12, 22], elementDmg: [0.045, 0.07],
};

const rand = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];
const roll = ([min, max], rng = Math.random) => Number((min + (max - min) * rng()).toFixed(3));

export function generateArtifact(setId, rarity = 5, rng = Math.random) {
  const slot = rand(artifactSlots, rng);
  const mainKey = rand(mainStats[slot], rng);
  const subs = {};
  const pool = subStats.filter((s) => s !== mainKey).sort(() => rng() - 0.5).slice(0, rarity === 5 ? 4 : 3);
  for (const key of pool) subs[key] = roll(ranges[key], rng);

  return {
    id: `a_${Date.now()}_${Math.floor(rng() * 1e8)}`,
    setId,
    slot,
    rarity,
    level: 0,
    main: { key: mainKey, value: roll(ranges[mainKey], rng) * (rarity === 5 ? 1.3 : 1) },
    subs,
    equippedTo: null,
  };
}

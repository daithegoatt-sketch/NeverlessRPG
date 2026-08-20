const img = (slug) => `https://genshin.jmp.blue/weapons/${slug}/icon`;

export const weapons = {
  slingshot: { id: 'slingshot', name: 'Slingshot', rarity: 3, type: 'Bow', atk: 38, bonus: { critRate: 0.06 }, image: img('slingshot') },
  'harbinger-of-dawn': { id: 'harbinger-of-dawn', name: 'Harbinger of Dawn', rarity: 3, type: 'Sword', atk: 39, bonus: { critDmg: 0.08 }, image: img('harbinger-of-dawn') },
  'thrilling-tales-of-dragon-slayers': { id: 'thrilling-tales-of-dragon-slayers', name: 'Thrilling Tales of Dragon Slayers', rarity: 3, type: 'Catalyst', atk: 38, bonus: { hpPct: 0.08 }, image: img('thrilling-tales-of-dragon-slayers') },
  'cool-steel': { id: 'cool-steel', name: 'Cool Steel', rarity: 3, type: 'Sword', atk: 39, bonus: { atkPct: 0.06 }, image: img('cool-steel') },
  'white-tassel': { id: 'white-tassel', name: 'White Tassel', rarity: 3, type: 'Polearm', atk: 39, bonus: { critRate: 0.06 }, image: img('white-tassel') },
  'debate-club': { id: 'debate-club', name: 'Debate Club', rarity: 3, type: 'Claymore', atk: 40, bonus: { atkPct: 0.06 }, image: img('debate-club') },

  'favonius-sword': { id: 'favonius-sword', name: 'Favonius Sword', rarity: 4, type: 'Sword', atk: 46, bonus: { spd: 4 }, image: img('favonius-sword') },
  'the-widsith': { id: 'the-widsith', name: 'The Widsith', rarity: 4, type: 'Catalyst', atk: 45, bonus: { critDmg: 0.15 }, image: img('the-widsith') },
  rust: { id: 'rust', name: 'Rust', rarity: 4, type: 'Bow', atk: 46, bonus: { atkPct: 0.12 }, image: img('rust') },
  'dragons-bane': { id: 'dragons-bane', name: "Dragon's Bane", rarity: 4, type: 'Polearm', atk: 45, bonus: { atkPct: 0.10 }, image: img('dragons-bane') },
  'sacrificial-greatsword': { id: 'sacrificial-greatsword', name: 'Sacrificial Greatsword', rarity: 4, type: 'Claymore', atk: 44, bonus: { hpPct: 0.08 }, image: img('sacrificial-greatsword') },

  'staff-of-homa': { id: 'staff-of-homa', name: 'Staff of Homa', rarity: 5, type: 'Polearm', atk: 61, bonus: { critDmg: 0.22, hpPct: 0.08 }, image: img('staff-of-homa') },
  'engulfing-lightning': { id: 'engulfing-lightning', name: 'Engulfing Lightning', rarity: 5, type: 'Polearm', atk: 62, bonus: { atkPct: 0.16, spd: 3 }, image: img('engulfing-lightning') },
  'kaguras-verity': { id: 'kaguras-verity', name: "Kagura's Verity", rarity: 5, type: 'Catalyst', atk: 60, bonus: { critDmg: 0.24 }, image: img('kaguras-verity') },
  'aqua-simulacra': { id: 'aqua-simulacra', name: 'Aqua Simulacra', rarity: 5, type: 'Bow', atk: 58, bonus: { critDmg: 0.25, hpPct: 0.06 }, image: img('aqua-simulacra') },
  'primordial-jade-cutter': { id: 'primordial-jade-cutter', name: 'Primordial Jade Cutter', rarity: 5, type: 'Sword', atk: 60, bonus: { critRate: 0.18, hpPct: 0.06 }, image: img('primordial-jade-cutter') },
};

export const threeStarWeapons = Object.values(weapons).filter((w) => w.rarity === 3).map((w) => w.id);
export const fourStarWeapons = Object.values(weapons).filter((w) => w.rarity === 4).map((w) => w.id);
export const fiveStarWeapons = Object.values(weapons).filter((w) => w.rarity === 5).map((w) => w.id);

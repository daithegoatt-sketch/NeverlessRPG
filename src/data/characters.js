const img = (slug, type = 'card') => `https://genshin.jmp.blue/characters/${slug}/${type}`;

export const characters = {
  amber: {
    id: 'amber', name: 'Amber', rarity: 4, element: 'Pyro', weaponType: 'Bow', role: 'DPS',
    image: img('amber'), icon: img('amber', 'icon'), base: { hp: 920, atk: 52, def: 60, spd: 108, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Sharpshooter', type: 'damage', multiplier: 1.00, energy: 20 },
      skill: { name: 'Explosive Puppet', type: 'damage', multiplier: 1.65, energy: 35, cooldown: 1 },
      burst: { name: 'Fiery Rain', type: 'damage', multiplier: 2.55, cost: 80 },
    },
  },
  kaeya: {
    id: 'kaeya', name: 'Kaeya', rarity: 4, element: 'Cryo', weaponType: 'Sword', role: 'DPS',
    image: img('kaeya'), icon: img('kaeya', 'icon'), base: { hp: 1050, atk: 55, def: 66, spd: 112, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Ceremonial Bladework', type: 'damage', multiplier: 1.05, energy: 20 },
      skill: { name: 'Frostgnaw', type: 'damage', multiplier: 1.70, energy: 35, cooldown: 1 },
      burst: { name: 'Glacial Waltz', type: 'damage', multiplier: 2.45, cost: 80 },
    },
  },
  lisa: {
    id: 'lisa', name: 'Lisa', rarity: 4, element: 'Electro', weaponType: 'Catalyst', role: 'DPS',
    image: img('lisa'), icon: img('lisa', 'icon'), base: { hp: 900, atk: 58, def: 55, spd: 103, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Lightning Touch', type: 'damage', multiplier: 1.05, energy: 20 },
      skill: { name: 'Violet Arc', type: 'damage', multiplier: 1.85, energy: 35, cooldown: 1 },
      burst: { name: 'Lightning Rose', type: 'damage', multiplier: 2.60, cost: 80 },
    },
  },
  barbara: {
    id: 'barbara', name: 'Barbara', rarity: 4, element: 'Hydro', weaponType: 'Catalyst', role: 'Support',
    image: img('barbara'), icon: img('barbara', 'icon'), base: { hp: 1150, atk: 42, def: 62, spd: 99, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Whisper of Water', type: 'damage', multiplier: 0.80, energy: 20 },
      skill: { name: 'Let the Show Begin', type: 'heal', multiplier: 0.28, energy: 40, cooldown: 1 },
      burst: { name: 'Shining Miracle', type: 'teamHeal', multiplier: 0.42, cost: 80 },
    },
  },
  xiangling: {
    id: 'xiangling', name: 'Xiangling', rarity: 4, element: 'Pyro', weaponType: 'Polearm', role: 'DPS',
    image: img('xiangling'), icon: img('xiangling', 'icon'), base: { hp: 980, atk: 57, def: 63, spd: 111, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Dough-Fu', type: 'damage', multiplier: 1.00, energy: 20 },
      skill: { name: 'Guoba Attack', type: 'damage', multiplier: 1.60, energy: 35, cooldown: 1 },
      burst: { name: 'Pyronado', type: 'damage', multiplier: 2.75, cost: 80 },
    },
  },
  bennett: {
    id: 'bennett', name: 'Bennett', rarity: 4, element: 'Pyro', weaponType: 'Sword', role: 'Support',
    image: img('bennett'), icon: img('bennett', 'icon'), base: { hp: 1080, atk: 50, def: 65, spd: 109, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Strike of Fortune', type: 'damage', multiplier: 0.95, energy: 20 },
      skill: { name: 'Passion Overload', type: 'damage', multiplier: 1.55, energy: 40, cooldown: 1 },
      burst: { name: 'Fantastic Voyage', type: 'teamBuffHeal', multiplier: 0.28, cost: 80 },
    },
  },
  fischl: {
    id: 'fischl', name: 'Fischl', rarity: 4, element: 'Electro', weaponType: 'Bow', role: 'DPS',
    image: img('fischl'), icon: img('fischl', 'icon'), base: { hp: 930, atk: 61, def: 57, spd: 114, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Bolts of Downfall', type: 'damage', multiplier: 1.05, energy: 20 },
      skill: { name: 'Nightrider', type: 'damage', multiplier: 1.72, energy: 35, cooldown: 1 },
      burst: { name: 'Midnight Phantasmagoria', type: 'damage', multiplier: 2.35, cost: 80 },
    },
  },
  noelle: {
    id: 'noelle', name: 'Noelle', rarity: 4, element: 'Geo', weaponType: 'Claymore', role: 'Tank',
    image: img('noelle'), icon: img('noelle', 'icon'), base: { hp: 1200, atk: 48, def: 78, spd: 92, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Favonius Bladework', type: 'damage', multiplier: 1.08, energy: 20 },
      skill: { name: 'Breastplate', type: 'shield', multiplier: 0.30, energy: 35, cooldown: 1 },
      burst: { name: 'Sweeping Time', type: 'damage', multiplier: 2.20, cost: 80 },
    },
  },
  xingqiu: {
    id: 'xingqiu', name: 'Xingqiu', rarity: 4, element: 'Hydro', weaponType: 'Sword', role: 'Support',
    image: img('xingqiu'), icon: img('xingqiu', 'icon'), base: { hp: 1000, atk: 55, def: 68, spd: 110, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Guhua Style', type: 'damage', multiplier: 0.98, energy: 20 },
      skill: { name: 'Fatal Rainscreen', type: 'damageShield', multiplier: 1.45, energy: 40, cooldown: 1 },
      burst: { name: 'Raincutter', type: 'teamBuff', multiplier: 0.24, cost: 80 },
    },
  },
  sucrose: {
    id: 'sucrose', name: 'Sucrose', rarity: 4, element: 'Anemo', weaponType: 'Catalyst', role: 'Support',
    image: img('sucrose'), icon: img('sucrose', 'icon'), base: { hp: 920, atk: 50, def: 58, spd: 113, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Wind Spirit Creation', type: 'damage', multiplier: 0.92, energy: 20 },
      skill: { name: 'Astable Anemohypostasis', type: 'damageDebuff', multiplier: 1.40, energy: 40, cooldown: 1 },
      burst: { name: 'Forbidden Creation', type: 'damageDebuff', multiplier: 2.10, cost: 80 },
    },
  },
  razor: {
    id: 'razor', name: 'Razor', rarity: 4, element: 'Electro', weaponType: 'Claymore', role: 'DPS',
    image: img('razor'), icon: img('razor', 'icon'), base: { hp: 1050, atk: 62, def: 62, spd: 106, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Steel Fang', type: 'damage', multiplier: 1.12, energy: 20 },
      skill: { name: 'Claw and Thunder', type: 'damage', multiplier: 1.70, energy: 40, cooldown: 1 },
      burst: { name: 'Lightning Fang', type: 'damage', multiplier: 2.65, cost: 80 },
    },
  },
  'raiden-shogun': {
    id: 'raiden-shogun', name: 'Raiden Shogun', rarity: 5, element: 'Electro', weaponType: 'Polearm', role: 'DPS',
    image: img('raiden-shogun'), icon: img('raiden-shogun', 'icon'), base: { hp: 1220, atk: 72, def: 70, spd: 116, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Origin', type: 'damage', multiplier: 1.08, energy: 25 },
      skill: { name: 'Transcendence: Baleful Omen', type: 'damageTeamBuff', multiplier: 1.70, energy: 45, cooldown: 1 },
      burst: { name: 'Secret Art: Musou Shinsetsu', type: 'damage', multiplier: 3.25, cost: 90 },
    },
  },
  'yae-miko': {
    id: 'yae-miko', name: 'Yae Miko', rarity: 5, element: 'Electro', weaponType: 'Catalyst', role: 'DPS',
    image: img('yae-miko'), icon: img('yae-miko', 'icon'), base: { hp: 1060, atk: 79, def: 55, spd: 118, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Spiritfox Sin-Eater', type: 'damage', multiplier: 1.05, energy: 25 },
      skill: { name: 'Yakan Evocation', type: 'damage', multiplier: 1.90, energy: 45, cooldown: 1 },
      burst: { name: 'Great Secret Art: Tenko Kenshin', type: 'damage', multiplier: 3.35, cost: 90 },
    },
  },
  furina: {
    id: 'furina', name: 'Furina', rarity: 5, element: 'Hydro', weaponType: 'Sword', role: 'Support',
    image: img('furina'), icon: img('furina', 'icon'), base: { hp: 1350, atk: 60, def: 62, spd: 121, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: "Soloist's Solicitation", type: 'damage', multiplier: 0.92, energy: 25 },
      skill: { name: 'Salon Solitaire', type: 'damage', multiplier: 1.80, energy: 45, cooldown: 1 },
      burst: { name: 'Let the People Rejoice', type: 'teamBuffHeal', multiplier: 0.35, cost: 90 },
    },
  },
  nahida: {
    id: 'nahida', name: 'Nahida', rarity: 5, element: 'Dendro', weaponType: 'Catalyst', role: 'Support',
    image: img('nahida'), icon: img('nahida', 'icon'), base: { hp: 1080, atk: 68, def: 60, spd: 117, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Akara', type: 'damage', multiplier: 0.98, energy: 25 },
      skill: { name: 'All Schemes to Know', type: 'damageDebuff', multiplier: 1.70, energy: 45, cooldown: 1 },
      burst: { name: 'Illusory Heart', type: 'teamBuff', multiplier: 0.30, cost: 90 },
    },
  },
  hutao: {
    id: 'hutao', name: 'Hu Tao', rarity: 5, element: 'Pyro', weaponType: 'Polearm', role: 'DPS',
    image: img('hutao'), icon: img('hutao', 'icon'), base: { hp: 1320, atk: 76, def: 65, spd: 115, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Secret Spear of Wangsheng', type: 'damage', multiplier: 1.10, energy: 25 },
      skill: { name: 'Guide to Afterlife', type: 'selfBuffDamage', multiplier: 1.95, energy: 45, cooldown: 1 },
      burst: { name: 'Spirit Soother', type: 'damageHeal', multiplier: 3.00, cost: 90 },
    },
  },
  zhongli: {
    id: 'zhongli', name: 'Zhongli', rarity: 5, element: 'Geo', weaponType: 'Polearm', role: 'Tank',
    image: img('zhongli'), icon: img('zhongli', 'icon'), base: { hp: 1450, atk: 64, def: 80, spd: 96, critRate: 0.05, critDmg: 0.50 },
    skills: {
      normal: { name: 'Rain of Stone', type: 'damage', multiplier: 1.00, energy: 25 },
      skill: { name: 'Dominus Lapidis', type: 'shield', multiplier: 0.42, energy: 45, cooldown: 1 },
      burst: { name: 'Planet Befall', type: 'damageDebuff', multiplier: 3.10, cost: 90 },
    },
  },
};

export const fourStarCharacters = Object.values(characters).filter((c) => c.rarity === 4).map((c) => c.id);
export const fiveStarCharacters = Object.values(characters).filter((c) => c.rarity === 5).map((c) => c.id);

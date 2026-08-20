const img = (slug, type = 'card') => `https://genshin.jmp.blue/characters/${slug}/${type}`;

const kit = ({ normal, skill, burst }) => ({
  normal: {
    name: normal.name,
    type: normal.type || 'damage',
    multiplier: normal.multiplier ?? 1,
    energy: normal.energy ?? 20,
    description: normal.description || `Deals ${(normal.multiplier ?? 1).toFixed(2)}× ATK as damage.`,
  },
  skill: {
    name: skill.name,
    type: skill.type || 'damage',
    multiplier: skill.multiplier ?? 1.6,
    energy: skill.energy ?? 35,
    cooldown: skill.cooldown ?? 1,
    description: skill.description || `Uses the Elemental Skill for ${(skill.multiplier ?? 1.6).toFixed(2)}× scaling.`,
  },
  burst: {
    name: burst.name,
    type: burst.type || 'damage',
    multiplier: burst.multiplier ?? 2.5,
    cost: burst.cost ?? 80,
    description: burst.description || `Consumes Energy to use the Elemental Burst with ${(burst.multiplier ?? 2.5).toFixed(2)}× scaling.`,
  },
});

function make({ id, name, rarity, element, weaponType, role = 'DPS', hp, atk, def, spd, skills }) {
  return {
    id, name, rarity, element, weaponType, role,
    image: img(id), icon: img(id, 'icon'),
    base: { hp, atk, def, spd, critRate: 0.05, critDmg: 0.50 },
    skills: kit(skills),
  };
}

const n = (name, multiplier = 1, description) => ({ name, multiplier, description });
const s = (name, multiplier = 1.65, type = 'damage', description, energy = 35, cooldown = 1) => ({ name, multiplier, type, description, energy, cooldown });
const b = (name, multiplier = 2.6, type = 'damage', description, cost = 80) => ({ name, multiplier, type, description, cost });

export const characters = {
  amber: make({ id:'amber', name:'Amber', rarity:4, element:'Pyro', weaponType:'Bow', hp:920, atk:52, def:60, spd:108, skills:{
    normal:n('Sharpshooter',1.00,'Fires a precise shot for 1.00× ATK.'),
    skill:s('Explosive Puppet',1.65,'damage','Throws Baron Bunny and detonates it for 1.65× ATK Pyro damage.'),
    burst:b('Fiery Rain',2.55,'damage','Rains flaming arrows over the target for 2.55× ATK Pyro damage.'),
  }}),
  kaeya: make({ id:'kaeya', name:'Kaeya', rarity:4, element:'Cryo', weaponType:'Sword', hp:1050, atk:55, def:66, spd:112, skills:{
    normal:n('Ceremonial Bladework',1.05), skill:s('Frostgnaw',1.70,'damage','Deals 1.70× ATK Cryo damage and generates extra Energy.'), burst:b('Glacial Waltz',2.45,'damage','Summons orbiting icicles for 2.45× ATK Cryo damage.'),
  }}),
  lisa: make({ id:'lisa', name:'Lisa', rarity:4, element:'Electro', weaponType:'Catalyst', hp:900, atk:58, def:55, spd:103, skills:{
    normal:n('Lightning Touch',1.05), skill:s('Violet Arc',1.85,'damageDebuff','Deals 1.85× ATK Electro damage and increases damage taken by the target.'), burst:b('Lightning Rose',2.60,'damageDebuff','Deals 2.60× ATK Electro damage and leaves the target vulnerable.'),
  }}),
  barbara: make({ id:'barbara', name:'Barbara', rarity:4, element:'Hydro', weaponType:'Catalyst', role:'Support', hp:1150, atk:42, def:62, spd:99, skills:{
    normal:n('Whisper of Water',0.80), skill:s('Let the Show Begin',0.28,'heal','Heals one ally for 28% of their Max HP.'), burst:b('Shining Miracle',0.42,'teamHeal','Restores 42% Max HP to every living ally.'),
  }}),
  xiangling: make({ id:'xiangling', name:'Xiangling', rarity:4, element:'Pyro', weaponType:'Polearm', hp:980, atk:57, def:63, spd:111, skills:{
    normal:n('Dough-Fu',1.00), skill:s('Guoba Attack',1.60,'damage','Guoba breathes fire for 1.60× ATK Pyro damage.'), burst:b('Pyronado',2.75,'damage','A rotating Pyronado deals 2.75× ATK Pyro damage.'),
  }}),
  bennett: make({ id:'bennett', name:'Bennett', rarity:4, element:'Pyro', weaponType:'Sword', role:'Support', hp:1080, atk:50, def:65, spd:109, skills:{
    normal:n('Strike of Fortune',0.95), skill:s('Passion Overload',1.55,'damage','Deals 1.55× ATK Pyro damage.'), burst:b('Fantastic Voyage',0.28,'teamBuffHeal','Heals the team for 28% Max HP and grants a strong ATK buff.'),
  }}),
  fischl: make({ id:'fischl', name:'Fischl', rarity:4, element:'Electro', weaponType:'Bow', hp:930, atk:61, def:57, spd:114, skills:{
    normal:n('Bolts of Downfall',1.05), skill:s('Nightrider',1.72,'damage','Summons Oz for 1.72× ATK Electro damage.'), burst:b('Midnight Phantasmagoria',2.35,'damage','Transforms with Oz and deals 2.35× ATK Electro damage.'),
  }}),
  noelle: make({ id:'noelle', name:'Noelle', rarity:4, element:'Geo', weaponType:'Claymore', role:'Tank', hp:1200, atk:48, def:78, spd:92, skills:{
    normal:n('Favonius Bladework',1.08), skill:s('Breastplate',0.30,'shield','Creates a shield equal to 30% of Max HP.'), burst:b('Sweeping Time',2.20,'damage','Deals 2.20× ATK Geo damage.'),
  }}),
  xingqiu: make({ id:'xingqiu', name:'Xingqiu', rarity:4, element:'Hydro', weaponType:'Sword', role:'Support', hp:1000, atk:55, def:68, spd:110, skills:{
    normal:n('Guhua Style',0.98), skill:s('Fatal Rainscreen',1.45,'damageShield','Deals 1.45× ATK Hydro damage and grants a small shield.'), burst:b('Raincutter',0.24,'teamBuff','Increases team ATK and empowers follow-up damage.'),
  }}),
  sucrose: make({ id:'sucrose', name:'Sucrose', rarity:4, element:'Anemo', weaponType:'Catalyst', role:'Support', hp:920, atk:50, def:58, spd:113, skills:{
    normal:n('Wind Spirit Creation',0.92), skill:s('Astable Anemohypostasis',1.40,'damageDebuff','Deals Anemo damage and increases damage taken by the target.'), burst:b('Forbidden Creation',2.10,'damageDebuff','Deals 2.10× ATK Anemo damage and applies a stronger vulnerability.'),
  }}),
  razor: make({ id:'razor', name:'Razor', rarity:4, element:'Electro', weaponType:'Claymore', hp:1050, atk:62, def:62, spd:106, skills:{
    normal:n('Steel Fang',1.12), skill:s('Claw and Thunder',1.70,'damage'), burst:b('Lightning Fang',2.65,'damage','Deals heavy Electro damage with the wolf spirit.'),
  }}),
  beidou: make({ id:'beidou', name:'Beidou', rarity:4, element:'Electro', weaponType:'Claymore', role:'Tank', hp:1180, atk:59, def:72, spd:101, skills:{
    normal:n('Oceanborne',1.08), skill:s('Tidecaller',1.55,'damageShield','Deals Electro damage and grants a temporary shield.'), burst:b('Stormbreaker',2.40,'damageTeamBuff','Deals Electro damage and increases team ATK.'),
  }}),
  diona: make({ id:'diona', name:'Diona', rarity:4, element:'Cryo', weaponType:'Bow', role:'Support', hp:1120, atk:45, def:64, spd:107, skills:{
    normal:n('Kätzlein Style',0.90), skill:s('Icy Paws',0.26,'shield','Creates a Cryo shield equal to 26% of Max HP.'), burst:b('Signature Mix',0.30,'teamBuffHeal','Heals the team and grants an ATK boost.'),
  }}),
  'kuki-shinobu': make({ id:'kuki-shinobu', name:'Kuki Shinobu', rarity:4, element:'Electro', weaponType:'Sword', role:'Support', hp:1160, atk:49, def:68, spd:111, skills:{
    normal:n('Shinobu’s Shadowsword',0.94), skill:s('Sanctifying Ring',0.25,'heal','Heals one ally for 25% of Max HP.'), burst:b('Gyoei Narukami Kariyama Rite',2.20,'damage','Deals 2.20× ATK Electro damage.'),
  }}),
  layla: make({ id:'layla', name:'Layla', rarity:4, element:'Cryo', weaponType:'Sword', role:'Tank', hp:1260, atk:44, def:71, spd:101, skills:{
    normal:n('Sword of the Radiant Path',0.92), skill:s('Nights of Formal Focus',0.34,'shield','Creates a shield equal to 34% of Max HP.'), burst:b('Dream of the Star-Stream Shaker',2.25,'damage','Deals Cryo damage from falling stars.'),
  }}),
  yaoyao: make({ id:'yaoyao', name:'Yaoyao', rarity:4, element:'Dendro', weaponType:'Polearm', role:'Support', hp:1180, atk:45, def:67, spd:108, skills:{
    normal:n('Toss ’N’ Turn Spear',0.92), skill:s('Raphanus Sky Cluster',0.24,'heal','Heals one ally for 24% of Max HP.'), burst:b('Moonjade Descent',0.30,'teamHeal','Restores 30% Max HP to the team.'),
  }}),
  faruzan: make({ id:'faruzan', name:'Faruzan', rarity:4, element:'Anemo', weaponType:'Bow', role:'Support', hp:930, atk:52, def:58, spd:116, skills:{
    normal:n('Parthian Shot',0.98), skill:s('Wind Realm of Nasamjnin',1.35,'damageDebuff','Deals Anemo damage and weakens the target.'), burst:b('The Wind’s Secret Ways',0.28,'teamBuff','Grants the team a large offensive buff.'),
  }}),
  gaming: make({ id:'gaming', name:'Gaming', rarity:4, element:'Pyro', weaponType:'Claymore', hp:1030, atk:63, def:60, spd:113, skills:{
    normal:n('Stellar Rend',1.08), skill:s('Bestial Ascent',1.92,'damage','Performs a plunging strike for 1.92× ATK Pyro damage.'), burst:b('Suanni’s Gilded Dance',2.85,'damage','Deals 2.85× ATK Pyro damage.'),
  }}),
  chevreuse: make({ id:'chevreuse', name:'Chevreuse', rarity:4, element:'Pyro', weaponType:'Polearm', role:'Support', hp:1120, atk:52, def:65, spd:107, skills:{
    normal:n('Line Bayonet Thrust EX',0.96), skill:s('Short-Range Rapid Interdiction Fire',0.23,'heal','Heals an ally and supports offensive pressure.'), burst:b('Ring of Bursting Grenades',2.35,'damageTeamBuff','Deals Pyro damage and buffs team ATK.'),
  }}),

  'raiden-shogun': make({ id:'raiden-shogun', name:'Raiden Shogun', rarity:5, element:'Electro', weaponType:'Polearm', hp:1220, atk:72, def:70, spd:116, skills:{
    normal:n('Origin',1.08), skill:s('Transcendence: Baleful Omen',1.70,'damageTeamBuff','Deals Electro damage and raises team ATK.'), burst:b('Secret Art: Musou Shinsetsu',3.25,'damage','Deals 3.25× ATK Electro damage with Musou no Hitotachi.',90),
  }}),
  'yae-miko': make({ id:'yae-miko', name:'Yae Miko', rarity:5, element:'Electro', weaponType:'Catalyst', hp:1060, atk:79, def:55, spd:118, skills:{
    normal:n('Spiritfox Sin-Eater',1.05), skill:s('Yakan Evocation',1.90,'damage','Summons a Sesshou Sakura strike for 1.90× ATK Electro damage.'), burst:b('Great Secret Art: Tenko Kenshin',3.35,'damage','Calls down Tenko thunderbolts for 3.35× ATK Electro damage.',90),
  }}),
  furina: make({ id:'furina', name:'Furina', rarity:5, element:'Hydro', weaponType:'Sword', role:'Support', hp:1350, atk:60, def:62, spd:121, skills:{
    normal:n("Soloist's Solicitation",0.92), skill:s('Salon Solitaire',1.80,'damage','Summons salon members for Hydro damage.'), burst:b('Let the People Rejoice',0.35,'teamBuffHeal','Heals the team and grants a powerful ATK buff.',90),
  }}),
  nahida: make({ id:'nahida', name:'Nahida', rarity:5, element:'Dendro', weaponType:'Catalyst', role:'Support', hp:1080, atk:68, def:60, spd:117, skills:{
    normal:n('Akara',0.98), skill:s('All Schemes to Know',1.70,'damageDebuff','Deals Dendro damage and marks the target as vulnerable.'), burst:b('Illusory Heart',0.30,'teamBuff','Strengthens the entire team.',90),
  }}),
  hutao: make({ id:'hutao', name:'Hu Tao', rarity:5, element:'Pyro', weaponType:'Polearm', hp:1320, atk:76, def:65, spd:115, skills:{
    normal:n('Secret Spear of Wangsheng',1.10), skill:s('Guide to Afterlife',1.95,'selfBuffDamage','Deals Pyro damage and increases Hu Tao’s ATK.'), burst:b('Spirit Soother',3.00,'damageHeal','Deals heavy Pyro damage and heals Hu Tao.',90),
  }}),
  zhongli: make({ id:'zhongli', name:'Zhongli', rarity:5, element:'Geo', weaponType:'Polearm', role:'Tank', hp:1450, atk:64, def:80, spd:96, skills:{
    normal:n('Rain of Stone',1.00), skill:s('Dominus Lapidis',0.42,'shield','Creates a shield equal to 42% of Max HP.'), burst:b('Planet Befall',3.10,'damageDebuff','Drops a meteor for 3.10× ATK Geo damage and weakens the target.',90),
  }}),
  venti: make({ id:'venti', name:'Venti', rarity:5, element:'Anemo', weaponType:'Bow', role:'Support', hp:1050, atk:64, def:58, spd:124, skills:{
    normal:n('Divine Marksmanship',0.98), skill:s('Skyward Sonnet',1.55,'damageDebuff','Deals Anemo damage and weakens the target.'), burst:b('Wind’s Grand Ode',2.65,'damageDebuff','Deals sustained Anemo damage and increases damage taken.',90),
  }}),
  jean: make({ id:'jean', name:'Jean', rarity:5, element:'Anemo', weaponType:'Sword', role:'Support', hp:1250, atk:65, def:70, spd:112, skills:{
    normal:n('Favonius Bladework',1.02), skill:s('Gale Blade',1.70,'damage'), burst:b('Dandelion Breeze',0.36,'teamBuffHeal','Heals the team and grants an ATK buff.',90),
  }}),
  diluc: make({ id:'diluc', name:'Diluc', rarity:5, element:'Pyro', weaponType:'Claymore', hp:1250, atk:78, def:72, spd:104, skills:{
    normal:n('Tempered Sword',1.14), skill:s('Searing Onslaught',1.85,'damage'), burst:b('Dawn',3.00,'damage','Unleashes a phoenix for massive Pyro damage.',90),
  }}),
  keqing: make({ id:'keqing', name:'Keqing', rarity:5, element:'Electro', weaponType:'Sword', hp:1100, atk:75, def:62, spd:124, skills:{
    normal:n('Yunlai Swordsmanship',1.08), skill:s('Stellar Restoration',1.82,'damage'), burst:b('Starward Sword',2.95,'damage','Rapid Electro slashes deal 2.95× ATK damage.',90),
  }}),
  mona: make({ id:'mona', name:'Mona', rarity:5, element:'Hydro', weaponType:'Catalyst', role:'Support', hp:1080, atk:68, def:58, spd:120, skills:{
    normal:n('Ripple of Fate',0.98), skill:s('Mirror Reflection of Doom',1.52,'damageDebuff','Deals Hydro damage and weakens the target.'), burst:b('Stellaris Phantasm',2.45,'damageDebuff','Deals Hydro damage and applies a major vulnerability.',90),
  }}),
  qiqi: make({ id:'qiqi', name:'Qiqi', rarity:5, element:'Cryo', weaponType:'Sword', role:'Support', hp:1220, atk:62, def:78, spd:97, skills:{
    normal:n('Ancient Sword Art',0.96), skill:s('Adeptus Art: Herald of Frost',0.30,'heal','Heals one ally for 30% of Max HP.'), burst:b('Adeptus Art: Preserver of Fortune',0.40,'teamHeal','Restores 40% Max HP to the team.',90),
  }}),
  ganyu: make({ id:'ganyu', name:'Ganyu', rarity:5, element:'Cryo', weaponType:'Bow', hp:1040, atk:79, def:56, spd:109, skills:{
    normal:n('Liutian Archery',1.12), skill:s('Trail of the Qilin',1.65,'damage'), burst:b('Celestial Shower',3.10,'damage','Calls down Cryo shards for 3.10× ATK damage.',90),
  }}),
  xiao: make({ id:'xiao', name:'Xiao', rarity:5, element:'Anemo', weaponType:'Polearm', hp:1120, atk:80, def:64, spd:126, skills:{
    normal:n('Whirlwind Thrust',1.10), skill:s('Lemniscatic Wind Cycling',1.90,'damage'), burst:b('Bane of All Evil',3.20,'selfBuffDamage','Empowers Xiao and deals massive Anemo damage.',90),
  }}),
  albedo: make({ id:'albedo', name:'Albedo', rarity:5, element:'Geo', weaponType:'Sword', role:'Support', hp:1180, atk:60, def:82, spd:104, skills:{
    normal:n('Favonius Bladework - Weiss',0.95), skill:s('Abiogenesis: Solar Isotoma',1.48,'damageTeamBuff','Deals Geo damage and raises team ATK.'), burst:b('Rite of Progeniture: Tectonic Tide',2.70,'damageTeamBuff','Deals Geo damage and buffs allies.',90),
  }}),
  eula: make({ id:'eula', name:'Eula', rarity:5, element:'Cryo', weaponType:'Claymore', hp:1280, atk:82, def:74, spd:104, skills:{
    normal:n('Favonius Bladework - Edel',1.16), skill:s('Icetide Vortex',1.88,'damageDebuff','Deals Cryo damage and weakens the target.'), burst:b('Glacial Illumination',3.45,'damage','Detonates the Lightfall Sword for enormous damage.',90),
  }}),
  'kamisato-ayaka': make({ id:'kamisato-ayaka', name:'Kamisato Ayaka', rarity:5, element:'Cryo', weaponType:'Sword', hp:1140, atk:78, def:66, spd:122, skills:{
    normal:n('Kamisato Art: Kabuki',1.08), skill:s('Kamisato Art: Hyouka',1.86,'damage'), burst:b('Kamisato Art: Soumetsu',3.25,'damage','Unleashes a Frostflake Seki no To for massive Cryo damage.',90),
  }}),
  yoimiya: make({ id:'yoimiya', name:'Yoimiya', rarity:5, element:'Pyro', weaponType:'Bow', hp:1020, atk:82, def:55, spd:120, skills:{
    normal:n('Firework Flare-Up',1.12), skill:s('Niwabi Fire-Dance',1.95,'selfBuffDamage','Empowers Yoimiya’s Pyro attacks and deals damage.'), burst:b('Ryuukin Saxifrage',2.80,'damageTeamBuff','Deals Pyro damage and buffs the team.',90),
  }}),
  'sangonomiya-kokomi': make({ id:'sangonomiya-kokomi', name:'Sangonomiya Kokomi', rarity:5, element:'Hydro', weaponType:'Catalyst', role:'Support', hp:1420, atk:54, def:64, spd:105, skills:{
    normal:n('The Shape of Water',0.92), skill:s('Kurage’s Oath',0.32,'heal','Heals one ally for 32% of Max HP.'), burst:b('Nereid’s Ascension',0.40,'teamBuffHeal','Heals and strengthens the team.',90),
  }}),
  'arataki-itto': make({ id:'arataki-itto', name:'Arataki Itto', rarity:5, element:'Geo', weaponType:'Claymore', hp:1300, atk:72, def:86, spd:103, skills:{
    normal:n('Fight Club Legend',1.14), skill:s('Masatsu Zetsugi: Akaushi Burst!',1.80,'damage'), burst:b('Royal Descent: Behold, Itto the Evil!',3.05,'selfBuffDamage','Empowers Itto and deals heavy Geo damage.',90),
  }}),
  shenhe: make({ id:'shenhe', name:'Shenhe', rarity:5, element:'Cryo', weaponType:'Polearm', role:'Support', hp:1160, atk:75, def:65, spd:111, skills:{
    normal:n('Dawnstar Piercer',1.00), skill:s('Spring Spirit Summoning',1.45,'damageTeamBuff','Deals Cryo damage and buffs allies.'), burst:b('Divine Maiden’s Deliverance',2.35,'damageDebuff','Deals Cryo damage and weakens the target.',90),
  }}),
  yelan: make({ id:'yelan', name:'Yelan', rarity:5, element:'Hydro', weaponType:'Bow', hp:1380, atk:64, def:58, spd:125, skills:{
    normal:n('Stealthy Bowshot',1.02), skill:s('Lingering Lifeline',1.80,'damage'), burst:b('Depth-Clarion Dice',2.85,'damageTeamBuff','Deals Hydro damage and raises team ATK.',90),
  }}),
  nilou: make({ id:'nilou', name:'Nilou', rarity:5, element:'Hydro', weaponType:'Sword', role:'Support', hp:1460, atk:58, def:59, spd:118, skills:{
    normal:n('Dance of Samser',0.96), skill:s('Dance of Haftkarsvar',1.60,'damageTeamBuff','Deals Hydro damage and buffs allies.'), burst:b('Dance of Abzendegi: Distant Dreams, Listening Spring',2.70,'damage','Deals heavy Hydro damage.',90),
  }}),
  wanderer: make({ id:'wanderer', name:'Wanderer', rarity:5, element:'Anemo', weaponType:'Catalyst', hp:1040, atk:80, def:56, spd:128, skills:{
    normal:n('Yuuban Meigen',1.08), skill:s('Hanega: Song of the Wind',1.95,'selfBuffDamage','Deals Anemo damage and increases Wanderer’s ATK.'), burst:b('Kyougen: Five Ceremonial Plays',3.10,'damage','Deals rapid Anemo damage.',90),
  }}),
  alhaitham: make({ id:'alhaitham', name:'Alhaitham', rarity:5, element:'Dendro', weaponType:'Sword', hp:1180, atk:79, def:67, spd:119, skills:{
    normal:n('Abductive Reasoning',1.08), skill:s('Universality: An Elaboration on Form',1.88,'damage'), burst:b('Particular Field: Fetters of Phenomena',3.00,'damage','Deals heavy Dendro damage.',90),
  }}),
};

export const fourStarCharacters = Object.values(characters).filter((c) => c.rarity === 4).map((c) => c.id);
export const fiveStarCharacters = Object.values(characters).filter((c) => c.rarity === 5).map((c) => c.id);

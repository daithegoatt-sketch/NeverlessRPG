export const domains = {
  'windrise-training-ground': {
    id:'windrise-training-ground', name:'Windrise Training Ground', resin:10, level:1, recommendedPower:3600,
    description:'Starter Domain built for quick clears. Learn roles, earn your first artifacts, then improve the team and clear it in fewer turns.',
    rule:'Hydro and Cryo deal bonus damage. Balanced teams gain a starting combat bonus.',
    bonusElements:['Hydro','Cryo'], setIds:['gladiator'], firstClearPrimogems:60,
    enemies:[
      { id:'pyro-slime-trainee', name:'Pyro Slime', element:'Pyro', hp:480, atk:36, def:24, spd:80, image:'https://genshin.jmp.blue/enemies/pyro-slime/icon' },
      { id:'hilichurl-trainee', name:'Hilichurl Scout', element:'Physical', hp:620, atk:44, def:30, spd:86, image:'https://genshin.jmp.blue/enemies/hilichurl/icon' },
    ],
    rewards:{ mora:[6500,9000], primogems:25, adventureXp:140 },
  },
  'valley-of-remembrance': {
    id:'valley-of-remembrance', name:'Valley of Remembrance', resin:20, level:2, recommendedPower:6500,
    description:'A balanced artifact Domain where upgraded weapons and character levels begin to matter.',
    rule:'Hydro and Electro gain a damage bonus. Supports help sustain longer fights.',
    bonusElements:['Hydro','Electro'], setIds:['gladiator'], firstClearPrimogems:45,
    enemies:[
      { id:'pyro-slime', name:'Large Pyro Slime', element:'Pyro', hp:1900, atk:120, def:72, spd:94, image:'https://genshin.jmp.blue/enemies/large-pyro-slime/icon' },
      { id:'hilichurl', name:'Hilichurl Fighter', element:'Physical', hp:2300, atk:138, def:82, spd:101, image:'https://genshin.jmp.blue/enemies/hilichurl/icon' },
    ],
    rewards:{ mora:[8500,12500], primogems:22, adventureXp:150 },
  },
  'forsaken-rift': {
    id:'forsaken-rift', name:'Forsaken Rift', resin:20, level:3, recommendedPower:9000,
    description:'Cryo-heavy combat where a proper DPS and Support pair makes the run noticeably faster.',
    rule:'Pyro gains bonus damage. Tanks reduce pressure from the Mitachurl.',
    bonusElements:['Pyro'], setIds:['wanderer'], firstClearPrimogems:50,
    enemies:[
      { id:'cryo-slime', name:'Cryo Slime', element:'Cryo', hp:2900, atk:155, def:88, spd:94, image:'https://genshin.jmp.blue/enemies/cryo-slime/icon' },
      { id:'mitachurl', name:'Blazing Axe Mitachurl', element:'Pyro', hp:4100, atk:205, def:115, spd:88, image:'https://genshin.jmp.blue/enemies/blazing-axe-mitachurl/icon' },
    ],
    rewards:{ mora:[11000,16000], primogems:27, adventureXp:180 },
  },
  'clear-pool-and-mountain-cavern': {
    id:'clear-pool-and-mountain-cavern', name:'Clear Pool and Mountain Cavern', resin:20, level:4, recommendedPower:12500,
    description:'Abyss enemies punish weak teams. Gear, talents and role synergy now have a large impact.',
    rule:'Hydro and Cryo gain bonus damage. Support skills generate extra team Energy.',
    bonusElements:['Hydro','Cryo'], setIds:['noblesse'], firstClearPrimogems:60,
    enemies:[
      { id:'pyro-abyss-mage', name:'Pyro Abyss Mage', element:'Pyro', hp:3900, atk:218, def:112, spd:108, image:'https://genshin.jmp.blue/enemies/pyro-abyss-mage/icon' },
      { id:'cryo-abyss-mage', name:'Cryo Abyss Mage', element:'Cryo', hp:4000, atk:215, def:114, spd:105, image:'https://genshin.jmp.blue/enemies/cryo-abyss-mage/icon' },
    ],
    rewards:{ mora:[14000,21000], primogems:34, adventureXp:220 },
  },
  'momiji-dyed-court': {
    id:'momiji-dyed-court', name:'Momiji-Dyed Court', resin:20, level:5, recommendedPower:16000,
    description:'High-speed farming Domain. Character levels, SPD and artifact quality strongly affect clear time.',
    rule:'Pyro and Cryo gain bonus damage. Slow teams can be lapped by fast enemies.',
    bonusElements:['Pyro','Cryo'], setIds:['emblem'], firstClearPrimogems:75,
    enemies:[
      { id:'electro-slime', name:'Large Electro Slime', element:'Electro', hp:4700, atk:235, def:120, spd:116, image:'https://genshin.jmp.blue/enemies/large-electro-slime/icon' },
      { id:'lawachurl', name:'Thunderhelm Lawachurl', element:'Electro', hp:6900, atk:282, def:155, spd:92, image:'https://genshin.jmp.blue/enemies/thunderhelm-lawachurl/icon' },
    ],
    rewards:{ mora:[17500,26000], primogems:42, adventureXp:290 },
  },
  'neverless-abyss': {
    id:'neverless-abyss', name:'Neverless Abyss Trial', resin:30, level:6, recommendedPower:22000,
    description:'Neverless endgame trial. Build a real team, optimize roles, talents and gear, then chase faster clears.',
    rule:'Mixed enemies. Balanced team synergy is strongly recommended.',
    bonusElements:['Pyro','Hydro','Cryo','Electro','Dendro','Anemo','Geo'], setIds:['gladiator','wanderer','noblesse','emblem'], firstClearPrimogems:120,
    enemies:[
      { id:'electro-abyss-mage', name:'Electro Abyss Mage', element:'Electro', hp:5400, atk:255, def:120, spd:114, image:'https://genshin.jmp.blue/enemies/electro-abyss-mage/icon' },
      { id:'ruin-guard-elite', name:'Ruin Guard', element:'Physical', hp:8200, atk:305, def:168, spd:84, image:'https://genshin.jmp.blue/enemies/ruin-guard/icon' },
      { id:'pyro-slime-elite', name:'Large Pyro Slime', element:'Pyro', hp:4700, atk:230, def:104, spd:99, image:'https://genshin.jmp.blue/enemies/large-pyro-slime/icon' },
    ],
    rewards:{ mora:[25000,38000], primogems:60, adventureXp:380 },
  },
};

export const domains = {
  'valley-of-remembrance': {
    id:'valley-of-remembrance', name:'Valley of Remembrance', resin:20, level:1, recommendedPower:5500,
    description:"Entry artifact domain with a balanced Pyro/Physical wave. Clear it once to unlock Quick Clear when your account PWR is high enough.",
    setIds:['gladiator'], firstClearPrimogems:40,
    enemies:[
      { id:'pyro-slime', name:'Pyro Slime', element:'Pyro', hp:2100, atk:130, def:70, spd:96, image:'https://genshin.jmp.blue/enemies/pyro-slime/icon' },
      { id:'hilichurl', name:'Hilichurl', element:'Physical', hp:2600, atk:145, def:78, spd:102, image:'https://genshin.jmp.blue/enemies/hilichurl/icon' },
    ],
    rewards:{ mora:[7000,11000], primogems:20, adventureXp:120 },
  },
  'forsaken-rift': {
    id:'forsaken-rift', name:'Forsaken Rift', resin:20, level:2, recommendedPower:8200,
    description:'Cryo-heavy training domain with a stronger Mitachurl. Drops Wanderer pieces and increased account XP.',
    setIds:['wanderer'], firstClearPrimogems:45,
    enemies:[
      { id:'cryo-slime', name:'Cryo Slime', element:'Cryo', hp:3200, atk:165, def:88, spd:94, image:'https://genshin.jmp.blue/enemies/cryo-slime/icon' },
      { id:'mitachurl', name:'Blazing Axe Mitachurl', element:'Pyro', hp:4600, atk:210, def:115, spd:88, image:'https://genshin.jmp.blue/enemies/blazing-axe-mitachurl/icon' },
    ],
    rewards:{ mora:[10000,15000], primogems:25, adventureXp:160 },
  },
  'clear-pool-and-mountain-cavern': {
    id:'clear-pool-and-mountain-cavern', name:'Clear Pool and Mountain Cavern', resin:20, level:3, recommendedPower:11800,
    description:'Support-focused artifact domain. Abyss enemies hit harder and reward Noblesse Oblige pieces.',
    setIds:['noblesse'], firstClearPrimogems:50,
    enemies:[
      { id:'pyro-abyss-mage', name:'Pyro Abyss Mage', element:'Pyro', hp:4200, atk:220, def:112, spd:108, image:'https://genshin.jmp.blue/enemies/pyro-abyss-mage/icon' },
      { id:'cryo-abyss-mage', name:'Cryo Abyss Mage', element:'Cryo', hp:4300, atk:218, def:114, spd:105, image:'https://genshin.jmp.blue/enemies/cryo-abyss-mage/icon' },
    ],
    rewards:{ mora:[13500,20500], primogems:32, adventureXp:210 },
  },
  'momiji-dyed-court': {
    id:'momiji-dyed-court', name:'Momiji-Dyed Court', resin:20, level:4, recommendedPower:15000,
    description:'High-speed endgame farming domain. Drops Emblem pieces and punishes slow teams.',
    setIds:['emblem'], firstClearPrimogems:60,
    enemies:[
      { id:'electro-slime', name:'Large Electro Slime', element:'Electro', hp:5000, atk:238, def:120, spd:116, image:'https://genshin.jmp.blue/enemies/large-electro-slime/icon' },
      { id:'lawachurl', name:'Thunderhelm Lawachurl', element:'Electro', hp:7200, atk:285, def:155, spd:92, image:'https://genshin.jmp.blue/enemies/thunderhelm-lawachurl/icon' },
    ],
    rewards:{ mora:[17000,25000], primogems:40, adventureXp:270 },
  },
  'neverless-abyss': {
    id:'neverless-abyss', name:'Neverless Abyss Trial', resin:30, level:5, recommendedPower:20000,
    description:'Prototype endgame trial. Three enemies, mixed artifact sets, premium Mora/XP, and the strongest Quick Clear requirement.',
    setIds:['gladiator','wanderer','noblesse','emblem'], firstClearPrimogems:100,
    enemies:[
      { id:'electro-abyss-mage', name:'Electro Abyss Mage', element:'Electro', hp:5400, atk:255, def:120, spd:114, image:'https://genshin.jmp.blue/enemies/electro-abyss-mage/icon' },
      { id:'ruin-guard-elite', name:'Ruin Guard', element:'Physical', hp:8200, atk:305, def:168, spd:84, image:'https://genshin.jmp.blue/enemies/ruin-guard/icon' },
      { id:'pyro-slime-elite', name:'Large Pyro Slime', element:'Pyro', hp:4700, atk:230, def:104, spd:99, image:'https://genshin.jmp.blue/enemies/large-pyro-slime/icon' },
    ],
    rewards:{ mora:[24000,36000], primogems:55, adventureXp:360 },
  },
};

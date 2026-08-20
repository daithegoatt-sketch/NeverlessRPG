export const domains = {
  'valley-of-remembrance': {
    id:'valley-of-remembrance', name:'Valley of Remembrance', resin:20, level:1, recommendedPower:5500,
    description:"Entry domain for Gladiator pieces. Balanced enemy wave with a Slime and Hilichurl.", setIds:['gladiator'],
    enemies:[
      { id:'pyro-slime', name:'Pyro Slime', element:'Pyro', hp:2100, atk:130, def:70, spd:96, image:'https://genshin.jmp.blue/enemies/pyro-slime/icon' },
      { id:'hilichurl', name:'Hilichurl', element:'Physical', hp:2600, atk:145, def:78, spd:102, image:'https://genshin.jmp.blue/enemies/hilichurl/icon' },
    ],
    rewards:{ mora:[7000,11000], primogems:20, adventureXp:120 },
  },
  'forsaken-rift': {
    id:'forsaken-rift', name:'Forsaken Rift', resin:20, level:2, recommendedPower:8200,
    description:'Cryo-heavy training domain. Rewards Wanderer pieces and more Adventure XP.', setIds:['wanderer'],
    enemies:[
      { id:'cryo-slime', name:'Cryo Slime', element:'Cryo', hp:3200, atk:165, def:88, spd:94, image:'https://genshin.jmp.blue/enemies/cryo-slime/icon' },
      { id:'mitachurl', name:'Blazing Axe Mitachurl', element:'Pyro', hp:4600, atk:210, def:115, spd:88, image:'https://genshin.jmp.blue/enemies/blazing-axe-mitachurl/icon' },
    ],
    rewards:{ mora:[10000,15000], primogems:25, adventureXp:160 },
  },
  'spire-of-solitary-enlightenment': {
    id:'spire-of-solitary-enlightenment', name:'Spire of Solitary Enlightenment', resin:20, level:3, recommendedPower:12000,
    description:'A stronger ruin encounter with a shielded Abyss Mage.', setIds:['wanderer','gladiator'],
    enemies:[
      { id:'ruin-guard', name:'Ruin Guard', element:'Physical', hp:5800, atk:235, def:145, spd:82, image:'https://genshin.jmp.blue/enemies/ruin-guard/icon' },
      { id:'hydro-abyss-mage', name:'Hydro Abyss Mage', element:'Hydro', hp:3900, atk:205, def:110, spd:106, image:'https://genshin.jmp.blue/enemies/hydro-abyss-mage/icon' },
    ],
    rewards:{ mora:[14000,21000], primogems:35, adventureXp:220 },
  },
  'neverless-abyss': {
    id:'neverless-abyss', name:'Neverless Abyss Trial', resin:30, level:4, recommendedPower:18000,
    description:'Endgame test domain for the prototype. Three enemies, better rewards, and higher Artifact value.', setIds:['gladiator','wanderer'],
    enemies:[
      { id:'electro-abyss-mage', name:'Electro Abyss Mage', element:'Electro', hp:5100, atk:245, def:118, spd:112, image:'https://genshin.jmp.blue/enemies/electro-abyss-mage/icon' },
      { id:'ruin-guard-elite', name:'Ruin Guard', element:'Physical', hp:7600, atk:290, def:160, spd:84, image:'https://genshin.jmp.blue/enemies/ruin-guard/icon' },
      { id:'pyro-slime-elite', name:'Large Pyro Slime', element:'Pyro', hp:4300, atk:220, def:100, spd:98, image:'https://genshin.jmp.blue/enemies/large-pyro-slime/icon' },
    ],
    rewards:{ mora:[22000,32000], primogems:50, adventureXp:320 },
  },
};

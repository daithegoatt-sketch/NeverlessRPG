export const domains = {
  'valley-of-remembrance': {
    id: 'valley-of-remembrance', name: 'Valley of Remembrance', resin: 20, level: 1,
    description: "Farm Gladiator's Finale pieces and Mora.", setIds: ['gladiator'],
    enemies: [
      { id: 'slime-pyro', name: 'Pyro Slime', element: 'Pyro', hp: 2800, atk: 165, def: 85, spd: 96, image: 'https://genshin.jmp.blue/enemies/pyro-slime/icon' },
      { id: 'hilichurl', name: 'Hilichurl', element: 'Physical', hp: 3300, atk: 180, def: 95, spd: 102, image: 'https://genshin.jmp.blue/enemies/hilichurl/icon' },
    ],
    rewards: { mora: [7000, 11000], primogems: 20 },
  },
  'spire-of-solitary-enlightenment': {
    id: 'spire-of-solitary-enlightenment', name: 'Spire of Solitary Enlightenment', resin: 20, level: 2,
    description: 'Harder enemies, better artifact rolls.', setIds: ['wanderer'],
    enemies: [
      { id: 'ruin-guard', name: 'Ruin Guard', element: 'Physical', hp: 6000, atk: 250, def: 145, spd: 82, image: 'https://genshin.jmp.blue/enemies/ruin-guard/icon' },
      { id: 'abyss-mage', name: 'Abyss Mage', element: 'Hydro', hp: 4200, atk: 225, def: 110, spd: 106, image: 'https://genshin.jmp.blue/enemies/hydro-abyss-mage/icon' },
    ],
    rewards: { mora: [11000, 17000], primogems: 30 },
  },
};

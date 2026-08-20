export function makeCpuProfile() {
  return {
    id: 'cpu', username: 'Neverless Automaton',
    passive: { atk: 2, hp: 2, critRate: 1, critDmg: 1, spd: 2 },
    characters: {
      xiangling: { id: 'xiangling', level: 24, constellation: 0, weaponId: 'white-tassel', artifactIds: [] },
      bennett: { id: 'bennett', level: 24, constellation: 0, weaponId: 'favonius-sword', artifactIds: [] },
      fischl: { id: 'fischl', level: 24, constellation: 0, weaponId: 'slingshot', artifactIds: [] },
      noelle: { id: 'noelle', level: 24, constellation: 0, weaponId: 'debate-club', artifactIds: [] },
    },
    weapons: {
      'white-tassel': { id: 'white-tassel', copies: 1, level: 20, refinement: 1 },
      'favonius-sword': { id: 'favonius-sword', copies: 1, level: 20, refinement: 1 },
      slingshot: { id: 'slingshot', copies: 1, level: 20, refinement: 1 },
      'debate-club': { id: 'debate-club', copies: 1, level: 20, refinement: 1 },
    },
    artifacts: {},
  };
}

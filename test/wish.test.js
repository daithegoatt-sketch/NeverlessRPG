import test from 'node:test';
import assert from 'node:assert/strict';
import { performWishes } from '../src/game/wish.js';

function player() {
  return {
    primogems: 999999, mora: 0,
    pity: { character: 89, weapon: 0, characterFour: 0, weaponFour: 0, characterGuaranteed: false },
    characters: {}, weapons: {}, history: { wishes: [] },
  };
}

test('hard pity guarantees a five-star character', () => {
  const p = player();
  const r = performWishes(p, 'character', 1, () => 0.99);
  assert.equal(r[0].rarity, 5);
  assert.equal(r[0].kind, 'character');
  assert.equal(p.pity.character, 0);
});

test('ten wishes charge exactly 1600 primogems', () => {
  const p = player();
  p.pity.character = 0;
  const before = p.primogems;
  performWishes(p, 'character', 10, () => 0.5);
  assert.equal(before - p.primogems, 1600);
});

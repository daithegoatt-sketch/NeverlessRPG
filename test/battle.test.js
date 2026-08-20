import test from 'node:test';
import assert from 'node:assert/strict';
import { createCpuBattle, currentActor, act, runCpuUntilPlayerTurn } from '../src/game/battle.js';
import { makeCpuProfile } from '../src/game/cpu.js';

const p = {
  passive: { atk: 0, hp: 0, critRate: 0, critDmg: 0, spd: 0 },
  characters: {
    amber: { id: 'amber', level: 20, constellation: 0, weaponId: 'slingshot', artifactIds: [] },
    kaeya: { id: 'kaeya', level: 20, constellation: 0, weaponId: 'harbinger-of-dawn', artifactIds: [] },
    lisa: { id: 'lisa', level: 20, constellation: 0, weaponId: 'thrilling-tales-of-dragon-slayers', artifactIds: [] },
    barbara: { id: 'barbara', level: 20, constellation: 0, weaponId: 'thrilling-tales-of-dragon-slayers', artifactIds: [] },
  },
  weapons: {
    slingshot: { id: 'slingshot', level: 1 },
    'harbinger-of-dawn': { id: 'harbinger-of-dawn', level: 1 },
    'thrilling-tales-of-dragon-slayers': { id: 'thrilling-tales-of-dragon-slayers', level: 1 },
  },
  artifacts: {},
};

test('CPU battle initializes and can progress to player-controlled turns', () => {
  const b = createCpuBattle(p, ['amber', 'kaeya', 'lisa', 'barbara'], makeCpuProfile());
  runCpuUntilPlayerTurn(b, () => 0.5);
  const actor = currentActor(b);
  assert.ok(actor);
  if (actor.side === 'player') {
    const target = b.actors.find((x) => x.side === 'enemy' && x.hp > 0);
    const result = act(b, actor.uid, 'normal', target.uid, () => 0.9);
    assert.equal(result.ok, true);
  }
});

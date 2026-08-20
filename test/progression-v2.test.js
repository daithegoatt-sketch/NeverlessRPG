import test from 'node:test';
import assert from 'node:assert/strict';
import { levelCharacter, upgradeTalent, setShowcase, grantDomainRewards } from '../src/game/progression.js';

function player() {
  return {
    mora: 999999,
    primogems: 0,
    adventureXp: 0,
    characters: {
      amber: { id:'amber', level:20, constellation:0, weaponId:null, artifactIds:[], talents:{normal:1,skill:1,burst:1} },
      kaeya: { id:'kaeya', level:20, constellation:0, weaponId:null, artifactIds:[], talents:{normal:1,skill:1,burst:1} },
    },
    artifacts: {},
    domainProgress: {},
  };
}

test('V2 character development supports multi-level upgrades and talents', () => {
  const p=player();
  const leveled=levelCharacter(p,'amber',5);
  assert.equal(leveled.ok,true);
  assert.equal(p.characters.amber.level,25);
  const talent=upgradeTalent(p,'amber','skill');
  assert.equal(talent.ok,true);
  assert.equal(p.characters.amber.talents.skill,2);
});

test('V2 profile showcase only keeps owned unique characters', () => {
  const p=player();
  const result=setShowcase(p,['kaeya','amber','kaeya','not-owned']);
  assert.equal(result.ok,true);
  assert.deepEqual(p.showcase,['kaeya','amber']);
});

test('V2 domain rewards track clears and first-clear bonus once', () => {
  const p=player();
  const first=grantDomainRewards(p,'valley-of-remembrance',()=>0.2,{turns:18});
  const second=grantDomainRewards(p,'valley-of-remembrance',()=>0.2,{quick:true});
  assert.ok(first.firstClearBonus>0);
  assert.equal(second.firstClearBonus,0);
  assert.equal(p.domainProgress['valley-of-remembrance'].clears,2);
  assert.equal(p.domainProgress['valley-of-remembrance'].quickClears,1);
  assert.equal(p.domainProgress['valley-of-remembrance'].fastestTurns,18);
});

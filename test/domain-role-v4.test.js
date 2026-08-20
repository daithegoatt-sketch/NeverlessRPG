import test from 'node:test';
import assert from 'node:assert/strict';
import { domains } from '../src/data/domains.js';
import { createDomainBattle, currentActor, act, runCpuUntilPlayerTurn } from '../src/game/battle.js';

function makePlayer(level=20){
  return {
    passive:{atk:0,hp:0,critRate:0,critDmg:0,spd:0},
    characters:{
      amber:{id:'amber',level,constellation:0,weaponId:'slingshot',artifactIds:[],talents:{normal:1,skill:1,burst:1}},
      kaeya:{id:'kaeya',level,constellation:0,weaponId:'harbinger-of-dawn',artifactIds:[],talents:{normal:1,skill:1,burst:1}},
      lisa:{id:'lisa',level,constellation:0,weaponId:'thrilling-tales-of-dragon-slayers',artifactIds:[],talents:{normal:1,skill:1,burst:1}},
      barbara:{id:'barbara',level,constellation:0,weaponId:'thrilling-tales-of-dragon-slayers',artifactIds:[],talents:{normal:1,skill:1,burst:1}},
    },
    weapons:{
      slingshot:{id:'slingshot',level:1},
      'harbinger-of-dawn':{id:'harbinger-of-dawn',level:1},
      'thrilling-tales-of-dragon-slayers':{id:'thrilling-tales-of-dragon-slayers',level:1},
    }, artifacts:{},
  };
}
function clearTurns(level){
  const p=makePlayer(level); const b=createDomainBattle(p,['amber','kaeya','lisa','barbara'],domains['windrise-training-ground']); let guard=0;
  while(!b.winner&&guard<30){
    runCpuUntilPlayerTurn(b,()=>0.5); if(b.winner)break;
    const a=currentActor(b),foes=b.actors.filter(x=>x.side==='enemy'&&x.hp>0); let action=a.cooldowns.skill===0?'skill':'normal';
    const r=act(b,a.uid,action,foes[0]?.uid,()=>0.5); if(!r.ok)act(b,a.uid,'normal',foes[0]?.uid,()=>0.5); guard++;
  }
  return {winner:b.winner,turns:b.turn};
}

test('starter domain is fast and winnable with starter level 20 team',()=>{
  const r=clearTurns(20); assert.equal(r.winner,'player'); assert.ok(r.turns<=9);
});

test('character leveling improves starter-domain clear time',()=>{
  const low=clearTurns(20),high=clearTurns(40); assert.ok(high.turns<=low.turns);
});

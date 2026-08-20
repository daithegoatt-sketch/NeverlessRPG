import { buildCharacterStats } from './stats.js';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const alive=(a)=>a.hp>0;

function scaledSkills(definition,owned){
  const levels=owned.talents||{normal:1,skill:1,burst:1};
  const skills=structuredClone(definition.skills);
  for(const key of ['normal','skill','burst']){
    const level=Math.max(1,Math.min(10,Number(levels[key])||1));
    if(skills[key]){
      skills[key].talentLevel=level;
      if(Number.isFinite(skills[key].multiplier)) skills[key].multiplier*=1+(level-1)*0.065;
      if(!skills[key].description) skills[key].description=`${skills[key].name} • Talent Lv.${level}`;
    }
  }
  return skills;
}

function playerActor(player,charId,side='player'){
  const built=buildCharacterStats(player,charId);
  if(!built) throw new Error(`Unknown/unowned character: ${charId}`);
  return {
    uid:`${side}:${charId}`,side,id:charId,name:built.definition.name,image:built.definition.image,icon:built.definition.icon,
    element:built.definition.element,role:built.definition.role,skills:scaledSkills(built.definition,built.owned),
    maxHp:built.stats.hp,hp:built.stats.hp,atk:built.stats.atk,def:built.stats.def,spd:built.stats.spd,
    critRate:built.stats.critRate,critDmg:built.stats.critDmg,elementDmg:built.stats.elementDmg||0,
    energy:0,shield:0,atkBuff:0,dmgTakenAmp:0,damageReduction:built.definition.role==='Tank'?0.18:0,
    cooldowns:{skill:0},tauntTurns:0,
  };
}

function enemyActor(enemy,idx){
  const skillName=enemy.element==='Physical'?'Heavy Attack':`${enemy.element} Strike`;
  return {
    uid:`enemy:${idx}:${enemy.id}`,side:'enemy',id:enemy.id,name:enemy.name,image:enemy.image,icon:enemy.image,
    element:enemy.element,role:'Enemy',maxHp:enemy.hp,hp:enemy.hp,atk:enemy.atk,def:enemy.def,spd:enemy.spd,
    critRate:0.05,critDmg:0.45,elementDmg:0,energy:0,shield:0,atkBuff:0,dmgTakenAmp:0,damageReduction:0,cooldowns:{skill:0},tauntTurns:0,
    skills:{
      normal:{name:'Attack',type:'damage',multiplier:0.90,energy:22,talentLevel:1,description:'Standard enemy attack.'},
      skill:{name:skillName,type:'damage',multiplier:1.25,energy:30,cooldown:1,talentLevel:1,description:'Stronger enemy attack.'},
      burst:{name:'Rage',type:'damage',multiplier:1.80,cost:80,talentLevel:1,description:'Enemy finisher.'},
    },
  };
}

function applyTeamSynergy(team){
  const roles=new Set(team.map(a=>a.role));
  const balanced=roles.has('DPS')&&roles.has('Support')&&roles.has('Tank');
  const supportCount=team.filter(a=>a.role==='Support').length;
  const dpsCount=team.filter(a=>a.role==='DPS').length;
  const tankCount=team.filter(a=>a.role==='Tank').length;
  if(balanced){for(const a of team){a.atkBuff+=0.08;a.energy=15;}}
  if(supportCount>=2){for(const a of team)a.energy=Math.min(100,a.energy+8);}
  if(dpsCount>=2){for(const a of team)if(a.role==='DPS')a.critRate=Math.min(.85,a.critRate+.05);}
  if(tankCount>=1){for(const a of team)if(a.role!=='Tank')a.damageReduction=Math.max(a.damageReduction,.06);}
  return balanced?'BALANCED TEAM +8% ATK +15 ENERGY':supportCount>=2?'DOUBLE SUPPORT + ENERGY':dpsCount>=2?'DOUBLE DPS +5% CRIT':tankCount>=1?'TANK AURA +6% DAMAGE REDUCTION':'NO TEAM SYNERGY';
}

export function createDomainBattle(player,teamIds,domain){
  const playerTeam=teamIds.map(id=>playerActor(player,id));
  const synergyLabel=applyTeamSynergy(playerTeam);
  return createBattle({mode:'domain',playerTeam,enemyTeam:domain.enemies.map(enemyActor),meta:{domainId:domain.id,domainName:domain.name,bonusElements:domain.bonusElements||[],synergyLabel}});
}
export function createCpuBattle(player,teamIds,cpuPlayer){
  const playerTeam=teamIds.map(id=>playerActor(player,id));
  const cpuIds=Object.keys(cpuPlayer.characters).slice(0,4);
  const enemyTeam=cpuIds.map(id=>playerActor(cpuPlayer,id,'enemy'));
  return createBattle({mode:'cpu',playerTeam,enemyTeam,meta:{opponentName:'Neverless Automaton',synergyLabel:applyTeamSynergy(playerTeam)}});
}
export function createBattle({mode,playerTeam,enemyTeam,meta={}}){
  const b={id:`b_${Date.now()}_${Math.floor(Math.random()*1e7)}`,mode,turn:0,tick:0,actors:[...playerTeam,...enemyTeam],log:[meta.synergyLabel||'Battle started.'],winner:null,meta,pendingActorUid:null};
  advanceToNextActor(b);return b;
}

function effectiveAtk(a){return a.atk*(1+a.atkBuff);}
function roleDamageMultiplier(actor){return actor.role==='DPS'?1.18:actor.role==='Support'?0.92:actor.role==='Tank'?0.96:1;}
function elementMultiplier(battle,actor,target){
  let m=1;
  if(actor.side==='player'&&(battle.meta?.bonusElements||[]).includes(actor.element))m*=1.25;
  if(target.element===actor.element&&target.element!=='Physical')m*=0.82;
  return m;
}
function applyDamage(target,amount){
  let dmg=Math.max(1,Math.round(amount*(1-(target.damageReduction||0))));let absorbed=0;
  if(target.shield>0){absorbed=Math.min(target.shield,dmg);target.shield-=absorbed;dmg-=absorbed;}
  target.hp=Math.max(0,target.hp-dmg);return{damage:dmg,absorbed};
}
function damageRoll(battle,actor,target,multiplier,rng){
  const crit=rng()<actor.critRate;const defenseFactor=100/(100+target.def*.52);const amp=1+actor.elementDmg+target.dmgTakenAmp;
  const base=effectiveAtk(actor)*multiplier*defenseFactor*amp*roleDamageMultiplier(actor)*elementMultiplier(battle,actor,target);
  return{damage:base*(crit?1+actor.critDmg:1),crit};
}
function alliesOf(b,a){return b.actors.filter(x=>x.side===a.side&&alive(x));}
function enemiesOf(b,a){return b.actors.filter(x=>x.side!==a.side&&alive(x));}
function heal(target,amount,mult=1){const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+Math.round(amount*mult));return target.hp-before;}
function supportPower(actor){return actor.role==='Support'?1.25:1;}

export function act(battle,actorUid,action,targetUid,rng=Math.random){
  if(battle.winner)return{ok:false,reason:'BATTLE_ENDED'};
  if(battle.pendingActorUid!==actorUid)return{ok:false,reason:'NOT_YOUR_TURN'};
  const actor=battle.actors.find(a=>a.uid===actorUid);if(!actor||!alive(actor))return{ok:false,reason:'INVALID_ACTOR'};
  const skill=actor.skills[action];if(!skill)return{ok:false,reason:'INVALID_ACTION'};
  if(action==='skill'&&actor.cooldowns.skill>0)return{ok:false,reason:'COOLDOWN'};
  if(action==='burst'&&actor.energy<(skill.cost||80))return{ok:false,reason:'NO_ENERGY'};

  let target=battle.actors.find(a=>a.uid===targetUid&&alive(a));const friends=alliesOf(battle,actor),foes=enemiesOf(battle,actor);
  const isSupport=['heal','teamHeal','teamBuffHeal','shield','teamBuff'].includes(skill.type);if(!target)target=isSupport?actor:foes[0];
  const event={actorUid:actor.uid,actorName:actor.name,actorSide:actor.side,actorElement:actor.element,actorRole:actor.role,action,skillName:skill.name,skillDescription:skill.description||'',talentLevel:skill.talentLevel||1,targetUid:target?.uid||null,targetName:target?.name||null,damage:0,healed:0,shield:0,crit:false,buff:false,debuff:false,roleBonus:actor.role};
  let line='';

  if(['damage','damageShield','damageDebuff','damageTeamBuff','selfBuffDamage','damageHeal'].includes(skill.type)){
    if(!target||target.side===actor.side)target=foes[0];if(!target)return{ok:false,reason:'NO_TARGET'};event.targetUid=target.uid;event.targetName=target.name;
    const roll=damageRoll(battle,actor,target,skill.multiplier,rng),applied=applyDamage(target,roll.damage);event.damage=applied.damage;event.absorbed=applied.absorbed;event.crit=roll.crit;
    line=`${actor.name} used ${skill.name} on ${target.name}: ${applied.damage} DMG${roll.crit?' CRIT':''}.`;
    if(skill.type==='damageShield'){event.shield=Math.round(actor.maxHp*.18*supportPower(actor));actor.shield+=event.shield;actor.tauntTurns=actor.role==='Tank'?2:0;}
    if(skill.type==='damageDebuff'){target.dmgTakenAmp=clamp(target.dmgTakenAmp+.12,0,.40);event.debuff=true;}
    if(skill.type==='damageTeamBuff'){for(const a of friends)a.atkBuff=clamp(a.atkBuff+.12*supportPower(actor),0,.50);event.buff=true;}
    if(skill.type==='selfBuffDamage'){actor.atkBuff=clamp(actor.atkBuff+.24,0,.55);event.buff=true;}
    if(skill.type==='damageHeal'){event.healed=heal(actor,actor.maxHp*.20,supportPower(actor));}
  }else if(skill.type==='heal'){
    if(!target||target.side!==actor.side)target=[...friends].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];event.targetUid=target.uid;event.targetName=target.name;event.healed=heal(target,target.maxHp*skill.multiplier,supportPower(actor));line=`${actor.name} healed ${target.name} for ${event.healed} HP.`;
  }else if(skill.type==='teamHeal'){
    for(const a of friends)event.healed+=heal(a,a.maxHp*skill.multiplier,supportPower(actor));event.targetName='team';line=`${actor.name} restored ${event.healed} team HP.`;
  }else if(skill.type==='teamBuffHeal'){
    for(const a of friends){event.healed+=heal(a,a.maxHp*skill.multiplier,supportPower(actor));a.atkBuff=clamp(a.atkBuff+.20*supportPower(actor),0,.55);a.energy=Math.min(100,a.energy+8);}event.targetName='team';event.buff=true;line=`${actor.name} healed and buffed the team.`;
  }else if(skill.type==='shield'){
    event.shield=Math.round(actor.maxHp*skill.multiplier*(actor.role==='Tank'?1.40:supportPower(actor)));actor.shield+=event.shield;actor.tauntTurns=actor.role==='Tank'?2:0;event.targetName=actor.name;line=`${actor.name} gained ${event.shield} shield.`;
  }else if(skill.type==='teamBuff'){
    for(const a of friends){a.atkBuff=clamp(a.atkBuff+skill.multiplier*supportPower(actor),0,.55);if(actor.role==='Support')a.energy=Math.min(100,a.energy+10);}event.targetName='team';event.buff=true;line=`${actor.name} strengthened the team.`;
  }

  if(actor.role==='Support'&&action!=='normal'){for(const a of friends)if(a.uid!==actor.uid)a.energy=Math.min(100,a.energy+5);}
  if(action==='burst')actor.energy=0;else actor.energy=Math.min(100,actor.energy+(skill.energy||0));
  if(action==='skill')actor.cooldowns.skill=skill.cooldown||1;
  battle.log.unshift(line);battle.log=battle.log.slice(0,5);battle.turn+=1;checkWinner(battle);if(!battle.winner)advanceToNextActor(battle);
  return{ok:true,line,event,battle};
}

function checkWinner(b){const p=b.actors.some(a=>a.side==='player'&&alive(a)),e=b.actors.some(a=>a.side==='enemy'&&alive(a));if(!p)b.winner='enemy';if(!e)b.winner='player';}
function advanceToNextActor(b){const living=b.actors.filter(alive);if(!living.length)return;for(const a of living)a._initiative=(a._initiative||0)+a.spd;living.sort((a,c)=>c._initiative-a._initiative||c.spd-a.spd);const a=living[0];a._initiative-=100;a.cooldowns.skill=Math.max(0,a.cooldowns.skill-1);if(a.tauntTurns>0)a.tauntTurns-=1;b.pendingActorUid=a.uid;b.tick+=1;}
export function currentActor(b){return b.actors.find(a=>a.uid===b.pendingActorUid)||null;}
export function validTargets(b,action){const actor=currentActor(b);if(!actor)return[];const skill=actor.skills[action];if(['heal','shield'].includes(skill?.type))return b.actors.filter(a=>a.side===actor.side&&alive(a));if(['teamHeal','teamBuffHeal','teamBuff'].includes(skill?.type))return[actor];return b.actors.filter(a=>a.side!==actor.side&&alive(a));}
export function chooseCpuAction(b,rng=Math.random){
  const actor=currentActor(b);if(!actor||actor.side!=='enemy')return null;const friends=alliesOf(b,actor),foes=enemiesOf(b,actor),low=friends.find(a=>a.hp/a.maxHp<.40);let action='normal';
  if(actor.energy>=(actor.skills.burst.cost||80))action='burst';else if(actor.cooldowns.skill===0)action='skill';if(low&&['heal','teamHeal','teamBuffHeal','shield'].includes(actor.skills.skill.type))action='skill';
  const targets=validTargets(b,action);const taunter=foes.find(a=>a.tauntTurns>0&&a.role==='Tank');const target=taunter||[...targets].sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0]||foes[Math.floor(rng()*foes.length)]||actor;return{actorUid:actor.uid,action,targetUid:target.uid};
}
export function runCpuUntilPlayerTurn(b,rng=Math.random,max=20){const events=[];let guard=0;while(!b.winner&&currentActor(b)?.side==='enemy'&&guard<max){const move=chooseCpuAction(b,rng);if(!move)break;events.push(act(b,move.actorUid,move.action,move.targetUid,rng));guard+=1;}return events;}

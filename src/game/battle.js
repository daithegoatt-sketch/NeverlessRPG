import { buildCharacterStats } from './stats.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const alive = (actor) => actor.hp > 0;

function playerActor(player, charId, side = 'player') {
  const built = buildCharacterStats(player, charId);
  if (!built) throw new Error(`Unknown/unowned character: ${charId}`);
  return {
    uid:`${side}:${charId}`, side, id:charId, name:built.definition.name,
    image:built.definition.image, icon:built.definition.icon, element:built.definition.element,
    role:built.definition.role, skills:structuredClone(built.definition.skills),
    maxHp:built.stats.hp, hp:built.stats.hp, atk:built.stats.atk, def:built.stats.def, spd:built.stats.spd,
    critRate:built.stats.critRate, critDmg:built.stats.critDmg, elementDmg:built.stats.elementDmg || 0,
    energy:0, shield:0, atkBuff:0, dmgTakenAmp:0, cooldowns:{ skill:0 },
  };
}

function enemyActor(enemy, idx) {
  const skillName = enemy.element === 'Physical' ? 'Heavy Attack' : `${enemy.element} Strike`;
  return {
    uid:`enemy:${idx}:${enemy.id}`, side:'enemy', id:enemy.id, name:enemy.name, image:enemy.image, icon:enemy.image,
    element:enemy.element, role:'Enemy', maxHp:enemy.hp, hp:enemy.hp, atk:enemy.atk, def:enemy.def, spd:enemy.spd,
    critRate:0.08, critDmg:0.50, elementDmg:0, energy:0, shield:0, atkBuff:0, dmgTakenAmp:0,
    cooldowns:{ skill:0 },
    skills:{
      normal:{ name:'Attack', type:'damage', multiplier:1.00, energy:25, description:'Standard enemy attack for 1.00× ATK.' },
      skill:{ name:skillName, type:'damage', multiplier:1.45, energy:35, cooldown:1, description:'Enemy skill attack for 1.45× ATK.' },
      burst:{ name:'Rage', type:'damage', multiplier:2.10, cost:80, description:'Enemy burst attack for 2.10× ATK.' },
    },
  };
}

export function createDomainBattle(player, teamIds, domain) {
  return createBattle({ mode:'domain', playerTeam:teamIds.map((id) => playerActor(player,id)), enemyTeam:domain.enemies.map(enemyActor), meta:{ domainId:domain.id, domainName:domain.name } });
}

export function createCpuBattle(player, teamIds, cpuPlayer) {
  const cpuIds = Object.keys(cpuPlayer.characters).slice(0,4);
  return createBattle({ mode:'cpu', playerTeam:teamIds.map((id) => playerActor(player,id)), enemyTeam:cpuIds.map((id) => playerActor(cpuPlayer,id,'enemy')), meta:{ opponentName:'Neverless Automaton' } });
}

export function createBattle({ mode, playerTeam, enemyTeam, meta = {} }) {
  const battle = {
    id:`b_${Date.now()}_${Math.floor(Math.random()*1e7)}`, mode, turn:0, tick:0,
    actors:[...playerTeam,...enemyTeam], log:['Battle started.'], winner:null, meta, pendingActorUid:null,
  };
  advanceToNextActor(battle);
  return battle;
}

function effectiveAtk(actor) { return actor.atk * (1 + actor.atkBuff); }

function applyDamage(target, amount) {
  let dmg = Math.max(1, Math.round(amount));
  let absorbed = 0;
  if (target.shield > 0) {
    absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
  }
  target.hp = Math.max(0, target.hp - dmg);
  return { damage:dmg, absorbed };
}

function damageRoll(actor, target, multiplier, rng) {
  const crit = rng() < actor.critRate;
  const defenseFactor = 100 / (100 + target.def * 0.6);
  const amp = 1 + actor.elementDmg + target.dmgTakenAmp;
  const base = effectiveAtk(actor) * multiplier * defenseFactor * amp;
  return { damage:base * (crit ? 1 + actor.critDmg : 1), crit };
}

function alliesOf(battle, actor) { return battle.actors.filter((a) => a.side === actor.side && alive(a)); }
function enemiesOf(battle, actor) { return battle.actors.filter((a) => a.side !== actor.side && alive(a)); }

function heal(target, amount) {
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + Math.round(amount));
  return target.hp - before;
}

export function act(battle, actorUid, action, targetUid, rng = Math.random) {
  if (battle.winner) return { ok:false, reason:'BATTLE_ENDED' };
  if (battle.pendingActorUid !== actorUid) return { ok:false, reason:'NOT_YOUR_TURN' };
  const actor = battle.actors.find((a) => a.uid === actorUid);
  if (!actor || !alive(actor)) return { ok:false, reason:'INVALID_ACTOR' };

  const skill = actor.skills[action];
  if (!skill) return { ok:false, reason:'INVALID_ACTION' };
  if (action === 'skill' && actor.cooldowns.skill > 0) return { ok:false, reason:'COOLDOWN' };
  if (action === 'burst' && actor.energy < (skill.cost || 80)) return { ok:false, reason:'NO_ENERGY' };

  let target = battle.actors.find((a) => a.uid === targetUid && alive(a));
  const friends = alliesOf(battle, actor);
  const foes = enemiesOf(battle, actor);
  const isSupport = ['heal','teamHeal','teamBuffHeal','shield','teamBuff'].includes(skill.type);
  if (!target) target = isSupport ? actor : foes[0];

  const event = {
    actorUid:actor.uid, actorName:actor.name, actorSide:actor.side, actorElement:actor.element,
    action, skillName:skill.name, skillDescription:skill.description || '', targetUid:target?.uid || null,
    targetName:target?.name || null, damage:0, healed:0, shield:0, crit:false, buff:false, debuff:false,
  };
  let line = '';

  if (['damage','damageShield','damageDebuff','damageTeamBuff','selfBuffDamage','damageHeal'].includes(skill.type)) {
    if (!target || target.side === actor.side) target = foes[0];
    if (!target) return { ok:false, reason:'NO_TARGET' };
    event.targetUid = target.uid; event.targetName = target.name;
    const roll = damageRoll(actor,target,skill.multiplier,rng);
    const applied = applyDamage(target,roll.damage);
    event.damage = applied.damage; event.absorbed = applied.absorbed; event.crit = roll.crit;
    line = `${actor.name} used ${skill.name} on ${target.name}: ${applied.damage} DMG${roll.crit ? ' CRIT' : ''}.`;

    if (skill.type === 'damageShield') { event.shield = Math.round(actor.maxHp*0.15); actor.shield += event.shield; }
    if (skill.type === 'damageDebuff') { target.dmgTakenAmp = clamp(target.dmgTakenAmp+0.10,0,0.35); event.debuff = true; }
    if (skill.type === 'damageTeamBuff') { for (const a of friends) a.atkBuff = clamp(a.atkBuff+0.10,0,0.40); event.buff = true; }
    if (skill.type === 'selfBuffDamage') { actor.atkBuff = clamp(actor.atkBuff+0.20,0,0.50); event.buff = true; }
    if (skill.type === 'damageHeal') { event.healed = heal(actor,actor.maxHp*0.18); line += ` Healed ${event.healed}.`; }
  } else if (skill.type === 'heal') {
    if (!target || target.side !== actor.side) target = friends.sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0];
    event.targetUid = target.uid; event.targetName = target.name; event.healed = heal(target,target.maxHp*skill.multiplier);
    line = `${actor.name} used ${skill.name} and healed ${target.name} for ${event.healed} HP.`;
  } else if (skill.type === 'teamHeal') {
    for (const a of friends) event.healed += heal(a,a.maxHp*skill.multiplier);
    event.targetName = 'team';
    line = `${actor.name} used ${skill.name} and restored ${event.healed} team HP.`;
  } else if (skill.type === 'teamBuffHeal') {
    for (const a of friends) { event.healed += heal(a,a.maxHp*skill.multiplier); a.atkBuff = clamp(a.atkBuff+0.18,0,0.50); }
    event.targetName = 'team'; event.buff = true;
    line = `${actor.name} used ${skill.name}: team healed ${event.healed} HP and gained ATK.`;
  } else if (skill.type === 'shield') {
    event.shield = Math.round(actor.maxHp*skill.multiplier); actor.shield += event.shield;
    event.targetName = actor.name;
    line = `${actor.name} used ${skill.name} and gained ${event.shield} shield.`;
  } else if (skill.type === 'teamBuff') {
    for (const a of friends) a.atkBuff = clamp(a.atkBuff+skill.multiplier,0,0.50);
    event.targetName = 'team'; event.buff = true;
    line = `${actor.name} used ${skill.name} and strengthened the team.`;
  }

  if (action === 'burst') actor.energy = 0;
  else actor.energy = Math.min(100, actor.energy + (skill.energy || 0));
  if (action === 'skill') actor.cooldowns.skill = skill.cooldown || 1;

  battle.log.unshift(line);
  battle.log = battle.log.slice(0,6);
  battle.turn += 1;
  checkWinner(battle);
  if (!battle.winner) advanceToNextActor(battle);
  return { ok:true, line, event, battle };
}

function checkWinner(battle) {
  const playerAlive = battle.actors.some((a) => a.side === 'player' && alive(a));
  const enemyAlive = battle.actors.some((a) => a.side === 'enemy' && alive(a));
  if (!playerAlive) battle.winner = 'enemy';
  if (!enemyAlive) battle.winner = 'player';
}

function advanceToNextActor(battle) {
  const living = battle.actors.filter(alive);
  if (!living.length) return;
  for (const actor of living) actor._initiative = (actor._initiative || 0) + actor.spd;
  living.sort((a,b) => b._initiative - a._initiative || b.spd - a.spd);
  const actor = living[0];
  actor._initiative -= 100;
  actor.cooldowns.skill = Math.max(0,actor.cooldowns.skill-1);
  battle.pendingActorUid = actor.uid;
  battle.tick += 1;
}

export function currentActor(battle) { return battle.actors.find((a) => a.uid === battle.pendingActorUid) || null; }

export function validTargets(battle, action) {
  const actor = currentActor(battle);
  if (!actor) return [];
  const skill = actor.skills[action];
  const support = ['heal','shield'].includes(skill?.type);
  if (support) return battle.actors.filter((a) => a.side === actor.side && alive(a));
  if (['teamHeal','teamBuffHeal','teamBuff'].includes(skill?.type)) return [actor];
  return battle.actors.filter((a) => a.side !== actor.side && alive(a));
}

export function chooseCpuAction(battle, rng = Math.random) {
  const actor = currentActor(battle);
  if (!actor || actor.side !== 'enemy') return null;
  const friends = alliesOf(battle,actor);
  const foes = enemiesOf(battle,actor);
  const low = friends.find((a) => a.hp/a.maxHp < 0.45);
  let action = 'normal';
  if (actor.energy >= (actor.skills.burst.cost || 80)) action = 'burst';
  else if (actor.cooldowns.skill === 0) action = 'skill';
  if (low && ['heal','teamHeal','teamBuffHeal','shield'].includes(actor.skills.skill.type)) action = 'skill';
  const targets = validTargets(battle,action);
  const target = targets.sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0] || foes[Math.floor(rng()*foes.length)] || actor;
  return { actorUid:actor.uid, action, targetUid:target.uid };
}

export function runCpuUntilPlayerTurn(battle, rng = Math.random, max = 20) {
  const events = [];
  let guard = 0;
  while (!battle.winner && currentActor(battle)?.side === 'enemy' && guard < max) {
    const move = chooseCpuAction(battle,rng);
    if (!move) break;
    events.push(act(battle,move.actorUid,move.action,move.targetUid,rng));
    guard += 1;
  }
  return events;
}

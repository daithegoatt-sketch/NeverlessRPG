import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { domains } from '../data/domains.js';
import { currentActor, validTargets } from '../game/battle.js';
import { calculatePlayerPower } from '../game/stats.js';

export const cid = (userId, action, arg = '') => `nls|${userId}|${action}|${arg}`;
const btn = (userId, action, label, style = ButtonStyle.Secondary, emoji, arg = '', disabled = false) => {
  const b = new ButtonBuilder().setCustomId(cid(userId,action,arg)).setLabel(label).setStyle(style).setDisabled(disabled);
  if (emoji) b.setEmoji(emoji);
  return b;
};

export function homeComponents(userId) {
  const menu = new StringSelectMenuBuilder().setCustomId(cid(userId,'mainmenu')).setPlaceholder('Open Neverless RPG menu').addOptions([
    {label:'Wish',description:'Characters, weapons, pity and visual pulls',value:'wish',emoji:'🌠'},
    {label:'Domains',description:'Artifacts, quick clears and first-clear rewards',value:'domains',emoji:'🏛️'},
    {label:'CPU Arena',description:'Test the battle engine against AI',value:'cpu',emoji:'⚔️'},
    {label:'Characters',description:'Roster, talents, equipment and showcase',value:'characters',emoji:'🧙'},
    {label:'Inventory',description:'Characters, weapons and artifacts',value:'inventory',emoji:'🎒'},
    {label:'Artifacts',description:'Artifact inventory and equipment status',value:'artifacts',emoji:'🏺'},
    {label:'Upgrades',description:'Permanent account upgrades',value:'upgrades',emoji:'📈'},
    {label:'Profile',description:'Refresh the profile dashboard',value:'profile',emoji:'👤'},
  ]);
  return [new ActionRowBuilder().addComponents(menu)];
}

export function backRow(userId,to='home') {
  return [new ActionRowBuilder().addComponents(
    btn(userId,'view','Back',ButtonStyle.Secondary,'⬅️',to),
    btn(userId,'view','Profile',ButtonStyle.Primary,'👤','home'),
  )];
}

export function wishComponents(userId,banner='character',player=null) {
  const primos = player?.primogems ?? 999999;
  return [
    new ActionRowBuilder().addComponents(
      btn(userId,'wishbanner','Character Banner',banner==='character'?ButtonStyle.Primary:ButtonStyle.Secondary,'🧙','character'),
      btn(userId,'wishbanner','Weapon Banner',banner==='weapon'?ButtonStyle.Primary:ButtonStyle.Secondary,'🗡️','weapon'),
    ),
    new ActionRowBuilder().addComponents(
      btn(userId,'wish','Wish ×1 • 160',ButtonStyle.Success,'✨','1',primos<160),
      btn(userId,'wish','Wish ×10 • 1600',ButtonStyle.Success,'🌠','10',primos<1600),
      btn(userId,'view','Profile',ButtonStyle.Secondary,'👤','home'),
    ),
  ];
}

export function domainComponents(userId,player,session={}) {
  const menu = new StringSelectMenuBuilder().setCustomId(cid(userId,'domainselect')).setPlaceholder('Choose a domain').addOptions(
    Object.values(domains).map((d)=>({label:d.name,description:`PWR ${d.recommendedPower.toLocaleString()} • ${d.resin} Resin`,value:d.id,default:d.id===session.domainId}))
  );
  const charIds=Object.keys(player.characters).slice(0,25);
  const chars=charIds.map((id)=>({label:characters[id].name,description:`${characters[id].element} • Lv.${player.characters[id].level}`,value:id,default:(session.team||[]).includes(id)}));
  const team = new StringSelectMenuBuilder().setCustomId(cid(userId,'teamselect','domain')).setPlaceholder('Select exactly 4 characters')
    .setMinValues(Math.min(4,chars.length)).setMaxValues(Math.min(4,chars.length)).addOptions(chars);
  const domain=session.domainId?domains[session.domainId]:null;
  const progress=domain?(player.domainProgress?.[domain.id] || {clears:0}):{clears:0};
  const ready=Boolean(domain && (session.team||[]).length===4);
  const quickReady=Boolean(domain && progress.clears>0 && calculatePlayerPower(player)>=Math.ceil(domain.recommendedPower*1.12) && player.resin>=domain.resin);
  return [
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(team),
    new ActionRowBuilder().addComponents(
      btn(userId,'startdomain','Start Domain',ButtonStyle.Success,'⚔️','',!ready || !domain || player.resin<domain.resin),
      btn(userId,'quickdomain','Quick Clear',ButtonStyle.Primary,'⚡','',!quickReady),
      btn(userId,'view','Profile',ButtonStyle.Secondary,'👤','home'),
    ),
  ];
}

export function cpuComponents(userId,player,session={}) {
  const chars=Object.keys(player.characters).slice(0,25).map((id)=>({label:characters[id].name,description:`${characters[id].element} • Lv.${player.characters[id].level}`,value:id,default:(session.team||[]).includes(id)}));
  const team=new StringSelectMenuBuilder().setCustomId(cid(userId,'teamselect','cpu')).setPlaceholder('Choose exactly 4 characters')
    .setMinValues(Math.min(4,chars.length)).setMaxValues(Math.min(4,chars.length)).addOptions(chars);
  return [
    new ActionRowBuilder().addComponents(team),
    new ActionRowBuilder().addComponents(
      btn(userId,'startcpu','Start CPU Battle',ButtonStyle.Danger,'⚔️','',(session.team||[]).length!==4),
      btn(userId,'view','Profile',ButtonStyle.Secondary,'👤','home'),
    ),
  ];
}

export function characterComponents(userId,player) {
  const ids=Object.keys(player.characters).slice(0,25);
  const inspectOptions=ids.map((id)=>({label:characters[id].name,description:`${characters[id].element} • Lv.${player.characters[id].level}`,value:id}));
  const showcaseOptions=ids.map((id)=>({label:characters[id].name,description:`Show on profile • Lv.${player.characters[id].level}`,value:id,default:(player.showcase||[]).includes(id)}));
  const inspect=new StringSelectMenuBuilder().setCustomId(cid(userId,'charinspect')).setPlaceholder('Inspect a character').addOptions(inspectOptions);
  const showcase=new StringSelectMenuBuilder().setCustomId(cid(userId,'showcaseselect')).setPlaceholder('Choose profile showcase characters')
    .setMinValues(1).setMaxValues(Math.min(10,showcaseOptions.length)).addOptions(showcaseOptions);
  return [new ActionRowBuilder().addComponents(inspect),new ActionRowBuilder().addComponents(showcase),...backRow(userId)];
}

export function characterDetailComponents(userId,charId) {
  return [
    new ActionRowBuilder().addComponents(
      btn(userId,'levelchar','Level +1',ButtonStyle.Success,'⬆️',`${charId}:1`),
      btn(userId,'levelchar','Level +5',ButtonStyle.Success,'⏫',`${charId}:5`),
      btn(userId,'equipweaponchar','Weapon',ButtonStyle.Secondary,'🗡️',charId),
      btn(userId,'equipartifactchar','Artifact',ButtonStyle.Secondary,'🏺',charId),
    ),
    new ActionRowBuilder().addComponents(
      btn(userId,'talent','Normal Talent',ButtonStyle.Secondary,'🗡️',`${charId}:normal`),
      btn(userId,'talent','Skill Talent',ButtonStyle.Primary,'✨',`${charId}:skill`),
      btn(userId,'talent','Burst Talent',ButtonStyle.Danger,'💥',`${charId}:burst`),
    ),
    ...backRow(userId,'characters'),
  ];
}

export function weaponEquipComponents(userId,player,charId) {
  const type=characters[charId].weaponType;
  const options=Object.keys(player.weapons).filter((id)=>weapons[id]?.type===type).slice(0,25)
    .map((id)=>({label:weapons[id].name,description:`${weapons[id].rarity}★ • ${type} • Lv.${player.weapons[id].level}`,value:id}));
  const rows=[];
  if(options.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(cid(userId,'equipweapon',charId)).setPlaceholder(`Choose ${type}`).addOptions(options)));
  rows.push(...backRow(userId,'characters')); return rows;
}

export function artifactEquipComponents(userId,player,charId) {
  const options=Object.values(player.artifacts).slice(0,25).map((a)=>({label:`${a.slot} • ${a.setId}`,description:`${a.rarity}★ +${a.level} • ${a.main.key}`,value:a.id}));
  const rows=[];
  if(options.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(cid(userId,'equipartifact',charId)).setPlaceholder('Choose artifact').addOptions(options)));
  rows.push(...backRow(userId,'characters')); return rows;
}

export function upgradeComponents(userId) {
  return [new ActionRowBuilder().addComponents(
    btn(userId,'passive','ATK',ButtonStyle.Secondary,'⚔️','atk'),
    btn(userId,'passive','HP',ButtonStyle.Secondary,'❤️','hp'),
    btn(userId,'passive','CRIT Rate',ButtonStyle.Secondary,'🎯','critRate'),
    btn(userId,'passive','CRIT DMG',ButtonStyle.Secondary,'💥','critDmg'),
    btn(userId,'passive','SPD',ButtonStyle.Secondary,'💨','spd'),
  ),...backRow(userId)];
}

export function battleComponents(userId,battle,pendingAction=null) {
  const actor=currentActor(battle);
  if(!actor || battle.winner) return backRow(userId);
  if(actor.side!=='player') return [new ActionRowBuilder().addComponents(btn(userId,'battlewait','CPU thinking…',ButtonStyle.Secondary,'🤖'))];
  if(pendingAction){
    const targets=validTargets(battle,pendingAction).slice(0,25);
    const select=new StringSelectMenuBuilder().setCustomId(cid(userId,'battletarget',pendingAction)).setPlaceholder('Choose target')
      .addOptions(targets.map((t)=>({label:t.name,description:`${Math.round(t.hp)}/${t.maxHp} HP`,value:t.uid})));
    return [new ActionRowBuilder().addComponents(select),new ActionRowBuilder().addComponents(btn(userId,'battlecancel','Cancel',ButtonStyle.Secondary,'↩️'))];
  }
  return [new ActionRowBuilder().addComponents(
    btn(userId,'battleaction',`Normal Lv.${actor.skills.normal?.talentLevel||1}`,ButtonStyle.Secondary,'🗡️','normal'),
    btn(userId,'battleaction',`Skill Lv.${actor.skills.skill?.talentLevel||1}`,actor.cooldowns.skill>0?ButtonStyle.Secondary:ButtonStyle.Primary,'✨','skill',actor.cooldowns.skill>0),
    btn(userId,'battleaction',`Burst Lv.${actor.skills.burst?.talentLevel||1}`,ButtonStyle.Danger,'💥','burst',actor.energy<(actor.skills.burst.cost||80)),
    btn(userId,'forfeit','Forfeit',ButtonStyle.Secondary,'🏳️'),
  )];
}

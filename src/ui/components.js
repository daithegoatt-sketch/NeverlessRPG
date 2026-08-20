import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { domains } from '../data/domains.js';
import { currentActor, validTargets } from '../game/battle.js';
import { calculatePlayerPower } from '../game/stats.js';

export const cid = (userId, action, arg = '') => `nls|${userId}|${action}|${arg}`;
const btn = (userId, action, label, style = ButtonStyle.Secondary, emoji, arg = '', disabled = false) => {
  const b = new ButtonBuilder().setCustomId(cid(userId, action, arg)).setLabel(label).setStyle(style).setDisabled(disabled);
  if (emoji) b.setEmoji(emoji);
  return b;
};

export function homeComponents(userId, player = null) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(cid(userId, 'mainmenu'))
    .setPlaceholder('Open Neverless RPG menu')
    .addOptions([
      { label: 'Wish', description: 'Characters, weapons and pity', value: 'wish', emoji: '🌠' },
      { label: 'Domains', description: 'Farm artifacts, Mora and XP', value: 'domains', emoji: '🏛️' },
      { label: 'CPU Arena', description: 'Fight the Neverless Automaton', value: 'cpu', emoji: '⚔️' },
      { label: 'Characters', description: 'Roster, talents, gear and showcase', value: 'characters', emoji: '🧙' },
      { label: 'Inventory', description: 'Weapons and resources', value: 'inventory', emoji: '🎒' },
      { label: 'Artifacts', description: 'Artifact inventory', value: 'artifacts', emoji: '🏺' },
      { label: 'Upgrades', description: 'Permanent account upgrades', value: 'upgrades', emoji: '📈' },
      { label: 'Profile', description: 'Return to the main RPG profile', value: 'home', emoji: '👤' },
    ]);
  const dailyReady = !player?.daily?.lastClaimAt || Date.now() - player.daily.lastClaimAt >= 86_400_000;
  return [
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(
      btn(userId, 'daily', dailyReady ? 'Claim Daily Reward' : `Daily Streak ${player?.daily?.streak || 1}`, ButtonStyle.Success, '🎁', '', !dailyReady),
    ),
  ];
}

export function profileRow(userId) {
  return [new ActionRowBuilder().addComponents(btn(userId, 'home', 'Profile', ButtonStyle.Primary, '👤'))];
}

export function wishComponents(userId, banner = 'character', player = null) {
  const primos = player?.primogems ?? 999999;
  return [
    new ActionRowBuilder().addComponents(
      btn(userId, 'wishbanner', 'Character Banner', banner === 'character' ? ButtonStyle.Primary : ButtonStyle.Secondary, '🧙', 'character'),
      btn(userId, 'wishbanner', 'Weapon Banner', banner === 'weapon' ? ButtonStyle.Primary : ButtonStyle.Secondary, '🗡️', 'weapon'),
    ),
    new ActionRowBuilder().addComponents(
      btn(userId, 'wish', 'Wish ×1 • 160', ButtonStyle.Success, '✨', '1', primos < 160),
      btn(userId, 'wish', 'Wish ×10 • 1600', ButtonStyle.Success, '🌠', '10', primos < 1600),
      btn(userId, 'home', 'Profile', ButtonStyle.Secondary, '👤'),
    ),
  ];
}

export function domainComponents(userId, player, session = {}) {
  const menu = new StringSelectMenuBuilder().setCustomId(cid(userId, 'domainselect')).setPlaceholder('Choose a domain').addOptions(
    Object.values(domains).map((d) => ({ label: d.name, description: `${d.resin} Resin • Lv.${d.level}`, value: d.id, default: d.id === session.domainId })),
  );
  const charIds = Object.keys(player.characters).slice(0, 25);
  const options = charIds.map((id) => ({ label: characters[id].name, description: `${characters[id].element} • Lv.${player.characters[id].level}`, value: id, default: (session.team || []).includes(id) }));
  const team = new StringSelectMenuBuilder().setCustomId(cid(userId, 'teamselect', 'domain')).setPlaceholder('Choose exactly 4 characters')
    .setMinValues(Math.min(4, options.length)).setMaxValues(Math.min(4, options.length)).addOptions(options);
  const domain = session.domainId ? domains[session.domainId] : null;
  const progress = domain ? (player.domainProgress?.[domain.id] || { clears: 0 }) : { clears: 0 };
  const teamReady = (session.team || []).length === 4;
  const quickReady = Boolean(domain && progress.clears > 0 && calculatePlayerPower(player) >= Math.ceil((domain.recommendedPower || 0) * 1.12) && player.resin >= domain.resin);
  return [
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(team),
    new ActionRowBuilder().addComponents(
      btn(userId, 'startdomain', 'Start Domain', ButtonStyle.Success, '⚔️', '', !domain || !teamReady || player.resin < (domain?.resin || 999)),
      btn(userId, 'quickdomain', 'Quick Clear', ButtonStyle.Primary, '⚡', '', !quickReady),
      btn(userId, 'home', 'Profile', ButtonStyle.Secondary, '👤'),
    ),
  ];
}

export function cpuComponents(userId, player, session = {}) {
  const options = Object.keys(player.characters).slice(0, 25).map((id) => ({ label: characters[id].name, description: `${characters[id].element} • Lv.${player.characters[id].level}`, value: id, default: (session.team || []).includes(id) }));
  const team = new StringSelectMenuBuilder().setCustomId(cid(userId, 'teamselect', 'cpu')).setPlaceholder('Choose exactly 4 characters')
    .setMinValues(Math.min(4, options.length)).setMaxValues(Math.min(4, options.length)).addOptions(options);
  return [
    new ActionRowBuilder().addComponents(team),
    new ActionRowBuilder().addComponents(
      btn(userId, 'startcpu', 'Start CPU Battle', ButtonStyle.Danger, '⚔️', '', (session.team || []).length !== 4),
      btn(userId, 'home', 'Profile', ButtonStyle.Secondary, '👤'),
    ),
  ];
}

export function characterComponents(userId, player) {
  const ids = Object.keys(player.characters).slice(0, 25);
  const inspect = new StringSelectMenuBuilder().setCustomId(cid(userId, 'charinspect')).setPlaceholder('Inspect a character').addOptions(
    ids.map((id) => ({ label: characters[id].name, description: `${characters[id].element} • Lv.${player.characters[id].level}`, value: id })),
  );
  const showcase = new StringSelectMenuBuilder().setCustomId(cid(userId, 'showcaseselect')).setPlaceholder('Choose profile showcase characters')
    .setMinValues(1).setMaxValues(Math.min(10, ids.length)).addOptions(
      ids.map((id) => ({ label: characters[id].name, description: `Show on profile • Lv.${player.characters[id].level}`, value: id, default: (player.showcase || []).includes(id) })),
    );
  return [new ActionRowBuilder().addComponents(inspect), new ActionRowBuilder().addComponents(showcase), ...profileRow(userId)];
}

export function characterDetailComponents(userId, charId) {
  return [
    new ActionRowBuilder().addComponents(
      btn(userId, 'levelchar', 'Level +1', ButtonStyle.Success, '⬆️', `${charId}:1`),
      btn(userId, 'levelchar', 'Level +5', ButtonStyle.Success, '⏫', `${charId}:5`),
      btn(userId, 'equipweaponchar', 'Weapon', ButtonStyle.Secondary, '🗡️', charId),
      btn(userId, 'equipartifactchar', 'Artifact', ButtonStyle.Secondary, '🏺', charId),
    ),
    new ActionRowBuilder().addComponents(
      btn(userId, 'talent', 'Normal Talent', ButtonStyle.Secondary, '🗡️', `${charId}:normal`),
      btn(userId, 'talent', 'Skill Talent', ButtonStyle.Primary, '✨', `${charId}:skill`),
      btn(userId, 'talent', 'Burst Talent', ButtonStyle.Danger, '💥', `${charId}:burst`),
    ),
    new ActionRowBuilder().addComponents(
      btn(userId, 'open', 'Back to Roster', ButtonStyle.Secondary, '📚', 'characters'),
      btn(userId, 'home', 'Profile', ButtonStyle.Primary, '👤'),
    ),
  ];
}

export function weaponEquipComponents(userId, player, charId) {
  const type = characters[charId].weaponType;
  const options = Object.keys(player.weapons).filter((id) => weapons[id]?.type === type).slice(0, 25)
    .map((id) => ({ label: weapons[id].name, description: `${weapons[id].rarity}★ • ${type} • Lv.${player.weapons[id].level}`, value: id }));
  const rows = [];
  if (options.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(cid(userId, 'equipweapon', charId)).setPlaceholder(`Choose ${type}`).addOptions(options)));
  rows.push(...profileRow(userId));
  return rows;
}

export function artifactEquipComponents(userId, player, charId) {
  const options = Object.values(player.artifacts).slice(0, 25).map((a) => ({ label: `${a.slot} • ${a.setId}`, description: `${a.rarity}★ +${a.level} • ${a.main.key}`, value: a.id }));
  const rows = [];
  if (options.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(cid(userId, 'equipartifact', charId)).setPlaceholder('Choose artifact').addOptions(options)));
  rows.push(...profileRow(userId));
  return rows;
}

export function upgradeComponents(userId) {
  return [
    new ActionRowBuilder().addComponents(
      btn(userId, 'passive', 'ATK', ButtonStyle.Secondary, '⚔️', 'atk'),
      btn(userId, 'passive', 'HP', ButtonStyle.Secondary, '❤️', 'hp'),
      btn(userId, 'passive', 'CRIT Rate', ButtonStyle.Secondary, '🎯', 'critRate'),
      btn(userId, 'passive', 'CRIT DMG', ButtonStyle.Secondary, '💥', 'critDmg'),
      btn(userId, 'passive', 'SPD', ButtonStyle.Secondary, '💨', 'spd'),
    ),
    ...profileRow(userId),
  ];
}

export function battleComponents(userId, battle, pendingAction = null) {
  const actor = currentActor(battle);
  if (!actor || battle.winner) return profileRow(userId);
  if (actor.side !== 'player') return [new ActionRowBuilder().addComponents(btn(userId, 'battlewait', 'CPU Turn', ButtonStyle.Secondary, '🤖'))];
  if (pendingAction) {
    const targets = validTargets(battle, pendingAction).slice(0, 25);
    const select = new StringSelectMenuBuilder().setCustomId(cid(userId, 'battletarget', pendingAction)).setPlaceholder('Choose target')
      .addOptions(targets.map((t) => ({ label: t.name, description: `${Math.round(t.hp)}/${t.maxHp} HP`, value: t.uid })));
    return [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(
        btn(userId, 'battlecancel', 'Cancel', ButtonStyle.Secondary, '↩️'),
        btn(userId, 'forfeit', 'Forfeit', ButtonStyle.Danger, '🏳️'),
      ),
    ];
  }
  return [new ActionRowBuilder().addComponents(
    btn(userId, 'battleaction', `Normal Lv.${actor.skills.normal?.talentLevel || 1}`, ButtonStyle.Secondary, '🗡️', 'normal'),
    btn(userId, 'battleaction', `Skill Lv.${actor.skills.skill?.talentLevel || 1}`, actor.cooldowns.skill > 0 ? ButtonStyle.Secondary : ButtonStyle.Primary, '✨', 'skill', actor.cooldowns.skill > 0),
    btn(userId, 'battleaction', `Burst Lv.${actor.skills.burst?.talentLevel || 1}`, ButtonStyle.Danger, '💥', 'burst', actor.energy < (actor.skills.burst.cost || 80)),
    btn(userId, 'forfeit', 'Forfeit', ButtonStyle.Secondary, '🏳️'),
  )];
}

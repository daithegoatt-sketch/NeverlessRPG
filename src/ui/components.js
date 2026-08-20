import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { domains } from '../data/domains.js';
import { currentActor, validTargets } from '../game/battle.js';

export const cid = (userId, action, arg = '') => `nls|${userId}|${action}|${arg}`;

const btn = (userId, action, label, style = ButtonStyle.Secondary, emoji, arg = '') => {
  const b = new ButtonBuilder().setCustomId(cid(userId, action, arg)).setLabel(label).setStyle(style);
  if (emoji) b.setEmoji(emoji);
  return b;
};

export function homeComponents(userId) {
  return [
    new ActionRowBuilder().addComponents(
      btn(userId, 'view', 'Wish', ButtonStyle.Primary, '🌠', 'wish'),
      btn(userId, 'view', 'Domains', ButtonStyle.Primary, '🏛️', 'domains'),
      btn(userId, 'view', 'CPU Arena', ButtonStyle.Danger, '⚔️', 'cpu'),
      btn(userId, 'view', 'Characters', ButtonStyle.Secondary, '🧙', 'characters'),
    ),
    new ActionRowBuilder().addComponents(
      btn(userId, 'view', 'Inventory', ButtonStyle.Secondary, '🎒', 'inventory'),
      btn(userId, 'view', 'Artifacts', ButtonStyle.Secondary, '🏺', 'artifacts'),
      btn(userId, 'view', 'Upgrades', ButtonStyle.Secondary, '📈', 'upgrades'),
      btn(userId, 'view', 'Profile', ButtonStyle.Secondary, '👤', 'profile'),
    ),
  ];
}

export function backRow(userId, to = 'home') {
  return [new ActionRowBuilder().addComponents(btn(userId, 'view', 'Back', ButtonStyle.Secondary, '⬅️', to))];
}

export function wishComponents(userId, banner = 'character') {
  return [
    new ActionRowBuilder().addComponents(
      btn(userId, 'wishbanner', 'Character Banner', banner === 'character' ? ButtonStyle.Primary : ButtonStyle.Secondary, '🧙', 'character'),
      btn(userId, 'wishbanner', 'Weapon Banner', banner === 'weapon' ? ButtonStyle.Primary : ButtonStyle.Secondary, '🗡️', 'weapon'),
    ),
    new ActionRowBuilder().addComponents(
      btn(userId, 'wish', 'Wish ×1', ButtonStyle.Success, '✨', '1'),
      btn(userId, 'wish', 'Wish ×10', ButtonStyle.Success, '🌠', '10'),
      btn(userId, 'view', 'Back', ButtonStyle.Secondary, '⬅️', 'home'),
    ),
  ];
}

export function domainComponents(userId, player) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(cid(userId, 'domainselect'))
    .setPlaceholder('Choose a domain')
    .addOptions(Object.values(domains).map((d) => ({ label: d.name, description: `${d.resin} Resin • Lv.${d.level}`, value: d.id })));
  const chars = Object.keys(player.characters).slice(0, 25).map((id) => ({ label: characters[id].name, description: `${characters[id].element} • Lv.${player.characters[id].level}`, value: id }));
  const team = new StringSelectMenuBuilder()
    .setCustomId(cid(userId, 'teamselect', 'domain'))
    .setPlaceholder('Choose exactly 4 characters')
    .setMinValues(Math.min(4, chars.length)).setMaxValues(Math.min(4, chars.length)).addOptions(chars);
  return [new ActionRowBuilder().addComponents(menu), new ActionRowBuilder().addComponents(team), ...backRow(userId)];
}

export function cpuComponents(userId, player) {
  const chars = Object.keys(player.characters).slice(0, 25).map((id) => ({ label: characters[id].name, description: `${characters[id].element} • Lv.${player.characters[id].level}`, value: id }));
  const team = new StringSelectMenuBuilder()
    .setCustomId(cid(userId, 'teamselect', 'cpu'))
    .setPlaceholder('Choose exactly 4 characters')
    .setMinValues(Math.min(4, chars.length)).setMaxValues(Math.min(4, chars.length)).addOptions(chars);
  return [new ActionRowBuilder().addComponents(team), ...backRow(userId)];
}

export function characterComponents(userId, player) {
  const options = Object.keys(player.characters).slice(0, 25).map((id) => ({ label: characters[id].name, description: `${characters[id].element} • Lv.${player.characters[id].level}`, value: id }));
  const select = new StringSelectMenuBuilder().setCustomId(cid(userId, 'charinspect')).setPlaceholder('Inspect a character').addOptions(options);
  return [new ActionRowBuilder().addComponents(select), ...backRow(userId)];
}

export function characterDetailComponents(userId, charId) {
  return [
    new ActionRowBuilder().addComponents(
      btn(userId, 'levelchar', 'Level Up', ButtonStyle.Success, '⬆️', charId),
      btn(userId, 'equipweaponchar', 'Equip Weapon', ButtonStyle.Secondary, '🗡️', charId),
      btn(userId, 'equipartifactchar', 'Equip Artifact', ButtonStyle.Secondary, '🏺', charId),
    ),
    ...backRow(userId, 'characters'),
  ];
}

export function weaponEquipComponents(userId, player, charId) {
  const type = characters[charId].weaponType;
  const options = Object.keys(player.weapons)
    .filter((id) => weapons[id]?.type === type)
    .slice(0, 25)
    .map((id) => ({ label: weapons[id].name, description: `${'⭐'.repeat(weapons[id].rarity)} • ${type}`, value: id }));
  const rows = [];
  if (options.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(cid(userId, 'equipweapon', charId)).setPlaceholder(`Choose ${type}`).addOptions(options)));
  rows.push(...backRow(userId, 'characters'));
  return rows;
}

export function artifactEquipComponents(userId, player, charId) {
  const options = Object.values(player.artifacts).slice(0, 25).map((a) => ({
    label: `${a.slot} • ${a.setId}`,
    description: `${'⭐'.repeat(a.rarity)} +${a.level} • ${a.main.key}`,
    value: a.id,
  }));
  const rows = [];
  if (options.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(cid(userId, 'equipartifact', charId)).setPlaceholder('Choose artifact').addOptions(options)));
  rows.push(...backRow(userId, 'characters'));
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
    ...backRow(userId),
  ];
}

export function battleComponents(userId, battle, pendingAction = null) {
  const actor = currentActor(battle);
  if (!actor || battle.winner) return backRow(userId);
  if (actor.side !== 'player') return [new ActionRowBuilder().addComponents(btn(userId, 'battlewait', 'CPU thinking…', ButtonStyle.Secondary, '🤖'))];

  if (pendingAction) {
    const targets = validTargets(battle, pendingAction).slice(0, 25);
    const select = new StringSelectMenuBuilder()
      .setCustomId(cid(userId, 'battletarget', pendingAction))
      .setPlaceholder('Choose target')
      .addOptions(targets.map((t) => ({ label: t.name, description: `${Math.round(t.hp)}/${t.maxHp} HP`, value: t.uid })));
    return [new ActionRowBuilder().addComponents(select), new ActionRowBuilder().addComponents(btn(userId, 'battlecancel', 'Cancel', ButtonStyle.Secondary, '↩️'))];
  }

  return [
    new ActionRowBuilder().addComponents(
      btn(userId, 'battleaction', 'Normal', ButtonStyle.Secondary, '🗡️', 'normal'),
      btn(userId, 'battleaction', 'Skill', actor.cooldowns.skill > 0 ? ButtonStyle.Secondary : ButtonStyle.Primary, '✨', 'skill').setDisabled(actor.cooldowns.skill > 0),
      btn(userId, 'battleaction', 'Burst', ButtonStyle.Danger, '💥', 'burst').setDisabled(actor.energy < (actor.skills.burst.cost || 80)),
      btn(userId, 'forfeit', 'Forfeit', ButtonStyle.Secondary, '🏳️'),
    ),
  ];
}

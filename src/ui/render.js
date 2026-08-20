import { EmbedBuilder } from 'discord.js';
import { BRAND, WISH_COST } from '../config/constants.js';
import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { artifactSets } from '../data/artifacts.js';
import { domains } from '../data/domains.js';
import { buildCharacterStats } from '../game/stats.js';
import { currentActor } from '../game/battle.js';

const stars = (n) => '★'.repeat(n);
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const hpbar = (hp, max) => {
  const blocks = 10;
  const filled = Math.max(0, Math.min(blocks, Math.round((hp / max) * blocks)));
  return `${'█'.repeat(filled)}${'░'.repeat(blocks - filled)} ${Math.round(hp)}/${max}`;
};

function base(title, description = '') {
  return new EmbedBuilder().setColor(BRAND.color).setTitle(title).setDescription(description).setFooter({ text: 'NEVERLESS RPG • Discord Prototype' });
}

export function renderHome(player) {
  const owned = Object.keys(player.characters).length;
  return base('✦ NEVERLESS RPG', 'Choose what you want to do. This panel updates in place; the bot does not spam new embeds.')
    .addFields(
      { name: '💎 Primogems', value: `${player.primogems.toLocaleString()}`, inline: true },
      { name: '🪙 Mora', value: `${player.mora.toLocaleString()}`, inline: true },
      { name: '🌙 Resin', value: `${player.resin}/160`, inline: true },
      { name: '🧙 Characters', value: `${owned}`, inline: true },
      { name: '⚔️ PvP', value: `${player.pvp.wins}W / ${player.pvp.losses}L • ${player.pvp.mmr} MMR`, inline: true },
    )
    .setImage(characters.furina.image);
}

export function renderWish(player, banner, lastResults = []) {
  const pity = player.pity[banner];
  const e = base(`🌠 ${banner === 'character' ? 'Character Event Wish' : 'Weapon Event Wish'}`, `Cost: **${WISH_COST} Primogems** per pull\nCurrent pity: **${pity}** • 4★ pity: **${player.pity[`${banner}Four`]}**`)
    .addFields({ name: '💎 Balance', value: player.primogems.toLocaleString(), inline: true });

  if (lastResults.length) {
    const lines = lastResults.map((r) => {
      const item = r.kind === 'character' ? characters[r.id] : weapons[r.id];
      return `${stars(r.rarity)} **${item?.name || r.id}**${r.duplicate ? ' • duplicate' : ''}`;
    });
    e.addFields({ name: `Latest ${lastResults.length} pull${lastResults.length > 1 ? 's' : ''}`, value: lines.join('\n').slice(0, 1024) });
    const best = [...lastResults].sort((a, b) => b.rarity - a.rarity)[0];
    const bestItem = best.kind === 'character' ? characters[best.id] : weapons[best.id];
    if (bestItem?.image) e.setImage(bestItem.image);
  } else {
    e.setImage(banner === 'character' ? characters['yae-miko'].image : weapons['kaguras-verity'].image);
  }
  return e;
}

export function renderDomains(player, session) {
  const selected = session.domainId ? domains[session.domainId] : null;
  const team = session.team || [];
  const desc = selected ? `**${selected.name}**\n${selected.description}\nCost: ${selected.resin} Resin\n\nTeam: ${team.length ? team.map((id) => characters[id]?.name).join(' • ') : 'not selected'}` : 'Select a domain, then choose exactly four owned characters.';
  const e = base('🏛️ Domains', desc).addFields({ name: '🌙 Resin', value: `${player.resin}/160`, inline: true });
  if (selected?.enemies?.[0]?.image) e.setImage(selected.enemies[0].image);
  return e;
}

export function renderCpu(player, session) {
  const team = session.team || [];
  return base('⚔️ CPU Arena', `Fight **Neverless Automaton** using the same battle engine intended for player-vs-player.\n\nYour team: ${team.length ? team.map((id) => characters[id]?.name).join(' • ') : 'Choose four characters below.'}`)
    .addFields({ name: 'Opponent', value: 'Xiangling • Bennett • Fischl • Noelle' })
    .setImage(characters['raiden-shogun'].image);
}

export function renderCharacters(player, selectedId = null) {
  if (!selectedId) {
    const list = Object.keys(player.characters).map((id) => `${stars(characters[id].rarity)} **${characters[id].name}** • Lv.${player.characters[id].level}`).join('\n');
    return base('🧙 Characters', list || 'No characters yet.');
  }
  const b = buildCharacterStats(player, selectedId);
  const weapon = b.owned.weaponId ? weapons[b.owned.weaponId] : null;
  const artNames = (b.owned.artifactIds || []).map((id) => player.artifacts[id]).filter(Boolean).map((a) => `${a.slot} +${a.level}`).join(', ') || 'None';
  return base(`${stars(b.definition.rarity)} ${b.definition.name}`, `${b.definition.element} • ${b.definition.weaponType} • ${b.definition.role}`)
    .addFields(
      { name: 'Level', value: `${b.owned.level}`, inline: true },
      { name: 'Constellation', value: `C${b.owned.constellation}`, inline: true },
      { name: 'Weapon', value: weapon?.name || 'None', inline: true },
      { name: '❤️ HP', value: `${b.stats.hp}`, inline: true },
      { name: '⚔️ ATK', value: `${b.stats.atk}`, inline: true },
      { name: '🛡️ DEF', value: `${b.stats.def}`, inline: true },
      { name: '🎯 CRIT', value: pct(b.stats.critRate), inline: true },
      { name: '💥 CRIT DMG', value: pct(b.stats.critDmg), inline: true },
      { name: '💨 SPD', value: `${b.stats.spd}`, inline: true },
      { name: 'Artifacts', value: artNames },
    ).setImage(b.definition.image);
}

export function renderInventory(player) {
  const weaponLines = Object.keys(player.weapons).slice(0, 12).map((id) => `${stars(weapons[id].rarity)} ${weapons[id].name} • R${player.weapons[id].refinement}`).join('\n');
  return base('🎒 Inventory', `**Weapons (${Object.keys(player.weapons).length})**\n${weaponLines || 'None'}\n\n**Artifacts:** ${Object.keys(player.artifacts).length}\n**Characters:** ${Object.keys(player.characters).length}`);
}

export function renderArtifacts(player) {
  const list = Object.values(player.artifacts).slice(0, 12).map((a) => {
    const set = artifactSets[a.setId];
    return `${stars(a.rarity)} **${set?.name || a.setId}** • ${a.slot} +${a.level}\n└ ${a.main.key}: ${typeof a.main.value === 'number' && a.main.value < 1 ? pct(a.main.value) : Math.round(a.main.value)}`;
  }).join('\n');
  const e = base('🏺 Artifacts', list || 'No artifacts yet. Clear a Domain to obtain one.');
  const first = Object.values(player.artifacts)[0];
  if (first) e.setImage(artifactSets[first.setId]?.image);
  return e;
}

export function renderUpgrades(player) {
  const p = player.passive;
  return base('📈 Passive Development', 'Permanent RPG progression. Each point becomes increasingly expensive and has a hard cap to keep PvP from becoming infinite stat inflation.')
    .addFields(
      { name: 'ATK', value: `Lv.${p.atk}`, inline: true },
      { name: 'HP', value: `Lv.${p.hp}`, inline: true },
      { name: 'CRIT Rate', value: `Lv.${p.critRate}`, inline: true },
      { name: 'CRIT DMG', value: `Lv.${p.critDmg}`, inline: true },
      { name: 'SPD', value: `Lv.${p.spd}`, inline: true },
      { name: '🪙 Mora', value: player.mora.toLocaleString(), inline: true },
    );
}

export function renderProfile(player) {
  return base(`👤 ${player.username}`, `Traveler ID: ${player.id}`)
    .addFields(
      { name: 'Adventure XP', value: `${player.adventureXp}`, inline: true },
      { name: 'Characters', value: `${Object.keys(player.characters).length}`, inline: true },
      { name: 'Artifacts', value: `${Object.keys(player.artifacts).length}`, inline: true },
      { name: 'PvP MMR', value: `${player.pvp.mmr}`, inline: true },
      { name: 'Record', value: `${player.pvp.wins}W / ${player.pvp.losses}L`, inline: true },
      { name: 'Wishes logged', value: `${player.history.wishes.length}`, inline: true },
    );
}

export function renderBattle(battle, pendingAction = null) {
  const actor = currentActor(battle);
  const players = battle.actors.filter((a) => a.side === 'player');
  const enemies = battle.actors.filter((a) => a.side === 'enemy');
  const teamBlock = players.map((a) => `${a.hp > 0 ? '🟢' : '⚫'} **${a.name}**\n${hpbar(a.hp, a.maxHp)} • ⚡${a.energy} • 💨${a.spd}`).join('\n');
  const enemyBlock = enemies.map((a) => `${a.hp > 0 ? '🔴' : '⚫'} **${a.name}**\n${hpbar(a.hp, a.maxHp)} • ⚡${a.energy} • 💨${a.spd}`).join('\n');
  const title = battle.winner ? (battle.winner === 'player' ? '🏆 Victory' : '☠️ Defeat') : `⚔️ ${battle.mode === 'cpu' ? 'CPU Arena' : 'Domain Battle'}`;
  const e = base(title, battle.winner ? `Winner: **${battle.winner === 'player' ? 'You' : 'Enemy'}**` : `Turn ${battle.turn + 1} • Acting: **${actor?.name || '—'}**${pendingAction ? `\nChoose a target for **${actor?.skills[pendingAction]?.name || pendingAction}**.` : ''}`)
    .addFields(
      { name: 'Your Team', value: teamBlock.slice(0, 1024), inline: true },
      { name: 'Opponent', value: enemyBlock.slice(0, 1024), inline: true },
      { name: 'Combat Log', value: battle.log.join('\n').slice(0, 1024) || '—' },
    );
  if (actor?.image) e.setImage(actor.image);
  return e;
}

export function renderNotice(title, text, image = null) {
  const e = base(title, text);
  if (image) e.setImage(image);
  return e;
}

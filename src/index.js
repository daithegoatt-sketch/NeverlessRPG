import 'dotenv/config';
import { AttachmentBuilder, Client, GatewayIntentBits, Events } from 'discord.js';
import { GAME_CHANNEL_ID, PREFIX } from './config/constants.js';
import { JsonStore } from './db/store.js';
import { domains } from './data/domains.js';
import { characters } from './data/characters.js';
import { weapons } from './data/weapons.js';
import { performWishes } from './game/wish.js';
import { createDomainBattle, createCpuBattle, act, currentActor, runCpuUntilPlayerTurn } from './game/battle.js';
import { claimDaily, grantDomainRewards, levelCharacter, upgradeTalent, setShowcase, upgradePassive, equipWeapon, equipArtifact } from './game/progression.js';
import { calculatePlayerPower } from './game/stats.js';
import { makeCpuProfile } from './game/cpu.js';
import {
  homeComponents, wishComponents, domainComponents, cpuComponents, characterComponents,
  characterDetailComponents, weaponEquipComponents, artifactEquipComponents,
  upgradeComponents, battleComponents, profileRow,
} from './ui/components.js';
import { renderViewCard } from './ui/cards-v3.js';
import {
  renderHome, renderWish, renderDomains, renderCpu, renderCharacters, renderInventory,
  renderArtifacts, renderUpgrades, renderProfile, renderBattle,
} from './ui/render.js';

if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN. Set it in Railway or .env.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const store = new JsonStore();
const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) sessions.set(userId, {
    view: 'home', banner: 'character', team: [], domainId: null, battle: null,
    pendingAction: null, lastWish: [], selectedChar: null, avatarUrl: null, lastDomainReward: null,
  });
  return sessions.get(userId);
}
function resetHome(session) {
  Object.assign(session, { view:'home', team:[], domainId:null, battle:null, pendingAction:null, lastWish:[], selectedChar:null, lastDomainReward:null });
}
function parseCustomId(id) {
  const [ns, ownerId, action, arg=''] = id.split('|');
  return ns === 'nls' ? { ownerId, action, arg } : null;
}
function userMeta(user, session) {
  return { username:user.globalName || user.username, avatarUrl:session.avatarUrl || user.displayAvatarURL({ extension:'png', size:256 }) };
}

function componentsFor(player, session, userId) {
  if (session.battle) return battleComponents(userId, session.battle, session.pendingAction);
  switch (session.view) {
    case 'wish': return wishComponents(userId, session.banner, player);
    case 'domains': return domainComponents(userId, player, session);
    case 'cpu': return cpuComponents(userId, player, session);
    case 'characters': return session.selectedChar ? characterDetailComponents(userId, session.selectedChar) : characterComponents(userId, player);
    case 'inventory': return profileRow(userId);
    case 'artifacts': return profileRow(userId);
    case 'upgrades': return upgradeComponents(userId);
    case 'weaponEquip': return weaponEquipComponents(userId, player, session.selectedChar);
    case 'artifactEquip': return artifactEquipComponents(userId, player, session.selectedChar);
    default: return homeComponents(userId, player);
  }
}

function fallbackEmbed(player, session) {
  if (session.battle) return renderBattle(session.battle, session.pendingAction);
  switch (session.view) {
    case 'wish': return renderWish(player, session.banner, session.lastWish);
    case 'domains': return renderDomains(player, session);
    case 'cpu': return renderCpu(player, session);
    case 'characters': return renderCharacters(player, session.selectedChar);
    case 'inventory': return renderInventory(player);
    case 'artifacts': return renderArtifacts(player);
    case 'upgrades': return renderUpgrades(player);
    case 'weaponEquip': case 'artifactEquip': return renderCharacters(player, session.selectedChar);
    default: return renderProfile(player) || renderHome(player);
  }
}

async function payloadFor(player, session, userId, user, editing = false) {
  const components = componentsFor(player, session, userId);
  try {
    const card = await renderViewCard(session.view, player, session, userMeta(user, session));
    const payload = { files:[new AttachmentBuilder(card.buffer, { name:card.name })], components };
    if (editing) payload.attachments = [];
    return payload;
  } catch (error) {
    console.error('V3 card render failed; using embed fallback:', error);
    const payload = { embeds:[fallbackEmbed(player, session)], components };
    if (editing) payload.attachments = [];
    return payload;
  }
}

async function cleanupOldPanels(channel, userId, keepId = null) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    for (const msg of messages.values()) {
      if (msg.author.id !== client.user.id || msg.id === keepId) continue;
      const ownsPanel = msg.components.some((row) => row.components.some((component) => String(component.customId || '').startsWith(`nls|${userId}|`)));
      if (ownsPanel) await msg.delete().catch(() => null);
    }
  } catch (error) {
    console.warn('Old panel cleanup skipped:', error.message);
  }
}

async function openOrRefreshPanel(message, player, session) {
  const existingId = player.ui?.profileMessageId;
  if (existingId) {
    try {
      const existing = await message.channel.messages.fetch(existingId);
      await existing.edit(await payloadFor(player, session, message.author.id, message.author, true));
      await cleanupOldPanels(message.channel, message.author.id, existing.id);
      return existing;
    } catch {
      store.mutatePlayer(message.author.id, (p) => { p.ui.profileMessageId = null; }, message.author.username);
    }
  }
  const created = await message.reply(await payloadFor(player, session, message.author.id, message.author, false));
  store.mutatePlayer(message.author.id, (p) => { p.ui.profileMessageId = created.id; }, message.author.username);
  await cleanupOldPanels(message.channel, message.author.id, created.id);
  return created;
}

function recordBattle(player, battle) {
  const won = battle.winner === 'player';
  player.history.battles.unshift({ id:battle.id, mode:battle.mode, won, at:Date.now(), turns:battle.turn });
  player.history.battles = player.history.battles.slice(0, 50);
  if (battle.mode === 'cpu') {
    if (won) { player.pvp.wins += 1; player.pvp.mmr += 18; player.mora += 8000; player.adventureXp += 80; }
    else { player.pvp.losses += 1; player.pvp.mmr = Math.max(0, player.pvp.mmr - 12); player.adventureXp += 25; }
  }
}

function actionAnnouncement(userId, event, isCpu = false) {
  if (!event) return '';
  const who = isCpu ? `**${event.actorName}**` : `<@${userId}> — **${event.actorName}**`;
  let line = `${who} استخدم **${event.skillName}**`;
  if (event.targetName && event.targetName !== 'team' && event.targetName !== event.actorName) line += ` على **${event.targetName}**`;
  if (event.damage) line += ` • **${event.damage} DMG**${event.crit ? ' ✨ CRIT' : ''}`;
  if (event.healed) line += ` • **+${event.healed} HP**`;
  if (event.shield) line += ` • **${event.shield} Shield**`;
  if (event.buff) line += ' • Buff';
  if (event.debuff) line += ' • Debuff';
  return `${line}.`;
}

function friendlyError(code) {
  return {
    NOT_ENOUGH_PRIMOGEMS:'Not enough Primogems.', NOT_ENOUGH_RESIN:'Not enough Resin.',
    NO_MORA:'Not enough Mora.', MAX_LEVEL:'Character is already Lv.90.', TALENT_MAX:'Talent is already Lv.10.',
    WRONG_WEAPON_TYPE:'That weapon type does not match the character.', NO_DOMAIN:'Choose a Domain first.',
    TEAM_REQUIRED:'Choose exactly four characters.', QUICK_LOCKED:'Clear this Domain normally once before Quick Clear.',
    POWER_TOO_LOW:'Your PWR is too low for Quick Clear.', DAILY_ALREADY_CLAIMED:'Daily reward already claimed.',
    COOLDOWN:'Skill is still on cooldown.', NO_ENERGY:'Not enough Energy for Burst.',
  }[code] || code || 'Action failed.';
}

client.once(Events.ClientReady, (ready) => console.log(`Neverless RPG V3 online as ${ready.user.tag}. Game channel: ${GAME_CHANNEL_ID}`));

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || message.channelId !== GAME_CHANNEL_ID) return;
  if (message.content.trim().toLowerCase() !== PREFIX.toLowerCase()) return;
  const player = store.getPlayer(message.author.id, message.author.username);
  const session = getSession(message.author.id);
  resetHome(session);
  session.avatarUrl = message.author.displayAvatarURL({ extension:'png', size:256 });
  await openOrRefreshPanel(message, player, session);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
  if (interaction.channelId !== GAME_CHANNEL_ID) {
    await interaction.reply({ content:`Neverless RPG is locked to <#${GAME_CHANNEL_ID}>.`, ephemeral:true });
    return;
  }
  const parsed = parseCustomId(interaction.customId);
  if (!parsed) return;
  if (interaction.user.id !== parsed.ownerId) {
    await interaction.reply({ content:'This panel belongs to another player. Use `-neverless` to open yours.', ephemeral:true });
    return;
  }

  const userId = interaction.user.id;
  const player = store.getPlayer(userId, interaction.user.username);
  if (player.ui?.profileMessageId && interaction.message.id !== player.ui.profileMessageId) {
    await interaction.reply({ content:'This is an old Neverless panel. Use `-neverless` to refresh your active panel.', ephemeral:true });
    return;
  }
  const session = getSession(userId);
  session.avatarUrl = interaction.user.displayAvatarURL({ extension:'png', size:256 });
  await interaction.deferUpdate();
  const announcements = [];

  try {
    if (parsed.action === 'mainmenu') {
      const next = interaction.values[0] || 'home';
      session.view = next; session.selectedChar = null; session.pendingAction = null; session.battle = null;
      if (next !== 'domains' && next !== 'cpu') session.team = [];
    } else if (parsed.action === 'home') {
      resetHome(session);
    } else if (parsed.action === 'open') {
      session.view = parsed.arg || 'home'; session.selectedChar = null; session.pendingAction = null; session.battle = null;
      if (session.view !== 'domains' && session.view !== 'cpu') session.team = [];
    } else if (parsed.action === 'daily') {
      const reward = store.mutatePlayer(userId, (p) => claimDaily(p), interaction.user.username);
      if (!reward.ok) throw new Error(reward.reason);
      announcements.push(`🎁 Daily • +${reward.primogems} Primogems • +${reward.mora.toLocaleString()} Mora • +${reward.resin} Resin • Streak ${reward.streak}.`);
      resetHome(session);
    } else if (parsed.action === 'wishbanner') {
      session.banner = parsed.arg; session.lastWish = [];
    } else if (parsed.action === 'wish') {
      session.lastWish = store.mutatePlayer(userId, (p) => performWishes(p, session.banner, Number(parsed.arg)), interaction.user.username);
      session.view = 'wish';
    } else if (parsed.action === 'domainselect') {
      session.domainId = interaction.values[0]; session.team = [];
    } else if (parsed.action === 'teamselect') {
      session.team = interaction.values;
    } else if (parsed.action === 'startdomain') {
      const domain = domains[session.domainId];
      if (!domain) throw new Error('NO_DOMAIN');
      if (session.team.length !== 4) throw new Error('TEAM_REQUIRED');
      if (player.resin < domain.resin) throw new Error('NOT_ENOUGH_RESIN');
      store.mutatePlayer(userId, (p) => { p.resin -= domain.resin; }, interaction.user.username);
      session.battle = createDomainBattle(store.getPlayer(userId, interaction.user.username), session.team, domain);
      runCpuUntilPlayerTurn(session.battle);
    } else if (parsed.action === 'quickdomain') {
      const domain = domains[session.domainId];
      if (!domain) throw new Error('NO_DOMAIN');
      const progress = player.domainProgress?.[domain.id] || { clears:0 };
      if (progress.clears < 1) throw new Error('QUICK_LOCKED');
      if (calculatePlayerPower(player) < Math.ceil((domain.recommendedPower || 0) * 1.12)) throw new Error('POWER_TOO_LOW');
      if (player.resin < domain.resin) throw new Error('NOT_ENOUGH_RESIN');
      const reward = store.mutatePlayer(userId, (p) => { p.resin -= domain.resin; return grantDomainRewards(p, domain.id, Math.random, { quick:true }); }, interaction.user.username);
      announcements.push(`⚡ Quick Clear • **${domain.name}** • +${reward.mora.toLocaleString()} Mora • +${reward.primogems} Primogems • ${reward.set.name}.`);
    } else if (parsed.action === 'startcpu') {
      if (session.team.length !== 4) throw new Error('TEAM_REQUIRED');
      session.battle = createCpuBattle(player, session.team, makeCpuProfile());
      runCpuUntilPlayerTurn(session.battle);
    } else if (parsed.action === 'charinspect') {
      session.view = 'characters'; session.selectedChar = interaction.values[0];
    } else if (parsed.action === 'showcaseselect') {
      const result = store.mutatePlayer(userId, (p) => setShowcase(p, interaction.values), interaction.user.username);
      if (!result.ok) throw new Error(result.reason);
      announcements.push('⭐ Profile showcase updated.');
    } else if (parsed.action === 'levelchar') {
      const [charId, amountRaw] = parsed.arg.split(':');
      const result = store.mutatePlayer(userId, (p) => levelCharacter(p, charId, Number(amountRaw) || 1), interaction.user.username);
      if (!result.ok) throw new Error(result.reason);
      session.selectedChar = charId;
      announcements.push(`⬆️ ${characters[charId].name} reached Lv.${result.level} • ${result.cost.toLocaleString()} Mora spent.`);
    } else if (parsed.action === 'talent') {
      const [charId, talent] = parsed.arg.split(':');
      const result = store.mutatePlayer(userId, (p) => upgradeTalent(p, charId, talent), interaction.user.username);
      if (!result.ok) throw new Error(result.reason);
      session.selectedChar = charId;
      announcements.push(`✨ ${characters[charId].name} ${talent} talent is now Lv.${result.level}.`);
    } else if (parsed.action === 'equipweaponchar') {
      session.view = 'weaponEquip'; session.selectedChar = parsed.arg;
    } else if (parsed.action === 'equipartifactchar') {
      session.view = 'artifactEquip'; session.selectedChar = parsed.arg;
    } else if (parsed.action === 'equipweapon') {
      const result = store.mutatePlayer(userId, (p) => {
        const wid = interaction.values[0];
        if (characters[parsed.arg].weaponType !== weapons[wid].type) throw new Error('WRONG_WEAPON_TYPE');
        return equipWeapon(p, parsed.arg, wid);
      }, interaction.user.username);
      if (!result.ok) throw new Error(result.reason);
      session.view = 'characters'; session.selectedChar = parsed.arg;
    } else if (parsed.action === 'equipartifact') {
      const result = store.mutatePlayer(userId, (p) => equipArtifact(p, parsed.arg, interaction.values[0]), interaction.user.username);
      if (!result.ok) throw new Error(result.reason);
      session.view = 'characters'; session.selectedChar = parsed.arg;
    } else if (parsed.action === 'passive') {
      const result = store.mutatePlayer(userId, (p) => upgradePassive(p, parsed.arg), interaction.user.username);
      if (!result.ok) throw new Error(result.reason);
      announcements.push(`📈 ${parsed.arg} upgrade reached Lv.${result.level}.`);
    } else if (parsed.action === 'battleaction') {
      session.pendingAction = parsed.arg;
    } else if (parsed.action === 'battlecancel') {
      session.pendingAction = null;
    } else if (parsed.action === 'battletarget') {
      const actor = currentActor(session.battle);
      const result = act(session.battle, actor.uid, parsed.arg, interaction.values[0]);
      if (!result.ok) throw new Error(result.reason);
      if (result.event) announcements.push(actionAnnouncement(userId, result.event, false));
      session.pendingAction = null;
      const cpuEvents = runCpuUntilPlayerTurn(session.battle);
      for (const r of cpuEvents) if (r?.event) announcements.push(actionAnnouncement(userId, r.event, true));
      if (session.battle.winner) {
        const battle = session.battle;
        const rewardText = store.mutatePlayer(userId, (p) => {
          recordBattle(p, battle);
          if (battle.winner === 'player' && battle.mode === 'domain') {
            const reward = grantDomainRewards(p, battle.meta.domainId, Math.random, { turns:battle.turn });
            return `Rewards: ${reward.mora.toLocaleString()} Mora • ${reward.primogems} Primogems • ${reward.set.name} ${reward.artifact.slot}.`;
          }
          if (battle.winner === 'player' && battle.mode === 'cpu') return 'Rewards: 8,000 Mora • +18 MMR.';
          return 'No victory rewards.';
        }, interaction.user.username);
        battle.log.unshift(rewardText);
        announcements.push(`**${battle.winner === 'player' ? 'Victory' : 'Defeat'}** • ${rewardText}`);
      }
    } else if (parsed.action === 'forfeit') {
      if (session.battle && !session.battle.winner) {
        session.battle.winner = 'enemy';
        store.mutatePlayer(userId, (p) => recordBattle(p, session.battle), interaction.user.username);
      }
    } else if (parsed.action === 'battlewait') {
      runCpuUntilPlayerTurn(session.battle);
    }

    const fresh = store.getPlayer(userId, interaction.user.username);
    await interaction.editReply(await payloadFor(fresh, session, userId, interaction.user, true));
    if (announcements.length) await interaction.followUp({ content:announcements.join('\n').slice(0, 1900), ephemeral:true });
  } catch (error) {
    console.error('Interaction failed:', error);
    await interaction.followUp({ content:`⚠️ ${friendlyError(error.message)}`, ephemeral:true });
  }
});

client.login(process.env.DISCORD_TOKEN);

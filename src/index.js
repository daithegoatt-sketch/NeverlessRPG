import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Events,
} from 'discord.js';
import { GAME_CHANNEL_ID, PREFIX } from './config/constants.js';
import { JsonStore } from './db/store.js';
import { domains } from './data/domains.js';
import { characters } from './data/characters.js';
import { weapons } from './data/weapons.js';
import { performWishes } from './game/wish.js';
import { createDomainBattle, createCpuBattle, act, currentActor, runCpuUntilPlayerTurn } from './game/battle.js';
import { grantDomainRewards, levelCharacter, upgradePassive, equipWeapon, equipArtifact } from './game/progression.js';
import { makeCpuProfile } from './game/cpu.js';
import {
  homeComponents, wishComponents, domainComponents, cpuComponents, characterComponents,
  characterDetailComponents, weaponEquipComponents, artifactEquipComponents,
  upgradeComponents, battleComponents, backRow,
} from './ui/components.js';
import {
  renderHome, renderWish, renderDomains, renderCpu, renderCharacters, renderInventory,
  renderArtifacts, renderUpgrades, renderProfile, renderBattle, renderNotice,
} from './ui/render.js';

if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN. Copy .env.example to .env and set the bot token.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const store = new JsonStore();
const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) sessions.set(userId, { view: 'home', banner: 'character', team: [], domainId: null, battle: null, pendingAction: null, lastWish: [] });
  return sessions.get(userId);
}

function parseCustomId(id) {
  const [ns, ownerId, action, arg = ''] = id.split('|');
  return ns === 'nls' ? { ownerId, action, arg } : null;
}

function payloadFor(player, session, userId) {
  if (session.battle) return { embeds: [renderBattle(session.battle, session.pendingAction)], components: battleComponents(userId, session.battle, session.pendingAction) };
  switch (session.view) {
    case 'wish': return { embeds: [renderWish(player, session.banner, session.lastWish)], components: wishComponents(userId, session.banner) };
    case 'domains': return { embeds: [renderDomains(player, session)], components: domainComponents(userId, player) };
    case 'cpu': return { embeds: [renderCpu(player, session)], components: cpuComponents(userId, player) };
    case 'characters': return { embeds: [renderCharacters(player, session.selectedChar)], components: session.selectedChar ? characterDetailComponents(userId, session.selectedChar) : characterComponents(userId, player) };
    case 'inventory': return { embeds: [renderInventory(player)], components: backRow(userId) };
    case 'artifacts': return { embeds: [renderArtifacts(player)], components: backRow(userId) };
    case 'upgrades': return { embeds: [renderUpgrades(player)], components: upgradeComponents(userId) };
    case 'profile': return { embeds: [renderProfile(player)], components: backRow(userId) };
    case 'weaponEquip': return { embeds: [renderCharacters(player, session.selectedChar)], components: weaponEquipComponents(userId, player, session.selectedChar) };
    case 'artifactEquip': return { embeds: [renderCharacters(player, session.selectedChar)], components: artifactEquipComponents(userId, player, session.selectedChar) };
    default: return { embeds: [renderHome(player)], components: homeComponents(userId) };
  }
}

function recordBattle(player, battle) {
  const won = battle.winner === 'player';
  player.history.battles.unshift({ id: battle.id, mode: battle.mode, won, at: Date.now() });
  player.history.battles = player.history.battles.slice(0, 50);
  if (battle.mode === 'cpu') {
    if (won) {
      player.pvp.wins += 1;
      player.pvp.mmr += 18;
      player.mora += 8000;
    } else {
      player.pvp.losses += 1;
      player.pvp.mmr = Math.max(0, player.pvp.mmr - 12);
    }
  }
}

client.once(Events.ClientReady, (ready) => {
  console.log(`Neverless RPG online as ${ready.user.tag}. Game channel: ${GAME_CHANNEL_ID}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || message.channelId !== GAME_CHANNEL_ID) return;
  if (message.content.trim().toLowerCase() !== PREFIX.toLowerCase()) return;
  const player = store.getPlayer(message.author.id, message.author.username);
  const session = getSession(message.author.id);
  Object.assign(session, { view: 'home', battle: null, pendingAction: null, selectedChar: null, lastWish: [] });
  await message.reply(payloadFor(player, session, message.author.id));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
  if (interaction.channelId !== GAME_CHANNEL_ID) {
    await interaction.reply({ content: `Neverless RPG is currently locked to <#${GAME_CHANNEL_ID}>.`, ephemeral: true });
    return;
  }
  const parsed = parseCustomId(interaction.customId);
  if (!parsed) return;
  if (interaction.user.id !== parsed.ownerId) {
    await interaction.reply({ content: 'This RPG panel belongs to another player. Use `-neverless` to open your own panel.', ephemeral: true });
    return;
  }

  const userId = interaction.user.id;
  const player = store.getPlayer(userId, interaction.user.username);
  const session = getSession(userId);

  try {
    if (parsed.action === 'view') {
      session.view = parsed.arg || 'home';
      session.selectedChar = null;
      session.pendingAction = null;
      if (session.view !== 'domains' && session.view !== 'cpu') session.team = [];
      await interaction.update(payloadFor(player, session, userId));
      return;
    }

    if (parsed.action === 'wishbanner') {
      session.banner = parsed.arg;
      session.lastWish = [];
    } else if (parsed.action === 'wish') {
      const count = Number(parsed.arg);
      session.lastWish = store.mutatePlayer(userId, (p) => performWishes(p, session.banner, count), interaction.user.username);
    } else if (parsed.action === 'domainselect') {
      session.domainId = interaction.values[0];
    } else if (parsed.action === 'teamselect') {
      session.team = interaction.values;
      if (session.team.length === 4) {
        if (parsed.arg === 'domain' && session.domainId) {
          const domain = domains[session.domainId];
          if (player.resin < domain.resin) throw new Error('NOT_ENOUGH_RESIN');
          store.mutatePlayer(userId, (p) => { p.resin -= domain.resin; }, interaction.user.username);
          session.battle = createDomainBattle(player, session.team, domain);
          runCpuUntilPlayerTurn(session.battle);
        } else if (parsed.arg === 'cpu') {
          session.battle = createCpuBattle(player, session.team, makeCpuProfile());
          runCpuUntilPlayerTurn(session.battle);
        }
      }
    } else if (parsed.action === 'charinspect') {
      session.view = 'characters';
      session.selectedChar = interaction.values[0];
    } else if (parsed.action === 'levelchar') {
      store.mutatePlayer(userId, (p) => levelCharacter(p, parsed.arg), interaction.user.username);
      session.selectedChar = parsed.arg;
    } else if (parsed.action === 'equipweaponchar') {
      session.view = 'weaponEquip';
      session.selectedChar = parsed.arg;
    } else if (parsed.action === 'equipartifactchar') {
      session.view = 'artifactEquip';
      session.selectedChar = parsed.arg;
    } else if (parsed.action === 'equipweapon') {
      store.mutatePlayer(userId, (p) => {
        const wid = interaction.values[0];
        if (characters[parsed.arg].weaponType !== weapons[wid].type) throw new Error('WRONG_WEAPON_TYPE');
        return equipWeapon(p, parsed.arg, wid);
      }, interaction.user.username);
      session.view = 'characters';
      session.selectedChar = parsed.arg;
    } else if (parsed.action === 'equipartifact') {
      store.mutatePlayer(userId, (p) => equipArtifact(p, parsed.arg, interaction.values[0]), interaction.user.username);
      session.view = 'characters';
      session.selectedChar = parsed.arg;
    } else if (parsed.action === 'passive') {
      store.mutatePlayer(userId, (p) => upgradePassive(p, parsed.arg), interaction.user.username);
    } else if (parsed.action === 'battleaction') {
      session.pendingAction = parsed.arg;
    } else if (parsed.action === 'battlecancel') {
      session.pendingAction = null;
    } else if (parsed.action === 'battletarget') {
      const actor = currentActor(session.battle);
      const result = act(session.battle, actor.uid, parsed.arg, interaction.values[0]);
      if (!result.ok) throw new Error(result.reason);
      session.pendingAction = null;
      runCpuUntilPlayerTurn(session.battle);

      if (session.battle.winner) {
        const battle = session.battle;
        const rewardText = store.mutatePlayer(userId, (p) => {
          recordBattle(p, battle);
          if (battle.winner === 'player' && battle.mode === 'domain') {
            const reward = grantDomainRewards(p, battle.meta.domainId);
            return `\n\nRewards: **${reward.mora.toLocaleString()} Mora**, **${reward.primogems} Primogems**, and ${'★'.repeat(reward.artifact.rarity)} **${reward.set.name} ${reward.artifact.slot}**.`;
          }
          if (battle.winner === 'player' && battle.mode === 'cpu') return '\n\nRewards: **8,000 Mora** and **+18 MMR**.';
          return '';
        }, interaction.user.username);
        battle.log.unshift(rewardText.trim() || (battle.winner === 'enemy' ? 'No victory rewards.' : ''));
      }
    } else if (parsed.action === 'forfeit') {
      if (session.battle && !session.battle.winner) {
        session.battle.winner = 'enemy';
        store.mutatePlayer(userId, (p) => recordBattle(p, session.battle), interaction.user.username);
      }
    } else if (parsed.action === 'battlewait') {
      runCpuUntilPlayerTurn(session.battle);
    }

    await interaction.update(payloadFor(player, session, userId));
  } catch (error) {
    console.error(error);
    const friendly = {
      NOT_ENOUGH_PRIMOGEMS: 'Not enough Primogems.',
      NOT_ENOUGH_RESIN: 'Not enough Resin.',
      NO_MORA: 'Not enough Mora.',
      COOLDOWN: 'That skill is still on cooldown.',
      NO_ENERGY: 'Not enough Energy for Burst.',
      WRONG_WEAPON_TYPE: 'That weapon type does not match the character.',
    }[error.message] || `Action failed: ${error.message}`;
    const payload = { embeds: [renderNotice('⚠️ Cannot do that', friendly)], components: backRow(userId, session.view === 'home' ? 'home' : session.view) };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.update(payload);
  }
});

client.login(process.env.DISCORD_TOKEN);

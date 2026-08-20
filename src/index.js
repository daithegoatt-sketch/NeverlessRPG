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
import { homeComponents, wishComponents, domainComponents, cpuComponents, characterComponents, characterDetailComponents, weaponEquipComponents, artifactEquipComponents, upgradeComponents, battleComponents, profileRow } from './ui/components.js';
import { renderViewCard } from './ui/cards-v3.js';
import { renderHome, renderWish, renderDomains, renderCpu, renderCharacters, renderInventory, renderArtifacts, renderUpgrades, renderBattle } from './ui/render.js';

if(!process.env.DISCORD_TOKEN){console.error('Missing DISCORD_TOKEN.');process.exit(1);}
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]});
const store=new JsonStore();
const sessions=new Map();
function getSession(id){if(!sessions.has(id))sessions.set(id,{view:'home',banner:'character',team:[],domainId:null,battle:null,pendingAction:null,lastWish:[],selectedChar:null,avatarUrl:null});return sessions.get(id);}
function resetHome(s){Object.assign(s,{view:'home',team:[],domainId:null,battle:null,pendingAction:null,lastWish:[],selectedChar:null});}
function parse(id){const [ns,ownerId,action,arg='']=id.split('|');return ns==='nls'?{ownerId,action,arg}:null;}
function meta(user,s){return{username:user.globalName||user.username,avatarUrl:s.avatarUrl||user.displayAvatarURL({extension:'png',size:256})};}

function componentsFor(player,s,userId){
 if(s.battle)return battleComponents(userId,s.battle,s.pendingAction);
 switch(s.view){case'wish':return wishComponents(userId,s.banner,player);case'domains':return domainComponents(userId,player,s);case'cpu':return cpuComponents(userId,player,s);case'characters':return s.selectedChar?characterDetailComponents(userId,s.selectedChar):characterComponents(userId,player);case'inventory':case'artifacts':return profileRow(userId);case'upgrades':return upgradeComponents(userId);case'weaponEquip':return weaponEquipComponents(userId,player,s.selectedChar);case'artifactEquip':return artifactEquipComponents(userId,player,s.selectedChar);default:return homeComponents(userId,player);}
}
function fallback(player,s){if(s.battle)return renderBattle(s.battle,s.pendingAction);switch(s.view){case'wish':return renderWish(player,s.banner,s.lastWish);case'domains':return renderDomains(player,s);case'cpu':return renderCpu(player,s);case'characters':case'weaponEquip':case'artifactEquip':return renderCharacters(player,s.selectedChar);case'inventory':return renderInventory(player);case'artifacts':return renderArtifacts(player);case'upgrades':return renderUpgrades(player);default:return renderHome(player);}}
async function payload(player,s,userId,user,editing=false){try{const card=await renderViewCard(s.view,player,s,meta(user,s));const out={files:[new AttachmentBuilder(card.buffer,{name:card.name})],components:componentsFor(player,s,userId)};if(editing)out.attachments=[];return out;}catch(error){console.error('Card render failed:',error);const out={embeds:[fallback(player,s)],components:componentsFor(player,s,userId)};if(editing)out.attachments=[];return out;}}

async function cleanup(channel,userId,keep){try{const msgs=await channel.messages.fetch({limit:100});for(const m of msgs.values()){if(m.author.id!==client.user.id||m.id===keep)continue;const owned=m.components.some(r=>r.components.some(c=>String(c.customId||'').startsWith(`nls|${userId}|`)));if(owned)await m.delete().catch(()=>null);}}catch{}}
async function openPanel(message,player,s){const id=player.ui?.profileMessageId;if(id){try{const m=await message.channel.messages.fetch(id);await m.edit(await payload(player,s,message.author.id,message.author,true));await cleanup(message.channel,message.author.id,m.id);return m;}catch{store.mutatePlayer(message.author.id,p=>{p.ui.profileMessageId=null;},message.author.username);}}
 const m=await message.reply(await payload(player,s,message.author.id,message.author,false));store.mutatePlayer(message.author.id,p=>{p.ui.profileMessageId=m.id;},message.author.username);await cleanup(message.channel,message.author.id,m.id);return m;}

function recordBattle(player,b){const won=b.winner==='player';player.history.battles.unshift({id:b.id,mode:b.mode,won,at:Date.now(),turns:b.turn});player.history.battles=player.history.battles.slice(0,50);if(b.mode==='cpu'){if(won){player.pvp.wins++;player.pvp.mmr+=18;player.mora+=8000;player.adventureXp+=80;}else{player.pvp.losses++;player.pvp.mmr=Math.max(0,player.pvp.mmr-12);player.adventureXp+=25;}}}
const ERR={NOT_ENOUGH_PRIMOGEMS:'Not enough Primogems.',NOT_ENOUGH_RESIN:'Not enough Resin.',NO_MORA:'Not enough Mora.',NO_LEVEL_BOOKS:'Not enough Level Books.',NO_TALENT_BOOKS:'Not enough Talent Books.',MAX_LEVEL:'Character is already Lv.90.',TALENT_MAX:'Talent is already Lv.10.',WRONG_WEAPON_TYPE:'Wrong weapon type.',NO_DOMAIN:'Choose a Domain first.',TEAM_REQUIRED:'Choose exactly four characters.',QUICK_LOCKED:'Clear this Domain once before Quick Clear.',POWER_TOO_LOW:'Your PWR is too low for Quick Clear.',DAILY_ALREADY_CLAIMED:'Daily reward already claimed.',COOLDOWN:'Skill is on cooldown.',NO_ENERGY:'Not enough Energy for this action.'};

client.once(Events.ClientReady,r=>console.log(`Neverless Adventure V6 online as ${r.user.tag} • channel ${GAME_CHANNEL_ID}`));
client.on(Events.MessageCreate,async message=>{if(message.author.bot||message.channelId!==GAME_CHANNEL_ID)return;if(message.content.trim().toLowerCase()!==PREFIX.toLowerCase())return;const p=store.getPlayer(message.author.id,message.author.username),s=getSession(message.author.id);resetHome(s);s.avatarUrl=message.author.displayAvatarURL({extension:'png',size:256});await openPanel(message,p,s);});

client.on(Events.InteractionCreate,async interaction=>{
 if(!interaction.isButton()&&!interaction.isStringSelectMenu())return;if(interaction.channelId!==GAME_CHANNEL_ID){await interaction.reply({content:`Use <#${GAME_CHANNEL_ID}> for Neverless Adventure.`,ephemeral:true});return;}
 const q=parse(interaction.customId);if(!q)return;if(q.ownerId!==interaction.user.id){await interaction.reply({content:'This panel belongs to another player. Use `-neverless`.',ephemeral:true});return;}
 const userId=interaction.user.id,p=store.getPlayer(userId,interaction.user.username);if(p.ui?.profileMessageId&&p.ui.profileMessageId!==interaction.message.id){await interaction.reply({content:'Old panel. Type `-neverless` to refresh your active panel.',ephemeral:true});return;}
 const s=getSession(userId);s.avatarUrl=interaction.user.displayAvatarURL({extension:'png',size:256});await interaction.deferUpdate();let notice='';
 try{
  if(q.action==='mainmenu'){s.view=interaction.values[0]||'home';s.battle=null;s.pendingAction=null;s.selectedChar=null;if(s.view!=='domains'&&s.view!=='cpu')s.team=[];}
  else if(q.action==='home'){resetHome(s);}
  else if(q.action==='open'){s.view=q.arg||'home';s.battle=null;s.pendingAction=null;s.selectedChar=null;if(s.view!=='domains'&&s.view!=='cpu')s.team=[];}
  else if(q.action==='daily'){const r=store.mutatePlayer(userId,x=>claimDaily(x),interaction.user.username);if(!r.ok)throw new Error(r.reason);notice=`Daily claimed: +${r.primogems} Primogems, +${r.mora.toLocaleString()} Mora, +${r.resin} Resin, +${r.levelBooks} Level Books${r.talentBooks ? `, +${r.talentBooks} Talent Book` : ''}.`;resetHome(s);}
  else if(q.action==='wishbanner'){s.banner=q.arg;s.lastWish=[];}
  else if(q.action==='wish'){s.lastWish=store.mutatePlayer(userId,x=>performWishes(x,s.banner,Number(q.arg)),interaction.user.username);s.view='wish';}
  else if(q.action==='domainselect'){s.domainId=interaction.values[0];s.team=[];}
  else if(q.action==='teamselect'){s.team=interaction.values;}
  else if(q.action==='startdomain'){const d=domains[s.domainId];if(!d)throw new Error('NO_DOMAIN');if(s.team.length!==4)throw new Error('TEAM_REQUIRED');if(p.resin<d.resin)throw new Error('NOT_ENOUGH_RESIN');store.mutatePlayer(userId,x=>{x.resin-=d.resin;},interaction.user.username);s.battle=createDomainBattle(store.getPlayer(userId,interaction.user.username),s.team,d);s.view='battle';runCpuUntilPlayerTurn(s.battle);}
  else if(q.action==='quickdomain'){const d=domains[s.domainId];if(!d)throw new Error('NO_DOMAIN');const prog=p.domainProgress?.[d.id]||{clears:0};if(prog.clears<1)throw new Error('QUICK_LOCKED');if(calculatePlayerPower(p)<Math.ceil(d.recommendedPower*1.12))throw new Error('POWER_TOO_LOW');if(p.resin<d.resin)throw new Error('NOT_ENOUGH_RESIN');const r=store.mutatePlayer(userId,x=>{x.resin-=d.resin;return grantDomainRewards(x,d.id,Math.random,{quick:true});},interaction.user.username);notice=`Quick Clear: ${d.name} • +${r.mora.toLocaleString()} Mora • +${r.primogems} Primogems • +${r.levelBooks} Level Books${r.talentBooks ? ` • +${r.talentBooks} Talent Books` : ''} • +${r.artifactSummary.length} Artifact(s).`;}
  else if(q.action==='startcpu'){if(s.team.length!==4)throw new Error('TEAM_REQUIRED');s.battle=createCpuBattle(p,s.team,makeCpuProfile());s.view='battle';runCpuUntilPlayerTurn(s.battle);}
  else if(q.action==='charinspect'){s.view='characters';s.selectedChar=interaction.values[0];}
  else if(q.action==='showcaseselect'){const r=store.mutatePlayer(userId,x=>setShowcase(x,interaction.values),interaction.user.username);if(!r.ok)throw new Error(r.reason);notice='Profile showcase updated.';}
  else if(q.action==='levelchar'){const [id,n]=q.arg.split(':');const r=store.mutatePlayer(userId,x=>levelCharacter(x,id,Number(n)||1),interaction.user.username);if(!r.ok)throw new Error(r.reason);s.selectedChar=id;notice=`${characters[id].name} reached Lv.${r.level}. Used ${r.booksUsed} Level Book(s) and ${r.cost.toLocaleString()} Mora.`;}
  else if(q.action==='talent'){const [id,t]=q.arg.split(':');const r=store.mutatePlayer(userId,x=>upgradeTalent(x,id,t),interaction.user.username);if(!r.ok)throw new Error(r.reason);s.selectedChar=id;notice=`${characters[id].name} ${t} talent reached Lv.${r.level}. Used ${r.booksUsed} Talent Book(s) and ${r.cost.toLocaleString()} Mora.`;}
  else if(q.action==='equipweaponchar'){s.view='weaponEquip';s.selectedChar=q.arg;}
  else if(q.action==='equipartifactchar'){s.view='artifactEquip';s.selectedChar=q.arg;}
  else if(q.action==='equipweapon'){const r=store.mutatePlayer(userId,x=>{const wid=interaction.values[0];if(characters[q.arg].weaponType!==weapons[wid].type)throw new Error('WRONG_WEAPON_TYPE');return equipWeapon(x,q.arg,wid);},interaction.user.username);if(!r.ok)throw new Error(r.reason);s.view='characters';s.selectedChar=q.arg;}
  else if(q.action==='equipartifact'){const r=store.mutatePlayer(userId,x=>equipArtifact(x,q.arg,interaction.values[0]),interaction.user.username);if(!r.ok)throw new Error(r.reason);s.view='characters';s.selectedChar=q.arg;}
  else if(q.action==='passive'){const r=store.mutatePlayer(userId,x=>upgradePassive(x,q.arg),interaction.user.username);if(!r.ok)throw new Error(r.reason);notice=`${q.arg} account upgrade is now Lv.${r.level}.`;}
  else if(q.action==='battleaction'){s.pendingAction=q.arg;}
  else if(q.action==='battlecancel'){s.pendingAction=null;}
  else if(q.action==='battletarget'){const a=currentActor(s.battle),r=act(s.battle,a.uid,q.arg,interaction.values[0]);if(!r.ok)throw new Error(r.reason);s.pendingAction=null;runCpuUntilPlayerTurn(s.battle);if(s.battle.winner){const b=s.battle;let rewardData=null;notice=store.mutatePlayer(userId,x=>{recordBattle(x,b);if(b.winner==='player'&&b.mode==='domain'){const rw=grantDomainRewards(x,b.meta.domainId,Math.random,{turns:b.turn});rewardData=rw;return `Victory in ${b.meta.domainName}: +${rw.mora.toLocaleString()} Mora • +${rw.artifactSummary.length} Artifact(s) • +${rw.levelBooks} Level Books${rw.talentBooks ? ` • +${rw.talentBooks} Talent Books` : ''}.`;}if(b.winner==='player'&&b.mode==='cpu')return 'CPU victory: +8,000 Mora and +18 MMR.';return 'Defeat. Upgrade your team and try again.';},interaction.user.username);if(rewardData)s.battle.rewards=rewardData;}}
  else if(q.action==='forfeit'){if(s.battle&&!s.battle.winner){s.battle.winner='enemy';store.mutatePlayer(userId,x=>recordBattle(x,s.battle),interaction.user.username);notice='Battle forfeited.';}}
  else if(q.action==='battlewait'){runCpuUntilPlayerTurn(s.battle);}

  const fresh=store.getPlayer(userId,interaction.user.username);await interaction.editReply(await payload(fresh,s,userId,interaction.user,true));if(notice)await interaction.followUp({content:notice,ephemeral:true});
 }catch(error){console.error('Interaction failed:',error);await interaction.followUp({content:`⚠️ ${ERR[error.message]||error.message||'Action failed.'}`,ephemeral:true});}
});
client.login(process.env.DISCORD_TOKEN);

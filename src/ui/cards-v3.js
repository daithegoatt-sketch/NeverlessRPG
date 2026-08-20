import sharp from 'sharp';
import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { artifactSets } from '../data/artifacts.js';
import { domains } from '../data/domains.js';
import { buildCharacterStats, calculatePlayerPower, characterPower, playerLevelInfo } from '../game/stats.js';
import { currentActor } from '../game/battle.js';

sharp.cache({ memory: 96, items: 256, files: 0 });
sharp.concurrency(4);

const C = {
  ink: '#080a10', night: '#0d1020', panel: '#131827', panel2: '#1a2033', line: '#343b55',
  purple: '#8b72e6', purple2: '#5f4f9f', gold: '#d7bd72', gold2: '#806c3e',
  text: '#f4f1fb', muted: '#b8bdd0', faint: '#778096', green: '#5bd69d', red: '#ee6e7d',
  blue: '#67a9e9', cyan: '#67d3d1', orange: '#f0a45d',
};
const PRIMO = 'https://enka.network/ui/UI_ItemIcon_201.png';
const MORA = 'https://enka.network/ui/UI_ItemIcon_202.png';
const rawCache = new Map();
const imageCache = new Map();
const FONT = "DejaVu Sans, Liberation Sans, Arial, sans-serif";

const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
const pct = (n) => `${Math.round((n || 0) * 100)}%`;
const trim = (s,max=22) => String(s||'').length > max ? `${String(s).slice(0,max-1)}…` : String(s||'');

function svg(w,h,body){
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <style>
    text{font-family:${FONT};font-variant-numeric:tabular-nums;}
    .t{fill:${C.text};}.m{fill:${C.muted};}.f{fill:${C.faint};}.b{fill:${C.text};font-weight:700}.g{fill:${C.gold};font-weight:700}
  </style>${body}</svg>`);
}
function rect(x,y,w,h,r,fill,stroke='none',sw=1,opacity=1){ return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`; }
function text(x,y,v,size=24,cls='t',anchor='start'){ return `<text x="${x}" y="${y}" font-size="${size}" class="${cls}" text-anchor="${anchor}">${esc(v)}</text>`; }
function line(x1,y1,x2,y2,color=C.line,sw=1,opacity=1){ return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" opacity="${opacity}"/>`; }
function bar(x,y,w,h,ratio,color){ return rect(x,y,w,h,h/2,C.line)+rect(x,y,w*clamp(ratio,0,1),h,h/2,color); }
function rarityColor(r){ return r>=5 ? C.gold : r===4 ? C.purple : C.blue; }
function stars(x,y,r){ let out=''; for(let i=0;i<r;i++){out += `<circle cx="${x+i*15}" cy="${y}" r="4" fill="${rarityColor(r)}"/>`; } return out; }
function background(w,h,accent=C.purple){
  return `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#07090f"/><stop offset=".48" stop-color="#101426"/><stop offset="1" stop-color="#171020"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="${accent}" stop-opacity=".24"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  <radialGradient id="goldglow"><stop offset="0" stop-color="${C.gold}" stop-opacity=".16"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient>
  <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity=".025"/></pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#grid)"/>
  <circle cx="${w*.82}" cy="${h*.14}" r="360" fill="url(#glow)"/><circle cx="${w*.12}" cy="${h*.86}" r="300" fill="url(#goldglow)"/>
  <path d="M35 ${h-85} C300 ${h-240}, 660 ${h-25}, ${w-30} ${h-190}" fill="none" stroke="${C.purple}" stroke-opacity=".12" stroke-width="3"/>
  <path d="M55 155 C390 20, 850 185, ${w-45} 70" fill="none" stroke="${C.gold}" stroke-opacity=".08" stroke-width="2"/>
  ${rect(30,30,w-60,h-60,28,'#0c101b',accent,2,.72)}${rect(43,43,w-86,h-86,22,'none',C.gold2,1,.55)}`;
}

async function raw(url){
  if(!url) return null;
  if(rawCache.has(url)) return rawCache.get(url);
  const p=(async()=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(2500)});if(!r.ok)return null;return Buffer.from(await r.arrayBuffer());}catch{return null;}})();
  rawCache.set(url,p); return p;
}
async function remote(url,w,h,fit='contain',round=0){
  if(!url) return null;
  const key=`${url}|${w}|${h}|${fit}|${round}`;
  if(imageCache.has(key)) return imageCache.get(key);
  const p=(async()=>{const src=await raw(url); if(!src)return null; try{let s=sharp(src).resize(w,h,{fit,position:'centre'}).png({compressionLevel:3}); if(round){const mask=Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${round}" fill="white"/></svg>`);s=s.composite([{input:mask,blend:'dest-in'}]);} return await s.toBuffer();}catch{return null;}})();
  imageCache.set(key,p); return p;
}
async function compose(w,h,bg,images,fg){
  const layers=[{input:svg(w,h,bg),left:0,top:0}];
  for(const i of images) if(i.input) layers.push({input:i.input,left:i.left,top:i.top});
  layers.push({input:svg(w,h,fg),left:0,top:0});
  return sharp({create:{width:w,height:h,channels:4,background:C.ink}}).composite(layers).png({compressionLevel:5}).toBuffer();
}
async function imageLayer(url,w,h,left,top,fit='contain',round=0){ return {input:await remote(url,w,h,fit,round),left,top}; }
function title(v,sub=''){ return text(75,92,v,38,'b') + (sub ? text(75,127,sub,18,'m') : ''); }
function card(x,y,w,h,accent=C.line){ return rect(x,y,w,h,18,C.panel,accent,2,.96); }

export async function renderHomeCard(player,user={}){
  const W=1400,H=880; const lvl=playerLevelInfo(player); const power=calculatePlayerPower(player);
  const owned=Object.keys(player.characters||{}); const preferred=(player.showcase||[]).filter(id=>player.characters[id]);
  const ids=[...preferred,...owned.filter(id=>!preferred.includes(id)).sort((a,b)=>characterPower(player,b)-characterPower(player,a))].slice(0,10);
  let bg=background(W,H)+card(70,72,330,730,C.gold2)+card(425,72,900,730,C.purple);
  let fg=text(95,112,'NEVERLESS RPG',28,'g')+text(95,143,'TRAVELER PROFILE',15,'m');
  fg+=text(95,350,user.username||player.username,27,'b')+text(95,383,`Account Lv. ${lvl.level} / ${lvl.maxLevel}`,17,'m')+bar(95,404,270,14,lvl.progress,C.gold)+text(95,437,lvl.nextNeed?`${fmt(lvl.currentXp)} / ${fmt(lvl.nextNeed)} XP`:'MAX LEVEL',14,'m');
  fg+=text(95,495,'PWR',16,'m')+text(95,535,fmt(power),36,'b');
  const rows=[['Characters',owned.length],['Resin',`${player.resin}/160`],['MMR',player.pvp?.mmr||1000]]; let yy=588;
  for(const [k,v] of rows){fg+=text(95,yy,k,16,'m')+text(365,yy,String(v),17,'b','end'); yy+=42;}
  fg+=text(450,111,'SHOWCASE',28,'b')+text(450,141,'Your selected characters • levels and power shown below',16,'m');
  const images=[]; const avatar=await imageLayer(user.avatarUrl,150,150,160,175,'cover',75); images.push(avatar); fg+=`<circle cx="235" cy="250" r="80" fill="none" stroke="${C.gold}" stroke-width="3"/>`;
  const primo=await imageLayer(PRIMO,42,42,92,735); const mora=await imageLayer(MORA,42,42,235,735); images.push(primo,mora);
  fg+=text(140,747,'Primogems',12,'m')+text(140,772,fmt(player.primogems),18,'b')+text(283,747,'Mora',12,'m')+text(283,772,fmt(player.mora),18,'b');
  const cols=5,sw=160,sh=250,gap=15,sx=450,sy=175;
  for(let i=0;i<10;i++){
    const x=sx+(i%cols)*(sw+gap), y=sy+Math.floor(i/cols)*(sh+gap), id=ids[i];
    bg+=card(x,y,sw,sh,id?rarityColor(characters[id].rarity):C.line);
    if(id){const d=characters[id],o=player.characters[id];images.push(await imageLayer(d.icon,120,120,x+20,y+14,'contain',14));fg+=text(x+12,y+160,trim(d.name,17),17,'b')+text(x+12,y+190,`Lv.${o.level}`,15,'m')+text(x+12,y+216,`PWR ${fmt(characterPower(player,id))}`,13,'m')+stars(x+17,y+234,d.rarity);}
    else fg+=text(x+sw/2,y+125,'EMPTY',15,'f','middle');
  }
  fg+=text(450,760,'Use the buttons below to play. Profile always returns here.',16,'m');
  return compose(W,H,bg,images,fg);
}

export async function renderWishCard(player,banner,lastResults=[]){
  const W=1400,H=860; let bg=background(W,H,banner==='character'?C.purple:C.blue); let fg=title(banner==='character'?'CHARACTER WISH':'WEAPON WISH',`Primogems ${fmt(player.primogems)} • 1 pull 160 • 10 pulls 1,600 • 5★ pity ${player.pity[banner]}/90 • 4★ pity ${player.pity[`${banner}Four`]}/10`); const images=[];
  bg+=card(70,150,1260,625,C.gold2);
  const results=lastResults.length?lastResults:Array.from({length:10},()=>null); const cols=5,sw=230,sh=255,gap=18,sx=95,sy=180;
  for(let i=0;i<10;i++){const x=sx+(i%cols)*(sw+gap),y=sy+Math.floor(i/cols)*(sh+gap),r=results[i];bg+=card(x,y,sw,sh,r?rarityColor(r.rarity):C.line);if(r){const item=r.kind==='character'?characters[r.id]:weapons[r.id];images.push(await imageLayer(item?.icon||item?.image,165,165,x+32,y+14,'contain',14));fg+=text(x+12,y+196,trim(item?.name||r.id,23),16,'b')+text(x+12,y+222,r.duplicate?'DUPLICATE':'NEW',12,r.duplicate?'m':'g')+stars(x+16,y+241,r.rarity);}else fg+=text(x+sw/2,y+130,'WISH SLOT',14,'f','middle');}
  return compose(W,H,bg,images,fg);
}

export async function renderDomainCard(player,session){
  const W=1400,H=850; const d=session.domainId?domains[session.domainId]:null; let bg=background(W,H,C.green),fg=title('DOMAINS','Farm artifacts, Mora, Primogems and account XP'),images=[];
  bg+=card(70,155,455,615,C.green)+card(550,155,780,615,C.red);
  if(!d){fg+=text(100,225,'Choose a Domain',30,'b')+text(100,265,'Then select exactly four owned characters.',18,'m');let y=325;for(const q of Object.values(domains).slice(0,5)){fg+=text(100,y,q.name,18,'b')+text(100,y+26,`${q.resin} Resin • Lv.${q.level}`,14,'m');y+=70;}fg+=text(585,235,'ENEMY PREVIEW',24,'b')+text(585,275,'Select a domain to reveal enemies and rewards.',17,'m');return compose(W,H,bg,images,fg);}
  const progress=player.domainProgress?.[d.id]||{clears:0,fastestTurns:null};
  fg+=text(100,220,d.name,26,'b')+text(100,255,`Lv.${d.level} • ${d.resin} Resin`,17,'m')+text(100,295,`Your Resin: ${player.resin}/160`,16,'m')+text(100,325,`Clears: ${progress.clears||0}`,16,'m')+text(100,355,`Fastest: ${progress.fastestTurns??'—'} turns`,16,'m');
  fg+=text(100,410,'TEAM',19,'b'); let ty=445;for(const id of (session.team||[]).slice(0,4)){fg+=text(115,ty,`${characters[id]?.name||id} • Lv.${player.characters[id]?.level||1}`,16,'t');ty+=34;} if(!(session.team||[]).length)fg+=text(115,445,'No team selected',16,'m');
  fg+=text(100,610,'REWARDS',19,'b')+text(100,642,`${fmt(d.rewards.mora[0])}-${fmt(d.rewards.mora[1])} Mora`,15,'m')+text(100,672,`${d.rewards.primogems} Primogems`,15,'m')+text(100,702,d.setIds.map(id=>artifactSets[id]?.name||id).join(' • '),14,'m');
  fg+=text(585,205,'ENEMIES',24,'b'); const ew=220,eh=270,g=20,sx=585,sy=235;
  for(let i=0;i<Math.min(3,d.enemies.length);i++){const e=d.enemies[i],x=sx+i*(ew+g);bg+=card(x,sy,ew,eh,C.red);images.push(await imageLayer(e.image,170,170,x+25,sy+15,'contain',16));fg+=text(x+12,sy+205,trim(e.name,20),17,'b')+text(x+12,sy+233,`${e.element} • ${fmt(e.hp)} HP`,14,'m');}
  fg+=text(585,555,'DOMAIN LOGIC',20,'b')+text(585,590,'• Normal clear unlocks progress tracking',15,'m')+text(585,620,'• Quick Clear requires a previous win and enough power',15,'m')+text(585,650,'• First clears can grant bonus Primogems',15,'m');
  return compose(W,H,bg,images,fg);
}

export async function renderRosterCard(player){
  const W=1400,H=900;const ids=Object.keys(player.characters).sort((a,b)=>characterPower(player,b)-characterPower(player,a));let bg=background(W,H,C.purple),fg=title('CHARACTERS',`${ids.length} owned • inspect, level, equip and manage showcase`),images=[];const cols=5,sw=235,sh=225,g=20,sx=80,sy=160;
  for(let i=0;i<15;i++){const x=sx+(i%cols)*(sw+g),y=sy+Math.floor(i/cols)*(sh+g),id=ids[i];bg+=card(x,y,sw,sh,id?rarityColor(characters[id].rarity):C.line);if(id){const d=characters[id],o=player.characters[id];images.push(await imageLayer(d.icon,135,135,x+50,y+8,'contain',14));fg+=text(x+14,y+168,trim(d.name,22),18,'b')+text(x+14,y+195,`Lv.${o.level} • PWR ${fmt(characterPower(player,id))}`,14,'m')+stars(x+18,y+211,d.rarity);}else fg+=text(x+sw/2,y+115,'—',20,'f','middle');}
  return compose(W,H,bg,images,fg);
}

export async function renderCharacterCard(player,id){
  const built=buildCharacterStats(player,id);if(!built)return renderRosterCard(player);const W=1400,H=880,d=built.definition,o=built.owned,s=built.stats;let bg=background(W,H,rarityColor(d.rarity)),fg=title(d.name,`${d.element} • ${d.weaponType} • ${d.role} • ${d.rarity}★`),images=[];bg+=card(70,160,420,640,rarityColor(d.rarity))+card(515,160,815,640,C.purple);images.push(await imageLayer(d.image,380,570,90,190,'contain',18));fg+=text(100,770,`Lv.${o.level} • C${o.constellation} • PWR ${fmt(characterPower(player,id))}`,19,'b');
  const rows=[['HP',fmt(s.hp)],['ATK',fmt(s.atk)],['DEF',fmt(s.def)],['CRIT',pct(s.critRate)],['CRIT DMG',pct(s.critDmg)],['SPD',fmt(s.spd)]];let y=220;for(let i=0;i<rows.length;i++){const col=i%2,row=Math.floor(i/2),x=550+col*350,yy=y+row*60;fg+=text(x,yy,rows[i][0],16,'m')+text(x+260,yy,rows[i][1],18,'b','end');}
  const weapon=o.weaponId?weapons[o.weaponId]:null;fg+=line(550,390,1285,390)+text(550,430,'EQUIPMENT',20,'b')+text(550,465,weapon?weapon.name:'No weapon equipped',17,'t')+text(550,495,`${(o.artifactIds||[]).length}/5 Artifacts equipped`,15,'m');fg+=line(550,535,1285,535)+text(550,575,'SKILLS',20,'b');let sy=610;for(const key of ['normal','skill','burst']){const sk=d.skills[key];fg+=text(550,sy,`${key.toUpperCase()} • ${sk.name}`,17,'b')+text(1180,sy,`×${Number(sk.multiplier||0).toFixed(2)}`,15,'m','end');sy+=48;}
  return compose(W,H,bg,images,fg);
}

export async function renderInventoryCard(player){
  const W=1400,H=880;let bg=background(W,H,C.blue),fg=title('INVENTORY',`${Object.keys(player.characters).length} characters • ${Object.keys(player.weapons).length} weapons • ${Object.keys(player.artifacts).length} artifacts`),images=[];bg+=card(70,160,1260,640,C.blue);const chars=Object.keys(player.characters).slice(0,8),weps=Object.keys(player.weapons).slice(0,10);fg+=text(95,205,'CHARACTERS',20,'b');for(let i=0;i<8;i++){const id=chars[i],x=95+i*150;if(id){images.push(await imageLayer(characters[id].icon,95,95,x,225,'contain',12));fg+=text(x,342,trim(characters[id].name,14),13,'b')+text(x,363,`Lv.${player.characters[id].level}`,12,'m');}}
  fg+=line(95,405,1305,405)+text(95,447,'WEAPONS',20,'b');for(let i=0;i<10;i++){const id=weps[i],x=95+(i%5)*240,y=470+Math.floor(i/5)*135;if(id){bg+=card(x,y,220,115,14,rarityColor(weapons[id].rarity));images.push(await imageLayer(weapons[id].image,80,80,x+8,y+15));fg+=text(x+95,y+45,trim(weapons[id].name,16),14,'b')+text(x+95,y+70,`${weapons[id].type} • R${player.weapons[id].refinement}`,12,'m');}}
  return compose(W,H,bg,images,fg);
}

export async function renderArtifactsCard(player){
  const W=1400,H=880;const arts=Object.values(player.artifacts).slice(0,15);let bg=background(W,H,C.gold),fg=title('ARTIFACTS',`${Object.keys(player.artifacts).length} owned • clear Domains to farm more`),images=[];const cols=5,sw=235,sh=200,g=20,sx=80,sy=165;
  for(let i=0;i<15;i++){const x=sx+(i%cols)*(sw+g),y=sy+Math.floor(i/cols)*(sh+g),a=arts[i];bg+=card(x,y,sw,sh,a?C.gold2:C.line);if(a){const set=artifactSets[a.setId];images.push(await imageLayer(set?.image,90,90,x+15,y+18));fg+=text(x+115,y+48,a.slot,16,'b')+text(x+115,y+72,`${a.rarity}★ • +${a.level}`,13,'m')+text(x+15,y+130,trim(set?.name||a.setId,24),14,'b')+text(x+15,y+158,`${a.main.key}: ${typeof a.main.value==='number'&&a.main.value<1?pct(a.main.value):Math.round(a.main.value)}`,12,'m');}}
  return compose(W,H,bg,images,fg);
}

export async function renderUpgradesCard(player){
  const W=1400,H=700;let bg=background(W,H,C.orange),fg=title('ACCOUNT UPGRADES',`Mora ${fmt(player.mora)} • permanent stats with PvP-safe caps`);const data=[['ATK',player.passive.atk,20],['HP',player.passive.hp,20],['CRIT Rate',player.passive.critRate,15],['CRIT DMG',player.passive.critDmg,15],['SPD',player.passive.spd,20]];for(let i=0;i<data.length;i++){const x=75+i*255,y=190;bg+=card(x,y,225,350,C.orange);const [name,lv,cap]=data[i];fg+=text(x+112,y+65,name,20,'b','middle')+text(x+112,y+115,`Lv.${lv} / ${cap}`,18,'m','middle')+bar(x+30,y+165,165,14,lv/cap,C.orange)+text(x+112,y+245,'Spend Mora',14,'m','middle')+text(x+112,y+280,'to improve account',13,'f','middle');}return compose(W,H,bg,[],fg);
}

export async function renderCpuCard(player,session){
  const W=1400,H=760;let bg=background(W,H,C.red),fg=title('CPU ARENA','Fight the Neverless Automaton • same combat engine used for PvP'),images=[];bg+=card(70,160,1260,520,C.red);fg+=text(95,215,'YOUR TEAM',20,'b');for(let i=0;i<4;i++){const id=(session.team||[])[i],x=95+i*190;bg+=card(x,245,170,260,id?C.green:C.line);if(id){images.push(await imageLayer(characters[id].icon,125,125,x+22,260,'contain',14));fg+=text(x+12,420,trim(characters[id].name,16),16,'b')+text(x+12,448,`Lv.${player.characters[id].level}`,14,'m');}else fg+=text(x+85,370,'SELECT',14,'f','middle');}fg+=text(900,215,'ENEMY TEAM',20,'b');const enemy=['xiangling','bennett','fischl','noelle'];for(let i=0;i<4;i++){const id=enemy[i],x=900+(i%2)*190,y=245+Math.floor(i/2)*195;bg+=card(x,y,170,175,C.red);images.push(await imageLayer(characters[id]?.icon,110,110,x+30,y+8,'contain',12));fg+=text(x+12,y+145,characters[id]?.name||id,15,'b');}return compose(W,H,bg,images,fg);
}

export async function renderBattleCard(battle,pendingAction=null){
  const W=1400,H=900,actor=currentActor(battle);let bg=background(W,H,battle.winner?C.gold:C.red),fg=title(battle.winner?(battle.winner==='player'?'VICTORY':'DEFEAT'):(battle.mode==='cpu'?'CPU ARENA':'DOMAIN BATTLE'),battle.winner?'Battle complete':`Turn ${battle.turn+1} • Acting: ${actor?.name||'—'}`),images=[];const sides=[['player','YOUR TEAM',75,C.green],['enemy','OPPONENT',715,C.red]];for(const [side,label,x,color] of sides){fg+=text(x,180,label,20,'b');const arr=battle.actors.filter(a=>a.side===side);for(let i=0;i<arr.length;i++){const a=arr[i],y=205+i*135;bg+=card(x,y,610,115,a.uid===actor?.uid?C.gold:color);images.push(await imageLayer(a.icon||a.image,90,90,x+12,y+12,'contain',12));fg+=text(x+115,y+35,a.name,17,'b')+text(x+115,y+61,`${fmt(a.hp)}/${fmt(a.maxHp)} HP • ${a.energy} Energy • SPD ${a.spd}`,13,'m')+bar(x+115,y+80,445,13,a.hp/a.maxHp,color);}}
  fg+=line(75,760,1325,760)+text(75,802,pendingAction&&actor?`Choose target for ${actor.skills[pendingAction]?.name||pendingAction}`:'Use Normal, Skill or Burst below.',17,'b')+text(75,836,trim(battle.log?.[0]||'Battle started.',120),14,'m');return compose(W,H,bg,images,fg);
}

export async function renderViewCard(view,player,session,user){
  if(session.battle) return {name:'neverless-rpg.png',buffer:await renderBattleCard(session.battle,session.pendingAction)};
  if(view==='wish') return {name:'neverless-rpg.png',buffer:await renderWishCard(player,session.banner,session.lastWish)};
  if(view==='domains') return {name:'neverless-rpg.png',buffer:await renderDomainCard(player,session)};
  if(view==='cpu') return {name:'neverless-rpg.png',buffer:await renderCpuCard(player,session)};
  if(view==='characters') return {name:'neverless-rpg.png',buffer:session.selectedChar?await renderCharacterCard(player,session.selectedChar):await renderRosterCard(player)};
  if(view==='weaponEquip'||view==='artifactEquip') return {name:'neverless-rpg.png',buffer:await renderCharacterCard(player,session.selectedChar)};
  if(view==='inventory') return {name:'neverless-rpg.png',buffer:await renderInventoryCard(player)};
  if(view==='artifacts') return {name:'neverless-rpg.png',buffer:await renderArtifactsCard(player)};
  if(view==='upgrades') return {name:'neverless-rpg.png',buffer:await renderUpgradesCard(player)};
  return {name:'neverless-rpg.png',buffer:await renderHomeCard(player,user)};
}

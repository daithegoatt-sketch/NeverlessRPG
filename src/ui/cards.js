import sharp from 'sharp';
import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { artifactSets } from '../data/artifacts.js';
import { domains } from '../data/domains.js';
import { buildCharacterStats, calculatePlayerPower, characterPower, playerLevelInfo } from '../game/stats.js';
import { currentActor } from '../game/battle.js';

const T = {
  bg:'#111016', panel:'#191620', panel2:'#231f2d', panel3:'#302a3b',
  purple:'#8f75e6', gold:'#c4a969', text:'#f5f2fa', muted:'#aaa5b7',
  green:'#63d49b', red:'#e86d73', blue:'#6ca6de', cyan:'#69d4d0',
};
const imageCache = new Map();
const esc = (s='') => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const stars = (n) => '★'.repeat(Math.max(0,n));
const pct = (n) => `${Math.round((n || 0) * 100)}%`;
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

function svg(w,h,body) {
  return Buffer.from(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .t{font-family:DejaVu Sans,Arial,sans-serif;fill:${T.text}} .m{font-family:DejaVu Sans,Arial,sans-serif;fill:${T.muted}}
      .b{font-family:DejaVu Sans,Arial,sans-serif;font-weight:700;fill:${T.text}}
    </style>${body}</svg>`);
}
function rect(x,y,w,h,r,fill,stroke='none',sw=1){ return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`; }
function text(x,y,value,size=28,cls='t',anchor='start'){ return `<text x="${x}" y="${y}" font-size="${size}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`; }
function line(x1,y1,x2,y2,stroke,width=2){ return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`; }
function wrap(str,max=48){
  const words=String(str||'').split(/\s+/); const out=[]; let cur='';
  for(const word of words){ const next=cur?`${cur} ${word}`:word; if(next.length>max && cur){out.push(cur);cur=word;} else cur=next; }
  if(cur) out.push(cur); return out;
}

async function remote(url,w,h,fit='contain',round=0){
  if(!url) return null;
  const key=`${url}|${w}|${h}|${fit}|${round}`;
  if(imageCache.has(key)) return imageCache.get(key);
  try{
    const res=await fetch(url,{signal:AbortSignal.timeout(3500)});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw=Buffer.from(await res.arrayBuffer());
    let pipe=sharp(raw).resize(w,h,{fit,position:'centre'}).png();
    if(round>0){
      const mask=Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${round}" fill="white"/></svg>`);
      pipe=pipe.composite([{input:mask,blend:'dest-in'}]);
    }
    const out=await pipe.toBuffer(); imageCache.set(key,out); return out;
  }catch{ imageCache.set(key,null); return null; }
}

async function composeCard(w,h,bgBody,images,fgBody){
  const layers=[{input:svg(w,h,bgBody),left:0,top:0}];
  for(const i of images){ if(i.input) layers.push(i); }
  layers.push({input:svg(w,h,fgBody),left:0,top:0});
  return sharp({create:{width:w,height:h,channels:4,background:T.bg}}).composite(layers).png({compressionLevel:8}).toBuffer();
}

function rarityColor(r){ return r>=5?T.gold:r===4?T.purple:T.blue; }

export async function renderHomeCard(player,user={}){
  const W=1500,H=900; const level=playerLevelInfo(player); const power=calculatePlayerPower(player);
  const owned=Object.keys(player.characters).sort((a,b)=>characterPower(player,b)-characterPower(player,a));
  let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4)+rect(70,70,360,H-140,24,T.panel2,T.purple,3);
  let fg=text(485,105,'ROSTER',42,'b')+text(485,145,'Your owned characters • strongest first',25,'m');
  fg+=text(300,130,user.username||player.username,34,'b')+text(300,175,`Lv. ${level.level} / ${level.maxLevel}`,24,'m');
  fg+=rect(300,202,100,20,10,T.panel3)+rect(300,202,100*level.progress,20,10,T.gold)+text(300,249,level.nextNeed?`${level.currentXp} / ${level.nextNeed} XP`:'MAX LEVEL',18,'m');
  fg+=text(110,320,'PWR',25,'m')+text(110,370,fmt(power),40,'b');
  const res=[['Characters',owned.length],['Resin',`${player.resin} / 160`],['Mora',fmt(player.mora)],['Primogems',fmt(player.primogems)],['MMR',fmt(player.pvp?.mmr||1000)]];
  let ry=470; for(const [k,v] of res){ fg+=text(110,ry,k,24,'m')+text(365,ry,String(v),24,'b','end'); ry+=65; }
  const images=[]; const avatar=await remote(user.avatarUrl,150,150,'cover',75); if(avatar) images.push({input:avatar,left:110,top:105});
  fg+=`<circle cx="185" cy="180" r="78" fill="none" stroke="${T.gold}" stroke-width="4"/>`;
  const cols=5, sw=180, sh=185, gap=24, sx=485, sy=175;
  for(let i=0;i<15;i++){
    const x=sx+(i%cols)*(sw+gap), y=sy+Math.floor(i/cols)*(sh+gap); const id=owned[i];
    bg+=rect(x,y,sw,sh,18,id?T.panel2:T.panel,T.panel3,2);
    if(id){
      const def=characters[id], own=player.characters[id], icon=await remote(def.icon,118,118,'contain',14); if(icon) images.push({input:icon,left:x+31,top:y+12});
      fg+=rect(x,y,sw,sh,18,'none',rarityColor(def.rarity),3)+text(x+15,y+148,def.name,20,'b')+text(x+15,y+173,`Lv.${own.level} • ${stars(def.rarity)}`,16,'m');
    }else fg+=text(x+sw/2,y+sh/2+10,'+',48,'m','middle');
  }
  fg+=text(485,H-68,'Open the menu below • Wish • Domains • Battle • Inventory • Upgrades',22,'m');
  return composeCard(W,H,bg,images,fg);
}

export async function renderRosterCard(player){
  const W=1500,H=930; const ids=Object.keys(player.characters).sort((a,b)=>characterPower(player,b)-characterPower(player,a));
  let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4);
  let fg=text(80,105,'CHARACTERS',42,'b')+text(80,145,`${ids.length} owned • Select a character below to inspect`,24,'m');
  const images=[]; const cols=5, sw=250, sh=225, gap=28, sx=80, sy=190;
  for(let i=0;i<15;i++){
    const x=sx+(i%cols)*(sw+gap), y=sy+Math.floor(i/cols)*(sh+gap), id=ids[i];
    bg+=rect(x,y,sw,sh,20,id?T.panel2:T.panel,T.panel3,2);
    if(id){
      const def=characters[id], own=player.characters[id], cp=characterPower(player,id), icon=await remote(def.icon,145,145,'contain',16); if(icon) images.push({input:icon,left:x+52,top:y+10});
      fg+=rect(x,y,sw,sh,20,'none',rarityColor(def.rarity),3)+text(x+18,y+170,def.name,22,'b')+text(x+18,y+198,`Lv.${own.level} • PWR ${fmt(cp)}`,17,'m');
    } else fg+=text(x+sw/2,y+sh/2,'+',50,'m','middle');
  }
  return composeCard(W,H,bg,images,fg);
}

export async function renderCharacterCard(player,charId){
  const built=buildCharacterStats(player,charId); if(!built) return renderRosterCard(player);
  const W=1500,H=950; const d=built.definition,o=built.owned,s=built.stats,cp=characterPower(player,charId); const weapon=o.weaponId?weapons[o.weaponId]:null;
  let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4)+rect(70,80,430,790,24,T.panel2,rarityColor(d.rarity),3)+rect(540,80,890,790,24,T.panel2,T.panel3,2);
  let fg=text(560,125,`${stars(d.rarity)} ${d.name}`,38,'b')+text(560,165,`${d.element} • ${d.weaponType} • ${d.role}`,23,'m')+text(1280,125,`PWR ${fmt(cp)}`,28,'b','end');
  const stats=[['HP',fmt(s.hp)],['ATK',fmt(s.atk)],['DEF',fmt(s.def)],['CRIT',pct(s.critRate)],['CRIT DMG',pct(s.critDmg)],['SPD',fmt(s.spd)],['Constellation',`C${o.constellation}`],['Weapon',weapon?.name||'None']];
  let y=230; for(let i=0;i<stats.length;i++){ const col=i%2, row=Math.floor(i/2), x=570+col*390, yy=y+row*58; fg+=text(x,yy,stats[i][0],19,'m')+text(x+260,yy,stats[i][1],21,'b','end'); }
  fg+=line(570,475,1390,475,T.panel3,2)+text(570,525,'SKILLS',27,'b');
  const skillKeys=['normal','skill','burst']; let sy=575;
  for(const key of skillKeys){ const sk=d.skills[key]; fg+=text(570,sy,`${key.toUpperCase()} • ${sk.name}`,22,'b'); let ly=sy+30; for(const l of wrap(sk.description,62).slice(0,2)){ fg+=text(590,ly,l,18,'m'); ly+=24; } fg+=text(1260,sy,`×${Number(sk.multiplier||0).toFixed(2)}${key==='burst'?` • ${sk.cost} Energy`:key==='skill'?` • CD ${sk.cooldown}`:''}`,18,'m','end'); sy+=108; }
  fg+=text(100,840,`Lv.${o.level}`,28,'b')+text(420,840,`${(o.artifactIds||[]).length}/5 Artifacts`,20,'m','end');
  const images=[]; const art=await remote(d.image,400,680,'contain',22); if(art) images.push({input:art,left:85,top:105});
  return composeCard(W,H,bg,images,fg);
}

export async function renderWishCard(player,banner,lastResults=[]){
  const W=1500,H=870; let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4);
  let fg=text(80,105,banner==='character'?'CHARACTER EVENT WISH':'WEAPON EVENT WISH',40,'b')+text(80,145,`Primogems ${fmt(player.primogems)} • 5★ pity ${player.pity[banner]} • 4★ pity ${player.pity[`${banner}Four`]}`,22,'m');
  const results=lastResults.length?lastResults:Array.from({length:10},()=>null); const images=[];
  const cols=5, sw=250, sh=300, gap=28, sx=80, sy=190;
  for(let i=0;i<10;i++){
    const x=sx+(i%cols)*(sw+gap),y=sy+Math.floor(i/cols)*(sh+gap),r=results[i];
    bg+=rect(x,y,sw,sh,22,T.panel2,r?rarityColor(r.rarity):T.panel3,3);
    if(r){ const item=r.kind==='character'?characters[r.id]:weapons[r.id]; const img=await remote(item?.icon||item?.image,190,190,'contain',18); if(img) images.push({input:img,left:x+30,top:y+20}); fg+=text(x+18,y+235,item?.name||r.id,21,'b')+text(x+18,y+265,`${stars(r.rarity)}${r.duplicate?' • DUPLICATE':''}`,18,'m'); }
    else fg+=text(x+sw/2,y+150,'WISH',26,'m','middle');
  }
  fg+=text(80,H-55,'Wish ×10 renders all ten results here • duplicates raise Constellation / Refinement',21,'m');
  return composeCard(W,H,bg,images,fg);
}

export async function renderInventoryCard(player){
  const W=1500,H=980; let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4);
  let fg=text(80,105,'INVENTORY',42,'b')+text(80,145,`${Object.keys(player.characters).length} Characters • ${Object.keys(player.weapons).length} Weapons • ${Object.keys(player.artifacts).length} Artifacts`,22,'m');
  const images=[]; const chars=Object.keys(player.characters).slice(0,10), weps=Object.keys(player.weapons).slice(0,10); const cols=5, sw=250, sh=175, gap=28, sx=80;
  fg+=text(80,200,'CHARACTERS',26,'b');
  for(let i=0;i<10;i++){ const x=sx+(i%cols)*(sw+gap),y=225+Math.floor(i/cols)*190,id=chars[i]; bg+=rect(x,y,sw,sh,18,T.panel2,T.panel3,2); if(id){const d=characters[id],o=player.characters[id],im=await remote(d.icon,110,110,'contain',14);if(im)images.push({input:im,left:x+12,top:y+18});fg+=rect(x,y,sw,sh,18,'none',rarityColor(d.rarity),3)+text(x+132,y+65,d.name,19,'b')+text(x+132,y+95,`Lv.${o.level}`,17,'m')+text(x+132,y+123,stars(d.rarity),16,'m');}else fg+=text(x+sw/2,y+95,'+',40,'m','middle'); }
  fg+=text(80,625,'WEAPONS',26,'b');
  for(let i=0;i<10;i++){ const x=sx+(i%cols)*(sw+gap),y=650+Math.floor(i/cols)*145,id=weps[i]; bg+=rect(x,y,sw,130,18,T.panel2,T.panel3,2); if(id){const d=weapons[id],o=player.weapons[id],im=await remote(d.image,95,95,'contain',12);if(im)images.push({input:im,left:x+12,top:y+15});fg+=rect(x,y,sw,130,18,'none',rarityColor(d.rarity),3)+text(x+118,y+48,d.name.slice(0,17),17,'b')+text(x+118,y+77,`${d.type} • R${o.refinement}`,16,'m')+text(x+118,y+103,stars(d.rarity),15,'m');}else fg+=text(x+sw/2,y+75,'+',36,'m','middle'); }
  return composeCard(W,H,bg,images,fg);
}

export async function renderDomainCard(player,session){
  const W=1500,H=850; const domain=session.domainId?domains[session.domainId]:null; let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4)+rect(70,80,500,690,24,T.panel2,T.panel3,2);
  let fg=text(100,130,'DOMAINS',40,'b')+text(100,175,domain?.name||'Select a Domain',26,'b'); const images=[];
  if(domain){
    fg+=text(100,220,`Difficulty ${domain.level} • ${domain.resin} Resin`,21,'m')+text(100,255,`Recommended PWR ${fmt(domain.recommendedPower)}`,21,'m'); let yy=305; for(const l of wrap(domain.description,40)){fg+=text(100,yy,l,19,'m');yy+=27;}
    fg+=text(100,430,'YOUR TEAM',22,'b'); const team=session.team||[]; yy=470; for(const id of team.slice(0,4)){fg+=text(120,yy,`${characters[id]?.name||id} • Lv.${player.characters[id]?.level||1}`,19,'t');yy+=35;}
    fg+=text(100,650,'Rewards',21,'b')+text(100,685,`${domain.rewards.mora[0].toLocaleString()}–${domain.rewards.mora[1].toLocaleString()} Mora • ${domain.rewards.primogems} Primogems`,18,'m');
    fg+=text(620,135,'ENEMIES',30,'b');
    const eW=245,eH=285,gap=35,sx=620,sy=190;
    for(let i=0;i<3;i++){const e=domain.enemies[i],x=sx+i*(eW+gap);bg+=rect(x,sy,eW,eH,22,T.panel2,e?T.red:T.panel3,3);if(e){const im=await remote(e.image,190,190,'contain',18);if(im)images.push({input:im,left:x+28,top:sy+20});fg+=text(x+18,sy+230,e.name,20,'b')+text(x+18,sy+258,`${e.element} • ${fmt(e.hp)} HP`,17,'m');}else fg+=text(x+eW/2,sy+145,'—',36,'m','middle');}
  }else{
    let y=250; for(const d of Object.values(domains)){fg+=text(100,y,d.name,21,'b')+text(100,y+28,`PWR ${fmt(d.recommendedPower)} • ${d.resin} Resin`,17,'m');y+=88;} fg+=text(620,260,'Choose a domain from the selector below.',28,'m');
  }
  return composeCard(W,H,bg,images,fg);
}

export async function renderCpuCard(player,session){
  const W=1500,H=760; let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4)+rect(70,80,430,600,24,T.panel2,T.red,3);
  let fg=text(100,135,'CPU ARENA',40,'b')+text(100,180,'Neverless Automaton',27,'b')+text(100,220,'Test the PvP battle engine against AI.',20,'m')+text(100,280,'Opponent Team',22,'b');
  const enemy=['xiangling','bennett','fischl','noelle']; let y=325; for(const id of enemy){fg+=text(120,y,characters[id].name,20,'t');y+=40;}
  fg+=text(550,135,'YOUR TEAM',30,'b')+text(550,175,'Choose exactly four owned characters.',20,'m'); const images=[]; const team=session.team||[];
  for(let i=0;i<4;i++){const id=team[i],x=550+i*220;bg+=rect(x,230,190,250,20,T.panel2,id?T.gold:T.panel3,3);if(id){const im=await remote(characters[id].icon,150,150,'contain',16);if(im)images.push({input:im,left:x+20,top:245});fg+=text(x+15,425,characters[id].name,20,'b')+text(x+15,454,`Lv.${player.characters[id].level}`,17,'m');}else fg+=text(x+95,360,'+',46,'m','middle');}
  fg+=text(550,560,'Battle uses SPD initiative, Normal / Skill / Burst, targeting, healing, shields and buffs.',20,'m');
  return composeCard(W,H,bg,images,fg);
}

export async function renderBattleCard(battle,pendingAction=null){
  const W=1500,H=940; const actor=currentActor(battle); let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4);
  let fg=text(80,105,battle.winner?(battle.winner==='player'?'VICTORY':'DEFEAT'):(battle.mode==='cpu'?'CPU ARENA':'DOMAIN BATTLE'),40,'b')+text(80,145,battle.winner?'Battle complete':`Turn ${battle.turn+1} • Acting: ${actor?.name||'—'}`,22,'m');
  const images=[];
  function sideBlock(side,title,x){ let out=text(x,205,title,27,'b'); const arr=battle.actors.filter(a=>a.side===side); arr.forEach((a,i)=>{const y=240+i*135; bg+=rect(x,y,620,115,18,T.panel2,a.uid===actor?.uid?T.gold:T.panel3,a.uid===actor?.uid?4:2); const ratio=clamp(a.hp/a.maxHp,0,1); bg+=rect(x+125,y+72,450,18,9,T.panel3)+rect(x+125,y+72,450*ratio,18,9,side==='player'?T.green:T.red); out+=text(x+125,y+34,a.name,21,'b')+text(x+125,y+60,`${fmt(a.hp)} / ${fmt(a.maxHp)} HP • ${a.energy} Energy • SPD ${a.spd}`,16,'m'); }); return out; }
  fg+=sideBlock('player','YOUR TEAM',80)+sideBlock('enemy','OPPONENT',800);
  for(const [side,x] of [['player',80],['enemy',800]]){const arr=battle.actors.filter(a=>a.side===side);for(let i=0;i<arr.length;i++){const im=await remote(arr[i].icon||arr[i].image,95,95,'contain',14);if(im)images.push({input:im,left:x+15,top:248+i*135});}}
  fg+=line(80,790,1420,790,T.panel3,2)+text(80,835,pendingAction&&actor?`Choose target for ${actor.skills[pendingAction]?.name||pendingAction}`:(actor?`${actor.skills.normal.name} • ${actor.skills.skill.name} • ${actor.skills.burst.name}`:'Battle ended'),22,'b');
  fg+=text(80,870,battle.log[0]||'—',18,'m');
  return composeCard(W,H,bg,images,fg);
}

export async function renderArtifactsCard(player){
  const W=1500,H=900; const arts=Object.values(player.artifacts).slice(0,15); let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4); let fg=text(80,105,'ARTIFACTS',42,'b')+text(80,145,`${Object.keys(player.artifacts).length} owned • equip from a character page`,22,'m'); const images=[];
  const cols=5,sw=250,sh=205,gap=28,sx=80,sy=190;
  for(let i=0;i<15;i++){const a=arts[i],x=sx+(i%cols)*(sw+gap),y=sy+Math.floor(i/cols)*(sh+gap);bg+=rect(x,y,sw,sh,18,T.panel2,a?T.gold:T.panel3,2);if(a){const set=artifactSets[a.setId],im=await remote(set?.image,100,100,'contain',12);if(im)images.push({input:im,left:x+15,top:y+15});fg+=text(x+125,y+50,a.slot,20,'b')+text(x+125,y+78,`+${a.level} • ${stars(a.rarity)}`,16,'m')+text(x+18,y+135,set?.name||a.setId,17,'t')+text(x+18,y+166,`${a.main.key}: ${typeof a.main.value==='number'&&a.main.value<1?pct(a.main.value):Math.round(a.main.value)}`,16,'m')+text(x+18,y+191,a.equippedTo?`Equipped: ${characters[a.equippedTo]?.name||a.equippedTo}`:'Unequipped',14,'m');}else fg+=text(x+sw/2,y+sh/2,'+',42,'m','middle');}
  return composeCard(W,H,bg,images,fg);
}

export async function renderUpgradesCard(player){
  const W=1500,H=700; let bg=rect(38,38,W-76,H-76,30,T.panel,T.purple,4); let fg=text(80,110,'PASSIVE DEVELOPMENT',42,'b')+text(80,150,'Permanent account upgrades. Cost rises each level and PvP caps prevent runaway scaling.',21,'m');
  const stats=[['ATK',player.passive.atk,20],['HP',player.passive.hp,20],['CRIT Rate',player.passive.critRate,15],['CRIT DMG',player.passive.critDmg,15],['SPD',player.passive.spd,20]];
  stats.forEach((s,i)=>{const x=90+i*275,y=230;bg+=rect(x,y,240,330,20,T.panel2,T.panel3,2);fg+=text(x+120,y+70,s[0],24,'b','middle')+text(x+120,y+125,`Lv.${s[1]} / ${s[2]}`,22,'m','middle');const pr=s[1]/s[2];bg+=rect(x+30,y+180,180,18,9,T.panel3)+rect(x+30,y+180,180*pr,18,9,T.purple);fg+=text(x+120,y+250,`Next: ${fmt(5000+s[1]*2500)} Mora`,16,'m','middle');});
  fg+=text(80,630,`Mora balance: ${fmt(player.mora)}`,23,'b'); return composeCard(W,H,bg,[],fg);
}

export async function renderViewCard(view,player,session,user){
  if(session.battle) return {name:'neverless-battle.png',buffer:await renderBattleCard(session.battle,session.pendingAction)};
  if(view==='wish') return {name:'neverless-wish.png',buffer:await renderWishCard(player,session.banner,session.lastWish)};
  if(view==='domains') return {name:'neverless-domain.png',buffer:await renderDomainCard(player,session)};
  if(view==='cpu') return {name:'neverless-cpu.png',buffer:await renderCpuCard(player,session)};
  if(view==='characters') return {name:'neverless-characters.png',buffer:session.selectedChar?await renderCharacterCard(player,session.selectedChar):await renderRosterCard(player)};
  if(view==='weaponEquip' || view==='artifactEquip') return {name:'neverless-character.png',buffer:await renderCharacterCard(player,session.selectedChar)};
  if(view==='inventory') return {name:'neverless-inventory.png',buffer:await renderInventoryCard(player)};
  if(view==='artifacts') return {name:'neverless-artifacts.png',buffer:await renderArtifactsCard(player)};
  if(view==='upgrades') return {name:'neverless-upgrades.png',buffer:await renderUpgradesCard(player)};
  return {name:'neverless-home.png',buffer:await renderHomeCard(player,user)};
}

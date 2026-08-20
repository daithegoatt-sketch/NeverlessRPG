import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { artifactSets } from '../data/artifacts.js';
import { domains } from '../data/domains.js';
import { buildCharacterStats, calculatePlayerPower, characterPower, playerLevelInfo } from '../game/stats.js';
import { characterLevelCost, talentUpgradeCost } from '../game/progression.js';
import { currentActor } from '../game/battle.js';

sharp.cache({ memory: 96, files: 0, items: 256 });
sharp.concurrency(4);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const T = {
  bg:'#090a11', bg2:'#10131c', panel:'#141824', panel2:'#1a2030', panel3:'#242b3c',
  purple:'#8d74e8', violet:'#6f58c9', gold:'#d4b86b', gold2:'#8f7640',
  text:'#f7f5fb', muted:'#a9adba', faint:'#747a8c', green:'#58d39a', red:'#eb6d78',
  blue:'#62a7e8', cyan:'#69d4d0', white:'#ffffff', orange:'#f0a45d',
};
const PRIMOGEM_ICON = 'https://enka.network/ui/UI_ItemIcon_201.png';
const MORA_ICON = 'https://enka.network/ui/UI_ItemIcon_202.png';
const rawCache = new Map();
const imageCache = new Map();
const MAX_RAW_CACHE = 180;
const MAX_IMAGE_CACHE = 420;

function fontCss() {
  const candidates = [
    ['400','noto-sans-latin-400-normal.woff2'],
    ['700','noto-sans-latin-700-normal.woff2'],
  ];
  let css='';
  for (const [weight,file] of candidates) {
    try {
      const buf=fs.readFileSync(path.join(ROOT,'node_modules','@fontsource','noto-sans','files',file));
      css+=`@font-face{font-family:'NeverlessSans';src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2');font-weight:${weight};font-style:normal;}`;
    } catch {}
  }
  return css;
}
const FONT_CSS = fontCss();

const esc = (s='') => String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const pct = (n) => `${Math.round((n || 0) * 100)}%`;
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const shorten = (s,max=22) => String(s||'').length>max ? `${String(s).slice(0,max-1)}…` : String(s||'');
function wrap(str,max=48){ const words=String(str||'').split(/\s+/); const out=[]; let cur=''; for(const word of words){ const next=cur?`${cur} ${word}`:word; if(next.length>max&&cur){out.push(cur);cur=word;}else cur=next;} if(cur)out.push(cur); return out; }
function evict(map,max){ while(map.size>max) map.delete(map.keys().next().value); }

function svg(w,h,body){
  return Buffer.from(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><style>${FONT_CSS}.t{font-family:'NeverlessSans',Arial,sans-serif;fill:${T.text}}.m{font-family:'NeverlessSans',Arial,sans-serif;fill:${T.muted}}.f{font-family:'NeverlessSans',Arial,sans-serif;fill:${T.faint}}.b{font-family:'NeverlessSans',Arial,sans-serif;font-weight:700;fill:${T.text}}.g{font-family:'NeverlessSans',Arial,sans-serif;font-weight:700;fill:${T.gold}}</style>${body}</svg>`);
}
function rect(x,y,w,h,r,fill,stroke='none',sw=1,opacity=1){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`;}
function text(x,y,value,size=28,cls='t',anchor='start'){return `<text x="${x}" y="${y}" font-size="${size}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;}
function line(x1,y1,x2,y2,stroke,width=2,opacity=1){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}"/>`;}
function circle(cx,cy,r,fill,stroke='none',sw=1,opacity=1){return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`;}
function rarityColor(r){return r>=5?T.gold:r===4?T.purple:T.blue;}
function rarityMarks(x,y,r,size=8,gap=18){ let out=''; for(let i=0;i<r;i++){const cx=x+i*gap;out+=`<polygon points="${cx},${y-size} ${cx+size*0.42},${y-size*0.18} ${cx+size},${y} ${cx+size*0.42},${y+size*0.18} ${cx},${y+size} ${cx-size*0.42},${y+size*0.18} ${cx-size},${y} ${cx-size*0.42},${y-size*0.18}" fill="${rarityColor(r)}"/>`; } return out; }
function bar(x,y,w,h,ratio,fill,bg=T.panel3){return rect(x,y,w,h,h/2,bg)+rect(x,y,w*clamp(ratio,0,1),h,h/2,fill);}
function frame(x,y,w,h,r=20,accent=T.purple){return rect(x,y,w,h,r,T.panel2,T.panel3,2)+rect(x,y,w,h,r,'none',accent,2.5,0.95);}
function titleBlock(title,subtitle=''){return text(82,102,title,42,'b')+(subtitle?text(82,140,subtitle,20,'m'):'');}
function scene(W,H,accent=T.purple){
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#090a11"/><stop offset="0.55" stop-color="#10131c"/><stop offset="1" stop-color="#15111d"/></linearGradient><radialGradient id="glow1"><stop offset="0" stop-color="${accent}" stop-opacity=".18"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><radialGradient id="glow2"><stop offset="0" stop-color="${T.gold}" stop-opacity=".12"/><stop offset="1" stop-color="${T.gold}" stop-opacity="0"/></radialGradient><pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="#ffffff" stroke-opacity=".025" stroke-width="1"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#grid)"/><circle cx="${W*.78}" cy="${H*.18}" r="420" fill="url(#glow1)"/><circle cx="${W*.13}" cy="${H*.86}" r="330" fill="url(#glow2)"/><path d="M40 ${H-110} C340 ${H-250}, 600 ${H-40}, ${W-50} ${H-210}" fill="none" stroke="${T.purple}" stroke-opacity=".09" stroke-width="3"/><path d="M60 170 C410 20, 850 190, ${W-40} 55" fill="none" stroke="${T.gold}" stroke-opacity=".08" stroke-width="2"/>${rect(34,34,W-68,H-68,30,'#10131c',accent,2,0.72)}${rect(48,48,W-96,H-96,24,'none',T.gold2,1,0.45)}`;
}

async function raw(url){
  if(!url) return null;
  if(rawCache.has(url)) return rawCache.get(url);
  const promise=(async()=>{try{const res=await fetch(url,{signal:AbortSignal.timeout(2500)});if(!res.ok)throw new Error(`HTTP ${res.status}`);return Buffer.from(await res.arrayBuffer());}catch{return null;}})();
  rawCache.set(url,promise); evict(rawCache,MAX_RAW_CACHE); return promise;
}
async function remote(url,w,h,fit='contain',round=0){
  if(!url) return null;
  const key=`${url}|${w}|${h}|${fit}|${round}`;
  if(imageCache.has(key)) return imageCache.get(key);
  const promise=(async()=>{const source=await raw(url);if(!source)return null;try{let pipe=sharp(source).resize(w,h,{fit,position:'centre',withoutEnlargement:false}).png({compressionLevel:4});if(round>0){const mask=Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${round}" fill="white"/></svg>`);pipe=pipe.composite([{input:mask,blend:'dest-in'}]);}return await pipe.toBuffer();}catch{return null;}})();
  imageCache.set(key,promise); evict(imageCache,MAX_IMAGE_CACHE); return promise;
}
async function batch(items){return Promise.all(items.map(async(i)=>({...i,input:await remote(i.url,i.w,i.h,i.fit||'contain',i.round||0)})));}
async function composeCard(w,h,bgBody,images,fgBody){
  const layers=[{input:svg(w,h,bgBody),left:0,top:0},...images.filter(i=>i.input).map(({input,left,top})=>({input,left,top})),{input:svg(w,h,fgBody),left:0,top:0}];
  return sharp({create:{width:w,height:h,channels:4,background:T.bg}}).composite(layers).png({compressionLevel:6,adaptiveFiltering:true}).toBuffer();
}
function showcaseIds(player,limit=10){
  const owned=Object.keys(player.characters||{});
  const preferred=(player.showcase||[]).filter(id=>player.characters[id]);
  const extras=owned.filter(id=>!preferred.includes(id)).sort((a,b)=>characterPower(player,b)-characterPower(player,a));
  return [...preferred,...extras].slice(0,limit);
}

export async function renderHomeCard(player,user={}){
  const W=1500,H=920, level=playerLevelInfo(player), power=calculatePlayerPower(player), ids=showcaseIds(player,10);
  let bg=scene(W,H,T.purple)+rect(74,78,360,764,24,'#141824',T.gold2,2,0.94)+rect(460,78,966,764,24,'#141824',T.purple,2,0.9);
  let fg=text(104,125,'NEVERLESS RPG',30,'g')+text(104,160,'PROFILE V2',18,'m');
  fg+=text(102,390,user.username||player.username,31,'b')+text(102,426,`Account Lv. ${level.level} / ${level.maxLevel}`,20,'m')+bar(102,449,285,16,level.progress,T.gold)+text(102,487,level.nextNeed?`${fmt(level.currentXp)} / ${fmt(level.nextNeed)} XP`:'MAX ACCOUNT LEVEL',15,'m');
  fg+=text(102,553,'PWR',18,'m')+text(102,597,fmt(power),39,'b');
  const rows=[['Characters',Object.keys(player.characters).length],['Resin',`${player.resin} / 160`],['MMR',fmt(player.pvp?.mmr||1000)]];
  let ry=650; for(const [k,v] of rows){fg+=text(102,ry,k,17,'m')+text(384,ry,String(v),18,'b','end');ry+=46;}
  fg+=text(492,122,'SHOWCASE',30,'b')+text(492,154,'Choose which owned characters appear here from Characters.',17,'m');
  const images=[];
  const av=await remote(user.avatarUrl,178,178,'cover',89); if(av)images.push({input:av,left:165,top:185});
  fg+=circle(254,274,93,'none',T.gold,4)+circle(254,274,99,'none',T.purple,1,0.65);
  const currencyRequests=[{url:PRIMOGEM_ICON,w:45,h:45,left:102,top:758},{url:MORA_ICON,w:45,h:45,left:250,top:758}];
  const cimgs=await batch(currencyRequests); images.push(...cimgs);
  fg+=text(153,767,'PRIMOGEMS',11,'m')+text(153,791,fmt(player.primogems),18,'b')+text(301,767,'MORA',11,'m')+text(301,791,fmt(player.mora),18,'b');
  const cols=5,sw=168,sh=255,gap=18,sx=492,sy=190;
  const req=[];
  for(let i=0;i<10;i++){const x=sx+(i%cols)*(sw+gap),y=sy+Math.floor(i/cols)*(sh+gap),id=ids[i];bg+=frame(x,y,sw,sh,18,id?rarityColor(characters[id].rarity):T.panel3);if(id){const d=characters[id],o=player.characters[id];req.push({url:d.icon,w:132,h:132,left:x+18,top:y+18,round:14});fg+=text(x+13,y+176,shorten(d.name,17),18,'b')+text(x+13,y+206,`Lv.${o.level} • PWR ${fmt(characterPower(player,id))}`,13,'m')+rarityMarks(x+18,y+229,d.rarity,5,13);}else{fg+=text(x+sw/2,y+120,'EMPTY',17,'f','middle')+text(x+sw/2,y+150,'Showcase slot',13,'f','middle');}}
  images.push(...await batch(req));
  fg+=text(492,785,'The profile stays in the channel. Opening a game mode creates a separate active panel.',17,'m');
  return composeCard(W,H,bg,images,fg);
}

export async function renderRosterCard(player){
  const W=1500,H=980,ids=Object.keys(player.characters).sort((a,b)=>characterPower(player,b)-characterPower(player,a));
  let bg=scene(W,H,T.purple),fg=titleBlock('CHARACTERS',`${ids.length} owned • inspect, level talents, equip gear, or change your profile showcase`),images=[];
  const cols=5,sw=250,sh=245,gap=24,sx=82,sy=190,req=[];
  for(let i=0;i<15;i++){const x=sx+(i%cols)*(sw+gap),y=sy+Math.floor(i/cols)*(sh+gap),id=ids[i];bg+=frame(x,y,sw,sh,20,id?rarityColor(characters[id].rarity):T.panel3);if(id){const d=characters[id],o=player.characters[id];req.push({url:d.icon,w:150,h:150,left:x+50,top:y+12,round:16});fg+=text(x+18,y+183,shorten(d.name,20),20,'b')+text(x+18,y+211,`Lv.${o.level} • PWR ${fmt(characterPower(player,id))}`,15,'m')+rarityMarks(x+180,y+216,d.rarity,5,12);}else fg+=text(x+sw/2,y+sh/2,'—',28,'f','middle');}
  images.push(...await batch(req));
  return composeCard(W,H,bg,images,fg);
}

export async function renderCharacterCard(player,charId){
  const built=buildCharacterStats(player,charId); if(!built)return renderRosterCard(player);
  const W=1500,H=980,d=built.definition,o=built.owned,s=built.stats,cp=characterPower(player,charId),weapon=o.weaponId?weapons[o.weaponId]:null,tal=o.talents||{normal:1,skill:1,burst:1};
  let bg=scene(W,H,rarityColor(d.rarity))+rect(75,90,425,815,24,T.panel2,rarityColor(d.rarity),3)+rect(535,90,890,815,24,T.panel2,T.panel3,2);
  let fg=text(565,135,d.name,40,'b')+text(565,171,`${d.element} • ${d.weaponType} • ${d.role}`,20,'m')+text(1368,135,`PWR ${fmt(cp)}`,27,'g','end')+rarityMarks(565,202,d.rarity,7,17);
  const stats=[['HP',fmt(s.hp)],['ATK',fmt(s.atk)],['DEF',fmt(s.def)],['CRIT',pct(s.critRate)],['CRIT DMG',pct(s.critDmg)],['SPD',fmt(s.spd)],['Constellation',`C${o.constellation}`],['Weapon',weapon?.name||'None']];
  let y=270; for(let i=0;i<stats.length;i++){const col=i%2,row=Math.floor(i/2),x=570+col*395,yy=y+row*58;fg+=text(x,yy,stats[i][0],17,'m')+text(x+300,yy,shorten(stats[i][1],24),20,'b','end');}
  fg+=line(570,500,1385,500,T.panel3,2)+text(570,548,'TALENTS',25,'b');
  let sy=590; for(const key of ['normal','skill','burst']){const sk=d.skills[key],tl=tal[key]||1,scaled=(sk.multiplier||0)*(1+(tl-1)*0.06);fg+=text(570,sy,`${key.toUpperCase()}  Lv.${tl} • ${sk.name}`,20,'b')+text(1368,sy,`×${scaled.toFixed(2)}`,18,'g','end');let ly=sy+27;for(const l of wrap(sk.description,64).slice(0,2)){fg+=text(590,ly,l,16,'m');ly+=23;}sy+=105;}
  const nextLevel=o.level<90?characterLevelCost(o.level):0,nextTalent=tal.skill<10?talentUpgradeCost(tal.skill):0;
  fg+=line(570,866,1385,866,T.panel3,2)+text(570,898,o.level<90?`Next character level: ${fmt(nextLevel)} Mora`:'Character Lv.90 MAX',17,'m')+text(1010,898,tal.skill<10?`Skill talent next: ${fmt(nextTalent)} Mora`:'Skill talent MAX',17,'m');
  fg+=text(106,861,`Lv.${o.level}`,28,'b')+text(455,861,`${(o.artifactIds||[]).length}/5 Artifacts`,17,'m','end');
  const art=await remote(d.image,390,690,'contain',22),images=[];if(art)images.push({input:art,left:92,top:135});
  const mora=await remote(MORA_ICON,34,34,'contain',0);if(mora)images.push({input:mora,left:104,top:875});
  return composeCard(W,H,bg,images,fg);
}

export async function renderWishCard(player,banner,lastResults=[]){
  const W=1500,H=920,pity=player.pity[banner]||0,four=player.pity[`${banner}Four`]||0;
  let bg=scene(W,H,banner==='character'?T.purple:T.blue)+rect(78,74,1344,110,22,T.panel2,T.gold2,2);
  let fg=text(104,122,banner==='character'?'CHARACTER EVENT WISH':'WEAPON EVENT WISH',36,'b')+text(104,158,`5★ pity ${pity} / 90 • 4★ pity ${four} / 10 • 160 per pull • 1,600 per ten-pull`,18,'m');
  const images=[]; const primo=await remote(PRIMOGEM_ICON,62,62,'contain');if(primo)images.push({input:primo,left:1180,top:96});fg+=text(1260,112,'PRIMOGEMS',13,'m')+text(1260,143,fmt(player.primogems),28,'b');
  const results=lastResults.length?lastResults:Array.from({length:10},()=>null),cols=5,sw=248,sh=302,gap=25,sx=84,sy=215,req=[];
  for(let i=0;i<10;i++){const x=sx+(i%cols)*(sw+gap),y=sy+Math.floor(i/cols)*(sh+gap),r=results[i];bg+=frame(x,y,sw,sh,20,r?rarityColor(r.rarity):T.panel3);if(r){const item=r.kind==='character'?characters[r.id]:weapons[r.id];req.push({url:item?.icon||item?.image,w:185,h:185,left:x+31,top:y+17,round:16});fg+=text(x+16,y+231,shorten(item?.name||r.id,20),19,'b')+rarityMarks(x+19,y+260,r.rarity,6,14)+text(x+16,y+288,r.duplicate?(r.kind==='character'?'Duplicate • Constellation +1':'Duplicate • Refinement +1'):(r.kind==='character'?'New character':'New weapon'),14,r.duplicate?'m':'g');}else{fg+=text(x+sw/2,y+145,'WISH SLOT',18,'f','middle')+text(x+sw/2,y+175,'Pull to reveal',14,'f','middle');}}
  images.push(...await batch(req));
  fg+=text(84,870,player.primogems>=1600?'You have enough Primogems for a ten-pull.':player.primogems>=160?'You have enough Primogems for a single pull.':'Not enough Primogems for a pull.',18,player.primogems>=160?'m':'g');
  return composeCard(W,H,bg,images,fg);
}

export async function renderInventoryCard(player){
  const W=1500,H=1010,chars=Object.keys(player.characters).slice(0,10),weps=Object.keys(player.weapons).slice(0,10);
  let bg=scene(W,H,T.cyan),fg=titleBlock('INVENTORY',`${Object.keys(player.characters).length} Characters • ${Object.keys(player.weapons).length} Weapons • ${Object.keys(player.artifacts).length} Artifacts`),images=[],req=[];
  fg+=text(82,198,'CHARACTERS',23,'b'); const cols=5,sw=250,gap=24,sx=82;
  for(let i=0;i<10;i++){const x=sx+(i%cols)*(sw+gap),y=220+Math.floor(i/cols)*180,id=chars[i];bg+=frame(x,y,sw,158,16,id?rarityColor(characters[id].rarity):T.panel3);if(id){const d=characters[id],o=player.characters[id];req.push({url:d.icon,w:103,h:103,left:x+13,top:y+17,round:13});fg+=text(x+128,y+48,shorten(d.name,17),18,'b')+text(x+128,y+77,`Lv.${o.level}`,15,'m')+text(x+128,y+105,`PWR ${fmt(characterPower(player,id))}`,14,'m')+rarityMarks(x+133,y+132,d.rarity,5,12);}}
  fg+=text(82,603,'WEAPONS',23,'b');
  for(let i=0;i<10;i++){const x=sx+(i%cols)*(sw+gap),y=625+Math.floor(i/cols)*155,id=weps[i];bg+=frame(x,y,sw,135,16,id?rarityColor(weapons[id].rarity):T.panel3);if(id){const d=weapons[id],o=player.weapons[id];req.push({url:d.image,w:90,h:90,left:x+13,top:y+20,round:10});fg+=text(x+112,y+43,shorten(d.name,16),16,'b')+text(x+112,y+70,`${d.type} • R${o.refinement}`,14,'m')+text(x+112,y+96,`Lv.${o.level}`,14,'m')+rarityMarks(x+116,y+118,d.rarity,4.5,11);}}
  images.push(...await batch(req));
  return composeCard(W,H,bg,images,fg);
}

export async function renderDomainCard(player,session){
  const W=1500,H=930,domain=session.domainId?domains[session.domainId]:null,power=calculatePlayerPower(player);
  let bg=scene(W,H,T.blue)+rect(75,86,480,762,24,T.panel2,T.panel3,2)+rect(585,86,840,762,24,T.panel2,T.panel3,2),fg=titleBlock('DOMAINS','Select a domain, build a four-character team, then Start or Quick Clear'),images=[];
  if(!domain){let y=225;for(const d of Object.values(domains)){const p=player.domainProgress?.[d.id]||{clears:0};fg+=text(105,y,d.name,20,'b')+text(105,y+28,`PWR ${fmt(d.recommendedPower)} • ${d.resin} Resin • ${p.clears} clears`,15,'m');y+=92;}fg+=text(620,285,'Choose a Domain from the selector below.',26,'m');return composeCard(W,H,bg,images,fg);}
  const progress=player.domainProgress?.[domain.id]||{clears:0,quickClears:0,fastestTurns:null};
  const quickThreshold=Math.ceil(domain.recommendedPower*1.12),quickReady=progress.clears>0&&power>=quickThreshold;
  fg+=text(105,215,domain.name,27,'b')+text(105,249,`Difficulty ${domain.level} • Recommended PWR ${fmt(domain.recommendedPower)}`,17,'m')+text(105,278,`Your PWR ${fmt(power)} • Resin ${player.resin}/160`,17,power>=domain.recommendedPower?'g':'m');
  let dy=325;for(const l of wrap(domain.description,42).slice(0,4)){fg+=text(105,dy,l,16,'m');dy+=23;}
  fg+=text(105,445,'PROGRESS',19,'b')+text(105,478,`Clears: ${progress.clears} • Quick clears: ${progress.quickClears||0}`,16,'m')+text(105,509,`Fastest battle: ${progress.fastestTurns==null?'—':`${progress.fastestTurns} turns`}`,16,'m')+text(105,540,quickReady?'Quick Clear: READY':progress.clears===0?'Quick Clear: clear once first':`Quick Clear: requires ${fmt(quickThreshold)} PWR`,16,quickReady?'g':'m');
  fg+=text(105,602,'REWARDS',19,'b')+text(105,635,`${fmt(domain.rewards.mora[0])}–${fmt(domain.rewards.mora[1])} Mora`,16,'m')+text(105,666,`${domain.rewards.primogems} Primogems • ${domain.rewards.adventureXp} XP`,16,'m')+text(105,697,progress.clears===0?`First clear bonus: +${domain.firstClearPrimogems||0} Primogems`:'First clear bonus claimed',16,progress.clears===0?'g':'m');
  fg+=text(105,755,'SETS',19,'b')+text(105,787,domain.setIds.map(id=>artifactSets[id]?.name||id).join(' • '),15,'m');
  fg+=text(620,205,'ENEMIES',24,'b'); const req=[],eW=240,eH=272,gap=26,sx=620,sy=235;
  for(let i=0;i<3;i++){const e=domain.enemies[i],x=sx+i*(eW+gap);bg+=frame(x,sy,eW,eH,20,e?T.red:T.panel3);if(e){req.push({url:e.image,w:178,h:178,left:x+31,top:sy+18,round:16});fg+=text(x+16,sy+221,shorten(e.name,19),18,'b')+text(x+16,sy+249,`${e.element} • ${fmt(e.hp)} HP`,14,'m');}else fg+=text(x+eW/2,sy+138,'—',24,'f','middle');}
  images.push(...await batch(req));
  fg+=text(620,565,'YOUR TEAM',24,'b');const team=session.team||[];for(let i=0;i<4;i++){const id=team[i],x=620+i*190;bg+=frame(x,595,166,195,18,id?rarityColor(characters[id].rarity):T.panel3);if(id){const im=await remote(characters[id].icon,118,118,'contain',14);if(im)images.push({input:im,left:x+24,top:608});fg+=text(x+12,755,shorten(characters[id].name,13),16,'b')+text(x+12,778,`Lv.${player.characters[id].level}`,13,'m');}else fg+=text(x+83,690,'EMPTY',14,'f','middle');}
  if(session.lastDomainReward){const r=session.lastDomainReward;fg+=text(620,830,`Latest: +${fmt(r.mora)} Mora • +${r.primogems} Primogems • ${r.set?.name||'Artifact'}`,16,'g');}
  return composeCard(W,H,bg,images,fg);
}

export async function renderCpuCard(player,session){
  const W=1500,H=790;let bg=scene(W,H,T.red)+rect(78,90,410,610,24,T.panel2,T.red,2)+rect(525,90,900,610,24,T.panel2,T.panel3,2),fg=titleBlock('CPU ARENA','Build a four-character team, then start the battle'),images=[];
  fg+=text(110,220,'Neverless Automaton',26,'b')+text(110,255,'PvP-engine test opponent',17,'m')+text(110,315,'Enemy lineup',18,'b');const enemy=['xiangling','bennett','fischl','noelle'];let ey=355;for(const id of enemy){fg+=text(130,ey,characters[id].name,18,'t');ey+=41;}
  fg+=text(560,210,'YOUR TEAM',24,'b');const team=session.team||[];for(let i=0;i<4;i++){const id=team[i],x=560+i*205;bg+=frame(x,245,180,260,18,id?rarityColor(characters[id].rarity):T.panel3);if(id){const im=await remote(characters[id].icon,135,135,'contain',14);if(im)images.push({input:im,left:x+22,top:263});fg+=text(x+14,432,shorten(characters[id].name,14),17,'b')+text(x+14,460,`Lv.${player.characters[id].level}`,14,'m')+text(x+14,486,`PWR ${fmt(characterPower(player,id))}`,13,'m');}else fg+=text(x+90,375,'EMPTY',14,'f','middle');}
  fg+=text(560,570,'SPD initiative • Normal / Skill / Burst • healing • shields • buffs • debuffs',16,'m');
  return composeCard(W,H,bg,images,fg);
}

export async function renderBattleCard(battle,pendingAction=null){
  const W=1500,H=980,actor=currentActor(battle);let bg=scene(W,H,battle.winner?(battle.winner==='player'?T.green:T.red):T.purple),fg=titleBlock(battle.winner?(battle.winner==='player'?'VICTORY':'DEFEAT'):(battle.mode==='cpu'?'CPU ARENA':'DOMAIN BATTLE'),battle.winner?'Battle complete':`Turn ${battle.turn+1} • Acting: ${actor?.name||'—'} • ${actor?.element||''}`),images=[];
  const side=(side,title,x,accent)=>{let out=text(x,205,title,23,'b');const arr=battle.actors.filter(a=>a.side===side);arr.forEach((a,i)=>{const y=235+i*142;bg+=frame(x,y,620,122,18,a.uid===actor?.uid?T.gold:accent);bg+=bar(x+128,y+79,440,16,a.hp/a.maxHp,side==='player'?T.green:T.red);out+=text(x+128,y+35,a.name,19,'b')+text(x+128,y+62,`${fmt(a.hp)} / ${fmt(a.maxHp)} HP • ${a.energy} Energy • SPD ${a.spd}`,14,'m');if(a.shield>0)out+=text(x+500,y+34,`Shield ${fmt(a.shield)}`,13,'g','end');});return out;};
  fg+=side('player','YOUR TEAM',80,T.purple)+side('enemy','OPPONENT',800,T.red);
  const req=[];for(const [s,x] of [['player',80],['enemy',800]]){const arr=battle.actors.filter(a=>a.side===s);for(let i=0;i<arr.length;i++)req.push({url:arr[i].icon||arr[i].image,w:94,h:94,left:x+18,top:249+i*142,round:14});}images.push(...await batch(req));
  fg+=line(80,827,1420,827,T.panel3,2)+text(80,866,pendingAction&&actor?`Choose target for ${actor.skills[pendingAction]?.name||pendingAction}`:actor?`${actor.skills.normal.name} • ${actor.skills.skill.name} • ${actor.skills.burst.name}`:'Battle ended',20,'b');
  const logs=battle.log.slice(0,3);let ly=898;for(const l of logs){fg+=text(80,ly,shorten(l,112),15,'m');ly+=23;}
  return composeCard(W,H,bg,images,fg);
}

export async function renderArtifactsCard(player){
  const W=1500,H=940,arts=Object.values(player.artifacts).slice(0,15);let bg=scene(W,H,T.gold),fg=titleBlock('ARTIFACTS',`${Object.keys(player.artifacts).length} owned • equip from a character page`),images=[],req=[];
  const cols=5,sw=250,sh=220,gap=24,sx=82,sy=190;
  for(let i=0;i<15;i++){const a=arts[i],x=sx+(i%cols)*(sw+gap),y=sy+Math.floor(i/cols)*(sh+gap);bg+=frame(x,y,sw,sh,18,a?rarityColor(a.rarity):T.panel3);if(a){const set=artifactSets[a.setId];req.push({url:set?.image,w:94,h:94,left:x+15,top:y+15,round:10});fg+=text(x+124,y+43,a.slot,18,'b')+text(x+124,y+70,`+${a.level} • ${a.rarity}★`,14,'m')+text(x+16,y+132,shorten(set?.name||a.setId,24),16,'b')+text(x+16,y+161,`${a.main.key}: ${typeof a.main.value==='number'&&a.main.value<1?pct(a.main.value):Math.round(a.main.value)}`,14,'m')+text(x+16,y+191,a.equippedTo?`Equipped: ${characters[a.equippedTo]?.name||a.equippedTo}`:'Unequipped',13,'m');}}
  images.push(...await batch(req));return composeCard(W,H,bg,images,fg);
}

export async function renderUpgradesCard(player){
  const W=1500,H=730;let bg=scene(W,H,T.purple),fg=titleBlock('PASSIVE DEVELOPMENT','Permanent account upgrades. Costs rise each level and PvP caps keep scaling controlled.'),images=[];
  const mora=await remote(MORA_ICON,46,46);if(mora)images.push({input:mora,left:1195,top:86});fg+=text(1252,120,fmt(player.mora),24,'b');
  const stats=[['ATK',player.passive.atk,20],['HP',player.passive.hp,20],['CRIT Rate',player.passive.critRate,15],['CRIT DMG',player.passive.critDmg,15],['SPD',player.passive.spd,20]];
  stats.forEach((s,i)=>{const x=82+i*274,y=215;bg+=frame(x,y,240,360,20,T.purple);fg+=text(x+120,y+65,s[0],23,'b','middle')+text(x+120,y+112,`Lv.${s[1]} / ${s[2]}`,19,'m','middle')+bar(x+30,y+160,180,16,s[1]/s[2],T.purple)+text(x+120,y+225,`Next cost`,15,'m','middle')+text(x+120,y+259,fmt(5000+s[1]*2500),20,'b','middle')+text(x+120,y+292,'Mora',14,'m','middle');});
  fg+=text(82,650,'Every passive level affects all owned characters and contributes to account PWR.',17,'m');return composeCard(W,H,bg,images,fg);
}

export async function renderViewCard(view,player,session,user){
  if(session.battle) return {name:'neverless-battle.png',buffer:await renderBattleCard(session.battle,session.pendingAction)};
  if(view==='wish') return {name:'neverless-wish.png',buffer:await renderWishCard(player,session.banner,session.lastWish)};
  if(view==='domains') return {name:'neverless-domain.png',buffer:await renderDomainCard(player,session)};
  if(view==='cpu') return {name:'neverless-cpu.png',buffer:await renderCpuCard(player,session)};
  if(view==='characters') return {name:'neverless-characters.png',buffer:session.selectedChar?await renderCharacterCard(player,session.selectedChar):await renderRosterCard(player)};
  if(view==='weaponEquip'||view==='artifactEquip') return {name:'neverless-character.png',buffer:await renderCharacterCard(player,session.selectedChar)};
  if(view==='inventory') return {name:'neverless-inventory.png',buffer:await renderInventoryCard(player)};
  if(view==='artifacts') return {name:'neverless-artifacts.png',buffer:await renderArtifactsCard(player)};
  if(view==='upgrades') return {name:'neverless-upgrades.png',buffer:await renderUpgradesCard(player)};
  return {name:'neverless-profile.png',buffer:await renderHomeCard(player,user)};
}

import sharp from 'sharp';
import { characters } from '../data/characters.js';
import { weapons } from '../data/weapons.js';
import { artifactSets, artifactSlots } from '../data/artifacts.js';
import { domains } from '../data/domains.js';
import { buildCharacterStats, calculatePlayerPower, characterPower, playerLevelInfo } from '../game/stats.js';
import { currentActor } from '../game/battle.js';

sharp.cache({ memory: 128, items: 300, files: 0 });
sharp.concurrency(4);

const C={bg:'#070a12',panel:'#101725',panel2:'#172033',line:'#31405f',purple:'#866be8',gold:'#e1bd62',text:'#f7f5ff',muted:'#9ba8c3',green:'#50d29b',red:'#ef6a78',blue:'#63a9ed',cyan:'#67d5d1',pink:'#ef75ac'};
const rawCache=new Map(), imgCache=new Map();

const GLYPHS={
' ':[0,0,0,0,0,0,0],A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[30,17,17,17,17,17,30],E:[31,16,16,30,16,16,31],F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,15],H:[17,17,17,31,17,17,17],I:[31,4,4,4,4,4,31],J:[7,2,2,2,18,18,12],K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],M:[17,27,21,21,17,17,17],N:[17,25,21,19,17,17,17],O:[14,17,17,17,17,17,14],P:[30,17,17,30,16,16,16],Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],Y:[17,17,10,4,4,4,4],Z:[31,1,2,4,8,16,31],
'0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],'2':[14,17,1,2,4,8,31],'3':[30,1,1,14,1,1,30],'4':[2,6,10,18,31,2,2],'5':[31,16,16,30,1,1,30],'6':[14,16,16,30,17,17,14],'7':[31,1,2,4,8,8,8],'8':[14,17,17,14,17,17,14],'9':[14,17,17,15,1,1,14],
'-':[0,0,0,31,0,0,0],'.':[0,0,0,0,0,12,12],':':[0,12,12,0,12,12,0],'/':[1,2,2,4,8,8,16],'+':[0,4,4,31,4,4,0],'%':[17,2,4,8,16,17,0],"'":[4,4,2,0,0,0,0],'!':[4,4,4,4,4,0,4],'?':[14,17,1,2,4,0,4],'(':[2,4,8,8,8,4,2],')':[8,4,2,2,2,4,8],',':[0,0,0,0,0,4,8],'=':[0,31,0,31,0,0,0]
};
const safe=(s='')=>String(s).normalize('NFKD').replace(/[^A-Za-z0-9 .:/+%!?(),='-]/g,'').toUpperCase();
const cut=(s,n)=>{s=safe(s); return s.length>n?`${s.slice(0,n-1)}…`:s;};
function ptext(x,y,value,scale=4,color=C.text,spacing=1,anchor='start'){
 const s=safe(value); const cell=5*scale+spacing*scale; const width=Math.max(0,s.length*cell-spacing*scale); let ox=anchor==='middle'?x-width/2:anchor==='end'?x-width:x; let out='';
 for(const ch of s){const g=GLYPHS[ch]||GLYPHS['?']; for(let r=0;r<7;r++){for(let c=0;c<5;c++){if(g[r]&(1<<(4-c)))out+=`<rect x="${ox+c*scale}" y="${y+r*scale}" width="${scale}" height="${scale}" rx="${Math.max(0,scale*.12)}" fill="${color}"/>`;}} ox+=cell;} return out;
}
const rect=(x,y,w,h,r,fill,stroke='none',sw=1,op=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line=(x1,y1,x2,y2,color,sw=1,op=1)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" opacity="${op}"/>`;
const rarity=(r)=>r>=5?C.gold:r===4?C.purple:C.blue;
const fmt=(n)=>Number(n||0).toLocaleString('en-US');
const bar=(x,y,w,h,ratio,color)=>rect(x,y,w,h,h/2,'#253149')+rect(x,y,w*Math.max(0,Math.min(1,ratio)),h,h/2,color);
const panel=(x,y,w,h,accent=C.line)=>rect(x,y,w,h,18,C.panel,accent,2,.95);
const statLine=(x,y,label,value,c=C.text)=>ptext(x,y,label,2,C.muted)+ptext(x+160,y,value,2,c);

function bg(w,h,accent=C.purple){
  const houses=[
    [160,h*0.73,66,58],[250,h*0.74,52,44],[340,h*0.72,74,62],[470,h*0.75,58,46],
    [980,h*0.73,66,56],[1080,h*0.74,54,42],[1180,h*0.71,72,60],[1285,h*0.75,58,46],
  ];
  const roofs=houses.map(([x,y,bw,bh])=>`<path d="M${x} ${y} L${x+bw/2} ${y-bh*.55} L${x+bw} ${y}" fill="#44345c" stroke="#8f79d3" stroke-opacity=".25"/>`).join('');
  const bodies=houses.map(([x,y,bw,bh])=>`${rect(x,y,bw,bh,6,'#131a2a','#2f4164',1,.9)}${rect(x+bw*.22,y+bh*.3,10,12,2,'#ffd78d','none',1,.85)}${rect(x+bw*.55,y+bh*.3,10,12,2,'#ffd78d','none',1,.85)}`).join('');
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#09101f"/><stop offset=".45" stop-color="#11182e"/><stop offset="1" stop-color="#090c14"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${accent}" stop-opacity=".28"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cc2ff" stop-opacity=".08"/><stop offset="1" stop-color="#6cc2ff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <circle cx="${w*.82}" cy="${h*.16}" r="340" fill="url(#glow)"/>
  <circle cx="${w*.18}" cy="${h*.16}" r="68" fill="#f2dfb2" opacity=".14"/>
  <circle cx="${w*.20}" cy="${h*.145}" r="68" fill="#09101f"/>
  <g fill="#d8e1ff" opacity=".45">${[[90,105],[190,72],[315,120],[512,86],[720,112],[965,70],[1165,128],[1288,86],[1080,186],[430,190],[840,164]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="2"/>`).join('')}</g>
  <path d="M0 ${h*.60} L135 ${h*.45} L280 ${h*.60} L470 ${h*.38} L690 ${h*.63} L860 ${h*.44} L1045 ${h*.60} L1210 ${h*.40} L1400 ${h*.62} V${h}H0Z" fill="#0b1020" opacity=".95"/>
  <path d="M0 ${h*.70} Q210 ${h*.58} 400 ${h*.72} T810 ${h*.67} T1400 ${h*.73} V${h}H0Z" fill="#0d1320"/>
  <path d="M0 ${h*.76} Q260 ${h*.73} 510 ${h*.78} T1000 ${h*.77} T1400 ${h*.79} V${h}H0Z" fill="url(#fog)"/>
  ${roofs}${bodies}
  ${rect(28,28,w-56,h-56,28,'#0b1020',accent,2,.64)}${rect(42,42,w-84,h-84,22,'none',C.gold,1,.25)}`;
}
function svg(w,h,body){return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);}
async function raw(url){if(!url)return null;if(rawCache.has(url))return rawCache.get(url);const p=(async()=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(2200)});if(!r.ok)return null;return Buffer.from(await r.arrayBuffer());}catch{return null;}})();rawCache.set(url,p);return p;}
async function remote(url,w,h,fit='contain',round=0){if(!url)return null;const k=`${url}|${w}|${h}|${fit}|${round}`;if(imgCache.has(k))return imgCache.get(k);const p=(async()=>{const s=await raw(url);if(!s)return null;try{let q=sharp(s).resize(w,h,{fit,position:'centre'}).png({compressionLevel:3});if(round){q=q.composite([{input:Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${round}" fill="white"/></svg>`),blend:'dest-in'}]);}return q.toBuffer();}catch{return null;}})();imgCache.set(k,p);return p;}
async function compose(w,h,back,imgs,front){const layers=[{input:svg(w,h,back),left:0,top:0},...imgs.filter(i=>i?.input).map(i=>({input:i.input,left:i.left,top:i.top})),{input:svg(w,h,front),left:0,top:0}];return sharp({create:{width:w,height:h,channels:4,background:C.bg}}).composite(layers).png({compressionLevel:4}).toBuffer();}
async function entityTile(url,x,y,w,h,label,accent=C.line){
  const img=await remote(url,w-20,h-38,'contain',12);
  let body=panel(x,y,w,h,accent);
  if(!img){body+=rect(x+10,y+10,w-20,h-38,12,'#162136',accent,1,.75)+ptext(x+w/2,y+h/2-20,cut(label,10),2,C.muted,1,'middle');}
  body+=ptext(x+w/2,y+h-30,cut(label,12),2,C.text,1,'middle');
  return { body, image: img ? {input:img,left:x+10,top:y+10} : null };
}
function drawIcon(kind,x,y,s=26){
  if(kind==='mora') return `<circle cx="${x+s/2}" cy="${y+s/2}" r="${s/2}" fill="#d6a13f" stroke="#f5d382" stroke-width="2"/><circle cx="${x+s/2}" cy="${y+s/2}" r="${s/2-6}" fill="#f5d382" opacity=".55"/>`;
  if(kind==='primo') return `<path d="M${x+s/2} ${y} L${x+s*.72} ${y+s*.28} L${x+s} ${y+s/2} L${x+s*.72} ${y+s*.72} L${x+s/2} ${y+s} L${x+s*.28} ${y+s*.72} L${x} ${y+s/2} L${x+s*.28} ${y+s*.28}Z" fill="#8ad4ff" stroke="#dff7ff" stroke-width="2"/>`;
  if(kind==='resin') return `<path d="M${x+s*.5} ${y+3} C${x+s*.18} ${y+s*.18}, ${x+s*.12} ${y+s*.64}, ${x+s*.5} ${y+s*.94} C${x+s*.88} ${y+s*.64}, ${x+s*.82} ${y+s*.18}, ${x+s*.5} ${y+3}Z" fill="#7de5d6" stroke="#d7fff8" stroke-width="2"/>`;
  if(kind==='book') return `${rect(x+2,y+3,s-4,s-6,5,'#4c72e2','#c0d6ff',2,.95)}${line(x+s*.5,y+5,x+s*.5,y+s-5,'#c0d6ff',2)}${rect(x+7,y+8,s-14,4,2,'#dfe7ff','none',1,.65)}${rect(x+7,y+16,s-18,4,2,'#dfe7ff','none',1,.35)}`;
  return rect(x,y,s,s,6,C.blue);
}
function metricBox(x,y,w,label,value,icon){return panel(x,y,w,56,C.line)+drawIcon(icon,x+12,y+14,28)+ptext(x+52,y+12,label,2,C.muted)+ptext(x+52,y+30,value,2,C.text);}
function titleMain(main,sub=''){return ptext(70,70,main,6,C.text)+(sub?ptext(70,118,sub,3,C.muted):'');}

async function renderHomeCard(player,meta){
  const W=1400,H=920,lvl=playerLevelInfo(player),power=calculatePlayerPower(player),owned=Object.keys(player.characters||{});
  const ids=[...(player.showcase||[]).filter(id=>player.characters[id]),...owned.filter(id=>!(player.showcase||[]).includes(id)).sort((a,b)=>characterPower(player,b)-characterPower(player,a))].slice(0,8);
  let back=bg(W,H),front=titleMain('NEVERLESS ADVENTURE','TRAVELER PROFILE'),imgs=[];
  back+=panel(70,165,300,670,C.gold)+panel(400,165,930,670,C.purple);
  back+=metricBox(86,515,268,'POWER',fmt(power),'primo')+metricBox(86,585,268,'RESIN',`${player.resin||0}/${player.resinMax||180}`,'resin');
  back+=metricBox(86,655,126,'PRIMO',fmt(player.primogems||0),'primo')+metricBox(228,655,142,'MORA',fmt(player.mora||0),'mora');
  const avatar=meta?.avatarUrl?await remote(meta.avatarUrl,118,118,'cover',59):null; if(avatar) imgs.push({input:avatar,left:161,top:215}); else back+=rect(161,215,118,118,59,'#131a2a',C.gold,2,.9);
  back+=`<circle cx="220" cy="274" r="64" fill="none" stroke="${C.gold}" stroke-width="4" opacity=".9"/>`;
  front+=ptext(95,355,cut(meta?.username||player.username||'Traveler',12),5,C.text)+ptext(95,405,`LEVEL ${lvl.level}/${lvl.maxLevel}`,3,C.text)+bar(96,445,240,16,lvl.progress,C.blue)+ptext(95,474,`${Math.round(lvl.currentXp)}/${Math.round(lvl.nextNeed||lvl.currentXp)} XP`,2,C.muted);
  front+=ptext(420,186,'SHOWCASE',4,C.text);
  const sx=420,sy=220,sw=168,sh=240,gx=14,gy=16;
  for(let i=0;i<8;i++){
    const x=sx+(i%4)*(sw+gx),y=sy+Math.floor(i/4)*(sh+gy),id=ids[i];
    back+=panel(x,y,sw,sh,id?rarity(characters[id].rarity):C.line);
    if(id){
      const d=characters[id],o=player.characters[id];
      const img=await remote(d.icon,120,120,'contain',14);
      if(img) imgs.push({input:img,left:x+24,top:y+12}); else back+=rect(x+24,y+12,120,120,14,'#162136',rarity(d.rarity),1,.8);
      front+=ptext(x+12,y+142,cut(d.name,12),2,C.text)+ptext(x+12,y+168,`LV ${o.level}`,2,C.muted)+ptext(x+12,y+192,`${safe(d.role)}`,2,rarity(d.rarity))+ptext(x+12,y+216,`PWR ${characterPower(player,id)}`,2,C.gold);
    }else{
      back+=rect(x+24,y+12,120,120,14,'#162136',C.line,1,.75);front+=ptext(x+sw/2,y+145,'EMPTY',2,C.muted,1,'middle');
    }
  }
  return compose(W,H,back,imgs,front);
}

async function renderWishCard(player,banner='character',results=[]){
  const W=1400,H=900; let back=bg(W,H,banner==='character'?C.purple:C.gold),front=titleMain(banner==='character'?'CHARACTER WISH':'WEAPON WISH',`PRIMOGEMS ${fmt(player.primogems)} - 1 PULL 160 - 10 PULLS 1600`),imgs=[];
  back+=panel(70,170,1260,570,banner==='character'?C.purple:C.gold);
  const shown=results.slice(0,10),sx=95,sy=210,sw=112,sh=210,g=16;
  for(let i=0;i<10;i++){
    const x=sx+(i%5)*(sw+g),y=sy+Math.floor(i/5)*(sh+g),item=shown[i];
    const accent=item?rarity(item.rarity):C.line;
    back+=panel(x,y,sw,sh,accent);
    if(item){
      const imgUrl=item.kind==='character'?characters[item.id]?.icon:weapons[item.id]?.image;
      const img=await remote(imgUrl,76,76,'contain',10); if(img) imgs.push({input:img,left:x+18,top:y+18});
      const itemName=item.kind==='character'?characters[item.id]?.name:weapons[item.id]?.name;
      front+=ptext(x+10,y+108,cut(itemName||item.id,14),2,C.text)+ptext(x+10,y+132,item.duplicate?'DUPLICATE':'NEW',2,item.duplicate?C.muted:C.gold)+ptext(x+10,y+156,`${item.rarity} STAR`,2,accent);
    }
  }
  return compose(W,H,back,imgs,front);
}

async function renderDomainsCard(player,session={}){
  const W=1400,H=900,d=session.domainId?domains[session.domainId]:null;let back=bg(W,H,C.cyan),front=titleMain('DOMAINS','SELECT A DOMAIN, BUILD A TEAM, FARM REWARDS'),imgs=[];
  back+=panel(70,170,420,630,C.cyan)+panel(520,170,810,630,C.pink);
  front+=ptext(95,200,'CHOOSE A DOMAIN',4,C.text);
  const list=Object.values(domains); let yy=248;
  for(const dom of list){
    const active=d?.id===dom.id; const col=active?C.gold:C.text;
    front+=ptext(95,yy,cut(dom.name,22),2,col)+ptext(95,yy+22,`LV ${dom.level} - ${dom.resin} RESIN - PWR ${dom.recommendedPower}`,2,C.muted);
    yy+=62;
  }
  if(d){
    front+=ptext(545,200,cut(d.name,24),4,C.text)+ptext(545,246,cut(d.description,50),2,C.muted)+ptext(545,274,`REWARDS: ${safe(d.rewardType)} - MORA - BOOKS - ARTIFACTS`,2,C.gold);
    const prog=player.domainProgress?.[d.id]||{clears:0};
    front+=ptext(545,306,`CLEARS ${prog.clears||0}${prog.fastestTurns?` - FASTEST ${prog.fastestTurns} TURNS`:''}`,2,C.muted);
    const tiles=[];
    const ex=560,ey=350,tw=210,th=180,gg=20;
    for(let i=0;i<4;i++){
      const enemy=d.enemies[i];
      if(enemy){ const t=await entityTile(enemy.image,ex+(i%2)*(tw+gg),ey+Math.floor(i/2)*(th+gg),tw,th,enemy.name,C.pink); tiles.push(t); }
      else back+=panel(ex+(i%2)*(tw+gg),ey+Math.floor(i/2)*(th+gg),tw,th,C.line);
    }
    for(const t of tiles){ back+=t.body; if(t.image) imgs.push(t.image); }
    back+=metricBox(545,690,150,'RESIN',String(d.resin),'resin')+metricBox(710,690,180,'MORA',`${fmt(d.rewards.mora[0])}+`,'mora')+metricBox(905,690,180,'LEVEL BOOK',`${d.rewards.levelBooks[0]}-${d.rewards.levelBooks[1]}`,'book')+metricBox(1100,690,180,'TALENT BOOK',`${d.rewards.talentBooks[0]}-${d.rewards.talentBooks[1]}`,'book');
  }else{
    front+=ptext(700,330,'SELECT A DOMAIN TO SEE ENEMIES',3,C.text,1,'middle');
  }
  return compose(W,H,back,imgs,front);
}

async function renderBattleCard(battle,pendingAction=null){
  const W=1400,H=900;let back=bg(W,H,battle.winner==='player'?C.gold:C.red),front='',imgs=[];
  const players=battle.actors.filter(a=>a.side==='player'); const enemies=battle.actors.filter(a=>a.side==='enemy'); const ev=battle.lastEvent;
  const heading=battle.winner?battle.winner==='player'?'VICTORY':'DEFEAT':`TURN ${battle.turn+1}`;
  const sub=battle.winner? 'BATTLE COMPLETE' : `${currentActor(battle)?.name || 'WAITING'} - ${pendingAction ? pendingAction.toUpperCase() : 'CHOOSE SKILL'}`;
  front+=titleMain(heading,sub);
  back+=panel(70,170,600,650,C.green)+panel(730,170,600,650,C.red);
  front+=ptext(95,200,'YOUR TEAM',4,C.green)+ptext(755,200,'ENEMIES',4,C.red);
  const renderActorRow=async (a,x,y,w,enemy=false)=>{
    const active=ev?.targetUid===a.uid; const accent=active?(enemy?C.red:C.green):enemy?C.pink:C.cyan;
    back+=panel(x,y,w,110,accent);
    const img=await remote(a.icon||a.image,72,72,'contain',10); if(img) imgs.push({input:img,left:x+10+(active && enemy?8:0),top:y+18});
    front+=ptext(x+96,y+16,cut(a.name,15),2,C.text)+ptext(x+96,y+38,`${safe(a.role||'ENEMY')} - SPD ${Math.round(a.spd)}`,2,C.muted)+ptext(x+96,y+60,`HP ${Math.round(a.hp)}/${Math.round(a.maxHp)}`,2,C.text);
    if(!enemy) front+=ptext(x+96,y+82,`EN ${Math.round(a.energy||0)}${a.shield?` - SH ${Math.round(a.shield)}`:''}`,2,C.gold);
    else front+=ptext(x+96,y+82,`EN ${Math.round(a.energy||0)}`,2,C.muted);
    back+=bar(x+96,y+88,w-116,10,a.hp/a.maxHp,enemy?C.red:C.green);
    if(a.hp<=0) front+=ptext(x+12,y+86,'DOWN',2,C.red);
  };
  let py=235; for(const a of players){ await renderActorRow(a,95,py,550,false); py+=122; }
  let ey=235; for(const a of enemies){ await renderActorRow(a,755,ey,550,true); ey+=122; }
  if(ev){
    const tag=ev.damage?`@${safe(ev.targetName)} - ${ev.damage} DMG${ev.crit?' CRIT':''}`:ev.healed?`${safe(ev.actorName)} +${ev.healed} HEAL`:safe(ev.skillName);
    front+=ptext(700,760,tag,3,ev.damage?C.red:C.green,1,'middle');
    front+=ptext(700,792,cut(ev.skillName,30),2,C.gold,1,'middle');
  }
  if(battle.winner && battle.rewards){
    back+=panel(300,645,800,130,battle.winner==='player'?C.gold:C.red);
    front+=ptext(700,668,'REWARDS',4,C.text,1,'middle');
    let rx=365; const items=[];
    items.push(['mora',`+${fmt(battle.rewards.mora)}`]);
    if((battle.rewards.artifactSummary||[]).length) items.push(['book',`+${battle.rewards.artifactSummary.length}X ARTIFACT`]);
    items.push(['book',`+${battle.rewards.levelBooks||0}X LEVEL BOOK`]);
    if(battle.rewards.talentBooks) items.push(['book',`+${battle.rewards.talentBooks}X TALENT BOOK`]);
    for(const [kind,text] of items){back+=rect(rx,704,170,46,12,'#162136',battle.winner==='player'?C.gold:C.red,1,.92)+drawIcon(kind,rx+10,714,24);front+=ptext(rx+42,719,text,2,C.text);rx+=185;}
  }else if(battle.log?.length){
    front+=ptext(700,822,cut(battle.log[0],52),2,C.muted,1,'middle');
  }
  return compose(W,H,back,imgs,front);
}

async function renderRosterCard(player){
  const W=1400,H=900,ids=Object.keys(player.characters);let back=bg(W,H),front=titleMain('CHARACTERS','INSPECT, UPGRADE, EQUIP, AND SET SHOWCASE'),imgs=[];const sx=70,sy=170,sw=245,sh=210,g=22;
  for(let i=0;i<15;i++){const x=sx+(i%5)*(sw+g),y=sy+Math.floor(i/5)*(sh+g),id=ids[i];back+=panel(x,y,sw,sh,id?rarity(characters[id].rarity):C.line);if(id){const d=characters[id],o=player.characters[id];const img=await remote(d.icon,120,120,'contain',12); if(img) imgs.push({input:img,left:x+62,top:y+8});front+=ptext(x+12,y+142,cut(d.name,18),2,C.text)+ptext(x+12,y+166,`LV ${o.level} - ${safe(d.role)}`,2,C.muted)+ptext(x+12,y+190,`PWR ${characterPower(player,id)}`,2,C.gold);}}
  return compose(W,H,back,imgs,front);
}

async function renderCharacterCard(player,id){
  const b=buildCharacterStats(player,id),W=1400,H=900;if(!b)return renderRosterCard(player);let back=bg(W,H,rarity(b.definition.rarity)),front=titleMain(cut(b.definition.name,22),`${safe(b.definition.element)} - ${safe(b.definition.role)} - ${safe(b.definition.weaponType)}`),imgs=[];
  back+=panel(70,165,380,640,rarity(b.definition.rarity))+panel(480,165,850,640,C.purple);
  const portrait=await remote(b.definition.image,330,560,'contain',18); if(portrait) imgs.push({input:portrait,left:95,top:200});
  front+=ptext(510,198,`LEVEL ${b.owned.level} - C${b.owned.constellation} - PWR ${characterPower(player,id)}`,3,C.gold);
  const ownedArts=(b.owned.artifactIds||[]).map(aid=>player.artifacts[aid]).filter(Boolean);
  const artMap=Object.fromEntries(ownedArts.map(a=>[a.slot,a]));
  const ax=510, ay=235, aw=100, ah=100, ag=14;
  for(let i=0;i<5;i++){
    const slot=artifactSlots[i]; const art=artMap[slot]; const x=ax+i*(aw+ag); back+=panel(x,ay,aw,ah,art?rarity(art.rarity):C.line);
    front+=ptext(x+aw/2,ay+72,slot,2,art?C.gold:C.muted,1,'middle');
    if(art){front+=ptext(x+aw/2,ay+18,`${art.rarity} STAR`,2,C.text,1,'middle');front+=ptext(x+aw/2,ay+42,cut(art.main.key,10),2,C.muted,1,'middle');}
    else front+=ptext(x+aw/2,ay+38,'EMPTY',2,C.muted,1,'middle');
  }
  const weapon=b.owned.weaponId?weapons[b.owned.weaponId]:null;
  back+=panel(1088,235,210,100,weapon?rarity(weapon.rarity):C.line);
  if(weapon){const wimg=await remote(weapon.image,62,62,'contain',10); if(wimg) imgs.push({input:wimg,left:1102,top:253}); front+=ptext(1172,252,cut(weapon.name,12),2,C.text)+ptext(1172,278,`${weapon.rarity} STAR - ATK ${weapon.atk}`,2,C.muted)+ptext(1172,302,`${safe(weapon.type)}`,2,C.gold);} else front+=ptext(1193,273,'NO WEAPON',2,C.muted,1,'middle');
  front+=statLine(520,372,'HP',fmt(b.stats.hp))+statLine(520,404,'ATK',fmt(b.stats.atk))+statLine(520,436,'DEF',fmt(b.stats.def))+statLine(520,468,'SPD',String(Math.round(b.stats.spd)))+statLine(520,500,'CRIT',`${Math.round(b.stats.critRate*100)}%`)+statLine(520,532,'CRIT DMG',`${Math.round(b.stats.critDmg*100)}%`);
  front+=ptext(520,580,'ROLE VALUE',3,C.gold)+ptext(520,618,b.definition.role==='DPS'?'HIGHER DAMAGE AND FASTER CLEARS':b.definition.role==='Support'?'BETTER HEALING, BUFFS AND ENERGY':'SHIELDS, TAUNT, AND SURVIVABILITY',2,C.muted);
  front+=ptext(520,665,'SKILLS',3,C.gold)+ptext(520,703,cut(b.definition.skills.normal.name,28),2,C.text)+ptext(520,731,cut(b.definition.skills.skill.name,28),2,C.text)+ptext(520,759,cut(b.definition.skills.burst.name,28),2,C.text);
  return compose(W,H,back,imgs,front);
}

async function renderInventoryCard(player){
  const W=1400,H=900; let back=bg(W,H),front=titleMain('INVENTORY','RESOURCES, BOOKS, WEAPONS, AND SAVED COLLECTION'),imgs=[];
  back+=panel(70,170,1260,650,C.purple);
  back+=metricBox(110,220,220,'PRIMOGEMS',fmt(player.primogems),'primo')+metricBox(350,220,220,'MORA',fmt(player.mora),'mora')+metricBox(590,220,220,'RESIN',`${player.resin}/${player.resinMax||180}`,'resin')+metricBox(830,220,220,'LEVEL BOOKS',fmt(player.books?.level||0),'book')+metricBox(1070,220,220,'TALENT BOOKS',fmt(player.books?.talent||0),'book');
  back+=panel(110,320,560,420,C.cyan)+panel(700,320,590,420,C.gold);
  front+=ptext(135,348,'WEAPONS',3,C.text)+ptext(725,348,'COLLECTION',3,C.text);
  let wy=388; for(const wid of Object.keys(player.weapons).slice(0,8)){const w=weapons[wid], owned=player.weapons[wid]; front+=ptext(135,wy,cut(w.name,20),2,C.text)+ptext(430,wy,`R${owned.refinement} LV ${owned.level}`,2,C.gold); wy+=34;}
  const lines=[`CHARACTERS ${Object.keys(player.characters).length}`,`WEAPONS ${Object.keys(player.weapons).length}`,`ARTIFACTS ${Object.keys(player.artifacts).length}`,`WISH HISTORY ${(player.history?.wishes||[]).length}`,`BATTLES ${(player.history?.battles||[]).length}`,`MMR ${player.pvp?.mmr||1000}`];
  let iy=388; for(const ln of lines){ front+=ptext(725,iy,ln,2,C.text); iy+=38; }
  return compose(W,H,back,imgs,front);
}

async function renderArtifactsCard(player){
  const W=1400,H=900; let back=bg(W,H,C.gold),front=titleMain('ARTIFACTS','EQUIP PIECES TO RAISE POWER AND CLEAR DOMAINS FASTER'),imgs=[];
  back+=panel(70,170,1260,650,C.gold); let y=220; const items=Object.values(player.artifacts).slice(0,14);
  for(const art of items){const set=artifactSets[art.setId];front+=ptext(105,y,`${cut(set?.name||art.setId,22)} - ${safe(art.slot)} +${art.level} - ${art.rarity} STAR`,2,C.text)+ptext(840,y,cut(`${art.main.key}`,18),2,C.muted); y+=34;}
  return compose(W,H,back,imgs,front);
}

async function renderUpgradesCard(player){
  const W=1400,H=860; let back=bg(W,H,C.cyan),front=titleMain('PERMANENT UPGRADES','SPEND MORA TO IMPROVE YOUR ENTIRE ACCOUNT'),imgs=[];
  back+=panel(130,190,1140,540,C.cyan);
  const entries=[['ATK',player.passive?.atk||0],['HP',player.passive?.hp||0],['CRIT RATE',player.passive?.critRate||0],['CRIT DMG',player.passive?.critDmg||0],['SPD',player.passive?.spd||0]];
  let y=255; for(const [k,v] of entries){back+=rect(180,y-12,1040,52,12,'#162136',C.line,1,.92);front+=ptext(210,y,k,3,C.text)+ptext(1080,y,`LV ${v}`,3,C.gold,1,'end'); y+=85;}
  return compose(W,H,back,imgs,front);
}

export async function renderViewCard(view,player,session={},meta={}){
  let buffer,name;
  if(session?.battle||view==='battle'){buffer=await renderBattleCard(session.battle,session.pendingAction);name='neverless-battle.png';}
  else if(view==='wish'){buffer=await renderWishCard(player,session.banner,session.lastWish||[]);name='neverless-wish.png';}
  else if(view==='domains'){buffer=await renderDomainsCard(player,session);name='neverless-domains.png';}
  else if(view==='characters' || view==='weaponEquip' || view==='artifactEquip'){buffer=session.selectedChar?await renderCharacterCard(player,session.selectedChar):await renderRosterCard(player);name='neverless-characters.png';}
  else if(view==='inventory'){buffer=await renderInventoryCard(player);name='neverless-inventory.png';}
  else if(view==='artifacts'){buffer=await renderArtifactsCard(player);name='neverless-artifacts.png';}
  else if(view==='upgrades'){buffer=await renderUpgradesCard(player);name='neverless-upgrades.png';}
  else {buffer=await renderHomeCard(player,meta);name='neverless-profile.png';}
  return { buffer, name };
}

export { renderHomeCard, renderWishCard, renderDomainsCard, renderBattleCard, renderRosterCard, renderCharacterCard, renderInventoryCard, renderArtifactsCard, renderUpgradesCard };

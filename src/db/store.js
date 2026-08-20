import fs from 'node:fs';
import path from 'node:path';
import { DATA_FILE, STARTER } from '../config/constants.js';

function starterWeaponFor(characterId) {
  const map = {
    amber: 'slingshot',
    kaeya: 'harbinger-of-dawn',
    lisa: 'thrilling-tales-of-dragon-slayers',
    barbara: 'thrilling-tales-of-dragon-slayers',
  };
  return map[characterId] || null;
}

const defaultTalents = () => ({ normal: 1, skill: 1, burst: 1 });

function makePlayer(id, username = 'Traveler') {
  const ownedWeapons = {};
  for (const wid of STARTER.weapons) ownedWeapons[wid] = { id: wid, copies: 1, level: 1, refinement: 1 };
  const ownedCharacters = {};
  for (const cid of STARTER.characters) {
    ownedCharacters[cid] = { id: cid, level: 20, constellation: 0, weaponId: starterWeaponFor(cid), artifactIds: [], talents: defaultTalents() };
  }
  return {
    id, username, createdAt: Date.now(),
    primogems: STARTER.primogems, mora: STARTER.mora, resin: STARTER.resin, adventureXp: 0,
    passive: { atk: 0, hp: 0, critRate: 0, critDmg: 0, spd: 0 },
    pity: { character: 0, weapon: 0, characterFour: 0, weaponFour: 0, characterGuaranteed: false },
    characters: ownedCharacters, weapons: ownedWeapons, artifacts: {},
    history: { wishes: [], battles: [] }, pvp: { wins: 0, losses: 0, mmr: 1000 },
    showcase: STARTER.characters.slice(0, 4), domainProgress: {},
    daily: { lastClaimAt: 0, streak: 0 },
    ui: { profileMessageId: null, version: 3 },
  };
}

function migratePlayer(player) {
  let changed = false;
  player.passive ||= { atk: 0, hp: 0, critRate: 0, critDmg: 0, spd: 0 };
  player.pity ||= { character: 0, weapon: 0, characterFour: 0, weaponFour: 0, characterGuaranteed: false };
  player.history ||= { wishes: [], battles: [] };
  player.history.wishes ||= [];
  player.history.battles ||= [];
  player.pvp ||= { wins: 0, losses: 0, mmr: 1000 };
  player.domainProgress ||= {};
  if (!player.daily) { player.daily = { lastClaimAt: 0, streak: 0 }; changed = true; }
  if (!player.ui) { player.ui = { profileMessageId: null, version: 3 }; changed = true; }
  if (player.ui.version !== 3) { player.ui.version = 3; changed = true; }
  player.characters ||= {};
  player.weapons ||= {};
  player.artifacts ||= {};
  for (const [id, owned] of Object.entries(player.characters)) {
    owned.id ||= id;
    owned.artifactIds ||= [];
    if (!owned.talents) { owned.talents = defaultTalents(); changed = true; }
    for (const key of ['normal', 'skill', 'burst']) {
      if (!Number.isFinite(owned.talents[key])) { owned.talents[key] = 1; changed = true; }
    }
  }
  const valid = new Set(Object.keys(player.characters));
  const showcase = Array.isArray(player.showcase) ? player.showcase.filter((id, i, a) => valid.has(id) && a.indexOf(id) === i).slice(0, 10) : [];
  if (!showcase.length) { player.showcase = Object.keys(player.characters).slice(0, 10); changed = true; }
  else if (JSON.stringify(showcase) !== JSON.stringify(player.showcase)) { player.showcase = showcase; changed = true; }
  return changed;
}

export class JsonStore {
  constructor(file = DATA_FILE) {
    this.file = path.resolve(file);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, JSON.stringify({ players: {} }, null, 2));
    this.data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    this.data.players ||= {};
  }
  save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);
  }
  getPlayer(id, username) {
    let changed = false;
    if (!this.data.players[id]) { this.data.players[id] = makePlayer(id, username); changed = true; }
    const player = this.data.players[id];
    if (migratePlayer(player)) changed = true;
    if (username && player.username !== username) { player.username = username; changed = true; }
    if (changed) this.save();
    return player;
  }
  mutatePlayer(id, mutator, username) {
    const player = this.getPlayer(id, username);
    const result = mutator(player);
    migratePlayer(player);
    this.save();
    return result;
  }
}

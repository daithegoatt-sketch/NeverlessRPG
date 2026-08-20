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

function makePlayer(id, username = 'Traveler') {
  const ownedWeapons = {};
  for (const wid of STARTER.weapons) ownedWeapons[wid] = { id: wid, copies: 1, level: 1, refinement: 1 };
  const ownedCharacters = {};
  for (const cid of STARTER.characters) {
    ownedCharacters[cid] = {
      id: cid,
      level: 20,
      constellation: 0,
      weaponId: starterWeaponFor(cid),
      artifactIds: [],
    };
  }

  return {
    id,
    username,
    createdAt: Date.now(),
    primogems: STARTER.primogems,
    mora: STARTER.mora,
    resin: STARTER.resin,
    adventureXp: 0,
    passive: { atk: 0, hp: 0, critRate: 0, critDmg: 0, spd: 0 },
    pity: { character: 0, weapon: 0, characterFour: 0, weaponFour: 0, characterGuaranteed: false },
    characters: ownedCharacters,
    weapons: ownedWeapons,
    artifacts: {},
    history: { wishes: [], battles: [] },
    pvp: { wins: 0, losses: 0, mmr: 1000 },
  };
}

export class JsonStore {
  constructor(file = DATA_FILE) {
    this.file = path.resolve(file);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, JSON.stringify({ players: {} }, null, 2));
    this.data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
  }

  save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);
  }

  getPlayer(id, username) {
    if (!this.data.players[id]) {
      this.data.players[id] = makePlayer(id, username);
      this.save();
    }
    if (username && this.data.players[id].username !== username) {
      this.data.players[id].username = username;
      this.save();
    }
    return this.data.players[id];
  }

  mutatePlayer(id, mutator, username) {
    const player = this.getPlayer(id, username);
    const result = mutator(player);
    this.save();
    return result;
  }
}

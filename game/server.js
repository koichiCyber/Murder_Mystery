// Manor Murder Mystery - Vietnamese edition. Zero-dependency Node server.
// Run:  node server.js   (then open http://localhost:3000)
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const PORT = parseInt(process.env.PORT || '3000', 10);
// ---------- difficulty (set in start.bat / start.sh) ----------
const PRESETS = {
  EASY:   { accWeapon: 0, accSeizeTeam: 5, accSeizeFfa: 6, accWithhold: 0, policeWrong: 'SAFE',      detRetry: 1, rounds: 10 },
  NORMAL: { accWeapon: 1, accSeizeTeam: 4, accSeizeFfa: 5, accWithhold: 1, policeWrong: 'ELIMINATE', detRetry: 1, rounds: 8 },
  HARD:   { accWeapon: 1, accSeizeTeam: 2, accSeizeFfa: 3, accWithhold: 1, policeWrong: 'ELIMINATE', detRetry: 0, rounds: 5 }
};
const DIFF = (process.env.DIFFICULTY || 'NORMAL').toUpperCase() in PRESETS ? (process.env.DIFFICULTY || 'NORMAL').toUpperCase() : 'NORMAL';
const envNum = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' && !isNaN(+process.env[k])) ? +process.env[k] : d;
const base = PRESETS[DIFF];
const CFG = {
  name: DIFF,
  accWeapon: envNum('ACC_SEES_WEAPON', base.accWeapon) ? 1 : 0,
  accSeizeTeam: envNum('ACC_SEIZE_ROUND_TEAM', base.accSeizeTeam),
  accSeizeFfa: envNum('ACC_SEIZE_ROUND_FFA', base.accSeizeFfa),
  accWithhold: envNum('ACC_CAN_WITHHOLD', base.accWithhold) ? 1 : 0,
  policeWrong: (process.env.POLICE_WRONG_ARREST || base.policeWrong).toUpperCase() === 'SAFE' ? 'SAFE' : 'ELIMINATE',
  detRetry: envNum('DETECTIVE_FREE_RETRY', base.detRetry) ? 1 : 0,
  rounds: Math.max(2, Math.min(30, envNum('MAX_ROUNDS', base.rounds)))
};
console.log('Difficulty:', JSON.stringify(CFG));
const PUB = path.join(__dirname, 'public');
const CARDS = JSON.parse(fs.readFileSync(path.join(PUB, 'cards.json'), 'utf8'));
const NAMES = {};
for (const k of ['s', 'w', 'l']) CARDS[k].forEach(c => (NAMES[c.id] = c));
const CAT = { s: ['suspect', 'nghi phạm'], w: ['weapon', 'hung khí'], l: ['location', 'địa điểm'] };
const ROLE_ORDER = ['detective', 'witness', 'accomplice', 'police', 'reporter', 'innocent'];
const TEAM = { detective: 'good', witness: 'good', police: 'good', reporter: 'good', innocent: 'good', accomplice: 'bad' };
const BOT_NAMES_VI = ['Minh', 'Lan', 'Hùng', 'Mai', 'Tú', 'Hoa', 'Nam', 'Thảo', 'Bảo', 'Linh', 'Quân', 'Phúc', 'Hạnh', 'Dũng', 'Yến', 'Khoa', 'Trang', 'Sơn', 'Vy', 'Đạt', 'Nhi', 'Tâm', 'Huy', 'Ngân'];
const BOT_NAMES_EN = ['Alex', 'Sam', 'Riley', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Quinn', 'Avery', 'Jamie', 'Drew', 'Robin', 'Skyler', 'Parker', 'Rowan', 'Reese', 'Blake', 'Finley', 'Sage', 'Emery'];
const MAX_PLAYERS = 12;
const capOf = room => (room.settings && room.settings.game === 'ultima') ? 12 : 6;
const U = require('./ultima');
const rooms = {};

const ri = n => crypto.randomInt(n);
const pick = a => a[ri(a.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const code4 = () => { const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let c; do { c = Array.from({ length: 4 }, () => L[ri(L.length)]).join(''); } while (rooms[c]); return c; };
const tok = () => crypto.randomBytes(12).toString('hex');
const E = (vi, en) => ({ error: { vi, en } });
let THEMES = { themes: {} };
try { THEMES = JSON.parse(fs.readFileSync(path.join(PUB, 'themes.json'), 'utf8')); } catch (e) { console.error('themes.json missing'); }
const nm = (id, room) => { const t = room && room.settings && THEMES.themes[room.settings.theme]; return (t && t.cards[id]) || NAMES[id]; };
const TURN_C = parseInt(process.env.CLASSIC_TURN, 10) || 45000;

function pub(room, vi, en) { room.log.push({ vi, en, r: room.g ? room.g.round : 0 }); if (room.log.length > 300) room.log.shift(); }
function byId(room, id) { return room.players.find(p => p.id === id); }
function nameOf(room, id) { const p = byId(room, id); return p ? p.name : '?'; }

function view(room, me) {
  const g = room.g;
  const v = {
    cfg: CFG, code: room.code, phase: room.phase, me: me.id, hostId: room.hostId, settings: room.settings,
    players: room.players.map(p => ({ id: p.id, name: p.name, bot: !!p.bot, connected: !!p.bot || p.conns.size > 0 || (Date.now() - (p.seen || 0) < 6000), status: (p.bot || p.conns.size > 0 || Date.now() - (p.seen || 0) < 6000) ? 'on' : (Date.now() - (p.seen || 0) < 30000 ? 'away' : 'off'), cards: g ? (g.hands[p.id] || []).length : 0, elim: !!(g && g.elim[p.id]) }))
  };
  if (!g) return v;
  v.rolesOn = g.rolesOn; v.teamMode = g.teamMode; v.round = g.round; v.maxRounds = room.settings.maxRounds;
  v.turnId = room.players[g.turn].id;
  v.hist = (g.hist || []).map(h => ({ n: h.n, round: h.round, by: h.by, s: h.s, w: h.w, l: h.l, passed: h.passed, ans: h.ans, done: h.done }));
  v.hand = g.hands[me.id];
  v.myRole = g.rolesOn ? g.roles[me.id] : null;
  const secrets = [];
  if (!g.ult && g.rolesOn && g.roles[me.id] === 'witness') secrets.push(g.solution.l);
  if (!g.ult && g.rolesOn && g.roles[me.id] === 'accomplice') { secrets.push(g.solution.s); if (CFG.accWeapon) secrets.push(g.solution.w); }
  v.secrets = secrets;
  v.seen = g.seen[me.id] || [];
  v.notes = g.notes[me.id] || [];
  v.used = g.used[me.id];
  v.turn = { suggests: g.t.suggests, max: g.t.max };
  v.lastAccuse = g.lastAccuse || null;
  v.rc = g.rc ? { left: Math.max(0, Math.ceil((g.rc.until - Date.now()) / 1000)), ready: Object.fromEntries(room.players.map(x => [x.id, !!g.rc.ready[x.id]])), mine: !!g.rc.ready[me.id] } : null;
  if (!g.ult && !g.rc && g.turnUntil && room.phase === 'play' && !g.pending && !g.over) v.turnLeft = Math.max(0, (g.turnUntil - Date.now()) / 1000);
  if (g.pending) {
    const pd = g.pending;
    v.pending = { suggester: pd.suggester, disprover: pd.disprover, s: pd.s, w: pd.w, l: pd.l, kind: pd.kind || 'suggest', cat: pd.cat || null, order: pd.order, pos: pd.pos, passed: pd.h ? pd.h.passed : [] };
    if (pd.disprover === me.id) { v.pending.match = pd.match; v.pending.canLie = !g.ult && CFG.accWithhold && pd.kind !== 'reveal' && g.rolesOn && g.roles[me.id] === 'accomplice' && !g.used[me.id].lie; }
  }
  if (g.ult) U.view(room, me, v);
  if (room.phase === 'over') v.over = { ...g.over, solution: g.solution, roles: g.rolesOn ? g.roles : null, hands: g.hands, log: room.log.filter(l => /accuses|Wrong|is out|eliminated|jailed|Nobody is jailed|rrest|Police|🌙|Village meeting|🏁|New game|Ultima|Time's up|time\./.test(l.en)).map(l => ({ r: l.r, vi: l.vi, en: l.en })) };
  return v;
}
function broadcast(room) {
  for (const p of room.players) {
    if (!p.conns.size) continue;
    const data = `data: ${JSON.stringify(view(room, p))}\n\n`;
    for (const res of p.conns) { try { res.write(data); } catch (e) {} }
  }
}


// ---------- bots (solo play) ----------
const BOT_DELAY = envNum('BOT_DELAY', 2500);
const cardIds = k => CARDS[k].map(c => c.id);
class Brain {
  constructor() { this.ruled = new Set(); this.known = {}; this.noteN = 0; this.aw = null; this.shown = {}; }
  update(v) {
    v.hand.forEach(c => this.ruled.add(c)); v.seen.forEach(x => this.ruled.add(x.card));
    v.secrets.forEach(id => { this.known[id[0]] = id; });
    v.notes.slice(this.noteN).forEach(n => [...Object.values(NAMES), ...Object.values(THEMES.themes).flatMap(t => Object.entries(t.cards).map(([id, c]) => ({ id, vi: c.vi })))].forEach(c => { if (n.vi.includes(c.vi)) this.ruled.add(c.id); }));
    this.noteN = v.notes.length;
    if (v.ult) Object.values(v.ult.revealed || {}).forEach(r => (r.hand || []).forEach(c => this.ruled.add(c)));
    if (this.aw && !v.pending) {
      if (v.seen.length === this.aw.seenLen) { for (const k of ['s', 'w', 'l']) { const id = this.aw[k]; if (!v.hand.includes(id)) this.known[k] = id; } }
      this.aw = null;
    }
  }
  cand(k) { return this.known[k] ? [this.known[k]] : cardIds(k).filter(id => !this.ruled.has(id)); }
  sure() { return ['s', 'w', 'l'].every(k => this.cand(k).length === 1); }
}
function botActor(room) {
  const g = room.g; if (!g || room.phase !== 'play' || g.rc) return null;
  if (g.ult) return U.botActor(room);
  if (g.pending) { const d = byId(room, g.pending.disprover); return d && d.bot ? d : null; }
  const cur = room.players[g.turn];
  return cur && cur.bot && !g.elim[cur.id] ? cur : null;
}
function botStep(room) {
  const p = botActor(room); if (!p) return;
  const g = room.g, v = view(room, p), b = p.brain || (p.brain = new Brain());
  b.update(v);
  if (g.ult) return U.botStep(room, p, v, b);
  const go = a => act(room, p, a);
  if (g.pending) {
    const pd = v.pending;
    if (pd.canLie && Math.random() < 0.6) { if (!go({ type: 'lie' })) return; }
    const prev = (b.shown[pd.suggester] || []).find(c => pd.match.includes(c));
    const c = prev || pick(pd.match);
    (b.shown[pd.suggester] = b.shown[pd.suggester] || []).push(c);
    go({ type: 'show', card: c }); return;
  }
  const acc = v.myRole === 'accomplice' && v.teamMode, late = v.round >= v.maxRounds;
  const fin = r => { if (r) go({ type: 'end' }); };
  if (b.sure()) return fin(go({ type: 'accuse', s: b.cand('s')[0], w: b.cand('w')[0], l: b.cand('l')[0] }));
  if (acc && late) return fin(go({ type: 'accuse', s: b.cand('s')[0], w: b.cand('w')[0], l: pick(b.cand('l')) }));
  if (v.myRole === 'detective' && v.used.lastRound !== v.round) {
    const others = v.players.filter(x => x.id !== p.id);
    const cat = ['s', 'w', 'l'].map(k => [k, b.cand(k).length]).sort((x, y) => y[1] - x[1])[0][0];
    return fin(go({ type: 'power', target: pick(others).id, cat }));
  }
  if (v.myRole === 'police' && !v.used.power && v.turn.suggests === 0 && v.round >= 4 && Math.random() < 0.3) {
    const al = v.players.filter(x => x.id !== p.id && !x.elim);
    return fin(go({ type: 'power', target: pick(al).id }));
  }
  if (v.myRole === 'innocent' && !v.used.power && v.turn.suggests === 1 && v.turn.max === 1) return fin(go({ type: 'power' }));
  if (v.turn.suggests < v.turn.max) {
    const sg = { s: pick(b.cand('s')), w: pick(b.cand('w')), l: pick(b.cand('l')) };
    b.aw = { ...sg, seenLen: v.seen.length };
    return fin(go({ type: 'suggest', ...sg }));
  }
  go({ type: 'end' });
}
function scheduleBots(room) {
  if (room.botTimer || !botActor(room)) return;
  room.botTimer = setTimeout(() => {
    room.botTimer = null;
    const g = room.g, before = g ? JSON.stringify([g.turn, g.round, !!g.pending, g.pending && g.pending.pos, room.log.length, room.phase, g.ult ? [g.ult.sub, g.ult.window && g.ult.window.chain.length, Object.keys(g.ult.botTried).length, g.ult.votes && Object.keys(g.ult.votes.votes).length, g.ult.night && g.ult.night.pick] : 0]) : '';
    try { botStep(room); } catch (e) { console.error('bot error', e); }
    const after = g ? JSON.stringify([g.turn, g.round, !!g.pending, g.pending && g.pending.pos, room.log.length, room.phase, g.ult ? [g.ult.sub, g.ult.window && g.ult.window.chain.length, Object.keys(g.ult.botTried).length, g.ult.votes && Object.keys(g.ult.votes.votes).length, g.ult.night && g.ult.night.pick] : 0]) : '';
    room.botFails = before === after ? (room.botFails || 0) + 1 : 0;
    broadcast(room);
    if (room.botFails < 6) scheduleBots(room);
  }, BOT_DELAY * (0.8 + Math.random() * 0.9));
}

function aliveIds(room) { return room.players.filter(p => !room.g.elim[p.id]).map(p => p.id); }
function finish(room, team, winners, vi, en) {
  const g = room.g;
  g.over = { team, winners, vi, en };
  room.phase = 'over'; g.pending = null;
  pub(room, '🏁 ' + vi, '🏁 ' + en);
}
function checkEnd(room) {
  const g = room.g, alive = aliveIds(room);
  if (g.teamMode) {
    const goodAlive = alive.filter(id => TEAM[g.roles[id]] === 'good');
    if (!goodAlive.length) {
      const bad = room.players.filter(p => TEAM[g.roles[p.id]] === 'bad').map(p => p.id);
      finish(room, 'bad', bad, 'Cả phe Thiện đã bị loại. Đồng phạm thắng!', 'All Good players are out. The Accomplice wins!'); return true;
    }
    if (!alive.some(id => TEAM[g.roles[id]] === 'bad')) {
      const good = room.players.filter(p => TEAM[g.roles[p.id]] === 'good').map(p => p.id);
      finish(room, 'good', good, 'Đồng phạm đã bị loại. Phe Thiện thắng!', 'The Accomplice is out. The Good team wins!'); return true;
    }
  } else {
    if (alive.length === 1) { finish(room, 'solo', alive, `${nameOf(room, alive[0])} là người cuối cùng còn lại và thắng!`, `${nameOf(room, alive[0])} is the last one standing and wins!`); return true; }
    if (!alive.length) { finish(room, 'none', [], 'Tất cả bị loại. Không ai thắng.', 'Everyone is out. Nobody wins.'); return true; }
  }
  return false;
}
function nextTurn(room) {
  const g = room.g, n = room.players.length;
  let i = g.turn, wrapped = false;
  for (let k = 0; k < n; k++) {
    i = (i + 1) % n; if (i === 0) wrapped = true;
    if (!g.elim[room.players[i].id]) break;
  }
  g.turn = i; g.t = { suggests: 0, max: 1 }; g.turnUntil = Date.now() + TURN_C; g.turnTick = Date.now();
  if (wrapped) {
    g.round++;
    if (g.round > room.settings.maxRounds) {
      if (g.teamMode) {
        const bad = room.players.filter(p => TEAM[g.roles[p.id]] === 'bad').map(p => p.id);
        finish(room, 'bad', bad, `Hết ${room.settings.maxRounds} vòng mà chưa ai buộc tội đúng. Đồng phạm thắng!`, `${room.settings.maxRounds} rounds passed with no correct accusation. The Accomplice wins!`);
      } else finish(room, 'none', [], `Hết ${room.settings.maxRounds} vòng. Không ai thắng.`, `${room.settings.maxRounds} rounds passed. Nobody wins.`);
    }
  }
}
function findDisprover(room) {
  const g = room.g, pd = g.pending;
  while (pd.pos < pd.order.length) {
    const pid = pd.order[pos(pd)];
    if (g.ult && g.elim[pid]) { pd.pos++; continue; }
    const match = g.hands[pid].filter(c => c === pd.s || c === pd.w || c === pd.l);
    if (match.length) { pd.disprover = pid; pd.match = match; return; }
    if (pd.h) pd.h.passed.push(pid);
    pd.pos++;
  }
  pd.disprover = null;
}
const pos = pd => pd.pos;
const okCard = (k, id) => typeof id === 'string' && CARDS[k].some(c => c.id === id);

function act(room, p, a) {
  const g = room.g;
  const isHost = p.id === room.hostId;
  switch (a.type) {
    case 'settings': {
      if (!isHost || room.phase !== 'lobby') return E('Chỉ chủ phòng mới đổi được.', 'Only the host can change this.');
      room.settings.roles = !!a.roles;
      room.settings.mode = a.mode === 'ffa' ? 'ffa' : 'team';
      room.settings.maxRounds = Math.max(4, Math.min(20, parseInt(a.maxRounds, 10) || 8));
      room.settings.game = a.game === 'ultima' ? 'ultima' : 'classic';
      room.settings.ulevel = a.ulevel === 'normal' ? 'normal' : 'hard';
      room.settings.theme = THEMES.themes[a.theme] ? a.theme : 'classic';
      if (room.players.length > capOf(room)) { room.settings.game = 'ultima'; return E('Có hơn 6 người: chỉ chế độ Ultima chơi được.', 'More than 6 players: only Ultima mode works.'); }
      return null;
    }
    case 'start': {
      if (!isHost || room.phase !== 'lobby') return E('Chỉ chủ phòng mới bắt đầu được.', 'Only the host can start.');
      if (room.players.length < (room.settings.game === 'ultima' ? 3 : 2)) return E(room.settings.game === 'ultima' ? 'Ultima cần ít nhất 3 người.' : 'Cần ít nhất 2 người chơi.', room.settings.game === 'ultima' ? 'Ultima needs at least 3 players.' : 'Need at least 2 players.');
      if (room.players.length > capOf(room)) return E('Quá 6 người: hãy chọn chế độ Ultima.', 'More than 6 players: choose Ultima mode.');
      startGame(room); return null;
    }
    case 'addbot': {
      if (!isHost || room.phase !== 'lobby') return E('Chỉ chủ phòng, trong phòng chờ.', 'Host only, in the lobby.');
      if (room.players.length >= capOf(room)) return E(`Phòng đã đủ ${capOf(room)} người.`, `Room is full (${capOf(room)}).`);
      const pool = a.lang === 'en' ? BOT_NAMES_EN : BOT_NAMES_VI;
      const free = pool.filter(p => !room.players.some(x => x.name.toLowerCase() === p.toLowerCase()));
      let name;
      if (free.length) name = free[Math.floor(Math.random() * free.length)];
      else { let n = room.players.filter(x => x.bot).length + 1; do { name = `${a.lang === 'en' ? 'Bot' : 'Máy'} ${n++}`; } while (room.players.some(x => x.name.toLowerCase() === name.toLowerCase())); }
      room.players.push({ id: tok().slice(0, 8), name, token: tok(), conns: new Set(), bot: true });
      return null;
    }
    case 'removebot': {
      if (!isHost || room.phase !== 'lobby') return E('Chỉ chủ phòng, trong phòng chờ.', 'Host only, in the lobby.');
      const i = room.players.findIndex(x => x.id === a.id && x.bot);
      if (i < 0) return E('Không tìm thấy bot.', 'Bot not found.');
      room.players.splice(i, 1); return null;
    }
    case 'reset': {
      if (!isHost || room.phase !== 'over') return E('Chỉ chủ phòng, khi ván đã kết thúc.', 'Host only, after the game ends.');
      room.phase = 'lobby'; room.g = null; room.log = []; return null;
    }
  }
  if (room.phase !== 'play') return E('Ván chưa chạy.', 'The game is not running.');
  if (a.type === 'ready') { if (g.rc) g.rc.ready[p.id] = true; return null; }
  if (g.rc) return E('Đang chờ mọi người sẵn sàng.', 'Waiting for everyone to get ready.');
  if (g.ult) return U.act(room, p, a);
  const meId = p.id, myTurn = room.players[g.turn].id === meId;

  if (a.type === 'show' || a.type === 'lie') {
    const pd = g.pending;
    if (!pd || pd.disprover !== meId) return E('Chưa đến lượt bạn bác bỏ.', 'You are not the one to answer.');
    if (a.type === 'show') {
      if (!pd.match.includes(a.card)) return E('Lá bài không hợp lệ.', 'Invalid card.');
      (g.seen[pd.suggester] = g.seen[pd.suggester] || []).push(pd.kind === 'reveal' ? { by: meId, byName: nameOf(room, meId), card: a.card, kind: 'reveal', cat: pd.cat } : { by: meId, byName: nameOf(room, meId), card: a.card, s: pd.s, w: pd.w, l: pd.l });
      if (pd.h) { pd.h.ans = meId; pd.h.done = true; }
      pub(room, `${nameOf(room, meId)} đã bí mật cho ${nameOf(room, pd.suggester)} xem 1 lá.`, `${nameOf(room, meId)} secretly showed ${nameOf(room, pd.suggester)} a card.`);
      g.pending = null; return null;
    }
    if (pd.kind === 'reveal') return E('Không thể từ chối yêu cầu của Thám tử.', 'You cannot refuse the Detective.');
    if (!(CFG.accWithhold && g.rolesOn && g.roles[meId] === 'accomplice' && !g.used[meId].lie)) return E('Bạn không được nói dối.', 'You cannot lie.');
    g.used[meId].lie = true; if (pd.h) pd.h.passed.push(meId); pd.pos++;
    pub(room, `${nameOf(room, meId)} nói không có lá nào.`, `${nameOf(room, meId)} says they have none.`);
    findDisprover(room);
    if (!pd.disprover) { if (pd.h) pd.h.done = true; pub(room, 'Không ai bác bỏ được giả thuyết!', 'Nobody could disprove the suggestion!'); g.pending = null; }
    return null;
  }

  if (g.pending) return E('Đang chờ người bác bỏ.', 'Waiting for someone to answer.');
  if (!myTurn) return E('Chưa đến lượt bạn.', 'It is not your turn.');
  if (g.elim[meId]) return E('Bạn đã bị loại.', 'You are eliminated.');

  switch (a.type) {
    case 'suggest': {
      if (g.t.suggests >= g.t.max) return E('Bạn đã hết lượt đưa giả thuyết.', 'No suggestions left this turn.');
      if (!okCard('s', a.s) || !okCard('w', a.w) || !okCard('l', a.l)) return E('Chọn đủ 1 nghi phạm, 1 hung khí, 1 địa điểm.', 'Pick 1 suspect, 1 weapon and 1 location.');
      g.t.suggests++;
      pub(room, `${nameOf(room, meId)} đưa ra giả thuyết: ${nm(a.s, room).vi} · ${nm(a.w, room).vi} · ${nm(a.l, room).vi}`, `${nameOf(room, meId)} suggests: ${nm(a.s, room).en} · ${nm(a.w, room).en} · ${nm(a.l, room).en}`);
      const n = room.players.length, i0 = room.players.findIndex(x => x.id === meId);
      const order = []; for (let k = 1; k < n; k++) order.push(room.players[(i0 + k) % n].id);
      const h = { n: (g.hist = g.hist || []).length + 1, round: g.round, by: meId, s: a.s, w: a.w, l: a.l, passed: [], ans: null, done: false };
      g.hist.push(h);
      g.pending = { suggester: meId, s: a.s, w: a.w, l: a.l, order, pos: 0, disprover: null, match: [], h };
      findDisprover(room);
      if (!g.pending.disprover) { h.done = true; pub(room, 'Không ai bác bỏ được giả thuyết!', 'Nobody could disprove the suggestion!'); g.pending = null; }
      return null;
    }
    case 'accuse': {
      if (g.rolesOn && g.roles[meId] === 'accomplice') { const from = g.teamMode ? CFG.accSeizeTeam : CFG.accSeizeFfa; if (g.round < from) return E(`Đồng phạm chỉ được chiếm đáp án từ vòng ${from}.`, `The Accomplice can only seize the answer from round ${from}.`); }
      if (!okCard('s', a.s) || !okCard('w', a.w) || !okCard('l', a.l)) return E('Chọn đủ 1 nghi phạm, 1 hung khí, 1 địa điểm.', 'Pick 1 suspect, 1 weapon and 1 location.');
      const ok = a.s === g.solution.s && a.w === g.solution.w && a.l === g.solution.l;
      const freeTry = !ok && g.rolesOn && g.roles[meId] === 'detective' && CFG.detRetry && !g.used[meId].retry;
      g.accN = (g.accN || 0) + 1; g.lastAccuse = { n: g.accN, by: meId, s: a.s, w: a.w, l: a.l, res: ok ? 'right' : freeTry ? 'free' : 'wrong' };
      pub(room, `${nameOf(room, meId)} buộc tội: ${nm(a.s, room).vi} · ${nm(a.w, room).vi} · ${nm(a.l, room).vi}`, `${nameOf(room, meId)} accuses: ${nm(a.s, room).en} · ${nm(a.w, room).en} · ${nm(a.l, room).en}`);
      if (ok) {
        if (g.teamMode && g.roles[meId] === 'accomplice') finish(room, 'bad', [meId], `${nameOf(room, meId)} là Đồng phạm và đã chiếm được đáp án! Phe Ác thắng!`, `${nameOf(room, meId)} is the Accomplice and seized the answer! The Bad team wins!`);
        else if (g.teamMode) finish(room, 'good', room.players.filter(x => TEAM[g.roles[x.id]] === 'good').map(x => x.id), `${nameOf(room, meId)} buộc tội đúng! Phe Thiện thắng!`, `${nameOf(room, meId)} is right! The Good team wins!`);
        else finish(room, 'solo', [meId], `${nameOf(room, meId)} buộc tội đúng và thắng!`, `${nameOf(room, meId)} is right and wins!`);
        return null;
      }
      if (g.rolesOn && g.roles[meId] === 'detective' && CFG.detRetry && !g.used[meId].retry) {
        g.used[meId].retry = true;
        pub(room, `Sai! Nhưng Thám tử ${nameOf(room, meId)} chưa bị loại (còn 1 mạng).`, `Wrong! But Detective ${nameOf(room, meId)} survives (this was their free retry).`);
      } else {
        g.elim[meId] = true;
        pub(room, `Sai! ${nameOf(room, meId)} bị loại (vẫn phải cho xem bài khi được hỏi).`, `Wrong! ${nameOf(room, meId)} is eliminated (still shows cards when asked).`);
        if (checkEnd(room)) return null;
      }
      nextTurn(room); return null;
    }
    case 'end': {
      nextTurn(room); return null;
    }
    case 'power': {
      if (!g.rolesOn) return E('Ván này không dùng vai trò.', 'Roles are off.');
      const role = g.roles[meId], u = g.used[meId];
      if (role === 'detective') {
        if (u.lastRound === g.round) return E('Vòng này bạn đã dùng quyền rồi.', 'You already used your power this round.');
        const t = byId(room, a.target), c = CAT[a.cat];
        if (!t || t.id === meId || !c) return E('Chọn một người khác và một loại bài.', 'Pick another player and a card type.');
        u.lastRound = g.round;
        const cards = g.hands[t.id].filter(id => id[0] === a.cat);
        pub(room, `${nameOf(room, meId)} (Thám tử) yêu cầu ${t.name} cho xem 1 lá ${c[1]}.`, `${nameOf(room, meId)} (Detective) makes ${t.name} show 1 ${c[0]} card.`);
        if (!cards.length) { (g.notes[meId] = g.notes[meId] || []).push({ vi: `${t.name} không có lá ${c[1]} nào.`, en: `${t.name} holds no ${c[0]} cards.` }); return null; }
        g.pending = { kind: 'reveal', cat: a.cat, suggester: meId, disprover: t.id, match: cards, s: null, w: null, l: null, order: [t.id], pos: 0 };
        return null;
      }
      if (u.power) return E('Bạn đã dùng quyền rồi.', 'You already used your power.');
      if (role === 'police') {
        const t = byId(room, a.target);
        if (!t || t.id === meId || g.elim[t.id]) return E('Chọn một người khác còn trong game.', 'Pick another player who is still in.');
        u.power = true;
        pub(room, `${nameOf(room, meId)} (Cảnh sát) bắt giữ ${t.name}!`, `${nameOf(room, meId)} (Police) arrests ${t.name}!`);
        if (g.roles[t.id] === 'accomplice') {
          if (g.teamMode) finish(room, 'good', room.players.filter(x => TEAM[g.roles[x.id]] === 'good').map(x => x.id), `${t.name} đúng là Đồng phạm! Cảnh sát ${nameOf(room, meId)} bắt được và phe Thiện thắng!`, `${t.name} is the Accomplice! Police ${nameOf(room, meId)} made the arrest and the Good team wins!`);
          else finish(room, 'solo', [meId], `${t.name} đúng là Đồng phạm! Cảnh sát ${nameOf(room, meId)} bắt được và thắng một mình!`, `${t.name} is the Accomplice! Police ${nameOf(room, meId)} wins alone!`);
          return null;
        }
        if (CFG.policeWrong === 'SAFE') {
          pub(room, `${t.name} vô tội! Cảnh sát ${nameOf(room, meId)} bắt nhầm và mất quyền bắt giữ.`, `${t.name} is innocent! Police ${nameOf(room, meId)} arrested the wrong person and loses the power.`);
          nextTurn(room); return null;
        }
        g.elim[meId] = true;
        pub(room, `${t.name} vô tội! Cảnh sát ${nameOf(room, meId)} bắt nhầm và bị loại.`, `${t.name} is innocent! Police ${nameOf(room, meId)} arrested the wrong person and is out.`);
        if (checkEnd(room)) return null;
        nextTurn(room); return null;
      }
      if (role === 'innocent') {
        u.power = true; g.t.max++;
        pub(room, `${nameOf(room, meId)} (Người vô tội) được đưa giả thuyết lần hai trong lượt này.`, `${nameOf(room, meId)} (Innocent) may make a second suggestion this turn.`);
        return null;
      }
      if (role === 'reporter') {
        const t = byId(room, a.target), c = CAT[a.cat];
        if (!t || t.id === meId || !c) return E('Chọn một người khác và một loại bài.', 'Pick another player and a card type.');
        const cards = g.hands[t.id].filter(id => id[0] === a.cat);
        u.power = true;
        const note = role === 'reporter'
          ? { vi: `${t.name} có ${cards.length} lá ${c[1]}.`, en: `${t.name} holds ${cards.length} ${c[0]} card(s).` }
          : { vi: `${t.name} có ${cards.length ? 'các lá ' + c[1] + ': ' + cards.map(x => nm(x, room).vi).join(', ') : 'không lá ' + c[1] + ' nào'}.`, en: `${t.name} holds ${cards.length ? cards.map(x => nm(x, room).en).join(', ') : 'no ' + c[0] + ' cards'}.` };
        (g.notes[meId] = g.notes[meId] || []).push(note);
        pub(room, `${nameOf(room, meId)} (${role === 'reporter' ? 'Phóng viên' : 'Cảnh sát'}) hỏi ${t.name} về các lá ${c[1]}.`, `${nameOf(room, meId)} (${role === 'reporter' ? 'Reporter' : 'Police'}) asks ${t.name} about ${c[0]} cards.`);
        return null;
      }
      return E('Vai trò của bạn không có quyền chủ động.', 'Your role has no active power.');
    }
  }
  return E('Hành động không hợp lệ.', 'Unknown action.');
}

function startGame(room) {
  room.players.forEach(p => { if (p.bot) p.brain = new Brain(); });
  room.botFails = 0;
  room.players = shuffle(room.players);
  if (room.settings.game === 'ultima') { const r = U.start(room); initRC(room); return r; }
  const n = room.players.length;
  const rolesOn = room.settings.roles && n >= 3;
  const solution = { s: pick(CARDS.s).id, w: pick(CARDS.w).id, l: pick(CARDS.l).id };
  const sol = [solution.s, solution.w, solution.l];
  const deck = shuffle([...CARDS.s, ...CARDS.w, ...CARDS.l].map(c => c.id).filter(id => !sol.includes(id)));
  const hands = {}, roles = {}, used = {}, seen = {}, notes = {};
  room.players.forEach(p => { hands[p.id] = []; used[p.id] = { power: false, lie: false, retry: false }; });
  deck.forEach((id, i) => hands[room.players[i % n].id].push(id));
  Object.values(hands).forEach(h => h.sort());
  if (rolesOn) {
    const rs = shuffle(ROLE_ORDER.slice(0, n));
    room.players.forEach((p, i) => (roles[p.id] = rs[i]));
  }
  room.g = { solution, hands, roles, rolesOn, teamMode: rolesOn && room.settings.mode === 'team', used, seen, notes, elim: {}, turn: 0, round: 1, t: { suggests: 0, max: 1 }, pending: null, over: null, turnUntil: Date.now() + TURN_C, turnTick: Date.now() };
  room.phase = 'play'; room.log = [];
  pub(room, `Ván mới với ${n} người, ${rolesOn ? (room.g.teamMode ? 'chế độ Đội' : 'chế độ Một mình (có vai trò)') : 'không vai trò'}. ${room.players[0].name} đi trước.`, `New game with ${n} players, ${rolesOn ? (room.g.teamMode ? 'Team mode' : 'Free-for-all (with roles)') : 'no roles'}. ${room.players[0].name} goes first.`);
  initRC(room);
}

const RC_MS = parseInt(process.env.RC_TIMEOUT, 10) || 40000;
function initRC(room) {
  const g = room.g; if (!g) return;
  g.rc = { until: Date.now() + RC_MS, ready: {} };
  room.players.forEach(p => { if (p.bot) g.rc.ready[p.id] = true; });
}
function humansPresent(room) { return room.players.filter(p => !p.bot && (p.conns.size > 0 || !p.seen || Date.now() - p.seen < 30000)); }
function rcTick(room) {
  const g = room.g; if (!g || !g.rc || room.phase !== 'play') return false;
  const all = humansPresent(room).every(p => g.rc.ready[p.id]);
  if (!all && Date.now() < g.rc.until) return false;
  g.rc = null; const now = Date.now();
  if (g.ult) U.resume(room); else { g.turnUntil = now + TURN_C; g.turnTick = now; }
  return true;
}
function classicTick(room) {
  const g = room.g, now = Date.now();
  if (!g || g.ult || g.rc || room.phase !== 'play' || g.over || !g.turnUntil) return false;
  const dt = now - (g.turnTick || now); g.turnTick = now;
  if (g.pending) { g.turnUntil += dt; return false; }   // paused while a suggestion is being answered
  if (now < g.turnUntil) return false;
  const p = room.players[g.turn];
  pub(room, `${p.name} hết giờ. Lượt chuyển tiếp.`, `${p.name} ran out of time. Turn passes.`);
  nextTurn(room);
  return true;
}
U.init({ CARDS, pub, byId, nameOf, shuffle, pick, ri, E, okCard, nm, finish, findDisprover, act: (room, p, a) => act(room, p, a) });
setInterval(() => { for (const c in rooms) { const r = rooms[c]; try { if (U.tick(r) | classicTick(r) | rcTick(r)) { broadcast(r); r.botFails = 0; scheduleBots(r); } } catch (e) { console.error('tick', e); } } }, 400);

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4' };
function readBody(req) { return new Promise(r => { let b = ''; req.on('data', d => { b += d; if (b.length > 1e5) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch (e) { r({}); } }); }); }
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function auth(q) { const room = rooms[String(q.code || '').toUpperCase()]; if (!room) return {}; const p = room.players.find(x => x.token === q.token); return { room, p }; }
const cleanName = s => String(s || '').replace(/[<>&"']/g, '').trim().slice(0, 16);

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (req.method === 'POST' && u.pathname === '/api/create') {
      const b = await readBody(req), name = cleanName(b.name);
      if (!name) return json(res, 400, E('Hãy nhập tên.', 'Enter a name.'));
      const room = { code: code4(), phase: 'lobby', players: [], hostId: null, settings: { roles: true, mode: 'team', maxRounds: CFG.rounds, game: 'classic', ulevel: 'hard', theme: 'classic' }, g: null, log: [] };
      rooms[room.code] = room;
      const p = { id: tok().slice(0, 8), name, token: tok(), conns: new Set() };
      room.players.push(p); room.hostId = p.id;
      return json(res, 200, { code: room.code, token: p.token, id: p.id });
    }
    if (req.method === 'POST' && u.pathname === '/api/join') {
      const b = await readBody(req), name = cleanName(b.name), room = rooms[String(b.code || '').toUpperCase()];
      if (!room) return json(res, 404, E('Không tìm thấy phòng.', 'Room not found.'));
      if (room.phase !== 'lobby') return json(res, 400, E('Ván đã bắt đầu.', 'The game already started.'));
      if (!name) return json(res, 400, E('Hãy nhập tên.', 'Enter a name.'));
      if (room.players.length >= capOf(room)) return json(res, 400, E(`Phòng đã đủ ${capOf(room)} người.`, `Room is full (${capOf(room)}).`));
      if (room.players.some(x => x.name.toLowerCase() === name.toLowerCase())) return json(res, 400, E('Tên này đã có người dùng.', 'That name is taken.'));
      const p = { id: tok().slice(0, 8), name, token: tok(), conns: new Set() };
      room.players.push(p); broadcast(room);
      return json(res, 200, { code: room.code, token: p.token, id: p.id });
    }
    if (req.method === 'POST' && u.pathname === '/api/action') {
      const b = await readBody(req), { room, p } = auth(b);
      if (!p) return json(res, 404, E('Phiên không hợp lệ.', 'Invalid session.'));
      const r = act(room, p, b);
      broadcast(room);
      room.botFails = 0; scheduleBots(room);
      return json(res, r ? 400 : 200, r || { ok: true });
    }
    if (req.method === 'GET' && u.pathname === '/api/music') {
      let list = [];
      try { list = fs.readdirSync(path.join(PUB, 'music')).filter(f => /\.(mp3|ogg|wav|m4a)$/i.test(f)).sort(); } catch (e) {}
      return json(res, 200, { tracks: list.map(f => '/music/' + encodeURIComponent(f)) });
    }
    if (req.method === 'GET' && u.pathname === '/api/state') {
      const { room, p } = auth(Object.fromEntries(u.searchParams));
      if (!p) return json(res, 404, E('Phiên không hợp lệ.', 'Invalid session.'));
      p.seen = Date.now();
      return json(res, 200, view(room, p));
    }
    if (req.method === 'GET' && u.pathname === '/api/events') {
      const { room, p } = auth(Object.fromEntries(u.searchParams));
      if (!p) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      p.conns.add(res); res.write(`retry: 2000\n\n`); broadcast(room);
      const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 20000);
      req.on('close', () => { clearInterval(hb); p.conns.delete(res); broadcast(room); });
      return;
    }
    // static
    let f = u.pathname === '/' ? '/index.html' : u.pathname;
    const fp = path.normalize(path.join(PUB, f));
    if (!fp.startsWith(PUB) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(fp).pipe(res);
  } catch (e) { console.error(e); try { json(res, 500, E('Lỗi máy chủ.', 'Server error.')); } catch (x) {} }
});

// clean up idle rooms
setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (r.players.every(p => !p.conns.size)) { r.idle = (r.idle || 0) + 1; if (r.idle > 120) delete rooms[c]; } else r.idle = 0; } }, 60000);

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  Án Mạng Dinh Thự / Manor Murder Mystery is running!\n');
  console.log(`  On this PC:        http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) for (const n of list || []) if (n.family === 'IPv4' && !n.internal) console.log(`  Same Wi-Fi/LAN:    http://${n.address}:${PORT}`);
  console.log('  Friends elsewhere: see README (tunnel or port-forward)\n');
});

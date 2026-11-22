// Ultima mode (Luật v2) - separate game mode. Self-contained engine; server.js delegates to it when g.ult is set.
// Levels: 'normal' = Clue only (3-10 players, last one standing). 'hard' (>=6 players) = roles, action cards, night, village vote.
const envN = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' && !isNaN(+process.env[k])) ? +process.env[k] : d;
const WINDOW = envN('ULT_WINDOW', 5000), NIGHT = envN('ULT_NIGHT', 35000), VOTE = envN('ULT_VOTE', 60000), TURN = envN('ULT_TURN', 90000), TURN_N = envN('ULT_TURN_NORMAL', 45000), ANSWER = envN('ULT_ANSWER', 60000);
const ACTS = {
  counter: { vi: 'Phản đối!', en: 'Counter!', base: 4 }, dodge: { vi: 'Lánh mặt', en: 'Lie low', base: 4 }, frame: { vi: 'Đổ tội', en: 'Frame', base: 3 },
  intuition: { vi: 'Linh cảm', en: 'Hunch', base: 4 }, shuffle: { vi: 'Xáo trộn hiện trường', en: 'Scene shuffle', base: 2 }, interrogate: { vi: 'Thẩm vấn', en: 'Interrogate', base: 4 },
  false: { vi: 'Lời khai giả', en: 'False testimony', base: 3 }, extra: { vi: 'Giả thuyết thêm', en: 'Extra suggestion', base: 3 }, blank: { vi: 'Giấy trắng', en: 'Blank paper', base: 10 }
};
const type = id => String(id).split('_')[0];
const aname = id => ACTS[type(id)] || { vi: '?', en: '?' };
const TEAMS = { detective: 'good', forensic: 'good', police: 'good', witness: 'good', villager: 'good', accomplice: 'bad' };
let X = null; // context from server.js
const now = () => Date.now();

function init(ctx) { X = ctx; }

function roleList(n) {
  const r = ['detective', 'forensic', 'witness', 'villager', 'villager', 'accomplice'];
  if (n >= 7) r.push('accomplice');
  if (n >= 8) r.push('villager');
  if (n >= 9) r.push('police');
  if (n >= 10) r.push('villager');
  return r;
}
function buildDeck(n) {
  const f = n / 6, d = [];
  for (const t of Object.keys(ACTS)) {
    if (t === 'blank') { const per = Math.max(1, Math.round(5 * f)); for (const c of ['A', 'B']) for (let i = 1; i <= per; i++) d.push(`blank_${c}${i}`); }
    else { const c = Math.max(1, Math.round(ACTS[t].base * f)); for (let i = 1; i <= c; i++) d.push(`${t}_${i}`); }
  }
  return X.shuffle(d);
}

function start(room) {
  const n = room.players.length, hard = room.settings.ulevel !== 'normal' && n >= 6;
  const solution = { s: X.pick(X.CARDS.s).id, w: X.pick(X.CARDS.w).id, l: X.pick(X.CARDS.l).id };
  const sol = [solution.s, solution.w, solution.l];
  const deck = X.shuffle([...X.CARDS.s, ...X.CARDS.w, ...X.CARDS.l].map(c => c.id).filter(id => !sol.includes(id)));
  const hands = {}, roles = {}, used = {}, seen = {}, notes = {};
  room.players.forEach(p => { hands[p.id] = []; used[p.id] = { power: false, lie: false, retry: false }; });
  deck.forEach((id, i) => hands[room.players[i % n].id].push(id));
  Object.values(hands).forEach(h => h.sort());
  const ult = { hard, pile: [], discard: [], acts: {}, sub: 'turn', window: null, extra: 0, frameNext: false, noDraw: false, votes: null, lastVote: null, revealed: {}, turnUntil: 0, ansUntil: 0, night: null, hint: null, botTried: {} };
  if (hard) {
    const rs = X.shuffle(roleList(n));
    room.players.forEach((p, i) => (roles[p.id] = rs[i]));
    const pile = buildDeck(n);
    room.players.forEach(p => { ult.acts[p.id] = [pile.pop(), pile.pop()]; });
    ult.pile = pile;
    const wit = room.players.find(p => roles[p.id] === 'witness');
    if (wit) { const other = X.pick(X.CARDS.s.filter(c => c.id !== solution.s)).id; ult.hint = { id: wit.id, sus: X.shuffle([solution.s, other]) }; }
  } else room.players.forEach(p => (ult.acts[p.id] = []));
  room.g = { solution, hands, roles, rolesOn: hard, teamMode: hard, used, seen, notes, elim: {}, turn: 0, round: 1, t: { suggests: 0, max: 1 }, pending: null, over: null, ult };
  room.phase = 'play'; room.log = [];
  X.pub(room, `Ván Ultima (${hard ? 'Khó' : 'Bình thường'}) với ${n} người. ${room.players[0].name} đi trước.`, `Ultima game (${hard ? 'Hard' : 'Normal'}) with ${n} players. ${room.players[0].name} goes first.`);
  if (hard) beginNight(room); else beginTurn(room);
}

// ---------- phases ----------
function alive(room) { return room.players.filter(p => !room.g.elim[p.id]); }
function beginNight(room) {
  const g = room.g, u = g.ult;
  u.sub = 'night'; u.night = { until: now() + NIGHT, pick: null };
  X.pub(room, `🌙 Đêm xuống (vòng ${g.round}).`, `🌙 Night falls (round ${g.round}).`);
}
function resolveNight(room) {
  const g = room.g, u = g.ult, det = room.players.find(p => g.roles[p.id] === 'detective');
  if (det && !g.elim[det.id] && u.night.pick && !g.elim[u.night.pick]) {
    const t = X.byId(room, u.night.pick), sus = g.hands[t.id].filter(c => c[0] === 's');
    (g.notes[det.id] = g.notes[det.id] || []).push(sus.length
      ? { vi: `${t.name} giữ các nghi phạm: ${sus.map(c => X.nm(c).vi).join(', ')} (không phải hung thủ).`, en: `${t.name} holds suspects: ${sus.map(c => X.nm(c).en).join(', ')} (not the murderer).` }
      : { vi: `${t.name} không giữ nghi phạm nào.`, en: `${t.name} holds no suspect cards.` });
  }
  u.night = null; X.pub(room, '☀️ Trời sáng.', '☀️ Day breaks.');
  beginTurn(room);
}
function beginTurn(room) {
  const g = room.g, u = g.ult;
  u.sub = 'turn'; g.t = { suggests: 0, max: 1 }; g.pending = null; u.window = null; u.noDraw = false; u.botTried = {};
  u.turnUntil = now() + (u.hard ? TURN : TURN_N);
}
function firstAlive(room) { const i = room.players.findIndex(p => !room.g.elim[p.id]); return i < 0 ? 0 : i; }
function nextTurn(room) {
  const g = room.g, u = g.ult, n = room.players.length;
  if (room.phase !== 'play') return;
  if (u.extra > 0) { u.extra--; beginTurn(room); X.pub(room, `${room.players[g.turn].name} đi lượt thứ hai liên tiếp (bị Đổ tội).`, `${room.players[g.turn].name} takes a second turn in a row (framed).`); return; }
  let i = g.turn, wrapped = false;
  for (let k = 0; k < n; k++) { i = (i + 1) % n; if (i === 0) wrapped = true; if (!g.elim[room.players[i].id]) break; }
  if (wrapped) { endRound(room); return; }
  g.turn = i;
  if (u.frameNext) { u.frameNext = false; u.extra = 1; }
  beginTurn(room);
}
function endRound(room) {
  const g = room.g, u = g.ult;
  if (u.hard && g.round >= 2 && alive(room).length >= 5) { startVote(room); return; }
  beginRound(room);
}
function beginRound(room) {
  const g = room.g, u = g.ult;
  g.round++;
  if (!u.hard && g.round > room.settings.maxRounds) { X.finish(room, 'none', [], `Hết ${room.settings.maxRounds} vòng. Không ai thắng.`, `${room.settings.maxRounds} rounds passed. Nobody wins.`); return; }
  g.turn = firstAlive(room);
  if (checkEnd(room)) return;
  if (u.frameNext) { u.frameNext = false; u.extra = 1; }
  if (u.hard) beginNight(room); else beginTurn(room);
}
function startVote(room) {
  const g = room.g, u = g.ult, votes = {};
  alive(room).forEach(p => { if (g.roles[p.id] === 'accomplice' && g.round < 5) votes[p.id] = 'abstain'; });
  u.sub = 'vote'; u.votes = { until: now() + VOTE, votes };
  X.pub(room, `🗳️ Họp làng cuối vòng ${g.round}.`, `🗳️ Village meeting at the end of round ${g.round}.`);
}
function resolveVote(room) {
  const g = room.g, u = g.ult, al = alive(room), tally = {};
  for (const p of al) { const v = u.votes.votes[p.id]; if (v && v !== 'abstain') tally[v] = (tally[v] || 0) + 1; }
  const need = Math.floor(al.length / 2) + 1, top = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  let jailed = null;
  if (top.length && top[0][1] >= need && (top.length === 1 || top[1][1] < top[0][1])) jailed = top[0][0];
  u.lastVote = { round: g.round, votes: { ...u.votes.votes }, jailed };
  u.votes = null;
  if (jailed) { X.pub(room, `${X.nameOf(room, jailed)} bị cả làng giam!`, `${X.nameOf(room, jailed)} is jailed by the village!`); eliminate(room, jailed); if (room.phase !== 'play') return; }
  else X.pub(room, 'Không ai bị giam.', 'Nobody is jailed.');
  beginRound(room);
}
function eliminate(room, id) {
  const g = room.g, u = g.ult;
  if (g.elim[id]) return;
  g.elim[id] = true;
  u.revealed[id] = { hand: g.hands[id].slice(), role: g.rolesOn ? g.roles[id] : null };
  (u.acts[id] || []).forEach(c => u.discard.push(c)); u.acts[id] = [];
  X.pub(room, `${X.nameOf(room, id)} bị loại! Bài và vai trò được lật cho cả bàn.`, `${X.nameOf(room, id)} is out! Their cards and role are revealed to everyone.`);
  checkEnd(room);
}
function checkEnd(room) {
  const g = room.g, u = g.ult, al = alive(room).map(p => p.id);
  if (room.phase !== 'play') return true;
  if (u.hard) {
    const good = al.filter(id => TEAMS[g.roles[id]] === 'good'), bad = al.filter(id => TEAMS[g.roles[id]] === 'bad');
    const allGood = room.players.filter(p => TEAMS[g.roles[p.id]] === 'good').map(p => p.id), allBad = room.players.filter(p => TEAMS[g.roles[p.id]] === 'bad').map(p => p.id);
    if (!bad.length) { X.finish(room, 'good', allGood, 'Tất cả Đồng phạm đã bị loại. Phe Thiện thắng!', 'All Accomplices are out. The Good team wins!'); return true; }
    if (!good.length || (g.round >= 3 && bad.length >= good.length)) { X.finish(room, 'bad', allBad, 'Đồng phạm đã áp đảo. Phe Ác thắng!', 'The Accomplices hold the village. The Bad team wins!'); return true; }
  } else {
    if (al.length === 1) { X.finish(room, 'solo', al, `${X.nameOf(room, al[0])} là người cuối cùng còn lại và thắng!`, `${X.nameOf(room, al[0])} is the last one standing and wins!`); return true; }
    if (!al.length) { X.finish(room, 'none', [], 'Tất cả bị loại. Không ai thắng.', 'Everyone is out. Nobody wins.'); return true; }
  }
  return false;
}
function drawFor(room, id) {
  const u = room.g.ult;
  if (!u.pile.length) { const bad = room.players.filter(p => TEAMS[room.g.roles[p.id]] === 'bad').map(p => p.id); X.finish(room, 'bad', bad, 'Chồng bằng chứng đã hết! Phe Ác thắng!', 'The evidence pile ran out! The Bad team wins!'); return false; }
  u.acts[id].push(u.pile.pop());
  X.pub(room, `${X.nameOf(room, id)} rút 1 lá hành động (còn ${u.pile.length} trong chồng).`, `${X.nameOf(room, id)} draws an action card (${u.pile.length} left in the pile).`);
  return true;
}
function endTurn(room) {
  const g = room.g, u = g.ult, me = room.players[g.turn];
  u.window = null;
  if (u.hard && !u.noDraw && !g.elim[me.id]) { if (!drawFor(room, me.id)) return; }
  u.noDraw = false;
  nextTurn(room);
}

// ---------- action-card windows ----------
function startWindow(room, entry) {
  const u = room.g.ult;
  u.window = { chain: [entry], until: now() + WINDOW };
  u.botTried = {};
  X.pub(room, `${X.nameOf(room, entry.by)} chơi "${entry.cards ? 'Giấy trắng ×2' : aname(entry.card).vi}".`, `${X.nameOf(room, entry.by)} plays "${entry.cards ? 'Blank paper ×2' : aname(entry.card).en}".`);
}
function resolveWindow(room) {
  const g = room.g, u = g.ult, w = u.window; if (!w) return;
  u.window = null;
  const cancelled = (w.chain.length - 1) % 2 === 1, e = w.chain[0];
  w.chain.forEach(c => (c.cards || [c.card]).forEach(id => u.discard.push(id)));
  if (cancelled) { X.pub(room, `"${e.cards ? 'Giấy trắng' : aname(e.card).vi}" của ${X.nameOf(room, e.by)} bị hủy!`, `${X.nameOf(room, e.by)}'s "${e.cards ? 'Blank paper' : aname(e.card).en}" is cancelled!`); return; }
  apply(room, e);
}
function apply(room, e) {
  const g = room.g, u = g.ult, me = e.by, t = type(e.card);
  if (g.elim[me]) return;
  if (e.cards) {
    const tg = e.target, pool = u.acts[tg] || [];
    if (!pool.length || g.elim[tg]) { X.pub(room, `${X.nameOf(room, tg)} không có lá hành động nào để lấy.`, `${X.nameOf(room, tg)} has no action cards to take.`); return; }
    const i = X.ri(pool.length), c = pool.splice(i, 1)[0]; u.acts[me].push(c);
    X.pub(room, `${X.nameOf(room, me)} lấy ngẫu nhiên 1 lá hành động của ${X.nameOf(room, tg)}.`, `${X.nameOf(room, me)} takes a random action card from ${X.nameOf(room, tg)}.`);
    return;
  }
  if (t === 'dodge') { u.noDraw = true; X.pub(room, `${X.nameOf(room, me)} lánh mặt, kết thúc lượt không rút bài.`, `${X.nameOf(room, me)} lies low and ends the turn without drawing.`); endTurn(room); return; }
  if (t === 'frame') { u.noDraw = true; u.frameNext = true; X.pub(room, `${X.nameOf(room, me)} đổ tội! Người kế tiếp đi 2 lượt.`, `${X.nameOf(room, me)} frames the next player: they take 2 turns.`); endTurn(room); return; }
  if (t === 'intuition') {
    const top = u.pile.slice(-3).reverse();
    (g.notes[me] = g.notes[me] || []).push({ vi: `Linh cảm: 3 lá trên cùng chồng bằng chứng là ${top.length ? top.map(c => aname(c).vi).join(', ') : '(trống)'}.`, en: `Hunch: top 3 of the evidence pile are ${top.length ? top.map(c => aname(c).en).join(', ') : '(empty)'}.` });
    return;
  }
  if (t === 'shuffle') { u.pile = X.shuffle(u.pile); X.pub(room, 'Hiện trường bị xáo trộn: chồng bằng chứng được xáo lại.', 'The scene is shuffled: the evidence pile is reshuffled.'); return; }
  if (t === 'extra') { g.t.max++; X.pub(room, `${X.nameOf(room, me)} được đưa thêm 1 giả thuyết.`, `${X.nameOf(room, me)} gets an extra suggestion.`); return; }
  if (t === 'interrogate') {
    const tg = X.byId(room, e.target); if (!tg || tg.id === me || g.elim[tg.id]) return;
    const cards = g.hands[tg.id];
    X.pub(room, `${X.nameOf(room, me)} thẩm vấn ${tg.name}.`, `${X.nameOf(room, me)} interrogates ${tg.name}.`);
    if (!cards.length) { (g.notes[me] = g.notes[me] || []).push({ vi: `${tg.name} không còn bài manh mối.`, en: `${tg.name} has no clue cards.` }); return; }
    g.pending = { kind: 'reveal', cat: null, suggester: me, disprover: tg.id, match: cards.slice(), s: null, w: null, l: null, order: [tg.id], pos: 0 };
    u.ansUntil = now() + ANSWER;
  }
  // 'blank' single / 'counter' / 'false' do nothing when resolved
}

// ---------- actions ----------
function act(room, p, a) { const r = actInner(room, p, a); afterAct(room); return r; }
function afterAct(room) {
  const g = room.g; if (!g || room.phase !== 'play' || !g.ult) return;
  const u = g.ult;
  if (!u.hard && u.sub === 'turn' && g.t.suggests >= g.t.max && !g.pending && !u.window) endTurn(room);
}
function actInner(room, p, a) {
  const g = room.g, u = g.ult, E = X.E, me = p.id, myTurn = room.players[g.turn].id === me;
  const out = g.elim[me];
  const A = () => (u.acts[me] || []);
  const reqTurn = () => {
    if (u.sub !== 'turn') return E('Chưa phải lúc.', 'Not now.');
    if (g.pending) return E('Đang chờ người bác bỏ.', 'Waiting for someone to answer.');
    if (u.window) return E('Đang chờ phản đối (5 giây).', 'Waiting for the counter window.');
    if (!myTurn) return E('Chưa đến lượt bạn.', 'It is not your turn.');
    if (out) return E('Bạn đã bị loại.', 'You are eliminated.');
    return null;
  };
  switch (a.type) {
    case 'show': {
      const pd = g.pending;
      if (!pd || pd.disprover !== me) return E('Chưa đến lượt bạn bác bỏ.', 'You are not the one to answer.');
      if (!pd.match.includes(a.card)) return E('Lá bài không hợp lệ.', 'Invalid card.');
      (g.seen[pd.suggester] = g.seen[pd.suggester] || []).push(pd.kind === 'reveal'
        ? { by: me, byName: X.nameOf(room, me), card: a.card, kind: 'reveal', cat: pd.cat }
        : { by: me, byName: X.nameOf(room, me), card: a.card, s: pd.s, w: pd.w, l: pd.l });
      if (pd.h) { pd.h.ans = me; pd.h.done = true; }
      X.pub(room, `${X.nameOf(room, me)} đã bí mật cho ${X.nameOf(room, pd.suggester)} xem 1 lá.`, `${X.nameOf(room, me)} secretly showed ${X.nameOf(room, pd.suggester)} a card.`);
      g.pending = null; return null;
    }
    case 'ult_false': { // Lời khai giả: refuse to show anything
      const pd = g.pending;
      if (!pd || pd.disprover !== me || pd.kind === 'reveal') return E('Chỉ dùng khi phải bác bỏ giả thuyết.', 'Only when you must refute a suggestion.');
      if (g.roles[me] === 'detective') return E('Thám tử không được dùng Lời khai giả.', 'The Detective cannot use False testimony.');
      const c = A().find(x => type(x) === 'false'); if (!c) return E('Bạn không có lá này.', 'You do not have that card.');
      u.acts[me] = A().filter(x => x !== c); u.discard.push(c);
      if (pd.h) pd.h.passed.push(me); pd.pos++;
      X.pub(room, `${X.nameOf(room, me)} dùng Lời khai giả: không cho xem gì.`, `${X.nameOf(room, me)} uses False testimony: shows nothing.`);
      X.findDisprover(room); u.ansUntil = now() + ANSWER;
      if (!pd.disprover) { if (pd.h) pd.h.done = true; X.pub(room, 'Không ai bác bỏ được giả thuyết!', 'Nobody could disprove the suggestion!'); g.pending = null; }
      return null;
    }
    case 'ult_play': {
      const r = reqTurn(); if (r) return r;
      if (!u.hard) return E('Mức Bình thường không có thẻ hành động.', 'No action cards in Normal.');
      if (a.cards) { // blank pair
        const cs = Array.isArray(a.cards) ? a.cards.slice(0, 2) : [];
        if (cs.length !== 2 || cs[0] === cs[1] || !cs.every(c => A().includes(c) && type(c) === 'blank') || cs[0].split('_')[1][0] !== cs[1].split('_')[1][0]) return E('Cần 2 Giấy trắng cùng màu.', 'You need 2 Blank papers of the same colour.');
        const tg = X.byId(room, a.target); if (!tg || tg.id === me || g.elim[tg.id]) return E('Chọn một người khác còn trong ván.', 'Pick another player who is still in.');
        u.acts[me] = A().filter(c => !cs.includes(c));
        startWindow(room, { by: me, card: 'blank', cards: cs, target: tg.id }); return null;
      }
      const c = a.card; if (!A().includes(c)) return E('Bạn không có lá này.', 'You do not have that card.');
      const t = type(c);
      if (t === 'counter' || t === 'false') return E('Lá này chỉ dùng để phản ứng.', 'This card is only used as a reaction.');
      if (t === 'blank') return E('Giấy trắng phải đánh một cặp cùng màu.', 'Blank paper must be played as a same-colour pair.');
      let target = null;
      if (t === 'interrogate') { const tg = X.byId(room, a.target); if (!tg || tg.id === me || g.elim[tg.id]) return E('Chọn một người khác còn trong ván.', 'Pick another player who is still in.'); target = tg.id; }
      u.acts[me] = A().filter(x => x !== c);
      startWindow(room, { by: me, card: c, target }); return null;
    }
    case 'ult_counter': {
      const w = u.window; if (!w) return E('Không có gì để phản đối.', 'Nothing to counter.');
      if (out) return E('Bạn đã bị loại.', 'You are eliminated.');
      const top = w.chain[w.chain.length - 1]; if (top.by === me) return E('Không thể tự phản đối lá của mình.', 'You cannot counter your own card.');
      const c = A().find(x => type(x) === 'counter'); if (!c) return E('Bạn không có Phản đối!', 'You have no Counter!');
      u.acts[me] = A().filter(x => x !== c);
      w.chain.push({ by: me, card: c }); w.until = now() + WINDOW; u.botTried = {};
      X.pub(room, `${X.nameOf(room, me)} PHẢN ĐỐI!`, `${X.nameOf(room, me)} plays COUNTER!`);
      return null;
    }
    case 'ult_night': {
      if (u.sub !== 'night') return E('Không phải ban đêm.', 'It is not night.');
      if (!g.rolesOn || g.roles[me] !== 'detective' || out) return E('Bạn không có quyền ban đêm.', 'You have no night power.');
      const t = X.byId(room, a.target); if (!t || t.id === me || g.elim[t.id]) return E('Chọn một người khác còn trong ván.', 'Pick another player who is still in.');
      u.night.pick = t.id; return null;
    }
    case 'ult_vote': {
      if (u.sub !== 'vote') return E('Chưa họp làng.', 'No village meeting now.');
      if (out) return E('Bạn đã bị loại.', 'You are eliminated.');
      if (g.roles[me] === 'accomplice' && g.round < 5) return E('Đồng phạm chưa được bỏ phiếu trước vòng 5.', 'Accomplices cannot vote before round 5.');
      if (a.target && a.target !== 'abstain') { const t = X.byId(room, a.target); if (!t || t.id === me || g.elim[t.id]) return E('Chọn một người khác còn trong ván.', 'Pick another player who is still in.'); u.votes.votes[me] = t.id; }
      else u.votes.votes[me] = 'abstain';
      if (alive(room).every(x => u.votes.votes[x.id])) resolveVote(room);
      return null;
    }
    case 'ult_arrest': {
      const r = reqTurn(); if (r) return r;
      if (g.roles[me] !== 'police') return E('Chỉ Cảnh sát.', 'Police only.');
      if (g.used[me].power) return E('Bạn đã dùng quyền bắt giữ rồi.', 'You already used your arrest.');
      const t = X.byId(room, a.target); if (!t || t.id === me || g.elim[t.id]) return E('Chọn một người khác còn trong ván.', 'Pick another player who is still in.');
      g.used[me].power = true;
      X.pub(room, `${X.nameOf(room, me)} (Cảnh sát) bắt giữ ${t.name}!`, `${X.nameOf(room, me)} (Police) arrests ${t.name}!`);
      if (g.roles[t.id] === 'accomplice') { X.pub(room, `${t.name} đúng là Đồng phạm!`, `${t.name} is indeed an Accomplice!`); eliminate(room, t.id); }
      else { X.pub(room, `${t.name} vô tội! Cảnh sát bắt nhầm.`, `${t.name} is innocent! The Police got it wrong.`); eliminate(room, me); if (room.phase === 'play' && room.players[g.turn].id === me) nextTurn(room); }
      return null;
    }
    case 'suggest': {
      const r = reqTurn(); if (r) return r;
      if (g.t.suggests >= g.t.max) return E('Bạn đã hết lượt đưa giả thuyết.', 'No suggestions left this turn.');
      if (!X.okCard('s', a.s) || !X.okCard('w', a.w) || !X.okCard('l', a.l)) return E('Chọn đủ 1 nghi phạm, 1 hung khí, 1 địa điểm.', 'Pick 1 suspect, 1 weapon and 1 location.');
      g.t.suggests++;
      X.pub(room, `${X.nameOf(room, me)} đưa ra giả thuyết: ${X.nm(a.s).vi} · ${X.nm(a.w).vi} · ${X.nm(a.l).vi}`, `${X.nameOf(room, me)} suggests: ${X.nm(a.s).en} · ${X.nm(a.w).en} · ${X.nm(a.l).en}`);
      const n = room.players.length, i0 = room.players.findIndex(x => x.id === me), order = [];
      for (let k = 1; k < n; k++) order.push(room.players[(i0 + k) % n].id);
      const h = { n: (g.hist = g.hist || []).length + 1, round: g.round, by: me, s: a.s, w: a.w, l: a.l, passed: [], ans: null, done: false };
      g.hist.push(h);
      g.pending = { suggester: me, s: a.s, w: a.w, l: a.l, order, pos: 0, disprover: null, match: [], h };
      X.findDisprover(room); u.ansUntil = now() + ANSWER;
      if (!g.pending.disprover) { h.done = true; X.pub(room, 'Không ai bác bỏ được giả thuyết!', 'Nobody could disprove the suggestion!'); g.pending = null; }
      return null;
    }
    case 'accuse': {
      const r = reqTurn(); if (r) return r;
      const role = g.roles[me];
      if (role === 'accomplice' && g.round < 3) return E('Đồng phạm chỉ được chiếm đáp án từ vòng 3.', 'The Accomplice can only seize the answer from round 3.');
      if (!X.okCard('s', a.s) || !X.okCard('w', a.w) || !X.okCard('l', a.l)) return E('Chọn đủ 1 nghi phạm, 1 hung khí, 1 địa điểm.', 'Pick 1 suspect, 1 weapon and 1 location.');
      const ok = a.s === g.solution.s && a.w === g.solution.w && a.l === g.solution.l;
      X.pub(room, `${X.nameOf(room, me)} buộc tội: ${X.nm(a.s).vi} · ${X.nm(a.w).vi} · ${X.nm(a.l).vi}`, `${X.nameOf(room, me)} accuses: ${X.nm(a.s).en} · ${X.nm(a.w).en} · ${X.nm(a.l).en}`);
      if (ok) {
        if (!u.hard) X.finish(room, 'solo', [me], `${X.nameOf(room, me)} buộc tội đúng và thắng!`, `${X.nameOf(room, me)} is right and wins!`);
        else if (role === 'accomplice') X.finish(room, 'bad', room.players.filter(x => TEAMS[g.roles[x.id]] === 'bad').map(x => x.id), `${X.nameOf(room, me)} là Đồng phạm và đã chiếm được đáp án! Phe Ác thắng!`, `${X.nameOf(room, me)} is an Accomplice and seized the answer! The Bad team wins!`);
        else X.finish(room, 'good', room.players.filter(x => TEAMS[g.roles[x.id]] === 'good').map(x => x.id), `${X.nameOf(room, me)} buộc tội đúng! Phe Thiện thắng!`, `${X.nameOf(room, me)} is right! The Good team wins!`);
        return null;
      }
      X.pub(room, `Sai! ${X.nameOf(room, me)} bị loại.`, `Wrong! ${X.nameOf(room, me)} is out.`);
      eliminate(room, me);
      if (room.phase === 'play') nextTurn(room);
      return null;
    }
    case 'end': {
      const r = reqTurn(); if (r) return r;
      endTurn(room); return null;
    }
  }
  return E('Hành động không hợp lệ.', 'Unknown action.');
}

// ---------- timers (called ~2x/second) ----------
function tick(room) {
  if (room.phase !== 'play' || !room.g || !room.g.ult) return false;
  const g = room.g, u = g.ult, t = now();
  let ch = false;
  if (u.sub === 'night' && u.night && t >= u.night.until) { resolveNight(room); ch = true; }
  else if (u.sub === 'vote' && u.votes && t >= u.votes.until) { resolveVote(room); ch = true; }
  else if (u.window && t >= u.window.until) { resolveWindow(room); ch = true; }
  else if (g.pending && g.pending.disprover && t >= u.ansUntil && room.players.find(p => p.id === g.pending.disprover && !p.bot)) {
    const pd = g.pending; act(room, X.byId(room, pd.disprover), { type: 'show', card: pd.match[0] }); ch = true;
  } else if (u.sub === 'turn' && !g.pending && !u.window && u.turnUntil && t >= u.turnUntil) {
    X.pub(room, `Hết giờ! ${room.players[g.turn].name} bị tự động kết thúc lượt.`, `Time's up! ${room.players[g.turn].name}'s turn ends automatically.`); endTurn(room); ch = true;
  }
  return ch;
}

// ---------- view ----------
function view(room, me, v) {
  const g = room.g, u = g.ult, t = now(), left = ms => Math.max(0, Math.ceil((ms - t) / 100) / 10);
  v.rolesOn = g.rolesOn; v.teamMode = g.teamMode;
  if (u.hard) v.maxRounds = 0;
  v.players.forEach(p => { p.acts = (u.acts[p.id] || []).length; });
  const secrets = [];
  if (g.rolesOn) {
    const r = g.roles[me.id];
    if (r === 'forensic') secrets.push(g.solution.w);
    if (r === 'police') secrets.push(g.solution.l);
    if (r === 'accomplice') secrets.push(g.solution.s, g.solution.w);
  }
  v.secrets = secrets;
  v.used = g.used[me.id];
  if (g.turn !== undefined && !g.elim[room.players[g.turn].id] && !g.pending && !u.window && u.sub === 'turn' && u.turnUntil) v.turnLeft = left(u.turnUntil);
  const w = u.window;
  v.ult = {
    hard: u.hard, sub: u.sub, myActs: (u.acts[me.id] || []).slice(), pile: u.pile.length, discard: u.discard.length,
    hint: u.hint && u.hint.id === me.id ? u.hint.sus : null,
    revealed: u.revealed,
    window: w ? { chain: w.chain.map(c => ({ by: c.by, card: c.card, cards: c.cards || null, target: c.target || null })), left: left(w.until) } : null,
    night: u.night ? { left: left(u.night.until), amDet: g.roles[me.id] === 'detective' && !g.elim[me.id], picked: u.night.pick && g.roles[me.id] === 'detective' ? u.night.pick : null } : null,
    vote: u.votes ? { left: left(u.votes.until), voted: Object.keys(u.votes.votes), mine: u.votes.votes[me.id] || null, can: !g.elim[me.id] && !(g.roles[me.id] === 'accomplice' && g.round < 5) } : null,
    lastVote: u.lastVote, ansLeft: g.pending && g.pending.disprover ? left(u.ansUntil) : null
  };
}

// ---------- bots ----------
const hasAct = (room, id, t) => (room.g.ult.acts[id] || []).some(c => type(c) === t);
function botActor(room) {
  const g = room.g, u = g.ult;
  if (g.pending) { const d = X.byId(room, g.pending.disprover); return d && d.bot ? d : null; }
  if (u.sub === 'night') return room.players.find(p => p.bot && !g.elim[p.id] && g.roles[p.id] === 'detective' && !u.night.pick) || null;
  if (u.sub === 'vote') return room.players.find(p => p.bot && !g.elim[p.id] && !u.votes.votes[p.id]) || null;
  if (u.window) {
    const top = u.window.chain[u.window.chain.length - 1], k = u.window.chain.length;
    return room.players.find(p => p.bot && !g.elim[p.id] && p.id !== top.by && hasAct(room, p.id, 'counter') && u.botTried[p.id] !== k) || null;
  }
  const cur = room.players[g.turn]; return cur && cur.bot && !g.elim[cur.id] ? cur : null;
}
function botStep(room, p, v, b) {
  const g = room.g, u = g.ult, go = x => X.act(room, p, x), others = () => room.players.filter(x => x.id !== p.id && !g.elim[x.id]);
  if (g.pending) { const pd = v.pending; if (!pd.match) return; const falseC = (u.acts[p.id] || []).find(c => type(c) === 'false'); if (falseC && pd.kind !== 'reveal' && g.roles[p.id] !== 'detective' && Math.random() < 0.3) { if (!go({ type: 'ult_false' })) return; }
    const prev = (b.shown[pd.suggester] || []).find(c => pd.match.includes(c)); const c = prev || X.pick(pd.match); (b.shown[pd.suggester] = b.shown[pd.suggester] || []).push(c); go({ type: 'show', card: c }); return; }
  if (u.sub === 'night') { go({ type: 'ult_night', target: X.pick(others()).id }); return; }
  if (u.sub === 'vote') {
    const bad = g.roles[p.id] === 'accomplice';
    const pool = others().filter(x => bad ? TEAMS[g.roles[x.id]] === 'good' : true);
    go({ type: 'ult_vote', target: pool.length && Math.random() < 0.6 ? X.pick(pool).id : 'abstain' }); return;
  }
  if (u.window) { u.botTried[p.id] = u.window.chain.length; if (Math.random() < 0.4) go({ type: 'ult_counter' }); return; }
  // my turn
  const late = g.round >= 3 && g.roles[p.id] === 'accomplice';
  const fin = r => { if (r) go({ type: 'end' }); };
  if (b.sure()) return fin(go({ type: 'accuse', s: b.cand('s')[0], w: b.cand('w')[0], l: b.cand('l')[0] }));
  if (late && g.round >= 6 && Math.random() < 0.4) return fin(go({ type: 'accuse', s: b.cand('s')[0], w: b.cand('w')[0], l: X.pick(b.cand('l')) }));
  const acts = u.acts[p.id] || [];
  const botPlayed = u.botPlayed = u.botPlayed || {};
  if (u.hard && g.t.suggests === 0 && botPlayed[p.id] !== g.round + ':' + g.turn) {
    botPlayed[p.id] = g.round + ':' + g.turn;
    const get = t => acts.find(c => type(c) === t);
    if (g.roles[p.id] === 'police' && !g.used[p.id].power && g.round >= 3 && Math.random() < 0.25) { go({ type: 'ult_arrest', target: X.pick(others()).id }); return; }
    if (get('interrogate') && Math.random() < 0.5) { go({ type: 'ult_play', card: get('interrogate'), target: X.pick(others()).id }); return; }
    if (get('extra') && Math.random() < 0.5) { go({ type: 'ult_play', card: get('extra') }); return; }
    if (get('intuition') && Math.random() < 0.3) { go({ type: 'ult_play', card: get('intuition') }); return; }
    const bl = acts.filter(c => type(c) === 'blank'), pair = bl.length > 1 && bl.map(c => [c, bl.find(d => d !== c && d.split('_')[1][0] === c.split('_')[1][0])]).find(x => x[1]);
    if (pair && Math.random() < 0.5) { go({ type: 'ult_play', cards: pair, target: X.pick(others().filter(x => (u.acts[x.id] || []).length)).id || others()[0].id }); return; }
  }
  if (g.t.suggests < g.t.max) {
    const sg = { s: X.pick(b.cand('s')), w: X.pick(b.cand('w')), l: X.pick(b.cand('l')) };
    b.aw = { ...sg, seenLen: v.seen.length };
    return fin(go({ type: 'suggest', ...sg }));
  }
  if (u.hard && !g.pending) { const fr = acts.find(c => type(c) === 'frame'); if (fr && Math.random() < 0.3) { go({ type: 'ult_play', card: fr }); return; } const dg = acts.find(c => type(c) === 'dodge'); if (dg && Math.random() < 0.15) { go({ type: 'ult_play', card: dg }); return; } }
  go({ type: 'end' });
}

module.exports = { init, start, act, tick, view, botActor, botStep, nextTurn, ACTS, TEAMS, type };

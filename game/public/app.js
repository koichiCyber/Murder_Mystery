'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let CARDS = null, BY = {}, ROLES = {};
const S = { session: null, v: null, lang: (localStorage.mm_lang === 'en' ? 'en' : 'vi'), sel: { s: null, w: null, l: null }, es: null, nb: {}, pw: { target: '', cat: 's' }, prevPhase: null, prevSeen: 0, shownRole: false };
try { S.session = JSON.parse(localStorage.mm_session || 'null'); } catch (e) {}

function T(vi, en) { return esc(S.lang === 'en' ? en : vi); }
const TL = (vi, en) => (S.lang === 'en' ? en : vi);
const LN = c => (S.lang === 'en' ? c.en : c.vi);
const TAG_EN = { 'Người thừa kế cả cơ ngơi.': 'Heir to the whole estate.', 'Dao thớt không rời tay.': 'Never without his cleaver.', 'Biết quá nhiều bí mật.': 'Knows far too many secrets.', 'Nắm đất nào cũng có chuyện.': 'Every patch of soil has a story.', 'Tay vững, lời khai càng vững.': 'Steady hands, steadier testimony.', 'Quen sóng gió sông Cửu Long.': 'Used to the storms of the Mekong.',
  'Đồng nặng, còn ấm hơi lửa.': 'Heavy brass, still warm from the flame.', 'Một chén là đủ.': 'One cup is enough.', 'Chắc, thô, một nút thắt.': 'Strong, rough, one knot.', 'Đá nặng, giã cả đời.': 'Heavy stone, pounded for a lifetime.', 'Bản to, lưỡi sắc.': 'Broad blade, sharp edge.', 'Tiếng vang cả làng.': 'Echoes across the village.',
  'Im lặng, gần như vậy.': 'Quiet, almost.', 'Nơi lửa và dao gặp nhau.': 'Where fire and knives meet.', 'Mặt nước giấu nhiều chuyện.': 'The water hides much.', 'Lạnh, tối, men say.': 'Cold, dark, heady with wine.', 'Khói hương và lời thề.': 'Incense smoke and vows.', 'Nơi mọi chuyện đều lộ ra.': 'Where everything comes to light.', 'Bụi và những rương cũ.': 'Dust and old trunks.', 'Mùi xăng nhớt.': 'The smell of petrol and oil.', 'Tiếng chuông, tiếng thì thầm.': 'Bells and whispers.' };
const KA = { s: ['NGHI PHẠM', 'SUSPECT'], w: ['HUNG KHÍ', 'WEAPON'], l: ['ĐỊA ĐIỂM', 'LOCATION'] };
function toast(vi, en) {
  const d = document.createElement('div'); d.innerHTML = T(vi, en); $('#toast').appendChild(d);
  setTimeout(() => d.remove(), 3500);
}
const KIND = { s: { c: '#A3212B', a: 'NGHI PHẠM', b: 'SUSPECT' }, w: { c: '#23366B', a: 'HUNG KHÍ', b: 'WEAPON' }, l: { c: '#1F6E5C', a: 'ĐỊA ĐIỂM', b: 'LOCATION' } };
const CATN = { s: ['Nghi phạm', 'Suspects'], w: ['Hung khí', 'Weapons'], l: ['Địa điểm', 'Locations'] };

function cardHTML(id, scale = 1, cls = '', onclick = '') {
  const c = BY[id], k = KIND[id[0]];
  return `<div class="cw ${cls}" data-cid="${id}" ${onclick ? `onclick="${onclick}"` : ''} style="width:${232 * scale}px;height:${325 * scale}px"><div class="card" style="--c:${k.c};transform:scale(${scale})"><div class="hd"><span>${KA[id[0]][S.lang === 'en' ? 1 : 0]}</span></div><div class="art">${c.svg}</div><div class="bd"><div class="nm">${esc(LN(c))}</div><div class="rule"></div><div class="tg">${esc(S.lang === 'en' ? (TAG_EN[c.tag] || '') : c.tag)}</div></div></div></div>`;
}
function roleHTML(rid, scale = 1, teamMode = true) {
  const r = ROLES[rid]; if (!r) return '';
  const en = S.lang === 'en';
  const team = r.team === 'none' ? (en ? 'NOT DEALT' : 'KHÔNG PHÁT') : !teamMode ? (en ? 'SOLO' : 'MỘT MÌNH') : r.team === 'good' ? (en ? 'GOOD TEAM' : 'PHE THIỆN') : (en ? 'BAD TEAM' : 'PHE ÁC');
  return `<div class="cw" style="width:${232 * scale}px;height:${325 * scale}px"><div class="card" style="--c:#4B2E5E;transform:scale(${scale})"><div class="hd"><span>${en ? 'ROLE' : 'VAI TRÒ'}</span><span>${team}</span></div><div class="art r">${r.svg}</div><div class="bd"><div class="nm">${esc(en ? r.en : r.vi)}</div><div class="rule"></div><div class="ab">${esc(en ? r.ab_en : r.ab_vi)}</div></div></div></div>`;
}
const cname = id => BY[id] ? esc(LN(BY[id])) : '';

// ---------- network ----------
async function api(type, data = {}) {
  const r = await fetch('/api/action', { method: 'POST', body: JSON.stringify({ ...data, type, code: S.session.code, token: S.session.token }) });
  const j = await r.json();
  if (j.error) toast(j.error.vi, j.error.en);
  return j;
}
function saveSession(s) { S.session = s; localStorage.mm_session = JSON.stringify(s); }
function stopLive() { if (S.es) S.es.close(); S.es = null; if (S.poll) clearInterval(S.poll); S.poll = null; }
function leave() { stopLive(); S.session = null; S.v = null; S.raw = ''; localStorage.removeItem('mm_session'); render(); }
function applyRaw(txt) { if (txt === S.raw) return; S.raw = txt; S.v = JSON.parse(txt); onState(); }
async function pollOnce() {
  if (!S.session) return;
  const { code, token } = S.session;
  try {
    const r = await fetch(`/api/state?code=${code}&token=${token}`, { cache: 'no-store' });
    if (r.status === 404) { toast('Phòng không còn tồn tại.', 'That room no longer exists.'); return leave(); }
    if (r.ok) applyRaw(await r.text());
  } catch (e) {}
}
function connect() {
  stopLive();
  const { code, token } = S.session;
  // Cloudflare Quick Tunnels do not support Server-Sent Events, so poll there.
  const tunnel = /trycloudflare\.com$/i.test(location.hostname);
  if (!tunnel && window.EventSource) {
    S.es = new EventSource(`/api/events?code=${code}&token=${token}`);
    S.es.onmessage = e => applyRaw(e.data);
    S.es.onerror = () => { pollOnce(); };
  }
  pollOnce();
  S.poll = setInterval(pollOnce, tunnel ? 1500 : 5000);
}
async function createRoom() {
  const name = $('#name').value; const r = await fetch('/api/create', { method: 'POST', body: JSON.stringify({ name }) }); const j = await r.json();
  if (j.error) return toast(j.error.vi, j.error.en); saveSession(j); connect();
}
async function joinRoom() {
  const name = $('#name').value, code = $('#code').value.trim().toUpperCase();
  const r = await fetch('/api/join', { method: 'POST', body: JSON.stringify({ name, code }) }); const j = await r.json();
  if (j.error) return toast(j.error.vi, j.error.en); saveSession(j); connect();
}

// ---------- state hooks ----------
function nbKey() { return `mm_nb_${S.session.code}_${S.session.id}`; }
function onState() {
  const v = S.v;
  if (v.phase === 'play') {
    const gk = 'mm_game_' + v.code, sig = (v.hand || []).join(',');
    if (localStorage.getItem(gk) !== sig) { localStorage.setItem(gk, sig); S.nb = {}; localStorage.removeItem(nbKey()); S.sel = { s: null, w: null, l: null }; S.shownRole = false; S.prevSeen = v.seen.length; S.lastAns = null; }
  }
  if (v.phase === 'play') {
    const h = (v.hist || [])[(v.hist || []).length - 1], key = h && h.ans ? h.n + ':' + h.ans : '';
    if (key && key !== S.lastAns && S.prevPhase === 'play' && S.lastAns !== undefined) flyBack(h);
    S.lastAns = key || (h ? h.n + ':' : '');
  }
  if (v.phase === 'play' && !S.shownRole) { S.shownRole = true; const fk = 'mm_intro_' + v.code + '_' + (v.hand || []).join(''); if (!sessionStorage.getItem(fk)) { sessionStorage.setItem(fk, 1); showHandIntro(); } }
  if (v.phase === 'play' && S.prevPhase === 'play' && v.seen.length > S.prevSeen) { const s = v.seen[v.seen.length - 1]; setTimeout(() => revealCard(s.card, s.byName), 1700); }
  if (v.phase === 'play') S.prevSeen = v.seen.length;
  S.prevPhase = v.phase;
  render();
}
function revealCard(id, by) {
  let el = document.getElementById('reveal'); if (el) el.remove();
  el = document.createElement('div'); el.id = 'reveal';
  el.innerHTML = `<div class="rv-box"><div class="rv-t">${T(`${esc(by)} cho bạn xem`, `${esc(by)} shows you`)}</div><div class="rv-flip"><div class="rv-in"><div class="rv-back"><span>?</span></div><div class="rv-front">${cardHTML(id, 1)}</div></div></div><div class="rv-n">${cname(id)}</div><div class="rv-h">${T('Chạm để đóng', 'Tap to close')}</div></div>`;
  el.onclick = () => { el.classList.add('out'); setTimeout(() => el.remove(), 350); };
  document.body.appendChild(el);
  setTimeout(() => { if (el.isConnected) el.onclick(); }, 5000);
}
function nbLoad() { try { S.nb = JSON.parse(localStorage.getItem(nbKey()) || '{}'); } catch (e) { S.nb = {}; } }

// ---------- modals ----------
function closeModal() { $('#modal').innerHTML = ''; }
function showHandIntro() {
  const v = S.v; if (!v) return;
  $('#modal').innerHTML = `<div class="back intro"><div class="box wide"><h2>${T('Manh mối trong tay bạn', 'Clues in your hand')}</h2><div class="sub"><b>${T('Không phải đáp án', 'Not the answer')}</b>, ${T('sổ tay đã gạch.', 'already crossed out in your notebook.')}</div><div class="hgrid">${v.hand.map((id, i) => `<div class="hc" style="animation-delay:${i * 0.12}s">${cardHTML(id, 0.62)}</div>`).join('')}</div><div class="tipbox"><b>${T('Mẹo:', 'Tip:')}</b> ${T('hỏi về những lá chưa bị gạch.', 'ask about cards that are not crossed out.')}</div><button class="btn big" onclick="closeModal();${v.myRole ? 'showRole()' : ''}">${v.myRole ? T('Xem vai trò bí mật', 'See my secret role') : T('Bắt đầu', 'Start')}</button></div></div>`;
}
function showRole() {
  const v = S.v; if (!v || !v.myRole) return;
  const sec = v.secrets.map(id => cardHTML(id, 0.55)).join('');
  const why = v.myRole === 'witness' ? T('Bạn đã thấy hiện trường: đây là ĐỊA ĐIỂM của vụ án.', 'You saw the scene: this is the crime LOCATION.')
    : v.myRole === 'accomplice' ? T(`Bạn biết Hung thủ (NGHI PHẠM)${v.cfg.accWeapon ? ' và HUNG KHÍ' : ''} của vụ án. Chỉ được chiếm đáp án từ vòng ${v.teamMode ? v.cfg.accSeizeTeam : v.cfg.accSeizeFfa}.${v.cfg.accWithhold ? '' : ' Không được giấu lá.'}`, `You know the Murderer (SUSPECT)${v.cfg.accWeapon ? ' and the WEAPON' : ''}. You may seize the answer from round ${v.teamMode ? v.cfg.accSeizeTeam : v.cfg.accSeizeFfa}.${v.cfg.accWithhold ? '' : ' You cannot withhold cards.'}`) : '';
  $('#modal').innerHTML = `<div class="back" onclick="if(event.target===this)closeModal()"><div class="box"><h3 style="margin-bottom:10px">${T('Vai trò bí mật của bạn', 'Your secret role')}</h3><div class="row" style="align-items:flex-start;justify-content:center">${roleHTML(v.myRole, 0.9, v.teamMode)}</div>${sec ? `<div style="margin-top:12px">${why}</div><div class="cards" style="margin-top:8px;justify-content:center">${sec}</div>` : ''}<div style="margin-top:14px;text-align:center"><button class="btn" onclick="closeModal()">${T('Đã hiểu — ẩn đi', 'Got it — hide')}</button></div></div></div>`;
}
function showRules() {
  const v = S.v;
  const rs = ['detective', 'witness', 'reporter', 'police', 'innocent', 'accomplice', 'murderer'].map(id => `<div style="margin:8px 0"><b>${esc(LN(ROLES[id]))}</b><div>${esc(S.lang === 'en' ? ROLES[id].ab_en : ROLES[id].ab_vi)}</div></div>`).join('');
  $('#modal').innerHTML = `<div class="back" onclick="if(event.target===this)closeModal()"><div class="box"><h3>${T('Luật chơi', 'How to play')}</h3>
  <p>${T('Mỗi lượt: đưa ra một giả thuyết (nghi phạm + hung khí + địa điểm). Người kế tiếp có ít nhất một lá trùng sẽ bí mật cho bạn xem 1 lá. Khi chắc chắn, buộc tội: đúng thì thắng, sai thì bị loại (vẫn phải cho xem bài).', 'Each turn: make a suggestion (suspect + weapon + location). The next player holding a matching card secretly shows you one. When you are sure, accuse: right wins, wrong eliminates you (you still show cards).')}</p>
  <p>${v && v.rolesOn && !v.teamMode ? T('Chế độ Một mình: không chia phe. Ai buộc tội đúng đầu tiên thắng một mình; sai thì bị loại. Còn lại một người cuối cùng thì người đó thắng. Hết số vòng mà chưa ai đúng thì không ai thắng. Vai trò vẫn có quyền như bình thường.', 'Free-for-all: no teams. The first correct accusation wins alone; a wrong one eliminates you. The last player standing wins. If the round limit passes, nobody wins. Roles keep their powers.') : T('Có vai trò: phe Thiện thắng khi có người buộc tội đúng. Đồng phạm thắng nếu hết số vòng mà chưa ai đúng, nếu phe Thiện bị loại hết, hoặc nếu Đồng phạm tự đoán đúng đáp án (chiếm đáp án). Đồng phạm bị loại thì phe Thiện thắng.', 'With roles: Good wins on a correct accusation. The Accomplice wins if the round limit passes, all Good players are out, or the Accomplice seizes the right answer. If the Accomplice is eliminated, Good wins.')}</p>${rs}
  <div style="text-align:center;margin-top:12px"><button class="btn" onclick="closeModal()">OK</button></div></div></div>`;
}
function toggleNB() { S.nbOpen = !S.nbOpen; render(); }

// ---------- notebook ----------
const AVC = [['#F2C9A0', '#2A2A33', '#2E9D7B'], ['#E8B792', '#7A3A1C', '#C23B3B'], ['#F6D3B3', '#E3B94E', '#23366B'], ['#C98F63', '#1B1A2E', '#8B5CF6'], ['#EBC19C', '#B3401E', '#E3B94E'], ['#D9A073', '#3A2A20', '#0EA5A5']];
function avatar(i, px = 56) {
  const [sk, hr, sh] = AVC[i % AVC.length];
  return `<svg viewBox="0 0 56 56" width="${px}" height="${px}" style="display:block;border-radius:10px;background:#cfe3d6"><rect width="56" height="56" fill="${sh}" fill-opacity=".35"/><path d="M6 56 Q8 40 28 38 Q48 40 50 56Z" fill="${sh}"/><rect x="23" y="32" width="10" height="9" fill="${sk}"/><ellipse cx="28" cy="24" rx="12" ry="13" fill="${sk}"/><path d="M15 22 Q16 8 28 8 Q41 8 41 22 Q36 14 28 15 Q20 14 15 22Z" fill="${hr}"/><circle cx="23" cy="25" r="1.8" fill="#1B1A2E"/><circle cx="33" cy="25" r="1.8" fill="#1B1A2E"/><path d="M24 31 Q28 34 32 31" stroke="#8A3A32" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
}
function computeNB() {
  const v = S.v, P = v.players, me = v.me;
  const cells = {}, holder = {}, solved = {};
  const all = [...CARDS.s, ...CARDS.w, ...CARDS.l].map(c => c.id);
  all.forEach(id => (cells[id] = {}));
  const setHas = (c, p) => { holder[c] = p; cells[c][p] = 'has'; };
  (v.hand || []).forEach(c => setHas(c, me));
  const seenSet = {};
  (v.seen || []).forEach(s => { seenSet[s.card + '|' + s.by] = 1; if (!holder[s.card]) setHas(s.card, s.by); });
  (v.secrets || []).forEach(c => (solved[c] = true));
  const hist = v.hist || [];
  for (let it = 0; it < 6; it++) {
    let ch = false;
    const mark = (c, p, val) => { if (!cells[c][p]) { cells[c][p] = val; ch = true; } };
    // passed = does not hold any of the three
    hist.forEach(h => h.passed.forEach(p => [h.s, h.w, h.l].forEach(c => { if (cells[c][p] !== 'has') mark(c, p, 'no'); })));
    // known holder => everyone else no
    all.forEach(c => { if (holder[c]) P.forEach(p => { if (p.id !== holder[c]) mark(c, p.id, 'no'); }); });
    // solution cards: nobody holds them
    all.forEach(c => { if (solved[c]) P.forEach(p => mark(c, p.id, 'no')); });
    // full hands
    P.forEach(p => { const n = all.filter(c => cells[c][p.id] === 'has').length; if (n >= p.cards) all.forEach(c => mark(c, p.id, 'no')); });
    // answered suggestions
    hist.forEach(h => {
      if (!h.ans) return; const d = h.ans, cs = [h.s, h.w, h.l];
      if (cs.some(c => cells[c][d] === 'has')) return;
      const cand = cs.filter(c => cells[c][d] !== 'no' && (!holder[c] || holder[c] === d) && !solved[c]);
      if (cand.length === 1) { setHas(cand[0], d); ch = true; }
      else cand.forEach(c => { if (!cells[c][d]) { cells[c][d] = 'maybe'; ch = true; } });
    });
    // a card nobody can hold (all players no) => answer
    all.forEach(c => { if (!holder[c] && !solved[c] && P.every(p => cells[c][p.id] === 'no')) { solved[c] = true; ch = true; } });
    // last unknown in category => answer
    for (const k of ['s', 'w', 'l']) {
      const un = CARDS[k].map(c => c.id).filter(c => !holder[c]);
      if (un.length === 1 && !solved[un[0]]) { solved[un[0]] = true; ch = true; }
    }
    if (!ch) break;
  }
  return { cells, holder, solved, seenSet };
}
function notebookHTML() {
  const v = S.v, P = v.players, { cells, holder, solved, seenSet } = computeNB();
  const pd = v.pending, wait = {};
  if (pd && pd.kind !== 'reveal') { const rest = [pd.disprover, ...pd.order.slice(pd.pos + 1)].filter(Boolean); [pd.s, pd.w, pd.l].forEach(c => rest.forEach(p => (wait[c + '|' + p] = 1))); }
  const short = (p, i) => p.id === v.me ? T('Bạn', 'You') : esc(p.name.length > 5 ? p.name.slice(0, 5) : p.name);
  let h = `<div class="nbt"><div class="nbh" style="grid-template-columns:minmax(0,1fr) repeat(${P.length},34px)"><span></span>${P.map((p, i) => `<span class="${p.elim ? 'el' : ''}">${avatar(i, 26)}<i>${short(p, i)}</i></span>`).join('')}</div>`;
  for (const k of ['s', 'l', 'w']) {
    h += `<div class="nbg g${k}">${T(CATN[k][0], CATN[k][1])}</div>`;
    for (const c of CARDS[k]) {
      const sol = solved[c.id], held = !!holder[c.id];
      h += `<div class="nbr ${held ? 'held' : ''} ${sol ? 'sol' : ''}" style="grid-template-columns:minmax(0,1fr) repeat(${P.length},34px)"><span class="nm">${sol ? '★ ' : ''}${esc(LN(c))}</span>` + P.map(p => {
        const st = cells[c.id][p.id], man = S.nb[c.id + '|' + p.id];
        let sym = '', cl = '';
        if (st === 'has') { sym = seenSet[c.id + '|' + p.id] ? '🔍' : '✓'; cl = 'has' + (p.id === v.me ? ' me' : ''); } else if (st === 'no') { sym = '✕'; cl = 'no'; } else if (st === 'maybe') { sym = '?'; cl = 'maybe'; }
        else if (man === 'x') { sym = '✕'; cl = 'no man'; } else if (man === 'q') { sym = '?'; cl = 'maybe man'; } else if (man === 'v') { sym = '✓'; cl = 'has man'; }
        return `<button class="nbc ${cl} ${wait[c.id + '|' + p.id] ? 'wait' : ''}" onclick="nbCycle('${c.id}|${p.id}')">${sym}</button>`;
      }).join('') + '</div>';
    }
  }
  h += `</div><div class="nbl"><span><b class="has">✓</b> ${T('có lá', 'holds')}</span><span><b class="no">✕</b> ${T('không có', 'does not')}</span><span><b class="maybe">?</b> ${T('có thể có', 'maybe')}</span><span><b>★</b> ${T('đáp án', 'answer')}</span><span><s>${T('tên', 'name')}</s> ${T('đã có người giữ', 'held by someone')}</span></div>`;
  if (v.notes.length) h += `<div class="nbn">${v.notes.map(n => `<div class="note">${T(n.vi, n.en)}</div>`).join('')}</div>`;
  return h;
}
function nbCycle(id) {
  const o = ['', 'x', 'q', 'v'], cur = S.nb[id] || '';
  S.nb[id] = o[(o.indexOf(cur) + 1) % o.length];
  localStorage.setItem(nbKey(), JSON.stringify(S.nb)); render();
}
function pick(k, id) {
  S.sel[k] = S.sel[k] === id ? null : id;
  if (S.sel[k] && S.wiz) { const nx = ['s', 'l', 'w'].find(x => !S.sel[x]); S.wiz.step = nx || k; }
  render();
}
function wizOpen(mode) { S.wiz = { mode, step: 's' }; S.sel = { s: null, w: null, l: null }; render(); }
function wizClose() { S.wiz = null; S.sel = { s: null, w: null, l: null }; render(); }
function wizStep(k) { if (S.wiz) { S.wiz.step = k; render(); } }
function wizGo() { const m = S.wiz.mode; if (m === 'suggest') { doSuggest(); } else doAccuse(); }
function outSet() { // cards ruled out by notebook / hand
  const v = S.v, nb = computeNB(), out = new Set(v.hand);
  Object.keys(nb.holder).forEach(c => out.add(c));
  Object.keys(S.nb).forEach(c => { if (S.nb[c] === 'x') out.add(c); });
  return out;
}
function wizHTML(v) {
  const w = S.wiz, out = outSet(), mine = new Set(v.hand);
  const ord = ['s', 'l', 'w'], Q = { s: ['Ai?', 'Who?'], l: ['Ở đâu?', 'Where?'], w: ['Bằng gì?', 'With what?'] };
  const kn = { s: [T('Nghi phạm', 'Suspect'), 'NGHI PHẠM', 'SUSPECT'], l: [T('Địa điểm', 'Location')], w: [T('Hung khí', 'Weapon')] };
  const slots = ord.map(k => { const id = S.sel[k], c = id ? BY[id] : null, cur = w.step === k;
    return `<div class="slot ${cur ? 'cur' : ''} ${k}" onclick="wizStep('${k}')"><div class="sh">${T(CATN[k][0].toUpperCase(), CATN[k][1].toUpperCase())}</div><div class="sb">${c ? `<div class="sart">${c.svg}</div>` : '<span class="q">?</span>'}</div><div class="sn">${c ? esc(LN(c)) : T(Q[k][0], Q[k][1])}</div>${c ? '<i class="ok">✓</i>' : ''}</div>`; }).join('');
  const k = w.step, left = CARDS[k].filter(c => !out.has(c.id)).length;
  const lab = { s: [T('Chọn nghi phạm', 'Choose the suspect'), T('người', 'suspects')], l: [T('Chọn địa điểm', 'Choose the location'), T('nơi', 'locations')], w: [T('Chọn hung khí', 'Choose the weapon'), T('món', 'weapons')] }[k];
  const grid = CARDS[k].map(c => `<div class="wc ${S.sel[k] === c.id ? 'sel' : ''} ${out.has(c.id) ? 'out' : ''}" onclick="pick('${k}','${c.id}')">${cardHTML(c.id, 0.62)}${mine.has(c.id) ? `<b class="yours">${T('CỦA BẠN', 'YOURS')}</b>` : ''}${S.sel[k] === c.id ? '<i class="tick">✓</i>' : ''}</div>`).join('');
  const seize = v.teamMode && v.myRole === 'accomplice', acc = w.mode === 'accuse';
  const go = acc ? (seize ? T('Chiếm đáp án', 'Seize the answer') : T('Buộc tội', 'Accuse')) : T('Đưa ra giả thuyết', 'Suggest');
  return `<div class="wiz"><div class="wt">${acc ? (seize ? T('Chiếm đáp án', 'Seize the answer') : T('Buộc tội', 'Accuse')) : T('Giả thuyết', 'Suggestion')}</div><div class="slots">${slots}</div>
  <div class="wp"><b>${lab[0]}</b>, ${T(`còn ${left} ${lab[1]} chưa bị loại`, `${left} not yet ruled out`)}</div><div class="wgrid">${grid}</div>
  <div class="wbar"><button class="btn sec" onclick="wizClose()">${T('Quay lại', 'Back')}</button><button class="btn ${acc ? 'red' : ''}" ${selOK() ? '' : 'disabled'} onclick="wizGo()">${go}</button></div></div>`;
}
function selOK() { return S.sel.s && S.sel.w && S.sel.l; }
function doSuggest() { if (!selOK()) return toast('Chọn đủ 3 lá.', 'Pick all 3 cards.'); api('suggest', S.sel).then(j => { if (j.error) return; S.wiz = null; S.sel = { s: null, w: null, l: null }; render(); }); }
function doAccuse() {
  if (!selOK()) return toast('Chọn đủ 3 lá.', 'Pick all 3 cards.');
  const n = `${LN(BY[S.sel.s])} · ${LN(BY[S.sel.w])} · ${LN(BY[S.sel.l])}`;
  if (confirm(`${S.v.teamMode && S.v.myRole === 'accomplice' ? TL('Chiếm đáp án', 'Seize the answer') : TL('Buộc tội', 'Accuse')}: ${n}\n${TL('Sai sẽ bị loại. Chắc chắn chứ?', 'Wrong = eliminated. Sure?')}`)) api('accuse', S.sel).then(j => { if (j.error) return; S.wiz = null; render(); });
}
function doEnd() { api('end'); }
function doPower() { const v = S.v; if (v.myRole === 'innocent') return api('power'); if (!S.pw.target) return toast('Chọn một người.', 'Pick a player.'); api('power', S.pw); }
function setPw(f, val) { S.pw[f] = val; }
function show(card) {
  const src = document.querySelector(`[data-cid="${card}"]`), v = S.v, pd = v.pending;
  if (src && pd) { S.flown = (v.hist[v.hist.length - 1] || {}).n; flyCard(src.getBoundingClientRect(), cardHTML(card, 1), pdTarget(pd.suggester), true); }
  api('show', { card });
}
function pdTarget(id) { const i = S.v.players.findIndex(p => p.id === id), el = document.querySelectorAll('.pstrip .pp')[i]; return el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: 0, width: 10, height: 10 }; }
function flyBack(h) {
  if (S.flown === h.n && h.ans === S.v.me) { S.flown = null; return; }
  const i = S.v.players.findIndex(p => p.id === h.ans), el = document.querySelectorAll('.pstrip .pp')[i];
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: 0, width: 40, height: 40 };
  flyCard(r, null, pdTarget(h.by), false);
}
function flyCard(from, faceHTML, to, flip) {
  const W = 232, H = 325, cx = innerWidth / 2 - W / 2, cy = innerHeight / 2 - H / 2, el = document.createElement('div');
  el.className = 'flyc';
  el.innerHTML = `<div class="fi"><div class="fb"><span>?</span></div>${faceHTML ? `<div class="ff">${faceHTML}</div>` : ''}</div>`;
  el.style.cssText = `left:0;top:0;width:${W}px;height:${H}px`;
  document.body.appendChild(el);
  const sc = Math.max(0.12, Math.min(0.5, (from.width || 60) / W)), fx = from.left + (from.width - W) / 2, fy = from.top + (from.height - H) / 2;
  const tx = to.left + (to.width - W) / 2, ty = to.top + (to.height - H) / 2, ts = Math.max(0.1, Math.min(0.25, (to.width || 50) / W));
  const inner = el.firstChild;
  if (faceHTML) inner.style.transform = 'rotateY(180deg)'; // face-up first
  const T0 = `translate(${fx}px,${fy}px) scale(${sc})`, T1 = `translate(${cx}px,${cy}px) scale(1.15)`, T2 = `translate(${tx}px,${ty}px) scale(${ts})`;
  const a = el.animate([{ transform: T0, opacity: 0.9 }, { transform: T1, opacity: 1, offset: 0.35 }, { transform: T1, opacity: 1, offset: 0.65 }, { transform: T2, opacity: 0.2 }], { duration: 1600, easing: 'ease-in-out', fill: 'forwards' });
  if (faceHTML) inner.animate([{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(180deg)', offset: 0.35 }, { transform: 'rotateY(0deg)', offset: 0.5 }, { transform: 'rotateY(0deg)' }], { duration: 1600, fill: 'forwards' });
  a.onfinish = () => el.remove();
}
function lie() { api('lie'); }
function setLang(l) { S.lang = l; localStorage.mm_lang = l; render(); }
function copyLink() {
  const u = `${location.origin}/?room=${S.v.code}`;
  (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => toast('Đã chép liên kết.', 'Link copied.')).catch(() => prompt('Link:', u));
}
function setSettings() { const m = document.querySelector('input[name=mode]:checked'); api('settings', { roles: $('#roles').checked, mode: m ? m.value : 'team', maxRounds: $('#rounds').value }); }

// ---------- views ----------
// ---------- background music ----------
const M = { tracks: [], i: 0, a: null, on: false, muted: localStorage.mm_mute === '1', vol: +(localStorage.mm_vol || 0.35) };
function musicStart() {
  if (!M.tracks.length || M.on) return;
  M.a = new Audio(M.tracks[M.i]); M.a.volume = M.vol; M.a.muted = M.muted;
  M.a.onended = () => { M.i = (M.i + 1) % M.tracks.length; M.on = false; musicStart(); };
  M.a.play().then(() => { M.on = true; render(); }).catch(() => { M.on = false; });
}
function toggleMusic() {
  if (!M.on) { M.muted = false; localStorage.mm_mute = '0'; musicStart(); return; }
  M.muted = !M.muted; M.a.muted = M.muted; localStorage.mm_mute = M.muted ? '1' : '0'; render();
}
fetch('/api/music').then(r => r.json()).then(j => { M.tracks = j.tracks || []; if (M.tracks.length) { M.i = Math.floor(Math.random() * M.tracks.length); render(); } }).catch(() => {});
document.addEventListener('pointerdown', () => { if (!M.on && !M.muted) musicStart(); }, { once: false });
function topBar() {
  const MU = `<button class="pill" onclick="toggleMusic()" title="${T('Nhạc nền', 'Music')}">${M.on && !M.muted ? '🎵' : '🔇'}</button>`;
  const L = (k, t) => `<button class="pill ${S.lang === k ? 'on' : ''}" onclick="setLang('${k}')">${t}</button>`;
  const v = S.v;
  return `<div class="top"><h1>${S.lang === 'en' ? 'Manor Murder Mystery' : 'Án Mạng Dinh Thự'}</h1><div class="r">${v ? `<span class="pill room">${T('Phòng', 'Room')} <b>${esc(v.code)}</b></span>` : ''}${M.tracks.length ? MU : ''}<span class="seg">${L('vi', 'VI')}${L('en', 'EN')}</span>${v ? `<button class="pill rules" onclick="showRules()">${T('Luật', 'Rules')}</button><button class="pill leave" onclick="if(confirm(TL('Rời phòng?', 'Leave room?')))leave()">${T('Rời', 'Leave')}</button>` : ''}</div></div>`;
}
function homeView() {
  const room = new URLSearchParams(location.search).get('room') || '';
  return `<div class="wrap">${topBar()}<div class="home"><div class="panel"><h3 style="font-size:22px">${T('Vào chơi', 'Join the game')}</h3>
  <div class="lab">${T('TÊN CỦA BẠN', 'YOUR NAME')}</div><input type="text" id="name" maxlength="16" placeholder="Khải, Uyên...">
  <div style="height:14px"></div><button class="btn" style="width:100%" onclick="createRoom()">${T('Tạo phòng mới', 'Create a new room')}</button>
  <div class="lab" style="margin-top:18px">${T('HOẶC NHẬP MÃ PHÒNG', 'OR ENTER A ROOM CODE')}</div>
  <div class="row"><input type="text" id="code" maxlength="4" value="${esc(room)}" placeholder="ABCD" style="flex:1;text-transform:uppercase"><button class="btn sec" onclick="joinRoom()">${T('Vào phòng', 'Join')}</button></div></div></div></div>`;
}
function lobbyView() {
  const v = S.v, host = v.hostId === v.me;
  const pls = v.players.map(p => `<div class="pl"><span class="dot ${p.connected ? '' : 'off'}"></span><span class="n">${esc(p.name)}</span>${p.id === v.hostId ? ` <span class="s">★ ${T('chủ phòng', 'host')}</span>` : ''}${p.bot ? ` <span class="s">🤖</span>${host ? ` <a href="#" style="margin-left:6px" onclick="api('removebot',{id:'${p.id}'});return false">✕</a>` : ''}` : ''}</div>`).join('');
  const rolesOk = v.players.length >= 3;
  return `<div class="wrap">${topBar()}<div class="panel" style="text-align:center"><div class="lab">${T('MÃ PHÒNG', 'ROOM CODE')}</div><div class="big">${esc(v.code)}</div><div style="margin-top:8px"><button class="btn sec" onclick="copyLink()">${T('Chép liên kết mời bạn', 'Copy invite link')}</button></div></div>
  <div class="panel"><h3>${T('Người chơi', 'Players')} (${v.players.length}/6)</h3><div class="strip">${pls}</div>${host && v.players.length < 6 ? `<div style="margin-top:10px"><button class="btn sec" onclick="api('addbot',{lang:S.lang})">🤖 ${T('Thêm máy', 'Add bot')}</button></div>` : ''}</div>
  <div class="panel"><h3>${T('Cài đặt', 'Settings')}</h3>
  ${host ? `<div class="lab">${T('CHẾ ĐỘ', 'MODE')}</div><label class="row" style="margin-bottom:6px"><input type="radio" name="mode" value="team" ${v.settings.mode !== 'ffa' ? 'checked' : ''} onchange="setSettings()"> <span>${T('Chế độ Đội: phe Thiện đấu Đồng phạm', 'Team mode: Good vs the Accomplice')}</span></label><label class="row" style="margin-bottom:12px"><input type="radio" name="mode" value="ffa" ${v.settings.mode === 'ffa' ? 'checked' : ''} onchange="setSettings()"> <span>${T('Chế độ Một mình: ai cũng tự thắng, chỉ 1 người thắng', 'Free-for-all: every player alone, only 1 winner')}</span></label><label class="row" style="margin-bottom:10px"><input type="checkbox" id="roles" ${v.settings.roles ? 'checked' : ''} onchange="setSettings()"> ${T('Dùng thẻ vai trò (cần từ 3 người)', 'Use role cards (needs 3+ players)')}</label>
  <label class="row">${T('Số vòng tối đa', 'Round limit')}: <input type="number" id="rounds" min="4" max="20" value="${v.settings.maxRounds}" style="width:90px" onchange="setSettings()"></label>
  <div class="en" style="margin-top:8px">${T('Độ khó', 'Difficulty')}: <b>${v.cfg.name}</b> (${T('chỉnh trong start.bat', 'set in start.bat')})</div>
  <div style="margin-top:14px"><button class="btn" ${v.players.length < 2 ? 'disabled' : ''} onclick="api('start')">${T('Bắt đầu ván', 'Start game')}</button></div>`
      : `<div>${T('Chế độ', 'Mode')}: <b>${v.settings.mode === 'ffa' ? T('Một mình', 'Free-for-all') : T('Đội', 'Team')}</b> · ${T('Vai trò', 'Roles')}: <b>${v.settings.roles && rolesOk ? 'ON' : 'OFF'}</b> · ${T('Số vòng', 'Rounds')}: <b>${v.settings.maxRounds}</b> · ${T('Độ khó', 'Difficulty')}: <b>${v.cfg.name}</b></div><div class="en" style="margin-top:8px">${T('Chờ chủ phòng bắt đầu…', 'Waiting for the host to start…')}</div>`}
  ${host && !rolesOk && v.settings.roles ? `<div class="en" style="margin-top:8px">${T('Dưới 3 người sẽ tự tắt vai trò.', 'Under 3 players: roles are turned off automatically.')}</div>` : ''}</div></div>`;
}
function pickers() {
  let h = '';
  for (const k of ['s', 'w', 'l']) {
    h += `<div class="lab">${T(CATN[k][0], CATN[k][1])}</div><div class="chips">` +
      CARDS[k].map(c => `<button class="chip ${S.sel[k] === c.id ? 'sel' : ''}" onclick="pick('${k}','${c.id}')"><div class="a">${c.svg}</div>${esc(LN(c))}</button>`).join('') + '</div>';
  }
  return h;
}
function powerHTML(v) {
  const r = v.myRole; if (!v.rolesOn || !r) return '';
  if (r === 'detective' ? v.used.lastRound === v.round : v.used.power) return r === 'detective' ? `<div class="en">${T('Bạn đã dùng quyền Thám tử vòng này.', 'You used your Detective power this round.')}</div>` : '';
  if (r === 'innocent') return `<button class="btn sec" onclick="doPower()">${T('Dùng quyền: giả thuyết lần hai', 'Power: second suggestion')}</button>`;
  if (r === 'police') {
    const opts = v.players.filter(p => p.id !== v.me && !p.elim).map(p => `<option value="${p.id}" ${S.pw.target === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    return `<div class="row"><select style="width:auto" onchange="setPw('target',this.value)"><option value="">${S.lang === 'en' ? 'Suspect…' : 'Nghi can…'}</option>${opts}</select>
    <button class="btn" style="background:#8f1d27" onclick="if(confirm('${S.lang === 'en' ? (S.v.cfg.policeWrong === 'SAFE' ? 'Arrest this player? Wrong = you lose the power.' : 'Arrest this player? Wrong = you are out.') : (S.v.cfg.policeWrong === 'SAFE' ? 'Bắt người này? Sai là mất quyền bắt giữ.' : 'Bắt người này? Sai là bạn bị loại.')}'))doPower()">${T('Bắt giữ Đồng phạm (1 lần)', 'Arrest the Accomplice (once)')}</button></div>`;
  }
  if (r === 'reporter' || r === 'detective') {
    const opts = v.players.filter(p => p.id !== v.me).map(p => `<option value="${p.id}" ${S.pw.target === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    return `<div class="row"><select style="width:auto" onchange="setPw('target',this.value)"><option value="">${S.lang === 'en' ? 'Player…' : 'Người chơi…'}</option>${opts}</select>
    <select style="width:auto" onchange="setPw('cat',this.value)"><option value="s" ${S.pw.cat === 's' ? 'selected' : ''}>${T('Nghi phạm', 'Suspect')}</option><option value="w" ${S.pw.cat === 'w' ? 'selected' : ''}>${T('Hung khí', 'Weapon')}</option><option value="l" ${S.pw.cat === 'l' ? 'selected' : ''}>${T('Địa điểm', 'Location')}</option></select>
    <button class="btn sec" onclick="doPower()">${r === 'reporter' ? T('Hỏi số lá', 'Ask how many') : r === 'detective' ? T('Bắt cho xem 1 lá', 'Make them show 1 card') : ''}</button></div>`;
  }
  return '';
}
function chainHTML(v) {
  const h = (v.hist || [])[(v.hist || []).length - 1]; if (!h) return '';
  const pd = v.pending && v.pending.kind !== 'reveal' ? v.pending : null;
  const P = v.players, i0 = P.findIndex(p => p.id === h.by), n = P.length, nameOf = id => (P.find(p => p.id === id) || {}).name;
  const idx = id => P.findIndex(p => p.id === id);
  const seq = []; for (let k = 1; k < n; k++) seq.push(P[(i0 + k) % n].id);
  let items = `<div class="ch"><div class="av">${avatar(i0, 40)}</div><b class="gold">${T('hỏi', 'asks')}</b></div>`;
  let ended = false;
  seq.forEach(id => {
    if (ended) return;
    let st = '';
    if (h.ans === id) { st = 'ans'; ended = true; }
    else if (h.passed.includes(id)) st = 'no';
    else if (pd && pd.disprover === id) st = 'cur';
    else if (pd) st = 'wait';
    else return;
    const sym = st === 'ans' ? '<span class="g">✓</span>' : st === 'no' ? '<span class="r">✕</span>' : st === 'cur' ? '<span class="dots">…</span>' : '<span class="w"></span>';
    items += `<div class="arr">›</div><div class="ch ${st}"><div class="av">${avatar(idx(id), 40)}</div>${sym}</div>`;
  });
  const cardsRow = [h.s, h.l, h.w].map(id => cardHTML(id, 0.5)).join('');
  let status;
  if (pd) status = pd.disprover === v.me ? T('Đến lượt bạn chọn lá để cho xem', 'Your turn to pick a card to show') : T(`${esc(nameOf(pd.disprover))} đang chọn lá…`, `${esc(nameOf(pd.disprover))} is choosing a card…`);
  else if (h.ans) status = h.ans === v.me ? T(`Bạn đã cho ${esc(nameOf(h.by))} xem 1 lá`, `You showed ${esc(nameOf(h.by))} a card`) : T(`${esc(nameOf(h.ans))} đã cho xem 1 lá`, `${esc(nameOf(h.ans))} showed a card`);
  else status = T('Không ai bác bỏ được!', 'Nobody could disprove it!');
  return `<div class="stage"><div class="ask">${avatar(i0, 28)} <b>${esc(nameOf(h.by))}</b> ${T('hỏi:', 'asks:')}</div><div class="cards3">${cardsRow}</div><div class="chain">${items}</div><div class="stat ${!pd && !h.ans ? 'none' : ''}">${status}</div></div>`;
}
function playView() {
  const v = S.v, me = v.players.find(p => p.id === v.me), myTurn = v.turnId === v.me && !me.elim && !v.over;
  if (S.nbOpen === undefined) S.nbOpen = typeof window === 'undefined' || window.innerWidth >= 1100;
  const pd = v.pending;
  const strip = v.players.map((p, i) => {
    const turn = p.id === v.turnId && !v.over, ans = pd && pd.disprover === p.id;
    return `<div class="pp ${turn ? 'turn' : ''} ${p.elim ? 'elim' : ''}"><div class="fr">${turn ? `<em>${T('LƯỢT', 'TURN')}</em>` : ''}${avatar(i, 56)}${p.elim ? '<b class="x">✕</b>' : ''}${ans ? '<b class="bub">…</b>' : ''}<u>${p.cards}</u></div><div class="n"><span class="dot ${p.id === v.me ? '' : (p.status === 'away' ? 'away' : p.connected ? '' : 'off')}"></span>${p.id === v.me ? T('Bạn', 'You') : esc(p.name)}</div></div>`;
  }).join('');
  let main = '';
  if (v.over) main += overView(v);
  else {
    main += chainHTML(v) || `<div class="stage"><div class="ask">${T('Chưa có giả thuyết nào', 'No suggestion yet')}</div></div>`;
    const turnName = (v.players.find(p => p.id === v.turnId) || {}).name;
    main += `<div class="turnline ${myTurn ? 'me' : ''}">${myTurn ? T('Đến lượt bạn!', 'Your turn!') : T(`Lượt của ${esc(turnName)}`, `${esc(turnName)}'s turn`)}</div>`;
  }
  // prompts
  if (!v.over && pd) {
    const sn = (v.players.find(p => p.id === pd.suggester) || {}).name;
    if (pd.kind === 'reveal') {
      const dn2 = (v.players.find(p => p.id === pd.disprover) || {}).name;
      if (pd.disprover === v.me) main += `<div class="panel" style="border-color:var(--gold)"><h3>${T(`Thám tử ${esc(sn)} yêu cầu bạn cho xem 1 lá ${CATN[pd.cat][0].toLowerCase()}`, `Detective ${esc(sn)} wants to see 1 ${CATN[pd.cat][1].toLowerCase().replace(/s$/, '')} card`)}</h3><div class="lab">${T('CHỌN 1 LÁ ĐỂ BÍ MẬT CHO XEM', 'PICK 1 CARD TO SHOW SECRETLY')}</div><div class="cards">${pd.match.map(id => cardHTML(id, 0.6, 'pick', `show('${id}')`)).join('')}</div></div>`;
      else main += `<div class="panel">${T(`Thám tử ${esc(sn)} đang yêu cầu ${esc(dn2)} cho xem 1 lá ${CATN[pd.cat][0].toLowerCase()}…`, `Detective ${esc(sn)} is making ${esc(dn2)} show a ${CATN[pd.cat][1].toLowerCase().replace(/s$/, '')} card…`)}</div>`;
    } else if (pd.disprover === v.me) {
      main += `<div class="panel" style="border-color:var(--gold)"><h3>${T(`${esc(sn)} đang hỏi bạn!`, `${esc(sn)} is asking you!`)}</h3><div class="lab">${T('CHỌN 1 LÁ ĐỂ BÍ MẬT CHO XEM', 'PICK 1 CARD TO SHOW SECRETLY')}</div><div class="cards">${pd.match.map(id => cardHTML(id, 0.6, 'pick', `show('${id}')`)).join('')}</div>${pd.canLie ? `<div style="margin-top:10px"><button class="btn sec" onclick="lie()">${T('Giấu lá (Đồng phạm, 1 lần): nói không có', 'Withhold (Accomplice, once): say none')}</button></div>` : ''}</div>`;
    }
  }
  let actionBar = '';
  if (myTurn && !pd) {
    const seize = v.teamMode && v.myRole === 'accomplice', left = v.turn.max - v.turn.suggests;
    if (S.wiz) main = wizHTML(v);
    else {
      main += `<div class="bigturn"><div class="bt-av">${avatar(v.players.findIndex(p => p.id === v.me), 96)}</div><div class="bt-t">${T('Lượt của bạn', 'Your turn')}</div></div>`;
      main += `<div class="pwr">${powerHTML(v)}</div>`;
      actionBar = `<div class="abar"><button class="btn sec" onclick="toggleNB()">${T('Sổ tay', 'Notebook')}</button><button class="btn" onclick="wizOpen('suggest')" ${left <= 0 ? 'disabled' : ''}>${T('Đặt giả thuyết', 'Suggest')}${left > 1 ? ` (${left})` : ''}</button><button class="btn red" onclick="wizOpen('accuse')">${seize ? T('Chiếm đáp án', 'Seize') : T('Buộc tội', 'Accuse')}</button><button class="btn sec" onclick="doEnd()">${T('Kết thúc lượt', 'End turn')}</button></div>`;
    }
  } else if (S.wiz) S.wiz = null;
  const tray = `<div class="tray"><div class="tab">${T('MẢNH BÀI CỦA BẠN', 'YOUR CARDS')} (${v.hand.length})</div>${v.myRole ? `<button class="pill rolebtn" onclick="showRole()">${T('Vai trò của tôi', 'My role')}</button>` : ''}
  <div class="trow"><div class="cards">${v.hand.map(id => cardHTML(id, 0.42)).join('')}</div>
  ${v.secrets.length ? `<div class="sec"><div class="lab">${T('BÍ MẬT TỪ VAI TRÒ', 'SECRET FROM ROLE')}</div><div class="cards">${v.secrets.map(id => cardHTML(id, 0.42)).join('')}</div></div>` : ''}</div></div>`;
  const nbPanel = S.nbOpen ? `<aside class="nbp"><div class="nbin"><div class="nbtop"><h3>${T('Sổ tay', 'Notebook')}</h3><button class="pill" onclick="toggleNB()">✕</button></div>${notebookHTML()}</div></aside>` : '';
  const info = `<span class="pill team">${v.teamMode ? T('Đội', 'Team') : T('Một mình', 'Solo')}</span>`;
  return `<div class="felt ${S.nbOpen ? 'withnb' : ''}">${nbPanel}<div class="tbl"><div class="rcorner ${v.round >= v.maxRounds ? 'last' : ''}"><small>${T('VÒNG', 'ROUND')}</small><b>${v.round}<i>/${v.maxRounds}</i></b></div><div class="top2">${topBar()}<div class="r2">${info}${S.nbOpen ? '' : `<button class="pill on" onclick="toggleNB()">${T('Sổ tay', 'Notebook')}</button>`}</div></div><div class="pstrip">${strip}</div>${main}${tray}${actionBar}</div></div>`;
}
function overView(v) {
  const o = v.over, host = v.hostId === v.me, sol = o.solution;
  const youWin = o.winners.includes(v.me);
  const names = o.winners.map(id => (v.players.find(p => p.id === id) || {}).name).filter(Boolean).join(', ');
  let h = `<div class="win">${youWin ? '🏆 ' : ''}${T(o.vi, o.en)}${names && o.team !== 'bad' && o.team !== 'good' ? '' : ''}</div>`;
  h += `<div class="panel"><h3>${T('Đáp án vụ án', 'The solution')}</h3><div class="cards">${[sol.s, sol.w, sol.l].map(id => cardHTML(id, 0.62)).join('')}</div></div>`;
  if (o.roles) {
    h += `<div class="panel"><h3>${T('Vai trò', 'Roles')}</h3><table class="tbl">${v.players.map(p => `<tr><td>${esc(p.name)}${o.winners.includes(p.id) ? ' 🏆' : ''}</td><td>${esc(ROLES[o.roles[p.id]].vi)} · ${esc(ROLES[o.roles[p.id]].en)}</td></tr>`).join('')}</table></div>`;
  }
  h += `<div class="panel">${host ? `<button class="btn" onclick="api('reset')">${T('Ván mới (về phòng chờ)', 'New game (back to lobby)')}</button>` : `<div class="en">${T('Chờ chủ phòng bắt đầu ván mới…', 'Waiting for the host to start a new game…')}</div>`}</div>`;
  return h;
}
function render() {
  const app = $('#app');
  const focus = document.activeElement && document.activeElement.id;
  if (S.session && S.v && S.v.phase === 'play') nbLoad();
  let html;
  if (!S.session || !S.v) html = homeView();
  else if (S.v.phase === 'lobby') html = lobbyView();
  else html = playView();
  app.innerHTML = html;
  if (focus && $('#' + focus)) $('#' + focus).focus();
}

fetch('/cards.json').then(r => r.json()).then(c => {
  CARDS = c; for (const k of ['s', 'w', 'l']) c[k].forEach(x => (BY[x.id] = x)); c.roles.forEach(r => (ROLES[r.id] = r));
  if (S.session) connect(); else render();
});

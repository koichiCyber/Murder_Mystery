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
  return `<div class="cw ${cls}" data-cid="${id}" ${onclick ? `onclick="${onclick}"` : ''} style="width:${232 * scale}px;height:${325 * scale}px"><div class="card" style="--c:${k.c};transform:scale(${scale})"><div class="hd"><span>${KA[id[0]][S.lang === 'en' ? 1 : 0]}</span></div><div class="art">${c.svg}</div><div class="bd"><div class="nm">${esc(LN(c))}</div><div class="rule"></div><div class="tg">${esc(S.lang === 'en' ? (c.tag_en || TAG_EN[c.tag] || '') : c.tag)}</div></div></div></div>`;
}
function roleHTML(rid, scale = 1, teamMode = true) {
  const r = ROLES[rid]; if (!r) return '';
  const en = S.lang === 'en';
  const team = r.team === 'none' ? (en ? 'NOT DEALT' : 'KHÔNG PHÁT') : !teamMode ? (en ? 'SOLO' : 'MỘT MÌNH') : r.team === 'good' ? (en ? 'GOOD TEAM' : 'PHE THIỆN') : (en ? 'BAD TEAM' : 'PHE ÁC');
  return `<div class="cw" style="width:${232 * scale}px;height:${325 * scale}px"><div class="card" style="--c:#4B2E5E;transform:scale(${scale})"><div class="hd"><span>${en ? 'ROLE' : 'VAI TRÒ'}</span><span>${team}</span></div><div class="art r">${r.svg}</div><div class="bd"><div class="nm">${esc(en ? r.en : r.vi)}</div><div class="rule"></div><div class="ab">${esc(S.v && S.v.ult && S.v.ult.hard && ultRoleText(rid) ? ultRoleText(rid) : (en ? r.ab_en : r.ab_vi))}</div></div></div></div>`;
}
const ACT = {
  counter: { i: '✋', c: '#B3261E', vi: 'Phản đối!', en: 'Counter!', dv: 'Hủy 1 lá hành động vừa chơi. Phản đối được Phản đối.', de: 'Cancels the action card just played. Can be countered.' },
  dodge: { i: '🫥', c: '#3B6E8F', vi: 'Lánh mặt', en: 'Lie low', dv: 'Kết thúc lượt mà không rút bài.', de: 'End your turn without drawing.' },
  frame: { i: '🪤', c: '#7A4B8F', vi: 'Đổ tội', en: 'Frame', dv: 'Kết thúc lượt không rút bài; người kế tiếp đi 2 lượt.', de: 'End turn without drawing; the next player takes 2 turns.' },
  intuition: { i: '🔮', c: '#5B5BA8', vi: 'Linh cảm', en: 'Hunch', dv: 'Bí mật xem 3 lá trên cùng chồng bằng chứng.', de: 'Secretly look at the top 3 cards of the evidence pile.' },
  shuffle: { i: '🌀', c: '#2F8F83', vi: 'Xáo trộn hiện trường', en: 'Scene shuffle', dv: 'Xáo ngẫu nhiên chồng bằng chứng.', de: 'Shuffle the evidence pile.' },
  interrogate: { i: '🔦', c: '#B8862F', vi: 'Thẩm vấn', en: 'Interrogate', dv: 'Chọn 1 người: họ bí mật cho bạn xem 1 lá manh mối do họ chọn.', de: 'Pick a player: they secretly show you 1 clue card of their choice.' },
  false: { i: '🤥', c: '#8F3B3B', vi: 'Lời khai giả', en: 'False testimony', dv: 'Khi phải bác bỏ giả thuyết: không cho xem gì. Không dùng được với Thám tử.', de: 'When you must refute: show nothing. Not usable by the Detective.' },
  extra: { i: '➕', c: '#3B8F4B', vi: 'Giả thuyết thêm', en: 'Extra suggestion', dv: 'Được đưa thêm 1 giả thuyết trong lượt này.', de: 'One more suggestion this turn.' },
  blank: { i: '⬜', c: '#8a8a8a', vi: 'Giấy trắng', en: 'Blank paper', dv: 'Không có tác dụng. Đánh một cặp cùng màu: rút ngẫu nhiên 1 lá hành động của người khác.', de: 'No effect. Play a same-colour pair: take 1 random action card from another player.' }
};
const atype = id => String(id).split('_')[0];
function actHTML(id, o = {}) {
  const t = atype(id), a = ACT[t], col = t === 'blank' ? (id.split('_')[1][0] === 'A' ? '#6b8ec9' : '#c98f6b') : a.c, en = S.lang === 'en';
  return `<div class="act ${o.cls || ''} ${o.sel ? 'sel' : ''}" data-aid="${id}" style="--c:${col}" ${o.click ? `onclick="${o.click}"` : ''} title="${esc(en ? a.de : a.dv)}"><div class="ai">${a.i}</div><div class="an">${esc(en ? a.en : a.vi)}</div>${t === 'blank' ? `<div class="ad">${id.split('_')[1][0]}</div>` : `<div class="ad">${esc(en ? a.de : a.dv)}</div>`}</div>`;
}
function targetModal(title, cb) {
  const v = S.v; S.tcb = cb;
  $('#modal').innerHTML = `<div class="back" onclick="if(event.target===this)closeModal()"><div class="box"><h3>${esc(title)}</h3><div class="tgl">${v.players.map((p, i) => p.id !== v.me && !p.elim ? `<button class="btn sec" onclick="closeModal();S.tcb('${p.id}')">${avatar(i, 26)} ${esc(p.name)}</button>` : '').join('')}</div><div style="text-align:center;margin-top:10px"><button class="btn sec" onclick="closeModal()">${T('Hủy', 'Cancel')}</button></div></div></div>`;
}
function playAct(id) {
  const v = S.v, t = atype(id);
  if (t === 'interrogate') return targetModal(T('Thẩm vấn ai?', 'Interrogate whom?'), x => api('ult_play', { card: id, target: x }));
  if (t === 'blank') { S.blankSel = S.blankSel || []; const i = S.blankSel.indexOf(id); if (i >= 0) S.blankSel.splice(i, 1); else S.blankSel.push(id); if (S.blankSel.length > 2) S.blankSel.shift(); return render(); }
  api('ult_play', { card: id });
}
function playPair() { const cs = S.blankSel.slice(); S.blankSel = []; targetModal(T('Lấy bài của ai?', 'Take a card from whom?'), x => api('ult_play', { cards: cs, target: x })); render(); }
function counterNow() { api('ult_counter'); }
function falseNow() { api('ult_false'); }
function nightPick(id) { api('ult_night', { target: id }); }
function voteFor(id) { api('ult_vote', { target: id }); }
function arrestUlt() { targetModal(T('Bắt giữ ai? (1 lần, sai thì bạn bị loại)', 'Arrest whom? (once; wrong = you are out)'), x => api('ult_arrest', { target: x })); }
function ultRoleText(r) {
  const en = S.lang === 'en', m = {
    detective: ['Thiện · Mỗi đêm soi 1 người: nếu họ giữ nghi phạm, bạn biết các nghi phạm đó không phải hung thủ. Không biết gì khi bắt đầu.', 'Good · Each night inspect 1 player: any suspects they hold are not the murderer. Knows nothing at the start.'],
    forensic: ['Thiện · Biết HUNG KHÍ. Không có quyền ban đêm.', 'Good · Knows the WEAPON. No night power.'],
    police: ['Thiện · Biết ĐỊA ĐIỂM. 1 lần/ván, ban ngày: bắt 1 người. Đúng Đồng phạm thì họ bị loại, sai thì bạn bị loại.', 'Good · Knows the LOCATION. Once per game, by day: arrest 1 player. Right = they are out; wrong = you are out.'],
    witness: ['Thiện · Biết hung thủ là 1 trong 2 nghi phạm được gợi ý.', 'Good · Knows the murderer is one of 2 hinted suspects.'],
    villager: ['Thiện · Không biết gì, không có quyền. Chơi bằng thẻ hành động, giả thuyết và lá phiếu.', 'Good · Knows nothing, no power. Plays with action cards, suggestions and the vote.'],
    accomplice: ['Ác · Biết NGHI PHẠM và HUNG KHÍ. Từ vòng 3 có thể chiếm đáp án bằng buộc tội (sai thì bị loại). Chỉ được bỏ phiếu từ vòng 5.', 'Bad · Knows the SUSPECT and WEAPON. From round 3 may seize the answer by accusing (wrong = out). May only vote from round 5.']
  };
  return m[r] ? m[r][en ? 1 : 0] : '';
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
function applyRaw(txt) {
  if (txt === S.raw) return; S.raw = txt;
  const k = txt.replace(/"(left|turnLeft|ansLeft)":[0-9.]+/g, '"$1":0'); S.recvAt = Date.now();
  if (k === S.rawKey && S.v) { S.v = JSON.parse(txt); return; }
  S.rawKey = k; S.v = JSON.parse(txt); onState();
}
function cdVal(path) { let o = S.v; for (const p of path.split('.')) { if (!o) return null; o = o[p]; } return typeof o === 'number' ? o : null; }
setInterval(() => document.querySelectorAll('.cd').forEach(el => { const l = cdVal(el.dataset.cd); if (l === null) return; el.textContent = Math.max(0, l - (Date.now() - (S.recvAt || Date.now())) / 1000).toFixed(el.dataset.int ? 0 : 1) + 's'; }), 200);
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
function showVoteResult() {
  const v = S.v, lv = v.ult && v.ult.lastVote; if (!lv) return;
  const nm = id => id === v.me ? T('Bạn', 'You') : esc((v.players.find(p => p.id === id) || {}).name);
  $('#modal').innerHTML = `<div class="back" onclick="closeModal()"><div class="box"><h3>🗳️ ${T('Kết quả họp làng', 'Village vote result')}</h3><table class="tbl">${Object.entries(lv.votes).map(([a, b]) => `<tr><td>${nm(a)}</td><td>→ ${b === 'abstain' ? T('Bỏ qua', 'Abstain') : nm(b)}</td></tr>`).join('')}</table><div class="win" style="font-size:18px;margin-top:10px">${lv.jailed ? T(`${nm(lv.jailed)} bị giam và bị loại!`, `${nm(lv.jailed)} is jailed and out!`) : T('Không ai bị giam.', 'Nobody is jailed.')}</div><div style="text-align:center;margin-top:10px"><button class="btn" onclick="closeModal()">OK</button></div></div></div>`;
}
function showRules() {
  const v = S.v;
  if (v && v.ult) {
    const en = S.lang === 'en', P = (a, b) => `<p>${en ? b : a}</p>`;
    const hard = v.ult.hard;
    const roles = hard ? ['detective', 'forensic', 'police', 'witness', 'villager', 'accomplice'].map(r => `<div style="margin:6px 0"><b>${esc(LN(ROLES[r]))}</b><div>${esc(ultRoleText(r))}</div></div>`).join('') : '';
    const acts = hard ? Object.entries(ACT).map(([t, a]) => `<div style="margin:5px 0">${a.i} <b>${esc(en ? a.en : a.vi)}</b>: ${esc(en ? a.de : a.dv)}</div>`).join('') : '';
    $('#modal').innerHTML = `<div class="back" onclick="if(event.target===this)closeModal()"><div class="box"><h3>Ultima ${hard ? T('Khó', 'Hard') : T('Bình thường', 'Normal')}</h3>
    ${P('Hồ Sơ Mật: mỗi ván có 1 nghi phạm, 1 hung khí, 1 địa điểm bí mật. Đưa giả thuyết; người kế tiếp có lá trùng sẽ bí mật cho bạn xem 1 lá. Khi chắc chắn thì buộc tội: sai là bị loại, bài của bạn được lật cho cả bàn.', 'Secret case file: each game hides 1 suspect, 1 weapon, 1 location. Suggest; the next player holding a matching card secretly shows you 1. When sure, accuse: wrong = you are out and your cards are revealed to the table.')}
    ${hard ? P('Mỗi lượt có 90 giây. Chơi thẻ hành động tuỳ ý (mỗi lá chờ 5 giây để người khác Phản đối), tối đa 1 giả thuyết (2 nếu có Giả thuyết thêm), buộc tội tuỳ chọn, rồi kết thúc lượt: rút 1 thẻ hành động từ chồng bằng chứng (trừ khi đã Lánh mặt hoặc Đổ tội). Hết giờ: máy tự rút 1 lá và kết thúc lượt.', 'Each turn lasts 90 seconds. Play any action cards (each waits 5 seconds for a Counter), at most 1 suggestion (2 with Extra suggestion), optionally accuse, then end the turn: draw 1 action card from the evidence pile (unless you played Lie low or Frame). Out of time: the game draws 1 card and ends your turn.') : P('Mức Bình thường: không vai trò, không thẻ hành động. Mỗi lượt có 45 giây; hết giờ máy tự kết thúc lượt. Lượt kết thúc ngay sau khi giả thuyết được trả lời. Người cuối cùng còn lại thắng; hết số vòng mà chưa ai đúng thì không ai thắng.', 'Normal: no roles, no action cards. Each turn lasts 45 seconds; when time runs out the turn ends automatically. The turn ends right after the suggestion is answered. Last one standing wins; if the round limit passes with no correct accusation, nobody wins.')}
    ${hard ? `<h4>${T('Vai trò', 'Roles')}</h4>${roles}<h4>${T('Thẻ hành động', 'Action cards')}</h4>${acts}
    ${P('Họp làng: từ cuối vòng 2, sau lượt người cuối, cả làng bỏ phiếu giam 1 người (cần hơn một nửa số người còn lại). Đồng phạm chưa được bỏ phiếu trước vòng 5.', 'Village meeting: from the end of round 2, after the last player, everyone votes to jail 1 player (more than half of those remaining). Accomplices cannot vote before round 5.')}
    ${P('Phe Thiện thắng khi một người Thiện buộc tội đúng hoặc loại hết Đồng phạm. Phe Ác thắng khi hết chồng bằng chứng, khi số Đồng phạm bằng hoặc nhiều hơn người Thiện (từ vòng 3), hoặc khi một Đồng phạm chiếm đáp án đúng từ vòng 3.', 'Good wins when a Good player accuses correctly or all Accomplices are out. Bad wins when the evidence pile runs out, when Accomplices equal or outnumber Good players (from round 3), or when an Accomplice seizes the correct answer from round 3.')}` : ''}
    <div style="text-align:center;margin-top:12px"><button class="btn" onclick="closeModal()">OK</button></div></div></div>`;
    return;
  }
  const rs = ['detective', 'witness', 'reporter', 'police', 'innocent', 'accomplice', 'murderer'].map(id => `<div style="margin:8px 0"><b>${esc(LN(ROLES[id]))}</b><div>${esc(S.lang === 'en' ? ROLES[id].ab_en : ROLES[id].ab_vi)}</div></div>`).join('');
  $('#modal').innerHTML = `<div class="back" onclick="if(event.target===this)closeModal()"><div class="box"><h3>${T('Luật chơi', 'How to play')}</h3>
  <p>${T('Mỗi lượt: đưa ra một giả thuyết (nghi phạm + hung khí + địa điểm). Người kế tiếp có ít nhất một lá trùng sẽ bí mật cho bạn xem 1 lá. Khi chắc chắn, buộc tội: đúng thì thắng, sai thì bị loại (vẫn phải cho xem bài). Mỗi lượt có 45 giây; hết giờ lượt tự chuyển (đồng hồ dừng khi đang trả lời giả thuyết).', 'Each turn: make a suggestion (suspect + weapon + location). The next player holding a matching card secretly shows you one. When you are sure, accuse: right wins, wrong eliminates you (you still show cards). Each turn lasts 45 seconds; when time runs out the turn passes automatically (the clock pauses while a suggestion is being answered).')}</p>
  <p>${v && v.rolesOn && !v.teamMode ? T('Chế độ Một mình: không chia phe. Ai buộc tội đúng đầu tiên thắng một mình; sai thì bị loại. Còn lại một người cuối cùng thì người đó thắng. Hết số vòng mà chưa ai đúng thì không ai thắng. Vai trò vẫn có quyền như bình thường.', 'Free-for-all: no teams. The first correct accusation wins alone; a wrong one eliminates you. The last player standing wins. If the round limit passes, nobody wins. Roles keep their powers.') : T('Có vai trò: phe Thiện thắng khi có người buộc tội đúng. Đồng phạm thắng nếu hết số vòng mà chưa ai đúng, nếu phe Thiện bị loại hết, hoặc nếu Đồng phạm tự đoán đúng đáp án (chiếm đáp án). Đồng phạm bị loại thì phe Thiện thắng.', 'With roles: Good wins on a correct accusation. The Accomplice wins if the round limit passes, all Good players are out, or the Accomplice seizes the right answer. If the Accomplice is eliminated, Good wins.')}</p>${rs}
  <div style="text-align:center;margin-top:12px"><button class="btn" onclick="closeModal()">OK</button></div></div></div>`;
}
function toggleNB() { S.nbOpen = !S.nbOpen; render(); }

// ---------- notebook ----------
const AVC = [['#F2C9A0', '#2A2A33', '#2E9D7B'], ['#E8B792', '#7A3A1C', '#C23B3B'], ['#F6D3B3', '#E3B94E', '#23366B'], ['#C98F63', '#1B1A2E', '#8B5CF6'], ['#EBC19C', '#B3401E', '#E3B94E'], ['#D9A073', '#3A2A20', '#0EA5A5'], ['#F0C8A8', '#8A5A2B', '#D97706'], ['#B87B52', '#111827', '#DB2777'], ['#E9BE98', '#5B3A29', '#4D7C0F'], ['#CF9468', '#C9C2B8', '#1D4ED8'], ['#F4D2B6', '#7C2D12', '#0F766E'], ['#C08560', '#2B2B2B', '#9333EA']];
function avatar(i, px = 56) {
  const [sk, hr, sh] = AVC[i % AVC.length];
  return `<svg viewBox="0 0 56 56" width="${px}" height="${px}" style="display:block;border-radius:10px;background:#cfe3d6"><rect width="56" height="56" fill="${sh}" fill-opacity=".35"/><path d="M6 56 Q8 40 28 38 Q48 40 50 56Z" fill="${sh}"/><rect x="23" y="32" width="10" height="9" fill="${sk}"/><ellipse cx="28" cy="24" rx="12" ry="13" fill="${sk}"/><path d="M15 22 Q16 8 28 8 Q41 8 41 22 Q36 14 28 15 Q20 14 15 22Z" fill="${hr}"/><circle cx="23" cy="25" r="1.8" fill="#1B1A2E"/><circle cx="33" cy="25" r="1.8" fill="#1B1A2E"/><path d="M24 31 Q28 34 32 31" stroke="#8A3A32" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
}
function computeNB(useManual = true) {
  const v = S.v, P = v.players, me = v.me;
  const cells = {}, holder = {}, solved = {};
  const all = [...CARDS.s, ...CARDS.w, ...CARDS.l].map(c => c.id);
  all.forEach(id => (cells[id] = {}));
  const setHas = (c, p) => { holder[c] = p; cells[c][p] = 'has'; };
  (v.hand || []).forEach(c => setHas(c, me));
  const seenSet = {};
  (v.seen || []).forEach(s => { seenSet[s.card + '|' + s.by] = 1; if (!holder[s.card]) setHas(s.card, s.by); });
  if (v.ult) Object.entries(v.ult.revealed || {}).forEach(([pid, r]) => (r.hand || []).forEach(c => { if (!holder[c]) setHas(c, pid); }));
  (v.secrets || []).forEach(c => (solved[c] = true));
  if (useManual) Object.entries(S.nb || {}).forEach(([k, val]) => { // your own marks feed the deduction
    const [c, p] = k.split('|'); if (!cells[c] || !P.some(x => x.id === p)) return;
    if (val === 'v' && !holder[c] && !solved[c] && cells[c][p] !== 'no') setHas(c, p);
    else if (val === 'x' && !cells[c][p]) cells[c][p] = 'no';
  });
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
function histHTML() {
  const v = S.v, P = v.players, f = S.histF || null, nm = id => (P.find(p => p.id === id) || {}).name || '?';
  const chip = id => `<span class="hch"><i class="mini">${avatar(P.findIndex(p => p.id === id), 18)}</i>${id === v.me ? T('Bạn', 'You') : esc(nm(id))}</span>`;
  const filt = `<div class="hfil"><button class="${!f ? 'on' : ''}" onclick="S.histF=null;render()">${T('Tất cả', 'All')}</button>${P.map((p, i) => `<button class="${f === p.id ? 'on' : ''}" onclick="S.histF='${p.id}';render()">${avatar(i, 26)}</button>`).join('')}</div>`;
  const list = (v.hist || []).filter(h => !f || h.by === f).slice().reverse();
  const row = h => {
    const cards = [h.s, h.l, h.w].map(id => `<span class="hcard k${id[0]}"><i>${BY[id].svg}</i><b>${esc(cname(id))}</b></span>`).join('');
    const res = [...(h.passed || []).map(id => `<span class="hr no">${esc(id === v.me ? T('Bạn', 'You') : nm(id))} ✗</span>`), h.ans ? `<span class="hr yes">${esc(h.ans === v.me ? T('Bạn', 'You') : nm(h.ans))} ✓</span>` : h.done ? `<span class="hr none">${T('Không ai có', 'No one had any')}</span>` : `<span class="hr wait">…</span>`].join('');
    return `<div class="hrow"><div class="hwho">${avatar(P.findIndex(p => p.id === h.by), 34)}<span><b>${h.by === v.me ? T('Bạn', 'You') : esc(nm(h.by))}</b> ${T('hỏi', 'asked')} <small>${T('Vòng', 'Rd')} ${h.round}</small></span></div><div class="hcards">${cards}</div><div class="hres">${res}</div></div>`;
  };
  return `<div class="hist">${filt}${list.length ? list.map(row).join('') : `<div class="hempty">${T('Chưa có câu hỏi nào.', 'No questions yet.')}</div>`}</div>`;
}
function notebookHTML() {
  const v = S.v, P = v.players;
  { // auto-correct: drop manual marks that contradict hard facts, or that are now implied
    const base = computeNB(false); let dirty = false;
    Object.entries(S.nb).forEach(([k, val]) => {
      const [c, p] = k.split('|'), st = base.cells[c] && base.cells[c][p];
      if (!base.cells[c] || !P.some(x => x.id === p) || st === 'has' || st === 'no' || (val === 'v' && base.holder[c] && base.holder[c] !== p) || (val === 'v' && base.solved[c])) { delete S.nb[k]; dirty = true; }
    });
    if (dirty) localStorage.setItem(nbKey(), JSON.stringify(S.nb));
  }
  const base0 = computeNB(false), { cells, holder, solved, seenSet } = computeNB(true);
  const pd = v.pending, wait = {};
  if (pd && pd.kind !== 'reveal') { const rest = [pd.disprover, ...pd.order.slice(pd.pos + 1)].filter(Boolean); [pd.s, pd.w, pd.l].forEach(c => rest.forEach(p => (wait[c + '|' + p] = 1))); }
  const nl = P.length > 7 ? 3 : P.length > 5 ? 4 : 5, short = (p, i) => { if (p.id === v.me) return T('Bạn', 'You'); const m = p.name.match(/^(.*?)[\s#]*(\d+)$/); return esc(m ? m[1].slice(0, Math.max(1, nl - m[2].length)) + m[2] : (p.name.length > nl ? p.name.slice(0, nl) : p.name)); };
  let h = `<div class="nbt n${P.length > 7 ? 'xs' : P.length > 5 ? 's' : 'm'}" style="--n:${P.length}"><div class="nbh"><span></span>${P.map((p, i) => `<span class="${p.elim ? 'el' : ''}">${avatar(i, 26)}<i>${short(p, i)}</i></span>`).join('')}</div>`;
  for (const k of ['s', 'l', 'w']) {
    h += `<div class="nbg g${k}">${T(CATN[k][0], CATN[k][1])}</div>`;
    for (const c of CARDS[k]) {
      const sol = solved[c.id], held = !!holder[c.id];
      h += `<div class="nbr ${held ? 'held' : ''} ${sol ? 'sol' : ''}"><span class="nm">${sol ? '★ ' : ''}${esc(LN(c))}</span>` + P.map(p => {
        const st = cells[c.id][p.id], man = S.nb[c.id + '|' + p.id], auto = st && !base0.cells[c.id][p.id];
        let sym = '', cl = '';
        if (man === 'v' && st === 'has') { sym = '✓'; cl = 'has man'; } else if (man === 'x' && st === 'no') { sym = '✕'; cl = 'no man'; }
        else if (st === 'has') { sym = seenSet[c.id + '|' + p.id] ? '🔍' : '✓'; cl = 'has' + (p.id === v.me ? ' me' : '') + (auto ? ' auto' : ''); } else if (st === 'no') { sym = '✕'; cl = 'no' + (auto ? ' auto' : ''); } else if (st === 'maybe') { sym = '?'; cl = 'maybe'; }
        else if (man === 'q') { sym = '?'; cl = 'maybe man'; }
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
function outSet() { // cards whose holder is already known (cannot be the answer)
  const v = S.v, nb = computeNB(), out = new Set(v.hand);
  Object.keys(nb.holder).forEach(c => out.add(c));
  return out;
}
function holderName(id) { const h = computeNB().holder[id], p = S.v.players.find(x => x.id === h); return p ? (p.id === S.v.me ? T('Bạn', 'You') : p.name) : '?'; }
function wizHTML(v) {
  const w = S.wiz, out = outSet(), mine = new Set(v.hand);
  const ord = ['s', 'l', 'w'], Q = { s: ['Ai?', 'Who?'], l: ['Ở đâu?', 'Where?'], w: ['Bằng gì?', 'With what?'] };
  const kn = { s: [T('Nghi phạm', 'Suspect'), 'NGHI PHẠM', 'SUSPECT'], l: [T('Địa điểm', 'Location')], w: [T('Hung khí', 'Weapon')] };
  const slots = ord.map(k => { const id = S.sel[k], c = id ? BY[id] : null, cur = w.step === k;
    return `<div class="slot ${cur ? 'cur' : ''} ${k}" onclick="wizStep('${k}')"><div class="sh">${T(CATN[k][0].toUpperCase(), CATN[k][1].toUpperCase())}</div><div class="sb">${c ? `<div class="sart">${c.svg}</div>` : '<span class="q">?</span>'}</div><div class="sn">${c ? esc(LN(c)) : T(Q[k][0], Q[k][1])}</div>${c ? '<i class="ok">✓</i>' : ''}</div>`; }).join('');
  const k = w.step, left = CARDS[k].filter(c => !out.has(c.id)).length;
  const lab = { s: [T('Chọn nghi phạm', 'Choose the suspect'), T('người', 'suspects')], l: [T('Chọn địa điểm', 'Choose the location'), T('nơi', 'locations')], w: [T('Chọn hung khí', 'Choose the weapon'), T('món', 'weapons')] }[k];
  const grid = CARDS[k].map(c => `<div class="wc ${S.sel[k] === c.id ? 'sel' : ''} ${out.has(c.id) ? 'out' : ''}" onclick="pick('${k}','${c.id}')">${cardHTML(c.id, 0.62)}${mine.has(c.id) ? `<b class="yours">${T('CỦA BẠN', 'YOURS')}</b>` : out.has(c.id) ? `<b class="yours known">${T('ĐÃ BIẾT', 'KNOWN')}: ${esc(holderName(c.id))}</b>` : ''}${S.sel[k] === c.id ? '<i class="tick">✓</i>' : ''}</div>`).join('');
  const seize = v.teamMode && v.myRole === 'accomplice', acc = w.mode === 'accuse';
  const go = acc ? (seize ? T('Chiếm đáp án', 'Seize the answer') : T('Buộc tội', 'Accuse')) : T('Đưa ra giả thuyết', 'Suggest');
  return `<div class="wiz"><div class="wt">${acc ? (seize ? T('Chiếm đáp án', 'Seize the answer') : T('Buộc tội', 'Accuse')) : T('Giả thuyết', 'Suggestion')}</div><div class="slots">${slots}</div>
  <div class="wp"><b>${lab[0]}</b>, ${T(`còn ${left} ${lab[1]} chưa bị loại (lá đã biết vẫn hiện, làm mờ)`, `${left} not yet ruled out (known cards stay visible, dimmed)`)}</div><div class="wgrid">${grid}</div>
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
function applyTheme(id) {
  const t = THEMES[id], keep = ['id'];
  for (const cid in BASEC) { const o = BY[cid]; if (!o) continue; Object.keys(o).forEach(k => { if (!keep.includes(k)) delete o[k]; }); Object.assign(o, BASEC[cid]); if (t && t.cards[cid]) Object.assign(o, t.cards[cid]); }
  S.themeApplied = id;
}
function themeNow() { return (S.v && S.v.settings && THEMES[S.v.settings.theme]) ? S.v.settings.theme : 'classic'; }
function setSettings() {
  const m = document.querySelector('input[name=mode]:checked'), g = document.querySelector('input[name=game]:checked'), l = document.querySelector('input[name=ulevel]:checked');
  const th = document.querySelector('input[name=theme]:checked');
  api('settings', { theme: th ? th.value : 'classic', roles: $('#roles') ? $('#roles').checked : true, mode: m ? m.value : 'team', maxRounds: $('#rounds') ? $('#rounds').value : 8, game: g ? g.value : 'classic', ulevel: l ? l.value : 'hard' });
}

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
  <div class="panel"><h3>${T('Người chơi', 'Players')} (${v.players.length}/${v.settings.game === 'ultima' ? 12 : 6})</h3><div class="strip">${pls}</div>${host && v.players.length < (v.settings.game === 'ultima' ? 12 : 6) ? `<div style="margin-top:10px"><button class="btn sec" onclick="api('addbot',{lang:S.lang})">🤖 ${T('Thêm máy', 'Add bot')}</button></div>` : ''}</div>
  <div class="panel"><h3>${T('Cài đặt', 'Settings')}</h3>
  ${host ? `<div class="lab">${T('BỘ BÀI (CHỦ ĐỀ)', 'CARD THEME')}</div><div class="themes">${[['classic', { icon: '🏮', vi: 'Cổ điển (tranh vẽ)', en: 'Classic (painted)' }], ...Object.entries(THEMES)].map(([id, t]) => `<label class="th ${themeNow() === id ? 'on' : ''}"><input type="radio" name="theme" value="${id}" ${themeNow() === id ? 'checked' : ''} onchange="setSettings()"><span class="ti">${t.icon}</span><span>${T(t.vi, t.en)}</span></label>`).join('')}</div>` : `<div class="en" style="margin-bottom:8px">${T('Bộ bài', 'Card theme')}: <b>${themeNow() === 'classic' ? T('Cổ điển', 'Classic') : (THEMES[themeNow()] ? T(THEMES[themeNow()].vi, THEMES[themeNow()].en) : '')}</b></div>`}
  ${host ? `<div class="lab">${T('LOẠI GAME', 'GAME')}</div><label class="row" style="margin-bottom:6px"><input type="radio" name="game" value="classic" ${v.settings.game !== 'ultima' ? 'checked' : ''} onchange="setSettings()"> <span>${T('Cổ điển (2–6 người)', 'Classic (2–6 players)')}</span></label><label class="row" style="margin-bottom:12px"><input type="radio" name="game" value="ultima" ${v.settings.game === 'ultima' ? 'checked' : ''} onchange="setSettings()"> <span><b>Ultima</b> ${T('(Luật v2, 3–12 người)', '(Rules v2, 3–12 players)')}</span></label>
  ${v.settings.game === 'ultima' ? `<div class="lab">${T('MỨC CHƠI', 'LEVEL')}</div><label class="row" style="margin-bottom:6px"><input type="radio" name="ulevel" value="hard" ${v.settings.ulevel !== 'normal' ? 'checked' : ''} onchange="setSettings()"> <span>${T('Khó: vai trò, thẻ hành động, ban đêm, họp làng (cần ≥6 người)', 'Hard: roles, action cards, night, village vote (needs 6+ players)')}</span></label><label class="row" style="margin-bottom:12px"><input type="radio" name="ulevel" value="normal" ${v.settings.ulevel === 'normal' ? 'checked' : ''} onchange="setSettings()"> <span>${T('Bình thường: chỉ Hồ Sơ Mật (Clue), người cuối cùng thắng', 'Normal: Clue only, last one standing wins')}</span></label>
  ${v.settings.ulevel === 'normal' || v.players.length < 6 ? `<label class="row">${T('Số vòng tối đa', 'Round limit')}: <input type="number" id="rounds" min="4" max="20" value="${v.settings.maxRounds}" style="width:90px" onchange="setSettings()"></label>` : ''}
  ${v.settings.ulevel !== 'normal' && v.players.length < 6 ? `<div class="en" style="margin-top:8px">${T('Dưới 6 người: tự chơi như mức Bình thường.', 'Under 6 players: plays as Normal.')}</div>` : ''}
  <div style="margin-top:14px"><button class="btn" ${v.players.length < 3 ? 'disabled' : ''} onclick="api('start')">${T('Bắt đầu ván', 'Start game')}</button></div>` : ''}
  ${v.settings.game !== 'ultima' ? `<div class="lab">${T('CHẾ ĐỘ', 'MODE')}</div><label class="row" style="margin-bottom:6px"><input type="radio" name="mode" value="team" ${v.settings.mode !== 'ffa' ? 'checked' : ''} onchange="setSettings()"> <span>${T('Chế độ Đội: phe Thiện đấu Đồng phạm', 'Team mode: Good vs the Accomplice')}</span></label><label class="row" style="margin-bottom:12px"><input type="radio" name="mode" value="ffa" ${v.settings.mode === 'ffa' ? 'checked' : ''} onchange="setSettings()"> <span>${T('Chế độ Một mình: ai cũng tự thắng, chỉ 1 người thắng', 'Free-for-all: every player alone, only 1 winner')}</span></label><label class="row" style="margin-bottom:10px"><input type="checkbox" id="roles" ${v.settings.roles ? 'checked' : ''} onchange="setSettings()"> ${T('Dùng thẻ vai trò (cần từ 3 người)', 'Use role cards (needs 3+ players)')}</label>
  <label class="row">${T('Số vòng tối đa', 'Round limit')}: <input type="number" id="rounds" min="4" max="20" value="${v.settings.maxRounds}" style="width:90px" onchange="setSettings()"></label>
  <div class="en" style="margin-top:8px">${T('Độ khó', 'Difficulty')}: <b>${v.cfg.name}</b> (${T('chỉnh trong start.bat', 'set in start.bat')})</div>
  <div style="margin-top:14px"><button class="btn" ${v.players.length < 2 ? 'disabled' : ''} onclick="api('start')">${T('Bắt đầu ván', 'Start game')}</button></div>` : ''}`
      : v.settings.game === 'ultima' ? `<div><b>Ultima</b> · ${T('Mức', 'Level')}: <b>${v.settings.ulevel === 'normal' ? T('Bình thường', 'Normal') : T('Khó', 'Hard')}</b></div><div class="en" style="margin-top:8px">${T('Chờ chủ phòng bắt đầu…', 'Waiting for the host to start…')}</div>`
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
  if (v.ult) return v.myRole === 'police' && !v.used.power ? `<button class="btn sec" onclick="arrestUlt()">🚔 ${T('Bắt giữ (1 lần)', 'Arrest (once)')}</button>` : '';
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
    return `<div class="pp ${turn ? 'turn' : ''} ${p.elim ? 'elim' : ''}"><div class="fr">${turn ? `<em>${T('LƯỢT', 'TURN')}</em>` : ''}${avatar(i, 56)}${p.elim ? '<b class="x">✕</b>' : ''}${ans ? '<b class="bub">…</b>' : ''}<u>${p.cards}</u>${v.ult && v.ult.hard && !p.elim ? `<s class="ac">🃏${p.acts}</s>` : ''}</div><div class="n"><span class="dot ${p.id === v.me ? '' : (p.status === 'away' ? 'away' : p.connected ? '' : 'off')}"></span>${p.id === v.me ? T('Bạn', 'You') : esc(p.name)}</div>${p.elim && v.ult && v.ult.revealed[p.id] && v.ult.revealed[p.id].role ? `<div class="rt">${esc(LN(ROLES[v.ult.revealed[p.id].role]))}</div>` : ''}</div>`;
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
      if (!pd.cat) {
        const dn3 = (v.players.find(p => p.id === pd.disprover) || {}).name;
        main += pd.disprover === v.me ? `<div class="panel" style="border-color:var(--gold)"><h3>${T(`${esc(sn)} thẩm vấn bạn!`, `${esc(sn)} interrogates you!`)}</h3><div class="lab">${T('CHỌN 1 LÁ ĐỂ BÍ MẬT CHO XEM', 'PICK 1 CARD TO SHOW SECRETLY')} <span class="cd" data-cd="ult.ansLeft" data-int="1"></span></div><div class="cards">${pd.match.map(id => cardHTML(id, 0.6, 'pick', `show('${id}')`)).join('')}</div></div>` : `<div class="panel">${T(`${esc(sn)} đang thẩm vấn ${esc(dn3)}…`, `${esc(sn)} is interrogating ${esc(dn3)}…`)}</div>`;
      } else if (pd.disprover === v.me) main += `<div class="panel" style="border-color:var(--gold)"><h3>${T(`Thám tử ${esc(sn)} yêu cầu bạn cho xem 1 lá ${CATN[pd.cat][0].toLowerCase()}`, `Detective ${esc(sn)} wants to see 1 ${CATN[pd.cat][1].toLowerCase().replace(/s$/, '')} card`)}</h3><div class="lab">${T('CHỌN 1 LÁ ĐỂ BÍ MẬT CHO XEM', 'PICK 1 CARD TO SHOW SECRETLY')}</div><div class="cards">${pd.match.map(id => cardHTML(id, 0.6, 'pick', `show('${id}')`)).join('')}</div></div>`;
      else if (pd.cat) main += `<div class="panel">${T(`Thám tử ${esc(sn)} đang yêu cầu ${esc(dn2)} cho xem 1 lá ${CATN[pd.cat][0].toLowerCase()}…`, `Detective ${esc(sn)} is making ${esc(dn2)} show a ${CATN[pd.cat][1].toLowerCase().replace(/s$/, '')} card…`)}</div>`;
    } else if (pd.disprover === v.me) {
      main += `<div class="panel" style="border-color:var(--gold)"><h3>${T(`${esc(sn)} đang hỏi bạn!`, `${esc(sn)} is asking you!`)} ${v.ult ? '<span class="cd" data-cd="ult.ansLeft" data-int="1"></span>' : ''}</h3><div class="lab">${T('CHỌN 1 LÁ ĐỂ BÍ MẬT CHO XEM', 'PICK 1 CARD TO SHOW SECRETLY')}</div><div class="cards">${pd.match.map(id => cardHTML(id, 0.6, 'pick', `show('${id}')`)).join('')}</div>${v.ult && v.ult.hard && v.myRole !== 'detective' && v.ult.myActs.some(a => atype(a) === 'false') ? `<div style="margin-top:10px"><button class="btn sec" onclick="falseNow()">🤥 ${T('Dùng Lời khai giả: không cho xem gì', 'Use False testimony: show nothing')}</button></div>` : ''}${pd.canLie ? `<div style="margin-top:10px"><button class="btn sec" onclick="lie()">${T('Giấu lá (Đồng phạm, 1 lần): nói không có', 'Withhold (Accomplice, once): say none')}</button></div>` : ''}</div>`;
    }
  }
  let actionBar = '';
  const uw = v.ult && v.ult.window, ubusy = v.ult && (v.ult.sub !== 'turn' || uw);
  if (myTurn && !pd && !ubusy) {
    const seize = v.teamMode && v.myRole === 'accomplice', left = v.turn.max - v.turn.suggests;
    if (S.wiz) main = wizHTML(v);
    else {
      main += `<div class="bigturn"><div class="bt-av">${avatar(v.players.findIndex(p => p.id === v.me), 96)}</div><div class="bt-t">${T('Lượt của bạn', 'Your turn')}</div></div>`;
      main += `<div class="pwr">${powerHTML(v)}</div>`;
      actionBar = `<div class="abar"><button class="btn sec" onclick="toggleNB()">${T('Sổ tay', 'Notebook')}</button><button class="btn" onclick="wizOpen('suggest')" ${left <= 0 ? 'disabled' : ''}>${T('Đặt giả thuyết', 'Suggest')}${left > 1 ? ` (${left})` : ''}</button><button class="btn red" onclick="wizOpen('accuse')">${seize ? T('Chiếm đáp án', 'Seize') : T('Buộc tội', 'Accuse')}</button><button class="btn sec" onclick="doEnd()">${T('Kết thúc lượt', 'End turn')}</button></div>`;
    }
  } else if (S.wiz) S.wiz = null;
  const nC = v.hand.length + v.secrets.length, avail = Math.min(innerWidth - (S.nbOpen ? 460 : 70), 1100), tsc = Math.max(0.3, Math.min(0.5, (avail - 60 - (nC - 1) * 8 - (v.secrets.length ? 24 : 0)) / (Math.max(nC, 1) * 232)));
  const tray = `<div class="tray"><div class="tab">${T('MẢNH BÀI CỦA BẠN', 'YOUR CARDS')} (${v.hand.length})</div>${v.myRole ? `<button class="pill rolebtn" onclick="showRole()">${T('Vai trò của tôi', 'My role')}</button>` : ''}
  <div class="trow"><div class="cards">${v.hand.map(id => cardHTML(id, tsc)).join('')}</div>
  ${v.secrets.length ? `<div class="sec"><div class="lab">${T('BÍ MẬT TỪ VAI TRÒ', 'SECRET FROM ROLE')}</div><div class="cards">${v.secrets.map(id => cardHTML(id, tsc)).join('')}</div></div>` : ''}</div></div>`;
  const nbPanel = S.nbOpen ? `<aside class="nbp"><div class="nbin"><div class="nbtop"><h3>${T('Sổ tay', 'Notebook')}</h3><div class="nbtabs"><button class="${S.nbTab !== 'hist' ? 'on' : ''}" onclick="S.nbTab='notes';render()">${T('Manh mối', 'Clues')}</button><button class="${S.nbTab === 'hist' ? 'on' : ''}" onclick="S.nbTab='hist';render()">${T('Lịch sử', 'History')} ${(v.hist || []).length}</button></div><button class="pill" onclick="toggleNB()">✕</button></div>${S.nbTab === 'hist' ? histHTML() : notebookHTML()}</div></aside>` : '';
  const info = v.ult ? `<span class="pill">Ultima ${v.ult.hard ? T('Khó', 'Hard') : T('Thường', 'Normal')}</span>${v.ult.hard ? `<span class="pill">📚 ${T('Chồng', 'Pile')} ${v.ult.pile}</span>` : ''}${v.turnLeft !== undefined ? `<span class="pill">⏱ <span class="cd" data-cd="turnLeft" data-int="1"></span></span>` : ''}` : `<span class="pill team">${v.teamMode ? T('Đội', 'Team') : T('Một mình', 'Solo')}</span>${v.turnLeft !== undefined ? `<span class="pill">⏱ <span class="cd" data-cd="turnLeft" data-int="1"></span></span>` : ''}`;
  let actTray = '', ovl = '';
  if (v.ult && v.ult.hard && !v.over) {
    const mine = v.ult.myActs, can = myTurn && !pd && !ubusy, bs = S.blankSel || [];
    const pairOk = bs.length === 2 && bs[0].split('_')[1][0] === bs[1].split('_')[1][0];
    actTray = `<div class="tray atray"><div class="tab">${T('THẺ HÀNH ĐỘNG', 'ACTION CARDS')} (${mine.length})</div><div class="trow"><div class="acts">${mine.length ? mine.map(id => { const t = atype(id), react = t === 'counter' || t === 'false'; return actHTML(id, { cls: react ? 'react' : (can ? 'ok' : 'dim'), sel: bs.includes(id), click: can && !react ? `playAct('${id}')` : '' }); }).join('') : `<div class="en">${T('Bạn chưa có thẻ hành động nào.', 'You have no action cards.')}</div>`}</div></div>${pairOk && can ? `<div style="text-align:center;margin-top:8px"><button class="btn" onclick="playPair()">${T('Chơi cặp Giấy trắng: lấy 1 lá', 'Play the Blank pair: take 1 card')}</button></div>` : ''}</div>`;
    if (uw) {
      const top = uw.chain[uw.chain.length - 1], nmx = id => id === v.me ? T('Bạn', 'You') : esc((v.players.find(p => p.id === id) || {}).name), cn = c => c.cards ? T('Giấy trắng ×2', 'Blank ×2') : esc(S.lang === 'en' ? ACT[atype(c.card)].en : ACT[atype(c.card)].vi);
      const hasC = mine.some(a => atype(a) === 'counter') && top.by !== v.me && !me.elim;
      ovl += `<div class="cwin"><div class="cwt">${uw.chain.map((c, i) => `<span class="cwc ${i ? 'ctr' : ''}">${nmx(c.by)}: ${cn(c)}</span>`).join(' → ')}</div><div class="cwb"><span class="cd" data-cd="ult.window.left"></span>${hasC ? `<button class="btn red" onclick="counterNow()">✋ ${T('PHẢN ĐỐI!', 'COUNTER!')}</button>` : ''}</div></div>`;
    }
    if (v.ult.night) {
      const n = v.ult.night;
      ovl += `<div class="ovl night"><div class="ob"><div class="moon">🌙</div><h2>${T('Đêm xuống', 'Night falls')}</h2><div class="cdbig"><span class="cd" data-cd="ult.night.left" data-int="1"></span></div>${n.amDet && !me.elim ? `<div class="lab" style="margin-top:14px">${T('THÁM TỬ: CHỌN 1 NGƯỜI ĐỂ SOI', 'DETECTIVE: PICK 1 PLAYER TO INSPECT')}</div><div class="tgl">${v.players.map((p, i) => p.id !== v.me && !p.elim ? `<button class="btn sec ${n.picked === p.id ? 'sel' : ''}" onclick="nightPick('${p.id}')">${avatar(i, 26)} ${esc(p.name)}</button>` : '').join('')}</div>${n.picked ? `<div class="en">✓ ${T('Đã chọn. Giữ bình tĩnh, đừng để lộ.', 'Chosen. Stay calm, do not give yourself away.')}</div>` : ''}` : `<p>${T('Nhắm mắt lại… Đừng nói gì và đừng cho ai biết bạn là ai.', 'Close your eyes… Stay silent and do not reveal who you are.')}</p>`}</div></div>`;
    }
    if (v.ult.vote) {
      const vt = v.ult.vote;
      ovl += `<div class="ovl vote"><div class="ob"><h2>🗳️ ${T('Họp làng', 'Village meeting')}</h2><div class="cdbig"><span class="cd" data-cd="ult.vote.left" data-int="1"></span></div><p>${T('Cần hơn một nửa số người còn lại cùng chọn 1 người để giam. Hòa phiếu hoặc bỏ qua: không ai bị giam.', 'More than half of the remaining players must pick the same person to jail them. Tie or abstain: nobody is jailed.')}</p>${vt.can ? `<div class="tgl">${v.players.map((p, i) => p.id !== v.me && !p.elim ? `<button class="btn sec ${vt.mine === p.id ? 'sel' : ''}" onclick="voteFor('${p.id}')">${avatar(i, 26)} ${esc(p.name)}</button>` : '').join('')}<button class="btn sec ${vt.mine === 'abstain' ? 'sel' : ''}" onclick="voteFor('abstain')">${T('Bỏ qua', 'Abstain')}</button></div>` : `<div class="en">${me.elim ? T('Bạn đã bị loại: chỉ được xem.', 'You are out: spectate only.') : T('Đồng phạm chưa được bỏ phiếu trước vòng 5 (tự động Bỏ qua).', 'Accomplices cannot vote before round 5 (auto Abstain).')}</div>`}<div class="en" style="margin-top:10px">${T('Đã bỏ phiếu', 'Voted')}: ${vt.voted.length}/${v.players.filter(p => !p.elim).length}</div></div></div>`;
    }
    if (v.ult.lastVote && S.seenVote !== v.ult.lastVote.round + ':' + v.round) { S.seenVote = v.ult.lastVote.round + ':' + v.round; setTimeout(showVoteResult, 50); }
  }
  const hint = v.ult && v.ult.hint ? `<div class="hintbar">🕵️ ${T('Gợi ý Nhân chứng: hung thủ là', 'Witness hint: the murderer is')} <b>${v.ult.hint.map(id => cname(id)).join(` ${T('hoặc', 'or')} `)}</b></div>` : '';
  return `<div class="felt ${S.nbOpen ? 'withnb' : ''}">${nbPanel}<div class="tbl"><div class="rcorner ${v.maxRounds && v.round >= v.maxRounds ? 'last' : ''}"><small>${T('VÒNG', 'ROUND')}</small><b>${v.round}${v.maxRounds ? `<i>/${v.maxRounds}</i>` : ''}</b></div><div class="top2">${topBar()}<div class="r2">${info}${S.nbOpen ? '' : `<button class="pill on" onclick="toggleNB()">${T('Sổ tay', 'Notebook')}</button>`}</div></div><div class="pstrip">${strip}</div>${hint}${main}${tray}${actTray}${actionBar}</div>${ovl}</div>`;
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
  if (S.v && BASEC.s0 && S.themeApplied !== themeNow()) applyTheme(themeNow());
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

let THEMES = {}, BASEC = {};
fetch('/themes.json').then(r => r.json()).then(t => { THEMES = t.themes || {}; if (S.v) render(); }).catch(() => {});
fetch('/cards.json').then(r => r.json()).then(c => {
  CARDS = c; for (const k of ['s', 'w', 'l']) c[k].forEach(x => { BY[x.id] = x; BASEC[x.id] = JSON.parse(JSON.stringify(x)); }); c.roles.forEach(r => (ROLES[r.id] = r));
  if (S.session) connect(); else render();
});

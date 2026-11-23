// Local accounts + stats. Everything is stored on the HOST PC in DATA_DIR (default ./data).
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DIR, 'accounts.json');
const TOKEN_DAYS = 90, HISTORY_MAX = 200;
let db = { users: {}, tokens: {}, history: [] };
try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) {}
try { db = { ...db, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }; } catch (e) {}

let timer = null;
function save() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    try { const tmp = FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, FILE); } catch (e) { console.error('[accounts] save failed:', e.message); }
  }, 300);
}
function flush() { if (timer) { clearTimeout(timer); timer = null; } try { fs.writeFileSync(FILE + '.tmp', JSON.stringify(db)); fs.renameSync(FILE + '.tmp', FILE); } catch (e) {} }
process.on('exit', flush);

const keyOf = n => String(n).toLowerCase();
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const E = (vi, en) => ({ error: { vi, en } });
const cleanName = s => String(s || '').replace(/[<>&"'\\/]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);

// brute-force guard: 8 failures per 10 minutes per (ip+name)
const fails = new Map();
function limited(id) { const f = fails.get(id); return f && f.n >= 8 && Date.now() - f.t < 600000; }
function fail(id) { const f = fails.get(id); if (!f || Date.now() - f.t > 600000) fails.set(id, { n: 1, t: Date.now() }); else f.n++; }

function issue(key) {
  const token = crypto.randomBytes(24).toString('hex');
  db.tokens[token] = { key, t: Date.now() };
  // drop expired / excess tokens
  const lim = Date.now() - TOKEN_DAYS * 864e5;
  for (const [k, v] of Object.entries(db.tokens)) if (v.t < lim) delete db.tokens[k];
  save();
  return token;
}
function who(token) {
  const t = db.tokens[String(token || '')];
  if (!t || Date.now() - t.t > TOKEN_DAYS * 864e5) return null;
  const u = db.users[t.key]; return u ? { key: t.key, user: u } : null;
}
const blank = () => ({ played: 0, won: 0, byRole: {}, byMode: {} });

function register(name, password, ip) {
  name = cleanName(name); password = String(password || '');
  if (name.length < 2) return E('Tên cần ít nhất 2 ký tự.', 'Name needs at least 2 characters.');
  if (password.length < 4) return E('Mật khẩu cần ít nhất 4 ký tự.', 'Password needs at least 4 characters.');
  const key = keyOf(name);
  if (db.users[key]) return E('Tên này đã có người dùng.', 'That name is taken.');
  const salt = crypto.randomBytes(16).toString('hex');
  db.users[key] = { name, salt, hash: hash(password, salt), created: Date.now(), last: Date.now(), stats: blank() };
  return { ok: true, name, acct: issue(key) };
}
function login(name, password, ip) {
  name = cleanName(name); password = String(password || '');
  const key = keyOf(name), lid = ip + '|' + key;
  if (limited(lid)) return E('Sai quá nhiều lần. Thử lại sau vài phút.', 'Too many wrong attempts. Try again in a few minutes.');
  const u = db.users[key];
  const ok = u && crypto.timingSafeEqual(Buffer.from(hash(password, u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
  if (!ok) { fail(lid); return E('Sai tên hoặc mật khẩu.', 'Wrong name or password.'); }
  fails.delete(lid); u.last = Date.now();
  return { ok: true, name: u.name, acct: issue(key) };
}
function logout(token) { if (db.tokens[token]) { delete db.tokens[token]; save(); } return { ok: true }; }
function changePassword(token, oldPw, newPw) {
  const w = who(token); if (!w) return E('Hãy đăng nhập lại.', 'Please log in again.');
  if (String(newPw || '').length < 4) return E('Mật khẩu mới cần ít nhất 4 ký tự.', 'New password needs at least 4 characters.');
  if (hash(String(oldPw || ''), w.user.salt) !== w.user.hash) return E('Mật khẩu cũ không đúng.', 'Old password is wrong.');
  w.user.salt = crypto.randomBytes(16).toString('hex'); w.user.hash = hash(String(newPw), w.user.salt);
  for (const [k, v] of Object.entries(db.tokens)) if (v.key === w.key && k !== token) delete db.tokens[k];
  save(); return { ok: true };
}
function me(token) {
  const w = who(token); if (!w) return null;
  const games = db.history.filter(h => h.players.some(p => keyOf(p.name) === w.key)).slice(-10).reverse();
  return { name: w.user.name, stats: w.user.stats, created: w.user.created, games };
}

// Called once when a game ends. room.players[i].acct = account key (humans only).
function record(room) {
  const g = room.g; if (!g || !g.over || g.recorded) return; g.recorded = true;
  const mode = room.settings.game === 'ultima' ? 'ultima' : 'classic';
  const winners = new Set(g.over.winners || []);
  const entry = { t: Date.now(), mode, team: g.over.team, players: [] };
  for (const p of room.players) {
    const role = (g.roles && g.roles[p.id]) || 'none', won = winners.has(p.id);
    entry.players.push({ name: p.name, role, won, bot: !!p.bot });
    const u = p.acct && db.users[p.acct]; if (!u) continue;
    const s = u.stats || (u.stats = blank());
    s.played++; if (won) s.won++;
    const r = s.byRole[role] || (s.byRole[role] = { played: 0, won: 0 }); r.played++; if (won) r.won++;
    const m = s.byMode[mode] || (s.byMode[mode] = { played: 0, won: 0 }); m.played++; if (won) m.won++;
  }
  db.history.push(entry); if (db.history.length > HISTORY_MAX) db.history.splice(0, db.history.length - HISTORY_MAX);
  save();
}
const nameTaken = n => !!db.users[keyOf(cleanName(n))];
module.exports = { nameTaken, register, login, logout, changePassword, me, who, record, DIR, FILE };

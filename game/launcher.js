// Launcher UI for MurdleGamr: pick settings in the browser, press Start.
// Zero dependencies. Run:  node launcher.js   (start.bat / start.sh do this for you)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { spawn, execFile } = require('child_process');

const DIR = __dirname, SETTINGS_FILE = path.join(DIR, 'launcher-settings.json');
const DEFAULTS = { port: 3000, difficulty: 'NORMAL', botSpeed: 'normal', classicTurn: 45, ultimaTurn: 90, tunnel: false, lang: 'vi' };
const BOT = { fast: 1200, normal: 2500, slow: 4000 };

let settings = { ...DEFAULTS };
try { settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) }; } catch (e) {}

let game = null, tunnel = null, onlineUrl = '', cloudflared = null, error = '';
const log = [];
const addLog = (s) => { for (const l of String(s).split(/\r?\n/)) if (l.trim()) { log.push(l.replace(/\x1b\[[0-9;]*m/g, '')); if (log.length > 120) log.shift(); } };

function clean(b) {
  const n = (v, lo, hi, d) => { v = parseInt(v, 10); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
  const s = { ...settings };
  s.port = n(b.port, 1024, 65535, s.port);
  s.difficulty = ['EASY', 'NORMAL', 'HARD'].includes(b.difficulty) ? b.difficulty : s.difficulty;
  s.botSpeed = BOT[b.botSpeed] ? b.botSpeed : s.botSpeed;
  s.classicTurn = n(b.classicTurn, 10, 600, s.classicTurn);
  s.ultimaTurn = n(b.ultimaTurn, 10, 600, s.ultimaTurn);
  s.tunnel = !!b.tunnel;
  s.lang = b.lang === 'en' ? 'en' : 'vi';
  return s;
}
const save = () => { try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2)); } catch (e) {} };

function lanIps() {
  const r = [];
  for (const list of Object.values(os.networkInterfaces())) for (const n of list || []) if (n.family === 'IPv4' && !n.internal) r.push(n.address);
  return r;
}
function detectCloudflared() {
  execFile('cloudflared', ['--version'], { windowsHide: true }, (err) => { cloudflared = !err; });
}
detectCloudflared();

function stopAll() {
  for (const p of [game, tunnel]) { try { p && p.kill(); } catch (e) {} }
  game = null; tunnel = null; onlineUrl = '';
}
function startGame() {
  stopAll(); error = ''; log.length = 0;
  const env = { ...process.env, PORT: String(settings.port), DIFFICULTY: settings.difficulty, BOT_DELAY: String(BOT[settings.botSpeed]),
    CLASSIC_TURN: String(settings.classicTurn * 1000), ULT_TURN: String(settings.ultimaTurn * 1000) };
  const g = spawn(process.execPath, ['server.js'], { cwd: DIR, env, windowsHide: true });
  game = g;
  g.stdout.on('data', addLog); g.stderr.on('data', addLog);
  g.on('exit', (code) => {
    if (game === g) {
      game = null;
      if (code) error = /EADDRINUSE/.test(log.join('\n')) ? 'port' : 'crash';
      if (tunnel) { try { tunnel.kill(); } catch (e) {} tunnel = null; onlineUrl = ''; }
    }
  });
  if (settings.tunnel && cloudflared) {
    const t = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${settings.port}`], { windowsHide: true });
    tunnel = t;
    const grab = (d) => { const m = String(d).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if (m) onlineUrl = m[0]; };
    t.stdout.on('data', grab); t.stderr.on('data', grab);
    t.on('exit', () => { if (tunnel === t) { tunnel = null; onlineUrl = ''; } });
  }
}
function openBrowser(url) {
  try {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '""', url], { windowsHide: true, detached: true, stdio: 'ignore' }).unref();
    else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  } catch (e) {}
}
function state() {
  return { running: !!game, error, settings, cloudflared: !!cloudflared, tunnelWanted: !!tunnel, onlineUrl,
    local: `http://localhost:${settings.port}`, lan: lanIps().map((ip) => `http://${ip}:${settings.port}`), log: log.slice(-12), node: process.version };
}

const PAGE = fs.readFileSync(path.join(DIR, 'launcher.html'), 'utf8');
const server = http.createServer((req, res) => {
  const json = (o, c = 200) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(PAGE); }
  if (req.method === 'GET' && req.url === '/api/state') return json(state());
  if (req.method !== 'POST') { res.writeHead(404); return res.end(); }
  let body = ''; req.on('data', (d) => { body += d; if (body.length > 1e5) req.destroy(); });
  req.on('end', () => {
    let b = {}; try { b = JSON.parse(body || '{}'); } catch (e) {}
    if (req.url === '/api/save') { settings = clean(b); save(); return json(state()); }
    if (req.url === '/api/start') { settings = clean(b); save(); startGame(); return json(state()); }
    if (req.url === '/api/stop') { stopAll(); return json(state()); }
    if (req.url === '/api/open') { openBrowser(`http://localhost:${settings.port}`); return json({ ok: 1 }); }
    if (req.url === '/api/quit') { json({ ok: 1 }); setTimeout(() => { stopAll(); process.exit(0); }, 200); return; }
    res.writeHead(404); res.end();
  });
});

function listen(port, tries) {
  server.once('error', (e) => { if (e.code === 'EADDRINUSE' && tries > 0) listen(port + 1, tries - 1); else { console.error(e.message); process.exit(1); } });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`;
    console.log('\n  MurdleGamr - Launcher');
    console.log(`  Settings window: ${url}  (opening in your browser)`);
    console.log('  Keep this window open while you play. Close it (or press Quit in the page) to stop everything.\n');
    if (!process.env.NO_OPEN) openBrowser(url);
  });
}
listen(parseInt(process.env.LAUNCHER_PORT || '3999', 10), 20);
process.on('exit', stopAll); process.on('SIGINT', () => process.exit(0)); process.on('SIGTERM', () => process.exit(0));

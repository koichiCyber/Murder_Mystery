AN MANG DINH THU / MANOR MYSTERY - web version (up to 6 players)
================================================================

TIENG VIET
----------
1. Cai Node.js (ban LTS) tu https://nodejs.org (chi lam 1 lan).
2. Giai nen thu muc nay. Tren Windows bam doi vao  start.bat
   (Mac/Linux: chay  ./start.sh  hoac  node server.js).
3. Cua so hien ra cac dia chi. Ban mo  http://localhost:3000  de tao phong.
4. Ban be CUNG WI-FI: gui dia chi "Same Wi-Fi/LAN" (dang http://192.168.x.x:3000).
   Neu Windows hoi Firewall, chon "Allow" (Private networks).
5. Ban be O XA (khac mang): dung 1 trong cac cach sau
   - Cloudflare Tunnel (de nhat, khong can tai khoan):
       cloudflared tunnel --url http://localhost:3000
     roi gui link https://....trycloudflare.com cho ban be.
   - ngrok:  ngrok http 3000   (gui link ngrok)
   - Tailscale: moi ban be vao mang Tailscale cua ban, dung IP Tailscale:3000
   - Hoac mo cong 3000 tren router (port forwarding).
6. Nguoi tao phong la chu phong: chinh cai dat (the vai tro, so vong) va bam Bat dau.
   Moi nguoi nhap ten + ma phong 4 chu cai (hoac bam link moi).

Luu y
- Khong can quan tro: may chu tu chon dap an, chia bai, chia vai tro va giu bi mat.
  Moi nguoi chi thay bai/vai tro cua minh.
- Mat ket noi? Mo lai trang bang cung trinh duyet, ban tu vao lai cho cu.
- Tat cua so may chu = mat phong dang choi. Doi cong: PORT=8080 node server.js

Hai che do (chu phong chon o phong cho):
- Che do Doi: phe Thien dau Dong pham (nhu mo ta ben duoi).
- Che do Mot minh: van chia vai tro va quyen nhu cu, nhung khong co phe; ai buoc toi dung dau tien thang
  mot minh, sai thi bi loai, con 1 nguoi cuoi cung thi nguoi do thang. Het so vong = khong ai thang.

Luat tom tat: moi luot dua ra gia thuyet (nghi pham + hung khi + dia diem);
nguoi ke tiep co la trung se bi mat cho ban xem 1 la. Chac chan thi buoc toi:
dung thi thang, sai thi bi loai (van phai cho xem bai). Co the bam nut "Luat" trong game.
Tham tu: moi vong chon 1 nguoi + 1 loai bai, nguoi do phai bi mat cho xem 1 la; sai buoc toi lan dau khong bi loai.
Vai tro (tu 3 nguoi): Tham tu, Nhan chung, Phong vien, Canh sat, Nguoi vo toi (phe Thien)
va Dong pham (phe Ac). Hung thu la la NGHI PHAM trong ho so, khong phat cho ai.
Dong pham: biet NGHI PHAM + HUNG KHI, 1 lan duoc giu la khong cho xem, va co the "chiem dap an"
(doan dung = phe Ac thang, sai = bi loai va phe Thien thang).

ENGLISH
-------
1. Install Node.js (LTS) from https://nodejs.org (once).
2. Unzip this folder. On Windows double-click start.bat
   (Mac/Linux: ./start.sh or node server.js).
3. The window prints the addresses. Open http://localhost:3000 to create a room.
4. Friends on the SAME Wi-Fi: send them the "Same Wi-Fi/LAN" address (http://192.168.x.x:3000).
   If Windows asks about the firewall, allow Private networks.
5. Friends elsewhere: use one of
   - Cloudflare Tunnel (easiest, no account):  cloudflared tunnel --url http://localhost:3000
     then send the https://....trycloudflare.com link
   - ngrok:  ngrok http 3000
   - Tailscale: friends join your tailnet and use your Tailscale IP:3000
   - or forward port 3000 on your router.
6. The room creator is the host: set options (role cards, round limit) and press Start.
   Everyone enters a name + the 4-letter room code (or opens the invite link).

Two modes (host picks in the lobby):
- Team mode: Good vs the Accomplice (rules below).
- Free-for-all: same roles and powers but no teams; the first correct accusation wins alone, a wrong one
  eliminates you, the last player standing wins, and if the round limit passes nobody wins.

Notes
- No human host needed: the server picks the answer, deals cards and roles, and keeps
  secrets. Each player only ever receives their own hand and role.
- The Police can arrest 1 player once per game: the Accomplice = Police wins (Team: Good wins; Free-for-all: Police alone); wrong = Police is out.
The Detective, once per round, picks a player and a card type; that player secretly shows 1 card of it.
The Accomplice can only seize the answer from round 4 (Team) / round 5 (Free-for-all). The Accomplice can withhold a card once and may "seize the answer": a correct guess wins
for the Bad team; a wrong one eliminates them and the Good team wins.
- Disconnected? Reopen the page in the same browser and you rejoin your seat.
- Closing the server window ends running games. Change port: PORT=8080 node server.js

DIFFICULTY / DO KHO
Open start.bat (Windows) or start.sh (Mac/Linux) in a text editor. Set DIFFICULTY to EASY, NORMAL or HARD, or remove "rem " from an override line to tune one rule. Save and run again. The lobby shows the current difficulty.
Mo start.bat bang Notepad. Doi DIFFICULTY thanh EASY, NORMAL hoac HARD, hoac bo chu "rem " o dau dong de chinh tung luat. Luu lai roi chay lai.
Simulated Team win rates (bots, 200 games): EASY Good 87% | NORMAL Good ~50% | HARD Good ~43%.

ONLINE PLAY / CHOI ONLINE
start.bat starts a free Cloudflare Quick Tunnel when USE_TUNNEL=1 (default). Install once: winget install Cloudflare.cloudflared. A second window shows an address ending in .trycloudflare.com: send it to your friends. The address changes each run. Set USE_TUNNEL=0 to play on your home network only (friends open http://YOUR-PC-IP:3000).
Cai 1 lan: winget install Cloudflare.cloudflared. Chay start.bat, gui dia chi .trycloudflare.com cho ban be. Dia chi doi moi lan chay. Dat USE_TUNNEL=0 neu chi choi trong mang nha.

TUNNEL NOTE: Cloudflare Quick Tunnels do not support live streams (SSE), so on a trycloudflare.com address the game polls every 1.5 s instead. The red "stream canceled" lines in the tunnel window are harmless on older versions; this version avoids them.

UI: green-table layout with a notebook that fills itself in (cards in your hand, cards shown to you, who passed on a suggestion, and deductions). The log was removed.

LANGUAGE: use the VI / EN buttons at the top; the game shows one language at a time (default Vietnamese).


BOTS: in the lobby press 'Add bot / Thêm máy' to play solo. Speed: BOT_DELAY (ms, default 2500).

ULTIMA MODE: choose "Ultima" in the lobby (3-10 players). Timers (ms): ULT_TURN, ULT_WINDOW, ULT_NIGHT, ULT_VOTE, ULT_ANSWER.

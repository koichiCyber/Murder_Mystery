# MurdleGamr – Án Mạng Dinh Thự (Murder_Mystery)

A Vietnamese-themed Murdle/Cluedo-style deduction card game for up to 6 friends, with role cards and a web version you host from your own PC.
Trò chơi suy luận án mạng phong cách Việt (kiểu Murdle/Cluedo) cho tối đa 6 người, có thẻ vai trò và bản web tự chạy trên máy của bạn.

## Play / Cách chơi
Needs [Node.js](https://nodejs.org) (LTS). No other dependencies.

```
cd game
# Windows: double-click start.bat      Mac/Linux: ./start.sh
```
Open http://localhost:3000, create a room, share the 4-letter code. Friends on the same network use `http://YOUR-PC-IP:3000`.
For online play, `start.bat` can start a free Cloudflare Quick Tunnel (`winget install Cloudflare.cloudflared`, then it prints a `.trycloudflare.com` address).

## Difficulty / Độ khó
Edit the top of `game/start.bat` (or `start.sh`): `DIFFICULTY=EASY | NORMAL | HARD`, plus optional overrides (Accomplice sees the weapon, first round to seize the answer, withhold, Police wrong arrest, Detective retry, round limit).

## Rules in short / Luật tóm tắt
- 6 suspects, 6 weapons, 9 locations. 3 cards (1 of each) are the secret answer; the other 18 are dealt equally. The Murderer is the suspect in the case file and is never dealt.
- Each turn: suggest a suspect + weapon + location; the next player holding a match secretly shows you 1 card. Accuse when sure: right wins, wrong is out.
- Roles: Detective (each round make a player show 1 card of a type; first wrong accusation is free), Witness (knows the location), Reporter (ask how many cards of a type), Innocent (second suggestion), Police (once: arrest a player; the Accomplice means Police wins, otherwise Police is out), Accomplice (knows suspect + weapon, may withhold a card once, can only seize the answer from a late round).
- Modes: **Team** (Good vs Bad) and **Free-for-all** (one winner).
- The in-game notebook fills itself in from what you see and deduce.

## Printable cards / Thẻ in
The card art is generated as SVG by the Python scripts in `cards/`. From that folder, `python3 build_cards_json.py` rebuilds `game/public/cards.json` (used by the web game) and the printable Letter-size sheets in `cards/out/`.

## Layout
```
game/    web game (server.js, public/, start.bat, start.sh)
cards/   card art generators (gen2.py, gen3.py, gen4.py, suspects2.py, build_cards_json.py)
```


## Solo play with bots / Chơi một mình với máy
In the lobby the host presses **Add bot / Thêm máy** (up to 6 players total). Bots play every role. Speed: env `BOT_DELAY` (ms, default 2500).
Trong phòng chờ, chủ phòng bấm **Thêm máy**. Chỉnh tốc độ bằng biến `BOT_DELAY` (ms).


## Background music / Nhạc nền
Drop .mp3/.ogg/.wav files into game/public/music/ (see README.txt there for CC0 suggestions). A 🎵 button appears in the top bar.
Bỏ file nhạc vào game/public/music/; nút 🎵 hiện trên thanh trên.

## Ultima mode (Luật v2) / Chế độ Ultima
Pick **Ultima** in the lobby (3–12 players, bots allowed). Levels: **Hard** (≥6 players: roles Detective/Forensic/Police/Witness/Villager/Accomplice, 9 action cards, night phase, village vote, evidence pile, 90 s turns) and **Normal** (Clue only, last one standing). Rules are in the in-game Rules button. Timers can be tuned with env vars: `ULT_TURN`, `ULT_WINDOW` (counter window), `ULT_NIGHT`, `ULT_VOTE`, `ULT_ANSWER` (milliseconds). Card counts are a starting point and still need real play-testing / balancing.
Chọn **Ultima** trong phòng chờ (3–12 người, có thể thêm máy). Chi tiết luật xem nút Luật trong game.


Classic mode timer: each turn lasts 45 seconds (env CLASSIC_TURN in ms); the clock pauses while a suggestion is being answered and the turn passes automatically at zero.


**Card themes / Bộ bài chủ đề:** pick in the lobby (host): Classic (painted), Modern day, Showbiz stars (fictional celebrities), Space station. Data in `game/public/themes.json`, regenerate with `python3 cards/build_themes.py`. Art is generated emoji-and-decor SVG; to use painted art, replace a card's `svg` with an `<img>` in themes.json.


**Latest changes / Cập nhật mới:** ready check before every game (everyone presses Ready, 40 s timeout, env RC_TIMEOUT); end-of-game recap (summary, all hands, question history, timeline); mobile layout pass; Ultima Hard balance: Accomplices know the SUSPECT from the start and learn the WEAPON from round 5 (env ULT_ACC_W_ROUND), the evidence pile has extra blank cards so it lasts about 6-7 rounds (env ULT_PILE_X, extra blanks per player, default 1.8). Seizing starts at round 4 (env ULT_SEIZE_ROUND); the second Accomplice joins from 9 players, the third at 12. Action cards now have painted art (game/public/art/a_*.jpg).


## Launcher (start.bat / start.sh)
Double-click `start.bat` (Windows) or run `./start.sh`: a settings page opens in the browser (difficulty, bot speed, turn times, port, optional internet link via Cloudflare Tunnel). Press START, then share the addresses it shows. The old direct scripts are `start-direct.bat` / `start-direct.sh`. For friends without Node.js, put a portable `node.exe` in a `node` folder next to `start.bat` (the friends pack zip does this).

## Accounts (stored on the host PC)
Players must log in (name + password, 4+ chars). Accounts, password hashes (scrypt), win/loss stats and recent games are saved in `game/data/accounts.json` on the PC that runs the server; phones just connect to that host. Back up by copying the `data` folder. Set `DATA_DIR` to change the location. Guests can play with just a name (no saved stats; names of registered accounts are reserved). Set `ALLOW_GUESTS=0` to require accounts.

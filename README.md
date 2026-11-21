# Murder_Mystery – Án Mạng Dinh Thự

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

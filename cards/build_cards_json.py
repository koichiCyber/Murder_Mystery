"""Rebuild ../game/public/cards.json (card art + text for the web game).
Run from this folder:  python3 build_cards_json.py
Also regenerates the printable sheets in ./out/ (imported generators write them)."""
import json, os
from gen4 import *

def mk(kind, lst):
    return [{"id": f"{kind}{i}", "vi": vi, "en": en, "tag": tag, "svg": fn()} for i, (vi, en, tag, fn) in enumerate(lst)]

ids = {"Detective": "detective", "Witness": "witness", "Reporter": "reporter", "Police": "police",
       "Innocent": "innocent", "Accomplice": "accomplice", "Murderer": "murderer"}
roles = [{"id": ids[en], "vi": vi, "en": en, "team": team, "ab_vi": a, "ab_en": b, "svg": fn()}
         for (vi, en, team, a, b, fn) in R7]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "game", "public", "cards.json")
json.dump({"s": mk("s", S), "w": mk("w", W), "l": mk("l", Lc), "roles": roles}, open(out, "w"), ensure_ascii=False)
print("wrote", os.path.normpath(out))

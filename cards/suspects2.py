# Redrawn suspect portraits (self-contained). Each returns an inline SVG, viewBox 200x150.
INK = "#1B1A2E"; GOLD = "#C9962B"; GOLD2 = "#E3B94E"; CREAM = "#F3EAD7"

def _svg(label, inner, defs=""):
    return (f'<svg viewBox="0 0 200 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" '
            f'role="img" aria-label="{label}" style="display:block"><defs>{defs}</defs>{inner}</svg>')

def _lg(i, c1, c2, x1=0, y1=0, x2=0, y2=1):
    return f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'

def _rg(i, c1, c2, cx=.5, cy=.4, r=.7):
    return f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient>'

def _p(d, f="none", s=None, sw=1, extra=""):
    st = f' stroke="{s}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' if s else ""
    return f'<path d="{d}" fill="{f}"{st}{extra}/>'

def _c(cx, cy, r, f, extra=""): return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{f}"{extra}/>'
def _e(cx, cy, rx, ry, f, extra=""): return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{f}"{extra}/>'
def _r(x, y, w, h, f, rx=0, extra=""): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{f}"{extra}/>'
def _l(x1, y1, x2, y2, s, sw=1.5): return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{s}" stroke-width="{sw}" stroke-linecap="round"/>'

def _vignette(i):
    return (f'<radialGradient id="{i}" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/>'
            f'<stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>')

def _head(k, cx=100, cy=60, w=23, h=28, fat=0):
    """head shape with gradient fill id k+'sk'; returns shape path"""
    w += fat
    d = (f"M{cx-w} {cy-4} C{cx-w} {cy-h-2} {cx+w} {cy-h-2} {cx+w} {cy-4} "
         f"C{cx+w} {cy+14} {cx+w-9} {cy+h-2} {cx} {cy+h} C{cx-w+9} {cy+h-2} {cx-w} {cy+14} {cx-w} {cy-4} Z")
    return _p(d, f"url(#{k}sk)")

def _ears(k, cx=100, cy=60, w=23, fat=0):
    w += fat
    return (_e(cx - w - 1, cy + 2, 4.2, 6, f"url(#{k}sk)") + _e(cx + w + 1, cy + 2, 4.2, 6, f"url(#{k}sk)")
            + _e(cx - w - 1, cy + 3, 1.6, 3, "#000", ' fill-opacity=".12"') + _e(cx + w + 1, cy + 3, 1.6, 3, "#000", ' fill-opacity=".12"'))

def _eyes(cx=100, cy=58, gap=10, iris="#3B2619", lash=INK, size=1.0, happy=False):
    s = ""
    for sx in (-1, 1):
        x = cx + sx * gap
        if happy:
            s += _p(f"M{x-4.2*size} {cy+1} Q{x} {cy-4*size} {x+4.2*size} {cy+1}", "none", lash, 1.8)
            continue
        s += _e(x, cy, 4.4 * size, 2.9 * size, "#FFFFFF")
        s += _c(x + sx * 0.3, cy + 0.1, 2.3 * size, iris) + _c(x + sx * 0.3, cy + 0.1, 1.1 * size, "#0b0a10")
        s += _c(x + sx * 0.3 + 0.8, cy - 0.8, 0.7, "#FFFFFF")
        s += _p(f"M{x-4.6*size} {cy-0.2} Q{x} {cy-3.8*size} {x+4.6*size} {cy-0.2}", "none", lash, 1.6)
        s += _p(f"M{x-3.8*size} {cy+1.7} Q{x} {cy+3.4*size} {x+3.8*size} {cy+1.7}", "none", "#000", 0.5, ' stroke-opacity=".35"')
    return s

def _brows(cx=100, cy=51, gap=10, col="#1F1A1A", thick=1.8, tilt=0, arch=2.5):
    s = ""
    for sx in (-1, 1):
        x = cx + sx * gap
        s += _p(f"M{x-6} {cy+tilt*sx*-1+1} Q{x} {cy-arch+tilt*sx*-1} {x+6} {cy+tilt*sx*-1+1.5}", "none", col, thick)
    return s

def _nose(cx=100, cy=66, col="#000"):
    return (_p(f"M{cx-1.2} {cy-6} Q{cx-3} {cy} {cx-3.4} {cy+2.2} Q{cx} {cy+4.2} {cx+3.4} {cy+2.2}", "none", col, 1.1, ' stroke-opacity=".38"')
            + _e(cx - 2.2, cy + 3, 0.9, 0.6, col, ' fill-opacity=".4"') + _e(cx + 2.2, cy + 3, 0.9, 0.6, col, ' fill-opacity=".4"'))

def _mouth(cx=100, cy=77, lip="#A5413F", smile=2.5, w=7, open_=False, smirk=0):
    if open_:
        return (_p(f"M{cx-w} {cy-1} Q{cx} {cy+smile+5} {cx+w} {cy-1} Q{cx} {cy+1} {cx-w} {cy-1} Z", "#6B1E1E")
                + _p(f"M{cx-w+1.5} {cy-0.6} Q{cx} {cy+1.4} {cx+w-1.5} {cy-0.6} L{cx+w-2} {cy+1.8} Q{cx} {cy+3} {cx-w+2} {cy+1.8} Z", "#FFFFFF")
                + _p(f"M{cx-w} {cy-1} Q{cx} {cy+smile+5} {cx+w} {cy-1}", "none", "#4a1414", 1.2))
    return (_p(f"M{cx-w} {cy+smirk*-1} Q{cx} {cy+smile} {cx+w} {cy+smirk}", "none", lip, 2.1)
            + _p(f"M{cx-w+2} {cy+1.4} Q{cx} {cy+smile+2.2} {cx+w-2} {cy+1.4}", "none", lip, 1, ' stroke-opacity=".55"'))

def _blush(cx=100, cy=69, gap=15, col="#E26F6A", op=.28, r=5):
    return _c(cx - gap, cy, r, col, f' fill-opacity="{op}"') + _c(cx + gap, cy, r, col, f' fill-opacity="{op}"')

def _neck(k, cx=100, y=82, w=9, h=22):
    return _r(cx - w, y, w * 2, h, f"url(#{k}sk)") + _p(f"M{cx-w} {y} Q{cx} {y+9} {cx+w} {y}", "#000", None, 0, ' fill-opacity=".16"')

def _skin_defs(k, light, base, shade):
    return (f'<radialGradient id="{k}sk" cx=".42" cy=".36" r=".85"><stop offset="0" stop-color="{light}"/>'
            f'<stop offset=".6" stop-color="{base}"/><stop offset="1" stop-color="{shade}"/></radialGradient>')

def _sparkle_dots(pts, col="#FFFFFF", op=.55):
    return "".join(_c(x, y, r, col, f' fill-opacity="{op}"') for x, y, r in pts)

# ------------------------------------------------------------------ 1. Bà Hương
def lan():
    k = "hu"
    d = (_lg(k + "bg", "#4A1220", "#9A2B3A") + _skin_defs(k, "#F6D3B3", "#E8B792", "#C98F6B")
         + _lg(k + "dr", "#D8323D", "#8E1420") + _lg(k + "go", "#F4D47A", "#B8862A") + _vignette(k + "vg")
         + _rg(k + "gl", "#FFD98A", "#FFD98A", .5, .5, .5).replace('stop-color="#FFD98A"/></radialGradient>', 'stop-color="#FFD98A" stop-opacity="0"/></radialGradient>', 1))
    s = _r(0, 0, 200, 150, f"url(#{k}bg)")
    # carved window lattice
    s += _r(112, 10, 74, 92, "none", 4, f' stroke="{GOLD2}" stroke-width="2.4" stroke-opacity=".7"')
    for i in range(-4, 6):
        s += _l(112 + i * 18, 10, 112 + i * 18 + 74, 102, GOLD2, 1) .replace("/>", ' stroke-opacity=".28"/>')
        s += _l(186 + i * 18, 10, 186 + i * 18 - 74, 102, GOLD2, 1).replace("/>", ' stroke-opacity=".28"/>')
    s += _c(34, 38, 30, f"url(#{k}gl)", ' fill-opacity=".8"')
    # lantern
    s += _l(34, 0, 34, 18, GOLD2, 1.4)
    s += _r(28, 16, 12, 4, GOLD, 1.5) + _e(34, 31, 11, 12, f"url(#{k}dr)", f' stroke="{GOLD2}" stroke-width="1.2"')
    s += _p("M26 31 Q34 24 42 31 M26 31 Q34 38 42 31", "none", GOLD2, 0.8) + _l(34, 19, 34, 43, GOLD2, 0.8)
    s += _r(29, 42, 10, 3, GOLD, 1.5) + _l(34, 45, 34, 54, "#E8B2A0", 1.2) + _c(34, 55, 1.8, GOLD2)
    # hair back + bun
    s += _p("M72 62 C70 22 130 22 128 62 C128 90 120 96 100 96 C80 96 72 90 72 62 Z", "#15101A")
    s += _e(100, 26, 15, 11, "#15101A") + _e(104, 24, 9, 5, "#3A3040", ' fill-opacity=".7"')
    # body: red ao dai
    s += _p("M24 150 Q28 112 76 100 L124 100 Q172 112 176 150 Z", f"url(#{k}dr)")
    s += _p("M100 100 L100 150", "none", "#6E0F1A", 1.2, ' stroke-opacity=".6"')
    s += _p("M76 100 Q100 116 124 100", "none", "#6E0F1A", 1.5)
    for (x, y, r) in [(52, 128, 4.5), (148, 128, 4.5), (76, 140, 3.6), (124, 140, 3.6), (100, 134, 5)]:
        s += _c(x, y, r, "none", f' stroke="{GOLD2}" stroke-width="1.6"') + _c(x, y, r * .35, GOLD2)
    s += _p("M40 118 Q56 112 66 108", "none", "#F6A0A6", 1.4, ' stroke-opacity=".5"')
    s += _neck(k, 100, 82, 9, 22)
    # mandarin collar
    s += _p("M90 90 L88 106 Q100 114 112 106 L110 90 Q100 98 90 90 Z", "#7A1020", GOLD2, 1.1)
    s += _p("M90 99 Q100 106 110 99", "none", "#F2E6C8", 1.5, ' stroke-dasharray="1.6 2"')
    s += _ears(k) + _head(k)
    # side hair / parting
    s += _p("M77 52 C77 30 123 30 123 52 C112 40 90 38 77 52 Z", "#15101A")
    s += _p("M100 31 Q95 42 80 50", "none", "#3A3040", 1, ' stroke-opacity=".8"')
    s += _p("M80 50 Q78 62 80 72", "none", "#15101A", 3)
    s += _p("M120 50 Q122 62 120 72", "none", "#15101A", 3)
    s += _brows(100, 50, 10, "#1F1A1A", 1.5, 0, 3)
    s += _eyes(100, 58, 10, "#3B2619", INK, 1.0)
    s += _nose(100, 66) + _blush(100, 70, 15, "#E26F6A", .3) + _mouth(100, 77, "#B0243A", 2.2, 6, False, 0.7)
    # jade earrings
    for sx in (-1, 1):
        s += _l(100 + sx * 24.5, 65, 100 + sx * 24.5, 70, GOLD2, 1.1) + _e(100 + sx * 24.5, 74, 2.8, 4.4, "#2EA27D", f' stroke="{GOLD2}" stroke-width="1"')
        s += _c(100 + sx * 24.5 - 0.8, 72.8, 0.8, "#BFF2DF")
    # gold hairpin + jade bead
    s += _l(88, 24, 118, 30, f"url(#{k}go)", 2.6) + _c(118, 30, 3.4, "#2EA27D", f' stroke="{GOLD2}" stroke-width="1"') + _c(117, 29, 0.9, "#CFF7E9")
    s += _p("M94 27 Q100 16 106 27", "none", GOLD2, 1.4)
    s += _r(0, 0, 200, 150, f"url(#{k}vg)")
    return _svg("Bà Hương, an elegant heiress in a red áo dài with a gold hairpin and jade earrings", s, d)

# ------------------------------------------------------------------ 2. Chú Khôi
def tu():
    k = "kh"
    d = (_lg(k + "bg", "#7A3A1C", "#D98A3A") + _skin_defs(k, "#E9B88C", "#D49A6A", "#A8703F")
         + _lg(k + "ap", "#7B4A2C", "#4F2B18") + _lg(k + "st", "#D9DDE3", "#8C95A3", 0, 0, 1, 1) + _vignette(k + "vg"))
    s = _r(0, 0, 200, 150, f"url(#{k}bg)")
    # brick wall
    for row in range(8):
        y = row * 19
        s += _l(0, y, 200, y, "#5A2A12", 1).replace("/>", ' stroke-opacity=".35"/>')
        for i in range(8):
            x = i * 30 + (15 if row % 2 else 0)
            s += _l(x, y, x, y + 19, "#5A2A12", 1).replace("/>", ' stroke-opacity=".35"/>')
    s += _c(100, 70, 62, "#FFD9A0", ' fill-opacity=".16"')
    # hanging utensils
    s += _l(0, 18, 60, 18, "#3a2412", 2) + _l(140, 18, 200, 18, "#3a2412", 2)
    for x in (12, 26, 44):
        s += _l(x, 18, x, 28, "#3a2412", 1)
    s += _e(14, 36, 7, 7, "#2A2A30") + _r(12, 18, 4, 10, "#2A2A30") + _e(30, 38, 5, 9, "#8C95A3") + _l(30, 18, 30, 30, "#8C95A3", 1.5)
    s += _p("M44 28 L44 48 L52 48 L52 28 Z", "#6B4A2E", None, 0) + _e(48, 52, 6, 4, "#6B4A2E")
    for x in (150, 168, 184):
        s += _l(x, 18, x, 27, "#3a2412", 1)
    s += _p("M144 27 h12 v16 q-6 6 -12 0 z", "#B24A2A") + _p("M162 27 h12 v12 q-6 6 -12 0 z", "#D8A24A") + _p("M178 27 h12 v18 q-6 6 -12 0 z", "#6B8E6B")
    # steam
    for (x, y) in [(140, 70), (158, 60), (176, 72)]:
        s += _p(f"M{x} {y+20} Q{x-6} {y+10} {x} {y} Q{x+6} {y-10} {x} {y-20}", "none", "#FFFFFF", 2.2, ' stroke-opacity=".35"')
    # body: chef shirt + apron
    s += _p("M20 150 Q24 110 72 100 L128 100 Q176 110 180 150 Z", "#F4EDE0")
    s += _p("M70 150 L76 108 L124 108 L130 150 Z", f"url(#{k}ap)") + _l(76, 108, 90, 98, "#4F2B18", 2.4) + _l(124, 108, 110, 98, "#4F2B18", 2.4)
    s += _r(88, 124, 24, 14, "#3E2012", 2, ' fill-opacity=".55"') + _l(88, 124, 112, 124, "#8C5A38", 1)
    s += _p("M72 102 Q100 112 128 102", "none", "#C9BFA9", 2)
    s += _neck(k, 100, 82, 10, 20)
    # head (round, chubby)
    s += _ears(k, 100, 60, 23, 3) + _head(k, 100, 60, 23, 28, 3)
    s += _blush(100, 71, 17, "#E0605A", .38, 6)
    # stubble / moustache
    s += _p("M80 74 Q100 94 120 74 Q116 88 100 92 Q84 88 80 74 Z", "#2A2220", None, 0, ' fill-opacity=".22"')
    s += _p("M84 70 Q92 64 100 69 Q108 64 116 70 Q112 78 100 74 Q88 78 84 70 Z", "#241B1A")
    s += _p("M88 69 Q92 66 96 68", "none", "#5A4640", 1)
    s += _brows(100, 50, 11, "#241B1A", 2.6, -1, 3)
    s += _eyes(100, 58, 11, "#3B2619", INK, 1.05)
    s += _nose(100, 65, "#5A2E18")
    s += _mouth(100, 78, "#7B2420", 3.2, 7.5, True)
    # headband (khan ran style red-white checker)
    s += _p("M75 46 Q100 24 125 46 L125 53 Q100 40 75 53 Z", "#C8272E")
    for i in range(9):
        for j in range(2):
            if (i + j) % 2 == 0:
                s += _r(77 + i * 5.3, 36 + j * 4.2 + 2.2 * abs(i - 4) / 4 * 0 + (abs(i - 4) ** 2) * 0.35, 5.3, 4.2, "#FFFFFF", 0, ' fill-opacity=".92"')
    s += _p("M75 46 Q100 24 125 46 L125 53 Q100 40 75 53 Z", "none", "#8E1A20", 1)
    s += _p("M124 46 L142 40 L136 52 L146 56 L128 56 Z", "#C8272E", "#8E1A20", 1)
    s += _p("M75 46 Q100 24 125 46", "none", "#FFFFFF", 1, ' stroke-opacity=".25"')
    # cleaver
    s += _p("M144 112 L184 96 L190 120 L150 128 Z", f"url(#{k}st)", INK, 1.4)
    s += _l(150, 118, 186, 106, "#FFFFFF", 1.6).replace("/>", ' stroke-opacity=".7"/>')
    s += _r(140, 118, 12, 26, "#5A3A22", 3, f' transform="rotate(-18 146 130)" stroke="{INK}" stroke-width="1.2"')
    s += _c(147, 123, 1.2, GOLD2)
    s += _r(0, 0, 200, 150, f"url(#{k}vg)")
    return _svg("Chú Khôi, a cheerful cook with a checkered headband, a moustache and a cleaver", s, d)

# ------------------------------------------------------------------ 3. Cụ đồ Khải
def khanh():
    k = "kai"
    d = (_lg(k + "bg", "#EFE5C9", "#C9BC98") + _skin_defs(k, "#EDC8A2", "#DDAE86", "#B98960")
         + _lg(k + "rb", "#2D3E8C", "#16204E") + _lg(k + "tb", "#2B3A82", "#121A44") + _vignette(k + "vg")
         + _lg(k + "bd", "#FFFFFF", "#DADAE6"))
    s = _r(0, 0, 200, 150, f"url(#{k}bg)")
    # ink wash mountains
    s += _p("M0 100 Q30 64 62 96 Q86 70 118 98 Q150 66 200 104 L200 150 L0 150 Z", "#8D9A8C", None, 0, ' fill-opacity=".35"')
    s += _p("M0 118 Q40 88 84 116 Q130 90 200 120 L200 150 L0 150 Z", "#5F7064", None, 0, ' fill-opacity=".35"')
    # bamboo
    for x in (14, 28, 178, 190):
        s += _r(x, 0, 4, 120, "#5F7A4F", 1.5, ' fill-opacity=".8"')
        for y in (22, 52, 84):
            s += _r(x - 1, y, 6, 2.4, "#3F5A34")
        s += _p(f"M{x+4} {y-12} q18 -6 26 4 q-14 2 -26 -4", "#5F7A4F", None, 0, ' fill-opacity=".8"') if x < 100 else _p(f"M{x} 40 q-18 -6 -26 4 q14 2 26 -4", "#5F7A4F", None, 0, ' fill-opacity=".8"')
    # red seal
    s += _r(160, 14, 24, 24, "#B3202A", 2) + _p("M165 20 h14 M165 26 h14 M172 20 v14 M166 32 h12", "none", "#F8E7D0", 1.8)
    # body
    s += _p("M22 150 Q28 112 74 100 L126 100 Q172 112 178 150 Z", f"url(#{k}rb)")
    s += _p("M100 108 L72 150 M100 108 L128 150", "none", "#0E1438", 1.2)
    s += _p("M86 100 Q100 118 114 100 L116 104 Q100 124 84 104 Z", "#F4F4F8")
    for (x, y) in [(56, 128), (144, 128), (100, 140)]:
        s += _c(x, y, 5, "none", f' stroke="{GOLD2}" stroke-width="1.4"') + _c(x, y, 1.6, GOLD2)
    s += _neck(k, 100, 84, 8, 20)
    s += _ears(k, 100, 60, 22) + _head(k, 100, 62, 22, 27)
    # wrinkles
    s += _p("M84 44 Q100 40 116 44", "none", "#8B5A38", 0.9, ' stroke-opacity=".55"') + _p("M86 48 Q100 45 114 48", "none", "#8B5A38", 0.7, ' stroke-opacity=".4"')
    s += _p("M80 62 q-3 3 -1 8 M120 62 q3 3 1 8", "none", "#8B5A38", 0.8, ' stroke-opacity=".5"')
    # eyes & brows (white bushy)
    s += _eyes(100, 60, 9.5, "#3B2619", "#6B5A4A", 0.95)
    s += _p("M80 52 Q89 44 98 51 Q90 51 82 55 Z", "#F6F6FA", "#BDBDCB", .6) + _p("M120 52 Q111 44 102 51 Q110 51 118 55 Z", "#F6F6FA", "#BDBDCB", .6)
    # glasses
    for sx in (-1, 1):
        s += _c(100 + sx * 9.5, 60, 8, "#CFE6EE", f' fill-opacity=".28" stroke="{GOLD}" stroke-width="1.5"')
        s += _p(f"M{100+sx*9.5-4} {56} q2 -2 5 -1.5", "none", "#FFFFFF", 1, ' stroke-opacity=".8"')
    s += _l(98, 60, 102, 60, GOLD, 1.4) + _l(80, 59, 76, 58, GOLD, 1.2) + _l(120, 59, 124, 58, GOLD, 1.2)
    s += _nose(100, 68, "#7A4A2E")
    # moustache + beard
    s += _p("M84 74 Q93 68 100 74 Q107 68 116 74 Q110 80 100 77 Q90 80 84 74 Z", f"url(#{k}bd)", "#BDBDCB", .6)
    s += _p("M80 76 Q76 104 98 130 Q100 134 102 130 Q124 104 120 76 Q110 92 100 90 Q90 92 80 76 Z", f"url(#{k}bd)", "#BDBDCB", 0.9)
    for (x1, y1, x2, y2) in [(90, 94, 96, 124), (100, 92, 100, 128), (110, 94, 104, 124), (84, 86, 90, 112), (116, 86, 110, 112)]:
        s += _p(f"M{x1} {y1} Q{(x1+x2)/2+2} {(y1+y2)/2} {x2} {y2}", "none", "#C4C4D2", 0.9)
    s += _mouth(100, 82, "#B87A6A", 1.2, 3.4)
    # turban (khan dong)
    s += _p("M68 50 Q64 18 100 14 Q136 18 132 50 Q100 40 68 50 Z", f"url(#{k}tb)")
    s += _p("M70 40 Q100 28 130 40", "none", "#4A5CB0", 1.6) + _p("M69 46 Q100 35 131 46", "none", "#4A5CB0", 1.4) + _p("M74 32 Q100 21 126 32", "none", "#4A5CB0", 1.2)
    s += _p("M96 16 Q100 28 104 16", "none", "#0E1438", 1)
    s += _r(0, 0, 200, 150, f"url(#{k}vg)")
    # brush in hand
    s += _r(150, 96, 5, 40, "#8B5A30", 2, f' transform="rotate(24 152 116)"') + _p("M142 134 q4 -8 10 -6 q-2 8 -10 6 Z", "#1B1A2E", None, 0, ' transform="rotate(24 152 116)"')
    return _svg("Cụ đồ Khải, an old scholar with a dark turban, round glasses and a long white beard", s, d)

# ------------------------------------------------------------------ 4. Bác Huy
def ba():
    k = "hy"
    d = (_lg(k + "bg", "#3F7A3A", "#1A3D22") + _skin_defs(k, "#D6A072", "#BE8556", "#8F5F36")
         + _lg(k + "sh", "#3A3A40", "#17171C") + _lg(k + "nn", "#F2DFA0", "#C9A650", 0, 0, 1, 1) + _vignette(k + "vg")
         + _lg(k + "lf", "#58A24A", "#2A6A30"))
    s = _r(0, 0, 200, 150, f"url(#{k}bg)")
    # sun rays
    for a in (-30, -10, 10, 30, 50):
        s += _p(f"M100 -10 L{100+a*3.2} 150 L{100+a*3.2+16} 150 Z", "#FFF3B0", None, 0, ' fill-opacity=".07"')
    # big leaves
    s += _p("M-4 120 Q20 60 64 52 Q50 96 20 130 Z", f"url(#{k}lf)") + _p("M6 124 Q28 80 58 58", "none", "#1E5226", 1.2)
    s += _p("M204 118 Q184 56 140 50 Q152 96 182 130 Z", f"url(#{k}lf)") + _p("M194 122 Q172 78 146 56", "none", "#1E5226", 1.2)
    s += _p("M150 150 Q176 110 204 104 L204 150 Z", "#2A6A30")
    s += _c(30, 36, 4, "#F3D6E4") + _c(34, 33, 3, "#F8E8F0") + _c(170, 30, 4, "#F3D6E4")
    # body
    s += _p("M22 150 Q28 112 72 102 L128 102 Q172 112 178 150 Z", f"url(#{k}sh)")
    s += _p("M100 106 L100 150", "none", "#0B0B0E", 1.2)
    for y in (116, 128, 140): s += _c(100, y, 2.4, "#E9E2D0") + _c(99.4, y - .6, .7, "#fff")
    s += _p("M62 108 q-8 14 -12 40 M138 108 q8 14 12 40", "none", "#2A2A32", 1)
    s += _neck(k, 100, 84, 9, 20)
    # khan ran scarf (red checker)
    s += _p("M72 102 Q100 122 128 102 L130 112 Q100 134 70 112 Z", "#C3262E")
    for i in range(9):
        s += _r(74 + i * 6, 107 + abs(i - 4) * -0.2 + (3 - abs(i - 4)) * 0.0, 3, 3, "#FFFFFF", 0, ' fill-opacity=".85"').replace('y="', 'y="')
    s += _p("M118 112 L130 130 L120 128 Z", "#C3262E")
    s += _ears(k, 100, 62, 22) + _head(k, 100, 63, 22, 27)
    s += _blush(100, 72, 15, "#D2604A", .22, 5)
    # weathered lines
    s += _p("M86 50 Q100 46 114 50", "none", "#5E3A1E", .9, ' stroke-opacity=".5"') + _p("M80 66 q-2 4 0 8 M120 66 q2 4 0 8", "none", "#5E3A1E", .8, ' stroke-opacity=".5"')
    s += _brows(100, 55, 10, "#2A2220", 2.2, 0, 2)
    s += _eyes(100, 61, 10, "#3B2619", INK, 0.95)
    s += _nose(100, 69, "#5E3A1E")
    # moustache
    s += _p("M82 76 Q92 70 100 76 Q108 70 118 76 Q112 83 100 79 Q88 83 82 76 Z", "#2A2220")
    s += _mouth(100, 85, "#7B3A2A", 1.8, 5)
    # chin shadow
    s += _p("M82 82 Q100 100 118 82 Q114 96 100 98 Q86 96 82 82 Z", "#2A2220", None, 0, ' fill-opacity=".18"')
    # non la hat (raised so the eyes show)
    s += _p("M100 -2 L40 42 Q100 54 160 42 Z", f"url(#{k}nn)", "#A8832F", 1.6)
    for i in range(1, 8):
        s += _p(f"M100 -2 L{40+i*15} {42+(4-abs(i-4))*2.4}", "none", "#B8923F", 1)
    for r_ in (16, 28, 38):
        s += _p(f"M{100-r_*1.5} {12+r_*.7} Q100 {22+r_*.8} {100+r_*1.5} {12+r_*.7}", "none", "#C9A650", 0.9, ' stroke-opacity=".7"')
    s += _p("M40 42 Q100 58 160 42 Q100 50 40 42 Z", "#A8832F", None, 0, ' fill-opacity=".55"')
    s += _p("M72 48 Q72 78 86 90", "none", "#C3262E", 2.2) + _p("M128 48 Q128 78 114 90", "none", "#C3262E", 2.2)
    # hair under hat
    s += _p("M78 52 Q100 44 122 52 L122 48 Q100 38 78 48 Z", "#2A2220")
    # shears
    s += _p("M148 134 L176 100", "none", "#C8CBD2", 3) + _p("M154 136 L182 108", "none", "#9AA0AB", 3)
    s += _c(146, 138, 5, "none", f' stroke="#C3262E" stroke-width="3"') + _c(154, 142, 5, "none", f' stroke="#C3262E" stroke-width="3"')
    s += _r(0, 0, 200, 150, f"url(#{k}vg)")
    return _svg("Bác Huy, a weathered gardener in a nón lá hat, a red checkered scarf and a black áo bà ba", s, d)

# ------------------------------------------------------------------ 5. Bác sĩ Uyên
def linh():
    k = "uy"
    d = (_lg(k + "bg", "#CFEAE3", "#8FC4B8") + _skin_defs(k, "#F8DDBF", "#EDC39F", "#C9966F")
         + _lg(k + "co", "#FFFFFF", "#DCE3E6") + _lg(k + "hr", "#2A2735", "#0E0C14") + _vignette(k + "vg"))
    s = _r(0, 0, 200, 150, f"url(#{k}bg)")
    # window blinds + light
    s += _r(120, 10, 60, 70, "#F6FBFA", 3, f' stroke="#6FA89B" stroke-width="2"')
    for i in range(8): s += _r(122, 14 + i * 8.5, 56, 4.5, "#DDEFEA")
    s += _l(150, 10, 150, 80, "#6FA89B", 1.4)
    # clinic cross poster
    s += _r(14, 22, 38, 48, "#FFFFFF", 3, ' stroke="#6FA89B" stroke-width="1.6"') + _r(27, 32, 12, 4, "#C23B3B") + _r(31, 28, 4, 12, "#C23B3B")
    s += _l(20, 50, 46, 50, "#9CCFC2", 1.6) + _l(20, 56, 40, 56, "#9CCFC2", 1.6) + _l(20, 62, 44, 62, "#9CCFC2", 1.6)
    # hair back
    s += _p("M70 62 C66 24 134 24 130 62 C134 84 128 94 118 90 L82 90 C72 94 66 84 70 62 Z", f"url(#{k}hr)")
    # coat + scrub
    s += _p("M22 150 Q28 112 72 102 L128 102 Q172 112 178 150 Z", f"url(#{k}co)", "#BFC9CD", 1.2)
    s += _p("M80 102 L100 150 L120 102 Z", "#2E9D8E")
    s += _p("M72 102 L96 128 L84 150 L60 150 Q62 118 72 102 Z", "#FFFFFF", "#C9D2D5", 1.4) + _p("M128 102 L104 128 L116 150 L140 150 Q138 118 128 102 Z", "#FFFFFF", "#C9D2D5", 1.4)
    s += _neck(k, 100, 82, 8.5, 22)
    # stethoscope
    s += _p("M82 104 Q70 134 96 144 Q112 140 112 122", "none", "#3A3A4A", 2.8) + _p("M118 104 Q130 124 112 122", "none", "#3A3A4A", 2.8)
    s += _c(112, 124, 5, "#D5DADF", ' stroke="#3A3A4A" stroke-width="2"') + _c(112, 124, 1.8, "#8D959C")
    # badge + pocket pen
    s += _r(136, 124, 20, 10, "#FFFFFF", 1.5, ' stroke="#9CB4B0" stroke-width="1"') + _l(139, 128, 153, 128, "#2E9D8E", 1.3) + _l(139, 131, 148, 131, "#B8C4C2", 1)
    s += _r(152, 116, 2.4, 12, "#2E6FD6", 1)
    s += _ears(k, 100, 60, 22) + _head(k, 100, 60, 22, 27)
    # bob fringe
    s += _p("M76 56 C74 28 126 28 124 56 C118 44 106 40 100 42 C92 40 82 44 76 56 Z", f"url(#{k}hr)")
    s += _p("M80 40 Q96 34 112 38", "none", "#8A86A0", 1.4, ' stroke-opacity=".7"')
    s += _p("M77 52 Q74 70 78 86 Q86 90 90 86 Q80 74 82 58 Z", f"url(#{k}hr)") + _p("M123 52 Q126 70 122 86 Q114 90 110 86 Q120 74 118 58 Z", f"url(#{k}hr)")
    s += _brows(100, 53, 10, "#1F1A1A", 1.5, 0, 2.2)
    s += _eyes(100, 60, 10, "#2E2018", INK, 1.0)
    s += _nose(100, 68) + _blush(100, 72, 15, "#F08A82", .28, 5) + _mouth(100, 79, "#C45A62", 2.6, 6)
    # small gold earrings
    s += _c(76, 67, 1.6, GOLD2) + _c(124, 67, 1.6, GOLD2)
    s += _r(0, 0, 200, 150, f"url(#{k}vg)")
    return _svg("Bác sĩ Uyên, a calm doctor with a black bob, a white coat and a stethoscope", s, d)

# ------------------------------------------------------------------ 6. Thuyền trưởng Li
def hai():
    k = "li"
    d = (_lg(k + "bg", "#2A2552", "#F08A4B", 0, 0, 0, 1) + _skin_defs(k, "#D9A073", "#C08556", "#946036")
         + _lg(k + "co", "#2B3F7A", "#121C45") + _lg(k + "wa", "#E8845A", "#3A2F66") + _lg(k + "hr", "#2A2735", "#0E0C14") + _vignette(k + "vg")
         + _lg(k + "go", "#F4D47A", "#B8862A"))
    s = _r(0, 0, 200, 150, f"url(#{k}bg)")
    # sun + water
    s += _c(150, 92, 20, "#FFD27A", ' fill-opacity=".9"') + _c(150, 92, 30, "#FFD27A", ' fill-opacity=".18"')
    s += _r(0, 92, 200, 58, f"url(#{k}wa)")
    for (x, y, w) in [(120, 98, 36), (130, 106, 26), (112, 114, 50), (60, 104, 28), (20, 112, 40)]:
        s += _l(x, y, x + w, y, "#FFE1A8", 1.4).replace("/>", ' stroke-opacity=".6"/>')
    # boat + mast far
    s += _p("M132 92 L186 92 L178 100 L140 100 Z", "#1A1735") + _l(158, 92, 158, 62, "#1A1735", 1.6) + _p("M158 64 L174 86 L158 86 Z", "#F4E6C8", None, 0, ' fill-opacity=".9"')
    s += _p("M0 94 L20 84 L44 94 Z", "#1E1B40", None, 0, ' fill-opacity=".7"')
    # ponytail behind
    s += _p("M120 44 Q166 44 160 96 Q156 118 140 112 Q150 90 134 70 Z", f"url(#{k}hr)")
    s += _p("M128 50 Q156 54 154 90", "none", "#8A86A0", 1.2, ' stroke-opacity=".6"')
    s += _p("M74 60 C70 26 130 26 126 60 C130 80 124 86 118 84 L82 84 C76 86 70 80 74 60 Z", f"url(#{k}hr)")
    # coat
    s += _p("M20 150 Q26 112 72 102 L128 102 Q174 112 180 150 Z", f"url(#{k}co)")
    s += _p("M100 104 L100 150", "none", "#0A1030", 1.2)
    for (x, y) in [(86, 122), (86, 136), (114, 122), (114, 136)]:
        s += _c(x, y, 3.4, f"url(#{k}go)", ' stroke="#8A6520" stroke-width=".8"') + _c(x - .8, y - .8, .8, "#FFF4C8")
    s += _p("M72 102 L92 134 L78 150 L58 150 Q60 120 72 102 Z", "#1B2A5E", "#0A1030", 1) + _p("M128 102 L108 134 L122 150 L142 150 Q140 120 128 102 Z", "#1B2A5E", "#0A1030", 1)
    # epaulettes
    s += _r(34, 108, 30, 9, f"url(#{k}go)", 2, ' transform="rotate(-14 49 112)"') + _r(136, 108, 30, 9, f"url(#{k}go)", 2, ' transform="rotate(14 151 112)"')
    for i in range(4):
        s += _l(40 + i * 6, 107 - i * .6, 40 + i * 6, 117 - i * .6, "#8A6520", .8) if False else ""
    # white shirt + red neckerchief
    s += _p("M88 100 L100 122 L112 100 Z", "#FFFFFF") + _p("M90 102 Q100 112 110 102 L114 108 L100 128 L86 108 Z", "#C3262E")
    s += _neck(k, 100, 80, 8.5, 22)
    s += _p("M90 100 Q100 110 110 100 L114 108 L100 126 L86 108 Z", "#C3262E")
    s += _ears(k, 100, 60, 22) + _head(k, 100, 60, 22, 27)
    # hair fringe under cap
    s += _p("M78 50 Q100 40 122 50 L122 44 Q100 34 78 44 Z", f"url(#{k}hr)")
    s += _brows(100, 52, 10, "#1F1A1A", 2, 1.2, 2)
    s += _eyes(100, 59, 10, "#2E1C10", INK, 1.0)
    s += _nose(100, 67, "#6A3E1E") + _blush(100, 71, 15, "#D2604A", .22, 5) + _mouth(100, 78, "#8E3A2A", 2.4, 6.5, False, -1.2)
    s += _p("M96 82 q4 3 8 0", "none", "#7A4A2E", .6, ' stroke-opacity=".5"')
    # captain cap
    s += _p("M68 46 Q70 14 100 12 Q130 14 132 46 Q100 38 68 46 Z", "#F6F2E6", "#C9C2AC", 1.2)
    s += _p("M68 46 Q100 56 132 46 L132 40 Q100 50 68 40 Z", f"url(#{k}co)", "#0A1030", 1)
    s += _p("M66 40 Q100 52 134 40 L134 36 Q100 46 66 36 Z", "#0F1A38")
    s += _p("M70 46 Q100 62 130 46 Q100 52 70 46 Z", "#0A1030")
    s += _c(100, 40, 6.4, f"url(#{k}go)", ' stroke="#8A6520" stroke-width=".8"')
    s += _l(100, 36, 100, 44, "#6B4A10", 1.2) + _p("M96 40 Q100 46 104 40", "none", "#6B4A10", 1.1) + _l(97, 38, 103, 38, "#6B4A10", 1.1) + _c(100, 35.6, 1, "none", ' stroke="#6B4A10" stroke-width=".9"')
    s += _p("M74 22 Q100 10 126 22", "none", "#FFFFFF", 1.4, ' stroke-opacity=".7"')
    s += _r(0, 0, 200, 150, f"url(#{k}vg)")
    return _svg("Thuyền trưởng Li, a confident river captain in a peaked cap with a ponytail and a gold-buttoned coat", s, d)

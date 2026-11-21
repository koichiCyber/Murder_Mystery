import math, json
INK="#1B1A2E"; CREAM="#F3EAD7"; GOLD="#C9962B"; GOLD2="#E3B94E"
BURG="#8C2433"; TEAL="#1E4D5C"; GREEN="#3F5B3A"

def C(cx,cy,r,f,x=''): return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{f}"{x}></circle>'
def E(cx,cy,rx,ry,f,x=''): return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{f}"{x}></ellipse>'
def R(x,y,w,h,f,rx=0,ex=''): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{f}"{ex}></rect>'
def P(d,f='none',s=None,sw=0,ex=''):
    st=f' stroke="{s}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' if s else ''
    return f'<path d="{d}" fill="{f}"{st}{ex}></path>'
def L(x1,y1,x2,y2,s,sw=2,ex=''): return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{s}" stroke-width="{sw}" stroke-linecap="round"{ex}></line>'
def G(inner,tr): return f'<g transform="{tr}">{inner}</g>'
def PG(pts,f,ex=''): return f'<polygon points="{pts}" fill="{f}"{ex}></polygon>'

def svg(label,inner):
    return (f'<svg viewBox="0 0 200 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="{label}" style="display:block">{inner}</svg>')

def face(skin,eyes=True,mouth=True,cx=100,cy=62):
    s=C(cx-26,cy+2,5,skin)+C(cx+26,cy+2,5,skin)+C(cx,cy,26,skin)
    if eyes: s+=C(cx-9,cy,2.4,INK)+C(cx+9,cy,2.4,INK)
    if mouth: s+=P(f'M{cx-8} {cy+13} Q{cx} {cy+19} {cx+8} {cy+13}','none',INK,2)
    s+=R(cx-8,cy+22,16,16,skin)
    return s

def halo(bg): return R(0,0,200,150,bg)+C(100,70,58,"#FFFFFF",' fill-opacity="0.35"')
SH="M30 150 Q36 104 100 98 Q164 104 170 150 Z"

RED="#B3202A"; JADE="#1F6E5C"; INDIGO="#23366B"; STRAW="#E8D49B"
def jc(cx,cy,r): return C(cx,cy,r,"none",f' stroke="{GOLD2}" stroke-width="2"')

# ---------- suspects ----------
def lan():
    s=halo("#F0C9B8")
    s+=P(SH,RED)
    s+=jc(58,132,5)+jc(142,132,5)+jc(100,146,5)+jc(80,146,4)+jc(120,146,4)
    s+=E(100,58,31,31,"#1F1A1A")
    s+=face("#EBC19C")
    s+=R(86,92,28,12,"#8E1A22",3)+L(86,97,114,97,GOLD2,1.5)
    s+=P("M74 56 Q100 30 126 56 Q100 44 74 56 Z","#1F1A1A")
    s+=C(100,28,12,"#1F1A1A")+L(88,26,114,32,GOLD2,2.5)+C(114,32,2.5,GOLD2)
    s+=C(74,70,3.5,"#2E9D7B")+C(126,70,3.5,"#2E9D7B")
    return svg("Bà Hương, a lady in a red áo dài with a hair bun and jade earrings",s)

def tu():
    s=halo("#F0D9A8")
    s+=P(SH,"#D9B88A")
    s+=P("M70 150 L74 112 L126 112 L130 150 Z","#FFFFFF")+L(78,110,90,98,"#FFFFFF",5)+L(122,110,110,98,"#FFFFFF",5)
    s+=face("#C98F63",mouth=False)
    s+=P("M76 52 Q100 24 124 52 Q100 40 76 52 Z","#1F1A1A")
    s+=P("M84 70 Q92 62 100 68 Q108 62 116 70 Q108 78 100 72 Q92 78 84 70 Z","#2A2A2A")
    s+=P("M92 78 Q100 82 108 78","none",INK,2)
    s+=P("M80 98 Q100 112 120 98 L118 108 Q100 122 82 108 Z",RED)
    for i in range(6): s+=R(86+i*5.6,103+ (3 if i%2 else 0)+ (2 if 0 else 0),2.6,2.6,"#FFFFFF")
    s+=R(74,40,52,10,RED,3)
    for i in range(8): s+=R(77+i*6.2,42,3,3,"#FFFFFF")+R(80+i*6.2,46,3,3,"#FFFFFF")
    s+=P("M126 44 L142 50 L128 58 Z",RED)
    return svg("Chú Khôi, a cook with a checkered scarf headband and an apron",s)

def khanh():
    s=halo("#BFC9D6")
    s+=P(SH,INDIGO)
    s+=jc(58,132,5)+jc(142,132,5)+jc(100,146,5)
    s+=face("#E4B88F",eyes=False,mouth=False)
    s+=R(90,94,20,8,"#FFFFFF",2)
    s+=P("M84 74 Q86 122 100 134 Q114 122 116 74 Q100 90 84 74 Z","#F2F2F2",ex=' stroke="#C9CAD2" stroke-width="1.5"')
    s+=P("M86 72 Q100 66 114 72","none","#F2F2F2",4)
    s+=P("M82 52 Q90 46 98 52","none","#F2F2F2",3)+P("M102 52 Q110 46 118 52","none","#F2F2F2",3)
    s+=C(91,62,10,"#FFFFFF",f' fill-opacity="0.5" stroke="{INK}" stroke-width="2.2"')+C(109,62,10,"#FFFFFF",f' fill-opacity="0.5" stroke="{INK}" stroke-width="2.2"')
    s+=C(91,62,2.2,INK)+C(109,62,2.2,INK)
    s+=P("M70 52 Q68 20 100 18 Q132 20 130 52 Q100 44 70 52 Z","#1B2255")
    s+=P("M72 40 Q100 32 128 40","none","#3A4590",2)+P("M72 46 Q100 38 128 46","none","#3A4590",2)
    return svg("Cụ đồ Khải, an old scholar with a turban, round glasses and a long white beard",s)

def ba():
    s=halo("#BFD3B0")
    s+=P(SH,"#25232D")
    for y in (110,122,134): s+=C(100,y,2.6,"#FFFFFF")
    s+=face("#B97F52",mouth=False)
    s+=P("M90 74 Q100 84 110 74","#FFFFFF",INK,2)
    s+=P("M82 98 Q100 110 118 98 L116 106 Q100 118 84 106 Z",RED)
    s+=PG("100,4 36,54 164,54","#E8D49B",' stroke="#B8923F" stroke-width="2" stroke-linejoin="round"')
    for i in range(1,6): s+=L(100,4,round(36+i*21.3,1),54,"#C9A860",1.5)
    s+=E(100,54,64,6,"#D9BF7E",' stroke="#B8923F" stroke-width="1.5"')
    s+=P("M74 58 Q78 80 90 84","none",RED,2.5)+P("M126 58 Q122 80 110 84","none",RED,2.5)
    return svg("Bác Huy, a gardener in a conical nón lá hat and a black áo bà ba",s)

def linh():
    s=halo("#C9E3DA")
    s+=P("M72 64 Q70 28 100 28 Q130 28 128 64 L128 84 Q120 80 118 72 L82 72 Q80 80 72 84 Z",INK)
    s+=P(SH,"#F7F7F4","#CFCFC8",1.5)
    s+=P("M84 100 L100 124 L116 100 Z",JADE)
    s+=face("#F2CDAA")
    s+=P("M75 58 Q100 34 125 58 Q100 46 75 58 Z",INK)
    s+=P("M84 100 Q76 128 100 130 Q124 128 116 100","none","#3A3A4A",3)
    s+=C(100,131,5.5,"#C9CED4",f' stroke="#3A3A4A" stroke-width="2"')
    s+=R(140,126,4,14,"#C23B3B")+R(135,131,14,4,"#C23B3B")
    return svg("Bác sĩ Uyên, a doctor with a bob haircut, a white coat and a stethoscope",s)

def hai():
    s=halo("#B8C4DD")
    s+=P(SH,"#23325F")
    s+=P("M84 100 L100 124 L116 100 Z","#FFFFFF")+PG("97,106 103,106 104,124 100,128 96,124","#111")
    s+=R(36,106,26,9,GOLD2,2)+R(138,106,26,9,GOLD2,2)
    s+=C(88,134,3,GOLD2)+C(112,134,3,GOLD2)
    s+=E(100,64,30,30,"#1F1A1A")+P("M124 56 Q152 62 148 100 Q142 82 126 78 Z","#1F1A1A")
    s+=face("#B97F52")
    s+=P("M75 58 Q100 40 125 58 Q100 50 75 58 Z","#1F1A1A")
    s+=P("M72 40 Q74 18 100 18 Q126 18 128 40 Z","#23325F")
    s+=P("M68 44 Q100 56 132 44 L128 38 L72 38 Z","#0F1A38")
    s+=R(72,34,56,6,"#0F1A38")
    s+=C(100,26,3,"none",f' stroke="{GOLD2}" stroke-width="1.8"')+L(100,29,100,38,GOLD2,2)+P("M93 34 Q100 42 107 34","none",GOLD2,2)+L(95,32,105,32,GOLD2,2)
    return svg("Thuyền trưởng Li, a river boat captain with a ponytail, a peaked cap and an anchor badge",s)

# ---------- weapons ----------
def wbg(): return R(0,0,200,150,"#D6DBEA")+C(100,75,60,"#FFFFFF",' fill-opacity="0.35"')
def chan_den():
    s=wbg()+C(100,40,34,"#F6E3A0",' fill-opacity="0.65"')
    s+=E(100,132,38,9,"#A8761B")+P("M62 132 Q100 112 138 132 L138 128 Q100 106 62 128 Z",GOLD2)
    s+=P("M92 122 Q86 104 94 94 L94 72 L106 72 L106 94 Q114 104 108 122 Z",GOLD)
    s+=E(100,72,17,5,GOLD2)+R(83,70,34,4,"#A8761B",2)
    s+=R(92,34,16,38,"#C23B3B",3)+R(92,40,16,4,GOLD2)+P("M92 52 Q96 60 92 66","none","#8E1A22",2)
    s+=P("M100 10 Q112 22 108 30 Q104 34 100 34 Q96 34 92 30 Q88 22 100 10 Z","#F08A24")+P("M100 20 Q106 27 103 31 Q100 33 97 31 Q94 27 100 20 Z","#FFD76A")
    return svg("A brass candle stand with a red candle",s)

def ruou_ran():
    s=wbg()
    s+=P("M70 54 Q60 56 60 80 L60 118 Q60 134 76 134 L124 134 Q140 134 140 118 L140 80 Q140 56 130 54 Z","#E3B04A",ex=' fill-opacity="0.6" stroke="#8A5A3A" stroke-width="3"')
    s+=P("M78 120 Q92 98 78 90 Q66 82 84 76 Q112 72 108 88 Q104 102 120 106","none","#4B6B2E",9)
    s+=P("M78 120 Q92 98 78 90 Q66 82 84 76 Q112 72 108 88 Q104 102 120 106","none","#8DB05A",9,' stroke-dasharray="2 7"')
    s+=C(123,105,6.5,"#4B6B2E")+C(125,103,1.8,"#FFFFFF")+P("M129 108 L138 112","none",RED,2)
    s+=R(80,42,40,14,"#8A5A3A",3)+P("M74 38 H126 L132 54 H68 Z",RED)+C(100,46,5,"#FFFFFF")+R(97,50,6,4,"#FFFFFF",1)+C(98.5,45,1.3,RED)+C(101.5,45,1.3,RED)
    s+=R(68,66,8,52,"#FFFFFF",4,' fill-opacity="0.3"')
    return svg("A glass jar of poisoned snake wine with a coiled snake inside",s)

def day_thung():
    s=wbg()
    for r in (16,28,40):
        s+=f'<circle cx="100" cy="76" r="{r}" fill="none" stroke="#C9A66B" stroke-width="10"></circle>'
        s+=f'<circle cx="100" cy="76" r="{r}" fill="none" stroke="#8A6A3A" stroke-width="10" stroke-dasharray="3 6"></circle>'
    s+=P("M140 76 Q160 96 150 124 Q146 134 128 136","none","#C9A66B",10)
    s+=P("M140 76 Q160 96 150 124 Q146 134 128 136","none","#8A6A3A",10,' stroke-dasharray="3 6"')
    s+=C(124,136,6,"#8A6A3A")
    s+=C(34,122,14,"#7A4A2A")+C(30,118,2.2,"#2A1810")+C(38,118,2.2,"#2A1810")+C(34,126,2.2,"#2A1810")
    return svg("A coil of coconut-fiber rope next to a coconut",s)

def chay():
    s=wbg()
    pe=R(92,4,16,100,"#A8703E",8,' stroke="#6B4A32" stroke-width="2"')+R(90,0,20,12,"#8A5A2E",5)+R(94,12,4,80,"#FFFFFF",2,' fill-opacity="0.3"')
    s+=G(pe,"rotate(-18 100 90)")
    s+=P("M58 98 Q56 134 78 136 H122 Q144 134 142 98 Z","#9A9AA6",ex=' stroke="#5C6B7A" stroke-width="2.5"')
    s+=E(100,98,42,10,"#7A7A88",' stroke="#5C6B7A" stroke-width="2.5"')+E(100,99,32,6,"#3A3A46")
    for x,y in ((88,100),(100,102),(112,100),(94,98),(108,98)): s+=C(x,y,1.8,"#F3EAD7")
    s+=P("M66 112 Q80 120 96 118","none","#B8B8C4",2.5)
    return svg("A stone mortar with a wooden rice pestle",s)

def dao_rua():
    s=wbg()
    d=P("M84 88 L84 18 Q84 6 98 6 L120 6 Q128 40 124 60 L124 88 Z","#DDE5EC",ex=' stroke="#8A98A6" stroke-width="2.5"')
    d+=P("M88 14 Q92 10 98 10 L116 10","none","#FFFFFF",2)+L(120,14,122,84,"#8A98A6",2)
    d+=R(80,86,48,7,"#5C6B7A",3)
    d+=R(88,93,30,42,"#A8703E",8,' stroke="#6B4A32" stroke-width="2"')+C(103,104,2.4,"#E8D49B")+C(103,124,2.4,"#E8D49B")
    s+=G(d,"rotate(24 104 80) translate(-3 4)")
    return svg("A broad dao rựa machete with a wooden handle",s)

def star_pts(cx,cy,ro,ri,n,sy=1.0):
    pts=[]
    for i in range(n*2):
        a=math.pi*i/n-math.pi/2; r=ro if i%2==0 else ri
        pts.append(f"{round(cx+r*math.cos(a),1)},{round(cy+r*math.sin(a)*sy,1)}")
    return " ".join(pts)
def trong_dong():
    s=wbg()
    BR="#B5803A"; DK="#8A5A1F"
    s+=P("M52 50 Q54 76 68 86 L62 124 Q100 134 138 124 L132 86 Q146 76 148 50 Z",BR,DK,2.5)
    s+=P("M60 76 Q100 88 140 76","none",DK,2)+P("M63 100 Q100 112 137 100","none",DK,2)
    s+=P("M54 64 Q38 68 44 88","none",DK,6)+P("M146 64 Q162 68 156 88","none",DK,6)
    for x in (76,88,100,112,124): s+=C(x,90+ (1 if x==100 else 0),1.8,DK)
    s+=E(100,46,54,15,"#C9953F",f' stroke="{DK}" stroke-width="2.5"')
    s+=E(100,46,44,11,"none",f' stroke="{DK}" stroke-width="2"')+E(100,46,34,8,"none",f' stroke="{DK}" stroke-width="2"')
    s+=PG(star_pts(100,46,28,13,14,0.28),GOLD2,f' stroke="{DK}" stroke-width="1.5"')
    s+=E(100,46,8,2.6,BR,f' stroke="{DK}" stroke-width="1.5"')
    return svg("A bronze Đông Sơn drum with a star at the centre of its face",s)

# ---------- locations ----------
def thu_vien():
    s=R(0,0,200,150,"#5A3A28")
    cols=["#8C2433","#1E4D5C","#3F5B3A","#C9962B","#6B4A7A","#B5603A","#2F3E66"]
    for row,y in enumerate((12,54,96)):
        x=10; i=row*3
        while x<146:
            w=7+((i*5)%6); h=26+((i*7)%12)
            s+=R(x,y+34-h,w,h,cols[i%7],1); x+=w+1; i+=1
        s+=R(6,y+34,142,5,"#3A2418")
    s+=R(0,138,200,12,"#3A2418")
    s+=R(158,8,36,6,"#3A2418",3)+R(162,14,28,100,"#F3EAD7")+R(158,112,36,6,"#3A2418",3)
    s+=P("M168 26 Q176 34 170 44 Q180 52 172 62 Q178 72 174 84","none",INK,3)+P("M184 30 Q178 42 186 50 Q178 60 184 74","none",INK,2.5)
    s+=R(170,92,12,12,RED,2)+L(176,118,176,128,GOLD2,2)
    return svg("An old library with bookshelves and a hanging calligraphy scroll",s)

def bep_cui():
    s=R(0,0,200,150,"#3B2A22")
    s+=R(8,26,100,5,"#6B4A32")
    for i in range(4): s+=C(128,20+i*8,4.6,"#EFE7D0")
    s+=L(128,6,128,16,"#8A6A3A",1.5)
    for i in range(4): s+=E(152,20+i*7.5,2.6,4.2,"#C23B3B")
    s+=L(152,6,152,14,"#8A6A3A",1.5)
    s+=P("M44 140 V92 Q44 80 66 80 H114 Q136 80 136 92 V140 Z","#B5603A")
    s+=P("M72 140 V112 Q72 100 90 100 Q108 100 108 112 V140 Z","#1B1210")
    s+=P("M80 140 Q76 124 88 112 Q90 124 96 120 Q102 128 100 140 Z","#F08A24")+P("M86 140 Q84 130 90 124 Q94 132 94 140 Z","#FFD76A")
    s+=P("M52 80 Q52 56 90 56 Q128 56 128 80 Z","#6B4A32")+R(48,76,84,6,"#4A3326",3)+C(90,54,4,"#4A3326")
    s+=P("M78 50 Q72 40 80 32 Q86 24 80 14","none","#FFFFFF",3,' stroke-opacity="0.55"')+P("M100 50 Q94 40 102 32 Q108 24 102 14","none","#FFFFFF",3,' stroke-opacity="0.55"')
    s+=P("M146 140 L152 104 H188 L194 140 Z","#D9B27A")
    for x in (156,166,176,186): s+=L(x,106,x+ (-2 if x<170 else 2),138,"#B8924F",1.5)
    s+=L(150,120,192,120,"#B8924F",1.5)+E(170,104,18,4,"#E8CD9A")
    s+=R(0,138,200,12,"#2B1D18")
    return svg("A wood-fire kitchen with a clay stove, clay pot and hanging garlic",s)

def lotus(cx,cy,sc=1):
    p=''
    for a in (-50,-25,0,25,50):
        p+=f'<ellipse cx="0" cy="-10" rx="5" ry="12" fill="#F2A7B8" stroke="#E07A93" stroke-width="1" transform="rotate({a})"></ellipse>'
    return G(p+C(0,-2,4,"#F6D463"),f"translate({cx} {cy}) scale({sc})")
def vuon_sen():
    s=R(0,0,200,150,"#FBE3C2")+C(160,26,14,"#F6C453")
    s+=P("M0 72 Q40 40 80 66 Q120 42 200 72 V84 H0 Z","#8FB59A")
    s+=P("M96 78 Q126 52 168 78","none","#6B4A32",5)+L(110,72,110,80,"#6B4A32",2)+L(140,64,140,80,"#6B4A32",2)+L(160,72,160,80,"#6B4A32",2)
    s+=R(0,78,200,72,"#6FB1A6")
    for x,y,w in ((20,92,24),(120,90,30),(150,138,20)): s+=E(x,y,w,3,"none",' stroke="#9FD3CA" stroke-width="1.5"')
    for cx,cy,rx,ry in ((40,108,24,7),(104,128,30,8),(166,106,22,6),(30,140,18,5)): s+=E(cx,cy,rx,ry,"#3F8F4B",' stroke="#2B6B35" stroke-width="1.5"')
    s+=L(64,100,64,112,"#2B6B35",2)+L(134,112,134,126,"#2B6B35",2)
    s+=lotus(64,104,1.1)+lotus(134,122,1.3)+lotus(30,134,0.9)
    return svg("A lotus pond with pink lotus flowers, round leaves and a small arched bridge",s)

def jar(x,y,w,h,col):
    return (R(x+w*0.2,y-6,w*0.6,9,RED,2)+
        P(f"M{x+w*0.25} {y} H{x+w*0.75} Q{x+w} {y+h*0.35} {x+w*0.9} {y+h*0.75} Q{x+w*0.8} {y+h} {x+w*0.5} {y+h} Q{x+w*0.2} {y+h} {x+w*0.1} {y+h*0.75} Q{x} {y+h*0.35} {x+w*0.25} {y} Z",col,"#3A2418",2)+
        P(f"M{x+w*0.18} {y+h*0.4} Q{x+w*0.5} {y+h*0.5} {x+w*0.82} {y+h*0.4}","none","#3A2418",1.5))
def ham_ruou():
    s=R(0,0,200,150,"#2C2A38")
    for y in range(0,150,14): s+=L(0,y,200,y,"#3E3B50",1.5)
    s+=P("M40 150 V70 Q40 20 100 20 Q160 20 160 70 V150 Z","#1B1A28","#4B4860",5)
    s+=C(100,40,28,"#F6E3A0",' fill-opacity="0.35"')+C(100,40,6,"#F6C453")+L(100,20,100,34,"#8A98A6",2)
    s+=P("M134 80 Q150 44 176 38","none","#E3D6A8",3)+P("M36 84 Q52 52 70 46","none","#E3D6A8",3)
    s+=jar(14,88,44,52,"#8A5A3A")+jar(62,98,40,42,"#A8703E")+jar(108,86,46,54,"#7A4A2A")+jar(156,98,36,42,"#9A6A3E")
    s+=R(0,140,200,10,"#1B1A28")
    return svg("A cellar of clay jars of rượu cần with long drinking straws",s)

def ban_tho():
    s=R(0,0,200,150,"#6B1E22")
    s+=R(14,100,172,8,"#3A2418",3)+R(14,98,172,3,GOLD2)+R(20,108,160,42,"#4A1418")+R(30,118,140,24,"none",f' stroke="{GOLD}" stroke-width="2"')
    s+=R(80,24,40,52,GOLD2,3)+R(85,29,30,42,"#2B2347")+C(100,45,7,"#E0B890")+P("M87 71 Q100 54 113 71 Z","#E0B890")
    for x in (60,134):
        s+=R(x,64,8,34,"#C23B3B",2)+P(f"M{x+4} 52 Q{x+10} 60 {x+4} 64 Q{x-2} 60 {x+4} 52 Z","#F08A24")
    s+=P("M84 94 Q86 104 100 104 Q114 104 116 94 Z","#B5803A")+E(100,94,16,4.5,"#D9A04A")
    for x,t in ((94,-3),(100,0),(106,3)): s+=L(x,94,x+t,78,"#D9B27A",1.6)
    s+=P("M100 78 Q94 70 100 62 Q106 54 100 46","none","#FFFFFF",2,' stroke-opacity="0.5"')
    s+=E(28,96,16,4,GOLD2)
    for x,y,c in ((22,90,"#F08A24"),(34,90,"#E3B94E"),(28,82,"#C23B3B"),(28,74,"#7FBF5A")): s+=C(x,y,6,c)
    s+=P("M162 98 Q156 80 162 70 H178 Q184 80 178 98 Z",TEAL if False else "#1E4D5C")
    s+=L(168,70,166,54,"#3F8F4B",2)+L(172,70,174,48,"#3F8F4B",2)+C(166,52,5,"#F2A7B8")+C(174,46,5,"#F6D463")
    return svg("An ancestor altar with a portrait, red candles, incense and a tray of fruit",s)

def dinh_lang():
    s=R(0,0,200,150,"#F4D9A0")+C(158,30,16,"#F6C453")
    s+=R(12,84,8,56,"#6B4A32")+C(16,66,24,"#3F8F4B")+C(34,78,16,"#4FA05A")
    s+=R(46,72,108,58,"#5A2A1E")
    for x in (50,78,112,140): s+=R(x,73,9,57,RED)
    s+=P("M26 60 Q60 56 100 30 Q140 56 174 60 Q180 54 188 54 Q180 68 164 70 L36 70 Q20 68 12 54 Q20 54 26 60 Z","#B5603A",ex=' stroke="#6B2E1A" stroke-width="2.5"')
    s+=P("M48 62 Q100 42 152 62","none","#8A3F22",1.5)+P("M40 66 Q100 50 160 66","none","#8A3F22",1.5)
    s+=P("M62 50 Q100 30 138 50","none",GOLD2,4)+C(100,31,4,GOLD2)
    s+=R(36,70,128,5,"#6B2E1A",2)
    s+=R(34,130,132,6,"#C9A66B")+R(24,136,152,6,"#B8924F")+R(0,142,200,8,"#B8924F")
    return svg("A village đình communal house with a curved tiled roof and red columns",s)

def gac_mai():
    s=R(0,0,200,150,"#4A3B35")
    s+=PG("100,0 0,64 0,150 200,150 200,64","#5A4A42")
    for x in range(-40,240,40): s+=L(100,0,x,80,"#3A2C26",4)
    s+=L(0,64,200,64,"#3A2C26",4)
    s+=C(150,52,22,"#3A2C26")+C(150,52,17,"#1E2140")+C(156,48,9,"#FFF3C0")+C(160,46,8,"#1E2140")+L(150,35,150,69,"#3A2C26",2)+L(133,52,167,52,"#3A2C26",2)
    s+=R(24,102,64,36,"#7A4A2A",4)+R(24,102,64,10,"#8F5A34",4)+R(24,118,64,5,GOLD,0)+R(52,114,8,14,GOLD2,2)
    s+=L(112,84,112,92,"#8A6A3A",2)
    s+=PG("112,90 90,116 134,116","#E8D49B",' stroke="#B8923F" stroke-width="1.5" stroke-linejoin="round"')
    s+=L(112,90,100,116,"#C9A860",1.2)+L(112,90,112,116,"#C9A860",1.2)+L(112,90,124,116,"#C9A860",1.2)
    s+=R(0,138,200,12,"#3A2C26")
    s+=P("M0 0 Q30 4 40 34 M0 0 Q14 16 14 40 M0 0 Q38 18 56 18","none","#D8D2C4",1.5,' stroke-opacity="0.7"')
    return svg("A dusty attic with an old trunk, a hanging nón lá and a moonlit window",s)

def bai_xe():
    s=R(0,0,200,150,"#E7D9B8")
    s+=R(0,0,200,26,"#8A94A0")
    for x in range(0,200,10): s+=L(x,0,x,26,"#6E7884",2)
    s+=R(8,26,8,104,"#6B4A32")+R(184,26,8,104,"#6B4A32")
    s+=R(0,128,200,22,"#9A9AA6")+E(100,132,58,5,"#4A5560",' fill-opacity="0.6"')
    s+=P("M78 104 L98 104 L108 86 L146 84 L152 104 L134 112 L84 112 Z",RED)
    s+=R(104,78,46,9,"#222233",4)
    s+=P("M66 76 L78 76 L90 108 L74 108 Z","#C23B3B")
    s+=P("M130 112 L168 114","none","#8A94A0",5)
    s+=C(110,108,8,"#55555F")
    s+=C(56,116,17,INK)+C(56,116,8,"#A9B3BD")+C(148,116,17,INK)+C(148,116,8,"#A9B3BD")
    s+=P("M38 110 Q56 90 74 106","none",RED,5)+P("M130 106 Q148 90 166 108","none",RED,5)
    s+=L(58,116,68,70,"#55555F",4)+L(60,66,86,63,"#222233",4)
    s+=C(60,76,6,"#F6E3A0",f' stroke="{INK}" stroke-width="1.5"')
    return svg("A red motorbike parked in a shed",s)

def tier(cx,y,w,h):
    lx=cx-w/2-10; rx=cx+w/2+10
    return (R(cx-w/2+4,y,w-8,20,RED)+R(cx-5,y+6,10,14,"#2B1A1A",2)+
        P(f"M{lx} {y} Q{cx-w*0.25} {y-4} {cx} {y-h} Q{cx+w*0.25} {y-4} {rx} {y} Q{cx} {y+7} {lx} {y} Z","#8A5A3A",ex=f' stroke="{GOLD2}" stroke-width="1.8"'))
def chua():
    s=R(0,0,200,150,"#2B2347")+C(158,32,14,"#FFF3C0")+C(164,28,12,"#2B2347")
    s+=L(28,26,28,42,GOLD2,1.5)+C(28,50,8,"#C23B3B")+L(172,52,172,62,GOLD2,1.5)+C(172,68,7,"#C23B3B")
    s+=tier(100,108,78,22)+tier(100,84,56,20)+tier(100,60,38,18)
    s+=L(100,24,100,42,GOLD2,3)+C(100,22,3,GOLD2)
    s+=R(58,128,84,6,"#C9A66B")+R(48,134,104,6,"#B8924F")+R(0,140,200,10,"#1B1A28")
    return svg("A pagoda with three tiered curved roofs at night",s)

# ---------- card html ----------
def card(kind,idx,total,vi,en,tag,art):
    col,l1,l2={"s":("#A3212B","NGHI PHẠM","SUSPECT"),"w":(INDIGO,"HUNG KHÍ","WEAPON"),"l":(JADE,"ĐỊA ĐIỂM","LOCATION")}[kind]
    return (f'<div style="width: 232px; height: 325px; box-sizing: border-box; padding: 8px; border: 1px dashed #B8B0A0; background: #FFFFFF">'
      f'<div style="height: 100%; box-sizing: border-box; border: 3px solid {col}; border-radius: 12px; background: #F5ECD7; display: flex; flex-direction: column; overflow: hidden">'
      f'<div style="background: {col}; color: #F5ECD7; display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 12px; line-height: 1; letter-spacing: 0.08em"><span>{l1} · {l2}</span><span>{idx}/{total}</span></div>'
      f'<div style="margin: 8px 8px 0 8px; height: 150px; border-radius: 6px; overflow: hidden; border: 1.5px solid {INK}">{art}</div>'
      f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 4px 10px 8px 10px; text-align: center">'
      f'<div style="font-family: \'Playfair Display\', serif; font-weight: 800; font-size: 21px; line-height: 1.15; color: {INK}">{vi}</div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-weight: 600; font-size: 13px; line-height: 1.2; color: {col}">{en}</div>'
      f'<div style="width: 36px; height: 2px; background: {GOLD}; margin: 3px 0"></div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-style: italic; font-size: 12px; line-height: 1.3; color: #55506A">{tag}</div>'
      f'</div></div></div>')

def back():
    arcs=''.join(f'<circle cx="0" cy="0" r="{r}" fill="none" stroke="{GOLD}" stroke-width="1.5" stroke-opacity="0.55"></circle>' for r in (30,48,66,84))
    ticks=''.join(f'<line x1="{round(100+58*math.cos(math.pi*i/18),1)}" y1="{round(118+58*math.sin(math.pi*i/18),1)}" x2="{round(100+66*math.cos(math.pi*i/18),1)}" y2="{round(118+66*math.sin(math.pi*i/18),1)}" stroke="{GOLD2}" stroke-width="2.5"></line>' for i in range(36))
    emb=(f'<svg viewBox="0 0 200 270" width="100%" height="100%" role="img" aria-label="Card back with a bronze drum sun pattern" style="display:block">'
      f'<rect x="0" y="0" width="200" height="270" fill="{INK}"></rect>'
      f'<g>{arcs}</g><g transform="translate(200 0)">{arcs}</g><g transform="translate(0 270)">{arcs}</g><g transform="translate(200 270)">{arcs}</g>'
      f'{ticks}'
      f'<circle cx="100" cy="118" r="54" fill="none" stroke="{GOLD2}" stroke-width="3"></circle>'
      f'<polygon points="{star_pts(100,118,50,28,14)}" fill="{GOLD2}"></polygon>'
      f'<circle cx="100" cy="118" r="24" fill="{INK}"></circle><circle cx="100" cy="118" r="19" fill="none" stroke="{GOLD2}" stroke-width="2.5"></circle>'
      f'<polygon points="{star_pts(100,118,14,6,8)}" fill="{GOLD2}"></polygon>'
      f'</svg>')
    return (f'<div style="width: 232px; height: 325px; box-sizing: border-box; padding: 8px; border: 1px dashed #B8B0A0; background: #FFFFFF">'
      f'<div style="position: relative; height: 100%; box-sizing: border-box; border: 3px solid {GOLD}; border-radius: 12px; background: {INK}; overflow: hidden">'
      f'<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%">{emb}</div>'
      f'<div style="position: absolute; left: 0; right: 0; bottom: 28px; text-align: center; color: {GOLD2}; font-family: \'Playfair Display\', serif; font-weight: 800; font-size: 17px; letter-spacing: 0.12em">ÁN MẠNG DINH THỰ</div>'
      f'<div style="position: absolute; left: 0; right: 0; bottom: 12px; text-align: center; color: #F5ECD7; font-family: \'Inter\', sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 0.16em">MANOR MYSTERY</div>'
      f'</div></div>')

def casefile():
    slot=lambda vi,en:(f'<div style="width: 150px; height: 150px; box-sizing: border-box; border: 2px dashed #5A4220; border-radius: 8px; background: rgba(245,236,215,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center">'
       f'<div style="font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.08em; color: {INK}">{vi}</div>'
       f'<div style="font-family: \'Inter\', sans-serif; font-weight: 600; font-size: 13px; color: #4A3818">{en}</div></div>')
    return (f'<div style="width: 696px; height: 325px; box-sizing: border-box; padding: 8px; border: 1px dashed #B8B0A0; background: #FFFFFF">'
      f'<div style="height: 100%; box-sizing: border-box; border: 3px solid #8A6A3A; border-radius: 12px; background: #D8BC8A; padding: 14px 20px; display: flex; flex-direction: column; justify-content: space-between">'
      f'<div style="display: flex; align-items: baseline; gap: 14px"><div style="font-family: \'Playfair Display\', serif; font-weight: 800; font-size: 28px; color: {INK}">HỒ SƠ VỤ ÁN</div><div style="font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.12em; color: #4A3818">CASE FILE</div></div>'
      f'<div style="display: flex; justify-content: space-between; align-items: center">{slot("NGHI PHẠM","Suspect")}{slot("HUNG KHÍ","Weapon")}{slot("ĐỊA ĐIỂM","Location")}</div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-size: 12px; line-height: 1.4; color: {INK}">Rút ngẫu nhiên 1 nghi phạm, 1 hung khí, 1 địa điểm và úp vào đây. Chia đều 18 lá còn lại: mỗi người 3 lá cho 6 người chơi.</div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-size: 12px; line-height: 1.4; color: #4A3818">Draw 1 suspect, 1 weapon and 1 location at random and slide them in face down. Deal the other 18 cards equally: 3 each for 6 players.</div>'
      f'</div></div>')

def sheet(title,cells):
    return f'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:wght@800&display=swap">
<style>
body{{margin:0}}
</style>
</helmet>
<div style="width: 816px; height: 1056px; box-sizing: border-box; padding: 40px 60px; background: #FFFFFF; display: flex; flex-wrap: wrap; align-content: center">
{chr(10).join(cells)}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":816,"height":1056}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''

from suspects2 import lan,tu,khanh,ba,linh,hai
S=[("Bà Hương","Madam Huong","Người thừa kế cả cơ ngơi.",lan),
   ("Chú Khôi","Cook Khoi","Dao thớt không rời tay.",tu),
   ("Cụ đồ Khải","Scholar Khai","Biết quá nhiều bí mật.",khanh),
   ("Bác Huy","Gardener Huy","Nắm đất nào cũng có chuyện.",ba),
   ("Bác sĩ Uyên","Dr. Uyen","Tay vững, lời khai càng vững.",linh),
   ("Thuyền trưởng Li","Captain Li","Quen sóng gió sông Cửu Long.",hai)]
W=[("Chân đèn đồng","Brass candle stand","Đồng nặng, còn ấm hơi lửa.",chan_den),
   ("Rượu rắn độc","Poisoned snake wine","Một chén là đủ.",ruou_ran),
   ("Dây thừng xơ dừa","Coconut-fiber rope","Chắc, thô, một nút thắt.",day_thung),
   ("Chày giã gạo","Stone pestle","Đá nặng, giã cả đời.",chay),
   ("Dao rựa","Machete","Bản to, lưỡi sắc.",dao_rua),
   ("Trống đồng","Bronze drum","Tiếng vang cả làng.",trong_dong)]
Lc=[("Thư viện cổ","Old library","Im lặng, gần như vậy.",thu_vien),
    ("Bếp củi","Wood-fire kitchen","Nơi lửa và dao gặp nhau.",bep_cui),
    ("Vườn sen","Lotus garden","Mặt nước giấu nhiều chuyện.",vuon_sen),
    ("Hầm rượu cần","Rice-wine cellar","Lạnh, tối, men say.",ham_ruou),
    ("Bàn thờ gia tiên","Ancestor altar room","Khói hương và lời thề.",ban_tho),
    ("Đình làng","Village communal house","Nơi mọi chuyện đều lộ ra.",dinh_lang),
    ("Gác mái","Attic","Bụi và những rương cũ.",gac_mai),
    ("Bãi xe máy","Motorbike shed","Mùi xăng nhớt.",bai_xe),
    ("Chùa","Pagoda","Tiếng chuông, tiếng thì thầm.",chua)]

def cells(kind,lst):
    return [card(kind,f"{i+1}",len(lst),vi,en,tag,fn()) for i,(vi,en,tag,fn) in enumerate(lst)]

import os
os.makedirs('out',exist_ok=True)
open('out/Suspects.dc.html','w').write(sheet("Thẻ nghi phạm",cells("s",S)+[casefile()]))
open('out/Weapons.dc.html','w').write(sheet("Thẻ hung khí và mặt sau",cells("w",W)+[back(),back(),back()]))
open('out/Locations.dc.html','w').write(sheet("Thẻ địa điểm",cells("l",Lc)))
print("done")

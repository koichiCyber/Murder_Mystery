from gen2 import *
import json
PLUM="#4B2E5E"
GOOD="#1F6E5C"; BAD="#A3212B"

def r_detective():
    s=R(0,0,200,150,"#E2D6EE")+C(100,72,64,"#FFFFFF",' fill-opacity="0.35"')
    s+=L(122,100,162,134,"#6B4A32",13)+L(122,100,134,112,"#B5803A",15)
    s+=C(92,70,38,"none",' stroke="#B5803A" stroke-width="9"')+C(92,70,33,"#FFFFFF",' fill-opacity="0.5"')
    for r in (7,13,19,25):
        s+=f'<path d="M{92-r} {72} A{r} {r*1.15} 0 0 1 {92+r} {72}" fill="none" stroke="#5A4A7A" stroke-width="2" stroke-linecap="round"></path>'
        s+=f'<path d="M{92-r+4} {80} A{r-3} {r} 0 0 0 {92+r-4} {80}" fill="none" stroke="#5A4A7A" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 5"></path>'
    s+=P("M74 52 Q80 46 90 46","none","#FFFFFF",3,' stroke-opacity="0.9"')
    return svg("Detective: a magnifying glass over a fingerprint",s)
def r_witness():
    s=R(0,0,200,150,"#DDE9E0")+C(100,75,64,"#FFFFFF",' fill-opacity="0.35"')
    s+=P("M24 75 Q100 14 176 75 Q100 136 24 75 Z","#FFFFFF",INK,4)
    s+=C(100,75,28,"#2F6B7A")+C(100,75,18,"#1F4A55",' stroke="#173A44" stroke-width="2"')+C(100,75,10,INK)+C(110,65,5,"#FFFFFF")
    for a in (-60,-30,0,30,60):
        x=100+80*math.sin(math.radians(a)); y=75-58*math.cos(math.radians(a))*0.95
        s+=L(round(100+70*math.sin(math.radians(a)),1),round(75-50*math.cos(math.radians(a)),1),round(x,1),round(y-6,1),INK,3)
    return svg("Witness: a wide open eye",s)
def r_reporter():
    s=R(0,0,200,150,"#F0D9A8")+C(100,75,64,"#FFFFFF",' fill-opacity="0.35"')
    s+=R(46,56,108,64,"#2A2A3A",9)+R(72,44,28,14,"#2A2A3A",3)+R(122,42,26,16,GOLD2,3)
    s+=L(135,38,135,30,GOLD2,3)+L(124,40,118,33,GOLD2,3)+L(146,40,152,33,GOLD2,3)
    s+=C(100,90,26,"#8A98A6")+C(100,90,19,"#3A4A5A")+C(100,90,10,INK)+C(95,85,3,"#FFFFFF")
    s+=R(52,62,20,8,RED,2)+R(130,100,18,12,"#F5ECD7",2)
    s+=L(50,56,30,30,"#6B4A32",4)+L(150,56,170,30,"#6B4A32",4)
    return svg("Reporter: a press camera with a flash",s)
def r_innocent():
    s=R(0,0,200,150,"#DCEFE8")+C(100,80,62,"#FFFFFF",' fill-opacity="0.4"')
    s+=E(100,128,66,12,"#3F8F4B",' stroke="#2B6B35" stroke-width="2"')
    p=''
    for a in (-72,-48,-24,0,24,48,72):
        p+=f'<ellipse cx="0" cy="-26" rx="12" ry="30" fill="#F2A7B8" stroke="#E07A93" stroke-width="1.5" transform="rotate({a})"></ellipse>'
    s+=G(p+E(0,-6,12,8,"#F6D463"),"translate(100 118) scale(1.15)")
    return svg("Innocent: a pink lotus flower on a leaf",s)
def r_murderer():
    s=R(0,0,200,150,"#241C2E")+C(100,64,48,"#7A1F2B")
    s+=P("M52 150 Q58 92 100 84 Q142 92 148 150 Z","#0D0B14")
    s+=P("M82 88 L100 112 L118 88","none","#2A2238",3)
    s+=C(100,62,18,"#0D0B14")+E(100,46,38,7,"#0D0B14")+R(80,22,40,26,"#0D0B14",6)+R(80,38,40,6,"#4A2F6B")
    s+=C(93,63,2.8,"#FF5A5A")+C(107,63,2.8,"#FF5A5A")
    return svg("Murderer: a hatted shadow figure in front of a red moon",s)
def r_accomplice():
    s=R(0,0,200,150,"#2A1F33")+C(100,70,60,"#4A2F6B",' fill-opacity="0.5"')
    s+=P("M28 62 Q60 42 100 58 Q140 42 172 62 Q162 96 130 92 Q112 86 100 76 Q88 86 70 92 Q38 96 28 62 Z","#0D0B14",ex=f' stroke="{GOLD2}" stroke-width="2.5"')
    s+=E(66,70,13,7,GOLD2)+E(134,70,13,7,GOLD2)+C(66,70,3,"#0D0B14")+C(134,70,3,"#0D0B14")
    s+=C(52,118,11,"none",f' stroke="{GOLD2}" stroke-width="4.5"')+L(63,118,150,118,GOLD2,4.5)+R(128,118,7,14,GOLD2,1)+R(142,118,7,10,GOLD2,1)
    return svg("Accomplice: a half-mask and a key",s)

def rcard(vi,en,team,vi_ab,en_ab,art):
    good=team=="good"
    pill=(f'<span style="background: #F5ECD7; color: {GOOD if good else BAD}; padding: 3px 6px; border-radius: 4px">{"PHE THIỆN" if good else "PHE ÁC"}</span>')
    return (f'<div style="width: 232px; height: 325px; box-sizing: border-box; padding: 8px; border: 1px dashed #B8B0A0; background: #FFFFFF">'
      f'<div style="height: 100%; box-sizing: border-box; border: 3px solid {PLUM}; border-radius: 12px; background: #F5ECD7; display: flex; flex-direction: column; overflow: hidden">'
      f'<div style="background: {PLUM}; color: #F5ECD7; display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 4px 10px; font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 12px; line-height: 1; letter-spacing: 0.08em"><span>VAI TRÒ · ROLE</span>{pill}</div>'
      f'<div style="margin: 8px 8px 0 8px; height: 118px; border-radius: 6px; overflow: hidden; border: 1.5px solid {INK}">{art}</div>'
      f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 4px 10px 8px 10px; text-align: center">'
      f'<div style="font-family: \'Playfair Display\', serif; font-weight: 800; font-size: 21px; line-height: 1.15; color: {INK}">{vi}</div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-weight: 600; font-size: 13px; line-height: 1.2; color: {PLUM}">{en}</div>'
      f'<div style="width: 36px; height: 2px; background: {GOLD}; margin: 2px 0"></div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-weight: 600; font-size: 12px; line-height: 1.3; color: {INK}">{vi_ab}</div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-style: italic; font-size: 12px; line-height: 1.3; color: #55506A">{en_ab}</div>'
      f'</div></div></div>')

def rules():
    h=lambda t:f'<div style="font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.08em; color: {PLUM}">{t}</div>'
    p=lambda t,c=INK:f'<div style="font-family: \'Inter\', sans-serif; font-size: 12px; line-height: 1.4; color: {c}">{t}</div>'
    return (f'<div style="width: 696px; height: 325px; box-sizing: border-box; padding: 8px; border: 1px dashed #B8B0A0; background: #FFFFFF">'
      f'<div style="height: 100%; box-sizing: border-box; border: 3px solid {PLUM}; border-radius: 12px; background: #F5ECD7; padding: 12px 18px; display: flex; flex-direction: column; justify-content: space-between">'
      f'<div style="display: flex; align-items: baseline; gap: 14px"><div style="font-family: \'Playfair Display\', serif; font-weight: 800; font-size: 26px; color: {INK}">LUẬT VAI TRÒ</div><div style="font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.12em; color: {PLUM}">ROLE RULES</div></div>'
      f'<div style="display: flex; flex-direction: column; gap: 3px">{h("CHIA VAI · SETUP")}'
      f'{p("Xáo 6 lá vai trò, mỗi người rút 1 lá úp xuống và giữ bí mật. Ít người hơn thì bỏ Người vô tội, rồi Phóng viên. Người chia bài cho Nhân chứng, Hung thủ và Đồng phạm xem lá hồ sơ tương ứng.")}'
      f'{p("Shuffle the 6 role cards and deal 1 face down to each player. With fewer players, remove Innocent, then Reporter. The dealer shows the Witness, Murderer and Accomplice their case-file cards.","#55506A")}</div>'
      f'<div style="display: flex; flex-direction: column; gap: 3px">{h("THẮNG THUA · WINNING")}'
      f'{p("Phe Thiện thắng khi một người buộc tội đúng. Phe Ác thắng nếu hết 8 vòng mà chưa ai buộc tội đúng, hoặc cả phe Thiện bị loại. Buộc tội sai thì bị loại.")}'
      f'{p("Good wins when anyone accuses correctly. Bad wins if 8 rounds pass without a correct accusation, or all Good players are eliminated. A wrong accusation eliminates you.","#55506A")}</div>'
      f'</div></div>')

R6=[("Thám tử","Detective","good","Buộc tội sai lần đầu không bị loại: được buộc tội lần hai.","Your first wrong accusation doesn't eliminate you.",r_detective),
    ("Nhân chứng","Witness","good","Đầu game, xem bí mật lá ĐỊA ĐIỂM trong hồ sơ.","At the start, secretly see the LOCATION case card.",r_witness),
    ("Phóng viên","Reporter","good","1 lần: hỏi một người họ có bao nhiêu lá thuộc 1 loại.","Once: ask a player how many cards of one type they hold.",r_reporter),
    ("Người vô tội","Innocent","good","1 lần: đưa ra giả thuyết lần hai ngay trong lượt.","Once: make a second suggestion in the same turn.",r_innocent),
    ("Hung thủ","Murderer","bad","Xem cả 3 lá hồ sơ. Không được buộc tội.","See all 3 case cards. You may not accuse.",r_murderer),
    ("Đồng phạm","Accomplice","bad","Biết Hung thủ, xem lá HUNG KHÍ. 1 lần được nói dối.","Know the Murderer and see the WEAPON. Lie once.",r_accomplice)]
cells=[rcard(a,b,c,d,e,f()) for a,b,c,d,e,f in R6]+[rules()]
open('out/Roles.dc.html','w').write(sheet("Thẻ vai trò",cells))
idx={"v":3,"createdOnFiles":{"v":1,"at":"2026-11-20T19:10:00Z"},"title":"Manor Murder Mystery – 21-Card Deck","launch":{"view":"canvas"},"pages":[],
 "boards":{"Suspects.dc.html":{"x":0,"y":0,"w":816,"h":1056,"title":"Suspects + case file","print":"fixed","paper":"letter"},
  "Weapons.dc.html":{"x":896,"y":0,"w":816,"h":1056,"title":"Weapons + card backs","print":"fixed","paper":"letter"},
  "Locations.dc.html":{"x":1792,"y":0,"w":816,"h":1056,"title":"Locations","print":"fixed","paper":"letter"},
  "Roles.dc.html":{"x":2688,"y":0,"w":816,"h":1056,"title":"Roles + role rules","print":"fixed","paper":"letter"}},
 "order":["Suspects.dc.html","Weapons.dc.html","Locations.dc.html","Roles.dc.html"],
 "notes":{"t1":{"x":0,"y":-300,"text":"Manor Murder Mystery: 21 cards + 6 role cards, print on Letter, cut on the dashed lines","kind":"title1","maxW":3504}},"designSystems":[]}
open('out/canvas.json','w').write(json.dumps(idx,ensure_ascii=False))
print("ok")

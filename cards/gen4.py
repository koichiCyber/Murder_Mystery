from gen3 import *
GREY="#6A6478"
def r_police():
    s=R(0,0,200,150,"#D6E4D0")+C(100,75,64,"#FFFFFF",' fill-opacity="0.35"')
    s+=P("M100 14 L152 30 Q156 84 100 134 Q44 84 48 30 Z",INDIGO,GOLD2,5)
    s+=PG(star_pts(100,66,28,12,5),GOLD2,f' stroke="#A8761B" stroke-width="2"')
    s+=C(100,66,6,INDIGO)
    s+=P("M70 112 Q100 124 130 112","none",GOLD2,3)
    return svg("Police: a shield badge with a star",s)

def rcard2(vi,en,team,vi_ab,en_ab,art):
    np_=team=="none"; good=team=="good"
    col=GREY if np_ else PLUM
    txt="KHÔNG PHÁT" if np_ else ("PHE THIỆN" if good else "PHE ÁC")
    tc=GREY if np_ else (GOOD if good else BAD)
    pill=f'<span style="background: #F5ECD7; color: {tc}; padding: 3px 6px; border-radius: 4px">{txt}</span>'
    return (f'<div style="width: 232px; height: 325px; box-sizing: border-box; padding: 8px; border: 1px dashed #B8B0A0; background: #FFFFFF">'
      f'<div style="height: 100%; box-sizing: border-box; border: 3px {"dashed" if np_ else "solid"} {col}; border-radius: 12px; background: #F5ECD7; display: flex; flex-direction: column; overflow: hidden">'
      f'<div style="background: {col}; color: #F5ECD7; display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 4px 10px; font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 12px; line-height: 1; letter-spacing: 0.08em"><span>VAI TRÒ · ROLE</span>{pill}</div>'
      f'<div style="margin: 8px 8px 0 8px; height: 118px; border-radius: 6px; overflow: hidden; border: 1.5px solid {INK}">{art}</div>'
      f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 4px 10px 8px 10px; text-align: center">'
      f'<div style="font-family: \'Playfair Display\', serif; font-weight: 800; font-size: 21px; line-height: 1.15; color: {INK}">{vi}</div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-weight: 600; font-size: 13px; line-height: 1.2; color: {col}">{en}</div>'
      f'<div style="width: 36px; height: 2px; background: {GOLD}; margin: 2px 0"></div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-weight: 600; font-size: 12px; line-height: 1.3; color: {INK}">{vi_ab}</div>'
      f'<div style="font-family: \'Inter\', sans-serif; font-style: italic; font-size: 12px; line-height: 1.3; color: #55506A">{en_ab}</div>'
      f'</div></div></div>')

def rules2():
    h=lambda t:f'<div style="font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.08em; color: {PLUM}">{t}</div>'
    p=lambda t,c=INK:f'<div style="font-family: \'Inter\', sans-serif; font-size: 12px; line-height: 1.35; color: {c}">{t}</div>'
    return (f'<div style="width: 464px; height: 325px; box-sizing: border-box; padding: 8px; border: 1px dashed #B8B0A0; background: #FFFFFF">'
      f'<div style="height: 100%; box-sizing: border-box; border: 3px solid {PLUM}; border-radius: 12px; background: #F5ECD7; padding: 10px 14px; display: flex; flex-direction: column; justify-content: space-between">'
      f'<div style="display: flex; align-items: baseline; gap: 10px"><div style="font-family: \'Playfair Display\', serif; font-weight: 800; font-size: 22px; color: {INK}">LUẬT VAI TRÒ</div><div style="font-family: \'Inter\', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.1em; color: {PLUM}">ROLE RULES</div></div>'
      f'<div style="display: flex; flex-direction: column; gap: 2px">{h("CHIA VAI · SETUP")}'
      f'{p("Để riêng lá Hung thủ. Xáo 6 lá còn lại, mỗi người rút 1 lá úp. Ít người: bỏ Người vô tội, rồi Phóng viên, rồi Cảnh sát.")}'
      f'{p("Set the Murderer aside. Deal 1 of the other 6 face down each. Fewer players: remove Innocent, Reporter, then Police.","#55506A")}</div>'
      f'<div style="display: flex; flex-direction: column; gap: 2px">{h("THẮNG THUA · WINNING")}'
      f'{p("Phe Thiện thắng khi có người buộc tội đúng. Đồng phạm thắng nếu qua 8 vòng, phe Thiện bị loại hết, hoặc tự chiếm đúng đáp án. Sai thì bị loại; Đồng phạm bị loại thì phe Thiện thắng.")}'
      f'{p("Good wins on a correct accusation. The Accomplice wins if 8 rounds pass, all Good are out, or they seize the right answer. Wrong = out; if the Accomplice is out, Good wins.","#55506A")}</div>'
      f'</div></div>')

R7=[("Thám tử","Detective","good","Mỗi vòng: bắt 1 người cho xem 1 lá thuộc 1 loại. Sai lần đầu không bị loại.","Each round: make 1 player show 1 card of a type. First wrong accusation is free.",r_detective),
    ("Nhân chứng","Witness","good","Đầu game, xem bí mật lá ĐỊA ĐIỂM trong hồ sơ.","At the start, secretly see the LOCATION case card.",r_witness),
    ("Phóng viên","Reporter","good","1 lần: hỏi một người họ có bao nhiêu lá thuộc 1 loại.","Once: ask a player how many cards of one type they hold.",r_reporter),
    ("Cảnh sát","Police","good","1 lần: bắt giữ 1 người. Đúng Đồng phạm = bạn thắng. Sai = bạn bị loại.","Once: arrest 1 player. If they are the Accomplice, you win. If not, you are out.",r_police),
    ("Người vô tội","Innocent","good","1 lần: đưa ra giả thuyết lần hai ngay trong lượt.","Once: make a second suggestion in the same turn.",r_innocent),
    ("Đồng phạm","Accomplice","bad","Xem NGHI PHẠM + HUNG KHÍ. 1 lần giấu lá. Từ vòng 4 (Tự do: 5) đoán đúng thì thắng.","See SUSPECT + WEAPON. Withhold a card once. From round 4 (FFA: 5) seize the answer to win.",r_accomplice),
    ("Hung thủ","Murderer","none","Không phát cho ai. Hung thủ là lá NGHI PHẠM trong hồ sơ.","Never dealt. The Murderer is the SUSPECT card in the case file.",r_murderer)]
cells=[rcard2(a,b,c,d,e,f()) for a,b,c,d,e,f in R7]+[rules2()]
open('out/Roles.dc.html','w').write(sheet("Thẻ vai trò",cells))
print("roles ok")

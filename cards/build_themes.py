#!/usr/bin/env python3
"""Builds game/public/themes.json: extra card themes (same card ids s0..s5, w0..w5, l0..l8).
Art is generated SVG (emoji + decor). To use painted art instead, put a JPG at
game/public/art/<theme>/<id>.jpg and set "img": true for that theme in THEMES below."""
import json, hashlib, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'game', 'public', 'themes.json')
FONT = "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"

# card: (emoji, vi, en, tag_vi, tag_en)
THEMES = {
 'modern': dict(vi='Hiện đại', en='Modern day', dv='Thành phố 2020s: livestream, startup, giao hàng.', de='Today’s city: livestreams, startups, delivery riders.', icon='📱',
  pal=dict(s=('#5b2a86','#1d3a8a'), w=('#27323f','#b9731c'), l=('#0f5c66','#1b2a4a')), decor='grid',
  cards={
   's0':('📱','Linh Livestream','Linh Livestream','Chưa tắt máy, chưa tắt hình.','Still live, even now.'),
   's1':('🧑‍💻','Tuấn Startup','Tuan the Founder','Gọi vốn xong là biến mất.','Vanishes after every funding round.'),
   's2':('🛵','Bác tài Hùng','Hung the Rider','Biết mọi ngõ ngách thành phố.','Knows every alley in the city.'),
   's3':('☕','Mai Barista','Mai the Barista','Nhớ tên và đơn của mọi người.','Remembers every name and order.'),
   's4':('🕶️','Kiên Hacker','Kien the Hacker','Mật khẩu nào cũng chỉ là chuyện nhỏ.','Any password is a small matter.'),
   's5':('👩‍💼','Chị Dung Môi giới','Dung the Broker','Căn nào cũng “hiếm lắm”.','Every flat is “a rare find”.'),
   'w0':('🔋','Sạc dự phòng quá nhiệt','Overheated power bank','Nóng hơn lời đồn.','Hotter than the rumours.'),
   'w1':('🤳','Gậy selfie','Selfie stick','Dài hơn cần thiết.','Longer than necessary.'),
   'w2':('🛴','Xe scooter điện','E-scooter','Êm, nhanh, không tiếng động.','Quiet and fast.'),
   'w3':('🔌','Dây sạc','Charging cable','Luôn rối đúng lúc cần.','Always tangled at the worst time.'),
   'w4':('🚁','Drone giao hàng','Delivery drone','Giao tận nơi, kể cả ý đồ.','Delivers everything, intentions included.'),
   'w5':('💾','Ổ cứng ngoài','External hard drive','Chứa nhiều hơn ảnh du lịch.','Holds more than holiday photos.'),
   'l0':('🏢','Văn phòng làm chung','Co-working space','Wi-Fi mạnh, bí mật yếu.','Strong Wi-Fi, weak secrets.'),
   'l1':('🍸','Rooftop bar','Rooftop bar','Thành phố lung linh phía dưới.','The city glitters below.'),
   'l2':('🅿️','Hầm gửi xe','Parking garage','Tiếng bước chân vọng lại.','Footsteps echo.'),
   'l3':('🖥️','Phòng máy chủ','Server room','Lạnh, ồn và luôn có người nghe.','Cold, loud and always listening.'),
   'l4':('🏪','Cửa hàng tiện lợi 24h','24h convenience store','Sáng đèn lúc 3 giờ sáng.','Lit up at 3 a.m.'),
   'l5':('🏋️','Phòng gym','Gym','Tạ nặng, nhân chứng nhẹ.','Heavy weights, light witnesses.'),
   'l6':('🚇','Ga tàu điện','Metro station','Ai cũng vội, không ai nhìn.','Everyone rushes, nobody looks.'),
   'l7':('🛗','Sảnh chung cư','Apartment lobby','Thang máy luôn đến chậm.','The lift is always late.'),
   'l8':('🍜','Quán phở đêm','Late-night noodle stall','Nước dùng nóng, tin đồn nóng hơn.','Hot broth, hotter gossip.'),
  }),
 'celeb': dict(vi='Ngôi sao showbiz', en='Showbiz stars', dv='Nhân vật hư cấu của làng giải trí: diva, ảnh đế, streamer.', de='Fictional celebrities: divas, screen kings, streamers.', icon='🌟',
  pal=dict(s=('#a3226a','#3b1d6b'), w=('#8a6a14','#3a2a10'), l=('#3b1d6b','#0e1330')), decor='sparkle',
  cards={
   's0':('🎤','Diva Mỹ Lệ','Diva My Le','Giọng hát triệu view.','A voice worth a million views.'),
   's1':('🎬','Ảnh đế Quang Vinh','Screen King Quang Vinh','Khóc trên phim, cười ngoài đời.','Tears on screen, smiles off it.'),
   's2':('⚽','Tiền đạo Bảo Long','Striker Bao Long','Sút thì trúng, nói thì trật.','Never misses a shot, often a word.'),
   's3':('🎮','Streamer Cún Con','Streamer Cun Con','Triệu người xem, một nhân chứng.','A million viewers, one witness.'),
   's4':('💼','Quản lý Thu Hà','Manager Thu Ha','Biết hết lịch trình và bí mật.','Knows every schedule and secret.'),
   's5':('📸','Săn ảnh Kỳ Phong','Paparazzo Ky Phong','Có mặt trước cả sự việc.','Arrives before the event does.'),
   'w0':('🏆','Cúp vàng','Golden trophy','Nặng hơn vinh quang.','Heavier than the glory.'),
   'w1':('🎙️','Micro mạ vàng','Gilded microphone','Dây quấn dài, tiếng vang xa.','Long cord, long echo.'),
   'w2':('💡','Đèn sân khấu','Stage spotlight','Chói đến mức không ai dám nhìn.','Too bright to look at.'),
   'w3':('🍾','Chai champagne','Champagne bottle','Mở tiệc, đóng sổ.','Open the party, close the case.'),
   'w4':('🎸','Đàn guitar điện','Electric guitar','Một nốt sai, một người ngã.','One wrong note, one person down.'),
   'w5':('🔭','Ống kính tele','Telephoto lens','Nhìn rõ hơn cần thiết.','Sees more than it should.'),
   'l0':('🌟','Thảm đỏ','Red carpet','Đèn flash không bao giờ tắt.','Flashes never stop.'),
   'l1':('🚪','Hậu trường','Backstage','Nơi sự thật thay đồ.','Where the truth changes costume.'),
   'l2':('🎧','Phòng thu âm','Recording studio','Cách âm tuyệt đối.','Perfectly soundproof.'),
   'l3':('🎥','Phim trường','Film set','Mọi thứ đều giả, trừ vụ này.','Everything is fake except this.'),
   'l4':('🏨','Penthouse khách sạn','Hotel penthouse','Tầng cao nhất, tin đồn xa nhất.','Top floor, widest rumours.'),
   'l5':('✈️','Máy bay riêng','Private jet','Không ai nghe thấy trên mây.','No one hears you up here.'),
   'l6':('🏟️','Sân vận động','Stadium','Mười nghìn nhân chứng, không ai thấy.','Ten thousand witnesses, none saw.'),
   'l7':('👗','Sàn diễn thời trang','Fashion runway','Đi qua, quay lại, giấu mọi thứ.','Walk, turn, hide everything.'),
   'l8':('🚐','Xe limo','Stretch limo','Kính đen, tai thính.','Tinted glass, keen ears.'),
  }),
 'space': dict(vi='Trạm vũ trụ', en='Space station', dv='Trạm Alpha giữa hư vô: một vụ án, không lối thoát.', de='Station Alpha in the void: one murder, no way out.', icon='🚀',
  pal=dict(s=('#243b7a','#0b1230'), w=('#4a2a6b','#12102a'), l=('#0f4f5c','#0a1024')), decor='stars',
  cards={
   's0':('👨‍🚀','Thuyền trưởng Vega','Captain Vega','Chưa từng bỏ ca trực.','Never left a watch.'),
   's1':('🧑‍🔧','Kỹ sư Tâm','Engineer Tam','Sửa gì cũng được, trừ lời hứa.','Fixes anything but promises.'),
   's2':('🧪','Tiến sĩ Lan','Dr. Lan, xenobiologist','Yêu mẫu vật hơn con người.','Likes specimens better than people.'),
   's3':('🤖','Robot quản gia B-0T','Butler-bot B-0T','Lịch sự tuyệt đối, ghi nhớ tuyệt đối.','Perfectly polite, perfectly recorded.'),
   's4':('🧑‍✈️','Phi công Rex','Pilot Rex','Hạ cánh êm, nói dối cũng êm.','Smooth landings, smoother lies.'),
   's5':('🧑‍⚕️','Bác sĩ Mộc','Medic Moc','Giữ bí mật y khoa của cả trạm.','Holds the whole station’s medical secrets.'),
   'w0':('🔧','Cờ lê plasma','Plasma wrench','Sáng xanh và rất nóng.','Glows blue, runs hot.'),
   'w1':('🧯','Bình oxy','Oxygen tank','Cạn đúng lúc.','Runs out at the right moment.'),
   'w2':('🔪','Dao mổ laser','Laser scalpel','Cắt không cần chạm.','Cuts without touching.'),
   'w3':('🍄','Bào tử ngoài hành tinh','Alien spores','Nhỏ, xinh, và đang lớn.','Small, pretty and growing.'),
   'w4':('🔥','Súng hàn','Welding torch','Làm chảy cả bằng chứng.','Melts evidence too.'),
   'w5':('🪢','Cáp neo','Tether cable','Dây an toàn, đôi khi thì không.','A safety line, sometimes.'),
   'l0':('🕹️','Buồng lái','Command bridge','Mọi ánh mắt nhìn về phía trước.','All eyes forward.'),
   'l1':('🌱','Vườn thủy canh','Hydroponics bay','Xanh mướt giữa hư vô.','Green in the void.'),
   'l2':('☢️','Lõi lò phản ứng','Reactor core','Ấm áp, theo nghĩa xấu.','Warm, in the worst way.'),
   'l3':('🍲','Phòng ăn','Mess hall','Đồ ăn đóng gói, tin đồn tươi.','Packaged food, fresh gossip.'),
   'l4':('💉','Khoang y tế','Med bay','Sạch bóng và im lặng.','Spotless and quiet.'),
   'l5':('📦','Kho hàng','Cargo bay','Thùng nào cũng giấu được người.','Every crate could hide someone.'),
   'l6':('🔭','Đài quan sát','Observation deck','Cả dải Ngân Hà làm nhân chứng.','The Milky Way as witness.'),
   'l7':('❄️','Phòng ngủ đông','Cryo chamber','Ngủ say, hoặc giả vờ.','Sound asleep, or pretending.'),
   'l8':('🚪','Khoang khí','Airlock','Lối thoát duy nhất, đi một chiều.','The only way out, one way.'),
  }),
}

def h(s, n): return int(hashlib.md5(s.encode()).hexdigest()[:8], 16) % n

def decor(kind, uid, seed):
    d = ''
    if kind == 'grid':      # city grid + notification dots
        d += '<g stroke="#ffffff" stroke-opacity=".08" stroke-width="1">' + ''.join(f'<path d="M{x} 0V150"/>' for x in range(0, 201, 20)) + ''.join(f'<path d="M0 {y}H200"/>' for y in range(0, 151, 20)) + '</g>'
        for i in range(5):
            x = 20 + h(uid+str(i), 160); y = 15 + h(uid+'y'+str(i), 120)
            d += f'<circle cx="{x}" cy="{y}" r="{2+h(uid+"r"+str(i),3)}" fill="#7dd3fc" fill-opacity=".35"/>'
        d += '<path d="M0 118H200V150H0Z" fill="#000" fill-opacity=".22"/>'
    elif kind == 'sparkle':  # spotlights + sparkles
        d += '<path d="M30 0L70 150H-10Z" fill="#fff" fill-opacity=".07"/><path d="M170 0L210 150H130Z" fill="#fff" fill-opacity=".07"/>'
        for i in range(9):
            x = 10 + h(uid+str(i), 180); y = 8 + h(uid+'y'+str(i), 110); s = 2 + h(uid+'s'+str(i), 4)
            d += f'<path d="M{x} {y-s*2}L{x+s*.6} {y-s*.6}L{x+s*2} {y}L{x+s*.6} {y+s*.6}L{x} {y+s*2}L{x-s*.6} {y+s*.6}L{x-s*2} {y}L{x-s*.6} {y-s*.6}Z" fill="#ffe08a" fill-opacity=".7"/>'
        d += '<path d="M0 122H200V150H0Z" fill="#000" fill-opacity=".25"/>'
    else:                    # stars + planet arc
        for i in range(26):
            x = h(uid+str(i), 200); y = h(uid+'y'+str(i), 150)
            d += f'<circle cx="{x}" cy="{y}" r="{.6+h(uid+"r"+str(i),3)*.5}" fill="#fff" fill-opacity="{.35+h(uid+"o"+str(i),5)*.12}"/>'
        d += '<circle cx="%d" cy="205" r="95" fill="#3a6ea5" fill-opacity=".35"/><circle cx="%d" cy="215" r="95" fill="#0b1230" fill-opacity=".55"/>' % (60+h(uid,80), 70+h(uid,80))
    return d

def art(theme, cid, emoji, t):
    k = cid[0]; c1, c2 = t['pal'][k]; uid = f'{theme}{cid}'
    gid = f'g{uid}'
    big = 78 if k != 'l' else 82
    return (f'<svg viewBox="0 0 200 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" style="display:block">'
            f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'
            f'<radialGradient id="{gid}r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="200" height="150" fill="url(#{gid})"/>{decor(t["decor"], uid, 0)}'
            f'<circle cx="100" cy="72" r="62" fill="url(#{gid}r)"/>'
            f'<ellipse cx="100" cy="124" rx="38" ry="6" fill="#000" fill-opacity=".35"/>'
            f'<text x="100" y="{98 if k!="l" else 100}" font-size="{big}" text-anchor="middle" font-family="{FONT}">{emoji}</text></svg>')

out = {'themes': {}}
for tid, t in THEMES.items():
    cards = {}
    for cid, (em, vi, en, tv, te) in t['cards'].items():
        cards[cid] = dict(vi=vi, en=en, tag=tv, tag_en=te, emoji=em, svg=art(tid, cid, em, t))
    out['themes'][tid] = dict(id=tid, vi=t['vi'], en=t['en'], dv=t['dv'], de=t['de'], icon=t['icon'], cards=cards)
json.dump(out, open(OUT, 'w'), ensure_ascii=False)
print('wrote', os.path.getsize(OUT)//1024, 'KB,', {k: len(v['cards']) for k, v in out['themes'].items()})

import json
import random
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, 'public', 'data', 'floor_patterns.json')
JS_PATH = os.path.join(BASE_DIR, 'public', 'js', 'data', 'floor_patterns.js')

random.seed(2026) # Maraqlı və təkrarolunmaz strukturlar üçün baza toxumu

THEMES = [
    ("Mərkəzi Dəhliz və Kənar Kaskadlar", "Geniş təhlükəsiz keçid mərkəzdən keçir, lavalar kənarlardan axır."),
    ("Ziqzaq Platformalar və Pilləli Axın", "Sağ və sol tərəfə növbəli sıçrayışlar tələb olunur."),
    ("İkili Qüllələr və Orta Şəlalə", "Ortadan tökülən lavanın hər iki tərəfində üzən qayalar."),
    ("Asma Adacıqlar və Havada Damcılar", "Kiçik sürətli platformalar və havada kəsilmiş lavalar."),
    ("Labirint Terrasları", "Geniş platformalar və onların altındakı sığınacaq zonaları."),
    ("Piramida Pilləkənləri", "Aşağıdan yuxarıya daralan pilləli adacıqlar."),
    ("Küləkli Yarğan", "Platformalar divarlar boyu düzülüb, mərkəz şaquli enişdir."),
    ("Vulkanik Körpülər", "Üfüqi uzun qayalar və kənarlardan kaskad axan lava."),
    ("Tərs Pilləkən Zənciri", "Yuxarıya doğru sola və sağa meyilli terraslar."),
    ("Böyük Lava Qapıları", "Qayaların arasından tökülən paralel cüt şəlalələr."),
    ("Bazalt Sütunları", "Şaquli pilləli düzülmüş möhkəm platformalar."),
    ("Sıçrayış Meydançası", "Geniş atılma məsafələri və alt təhlükəsizlik qayaları."),
    ("Magma Qalası", "Mürəkkəb çoxpilləli qaya silsilələri."),
    ("Şəlalə Dəhlizi", "Üçlü lava axını və onların altından keçən tunellər."),
    ("Sürətli Qaçış Zolağı", "Düz və ardıcıl düzülmüş asan çıxış yolu."),
    ("Kəsişən Axınlar", "Sağa və sola yönələn kaskad axınlar."),
    ("Gölməçə Terrasları", "Qayaların üstündə toplanan və kənarlara tökülən lavalar."),
    ("Havada Kəsilmiş Pərdə", "Platformaların ortasında kəsilən təhlükəsiz pərdə."),
    ("Uçurum Cığırı", "Yalnız bir tərəfdən yuxarı qalxan dar cığır."),
    ("Nəhəng Platforma Meydanı", "Böyük qayalar və aralarındakı dəqiq boşluqlar."),
    ("Spiral Pillələr", "Saat əqrəbi istiqamətində yuxarı qalxan qayalar."),
    ("Yanğın Dəhlizi", "Kənarlardan sıxılmış, ortadan açıq koridor."),
    ("Qoşa Şəlalə Adacıqları", "İki paralel axın və ortada sabit platforma."),
    ("Yüksək Sıçrayış Zirvəsi", "Hər pilləsi bir qədər hündür olan platformalar."),
    ("Damcılayan Mağara", "Tək-tək havada kəsilmiş zərif lava damcıları."),
    ("Zəncirvari Kaskad", "Bir qayadan digərinə pillə-pillə tökülən lava."),
    ("Təhlükəsiz Sığınacaqlar", "Lavanın altındakı geniş müdafiə zonaları."),
    ("Vulkanik Labirint", "Oyunçunun yol axtarması üçün çoxsaylı alternativlər."),
    ("Köz Cığırı", "Zirvəyə yaxınlaşdıqca sürətlənən platforma ritmi."),
    ("BÖYÜK QƏLƏBƏ ZİRVƏSİ", "30-cu Qatın möhtəşəm çoxqatlı sınaq qalası.")
]

tracks = []

for track_id in range(1, 31):
    theme_title, theme_notes = THEMES[track_id - 1]
    name = f"Yol {track_id}: {theme_title}"
    world_height = 1800

    rocks = []
    lava_sources = []

    # 1. Platformaların Generasiyası (4-6 mərtəbə pillələri)
    # y = 1450 (alt), 1150, 880, 600, 340 (üst)
    y_levels = [1420, 1160, 900, 640, 380]
    
    # Hər səviyyədə 1 və ya 2 qaya
    for lvl_idx, y in enumerate(y_levels):
        # Təsadüfi arxitektura forması
        style = (track_id + lvl_idx) % 4
        
        if style == 0:
            # Ortada tək geniş platforma
            w = random.randint(260, 340)
            x = (800 - w) // 2 + random.randint(-40, 40)
            rocks.append({"x": max(40, min(760 - w, x)), "y": y, "w": w, "h": 42})
        elif style == 1:
            # İki tərəfli platformalar (ortada dəhliz)
            w1 = random.randint(180, 240)
            w2 = random.randint(180, 240)
            rocks.append({"x": random.randint(40, 90), "y": y, "w": w1, "h": 42})
            rocks.append({"x": random.randint(480, 560), "y": y, "w": w2, "h": 42})
        elif style == 2:
            # Sola meyilli tək və ya cüt
            w = random.randint(220, 300)
            x = random.randint(80, 260)
            rocks.append({"x": x, "y": y, "w": w, "h": 42})
            if random.random() < 0.6:
                rocks.append({"x": random.randint(490, 580), "y": y + random.choice([-30, 30]), "w": random.randint(160, 220), "h": 42})
        else:
            # Sağa meyilli
            w = random.randint(220, 300)
            x = random.randint(340, 520)
            rocks.append({"x": x, "y": y, "w": w, "h": 42})
            if random.random() < 0.6:
                rocks.append({"x": random.randint(50, 140), "y": y + random.choice([-30, 30]), "w": random.randint(160, 220), "h": 42})

    # Çıxış üçün ən yuxarı finiş platforması
    rocks.append({"x": random.randint(220, 360), "y": 200, "w": random.randint(240, 320), "h": 42})

    # 2. Lava Mənbələrinin Generasiyası (1 - 3 ədəd maraqlı axın)
    lava_count = random.choice([1, 2, 2, 3])
    if track_id <= 3:
        lava_count = min(lava_count, 2) # İlk yollar daha yumşaq olsun
        
    possible_lava_x = [random.randint(60, 160), random.randint(280, 480), random.randint(600, 710)]
    random.shuffle(possible_lava_x)

    for l_idx in range(lava_count):
        lx = possible_lava_x[l_idx]
        ly = random.randint(220, 440)
        direction = random.choice(['auto', 'auto', 'right', 'left'])
        
        lava_obj = {
            "x": lx,
            "y": ly,
            "w": 24,
            "direction": direction
        }
        
        # Bəzi lavalar havada kəsilsin (endY) və ya platformada dayansın (stopOnHit)
        r_type = random.random()
        if r_type < 0.28:
            lava_obj["stopOnHit"] = True
        elif r_type < 0.55:
            # Havada sonlanma (növbəti qayadan yuxarıda)
            lava_obj["endY"] = ly + random.randint(350, 650)
            
        lava_sources.append(lava_obj)

    tracks.append({
        "id": track_id,
        "name": name,
        "notes": theme_notes,
        "worldHeight": world_height,
        "rocks": rocks,
        "lavaSources": lava_sources
    })

payload = {
    "totalTracks": len(tracks),
    "description": "Floor Escape 30 ədəd prosedural sınaq yolu. Track Studio tərəfindən idarə olunur.",
    "tracks": tracks
}

with open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(payload, f, indent=2, ensure_ascii=False)

with open(JS_PATH, 'w', encoding='utf-8') as f:
    f.write(f"// Avtomatik yenilənmiş Floor Escape Sınaq Yolları\nwindow.FLOOR_PATTERNS = {json.dumps(payload, indent=2, ensure_ascii=False)};\n")

print(f"UĞURLA GENERASİYA OLUNDU! 30 ədəd unikal yol fayllara yazıldı:")
print(f" - {JSON_PATH}")
print(f" - {JS_PATH}")

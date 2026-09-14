const fs = require('fs');
const path = require('path');

// 30 unikal, dəqiq və keçilə bilən yol şablonu
const patterns = [];

// Yardımçı funksiya
function makeTrack(id, name, rocks, lavaSources, notes = "") {
    return {
        id,
        name,
        notes: notes || `Yol ${id} üçün sınaq konfiqurasiyası`,
        worldHeight: 1800,
        rocks,
        lavaSources
    };
}

// 1. Yol 1: "Klassik Sağa Meylli Kaskad"
// Yuxarıdan sol tərəfə tökülən lava qayaya dəyir, sağa meyillənir. Sol və alt təhlükəsizdir.
patterns.push(makeTrack(1, "Yol 1: Klassik Sağa Meylli Kaskad", [
    { x: 100, y: 1360, w: 240, h: 42 },
    { x: 460, y: 1360, w: 240, h: 42 },
    { x: 140, y: 1080, w: 320, h: 42 },
    { x: 380, y: 800,  w: 300, h: 42 },
    { x: 100, y: 520,  w: 260, h: 42 },
    { x: 440, y: 520,  w: 260, h: 42 },
    { x: 250, y: 260,  w: 300, h: 42 }
], [
    { x: 160, y: 280, w: 24 },
    { x: 620, y: 380, w: 24 }
], "Lava 1-ci qayanın soluna dəyib sağa axır, sol tərəf və qayanın altı tam sərbəst keçiddir."));

// 2. Yol 2: "Klassik Sola Meylli Kaskad"
patterns.push(makeTrack(2, "Yol 2: Klassik Sola Meylli Kaskad", [
    { x: 80,  y: 1380, w: 260, h: 42 },
    { x: 450, y: 1380, w: 270, h: 42 },
    { x: 320, y: 1100, w: 340, h: 42 },
    { x: 120, y: 820,  w: 320, h: 42 },
    { x: 420, y: 540,  w: 300, h: 42 },
    { x: 150, y: 280,  w: 280, h: 42 }
], [
    { x: 610, y: 260, w: 24 },
    { x: 180, y: 400, w: 24 }
], "Lava sağa dəyib sola yönəlir, sağ qanad və platforma altı tam təhlükəsizdir."));

// 3. Yol 3: "Mərkəzi Sığınacaq və İkili Axın"
patterns.push(makeTrack(3, "Yol 3: Mərkəzi Sığınacaq və İkili Axın", [
    { x: 260, y: 1400, w: 280, h: 42 },
    { x: 60,  y: 1140, w: 200, h: 42 },
    { x: 540, y: 1140, w: 200, h: 42 },
    { x: 250, y: 880,  w: 300, h: 42 },
    { x: 80,  y: 620,  w: 220, h: 42 },
    { x: 500, y: 620,  w: 220, h: 42 },
    { x: 280, y: 360,  w: 240, h: 42 }
], [
    { x: 90,  y: 260, w: 24 },
    { x: 680, y: 260, w: 24 }
], "Lavalar yalnız divar kənarlarından axır, mərkəz boyunca nəhəng təhlükəsiz sığınacaq qalır."));

// 4. Yol 4: "Ziqzaq Kaskad Dəhlizi"
patterns.push(makeTrack(4, "Yol 4: Ziqzaq Kaskad Dəhlizi", [
    { x: 80,  y: 1360, w: 320, h: 42 },
    { x: 400, y: 1120, w: 320, h: 42 },
    { x: 80,  y: 880,  w: 320, h: 42 },
    { x: 400, y: 640,  w: 320, h: 42 },
    { x: 150, y: 380,  w: 280, h: 42 },
    { x: 370, y: 180,  w: 280, h: 42 }
], [
    { x: 120, y: 220, w: 24 },
    { x: 650, y: 480, w: 24 }
], "Lava pillələr boyu sola və sağa ziqzaqla kaskad edir, əks istiqamətdə oyunçu üçün geniş keçidlər var."));

// 5. Yol 5: "Əkiz Qaya və Geniş Orta Yol"
patterns.push(makeTrack(5, "Yol 5: Əkiz Qaya və Geniş Orta Yol", [
    { x: 60,  y: 1380, w: 220, h: 42 },
    { x: 520, y: 1380, w: 220, h: 42 },
    { x: 100, y: 1100, w: 240, h: 42 },
    { x: 460, y: 1100, w: 240, h: 42 },
    { x: 60,  y: 820,  w: 240, h: 42 },
    { x: 500, y: 820,  w: 240, h: 42 },
    { x: 260, y: 540,  w: 280, h: 42 },
    { x: 240, y: 260,  w: 320, h: 42 }
], [
    { x: 130, y: 240, w: 24 },
    { x: 630, y: 240, w: 24 }
], "Ortada 260px enində tamamilə təmiz keçid xiyabanı var."));

// 6. Yol 6: "Sol Qanad Qorunması"
patterns.push(makeTrack(6, "Yol 6: Sol Qanad Qorunması", [
    { x: 50,  y: 1400, w: 350, h: 42 },
    { x: 50,  y: 1120, w: 350, h: 42 },
    { x: 50,  y: 840,  w: 350, h: 42 },
    { x: 50,  y: 560,  w: 350, h: 42 },
    { x: 220, y: 280,  w: 360, h: 42 }
], [
    { x: 540, y: 240, w: 26 },
    { x: 680, y: 440, w: 24 }
], "Bütün sol cinah nəhəng obsidian qalxanıdır, oyunçu sol tərəflə sərbəst yüksəlir."));

// 7. Yol 7: "Sağ Qanad Qorunması"
patterns.push(makeTrack(7, "Yol 7: Sağ Qanad Qorunması", [
    { x: 400, y: 1400, w: 350, h: 42 },
    { x: 400, y: 1120, w: 350, h: 42 },
    { x: 400, y: 840,  w: 350, h: 42 },
    { x: 400, y: 560,  w: 350, h: 42 },
    { x: 220, y: 280,  w: 360, h: 42 }
], [
    { x: 120, y: 240, w: 26 },
    { x: 260, y: 440, w: 24 }
], "Bütün sağ cinah obsidian qalxanıdır, oyunçu sağ tərəflə maneəsiz qalxa bilir."));

// 8. Yol 8: "Pilləli Kaskad Pilləkəni"
patterns.push(makeTrack(8, "Yol 8: Pilləli Kaskad Pilləkəni", [
    { x: 60,  y: 1420, w: 220, h: 42 },
    { x: 220, y: 1180, w: 240, h: 42 },
    { x: 400, y: 940,  w: 240, h: 42 },
    { x: 200, y: 700,  w: 260, h: 42 },
    { x: 460, y: 460,  w: 260, h: 42 },
    { x: 150, y: 240,  w: 280, h: 42 }
], [
    { x: 480, y: 260, w: 24 },
    { x: 120, y: 500, w: 24 }
], "Pilləli adalar zənciri; hər adanın kənarında oyunçu üçün dincəlmə və süzülmə sahəsi."));

// 9. Yol 9: "Geniş Mərkəz Koridoru"
patterns.push(makeTrack(9, "Yol 9: Geniş Mərkəz Koridoru", [
    { x: 70,  y: 1380, w: 180, h: 42 },
    { x: 550, y: 1380, w: 180, h: 42 },
    { x: 50,  y: 1060, w: 220, h: 42 },
    { x: 530, y: 1060, w: 220, h: 42 },
    { x: 80,  y: 740,  w: 200, h: 42 },
    { x: 520, y: 740,  w: 200, h: 42 },
    { x: 260, y: 420,  w: 280, h: 42 },
    { x: 220, y: 200,  w: 360, h: 42 }
], [
    { x: 90,  y: 200, w: 24 },
    { x: 670, y: 200, w: 24 }
], "Ortada 300px sərbəst dəhliz, təhlükəsiz şəkildə şaquli hərəkət üçün idealdır."));

// 10. Yol 10: "Çarpaz Kaskad Şəbəkəsi"
patterns.push(makeTrack(10, "Yol 10: Çarpaz Kaskad Şəbəkəsi", [
    { x: 140, y: 1380, w: 260, h: 42 },
    { x: 420, y: 1380, w: 260, h: 42 },
    { x: 260, y: 1100, w: 280, h: 42 },
    { x: 80,  y: 820,  w: 260, h: 42 },
    { x: 460, y: 820,  w: 260, h: 42 },
    { x: 220, y: 540,  w: 360, h: 42 },
    { x: 280, y: 260,  w: 240, h: 42 }
], [
    { x: 180, y: 300, w: 24 },
    { x: 580, y: 300, w: 24 }
], "Lava mənbələri qayalara toxunaraq kənarlara yönəlir, ortada zirehli dəhliz saxlayır."));

// 11 - 20 yollarını tərtib edirik:
// 11. Yol 11: "Piramida Sığınacaqları"
patterns.push(makeTrack(11, "Yol 11: Piramida Sığınacaqları", [
    { x: 100, y: 1420, w: 600, h: 42 },
    { x: 180, y: 1140, w: 440, h: 42 },
    { x: 260, y: 860,  w: 280, h: 42 },
    { x: 320, y: 580,  w: 160, h: 42 },
    { x: 220, y: 280,  w: 360, h: 42 }
], [
    { x: 80,  y: 220, w: 24 },
    { x: 690, y: 220, w: 24 }
], "Geniş təbəqəli piramida platformaları; oyunçu sağ və sol kənarlar arasından istədiyi tərəfi seçə bilir."));

// 12. Yol 12: "Geniş Adacıqlar və Sağ Axın"
patterns.push(makeTrack(12, "Yol 12: Geniş Adacıqlar və Sağ Axın", [
    { x: 120, y: 1360, w: 320, h: 42 },
    { x: 480, y: 1360, w: 200, h: 42 },
    { x: 80,  y: 1060, w: 280, h: 42 },
    { x: 420, y: 1060, w: 300, h: 42 },
    { x: 200, y: 760,  w: 360, h: 42 },
    { x: 80,  y: 480,  w: 300, h: 42 },
    { x: 450, y: 480,  w: 260, h: 42 },
    { x: 240, y: 220,  w: 320, h: 42 }
], [
    { x: 620, y: 260, w: 24 },
    { x: 220, y: 520, w: 24 }
], "Rahat manevr üçün böyük dayanıqlı adalar; sol keçid həmişə açıqdır."));

// 13. Yol 13: "Spiral Sağ Kaskad"
patterns.push(makeTrack(13, "Yol 13: Spiral Sağ Kaskad", [
    { x: 60,  y: 1400, w: 320, h: 42 },
    { x: 380, y: 1140, w: 360, h: 42 },
    { x: 80,  y: 860,  w: 360, h: 42 },
    { x: 420, y: 580,  w: 320, h: 42 },
    { x: 180, y: 300,  w: 420, h: 42 }
], [
    { x: 450, y: 320, w: 24 },
    { x: 140, y: 600, w: 24 }
], "Lava spiral trayektoriya ilə aşağı axır, sığınacaqlar spiralın altında yerləşir."));

// 14. Yol 14: "Spiral Sol Kaskad"
patterns.push(makeTrack(14, "Yol 14: Spiral Sol Kaskad", [
    { x: 420, y: 1400, w: 320, h: 42 },
    { x: 60,  y: 1140, w: 360, h: 42 },
    { x: 360, y: 860,  w: 360, h: 42 },
    { x: 60,  y: 580,  w: 320, h: 42 },
    { x: 200, y: 300,  w: 400, h: 42 }
], [
    { x: 120, y: 320, w: 24 },
    { x: 640, y: 600, w: 24 }
], "Sol küncdən başlayan spiral axın; sağ dəhliz geniş və təhlükəsizdir."));

// 15. Yol 15: "Qoşa Sütun Dəhlizi"
patterns.push(makeTrack(15, "Yol 15: Qoşa Sütun Dəhlizi", [
    { x: 240, y: 1380, w: 140, h: 42 },
    { x: 420, y: 1380, w: 140, h: 42 },
    { x: 100, y: 1080, w: 240, h: 42 },
    { x: 460, y: 1080, w: 240, h: 42 },
    { x: 260, y: 780,  w: 280, h: 42 },
    { x: 80,  y: 480,  w: 240, h: 42 },
    { x: 480, y: 480,  w: 240, h: 42 },
    { x: 260, y: 220,  w: 280, h: 42 }
], [
    { x: 280, y: 240, w: 24 },
    { x: 490, y: 240, w: 24 }
], "Mərkəzi sütunlar lavanı kənarlara istiqamətləndirir, həm sol, həm sağ divarlar boyu sərbəst yol qalır."));

// 16. Yol 16: "Dalğavari Kaskad"
patterns.push(makeTrack(16, "Yol 16: Dalğavari Kaskad", [
    { x: 100, y: 1420, w: 280, h: 42 },
    { x: 440, y: 1220, w: 280, h: 42 },
    { x: 80,  y: 1000, w: 300, h: 42 },
    { x: 420, y: 780,  w: 300, h: 42 },
    { x: 100, y: 560,  w: 280, h: 42 },
    { x: 440, y: 340,  w: 280, h: 42 },
    { x: 250, y: 180,  w: 300, h: 42 }
], [
    { x: 150, y: 200, w: 24 },
    { x: 600, y: 400, w: 24 }
], "Dalğavari ardıcıllıqla yerləşmiş qayalar ritmik və asan keçid təmin edir."));

// 17. Yol 17: "Böyük Mərkəzi Ada"
patterns.push(makeTrack(17, "Yol 17: Böyük Mərkəzi Ada", [
    { x: 200, y: 1350, w: 400, h: 46 },
    { x: 60,  y: 1050, w: 200, h: 42 },
    { x: 540, y: 1050, w: 200, h: 42 },
    { x: 180, y: 750,  w: 440, h: 46 },
    { x: 80,  y: 450,  w: 200, h: 42 },
    { x: 520, y: 450,  w: 200, h: 42 },
    { x: 220, y: 200,  w: 360, h: 42 }
], [
    { x: 80,  y: 220, w: 24 },
    { x: 680, y: 220, w: 24 }
], "Mərkəzdə böyük sığınacaq adaları var, lava isə yalnız divarların dibi ilə axır."));

// 18. Yol 18: "İkiqat Qalxan Ziqzaqı"
patterns.push(makeTrack(18, "Yol 18: İkiqat Qalxan Ziqzaqı", [
    { x: 80,  y: 1380, w: 300, h: 42 },
    { x: 420, y: 1380, w: 300, h: 42 },
    { x: 250, y: 1100, w: 300, h: 42 },
    { x: 70,  y: 820,  w: 320, h: 42 },
    { x: 410, y: 820,  w: 320, h: 42 },
    { x: 220, y: 520,  w: 360, h: 42 },
    { x: 280, y: 250,  w: 240, h: 42 }
], [
    { x: 120, y: 300, w: 24 },
    { x: 660, y: 300, w: 24 }
], "Qalxan tipli cüt qayalar kaskadları kənarlara atır, oyunçu üçün ortadan zəmanətli keçid yaradır."));

// 19. Yol 19: "Hündür Tullanış və Manevr Qayaları"
patterns.push(makeTrack(19, "Yol 19: Hündür Tullanış və Manevr Qayaları", [
    { x: 120, y: 1400, w: 240, h: 42 },
    { x: 440, y: 1400, w: 240, h: 42 },
    { x: 280, y: 1120, w: 240, h: 42 },
    { x: 100, y: 840,  w: 240, h: 42 },
    { x: 460, y: 840,  w: 240, h: 42 },
    { x: 260, y: 560,  w: 280, h: 42 },
    { x: 240, y: 240,  w: 320, h: 42 }
], [
    { x: 380, y: 240, w: 24 },
    { x: 640, y: 480, w: 24 }
], "Geniş hava boşluqları sayəsində oyunçu manevr azadlığına malikdir."));

// 20. Yol 20: "Sağ Sığınacaq Labirinti"
patterns.push(makeTrack(20, "Yol 20: Sağ Sığınacaq Labirinti", [
    { x: 500, y: 1380, w: 240, h: 42 },
    { x: 100, y: 1200, w: 320, h: 42 },
    { x: 480, y: 980,  w: 260, h: 42 },
    { x: 80,  y: 780,  w: 320, h: 42 },
    { x: 460, y: 560,  w: 280, h: 42 },
    { x: 150, y: 340,  w: 320, h: 42 },
    { x: 350, y: 180,  w: 300, h: 42 }
], [
    { x: 160, y: 220, w: 24 },
    { x: 240, y: 440, w: 24 }
], "Bütün sağ hissə qorunub, oyunçu sağ divara yaxın qalxaraq rahat çıxışa çatır."));

// 21 - 30 yolları
// 21. Yol 21: "Sol Sığınacaq Labirinti"
patterns.push(makeTrack(21, "Yol 21: Sol Sığınacaq Labirinti", [
    { x: 60,  y: 1380, w: 240, h: 42 },
    { x: 380, y: 1200, w: 320, h: 42 },
    { x: 60,  y: 980,  w: 260, h: 42 },
    { x: 400, y: 780,  w: 320, h: 42 },
    { x: 60,  y: 560,  w: 280, h: 42 },
    { x: 330, y: 340,  w: 320, h: 42 },
    { x: 150, y: 180,  w: 300, h: 42 }
], [
    { x: 600, y: 220, w: 24 },
    { x: 520, y: 440, w: 24 }
], "Bütün sol hissə qorunub, sol tərəfdən asudə yüksəlmək mümkündür."));

// 22. Yol 22: "Kəpənək Qanadları"
patterns.push(makeTrack(22, "Yol 22: Kəpənək Qanadları", [
    { x: 80,  y: 1400, w: 240, h: 42 },
    { x: 480, y: 1400, w: 240, h: 42 },
    { x: 120, y: 1100, w: 220, h: 42 },
    { x: 460, y: 1100, w: 220, h: 42 },
    { x: 160, y: 800,  w: 200, h: 42 },
    { x: 440, y: 800,  w: 200, h: 42 },
    { x: 240, y: 500,  w: 320, h: 42 },
    { x: 260, y: 220,  w: 280, h: 42 }
], [
    { x: 90,  y: 260, w: 24 },
    { x: 670, y: 260, w: 24 }
], "Simmetrik kəpənək formalı qayalar, ortada sabit 220px təhlükəsiz zolaq."));

// 23. Yol 23: "Üçqat Şəlalə Maneəsi və Sığınacaq Körpüsü"
patterns.push(makeTrack(23, "Yol 23: Üçqat Şəlalə Maneəsi və Sığınacaq Körpüsü", [
    { x: 60,  y: 1380, w: 200, h: 42 },
    { x: 300, y: 1380, w: 200, h: 42 },
    { x: 540, y: 1380, w: 200, h: 42 },
    { x: 180, y: 1080, w: 440, h: 42 },
    { x: 60,  y: 780,  w: 220, h: 42 },
    { x: 520, y: 780,  w: 220, h: 42 },
    { x: 220, y: 480,  w: 360, h: 42 },
    { x: 260, y: 200,  w: 280, h: 42 }
], [
    { x: 100, y: 240, w: 22 },
    { x: 660, y: 240, w: 22 }
], "Qayaların altında böyük sığınacaq körpüləri formalaşır, lava yanlardan kaskad edir."));

// 24. Yol 24: "Alçaq Kaskad Dəhlizi"
patterns.push(makeTrack(24, "Yol 24: Alçaq Kaskad Dəhlizi", [
    { x: 100, y: 1420, w: 260, h: 42 },
    { x: 440, y: 1420, w: 260, h: 42 },
    { x: 260, y: 1180, w: 280, h: 42 },
    { x: 80,  y: 920,  w: 300, h: 42 },
    { x: 420, y: 920,  w: 300, h: 42 },
    { x: 160, y: 620,  w: 480, h: 42 },
    { x: 250, y: 280,  w: 300, h: 42 }
], [
    { x: 200, y: 400, w: 24 },
    { x: 580, y: 400, w: 24 }
], "Yuxarı zona geniş və açıqdır, kaskadlar aşağı mərtəbələrdə maraqlı bulmaca təşkil edir."));

// 25. Yol 25: "Yuxarı Kaskad Dəhlizi"
patterns.push(makeTrack(25, "Yol 25: Yuxarı Kaskad Dəhlizi", [
    { x: 140, y: 1360, w: 520, h: 42 },
    { x: 80,  y: 1080, w: 280, h: 42 },
    { x: 440, y: 1080, w: 280, h: 42 },
    { x: 240, y: 780,  w: 320, h: 42 },
    { x: 100, y: 500,  w: 260, h: 42 },
    { x: 440, y: 500,  w: 260, h: 42 },
    { x: 270, y: 220,  w: 260, h: 42 }
], [
    { x: 180, y: 200, w: 24 },
    { x: 580, y: 200, w: 24 }
], "Başlanğıc hissəsi tam sərbəst, yuxarı hissədə isə estetik kaskad sığınacaqları mövcuddur."));

// 26. Yol 26: "Obsidian Pillələr"
patterns.push(makeTrack(26, "Yol 26: Obsidian Pillələr", [
    { x: 80,  y: 1400, w: 220, h: 42 },
    { x: 360, y: 1400, w: 360, h: 42 },
    { x: 120, y: 1120, w: 340, h: 42 },
    { x: 520, y: 1120, w: 200, h: 42 },
    { x: 80,  y: 840,  w: 220, h: 42 },
    { x: 360, y: 840,  w: 360, h: 42 },
    { x: 180, y: 540,  w: 440, h: 42 },
    { x: 240, y: 240,  w: 320, h: 42 }
], [
    { x: 500, y: 300, w: 24 },
    { x: 150, y: 580, w: 24 }
], "Kompakt obsidian pillələr və hər pillənin altında geniş qorunan zonalar."));

// 27. Yol 27: "Küləkli Dəhliz"
patterns.push(makeTrack(27, "Yol 27: Küləkli Dəhliz", [
    { x: 120, y: 1380, w: 280, h: 42 },
    { x: 460, y: 1380, w: 220, h: 42 },
    { x: 280, y: 1120, w: 380, h: 42 },
    { x: 100, y: 860,  w: 360, h: 42 },
    { x: 340, y: 580,  w: 340, h: 42 },
    { x: 120, y: 320,  w: 360, h: 42 },
    { x: 260, y: 160,  w: 280, h: 42 }
], [
    { x: 220, y: 220, w: 24 },
    { x: 600, y: 440, w: 24 }
], "Sağ və sol kənarlardan növbə ilə asan dövrə vurma imkanı."));

// 28. Yol 28: "Sakit Mərkəz və Yan Axınlar"
patterns.push(makeTrack(28, "Yol 28: Sakit Mərkəz və Yan Axınlar", [
    { x: 60,  y: 1360, w: 240, h: 42 },
    { x: 500, y: 1360, w: 240, h: 42 },
    { x: 250, y: 1100, w: 300, h: 42 },
    { x: 60,  y: 840,  w: 240, h: 42 },
    { x: 500, y: 840,  w: 240, h: 42 },
    { x: 220, y: 560,  w: 360, h: 42 },
    { x: 260, y: 240,  w: 280, h: 42 }
], [
    { x: 75,  y: 200, w: 24 },
    { x: 685, y: 200, w: 24 }
], "Mərkəz tamamilə sakit və təhlükəsizdir; lavalar kənar divarlara axıb gedir."));

// 29. Yol 29: "Magma Kaskad Sirki"
patterns.push(makeTrack(29, "Yol 29: Magma Kaskad Sirki", [
    { x: 120, y: 1380, w: 240, h: 42 },
    { x: 440, y: 1380, w: 240, h: 42 },
    { x: 260, y: 1140, w: 280, h: 42 },
    { x: 80,  y: 880,  w: 280, h: 42 },
    { x: 440, y: 880,  w: 280, h: 42 },
    { x: 220, y: 600,  w: 360, h: 42 },
    { x: 100, y: 340,  w: 260, h: 42 },
    { x: 440, y: 340,  w: 260, h: 42 },
    { x: 260, y: 160,  w: 280, h: 42 }
], [
    { x: 160, y: 240, w: 24 },
    { x: 610, y: 240, w: 24 }
], "Çoxlu yön dəyişdirən kaskadlar, hər platformanın altında zəmanətli sığınacaq dəhlizi."));

// 30. Yol 30: "Usta Keçidi (Final Test)"
patterns.push(makeTrack(30, "Yol 30: Usta Keçidi (Final Test)", [
    { x: 80,  y: 1420, w: 260, h: 42 },
    { x: 460, y: 1420, w: 260, h: 42 },
    { x: 240, y: 1180, w: 320, h: 42 },
    { x: 80,  y: 920,  w: 280, h: 42 },
    { x: 440, y: 920,  w: 280, h: 42 },
    { x: 180, y: 640,  w: 440, h: 42 },
    { x: 100, y: 380,  w: 260, h: 42 },
    { x: 440, y: 380,  w: 260, h: 42 },
    { x: 250, y: 180,  w: 300, h: 42 }
], [
    { x: 140, y: 220, w: 24 },
    { x: 620, y: 220, w: 24 }
], "Bütün kaskad elementlərinin zərif, estetik və 100% keçiləbilən vəhdəti."));

// Qovluqları yarat
const dataDir = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
const jsDataDir = path.join(__dirname, 'public', 'js', 'data');
if (!fs.existsSync(jsDataDir)) {
    fs.mkdirSync(jsDataDir, { recursive: true });
}

// 1. JSON faylı kimi yaz
const jsonPath = path.join(dataDir, 'floor_patterns.json');
const payload = {
    totalTracks: patterns.length,
    description: "Floor Escape 30 ədəd sınaq yolu. Hər qat cari yola uyğundur: (floor - 1) % 30 + 1.",
    tracks: patterns
};
fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
console.log('✅ public/data/floor_patterns.json uğurla yaradıldı! Cəmi yollar:', patterns.length);

// 2. JS skripti kimi də yaz (CORS / offline rejimdə dərhal qüsursuz işləməsi üçün)
const jsPath = path.join(jsDataDir, 'floor_patterns.js');
const jsContent = `// Avtomatik generasiya edilmiş Floor Escape 30 Sınaq Yolu
window.FLOOR_PATTERNS = ${JSON.stringify(payload, null, 2)};
`;
fs.writeFileSync(jsPath, jsContent, 'utf8');
console.log('✅ public/js/data/floor_patterns.js uğurla yaradıldı!');

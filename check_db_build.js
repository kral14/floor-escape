const net = require('net');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n' + '='.repeat(72));
console.log(' [BUILD MƏRHƏLƏSİ] POSTGRESQL VERİLƏNLƏR BAZASI YOXLANIŞI BAŞLADILIR...');
console.log('='.repeat(72));

// Mühit dəyişəni YALNIZ və YALNIZ sistemin özündən (process.env) oxunur.
// Heç bir fayldan (.env) oxunmur, kodun içinə yazıla bilməz!
const dbUrl = (process.env.DATABASE_URL || '').trim();

function abortBuild(errorMsg) {
    console.error('\n' + '!'.repeat(72));
    console.error(' [BUILD UĞURSUZ OLDU / BUILD FAILED]');
    console.error(' [KRİTİK XƏTA] ' + errorMsg);
    console.error(' Layihə mərkəzi PostgreSQL bazası olmadan BUILD OLUNA BİLMƏZ.');
    console.error(' Lokal yaddaşdan (SQLite və ya lokal JSON) istifadə tam qadağandır.');
    console.error(' Zəhmət olmasa deploy/build mühitində DATABASE_URL mühit dəyişənini təyin edin.');
    console.error(' Nümunə: DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    console.error('!'.repeat(72) + '\n');
    process.exit(1);
}

// 1. Mühit dəyişəninin mövcudluğu
if (!dbUrl || (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))) {
    abortBuild("'DATABASE_URL' MÜHİT DƏYİŞƏNİ TƏYİN EDİLMƏYİB VƏ YA POSTGRESQL DEYİL!");
}

// 2. Host və Port parsing
let host = '';
let port = 5432;
try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
    port = parseInt(parsed.port || '5432', 10);
} catch (e) {
    abortBuild("DATABASE_URL formatı düzgün deyil: " + e.message);
}

console.log(` [*] PostgreSQL serverinə (${host}:${port}) qoşulma yoxlanılır...`);

// 3. PostgreSQL əlaqəsini yoxlamaq
// A) İlk öncə psycopg2 / python vasitəsilə sorğu atmağa cəhd edirik
let fullPgChecked = false;
for (const pyCmd of ['python3', 'python']) {
    try {
        execSync(`${pyCmd} -c "import psycopg2; c=psycopg2.connect('${dbUrl}', connect_timeout=5); cur=c.cursor(); cur.execute('SELECT 1;'); c.close()"`, { stdio: 'pipe' });
        fullPgChecked = true;
        console.log(' [✓] Python psycopg2 ilə PostgreSQL sorğusu (SELECT 1) uğurla icra olundu!');
        break;
    } catch (e) {
        // Python və ya psycopg2 tapılmaya bilər (məsələn node-alpine konteynerində)
    }
}

// B) Əgər python yoxdursa və ya xəta veribsə, Node.js TCP Socket ilə bazanın portunu yoxlayırıq
function checkTcpPort(host, port, timeoutMs = 6000) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        let isResolved = false;

        socket.setTimeout(timeoutMs);

        socket.on('connect', () => {
            isResolved = true;
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            isResolved = true;
            socket.destroy();
            reject(new Error(`PostgreSQL serveri (${host}:${port}) cavab vermədi (Timeout ${timeoutMs}ms)`));
        });

        socket.on('error', (err) => {
            isResolved = true;
            socket.destroy();
            reject(err);
        });

        socket.connect(port, host);
    });
}

(async () => {
    try {
        await checkTcpPort(host, port);
        console.log(` [✓] PostgreSQL serveri (${host}:${port}) aktivdir və əlaqə quruldu!`);
        console.log(' [✓] Build mərhələsi uğurla davam edir.');
        console.log('='.repeat(72) + '\n');
        process.exit(0);
    } catch (err) {
        abortBuild(`PostgreSQL bazasına qoşulmaq mümkün olmadı: ${err.message}`);
    }
})();

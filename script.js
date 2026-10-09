// ==========================================================================
// AL-QUR'AN DIGITAL & KHAZANAH ISLAMI
// Integrasi: equran.id (Surat), ournoor.com (Doa), Aladhan (Sholat & Kiblat), Berita Islam
// ==========================================================================

// Global State
let dataSemuaSurat = [];
let dataSemuaDoa = [];
let dataSemuaBerita = [];
let countdownTimerInterval = null;
let waktuSholatData = null;
let currentLatitude = -6.2088;
let currentLongitude = 106.8456;
let currentNamaKota = "Jakarta";
let kiblaAngle = 295.15;
let sensorAktif = false;
let surahFilterType = 'all';
let quranViewMode = 'surah'; // 'surah' | 'juz'
let selectedJuzFilter = 'all'; // filter Juz dropdown di mode surah ('all' atau 1..30)
let selectedJuzGroupFilter = 'all'; // filter chip di mode juz ('all', '1-10', '11-20', '21-30', '30')
let currentJuzData = null;
let currentJuzSuratAktif = null;


// ==========================================================================
// SISTEM RIWAYAT BACAAN (LocalStorage)
// ==========================================================================
const RIWAYAT_KEY = 'quran_riwayat_bacaan';
const RIWAYAT_MAX = 10;

function getRiwayat() {
    try {
        return JSON.parse(localStorage.getItem(RIWAYAT_KEY) || '[]');
    } catch { return []; }
}

function addToRiwayat(surat) {
    let riwayat = getRiwayat();
    // Hapus jika sudah ada (hindari duplikat)
    riwayat = riwayat.filter(r => r.nomor !== surat.nomor);
    // Tambahkan di awal
    riwayat.unshift({
        nomor: surat.nomor,
        namaLatin: surat.namaLatin,
        nama: surat.nama,
        arti: surat.arti,
        jumlahAyat: surat.jumlahAyat,
        tempatTurun: surat.tempatTurun,
        waktu: new Date().toISOString()
    });
    // Batasi maksimal
    if (riwayat.length > RIWAYAT_MAX) riwayat = riwayat.slice(0, RIWAYAT_MAX);
    localStorage.setItem(RIWAYAT_KEY, JSON.stringify(riwayat));
    renderRiwayat();
}

function hapusRiwayat() {
    localStorage.removeItem(RIWAYAT_KEY);
    renderRiwayat();
    tampilkanToast('Riwayat bacaan dihapus.');
}

function renderRiwayat() {
    const container = document.getElementById('riwayat-container');
    const emptyState = document.getElementById('riwayat-empty');
    const countEl = document.getElementById('riwayat-count');
    if (!container) return;

    const riwayat = getRiwayat();

    if (countEl) countEl.textContent = riwayat.length;

    if (riwayat.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = riwayat.map((s, idx) => {
        const isMakkiyyah = s.tempatTurun && (s.tempatTurun.toLowerCase() === 'mekah' || s.tempatTurun.toLowerCase() === 'makkiyyah');
        const badgeColor = isMakkiyyah ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700';
        const timeStr = s.waktu ? formatWaktuRiwayat(s.waktu) : '';
        return `
        <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer" onclick="bacaSurat(${s.nomor})">
            <div class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-xs shadow">${s.nomor}</div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                    <span class="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition truncate">${s.namaLatin}</span>
                    <span class="text-emerald-600 font-serif-arabic text-base leading-none">${s.nama}</span>
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs text-slate-400">${s.jumlahAyat} Ayat</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badgeColor}">${s.tempatTurun}</span>
                    ${timeStr ? `<span class="text-[10px] text-slate-400 ml-auto">${timeStr}</span>` : ''}
                </div>
            </div>
            <svg class="w-4 h-4 text-slate-300 group-hover:text-emerald-500 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </div>`;
    }).join('');
}

function formatWaktuRiwayat(isoStr) {
    try {
        const d = new Date(isoStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays === 1) return 'Kemarin';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch { return ''; }
}

// Preset Koordinat Kota-Kota Indonesia Lengkap
const DAFTAR_KOTA = {
    // Maluku & Maluku Utara
    "Ternate": { lat: 0.7893, lng: 127.3872, nama: "Kota Ternate (Maluku Utara)" },
    "Sofifi": { lat: 0.7289, lng: 127.5756, nama: "Sofifi (Ibukota Maluku Utara)" },
    "Tidore": { lat: 0.6791, lng: 127.4367, nama: "Tidore Kepulauan (Maluku Utara)" },
    "Tobelo": { lat: 1.7284, lng: 128.0094, nama: "Tobelo (Halmahera Utara)" },
    "Labuha": { lat: -0.6403, lng: 127.4870, nama: "Labuha (Halmahera Selatan)" },
    "Sanana": { lat: -2.0500, lng: 125.9833, nama: "Sanana (Kepulauan Sula)" },
    "Ambon": { lat: -3.6547, lng: 128.1906, nama: "Kota Ambon (Maluku)" },
    "Tual": { lat: -5.6294, lng: 132.7483, nama: "Kota Tual (Maluku)" },

    // DKI Jakarta & Jawa
    "Jakarta": { lat: -6.2088, lng: 106.8456, nama: "DKI Jakarta" },
    "Surabaya": { lat: -7.2575, lng: 112.7521, nama: "Kota Surabaya" },
    "Bandung": { lat: -6.9175, lng: 107.6191, nama: "Kota Bandung" },
    "Semarang": { lat: -6.9667, lng: 110.4167, nama: "Kota Semarang" },
    "Yogyakarta": { lat: -7.7956, lng: 110.3695, nama: "DI Yogyakarta" },
    "Solo": { lat: -7.5755, lng: 110.8243, nama: "Surakarta / Solo" },
    "Malang": { lat: -7.9666, lng: 112.6326, nama: "Kota Malang" },
    "Bogor": { lat: -6.5971, lng: 106.8060, nama: "Kota Bogor" },
    "Bekasi": { lat: -6.2383, lng: 106.9756, nama: "Kota Bekasi" },
    "Tangerang": { lat: -6.1783, lng: 106.6319, nama: "Kota Tangerang" },
    "Depok": { lat: -6.4025, lng: 106.7942, nama: "Kota Depok" },
    "Serang": { lat: -6.1104, lng: 106.1640, nama: "Kota Serang (Banten)" },
    "Cirebon": { lat: -6.7320, lng: 108.5523, nama: "Kota Cirebon" },

    // Sumatera
    "Medan": { lat: 3.5952, lng: 98.6722, nama: "Kota Medan (Sumut)" },
    "Palembang": { lat: -2.9761, lng: 104.7754, nama: "Kota Palembang (Sumsel)" },
    "Padang": { lat: -0.9471, lng: 100.4172, nama: "Kota Padang (Sumbar)" },
    "Banda Aceh": { lat: 5.5483, lng: 95.3238, nama: "Banda Aceh" },
    "Pekanbaru": { lat: 0.5071, lng: 101.4478, nama: "Kota Pekanbaru (Riau)" },
    "Batam": { lat: 1.1301, lng: 104.0529, nama: "Kota Batam (Kepri)" },
    "Bandar Lampung": { lat: -5.4500, lng: 105.2667, nama: "Bandar Lampung" },
    "Jambi": { lat: -1.6101, lng: 103.6131, nama: "Kota Jambi" },
    "Bengkulu": { lat: -3.7928, lng: 102.2608, nama: "Kota Bengkulu" },
    "Pangkalpinang": { lat: -2.1333, lng: 106.1167, nama: "Pangkalpinang (Babel)" },

    // Sulawesi
    "Makassar": { lat: -5.1477, lng: 119.4327, nama: "Kota Makassar (Sulsel)" },
    "Manado": { lat: 1.4748, lng: 124.8428, nama: "Kota Manado (Sulut)" },
    "Palu": { lat: -0.9003, lng: 119.8779, nama: "Kota Palu (Sulteng)" },
    "Kendari": { lat: -3.9985, lng: 122.5126, nama: "Kota Kendari (Sultra)" },
    "Gorontalo": { lat: 0.5435, lng: 123.0568, nama: "Kota Gorontalo" },
    "Mamuju": { lat: -2.6770, lng: 118.8895, nama: "Kota Mamuju (Sulbar)" },

    // Kalimantan
    "Banjarmasin": { lat: -3.3194, lng: 114.5908, nama: "Banjarmasin (Kalsel)" },
    "Balikpapan": { lat: -1.2379, lng: 116.8529, nama: "Balikpapan (Kaltim)" },
    "Samarinda": { lat: -0.5022, lng: 117.1536, nama: "Samarinda (Kaltim)" },
    "Pontianak": { lat: -0.0263, lng: 109.3425, nama: "Pontianak (Kalbar)" },
    "Palangkaraya": { lat: -2.2161, lng: 113.9139, nama: "Palangkaraya (Kalteng)" },
    "Tarakan": { lat: 3.3273, lng: 117.5786, nama: "Tarakan (Kaltara)" },

    // Bali & Nusa Tenggara
    "Denpasar": { lat: -8.6705, lng: 115.2126, nama: "Kota Denpasar (Bali)" },
    "Mataram": { lat: -8.5833, lng: 116.1167, nama: "Kota Mataram (Lombok / NTB)" },
    "Kupang": { lat: -10.1772, lng: 123.6070, nama: "Kota Kupang (NTT)" },

    // Papua
    "Jayapura": { lat: -2.5916, lng: 140.6690, nama: "Kota Jayapura (Papua)" },
    "Sorong": { lat: -0.8762, lng: 131.2558, nama: "Kota Sorong (Papua Barat Daya)" },
    "Manokwari": { lat: -0.8615, lng: 134.0620, nama: "Manokwari (Papua Barat)" },
    "Merauke": { lat: -8.4991, lng: 140.4011, nama: "Merauke (Papua Selatan)" }
};

// ==========================================================================
// 1. SISTEM NAVIGASI TAB
// ==========================================================================
function switchTab(tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    const targetContent = document.getElementById(`tab-content-${tabId}`);
    if (targetContent) {
        targetContent.classList.add('active');
    }

    const desktopBtns = document.querySelectorAll('.nav-tab-item');
    desktopBtns.forEach(btn => {
        btn.classList.remove('active', 'bg-emerald-600', 'text-white', 'shadow-md');
        btn.classList.add('text-emerald-200');
    });

    const activeDesktopBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeDesktopBtn) {
        activeDesktopBtn.classList.add('active', 'bg-emerald-600', 'text-white', 'shadow-md');
        activeDesktopBtn.classList.remove('text-emerald-200');
    }

    const mobBtns = document.querySelectorAll('nav.md\\:hidden button');
    mobBtns.forEach(btn => {
        btn.classList.remove('text-emerald-700', 'font-semibold');
        btn.classList.add('text-slate-500', 'font-medium');
    });

    const activeMobBtn = document.getElementById(`mob-btn-${tabId}`);
    if (activeMobBtn) {
        activeMobBtn.classList.add('text-emerald-700', 'font-semibold');
        activeMobBtn.classList.remove('text-slate-500', 'font-medium');
    }

    if (tabId === 'doa' && dataSemuaDoa.length === 0) {
        ambilDataDoa();
    } else if (tabId === 'berita' && dataSemuaBerita.length === 0) {
        muatBeritaIslam();
    } else if (tabId === 'kiblat') {
        updateTampilanKiblat(currentLatitude, currentLongitude, currentNamaKota);
    }
}

// ==========================================================================
// 2. JAM REALTIME & HEADER STATS
// ==========================================================================
function initHeaderClock() {
    function updateClock() {
        const now = new Date();
        const jam = String(now.getHours()).padStart(2, '0');
        const menit = String(now.getMinutes()).padStart(2, '0');
        const detik = String(now.getSeconds()).padStart(2, '0');
        const timeEl = document.getElementById('header-time-live');
        if (timeEl) {
            timeEl.textContent = `${jam}:${menit}:${detik} WIB`;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// ==========================================================================
// 3. FITUR AL-QUR'AN DIGITAL & 30 JUZ
// ==========================================================================

// Metadata Lengkap 30 Juz Al-Qur'an (Standar Kemenag RI)
const DATA_30_JUZ = [
    {
        nomor: 1,
        nama: "Alif Lām Mīm",
        namaArab: "الٓمٓ",
        mulai: { surat: 1, namaSurat: "Al-Fatihah", ayat: 1 },
        sampai: { surat: 2, namaSurat: "Al-Baqarah", ayat: 141 },
        suratIds: [1, 2],
        keterangan: "Meliputi surat Al-Fatihah (1-7) dan awal Al-Baqarah (1-141)."
    },
    {
        nomor: 2,
        nama: "Sayaqūlu",
        namaArab: "سَيَقُولُ",
        mulai: { surat: 2, namaSurat: "Al-Baqarah", ayat: 142 },
        sampai: { surat: 2, namaSurat: "Al-Baqarah", ayat: 252 },
        suratIds: [2],
        keterangan: "Meliputi surat Al-Baqarah (142-252): pemindahan kiblat, puasa, haji & thalut."
    },
    {
        nomor: 3,
        nama: "Tilkar-Rusul",
        namaArab: "تِلْكَ الرُّسُلُ",
        mulai: { surat: 2, namaSurat: "Al-Baqarah", ayat: 253 },
        sampai: { surat: 3, namaSurat: "Ali 'Imran", ayat: 92 },
        suratIds: [2, 3],
        keterangan: "Meliputi akhir Al-Baqarah (termasuk Ayat Kursi) & awal Ali 'Imran (1-92)."
    },
    {
        nomor: 4,
        nama: "Lan Tanālū",
        namaArab: "لَنْ تَنَالُوا",
        mulai: { surat: 3, namaSurat: "Ali 'Imran", ayat: 93 },
        sampai: { surat: 4, namaSurat: "An-Nisa'", ayat: 23 },
        suratIds: [3, 4],
        keterangan: "Meliputi kelanjutan Ali 'Imran (93-200) & awal An-Nisa' (1-23)."
    },
    {
        nomor: 5,
        nama: "Wal-Muhsanāt",
        namaArab: "وَالْمُحْصَنَاتُ",
        mulai: { surat: 4, namaSurat: "An-Nisa'", ayat: 24 },
        sampai: { surat: 4, namaSurat: "An-Nisa'", ayat: 147 },
        suratIds: [4],
        keterangan: "Meliputi surat An-Nisa' ayat 24 hingga 147 (hukum pernikahan, keluarga & keadilan)."
    },
    {
        nomor: 6,
        nama: "Lā Yuhibbullāh",
        namaArab: "لَا يُحِبُّ اللَّهُ",
        mulai: { surat: 4, namaSurat: "An-Nisa'", ayat: 148 },
        sampai: { surat: 5, namaSurat: "Al-Ma'idah", ayat: 81 },
        suratIds: [4, 5],
        keterangan: "Meliputi akhir An-Nisa' (148-176) & bagian awal Al-Ma'idah (1-81)."
    },
    {
        nomor: 7,
        nama: "Wa Idzā Sami'ū",
        namaArab: "وَإِذَا سَمِعُوا",
        mulai: { surat: 5, namaSurat: "Al-Ma'idah", ayat: 82 },
        sampai: { surat: 6, namaSurat: "Al-An'am", ayat: 110 },
        suratIds: [5, 6],
        keterangan: "Meliputi akhir Al-Ma'idah (82-120) & paruh pertama Al-An'am (1-110)."
    },
    {
        nomor: 8,
        nama: "Wa Law Annanā",
        namaArab: "وَلَوْ أَنَّنَا",
        mulai: { surat: 6, namaSurat: "Al-An'am", ayat: 111 },
        sampai: { surat: 7, namaSurat: "Al-A'raf", ayat: 87 },
        suratIds: [6, 7],
        keterangan: "Meliputi akhir Al-An'am (111-165) & paruh pertama Al-A'raf (1-87)."
    },
    {
        nomor: 9,
        nama: "Qālal-Mala'u",
        namaArab: "قَالَ الْمَلَأُ",
        mulai: { surat: 7, namaSurat: "Al-A'raf", ayat: 88 },
        sampai: { surat: 8, namaSurat: "Al-Anfal", ayat: 40 },
        suratIds: [7, 8],
        keterangan: "Meliputi kelanjutan kisah nabi di Al-A'raf & paruh pertama Al-Anfal (1-40)."
    },
    {
        nomor: 10,
        nama: "Wa'lamū",
        namaArab: "وَاعْلَمُوا",
        mulai: { surat: 8, namaSurat: "Al-Anfal", ayat: 41 },
        sampai: { surat: 9, namaSurat: "At-Taubah", ayat: 92 },
        suratIds: [8, 9],
        keterangan: "Meliputi akhir Al-Anfal (41-75) & paruh pertama At-Taubah (1-92)."
    },
    {
        nomor: 11,
        nama: "Ya'tadhirūna",
        namaArab: "يَعْتَذِرُونَ",
        mulai: { surat: 9, namaSurat: "At-Taubah", ayat: 93 },
        sampai: { surat: 11, namaSurat: "Hud", ayat: 5 },
        suratIds: [9, 10, 11],
        keterangan: "Meliputi akhir At-Taubah (93-129), seluruh Yunus (1-109), & pembuka Hud (1-5)."
    },
    {
        nomor: 12,
        nama: "Wa标志 Min Dābbah",
        namaArab: "وَمَا مِنْ دَابَّةٍ",
        mulai: { surat: 11, namaSurat: "Hud", ayat: 6 },
        sampai: { surat: 12, namaSurat: "Yusuf", ayat: 52 },
        suratIds: [11, 12],
        keterangan: "Meliputi kelanjutan Hud (6-123) & paruh pertama kisah Nabi Yusuf (1-52)."
    },
    {
        nomor: 13,
        nama: "Wa Mā Ubarri'u",
        namaArab: "وَمَا أُبَرِّئُ",
        mulai: { surat: 12, namaSurat: "Yusuf", ayat: 53 },
        sampai: { surat: 14, namaSurat: "Ibrahim", ayat: 52 },
        suratIds: [12, 13, 14],
        keterangan: "Meliputi akhir Yusuf (53-111), seluruh Ar-Ra'd (1-43), & seluruh Ibrahim (1-52)."
    },
    {
        nomor: 14,
        nama: "Rubamā",
        namaArab: "رُبَمَا",
        mulai: { surat: 15, namaSurat: "Al-Hijr", ayat: 1 },
        sampai: { surat: 16, namaSurat: "An-Nahl", ayat: 128 },
        suratIds: [15, 16],
        keterangan: "Meliputi seluruh surat Al-Hijr (1-99) & seluruh surat An-Nahl (1-128)."
    },
    {
        nomor: 15,
        nama: "Subhānalladzī",
        namaArab: "سُبْحَانَ الَّذِي",
        mulai: { surat: 17, namaSurat: "Al-Isra'", ayat: 1 },
        sampai: { surat: 18, namaSurat: "Al-Kahf", ayat: 74 },
        suratIds: [17, 18],
        keterangan: "Meliputi seluruh surat Al-Isra' (1-111) & paruh pertama Al-Kahf (1-74)."
    },
    {
        nomor: 16,
        nama: "Qāla Alam",
        namaArab: "قَالَ أَلَمْ",
        mulai: { surat: 18, namaSurat: "Al-Kahf", ayat: 75 },
        sampai: { surat: 20, namaSurat: "Ta-Ha", ayat: 135 },
        suratIds: [18, 19, 20],
        keterangan: "Meliputi akhir Al-Kahf (75-110), seluruh Maryam (1-98), & seluruh Ta-Ha (1-135)."
    },
    {
        nomor: 17,
        nama: "Iqtaraba lin-Nās",
        namaArab: "اقْتَرَبَ لِلنَّاسِ",
        mulai: { surat: 21, namaSurat: "Al-Anbiya'", ayat: 1 },
        sampai: { surat: 22, namaSurat: "Al-Hajj", ayat: 78 },
        suratIds: [21, 22],
        keterangan: "Meliputi seluruh surat Al-Anbiya' (1-112) & seluruh surat Al-Hajj (1-78)."
    },
    {
        nomor: 18,
        nama: "Qad Aflaha",
        namaArab: "قَدْ أَفْلَحَ",
        mulai: { surat: 23, namaSurat: "Al-Mu'minun", ayat: 1 },
        sampai: { surat: 25, namaSurat: "Al-Furqan", ayat: 20 },
        suratIds: [23, 24, 25],
        keterangan: "Meliputi seluruh Al-Mu'minun (1-118), An-Nur (1-64), & awal Al-Furqan (1-20)."
    },
    {
        nomor: 19,
        nama: "Wa Qālalladzīna",
        namaArab: "وَقَالَ الَّذِينَ",
        mulai: { surat: 25, namaSurat: "Al-Furqan", ayat: 21 },
        sampai: { surat: 27, namaSurat: "An-Naml", ayat: 55 },
        suratIds: [25, 26, 27],
        keterangan: "Meliputi kelanjutan Al-Furqan (21-77), Asy-Syu'ara' (1-227), & paruh awal An-Naml (1-55)."
    },
    {
        nomor: 20,
        nama: "Am Man Khalaqa",
        namaArab: "أَمَّنْ خَلَقَ",
        mulai: { surat: 27, namaSurat: "An-Naml", ayat: 56 },
        sampai: { surat: 29, namaSurat: "Al-'Ankabut", ayat: 45 },
        suratIds: [27, 28, 29],
        keterangan: "Meliputi akhir An-Naml (56-93), seluruh Al-Qasas (1-88), & paruh awal Al-'Ankabut (1-45)."
    },
    {
        nomor: 21,
        nama: "Utlu Mā Ūhiya",
        namaArab: "اتْلُ مَا أُوحِيَ",
        mulai: { surat: 29, namaSurat: "Al-'Ankabut", ayat: 46 },
        sampai: { surat: 33, namaSurat: "Al-Ahzab", ayat: 30 },
        suratIds: [29, 30, 31, 32, 33],
        keterangan: "Meliputi akhir Al-'Ankabut, Ar-Rum, Luqman, As-Sajdah, & bagian awal Al-Ahzab (1-30)."
    },
    {
        nomor: 22,
        nama: "Wa Man Yaqnut",
        namaArab: "وَمَنْ يَقْنُتْ",
        mulai: { surat: 33, namaSurat: "Al-Ahzab", ayat: 31 },
        sampai: { surat: 36, namaSurat: "Yasin", ayat: 27 },
        suratIds: [33, 34, 35, 36],
        keterangan: "Meliputi akhir Al-Ahzab (31-73), Saba' (1-54), Fatir (1-45), & pembuka Yasin (1-27)."
    },
    {
        nomor: 23,
        nama: "Wa Mā Liya",
        namaArab: "وَمَا لِيَ",
        mulai: { surat: 36, namaSurat: "Yasin", ayat: 28 },
        sampai: { surat: 39, namaSurat: "Az-Zumar", ayat: 31 },
        suratIds: [36, 37, 38, 39],
        keterangan: "Meliputi kelanjutan Yasin (28-83), seluruh As-Saffat (1-182), Sad (1-88), & awal Az-Zumar (1-31)."
    },
    {
        nomor: 24,
        nama: "Fa Man Azhlamu",
        namaArab: "فَمَنْ أَظْلَمُ",
        mulai: { surat: 39, namaSurat: "Az-Zumar", ayat: 32 },
        sampai: { surat: 41, namaSurat: "Fussilat", ayat: 46 },
        suratIds: [39, 40, 41],
        keterangan: "Meliputi kelanjutan Az-Zumar (32-75), seluruh Ghafir (1-85), & paruh awal Fussilat (1-46)."
    },
    {
        nomor: 25,
        nama: "Ilaihi Yuraddu",
        namaArab: "إِلَيْهِ يُرَدُّ",
        mulai: { surat: 41, namaSurat: "Fussilat", ayat: 47 },
        sampai: { surat: 45, namaSurat: "Al-Jasiyah", ayat: 37 },
        suratIds: [41, 42, 43, 44, 45],
        keterangan: "Meliputi akhir Fussilat, Asy-Syura, Az-Zukhruf, Ad-Dukhan, & seluruh Al-Jasiyah."
    },
    {
        nomor: 26,
        nama: "Hā Mīm",
        namaArab: "حم",
        mulai: { surat: 46, namaSurat: "Al-Ahqaf", ayat: 1 },
        sampai: { surat: 51, namaSurat: "Az-Zariyat", ayat: 30 },
        suratIds: [46, 47, 48, 49, 50, 51],
        keterangan: "Meliputi Al-Ahqaf, Muhammad, Al-Fath, Al-Hujurat, Qaf, & paruh awal Az-Zariyat (1-30)."
    },
    {
        nomor: 27,
        nama: "Qāla Fa标志 Khatbukum",
        namaArab: "قَالَ فَمَا خَطْبُكُمْ",
        mulai: { surat: 51, namaSurat: "Az-Zariyat", ayat: 31 },
        sampai: { surat: 57, namaSurat: "Al-Hadid", ayat: 29 },
        suratIds: [51, 52, 53, 54, 55, 56, 57],
        keterangan: "Meliputi akhir Az-Zariyat, At-Tur, An-Najm, Al-Qamar, Ar-Rahman, Al-Waqi'ah, & Al-Hadid."
    },
    {
        nomor: 28,
        nama: "Qad Sami'allāh",
        namaArab: "قَدْ سَمِعَ اللَّهُ",
        mulai: { surat: 58, namaSurat: "Al-Mujadilah", ayat: 1 },
        sampai: { surat: 66, namaSurat: "At-Tahrim", ayat: 12 },
        suratIds: [58, 59, 60, 61, 62, 63, 64, 65, 66],
        keterangan: "Meliputi 9 surat madaniyyah: Al-Mujadilah s.d. At-Tahrim."
    },
    {
        nomor: 29,
        nama: "Tabārakalladzī",
        namaArab: "تَبَارَكَ الَّذِي",
        mulai: { surat: 67, namaSurat: "Al-Mulk", ayat: 1 },
        sampai: { surat: 77, namaSurat: "Al-Mursalat", ayat: 50 },
        suratIds: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
        keterangan: "Juz Tabarak meliputi 11 surat: Al-Mulk s.d. Al-Mursalat."
    },
    {
        nomor: 30,
        nama: "Juz 'Amma ('Amma Yatasa'alūn)",
        namaArab: "عَمَّ يَتَسَاءَلُونَ",
        mulai: { surat: 78, namaSurat: "An-Naba'", ayat: 1 },
        sampai: { surat: 114, namaSurat: "An-Nas", ayat: 6 },
        suratIds: Array.from({ length: 37 }, (_, i) => 78 + i),
        keterangan: "Juz ke-30 (Juz 'Amma) memuat 37 surat pendek pilihan, dari An-Naba' hingga An-Nas."
    }
];

// Helper: Menentukan juz untuk nomor surat tertentu
function getJuzForSurah(suratNomor) {
    const matchingJuz = DATA_30_JUZ.filter(j => j.suratIds.includes(suratNomor));
    if (matchingJuz.length === 0) return { numbers: [], text: 'Juz -' };
    const numbers = matchingJuz.map(j => j.nomor);
    const text = numbers.length === 1 
        ? `Juz ${numbers[0]}` 
        : `Juz ${numbers[0]} - ${numbers[numbers.length - 1]}`;
    return { numbers, text };
}

// Inisialisasi pengambilan data Surat dari API
async function ambilDataSurat() {
    const container = document.getElementById('wisata-container');
    const loading = document.getElementById('loading');

    try {
        const respon = await fetch('https://equran.id/api/v2/surat');
        const hasil = await respon.json();

        dataSemuaSurat = hasil.data || [];
        loading.style.display = 'none';

        setupJuzDropdown();
        tampilkanDaftarSurat(dataSemuaSurat);
        renderDaftarJuz(DATA_30_JUZ);
        setupSearchSurah();
    } catch (error) {
        console.error("Terjadi kesalahan memuat surat:", error);
        loading.innerHTML = `
            <div class="text-center py-10">
                <p class="text-red-500 font-bold mb-3">Gagal memuat data surat Al-Qur'an.</p>
                <button onclick="ambilDataSurat()" class="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">
                    Coba Lagi
                </button>
            </div>
        `;
    }
}

// Toggle Mode: Berdasarkan Surat (114) vs Berdasarkan Juz (30)
function switchQuranViewMode(mode) {
    quranViewMode = mode;
    const btnSurah = document.getElementById('btn-mode-surah');
    const btnJuz = document.getElementById('btn-mode-juz');
    const filterSurah = document.getElementById('filter-wrapper-surah');
    const filterJuz = document.getElementById('filter-wrapper-juz');
    const surahContainer = document.getElementById('wisata-container');
    const juzContainer = document.getElementById('juz-container');
    const guideEl = document.getElementById('surah-count-guide');

    if (mode === 'surah') {
        if (btnSurah) {
            btnSurah.className = 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-600 text-white shadow';
        }
        if (btnJuz) {
            btnJuz.className = 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-200 hover:text-white transition-all';
        }
        if (filterSurah) filterSurah.classList.remove('hidden');
        if (filterJuz) filterJuz.classList.add('hidden');
        if (surahContainer) surahContainer.classList.remove('hidden');
        if (juzContainer) juzContainer.classList.add('hidden');
        if (guideEl) guideEl.textContent = 'Klik "Baca Surat" untuk mendengarkan audio murottal & tafsir ayat';
        filterSuratList();
    } else {
        if (btnSurah) {
            btnSurah.className = 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-200 hover:text-white transition-all';
        }
        if (btnJuz) {
            btnJuz.className = 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-600 text-white shadow';
        }
        if (filterSurah) filterSurah.classList.add('hidden');
        if (filterJuz) filterJuz.classList.remove('hidden');
        if (surahContainer) surahContainer.classList.add('hidden');
        if (juzContainer) juzContainer.classList.remove('hidden');
        if (guideEl) guideEl.textContent = 'Klik "Baca Juz" untuk membaca seluruh surat dalam juz beserta murottal';
        filterJuzList();
    }
}

// Setup dropdown list 30 Juz
function setupJuzDropdown() {
    const select = document.getElementById('filter-surah-juz');
    if (!select) return;

    let optionsHtml = '<option value="all">📖 Semua Juz (1 - 30)</option>';
    DATA_30_JUZ.forEach(juz => {
        optionsHtml += `<option value="${juz.nomor}">Juz ${juz.nomor} - ${juz.nama}</option>`;
    });
    select.innerHTML = optionsHtml;
}

function onSelectJuzFilter() {
    const select = document.getElementById('filter-surah-juz');
    if (!select) return;
    selectedJuzFilter = select.value;
    filterSuratList();
}

function filterJuzGroup(group) {
    selectedJuzGroupFilter = group;
    const chips = document.querySelectorAll('.filter-chip-juz');
    chips.forEach(c => {
        c.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm');
        c.classList.add('text-slate-600');
    });

    const activeChip = document.getElementById(`filter-juz-${group}`);
    if (activeChip) {
        activeChip.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');
        activeChip.classList.remove('text-slate-600');
    }

    filterJuzList();
}

// Filter daftar 30 Juz berdasarkan keyword pencarian dan kelompok juz
function filterJuzList() {
    const searchInput = document.getElementById('search-surah');
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const hasilFilter = DATA_30_JUZ.filter(juz => {
        // Filter grup juz
        let matchGroup = true;
        if (selectedJuzGroupFilter === '1-10') matchGroup = juz.nomor >= 1 && juz.nomor <= 10;
        else if (selectedJuzGroupFilter === '11-20') matchGroup = juz.nomor >= 11 && juz.nomor <= 20;
        else if (selectedJuzGroupFilter === '21-30') matchGroup = juz.nomor >= 21 && juz.nomor <= 30;
        else if (selectedJuzGroupFilter === '30') matchGroup = juz.nomor === 30;

        // Filter keyword
        let matchKeyword = true;
        if (keyword) {
            const numKeyword = keyword.replace(/juz/g, '').trim();
            const matchNumber = juz.nomor.toString() === numKeyword || `juz ${juz.nomor}`.includes(keyword);
            const matchName = juz.nama.toLowerCase().includes(keyword) || (juz.namaArab && juz.namaArab.includes(keyword));
            const matchKeterangan = juz.keterangan && juz.keterangan.toLowerCase().includes(keyword);

            // Cari apakah ada nama surat di dalam juz ini yang cocok
            const matchSurat = dataSemuaSurat.some(s => 
                juz.suratIds.includes(s.nomor) && (
                    s.namaLatin.toLowerCase().includes(keyword) ||
                    s.arti.toLowerCase().includes(keyword) ||
                    s.nomor.toString() === keyword
                )
            );

            matchKeyword = matchNumber || matchName || matchKeterangan || matchSurat;
        }

        return matchGroup && matchKeyword;
    });

    renderDaftarJuz(hasilFilter);
}

// Render 30 kartu Juz ke dalam grid container
function renderDaftarJuz(daftarJuz) {
    const container = document.getElementById('juz-container');
    const countInfo = document.getElementById('surah-count-info');

    if (!container) return;

    if (countInfo) {
        countInfo.textContent = `Menampilkan ${daftarJuz.length} dari ${DATA_30_JUZ.length} Juz Al-Qur'an`;
    }

    if (daftarJuz.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
                <div class="w-16 h-16 mx-auto mb-3 text-slate-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <h3 class="text-lg font-bold text-slate-700">Juz Tidak Ditemukan</h3>
                <p class="text-sm text-slate-500 mt-1">Coba gunakan nomor juz (1 - 30) atau nama surat.</p>
                <button onclick="resetSearchSurah()" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
                    Tampilkan Semua Juz
                </button>
            </div>
        `;
        return;
    }

    let cardsHtml = '';
    daftarJuz.forEach(juz => {
        const surahInJuz = dataSemuaSurat.filter(s => juz.suratIds.includes(s.nomor));
        const surahTagsHtml = surahInJuz.map(s => `
            <button onclick="event.stopPropagation(); bacaSurat(${s.nomor})" class="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 transition font-medium flex items-center gap-1 group/btn" title="Buka QS. ${s.namaLatin}">
                <span class="text-[10px] text-slate-400 group-hover/btn:text-emerald-700 font-bold">${s.nomor}.</span>
                <span>${s.namaLatin}</span>
            </button>
        `).join('');

        cardsHtml += `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 hover:border-emerald-300 flex flex-col justify-between group transform hover:-translate-y-1">
                <div>
                    <!-- Header Kartu Juz -->
                    <div class="flex justify-between items-start mb-4">
                        <div class="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white font-extrabold w-14 h-12 flex flex-col items-center justify-center rounded-2xl shadow-md flex-shrink-0">
                            <span class="text-[9px] uppercase tracking-wider text-emerald-200 font-bold">JUZ</span>
                            <span class="text-base font-black leading-none">${juz.nomor}</span>
                        </div>
                        <div class="text-right">
                            <h2 class="text-lg font-extrabold text-slate-800 group-hover:text-emerald-700 transition leading-snug">${juz.nama}</h2>
                            <p class="text-emerald-600 text-xl font-serif-arabic mt-1 leading-snug">${juz.namaArab}</p>
                        </div>
                    </div>

                    <!-- Rentang Surat & Ayat -->
                    <div class="space-y-2 border-t border-slate-100 pt-3.5">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-500 font-medium">Rentang Ayat:</span>
                            <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200">
                                ${juz.suratIds.length} Surat
                            </span>
                        </div>

                        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                            <div class="flex items-center gap-1.5 text-slate-700">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                <span class="font-semibold text-slate-500">Mulai:</span>
                                <span class="font-bold text-emerald-800">QS. ${juz.mulai.namaSurat} : ${juz.mulai.ayat}</span>
                            </div>
                            <div class="flex items-center gap-1.5 text-slate-700">
                                <span class="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0"></span>
                                <span class="font-semibold text-slate-500">Sampai:</span>
                                <span class="font-bold text-teal-800">QS. ${juz.sampai.namaSurat} : ${juz.sampai.ayat}</span>
                            </div>
                        </div>

                        <!-- Keterangan Singkat -->
                        <p class="text-slate-500 text-xs italic mt-1 line-clamp-2">${juz.keterangan}</p>

                        <!-- Surat di dalam Juz -->
                        <div class="pt-2">
                            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Surat dalam Juz ${juz.nomor}:</div>
                            <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 no-scrollbar">
                                ${surahTagsHtml || `<span class="text-xs text-slate-400">Memuat surat...</span>`}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tombol Aksi Baca Juz -->
                <div class="pt-5 border-t border-slate-100 mt-4">
                    <button onclick="bacaJuz(${juz.nomor})" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        <span>BACA JUZ ${juz.nomor}</span>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;
}

// Tampilkan Daftar Surat (Mode Surat) dengan info Juz di setiap kartu
function tampilkanDaftarSurat(daftarSurat) {
    const container = document.getElementById('wisata-container');
    const countInfo = document.getElementById('surah-count-info');

    if (!container) return;

    if (countInfo) {
        countInfo.textContent = `Menampilkan ${daftarSurat.length} dari ${dataSemuaSurat.length} Surat`;
    }

    if (daftarSurat.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
                <div class="w-16 h-16 mx-auto mb-3 text-slate-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <h3 class="text-lg font-bold text-slate-700">Surat Tidak Ditemukan</h3>
                <p class="text-sm text-slate-500 mt-1">Coba gunakan kata kunci lain atau bersihkan kotak pencarian.</p>
                <button onclick="resetSearchSurah()" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
                    Tampilkan Semua Surat
                </button>
            </div>
        `;
        return;
    }

    let cardsHtml = '';
    daftarSurat.forEach(surat => {
        const isMakkiyyah = surat.tempatTurun.toLowerCase() === 'mekah' || surat.tempatTurun.toLowerCase() === 'makkiyyah';
        const badgeColor = isMakkiyyah 
            ? 'bg-amber-50 text-amber-700 border-amber-200' 
            : 'bg-teal-50 text-teal-700 border-teal-200';

        const juzInfo = getJuzForSurah(surat.nomor);

        cardsHtml += `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 hover:border-emerald-300 flex flex-col justify-between group transform hover:-translate-y-1">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold w-11 h-11 flex items-center justify-center rounded-2xl shadow-md text-sm">
                            ${surat.nomor}
                        </div>
                        <div class="text-right">
                            <h2 class="text-xl font-extrabold text-slate-800 group-hover:text-emerald-700 transition">${surat.namaLatin}</h2>
                            <p class="text-emerald-600 text-2xl font-serif-arabic mt-1 leading-snug">${surat.nama}</p>
                        </div>
                    </div>

                    <div class="space-y-2 border-t border-slate-100 pt-4">
                        <p class="text-slate-600 text-sm italic font-medium">"${surat.arti}"</p>
                        <div class="flex items-center justify-between text-xs pt-1">
                            <span class="font-semibold text-slate-500">${surat.jumlahAyat} Ayat</span>
                            <div class="flex items-center gap-1.5">
                                <span onclick="event.stopPropagation(); quickFilterJuzFromSurah(${juzInfo.numbers[0]})" class="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer transition" title="Klik untuk melihat ${juzInfo.text}">${juzInfo.text}</span>
                                <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${badgeColor}">
                                    ${surat.tempatTurun}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-6">
                    <button onclick="bacaSurat(${surat.nomor})" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        <span>BACA SURAT</span>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;
}

function quickFilterJuzFromSurah(juzNomor) {
    if (!juzNomor) return;
    switchQuranViewMode('juz');
    const searchInput = document.getElementById('search-surah');
    const clearBtn = document.getElementById('clear-search-surah');
    if (searchInput) {
        searchInput.value = `Juz ${juzNomor}`;
        if (clearBtn) clearBtn.classList.remove('hidden');
    }
    filterJuzList();
    const container = document.getElementById('juz-container');
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupSearchSurah() {
    const searchInput = document.getElementById('search-surah');
    const clearBtn = document.getElementById('clear-search-surah');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', keyword === '');
        }
        if (quranViewMode === 'juz') {
            filterJuzList();
        } else {
            filterSuratList();
        }
    });
}

function filterSuratList() {
    const searchInput = document.getElementById('search-surah');
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // Deteksi jika user mengetik pattern "juz X"
    let keywordJuzTarget = null;
    if (keyword.startsWith('juz ')) {
        const val = keyword.replace('juz ', '').trim();
        if (/^\d+$/.test(val)) {
            keywordJuzTarget = parseInt(val);
        } else if (val.includes('amma')) {
            keywordJuzTarget = 30;
        } else if (val.includes('tabarak')) {
            keywordJuzTarget = 29;
        }
    }

    let hasilFilter = dataSemuaSurat.filter(surat => {
        // Filter Dropdown Juz
        let matchJuzDropdown = true;
        if (selectedJuzFilter !== 'all') {
            const targetJuzNomor = parseInt(selectedJuzFilter);
            const juzData = DATA_30_JUZ.find(j => j.nomor === targetJuzNomor);
            matchJuzDropdown = juzData ? juzData.suratIds.includes(surat.nomor) : true;
        }

        // Match Search Keyword
        let matchSearch = true;
        if (keywordJuzTarget !== null) {
            const juzObj = DATA_30_JUZ.find(j => j.nomor === keywordJuzTarget);
            matchSearch = juzObj ? juzObj.suratIds.includes(surat.nomor) : false;
        } else if (keyword) {
            const matchNomorOrName = 
                surat.namaLatin.toLowerCase().includes(keyword) ||
                surat.arti.toLowerCase().includes(keyword) ||
                surat.nomor.toString() === keyword ||
                (surat.nama && surat.nama.includes(keyword));

            const juzInfo = getJuzForSurah(surat.nomor);
            const matchJuzName = juzInfo.numbers.some(jNum => {
                const j = DATA_30_JUZ.find(x => x.nomor === jNum);
                return j && (
                    j.nama.toLowerCase().includes(keyword) ||
                    (j.namaArab && j.namaArab.includes(keyword)) ||
                    `juz ${j.nomor}`.includes(keyword)
                );
            });

            matchSearch = matchNomorOrName || matchJuzName;
        }

        // Match Makkiyyah / Madaniyyah
        let matchType = true;
        if (surahFilterType === 'makkiyyah') {
            matchType = surat.tempatTurun.toLowerCase() === 'mekah' || surat.tempatTurun.toLowerCase() === 'makkiyyah';
        } else if (surahFilterType === 'madaniyyah') {
            matchType = surat.tempatTurun.toLowerCase() === 'madinah' || surat.tempatTurun.toLowerCase() === 'madaniyyah';
        }

        return matchJuzDropdown && matchSearch && matchType;
    });

    tampilkanDaftarSurat(hasilFilter);
}

function resetSearchSurah() {
    const searchInput = document.getElementById('search-surah');
    const clearBtn = document.getElementById('clear-search-surah');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    selectedJuzFilter = 'all';
    const selectJuz = document.getElementById('filter-surah-juz');
    if (selectJuz) selectJuz.value = 'all';

    if (quranViewMode === 'juz') {
        filterJuzList();
    } else {
        filterSuratList();
    }
}

function quickFilterSurah(nama) {
    if (quranViewMode !== 'surah') {
        switchQuranViewMode('surah');
    }
    const searchInput = document.getElementById('search-surah');
    const clearBtn = document.getElementById('clear-search-surah');
    if (searchInput) {
        searchInput.value = nama;
        if (clearBtn) clearBtn.classList.remove('hidden');
        filterSuratList();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function quickFilterJuzShortcut(juzNomor) {
    switchQuranViewMode('juz');
    const searchInput = document.getElementById('search-surah');
    const clearBtn = document.getElementById('clear-search-surah');
    if (searchInput) {
        searchInput.value = `Juz ${juzNomor}`;
        if (clearBtn) clearBtn.classList.remove('hidden');
    }
    filterJuzList();
    const container = document.getElementById('juz-container');
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterSurahType(type) {
    surahFilterType = type;
    const chips = document.querySelectorAll('.filter-chip-surah');
    chips.forEach(c => {
        c.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm');
        c.classList.add('text-slate-600');
    });

    const activeChip = document.getElementById(`filter-surah-${type}`);
    if (activeChip) {
        activeChip.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');
        activeChip.classList.remove('text-slate-600');
    }

    filterSuratList();
}

// ==========================================================================
// 4. DETAIL SURAT & AUDIO MUROTTAL
// ==========================================================================
async function bacaSurat(nomor) {
    const modal = document.getElementById('modal-surat');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalBadge = document.getElementById('modal-number-badge');
    const modalBismillah = document.getElementById('modal-bismillah');
    const audioPlayer = document.getElementById('audio-surat-player');

    hentikanMurottalAudio();

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    modalTitle.innerText = "Memuat Surat...";
    modalSubtitle.innerText = "Mengambil data ayat dari server...";
    if (modalBadge) modalBadge.innerText = `Surat #${nomor}`;
    modalContent.innerHTML = '<div class="flex justify-center py-20"><div class="loader"></div></div>';

    try {
        const respon = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
        const hasil = await respon.json();
        const data = hasil.data;

        modalTitle.innerText = data.namaLatin;
        const juzInfo = getJuzForSurah(data.nomor);
        modalSubtitle.innerText = `${data.arti} • ${data.jumlahAyat} Ayat • Diturunkan di ${data.tempatTurun} • ${juzInfo.text}`;
        if (modalBadge) modalBadge.innerText = `Surat #${data.nomor}`;

        if (audioPlayer && data.audioFull) {
            const audioUrl = data.audioFull['05'] || data.audioFull['01'] || Object.values(data.audioFull)[0];
            // Reset player dulu sebelum set src baru (penting untuk mobile)
            audioPlayer.pause();
            audioPlayer.removeAttribute('src');
            audioPlayer.load();
            audioPlayer.src = audioUrl;
            audioPlayer.load(); // Wajib dipanggil di mobile agar siap diputar
        }

        // Simpan ke riwayat bacaan
        addToRiwayat({
            nomor: data.nomor,
            namaLatin: data.namaLatin,
            nama: data.nama,
            arti: data.arti,
            jumlahAyat: data.jumlahAyat,
            tempatTurun: data.tempatTurun
        });

        if (modalBismillah) {
            if (nomor === 9 || nomor === 1) {
                modalBismillah.classList.add('hidden');
            } else {
                modalBismillah.classList.remove('hidden');
            }
        }

        modalContent.innerHTML = '';

        data.ayat.forEach(ayat => {
            const verseCard = document.createElement('div');
            verseCard.className = 'border-b border-slate-200/80 pb-8 last:border-0 hover:bg-white/80 p-4 rounded-2xl transition';
            verseCard.innerHTML = `
                <div class="flex items-center justify-between gap-4 mb-4">
                    <div class="bg-gradient-to-r from-emerald-700 to-teal-700 text-white w-9 h-9 rounded-xl flex items-center justify-center text-xs flex-shrink-0 font-bold shadow">
                        ${ayat.nomorAyat}
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="salinAyat('${data.namaLatin}', ${ayat.nomorAyat}, '${escapeQuote(ayat.teksArab)}', '${escapeQuote(ayat.teksIndonesia)}')" class="text-xs text-slate-500 hover:text-emerald-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            <span>Salin</span>
                        </button>
                    </div>
                </div>

                <div class="mb-5">
                    <p class="text-right text-3xl md:text-4xl leading-[2.6] md:leading-[2.8] font-serif-arabic text-slate-900 w-full" dir="rtl">
                        ${ayat.teksArab}
                    </p>
                </div>

                <div class="space-y-1.5 pl-4 border-l-4 border-emerald-500 bg-emerald-50/40 p-3 rounded-r-xl">
                    <p class="text-emerald-800 text-xs md:text-sm font-semibold tracking-wide">${ayat.teksLatin}</p>
                    <p class="text-slate-700 text-sm md:text-base leading-relaxed">${ayat.teksIndonesia}</p>
                </div>
            `;
            modalContent.appendChild(verseCard);
        });

        modalContent.scrollTop = 0;
    } catch (error) {
        console.error("Gagal memuat ayat:", error);
        modalContent.innerHTML = `<p class="text-red-500 text-center font-bold py-10">Gagal mengambil data ayat. Silakan periksa koneksi internet.</p>`;
    }
}

function escapeQuote(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

function toggleMurottalAudio() {
    const audioPlayer = document.getElementById('audio-surat-player');
    const playIcon = document.getElementById('icon-play-audio');
    const pauseIcon = document.getElementById('icon-pause-audio');
    const statusLabel = document.getElementById('audio-status-label');

    if (!audioPlayer || !audioPlayer.src) return;

    // Daftarkan event onended sekali saja
    audioPlayer.onended = () => {
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        if (statusLabel) statusLabel.textContent = "Putar Murottal Lengkap";
    };

    if (audioPlayer.paused) {
        // Untuk mobile: pastikan audio sudah di-load
        if (audioPlayer.readyState === 0) {
            audioPlayer.load();
        }
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (playIcon) playIcon.classList.add('hidden');
                if (pauseIcon) pauseIcon.classList.remove('hidden');
                if (statusLabel) statusLabel.textContent = "Sedang Memutar Murottal";
            }).catch(err => {
                console.error("Gagal play audio:", err);
                tampilkanToast("Gagal memutar audio. Coba ketuk tombol play lagi.");
            });
        }
    } else {
        audioPlayer.pause();
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        if (statusLabel) statusLabel.textContent = "Murottal Dijeda";
    }
}

function hentikanMurottalAudio() {
    const audioPlayer = document.getElementById('audio-surat-player');
    const playIcon = document.getElementById('icon-play-audio');
    const pauseIcon = document.getElementById('icon-pause-audio');
    const statusLabel = document.getElementById('audio-status-label');

    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }
    if (playIcon) playIcon.classList.remove('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (statusLabel) statusLabel.textContent = "Putar Murottal Lengkap";
}

function tutupModal() {
    const modal = document.getElementById('modal-surat');
    hentikanMurottalAudio();
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function salinAyat(namaSurat, nomorAyat, teksArab, arti) {
    const teksSalin = `QS. ${namaSurat} : ${nomorAyat}\n\n${teksArab}\n\nArtinya:\n"${arti}"`;
    salinKeClipboard(teksSalin, `Ayat ${nomorAyat} QS ${namaSurat} disalin!`);
}

// ==========================================================================
// 4B. FITUR BACA AL-QUR'AN PER JUZ
// ==========================================================================
async function bacaJuz(juzNomor, targetSuratNomor) {
    const modal = document.getElementById('modal-juz');
    if (!modal) return;

    const juz = DATA_30_JUZ.find(j => j.nomor === juzNomor);
    if (!juz) return;

    currentJuzData = juz;

    hentikanMurottalJuzAudio();

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Header modal Juz
    const badge = document.getElementById('modal-juz-badge');
    const title = document.getElementById('modal-juz-title');
    const subtitle = document.getElementById('modal-juz-subtitle');
    const arabic = document.getElementById('modal-juz-arabic');
    const surahCountEl = document.getElementById('modal-juz-surah-count');

    if (badge) badge.textContent = `Juz ${juz.nomor}`;
    if (arabic) arabic.textContent = juz.namaArab;
    if (title) title.textContent = `Juz ${juz.nomor} — ${juz.nama}`;
    if (subtitle) {
        subtitle.textContent = `Mulai: QS. ${juz.mulai.namaSurat} [${juz.mulai.ayat}] — Selesai: QS. ${juz.sampai.namaSurat} [${juz.sampai.ayat}] • ${juz.suratIds.length} Surat`;
    }
    if (surahCountEl) surahCountEl.textContent = `${juz.suratIds.length} Surat`;

    // Tombol Prev/Next Juz
    const btnPrev = document.getElementById('btn-prev-juz');
    const btnNext = document.getElementById('btn-next-juz');
    if (btnPrev) {
        btnPrev.disabled = (juzNomor <= 1);
        btnPrev.classList.toggle('opacity-50', juzNomor <= 1);
        btnPrev.classList.toggle('cursor-not-allowed', juzNomor <= 1);
    }
    if (btnNext) {
        btnNext.disabled = (juzNomor >= 30);
        btnNext.classList.toggle('opacity-50', juzNomor >= 30);
        btnNext.classList.toggle('cursor-not-allowed', juzNomor >= 30);
    }

    const initialSurah = targetSuratNomor || juz.suratIds[0];
    renderSurahRibbonDalamJuz(juz, initialSurah);
    await muatSuratDalamJuz(initialSurah, juz.nomor);
}

function renderSurahRibbonDalamJuz(juz, activeSurahNomor) {
    const ribbon = document.getElementById('modal-juz-surah-ribbon');
    if (!ribbon) return;

    const surahsInJuz = dataSemuaSurat.filter(s => juz.suratIds.includes(s.nomor));
    ribbon.innerHTML = surahsInJuz.map(s => {
        const isActive = s.nomor === activeSurahNomor;
        const activeClass = isActive 
            ? 'bg-amber-400 text-emerald-950 font-black shadow-md ring-2 ring-amber-300' 
            : 'bg-emerald-900/90 hover:bg-emerald-700 text-white font-medium border border-emerald-600/60';
        return `
            <button onclick="pilihSuratDalamJuz(${s.nomor})" class="px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 flex-shrink-0 ${activeClass}">
                <span class="text-[10px] opacity-80">${s.nomor}.</span>
                <span>${s.namaLatin}</span>
            </button>
        `;
    }).join('');

    // Scroll active chip into view
    const activeBtn = ribbon.querySelector('.ring-2');
    if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

async function pilihSuratDalamJuz(suratNomor) {
    if (!currentJuzData) return;
    renderSurahRibbonDalamJuz(currentJuzData, suratNomor);
    await muatSuratDalamJuz(suratNomor, currentJuzData.nomor);
}

async function muatSuratDalamJuz(suratNomor, juzNomor) {
    currentJuzSuratAktif = suratNomor;
    const modalContent = document.getElementById('modal-juz-content');
    const bismillahBanner = document.getElementById('modal-juz-bismillah');
    const audioPlayer = document.getElementById('audio-juz-player');
    const audioSurahTitle = document.getElementById('audio-juz-surah-title');
    const btnPrevSurat = document.getElementById('btn-juz-prev-surat');
    const btnNextSurat = document.getElementById('btn-juz-next-surat');

    hentikanMurottalJuzAudio();

    if (modalContent) {
        modalContent.innerHTML = '<div class="flex justify-center py-20"><div class="loader"></div></div>';
    }

    if (currentJuzData) {
        const idx = currentJuzData.suratIds.indexOf(suratNomor);
        if (btnPrevSurat) {
            btnPrevSurat.disabled = (idx <= 0);
            btnPrevSurat.classList.toggle('opacity-50', idx <= 0);
            btnPrevSurat.classList.toggle('cursor-not-allowed', idx <= 0);
        }
        if (btnNextSurat) {
            btnNextSurat.disabled = (idx >= currentJuzData.suratIds.length - 1);
            btnNextSurat.classList.toggle('opacity-50', idx >= currentJuzData.suratIds.length - 1);
            btnNextSurat.classList.toggle('cursor-not-allowed', idx >= currentJuzData.suratIds.length - 1);
        }
    }

    try {
        const respon = await fetch(`https://equran.id/api/v2/surat/${suratNomor}`);
        const hasil = await respon.json();
        const data = hasil.data;

        if (audioSurahTitle) {
            audioSurahTitle.textContent = `QS. ${data.namaLatin} (${data.nama}) • ${data.jumlahAyat} Ayat`;
        }

        if (audioPlayer && data.audioFull) {
            const audioUrl = data.audioFull['05'] || data.audioFull['01'] || Object.values(data.audioFull)[0];
            audioPlayer.pause();
            audioPlayer.removeAttribute('src');
            audioPlayer.load();
            audioPlayer.src = audioUrl;
            audioPlayer.load();
        }

        addToRiwayat({
            nomor: data.nomor,
            namaLatin: data.namaLatin,
            nama: data.nama,
            arti: data.arti,
            jumlahAyat: data.jumlahAyat,
            tempatTurun: data.tempatTurun
        });

        if (bismillahBanner) {
            if (suratNomor === 9 || suratNomor === 1) {
                bismillahBanner.classList.add('hidden');
            } else {
                bismillahBanner.classList.remove('hidden');
            }
        }

        if (!modalContent) return;
        modalContent.innerHTML = '';

        const surahHeaderCard = document.createElement('div');
        surahHeaderCard.className = 'bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4 mb-2';
        surahHeaderCard.innerHTML = `
            <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">Surat #${data.nomor} dalam Juz ${juzNomor}</span>
                <h4 class="text-xl font-black text-slate-800 mt-1">${data.namaLatin} <span class="text-sm font-normal text-slate-500">("${data.arti}")</span></h4>
                <p class="text-xs text-slate-500 mt-0.5">${data.jumlahAyat} Ayat • Diturunkan di ${data.tempatTurun}</p>
            </div>
            <div class="text-right">
                <span class="text-3xl md:text-4xl font-serif-arabic text-emerald-800">${data.nama}</span>
            </div>
        `;
        modalContent.appendChild(surahHeaderCard);

        data.ayat.forEach(ayat => {
            const verseCard = document.createElement('div');
            verseCard.className = 'border-b border-slate-200/80 pb-8 last:border-0 hover:bg-white/80 p-4 rounded-2xl transition';
            verseCard.innerHTML = `
                <div class="flex items-center justify-between gap-4 mb-4">
                    <div class="bg-gradient-to-r from-emerald-700 to-teal-700 text-white w-9 h-9 rounded-xl flex items-center justify-center text-xs flex-shrink-0 font-bold shadow">
                        ${ayat.nomorAyat}
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="salinAyat('${data.namaLatin}', ${ayat.nomorAyat}, '${escapeQuote(ayat.teksArab)}', '${escapeQuote(ayat.teksIndonesia)}')" class="text-xs text-slate-500 hover:text-emerald-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            <span>Salin</span>
                        </button>
                    </div>
                </div>

                <div class="mb-5">
                    <p class="text-right text-3xl md:text-4xl leading-[2.6] md:leading-[2.8] font-serif-arabic text-slate-900 w-full" dir="rtl">
                        ${ayat.teksArab}
                    </p>
                </div>

                <div class="space-y-1.5 pl-4 border-l-4 border-emerald-500 bg-emerald-50/40 p-3 rounded-r-xl">
                    <p class="text-emerald-800 text-xs md:text-sm font-semibold tracking-wide">${ayat.teksLatin}</p>
                    <p class="text-slate-700 text-sm md:text-base leading-relaxed">${ayat.teksIndonesia}</p>
                </div>
            `;
            modalContent.appendChild(verseCard);
        });

        modalContent.scrollTop = 0;
    } catch (error) {
        console.error("Gagal memuat surat dalam juz:", error);
        if (modalContent) {
            modalContent.innerHTML = `<p class="text-red-500 text-center font-bold py-10">Gagal mengambil data surat dalam juz ini. Periksa koneksi internet.</p>`;
        }
    }
}

function navigasiSuratDalamJuz(arah) {
    if (!currentJuzData || !currentJuzSuratAktif) return;
    const curIdx = currentJuzData.suratIds.indexOf(currentJuzSuratAktif);
    const targetIdx = curIdx + arah;
    if (targetIdx >= 0 && targetIdx < currentJuzData.suratIds.length) {
        const nextSuratNomor = currentJuzData.suratIds[targetIdx];
        pilihSuratDalamJuz(nextSuratNomor);
    }
}

function navigasiJuz(arah) {
    if (!currentJuzData) return;
    const targetJuz = currentJuzData.nomor + arah;
    if (targetJuz >= 1 && targetJuz <= 30) {
        bacaJuz(targetJuz);
    }
}

function toggleMurottalJuzAudio() {
    const audioPlayer = document.getElementById('audio-juz-player');
    const playIcon = document.getElementById('icon-play-juz-audio');
    const pauseIcon = document.getElementById('icon-pause-juz-audio');
    const statusLabel = document.getElementById('audio-juz-status-label');

    if (!audioPlayer || !audioPlayer.src) return;

    audioPlayer.onended = () => {
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        if (statusLabel) statusLabel.textContent = "Putar Murottal Surat";
    };

    if (audioPlayer.paused) {
        if (audioPlayer.readyState === 0) {
            audioPlayer.load();
        }
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (playIcon) playIcon.classList.add('hidden');
                if (pauseIcon) pauseIcon.classList.remove('hidden');
                if (statusLabel) statusLabel.textContent = "Sedang Memutar Murottal";
            }).catch(err => {
                console.error("Gagal play audio juz:", err);
                tampilkanToast("Gagal memutar audio. Coba ketuk lagi.");
            });
        }
    } else {
        audioPlayer.pause();
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        if (statusLabel) statusLabel.textContent = "Murottal Dijeda";
    }
}

function hentikanMurottalJuzAudio() {
    const audioPlayer = document.getElementById('audio-juz-player');
    const playIcon = document.getElementById('icon-play-juz-audio');
    const pauseIcon = document.getElementById('icon-pause-juz-audio');
    const statusLabel = document.getElementById('audio-juz-status-label');

    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }
    if (playIcon) playIcon.classList.remove('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (statusLabel) statusLabel.textContent = "Putar Murottal Surat";
}

function tutupModalJuz() {
    const modal = document.getElementById('modal-juz');
    hentikanMurottalJuzAudio();
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// ==========================================================================
// 5. FITUR KUMPULAN DOA-DOA (ournoor.com Muslim API)
// ==========================================================================
function formatKategoriDoa(source) {
    const map = {
        'quran': "Doa Al-Qur'an",
        'harian': "Doa Sehari-hari",
        'hadits': "Doa Hadits Nabawi",
        'haji': "Doa Haji & Umrah",
        'ibadah': "Doa Ibadah",
        'pilihan': "Doa Pilihan",
        'lainnya': "Doa Lainnya"
    };
    return map[source] || (source ? source.charAt(0).toUpperCase() + source.slice(1) : 'Doa Pilihan');
}

async function ambilDataDoa() {
    const loadingDoa = document.getElementById('loading-doa');
    const containerDoa = document.getElementById('doa-container');

    try {
        // Panggil API resmi ournoor.com
        const respon = await fetch('https://ournoor.com/api/v1/doa');
        const hasil = await respon.json();

        // Data array di bawah field 'data'
        const listDoa = hasil.data || hasil || [];
        if (!Array.isArray(listDoa) || listDoa.length === 0) {
            throw new Error("Data doa kosong");
        }

        // Tambahkan id unik untuk mapping jika belum ada
        dataSemuaDoa = listDoa.map((item, idx) => ({
            id: idx + 1,
            nama: item.judul || item.nama || 'Doa',
            ar: item.arab || item.ar || '',
            idn: item.indo || item.idn || item.arti || '',
            tr: item.tr || item.latin || '',
            grup: formatKategoriDoa(item.source || item.grup || 'pilihan'),
            rawSource: item.source || 'pilihan',
            tentang: item.source === 'quran' ? "Bersumber dari ayat Al-Qur'an Al-Karim." : "Bersumber dari hadits dan amalan doa sehari-hari."
        }));

        loadingDoa.style.display = 'none';

        setupDoaCategories(dataSemuaDoa);
        tampilkanDaftarDoa(dataSemuaDoa);
        setupSearchDoa();
    } catch (error) {
        console.error("Gagal memuat kumpulan doa ournoor:", error);
        loadingDoa.innerHTML = `
            <div class="text-center py-10">
                <p class="text-red-500 font-bold mb-3">Gagal memuat kumpulan doa. Periksa koneksi internet.</p>
                <button onclick="ambilDataDoa()" class="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">
                    Coba Lagi
                </button>
            </div>
        `;
    }
}

function setupDoaCategories(doaList) {
    const select = document.getElementById('filter-doa-group');
    if (!select) return;

    const uniqueGroups = [...new Set(doaList.map(d => d.grup).filter(Boolean))];
    uniqueGroups.sort();

    select.innerHTML = '<option value="all">Semua Kategori Doa</option>';
    uniqueGroups.forEach(grup => {
        const opt = document.createElement('option');
        opt.value = grup;
        opt.textContent = grup;
        select.appendChild(opt);
    });
}

function tampilkanDaftarDoa(doaList) {
    const container = document.getElementById('doa-container');
    const countInfo = document.getElementById('doa-count-info');

    if (!container) return;

    if (countInfo) {
        countInfo.textContent = `Menampilkan ${doaList.length} dari ${dataSemuaDoa.length} Doa`;
    }

    if (doaList.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
                <h3 class="text-lg font-bold text-slate-700">Doa Tidak Ditemukan</h3>
                <p class="text-sm text-slate-500 mt-1">Coba gunakan kata kunci doa lainnya.</p>
                <button onclick="resetSearchDoa()" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
                    Tampilkan Semua Doa
                </button>
            </div>
        `;
        return;
    }

    let cardsHtml = '';
    doaList.forEach(doa => {
        cardsHtml += `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 hover:border-emerald-300 flex flex-col justify-between group">
                <div>
                    <div class="flex items-center justify-between gap-3 mb-3">
                        <span class="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full">
                            ${doa.grup || 'Doa Pilihan'}
                        </span>
                        <span class="text-xs text-slate-400 font-mono">#${doa.id}</span>
                    </div>

                    <h3 class="text-lg font-extrabold text-slate-800 group-hover:text-emerald-700 transition mb-4">
                        ${doa.nama}
                    </h3>

                    <div class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/70 mb-4">
                        <p class="text-right text-2xl md:text-3xl leading-[2.6] font-serif-arabic text-slate-900" dir="rtl">
                            ${doa.ar}
                        </p>
                    </div>

                    <p class="text-slate-600 text-sm leading-relaxed line-clamp-3">
                        ${doa.idn}
                    </p>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button onclick="salinDoaById(${doa.id})" class="text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        <span>Salin</span>
                    </button>

                    <button onclick="bukaModalDoa(${doa.id})" class="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5">
                        <span>Baca Lengkap</span>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;
}

function setupSearchDoa() {
    const searchInput = document.getElementById('search-doa');
    const clearBtn = document.getElementById('clear-search-doa');

    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim();
        if (clearBtn) clearBtn.classList.toggle('hidden', keyword === '');
        filterDoaList();
    });
}

function onSelectDoaGroup() {
    filterDoaList();
}

function filterDoaList() {
    const searchInput = document.getElementById('search-doa');
    const groupSelect = document.getElementById('filter-doa-group');

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedGroup = groupSelect ? groupSelect.value : 'all';

    let hasil = dataSemuaDoa.filter(doa => {
        const matchSearch = !keyword ||
            doa.nama.toLowerCase().includes(keyword) ||
            (doa.idn && doa.idn.toLowerCase().includes(keyword)) ||
            (doa.grup && doa.grup.toLowerCase().includes(keyword));

        const matchGroup = selectedGroup === 'all' || doa.grup === selectedGroup;

        return matchSearch && matchGroup;
    });

    tampilkanDaftarDoa(hasil);
}

function resetSearchDoa() {
    const searchInput = document.getElementById('search-doa');
    const groupSelect = document.getElementById('filter-doa-group');
    const clearBtn = document.getElementById('clear-search-doa');

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    if (groupSelect) groupSelect.value = 'all';

    filterDoaList();
}

let doaAktifModal = null;

function bukaModalDoa(id) {
    const doa = dataSemuaDoa.find(d => d.id === id);
    if (!doa) return;

    doaAktifModal = doa;

    document.getElementById('modal-doa-title').textContent = doa.nama;
    document.getElementById('modal-doa-group').textContent = doa.grup || 'Doa';
    document.getElementById('modal-doa-ar').textContent = doa.ar;
    
    const trEl = document.getElementById('modal-doa-tr');
    if (trEl) {
        if (doa.tr) {
            trEl.parentElement.classList.remove('hidden');
            trEl.textContent = doa.tr;
        } else {
            trEl.parentElement.classList.add('hidden');
        }
    }

    document.getElementById('modal-doa-idn').textContent = doa.idn;

    const tentangWrap = document.getElementById('modal-doa-tentang-wrapper');
    const tentangText = document.getElementById('modal-doa-tentang');

    if (doa.tentang && doa.tentang.trim()) {
        tentangWrap.classList.remove('hidden');
        tentangText.textContent = doa.tentang;
    } else {
        tentangWrap.classList.add('hidden');
    }

    const modal = document.getElementById('modal-doa');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function tutupModalDoa() {
    const modal = document.getElementById('modal-doa');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function salinDoaById(id) {
    const doa = dataSemuaDoa.find(d => d.id === id);
    if (!doa) return;

    const teks = `${doa.nama}\n\n${doa.ar}\n\nArtinya:\n"${doa.idn}"\n\nSumber: ${doa.tentang || 'ournoor.com'}`;
    salinKeClipboard(teks, `Doa "${doa.nama}" berhasil disalin!`);
}

function salinTeksModalDoa() {
    if (doaAktifModal) {
        salinDoaById(doaAktifModal.id);
    }
}

// ==========================================================================
// 6. JADWAL WAKTU SHOLAT (Aladhan API)
// ==========================================================================
async function ambilJadwalSholat(lat, lng, namaKota) {
    const loading = document.getElementById('loading-sholat');
    const container = document.getElementById('sholat-cards-container');
    const cityDisplay = document.getElementById('sholat-city-display');
    const dateDisplay = document.getElementById('sholat-date-display');
    const headerHijri = document.getElementById('header-date-hijri');

    if (loading) loading.style.display = 'flex';

    try {
        const respon = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=20`);
        const hasil = await respon.json();

        if (hasil.code !== 200) throw new Error("Gagal mengambil waktu sholat");

        const data = hasil.data;
        const timings = data.timings;
        const hijri = data.date.hijri;
        const gregorian = data.date.gregorian;

        waktuSholatData = timings;

        if (loading) loading.style.display = 'none';

        const formattedHijri = `${hijri.day} ${hijri.month.en} ${hijri.year} H`;
        const formattedMasehi = `${gregorian.weekday.en}, ${gregorian.day} ${gregorian.month.en} ${gregorian.year}`;

        if (cityDisplay) cityDisplay.textContent = namaKota;
        if (dateDisplay) dateDisplay.textContent = `${formattedMasehi} • ${formattedHijri}`;
        if (headerHijri) headerHijri.textContent = `${formattedHijri} (${namaKota})`;

        renderKartuSholat(timings);
        mulaiCountdownSholat(timings);

    } catch (error) {
        console.error("Gagal memuat jadwal sholat:", error);
        if (loading) {
            loading.innerHTML = `
                <div class="text-center py-6">
                    <p class="text-red-500 font-bold mb-2">Gagal memuat jadwal sholat dari Aladhan.</p>
                    <button onclick="ambilJadwalSholat(${lat}, ${lng}, '${namaKota}')" class="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
                        Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

function renderKartuSholat(timings) {
    const container = document.getElementById('sholat-cards-container');
    if (!container) return;

    const daftarSholat = [
        { key: 'Imsak', label: 'Imsak', time: timings.Imsak, icon: '🌙' },
        { key: 'Fajr', label: 'Subuh', time: timings.Fajr, icon: '🌅' },
        { key: 'Sunrise', label: 'Terbit', time: timings.Sunrise, icon: '☀️' },
        { key: 'Dhuhr', label: 'Dzuhur', time: timings.Dhuhr, icon: '🌤️' },
        { key: 'Asr', label: 'Ashar', time: timings.Asr, icon: '⛅' },
        { key: 'Maghrib', label: 'Maghrib', time: timings.Maghrib, icon: '🌇' },
        { key: 'Isha', label: 'Isya', time: timings.Isha, icon: '🌌' }
    ];

    let html = '';
    daftarSholat.forEach(sholat => {
        html += `
            <div id="card-prayer-${sholat.key}" class="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-md hover:border-emerald-300">
                <span class="text-2xl mb-1">${sholat.icon}</span>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500">${sholat.label}</span>
                <span class="text-xl md:text-2xl font-extrabold text-slate-800 font-mono mt-1">${sholat.time}</span>
                <span id="badge-prayer-${sholat.key}" class="hidden text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-2">
                    Berikutnya
                </span>
            </div>
        `;
    });

    container.innerHTML = html;
}

function mulaiCountdownSholat(timings) {
    if (countdownTimerInterval) clearInterval(countdownTimerInterval);

    const prayerOrder = [
        { name: 'Imsak', timeStr: timings.Imsak, id: 'Imsak' },
        { name: 'Subuh', timeStr: timings.Fajr, id: 'Fajr' },
        { name: 'Terbit', timeStr: timings.Sunrise, id: 'Sunrise' },
        { name: 'Dzuhur', timeStr: timings.Dhuhr, id: 'Dhuhr' },
        { name: 'Ashar', timeStr: timings.Asr, id: 'Asr' },
        { name: 'Maghrib', timeStr: timings.Maghrib, id: 'Maghrib' },
        { name: 'Isya', timeStr: timings.Isha, id: 'Isha' }
    ];

    function updateTick() {
        const now = new Date();
        const currentTotalSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        let nextPrayer = null;
        let diffSec = null;

        for (const item of prayerOrder) {
            const [h, m] = item.timeStr.split(':').map(Number);
            const prayerSec = h * 3600 + m * 60;

            if (prayerSec > currentTotalSec) {
                nextPrayer = item;
                diffSec = prayerSec - currentTotalSec;
                break;
            }
        }

        if (!nextPrayer) {
            nextPrayer = prayerOrder[0];
            const [h, m] = nextPrayer.timeStr.split(':').map(Number);
            const tomorrowImsakSec = (24 * 3600) + (h * 3600 + m * 60);
            diffSec = tomorrowImsakSec - currentTotalSec;
        }

        const hours = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;

        const countdownFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const countdownEl = document.getElementById('sholat-countdown');
        const nextNameEl = document.getElementById('sholat-next-name');
        const headerNextEl = document.getElementById('header-next-prayer');

        if (countdownEl) countdownEl.textContent = countdownFormatted;
        if (nextNameEl) nextNameEl.textContent = nextPrayer.name;
        if (headerNextEl) {
            headerNextEl.innerHTML = `Sholat Berikutnya: <strong class="text-amber-300">${nextPrayer.name} (${nextPrayer.timeStr}) - ${countdownFormatted}</strong>`;
        }

        prayerOrder.forEach(item => {
            const card = document.getElementById(`card-prayer-${item.id}`);
            const badge = document.getElementById(`badge-prayer-${item.id}`);
            if (card && badge) {
                if (item.id === nextPrayer.id) {
                    card.classList.add('ring-2', 'ring-emerald-600', 'bg-emerald-50/50');
                    badge.classList.remove('hidden');
                } else {
                    card.classList.remove('ring-2', 'ring-emerald-600', 'bg-emerald-50/50');
                    badge.classList.add('hidden');
                }
            }
        });
    }

    updateTick();
    countdownTimerInterval = setInterval(updateTick, 1000);
}

function changePrayerCity() {
    const select = document.getElementById('select-city');
    const cityName = select.value;
    const target = DAFTAR_KOTA[cityName] || DAFTAR_KOTA["Jakarta"];

    currentLatitude = target.lat;
    currentLongitude = target.lng;
    currentNamaKota = target.nama;

    ambilJadwalSholat(currentLatitude, currentLongitude, currentNamaKota);
    updateTampilanKiblat(currentLatitude, currentLongitude, currentNamaKota);
}

function getUserLocationPrayer() {
    if (!navigator.geolocation) {
        tampilkanToast("Perangkat Anda tidak mendukung geolokasi GPS.");
        return;
    }

    tampilkanToast("Mendeteksi lokasi GPS Anda...");
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            currentLatitude = pos.coords.latitude;
            currentLongitude = pos.coords.longitude;
            currentNamaKota = "Lokasi Saya (GPS)";

            ambilJadwalSholat(currentLatitude, currentLongitude, currentNamaKota);
            updateTampilanKiblat(currentLatitude, currentLongitude, currentNamaKota);
            tampilkanToast("Lokasi GPS berhasil diperbarui!");
        },
        (err) => {
            console.error("Gagal GPS:", err);
            tampilkanToast("Izin GPS ditolak atau tidak tersedia. Menggunakan preset kota.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// ==========================================================================
// 7. ARAH KIBLAT (KOMPAS VISUAL & SENSOR)
// ==========================================================================
function hitungArahKiblatMatematis(lat, lng) {
    const phiK = 21.422487 * Math.PI / 180.0;
    const lambdaK = 39.826206 * Math.PI / 180.0;
    const phi = lat * Math.PI / 180.0;
    const lambda = lng * Math.PI / 180.0;

    const numerator = Math.sin(lambdaK - lambda);
    const denominator = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
    let qibla = Math.atan2(numerator, denominator) * 180.0 / Math.PI;
    if (qibla < 0) qibla += 360;
    return qibla;
}

function hitungJarakKaabah(lat, lng) {
    const R = 6371;
    const lat1 = lat * Math.PI / 180;
    const lat2 = 21.422487 * Math.PI / 180;
    const dLat = (21.422487 - lat) * Math.PI / 180;
    const dLng = (39.826206 - lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

async function updateTampilanKiblat(lat, lng, namaLokasi) {
    let degree = hitungArahKiblatMatematis(lat, lng);

    try {
        const respon = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lng}`);
        const hasil = await respon.json();
        if (hasil.code === 200 && hasil.data && hasil.data.direction) {
            degree = hasil.data.direction;
        }
    } catch (e) {
        console.warn("Menggunakan rumus matematis kiblat lokal:", e);
    }

    kiblaAngle = degree;

    const degreeValEl = document.getElementById('qibla-degree-val');
    const dirLabelEl = document.getElementById('qibla-direction-label');
    const needleEl = document.getElementById('compass-needle');
    const rimMarkerEl = document.getElementById('qibla-marker-rim');
    const locNameEl = document.getElementById('qibla-location-name');
    const coordsEl = document.getElementById('qibla-coords-display');
    const distEl = document.getElementById('qibla-distance-display');

    if (degreeValEl) degreeValEl.textContent = degree.toFixed(2);
    if (needleEl) needleEl.style.transform = `rotate(${degree}deg)`;
    if (rimMarkerEl) rimMarkerEl.style.transform = `rotate(${degree}deg)`;

    let arahTeks = "Barat Laut (North-West)";
    if (degree >= 280 && degree <= 300) arahTeks = "Barat Laut (Kiblat Indonesia ~295°)";
    else if (degree > 0 && degree < 90) arahTeks = "Timur Laut";
    else if (degree >= 90 && degree < 180) arahTeks = "Tenggara";
    else if (degree >= 180 && degree < 270) arahTeks = "Barat Daya";
    if (dirLabelEl) dirLabelEl.textContent = arahTeks;

    if (locNameEl) locNameEl.textContent = namaLokasi;
    if (coordsEl) coordsEl.textContent = `Lat: ${lat.toFixed(4)} • Lng: ${lng.toFixed(4)}`;

    const jarak = hitungJarakKaabah(lat, lng);
    if (distEl) distEl.textContent = `~${jarak.toLocaleString('id-ID')} km`;
}

function getUserLocationQibla() {
    getUserLocationPrayer();
}

function requestDeviceOrientation() {
    const btnText = document.getElementById('sensor-btn-text');

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    aktifkanSensorKompas();
                    if (btnText) btnText.textContent = "Sensor Kompas Aktif";
                    tampilkanToast("Sensor HP aktif! Putar HP Anda menghadap Ka'bah.");
                } else {
                    tampilkanToast("Izin sensor kompas ditolak.");
                }
            })
            .catch(err => {
                console.error(err);
                tampilkanToast("Tidak dapat mengaktifkan sensor kompas.");
            });
    } else if ('ondeviceorientationabsolute' in window || 'ondeviceorientation' in window) {
        aktifkanSensorKompas();
        if (btnText) btnText.textContent = "Sensor Kompas Aktif";
        tampilkanToast("Sensor HP aktif! Putar HP Anda menghadap Ka'bah.");
    } else {
        tampilkanToast("Perangkat ini tidak memiliki sensor kompas fisik.");
    }
}

function aktifkanSensorKompas() {
    sensorAktif = true;

    const handleOrientation = (e) => {
        let heading = null;

        if (e.webkitCompassHeading) {
            heading = e.webkitCompassHeading;
        } else if (e.alpha !== null) {
            heading = 360 - e.alpha;
        }

        if (heading !== null) {
            const dialRing = document.getElementById('compass-dial-ring');
            const needle = document.getElementById('compass-needle');
            const rimMarker = document.getElementById('qibla-marker-rim');

            if (dialRing) dialRing.style.transform = `rotate(${-heading}deg)`;
            
            const adjustedQibla = (kiblaAngle - heading + 360) % 360;
            if (needle) needle.style.transform = `rotate(${adjustedQibla}deg)`;
            if (rimMarker) rimMarker.style.transform = `rotate(${adjustedQibla}deg)`;
        }
    };

    if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
}

// ==========================================================================
// 8. FITUR KABAR & BERITA ISLAMI
// ==========================================================================
async function muatBeritaIslam() {
    const loading = document.getElementById('loading-berita');
    const container = document.getElementById('berita-container');

    if (loading) loading.style.display = 'flex';
    if (container) container.innerHTML = '';

    try {
        const respon = await fetch('https://berita-indo-api-next.vercel.app/api/republika-news/islam');
        const hasil = await respon.json();

        let articles = [];
        if (hasil && Array.isArray(hasil.data)) {
            articles = hasil.data;
        } else if (Array.isArray(hasil)) {
            articles = hasil;
        }

        if (articles.length === 0) throw new Error("Format berita kosong");

        dataSemuaBerita = articles;
        if (loading) loading.style.display = 'none';

        tampilkanDaftarBerita(dataSemuaBerita);
        setupSearchBerita();
    } catch (err) {
        console.warn("Mencoba fallback RSS feed Republika Khazanah:", err);
        cobaFallbackBerita();
    }
}

async function cobaFallbackBerita() {
    const loading = document.getElementById('loading-berita');
    const container = document.getElementById('berita-container');

    try {
        const respon = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://republika.co.id/rss/khazanah');
        const hasil = await respon.json();

        if (hasil.status === 'ok' && Array.isArray(hasil.items)) {
            dataSemuaBerita = hasil.items.map(item => ({
                title: item.title,
                link: item.link,
                isoDate: item.pubDate,
                description: item.description,
                creator: item.author || 'Republika',
                image: {
                    small: (item.enclosure && item.enclosure.link) || item.thumbnail || 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&auto=format&fit=crop'
                }
            }));

            if (loading) loading.style.display = 'none';
            tampilkanDaftarBerita(dataSemuaBerita);
            setupSearchBerita();
            return;
        }
    } catch (fallbackErr) {
        console.error("Semua endpoint berita gagal:", fallbackErr);
    }

    dataSemuaBerita = [
        {
            title: "Pentingnya Menjaga Waktu Sholat Lima Waktu dan Keutamaannya",
            link: "https://khazanah.republika.co.id",
            isoDate: new Date().toISOString(),
            description: "Sholat merupakan tiang agama dan amalan yang pertama kali dihisab pada hari kiamat. Menjaga kekhusyukan dan waktu sholat menghadirkan kedamaian jiwa.",
            creator: "Redaksi Khazanah",
            image: { small: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&auto=format&fit=crop" }
        },
        {
            title: "Hikmah Membaca dan Mentadabburi Al-Qur'an Setiap Hari",
            link: "https://khazanah.republika.co.id",
            isoDate: new Date().toISOString(),
            description: "Membaca Al-Qur'an memberi ketenangan hati, syafaat di hari akhir, dan petunjuk bagi setiap persoalan hidup seorang mukmin.",
            creator: "Khazanah Islam",
            image: { small: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=500&auto=format&fit=crop" }
        },
        {
            title: "Adab dan Tata Cara Berdoa yang Mustajab Sesuai Tuntunan Rasulullah SAW",
            link: "https://khazanah.republika.co.id",
            isoDate: new Date().toISOString(),
            description: "Di antara waktu mustajab untuk berdoa adalah di sepertiga malam terakhir, antara adzan dan iqamah, serta saat sujud dalam sholat.",
            creator: "Tausiyah Harian",
            image: { small: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop" }
        }
    ];

    if (loading) loading.style.display = 'none';
    tampilkanDaftarBerita(dataSemuaBerita);
    setupSearchBerita();
}

function tampilkanDaftarBerita(articles) {
    const container = document.getElementById('berita-container');
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
                <h3 class="text-lg font-bold text-slate-700">Tidak Ada Berita yang Cocok</h3>
                <p class="text-sm text-slate-500 mt-1">Coba gunakan kata kunci pencarian berita yang lain.</p>
            </div>
        `;
        return;
    }

    let html = '';
    articles.forEach(item => {
        const imgUrl = (item.image && item.image.small) || 
                       (item.enclosure && item.enclosure.link) || 
                       'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&auto=format&fit=crop';
        
        const cleanDesc = (item.description || '').replace(/<[^>]*>?/gm, '').trim();
        const tglStr = item.isoDate ? formatTanggalIndo(item.isoDate) : 'Hari ini';

        html += `
            <article class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col justify-between group">
                <div>
                    <div class="relative h-48 w-full overflow-hidden bg-slate-100">
                        <img src="${imgUrl}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&auto=format&fit=crop'">
                        <div class="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                            ${tglStr}
                        </div>
                    </div>

                    <div class="p-5">
                        <div class="flex items-center gap-2 text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                            <span>${item.creator || 'Republika Islam'}</span>
                        </div>
                        <h3 class="font-bold text-base md:text-lg text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                            ${item.title}
                        </h3>
                        <p class="text-slate-600 text-xs md:text-sm mt-2 line-clamp-3 leading-relaxed">
                            ${cleanDesc}
                        </p>
                    </div>
                </div>

                <div class="p-5 pt-0">
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition">
                        <span>Baca Selengkapnya</span>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}

function setupSearchBerita() {
    const searchInput = document.getElementById('search-berita');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = dataSemuaBerita.filter(b => 
            b.title.toLowerCase().includes(query) || 
            (b.description && b.description.toLowerCase().includes(query))
        );
        tampilkanDaftarBerita(filtered);
    });
}

function formatTanggalIndo(dateStr) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// ==========================================================================
// 9. TOAST & HELPER SALIN CLIPBOARD
// ==========================================================================
function tampilkanToast(pesan) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = pesan;
    toast.classList.remove('hidden');
    toast.classList.add('flex');

    setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('flex');
    }, 2800);
}

function salinKeClipboard(teks, labelPesan) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(teks)
            .then(() => tampilkanToast(labelPesan || "Teks berhasil disalin ke clipboard!"))
            .catch(() => fallbackSalin(teks, labelPesan));
    } else {
        fallbackSalin(teks, labelPesan);
    }
}

function fallbackSalin(teks, labelPesan) {
    const textarea = document.createElement('textarea');
    textarea.value = teks;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        tampilkanToast(labelPesan || "Teks berhasil disalin!");
    } catch (err) {
        console.error(err);
        tampilkanToast("Gagal menyalin teks.");
    }
    document.body.removeChild(textarea);
}

// ==========================================================================
// 10. INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initHeaderClock();
    ambilDataSurat();
    ambilJadwalSholat(currentLatitude, currentLongitude, currentNamaKota);
    updateTampilanKiblat(currentLatitude, currentLongitude, currentNamaKota);

    // Render riwayat dari localStorage saat halaman dimuat
    renderRiwayat();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            tutupModal();
            tutupModalDoa();
            tutupModalJuz();
        }
    });

    const modalSurat = document.getElementById('modal-surat');
    if (modalSurat) {
        modalSurat.addEventListener('click', (e) => {
            if (e.target === modalSurat) tutupModal();
        });
    }

    const modalDoa = document.getElementById('modal-doa');
    if (modalDoa) {
        modalDoa.addEventListener('click', (e) => {
            if (e.target === modalDoa) tutupModalDoa();
        });
    }

    const modalJuz = document.getElementById('modal-juz');
    if (modalJuz) {
        modalJuz.addEventListener('click', (e) => {
            if (e.target === modalJuz) tutupModalJuz();
        });
    }
});
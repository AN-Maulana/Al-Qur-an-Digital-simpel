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

// Preset Koordinat Kota-Kota Indonesia
const DAFTAR_KOTA = {
    "Jakarta": { lat: -6.2088, lng: 106.8456, nama: "DKI Jakarta" },
    "Surabaya": { lat: -7.2575, lng: 112.7521, nama: "Kota Surabaya" },
    "Bandung": { lat: -6.9175, lng: 107.6191, nama: "Kota Bandung" },
    "Medan": { lat: 3.5952, lng: 98.6722, nama: "Kota Medan" },
    "Semarang": { lat: -6.9667, lng: 110.4167, nama: "Kota Semarang" },
    "Makassar": { lat: -5.1477, lng: 119.4327, nama: "Kota Makassar" },
    "Yogyakarta": { lat: -7.7956, lng: 110.3695, nama: "DI Yogyakarta" },
    "Palembang": { lat: -2.9761, lng: 104.7754, nama: "Kota Palembang" },
    "Denpasar": { lat: -8.6705, lng: 115.2126, nama: "Kota Denpasar" },
    "Banda Aceh": { lat: 5.5483, lng: 95.3238, nama: "Banda Aceh" },
    "Banjarmasin": { lat: -3.3194, lng: 114.5908, nama: "Banjarmasin" },
    "Balikpapan": { lat: -1.2379, lng: 116.8529, nama: "Balikpapan" },
    "Padang": { lat: -0.9471, lng: 100.4172, nama: "Kota Padang" },
    "Jayapura": { lat: -2.5916, lng: 140.6690, nama: "Kota Jayapura" }
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
// 3. FITUR AL-QUR'AN DIGITAL & PENCARIAN SURAH
// ==========================================================================
async function ambilDataSurat() {
    const container = document.getElementById('wisata-container');
    const loading = document.getElementById('loading');

    try {
        const respon = await fetch('https://equran.id/api/v2/surat');
        const hasil = await respon.json();

        dataSemuaSurat = hasil.data || [];
        loading.style.display = 'none';

        tampilkanDaftarSurat(dataSemuaSurat);
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
                            <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${badgeColor}">
                                ${surat.tempatTurun}
                            </span>
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

function setupSearchSurah() {
    const searchInput = document.getElementById('search-surah');
    const clearBtn = document.getElementById('clear-search-surah');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', keyword === '');
        }
        filterSuratList();
    });
}

function filterSuratList() {
    const searchInput = document.getElementById('search-surah');
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let hasilFilter = dataSemuaSurat.filter(surat => {
        const matchSearch = !keyword || 
            surat.namaLatin.toLowerCase().includes(keyword) ||
            surat.arti.toLowerCase().includes(keyword) ||
            surat.nomor.toString() === keyword ||
            (surat.nama && surat.nama.includes(keyword));

        let matchType = true;
        if (surahFilterType === 'makkiyyah') {
            matchType = surat.tempatTurun.toLowerCase() === 'mekah' || surat.tempatTurun.toLowerCase() === 'makkiyyah';
        } else if (surahFilterType === 'madaniyyah') {
            matchType = surat.tempatTurun.toLowerCase() === 'madinah' || surat.tempatTurun.toLowerCase() === 'madaniyyah';
        }

        return matchSearch && matchType;
    });

    tampilkanDaftarSurat(hasilFilter);
}

function resetSearchSurah() {
    const searchInput = document.getElementById('search-surah');
    const clearBtn = document.getElementById('clear-search-surah');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    filterSuratList();
}

function quickFilterSurah(nama) {
    const searchInput = document.getElementById('search-surah');
    const clearBtn = document.getElementById('clear-search-surah');
    if (searchInput) {
        searchInput.value = nama;
        if (clearBtn) clearBtn.classList.remove('hidden');
        filterSuratList();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
        modalSubtitle.innerText = `${data.arti} • ${data.jumlahAyat} Ayat • Diturunkan di ${data.tempatTurun}`;
        if (modalBadge) modalBadge.innerText = `Surat #${data.nomor}`;

        if (audioPlayer && data.audioFull) {
            const audioUrl = data.audioFull['05'] || data.audioFull['01'] || Object.values(data.audioFull)[0];
            audioPlayer.src = audioUrl;
        }

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

    if (audioPlayer.paused) {
        audioPlayer.play().then(() => {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            statusLabel.textContent = "Sedang Memutar Murottal";
        }).catch(err => {
            console.error("Gagal play audio:", err);
            tampilkanToast("Gagal memutar audio murottal.");
        });
    } else {
        audioPlayer.pause();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        statusLabel.textContent = "Murottal Dijeda";
    }

    audioPlayer.onended = () => {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        statusLabel.textContent = "Putar Murottal Lengkap";
    };
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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            tutupModal();
            tutupModalDoa();
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
});
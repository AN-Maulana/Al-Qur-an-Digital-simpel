const container = document.getElementById('wisata-container');

const loading = document.getElementById('loading');

const modal = document.getElementById('modal-surat');



// 1. Fungsi Mengambil Daftar Surat

async function ambilDataSurat() {

    try {

        const respon = await fetch('https://equran.id/api/v2/surat');

        const hasil = await respon.json();

       

        // Log ke konsol sesuai permintaanmu

        console.log("Berhasil mengambil daftar surat:", hasil.data);



        const daftarSurat = hasil.data;

        loading.style.display = 'none';



        daftarSurat.forEach(surat => {

            const card = `

                <div class="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-emerald-600 flex flex-col justify-between transform hover:-translate-y-1">

                    <div>

                        <div class="flex justify-between items-start mb-4">

                            <div class="bg-emerald-100 text-emerald-700 font-bold w-10 h-10 flex items-center justify-center rounded-full shadow-inner">

                                ${surat.nomor}

                            </div>

                            <div class="text-right">

                                <h2 class="text-2xl font-bold text-gray-800">${surat.namaLatin}</h2>

                                <p class="text-emerald-600 text-2xl font-serif-arabic mt-1">${surat.nama}</p>

                            </div>

                        </div>

                        <div class="space-y-2 border-t border-emerald-50 pt-4">

                            <p class="text-gray-600 text-sm italic">"${surat.arti}"</p>

                            <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest">

                                ${surat.jumlahAyat} Ayat • ${surat.tempatTurun}

                            </p>

                        </div>

                    </div>

                    <button onclick="bacaSurat(${surat.nomor})" class="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg active:scale-95">

                        BACA SURAT

                    </button>

                </div>

            `;

            container.innerHTML += card;

        });

    } catch (error) {

        console.error("Terjadi kesalahan:", error);

        loading.innerHTML = `<p class="text-red-500 font-bold">Gagal memuat data. Periksa koneksi internet.</p>`;

    }

}



// 2. Fungsi Mengambil Isi Ayat

async function bacaSurat(nomor) {

    const modalContent = document.getElementById('modal-content');

    const modalTitle = document.getElementById('modal-title');

    const modalSubtitle = document.getElementById('modal-subtitle');

   

    // Munculkan Modal

    modal.classList.remove('hidden');

    document.body.style.overflow = 'hidden'; // Kunci scroll layar belakang

   

    // Loading di dalam modal

    modalTitle.innerText = "Memuat...";

    modalSubtitle.innerText = "";

    modalContent.innerHTML = '<div class="flex justify-center py-20"><div class="loader"></div></div>';



    try {

        const respon = await fetch(`https://equran.id/api/v2/surat/${nomor}`);

        const hasil = await respon.json();

        const data = hasil.data;



        console.log(`Menampilkan Surat: ${data.namaLatin}`, data);



        modalTitle.innerText = data.namaLatin;

        modalSubtitle.innerText = `${data.arti} • ${data.jumlahAyat} Ayat`;

       

        modalContent.innerHTML = '';



        // Looping Ayat

        data.ayat.forEach(ayat => {

            modalContent.innerHTML += `

                <div class="border-b border-emerald-100 pb-8 last:border-0">

                    <div class="flex flex-row-reverse items-start gap-6 mb-6">

                        <div class="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold shadow-md">

                            ${ayat.nomorAyat}

                        </div>

                        <p class="text-right text-4xl leading-[2.8] font-serif-arabic text-gray-800 w-full" dir="rtl">

                            ${ayat.teksArab}

                        </p>

                    </div>

                    <div class="pl-4 border-l-4 border-emerald-200">

                        <p class="text-emerald-700 text-sm mb-2 font-bold tracking-wide">${ayat.teksLatin}</p>

                        <p class="text-gray-700 text-lg leading-relaxed">${ayat.teksIndonesia}</p>

                    </div>

                </div>

            `;

        });



        // Scroll modal kembali ke paling atas

        modalContent.scrollTop = 0;



    } catch (error) {

        console.error("Gagal memuat ayat:", error);

        modalContent.innerHTML = `<p class="text-red-500 text-center font-bold">Gagal mengambil data ayat.</p>`;

    }

}



// 3. Fungsi Tutup Modal

function tutupModal() {

    modal.classList.add('hidden');

    document.body.style.overflow = 'auto'; // Aktifkan scroll layar belakang kembali

}



// Jalankan Fungsi Utama

document.addEventListener('DOMContentLoaded', ambilDataSurat);
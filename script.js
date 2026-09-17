let parsedData = [];

// Inisialisasi saat halaman dimuat (Cek data Share Link)
window.addEventListener('DOMContentLoaded', () => {
    checkUrlForSharedData();
});

// Event Listener Drag & Drop File CSV
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('csvFileInput');

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processCSV(e.target.files[0]);
    });
}

if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ec4899';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'rgba(167, 139, 250, 0.5)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(167, 139, 250, 0.5)';
        if (e.dataTransfer.files.length > 0) processCSV(e.dataTransfer.files[0]);
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        document.getElementById('toastMsg').innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

function processCSV(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        parseCSVText(e.target.result);
        showToast('Data CSV berhasil diunggah & dinilai!');
    };
    reader.readAsText(file);
}

// Parsing Baris CSV dengan Handler Tanda Kutip
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += c;
        }
    }
    result.push(cell.trim());
    return result;
}

// Evaluasi Kriteria Jawaban Esai 1 (Maksimal 15 Poin)
function evaluateEssay1(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    let score = 0;

    const hasRedundansi = str.includes('redundansi') || str.includes('pengulangan');
    const hasInsert = str.includes('insert') || str.includes('tambah');
    const hasDelete = str.includes('delete') || str.includes('hapus');
    const hasUpdate = str.includes('update') || str.includes('ubah');

    if (hasRedundansi && (hasInsert || hasDelete || hasUpdate)) {
        score += 5;
    } else if (hasRedundansi || hasInsert || hasDelete || hasUpdate) {
        score += 2.5;
    }

    const hasPelanggan = str.includes('tabel_pelanggan') || str.includes('pelanggan');
    const hasBarang = str.includes('tabel_barang') || str.includes('barang');
    const hasTransaksi = str.includes('tabel_transaksi') || str.includes('transaksi');
    const hasDetail = str.includes('tabel_detail') || str.includes('detail');

    if (hasPelanggan && hasBarang && (hasTransaksi || hasDetail)) {
        score += 5;
    } else if (hasPelanggan || hasBarang || hasTransaksi) {
        score += 2.5;
    }

    const hasCreate = str.includes('create table');
    const hasPK = str.includes('primary key');
    const hasAuto = str.includes('auto_increment');

    if (hasCreate && (hasPK || hasAuto)) {
        score += 5;
    } else if (hasCreate) {
        score += 2.5;
    }

    return Math.min(15, score);
}

// Evaluasi Kriteria Jawaban Esai 2 (Maksimal 15 Poin)
function evaluateEssay2(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    let score = 0;

    const hasClient = str.includes('client-side') || str.includes('client');
    const hasBrowser = str.includes('browser') || str.includes('peramban') || str.includes('html') || str.includes('css') || str.includes('js');
    const hasServer = str.includes('server-side') || str.includes('server') || str.includes('php') || str.includes('node');

    if (hasClient && hasServer && hasBrowser) {
        score += 7.5;
    } else if (hasClient || hasServer) {
        score += 4;
    }

    const hasSkenario = str.includes('transaksi') || str.includes('pembayaran') || str.includes('autentikasi') || str.includes('kata sandi') || str.includes('password');
    const hasAlasan = str.includes('developer tools') || str.includes('inspeksi') || str.includes('manipulasi') || str.includes('validasi') || str.includes('sensitif');

    if (hasSkenario && hasAlasan) {
        score += 7.5;
    } else if (hasSkenario || hasAlasan) {
        score += 4;
    }

    return Math.min(15, score);
}

// Membaca Teks CSV dan Mengabaikan Baris/Kolom Kosong
function parseCSVText(csvText) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
        alert('File CSV tidak berisi data yang valid!');
        return;
    }

    parsedData = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Abaikan baris kosong

        const cols = parseCSVLine(lines[i]);
        
        // Lewati jika kolom nama peserta kosong
        if (!cols[2] || cols[2].trim() === '') continue;

        const timestamp = cols[0] || '-';
        const noAbsen = cols[1] || `${i}`;
        const namaLengkap = cols[2].trim().toUpperCase();
        const nilaiPG = parseFloat(cols[3]) || 0;
        const jawabanEsai1 = cols[4] || '';
        const jawabanEsai2 = cols[5] || '';

        const scoreEsai1 = evaluateEssay1(jawabanEsai1);
        const scoreEsai2 = evaluateEssay2(jawabanEsai2);

        parsedData.push({
            timestamp,
            noAbsen,
            name: namaLengkap,
            nilaiPG,
            scoreEsai1,
            scoreEsai2
        });
    }

    if (parsedData.length === 0) {
        alert('Tidak ditemukan data peserta yang valid pada file CSV.');
        return;
    }

    const configBox = document.getElementById('configBox');
    if (configBox) configBox.style.display = 'none';

    calculateAndRender();
}

// Mengalkulasi Skor & Menampilkan Hasil Kinerja serta Rangking
function calculateAndRender() {
    if (parsedData.length === 0) return;

    let computed = parsedData.map(item => {
        const total = item.nilaiPG + item.scoreEsai1 + item.scoreEsai2;

        return {
            ...item,
            totalScore: Math.round(total * 100) / 100
        };
    });

    // Urutkan Peringkat Berdasarkan Total Nilai Tertinggi
    computed.sort((a, b) => b.totalScore - a.totalScore);

    // Update Statistik Ringkasan
    document.getElementById('statTotal').innerText = computed.length;
    document.getElementById('statMax').innerText = computed[0].totalScore;
    const avgAll = computed.reduce((acc, curr) => acc + curr.totalScore, 0) / computed.length;
    document.getElementById('statAvg').innerText = (Math.round(avgAll * 10) / 10);

    // Header Tabel
    const thHeader = document.getElementById('tableHeader');
    if (thHeader) {
        thHeader.style.display = 'grid';
        thHeader.innerHTML = `
            <div>Rank</div>
            <div>No. Absen & Nama</div>
            <div style="text-align:center;">Nilai PG</div>
            <div style="text-align:center;">Esai 1 (Max 15)</div>
            <div style="text-align:center;">Esai 2 (Max 15)</div>
            <div style="text-align:center;">Total Nilai</div>
        `;
    }

    // Render Podium Top 3 (Tampilkan hanya sesuai jumlah peserta yang ada)
    const podiumContainer = document.getElementById('podiumContainer');
    const pod1 = document.getElementById('podium1');
    const pod2 = document.getElementById('podium2');
    const pod3 = document.getElementById('podium3');

    if (podiumContainer) {
        podiumContainer.style.display = 'flex';

        // Rank 1
        if (computed[0]) {
            document.getElementById('name1').innerText = computed[0].name;
            document.getElementById('score1').innerText = computed[0].totalScore;
            document.getElementById('avatar1').innerText = computed[0].noAbsen;
            if (pod1) pod1.style.display = 'flex';
        }

        // Rank 2
        if (computed[1]) {
            document.getElementById('name2').innerText = computed[1].name;
            document.getElementById('score2').innerText = computed[1].totalScore;
            document.getElementById('avatar2').innerText = computed[1].noAbsen;
            if (pod2) pod2.style.display = 'flex';
        } else if (pod2) {
            pod2.style.display = 'none'; // Sembunyikan jika peserta kurang dari 2
        }

        // Rank 3
        if (computed[2]) {
            document.getElementById('name3').innerText = computed[2].name;
            document.getElementById('score3').innerText = computed[2].totalScore;
            document.getElementById('avatar3').innerText = computed[2].noAbsen;
            if (pod3) pod3.style.display = 'flex';
        } else if (pod3) {
            pod3.style.display = 'none'; // Sembunyikan jika peserta kurang dari 3
        }
    }

    // Render Baris Daftar Ranking
    const listContainer = document.getElementById('leaderboardList');
    listContainer.innerHTML = '';

    computed.forEach((item, index) => {
        const rank = index + 1;
        const card = document.createElement('div');
        card.className = `rank-card rank-${rank <= 3 ? rank : 'other'}`;
        card.style.gridTemplateColumns = '50px 2.5fr 1fr 1fr 1fr 1.2fr';

        card.innerHTML = `
            <div class="rank-badge">${rank}</div>
            <div class="participant-info">
                <div class="avatar-mini">${item.noAbsen}</div>
                <div>
                    <div class="p-name">${item.name}</div>
                    <small style="font-size:0.75rem; color:#94a3b8;">${item.timestamp}</small>
                </div>
            </div>
            <div class="metric-val">${item.nilaiPG}</div>
            <div class="metric-val" style="color: #38bdf8;">${item.scoreEsai1}</div>
            <div class="metric-val" style="color: #38bdf8;">${item.scoreEsai2}</div>
            <div class="total-score-badge">${item.totalScore}</div>
        `;
        listContainer.appendChild(card);
    });
}

// Fitur Bagikan Link Hasil
function shareResults() {
    if (parsedData.length === 0) {
        alert('Silakan muat file CSV terlebih dahulu!');
        return;
    }

    const compactData = parsedData.map(item => [
        item.timestamp,
        item.noAbsen,
        item.name,
        item.nilaiPG,
        item.scoreEsai1,
        item.scoreEsai2
    ]);

    const jsonStr = JSON.stringify(compactData);
    const encodedData = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    const shareableUrl = `${window.location.origin}${window.location.pathname}#data=${encodedData}`;

    if (navigator.share) {
        navigator.share({
            title: 'Leaderboard Hasil Ujian',
            text: 'Cek hasil nilai dan peringkat ujian di sini:',
            url: shareableUrl
        }).catch(() => {
            copyToClipboard(shareableUrl);
        });
    } else {
        copyToClipboard(shareableUrl);
    }
}

function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link hasil leaderboard berhasil disalin!');
    }).catch(() => {
        prompt('Salin link berikut untuk membagikan hasil:', url);
    });
}

// Membaca Data Terbagikan Dari URL Hash
function checkUrlForSharedData() {
    const hash = window.location.hash;
    if (hash && hash.includes('#data=')) {
        try {
            const rawData = hash.replace('#data=', '');
            const decodedJson = decodeURIComponent(escape(atob(decodeURIComponent(rawData))));
            const compactData = JSON.parse(decodedJson);

            parsedData = compactData.map(cols => ({
                timestamp: cols[0],
                noAbsen: cols[1],
                name: cols[2],
                nilaiPG: cols[3],
                scoreEsai1: cols[4],
                scoreEsai2: cols[5]
            }));

            calculateAndRender();
            showToast('Menampilkan data leaderboard dari link bagikan!');
        } catch (e) {
            console.error('Gagal membaca data share link:', e);
        }
    }
}

// Unduh Template File CSV Kosong (Khusus Penggunaan Pengajar/Admin)
function downloadSampleCSV() {
    const sampleCSV = `Timestamp,No Absen,Nama Lengkap,Nilai PG,Jawaban Esai 1,Jawaban Esai 2
2026-09-17 08:00,01,NAMA SISWA LENGKAP,70,"Isi jawaban esai 1","Isi jawaban esai 2"`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_ujian_6kolom.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template CSV berhasil diunduh!');
}

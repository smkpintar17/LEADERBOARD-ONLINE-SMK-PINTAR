let parsedData = [];

// Inisialisasi saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    checkUrlForSharedData();
});

// Drag & Drop File CSV
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
        showToast('Data CSV berhasil diproses & dinilai!');
    };
    reader.readAsText(file);
}

// Parser Baris CSV Presisi
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

// Evaluasi Esai 1 (Max 15)
function evaluateEssay1(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    let score = 0;

    if (str.includes('redundansi') || str.includes('pengulangan')) score += 5;
    if (str.includes('pelanggan') || str.includes('transaksi') || str.includes('barang')) score += 5;
    if (str.includes('create table') || str.includes('primary key')) score += 5;

    return Math.min(15, score);
}

// Evaluasi Esai 2 (Max 15)
function evaluateEssay2(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    let score = 0;

    if (str.includes('client') || str.includes('browser')) score += 7.5;
    if (str.includes('server') || str.includes('transaksi') || str.includes('autentikasi')) score += 7.5;

    return Math.min(15, score);
}

// Parsing CSV Presisi - Hanya Memproses Peserta Asli
function parseCSVText(csvText) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
        alert('File CSV tidak berisi data yang valid!');
        return;
    }

    parsedData = [];

    for (let i = 1; i < lines.length; i++) {
        const lineStr = lines[i].trim();
        if (!lineStr) continue;

        const cols = parseCSVLine(lineStr);
        
        // VALIDASI KETAT: Abaikan baris kosong atau nama fiktif/pendek
        const rawNama = cols[2] ? cols[2].trim() : '';
        if (!rawNama || rawNama.length < 2 || rawNama.toUpperCase().includes('NAMA SISWA')) {
            continue; 
        }

        const timestamp = cols[0] || '-';
        const noAbsen = cols[1] || `${parsedData.length + 1}`;
        const namaLengkap = rawNama.toUpperCase();
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
        alert('Tidak ditemukan data peserta valid pada file CSV.');
        return;
    }

    const configBox = document.getElementById('configBox');
    if (configBox) configBox.style.display = 'none';

    calculateAndRender();
}

// Mengolah Nilai & Menampilkan Tampilan Top 10 + List 11+
function calculateAndRender() {
    if (parsedData.length === 0) return;

    // Hitung total skor
    let computed = parsedData.map(item => {
        const total = item.nilaiPG + item.scoreEsai1 + item.scoreEsai2;
        return {
            ...item,
            totalScore: Math.round(total * 100) / 100
        };
    });

    // Urutkan dari nilai tertinggi ke terendah
    computed.sort((a, b) => b.totalScore - a.totalScore);

    // Update Statistik
    document.getElementById('statTotal').innerText = computed.length; 
    document.getElementById('statMax').innerText = computed[0].totalScore;
    
    const sumAll = computed.reduce((acc, curr) => acc + curr.totalScore, 0);
    const avgAll = sumAll / computed.length;
    document.getElementById('statAvg').innerText = (Math.round(avgAll * 10) / 10);

    // PEMISAHAN DATA: TOP 10 DAN LIST 11+
    const top10Data = computed.slice(0, 10);
    const remainingData = computed.slice(10);

    // RENDER PODIUM TOP 10
    renderPodiumTop10(top10Data);

    // RENDER LIST KINERJA (PESERTA RANKING 11 KETAS)
    renderRemainingList(remainingData);
}

// Fungsi Render Kartu/Podium Khusus Rangking 1 - 10
function renderPodiumTop10(top10Data) {
    const podiumContainer = document.getElementById('podiumContainer');
    if (!podiumContainer) return;

    podiumContainer.style.display = 'flex';
    podiumContainer.style.flexWrap = 'wrap';
    podiumContainer.style.justifyContent = 'center';
    podiumContainer.style.gap = '15px';
    podiumContainer.innerHTML = ''; // Reset container

    top10Data.forEach((item, index) => {
        const rank = index + 1;
        const card = document.createElement('div');
        
        // Styling spesifik berdasarkan tingkat peringkat
        let rankColor = '#94a3b8';
        if (rank === 1) rankColor = '#f59e0b'; // Emas
        else if (rank === 2) rankColor = '#94a3b8'; // Perak
        else if (rank === 3) rankColor = '#d97706'; // Perunggu
        else if (rank <= 10) rankColor = '#8b5cf6'; // Ungu untuk Rank 4-10

        card.className = `podium-card rank-${rank}`;
        card.style.cssText = `
            background: rgba(30, 27, 75, 0.6);
            border: 2px solid ${rankColor};
            border-radius: 12px;
            padding: 12px;
            width: 180px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            position: relative;
        `;

        card.innerHTML = `
            <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: ${rankColor}; color: #fff; font-weight: bold; border-radius: 20px; padding: 2px 10px; font-size: 0.8rem;">
                JUARA ${rank}
            </div>
            <div style="margin-top: 10px; font-size: 1.2rem; font-weight: bold; color: #38bdf8;">${item.noAbsen}</div>
            <div style="font-weight: 600; color: #f8fafc; font-size: 0.85rem; margin: 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.name}">${item.name}</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #4ade80;">${item.totalScore}</div>
        `;

        podiumContainer.appendChild(card);
    });
}

// Fungsi Render Tabel Daftar Peserta Rangking 11 dan Seterusnya
function renderRemainingList(remainingData) {
    const listContainer = document.getElementById('leaderboardList');
    const thHeader = document.getElementById('tableHeader');

    if (!listContainer) return;
    listContainer.innerHTML = '';

    // Jika peserta tidak melebihi 10, sembunyikan header tabel list
    if (remainingData.length === 0) {
        if (thHeader) thHeader.style.display = 'none';
        return;
    }

    if (thHeader) {
        thHeader.style.display = 'grid';
        thHeader.innerHTML = `
            <div>Rank</div>
            <div>No. Absen & Nama</div>
            <div style="text-align:center;">Nilai PG</div>
            <div style="text-align:center;">Esai 1</div>
            <div style="text-align:center;">Esai 2</div>
            <div style="text-align:center;">Total Nilai</div>
        `;
    }

    remainingData.forEach((item, index) => {
        const actualRank = index + 11; // Melanjutkan nomor urut dari rank 11
        const card = document.createElement('div');
        card.className = 'rank-card rank-other';
        card.style.gridTemplateColumns = '50px 2.5fr 1fr 1fr 1fr 1.2fr';

        card.innerHTML = `
            <div class="rank-badge">${actualRank}</div>
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

// Fitur Sharing Web Link
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

let parsedData = [];

// Inisialisasi saat halaman dimuat (Cek data Share Link)
window.addEventListener('DOMContentLoaded', () => {
    checkUrlForSharedData();
});

// Event Listener Drag & Drop
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
        showToast('Data CSV berhasil diunggah & dinilai otomatis!');
    };
    reader.readAsText(file);
}

// Fungsi Parse Baris CSV
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

// Evaluasi Jawaban Esai 1 (Maksimal 15 Poin)
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

// Evaluasi Jawaban Esai 2 (Maksimal 15 Poin)
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

function parseCSVText(csvText) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
        alert('File CSV minimal harus berisi header dan 1 baris data!');
        return;
    }

    parsedData = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const cols = parseCSVLine(lines[i]);

        const timestamp = cols[0] || '-';
        const noAbsen = cols[1] || `${i}`;
        const namaLengkap = (cols[2] || `SISWA ${i}`).toUpperCase();
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

    const configBox = document.getElementById('configBox');
    if (configBox) configBox.style.display = 'none';

    calculateAndRender();
}

function calculateAndRender() {
    if (parsedData.length === 0) return;

    let computed = parsedData.map(item => {
        const total = item.nilaiPG + item.scoreEsai1 + item.scoreEsai2;

        return {
            ...item,
            totalScore: Math.round(total * 100) / 100
        };
    });

    computed.sort((a, b) => b.totalScore - a.totalScore);

    // Update Statistik
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

    // Render 3D Podium Top 3
    const podiumContainer = document.getElementById('podiumContainer');
    if (podiumContainer && computed.length >= 1) {
        podiumContainer.style.display = 'flex';
        
        // Rank 1
        document.getElementById('name1').innerText = computed[0].name;
        document.getElementById('score1').innerText = computed[0].totalScore;
        document.getElementById('avatar1').innerText = computed[0].noAbsen;

        // Rank 2
        if (computed[1]) {
            document.getElementById('name2').innerText = computed[1].name;
            document.getElementById('score2').innerText = computed[1].totalScore;
            document.getElementById('avatar2').innerText = computed[1].noAbsen;
            document.getElementById('podium2').style.visibility = 'visible';
        } else {
            document.getElementById('podium2').style.visibility = 'hidden';
        }

        // Rank 3
        if (computed[2]) {
            document.getElementById('name3').innerText = computed[2].name;
            document.getElementById('score3').innerText = computed[2].totalScore;
            document.getElementById('avatar3').innerText = computed[2].noAbsen;
            document.getElementById('podium3').style.visibility = 'visible';
        } else {
            document.getElementById('podium3').style.visibility = 'hidden';
        }
    }

    // Render Baris Leaderboard
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

// PERBAIKAN: EKSPOR GAMBAR PNG/JPG (Anti-Blank & Bebas Error)
function exportToImage(format = 'jpeg') {
    if (parsedData.length === 0) {
        alert('Silakan muat data CSV terlebih dahulu!');
        return;
    }

    showToast('Sedang memproses gambar...');
    
    // Gunakan area yang merangkum seluruh hasil/tabel
    const exportArea = document.getElementById('export-container') || document.body;

    // html2canvas render steril
    html2canvas(exportArea, {
        scale: 2, // Kualitas HD
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f0c20', // Sesuai tema kegelapan dashboard
        logging: false
    }).then(canvas => {
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const ext = format === 'png' ? 'png' : 'jpg';
        const fileName = `Leaderboard_Ujian_${new Date().toISOString().slice(0, 10)}.${ext}`;

        // Mengonversi langsung ke Data URL untuk kompatibilitas penuh
        const dataUrl = canvas.toDataURL(mimeType, 0.95);

        // Langsung eksekusi unduh link
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Gambar leaderboard berhasil diunduh!');
    }).catch(err => {
        console.error("Export Error:", err);
        alert('Gagal mengekspor gambar. Pastikan pustaka html2canvas telah dimuat.');
    });
}

function exportToJPG() {
    exportToImage('jpeg');
}

function exportToPNG() {
    exportToImage('png');
}

// FITUR SHARING WEB LINK
function shareResults() {
    if (parsedData.length === 0) {
        alert('Silakan muat data CSV terlebih dahulu!');
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
            text: 'Cek hasil nilai dan peringkat ujian terbaru di sini:',
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

// Load Sampel Data Demo
function loadSampleData() {
    const sampleCSV = `Timestamp,No Absen,Nama Lengkap,Nilai PG,Jawaban Esai 1,Jawaban Esai 2
2026-09-17 08:00,01,Ahmad Fauzi,70,"Redundansi pengulangan data nama pelanggan. Anomali insert, delete, update. Normalisasi 3NF Tabel_Pelanggan, Tabel_Barang, Tabel_Transaksi. SQL CREATE TABLE Pelanggan (ID_Pelanggan INT AUTO_INCREMENT PRIMARY KEY);","Client-Side dieksekusi di browser HTML/CSS/JS. Server-Side di server PHP. Skenario transaksi pembayaran keamanan dan autentikasi kata sandi di developer tools."
2026-09-17 08:02,02,Budi Santoso,65,"Pengulangan data redundansi. SQL CREATE TABLE Pelanggan","Client-Side di browser. Server-Side di server."
2026-09-17 08:05,03,Citra Dewi,70,"Jawaban tidak lengkap","Hanya client side saja"
2026-09-17 08:10,04,Dian Pratama,70,"Redundansi pengulangan data dan anomali insert delete update. Tabel_Pelanggan, Tabel_Barang, Tabel_Transaksi. CREATE TABLE Pelanggan (ID_Pelanggan INT AUTO_INCREMENT PRIMARY KEY);","Client-Side browser tampilan. Server-Side PHP database. Keamanan transaksi pembayaran online dan autentikasi kata sandi agar tidak dapat dimanipulasi dari developer tools."`;

    parseCSVText(sampleCSV);
    showToast('Data sampel hasil ujian berhasil dimuat!');
}

// Download Template CSV
function downloadSampleCSV() {
    const sampleCSV = `Timestamp,No Absen,Nama Lengkap,Nilai PG,Jawaban Esai 1,Jawaban Esai 2
2026-09-17 08:00,01,NAMA SISWA LENGKAP,70,"Jawaban Esai 1...","Jawaban Esai 2..."`;

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

let parsedData = [];
let headers = ['Timestamp', 'No Absen', 'Nama Lengkap', 'Nilai PG', 'Jawaban Esai 1', 'Jawaban Esai 2'];
let weights = [1, 1, 1]; // Bobot Nilai PG, Esai 1, Esai 2

// Event Listener Drag & Drop File CSV
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('csvFileInput');

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processCSV(e.target.files[0]);
});

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

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function processCSV(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        parseCSVText(e.target.result);
        showToast('Data CSV berhasil diunggah dan dinilai!');
    };
    reader.readAsText(file);
}

// Logika Evaluasi Jawaban Esai 1 (Kunci Jawaban 1A, 1B, 1C)
function evaluateEssay1(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    
    // Pengecekan Kata Kunci Utama
    const hasRedundansi = str.includes('redundansi') || str.includes('pengulangan');
    const hasAnomali = str.includes('anomali') || (str.includes('insert') && str.includes('delete') && str.includes('update'));
    const hasNormalisasi = str.includes('tabel_pelanggan') || str.includes('tabel_barang') || str.includes('3nf') || str.includes('normalisasi');
    const hasDDL = str.includes('create table') || str.includes('auto_increment') || str.includes('primary key');

    // Jika memenuhi indikator jawaban esai 1
    if ((hasRedundansi && hasAnomali) || (hasNormalisasi && hasDDL) || (hasRedundansi && hasDDL)) {
        return 15;
    } else if (hasRedundansi || hasAnomali || hasNormalisasi || hasDDL) {
        return 8; // Nilai parsial jika hanya sebagian tepat
    }
    return 0;
}

// Logika Evaluasi Jawaban Esai 2 (Kunci Jawaban 2A, 2B)
function evaluateEssay2(text) {
    if (!text) return 0;
    const str = text.toLowerCase();

    // Pengecekan Kata Kunci Utama
    const hasClientServer = str.includes('client-side') && str.includes('server-side');
    const hasBrowser = str.includes('browser') || str.includes('peramban') || str.includes('html/css/js');
    const hasServer = str.includes('server') || str.includes('php') || str.includes('node.js') || str.includes('basis data');
    const hasKeamanan = str.includes('transaksi') || str.includes('autentikasi') || str.includes('sensitif') || str.includes('validasi') || str.includes('developer tools');

    // Jika memenuhi indikator jawaban esai 2
    if ((hasClientServer && hasKeamanan) || (hasBrowser && hasServer && hasKeamanan)) {
        return 15;
    } else if (hasClientServer || hasBrowser || hasServer || hasKeamanan) {
        return 8; // Nilai parsial jika hanya sebagian tepat
    }
    return 0;
}

function parseCSVText(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        alert('File CSV minimal harus berisi header dan 1 baris data!');
        return;
    }

    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    headers = rawHeaders.slice(0, 6);

    parsedData = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Memisahkan CSV dengan memperhatikan tanda kutip
        const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

        const timestamp = cleanCols[0] || '-';
        const noAbsen = cleanCols[1] || `${i}`;
        const namaLengkap = cleanCols[2] || `Siswa ${i}`;
        const nilaiPG = parseFloat(cleanCols[3]) || 0;
        const jawabanEsai1 = cleanCols[4] || '';
        const jawabanEsai2 = cleanCols[5] || '';

        // Hitung Otomatis Nilai Esai Berdasarkan Kunci Jawaban
        const scoreEsai1 = evaluateEssay1(jawabanEsai1);
        const scoreEsai2 = evaluateEssay2(jawabanEsai2);

        parsedData.push({
            timestamp,
            noAbsen,
            name: namaLengkap,
            nilaiPG,
            scoreEsai1,
            scoreEsai2,
            jawabanEsai1,
            jawabanEsai2
        });
    }

    renderWeightInputs();
    calculateAndRender();
}

function renderWeightInputs() {
    const grid = document.getElementById('weightsGrid');
    grid.innerHTML = '';
    
    const labels = ['Bobot PG', 'Bobot Esai 1', 'Bobot Esai 2'];
    for (let i = 0; i < 3; i++) {
        const div = document.createElement('div');
        div.className = 'weight-item';
        div.innerHTML = `
            <label>${labels[i]}</label>
            <input type="number" step="0.1" value="${weights[i]}" onchange="updateWeight(${i}, this.value)">
        `;
        grid.appendChild(div);
    }
    document.getElementById('configBox').style.display = 'block';
}

function updateWeight(index, val) {
    weights[index] = parseFloat(val) || 0;
    calculateAndRender();
}

function calculateAndRender() {
    if (parsedData.length === 0) return;

    let computed = parsedData.map(item => {
        const totalPG = item.nilaiPG * weights[0];
        const totalE1 = item.scoreEsai1 * weights[1];
        const totalE2 = item.scoreEsai2 * weights[2];
        const total = totalPG + totalE1 + totalE2;

        return {
            ...item,
            totalScore: Math.round(total * 100) / 100
        };
    });

    // Urutkan nilai tertinggi ke terendah
    computed.sort((a, b) => b.totalScore - a.totalScore);

    // Update Statistik
    document.getElementById('statTotal').innerText = computed.length;
    document.getElementById('statMax').innerText = computed[0].totalScore;
    const avgAll = computed.reduce((acc, curr) => acc + curr.totalScore, 0) / computed.length;
    document.getElementById('statAvg').innerText = (Math.round(avgAll * 10) / 10);

    // Header Tabel Dynamic
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

    // Render 3D Podium (Top 3)
    if (computed.length >= 1) {
        document.getElementById('podiumContainer').style.display = 'flex';
        
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
                    <small style="font-size:0.7rem; color:#94a3b8;">${item.timestamp}</small>
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

// Muat Data Sampel Ujian
function loadSampleData() {
    const sampleCSV = `Timestamp,No Absen,Nama Lengkap,Nilai PG,Jawaban Esai 1,Jawaban Esai 2
2026-09-17 08:00,01,Ahmad Fauzi,70,"Redundansi pengulangan data nama pelanggan. Anomali insert, delete, update. Normalisasi 3NF Tabel_Pelanggan, Tabel_Barang, Tabel_Transaksi. SQL CREATE TABLE Pelanggan (ID_Pelanggan INT AUTO_INCREMENT PRIMARY KEY);","Client-Side dieksekusi di browser HTML/CSS/JS. Server-Side di server PHP/Node.js. Skenario transaksi keamanan validasi dan autentikasi."
2026-09-17 08:02,02,Budi Santoso,65,"Pengulangan data redundansi. SQL CREATE TABLE Pelanggan","Client-Side di browser. Server-Side di server."
2026-09-17 08:05,03,Citra Dewi,70,"Jawaban singkat saja","Hanya client side saja"
2026-09-17 08:10,04,Dian Pratama,70,"Terjadi redundansi data dan anomali insert delete update. Tabel_Pelanggan, Tabel_Barang, Tabel_Transaksi, Tabel_Detail_Transaksi. CREATE TABLE Pelanggan (ID_Pelanggan INT AUTO_INCREMENT PRIMARY KEY);","Client-Side browser untuk tampilan. Server-Side PHP untuk logika dan database. Penting untuk keamanan transaksi pembayaran dan autentikasi kata sandi di developer tools."`;

    parseCSVText(sampleCSV);
    showToast('Data demo hasil ujian berhasil dimuat!');
}

// Download Template CSV
function downloadSampleCSV() {
    const sampleCSV = `Timestamp,No Absen,Nama Lengkap,Nilai PG,Jawaban Esai 1,Jawaban Esai 2
2026-09-17 08:00,01,Nama Siswa 1,70,"Isi jawaban esai 1 di sini...","Isi jawaban esai 2 di sini..."`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_ujian_6kolom.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template CSV berhasil didownload!');
}

// Export Ke JPG Image
function exportToJPG() {
    if (parsedData.length === 0) {
        alert('Silakan muat data CSV terlebih dahulu!');
        return;
    }

    showToast('Sedang membuat gambar JPG...');
    const exportArea = document.getElementById('export-container');

    html2canvas(exportArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f0c20',
        logging: false
    }).then(canvas => {
        const image = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `Leaderboard_Hasil_Ujian_${new Date().toISOString().slice(0,10)}.jpg`;
        link.href = image;
        link.click();
        showToast('Gambar JPG berhasil disimpan!');
    }).catch(err => {
        console.error(err);
        alert('Gagal mengekspor gambar JPG.');
    });
}

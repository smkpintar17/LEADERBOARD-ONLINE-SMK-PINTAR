let parsedData = [];
let weights = [1, 1, 1]; // Bobot Nilai: PG, Esai 1, Esai 2

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

// Fungsi Parse Baris CSV Presisi (Mencegah nama/kolom tertukar karena tanda koma)
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

// Logika Evaluasi Jawaban Esai 1 (Kunci Jawaban 1A, 1B, 1C) -> Max 15 Poin
function evaluateEssay1(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    
    const hasRedundansi = str.includes('redundansi') || str.includes('pengulangan');
    const hasAnomali = str.includes('anomali') || (str.includes('insert') && str.includes('delete') && str.includes('update'));
    const hasNormalisasi = str.includes('tabel_pelanggan') || str.includes('3nf') || str.includes('normalisasi');
    const hasDDL = str.includes('create table') || str.includes('primary key');

    if ((hasRedundansi && hasAnomali) || (hasNormalisasi && hasDDL)) {
        return 15;
    } else if (hasRedundansi || hasAnomali || hasNormalisasi || hasDDL) {
        return 8;
    }
    return 0;
}

// Logika Evaluasi Jawaban Esai 2 (Kunci Jawaban 2A, 2B) -> Max 15 Poin
function evaluateEssay2(text) {
    if (!text) return 0;
    const str = text.toLowerCase();

    const hasClientServer = str.includes('client-side') || str.includes('server-side');
    const hasBrowser = str.includes('browser') || str.includes('peramban') || str.includes('html');
    const hasServer = str.includes('server') || str.includes('php') || str.includes('node');
    const hasKeamanan = str.includes('transaksi') || str.includes('autentikasi') || str.includes('sensitif') || str.includes('validasi');

    if ((hasClientServer && hasKeamanan) || (hasBrowser && hasServer && hasKeamanan)) {
        return 15;
    } else if (hasClientServer || hasBrowser || hasServer || hasKeamanan) {
        return 8;
    }
    return 0;
}

function parseCSVText(csvText) {
    // Regex pembagi baris presisi
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
        alert('File CSV minimal harus berisi header dan 1 baris data!');
        return;
    }

    parsedData = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const cols = parseCSVLine(lines[i]);

        // Urutan Kolom Sesuai Spesifikasi:
        // 0: Timestamp, 1: No Absen, 2: Nama Lengkap, 3: Nilai PG, 4: Esai 1, 5: Esai 2
        const timestamp = cols[0] || '-';
        const noAbsen = cols[1] || `${i}`;
        const namaLengkap = cols[2] || `Siswa ${i}`;
        const nilaiPG = parseFloat(cols[3]) || 0;
        const jawabanEsai1 = cols[4] || '';
        const jawabanEsai2 = cols[5] || '';

        // Hitung Otomatis Nilai Esai
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

    renderWeightInputs();
    calculateAndRender(); // Langsung Otomatis Hitung Hasil Saat CSV Diunggah
}

function renderWeightInputs() {
    const grid = document.getElementById('weightsGrid');
    if (!grid) return;
    
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
    const configBox = document.getElementById('configBox');
    if (configBox) configBox.style.display = 'block';
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

    // Render 3D Podium (Top 3)
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

// PERBAIKAN: Fungsi Ekspor JPG Agar Tidak Blank
function exportToJPG() {
    if (parsedData.length === 0) {
        alert('Silakan muat data CSV terlebih dahulu!');
        return;
    }

    showToast('Sedang merender gambar JPG...');
    const exportArea = document.getElementById('export-container');

    // Menggunakan pemetaan canvas eksplisit agar tidak menghasilkan layar blank
    html2canvas(exportArea, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f0c20',
        width: exportArea.offsetWidth,
        height: exportArea.offsetHeight,
        onclone: (clonedDoc) => {
            const clonedTarget = clonedDoc.getElementById('export-container');
            if (clonedTarget) {
                clonedTarget.style.transform = 'none';
                clonedTarget.style.margin = '0';
            }
        }
    }).then(canvas => {
        const image = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `Leaderboard_Hasil_Ujian_${new Date().toISOString().slice(0,10)}.jpg`;
        link.href = image;
        link.click();
        showToast('Gambar JPG berhasil diunduh!');
    }).catch(err => {
        console.error("Export Error:", err);
        alert('Terjadi kesalahan saat memproses gambar JPG.');
    });
}

// Load Demo Sample
function loadSampleData() {
    const sampleCSV = `Timestamp,No Absen,Nama Lengkap,Nilai PG,Jawaban Esai 1,Jawaban Esai 2
2026-09-17 08:00,01,Ahmad Fauzi,70,"Redundansi pengulangan data nama pelanggan. Anomali insert, delete, update. Normalisasi 3NF Tabel_Pelanggan, Tabel_Barang. SQL CREATE TABLE Pelanggan (ID_Pelanggan INT AUTO_INCREMENT PRIMARY KEY);","Client-Side dieksekusi di browser HTML/CSS/JS. Server-Side di server PHP. Skenario transaksi keamanan validasi dan autentikasi."
2026-09-17 08:02,02,Budi Santoso,65,"Pengulangan data redundansi. SQL CREATE TABLE Pelanggan","Client-Side di browser. Server-Side di server."
2026-09-17 08:05,03,Citra Dewi,70,"Hanya jawaban singkat","Tidak ada"
2026-09-17 08:10,04,Dian Pratama,70,"Terjadi redundansi data dan anomali insert delete update. Normalisasi 3NF Tabel_Pelanggan, Tabel_Barang. CREATE TABLE Pelanggan (ID_Pelanggan INT PRIMARY KEY);","Client-Side browser tampilan. Server-Side PHP database. Keamanan transaksi pembayaran autentikasi kata sandi developer tools."`;

    parseCSVText(sampleCSV);
    showToast('Data sampel hasil ujian berhasil dimuat!');
}

// Download Template CSV
function downloadSampleCSV() {
    const sampleCSV = `Timestamp,No Absen,Nama Lengkap,Nilai PG,Jawaban Esai 1,Jawaban Esai 2
2026-09-17 08:00,01,Nama Siswa Lengkap,70,"Jawaban Esai 1...","Jawaban Esai 2..."`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_ujian_6kolom.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template CSV diunduh!');
}

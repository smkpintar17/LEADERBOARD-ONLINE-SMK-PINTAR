let parsedData = [];

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', () => {
    initUploadListeners();
    checkUrlForSharedData();
});

function initUploadListeners() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('csvFileInput');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                processCSV(e.target.files[0]);
            }
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
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processCSV(e.dataTransfer.files[0]);
            }
        });

        // Klik pada area dropzone juga memicu input file
        dropzone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        const msgElem = document.getElementById('toastMsg');
        if (msgElem) msgElem.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

function processCSV(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Hapus UTF-8 BOM jika ada
            let text = e.target.result;
            if (text.startsWith('\uFEFF')) {
                text = text.slice(1);
            }
            parseCSVText(text);
            showToast('Data CSV berhasil diunggah & dinilai!');
        } catch (err) {
            console.error('Error membaca CSV:', err);
            alert('Gagal memproses file CSV! Pastikan format file sesuai.');
        }
    };
    reader.onerror = function() {
        alert('Terjadi kesalahan saat membaca file.');
    };
    reader.readAsText(file, 'UTF-8');
}

// Evaluasi Esai 1 (Max 15 Poin)
function evaluateEssay1(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    let score = 0;

    const hasRedundansi = str.includes('redundansi') || str.includes('pengulangan');
    const hasAnomali = str.includes('anomali') || str.includes('insert') || str.includes('delete') || str.includes('update');
    if (hasRedundansi && hasAnomali) score += 5;
    else if (hasRedundansi || hasAnomali) score += 2.5;

    const hasPelanggan = str.includes('pelanggan');
    const hasBarang = str.includes('barang');
    const hasTransaksi = str.includes('transaksi');
    if (hasPelanggan && hasBarang && hasTransaksi) score += 5;
    else if (hasPelanggan || hasBarang || hasTransaksi) score += 2.5;

    const hasCreate = str.includes('create table');
    const hasPK = str.includes('primary key') || str.includes('auto_increment');
    if (hasCreate && hasPK) score += 5;
    else if (hasCreate) score += 2.5;

    return Math.min(15, score);
}

// Evaluasi Esai 2 (Max 15 Poin)
function evaluateEssay2(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    let score = 0;

    const hasClient = str.includes('client') || str.includes('browser') || str.includes('peramban') || str.includes('html') || str.includes('css') || str.includes('js');
    const hasServer = str.includes('server') || str.includes('php') || str.includes('node');
    if (hasClient && hasServer) score += 7.5;
    else if (hasClient || hasServer) score += 3.75;

    const hasSkenario = str.includes('transaksi') || str.includes('pembayaran') || str.includes('autentikasi') || str.includes('sandi') || str.includes('password');
    const hasAlasan = str.includes('developer tools') || str.includes('inspeksi') || str.includes('manipulasi') || str.includes('sensitif') || str.includes('validasi');
    if (hasSkenario && hasAlasan) score += 7.5;
    else if (hasSkenario || hasAlasan) score += 3.75;

    return Math.min(15, score);
}

// Robust CSV Parser (Deteksi otomatis pemisah koma `,` atau titik-koma `;`)
function parseCSVToRows(text) {
    // Cek pemisah dominan
    const sample = text.slice(0, 1000);
    const countComma = (sample.match(/,/g) || []).length;
    const countSemicolon = (sample.match(/;/g) || []).length;
    const delimiter = countSemicolon > countComma ? ';' : ',';

    const rows = [[]];
    let quote = false;
    let cell = '';

    for (let i = 0; i < text.length; i++) {
        let cc = text[i];
        let nc = text[i + 1];

        if (cc === '"') {
            if (quote && nc === '"') {
                cell += '"';
                i++;
            } else {
                quote = !quote;
            }
        } else if (cc === delimiter && !quote) {
            rows[rows.length - 1].push(cell.trim());
            cell = '';
        } else if ((cc === '\r' || cc === '\n') && !quote) {
            if (cc === '\r' && nc === '\n') i++;
            rows[rows.length - 1].push(cell.trim());
            cell = '';
            rows.push([]);
        } else {
            cell += cc;
        }
    }
    if (cell.length > 0 || rows[rows.length - 1].length > 0) {
        rows[rows.length - 1].push(cell.trim());
    }
    return rows.filter(r => r.some(c => c !== ''));
}

function parseCSVText(csvText) {
    const rows = parseCSVToRows(csvText);

    if (rows.length < 2) {
        alert('File CSV kosong atau format tidak sesuai!');
        return;
    }

    parsedData = [];

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols || cols.length < 3) continue;

        const rawNama = cols[2] ? cols[2].replace(/^"|"$/g, '').trim() : '';

        // Filter baris kosong / nama fiktif
        if (!rawNama || rawNama.length < 2 || rawNama.toUpperCase().includes('NAMA LENGKAP')) {
            continue;
        }

        const timestamp = cols[0] ? cols[0].replace(/^"|"$/g, '').trim() : '-';
        const noAbsen = cols[1] ? cols[1].replace(/^"|"$/g, '').trim() : `${parsedData.length + 1}`;
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
        alert('Tidak ada data peserta valid yang dapat dibaca dari CSV!');
        return;
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

    const statTotal = document.getElementById('statTotal');
    const statMax = document.getElementById('statMax');
    const statAvg = document.getElementById('statAvg');

    if (statTotal) statTotal.innerText = computed.length;
    if (statMax) statMax.innerText = computed[0].totalScore;

    const sumAll = computed.reduce((acc, curr) => acc + curr.totalScore, 0);
    const avgAll = sumAll / computed.length;
    if (statAvg) statAvg.innerText = (Math.round(avgAll * 10) / 10);

    const top10Data = computed.slice(0, 10);
    const remainingData = computed.slice(10);

    renderPodiumTop10(top10Data);
    renderRemainingList(remainingData);
}

function renderPodiumTop10(top10Data) {
    const podiumContainer = document.getElementById('podiumContainer');
    if (!podiumContainer) return;

    podiumContainer.style.display = 'flex';
    podiumContainer.style.flexWrap = 'wrap';
    podiumContainer.style.justifyContent = 'center';
    podiumContainer.style.gap = '15px';
    podiumContainer.innerHTML = '';

    top10Data.forEach((item, index) => {
        const rank = index + 1;
        const card = document.createElement('div');

        let rankColor = '#8b5cf6';
        if (rank === 1) rankColor = '#f59e0b';
        else if (rank === 2) rankColor = '#94a3b8';
        else if (rank === 3) rankColor = '#d97706';

        card.className = `podium-card rank-${rank}`;
        card.style.cssText = `
            background: rgba(30, 27, 75, 0.6);
            border: 2px solid ${rankColor};
            border-radius: 12px;
            padding: 12px;
            width: 170px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            position: relative;
        `;

        card.innerHTML = `
            <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: ${rankColor}; color: #fff; font-weight: bold; border-radius: 20px; padding: 2px 10px; font-size: 0.75rem;">
                JUARA ${rank}
            </div>
            <div style="margin-top: 8px; font-size: 1.1rem; font-weight: bold; color: #38bdf8;">${item.noAbsen}</div>
            <div style="font-weight: 600; color: #f8fafc; font-size: 0.85rem; margin: 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.name}">${item.name}</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #4ade80;">${item.totalScore}</div>
        `;

        podiumContainer.appendChild(card);
    });
}

function renderRemainingList(remainingData) {
    const listContainer = document.getElementById('leaderboardList');
    const thHeader = document.getElementById('tableHeader');

    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (remainingData.length === 0) {
        if (thHeader) thHeader.style.display = 'none';
        return;
    }

    if (thHeader) {
        thHeader.style.display = 'grid';
        thHeader.style.gridTemplateColumns = '60px 2.5fr 1fr 1fr 1fr 1.2fr';
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
        const actualRank = index + 11;
        const card = document.createElement('div');
        card.className = 'rank-card rank-other';
        card.style.cssText = `
            display: grid;
            grid-template-columns: 60px 2.5fr 1fr 1fr 1fr 1.2fr;
            align-items: center;
            padding: 10px;
            margin-bottom: 8px;
            background: rgba(30, 27, 75, 0.4);
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.05);
        `;

        card.innerHTML = `
            <div class="rank-badge" style="font-weight:bold; color:#cbd5e1;">${actualRank}</div>
            <div class="participant-info" style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                <div class="avatar-mini" style="background:#3b82f6; color:#fff; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:bold; flex-shrink:0;">${item.noAbsen}</div>
                <div style="overflow:hidden;">
                    <div class="p-name" style="font-weight:bold; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                    <small style="font-size:0.75rem; color:#94a3b8;">${item.timestamp}</small>
                </div>
            </div>
            <div class="metric-val" style="text-align:center; color:#f8fafc;">${item.nilaiPG}</div>
            <div class="metric-val" style="text-align:center; color:#38bdf8;">${item.scoreEsai1}</div>
            <div class="metric-val" style="text-align:center; color:#38bdf8;">${item.scoreEsai2}</div>
            <div class="total-score-badge" style="text-align:center; font-weight:bold; color:#4ade80; background:rgba(74, 222, 128, 0.1); padding:4px 8px; border-radius:6px;">${item.totalScore}</div>
        `;
        listContainer.appendChild(card);
    });
}

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
        }).catch(() => copyToClipboard(shareableUrl));
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

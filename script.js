let parsedData = [];
let headers = ['Nama', 'Nilai 1', 'Nilai 2', 'Nilai 3', 'Nilai 4', 'Nilai 5'];
let weights = [1, 1, 1, 1, 1];

// Drag and drop event listeners
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('csvFileInput');

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processCSV(e.target.files[0]);
    }
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
    if (e.dataTransfer.files.length > 0) {
        processCSV(e.dataTransfer.files[0]);
    }
});

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Process CSV File Input
function processCSV(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSVText(text);
        showToast('Data CSV berhasil diunggah dan dihitung!');
    };
    reader.readAsText(file);
}

function parseCSVText(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        alert('File CSV harus memiliki minimal header dan 1 baris data!');
        return;
    }

    // Parse Headers (Take first 6 columns)
    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    headers = rawHeaders.slice(0, 6);

    // Fill header defaults if missing
    while(headers.length < 6) {
        headers.push(`Kolom ${headers.length}`);
    }

    parsedData = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const name = cols[0] || `Peserta ${i}`;
        const m1 = parseFloat(cols[1]) || 0;
        const m2 = parseFloat(cols[2]) || 0;
        const m3 = parseFloat(cols[3]) || 0;
        const m4 = parseFloat(cols[4]) || 0;
        const m5 = parseFloat(cols[5]) || 0;

        parsedData.push({ name, m1, m2, m3, m4, m5 });
    }

    renderWeightInputs();
    calculateAndRender();
}

function renderWeightInputs() {
    const grid = document.getElementById('weightsGrid');
    grid.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const colName = headers[i] || `Kolom ${i}`;
        const div = document.createElement('div');
        div.className = 'weight-item';
        div.innerHTML = `
            <label title="${colName}">${colName}</label>
            <input type="number" step="0.1" value="${weights[i-1]}" onchange="updateWeight(${i-1}, this.value)">
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

    // Calculation logic
    let computed = parsedData.map(item => {
        const s1 = item.m1 * weights[0];
        const s2 = item.m2 * weights[1];
        const s3 = item.m3 * weights[2];
        const s4 = item.m4 * weights[3];
        const s5 = item.m5 * weights[4];
        const total = s1 + s2 + s3 + s4 + s5;
        const avg = (item.m1 + item.m2 + item.m3 + item.m4 + item.m5) / 5;

        return {
            ...item,
            totalScore: Math.round(total * 100) / 100,
            avgScore: Math.round(avg * 10) / 10
        };
    });

    // Sort descending by total score
    computed.sort((a, b) => b.totalScore - a.totalScore);

    // Update Statistics
    document.getElementById('statTotal').innerText = computed.length;
    document.getElementById('statMax').innerText = computed[0].totalScore;
    const avgAll = computed.reduce((acc, curr) => acc + curr.totalScore, 0) / computed.length;
    document.getElementById('statAvg').innerText = (Math.round(avgAll * 10) / 10);

    // Render Table Header
    document.getElementById('tableHeader').style.display = 'grid';
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`th${i}`).innerText = headers[i].length > 8 ? headers[i].substring(0,6)+'..' : headers[i];
    }

    // Render Podium Top 3
    if (computed.length >= 1) {
        document.getElementById('podiumContainer').style.display = 'flex';
        
        // Rank 1
        document.getElementById('name1').innerText = computed[0].name;
        document.getElementById('score1').innerText = computed[0].totalScore;
        document.getElementById('avatar1').innerText = computed[0].name.charAt(0).toUpperCase();

        // Rank 2
        if (computed[1]) {
            document.getElementById('name2').innerText = computed[1].name;
            document.getElementById('score2').innerText = computed[1].totalScore;
            document.getElementById('avatar2').innerText = computed[1].name.charAt(0).toUpperCase();
            document.getElementById('podium2').style.visibility = 'visible';
        } else {
            document.getElementById('podium2').style.visibility = 'hidden';
        }

        // Rank 3
        if (computed[2]) {
            document.getElementById('name3').innerText = computed[2].name;
            document.getElementById('score3').innerText = computed[2].totalScore;
            document.getElementById('avatar3').innerText = computed[2].name.charAt(0).toUpperCase();
            document.getElementById('podium3').style.visibility = 'visible';
        } else {
            document.getElementById('podium3').style.visibility = 'hidden';
        }
    }

    // Render Leaderboard Row Items
    const listContainer = document.getElementById('leaderboardList');
    listContainer.innerHTML = '';

    computed.forEach((item, index) => {
        const rank = index + 1;
        const card = document.createElement('div');
        card.className = `rank-card rank-${rank <= 3 ? rank : 'other'}`;

        card.innerHTML = `
            <div class="rank-badge">${rank}</div>
            <div class="participant-info">
                <div class="avatar-mini">${item.name.charAt(0).toUpperCase()}</div>
                <div class="p-name">${item.name}</div>
            </div>
            <div class="metric-val hide-mobile">${item.m1}</div>
            <div class="metric-val hide-mobile">${item.m2}</div>
            <div class="metric-val hide-mobile">${item.m3}</div>
            <div class="metric-val hide-mobile">${item.m4}</div>
            <div class="metric-val hide-mobile">${item.m5}</div>
            <div class="metric-val" style="color: #a78bfa;">${item.avgScore}</div>
            <div class="total-score-badge">${item.totalScore}</div>
        `;
        listContainer.appendChild(card);
    });
}

// Load Demo Data
function loadSampleData() {
    const sampleCSV = `Nama Peserta,Tugas 1,Tugas 2,Ujian Tengah,Ujian Akhir,Kehadiran
Ahmad Fauzi,85,90,88,92,100
Budi Santoso,92,88,95,90,95
Citra Dewi,78,85,80,82,90
Dian Pratama,95,94,92,98,100
Eka Rahmawati,88,82,85,89,95
Fajar Nugraha,90,92,91,94,98
Gita Gutawa,82,80,85,88,90
Hendra Wijaya,75,78,80,85,85`;

    parseCSVText(sampleCSV);
    showToast('Data sampel berhasil dimuat!');
}

// Download Sample CSV
function downloadSampleCSV() {
    const sampleCSV = `Nama Peserta,Tugas 1,Tugas 2,Ujian Tengah,Ujian Akhir,Kehadiran
Ahmad Fauzi,85,90,88,92,100
Budi Santoso,92,88,95,90,95
Citra Dewi,78,85,80,82,90
Dian Pratama,95,94,92,98,100`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_leaderboard_6kolom.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template CSV diunduh!');
}

// Export Leaderboard Area to JPG Image
function exportToJPG() {
    if (parsedData.length === 0) {
        alert('Silakan muat data CSV terlebih dahulu sebelum mendownload JPG!');
        return;
    }

    showToast('Sedang memproses gambar JPG...');
    const exportArea = document.getElementById('export-container');

    html2canvas(exportArea, {
        scale: 2, // High resolution rendering
        useCORS: true,
        backgroundColor: '#0f0c20',
        logging: false
    }).then(canvas => {
        const image = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `Leaderboard_Hasil_${new Date().toISOString().slice(0,10)}.jpg`;
        link.href = image;
        link.click();
        showToast('Gambar Leaderboard JPG berhasil didownload!');
    }).catch(err => {
        console.error(err);
        alert('Gagal mengekspor gambar JPG.');
    });
}

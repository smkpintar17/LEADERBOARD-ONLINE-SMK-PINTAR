// Evaluasi Esai 1 Berdasarkan Kunci Jawaban (Maksimal 15 Poin)
function evaluateEssay1(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    let score = 0;

    // Bagian A: Redundansi & Anomali (Max 5 Poin)
    const hasRedundansi = str.includes('redundansi') || str.includes('pengulangan');
    const hasAnomali = str.includes('anomali') || str.includes('insert') || str.includes('delete') || str.includes('update');
    
    if (hasRedundansi && hasAnomali) {
        score += 5;
    } else if (hasRedundansi || hasAnomali) {
        score += 2.5;
    }

    // Bagian B: Normalisasi 3NF / Skema Tabel (Max 5 Poin)
    const hasPelanggan = str.includes('pelanggan');
    const hasBarang = str.includes('barang');
    const hasTransaksi = str.includes('transaksi');

    if (hasPelanggan && hasBarang && hasTransaksi) {
        score += 5;
    } else if (hasPelanggan || hasBarang || hasTransaksi) {
        score += 2.5;
    }

    // Bagian C: SQL DDL (Max 5 Poin)
    const hasCreate = str.includes('create table');
    const hasPK = str.includes('primary key') || str.includes('auto_increment');

    if (hasCreate && hasPK) {
        score += 5;
    } else if (hasCreate) {
        score += 2.5;
    }

    return Math.min(15, score);
}

// Evaluasi Esai 2 Berdasarkan Kunci Jawaban (Maksimal 15 Poin)
function evaluateEssay2(text) {
    if (!text) return 0;
    const str = text.toLowerCase();
    let score = 0;

    // Bagian A: Perbedaan Client-Side vs Server-Side (Max 7.5 Poin)
    const hasClient = str.includes('client') || str.includes('browser') || str.includes('peramban') || str.includes('html') || str.includes('css') || str.includes('js');
    const hasServer = str.includes('server') || str.includes('php') || str.includes('node');

    if (hasClient && hasServer) {
        score += 7.5;
    } else if (hasClient || hasServer) {
        score += 3.75;
    }

    // Bagian B: Skenario Keamanan & Alasan (Max 7.5 Poin)
    const hasSkenario = str.includes('transaksi') || str.includes('pembayaran') || str.includes('autentikasi') || str.includes('sandi') || str.includes('password');
    const hasAlasan = str.includes('developer tools') || str.includes('inspeksi') || str.includes('manipulasi') || str.includes('sensitif') || str.includes('validasi');

    if (hasSkenario && hasAlasan) {
        score += 7.5;
    } else if (hasSkenario || hasAlasan) {
        score += 3.75;
    }

    return Math.min(15, score);
}

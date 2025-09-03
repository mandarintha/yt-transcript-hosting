// Fungsi utama untuk parsing transkrip (mendeteksi format secara otomatis)
function parseTranscript(transcriptText) {
    // Cek apakah ini format CSV dengan header "Waktu Mulai (detik)"
    if (transcriptText.includes('Waktu Mulai (detik)') || 
        transcriptText.includes('start') || 
        transcriptText.includes(',')) {
        return parseCSVDelimitedTranscript(transcriptText);
    } 
    // Jika tidak, asumsikan format timestamp
    else {
        return parseTimestampTranscript(transcriptText);
    }
}

// Fungsi untuk parsing transkrip dengan format timestamp
function parseTimestampTranscript(transcriptText) {
    const lines = transcriptText.trim().split('\n');
    const segments = [];
    
    for (let i = 0; i < lines.length; i += 2) {
        if (i + 1 >= lines.length) break;
        
        const timestamp = lines[i].trim();
        let text = lines[i + 1].trim();
        
        if (!timestamp || !text) continue;
        
        // Konversi timestamp mm:ss ke detik
        const [minutes, seconds] = timestamp.split(':').map(Number);
        const start = minutes * 60 + seconds;
        
        // Tentukan end time (ambil dari timestamp berikutnya)
        let end;
        if (i + 2 < lines.length && lines[i + 2].includes(':')) {
            const nextTimestamp = lines[i + 2].trim();
            const [nextMinutes, nextSeconds] = nextTimestamp.split(':').map(Number);
            end = nextMinutes * 60 + nextSeconds;
        } else {
            // Untuk segmen terakhir, tambahkan durasi berdasarkan panjang teks
            end = start + (text.length * 0.08);
        }
        
        // Perbaiki beberapa kesalahan pengetikan umum
        text = text
            .replace(/ต่างทากัน/g, 'ต่างพากัน')
            .replace(/กะรอก/g, 'กระรอก')
            .replace(/ชีสทองคํา/g, 'ชีสทองคำ')
            .replace(/ตุ๊กใจ/g, 'ตกใจ')
            .replace(/เจ้านก/g, 'เจ้าหนู')
            .replace(/ยืมกว้าง/g, 'ยิ้มกว้าง')
            .replace(/ทํา/g, 'ทำ')
            .replace(/มินาคิด/g, 'ไม่น่าคิด')
            .replace(/ช้าวัน/g, 'เช้าวัน');
        
        segments.push({
            start: start,
            end: end,
            text: text
        });
    }
    
    return segments;
}

// Fungsi untuk parsing baris CSV dengan penanganan tanda kutip
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Fungsi untuk mengonversi transkrip CSV ke format yang dibutuhkan
function parseCSVDelimitedTranscript(csvText) {
    const lines = csvText.trim().split('\n');
    const segments = [];
    
    // Lewati baris header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse baris CSV
        const parts = parseCSVLine(line);
        
        if (parts.length < 3) continue;
        
        const start = parseFloat(parts[0]);
        const end = parseFloat(parts[1]);
        let text = parts[2].trim();
        
        // Hapus tanda kutip jika ada
        if (text.startsWith('"') && text.endsWith('"')) {
            text = text.slice(1, -1);
        }
        
        if (isNaN(start) || isNaN(end) || !text) continue;
        
        segments.push({
            start: start,
            end: end,
            text: text
        });
    }
    
    return segments;
}

// Fungsi untuk memuat transkrip dari file dengan deteksi format otomatis
async function loadTranscriptFromFile(bookId) {
    try {
        // Coba muat sebagai CSV terlebih dahulu
        let response;
        try {
            response = await fetch(`/transcripts/${bookId}.csv`);
            if (!response.ok) throw new Error('CSV file not found');
            const csvText = await response.text();
            return parseCSVDelimitedTranscript(csvText);
        } catch (csvError) {
            // Jika CSV gagal, coba sebagai format timestamp
            response = await fetch(`data/transcripts/${bookId}.txt`);
            if (!response.ok) throw new Error('TXT file not found');
            
            const transcriptText = await response.text();
            return parseTranscript(transcriptText);
        }
    } catch (error) {
        console.error('Error loading transcript:', error);
        return [];
    }

}

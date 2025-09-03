// Fungsi untuk format waktu
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Optimasi fungsi highlight dengan hanya memproses elemen terdekat
function highlightText(currentTime, textDisplay) {
    if (!textDisplay) return;
    
    const paragraphs = textDisplay.querySelectorAll('.transcript-sentence');
    
    // Hanya cari di elemen yang mungkin relevan
    const startIndex = Math.max(0, Math.floor(currentTime / 3) - 5);
    const endIndex = Math.min(paragraphs.length, startIndex + 10);
    
    let found = false;
    for (let i = startIndex; i < endIndex; i++) {
        const p = paragraphs[i];
        const start = parseFloat(p.dataset.start);
        const end = parseFloat(p.dataset.end);
        
        if (!isNaN(start) && !isNaN(end) && currentTime >= start && currentTime < end) {
            p.classList.add('highlight');
            if (!found) {
                p.scrollIntoView({ behavior: 'smooth', block: 'center' });
                found = true;
            }
        } else {
            p.classList.remove('highlight');
        }
    }
}

// Fungsi untuk render transkrip
function renderTranscript(transcript, textDisplay) {
    if (!textDisplay) return;
    
    const textHTML = transcript.map(fragment =>
        `<p class="transcript-sentence" data-start="${fragment.start}" data-end="${fragment.end}">${fragment.text}</p>`
    ).join('');
    
    textDisplay.innerHTML = textHTML;
}
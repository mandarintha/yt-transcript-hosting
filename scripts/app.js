// Ambil data audiobook dari file JSON
async function loadAudiobooks() {
    const res = await fetch("audiobooks.json");
    const audiobooks = await res.json();
    renderAudiobookCards(audiobooks);

    // Set default buku pertama
    if (audiobooks.length > 0) {
        loadAudiobook(audiobooks[0]);
    }
}

// Load transcript + audio untuk 1 audiobook
async function loadAudiobook(book) {
    const audioPlayer = document.getElementById("audio-player");
    const textDisplay = document.getElementById("text-display");
    const titleEl = document.querySelector(".book-title");
    const authorEl = document.querySelector(".book-author");
    const coverEl = document.querySelector(".book-cover");

    // Set info buku
    titleEl.textContent = book.title;
    authorEl.textContent = `By ${book.author}`;
    coverEl.src = book.cover;
    audioPlayer.src = book.audio;

    // Load transcript JSON
    const res = await fetch(book.transcript);
    const transcript = await res.json();

    let textHTML = "";
    transcript.text.forEach(fragment => {
        textHTML += `<p data-start="${fragment.start}" data-end="${fragment.end}">${fragment.content}</p>`;
    });
    textDisplay.innerHTML = textHTML;

    // Highlight sync
    audioPlayer.ontimeupdate = () => {
        highlightText(audioPlayer.currentTime);
    };
}

// Highlight text sesuai timestamp
function highlightText(currentTime) {
    const paragraphs = document.querySelectorAll("#text-display p");
    paragraphs.forEach(p => {
        const start = parseFloat(p.getAttribute("data-start"));
        const end = parseFloat(p.getAttribute("data-end"));

        if (currentTime >= start && currentTime < end) {
            p.classList.add("highlight");
            p.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            p.classList.remove("highlight");
        }
    });
}

// Render koleksi audiobook
function renderAudiobookCards(audiobooks) {
    const audiobookCards = document.getElementById("audiobook-cards");
    let cardsHTML = "";

    audiobooks.forEach(book => {
        cardsHTML += `
            <div class="card" data-id="${book.id}">
                <img src="${book.cover}" alt="${book.title}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${book.title}</h3>
                    <p class="card-author">By ${book.author}</p>
                    <div class="card-duration">
                        <span><i class="fas fa-headphones"></i> Audiobook</span>
                    </div>
                </div>
            </div>
        `;
    });
    audiobookCards.innerHTML = cardsHTML;

    // Klik kartu untuk load audiobook
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-id");
            const book = audiobooks.find(b => b.id == id);
            loadAudiobook(book);
        });
    });
}

// Kontrol player
document.addEventListener("DOMContentLoaded", () => {
    const audioPlayer = document.getElementById("audio-player");
    document.getElementById("play-btn").onclick = () => audioPlayer.play();
    document.getElementById("pause-btn").onclick = () => audioPlayer.pause();
    document.getElementById("prev-btn").onclick = () => audioPlayer.currentTime -= 10;
    document.getElementById("next-btn").onclick = () => audioPlayer.currentTime += 10;

    loadAudiobooks();
});

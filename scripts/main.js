document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        audio: document.getElementById('audio-element'),
        textDisplay: document.getElementById('text-display'),
        playPauseBtn: document.getElementById('play-pause-btn'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        rewindBtn: document.getElementById('rewind-btn'),
        forwardBtn: document.getElementById('forward-btn'),
        audiobookCards: document.getElementById('audiobook-cards'),
        audiobookForm: document.getElementById('audiobook-form'),
        progressBar: document.getElementById('progress-bar'),
        progressContainer: document.getElementById('progress-container'),
        currentTimeEl: document.getElementById('current-time'),
        durationEl: document.getElementById('duration'),
        bookCover: document.getElementById('book-cover'),
        currentBookTitle: document.getElementById('current-book-title'),
        currentBookAuthor: document.getElementById('current-book-author'),
        scrollLeftBtn: document.getElementById('scroll-left'),
        scrollRightBtn: document.getElementById('scroll-right')
    };

    // Data audiobooks
    let audiobooks = [];
    
    // State player
    let currentBookIndex = 0;
    let isPlaying = false;
    let transcripts = {};

    // Load data audiobooks
    async function loadAudiobookData() {
        try {
            const response = await fetch('/audiobooks.json');
            if (!response.ok) {
                throw new Error('Failed to load audiobook data');
            }
            audiobooks = await response.json();
            renderAudiobookCards();
            
            // Muat buku pertama
            loadAudiobook(currentBookIndex);
        } catch (error) {
            console.error('Error loading audiobook data:', error);
            showStatusMessage('Failed to load audiobook collection. Please try again later.', 'error');
        }
    }

    // Render audiobook cards dynamically
    function renderAudiobookCards() {
        const cardsHTML = audiobooks.map((book, index) => `
            <div class="card" data-index="${index}">
                <img src="${book.cover}" alt="${book.title}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${book.title}</h3>
                    <p class="card-author">By ${book.author}</p>
                    <div class="card-duration">
                        <span><i class="fas fa-headphones"></i> Audiobook</span>
                        <span>${book.duration}</span>
                    </div>
                </div>
            </div>
        `).join('');
        elements.audiobookCards.innerHTML = cardsHTML;
    }

    // Handle player state changes
    function togglePlayPause() {
        if (isPlaying) {
            elements.audio.pause();
        } else {
            elements.audio.play();
        }
        isPlaying = !isPlaying;
        updatePlayButtonIcon();
    }

    function updatePlayButtonIcon() {
        const icon = elements.playPauseBtn.querySelector('i');
        if (icon) {
            icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }

    // Muat transkrip untuk buku tertentu
    async function loadTranscript(bookId) {
        if (transcripts[bookId]) {
            return transcripts[bookId];
        }
        
        try {
            const transcript = await loadTranscriptFromFile(bookId);
            transcripts[bookId] = transcript;
            return transcript;
        } catch (error) {
            console.error(`Error loading transcript for book ${bookId}:`, error);
            return [];
        }
    }

    // Load audiobook
    async function loadAudiobook(index) {
        const book = audiobooks[index];
        if (!book) return;

        // Update UI elements
        elements.currentBookTitle.textContent = book.title;
        elements.currentBookAuthor.textContent = `By ${book.author}`;
        elements.bookCover.src = book.cover;
        elements.audio.src = book.audio;
        
        // Tampilkan transkrip
        const transcript = await loadTranscript(book.id);
        renderTranscript(transcript, elements.textDisplay);
        
        // Restart playback from beginning if a new book is loaded
        if (isPlaying) {
            elements.audio.play();
        } else {
            elements.audio.load();
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Play/Pause button
        if (elements.playPauseBtn) {
            elements.playPauseBtn.addEventListener('click', togglePlayPause);
        }

        // Previous/Next buttons
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', () => {
                currentBookIndex = (currentBookIndex - 1 + audiobooks.length) % audiobooks.length;
                loadAudiobook(currentBookIndex);
            });
        }

        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', () => {
                currentBookIndex = (currentBookIndex + 1) % audiobooks.length;
                loadAudiobook(currentBookIndex);
            });
        }
        
        // Rewind/Forward buttons
        if (elements.rewindBtn) {
            elements.rewindBtn.addEventListener('click', () => {
                if (elements.audio && !isNaN(elements.audio.currentTime)) {
                    elements.audio.currentTime = Math.max(0, elements.audio.currentTime - 10);
                }
            });
        }
        
        if (elements.forwardBtn) {
            elements.forwardBtn.addEventListener('click', () => {
                if (elements.audio && !isNaN(elements.audio.currentTime) && !isNaN(elements.audio.duration)) {
                    elements.audio.currentTime = Math.min(elements.audio.duration, elements.audio.currentTime + 10);
                }
            });
        }

        // Scroll buttons for cards
        if (elements.scrollLeftBtn) {
            elements.scrollLeftBtn.addEventListener('click', () => {
                if (elements.audiobookCards) {
                    elements.audiobookCards.scrollBy({ left: -270, behavior: 'smooth' });
                }
            });
        }

        if (elements.scrollRightBtn) {
            elements.scrollRightBtn.addEventListener('click', () => {
                if (elements.audiobookCards) {
                    elements.audiobookCards.scrollBy({ left: 270, behavior: 'smooth' });
                }
            });
        }

        // Card clicks to change audiobooks
        if (elements.audiobookCards) {
            elements.audiobookCards.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                if (card) {
                    const index = parseInt(card.getAttribute('data-index'));
                    if (index !== currentBookIndex) {
                        currentBookIndex = index;
                        loadAudiobook(currentBookIndex);
                    }
                }
            });
        }
        
        // Progress bar seeking
        if (elements.progressContainer) {
            elements.progressContainer.addEventListener('click', (e) => {
                if (elements.audio && elements.progressContainer) {
                    const rect = elements.progressContainer.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const width = rect.width;
                    const duration = elements.audio.duration;
                    if (!isNaN(duration) && duration > 0) {
                        elements.audio.currentTime = (clickX / width) * duration;
                    }
                }
            });
        }

        // Update progress bar and time display
        if (elements.audio) {
            elements.audio.addEventListener('timeupdate', () => {
                const currentTime = elements.audio.currentTime;
                const duration = elements.audio.duration;
                if (!isNaN(duration) && duration > 0) {
                    const progressPercent = (currentTime / duration) * 100;
                    if (elements.progressBar) {
                        elements.progressBar.style.width = `${progressPercent}%`;
                    }
                    if (elements.currentTimeEl) {
                        elements.currentTimeEl.textContent = formatTime(currentTime);
                    }
                    if (elements.durationEl) {
                        elements.durationEl.textContent = formatTime(duration);
                    }
                    if (elements.textDisplay) {
                        highlightText(currentTime, elements.textDisplay);
                    }
                }
            });

            // Handle audio end
            elements.audio.addEventListener('ended', () => {
                isPlaying = false;
                updatePlayButtonIcon();
            });
        }

        // Form submission
        if (elements.audiobookForm) {
            elements.audiobookForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showStatusMessage('Thank you for your request! We will consider adding this audiobook to our collection.', 'success');
                elements.audiobookForm.reset();
            });
        }
    }

    // Show a temporary status message
    function showStatusMessage(message, type = 'info') {
        if (!elements.audiobookForm) return;
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        
        if (type === 'error') {
            statusDiv.style.background = 'rgba(255, 80, 80, 0.15)';
            statusDiv.style.borderLeft = '4px solid #ff5252';
        } else {
            statusDiv.style.background = 'rgba(76, 175, 80, 0.15)';
            statusDiv.style.borderLeft = '4px solid #4CAF50';
        }
        
        statusDiv.style.padding = '12px';
        statusDiv.style.borderRadius = '6px';
        statusDiv.style.margin = '15px 0';
        statusDiv.style.textAlign = 'center';
        statusDiv.textContent = message;
        
        elements.audiobookForm.parentNode.insertBefore(statusDiv, elements.audiobookForm);
        
        setTimeout(() => statusDiv.remove(), 5000);
    }

    // Inisialisasi aplikasi
    function initApp() {
        loadAudiobookData();
        setupEventListeners();
    }

    // Inisialisasi
    initApp();
});

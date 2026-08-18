// ========================================
// Adip Lowkey - Archive Page Logic
// Katalog remix: render grid, search, Load More,
// audio player (style sama seperti index).
// Ringan untuk HP kentang: lazy image, render bertahap.
// ========================================

(function () {
    // ---------- State ----------
    const PER_LOAD = 12; // jumlah track per klik "Muat Lebih Banyak"
    let displayed = 0;
    let filtered = (typeof archiveTracks !== 'undefined') ? archiveTracks.slice() : [];
    let searchQuery = '';

    // ---------- DOM ----------
    const grid = document.getElementById('archiveGrid');
    const loadMoreWrap = document.getElementById('archiveLoadMore');
    const loadMoreBtn = document.getElementById('archiveLoadMoreBtn');
    const progressText = document.getElementById('archiveProgressText');
    const progressFill = document.getElementById('archiveProgressFill');
    const searchInput = document.getElementById('archiveSearch');
    const searchClear = document.getElementById('archiveSearchClear');
    const noResults = document.getElementById('archiveNoResults');
    const totalCount = document.getElementById('archiveTotalCount');

    // Player DOM
    const audioPlayer = document.getElementById('audioPlayer');
    const audioElement = document.getElementById('audioElement');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const nowPlaying = document.getElementById('nowPlaying');
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const playerImage = document.getElementById('playerImage');
    const playerClose = document.getElementById('playerClose');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    let currentTrackId = null;
    let isPlaying = false;

    if (!grid) return;

    // ---------- Navbar ----------
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }, { passive: true });

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
        });
    });

    // ---------- Toast ----------
    function showToast(message) {
        if (!toast) return;
        toastMessage.textContent = message;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3000);
    }

    // ---------- Render ----------
    function trackCard(track) {
        const card = document.createElement('div');
        card.className = 'archive-card';
        card.dataset.id = track.id;
        card.innerHTML = `
            <div class="archive-cover">
                <img src="${track.cover}" alt="${track.title}" loading="lazy">
                <div class="archive-play-overlay" data-id="${track.id}">
                    <div class="play-btn"><i class="fas fa-play"></i></div>
                </div>
                <div class="playing-indicator" id="indicator-${track.id}">
                    <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
                </div>
                <span class="archive-year">${track.year}</span>
            </div>
            <div class="archive-info">
                <h3 class="archive-title">${track.title}</h3>
                <div class="archive-meta">
                    <span><i class="fas fa-user"></i> ${track.artist}</span>
                    <span><i class="fas fa-tag"></i> ${track.genre}</span>
                    <span><i class="fas fa-clock"></i> ${track.duration}</span>
                </div>
            </div>
        `;
        card.querySelector('.archive-play-overlay').addEventListener('click', function () {
            playTrack(track);
        });
        return card;
    }

    function renderBatch() {
        const batch = filtered.slice(displayed, displayed + PER_LOAD);
        const fragment = document.createDocumentFragment();
        batch.forEach(track => fragment.appendChild(trackCard(track)));
        grid.appendChild(fragment);
        displayed += batch.length;
        updateLoadMoreUI();
    }

    function updateLoadMoreUI() {
        const total = filtered.length;
        if (progressText) progressText.textContent = `Menampilkan ${displayed} dari ${total} karya`;
        if (progressFill) progressFill.style.width = total ? (displayed / total * 100) + '%' : '0%';

        if (displayed >= total) {
            loadMoreWrap.style.display = 'none';
        } else {
            loadMoreWrap.style.display = 'flex';
            const remaining = total - displayed;
            loadMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> Muat Lebih Banyak (${remaining} lagi)`;
        }

        if (noResults) noResults.style.display = total === 0 ? 'block' : 'none';
    }

    function resetAndRender() {
        grid.innerHTML = '';
        displayed = 0;
        renderBatch();
    }

    // ---------- Search ----------
    function applySearch() {
        if (!searchQuery) {
            filtered = archiveTracks.slice();
        } else {
            filtered = archiveTracks.filter(t => {
                const fields = [t.title, t.artist, t.genre, String(t.year)].join(' ').toLowerCase();
                return fields.includes(searchQuery);
            });
        }
        if (totalCount) totalCount.textContent = `${filtered.length} karya remix`;
        resetAndRender();
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = this.value.toLowerCase().trim();
            searchClear.style.display = searchQuery ? 'flex' : 'none';
            applySearch();
        });
    }
    if (searchClear) {
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            searchQuery = '';
            this.style.display = 'none';
            applySearch();
        });
    }

    // ---------- Load More ----------
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', renderBatch);
    }

    // ---------- Audio Player ----------
    function playTrack(track) {
        if (currentTrackId === track.id) {
            togglePlay();
            return;
        }
        audioElement.pause();
        audioElement.currentTime = 0;

        currentTrackId = track.id;
        nowPlaying.textContent = track.title;

        if (playerImage && track.cover) {
            playerImage.src = track.cover;
            playerImage.style.display = 'block';
        }

        if (track.audio && track.audio !== '#') {
            audioElement.src = track.audio;
            audioElement.load();
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    isPlaying = true;
                    updatePlayButton();
                    showPlayer();
                    updatePlayingIndicator(track.id);
                }).catch(() => showToast('Gagal memutar audio'));
            }
        } else {
            showToast('Audio tidak tersedia');
        }
    }

    function togglePlay() {
        if (!currentTrackId) return;
        if (isPlaying) {
            audioElement.pause();
            isPlaying = false;
            hideAllIndicators();
        } else {
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    isPlaying = true;
                    updatePlayingIndicator(currentTrackId);
                }).catch(() => {});
            }
        }
        updatePlayButton();
    }

    function updatePlayButton() {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function showPlayer() { audioPlayer.classList.add('active'); }

    function closePlayerFn() {
        audioPlayer.classList.remove('active');
        audioElement.pause();
        audioElement.currentTime = 0;
        isPlaying = false;
        currentTrackId = null;
        updatePlayButton();
        progress.style.width = '0%';
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        hideAllIndicators();
    }

    function updatePlayingIndicator(id) {
        hideAllIndicators();
        const indicator = document.getElementById(`indicator-${id}`);
        if (indicator) indicator.classList.add('active');
    }

    function hideAllIndicators() {
        document.querySelectorAll('.playing-indicator').forEach(ind => ind.classList.remove('active'));
    }

    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
    if (playerClose) playerClose.addEventListener('click', closePlayerFn);

    if (audioElement) {
        audioElement.addEventListener('timeupdate', function () {
            if (audioElement.duration) {
                progress.style.width = (audioElement.currentTime / audioElement.duration * 100) + '%';
                if (currentTimeEl) currentTimeEl.textContent = formatTime(audioElement.currentTime);
            }
        });
        audioElement.addEventListener('loadedmetadata', function () {
            if (durationEl) durationEl.textContent = formatTime(audioElement.duration);
        });
        audioElement.addEventListener('ended', function () {
            isPlaying = false;
            updatePlayButton();
            progress.style.width = '0%';
            hideAllIndicators();
        });
    }

    if (progressBar) {
        progressBar.addEventListener('click', function (e) {
            if (!audioElement.duration) return;
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioElement.currentTime = percent * audioElement.duration;
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closePlayerFn();
    });

    // ---------- Init ----------
    if (totalCount) totalCount.textContent = `${archiveTracks.length} karya remix`;
    resetAndRender();
})();

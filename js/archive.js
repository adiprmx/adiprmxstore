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
    let genreFilter = 'all';   // filter genre/style (pill)
    let sortOption = 'default'; // opsi sorting dropdown

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
    const genreListEl = document.getElementById('archiveGenreList');
    const sortSelect = document.getElementById('archiveSort');

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

    // ========================================
    // FILTER & SORTING ARSIP REMIX
    // - Pencarian teks (judul/artis/genre/tahun)
    // - Filter genre/style via pill (dibuat otomatis dari data)
    // - Sorting: Abjad (A-Z/Z-A), Tahun (Terbaru/Terlama),
    //   Durasi (Terpanjang/Terpendek)
    // - Tanpa opsi harga (halaman ini murni arsip karya)
    // ========================================

    // Ubah durasi teks "m:ss" menjadi detik (untuk sorting durasi)
    function durationToSeconds(duration) {
        if (!duration) return 0;
        const parts = String(duration).split(':').map(Number);
        if (parts.some(isNaN)) return 0;
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    }

    // Buat pill genre otomatis dari genre unik yang ada di data arsip
    function buildGenrePills() {
        if (!genreListEl || typeof archiveTracks === 'undefined') return;
        const genres = [];
        archiveTracks.forEach(t => {
            if (t.genre && !genres.includes(t.genre)) genres.push(t.genre);
        });
        genres.sort((a, b) => a.localeCompare(b));
        genres.forEach(genre => {
            const pill = document.createElement('button');
            pill.className = 'genre-pill';
            pill.dataset.genre = genre;
            pill.textContent = genre;
            genreListEl.appendChild(pill);
        });
    }

    // Gabungan filter (search + genre) lalu sorting, lalu render ulang
    function applyFilters() {
        let result = archiveTracks.slice();

        // Filter pencarian teks
        if (searchQuery) {
            result = result.filter(t => {
                const fields = [t.title, t.artist, t.genre, String(t.year)].join(' ').toLowerCase();
                return fields.includes(searchQuery);
            });
        }

        // Filter genre/style
        if (genreFilter !== 'all') {
            result = result.filter(t => t.genre === genreFilter);
        }

        // Sorting
        switch (sortOption) {
            case 'name-asc':
                result.sort((a, b) => a.title.localeCompare(b.title, 'id'));
                break;
            case 'name-desc':
                result.sort((a, b) => b.title.localeCompare(a.title, 'id'));
                break;
            case 'year-new':
                result.sort((a, b) => b.year - a.year);
                break;
            case 'year-old':
                result.sort((a, b) => a.year - b.year);
                break;
            case 'duration-long':
                result.sort((a, b) => durationToSeconds(b.duration) - durationToSeconds(a.duration));
                break;
            case 'duration-short':
                result.sort((a, b) => durationToSeconds(a.duration) - durationToSeconds(b.duration));
                break;
            default:
                // Urutan default sesuai data asli
                break;
        }

        filtered = result;
        if (totalCount) totalCount.textContent = `${filtered.length} karya remix`;
        resetAndRender();
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = this.value.toLowerCase().trim();
            searchClear.style.display = searchQuery ? 'flex' : 'none';
            applyFilters();
        });
    }
    if (searchClear) {
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            searchQuery = '';
            this.style.display = 'none';
            applyFilters();
        });
    }

    // Filter genre via pill (delegasi event, termasuk pill yang dibuat dinamis)
    if (genreListEl) {
        genreListEl.addEventListener('click', function (e) {
            const pill = e.target.closest('.genre-pill');
            if (!pill) return;
            genreListEl.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            genreFilter = pill.dataset.genre;
            applyFilters();
        });
    }

    // Dropdown sorting
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            sortOption = this.value;
            applyFilters();
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
        // Sinkronisasi UI otomatis setiap kali audio ter-pause
        // (termasuk pause dari visibilitychange/beforeunload di bawah),
        // sama seperti perilaku player di index.html
        audioElement.addEventListener('pause', function () {
            if (isPlaying) {
                isPlaying = false;
                updatePlayButton();
                hideAllIndicators();
            }
        });
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

    // ========================================
    // AUTO-PAUSE SAAT PINDAH TAB / KELUAR HALAMAN
    // (konsisten dengan perilaku player di index.html)
    // - visibilitychange: audio berhenti saat user pindah
    //   tab / minimize browser, UI ikut sinkron otomatis
    // - beforeunload & pagehide: pastikan audio berhenti
    //   saat halaman ditutup / ditinggalkan
    // ========================================
    document.addEventListener('visibilitychange', function () {
        if (document.hidden && audioElement && !audioElement.paused) {
            audioElement.pause(); // event 'pause' otomatis sinkron ke UI player
        }
    });

    window.addEventListener('beforeunload', function () {
        if (audioElement && !audioElement.paused) {
            audioElement.pause();
        }
    });

    window.addEventListener('pagehide', function () {
        if (audioElement && !audioElement.paused) {
            audioElement.pause();
        }
    });

    // ---------- Init ----------
    buildGenrePills();
    if (totalCount) totalCount.textContent = `${archiveTracks.length} karya remix`;
    resetAndRender();
})();

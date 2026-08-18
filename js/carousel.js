// ========================================
// Adip Lowkey - Responsive Image Carousel
// Ringan, tanpa library. Support swipe (mobile)
// + navigasi panah (desktop) + dots + autoplay.
// Data foto diatur di js/gallery-data.js
// ========================================

(function () {
    const carouselRoot = document.getElementById('photoCarousel');
    if (!carouselRoot || typeof galleryPhotos === 'undefined' || galleryPhotos.length === 0) return;

    const AUTOPLAY_DELAY = 4000; // ganti ke 0 untuk mematikan autoplay

    // ---------- Build DOM ----------
    carouselRoot.innerHTML = `
        <div class="carousel-viewport">
            <div class="carousel-track"></div>
        </div>
        <button class="carousel-arrow carousel-prev" aria-label="Sebelumnya">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="carousel-arrow carousel-next" aria-label="Berikutnya">
            <i class="fas fa-chevron-right"></i>
        </button>
        <div class="carousel-dots"></div>
        <div class="carousel-counter"><span class="cc-current">1</span> / ${galleryPhotos.length}</div>
    `;

    const track = carouselRoot.querySelector('.carousel-track');
    const dotsWrap = carouselRoot.querySelector('.carousel-dots');
    const counterCurrent = carouselRoot.querySelector('.cc-current');
    const prevBtn = carouselRoot.querySelector('.carousel-prev');
    const nextBtn = carouselRoot.querySelector('.carousel-next');

    // Slides (lazy loading biar ringan di HP kentang)
    galleryPhotos.forEach((photo, i) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `
            <img src="${photo.src}" alt="${photo.caption || 'Foto ' + (i + 1)}"
                 loading="${i === 0 ? 'eager' : 'lazy'}" draggable="false">
            ${photo.caption ? `<div class="carousel-caption">${photo.caption}</div>` : ''}
        `;
        track.appendChild(slide);

        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Foto ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
    });

    const dots = dotsWrap.querySelectorAll('.carousel-dot');
    const total = galleryPhotos.length;
    let index = 0;
    let autoplayTimer = null;

    // ---------- Core ----------
    function update() {
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
        counterCurrent.textContent = index + 1;
    }

    function goTo(i) {
        index = (i + total) % total;
        update();
        restartAutoplay();
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    // Keyboard (desktop)
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
    });

    // ---------- Swipe (touch) + drag (mouse) ----------
    let startX = 0, currentX = 0, dragging = false;

    function onStart(x) {
        startX = x; currentX = x; dragging = true;
        track.classList.add('dragging');
        stopAutoplay();
    }
    function onMove(x) {
        if (!dragging) return;
        currentX = x;
        const delta = currentX - startX;
        const width = carouselRoot.offsetWidth;
        const percent = (delta / width) * 100;
        track.style.transform = 'translateX(' + (-index * 100 + percent) + '%)';
    }
    function onEnd() {
        if (!dragging) return;
        dragging = false;
        track.classList.remove('dragging');
        const delta = currentX - startX;
        const threshold = carouselRoot.offsetWidth * 0.15; // 15% swipe
        if (delta < -threshold) { index = (index + 1) % total; }
        else if (delta > threshold) { index = (index - 1 + total) % total; }
        update();
        restartAutoplay();
    }

    // Touch events (mobile swipe)
    carouselRoot.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
    carouselRoot.addEventListener('touchmove', e => onMove(e.touches[0].clientX), { passive: true });
    carouselRoot.addEventListener('touchend', onEnd);

    // Mouse drag (desktop, opsional)
    carouselRoot.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientX); });
    window.addEventListener('mousemove', e => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    // ---------- Autoplay ----------
    function startAutoplay() {
        if (!AUTOPLAY_DELAY) return;
        stopAutoplay();
        autoplayTimer = setInterval(next, AUTOPLAY_DELAY);
    }
    function stopAutoplay() {
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = null;
    }
    function restartAutoplay() { startAutoplay(); }

    carouselRoot.addEventListener('mouseenter', stopAutoplay);
    carouselRoot.addEventListener('mouseleave', startAutoplay);

    // Pause autoplay saat tab tidak aktif (hemat resource HP)
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopAutoplay();
        else startAutoplay();
    });

    update();
    startAutoplay();
})();

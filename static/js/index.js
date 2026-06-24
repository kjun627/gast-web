// Deterministic 2-up carousel: each slide is a fixed 50% of the viewport, and
// the arrows page the track by exactly one viewport width. No measurement race.
function setupGastCarousel(car) {
    var per = parseInt(car.getAttribute('data-per') || '2', 10);
    var viewport = car.querySelector('.gast-viewport');
    var track = car.querySelector('.gast-track');
    var prev = car.querySelector('.gast-prev');
    var next = car.querySelector('.gast-next');
    var count = track.children.length;
    var page = 0;
    var maxPage = Math.max(0, Math.ceil(count / per) - 1);

    function update() {
        track.style.transform = 'translateX(' + (-page * viewport.clientWidth) + 'px)';
        prev.disabled = page <= 0;
        next.disabled = page >= maxPage;
        car.classList.toggle('is-single-page', maxPage === 0);
    }
    prev.addEventListener('click', function () { if (page > 0) { page--; update(); } });
    next.addEventListener('click', function () { if (page < maxPage) { page++; update(); } });
    window.addEventListener('resize', update);
    update();
}

// Start every result video at the same instant, once they have all buffered
// enough to play, so their loops stay visually in phase.
function syncPlayResultVideos() {
    var videos = Array.prototype.slice.call(document.querySelectorAll('.gast-slide video'));
    if (!videos.length) return;
    var started = false;
    var ready = 0;

    function startAll() {
        if (started) return;
        started = true;
        videos.forEach(function (v) {
            try { v.currentTime = 0; } catch (e) { /* not seekable yet */ }
            var p = v.play();
            if (p && p.catch) { p.catch(function () {}); }
        });
    }
    function onReady() { if (++ready >= videos.length) startAll(); }

    videos.forEach(function (v) {
        if (v.readyState >= 3) {
            onReady();
        } else {
            var handler = function () { v.removeEventListener('canplay', handler); onReady(); };
            v.addEventListener('canplay', handler);
        }
    });

    // Fallback: don't wait forever if one video stalls.
    setTimeout(startAll, 5000);
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.gast-carousel').forEach(setupGastCarousel);
    syncPlayResultVideos();
});

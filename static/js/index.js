// Infinite 2-up carousel. A page (per slides) is cloned onto each end; clicking
// an arrow always slides in that arrow's direction, and when we land on a clone
// we teleport (no transition) to the matching real page. So next always moves
// forward and prev always moves back, even across the loop boundary.
function setupGastCarousel(car) {
    var per = parseInt(car.getAttribute('data-per') || '2', 10);
    var viewport = car.querySelector('.gast-viewport');
    var track = car.querySelector('.gast-track');
    var prev = car.querySelector('.gast-prev');
    var next = car.querySelector('.gast-next');
    var reals = Array.prototype.slice.call(track.children);
    var count = reals.length;

    // One page or fewer: show everything, no arrows, no clones.
    if (count <= per) {
        car.classList.add('is-single-page');
        return;
    }

    function cloneSlide(node) {
        var c = node.cloneNode(true);
        var v = c.querySelector('video');
        if (v) { v.removeAttribute('autoplay'); }
        return c;
    }
    reals.slice(count - per).map(cloneSlide).forEach(function (c) {
        track.insertBefore(c, track.firstChild);            // clone of last page -> front
    });
    reals.slice(0, per).map(cloneSlide).forEach(function (c) {
        track.appendChild(c);                               // clone of first page -> back
    });

    var index = per;            // first real slide sits after the front clone page
    var animating = false;
    function slideW() { return viewport.clientWidth / per; }
    function apply(animate) {
        track.style.transition = animate ? 'transform 0.45s ease' : 'none';
        track.style.transform = 'translateX(' + (-index * slideW()) + 'px)';
    }
    apply(false);

    function go(dir) {
        if (animating) return;
        animating = true;
        index += dir * per;
        apply(true);
    }
    track.addEventListener('transitionend', function () {
        if (index >= count + per) { index -= count; apply(false); }
        else if (index < per) { index += count; apply(false); }
        animating = false;
    });

    next.addEventListener('click', function () { go(1); });
    prev.addEventListener('click', function () { go(-1); });
    window.addEventListener('resize', function () { apply(false); });
}

// Start every result video (originals and clones) at the same instant, once
// they have all buffered, so their loops stay in phase.
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

    setTimeout(startAll, 5000);   // fallback if a video stalls
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.gast-carousel').forEach(setupGastCarousel);
    syncPlayResultVideos();
});

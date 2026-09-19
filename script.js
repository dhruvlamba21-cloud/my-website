/* ============================================================
   DHRUV LAMBA — PERSONAL WEBSITE
   ------------------------------------------------------------
   Table of contents:
   0. Setup & feature detection
   1. Page-load entrance sequence
   2. Navbar scroll state
   3. Scroll-reveal (IntersectionObserver)
   4. Active navigation link
   5. Mouse spotlight
   6. Custom cursor
   7. Project card spotlight (follows cursor inside the card)
   8. Parallax + hero scroll transform + wing pulse (single rAF loop)
   9. Dust particles
   10. Footer year
   ============================================================ */

(function () {
    'use strict';

    /* ============================================================
       0. SETUP & FEATURE DETECTION
       ============================================================ */
    var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var finePointerQuery = window.matchMedia('(pointer: fine)');

    var prefersReducedMotion = reduceMotionQuery.matches;
    var hasFinePointer = finePointerQuery.matches;

    // Cursor-following extras (custom cursor, mouse spotlight) only make
    // sense with a precise pointer. Scroll-linked motion (hero transform,
    // parallax, wing pulse) is independent of pointer type — touch users
    // scroll too — so it's gated on reduced-motion alone, further down.
    var enableCursorExtras = hasFinePointer && !prefersReducedMotion;

    /* ============================================================
       1. PAGE-LOAD ENTRANCE SEQUENCE
       ============================================================
       A single short, orchestrated moment (~1–1.3s) rather than a
       loading screen: the navbar, profile, eyebrow, title,
       description and buttons ease in with a small stagger.
    */
    function runEntrance() {
        var root = document.documentElement;

        // Elements with the "entrance" class start hidden by default in
        // CSS. Adding "is-loaded" one frame after first paint lets the
        // transition fire reliably (rather than being skipped because the
        // browser coalesces the class change into the very first frame).
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                root.classList.add('is-loaded');
            });
        });
    }

    /* ============================================================
       2. NAVBAR SCROLL STATE
       ============================================================ */
    var navbar = document.querySelector('.navbar');

    function updateNavbar() {
        if (!navbar) return;
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    /* ============================================================
       3. SCROLL-REVEAL (IntersectionObserver)
       ============================================================
       Elements with class "reveal" (or "reveal-line") fade/slide
       into place the first time they enter the viewport. Each
       group staggers its children via the --d custom property.
    */
    function setupScrollReveal() {
        var groups = document.querySelectorAll('[data-reveal-group]');

        groups.forEach(function (group) {
            var items = group.querySelectorAll('.reveal, .reveal-line');
            items.forEach(function (item, index) {
                item.style.setProperty('--d', index * 0.09 + 's');
            });
        });

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            // Content is already visible via the reduced-motion CSS rules,
            // or IntersectionObserver isn't supported — reveal everything
            // immediately so nothing stays hidden.
            document.querySelectorAll('.reveal, .reveal-line').forEach(function (el) {
                el.classList.add('in-view');
            });
            return;
        }

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
        );

        document.querySelectorAll('.reveal, .reveal-line').forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ============================================================
       4. ACTIVE NAVIGATION LINK
       ============================================================ */
    function setupActiveNav() {
        var sections = document.querySelectorAll('main section[id]');
        var navLinks = document.querySelectorAll('.nav-links a');

        if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

        var linkFor = {};
        navLinks.forEach(function (link) {
            var id = link.getAttribute('href').replace('#', '');
            linkFor[id] = link;
        });

        var navObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    var link = linkFor[entry.target.id];
                    if (!link) return;
                    if (entry.isIntersecting) {
                        navLinks.forEach(function (l) { l.classList.remove('active'); });
                        link.classList.add('active');
                    }
                });
            },
            { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
        );

        sections.forEach(function (section) { navObserver.observe(section); });
    }

    /* ============================================================
       5. MOUSE SPOTLIGHT
       ============================================================
       A large, extremely faint radial light that follows the
       cursor, updated via CSS custom properties for cheap paint.
    */
    function setupSpotlight() {
        var root = document.documentElement;
        var raf = null;
        var pending = { x: 50, y: 40 };

        window.addEventListener(
            'mousemove',
            function (e) {
                pending.x = (e.clientX / window.innerWidth) * 100;
                pending.y = (e.clientY / window.innerHeight) * 100;
                if (raf) return;
                raf = window.requestAnimationFrame(function () {
                    root.style.setProperty('--mx', pending.x + '%');
                    root.style.setProperty('--my', pending.y + '%');
                    raf = null;
                });
            },
            { passive: true }
        );
    }

    /* ============================================================
       6. CUSTOM CURSOR
       ============================================================
       A small dot that tracks the pointer exactly, and a larger
       ring that eases toward it for a soft, premium feel. The ring
       expands slightly over links/buttons/cards.
    */
    function setupCustomCursor() {
        var dot = document.querySelector('.cursor-dot');
        var ring = document.querySelector('.cursor-ring');
        if (!dot || !ring) return;

        var mouseX = window.innerWidth / 2;
        var mouseY = window.innerHeight / 2;
        var ringX = mouseX;
        var ringY = mouseY;
        var revealed = false;

        window.addEventListener(
            'mousemove',
            function (e) {
                mouseX = e.clientX;
                mouseY = e.clientY;
                dot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0) translate(-50%,-50%)';

                // Only reveal the custom cursor once the pointer actually
                // moves, so it never flashes at a default center position.
                if (!revealed) {
                    revealed = true;
                    ringX = mouseX;
                    ringY = mouseY;
                    document.body.classList.add('has-custom-cursor');
                }
            },
            { passive: true }
        );

        function tick() {
            // Ease the ring toward the raw pointer position (lerp).
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            ring.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0) translate(-50%,-50%)';
            window.requestAnimationFrame(tick);
        }
        window.requestAnimationFrame(tick);

        var hoverTargets = document.querySelectorAll(
            'a, button, .skill-row, .project-card, .logo'
        );
        hoverTargets.forEach(function (el) {
            el.addEventListener('mouseenter', function () { ring.classList.add('is-hovering'); });
            el.addEventListener('mouseleave', function () { ring.classList.remove('is-hovering'); });
        });
    }

    /* ============================================================
       7. PROJECT CARD SPOTLIGHT
       ============================================================
       A soft light that follows the cursor inside the project
       card only, via the --px/--py custom properties.
    */
    function setupProjectSpotlight() {
        var cards = document.querySelectorAll('.project-card');
        cards.forEach(function (card) {
            card.addEventListener(
                'mousemove',
                function (e) {
                    var rect = card.getBoundingClientRect();
                    var x = ((e.clientX - rect.left) / rect.width) * 100;
                    var y = ((e.clientY - rect.top) / rect.height) * 100;
                    card.style.setProperty('--px', x + '%');
                    card.style.setProperty('--py', y + '%');
                },
                { passive: true }
            );
        });
    }

    /* ============================================================
       8. PARALLAX + HERO SCROLL TRANSFORM + WING PULSE
       ============================================================
       One rAF-throttled scroll loop drives every scroll-linked
       effect so we only read layout once per frame:
         - navbar background swap
         - hero content/profile scale + fade as you leave the hero
         - background layers drifting at different, slow speeds
         - a slow, periodic brightening/dimming of the wings
    */
    function setupScrollMotion() {
        var hero = document.querySelector('.hero');
        var root = document.documentElement;
        var glowOne = document.querySelector('.glow-one');
        var glowTwo = document.querySelector('.glow-two');
        var wingsLeft = document.querySelector('.wing-wrap.left');
        var wingsRight = document.querySelector('.wing-wrap.right');
        var particles = document.querySelector('.particles');

        var ticking = false;
        var heroHeight = hero ? hero.offsetHeight : window.innerHeight;
        var atmosphereFrame = 0;

        function measure() {
            heroHeight = hero ? hero.offsetHeight : window.innerHeight;
        }

        function update() {
            ticking = false;
            var scrollY = window.scrollY || window.pageYOffset;

            updateNavbar();

            // --- hero scroll transform (0 -> 1 across the hero's own height) ---
            // Updated every frame: this is the one scroll-linked effect the
            // eye tracks directly, so it needs to feel perfectly attached.
            var progress = Math.min(scrollY / (heroHeight * 0.9), 1);
            root.style.setProperty('--scroll-progress', progress.toFixed(3));

            // --- background parallax (transform only) ---
            // These layers move extremely subtly (0.05–0.15x scroll speed),
            // so refreshing them at a third of the frame rate is visually
            // indistinguishable from every frame, but cuts the repaint cost
            // of the large blurred SVG/gradient layers by ~3x.
            atmosphereFrame++;
            if (atmosphereFrame % 3 === 0) {
                if (glowOne) glowOne.style.transform = 'translate3d(0,' + Math.round(scrollY * 0.1) + 'px,0)';
                if (glowTwo) glowTwo.style.transform = 'translate3d(0,' + Math.round(scrollY * -0.08) + 'px,0)';
                if (wingsLeft) wingsLeft.style.transform = 'translate(8%,0) scaleX(-1) translateY(' + Math.round(scrollY * 0.05) + 'px)';
                if (wingsRight) wingsRight.style.transform = 'translate(-8%,0) translateY(' + Math.round(scrollY * 0.05) + 'px)';
                if (particles) particles.style.transform = 'translate3d(0,' + Math.round(scrollY * 0.15) + 'px,0)';

                // --- wings slowly brighten then fade back as you pass through
                //     each viewport height, so the presence feels alive rather
                //     than static, without ever becoming obvious ---
                var cycle = (scrollY % (window.innerHeight * 1.6)) / (window.innerHeight * 1.6);
                var pulse = 0.07 + Math.sin(cycle * Math.PI) * 0.05;
                root.style.setProperty('--wing-opacity', pulse.toFixed(3));
            }
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', measure, { passive: true });
        measure();
        update();
    }

    /* ============================================================
       9. DUST PARTICLES
       ============================================================
       A handful of faint floating particles, generated once with
       randomised position/size/timing, then animated purely in
       CSS (no per-frame JS cost).
    */
    function setupParticles() {
        var container = document.querySelector('.particles');
        if (!container) return;

        var count = window.innerWidth < 700 ? 7 : 14;

        for (var i = 0; i < count; i++) {
            var el = document.createElement('div');
            el.className = 'particle';

            var size = 1.5 + Math.random() * 2.5;
            var left = Math.random() * 100;
            var duration = 18 + Math.random() * 16;
            var delay = Math.random() * -30;
            var drift = (Math.random() * 60 - 30).toFixed(0) + 'px';
            var opacity = (0.15 + Math.random() * 0.3).toFixed(2);

            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.left = left + '%';
            el.style.setProperty('--p-dx', drift);
            el.style.setProperty('--p-op', opacity);
            el.style.animationDuration = duration + 's';
            el.style.animationDelay = delay + 's';

            container.appendChild(el);
        }
    }

    /* ============================================================
       10. FOOTER YEAR
       ============================================================ */
    function setupFooterYear() {
        var yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    }

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        runEntrance();
        updateNavbar();
        setupScrollReveal();
        setupActiveNav();
        setupParticles();
        setupProjectSpotlight();
        setupFooterYear();

        if (enableCursorExtras) {
            setupSpotlight();
            setupCustomCursor();
        }

        if (!prefersReducedMotion) {
            setupScrollMotion();
        } else {
            // Still keep the navbar responsive to scroll when the heavier
            // scroll-linked motion is switched off for reduced motion.
            window.addEventListener('scroll', updateNavbar, { passive: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

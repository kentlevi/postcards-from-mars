/**
 * Postcards from Mars - Cinematic Interaction (Phase 2)
 * GSAP + Lenis + Canvas Dust + Velocity tracking
 */

// 1. Utility: Spans for letters
function splitTextCustom() {
    const targets = document.querySelectorAll('.split-text-target');
    targets.forEach(target => {
        if(target.classList.contains('splitted')) return;
        let words = target.innerText.split(' ');
        let html = '';
        words.forEach(word => {
            html += `<span class="word line"><span class="word-inner line-inner">`;
            let chars = word.split('');
            chars.forEach(char => { html += `<span class="char">${char}</span>`; });
            html += `</span></span> `
        });
        target.innerHTML = html;
        target.classList.add('splitted');
    });
}

// 1.5 Utility: Scramble Text Effect (Signal Section)
function scrambleText(element) {
    const originalText = element.getAttribute('data-text') || element.innerText;
    element.innerText = '';
    element.style.opacity = 1;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    const duration = 2000; // 2s
    const startTime = performance.now();
    
    function update(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Number of characters finalized based on progress
        const resolvedLength = Math.floor(originalText.length * progress);
        
        let display = '';
        for(let i = 0; i < originalText.length; i++) {
            if(i < resolvedLength) {
                display += originalText[i]; // Final char
            } else if (originalText[i] === ' ') {
                display += ' ';
            } else {
                display += chars[Math.floor(Math.random() * chars.length)]; // Random char
            }
        }
        
        element.innerText = display;
        if(progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// 2. Dust Particle System (Canvas)
function initDustCanvas() {
    const canvas = document.getElementById('dust-particles');
    const ctx = canvas.getContext('2d');
    let width, height, particles;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    particles = Array.from({ length: 450 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.2, // Variety of star sizes
        vx: (Math.random() - 0.5) * 0.05, // Much slower stellar drift
        vy: (Math.random() - 0.5) * 0.05,
        alpha: Math.random() * 0.8 + 0.1
    }));

    function draw() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if(p.x < 0) p.x = width;
            if(p.x > width) p.x = 0;
            if(p.y < 0) p.y = height;
            if(p.y > height) p.y = 0;

            // Subtle stellar twinkle effect
            if (Math.random() < 0.005) {
                p.alpha = Math.random() * 0.8 + 0.1;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; // Brilliant white starlight
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// 3. Lenis Smooth Scroll + Velocity Tracker
let currentLenis;

function initLenis() {
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        smooth: true,
        touchMultiplier: 2,
    });
    currentLenis = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
}

// 4. Custom Cursor
function initCursor() {
    if (window.innerWidth < 1024) return;
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const links = document.querySelectorAll('a, button, .hover-reveal');
    const magneticElements = document.querySelectorAll('.magnetic');

    const cursorX = gsap.quickTo(cursor, "x", {duration: 0.1, ease: "power3.out"});
    const cursorY = gsap.quickTo(cursor, "y", {duration: 0.1, ease: "power3.out"});
    const followerX = gsap.quickTo(follower, "x", {duration: 0.6, ease: "power3.out"});
    const followerY = gsap.quickTo(follower, "y", {duration: 0.6, ease: "power3.out"});

    window.addEventListener('mousemove', (e) => {
        cursorX(e.clientX); cursorY(e.clientY);
        followerX(e.clientX); followerY(e.clientY);
    });

    links.forEach(link => {
        link.addEventListener('mouseenter', () => follower.classList.add('active'));
        link.addEventListener('mouseleave', () => follower.classList.remove('active'));
    });

    magneticElements.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.4, y: y * 0.4, duration: 0.5, ease: "power3.out" });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
        });
    });
}

// 5. Cinematic Animations (Timelines & ScrollTrigger)
function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Initial states
    gsap.set('.char', { y: '100%' });
    gsap.set('.fade-up-target', { y: 30, opacity: 0 });
    gsap.set('.nav', { y: -20, opacity: 0 });

    // --- A. LOAD ANIMATION (Orbital Section Focus) ---
    const loadTl = gsap.timeline({ onComplete: () => document.body.classList.remove('loading') });
    
    // Planet enters slowly
    // CRITICAL FIX: Decoupled intro animation from the scrub container to prevent GSAP property fighting and vanishing!
    gsap.fromTo('.orbital-entry', { opacity: 0 }, { opacity: 1, duration: 2, ease: 'power2.out' });
    gsap.fromTo('.planet-sphere', 
        { scale: 0.3, rotationZ: -10 },
        { scale: 1, rotationZ: 0, duration: 4, ease: 'power2.out' }
    );
    loadTl.to('.orbital-entry .char', { y: '0%', duration: 1.2, ease: 'expo.out', stagger: 0.02, delay: 0.5 })
          .to('.orbital-entry .fade-up-target', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, "-=1")
          .to('.nav', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, "-=1");

    // --- B. ORBITAL SCRUB (Zooming into planet) ---
    gsap.to('.planet-container', {
        scale: 5,
        rotationZ: 45,
        opacity: 0,
        filter: 'blur(20px)',
        ease: "none",
        scrollTrigger: {
            trigger: ".orbital-entry",
            start: "top top",
            end: "bottom top",
            scrub: true,
            pin: true
        }
    });

    // --- C. HERO REVEAL ---
    ScrollTrigger.create({
        trigger: ".hero",
        start: "top 60%",
        onEnter: () => {
            gsap.to('.hero .char', { y: '0%', duration: 1, stagger: 0.02, ease: "expo.out" });
            gsap.to('.hero .fade-up-target', { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.2 });
        }
    });

    gsap.to('.hero-bg', {
        yPercent: 30, scale: 1.1, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });

    // --- D. SIGNAL SECTION (Scramble Effect) ---
    ScrollTrigger.create({
        trigger: ".signal-section",
        start: "top 70%",
        onEnter: () => {
            const targets = document.querySelectorAll('.signal-section .scramble-target');
            targets.forEach(t => scrambleText(t));
        }
    });

    // --- E. PINNED GALLERY (Horizontal Scroll) ---
    const galleryWrapper = document.querySelector('.horizontal-scroll-container');
    ScrollTrigger.create({
        trigger: ".gallery-pinned", start: "top 70%",
        onEnter: () => gsap.to('.gallery-pinned .char', { y: '0%', duration: 1, stagger: 0.02, ease: "expo.out" })
    });

    gsap.to(galleryWrapper, {
        x: () => -(galleryWrapper.scrollWidth - window.innerWidth + (window.innerWidth * 0.1)),
        ease: "none",
        scrollTrigger: {
            trigger: ".gallery-pinned",
            start: "top top",
            end: () => "+=" + galleryWrapper.scrollWidth,
            pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
        }
    });

    // --- F. ARTIFACT REVEAL ---
    ScrollTrigger.create({
        trigger: ".artifact-section", start: "top 50%",
        onEnter: () => {
            gsap.to('.artifact-section .char', { y: '0%', duration: 1, stagger: 0.02, ease: "expo.out" });
            gsap.to('.artifact-section .fade-up-target', { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.2 });
        }
    });

    // --- G. ENDLESS TERRAIN PARALLAX ---
    ScrollTrigger.create({
        trigger: ".terrain-parallax", start: "top 70%",
        onEnter: () => gsap.to('.terrain-parallax .char', { y: '0%', duration: 1, stagger: 0.04, ease: "expo.out" })
    });
    const terrainLayers = document.querySelectorAll('.terrain-layer');
    terrainLayers.forEach(layer => {
        const speed = layer.getAttribute('data-speed');
        gsap.to(layer, {
            yPercent: -(speed * 20),
            ease: "none",
            scrollTrigger: {
                trigger: ".terrain-parallax",
                start: "top bottom", end: "bottom top", scrub: true
            }
        });
    });

    // --- H. STORY PARALLAX ---
    const storyElements = document.querySelectorAll('.story-images .parallax-element');
    storyElements.forEach(el => {
        const speed = el.getAttribute('data-speed');
        gsap.to(el, { y: `-${speed * 20}%`, ease: "none",
            scrollTrigger: { trigger: ".story-section", start: "top bottom", end: "bottom top", scrub: true }
        });
    });
    ScrollTrigger.create({
        trigger: ".story-section", start: "top 60%",
        onEnter: () => {
            gsap.to('.story-section .char', { y: '0%', duration: 1, stagger: 0.02, ease: "expo.out" });
            gsap.to('.story-section .fade-up-target', { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.2 });
        }
    });

    // --- I. FINAL CTA ---
    gsap.fromTo('.final-bg', 
        { yPercent: -30, scale: 1.1 }, 
        { yPercent: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: ".final-cta", start: "top bottom", end: "bottom bottom", scrub: true }
    });
    ScrollTrigger.create({
        trigger: ".final-cta", start: "top 50%",
        onEnter: () => {
            gsap.to('.final-cta .char', { y: '0%', duration: 1, stagger: 0.03, ease: "expo.out" });
            gsap.to('.final-cta .fade-up-target', { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.3 });
        }
    });
}

// 6. Navigation Smooth Routing
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId !== '#' && currentLenis) {
                e.preventDefault();
                currentLenis.scrollTo(targetId, {
                    offset: 0,
                    duration: 2, // Smooth, slow cinematic pan
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            }
        });
    });
}

// Master Init
window.addEventListener('load', () => {
    splitTextCustom();
    initDustCanvas(); // Stellar Canvas
    initLenis();
    initNavigation(); // Bind Lenis routing to the header links
    initCursor();
    initAnimations();
});

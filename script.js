document.body.classList.add('js-ready');

document.getElementById('year').textContent = new Date().getFullYear();

const navbar = document.querySelector('.navbar');
const reveals = document.querySelectorAll('.reveal');
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('nav a');
const cursorGlow = document.querySelector('.cursor-glow');
const projectCard = document.querySelector('.project-card');

// Reveal elements as they enter the viewport.
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

reveals.forEach(el => revealObserver.observe(el));

// Keep the navigation visually distinct once the page starts scrolling.
const updateNavbar = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
};
updateNavbar();
window.addEventListener('scroll', updateNavbar, { passive: true });

// Highlight whichever section is currently in view.
const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.remove('active'));
        const active = document.querySelector(`nav a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
    });
}, { threshold: 0.15, rootMargin: '-25% 0px -55% 0px' });

sections.forEach(section => activeObserver.observe(section));

// Subtle mouse light and project-card spotlight on desktop.
const finePointer = window.matchMedia('(pointer: fine)').matches;
if (finePointer) {
    document.body.classList.add('pointer-active');

    window.addEventListener('pointermove', (event) => {
        cursorGlow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;

        if (projectCard) {
            const rect = projectCard.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            projectCard.style.setProperty('--mx', `${x}%`);
            projectCard.style.setProperty('--my', `${y}%`);
        }
    }, { passive: true });
}

// Smooth anchor navigation without extra libraries.
navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

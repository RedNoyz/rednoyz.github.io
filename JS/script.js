/* ---------- Sidebar ---------- */
const sidebar  = document.querySelector('.sidebar');
const toggle   = document.querySelector('.sidebar .toggle');
const STORE_KEY = 'rednoyz:sidebar';

if (sidebar) {
  /* Restore persisted state (desktop only — mobile is a dock) */
  if (localStorage.getItem(STORE_KEY) === 'open') {
    sidebar.classList.add('open');
  }

  if (toggle) {
    const setOpen = (open) => {
      sidebar.classList.toggle('open', open);
      try { localStorage.setItem(STORE_KEY, open ? 'open' : 'closed'); } catch (_) {}
    };
    toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(!sidebar.classList.contains('open'));
      }
    });
  }
}

/* Mark active nav item from current URL */
const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
document.querySelectorAll('.nav-item').forEach(item => {
  const link = item.querySelector('a.nav-link');
  if (!link) return;
  const href = (link.getAttribute('href') || '').toLowerCase();
  if (href && (href === here || (here === '' && href === 'index.html'))) {
    document.querySelectorAll('.nav-item.active').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  }
});

/* ---------- Scroll reveal ---------- */
const revealTargets = document.querySelectorAll(
  '.hero-inner, .card, .page-header, .stat-card, .service, .project-card, .timeline-item'
);
revealTargets.forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach(el => io.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('in'));
}

/* ---------- Animate skill bars when visible ---------- */
const fills = document.querySelectorAll('.fill[data-target]');
if ('IntersectionObserver' in window && fills.length) {
  const fio = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target.dataset.target;
        requestAnimationFrame(() => { entry.target.style.width = target; });
        fio.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  fills.forEach(f => fio.observe(f));
} else {
  fills.forEach(f => { f.style.width = f.dataset.target; });
}

/* ---------- Marquee: seamless infinite scroll ---------- */
function setupMarquees() {
  document.querySelectorAll('.marquee').forEach(marquee => {
    const track = marquee.querySelector('.marquee-track');
    if (!track || track.dataset.ready === '1') return;

    /* Treat whatever is currently in the track as one repeating "unit".
       Animation will translate by exactly that unit width, so the next
       copy lands precisely where the original started — no seam, no gap. */
    const snapshot = track.innerHTML;
    const unitWidth = track.scrollWidth;
    if (!unitWidth) return;

    /* Need one full unit of content to remain visible after the loop
       point — otherwise the right edge shows blank space. */
    const needed = unitWidth + window.innerWidth;
    let guard = 0;
    while (track.scrollWidth < needed && guard++ < 8) {
      track.insertAdjacentHTML('beforeend', snapshot);
    }

    track.style.setProperty('--marquee-end', `-${unitWidth}px`);
    track.dataset.ready = '1';
  });
}

/* Wait for icon font / web fonts so widths are accurate. */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(setupMarquees);
} else {
  window.addEventListener('load', setupMarquees);
}

/* ---------- Tilt effect on cards (subtle, desktop only) ---------- */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.card, .project-card, .stat-card, .service').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    });
  });
}

/* ---------- Year ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Sidebar ---------- */
const sidebar  = document.querySelector('.sidebar');
const toggle   = sidebar ? sidebar.querySelector('.toggle') : null;
const STORE_KEY = 'rednoyz:sidebar';

const readState  = () => { try { return localStorage.getItem(STORE_KEY); } catch (_) { return null; } };
const writeState = (val) => { try { localStorage.setItem(STORE_KEY, val); } catch (_) {} };

if (sidebar) {
  const setOpen = (open) => {
    sidebar.classList.toggle('open', open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    writeState(open ? 'open' : 'closed');
  };

  /* Apply persisted state without first-paint animation */
  if (readState() === 'open') {
    sidebar.classList.add('no-anim', 'open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => sidebar.classList.remove('no-anim'));
    });
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      setOpen(!sidebar.classList.contains('open'));
    });
  }

  /* Esc to close */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      setOpen(false);
    }
  });
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

/* ---------- Coming Soon: locked cards evade the cursor ---------- */
(() => {
  const cards = Array.from(document.querySelectorAll('.cs-locked-card'));
  const stage = document.querySelector('.coming-soon-card');
  if (!cards.length || !stage) return;

  const SCARED_MS    = 5000;
  const SCARED_R     = 140;
  const MOVE_THROTTLE = 80;
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const state = new Map();

  const captureHome = (card) => {
    const prevTransform  = card.style.transform;
    const prevTransition = card.style.transition;
    card.style.transition = 'none';
    card.style.transform  = '';
    const r = card.getBoundingClientRect();
    card.style.transform  = prevTransform;
    requestAnimationFrame(() => { card.style.transition = prevTransition; });
    return {
      hcx: r.left + window.scrollX + r.width  / 2,
      hcy: r.top  + window.scrollY + r.height / 2,
      w:   r.width,
      h:   r.height,
    };
  };

  cards.forEach(card => {
    const home = captureHome(card);
    state.set(card, {
      x: 0, y: 0, r: 0,
      scared: false,
      scaredUntil: 0,
      returnTimer: null,
      ...home,
    });
    card.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)';
    card.style.willChange = 'transform';
    card.style.cursor     = 'pointer';
    card.style.position   = 'relative';
    card.style.zIndex     = '2';
    card.style.touchAction = 'manipulation';
  });

  const apply = (card) => {
    const s = state.get(card);
    card.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)`;
  };

  const goHome = (card) => {
    const s = state.get(card);
    s.x = 0; s.y = 0; s.r = 0;
    card.style.transform = '';
  };

  const escape = (card, fromX, fromY, strength = 1) => {
    const s = state.get(card);
    const stageRect = stage.getBoundingClientRect();

    /* Card's current visual center (client coords) */
    const ccx = s.hcx - window.scrollX + s.x;
    const ccy = s.hcy - window.scrollY + s.y;

    /* Vector AWAY from the cursor */
    let dx = ccx - fromX;
    let dy = ccy - fromY;
    let len = Math.hypot(dx, dy);
    if (len < 1) {
      const a = Math.random() * Math.PI * 2;
      dx = Math.cos(a); dy = Math.sin(a); len = 1;
    }
    const dist  = (70 + Math.random() * 110) * strength;
    const pushX = (dx / len) * dist + (Math.random() - 0.5) * 60;
    const pushY = (dy / len) * dist + (Math.random() - 0.5) * 60;

    /* Clamp the new center within the stage */
    const pad   = 8;
    const minCX = stageRect.left   + pad + s.w / 2;
    const maxCX = stageRect.right  - pad - s.w / 2;
    const minCY = stageRect.top    + pad + s.h / 2;
    const maxCY = stageRect.bottom - pad - s.h / 2;

    const nextCX = Math.max(minCX, Math.min(maxCX, ccx + pushX));
    const nextCY = Math.max(minCY, Math.min(maxCY, ccy + pushY));

    s.x  = nextCX - (s.hcx - window.scrollX);
    s.y  = nextCY - (s.hcy - window.scrollY);
    s.r += (Math.random() - 0.5) * 28;
    apply(card);
  };

  /* Click any card → it bolts; the others get startled a bit; all enter scared mode */
  cards.forEach(card => {
    card.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const now = performance.now();
      cards.forEach(c => {
        const s = state.get(c);
        s.scared = true;
        s.scaredUntil = now + SCARED_MS;
        if (s.returnTimer) { clearTimeout(s.returnTimer); s.returnTimer = null; }
      });
      escape(card, e.clientX, e.clientY, 1.4);
      cards.forEach(c => { if (c !== card) escape(c, e.clientX, e.clientY, 0.55); });
    });
  });

  /* While scared → dodge the cursor when it gets close */
  if (supportsHover) {
    let last = 0;
    document.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - last < MOVE_THROTTLE) return;
      last = now;
      cards.forEach(card => {
        const s = state.get(card);
        if (!s.scared) return;
        if (now > s.scaredUntil) {
          s.scared = false;
          if (s.returnTimer) clearTimeout(s.returnTimer);
          s.returnTimer = setTimeout(() => goHome(card), 650);
          return;
        }
        const ccx = s.hcx - window.scrollX + s.x;
        const ccy = s.hcy - window.scrollY + s.y;
        if (Math.hypot(ccx - e.clientX, ccy - e.clientY) < SCARED_R) {
          escape(card, e.clientX, e.clientY, 0.5);
        }
      });
    });
  }

  /* Recapture home positions on resize */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cards.forEach(card => {
        const fresh = captureHome(card);
        const s = state.get(card);
        s.hcx = fresh.hcx; s.hcy = fresh.hcy; s.w = fresh.w; s.h = fresh.h;
      });
    }, 150);
  });
})();

/* ---------- Year ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

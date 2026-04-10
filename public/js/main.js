import './contact.js';
import { initSplineScene }  from './splineScene.js';
import { initShaderLoader } from './shaderLoader.js';

// ── Boot Sequence ────────────────────────────────────────────────────────────
(function () {
  const boot    = document.getElementById('boot-screen');
  const bar     = document.getElementById('boot-bar');
  const lines   = ['bl0', 'bl1', 'bl2', 'bl3', 'bl4'];
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (REDUCED) {
    boot.style.display = 'none';
    startSite();
    return;
  }

  // Start the shader animation behind the boot content
  const destroyShader = initShaderLoader();

  let i = 0;
  function showNextLine() {
    if (i < lines.length) {
      document.getElementById(lines[i]).classList.add('show');
      i++;
      setTimeout(showNextLine, 320);
    }
  }
  showNextLine();
  setTimeout(() => { bar.style.width = '100%'; }, 50);
  setTimeout(() => {
    boot.classList.add('fade-out');
    setTimeout(() => {
      boot.style.display = 'none';
      // Clean up WebGL resources after the boot screen is gone
      if (destroyShader) destroyShader();
      startSite();
    }, 650);
  }, 2400);
})();

// ── Typewriter ───────────────────────────────────────────────────────────────
function startSite() {
  const roleEl = document.getElementById('hero-role');
  const roles  = ['Software Engineer', 'Systems Developer', 'Backend Engineer'];
  let ri = 0, ci = 0, deleting = false;

  function typeStep() {
    const word = roles[ri];
    if (!deleting) {
      roleEl.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(typeStep, 2200); return; }
    } else {
      roleEl.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; }
    }
    setTimeout(typeStep, deleting ? 50 : 80);
  }
  setTimeout(typeStep, 300);
}

// ── Scroll Progress Bar ──────────────────────────────────────────────────────
const progressBar = document.getElementById('scroll-progress');
function updateProgress() {
  const scrolled = window.scrollY;
  const total    = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
}
window.addEventListener('scroll', updateProgress, { passive: true });

// ── Apple-style Scroll Reveal ────────────────────────────────────────────────
// Handles .reveal, .reveal-left, .reveal-scale — all with spring easing via CSS
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealSelectors = '.reveal, .reveal-left, .reveal-scale';
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target); // fire once
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(revealSelectors).forEach(el => {
  if (REDUCED_MOTION) { el.classList.add('visible'); return; }
  revealObs.observe(el);
});

// ── Parallax ─────────────────────────────────────────────────────────────────
// data-parallax="0.3" → element moves 30% of scroll speed (slower = depth)
const parallaxEls = document.querySelectorAll('[data-parallax]');

function applyParallax() {
  const scrollY = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    el.style.transform = `translateY(${scrollY * speed}px)`;
  });
}

if (!REDUCED_MOTION && parallaxEls.length) {
  window.addEventListener('scroll', applyParallax, { passive: true });
}

// ── Particle Network Canvas ──────────────────────────────────────────────────
const canvas = document.getElementById('hero-canvas');
const ctx    = canvas.getContext('2d');
let particles = [], rafId;

function resizeCanvas() {
  const hero    = document.getElementById('hero');
  canvas.width  = hero.offsetWidth;
  canvas.height = hero.offsetHeight;
}

class Particle {
  constructor() { this.reset(true); }
  reset(init) {
    this.x  = Math.random() * canvas.width;
    const edgeY = Math.random() > 0.5 ? 0 : canvas.height;
    this.y  = init ? Math.random() * canvas.height : edgeY;
    this.vx = (Math.random() - 0.5) * 0.35;
    this.vy = (Math.random() - 0.5) * 0.35;
    this.r  = Math.random() * 1.2 + 0.4;
    this.a  = Math.random() * 0.35 + 0.08;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) {
      this.reset(false);
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${this.a})`;
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  if (REDUCED_MOTION) return;
  const n = Math.min(Math.floor((canvas.width * canvas.height) / 13000), 90);
  for (let i = 0; i < n; i++) particles.push(new Particle());
}

function drawLines() {
  const D = 140;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < D) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(255,255,255,${(1 - d / D) * 0.1})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawLines();
  rafId = requestAnimationFrame(animate);
}

const heroSection = document.getElementById('hero');
new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { if (!rafId) animate(); }
    else { cancelAnimationFrame(rafId); rafId = null; }
  });
}).observe(heroSection);

window.addEventListener('resize', () => { resizeCanvas(); initParticles(); }, { passive: true });
resizeCanvas();
initParticles();
if (!REDUCED_MOTION) animate();

// ── Active nav on scroll ─────────────────────────────────────────────────────
const navLinks   = document.querySelectorAll('.nav-link');
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.getAttribute('id');
      navLinks.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('href') === '#' + id) l.classList.add('active');
      });
    }
  });
}, { threshold: 0.35 });
document.querySelectorAll('section[id]').forEach(s => sectionObs.observe(s));

// ── Mobile menu ──────────────────────────────────────────────────────────────
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
let menuOpen = false;

function closeMobileMenu() {
  menuOpen = false;
  menuToggle.setAttribute('aria-expanded', 'false');
  mobileMenu.style.maxHeight = '0';
  mobileMenu.style.opacity   = '0';
}

menuToggle.addEventListener('click', () => {
  menuOpen = !menuOpen;
  menuToggle.setAttribute('aria-expanded', menuOpen);
  mobileMenu.style.maxHeight = menuOpen ? '400px' : '0';
  mobileMenu.style.opacity   = menuOpen ? '1'     : '0';
});

document.addEventListener('click', e => {
  if (menuOpen && !menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) closeMobileMenu();
});

document.querySelectorAll('#mobile-menu .nav-link').forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});

// ── Navbar glow on scroll ────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const inner = document.getElementById('nav-inner');
  inner.style.boxShadow = window.scrollY > 60
    ? '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)'
    : 'none';
}, { passive: true });

// ── Stat counters ────────────────────────────────────────────────────────────
function animCounter(el, target, suffix, dec) {
  if (REDUCED_MOTION) { el.textContent = (dec > 0 ? target.toFixed(dec) : target) + suffix; return; }
  const dur = 1800, t0 = performance.now();
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    const v = dec > 0 ? (target * e).toFixed(dec) : Math.floor(target * e);
    el.textContent = v + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = (dec > 0 ? target.toFixed(dec) : target) + suffix;
  })(t0);
}

let counted   = false;
const statEls = document.querySelectorAll('.stat-num');
new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !counted) {
      counted = true;
      statEls.forEach(el => animCounter(
        el,
        parseFloat(el.dataset.target),
        el.dataset.suffix,
        parseInt(el.dataset.decimals)
      ));
    }
  });
}, { threshold: 0.5 }).observe(statEls[0]?.closest('.hud-card') || document.body);

// ── Glitch on heading hover ──────────────────────────────────────────────────
if (!REDUCED_MOTION) {
  document.querySelectorAll('h1, h2, h3').forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.animation = 'glitchText 0.22s steps(3)';
      el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
    });
  });
}

// ── Magnetic button effect ───────────────────────────────────────────────────
// Buttons gently follow cursor within their bounds (Apple-style interaction)
if (!REDUCED_MOTION) {
  document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect   = btn.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const strength = 5; // px max offset
      btn.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });
}

// ── Tilt effect on hud-cards ─────────────────────────────────────────────────
// Subtle 3-D tilt as cursor moves over a card (Apple Vision Pro feel)
if (!REDUCED_MOTION && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.hud-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const x     = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 → 0.5
      const y     = (e.clientY - rect.top)  / rect.height - 0.5;
      const tiltX =  y * 6;  // degrees
      const tiltY = -x * 6;
      card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease';
      card.style.transform  = '';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
}

// ── Reduced motion fallback ──────────────────────────────────────────────────
if (REDUCED_MOTION) {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(el => el.classList.add('visible'));
  document.querySelectorAll('.btn-star-light').forEach(el => { el.style.animation = 'none'; });
}

// ── Star button offset-path initialization ───────────────────────────────────
function initStarButtons() {
  document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
    const light = btn.querySelector('.btn-star-light');
    if (!light) return;
    const w = btn.offsetWidth;
    const h = btn.offsetHeight;
    // Rectangular path matching button dimensions; border-radius clips the visuals
    light.style.offsetPath     = `path('M 0 0 H ${w} V ${h} H 0 Z')`;
    light.style.offsetDistance = '0%';
  });
}

// Run once layout is stable, then re-run on resize
requestAnimationFrame(() => { requestAnimationFrame(initStarButtons); });
let _starResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_starResizeTimer);
  _starResizeTimer = setTimeout(initStarButtons, 150);
}, { passive: true });

// ── Interactive 3D scene ─────────────────────────────────────────────────────
initSplineScene();



import { Application } from '@splinetool/runtime';

const SCENE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

export async function initSplineScene() {
  if (window.innerWidth < 1024) return;

  const canvas = document.getElementById('spline-canvas');
  const hero   = document.getElementById('hero');
  const loader = document.getElementById('spline-loader');
  const glow   = document.getElementById('hero-mouse-light');
  const hud    = document.getElementById('spline-hud');

  if (!canvas || !hero) return;

  // Canvas never intercepts real pointer events — UI buttons/links stay clickable.
  // We forward events manually so Spline still receives them everywhere.
  canvas.style.pointerEvents = 'none';

  let heroInView = true;

  document.addEventListener('pointermove', (e) => {
    // Update CSS radial glow
    if (glow && heroInView) {
      const x = (e.clientX / window.innerWidth)  * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      glow.style.setProperty('--mx', x + '%');
      glow.style.setProperty('--my', y + '%');
      glow.style.opacity = '1';
    }

    if (!heroInView) return;

    // Spline's runtime (Three.js) listens for 'pointermove' on the canvas.
    // Dispatch a synthetic PointerEvent so it fires regardless of which
    // element the real cursor is over.
    canvas.dispatchEvent(new PointerEvent('pointermove', {
      clientX:    e.clientX,
      clientY:    e.clientY,
      screenX:    e.screenX,
      screenY:    e.screenY,
      movementX:  e.movementX,
      movementY:  e.movementY,
      pointerId:  e.pointerId,
      pointerType: e.pointerType,
      isPrimary:  e.isPrimary,
      bubbles:    false,
      cancelable: false,
    }));
  });

  document.documentElement.addEventListener('pointerleave', () => {
    if (glow) glow.style.opacity = '0';
  });

  // Disable forwarding when hero is scrolled out of view
  const observer = new IntersectionObserver(
    (entries) => {
      heroInView = entries[0].isIntersecting;
      if (glow) glow.style.opacity = heroInView ? '' : '0';
      if (hud)  hud.style.opacity  = heroInView ? '1' : '0';
    },
    { threshold: 0.05 }
  );
  observer.observe(hero);

  try {
    const app = new Application(canvas);
    await app.load(SCENE_URL);

    if (loader) {
      loader.style.transition = 'opacity 0.4s ease';
      loader.style.opacity    = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 200);
    }
  } catch (err) {
    console.warn('[SplineScene] Failed to load:', err);
    if (loader) {
      loader.innerHTML = `
        <div style="text-align:center; padding:24px;">
          <div style="font-family:'JetBrains Mono',monospace; font-size:0.65rem;
                      letter-spacing:0.1em; color:rgba(255,255,255,0.4);">
            3D_SCENE_UNAVAILABLE
          </div>
        </div>`;
    }
  }
}

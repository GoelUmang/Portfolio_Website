import { Application } from '@splinetool/runtime';

const SCENE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

export async function initSplineScene() {
  // Only run on large screens
  if (window.innerWidth < 1024) return;

  const canvas  = document.getElementById('spline-canvas');
  const card    = document.getElementById('hero-3d-card');
  const loader  = document.getElementById('spline-loader');
  const glow    = document.getElementById('hero-mouse-light');

  if (!canvas || !card) return;

  // ── Mouse-tracking spotlight ────────────────────────────────────────────────
  card.addEventListener('mouseenter', () => {
    if (glow) glow.style.opacity = '1';
  });
  card.addEventListener('mouseleave', () => {
    if (glow) glow.style.opacity = '0';
  });
  card.addEventListener('mousemove', (e) => {
    if (!glow) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    glow.style.setProperty('--mx', x + '%');
    glow.style.setProperty('--my', y + '%');
  });

  // ── Load Spline scene ───────────────────────────────────────────────────────
  try {
    const app = new Application(canvas);
    await app.load(SCENE_URL);

    // Hide loader once scene is ready
    if (loader) {
      loader.style.transition = 'opacity 0.4s ease';
      loader.style.opacity    = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 400);
    }
  } catch (err) {
    console.warn('[SplineScene] Failed to load:', err);
    // Show a fallback glow on error
    if (loader) {
      loader.innerHTML = `
        <div style="text-align:center; padding:24px;">
          <div style="font-family:'JetBrains Mono',monospace; font-size:0.65rem;
                      letter-spacing:0.1em; color:rgba(0,212,255,0.4);">
            3D_SCENE_UNAVAILABLE
          </div>
        </div>`;
    }
  }
}

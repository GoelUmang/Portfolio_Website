import { Application } from '@splinetool/runtime';

const SCENE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

export async function initSplineScene() {

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
  let splineApp  = null;

  let glowRaf = null;
  let mX = 0, mY = 0, sX = 0, sY = 0, dX = 0, dY = 0, pId = 0, pType = '', isPrim = false;

  document.addEventListener('pointermove', (e) => {
    mX = e.clientX; mY = e.clientY;
    sX = e.screenX; sY = e.screenY;
    dX = e.movementX; dY = e.movementY;
    pId = e.pointerId; pType = e.pointerType; isPrim = e.isPrimary;

    if (!glowRaf) {
      glowRaf = requestAnimationFrame(() => {
        // Update CSS radial glow
        if (glow && heroInView) {
          const x = (mX / window.innerWidth)  * 100;
          const y = (mY / window.innerHeight) * 100;
          glow.style.setProperty('--mx', x + '%');
          glow.style.setProperty('--my', y + '%');
          glow.style.opacity = '1';
        }

        if (heroInView) {
          // Spline's runtime (Three.js) listens for 'pointermove' on the canvas.
          // Dispatch a synthetic PointerEvent so it fires natively
          canvas.dispatchEvent(new PointerEvent('pointermove', {
            clientX:    mX,
            clientY:    mY,
            screenX:    sX,
            screenY:    sY,
            movementX:  dX,
            movementY:  dY,
            pointerId:  pId,
            pointerType: pType,
            isPrimary:  isPrim,
            bubbles:    false,
            cancelable: false,
          }));
        }
        glowRaf = null;
      });
    }
  });

  document.documentElement.addEventListener('pointerleave', () => {
    if (glow) glow.style.opacity = '0';
  });

  // Pause/resume Spline render loop based on hero visibility
  const observer = new IntersectionObserver(
    (entries) => {
      heroInView = entries[0].isIntersecting;
      if (glow) glow.style.opacity = heroInView ? '1' : '0';
      if (hud)  hud.style.opacity  = heroInView ? '1' : '0';
      if (splineApp) {
        if (heroInView) splineApp.start?.();
        else            splineApp.stop?.();
      }
    },
    { threshold: 0.05 }
  );
  observer.observe(hero);

  // Pause render loop when browser tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (!splineApp) return;
    if (document.hidden) splineApp.stop?.();
    else if (heroInView) splineApp.start?.();
  });

  try {
    const app = new Application(canvas);
    await app.load(SCENE_URL);
    splineApp = app;

    // Cap pixel ratio — on Retina (dpr=2) the renderer otherwise works at 4× pixels.
    // Capping to 1.5 cuts GPU load by ~44% with imperceptible quality difference.
    const renderer = app._renderer ?? app.renderer;
    if (renderer?.setPixelRatio) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }

    if (loader) {
      loader.style.transition = 'opacity 0.4s ease';
      loader.style.opacity    = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 450);
    }
    return true;
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
    return false;
  }
}

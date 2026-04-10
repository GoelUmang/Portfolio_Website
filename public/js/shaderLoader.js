import * as THREE from 'three';

const vertexShader = /* glsl */`
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

// Concentric-ring shader — adapts the React component to vanilla Three.js
const fragmentShader = /* glsl */`
  precision mediump float;
  uniform vec2  resolution;
  uniform float time;

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t         = time * 0.05;
    float lineWidth = 0.002;

    vec3 color = vec3(0.0);
    for (int j = 0; j < 3; j++) {
      for (int i = 0; i < 5; i++) {
        color[j] += lineWidth * float(i * i)
          / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0
                - length(uv)
                + mod(uv.x + uv.y, 0.2));
      }
    }

    gl_FragColor = vec4(color.r, color.g, color.b, 1.0);
  }
`;

export function initShaderLoader() {
  const canvas = document.getElementById('shader-canvas');
  if (!canvas) return null;

  const camera = new THREE.Camera();
  camera.position.z = 1;

  const scene    = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);

  const uniforms = {
    time:       { value: 1.0 },
    resolution: { value: new THREE.Vector2() },
  };

  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  scene.add(new THREE.Mesh(geometry, material));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(1); // Force 1x pixel ratio for speed on mobile

  const resize = () => {
    const w = canvas.parentElement?.clientWidth  ?? window.innerWidth;
    const h = canvas.parentElement?.clientHeight ?? window.innerHeight;
    renderer.setSize(w, h);
    uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let animId;
  const animate = () => {
    animId = requestAnimationFrame(animate);
    uniforms.time.value += 0.05;
    renderer.render(scene, camera);
  };
  animate();

  // Return a cleanup function to call when boot screen is dismissed
  return function destroy() {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };
}

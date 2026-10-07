/**
 * Hero "Escáner" en WebGL2: un solo fragment shader de pantalla completa (grilla, barrido de
 * radar, scanline y realce bajo el cursor). Reemplaza al canvas 2D que corría por CPU (O(n²)).
 *
 * Presupuesto: no arranca con reduced-motion, Save-Data, redes 2g/3g, <4 GB de RAM, <4 núcleos
 * o pantallas < 768 px. DPR ≤ 1,5. Se pausa fuera de pantalla o con la pestaña oculta.
 * Watchdog: si el promedio de frame supera 24 ms, se apaga solo.
 */
type NavExtra = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };

export function canRunScanner(): boolean {
  const nav = navigator as NavExtra;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (innerWidth < 768) return false;
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /(^|-)(2g|3g)$/.test(nav.connection.effectiveType)) return false;
  if ((nav.deviceMemory ?? 8) < 4) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  return true;
}

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uDpr;
out vec4 o;

float lineAA(float d, float w) { return 1.0 - smoothstep(0.0, w, d); }

void main() {
  vec2 p = gl_FragCoord.xy;
  float cell = 56.0 * uDpr;

  // Grilla y puntos en las intersecciones
  vec2 g = abs(fract(p / cell - 0.5) - 0.5) * cell;
  float grid = max(lineAA(g.x, uDpr), lineAA(g.y, uDpr));
  float dots = lineAA(length(g), 1.8 * uDpr);

  // Radar: anillos + barrido con estela
  vec2 c = vec2(0.62, 0.58) * uRes;
  vec2 d = p - c;
  float r = length(d);
  float R = 150.0 * uDpr;
  float ring = lineAA(abs(mod(r + R * 0.5, R) - R * 0.5), uDpr) * smoothstep(R * 5.5, 0.0, r);
  float ang = atan(d.y, d.x);
  float sweep = mod(uTime * 0.55, 6.2831853);
  float delta = mod(sweep - ang, 6.2831853);
  float trail = exp(-delta * 2.6) * smoothstep(uRes.x * 0.75, 0.0, r);

  // Scanline vertical lenta
  float span = uRes.y * 1.5;
  float sy = uRes.y - (mod(uTime * 46.0 * uDpr, span) - uRes.y * 0.25);
  float dist = abs(p.y - sy);
  float scan = exp(-dist / (46.0 * uDpr)) * 0.10 + lineAA(dist, uDpr) * 0.16;

  // Realce bajo el cursor
  float m = exp(-length(p - uMouse) / (170.0 * uDpr));

  vec3 signal = vec3(1.0, 0.37, 0.09);
  vec3 col = vec3(0.0);
  col += vec3(0.85) * grid * (0.028 + m * 0.10);
  col += signal * dots * (0.06 + trail * 0.75 + m * 0.6);
  col += signal * ring * 0.07;
  col += signal * trail * 0.085;
  col += signal * scan;
  o = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

export function startScanner(canvas: HTMLCanvasElement) {
  if (!canRunScanner()) return;
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  // Triángulo que cubre toda la pantalla
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');
  const uDpr = gl.getUniformLocation(prog, 'uDpr');

  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  function resize() {
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl!.viewport(0, 0, w, h);
    }
    gl!.uniform2f(uRes, w, h);
    gl!.uniform1f(uDpr, dpr);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const host = canvas.closest('section') ?? canvas;
  host.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) * dpr;
    mouse.ty = (r.height - (e.clientY - r.top)) * dpr;
  }, { passive: true });
  host.addEventListener('pointerleave', () => { mouse.tx = -9999; mouse.ty = -9999; });

  let raf = 0;
  let visible = true;
  let last = performance.now();
  let t = 0;
  let slowFrames = 0;
  let frames = 0;

  function frame(now: number) {
    const dt = now - last;
    last = now;
    t += Math.min(dt, 50) / 1000;
    // Watchdog (ignora los primeros frames y los saltos por pestaña en segundo plano)
    frames++;
    if (frames > 30 && dt < 200) {
      slowFrames = dt > 24 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 45) { stop(); canvas.removeAttribute('data-on'); return; }
    }
    mouse.x = mouse.tx < -9000 ? -9999 : mouse.x < -9000 ? mouse.tx : mouse.x + (mouse.tx - mouse.x) * 0.12;
    mouse.y = mouse.ty < -9000 ? -9999 : mouse.y < -9000 ? mouse.ty : mouse.y + (mouse.ty - mouse.y) * 0.12;
    gl!.uniform1f(uTime, t);
    gl!.uniform2f(uMouse, mouse.x, mouse.y);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  function play() { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  canvas.setAttribute('data-on', '');
  play();
}

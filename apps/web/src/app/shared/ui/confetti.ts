/**
 * Explosão de confete para o momento de vitória. Canvas puro, sem lib.
 * Chame `burstConfetti(canvasElement)` — respeita prefers-reduced-motion.
 */
export function burstConfetti(canvas: HTMLCanvasElement, count = 90): void {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;
  const colors = [
    'hsl(152 22% 56%)',
    'hsl(158 39% 40%)',
    'hsl(38 92% 58%)',
    'hsl(190 75% 55%)',
    'hsl(320 62% 62%)',
    'hsl(150 20% 96%)',
  ];

  const parts = Array.from({ length: count }, () => ({
    x: w / 2 + (Math.random() - 0.5) * 40,
    y: h * 0.55,
    vx: (Math.random() - 0.5) * 9,
    vy: -Math.random() * 11 - 4,
    s: 3 + Math.random() * 4,
    rot: Math.random() * 6.28,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0],
  }));

  const start = performance.now();
  let raf = 0;

  const frame = (now: number) => {
    ctx.clearRect(0, 0, w, h);
    let alive = false;
    const life = Math.max(0, 1 - (now - start) / 1800);
    for (const p of parts) {
      p.vy += 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vr;
      if (life > 0 && p.y < h + 20) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = life;
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 1.6);
        ctx.restore();
      }
    }
    if (alive) {
      raf = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  };

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

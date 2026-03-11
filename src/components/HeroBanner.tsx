import { useEffect, useRef, useState } from 'react';

interface HeroBannerProps {
  onlineCount: number;
}

export default function HeroBanner({ onlineCount }: HeroBannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    window.addEventListener('resize', resize);

    // ── Particles ─────────────────────────────────────────────────────────────
    const NUM_PARTICLES = 55;
    const particles = Array.from({ length: NUM_PARTICLES }, () => ({
      x: Math.random() * 400,
      y: Math.random() * 160,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3,
      r: 0.8 + Math.random() * 2.2,
      alpha: 0.15 + Math.random() * 0.55,
      hue: 200 + Math.random() * 100, // blue-violet range
      pulse: Math.random() * Math.PI * 2,
    }));

    // ── Crystal gems ──────────────────────────────────────────────────────────
    type Crystal = {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      rotation: number;
      rotSpeed: number;
      hue: number;
      alpha: number;
      sides: number;
    };
    const NUM_CRYSTALS = 8;
    const crystals: Crystal[] = Array.from({ length: NUM_CRYSTALS }, () => ({
      x: 30 + Math.random() * 340,
      y: 20 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.2,
      size: 6 + Math.random() * 14,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.025,
      hue: [220, 260, 190, 280][Math.floor(Math.random() * 4)],
      alpha: 0.25 + Math.random() * 0.45,
      sides: [3, 4, 6][Math.floor(Math.random() * 3)],
    }));

    // ── Grid lines ────────────────────────────────────────────────────────────
    const GRID_LINES = 8;

    function drawPolygon(
      cx: number, cy: number, r: number,
      sides: number, rot: number,
      fillColor: string, strokeColor: string
    ) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = rot + (i / sides) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    let t = 0;
    function frame() {
      t += 0.012;
      ctx.clearRect(0, 0, W, H);

      // ── Deep space bg (drawn by CSS, canvas stays transparent for overlay) ──

      // ── Perspective grid ──────────────────────────────────────────────────
      const horizon = H * 0.62;
      const vp = { x: W / 2, y: horizon };
      ctx.save();
      for (let i = 0; i < GRID_LINES; i++) {
        const progress = i / (GRID_LINES - 1);
        const x = progress * W;
        const alpha = 0.04 + 0.1 * Math.abs(Math.sin(t * 0.5 + i * 0.4));
        ctx.strokeStyle = `hsla(220, 80%, 65%, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(vp.x, vp.y);
        ctx.lineTo(x, H + 10);
        ctx.stroke();
      }
      // horizontal grid lines
      for (let i = 0; i < 5; i++) {
        const y = horizon + (i / 4) * (H - horizon + 10);
        const width = W * (0.05 + (i / 4) * 0.95);
        const alpha = 0.04 + 0.08 * Math.abs(Math.sin(t * 0.3 + i));
        ctx.strokeStyle = `hsla(220, 70%, 65%, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(W / 2 - width / 2, y);
        ctx.lineTo(W / 2 + width / 2, y);
        ctx.stroke();
      }
      ctx.restore();

      // ── Aurora bands ──────────────────────────────────────────────────────
      for (let band = 0; band < 3; band++) {
        const yOff = 30 + band * 40 + Math.sin(t * 0.7 + band * 1.2) * 18;
        const grad = ctx.createLinearGradient(0, yOff, W, yOff + 30);
        const h = 200 + band * 30;
        grad.addColorStop(0, `hsla(${h}, 90%, 60%, 0)`);
        grad.addColorStop(0.3, `hsla(${h}, 90%, 60%, ${0.04 + 0.03 * Math.sin(t + band)})`);
        grad.addColorStop(0.7, `hsla(${h + 40}, 85%, 65%, ${0.05 + 0.03 * Math.cos(t + band)})`);
        grad.addColorStop(1, `hsla(${h + 40}, 85%, 65%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(W / 2, yOff + 15, W * 0.6, 25 + Math.sin(t + band) * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Particles ─────────────────────────────────────────────────────────
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.04;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 75%, ${a})`);
        grad.addColorStop(1, `hsla(${p.hue}, 90%, 75%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Crystals ──────────────────────────────────────────────────────────
      crystals.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotSpeed;
        if (c.x < -20) c.x = W + 20; if (c.x > W + 20) c.x = -20;
        if (c.y < -20) c.y = H + 20; if (c.y > H + 20) c.y = -20;

        const pulse = 0.8 + 0.2 * Math.sin(t * 1.5 + c.x * 0.05);
        const s = c.size * pulse;

        // outer glow
        const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, s * 2.5);
        glow.addColorStop(0, `hsla(${c.hue}, 90%, 70%, ${c.alpha * 0.4})`);
        glow.addColorStop(1, `hsla(${c.hue}, 90%, 70%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(c.x, c.y, s * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // inner fill
        const inner = ctx.createLinearGradient(c.x - s, c.y - s, c.x + s, c.y + s);
        inner.addColorStop(0, `hsla(${c.hue}, 80%, 80%, ${c.alpha * 0.9})`);
        inner.addColorStop(0.5, `hsla(${c.hue + 30}, 70%, 60%, ${c.alpha * 0.6})`);
        inner.addColorStop(1, `hsla(${c.hue - 20}, 90%, 50%, ${c.alpha * 0.8})`);
        drawPolygon(c.x, c.y, s, c.sides, c.rotation, inner as unknown as string,
          `hsla(${c.hue}, 100%, 90%, ${c.alpha * 0.5})`);

        // specular highlight
        drawPolygon(c.x - s * 0.15, c.y - s * 0.15, s * 0.35, c.sides,
          c.rotation + 0.3,
          `hsla(${c.hue}, 60%, 95%, ${c.alpha * 0.6})`,
          'transparent');
      });

      // ── Scan line ─────────────────────────────────────────────────────────
      const scanY = ((t * 25) % (H + 20)) - 10;
      const scanGrad = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3);
      scanGrad.addColorStop(0, 'hsla(210, 100%, 70%, 0)');
      scanGrad.addColorStop(0.5, 'hsla(210, 100%, 75%, 0.12)');
      scanGrad.addColorStop(1, 'hsla(210, 100%, 70%, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 3, W, 6);

      // ── Corner decorations ────────────────────────────────────────────────
      const corners = [[0, 0], [W, 0], [0, H], [W, H]] as const;
      corners.forEach(([cx, cy]) => {
        const a = 0.15 + 0.1 * Math.sin(t * 1.2);
        ctx.strokeStyle = `hsla(220, 80%, 70%, ${a})`;
        ctx.lineWidth = 1;
        const len = 12;
        ctx.beginPath();
        ctx.moveTo(cx + (cx === 0 ? 6 : -6), cy + (cy === 0 ? 0 : 0));
        ctx.lineTo(cx + (cx === 0 ? 6 + len : -6 - len), cy);
        ctx.moveTo(cx + (cx === 0 ? 6 : -6), cy + (cy === 0 ? 0 : 0));
        ctx.lineTo(cx + (cx === 0 ? 6 : -6), cy + (cy === 0 ? len : -len));
        ctx.stroke();
      });

      animRef.current = requestAnimationFrame(frame);
    }

    animRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden mb-4"
      style={{
        height: 168,
        borderRadius: 24,
        background: 'linear-gradient(135deg, #050d1a 0%, #0a0620 40%, #060d1f 70%, #020810 100%)',
        boxShadow: '0 0 0 1px rgba(100,140,255,0.12), 0 8px 40px rgba(80,100,255,0.18), 0 2px 8px rgba(0,0,0,0.6)',
      }}
    >
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ borderRadius: 24 }}
      />

      {/* Radial glow centre */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, hsla(230,90%,55%,0.13) 0%, transparent 70%)',
          borderRadius: 24,
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 select-none">

        {/* Top badge */}
        <div
          className="flex items-center gap-1.5 mb-2.5"
          style={{
            background: 'linear-gradient(90deg, rgba(80,120,255,0.15), rgba(140,80,255,0.15))',
            border: '1px solid rgba(120,160,255,0.22)',
            borderRadius: 99,
            padding: '2px 10px 2px 6px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 6px #4ade80',
            display: 'inline-block',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(180,210,255,0.85)',
            fontFamily: 'monospace',
          }}>
            LIVE MARKET
          </span>
        </div>

        {/* Main title */}
        <div className="relative flex items-center justify-center mb-1">
          {/* Glow behind text */}
          <div style={{
            position: 'absolute',
            width: '120%',
            height: '200%',
            background: 'radial-gradient(ellipse, hsla(240,100%,65%,0.25) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }} />

          <h2 style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            position: 'relative',
            background: 'linear-gradient(135deg, #a5c8ff 0%, #c4b5fd 35%, #7dd3fc 65%, #a5c8ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px rgba(150,180,255,0.5))',
            fontFamily: '"SF Pro Display", system-ui, sans-serif',
          }}>
            NFT Gifts Market
          </h2>
        </div>

        {/* Subtitle */}
        <p style={{
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(160,190,255,0.45)',
          fontFamily: 'monospace',
          marginBottom: 14,
          fontWeight: 600,
        }}>
          Powered by TON Blockchain
        </p>

        {/* Online pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'linear-gradient(90deg, rgba(10,20,50,0.8), rgba(20,10,50,0.8))',
          border: '1px solid rgba(100,150,255,0.2)',
          borderRadius: 99,
          padding: '5px 14px',
          backdropFilter: 'blur(12px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(60,100,255,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="3" fill="rgba(100,200,255,0.9)" />
              <circle cx="6" cy="6" r="5.5" stroke="rgba(100,200,255,0.3)" strokeWidth="1"
                style={{ animation: 'ping-ring 2s ease-out infinite' }} />
            </svg>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#e0f0ff',
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
              transition: 'all 0.6s ease',
            }}>
              {fmt(onlineCount)}
            </span>
          </div>
          <div style={{ width: 1, height: 14, background: 'rgba(100,150,255,0.2)' }} />
          <span style={{
            fontSize: 10,
            color: 'rgba(150,190,255,0.65)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}>
            онлайн
          </span>
        </div>
      </div>

      {/* Bottom edge glow */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '10%',
        width: '80%',
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(120,160,255,0.4), rgba(160,120,255,0.4), transparent)',
      }} />

      {/* CSS animations */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes ping-ring {
          0% { r: 3; opacity: 0.8; }
          100% { r: 5.5; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

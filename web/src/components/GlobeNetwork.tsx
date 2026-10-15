import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR } from "@/lib/motion";

// Rough continent silhouettes as [lon, lat, radiusDeg] blobs. Decorative, not cartographic.
const LAND: [number, number, number][] = [
  [20, 8, 20], [25, -10, 15], [18, 22, 16], [30, -25, 9], [5, 8, 9], [42, 8, 6],
  [10, 50, 9], [25, 55, 10], [0, 45, 6], [15, 63, 8], [-3, 54, 4],
  [60, 55, 18], [90, 60, 18], [112, 55, 15], [100, 35, 15], [78, 22, 10], [105, 15, 8], [120, 38, 9], [140, 64, 12], [45, 30, 9], [53, 23, 6], [138, 37, 4],
  [115, -2, 7], [124, 6, 5], [134, -25, 13], [146, -38, 4],
  [-100, 45, 17], [-112, 58, 14], [-85, 55, 12], [-95, 31, 8], [-76, 42, 7], [-152, 63, 9], [-102, 21, 7], [-120, 40, 9], [-42, 72, 9],
  [-60, -10, 15], [-65, -28, 10], [-70, -42, 6], [-72, 5, 8], [-45, -8, 7],
];
function isLand(lon: number, lat: number) {
  const c = Math.cos((lat * Math.PI) / 180);
  return LAND.some(([x, y, r]) => {
    let dx = lon - x;
    if (dx > 180) dx -= 360;
    if (dx < -180) dx += 360;
    dx *= c;
    const dy = lat - y;
    return dx * dx + dy * dy < r * r;
  });
}

type Pt = { lon: number; lat: number };
const DOTS: { land: Pt[]; sea: Pt[] } = (() => {
  const land: Pt[] = [];
  const sea: Pt[] = [];
  for (let lat = -84; lat <= 84; lat += 2.6) {
    const step = 2.6 / Math.max(0.15, Math.cos((lat * Math.PI) / 180));
    for (let lon = -180; lon < 180; lon += step) (isLand(lon, lat) ? land : sea).push({ lon, lat });
  }
  return { land, sea: sea.filter((_, i) => i % 3 === 0) };
})();
const PINS: Pt[] = [
  { lon: -40, lat: 30 }, { lon: -20, lat: 50 }, { lon: 0, lat: 58 }, { lon: 22, lat: 52 }, { lon: 42, lat: 44 }, { lon: 64, lat: 38 }, { lon: -62, lat: 18 },
  { lon: 12, lat: 12 }, { lon: 32, lat: 24 }, { lon: -8, lat: 34 }, { lon: 52, lat: 18 }, { lon: 90, lat: 30 }, { lon: 120, lat: 45 }, { lon: -90, lat: 40 },
  { lon: 150, lat: 20 }, { lon: -120, lat: 25 }, { lon: 75, lat: 55 }, { lon: -150, lat: 50 },
];
const LINKS: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [6, 0], [1, 9], [9, 2], [7, 8], [8, 4], [5, 10], [3, 9], [5, 11], [11, 12], [12, 16], [13, 0], [13, 15], [14, 12], [17, 15], [16, 4]];

const TILT = (22 * Math.PI) / 180;
const SEC_PER_REV = DUR.globe;

/** Large monochrome halftone globe with a rotating node network (canvas). */
export function GlobeNetwork({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let visible = true;
    let w = 0;
    let h = 0;
    let R = 0;
    let cx = 0;
    let cy = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      R = Math.min(w * 0.6, 340);
      h = R * 1.72;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = R * 1.3;
    };

    const project = (lon: number, lat: number, rot: number, scale = 1) => {
      const l = ((lon + rot) * Math.PI) / 180;
      const p = (lat * Math.PI) / 180;
      const x = Math.cos(p) * Math.sin(l);
      const y = Math.sin(p);
      const z = Math.cos(p) * Math.cos(l);
      const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
      const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
      return { x: cx + x * R * scale, y: cy - y2 * R * scale, z: z2 };
    };

    const draw = (time: number) => {
      const css = getComputedStyle(canvas);
      const ink = css.getPropertyValue("--fg").trim() || "#0f1729";
      const mutedInk = css.getPropertyValue("--fg-muted").trim() || "#64748b";
      const rot = -20 + (reduce ? 0 : ((time / 1000) * 360) / SEC_PER_REV);
      ctx.clearRect(0, 0, w, h);

      // Sphere shading
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.1, cx, cy, R);
      g.addColorStop(0, "rgba(100,116,139,0.03)");
      g.addColorStop(1, "rgba(100,116,139,0.12)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Orbit curves
      ctx.strokeStyle = mutedInk;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.28;
      for (const [rx, ry, a] of [[1.18, 0.34, -0.25], [1.08, 0.5, 0.35]] as const) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * rx, R * ry, a, Math.PI * 1.02, Math.PI * 1.98);
        ctx.stroke();
      }
      // Parallels
      ctx.globalAlpha = 0.2;
      for (const la of [-30, 0, 30, 60]) {
        ctx.beginPath();
        let started = false;
        for (let lo = -180; lo <= 180; lo += 4) {
          const q = project(lo, la, rot);
          if (q.z <= 0) {
            started = false;
            continue;
          }
          if (started) ctx.lineTo(q.x, q.y);
          else ctx.moveTo(q.x, q.y);
          started = true;
        }
        ctx.stroke();
      }

      // Halftone dots, bucketed by depth to batch draws
      const buckets: Path2D[] = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      for (const d of DOTS.sea) {
        const q = project(d.lon, d.lat, rot);
        if (q.z <= 0.03) continue;
        buckets[0].moveTo(q.x + 1.1, q.y);
        buckets[0].arc(q.x, q.y, 1.1, 0, Math.PI * 2);
      }
      for (const d of DOTS.land) {
        const q = project(d.lon, d.lat, rot);
        if (q.z <= 0.03) continue;
        const b = q.z < 0.35 ? 1 : q.z < 0.7 ? 2 : 3;
        const r = 1.1 + 1.3 * q.z;
        buckets[b].moveTo(q.x + r, q.y);
        buckets[b].arc(q.x, q.y, r, 0, Math.PI * 2);
      }
      ctx.fillStyle = mutedInk;
      ctx.globalAlpha = 0.35;
      ctx.fill(buckets[0]);
      ctx.fillStyle = ink;
      [0.28, 0.45, 0.62].forEach((a, i) => {
        ctx.globalAlpha = a;
        ctx.fill(buckets[i + 1]);
      });

      // Network: pins rise radially from the surface to drifting nodes
      const t = reduce ? 0 : time / 1000;
      const tops = PINS.map((p, i) => {
        const base = project(p.lon, p.lat, rot);
        const lift = 1.16 + 0.1 * ((i * 7) % 5) / 4 + (reduce ? 0 : 0.015 * Math.sin(t * 0.6 + i));
        return { base, top: project(p.lon, p.lat, rot, lift), i };
      });
      ctx.strokeStyle = mutedInk;
      ctx.lineWidth = 0.9;
      for (const { base, top } of tops) {
        if (base.z <= 0.05) continue;
        ctx.globalAlpha = 0.5 * Math.min(1, base.z * 2);
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(top.x, top.y);
        ctx.stroke();
      }
      ctx.lineWidth = 0.7;
      for (const [a, b] of LINKS) {
        const A = tops[a];
        const B = tops[b];
        if (A.base.z <= 0.05 || B.base.z <= 0.05) continue;
        ctx.globalAlpha = 0.28 * Math.min(A.base.z, B.base.z) * 2;
        ctx.beginPath();
        ctx.moveTo(A.top.x, A.top.y);
        ctx.lineTo(B.top.x, B.top.y);
        ctx.stroke();
      }
      ctx.fillStyle = mutedInk;
      for (const { base, top, i } of tops) {
        if (base.z <= 0.05) continue;
        ctx.globalAlpha = 0.85 * Math.min(1, base.z * 2);
        ctx.beginPath();
        ctx.arc(top.x, top.y, i % 3 === 0 ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (time: number) => {
      draw(time);
      if (!reduce && visible) raf = requestAnimationFrame(loop);
    };
    resize();
    draw(0);
    if (!reduce) raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting && document.visibilityState === "visible";
      if (visible && !was && !reduce) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduce]);

  return (
    <motion.canvas
      ref={ref}
      aria-hidden
      data-testid="globe"
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.page * 2, ease: "easeOut" }}
    />
  );
}

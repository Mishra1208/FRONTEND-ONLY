"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  endYOffset = 0,
  reverse = false,
}) {
  const svgRef = useRef(null);
  const [path, setPath] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });

  // compute a path between centers of from/to
  const compute = () => {
    const container = containerRef?.current;
    const a = fromRef?.current;
    const b = toRef?.current;
    if (!container || !a || !b) return;

    const cb = container.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();

    const ax = ar.left - cb.left + ar.width / 2;
    const ay = ar.top - cb.top + ar.height / 2;
    const bx = br.left - cb.left + br.width / 2;
    const by = br.top - cb.top + br.height / 2 + endYOffset;

    // control point: mid + curvature offset
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const nx = mx;
    const ny = my + curvature;

    const p = `M ${ax},${ay} Q ${nx},${ny} ${bx},${by}`;
    setPath(p);
    setSize({ w: cb.width, h: cb.height });
  };

  useEffect(() => {
    compute();
    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, fromRef, toRef, curvature, endYOffset]);

  // animate dash offset
  const dashAnim = useMemo(
    () => ({
      animation: `${reverse ? "beamDashRev" : "beamDash"} 3s linear infinite`,
    }),
    [reverse]
  );

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
    >
      <defs>
        <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(139,92,246,1)" />
          <stop offset="50%" stopColor="rgba(59,130,246,1)" />
          <stop offset="100%" stopColor="rgba(236,72,153,1)" />
        </linearGradient>
        <filter id="beamGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* faint “track” */}
      <path d={path} stroke="rgba(0,0,0,0.1)" strokeWidth="2" fill="none" />

      {/* animated beam */}
      <path
        d={path}
        stroke="url(#beamGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        filter="url(#beamGlow)"
        strokeDasharray="8 10"
        style={dashAnim}
      />
      <style jsx>{`
        @keyframes beamDash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -200;
          }
        }
        @keyframes beamDashRev {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: 200;
          }
        }
      `}</style>
    </svg>
  );
}
export default AnimatedBeam;

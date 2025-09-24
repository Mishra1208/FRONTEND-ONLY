"use client";
import React, { forwardRef, useRef } from "react";
import classes from "./animated-beam.module.css";

/* --- Beam (SVG) --- */
function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 20,
  endYOffset = 0,
  reverse = false,
  mode = "flash",       // "flash" | "dash" – default flash
  speed = 2.4,          // seconds for one full pass
  dot = 0.06,           // dot size as fraction of path length (0.02–0.12 looks good)
 }) {
  const [d, setD] = React.useState("");
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  const compute = React.useCallback(() => {
    const c = containerRef?.current, a = fromRef?.current, b = toRef?.current;
    if (!c || !a || !b) return;
    const cb = c.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();

    const ax = ar.left - cb.left + ar.width / 2;
    const ay = ar.top  - cb.top  + ar.height / 2;
    const bx = br.left - cb.left + br.width / 2;
    const by = br.top  - cb.top  + br.height / 2 + endYOffset;

    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2 + curvature;

    setD(`M ${ax},${ay} Q ${mx},${my} ${bx},${by}`);
    setSize({ w: cb.width, h: cb.height });
  }, [containerRef, fromRef, toRef, curvature, endYOffset]);

    // REPLACE your useLayoutEffect with this:
  React.useEffect(() => {
    const on = () => compute();

    // Observe size changes of container + endpoints
    const ro = new ResizeObserver(on);
    if (containerRef?.current) ro.observe(containerRef.current);
    if (fromRef?.current) ro.observe(fromRef.current);
    if (toRef?.current) ro.observe(toRef.current);

    // Recompute after any <img> inside the container finishes loading
    const imgs = containerRef.current?.querySelectorAll("img") || [];
    const imgHandlers = [];
    imgs.forEach((img) => {
      if (!img.complete) {
        const h = () => on();
        img.addEventListener("load", h);
        imgHandlers.push([img, h]);
      }
    });

    // Kick post-layout recomputes
    requestAnimationFrame(on); // after first paint
    const t = setTimeout(on, 0); // next macrotask

    // Usual listeners
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, true);
    window.addEventListener("load", on);

    return () => {
      ro.disconnect();
      clearTimeout(t);
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on, true);
      window.removeEventListener("load", on);
      imgHandlers.forEach(([img, h]) => img.removeEventListener("load", h));
    };
  }, [compute, containerRef, fromRef, toRef]);


  return (
    <svg className={classes.svg} width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
      <defs>
        <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#8b5cf6" />
          <stop offset="50%"  stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="beamGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* light gray track */}
      <path d={d} stroke="rgba(0,0,0,.08)" strokeWidth="2" fill="none" />

      {/* animated beam */}
      <path
        d={d}
        stroke="url(#beamGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        filter="url(#beamGlow)"
        strokeDasharray="8 10"
        style={{ animation: `${reverse ? "beamDashRev" : "beamDash"} 3s linear infinite` }}
      />
      <style>{`
        @keyframes beamDash { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -200 } }
        @keyframes beamDashRev { from { stroke-dashoffset: 0 } to { stroke-dashoffset: 200 } }
      `}</style>
    </svg>
  );
}

/* --- Round icon holder --- */
const Circle = forwardRef(function Circle({ className, children }, ref) {
  return (
    <div ref={ref} className={`${classes.circle} ${className || ""}`}>
      {children}
    </div>
  );
});

/* --- The demo layout --- */
export default function AnimatedBeamDemo() {
  const containerRef = useRef(null);
  const div1Ref = useRef(null);
  const div2Ref = useRef(null);
  const div3Ref = useRef(null);
  const div4Ref = useRef(null);
  const div5Ref = useRef(null);
  const div6Ref = useRef(null);
  const div7Ref = useRef(null);

  return (
    <div ref={containerRef} className={classes.wrap}>
      <div className={classes.grid}>
        <div className={classes.row}>
          <Circle ref={div1Ref}><Icons.googleDrive /></Circle>
          <Circle ref={div5Ref}><Icons.googleDocs /></Circle>
        </div>

        <div className={classes.row}>
          <Circle ref={div2Ref}><Icons.notion /></Circle>
          <Circle ref={div4Ref} className={classes.centerCircle}><Icons.openai /></Circle>
          <Circle ref={div6Ref}><Icons.zapier /></Circle>
        </div>

        <div className={classes.row}>
          <Circle ref={div3Ref}><Icons.whatsapp /></Circle>
          <Circle ref={div7Ref}><Icons.messenger /></Circle>
        </div>
      </div>

      {/* beams */}
      {/* beams */}
<AnimatedBeam containerRef={containerRef} fromRef={div1Ref} toRef={div4Ref} curvature={-90} endYOffset={-10} />
<AnimatedBeam containerRef={containerRef} fromRef={div2Ref} toRef={div4Ref} />
<AnimatedBeam containerRef={containerRef} fromRef={div3Ref} toRef={div4Ref} curvature={90} endYOffset={10} />

{/* RIGHT SIDE — remove `reverse` so they also flow toward the center */}
<AnimatedBeam containerRef={containerRef} fromRef={div5Ref} toRef={div4Ref} curvature={-90} endYOffset={-10} />
<AnimatedBeam containerRef={containerRef} fromRef={div6Ref} toRef={div4Ref} />
<AnimatedBeam containerRef={containerRef} fromRef={div7Ref} toRef={div4Ref} curvature={90} endYOffset={10} />

    </div>
  );
}

// put this near the bottom of AnimatedBeamDemo.jsx
const Icon = ({ src, alt }) => (
  <img src={src} alt={alt} width={70} height={68} style={{ objectFit: "contain" }} />
);

const Icons = {
  // pick whatever files you prefer from /public/brands
  notion:      () => <Icon src="/brands/concordia.png"  alt="Notion" />,
  openai:      () => <Icon src="/brands/log.png"       alt="OpenAI" />,      // center icon; swap if you add an OpenAI SVG
  googleDrive: () => <Icon src="/brands/gg.svg"     alt="Google Drive" />,
  whatsapp:    () => <Icon src="/brands/fb.png"   alt="WhatsApp" />,
  googleDocs:  () => <Icon src="/brands/calc.png"  alt="Google Docs" />,
  zapier:      () => <Icon src="/brands/red.png"    alt="Zapier" />,
  messenger:   () => <Icon src="/brands/rate1.png"        alt="Messenger" />,
};


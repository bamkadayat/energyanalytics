/**
 * The hero's right-hand visual: an offshore wind scene.
 *
 * Renders a looping video when one is supplied, and otherwise draws the scene inline.
 * The fallback exists because a stock clip needs a licence I cannot verify from here,
 * and a multi-megabyte binary is a real cost — this weighs nothing, needs no network,
 * and cannot 404.
 *
 * Purely decorative: `aria-hidden`, and nothing in it could be mistaken for data. The
 * subject is right for this product — offshore wind is the Nordic generation story, and
 * wind is one of the three metrics the dashboard plots — but the visual asserts no
 * numbers.
 *
 * Motion comes from the global `prefers-reduced-motion` rule in `globals.css`, which
 * collapses every animation here to nothing.
 */
export function HeroVisual({ videoSrc, posterSrc }: HeroVisualProps) {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-4/3 w-full overflow-hidden rounded-card border border-line-strong bg-navy-deep"
    >
      {videoSrc ? (
        <video
          className="size-full object-cover"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <OffshoreWindScene />
      )}
    </div>
  );
}

export interface HeroVisualProps {
  /**
   * Path to a looping clip in `public/`, e.g. `/hero.mp4`. Supply `posterSrc` too, or
   * the panel is empty until the first frame decodes.
   */
  videoSrc?: string;
  posterSrc?: string;
}

const SEA_HORIZON = 96;

/** Turbines, largest first — nearer ones are bigger and turn faster. */
const TURBINES = [
  { x: 62, baseY: 138, hubY: 52, bladeLength: 27, spin: "animate-rotor", wake: 30 },
  { x: 143, baseY: 126, hubY: 70, bladeLength: 19, spin: "animate-rotor-slow", wake: 21 },
  { x: 178, baseY: 116, hubY: 84, bladeLength: 12, spin: "animate-rotor-slower", wake: 13 },
];

function OffshoreWindScene() {
  return (
    <svg
      viewBox="0 0 200 150"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
      role="presentation"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--navy-950)" />
          <stop offset="55%" stopColor="var(--navy-900)" />
          <stop offset="100%" stopColor="var(--navy-800)" />
        </linearGradient>

        {/* Fades the grid out toward the horizon so it reads as distance, not as a box. */}
        <linearGradient id="hero-grid-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--navy-200)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--navy-200)" stopOpacity="0.55" />
        </linearGradient>

        <linearGradient id="hero-wake" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--chart-price)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--navy-200)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="200" height="150" fill="url(#hero-sky)" />

      <SeaGrid />

      {/* Drawn back to front so nearer turbines overlap the distant ones. */}
      {[...TURBINES].reverse().map((turbine) => (
        <Turbine key={turbine.x} {...turbine} />
      ))}

      <Vessel />
      <WindTicks />
    </svg>
  );
}

/** Perspective grid below the horizon, standing in for open water. */
function SeaGrid() {
  const rows = [0, 6, 13, 21, 30, 40, 52];
  const columns = [-120, -70, -30, 0, 30, 70, 120];

  return (
    <g stroke="url(#hero-grid-fade)" strokeWidth="0.35" fill="none">
      {/* Lines converging on a vanishing point at the horizon's centre. */}
      {columns.map((offset) => (
        <line
          key={offset}
          x1={100 + offset * 0.12}
          y1={SEA_HORIZON}
          x2={100 + offset}
          y2={150}
        />
      ))}

      {/* Rows tighten toward the horizon, which is what sells the depth. */}
      {rows.map((row) => (
        <line key={row} x1="0" y1={SEA_HORIZON + row} x2="200" y2={SEA_HORIZON + row} />
      ))}
    </g>
  );
}

function Turbine({
  x,
  baseY,
  hubY,
  bladeLength,
  spin,
  wake,
}: (typeof TURBINES)[number]) {
  const bladeWidth = bladeLength * 0.13;

  return (
    <g>
      {/* Vortex wake: concentric arcs behind the rotor, drifting downwind. */}
      <g className="animate-wake" style={{ transformOrigin: `${x}px ${hubY}px` }}>
        {[0.55, 0.78, 1].map((scale) => (
          <ellipse
            key={scale}
            cx={x - wake * 0.18}
            cy={hubY}
            rx={wake * scale}
            ry={wake * scale * 0.82}
            fill="none"
            stroke="url(#hero-wake)"
            strokeWidth="0.5"
            transform={`rotate(-18 ${x} ${hubY})`}
          />
        ))}
      </g>

      {/* Mast: tapered, so it reads as a tower rather than a stick. */}
      <path
        d={`M${x - 1.5},${baseY} L${x - 0.55},${hubY} L${x + 0.55},${hubY} L${x + 1.5},${baseY} Z`}
        fill="var(--navy-200)"
        opacity="0.72"
      />

      <g
        className={spin}
        style={{ transformOrigin: `${x}px ${hubY}px` }}
      >
        {[0, 120, 240].map((angle) => (
          <path
            key={angle}
            d={`M${x},${hubY} L${x - bladeWidth},${hubY - bladeLength * 0.55} L${x},${hubY - bladeLength} L${x + bladeWidth * 0.5},${hubY - bladeLength * 0.5} Z`}
            fill="var(--navy-200)"
            opacity="0.9"
            transform={`rotate(${angle} ${x} ${hubY})`}
          />
        ))}
      </g>

      {/* Nacelle last, so it caps the blade roots. */}
      <circle cx={x} cy={hubY} r="1.5" fill="var(--navy-200)" />
    </g>
  );
}

/**
 * A service vessel crossing the field, slow enough to notice only on a second look.
 * Sits just below the horizon so it reads as distant.
 */
function Vessel() {
  return (
    <g className="animate-sail" opacity="0.8">
      <g fill="var(--navy-200)">
        {/* hull */}
        <path d={`M0,${SEA_HORIZON + 5} L13,${SEA_HORIZON + 5} L11.5,${SEA_HORIZON + 7.6} L1.5,${SEA_HORIZON + 7.6} Z`} />
        {/* superstructure */}
        <rect x="2.4" y={SEA_HORIZON + 1.9} width="4" height="3.1" />
        <rect x="7" y={SEA_HORIZON + 3.2} width="4.4" height="1.8" />
        {/* mast */}
        <rect x="4.1" y={SEA_HORIZON - 1} width="0.5" height="3" />
      </g>

      {/* wake trailing astern */}
      <path
        d={`M0,${SEA_HORIZON + 7.2} L-9,${SEA_HORIZON + 7.9}`}
        stroke="var(--navy-200)"
        strokeWidth="0.4"
        opacity="0.5"
      />
    </g>
  );
}

/**
 * Scattered direction ticks, the way a wind field is drawn on a forecast chart. Two
 * layers at different speeds give the air some depth.
 */
function WindTicks() {
  const ticks = [
    { x: 18, y: 22 }, { x: 96, y: 16 }, { x: 168, y: 28 }, { x: 36, y: 62 },
    { x: 122, y: 40 }, { x: 188, y: 56 }, { x: 8, y: 84 }, { x: 108, y: 78 },
  ];

  return (
    <g stroke="var(--navy-200)" strokeWidth="0.4" strokeLinecap="round">
      {ticks.map((tick, index) => (
        <line
          key={`${tick.x}-${tick.y}`}
          x1={tick.x}
          y1={tick.y}
          x2={tick.x + 7}
          y2={tick.y - 2.4}
          opacity={index % 2 === 0 ? 0.3 : 0.18}
          className={index % 2 === 0 ? "animate-drift" : "animate-drift-slow"}
        />
      ))}
    </g>
  );
}

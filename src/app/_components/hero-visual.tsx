/**
 * The hero's right-hand visual.
 *
 * Renders a looping video when one is supplied, and otherwise falls back to a
 * self-contained animated wind field. The fallback exists because a stock clip needs a
 * licence I cannot verify from here, and a multi-megabyte binary in the repo is a real
 * cost — this weighs nothing, needs no network, and cannot 404.
 *
 * Purely decorative: `aria-hidden`, and it depicts nothing that could be mistaken for
 * data. Inventing a price curve here would put fabricated market figures on the
 * marketing page of a tool premised on not fabricating them; drifting wind lines carry
 * the subject without asserting a single number.
 *
 * Motion is handled by the global `prefers-reduced-motion` rule in `globals.css`, which
 * collapses these animations to nothing.
 */
export function HeroVisual({ videoSrc, posterSrc }: HeroVisualProps) {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-line-strong bg-navy-deep"
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
          // Decorative background motion: never blocks paint, never demands attention.
          preload="metadata"
        />
      ) : (
        <WindField />
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

/**
 * Layered drifting curves, evoking isobars over the coast.
 *
 * Each layer is drawn twice, end to end, and the group translates by exactly half its
 * width — so the loop is seamless rather than snapping back. Layers run at different
 * speeds and opacities, which reads as depth rather than as one flat pattern sliding.
 */
function WindField() {
  const layers = [
    { y: 34, amplitude: 7, wavelength: 46, speed: "animate-drift-slow", opacity: "opacity-30" },
    { y: 48, amplitude: 9, wavelength: 38, speed: "animate-drift", opacity: "opacity-50" },
    { y: 62, amplitude: 6, wavelength: 52, speed: "animate-drift-slower", opacity: "opacity-40" },
    { y: 76, amplitude: 11, wavelength: 34, speed: "animate-drift", opacity: "opacity-25" },
  ];

  return (
    <svg
      viewBox="0 0 200 120"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
      role="presentation"
    >
      <defs>
        {/* Token-driven, so the visual follows the palette instead of pinning colours. */}
        <linearGradient id="hero-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--navy-800)" />
          <stop offset="100%" stopColor="var(--navy-950)" />
        </linearGradient>

        {/* Fades each line out at the edges so nothing terminates in a hard vertical. */}
        <linearGradient id="hero-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--navy-200)" stopOpacity="0" />
          <stop offset="25%" stopColor="var(--navy-200)" stopOpacity="1" />
          <stop offset="75%" stopColor="var(--navy-200)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--navy-200)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="200" height="120" fill="url(#hero-glow)" />

      {layers.map((layer) => (
        <g key={layer.y} className={`${layer.speed} ${layer.opacity}`}>
          <path
            d={wavePath(layer.y, layer.amplitude, layer.wavelength, 400)}
            fill="none"
            stroke="url(#hero-fade)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * A sine-like path built from smooth quadratic segments.
 *
 * `t` reflects the previous control point automatically, so alternating crests come for
 * free and the curve stays continuous — no seams where segments meet.
 */
function wavePath(
  y: number,
  amplitude: number,
  wavelength: number,
  width: number,
): string {
  const half = wavelength / 2;
  const segments = Math.ceil(width / half);

  let path = `M0,${y} q${wavelength / 4},${-amplitude} ${half},0`;
  for (let index = 1; index < segments; index += 1) {
    path += ` t${half},0`;
  }

  return path;
}

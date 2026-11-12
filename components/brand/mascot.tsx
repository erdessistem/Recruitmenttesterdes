import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type MascotAnimation = "idle" | "wave" | "celebrate" | "think" | "sleep" | "oops";

const navy = "var(--color-navy)";
const terracotta = "var(--color-terracotta)";
const marigold = "var(--color-marigold)";
const marigoldLight = "var(--color-marigold-light)";
const cream = "var(--color-cream)";
const line = { stroke: navy, strokeLinecap: "round", fill: "none" } as const;

const confetti: [number, number, string][] = [
  [-70, -30, marigold],
  [-48, -62, terracotta],
  [-16, -78, navy],
  [20, -80, marigold],
  [52, -60, terracotta],
  [74, -28, navy],
  [-84, 6, terracotta],
  [86, 8, marigold],
];

/**
 * Kio, the Erdes booth mascot. The drawing is the brand kit's SVG, unchanged; the
 * animation is a class and runs in CSS (app/globals.css). One Kio per screen,
 * always beside a line of text, never on terracotta.
 *
 * By default Kio plays for a few seconds and then holds the pose. Pass `loop`
 * only while something is really in progress (loading).
 */
export function Mascot({
  animation = "idle",
  size = 160,
  label = "Kio, maskot Erdes",
  loop = false,
  className,
}: {
  animation?: MascotAnimation;
  /** Width in px; height is 1.15 times that. Keep it at 96 or more. */
  size?: number;
  /** Accessible description. Pass an empty string when the text beside Kio says it all. */
  label?: string;
  loop?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={cn(
        "er-mascot",
        `er-mascot--${animation}`,
        !loop && "er-mascot--once",
        className,
      )}
      viewBox="0 0 200 230"
      width={size}
      height={Math.round(size * 1.15)}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <ellipse className="m-shadow" cx={100} cy={214} rx={58} ry={7} fill={navy} />
      <g className="m-all">
        <g className="m-legL">
          <rect x={72} y={174} width={12} height={32} rx={6} fill={navy} />
          <rect x={60} y={200} width={26} height={11} rx={5.5} fill={navy} />
        </g>
        <g className="m-legR">
          <rect x={116} y={174} width={12} height={32} rx={6} fill={navy} />
          <rect x={114} y={200} width={26} height={11} rx={5.5} fill={navy} />
        </g>
        <g className="m-armL">
          <path d="M38 128C20 134 14 150 20 164" strokeWidth={9} {...line} />
          <circle cx={20} cy={165} r={8} fill={navy} />
        </g>
        <g className="m-armR">
          <path d="M162 128C180 134 186 150 180 164" strokeWidth={9} {...line} />
          <circle cx={180} cy={165} r={8} fill={navy} />
        </g>
        <rect x={32} y={72} width={136} height={112} rx={24} fill={terracotta} />
        <rect x={50} y={100} width={100} height={54} rx={16} fill={cream} />
        <circle cx={66} cy={138} r={6} fill={terracotta} opacity={0.28} />
        <circle cx={134} cy={138} r={6} fill={terracotta} opacity={0.28} />
        <g className="m-eyes">
          <g className="m-eye m-eyeL">
            <ellipse cx={80} cy={122} rx={6} ry={7} fill={navy} />
            <circle cx={82} cy={119} r={2} fill={cream} />
          </g>
          <g className="m-eye m-eyeR">
            <ellipse cx={120} cy={122} rx={6} ry={7} fill={navy} />
            <circle cx={122} cy={119} r={2} fill={cream} />
          </g>
        </g>
        <path
          className="m-closed"
          d="M73 123q7 6 14 0M113 123q7 6 14 0"
          strokeWidth={3.5}
          {...line}
        />
        <path className="m-smile" d="M90 133q10 10 20 0" strokeWidth={3.5} {...line} />
        <ellipse className="m-o" cx={100} cy={139} rx={5} ry={6} fill={navy} />
        <rect className="m-shutter" x={50} y={100} width={100} height={54} rx={16} fill={navy} />
        <g className="m-cup">
          <path d="M130 133h18l-2.5 19h-13z" fill={marigold} />
          <rect x={128} y={129} width={22} height={6} rx={3} fill={navy} />
        </g>
        <rect x={42} y={152} width={116} height={9} rx={4.5} fill={navy} />
        <g className="m-awning">
          <rect x={24} y={62} width={152} height={20} rx={8} fill={marigold} />
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M${24 + 38 * i} 80h38v5a19 15 0 0 1-38 0z`}
              fill={i % 2 ? marigoldLight : marigold}
            />
          ))}
        </g>
        <rect x={78} y={40} width={44} height={24} rx={8} fill={navy} />
        <circle className="m-signdot" cx={100} cy={52} r={5} fill={marigold} />
      </g>
      {animation === "sleep" &&
        (
          [
            [148, 58, 16],
            [162, 42, 20],
            [176, 24, 24],
          ] as const
        ).map(([x, y, fontSize], i) => (
          <text
            key={i}
            className="m-z"
            x={x}
            y={y}
            fontSize={fontSize}
            fill={navy}
            fontFamily="var(--font-display)"
            fontWeight={700}
            style={{ animationDelay: `${i}s` }}
          >
            z
          </text>
        ))}
      {animation === "think" &&
        [140, 156, 172].map((cx, i) => (
          <circle
            key={cx}
            className="m-dot"
            cx={cx}
            cy={22}
            r={4.5}
            fill={navy}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      {animation === "celebrate" &&
        confetti.map(([dx, dy, fill], i) => (
          <rect
            key={i}
            className="m-conf"
            x={96}
            y={56}
            width={8}
            height={8}
            rx={i % 2 ? 4 : 2}
            fill={fill}
            style={
              {
                "--dx": `${dx}px`,
                "--dy": `${dy}px`,
                animationDelay: `${(i % 4) * 0.12}s`,
              } as CSSProperties
            }
          />
        ))}
    </svg>
  );
}

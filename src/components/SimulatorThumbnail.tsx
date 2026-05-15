import type { CSSProperties, ReactNode } from "react";

type SimulatorThumbnailProps = {
  simulatorId: string;
  domain: string;
};

type Palette = {
  a: string;
  b: string;
  c: string;
};

type ThumbnailStyle = CSSProperties & {
  "--thumb-a": string;
  "--thumb-b": string;
  "--thumb-c": string;
};

function thumbnailPalette(domain: string): Palette {
  if (["Quantum", "Optics"].includes(domain)) return { a: "#7ff8ff", b: "#f4c95d", c: "#8ca6ff" };
  if (["Waves", "Trigonometry"].includes(domain)) return { a: "#62e6cf", b: "#ff4df0", c: "#7ff8ff" };
  if (["Electricity", "Forces"].includes(domain)) return { a: "#7ff8ff", b: "#ff4df0", c: "#a9ef78" };
  if (["Mechanics", "Gravity"].includes(domain)) return { a: "#f4c95d", b: "#7ff8ff", c: "#ff4df0" };
  if (["Thermodynamics", "Fluids"].includes(domain)) return { a: "#ff8a55", b: "#7ff8ff", c: "#f4c95d" };
  if (domain.includes("Chemistry")) return { a: "#a9ef78", b: "#ff8a55", c: "#7ff8ff" };
  if (["Statistics", "Probability", "Functions", "Geometry", "Foundations", "Chaos"].includes(domain)) {
    return { a: "#ff4df0", b: "#7ff8ff", c: "#f4c95d" };
  }
  return { a: "#7ff8ff", b: "#ff4df0", c: "#f4c95d" };
}

function dots(points: Array<[number, number]>, color = "var(--thumb-b)", radius = 1.7) {
  return points.map(([cx, cy]) => <circle className="thumbDot" key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} fill={color} />);
}

function bars(values: number[], color = "var(--thumb-a)") {
  return values.map((height, index) => (
    <rect
      className="thumbFill"
      key={`${height}-${index}`}
      x={10 + index * 7}
      y={34 - height}
      width="4.8"
      height={height}
      rx="1"
      fill={index === Math.floor(values.length / 2) ? "var(--thumb-b)" : color}
    />
  ));
}

function glyphFor(simulatorId: string): ReactNode {
  switch (simulatorId) {
    case "photoelectric":
      return (
        <>
          <rect className="thumbFill" x="24" y="9" width="4" height="26" rx="1" fill="var(--thumb-b)" />
          <rect className="thumbFill" x="46" y="11" width="4" height="22" rx="1" fill="var(--thumb-a)" />
          <path className="thumbLine" d="M7 25 C14 15 20 16 25 22" stroke="var(--thumb-c)" />
          <path className="thumbFine" d="M29 21 C35 15 40 16 46 22" stroke="var(--thumb-a)" />
          {dots([[16, 18], [38, 17], [43, 24]], "var(--thumb-a)", 1.7)}
        </>
      );
    case "double-slit":
      return (
        <>
          <circle className="thumbDot" cx="10" cy="22" r="2.6" fill="var(--thumb-a)" />
          <rect className="thumbFill" x="29" y="8" width="3" height="28" rx="1" fill="var(--thumb-b)" />
          <path className="thumbFine" d="M11 22 C18 16 23 16 29 18 M11 22 C18 28 23 28 29 26" stroke="var(--thumb-a)" />
          <path className="thumbLine" d="M34 13 C43 5 54 6 61 13 M34 31 C43 39 54 38 61 31" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M57 9 V35" stroke="var(--thumb-c)" />
        </>
      );
    case "wave-superposition":
      return (
        <>
          <path className="thumbFine" d="M4 15 C12 4 20 28 28 15 S44 4 52 15 60 28 62 20" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M4 29 C13 40 20 16 29 29 S45 40 53 29 60 17 62 24" stroke="var(--thumb-b)" />
          <path className="thumbLine" d="M5 22 C16 15 23 15 34 22 S50 29 61 22" stroke="var(--thumb-c)" />
        </>
      );
    case "standing-wave":
      return (
        <>
          <path className="thumbLine" d="M6 22 C14 4 22 40 30 22 S46 4 54 22 59 34 62 22" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M6 22 H62" stroke="var(--thumb-c)" />
          {dots([[6, 22], [30, 22], [54, 22], [62, 22]], "var(--thumb-b)", 1.6)}
        </>
      );
    case "doppler-effect":
      return (
        <>
          {[7, 13, 19].map((r) => <circle className="thumbFine" key={r} cx="25" cy="22" r={r} fill="none" stroke="var(--thumb-a)" />)}
          {[5, 10, 15].map((r) => <circle className="thumbFine" key={r} cx="43" cy="22" r={r} fill="none" stroke="var(--thumb-b)" />)}
          <circle className="thumbDot" cx="39" cy="22" r="3" fill="var(--thumb-c)" />
          <path className="thumbFine" d="M39 22 H54" stroke="var(--thumb-c)" />
        </>
      );
    case "hookes-law":
      return (
        <>
          <path className="thumbAxis" d="M8 34 H56 M9 10 V34" />
          <path className="thumbLine" d="M10 24 h5 l3 -6 4 12 4 -12 4 12 4 -12 4 6 h5" stroke="var(--thumb-a)" />
          <rect className="thumbFill" x="43" y="18" width="13" height="12" rx="2" fill="var(--thumb-b)" />
          <circle className="thumbDot" cx="49" cy="18" r="2" fill="var(--thumb-a)" />
        </>
      );
    case "projectile-motion":
      return (
        <>
          <path className="thumbLine" d="M7 34 C18 7 40 7 57 34" stroke="var(--thumb-a)" />
          <path className="thumbAxis" d="M6 34 H60" />
          <circle className="thumbDot" cx="31" cy="10" r="2.6" fill="var(--thumb-b)" />
          <path className="thumbFine" d="M10 32 l11 -10" stroke="var(--thumb-b)" />
        </>
      );
    case "pendulum":
      return (
        <>
          <path className="thumbFine" d="M18 9 C24 35 43 35 49 9" stroke="var(--thumb-c)" />
          <path className="thumbLine" d="M32 8 L43 31" stroke="var(--thumb-a)" />
          <circle className="thumbDot" cx="32" cy="8" r="1.8" fill="var(--thumb-b)" />
          <circle className="thumbFill" cx="43" cy="31" r="4.5" fill="var(--thumb-b)" />
        </>
      );
    case "ohms-law":
      return (
        <>
          <path className="thumbLine" d="M9 33 H20 V13 H48 V33 H57" stroke="var(--thumb-a)" />
          <path className="thumbLine" d="M25 13 l3 -5 4 10 4 -10 4 10 4 -5" stroke="var(--thumb-b)" />
          <path className="thumbFine" d="M12 26 h7 M15.5 22 v8" stroke="var(--thumb-c)" />
        </>
      );
    case "rc-circuit":
      return (
        <>
          <path className="thumbLine" d="M8 33 H20 V13 H50 V33 H58" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M34 18 v14 M39 18 v14" stroke="var(--thumb-b)" />
          <path className="thumbLine" d="M41 33 C48 33 50 20 58 15" stroke="var(--thumb-c)" />
        </>
      );
    case "wire-magnetic-field":
      return (
        <>
          <path className="thumbLine" d="M32 7 V37" stroke="var(--thumb-b)" />
          {[7, 13, 20].map((r) => <circle className="thumbFine" key={r} cx="32" cy="22" r={r} fill="none" stroke="var(--thumb-a)" />)}
          <path className="thumbFine" d="M46 14 l6 2 -4 5" stroke="var(--thumb-c)" />
        </>
      );
    case "parallel-plate-capacitor":
      return (
        <>
          <rect className="thumbFill" x="20" y="10" width="4" height="24" rx="1" fill="var(--thumb-a)" />
          <rect className="thumbFill" x="42" y="10" width="4" height="24" rx="1" fill="var(--thumb-b)" />
          {[14, 20, 26, 32].map((y) => <path className="thumbFine" key={y} d={`M26 ${y} H40`} stroke="var(--thumb-c)" />)}
          <path className="thumbFine" d="M32 12 v20" stroke="var(--thumb-a)" />
        </>
      );
    case "coulombs-law":
      return (
        <>
          <circle className="thumbFill" cx="22" cy="22" r="6" fill="var(--thumb-a)" />
          <circle className="thumbFill" cx="44" cy="22" r="6" fill="var(--thumb-b)" />
          <path className="thumbLine" d="M29 22 H37" stroke="var(--thumb-c)" />
          <path className="thumbFine" d="M16 22 H5 M50 22 H61" stroke="var(--thumb-c)" />
        </>
      );
    case "incline-force":
      return (
        <>
          <path className="thumbLine" d="M8 34 H57 L57 18 Z" stroke="var(--thumb-c)" />
          <rect className="thumbFill" x="34" y="22" width="12" height="9" rx="1.5" fill="var(--thumb-b)" transform="rotate(-18 40 26.5)" />
          <path className="thumbFine" d="M41 25 l-8 -7 M41 25 l10 -3 M41 25 v10" stroke="var(--thumb-a)" />
        </>
      );
    case "newtons-second-law":
      return (
        <>
          <rect className="thumbFill" x="24" y="23" width="17" height="11" rx="2" fill="var(--thumb-b)" />
          <path className="thumbLine" d="M6 29 H23 M42 29 H58" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M54 24 l5 5 -5 5 M6 36 H59" stroke="var(--thumb-c)" />
        </>
      );
    case "work-energy":
      return (
        <>
          <path className="thumbAxis" d="M7 35 H57 L57 21" />
          <path className="thumbLine" d="M10 34 L49 16" stroke="var(--thumb-a)" />
          <rect className="thumbFill" x="29" y="24" width="12" height="8" rx="2" fill="var(--thumb-b)" transform="rotate(-16 35 28)" />
          <path className="thumbFine" d="M50 34 v-12" stroke="var(--thumb-b)" />
        </>
      );
    case "circular-motion":
      return (
        <>
          <ellipse className="thumbFine" cx="32" cy="22" rx="19" ry="12" fill="none" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M32 22 L47 15 M47 15 l10 -5" stroke="var(--thumb-c)" />
          <circle className="thumbFill" cx="47" cy="15" r="3.5" fill="var(--thumb-b)" />
          <circle className="thumbDot" cx="32" cy="22" r="1.6" fill="var(--thumb-a)" />
        </>
      );
    case "gravity-field":
      return (
        <>
          <circle className="thumbFill" cx="25" cy="22" r="5.5" fill="var(--thumb-b)" />
          {[10, 16, 22].map((r) => <circle className="thumbFine" key={r} cx="25" cy="22" r={r} fill="none" stroke="var(--thumb-a)" />)}
          <circle className="thumbDot" cx="51" cy="22" r="2.5" fill="var(--thumb-a)" />
          <path className="thumbFine" d="M51 22 C43 17 34 18 27 21" stroke="var(--thumb-c)" />
        </>
      );
    case "orbital":
      return (
        <>
          <ellipse className="thumbFine" cx="33" cy="22" rx="25" ry="11" fill="none" stroke="var(--thumb-a)" />
          <circle className="thumbFill" cx="29" cy="22" r="4.5" fill="var(--thumb-b)" />
          <circle className="thumbDot" cx="55" cy="17" r="2.7" fill="var(--thumb-a)" />
          <path className="thumbFine" d="M55 17 l7 -3" stroke="var(--thumb-c)" />
        </>
      );
    case "snells-law":
      return (
        <>
          <path className="thumbAxis" d="M5 22 H59" />
          <path className="thumbLine" d="M15 6 L32 22 L52 37" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M32 6 V38" stroke="var(--thumb-b)" />
          <circle className="thumbDot" cx="32" cy="22" r="2" fill="var(--thumb-b)" />
        </>
      );
    case "thin-lens":
      return (
        <>
          <path className="thumbFine" d="M32 7 C38 17 38 27 32 37 C26 27 26 17 32 7" stroke="var(--thumb-c)" />
          <path className="thumbLine" d="M5 14 H32 L58 31 M5 30 H32 L58 13" stroke="var(--thumb-a)" />
          <circle className="thumbDot" cx="47" cy="22" r="2" fill="var(--thumb-b)" />
        </>
      );
    case "newton-cooling":
      return (
        <>
          <path className="thumbLine" d="M7 11 C23 14 34 33 58 35" stroke="var(--thumb-a)" />
          <path className="thumbAxis" d="M7 35 H59" />
          <rect className="thumbFill" x="19" y="10" width="5" height="23" rx="2.5" fill="var(--thumb-b)" />
          <circle className="thumbFill" cx="21.5" cy="33" r="4" fill="var(--thumb-b)" />
        </>
      );
    case "carnot-engine":
      return (
        <>
          <rect className="thumbFill" x="8" y="8" width="17" height="8" rx="2" fill="var(--thumb-b)" />
          <rect className="thumbFill" x="41" y="28" width="17" height="8" rx="2" fill="var(--thumb-a)" />
          <path className="thumbLine" d="M25 12 C43 9 49 15 50 28 M41 32 C23 36 16 28 17 16" stroke="var(--thumb-c)" />
          <circle className="thumbDot" cx="32" cy="22" r="3" fill="var(--thumb-b)" />
        </>
      );
    case "buoyancy":
      return (
        <>
          <path className="thumbLine" d="M9 14 v23 h47 V14" stroke="var(--thumb-c)" />
          <path className="thumbFine" d="M11 25 C19 20 26 30 34 25 S48 20 58 25" stroke="var(--thumb-a)" />
          <rect className="thumbFill" x="28" y="18" width="13" height="14" rx="2" fill="var(--thumb-b)" />
          <path className="thumbFine" d="M34 33 V18" stroke="var(--thumb-a)" />
        </>
      );
    case "hydrostatic-pressure":
      return (
        <>
          <path className="thumbLine" d="M17 9 v28 h32 V9" stroke="var(--thumb-c)" />
          <path className="thumbFine" d="M20 19 h26 M20 29 h26" stroke="var(--thumb-a)" />
          <circle className="thumbDot" cx="33" cy="32" r="2.8" fill="var(--thumb-b)" />
          <path className="thumbLine" d="M53 13 v22" stroke="var(--thumb-b)" />
        </>
      );
    case "alcohol-oxidation":
      return (
        <>
          <path className="thumbFine" d="M10 31 L22 14 L34 31 M22 14 v-5" stroke="var(--thumb-a)" />
          <path className="thumbLine" d="M38 22 h10" stroke="var(--thumb-c)" />
          <path className="thumbFine" d="M45 17 l5 5 -5 5" stroke="var(--thumb-c)" />
          <path className="thumbLine" d="M53 31 L61 17 M56 17 h7" stroke="var(--thumb-b)" />
          <circle className="thumbDot" cx="22" cy="9" r="2" fill="var(--thumb-b)" />
        </>
      );
    case "acid-base-ph":
      return (
        <>
          <path className="thumbLine" d="M15 8 v10 l-8 18 h28 l-8 -18 V8" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M11 31 C17 27 23 34 30 30" stroke="var(--thumb-b)" />
          <path className="thumbLine" d="M39 35 C46 35 47 9 53 9 S58 35 62 35" stroke="var(--thumb-c)" />
        </>
      );
    case "solution-dilution":
      return (
        <>
          <path className="thumbLine" d="M9 10 v26 h14 V10 M42 10 v26 h16 V10" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M12 27 h8 M46 30 h9" stroke="var(--thumb-b)" />
          <path className="thumbLine" d="M27 22 h10" stroke="var(--thumb-c)" />
          <path className="thumbFine" d="M34 17 l5 5 -5 5" stroke="var(--thumb-c)" />
        </>
      );
    case "stoichiometry":
      return (
        <>
          <path className="thumbLine" d="M32 10 v25 M14 35 h36 M18 14 h28" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M18 14 l-8 16 h16 Z M46 14 l-8 16 h16 Z" stroke="var(--thumb-b)" />
          {dots([[18, 27], [46, 24]], "var(--thumb-c)", 2)}
        </>
      );
    case "ideal-gas-law":
      return (
        <>
          <rect className="thumbFine" x="12" y="12" width="34" height="20" rx="2" fill="none" stroke="var(--thumb-a)" />
          <rect className="thumbFill" x="39" y="12" width="5" height="20" fill="var(--thumb-b)" />
          {dots([[20, 17], [26, 27], [32, 18], [36, 26]], "var(--thumb-c)", 1.5)}
          <path className="thumbFine" d="M47 22 h11 M55 18 l4 4 -4 4" stroke="var(--thumb-b)" />
        </>
      );
    case "reaction-kinetics":
      return (
        <>
          <path className="thumbLine" d="M6 10 C21 13 27 33 40 34 S54 33 59 22" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M6 35 C20 35 31 14 59 10" stroke="var(--thumb-b)" />
          {dots([[18, 22], [46, 15]], "var(--thumb-c)", 2)}
        </>
      );
    case "sampling-lab":
      return (
        <>
          <path className="thumbLine" d="M7 35 C18 35 20 9 32 9 S46 35 57 35" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M40 10 v25 M36 15 h8" stroke="var(--thumb-b)" />
          <circle className="thumbDot" cx="40" cy="17" r="2" fill="var(--thumb-c)" />
        </>
      );
    case "vector-addition":
      return (
        <>
          <path className="thumbLine" d="M12 33 L29 13" stroke="var(--thumb-a)" />
          <path className="thumbLine" d="M29 13 L51 27" stroke="var(--thumb-b)" />
          <path className="thumbFine" d="M12 33 L51 27" stroke="var(--thumb-c)" />
          <path className="thumbFine" d="M26 13 l4 0 -1 5 M47 24 l5 3 -5 3" stroke="var(--thumb-a)" />
        </>
      );
    case "linear-regression":
      return (
        <>
          <path className="thumbLine" d="M8 34 L57 12" stroke="var(--thumb-a)" />
          {dots([[16, 32], [23, 27], [33, 28], [43, 19], [53, 15]], "var(--thumb-b)", 2)}
        </>
      );
    case "pythagorean-theorem":
      return (
        <>
          <path className="thumbLine" d="M16 34 H48 L16 13 Z" stroke="var(--thumb-a)" />
          <rect className="thumbFill" x="11" y="34" width="9" height="5" fill="var(--thumb-b)" />
          <rect className="thumbFill" x="7" y="18" width="9" height="16" fill="var(--thumb-c)" />
          <path className="thumbFine" d="M34 22 l8 -7" stroke="var(--thumb-b)" />
        </>
      );
    case "unit-circle":
      return (
        <>
          <path className="thumbAxis" d="M10 22 H54 M32 5 V39" />
          <circle className="thumbFine" cx="32" cy="22" r="14" fill="none" stroke="var(--thumb-a)" />
          <path className="thumbLine" d="M32 22 L44 15" stroke="var(--thumb-b)" />
          <path className="thumbFine" d="M44 15 V22 H32" stroke="var(--thumb-a)" />
          <circle className="thumbDot" cx="44" cy="15" r="2.2" fill="var(--thumb-b)" />
        </>
      );
    case "binomial-distribution":
      return (
        <>
          {bars([4, 9, 17, 24, 17, 9, 4])}
          <path className="thumbAxis" d="M7 35 H57" />
        </>
      );
    case "exponential-growth":
      return (
        <>
          <path className="thumbLine" d="M7 35 C24 35 35 31 43 20 S55 7 60 7" stroke="var(--thumb-a)" />
          <path className="thumbAxis" d="M7 35 H60 M9 8 v29" />
          <circle className="thumbDot" cx="49" cy="14" r="2" fill="var(--thumb-b)" />
        </>
      );
    case "lorenz":
      return (
        <>
          <path className="thumbLine" d="M32 22 C14 4 5 22 16 32 S32 24 32 22 C50 4 59 22 48 32 S32 24 32 22" stroke="var(--thumb-a)" />
          <path className="thumbFine" d="M32 22 C23 17 22 31 32 35 C43 31 42 17 32 22" stroke="var(--thumb-b)" />
        </>
      );
    default:
      return (
        <>
          <path className="thumbLine" d="M7 31 C17 11 28 34 37 18 S52 12 58 28" stroke="var(--thumb-a)" />
          {dots([[23, 24], [47, 19]], "var(--thumb-b)", 2.2)}
        </>
      );
  }
}

export function SimulatorThumbnail({ simulatorId, domain }: SimulatorThumbnailProps) {
  const palette = thumbnailPalette(domain);
  const gradientId = `thumbnail-${simulatorId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const style: ThumbnailStyle = {
    "--thumb-a": palette.a,
    "--thumb-b": palette.b,
    "--thumb-c": palette.c,
  };

  return (
    <span className="simPreview" style={style} aria-hidden="true">
      <svg viewBox="0 0 64 44" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={palette.a} stopOpacity="0.22" />
            <stop offset="58%" stopColor={palette.b} stopOpacity="0.1" />
            <stop offset="100%" stopColor={palette.c} stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <rect className="thumbBase" x="1" y="1" width="62" height="42" rx="5" fill={`url(#${gradientId})`} />
        <path className="thumbGrid" d="M16 5v34M32 5v34M48 5v34M5 14h54M5 28h54" />
        <g className="thumbGlyph">{glyphFor(simulatorId)}</g>
      </svg>
    </span>
  );
}

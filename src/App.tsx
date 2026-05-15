import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Atom, FlaskConical, Orbit, Search, Sigma, Sparkles, type LucideIcon } from "lucide-react";
import { SimulatorFallback } from "./components/SimulatorFallback";
import { SimulatorThumbnail } from "./components/SimulatorThumbnail";
import { simulators } from "./simulators";
import type { SimulatorDiscipline } from "./types";

const simulatorModules = {
  photoelectric: lazy(() => import("./simulators/PhotoelectricSimulator")),
  "double-slit": lazy(() => import("./simulators/DoubleSlitSimulator")),
  "alcohol-oxidation": lazy(() => import("./simulators/AlcoholOxidationSimulator")),
  "sampling-lab": lazy(() => import("./simulators/SamplingLabSimulator")),
  "vector-addition": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.VectorAdditionSimulator,
    })),
  ),
  "linear-regression": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.LinearRegressionSimulator,
    })),
  ),
  "pythagorean-theorem": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.PythagoreanTheoremSimulator,
    })),
  ),
  "unit-circle": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.UnitCircleSimulator,
    })),
  ),
  "binomial-distribution": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.BinomialDistributionSimulator,
    })),
  ),
  "exponential-growth": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.ExponentialGrowthSimulator,
    })),
  ),
  "hookes-law": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.HookesLawSimulator,
    })),
  ),
  "projectile-motion": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.ProjectileMotionSimulator,
    })),
  ),
  "wave-superposition": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.WaveSuperpositionSimulator,
    })),
  ),
  "standing-wave": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.StandingWaveSimulator,
    })),
  ),
  "doppler-effect": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.DopplerEffectSimulator,
    })),
  ),
  pendulum: lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.PendulumSimulator,
    })),
  ),
  "ohms-law": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.OhmsLawSimulator,
    })),
  ),
  "rc-circuit": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.RcCircuitSimulator,
    })),
  ),
  "wire-magnetic-field": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.WireMagneticFieldSimulator,
    })),
  ),
  "parallel-plate-capacitor": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.ParallelPlateCapacitorSimulator,
    })),
  ),
  "coulombs-law": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.CoulombsLawSimulator,
    })),
  ),
  "acid-base-ph": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.AcidBasePhSimulator,
    })),
  ),
  "solution-dilution": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.SolutionDilutionSimulator,
    })),
  ),
  stoichiometry: lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.StoichiometrySimulator,
    })),
  ),
  "ideal-gas-law": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.IdealGasLawSimulator,
    })),
  ),
  "reaction-kinetics": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.ReactionKineticsSimulator,
    })),
  ),
  "incline-force": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.InclineForceSimulator,
    })),
  ),
  "newtons-second-law": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.NewtonsSecondLawSimulator,
    })),
  ),
  "work-energy": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.WorkEnergySimulator,
    })),
  ),
  "snells-law": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.SnellsLawSimulator,
    })),
  ),
  "thin-lens": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.ThinLensSimulator,
    })),
  ),
  "newton-cooling": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.NewtonCoolingSimulator,
    })),
  ),
  "carnot-engine": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.CarnotEngineSimulator,
    })),
  ),
  buoyancy: lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.BuoyancySimulator,
    })),
  ),
  "hydrostatic-pressure": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.HydrostaticPressureSimulator,
    })),
  ),
  "circular-motion": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.CircularMotionSimulator,
    })),
  ),
  "gravity-field": lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.GravityFieldSimulator,
    })),
  ),
  lorenz: lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.LorenzAttractorSimulator,
    })),
  ),
  orbital: lazy(() =>
    import("./simulators/MicroSimulators").then((module) => ({
      default: module.OrbitalMechanicsSimulator,
    })),
  ),
};

type LiveSimulatorId = keyof typeof simulatorModules;
type DisciplineFilter = "All" | SimulatorDiscipline;
const activeSimulatorStorageKey = "omni-sim-active-simulator";
const disciplineStorageKey = "omni-sim-discipline-filter";
const legacyActiveSimulatorStorageKey = "simulation-forge-active-simulator";
const legacyDisciplineStorageKey = "simulation-forge-discipline-filter";

const disciplineOrder: SimulatorDiscipline[] = ["Physics", "Chemistry", "Math"];

const disciplineMeta: Record<SimulatorDiscipline, { icon: LucideIcon; label: string }> = {
  Physics: { icon: Orbit, label: "Physics" },
  Chemistry: { icon: FlaskConical, label: "Chemistry" },
  Math: { icon: Sigma, label: "Math" },
};

function isLiveSimulator(id: string): id is LiveSimulatorId {
  return id in simulatorModules;
}

function previewPalette(domain: string) {
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

function SimulatorPreview({ simulatorId, domain }: { simulatorId: string; domain: string }) {
  const palette = previewPalette(domain);
  const gradientId = `preview-${simulatorId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const drawWave = domain === "Waves" || simulatorId === "unit-circle";
  const drawCircuit = domain === "Electricity";
  const drawChemistry = domain.includes("Chemistry");
  const drawMechanics = ["Mechanics", "Forces"].includes(domain);
  const drawStats = ["Statistics", "Probability", "Functions", "Foundations", "Geometry", "Chaos"].includes(domain);
  const drawOptics = domain === "Optics";
  const drawGravity = domain === "Gravity";
  const drawFluid = ["Fluids", "Thermodynamics"].includes(domain);

  return (
    <span className="simPreview" aria-hidden="true">
      <svg viewBox="0 0 160 58" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={palette.a} stopOpacity="0.24" />
            <stop offset="58%" stopColor={palette.b} stopOpacity="0.13" />
            <stop offset="100%" stopColor={palette.c} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect className="simPreviewBase" x="1" y="1" width="158" height="56" rx="5" fill={`url(#${gradientId})`} />
        <path className="simPreviewGrid" d="M20 4v50M50 4v50M80 4v50M110 4v50M140 4v50M4 15h152M4 29h152M4 43h152" />
        {simulatorId === "photoelectric" ? (
          <>
            <rect x="54" y="11" width="8" height="36" rx="2" fill={palette.b} opacity="0.78" />
            <rect x="105" y="13" width="8" height="32" rx="2" fill={palette.a} opacity="0.68" />
            <path className="simPreviewTrace" d="M18 34 C34 20 43 20 54 27" stroke={palette.c} />
            <path className="simPreviewTrace thin" d="M62 27 C80 18 92 20 105 28" stroke={palette.a} />
            <circle cx="38" cy="26" r="4" fill={palette.c} />
            <circle cx="86" cy="22" r="3" fill={palette.a} />
            <circle cx="96" cy="30" r="2.5" fill={palette.a} />
          </>
        ) : simulatorId === "double-slit" ? (
          <>
            <circle cx="26" cy="29" r="5" fill={palette.a} />
            <rect x="66" y="8" width="5" height="42" rx="1" fill={palette.b} opacity="0.76" />
            <path className="simPreviewTrace thin" d="M25 29 C40 20 50 20 66 24 M25 29 C40 38 50 38 66 34" stroke={palette.a} />
            <path className="simPreviewTrace" d="M75 18 C96 4 122 4 148 18 M75 40 C96 54 122 54 148 40" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M139 10 v38" stroke={palette.c} />
          </>
        ) : simulatorId === "wave-superposition" ? (
          <>
            <path className="simPreviewTrace thin" d="M8 22 C28 4 45 40 65 22 S106 4 126 22 145 40 154 30" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M8 39 C30 57 44 18 66 39 S106 57 126 39 145 18 154 28" stroke={palette.b} />
            <path className="simPreviewTrace" d="M12 30 C34 18 48 18 72 30 S111 42 148 29" stroke={palette.c} />
          </>
        ) : simulatorId === "standing-wave" ? (
          <>
            <path className="simPreviewTrace" d="M14 29 C32 2 48 56 66 29 S100 2 118 29 136 56 150 29" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M14 29 H150" stroke={palette.c} />
            {[14, 66, 118, 150].map((x) => <circle key={x} cx={x} cy="29" r="3" fill={palette.b} />)}
          </>
        ) : simulatorId === "doppler-effect" ? (
          <>
            {[15, 26, 39, 54].map((r) => <circle key={r} cx="62" cy="29" r={r} fill="none" stroke={palette.a} opacity="0.34" />)}
            {[8, 15, 23].map((r) => <circle key={r} cx="102" cy="29" r={r} fill="none" stroke={palette.b} opacity="0.45" />)}
            <circle cx="93" cy="29" r="6" fill={palette.c} />
            <path className="simPreviewTrace thin" d="M93 29 h28" stroke={palette.c} />
          </>
        ) : simulatorId === "alcohol-oxidation" ? (
          <>
            <path className="simPreviewTrace thin" d="M28 40 L55 18 L82 40 M55 18 v-8" stroke={palette.a} />
            <path className="simPreviewTrace" d="M91 29 h24" stroke={palette.c} />
            <path className="simPreviewTrace thin" d="M109 21 l8 8 -8 8" stroke={palette.c} />
            <path className="simPreviewTrace" d="M127 40 L145 22 M132 22 h18" stroke={palette.b} />
            <circle cx="55" cy="10" r="4" fill={palette.b} />
          </>
        ) : simulatorId === "acid-base-ph" ? (
          <>
            <path className="simPreviewTrace" d="M30 8 v14 l-17 28 h58 L54 22 V8" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M23 42 C36 34 49 48 61 40" stroke={palette.b} />
            <path className="simPreviewTrace" d="M86 45 C104 45 105 13 122 13 S136 45 151 45" stroke={palette.c} />
          </>
        ) : simulatorId === "solution-dilution" ? (
          <>
            <path className="simPreviewTrace" d="M23 12 v34 h36 V12 M101 12 v34 h44 V12" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M29 34 h24 M108 38 h30" stroke={palette.b} />
            <path className="simPreviewTrace" d="M66 29 h25" stroke={palette.c} />
            <path className="simPreviewTrace thin" d="M84 21 l8 8 -8 8" stroke={palette.c} />
          </>
        ) : simulatorId === "stoichiometry" ? (
          <>
            <path className="simPreviewTrace" d="M80 12 v35 M39 47 h82 M48 18 h64" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M48 18 l-16 22 h32 Z M112 18 l-16 22 h32 Z" stroke={palette.b} />
            <circle cx="48" cy="36" r="4" fill={palette.c} />
            <circle cx="112" cy="30" r="4" fill={palette.c} />
          </>
        ) : simulatorId === "ideal-gas-law" ? (
          <>
            <rect x="30" y="14" width="88" height="32" rx="4" fill="none" stroke={palette.a} strokeWidth="2" />
            <rect x="100" y="14" width="12" height="32" fill={palette.b} opacity="0.62" />
            {[44, 58, 72, 88].map((x, index) => <circle key={x} cx={x} cy={index % 2 ? 22 : 36} r="3" fill={palette.c} />)}
            <path className="simPreviewTrace thin" d="M118 30 h24 M136 23 l8 7 -8 7" stroke={palette.b} />
          </>
        ) : simulatorId === "reaction-kinetics" ? (
          <>
            <path className="simPreviewTrace" d="M16 14 C42 20 55 43 85 45 S128 43 148 28" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M16 45 C48 45 70 18 148 14" stroke={palette.b} />
            <circle cx="42" cy="31" r="4" fill={palette.c} />
            <circle cx="112" cy="20" r="4" fill={palette.b} />
          </>
        ) : simulatorId === "sampling-lab" ? (
          <>
            <path className="simPreviewTrace" d="M18 45 C45 45 49 12 80 12 S115 45 144 45" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M98 12 v34 M89 19 h18" stroke={palette.b} />
            <circle cx="98" cy="22" r="4" fill={palette.c} />
          </>
        ) : simulatorId === "vector-addition" ? (
          <>
            <path className="simPreviewTrace" d="M34 42 L76 18" stroke={palette.a} />
            <path className="simPreviewTrace" d="M76 18 L124 34" stroke={palette.b} />
            <path className="simPreviewTrace thin" d="M34 42 L124 34" stroke={palette.c} />
            <path className="simPreviewTrace thin" d="M68 17 l9 1 -4 8 M116 29 l9 5 -9 5" stroke={palette.a} />
          </>
        ) : simulatorId === "linear-regression" ? (
          <>
            <path className="simPreviewTrace" d="M18 44 L146 16" stroke={palette.a} />
            {[34, 52, 73, 96, 121].map((x, index) => <circle key={x} cx={x} cy={42 - index * 6 + (index % 2 ? 6 : -2)} r="4" fill={palette.b} />)}
          </>
        ) : simulatorId === "pythagorean-theorem" ? (
          <>
            <path className="simPreviewTrace" d="M38 43 H116 L38 14 Z" stroke={palette.a} />
            <rect x="28" y="43" width="18" height="10" fill={palette.b} opacity="0.62" />
            <rect x="20" y="18" width="18" height="25" fill={palette.c} opacity="0.45" />
            <path className="simPreviewTrace thin" d="M82 25 l16 -13" stroke={palette.b} />
          </>
        ) : simulatorId === "binomial-distribution" ? (
          <>
            {[24, 42, 60, 78, 96, 114, 132].map((x, index) => <rect key={x} x={x} y={45 - [5, 12, 25, 34, 25, 12, 5][index]} width="11" height={[5, 12, 25, 34, 25, 12, 5][index]} fill={index === 3 ? palette.b : palette.a} opacity="0.74" />)}
            <path className="simPreviewTrace thin" d="M18 45 H146" stroke={palette.c} />
          </>
        ) : simulatorId === "exponential-growth" ? (
          <>
            <path className="simPreviewTrace" d="M18 45 C54 45 76 42 95 30 S124 9 148 8" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M18 45 H148 M22 10 v39" stroke={palette.c} />
            <circle cx="112" cy="21" r="4" fill={palette.b} />
          </>
        ) : simulatorId === "ohms-law" ? (
          <>
            <path className="simPreviewTrace" d="M28 42 H52 V18 H118 V42 H140" stroke={palette.a} />
            <path className="simPreviewTrace" d="M64 18 l6 -9 7 18 7 -18 7 18 7 -9" stroke={palette.b} />
            <path className="simPreviewTrace thin" d="M34 32 h13 M40 25 v14" stroke={palette.c} />
          </>
        ) : simulatorId === "rc-circuit" ? (
          <>
            <path className="simPreviewTrace" d="M20 42 H52 V17 H122 V42 H142" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M82 23 v18 M91 23 v18" stroke={palette.b} />
            <path className="simPreviewTrace" d="M97 42 C111 42 116 24 139 18" stroke={palette.c} />
          </>
        ) : simulatorId === "wire-magnetic-field" ? (
          <>
            <path className="simPreviewTrace" d="M80 7 V51" stroke={palette.b} />
            {[14, 25, 37].map((r) => <circle key={r} cx="80" cy="29" r={r} fill="none" stroke={palette.a} opacity="0.46" />)}
            <path className="simPreviewTrace thin" d="M108 18 l9 3 -7 7" stroke={palette.c} />
          </>
        ) : simulatorId === "parallel-plate-capacitor" ? (
          <>
            <rect x="47" y="12" width="8" height="36" rx="2" fill={palette.a} opacity="0.75" />
            <rect x="105" y="12" width="8" height="36" rx="2" fill={palette.b} opacity="0.75" />
            {[18, 26, 34, 42].map((y) => <path key={y} className="simPreviewTrace thin" d={`M58 ${y} H102`} stroke={palette.c} />)}
            <path className="simPreviewTrace thin" d="M80 15 v28" stroke={palette.a} />
          </>
        ) : simulatorId === "coulombs-law" ? (
          <>
            <circle cx="50" cy="29" r="10" fill={palette.a} opacity="0.78" />
            <circle cx="110" cy="29" r="10" fill={palette.b} opacity="0.78" />
            <path className="simPreviewTrace" d="M62 29 H98" stroke={palette.c} />
            <path className="simPreviewTrace thin" d="M35 29 H15 M125 29 H145" stroke={palette.c} />
          </>
        ) : simulatorId === "newtons-second-law" ? (
          <>
            <rect x="54" y="27" width="38" height="20" rx="4" fill={palette.b} opacity="0.72" />
            <path className="simPreviewTrace" d="M16 37 H52 M92 37 H142" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M135 30 l8 7 -8 7" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M20 47 H144" stroke={palette.c} />
          </>
        ) : simulatorId === "work-energy" ? (
          <>
            <path className="simPreviewTrace" d="M22 45 H142 L142 23" stroke={palette.c} />
            <path className="simPreviewTrace" d="M30 43 L112 18" stroke={palette.a} />
            <rect x="74" y="26" width="24" height="16" rx="3" fill={palette.b} opacity="0.72" transform="rotate(-17 86 34)" />
            <path className="simPreviewTrace thin" d="M120 43 v-18" stroke={palette.b} />
          </>
        ) : simulatorId === "snells-law" ? (
          <>
            <path className="simPreviewTrace thin" d="M10 30 H150" stroke={palette.c} />
            <path className="simPreviewTrace" d="M42 8 L80 30 L125 48" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M80 8 V52" stroke={palette.b} />
            <circle cx="80" cy="30" r="4" fill={palette.b} />
          </>
        ) : simulatorId === "thin-lens" ? (
          <>
            <path className="simPreviewTrace thin" d="M80 8 C91 20 91 38 80 50 C69 38 69 20 80 8" stroke={palette.c} />
            <path className="simPreviewTrace" d="M14 19 H80 L143 38 M14 39 H80 L143 20" stroke={palette.a} />
            <circle cx="116" cy="29" r="4" fill={palette.b} />
          </>
        ) : simulatorId === "newton-cooling" ? (
          <>
            <path className="simPreviewTrace" d="M18 14 C54 18 72 42 146 45" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M20 45 H150" stroke={palette.c} />
            <rect x="42" y="13" width="10" height="34" rx="5" fill={palette.b} opacity="0.65" />
            <circle cx="47" cy="43" r="7" fill={palette.b} />
          </>
        ) : simulatorId === "carnot-engine" ? (
          <>
            <rect x="20" y="10" width="38" height="14" rx="3" fill={palette.b} opacity="0.65" />
            <rect x="102" y="36" width="38" height="14" rx="3" fill={palette.a} opacity="0.65" />
            <path className="simPreviewTrace" d="M58 17 C96 11 112 20 120 36 M102 43 C64 49 48 40 40 24" stroke={palette.c} />
            <circle cx="80" cy="29" r="8" fill={palette.b} opacity="0.45" />
          </>
        ) : simulatorId === "buoyancy" ? (
          <>
            <path className="simPreviewTrace" d="M22 20 v30 h116 V20" stroke={palette.c} />
            <path className="simPreviewTrace thin" d="M27 34 C45 27 58 42 76 34 S108 27 134 34" stroke={palette.a} />
            <rect x="68" y="23" width="28" height="22" rx="4" fill={palette.b} opacity="0.68" />
            <path className="simPreviewTrace thin" d="M82 45 V24" stroke={palette.a} />
          </>
        ) : simulatorId === "hydrostatic-pressure" ? (
          <>
            <path className="simPreviewTrace" d="M36 12 v38 h80 V12" stroke={palette.c} />
            <path className="simPreviewTrace thin" d="M40 25 h72 M40 38 h72" stroke={palette.a} />
            <circle cx="78" cy="42" r="5" fill={palette.b} />
            <path className="simPreviewTrace" d="M122 18 v29" stroke={palette.b} />
          </>
        ) : simulatorId === "gravity-field" ? (
          <>
            <circle cx="63" cy="29" r="10" fill={palette.b} />
            {[18, 30, 42].map((r) => <circle key={r} cx="63" cy="29" r={r} fill="none" stroke={palette.a} opacity="0.38" />)}
            <circle cx="122" cy="29" r="5" fill={palette.a} />
            <path className="simPreviewTrace thin" d="M122 29 C103 21 84 22 67 28" stroke={palette.c} />
          </>
        ) : simulatorId === "orbital" ? (
          <>
            <ellipse className="simPreviewOrbit" cx="82" cy="29" rx="55" ry="20" stroke={palette.a} />
            <circle cx="72" cy="29" r="8" fill={palette.b} />
            <circle cx="127" cy="21" r="5" fill={palette.a} />
            <path className="simPreviewTrace thin" d="M128 21 l15 -6" stroke={palette.c} />
          </>
        ) : simulatorId === "lorenz" ? (
          <>
            <path className="simPreviewTrace" d="M78 29 C40 0 18 28 42 43 S78 31 78 29 C116 0 142 28 116 43 S78 31 78 29" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M78 29 C57 19 53 40 78 48 C105 40 100 18 78 29" stroke={palette.b} />
          </>
        ) : simulatorId === "unit-circle" ? (
          <>
            <path className="simPreviewTrace thin" d="M25 29 H137 M80 8 V50" stroke={palette.c} />
            <circle cx="80" cy="29" r="24" fill="none" stroke={palette.a} strokeWidth="2" opacity="0.78" />
            <path className="simPreviewTrace" d="M80 29 L101 17" stroke={palette.b} />
            <path className="simPreviewTrace thin" d="M101 17 V29 H80" stroke={palette.a} />
            <circle cx="101" cy="17" r="4" fill={palette.b} />
          </>
        ) : simulatorId === "hookes-law" ? (
          <>
            <path className="simPreviewTrace thin" d="M25 12 V46 M25 42 H150" stroke={palette.c} />
            <path className="simPreviewTrace" d="M26 30 h10 l5 -8 8 16 8 -16 8 16 8 -16 8 16 6 -8 h14" stroke={palette.a} />
            <rect x="101" y="20" width="29" height="20" rx="4" fill={palette.b} opacity="0.7" />
            <circle cx="116" cy="20" r="4" fill={palette.a} />
          </>
        ) : simulatorId === "pendulum" ? (
          <>
            <path className="simPreviewTrace thin" d="M48 12 C62 45 98 45 112 12" stroke={palette.c} />
            <path className="simPreviewTrace" d="M80 10 L103 39" stroke={palette.a} />
            <circle cx="80" cy="10" r="3" fill={palette.b} />
            <circle cx="103" cy="39" r="8" fill={palette.b} opacity="0.82" />
          </>
        ) : simulatorId === "projectile-motion" ? (
          <>
            <path className="simPreviewTrace" d="M18 45 C44 5 86 7 128 45" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M14 45 H150" stroke={palette.c} />
            <circle cx="77" cy="15" r="6" fill={palette.b} />
            <path className="simPreviewTrace thin" d="M28 42 l23 -17" stroke={palette.b} />
          </>
        ) : simulatorId === "incline-force" ? (
          <>
            <path className="simPreviewTrace" d="M24 45 H138 L138 20 Z" stroke={palette.c} />
            <rect x="79" y="25" width="26" height="18" rx="3" fill={palette.b} opacity="0.7" transform="rotate(-18 92 34)" />
            <path className="simPreviewTrace thin" d="M92 32 l-16 -12 M92 32 l19 -6 M92 32 v18" stroke={palette.a} />
          </>
        ) : simulatorId === "circular-motion" ? (
          <>
            <ellipse className="simPreviewOrbit" cx="80" cy="29" rx="38" ry="22" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M80 29 L112 18 M112 18 l18 -10" stroke={palette.c} />
            <circle cx="112" cy="18" r="6" fill={palette.b} />
            <circle cx="80" cy="29" r="3" fill={palette.a} />
          </>
        ) : drawWave ? (
          <>
            <path className="simPreviewTrace" d="M8 30 C24 8 40 52 56 30 S88 8 104 30 136 52 152 30" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M8 38 C28 22 42 22 62 38 S96 54 116 38 140 22 154 36" stroke={palette.b} />
            {simulatorId === "double-slit" ? <rect x="70" y="8" width="5" height="42" rx="1" fill={palette.b} opacity="0.7" /> : null}
          </>
        ) : drawCircuit ? (
          <>
            <path className="simPreviewTrace" d="M22 42 H48 V18 H112 V42 H138" stroke={palette.a} />
            <path className="simPreviewTrace" d="M66 18 l7 -10 7 20 7 -20 7 20 7 -10" stroke={palette.b} />
            <path className="simPreviewTrace thin" d="M110 26 h20M110 34 h20M116 24 v14M124 24 v14" stroke={palette.c} />
            <circle cx="48" cy="42" r="4" fill={palette.a} />
            <circle cx="112" cy="42" r="4" fill={palette.a} />
          </>
        ) : drawChemistry ? (
          <>
            <path className="simPreviewTrace" d="M54 12 v11 l-20 26 h92 l-20 -26 V12" stroke={palette.c} />
            <path className="simPreviewTrace" d="M42 42 C58 34 70 50 86 40 S110 34 122 43" stroke={palette.a} />
            <circle cx="62" cy="34" r="4" fill={palette.b} />
            <circle cx="89" cy="40" r="3" fill={palette.a} />
            <circle cx="105" cy="34" r="3.5" fill={palette.c} />
          </>
        ) : drawMechanics ? (
          <>
            <path className="simPreviewTrace" d="M14 45 C42 8 74 8 102 45 C120 60 140 52 153 43" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M18 45 H154" stroke={palette.c} />
            <circle cx="82" cy="17" r="6" fill={palette.b} />
            <path className="simPreviewTrace" d="M30 42 l20 -20" stroke={palette.b} />
          </>
        ) : drawOptics ? (
          <>
            <path className="simPreviewTrace" d="M8 24 H72 C92 24 96 12 116 12 H154" stroke={palette.b} />
            <path className="simPreviewTrace" d="M8 34 H72 C92 34 96 46 116 46 H154" stroke={palette.a} />
            <path className="simPreviewTrace thin" d="M82 8 C92 19 92 39 82 50" stroke={palette.c} />
          </>
        ) : drawGravity ? (
          <>
            <ellipse className="simPreviewOrbit" cx="80" cy="29" rx="56" ry="20" stroke={palette.a} />
            <ellipse className="simPreviewOrbit" cx="80" cy="29" rx="34" ry="12" stroke={palette.b} />
            <circle cx="76" cy="29" r="7" fill={palette.b} />
            <circle cx="125" cy="21" r="4" fill={palette.a} />
          </>
        ) : drawFluid ? (
          <>
            <path className="simPreviewTrace" d="M22 18 v30 h110 V18" stroke={palette.c} />
            <path className="simPreviewTrace" d="M28 34 C44 26 58 42 74 34 S104 26 128 34" stroke={palette.a} />
            <rect x="62" y="22" width="28" height="22" rx="3" fill={palette.b} opacity="0.38" />
            <path className="simPreviewTrace thin" d="M104 18 v30" stroke={palette.b} />
          </>
        ) : drawStats ? (
          <>
            <path className="simPreviewTrace" d="M16 43 C38 43 40 18 58 18 S80 43 102 43 124 20 146 20" stroke={palette.a} />
            <rect x="24" y="32" width="10" height="13" fill={palette.b} opacity="0.72" />
            <rect x="42" y="23" width="10" height="22" fill={palette.a} opacity="0.72" />
            <rect x="60" y="15" width="10" height="30" fill={palette.c} opacity="0.72" />
            <circle cx="80" cy="30" r="12" fill="none" stroke={palette.b} opacity="0.52" />
          </>
        ) : (
          <>
            <path className="simPreviewTrace" d="M18 40 C42 12 62 48 84 24 S126 12 146 36" stroke={palette.a} />
            <circle cx="56" cy="29" r="5" fill={palette.b} />
            <circle cx="106" cy="24" r="5" fill={palette.c} />
          </>
        )}
      </svg>
    </span>
  );
}

function readStoredActiveSimulator(): LiveSimulatorId {
  const stored =
    window.localStorage.getItem(activeSimulatorStorageKey) ??
    window.localStorage.getItem(legacyActiveSimulatorStorageKey);
  return stored && isLiveSimulator(stored) ? stored : "photoelectric";
}

function readStoredDisciplineFilter(): DisciplineFilter {
  const stored =
    window.localStorage.getItem(disciplineStorageKey) ??
    window.localStorage.getItem(legacyDisciplineStorageKey);
  return stored === "All" || stored === "Physics" || stored === "Chemistry" || stored === "Math" ? stored : "All";
}

export function App() {
  const [activeId, setActiveId] = useState<LiveSimulatorId>(readStoredActiveSimulator);
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>(readStoredDisciplineFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const ActiveSimulator = useMemo(() => simulatorModules[activeId], [activeId]);
  const visibleSimulators = useMemo(
    () => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      return simulators.filter((simulator) => {
        const matchesDiscipline = disciplineFilter === "All" || simulator.discipline === disciplineFilter;
        if (!matchesDiscipline) return false;
        if (!normalizedQuery) return true;
        return [simulator.name, simulator.domain, simulator.discipline, simulator.summary]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });
    },
    [disciplineFilter, searchQuery],
  );
  const simulatorGroups = useMemo(
    () =>
      disciplineOrder
        .map((discipline) => ({
          discipline,
          items: visibleSimulators.filter((simulator) => simulator.discipline === discipline),
        }))
        .filter((group) => group.items.length > 0),
    [visibleSimulators],
  );

  const setDiscipline = (discipline: DisciplineFilter) => {
    setDisciplineFilter(discipline);
    const nextVisible =
      discipline === "All"
        ? simulators
        : simulators.filter((simulator) => simulator.discipline === discipline);
    if (!nextVisible.some((simulator) => simulator.id === activeId)) {
      const nextLive = nextVisible.find((simulator) => isLiveSimulator(simulator.id));
      if (nextLive && isLiveSimulator(nextLive.id)) setActiveId(nextLive.id);
    }
  };

  const selectSimulator = (id: LiveSimulatorId) => {
    setActiveId(id);
  };

  useEffect(() => {
    window.localStorage.setItem(activeSimulatorStorageKey, activeId);
  }, [activeId]);

  useEffect(() => {
    window.localStorage.setItem(disciplineStorageKey, disciplineFilter);
  }, [disciplineFilter]);

  return (
    <main className={`appShell ${isLibraryCollapsed ? "sidebarCollapsed" : ""}`}>
      <aside className="libraryDock">
        <button
          type="button"
          className="brandBlock"
          onClick={() => setIsLibraryCollapsed((current) => !current)}
          aria-label={`${isLibraryCollapsed ? "Expand" : "Collapse"} simulator sidebar`}
          aria-expanded={!isLibraryCollapsed}
        >
          <span className="brandMark">
            <Atom size={22} aria-hidden="true" />
          </span>
          <span>
            <h1>Omni-Sim</h1>
          </span>
        </button>

        <div className="dockTitle">
          <Sparkles size={16} aria-hidden="true" />
          <span>Simulators</span>
        </div>

        <label className="librarySearch">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            placeholder="Search Simulators"
            aria-label="Search Simulators"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="disciplineFilters" aria-label="Simulator Disciplines">
          <button
            type="button"
            className={disciplineFilter === "All" ? "selected" : ""}
            onClick={() => setDiscipline("All")}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>All</span>
            <small>{simulators.length}</small>
          </button>
          {disciplineOrder.map((discipline) => {
            const Icon = disciplineMeta[discipline].icon;
            const count = simulators.filter((simulator) => simulator.discipline === discipline).length;
            return (
              <button
                type="button"
                className={disciplineFilter === discipline ? "selected" : ""}
                key={discipline}
                onClick={() => setDiscipline(discipline)}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{disciplineMeta[discipline].label}</span>
                <small>{count}</small>
              </button>
            );
          })}
        </div>

        <div className="simList">
          {simulatorGroups.length ? simulatorGroups.map((group) => {
            const Icon = disciplineMeta[group.discipline].icon;
            return (
              <section className="simGroup" key={group.discipline}>
                <div className="simGroupHeader">
                  <Icon size={14} aria-hidden="true" />
                  <span>{group.discipline}</span>
                </div>
                {group.items.map((simulator) => {
                  const id = simulator.id;
                  const live = isLiveSimulator(id);
                  return (
                    <button
                      className={`simItem ${id === activeId ? "active" : ""}`}
                      key={id}
                      type="button"
                      disabled={!live}
                      aria-label={`${simulator.name}. ${simulator.summary}`}
                      title={simulator.summary}
                      onClick={() => {
                        if (live) selectSimulator(id);
                      }}
                    >
                      <SimulatorThumbnail simulatorId={id} domain={simulator.domain} />
                      <span className="simItemText">
                        <span className="simDomain">{simulator.domain}</span>
                        <strong>{simulator.name}</strong>
                      </span>
                    </button>
                  );
                })}
              </section>
            );
          }) : (
            <div className="emptySearchState">
              <strong>No Matches</strong>
              <small>Try a topic, domain, or discipline.</small>
            </div>
          )}
        </div>
      </aside>

      <Suspense fallback={<SimulatorFallback />}>
        <ActiveSimulator />
      </Suspense>
    </main>
  );
}

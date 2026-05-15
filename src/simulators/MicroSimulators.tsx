import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Atom,
  BatteryCharging,
  Box,
  CircleGauge,
  Compass,
  History,
  Magnet,
  Pause,
  Play,
  RotateCcw,
  Sigma,
  SlidersHorizontal,
  Tags,
  Waves,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BlockMath, InlineMath } from "../components/Equation";
import { ExplanationButton } from "../components/ExplanationButton";
import { FullscreenButton } from "../components/FullscreenButton";
import { HistoryGallery, HistoryLinks, type HistoryCard } from "../components/HistoryGallery";
import {
  ControlSlider,
  format,
  Metric,
  MiniChart,
  type ChartPoint,
} from "../components/WorkbenchControls";
import { useFullscreenMode } from "../hooks/useFullscreenMode";

type MicroKind =
  | "vector"
  | "matrixtransform"
  | "dotproduct"
  | "linearsystem"
  | "eigenvectors"
  | "spring"
  | "projectile"
  | "superposition"
  | "standingwave"
  | "doppler"
  | "pendulum"
  | "ohm"
  | "rc"
  | "capacitor"
  | "coulomb"
  | "wirefield"
  | "incline"
  | "newton2"
  | "workenergy"
  | "snell"
  | "thinlens"
  | "cooling"
  | "carnot"
  | "buoyancy"
  | "hydrostatic"
  | "circular"
  | "gravityfield"
  | "pythagorean"
  | "unitcircle"
  | "binomial"
  | "exponential"
  | "acidbase"
  | "dilution"
  | "stoichiometry"
  | "idealgas"
  | "kinetics"
  | "regression"
  | "lorenz"
  | "orbital";

type ViewMode = "2d" | "3d";

type Params = Record<string, number>;

type ControlSpec = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
};

type MetricSpec = {
  label: string;
  value: string;
  tone: string;
  icon?: LucideIcon;
};

type ChartSpec = {
  label: string;
  points: ChartPoint[];
  activeX: number;
  activeY: number;
  color: string;
  xUnit: string;
  yUnit: string;
};

type ValueCallout = {
  math: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
};

type HistorySpec = {
  body: string | string[];
  cards: HistoryCard[];
  links: Array<{ label: string; href: string }>;
};

type PresetSpec = {
  label: string;
  description: string;
  values: Params;
};

type MicroSpec = {
  kind: MicroKind;
  title: string;
  eyebrow: string;
  status: string;
  initial: Params;
  controls: ControlSpec[];
  metrics: (params: Params) => MetricSpec[];
  chart: (params: Params) => ChartSpec;
  equations: string[];
  explanation: string;
  history: HistorySpec;
  viewToggle?: boolean;
  presets?: PresetSpec[];
  animation?: {
    label: string;
    paramKey: string;
    speedPerSecond: number;
    speedParamKey?: string;
    min: number;
    max: number;
  };
};

const TAU = Math.PI * 2;

const historyCards = {
  gibbs: {
    name: "Josiah Willard Gibbs",
    role: "Helped formalize vector analysis for physics.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Josiah_Willard_Gibbs",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Josiah_Willard_Gibbs_-from_MMS-.jpg/330px-Josiah_Willard_Gibbs_-from_MMS-.jpg",
  },
  hamilton: {
    name: "William Rowan Hamilton",
    role: "Developed quaternions, an important ancestor of modern vector methods.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/William_Rowan_Hamilton",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/William_Rowan_Hamilton_portrait_oval_combined.png/330px-William_Rowan_Hamilton_portrait_oval_combined.png",
  },
  grassmann: {
    name: "Hermann Grassmann",
    role: "Built an early algebra of vectors, spans, and linear combinations.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Hermann_Grassmann",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Hermann_G%C3%BCnther_Gra%C3%9Fmann.jpg/330px-Hermann_G%C3%BCnther_Gra%C3%9Fmann.jpg",
  },
  cayley: {
    name: "Arthur Cayley",
    role: "Helped establish matrix algebra as an object of study in its own right.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Arthur_Cayley",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Arthur_Cayley.jpg/330px-Arthur_Cayley.jpg",
  },
  matrix: {
    name: "Matrix",
    role: "A rectangular number array that encodes linear transformations and systems.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Matrix_(mathematics)",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Matrix.svg/330px-Matrix.svg.png",
  },
  heaviside: {
    name: "Oliver Heaviside",
    role: "Popularized compact vector notation for electromagnetism.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Oliver_Heaviside",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Oheaviside.jpg/330px-Oheaviside.jpg",
  },
  hooke: {
    name: "Robert Hooke",
    role: "Stated the elastic proportionality now called Hooke's law.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Robert_Hooke",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Portrait_of_a_Mathematician_1680c.jpg/330px-Portrait_of_a_Mathematician_1680c.jpg",
  },
  spring: {
    name: "Spring Device",
    role: "Mechanical element whose force-extension curve became a standard model.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Spring_(device)",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Federkennlinie.svg/330px-Federkennlinie.svg.png",
  },
  galileo: {
    name: "Galileo Galilei",
    role: "Separated horizontal and vertical motion in early mechanics.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Galileo_Galilei",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Galileo_Galilei_%281564-1642%29_RMG_BHC2700.tiff/lossy-page1-330px-Galileo_Galilei_%281564-1642%29_RMG_BHC2700.tiff.jpg",
  },
  fourier: {
    name: "Joseph Fourier",
    role: "Showed how complex waves can be decomposed into simpler sinusoidal pieces.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Joseph_Fourier",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Fourier2_-_restoration1.jpg/330px-Fourier2_-_restoration1.jpg",
  },
  interference: {
    name: "Wave Interference",
    role: "Visible overlapping waves made superposition physically intuitive.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Wave_interference",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Interfering_surface_waves_on_a_lake.jpg/330px-Interfering_surface_waves_on_a_lake.jpg",
  },
  doppler: {
    name: "Christian Doppler",
    role: "Proposed the frequency-shift principle for moving wave sources in 1842.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Christian_Doppler",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Christian_Doppler.jpg/330px-Christian_Doppler.jpg",
  },
  dopplerDiagram: {
    name: "Doppler Effect Diagram",
    role: "Compressed and stretched wavefronts make motion-induced frequency shifts visible.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Doppler_effect",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Doppler_effect_diagrammatic.svg/330px-Doppler_effect_diagrammatic.svg.png",
  },
  sonicBoom: {
    name: "Sonic Boom",
    role: "When a source outruns its waves, wavefronts stack into a shock cone.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Sonic_boom",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Sonic_boom.svg/330px-Sonic_boom.svg.png",
  },
  huygens: {
    name: "Christiaan Huygens",
    role: "Built the first practical pendulum clock and analyzed circular motion.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Christiaan_Huygens",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Christiaan_Huygens-painting.jpeg/330px-Christiaan_Huygens-painting.jpeg",
  },
  pendulumClock: {
    name: "Pendulum Clock",
    role: "A precision timekeeping prototype built from periodic motion.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Pendulum_clock",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Galileo_Pendulum_Clock.jpg",
  },
  ohm: {
    name: "Georg Ohm",
    role: "Published the quantitative voltage-current-resistance relation in 1827.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Georg_Ohm",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Georg_Simon_Ohm_%281789-1854%29.jpg/330px-Georg_Simon_Ohm_%281789-1854%29.jpg",
  },
  volta: {
    name: "Alessandro Volta",
    role: "Developed the voltaic pile, a crucial early source of steady current.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Alessandro_Volta",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Alessandro_Volta.jpeg/330px-Alessandro_Volta.jpeg",
  },
  voltaicPile: {
    name: "Voltaic Pile",
    role: "Early battery stack that made circuit experiments practical.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Voltaic_pile",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Voltaic_pile.svg/330px-Voltaic_pile.svg.png",
  },
  resistor: {
    name: "Resistor",
    role: "Circuit component that embodies controlled electrical resistance.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Resistor",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Electronic-Axial-Lead-Resistors-Array.png/330px-Electronic-Axial-Lead-Resistors-Array.png",
  },
  sadiCarnot: {
    name: "Sadi Carnot",
    role: "Established the ideal heat-engine limit that became the Carnot efficiency.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Nicolas_L%C3%A9onard_Sadi_Carnot",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Sadi_Carnot.jpeg/500px-Sadi_Carnot.jpeg",
  },
  carnotEngineDiagram: {
    name: "Carnot Heat Engine",
    role: "Ideal reversible cycle showing heat drawn from a hot reservoir and rejected to a cold reservoir.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Carnot_heat_engine",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Carnot_heat_engine_2.svg/960px-Carnot_heat_engine_2.svg.png",
  },
  wattSteamEngine: {
    name: "Boulton And Watt Steam Engine",
    role: "Industrial heat engine context that made efficiency a practical engineering question.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Watt_steam_engine",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/SteamEngine_Boulton%26Watt_1784.png/960px-SteamEngine_Boulton%26Watt_1784.png",
  },
  inclinedPlane: {
    name: "Inclined Plane",
    role: "Classical simple machine used to reduce force and study motion.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Inclined_plane",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Chartres%2C_H%C3%B4tel_Montescot_08_rampe_PMR.jpg/330px-Chartres%2C_H%C3%B4tel_Montescot_08_rampe_PMR.jpg",
  },
  simpleMachine: {
    name: "Simple Machine",
    role: "The historical family that includes ramps, levers, pulleys, and screws.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Simple_machine",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Six_simple_machines.png/330px-Six_simple_machines.png",
  },
  newton: {
    name: "Isaac Newton",
    role: "Unified force and motion, making centripetal force part of mechanics.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Isaac_Newton",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Portrait_of_Sir_Isaac_Newton%2C_1689_%28brightened%29.jpg/330px-Portrait_of_Sir_Isaac_Newton%2C_1689_%28brightened%29.jpg",
  },
  principia: {
    name: "Philosophiae Naturalis Principia Mathematica",
    role: "Newton's 1687 work that organized force and motion into mathematical laws.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Philosophi%C3%A6_Naturalis_Principia_Mathematica",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/NewtonsPrincipia.jpg/330px-NewtonsPrincipia.jpg",
  },
  cavendish: {
    name: "Henry Cavendish",
    role: "Measured Earth's density and made laboratory gravitation quantitative.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Henry_Cavendish",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/db/Cavendish_Henry.jpg",
  },
  torsionBalance: {
    name: "Torsion Balance",
    role: "Sensitive apparatus used to measure tiny gravitational attraction between masses.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Cavendish_experiment",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Cavendish_Torsion_Balance_Diagram.svg/330px-Cavendish_Torsion_Balance_Diagram.svg.png",
  },
  atwoodMachine: {
    name: "Atwood Machine",
    role: "A pulley apparatus used to study accelerated motion under controlled forces.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Atwood_machine",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Atwood_machine.svg",
  },
  joule: {
    name: "James Prescott Joule",
    role: "Measured the mechanical equivalent of heat and helped establish energy conservation.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/James_Prescott_Joule",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/James_Prescott_Joule_by_John_Collier,_1882.jpg",
  },
  duChatelet: {
    name: "Emilie Du Chatelet",
    role: "Argued for kinetic energy scaling with speed squared in eighteenth-century mechanics.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/%C3%89milie_du_Ch%C3%A2telet",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Emilie_Chatelet_portrait_by_Latour.jpg",
  },
  leibniz: {
    name: "Gottfried Wilhelm Leibniz",
    role: "Promoted vis viva, an ancestor of the modern kinetic-energy concept.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Gottfried_Wilhelm_Leibniz",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Leibniz_Hannover.jpg",
  },
  centripetalForce: {
    name: "Centripetal Force",
    role: "The inward-force model used for orbits, wheels, and rotating systems.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Centripetal_force",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Force_acting_as_centripetal_force.svg/330px-Force_acting_as_centripetal_force.svg.png",
  },
  archimedes: {
    name: "Archimedes",
    role: "Associated with the buoyancy principle that links displaced fluid to upward force.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Archimedes",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Archimedes.jpg",
  },
  hydrometer: {
    name: "Hydrometer",
    role: "Floating instrument that uses buoyancy depth to measure liquid density.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Hydrometer",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Hydrometer.jpg",
  },
  cartesianDiver: {
    name: "Cartesian Diver",
    role: "Classic demonstration where density changes make a small diver float or sink.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Cartesian_diver",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Cartesian_diver.svg",
  },
  torricelli: {
    name: "Evangelista Torricelli",
    role: "Built the mercury barometer and connected air pressure to fluid columns.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Evangelista_Torricelli",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Evangelista_Torricelli.jpg",
  },
  barometer: {
    name: "Mercury Barometer",
    role: "A pressure instrument that reads atmosphere through liquid-column height.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Barometer",
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Barometer_mercury_column_hg.jpg",
  },
  lorenz: {
    name: "Edward Norton Lorenz",
    role: "Discovered sensitive dependence in a simplified atmospheric model.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Edward_Norton_Lorenz",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/EdwardLorenz.jpg/330px-EdwardLorenz.jpg",
  },
  lorenzSystem: {
    name: "Lorenz System",
    role: "A compact nonlinear system that produces a strange attractor.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Lorenz_system",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/13/A_Trajectory_Through_Phase_Space_in_a_Lorenz_Attractor.gif",
  },
  kepler: {
    name: "Johannes Kepler",
    role: "Described planetary orbits with ellipse-based laws of motion.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Johannes_Kepler",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/JKepler.jpg/330px-JKepler.jpg",
  },
  keplerOptics: {
    name: "Johannes Kepler",
    role: "Explained retinal image formation and gave lens optics a geometric foundation.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Johannes_Kepler",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/JKepler.jpg/330px-JKepler.jpg",
  },
  orbitalMechanics: {
    name: "Orbital Mechanics",
    role: "The applied mechanics of spacecraft, satellites, and planetary motion.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Orbital_mechanics",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Orbital_motion.gif",
  },
  hohmann: {
    name: "Hohmann Transfer Orbit",
    role: "A classic two-impulse transfer between circular orbits.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Hohmann_transfer_orbit",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Hohmann_transfer_orbit.svg/330px-Hohmann_transfer_orbit.svg.png",
  },
  arrhenius: {
    name: "Svante Arrhenius",
    role: "Defined acids and bases in terms of ions in aqueous solution.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Svante_Arrhenius",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Svante_Arrhenius_01.jpg/330px-Svante_Arrhenius_01.jpg",
  },
  sorensen: {
    name: "S. P. L. Sorensen",
    role: "Introduced the pH scale while studying acidity in biochemical systems.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/S._P._L._S%C3%B8rensen",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/S%C3%B8ren_Peder_Lauritz_S%C3%B8rensen.jpg/330px-S%C3%B8ren_Peder_Lauritz_S%C3%B8rensen.jpg",
  },
  phMeter: {
    name: "pH Meter",
    role: "Electrode-based instrument that made acidity measurement routine.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/PH_meter",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/PH_Meter.jpg/330px-PH_Meter.jpg",
  },
  boyle: {
    name: "Robert Boyle",
    role: "Measured pressure-volume behavior and helped establish experimental chemistry.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Robert_Boyle",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Robert_Boyle_by_Johann_Kerseboom.jpg/500px-Robert_Boyle_by_Johann_Kerseboom.jpg",
  },
  charles: {
    name: "Jacques Charles",
    role: "Associated with the temperature-volume gas relation at constant pressure.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Jacques_Charles",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Portrait_du_physicien_Charles_%28cropped%29.jpg/500px-Portrait_du_physicien_Charles_%28cropped%29.jpg",
  },
  boyleAirPump: {
    name: "Boyle Air Pump",
    role: "Early pneumatic apparatus that made pressure experiments visible and repeatable.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Air_pump",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Boyle_air_pump.jpg/500px-Boyle_air_pump.jpg",
  },
  vantHoff: {
    name: "Jacobus Henricus van 't Hoff",
    role: "Helped found chemical kinetics and connected reaction rates to physical chemistry.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Jacobus_Henricus_van_%27t_Hoff",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Jacobus_Henricus_van%27t_Hoff%2C_ante_1911_-_Accademia_delle_Scienze_di_Torino_0132.jpg/330px-Jacobus_Henricus_van%27t_Hoff%2C_ante_1911_-_Accademia_delle_Scienze_di_Torino_0132.jpg",
  },
  guldbergWaage: {
    name: "Guldberg And Waage",
    role: "Formulated mass-action ideas that made reaction rates mathematically tractable.",
    kind: "People",
    href: "https://en.wikipedia.org/wiki/Law_of_mass_action",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Guldberg_und_Waage_01.jpg/330px-Guldberg_und_Waage_01.jpg",
  },
  gauss: {
    name: "Carl Friedrich Gauss",
    role: "Connected least squares, error theory, astronomy, and the normal distribution.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Carl_Friedrich_Gauss",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Carl_Friedrich_Gauss.jpg/500px-Carl_Friedrich_Gauss.jpg",
  },
  legendre: {
    name: "Adrien-Marie Legendre",
    role: "Published the least-squares method for fitting observations in 1805.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Adrien-Marie_Legendre",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/03/Legendre.jpg",
  },
  galton: {
    name: "Francis Galton",
    role: "Popularized regression and correlation through heredity and measurement studies.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Francis_Galton",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Portrait_of_Francis_Galton_Wellcome_L0000543.jpg/330px-Portrait_of_Francis_Galton_Wellcome_L0000543.jpg",
  },
  ptolemy: {
    name: "Claudius Ptolemy",
    role: "Used chord tables that became an ancestor of trigonometric tables.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Ptolemy",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Claudius_Ptolemy%2C_half-length_portrait%2C_facing_right_LCCN93515230.jpg/330px-Claudius_Ptolemy%2C_half-length_portrait%2C_facing_right_LCCN93515230.jpg",
  },
  pythagoras: {
    name: "Pythagoras",
    role: "Associated with the theorem linking the side lengths of a right triangle.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Pythagoras",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pythagoras_in_the_Roman_Forum,_Colosseum.jpg",
  },
  euclid: {
    name: "Euclid",
    role: "Presented a classical geometric proof of the theorem in Elements.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Euclid",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Euclid.jpg",
  },
  pythagoreanDiagram: {
    name: "Pythagorean Diagram",
    role: "Square-area diagram showing why the two leg squares match the hypotenuse square.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Pythagorean_theorem",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pythagorean.svg",
  },
  euler: {
    name: "Leonhard Euler",
    role: "Standardized much of modern function notation and connected trig with exponentials.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Leonhard_Euler",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Leonhard_Euler.jpg/330px-Leonhard_Euler.jpg",
  },
  napier: {
    name: "John Napier",
    role: "Introduced logarithms as practical calculation tools, making exponential relationships easier to handle.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/John_Napier",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/John_Napier.jpg",
  },
  malthus: {
    name: "Thomas Robert Malthus",
    role: "Popularized population growth arguments that made exponential growth a public mathematical idea.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Thomas_Robert_Malthus",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Thomas_Malthus.jpg",
  },
  exponentialCurve: {
    name: "Exponential Curve",
    role: "The shared curve shape behind growth, decay, compounding, cooling, and first-order processes.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Exponential_function",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Exponential.svg",
  },
  unitCircleDiagram: {
    name: "Unit Circle",
    role: "A compact geometric model for sine, cosine, tangent, and angle measure.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Unit_circle",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Unit_circle_angles_color.svg/330px-Unit_circle_angles_color.svg.png",
  },
  pascal: {
    name: "Blaise Pascal",
    role: "Helped develop early probability theory and popularized Pascal's triangle.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Blaise_Pascal",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Blaise_Pascal_Versailles.JPG/330px-Blaise_Pascal_Versailles.JPG",
  },
  bernoulli: {
    name: "Jacob Bernoulli",
    role: "Connected repeated trials, probability, and the law of large numbers.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Jacob_Bernoulli",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Jakob_Bernoulli.jpg/330px-Jakob_Bernoulli.jpg",
  },
  pascalTriangle: {
    name: "Pascal's Triangle",
    role: "A compact arrangement of binomial coefficients used in counting outcomes.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Pascal%27s_triangle",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Pascal_triangle.svg/330px-Pascal_triangle.svg.png",
  },
  volumetricFlask: {
    name: "Volumetric Flask",
    role: "Precision glassware used to prepare solutions to a fixed calibrated volume.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Volumetric_flask",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Volumetric_flask.jpg/330px-Volumetric_flask.jpg",
  },
  pipette: {
    name: "Pipette",
    role: "Glassware used to transfer measured aliquots during dilution work.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Pipette",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Pipettes.jpg/330px-Pipettes.jpg",
  },
  burette: {
    name: "Burette",
    role: "Calibrated tube for controlled liquid delivery in analytical chemistry.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Burette",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Burette.jpg/330px-Burette.jpg",
  },
  lavoisier: {
    name: "Antoine Lavoisier",
    role: "Made conservation of mass central to quantitative chemistry.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Antoine_Lavoisier",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Antoine_lavoisier_color.jpg",
  },
  dalton: {
    name: "John Dalton",
    role: "Used atomic theory to make fixed combining ratios chemically meaningful.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/John_Dalton",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/John_Dalton_by_Charles_Turner.jpg",
  },
  avogadro: {
    name: "Amedeo Avogadro",
    role: "Connected equal gas volumes with equal particle counts, shaping mole-based chemistry.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Amedeo_Avogadro",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Amedeo_Avogadro.jpg",
  },
  ibnSahl: {
    name: "Ibn Sahl",
    role: "Derived an early mathematical refraction law for burning lenses around 984.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Ibn_Sahl_(mathematician)",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Ibn_Sahl_manuscript.jpg/330px-Ibn_Sahl_manuscript.jpg",
  },
  snellius: {
    name: "Willebrord Snellius",
    role: "Associated with the sine law of refraction in seventeenth-century optics.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Willebrord_Snellius",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Willebrord%20Snell%2C%20portrait.png",
  },
  dispersionPrism: {
    name: "Dispersion Prism",
    role: "Prisms made refraction visible by bending different wavelengths by different amounts.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Prism",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Dispersion_prism.jpg",
  },
  cameraObscura: {
    name: "Camera Obscura",
    role: "A dark chamber forms an inverted image, showing how ray geometry maps object points to image points.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Camera_obscura",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Camera_obscura2.jpg/330px-Camera_obscura2.jpg",
  },
  thermometer: {
    name: "Thermometer",
    role: "Temperature instruments made cooling curves experimentally visible and comparable.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Thermometer",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Clinical_thermometer_38.7.JPG",
  },
  coulomb: {
    name: "Charles-Augustin De Coulomb",
    role: "Measured inverse-square electrostatic force with a torsion balance.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Charles-Augustin_de_Coulomb",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Charles_de_Coulomb.png",
  },
  coulombsLawDiagram: {
    name: "Coulomb's Law Diagram",
    role: "The paired-charge model behind the inverse-square electrostatic force law.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Coulomb%27s_law",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/CoulombsLaw.svg",
  },
  faraday: {
    name: "Michael Faraday",
    role: "Made electric fields physically intuitive through lines of force.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Michael_Faraday",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Michael_Faraday_001.jpg",
  },
  ampere: {
    name: "Andre-Marie Ampere",
    role: "Turned current magnetism into a quantitative electrodynamic theory.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Andr%C3%A9-Marie_Amp%C3%A8re",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Ampere_Andre_1825.jpg/330px-Ampere_Andre_1825.jpg",
  },
  rightHandRule: {
    name: "Right-Hand Rule",
    role: "The standard orientation rule for magnetic field loops around a current-carrying wire.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Right-hand_rule",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Long-wire-right-hand-rule.svg/330px-Long-wire-right-hand-rule.svg.png",
  },
  leydenJar: {
    name: "Leyden Jar",
    role: "Early capacitor that stored separated electric charge in a glass vessel.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Leyden_jar",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/56/Leyden_jar.png",
  },
  capacitor: {
    name: "Capacitor",
    role: "Modern charge-storage component built from conductors separated by an insulator.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Capacitor",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Various_electrolytic_capacitors.jpg/330px-Various_electrolytic_capacitors.jpg",
  },
} satisfies Record<string, HistoryCard>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function HistoryBody({ body }: { body: HistorySpec["body"] }) {
  const paragraphs = Array.isArray(body) ? body : [body];
  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
  );
}

function n(value: number, digits = 2) {
  return value.toFixed(digits);
}

function roundedCanvasRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
}

function drawBackdrop(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#061018");
  gradient.addColorStop(0.56, "#081923");
  gradient.addColorStop(1, "#0b1020");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number) {
  drawBackdrop(context, width, height);
  context.strokeStyle = "rgba(127, 248, 255, 0.11)";
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 42) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 42) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawTiltedGrid(context: CanvasRenderingContext2D, width: number, height: number) {
  drawBackdrop(context, width, height);

  const cx = width / 2;
  const cy = height * 0.54;
  const planeWidth = width * 0.82;
  const planeHeight = Math.min(height * 0.78, 520);
  const cell = 42;

  context.save();
  context.translate(cx, cy);
  context.scale(1, 0.42);
  context.strokeStyle = "rgba(127, 248, 255, 0.14)";
  context.lineWidth = 1;
  context.shadowColor = "#7ff8ff";
  context.shadowBlur = 5;

  for (let x = -planeWidth; x <= planeWidth; x += cell) {
    const depthFade = 1 - Math.min(0.62, Math.abs(x) / planeWidth);
    context.globalAlpha = 0.3 + depthFade * 0.7;
    context.beginPath();
    context.moveTo(x, -planeHeight);
    context.lineTo(x, planeHeight);
    context.stroke();
  }
  for (let y = -planeHeight; y <= planeHeight; y += cell) {
    const depthFade = 1 - Math.min(0.7, Math.abs(y) / planeHeight);
    context.globalAlpha = 0.24 + depthFade * 0.76;
    context.beginPath();
    context.moveTo(-planeWidth, y);
    context.lineTo(planeWidth, y);
    context.stroke();
  }

  context.globalAlpha = 1;
  context.strokeStyle = "rgba(255, 77, 240, 0.2)";
  context.lineWidth = 2;
  context.strokeRect(-planeWidth, -planeHeight, planeWidth * 2, planeHeight * 2);
  context.restore();
}

function drawOrbitPlaneGrid(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  orbitRadius: number,
  tilt: number,
) {
  const planeRadius = orbitRadius * 1.42;
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "#7ff8ff";
  context.shadowBlur = 7;

  context.fillStyle = "rgba(7, 24, 32, 0.3)";
  context.beginPath();
  context.ellipse(cx, cy, planeRadius, planeRadius * tilt, 0, 0, TAU);
  context.fill();

  for (let ring = 0.25; ring <= 1; ring += 0.25) {
    const alpha = ring === 1 ? 0.26 : 0.12;
    context.strokeStyle = `rgba(127, 248, 255, ${alpha})`;
    context.lineWidth = ring === 1 ? 1.8 : 1;
    context.beginPath();
    context.ellipse(cx, cy, planeRadius * ring, planeRadius * ring * tilt, 0, 0, TAU);
    context.stroke();
  }

  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * TAU;
    const depth = Math.sin(angle);
    const alpha = 0.08 + Math.max(0, depth) * 0.1;
    context.strokeStyle = `rgba(127, 248, 255, ${alpha})`;
    context.lineWidth = i % 6 === 0 ? 1.4 : 0.85;
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + Math.cos(angle) * planeRadius, cy + depth * planeRadius * tilt);
    context.stroke();
  }

  context.shadowColor = "#ff4df0";
  context.shadowBlur = 10;
  context.setLineDash([7, 9]);
  context.strokeStyle = "rgba(255, 77, 240, 0.22)";
  context.lineWidth = 1.6;
  context.beginPath();
  context.moveTo(cx, cy - planeRadius * tilt);
  context.lineTo(cx, cy + planeRadius * tilt);
  context.stroke();
  context.setLineDash([]);

  context.strokeStyle = "rgba(244, 201, 93, 0.16)";
  context.beginPath();
  context.moveTo(cx - planeRadius, cy);
  context.lineTo(cx + planeRadius, cy);
  context.stroke();
  context.restore();
}

function drawArrow(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 4,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const strokeWidth = clamp(width * 0.62, 1.2, 3.1);
  const headLength = clamp(7 + strokeWidth * 2, 8.5, 13);
  const headAngle = 0.44;
  context.save();
  context.strokeStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 8;
  context.lineWidth = strokeWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.beginPath();
  context.moveTo(x2, y2);
  context.lineTo(x2 - Math.cos(angle - headAngle) * headLength, y2 - Math.sin(angle - headAngle) * headLength);
  context.moveTo(x2, y2);
  context.lineTo(x2 - Math.cos(angle + headAngle) * headLength, y2 - Math.sin(angle + headAngle) * headLength);
  context.stroke();
  context.restore();
}

function lorenzTrace(params: Params, frame: number) {
  const sigma = params.sigma;
  const rho = params.rho;
  const beta = params.beta;
  const steps = Math.max(220, Math.round(params.traceLength));
  const dt = 0.008;
  let x = 0.12 + Math.sin(frame * 0.006) * 0.015;
  let y = 1;
  let z = 1.05;
  const points: Array<{ x: number; y: number; z: number }> = [];

  for (let i = 0; i < steps; i += 1) {
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;
    if (i > 18) points.push({ x, y, z });
  }

  return points;
}

function drawSceneLabel(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  color = "#7ff8ff",
) {
  context.save();
  context.font = '760 10.5px "Proxima Nova", "Source Sans 3", sans-serif';
  const width = context.measureText(text).width + 12;
  const height = 22;
  const anchorX = clamp(targetX, x, x + width);
  const anchorY = clamp(targetY, y, y + height);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 3;
  context.lineWidth = 0.75;
  context.globalAlpha = 0.42;
  context.beginPath();
  context.moveTo(targetX, targetY);
  context.lineTo(anchorX, anchorY);
  context.stroke();
  context.globalAlpha = 0.66;
  context.beginPath();
  context.arc(targetX, targetY, 2, 0, TAU);
  context.fill();
  context.shadowBlur = 0;
  context.globalAlpha = 1;
  context.fillStyle = "rgba(4, 12, 18, 0.5)";
  context.strokeStyle = "rgba(127, 248, 255, 0.24)";
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(x, y, width, height, 4);
  context.fill();
  context.stroke();
  context.fillStyle = "rgba(233, 251, 255, 0.88)";
  context.fillText(text, x + 6, y + 15);
  context.restore();
}

function drawMicroScene(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  kind: MicroKind,
  params: Params,
  frame: number,
  viewMode: ViewMode,
  labelsVisible: boolean,
  valuesVisible: boolean,
) {
  if ((kind === "lorenz" || kind === "orbital" || kind === "capacitor") && viewMode === "3d") {
    drawTiltedGrid(context, width, height);
  }
  else if (kind === "circular" && viewMode === "3d") {
    drawBackdrop(context, width, height);
  }
  else drawGrid(context, width, height);
  const cx = width / 2;
  const cy = height / 2;
  context.globalCompositeOperation = "source-over";

  if (kind === "vector") {
    const state = vectorState(params);
    const maxX = Math.max(Math.abs(state.ax), Math.abs(state.bx), Math.abs(state.rx), 1);
    const maxY = Math.max(Math.abs(state.ay), Math.abs(state.by), Math.abs(state.ry), 1);
    const scale = Math.min(Math.min(width, height) * 0.055, (width * 0.42) / maxX, (height * 0.38) / maxY);
    const ax = state.ax * scale;
    const ay = -state.ay * scale;
    const bx = state.bx * scale;
    const by = -state.by * scale;
    const rx = state.rx * scale;
    const ry = -state.ry * scale;
    context.strokeStyle = "rgba(233, 251, 255, 0.2)";
    context.beginPath();
    context.moveTo(0, cy);
    context.lineTo(width, cy);
    context.moveTo(cx, 0);
    context.lineTo(cx, height);
    context.stroke();
    drawArrow(context, cx, cy, cx + ax, cy + ay, "#7ff8ff");
    drawArrow(context, cx, cy, cx + bx, cy + by, "#ff4df0");
    drawArrow(context, cx, cy, cx + rx, cy + ry, "#f4c95d", 5);
    context.strokeStyle = "rgba(244, 201, 93, 0.28)";
    context.setLineDash([7, 7]);
    context.strokeRect(cx + Math.min(0, ax), cy + Math.min(0, ay), Math.abs(ax), Math.abs(ay));
    context.setLineDash([]);
    if (labelsVisible) {
      drawSceneLabel(
        context,
        "Resultant",
        clamp(cx + rx + 18, 12, width - 118),
        clamp(cy + ry - 18, 28, height - 36),
        cx + rx,
        cy + ry,
        "#f4c95d",
      );
    }
    if (valuesVisible) {
      drawSceneLabel(
        context,
        `${format(state.mag, 2)} At ${format(state.angle, 0)}°`,
        clamp(cx + rx + 18, 12, width - 146),
        clamp(cy + ry + 18, 28, height - 36),
        cx + rx,
        cy + ry,
        "#a9ef78",
      );
    }
    return;
  }

  if (kind === "matrixtransform") {
    const state = matrixTransformState(params);
    const extrema = [
      state.a,
      state.b,
      state.a + state.b,
      state.c,
      state.d,
      state.c + state.d,
      state.x,
      state.y,
      state.tx,
      state.ty,
      1,
    ].map(Math.abs);
    const scale = Math.min((width * 0.38) / Math.max(...extrema), (height * 0.34) / Math.max(...extrema), Math.min(width, height) * 0.085);
    const px = (x: number) => cx + x * scale;
    const py = (y: number) => cy - y * scale;
    const transformed = (x: number, y: number) => ({ x: state.a * x + state.b * y, y: state.c * x + state.d * y });

    context.strokeStyle = "rgba(233, 251, 255, 0.18)";
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(0, cy);
    context.lineTo(width, cy);
    context.moveTo(cx, 0);
    context.lineTo(cx, height);
    context.stroke();

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.16)";
    context.lineWidth = 1;
    for (let i = -5; i <= 5; i += 1) {
      const a = transformed(i, -5);
      const b = transformed(i, 5);
      const c = transformed(-5, i);
      const d = transformed(5, i);
      context.beginPath();
      context.moveTo(px(a.x), py(a.y));
      context.lineTo(px(b.x), py(b.y));
      context.moveTo(px(c.x), py(c.y));
      context.lineTo(px(d.x), py(d.y));
      context.stroke();
    }
    context.restore();

    const square = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    context.setLineDash([6, 7]);
    context.strokeStyle = "rgba(233, 251, 255, 0.35)";
    context.beginPath();
    square.forEach((point, index) => {
      if (index === 0) context.moveTo(px(point.x), py(point.y));
      else context.lineTo(px(point.x), py(point.y));
    });
    context.closePath();
    context.stroke();
    context.setLineDash([]);

    const transformedSquare = square.map((point) => transformed(point.x, point.y));
    context.fillStyle = "rgba(244, 201, 93, 0.12)";
    context.strokeStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 12;
    context.beginPath();
    transformedSquare.forEach((point, index) => {
      if (index === 0) context.moveTo(px(point.x), py(point.y));
      else context.lineTo(px(point.x), py(point.y));
    });
    context.closePath();
    context.fill();
    context.stroke();
    context.shadowBlur = 0;

    drawArrow(context, cx, cy, px(state.a), py(state.c), "#7ff8ff", 3.2);
    drawArrow(context, cx, cy, px(state.b), py(state.d), "#ff4df0", 3.2);
    drawArrow(context, cx, cy, px(state.x), py(state.y), "rgba(233, 251, 255, 0.78)", 2.7);
    drawArrow(context, cx, cy, px(state.tx), py(state.ty), "#a9ef78", 4);
    if (labelsVisible) {
      drawSceneLabel(context, "Transformed Grid", clamp(px(state.a + state.b) + 12, 12, width - 138), clamp(py(state.c + state.d) - 24, 28, height - 36), px(state.a + state.b), py(state.c + state.d), "#f4c95d");
      drawSceneLabel(context, "Output Vector", clamp(px(state.tx) + 16, 12, width - 126), clamp(py(state.ty) - 14, 28, height - 36), px(state.tx), py(state.ty), "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `Det ${format(state.det, 2)}`, clamp(px(state.a + state.b) + 12, 12, width - 98), clamp(py(state.c + state.d) + 14, 28, height - 36), px(state.a + state.b), py(state.c + state.d), "#f4c95d");
      drawSceneLabel(context, `(${format(state.tx, 2)}, ${format(state.ty, 2)})`, clamp(px(state.tx) + 16, 12, width - 126), clamp(py(state.ty) + 20, 28, height - 36), px(state.tx), py(state.ty), "#a9ef78");
    }
    return;
  }

  if (kind === "dotproduct") {
    const state = dotProductState(params);
    const maxCoord = Math.max(Math.abs(state.ax), Math.abs(state.ay), Math.abs(state.bx), Math.abs(state.by), Math.abs(state.projX), Math.abs(state.projY), 1);
    const scale = Math.min((width * 0.38) / maxCoord, (height * 0.34) / maxCoord, Math.min(width, height) * 0.125);
    const px = (x: number) => cx + x * scale;
    const py = (y: number) => cy - y * scale;
    context.strokeStyle = "rgba(233, 251, 255, 0.18)";
    context.beginPath();
    context.moveTo(0, cy);
    context.lineTo(width, cy);
    context.moveTo(cx, 0);
    context.lineTo(cx, height);
    context.stroke();
    context.setLineDash([5, 6]);
    context.strokeStyle = "rgba(244, 201, 93, 0.46)";
    context.beginPath();
    context.moveTo(px(state.ax), py(state.ay));
    context.lineTo(px(state.projX), py(state.projY));
    context.stroke();
    context.setLineDash([]);
    drawArrow(context, cx, cy, px(state.ax), py(state.ay), "#7ff8ff", 3.8);
    drawArrow(context, cx, cy, px(state.bx), py(state.by), "#ff4df0", 3.8);
    drawArrow(context, cx, cy, px(state.projX), py(state.projY), "#f4c95d", 3.2);
    context.strokeStyle = "rgba(169, 239, 120, 0.45)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(cx, cy, 34, -Math.atan2(state.ay, state.ax), -Math.atan2(state.by, state.bx), state.theta > 180);
    context.stroke();
    if (labelsVisible) {
      drawSceneLabel(context, "Vector A", clamp(px(state.ax) + 14, 12, width - 94), clamp(py(state.ay) - 16, 28, height - 36), px(state.ax), py(state.ay), "#7ff8ff");
      drawSceneLabel(context, "Projection On B", clamp(px(state.projX) + 14, 12, width - 132), clamp(py(state.projY) + 18, 28, height - 36), px(state.projX), py(state.projY), "#f4c95d");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `Dot ${format(state.dot, 2)}`, clamp(cx + 42, 12, width - 96), clamp(cy - 42, 28, height - 36), cx + 30, cy - 18, "#a9ef78");
      drawSceneLabel(context, `${format(state.theta, 1)} deg`, clamp(cx + 32, 12, width - 92), clamp(cy + 24, 28, height - 36), cx + 26, cy + 8, "#a9ef78");
    }
    return;
  }

  if (kind === "linearsystem") {
    const state = linearSystemState(params);
    const range = Math.max(5, Math.abs(state.x) + 2, Math.abs(state.y) + 2, Math.abs(state.c1) + 1, Math.abs(state.c2) + 1);
    const scale = Math.min((width * 0.42) / range, (height * 0.38) / range);
    const px = (x: number) => cx + x * scale;
    const py = (y: number) => cy - y * scale;
    const linePoints = (a: number, b: number, c: number) => {
      const points: Array<{ x: number; y: number }> = [];
      const push = (x: number, y: number) => {
        if (Number.isFinite(x) && Number.isFinite(y) && x >= -range && x <= range && y >= -range && y <= range) {
          if (!points.some((point) => Math.hypot(point.x - x, point.y - y) < 0.001)) points.push({ x, y });
        }
      };
      if (Math.abs(b) > 1e-6) {
        push(-range, (c + a * range) / b);
        push(range, (c - a * range) / b);
      }
      if (Math.abs(a) > 1e-6) {
        push((c + b * range) / a, -range);
        push((c - b * range) / a, range);
      }
      return points.slice(0, 2);
    };
    context.strokeStyle = "rgba(233, 251, 255, 0.18)";
    context.beginPath();
    context.moveTo(0, cy);
    context.lineTo(width, cy);
    context.moveTo(cx, 0);
    context.lineTo(cx, height);
    context.stroke();
    [
      { points: linePoints(state.a1, state.b1, state.c1), color: "#7ff8ff" },
      { points: linePoints(state.a2, state.b2, state.c2), color: "#ff4df0" },
    ].forEach((line) => {
      if (line.points.length < 2) return;
      context.strokeStyle = line.color;
      context.shadowColor = line.color;
      context.shadowBlur = 12;
      context.lineWidth = 2.2;
      context.beginPath();
      context.moveTo(px(line.points[0].x), py(line.points[0].y));
      context.lineTo(px(line.points[1].x), py(line.points[1].y));
      context.stroke();
      context.shadowBlur = 0;
    });
    if (!state.parallel) {
      context.fillStyle = "#f4c95d";
      context.shadowColor = "#f4c95d";
      context.shadowBlur = 18;
      context.beginPath();
      context.arc(px(state.x), py(state.y), 5, 0, TAU);
      context.fill();
      context.shadowBlur = 0;
    }
    if (labelsVisible) {
      drawSceneLabel(context, "Equation 1", width * 0.12, height * 0.18, width * 0.28, height * 0.26, "#7ff8ff");
      drawSceneLabel(context, "Equation 2", width * 0.66, height * 0.72, width * 0.72, height * 0.62, "#ff4df0");
      if (!state.parallel) drawSceneLabel(context, "Solution", clamp(px(state.x) + 14, 12, width - 90), clamp(py(state.y) - 18, 28, height - 36), px(state.x), py(state.y), "#f4c95d");
    }
    if (valuesVisible) {
      const targetX = state.parallel ? cx : px(state.x);
      const targetY = state.parallel ? cy : py(state.y);
      drawSceneLabel(context, state.parallel ? "No Single Solution" : `(${format(state.x, 2)}, ${format(state.y, 2)})`, clamp(targetX + 14, 12, width - 142), clamp(targetY - 18, 28, height - 36), targetX, targetY, "#f4c95d");
      drawSceneLabel(context, `Det ${format(state.det, 2)}`, width * 0.62, height * 0.2, width * 0.52, height * 0.5, "#a9ef78");
    }
    return;
  }

  if (kind === "eigenvectors") {
    const state = eigenState(params);
    const scale = Math.min(width, height) * 0.17;
    const px = (x: number) => cx + x * scale;
    const py = (y: number) => cy - y * scale;
    context.strokeStyle = "rgba(233, 251, 255, 0.18)";
    context.beginPath();
    context.moveTo(0, cy);
    context.lineTo(width, cy);
    context.moveTo(cx, 0);
    context.lineTo(cx, height);
    context.stroke();
    context.strokeStyle = "rgba(127, 248, 255, 0.25)";
    context.lineWidth = 1.5;
    context.beginPath();
    for (let i = 0; i <= 120; i += 1) {
      const t = (i / 120) * TAU;
      const x = state.a * Math.cos(t) + state.b * Math.sin(t);
      const y = state.b * Math.cos(t) + state.d * Math.sin(t);
      if (i === 0) context.moveTo(px(x), py(y));
      else context.lineTo(px(x), py(y));
    }
    context.closePath();
    context.stroke();
    [
      { angle: state.eigAngle1, lambda: state.lambda1, color: "#f4c95d" },
      { angle: state.eigAngle2, lambda: state.lambda2, color: "#ff4df0" },
    ].forEach((axis) => {
      const length = clamp(Math.abs(axis.lambda), 0.8, 2.8);
      drawArrow(context, cx, cy, px(Math.cos(axis.angle) * length), py(Math.sin(axis.angle) * length), axis.color, 2.8);
      drawArrow(context, cx, cy, px(-Math.cos(axis.angle) * length), py(-Math.sin(axis.angle) * length), axis.color, 2.2);
    });
    drawArrow(context, cx, cy, px(state.x), py(state.y), "#7ff8ff", 3.5);
    drawArrow(context, cx, cy, px(state.tx), py(state.ty), "#a9ef78", 3.8);
    context.setLineDash([5, 7]);
    context.strokeStyle = "rgba(169, 239, 120, 0.38)";
    context.beginPath();
    context.moveTo(px(state.x), py(state.y));
    context.lineTo(px(state.tx), py(state.ty));
    context.stroke();
    context.setLineDash([]);
    if (labelsVisible) {
      drawSceneLabel(context, "Eigen Direction 1", clamp(px(Math.cos(state.eigAngle1) * 2) + 12, 12, width - 134), clamp(py(Math.sin(state.eigAngle1) * 2) - 20, 28, height - 36), px(Math.cos(state.eigAngle1) * 2), py(Math.sin(state.eigAngle1) * 2), "#f4c95d");
      drawSceneLabel(context, "Transformed Vector", clamp(px(state.tx) + 12, 12, width - 146), clamp(py(state.ty) + 18, 28, height - 36), px(state.tx), py(state.ty), "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `Lambda 1 ${format(state.lambda1, 2)}`, width * 0.65, height * 0.18, px(Math.cos(state.eigAngle1) * 2), py(Math.sin(state.eigAngle1) * 2), "#f4c95d");
      drawSceneLabel(context, `Alignment ${format((1 - state.aligned) * 100, 0)}%`, clamp(px(state.x) + 12, 12, width - 126), clamp(py(state.y) - 28, 28, height - 36), px(state.x), py(state.y), "#7ff8ff");
    }
    return;
  }

  if (kind === "spring") {
    const anchorX = width * 0.23;
    const baseMassX = width * 0.55 + params.displacement * 42;
    const massX =
      baseMassX + Math.sin(frame * 0.035 * Math.sqrt(params.k / params.mass)) * (36 / Math.max(0.55, params.damping));
    const massSize = 58 + params.mass * 8;
    const springEndX = massX;
    const y = cy;
    context.strokeStyle = "rgba(127, 248, 255, 0.56)";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(anchorX, y);
    for (let i = 0; i <= 18; i += 1) {
      const x = anchorX + ((springEndX - anchorX) * i) / 18;
      const off = i === 0 || i === 18 ? 0 : i % 2 ? -28 : 28;
      context.lineTo(x, y + off);
    }
    context.stroke();
    context.fillStyle = "rgba(4, 12, 18, 0.92)";
    context.fillRect(anchorX - 18, y - 105, 16, 210);
    context.strokeStyle = "#7ff8ff";
    context.strokeRect(anchorX - 18, y - 105, 16, 210);
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 24;
    context.fillStyle = "rgba(255, 77, 240, 0.28)";
    context.fillRect(massX, y - massSize / 2, massSize, massSize);
    context.strokeStyle = "#ff4df0";
    context.strokeRect(massX, y - massSize / 2, massSize, massSize);
    context.shadowBlur = 0;
    context.strokeStyle = "#7ff8ff";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(massX, y - Math.min(28, massSize * 0.36));
    context.lineTo(massX, y + Math.min(28, massSize * 0.36));
    context.stroke();
    drawArrow(context, massX + massSize + 22, y, massX + massSize + 22 - params.k * params.displacement * 12, y, "#f4c95d", 3);
    if (labelsVisible) {
      drawSceneLabel(context, "Restoring Force", massX + massSize - 10, y + 48, massX + massSize + 22, y, "#f4c95d");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(Math.abs(params.k * params.displacement), 2)} N`, massX + massSize - 2, y + 48, massX + massSize + 22, y, "#a9ef78");
      drawSceneLabel(context, `${format(0.5 * params.k * params.displacement ** 2, 2)} J`, massX + 8, y - massSize / 2 - 38, massX + massSize / 2, y - massSize / 2, "#ff4df0");
    }
    return;
  }

  if (kind === "projectile") {
    const state = projectileState(params);
    const startX = width * 0.12;
    const ground = height * 0.78;
    const ballRadiusPx = 9;
    const ballRadiusM = 0.34;
    const bounceCutoffHeight = 0.08;
    const scale = Math.min(
      (width * 0.48) / Math.max(state.firstRange, 1),
      (height * 0.44) / Math.max(state.maxHeight, 1),
      7.2,
    );
    const segments: Array<{ x0: number; vy: number; duration: number; timeStart: number }> = [];
    let x0 = 0;
    let vySegment = state.vy;
    let timeStart = 0;
    for (let bounce = 0; bounce < 10; bounce += 1) {
      const duration = (2 * vySegment) / state.g;
      segments.push({ x0, vy: vySegment, duration, timeStart });
      x0 += state.vx * duration;
      timeStart += duration;
      vySegment *= state.restitution;
      if ((vySegment * vySegment) / (2 * state.g) < bounceCutoffHeight) break;
    }
    const rollStartX = x0;
    const rollStartTime = timeStart;
    const visibleRollTime = Math.max(
      1.2,
      Math.min(state.rollStopTime, (width - startX) / Math.max(state.vx * scale, 1) + 1.2),
    );
    const cycleTime = rollStartTime + visibleRollTime + 0.8;
    const simTime = (frame * 0.045) % cycleTime;
    const activeFlight = segments.find((segment) =>
      simTime >= segment.timeStart && simTime < segment.timeStart + segment.duration,
    );
    const rollTime = Math.max(0, Math.min(simTime - rollStartTime, state.rollStopTime));
    const position = activeFlight
      ? (() => {
          const localTime = simTime - activeFlight.timeStart;
          return {
            x: activeFlight.x0 + state.vx * localTime,
            y: activeFlight.vy * localTime - 0.5 * state.g * localTime * localTime,
            rolling: false,
          };
        })()
      : {
          x: rollStartX + state.vx * rollTime - 0.5 * state.rollingDeceleration * rollTime * rollTime,
          y: 0,
          rolling: true,
        };
    context.strokeStyle = "rgba(127, 248, 255, 0.28)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, ground);
    context.lineTo(width, ground);
    context.stroke();

    segments.forEach((segment, segmentIndex) => {
      context.beginPath();
      for (let i = 0; i <= 80; i += 1) {
        const t = (i / 80) * segment.duration;
        const x = startX + (segment.x0 + state.vx * t) * scale;
        const y = ground - (segment.vy * t - 0.5 * state.g * t * t) * scale;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = segmentIndex === 0 ? "#7ff8ff" : `rgba(127, 248, 255, ${Math.max(0.16, 0.42 - segmentIndex * 0.045)})`;
      context.shadowColor = "#7ff8ff";
      context.shadowBlur = segmentIndex === 0 ? 18 : 8;
      context.lineWidth = segmentIndex === 0 ? 2.2 : 1.4;
      context.stroke();
    });

    context.shadowBlur = 0;
    context.setLineDash([6, 8]);
    context.strokeStyle = "rgba(169, 239, 120, 0.42)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(startX + rollStartX * scale, ground);
    context.lineTo(startX + (rollStartX + Math.min(state.rollStopDistance, (width - startX) / scale)) * scale, ground);
    context.stroke();
    context.setLineDash([]);

    context.strokeStyle = "#7ff8ff";
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 18;
    const px = startX + position.x * scale;
    const py = ground - position.y * scale;
    context.fillStyle = "#f4c95d";
    context.strokeStyle = "#ffe6a3";
    context.lineWidth = 2;
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(px, py - ballRadiusPx, ballRadiusPx, 0, TAU);
    context.fill();
    context.stroke();
    const travelledDistance = Math.max(0, position.x);
    const spin = travelledDistance / ballRadiusM;
    context.beginPath();
    context.moveTo(px, py - ballRadiusPx);
    context.lineTo(px + Math.cos(spin) * ballRadiusPx, py - ballRadiusPx + Math.sin(spin) * ballRadiusPx);
    context.stroke();
    context.shadowBlur = 0;
    drawArrow(context, startX, ground, startX + Math.cos(state.angle) * 92, ground - Math.sin(state.angle) * 92, "#ff4df0", 4);
    if (labelsVisible) {
      drawSceneLabel(context, "Ballistic Flight", clamp(startX + state.firstRange * scale * 0.28, 12, width - 132), clamp(ground - state.maxHeight * scale - 36, 28, height - 40), startX + state.firstRange * scale * 0.5, ground - state.maxHeight * scale, "#7ff8ff");
      drawSceneLabel(context, "Damped Bounces", clamp(startX + rollStartX * scale - 156, 12, width - 152), ground - 76, startX + Math.min(rollStartX, state.firstRange * (1 + state.restitution)) * scale, ground, "#f4c95d");
      drawSceneLabel(context, "Rolling Friction", clamp(startX + rollStartX * scale + 22, 12, width - 142), ground + 34, startX + rollStartX * scale + 78, ground, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.firstRange, 1)} m First Impact`, clamp(startX + state.firstRange * scale * 0.56, 12, width - 154), ground - 44, startX + state.firstRange * scale, ground, "#7ff8ff");
      drawSceneLabel(context, `${format(state.firstBounceHeight, 1)} m Bounce`, clamp(startX + state.firstRange * scale, 12, width - 136), clamp(ground - state.firstBounceHeight * scale - 46, 28, height - 40), startX + state.firstRange * scale * (1 + state.restitution * 0.5), ground - state.firstBounceHeight * scale, "#f4c95d");
      drawSceneLabel(context, `${format(state.rollStopDistance, 1)} m Roll`, clamp(startX + rollStartX * scale + 18, 12, width - 124), ground + 34, startX + rollStartX * scale + 78, ground, "#a9ef78");
    }
    return;
  }

  if (kind === "superposition") {
    const ampA = params.ampA;
    const ampB = params.ampB;
    const freqA = params.freqA;
    const freqB = params.freqB;
    const phase = degToRad(params.phase);
    const drawWave = (offset: number, color: string, fn: (x: number) => number) => {
      context.beginPath();
      for (let i = 0; i <= width; i += 3) {
        const y = offset + fn(i / width) * height * 0.09;
        if (i === 0) context.moveTo(i, y);
        else context.lineTo(i, y);
      }
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.stroke();
      context.shadowBlur = 0;
    };
    drawWave(height * 0.3, "#7ff8ff", (x) => ampA * Math.sin(TAU * freqA * x + frame * 0.035));
    drawWave(height * 0.5, "#ff4df0", (x) => ampB * Math.sin(TAU * freqB * x + frame * 0.035 + phase));
    drawWave(height * 0.72, "#f4c95d", (x) =>
      ampA * Math.sin(TAU * freqA * x + frame * 0.035) +
      ampB * Math.sin(TAU * freqB * x + frame * 0.035 + phase),
    );
    if (labelsVisible) {
      drawSceneLabel(context, "Sum Wave", width * 0.06, height * 0.68, width * 0.42, height * 0.72, "#f4c95d");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `Max ${format(ampA + ampB, 2)}`, width * 0.06, height * 0.68, width * 0.42, height * 0.72, "#a9ef78");
      drawSceneLabel(context, `Phase ${format(params.phase, 0)}°`, width * 0.72, height * 0.43, width * 0.66, height * 0.5, "#ff4df0");
    }
    return;
  }

  if (kind === "standingwave") {
    const state = standingWaveState(params);
    const left = width * 0.13;
    const right = width * 0.87;
    const stringY = cy;
    const stringW = right - left;
    const amplitudePx = height * 0.06 * state.amplitude;
    const phase = Math.cos((frame * 0.018 * params.animationRate) % TAU);
    const drawMode = (harmonic: number, color: string, alpha = 1, yOffset = 0) => {
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = color;
      context.lineWidth = alpha > 0.8 ? 3 : 1.6;
      context.shadowColor = color;
      context.shadowBlur = alpha > 0.8 ? 16 : 7;
      context.beginPath();
      for (let i = 0; i <= 180; i += 1) {
        const t = i / 180;
        const x = left + t * stringW;
        const y = stringY + yOffset - Math.sin(harmonic * Math.PI * t) * amplitudePx * phase;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.restore();
    };

    context.save();
    context.strokeStyle = "rgba(233, 251, 255, 0.18)";
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(left, stringY);
    context.lineTo(right, stringY);
    context.stroke();

    for (let i = 0; i <= state.harmonic; i += 1) {
      const x = left + (i / state.harmonic) * stringW;
      context.strokeStyle = "rgba(244, 201, 93, 0.38)";
      context.setLineDash([4, 8]);
      context.beginPath();
      context.moveTo(x, stringY - height * 0.23);
      context.lineTo(x, stringY + height * 0.23);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "#f4c95d";
      context.shadowColor = "#f4c95d";
      context.shadowBlur = 10;
      context.beginPath();
      context.arc(x, stringY, 4, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    for (let i = 0; i < state.harmonic; i += 1) {
      const x = left + ((i + 0.5) / state.harmonic) * stringW;
      context.fillStyle = "rgba(127, 248, 255, 0.13)";
      context.strokeStyle = "rgba(127, 248, 255, 0.28)";
      context.beginPath();
      context.ellipse(x, stringY, stringW / (state.harmonic * 2.3), Math.max(18, amplitudePx * 1.22), 0, 0, TAU);
      context.fill();
      context.stroke();
    }

    drawMode(Math.max(1, state.harmonic - 1), "rgba(255, 77, 240, 0.5)", 0.35, -height * 0.16);
    drawMode(state.harmonic, "#7ff8ff");
    drawMode(state.harmonic + 1, "rgba(169, 239, 120, 0.5)", 0.28, height * 0.16);

    context.fillStyle = "rgba(4, 12, 18, 0.72)";
    context.strokeStyle = "rgba(127, 248, 255, 0.32)";
    context.lineWidth = 2;
    roundedCanvasRect(context, left - 18, stringY - height * 0.3, 28, height * 0.6, 5);
    context.fill();
    context.stroke();
    roundedCanvasRect(context, right - 10, stringY - height * 0.3, 28, height * 0.6, 5);
    context.fill();
    context.stroke();

    const meterX = width * 0.1;
    const meterY = height * 0.72;
    const meterW = width * 0.3;
    const meterH = height * 0.11;
    context.fillStyle = "rgba(4, 12, 18, 0.54)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, meterX, meterY, meterW, meterH, 8);
    context.fill();
    context.stroke();
    context.fillStyle = "#7ff8ff";
    roundedCanvasRect(context, meterX + 14, meterY + 18, clamp(state.frequency / 900, 0.05, 1) * meterW * 0.82, 8, 4);
    context.fill();
    context.fillStyle = "#ff4df0";
    roundedCanvasRect(context, meterX + 14, meterY + 48, clamp(state.waveSpeed / 380, 0.05, 1) * meterW * 0.82, 8, 4);
    context.fill();

    if (labelsVisible) {
      drawSceneLabel(context, "Fixed End", left - 2, stringY - height * 0.35, left, stringY, "#f4c95d");
      drawSceneLabel(context, "Node Line", clamp(left + stringW / state.harmonic - 44, 12, width - 104), stringY + 30, left + stringW / state.harmonic, stringY, "#f4c95d");
      drawSceneLabel(context, "Antinode", clamp(left + stringW / (state.harmonic * 2) - 42, 12, width - 104), stringY - height * 0.26, left + stringW / (state.harmonic * 2), stringY - amplitudePx * phase, "#7ff8ff");
      drawSceneLabel(context, "Frequency Meter", meterX + meterW + 18, meterY + 14, meterX + meterW * 0.55, meterY + 24, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `n=${state.harmonic}`, left - 2, stringY - height * 0.35, left, stringY, "#f4c95d");
      drawSceneLabel(context, `${format(state.nodeSpacing, 2)} m`, clamp(left + stringW / state.harmonic - 42, 12, width - 96), stringY + 30, left + stringW / state.harmonic, stringY, "#f4c95d");
      drawSceneLabel(context, `${format(state.frequency, 1)} Hz`, clamp(left + stringW / (state.harmonic * 2) - 40, 12, width - 98), stringY - height * 0.26, left + stringW / (state.harmonic * 2), stringY - amplitudePx * phase, "#7ff8ff");
      drawSceneLabel(context, `${format(state.waveSpeed, 1)} m/s`, meterX + meterW + 18, meterY + 14, meterX + meterW * 0.55, meterY + 52, "#ff4df0");
    }
    context.restore();
    return;
  }

  if (kind === "doppler") {
    const sourceSpeed = params.sourceSpeed;
    const observerSpeed = params.observerSpeed;
    const waveSpeed = Math.max(1, params.waveSpeed);
    const frequency = params.frequency;
    const mach = Math.abs(sourceSpeed) / waveSpeed;
    const observed = frequency * ((waveSpeed + observerSpeed) / Math.max(1, waveSpeed - sourceSpeed));
    const centerY = cy;
    const sourceX = width * 0.42;
    const observerX = width * 0.74;
    const spacingAhead = clamp((waveSpeed - sourceSpeed) * 0.22, 18, 82);
    const spacingBehind = clamp((waveSpeed + sourceSpeed) * 0.22, 18, 104);
    const sourceTone = sourceSpeed >= 0 ? "#f4c95d" : "#ff4df0";
    const observedTone = observed >= frequency ? "#ff4df0" : "#7ff8ff";

    context.save();
    context.strokeStyle = "rgba(233, 251, 255, 0.16)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(width * 0.08, centerY);
    context.lineTo(width * 0.92, centerY);
    context.stroke();

    for (let i = 0; i < 9; i += 1) {
      const phase = (frame * 0.9 + i * 42) % 360;
      const aheadR = phase + i * spacingAhead;
      const behindR = phase + i * spacingBehind;
      context.strokeStyle = `rgba(127, 248, 255, ${0.36 - i * 0.025})`;
      context.lineWidth = 1.4;
      context.beginPath();
      context.arc(sourceX, centerY, aheadR, -0.86, 0.86);
      context.stroke();
      context.strokeStyle = `rgba(255, 77, 240, ${0.24 - i * 0.015})`;
      context.beginPath();
      context.arc(sourceX, centerY, behindR, Math.PI - 0.86, Math.PI + 0.86);
      context.stroke();
    }

    if (mach > 1) {
      const cone = Math.asin(1 / mach);
      context.strokeStyle = "rgba(255, 77, 240, 0.78)";
      context.lineWidth = 3;
      context.shadowColor = "#ff4df0";
      context.shadowBlur = 16;
      context.beginPath();
      context.moveTo(sourceX, centerY);
      context.lineTo(sourceX - Math.cos(cone) * width * 0.38, centerY - Math.sin(cone) * width * 0.38);
      context.moveTo(sourceX, centerY);
      context.lineTo(sourceX - Math.cos(cone) * width * 0.38, centerY + Math.sin(cone) * width * 0.38);
      context.stroke();
      context.shadowBlur = 0;
    }

    drawArrow(context, sourceX - 72, centerY - 70, sourceX + Math.sign(sourceSpeed || 1) * 72, centerY - 70, sourceTone, 3.4);
    drawArrow(context, observerX - 60, centerY + 72, observerX + Math.sign(observerSpeed || 1) * 60, centerY + 72, "#a9ef78", 3);

    context.fillStyle = "rgba(244, 201, 93, 0.84)";
    context.strokeStyle = sourceTone;
    context.lineWidth = 2.4;
    context.shadowColor = sourceTone;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(sourceX, centerY, 22, 0, TAU);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "#09131a";
    context.font = '900 13px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillText("SRC", sourceX - 13, centerY + 4);

    context.fillStyle = "rgba(127, 248, 255, 0.28)";
    context.strokeStyle = observedTone;
    context.shadowColor = observedTone;
    context.shadowBlur = 16;
    roundedCanvasRect(context, observerX - 20, centerY - 44, 40, 88, 9);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "#e9fbff";
    context.font = '900 12px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillText("OBS", observerX - 12, centerY + 4);

    const meterX = width * 0.12;
    const meterY = height * 0.68;
    const meterW = width * 0.2;
    const meterH = height * 0.12;
    context.fillStyle = "rgba(4, 12, 18, 0.54)";
    context.strokeStyle = "rgba(127, 248, 255, 0.2)";
    roundedCanvasRect(context, meterX, meterY, meterW, meterH, 8);
    context.fill();
    context.stroke();
    const baseW = clamp(frequency / 900, 0, 1) * meterW * 0.82;
    const obsW = clamp(observed / 1400, 0, 1) * meterW * 0.82;
    context.fillStyle = "#7ff8ff";
    roundedCanvasRect(context, meterX + 14, meterY + 20, baseW, 9, 4);
    context.fill();
    context.fillStyle = observedTone;
    roundedCanvasRect(context, meterX + 14, meterY + 50, obsW, 9, 4);
    context.fill();

    if (labelsVisible) {
      drawSceneLabel(context, "Moving Source", clamp(sourceX - 96, 12, width - 126), centerY - 120, sourceX, centerY, sourceTone);
      drawSceneLabel(context, "Compressed Front", clamp(sourceX + 54, 12, width - 150), centerY - 94, sourceX + spacingAhead * 2, centerY, "#7ff8ff");
      drawSceneLabel(context, "Observer", clamp(observerX + 28, 12, width - 92), centerY - 24, observerX, centerY, observedTone);
      drawSceneLabel(context, mach > 1 ? "Shock Cone" : "Stretched Wake", width * 0.18, height * 0.22, sourceX - spacingBehind * 2, centerY, "#ff4df0");
      drawSceneLabel(context, "Frequency Meter", meterX + meterW + 18, meterY + 14, meterX + meterW * 0.62, meterY + 50, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `f ${format(frequency, 0)} Hz`, clamp(sourceX - 84, 12, width - 96), centerY - 120, sourceX, centerY, sourceTone);
      drawSceneLabel(context, `f' ${format(observed, 0)} Hz`, clamp(observerX + 28, 12, width - 100), centerY - 24, observerX, centerY, observedTone);
      drawSceneLabel(context, `M ${format(mach, 2)}`, width * 0.18, height * 0.22, sourceX - spacingBehind * 2, centerY, "#ff4df0");
      drawSceneLabel(context, `λ_front ${format(spacingAhead / 18, 2)} m`, clamp(sourceX + 54, 12, width - 128), centerY - 94, sourceX + spacingAhead * 2, centerY, "#7ff8ff");
    }
    context.restore();
    return;
  }

  if (kind === "pendulum") {
    const length = height * (0.28 + params.length * 0.045);
    const cycleTime = (frame % 360) / 45;
    const decay = Math.exp(-params.damping * cycleTime);
    const theta = degToRad(params.angle) * decay * Math.cos(frame * 0.025 / Math.sqrt(params.length));
    const pivotX = cx;
    const pivotY = height * 0.18;
    const bobX = pivotX + Math.sin(theta) * length;
    const bobY = pivotY + Math.cos(theta) * length;
    context.strokeStyle = "rgba(244, 201, 93, 0.28)";
    context.beginPath();
    context.arc(pivotX, pivotY, length, Math.PI / 2 - degToRad(params.angle), Math.PI / 2 + degToRad(params.angle));
    context.stroke();
    context.strokeStyle = "#7ff8ff";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(pivotX, pivotY);
    context.lineTo(bobX, bobY);
    context.stroke();
    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 22;
    context.beginPath();
    context.arc(bobX, bobY, 24, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#e9fbff";
    context.beginPath();
    context.arc(pivotX, pivotY, 7, 0, TAU);
    context.fill();
    if (valuesVisible) {
      const period = TAU * Math.sqrt(params.length / params.gravity);
      const peakSpeed = Math.sqrt(2 * params.gravity * params.length * (1 - Math.cos(degToRad(params.angle))));
      drawSceneLabel(context, `${format(period, 2)} s`, clamp(pivotX - 112, 12, width - 92), pivotY + 22, pivotX, pivotY, "#7ff8ff");
      drawSceneLabel(context, `${format(peakSpeed, 2)} m/s`, clamp(bobX + 24, 12, width - 116), clamp(bobY - 12, 28, height - 40), bobX, bobY, "#f4c95d");
    }
    return;
  }

  if (kind === "ohm") {
    const voltage = params.voltage;
    const resistance = params.resistance;
    const current = voltage / resistance;
    const left = width * 0.19;
    const right = width * 0.81;
    const top = height * 0.27;
    const bottom = height * 0.73;
    const batteryX = left;
    const resistorX = right;
    const resistorTop = cy - 58;
    const resistorBottom = cy + 58;
    const wireColor = "#7ff8ff";

    const drawWirePath = () => {
      context.strokeStyle = "rgba(127, 248, 255, 0.66)";
      context.lineWidth = 5;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowColor = wireColor;
      context.shadowBlur = 12;
      context.beginPath();
      context.moveTo(batteryX, top);
      context.lineTo(right, top);
      context.lineTo(resistorX, resistorTop);
      context.moveTo(resistorX, resistorBottom);
      context.lineTo(right, bottom);
      context.lineTo(batteryX, bottom);
      context.stroke();
      context.shadowBlur = 0;
    };

    drawWirePath();

    context.strokeStyle = "#f4c95d";
    context.lineWidth = 4;
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 16;
    context.beginPath();
    context.moveTo(batteryX - 26, cy - 44);
    context.lineTo(batteryX + 26, cy - 44);
    context.moveTo(batteryX - 14, cy - 18);
    context.lineTo(batteryX + 14, cy - 18);
    context.moveTo(batteryX - 26, cy + 18);
    context.lineTo(batteryX + 26, cy + 18);
    context.moveTo(batteryX - 14, cy + 44);
    context.lineTo(batteryX + 14, cy + 44);
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "#f4c95d";
    context.font = '900 13px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillText("+", batteryX + 34, cy - 39);
    context.fillText("-", batteryX + 34, cy + 47);

    context.strokeStyle = "#ff4df0";
    context.lineWidth = 4;
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 16;
    context.beginPath();
    context.moveTo(resistorX, resistorTop);
    const segments = 8;
    for (let i = 1; i <= segments; i += 1) {
      const y = resistorTop + ((resistorBottom - resistorTop) * i) / segments;
      const x = resistorX + (i % 2 ? -26 : 26);
      context.lineTo(x, y);
    }
    context.lineTo(resistorX, resistorBottom);
    context.stroke();
    context.shadowBlur = 0;

    const chargeAt = (progress: number) => {
      const perimeter = 2 * ((right - left) + (bottom - top));
      let distance = progress * perimeter;
      const topLen = right - left;
      const sideLen = bottom - top;
      if (distance <= topLen) return { x: left + distance, y: top, angle: 0 };
      distance -= topLen;
      if (distance <= sideLen) return { x: right, y: top + distance, angle: Math.PI / 2 };
      distance -= sideLen;
      if (distance <= topLen) return { x: right - distance, y: bottom, angle: Math.PI };
      distance -= topLen;
      return { x: left, y: bottom - distance, angle: -Math.PI / 2 };
    };

    const chargeCount = 18;
    for (let i = 0; i < chargeCount; i += 1) {
      const p = (frame * 0.0045 * current * params.pulse + i / chargeCount) % 1;
      const point = chargeAt(p);
      const glow = 0.68 + Math.min(0.32, current / 10);
      context.fillStyle = `rgba(127, 248, 255, ${glow})`;
      context.shadowColor = "#7ff8ff";
      context.shadowBlur = 14;
      context.beginPath();
      context.arc(point.x, point.y, 5, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    const arrowPoint = chargeAt((frame * 0.0045 * current * params.pulse + 0.08) % 1);
    drawArrow(
      context,
      arrowPoint.x - Math.cos(arrowPoint.angle) * 18,
      arrowPoint.y - Math.sin(arrowPoint.angle) * 18,
      arrowPoint.x + Math.cos(arrowPoint.angle) * 18,
      arrowPoint.y + Math.sin(arrowPoint.angle) * 18,
      "#a9ef78",
      3,
    );

    if (labelsVisible) {
      drawSceneLabel(context, "Battery", batteryX - 18, cy + 66, batteryX, cy - 44, "#f4c95d");
      drawSceneLabel(context, "Resistor", resistorX - 122, cy - 12, resistorX, cy, "#ff4df0");
      drawSceneLabel(context, "Conventional Current", width * 0.38, top - 46, width * 0.48, top, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(voltage, 1)} V`, batteryX - 10, cy + 66, batteryX, cy - 44, "#f4c95d");
      drawSceneLabel(context, `${format(resistance, 1)} Ω`, resistorX - 116, cy - 12, resistorX, cy, "#ff4df0");
      drawSceneLabel(context, `${format(current, 2)} A`, width * 0.38, top - 46, width * 0.48, top, "#7ff8ff");
      drawSceneLabel(context, `${format(voltage ** 2 / resistance, 2)} W`, resistorX - 118, cy + 40, resistorX, resistorBottom, "#a9ef78");
    }
    return;
  }

  if (kind === "rc") {
    const state = rcState(params);
    const left = width * 0.16;
    const right = width * 0.82;
    const top = height * 0.24;
    const bottom = height * 0.72;
    const batteryX = left;
    const resistorStart = width * 0.39;
    const resistorEnd = width * 0.61;
    const capacitorX = right;
    const capTop = cy + 14;
    const capBottom = bottom;
    const wireColor = "#7ff8ff";
    const chargeTone = state.chargedFraction > 0.72 ? "#a9ef78" : "#7ff8ff";

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.6)";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = wireColor;
    context.shadowBlur = 13;
    context.beginPath();
    context.moveTo(batteryX, top);
    context.lineTo(resistorStart, top);
    context.moveTo(resistorEnd, top);
    context.lineTo(right, top);
    context.lineTo(right, capTop - 34);
    context.moveTo(right, capBottom + 34);
    context.lineTo(right, bottom);
    context.lineTo(batteryX, bottom);
    context.lineTo(batteryX, top);
    context.stroke();
    context.shadowBlur = 0;

    context.strokeStyle = "#f4c95d";
    context.lineWidth = 4;
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 16;
    context.beginPath();
    context.moveTo(batteryX - 28, cy - 52);
    context.lineTo(batteryX + 28, cy - 52);
    context.moveTo(batteryX - 15, cy - 22);
    context.lineTo(batteryX + 15, cy - 22);
    context.moveTo(batteryX - 28, cy + 22);
    context.lineTo(batteryX + 28, cy + 22);
    context.moveTo(batteryX - 15, cy + 52);
    context.lineTo(batteryX + 15, cy + 52);
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "#f4c95d";
    context.font = '900 13px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillText("+", batteryX + 35, cy - 47);
    context.fillText("-", batteryX + 35, cy + 58);

    context.strokeStyle = "#ff4df0";
    context.lineWidth = 4;
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 18;
    context.beginPath();
    context.moveTo(resistorStart, top);
    const segments = 9;
    for (let i = 1; i <= segments; i += 1) {
      const x = resistorStart + ((resistorEnd - resistorStart) * i) / segments;
      const y = top + (i % 2 ? -20 : 20);
      context.lineTo(x, y);
    }
    context.lineTo(resistorEnd, top);
    context.stroke();
    context.shadowBlur = 0;

    const capGap = 36;
    const plateWidth = 88;
    const plateChargeAlpha = 0.18 + state.chargedFraction * 0.62;
    context.lineWidth = 5;
    context.shadowColor = chargeTone;
    context.shadowBlur = 18 + state.chargedFraction * 16;
    context.strokeStyle = `rgba(127, 248, 255, ${plateChargeAlpha})`;
    context.beginPath();
    context.moveTo(capacitorX - plateWidth / 2, capTop - capGap);
    context.lineTo(capacitorX + plateWidth / 2, capTop - capGap);
    context.stroke();
    context.strokeStyle = `rgba(244, 201, 93, ${plateChargeAlpha})`;
    context.beginPath();
    context.moveTo(capacitorX - plateWidth / 2, capTop + capGap);
    context.lineTo(capacitorX + plateWidth / 2, capTop + capGap);
    context.stroke();
    context.shadowBlur = 0;

    const fieldLines = 7;
    for (let i = 0; i < fieldLines; i += 1) {
      const x = capacitorX - plateWidth * 0.36 + (i / (fieldLines - 1)) * plateWidth * 0.72;
      drawArrow(context, x, capTop - capGap + 10, x, capTop + capGap - 10, `rgba(127, 248, 255, ${0.18 + state.chargedFraction * 0.42})`, 1.8);
    }

    const chargeAt = (progress: number) => {
      const points = [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: capTop - capGap },
        { x: right, y: capTop + capGap },
        { x: right, y: bottom },
        { x: left, y: bottom },
        { x: left, y: top },
      ];
      const lengths = points.slice(0, -1).map((point, index) => Math.hypot(points[index + 1].x - point.x, points[index + 1].y - point.y));
      const total = lengths.reduce((sum, length) => sum + length, 0);
      let distance = progress * total;
      for (let i = 0; i < lengths.length; i += 1) {
        if (distance <= lengths[i]) {
          const start = points[i];
          const end = points[i + 1];
          const ratio = distance / lengths[i];
          return {
            x: start.x + (end.x - start.x) * ratio,
            y: start.y + (end.y - start.y) * ratio,
            angle: Math.atan2(end.y - start.y, end.x - start.x),
          };
        }
        distance -= lengths[i];
      }
      return { x: left, y: top, angle: 0 };
    };

    const motionScale = clamp(state.currentMa / Math.max(0.08, state.sourceVoltage / state.resistanceKohm), 0.1, 1);
    const chargeCount = 20;
    for (let i = 0; i < chargeCount; i += 1) {
      const p = (frame * 0.0032 * motionScale + i / chargeCount) % 1;
      const point = chargeAt(p);
      context.fillStyle = `rgba(127, 248, 255, ${0.22 + motionScale * 0.58})`;
      context.shadowColor = "#7ff8ff";
      context.shadowBlur = 10 + motionScale * 10;
      context.beginPath();
      context.arc(point.x, point.y, 4.5, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    const graphX = width * 0.18;
    const graphY = height * 0.46;
    const graphW = width * 0.34;
    const graphH = height * 0.2;
    context.fillStyle = "rgba(4, 12, 18, 0.48)";
    context.strokeStyle = "rgba(127, 248, 255, 0.18)";
    roundedCanvasRect(context, graphX, graphY, graphW, graphH, 8);
    context.fill();
    context.stroke();
    context.strokeStyle = "rgba(244, 201, 93, 0.22)";
    context.beginPath();
    const tauX = graphX + graphW * 0.2;
    context.moveTo(tauX, graphY + 10);
    context.lineTo(tauX, graphY + graphH - 12);
    context.stroke();
    context.strokeStyle = "#7ff8ff";
    context.lineWidth = 3;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 12;
    context.beginPath();
    for (let i = 0; i < 80; i += 1) {
      const ratio = i / 79;
      const x = graphX + 16 + ratio * (graphW - 32);
      const y = graphY + graphH - 18 - (1 - Math.exp(-ratio * 5)) * (graphH - 38);
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    context.shadowBlur = 0;
    const markerRatio = clamp(state.timeMs / Math.max(state.tauMs * 5, 1), 0, 1);
    const markerX = graphX + 16 + markerRatio * (graphW - 32);
    const markerY = graphY + graphH - 18 - state.chargedFraction * (graphH - 38);
    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 14;
    context.beginPath();
    context.arc(markerX, markerY, 5, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    if (labelsVisible) {
      drawSceneLabel(context, "Source", batteryX - 4, cy + 74, batteryX, cy - 52, "#f4c95d");
      drawSceneLabel(context, "Resistor", width * 0.42, top + 48, (resistorStart + resistorEnd) / 2, top, "#ff4df0");
      drawSceneLabel(context, "Charging Capacitor", width * 0.62, cy + 80, capacitorX, capTop, "#7ff8ff");
      drawSceneLabel(context, "Voltage Curve", graphX + graphW - 90, graphY - 24, markerX, markerY, "#a9ef78");
      drawSceneLabel(context, "Time Constant", graphX + graphW * 0.2 + 8, graphY + graphH + 20, tauX, graphY + graphH - 24, "#f4c95d");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.sourceVoltage, 1)} V`, batteryX - 4, cy + 74, batteryX, cy - 52, "#f4c95d");
      drawSceneLabel(context, `${format(state.resistanceKohm, 1)} kΩ`, width * 0.42, top + 48, (resistorStart + resistorEnd) / 2, top, "#ff4df0");
      drawSceneLabel(context, `${format(state.capacitorVoltage, 2)} V`, width * 0.62, cy + 80, capacitorX, capTop, "#7ff8ff");
      drawSceneLabel(context, `${format(state.tauMs, 1)} ms`, graphX + graphW * 0.2 + 8, graphY + graphH + 20, tauX, graphY + graphH - 24, "#f4c95d");
    }
    context.restore();
    return;
  }

  if (kind === "capacitor") {
    const epsilon0 = 8.854e-12;
    const areaM2 = params.plateArea / 10000;
    const spacingM = params.spacing / 1000;
    const capacitanceF = (epsilon0 * params.dielectric * areaM2) / spacingM;
    const chargeC = capacitanceF * params.voltage;
    const energyJ = 0.5 * capacitanceF * params.voltage ** 2;
    const fieldVm = params.voltage / spacingM;
    const sepPx = clamp(params.spacing * 10, 58, 190);
    const plateH = clamp(height * 0.34 + params.plateArea * 0.78, height * 0.34, height * 0.68);
    const plateW = 28;
    const skew = viewMode === "3d" ? -34 : 0;
    const leftX = cx - sepPx / 2 - plateW;
    const rightX = cx + sepPx / 2;
    const top = cy - plateH / 2;
    const dielectricAlpha = clamp(0.12 + params.dielectric * 0.045, 0.14, 0.58);
    const chargeCount = Math.round(clamp(6 + Math.log10(chargeC * 1e12 + 1) * 7, 8, 28));

    const platePath = (x: number) => {
      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x + plateW, top + skew);
      context.lineTo(x + plateW, top + plateH + skew);
      context.lineTo(x, top + plateH);
      context.closePath();
    };

    context.save();
    context.fillStyle = `rgba(127, 248, 255, ${dielectricAlpha})`;
    context.strokeStyle = "rgba(127, 248, 255, 0.28)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(leftX + plateW + 10, top + 18);
    context.lineTo(rightX - 10, top + skew + 18);
    context.lineTo(rightX - 10, top + plateH + skew - 18);
    context.lineTo(leftX + plateW + 10, top + plateH - 18);
    context.closePath();
    context.fill();
    context.stroke();

    for (let i = 0; i < 8; i += 1) {
      const y = top + plateH * (0.13 + i * 0.105);
      const drift = Math.sin(frame * 0.025 + i) * 6;
      drawArrow(
        context,
        leftX + plateW + 22,
        y + drift,
        rightX - 22,
        y + skew * 0.55 + drift,
        "rgba(127, 248, 255, 0.62)",
        2.4,
      );
    }

    context.shadowColor = "#f4c95d";
    context.shadowBlur = 18;
    context.fillStyle = "rgba(244, 201, 93, 0.9)";
    context.strokeStyle = "rgba(244, 201, 93, 0.85)";
    context.lineWidth = 2.4;
    platePath(leftX);
    context.fill();
    context.stroke();
    context.shadowColor = "#7ff8ff";
    context.fillStyle = "rgba(57, 191, 255, 0.72)";
    context.strokeStyle = "rgba(127, 248, 255, 0.82)";
    platePath(rightX);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;

    context.font = '900 22px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillStyle = "#09131a";
    context.fillText("+", leftX + 7, cy + 6);
    context.fillStyle = "#e9fbff";
    context.fillText("-", rightX + 9, cy + skew * 0.5 + 6);

    for (let i = 0; i < chargeCount; i += 1) {
      const f = chargeCount === 1 ? 0.5 : i / (chargeCount - 1);
      const y = top + plateH * (0.08 + f * 0.84);
      const pulse = 0.78 + Math.sin(frame * 0.04 + i * 0.7) * 0.22;
      context.fillStyle = `rgba(244, 201, 93, ${pulse})`;
      context.beginPath();
      context.arc(leftX - 8, y, 3.6, 0, TAU);
      context.fill();
      context.fillStyle = `rgba(127, 248, 255, ${pulse})`;
      context.beginPath();
      context.arc(rightX + plateW + 8, y + skew, 3.6, 0, TAU);
      context.fill();
    }

    const batteryX = width * 0.18;
    const batteryY = height * 0.72;
    context.strokeStyle = "rgba(244, 201, 93, 0.68)";
    context.lineWidth = 2.4;
    context.beginPath();
    context.moveTo(batteryX, batteryY - 24);
    context.lineTo(leftX, top + plateH);
    context.moveTo(batteryX, batteryY + 24);
    context.lineTo(rightX + plateW, top + plateH + skew);
    context.stroke();
    context.strokeStyle = "#f4c95d";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(batteryX - 28, batteryY - 24);
    context.lineTo(batteryX + 28, batteryY - 24);
    context.moveTo(batteryX - 16, batteryY + 24);
    context.lineTo(batteryX + 16, batteryY + 24);
    context.stroke();

    const meterX = width * 0.78;
    const meterY = height * 0.2;
    context.fillStyle = "rgba(4, 12, 18, 0.58)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, meterX, meterY, width * 0.13, height * 0.46, 8);
    context.fill();
    context.stroke();
    const maxBar = Math.max(capacitanceF * 1e12, chargeC * 1e9, energyJ * 1e9, 1);
    [
      { value: capacitanceF * 1e12, color: "#7ff8ff" },
      { value: chargeC * 1e9, color: "#f4c95d" },
      { value: energyJ * 1e9, color: "#ff4df0" },
    ].forEach((bar, index) => {
      const x = meterX + width * 0.026 + index * width * 0.032;
      const h = clamp(bar.value / maxBar, 0, 1) * height * 0.28;
      context.fillStyle = bar.color;
      roundedCanvasRect(context, x, meterY + height * 0.36 - h, 14, h, 4);
      context.fill();
    });

    if (labelsVisible) {
      drawSceneLabel(context, "Positive Plate", clamp(leftX - 118, 12, width - 126), top + 18, leftX, top + plateH * 0.28, "#f4c95d");
      drawSceneLabel(context, "Dielectric", clamp(cx - 56, 12, width - 108), top - 28, cx, cy, "#7ff8ff");
      drawSceneLabel(context, "Electric Field", clamp(cx + 22, 12, width - 122), cy - 62, cx + sepPx * 0.18, cy - 26, "#a9ef78");
      drawSceneLabel(context, "Energy Store", meterX - 78, meterY + 22, meterX + width * 0.07, meterY + height * 0.25, "#ff4df0");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(capacitanceF * 1e12, 2)} pF`, clamp(cx - 50, 12, width - 104), top - 28, cx, cy, "#7ff8ff");
      drawSceneLabel(context, `${format(chargeC * 1e9, 2)} nC`, clamp(leftX - 100, 12, width - 100), top + 18, leftX, top + plateH * 0.28, "#f4c95d");
      drawSceneLabel(context, `${format(fieldVm / 1000, 2)} kV/m`, clamp(cx + 22, 12, width - 120), cy - 62, cx + sepPx * 0.18, cy - 26, "#a9ef78");
      drawSceneLabel(context, `${format(energyJ * 1e9, 2)} nJ`, meterX - 78, meterY + 22, meterX + width * 0.07, meterY + height * 0.25, "#ff4df0");
    }
    context.restore();
    return;
  }

  if (kind === "coulomb") {
    const state = coulombState(params);
    const axisY = cy;
    const midX = cx;
    const pxPerCm = Math.min(34, width * 0.032);
    const halfSepPx = (state.separationCm * pxPerCm) / 2;
    const q1X = midX - halfSepPx;
    const q2X = midX + halfSepPx;
    const probeX = midX + state.probePositionCm * pxPerCm;
    const q1Tone = state.q1MicroC >= 0 ? "#ff4df0" : "#7ff8ff";
    const q2Tone = state.q2MicroC >= 0 ? "#ff4df0" : "#7ff8ff";
    const forceTone = state.forceSigned >= 0 ? "#ff4df0" : "#a9ef78";
    const probeTone = state.fieldAtProbe >= 0 ? "#f4c95d" : "#7ff8ff";
    const sameSign = state.q1MicroC * state.q2MicroC >= 0;
    const forceLength = clamp(34 + Math.log10(state.forceMagnitudeN * 1000000 + 1) * 14, 28, 100);

    context.save();
    context.strokeStyle = "rgba(233, 251, 255, 0.18)";
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(width * 0.1, axisY);
    context.lineTo(width * 0.9, axisY);
    context.stroke();

    for (let i = -3; i <= 3; i += 1) {
      const offset = i * 24;
      if (i === 0) continue;
      context.strokeStyle = `rgba(127, 248, 255, ${0.08 + Math.abs(i) * 0.012})`;
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(q1X, axisY);
      const c1x = q1X + (q2X - q1X) * 0.34;
      const c2x = q1X + (q2X - q1X) * 0.66;
      context.bezierCurveTo(c1x, axisY + offset * (sameSign ? 1.6 : 0.7), c2x, axisY + offset * (sameSign ? -1.6 : 0.7), q2X, axisY);
      context.stroke();
    }

    const chargeRadius = (charge: number) => 28 + Math.min(24, Math.abs(charge) * 3.2);
    const drawCharge = (x: number, charge: number, tone: string) => {
      const radius = chargeRadius(charge);
      context.fillStyle = charge >= 0 ? "rgba(255, 77, 240, 0.24)" : "rgba(127, 248, 255, 0.22)";
      context.strokeStyle = tone;
      context.shadowColor = tone;
      context.shadowBlur = 24;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(x, axisY, radius, 0, TAU);
      context.fill();
      context.stroke();
      context.shadowBlur = 0;
      context.fillStyle = "#e9fbff";
      context.font = '900 26px "Proxima Nova", "Source Sans 3", sans-serif';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(charge >= 0 ? "+" : "−", x, axisY);
    };

    drawCharge(q1X, state.q1MicroC, q1Tone);
    drawCharge(q2X, state.q2MicroC, q2Tone);

    const q1ForceDir = sameSign ? -1 : 1;
    const q2ForceDir = sameSign ? 1 : -1;
    drawArrow(context, q1X + q1ForceDir * 36, axisY - 58, q1X + q1ForceDir * (36 + forceLength), axisY - 58, forceTone, 3.4);
    drawArrow(context, q2X + q2ForceDir * 36, axisY - 58, q2X + q2ForceDir * (36 + forceLength), axisY - 58, forceTone, 3.4);

    context.strokeStyle = "rgba(244, 201, 93, 0.4)";
    context.setLineDash([7, 7]);
    context.beginPath();
    context.moveTo(q1X, axisY + 72);
    context.lineTo(q2X, axisY + 72);
    context.stroke();
    context.setLineDash([]);
    drawArrow(context, q1X, axisY + 72, q2X, axisY + 72, "#f4c95d", 2.2);

    context.fillStyle = probeTone;
    context.shadowColor = probeTone;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(probeX, axisY + 118, 8, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
    drawArrow(context, probeX, axisY + 118, probeX + Math.sign(state.fieldAtProbe || 1) * clamp(Math.abs(state.fieldAtProbe) / 35000, 26, 108), axisY + 118, probeTone, 3);

    if (labelsVisible) {
      drawSceneLabel(context, "Charge 1", q1X - 52, axisY + 38, q1X, axisY, q1Tone);
      drawSceneLabel(context, "Charge 2", q2X + 18, axisY + 38, q2X, axisY, q2Tone);
      drawSceneLabel(context, sameSign ? "Repulsive Force" : "Attractive Force", clamp(midX - 74, 12, width - 150), axisY - 104, midX, axisY - 58, forceTone);
      drawSceneLabel(context, "Probe Field", clamp(probeX + 20, 12, width - 112), axisY + 138, probeX, axisY + 118, probeTone);
      drawSceneLabel(context, "Separation", clamp(midX - 50, 12, width - 112), axisY + 92, midX, axisY + 72, "#f4c95d");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.q1MicroC, 1)} µC`, q1X - 52, axisY + 38, q1X, axisY, q1Tone);
      drawSceneLabel(context, `${format(state.q2MicroC, 1)} µC`, q2X + 18, axisY + 38, q2X, axisY, q2Tone);
      drawSceneLabel(context, `${format(state.forceMagnitudeN * 1000, 3)} mN`, clamp(midX - 54, 12, width - 116), axisY - 104, midX, axisY - 58, forceTone);
      drawSceneLabel(context, `${format(state.fieldAtProbe / 1000, 2)} kN/C`, clamp(probeX + 20, 12, width - 120), axisY + 138, probeX, axisY + 118, probeTone);
      drawSceneLabel(context, `${format(state.separationCm, 1)} cm`, clamp(midX - 42, 12, width - 94), axisY + 92, midX, axisY + 72, "#f4c95d");
    }
    context.restore();
    return;
  }

  if (kind === "gravityfield") {
    const state = gravityFieldState(params);
    const axisY = cy;
    const pxPerMm = Math.min(6.2, (width * 0.72) / Math.max(state.separationMm, 80));
    const q1X = cx - (state.separationMm * pxPerMm) / 2;
    const q2X = cx + (state.separationMm * pxPerMm) / 2;
    const probeX = clamp(cx + state.probePositionMm * pxPerMm, width * 0.08, width * 0.92);
    const baryX = cx + state.barycenterXMm * pxPerMm;
    const m1Tone = "#7ff8ff";
    const m2Tone = "#ff4df0";
    const fieldTone = state.fieldAtProbe >= 0 ? "#ff4df0" : "#7ff8ff";
    const forceLength = clamp(26 + Math.log10(state.forceN / 1e18 + 1) * 18, 26, 112);

    context.save();
    context.strokeStyle = "rgba(233, 251, 255, 0.15)";
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(width * 0.08, axisY);
    context.lineTo(width * 0.92, axisY);
    context.stroke();

    for (let i = -4; i <= 4; i += 1) {
      if (i === 0) continue;
      const offset = i * 22;
      context.strokeStyle = `rgba(127, 248, 255, ${0.06 + Math.abs(i) * 0.014})`;
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(q1X, axisY);
      context.bezierCurveTo(
        q1X + (q2X - q1X) * 0.25,
        axisY + offset * 1.45,
        q1X + (q2X - q1X) * 0.75,
        axisY + offset * 1.45,
        q2X,
        axisY,
      );
      context.stroke();
    }

    [q1X, q2X].forEach((x, index) => {
      const mass = index === 0 ? state.mass1Earth : state.mass2Earth;
      const tone = index === 0 ? m1Tone : m2Tone;
      const radius = clamp(24 + Math.sqrt(mass) * 12, 24, 66);
      const gradient = context.createRadialGradient(x - radius * 0.3, axisY - radius * 0.35, 4, x, axisY, radius);
      gradient.addColorStop(0, "rgba(233, 251, 255, 0.96)");
      gradient.addColorStop(0.42, index === 0 ? "rgba(127, 248, 255, 0.62)" : "rgba(255, 77, 240, 0.52)");
      gradient.addColorStop(1, "rgba(4, 12, 18, 0.82)");
      context.fillStyle = gradient;
      context.strokeStyle = tone;
      context.lineWidth = 2.6;
      context.shadowColor = tone;
      context.shadowBlur = 24;
      context.beginPath();
      context.arc(x, axisY, radius, 0, TAU);
      context.fill();
      context.stroke();
      context.shadowBlur = 0;
      for (let ring = 1; ring <= 3; ring += 1) {
        context.strokeStyle = `rgba(244, 201, 93, ${0.18 / ring})`;
        context.lineWidth = 1.2;
        context.beginPath();
        context.arc(x, axisY, radius + ring * 18 + Math.sin(frame * 0.02 + ring) * 1.6, 0, TAU);
        context.stroke();
      }
    });

    drawArrow(context, q1X + 42, axisY - 76, q1X + 42 + forceLength, axisY - 76, "#a9ef78", 3.2);
    drawArrow(context, q2X - 42, axisY - 76, q2X - 42 - forceLength, axisY - 76, "#a9ef78", 3.2);

    context.strokeStyle = "rgba(244, 201, 93, 0.38)";
    context.setLineDash([7, 7]);
    context.beginPath();
    context.moveTo(q1X, axisY + 82);
    context.lineTo(q2X, axisY + 82);
    context.stroke();
    context.setLineDash([]);
    drawArrow(context, q1X, axisY + 82, q2X, axisY + 82, "#f4c95d", 2.2);

    context.fillStyle = "rgba(244, 201, 93, 0.92)";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 16;
    context.beginPath();
    context.arc(baryX, axisY + 82, 7, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = "rgba(4, 12, 18, 0.72)";
    context.strokeStyle = "rgba(127, 248, 255, 0.25)";
    roundedCanvasRect(context, probeX - 33, axisY + 112, 66, 44, 8);
    context.fill();
    context.stroke();
    context.fillStyle = fieldTone;
    context.shadowColor = fieldTone;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(probeX, axisY + 134, 7, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
    drawArrow(context, probeX, axisY + 134, probeX + Math.sign(state.fieldAtProbe || 1) * clamp(Math.abs(state.fieldAtProbe) * 18, 24, 105), axisY + 134, fieldTone, 3);

    const wellX = width * 0.1;
    const wellY = height * 0.15;
    const wellW = width * 0.18;
    const wellH = height * 0.26;
    context.fillStyle = "rgba(4, 12, 18, 0.55)";
    context.strokeStyle = "rgba(127, 248, 255, 0.2)";
    roundedCanvasRect(context, wellX, wellY, wellW, wellH, 8);
    context.fill();
    context.stroke();
    context.strokeStyle = "rgba(255, 77, 240, 0.68)";
    context.lineWidth = 2.2;
    context.beginPath();
    for (let i = 0; i <= 70; i += 1) {
      const t = i / 70;
      const x = wellX + 18 + t * (wellW - 36);
      const dx1 = Math.max(0.08, Math.abs((x - wellX - wellW * 0.28) / wellW));
      const dx2 = Math.max(0.08, Math.abs((x - wellX - wellW * 0.72) / wellW));
      const potential = clamp((0.028 * state.mass1Earth) / dx1 + (0.028 * state.mass2Earth) / dx2, 0, 1);
      const y = wellY + 24 + potential * (wellH - 44);
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();

    if (labelsVisible) {
      drawSceneLabel(context, "Primary Mass", q1X - 60, axisY + 48, q1X, axisY, m1Tone);
      drawSceneLabel(context, "Secondary Mass", q2X + 22, axisY + 48, q2X, axisY, m2Tone);
      drawSceneLabel(context, "Mutual Attraction", clamp(cx - 78, 12, width - 154), axisY - 118, cx, axisY - 76, "#a9ef78");
      drawSceneLabel(context, "Barycenter", clamp(baryX + 18, 12, width - 110), axisY + 98, baryX, axisY + 82, "#f4c95d");
      drawSceneLabel(context, "Probe Field", clamp(probeX + 22, 12, width - 114), axisY + 158, probeX, axisY + 134, fieldTone);
      drawSceneLabel(context, "Potential Well", wellX + wellW - 56, wellY + 18, wellX + wellW * 0.54, wellY + wellH * 0.55, "#ff4df0");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.mass1Earth, 2)} M⊕`, q1X - 60, axisY + 48, q1X, axisY, m1Tone);
      drawSceneLabel(context, `${format(state.mass2Earth, 2)} M⊕`, q2X + 22, axisY + 48, q2X, axisY, m2Tone);
      drawSceneLabel(context, `${format(state.forceN / 1e20, 2)}e20 N`, clamp(cx - 64, 12, width - 132), axisY - 118, cx, axisY - 76, "#a9ef78");
      drawSceneLabel(context, `${format(state.barycenterXMm, 2)} Mm`, clamp(baryX + 18, 12, width - 106), axisY + 98, baryX, axisY + 82, "#f4c95d");
      drawSceneLabel(context, `${format(state.fieldAtProbe, 2)} m/s²`, clamp(probeX + 22, 12, width - 122), axisY + 158, probeX, axisY + 134, fieldTone);
    }
    context.restore();
    return;
  }

  if (kind === "wirefield") {
    const state = wireFieldState(params);
    const directionSign = state.current >= 0 ? 1 : -1;
    const probeRadiusPx = clamp(state.radiusM * 100 * 8.4, 58, Math.min(width, height) * 0.38);
    const wireRadiusPx = clamp(state.wireRadiusMm * 3.2, 14, 42);
    const probeAngle = degToRad(params.compassAngle);
    const probeX = cx + Math.cos(probeAngle) * probeRadiusPx;
    const probeY = cy + Math.sin(probeAngle) * probeRadiusPx;
    const tangentAngle = probeAngle + directionSign * Math.PI / 2;
    const compassAngle = tangentAngle + degToRad(clamp(state.compassDeflectionDeg, -82, 82)) * 0.28;
    const fieldTone = state.current >= 0 ? "#7ff8ff" : "#ff4df0";
    const strength = clamp(Math.abs(state.fieldMicroT) / 160, 0, 1);

    context.save();
    context.strokeStyle = "rgba(233, 251, 255, 0.16)";
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(width * 0.1, cy);
    context.lineTo(width * 0.9, cy);
    context.moveTo(cx, height * 0.12);
    context.lineTo(cx, height * 0.88);
    context.stroke();

    for (let i = 0; i < 7; i += 1) {
      const r = 52 + i * 36;
      const alpha = clamp(0.34 - i * 0.028 + strength * 0.16, 0.08, 0.56);
      context.strokeStyle = state.current >= 0 ? `rgba(127, 248, 255, ${alpha})` : `rgba(255, 77, 240, ${alpha})`;
      context.lineWidth = 1.7;
      context.beginPath();
      context.arc(cx, cy, r + Math.sin(frame * 0.025 + i) * 1.8, 0, TAU);
      context.stroke();
      const theta = frame * 0.018 * directionSign + i * 0.92;
      const ax = cx + Math.cos(theta) * r;
      const ay = cy + Math.sin(theta) * r;
      drawArrow(
        context,
        ax - Math.cos(theta + directionSign * Math.PI / 2) * 12,
        ay - Math.sin(theta + directionSign * Math.PI / 2) * 12,
        ax + Math.cos(theta + directionSign * Math.PI / 2) * 12,
        ay + Math.sin(theta + directionSign * Math.PI / 2) * 12,
        fieldTone,
        2.2,
      );
    }

    context.fillStyle = "rgba(4, 12, 18, 0.76)";
    context.strokeStyle = "rgba(244, 201, 93, 0.35)";
    context.setLineDash([7, 8]);
    context.beginPath();
    context.arc(cx, cy, probeRadiusPx, 0, TAU);
    context.stroke();
    context.setLineDash([]);

    const wireGradient = context.createRadialGradient(cx - 8, cy - 10, 4, cx, cy, wireRadiusPx);
    wireGradient.addColorStop(0, "rgba(233, 251, 255, 0.95)");
    wireGradient.addColorStop(0.45, "rgba(127, 248, 255, 0.55)");
    wireGradient.addColorStop(1, "rgba(255, 77, 240, 0.18)");
    context.fillStyle = wireGradient;
    context.strokeStyle = fieldTone;
    context.lineWidth = 2.8;
    context.shadowColor = fieldTone;
    context.shadowBlur = 20;
    context.beginPath();
    context.arc(cx, cy, wireRadiusPx, 0, TAU);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "#071017";
    context.font = '900 25px "Proxima Nova", "Source Sans 3", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(state.current >= 0 ? "•" : "×", cx, cy + 1);

    context.strokeStyle = "rgba(244, 201, 93, 0.45)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(probeX, probeY);
    context.stroke();

    context.fillStyle = "rgba(4, 12, 18, 0.78)";
    context.strokeStyle = "rgba(127, 248, 255, 0.34)";
    roundedCanvasRect(context, probeX - 42, probeY - 28, 84, 56, 8);
    context.fill();
    context.stroke();
    context.save();
    context.translate(probeX, probeY);
    context.rotate(compassAngle);
    drawArrow(context, -28, 0, 30, 0, "#a9ef78", 3.2);
    drawArrow(context, 26, 0, -24, 0, "#ff4df0", 2.6);
    context.restore();

    const meterX = width * 0.12;
    const meterY = height * 0.72;
    context.fillStyle = "rgba(4, 12, 18, 0.52)";
    context.strokeStyle = "rgba(127, 248, 255, 0.24)";
    roundedCanvasRect(context, meterX, meterY, width * 0.26, 46, 7);
    context.fill();
    context.stroke();
    context.fillStyle = "#7ff8ff";
    roundedCanvasRect(context, meterX + 18, meterY + 13, clamp(Math.abs(state.fieldMicroT) * 1.2, 8, width * 0.19), 8, 4);
    context.fill();
    context.fillStyle = "#ff4df0";
    roundedCanvasRect(context, meterX + 18, meterY + 28, clamp(Math.abs(state.compassDeflectionDeg) * 1.4, 8, width * 0.19), 8, 4);
    context.fill();

    if (labelsVisible) {
      drawSceneLabel(context, "Current-Carrying Wire", cx + wireRadiusPx + 18, cy - 38, cx, cy, fieldTone);
      drawSceneLabel(context, state.direction === "CCW" ? "Counterclockwise Field" : "Clockwise Field", width * 0.62, height * 0.18, cx + 120, cy - 120, fieldTone);
      drawSceneLabel(context, "Probe Radius", clamp((cx + probeX) / 2 - 36, 12, width - 112), clamp((cy + probeY) / 2 + 18, 28, height - 40), (cx + probeX) / 2, (cy + probeY) / 2, "#f4c95d");
      drawSceneLabel(context, "Compass Needle", clamp(probeX + 34, 12, width - 128), clamp(probeY + 26, 28, height - 40), probeX, probeY, "#a9ef78");
      drawSceneLabel(context, "Field Meter", meterX + width * 0.12, meterY - 28, meterX + 58, meterY + 20, "#7ff8ff");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.current, 1)} A`, cx + wireRadiusPx + 18, cy - 38, cx, cy, fieldTone);
      drawSceneLabel(context, `${format(Math.abs(state.fieldMicroT), 1)} µT`, width * 0.62, height * 0.18, cx + 120, cy - 120, "#7ff8ff");
      drawSceneLabel(context, `${format(params.probeRadius, 1)} cm`, clamp((cx + probeX) / 2 - 34, 12, width - 94), clamp((cy + probeY) / 2 + 18, 28, height - 40), (cx + probeX) / 2, (cy + probeY) / 2, "#f4c95d");
      drawSceneLabel(context, `${format(state.compassDeflectionDeg, 1)}°`, clamp(probeX + 34, 12, width - 86), clamp(probeY + 26, 28, height - 40), probeX, probeY, "#a9ef78");
      drawSceneLabel(context, `${format(state.energyDensity, 4)} J/m³`, meterX + width * 0.12, meterY - 28, meterX + 58, meterY + 20, "#ff4df0");
    }
    context.restore();
    return;
  }

  if (kind === "acidbase") {
    const state = acidBaseState(params);
    const beakerX = width * 0.34;
    const beakerY = height * 0.24;
    const beakerW = width * 0.32;
    const beakerH = height * 0.52;
    const liquidLevel = beakerY + beakerH * 0.25;
    const liquidHeight = beakerH * 0.66;
    const pHTone = state.pH < 6.6 ? "#ff6b8f" : state.pH > 7.4 ? "#7ff8ff" : "#a9ef78";
    const fillGradient = context.createLinearGradient(beakerX, liquidLevel, beakerX + beakerW, liquidLevel + liquidHeight);
    fillGradient.addColorStop(0, state.pH < 7 ? "rgba(255, 77, 240, 0.34)" : "rgba(127, 248, 255, 0.3)");
    fillGradient.addColorStop(1, `rgba(${state.pH < 7 ? "244, 201, 93" : "169, 239, 120"}, 0.24)`);

    context.strokeStyle = "rgba(127, 248, 255, 0.36)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(beakerX, beakerY);
    context.lineTo(beakerX + beakerW * 0.08, beakerY + beakerH);
    context.lineTo(beakerX + beakerW * 0.92, beakerY + beakerH);
    context.lineTo(beakerX + beakerW, beakerY);
    context.stroke();
    context.fillStyle = fillGradient;
    context.shadowColor = pHTone;
    context.shadowBlur = 18;
    roundedCanvasRect(context, beakerX + beakerW * 0.08, liquidLevel, beakerW * 0.84, liquidHeight, 8);
    context.fill();
    context.shadowBlur = 0;

    const swirl = frame * 0.025;
    for (let i = 0; i < 28; i += 1) {
      const mix = (i + 1) / 29;
      const x = beakerX + beakerW * (0.16 + ((i * 37) % 68) / 100);
      const y = liquidLevel + liquidHeight * (0.16 + ((i * 23) % 68) / 100);
      const isBase = i / 28 < state.neutralizedFraction;
      context.fillStyle = isBase ? "rgba(127, 248, 255, 0.78)" : "rgba(255, 77, 240, 0.72)";
      context.beginPath();
      context.arc(x + Math.sin(swirl + i) * 7 * mix, y + Math.cos(swirl * 0.8 + i) * 4, isBase ? 3.2 : 4.1, 0, TAU);
      context.fill();
    }

    const buretteX = beakerX + beakerW * 0.74;
    context.fillStyle = "rgba(4, 12, 18, 0.82)";
    context.strokeStyle = "#7ff8ff";
    context.lineWidth = 2;
    roundedCanvasRect(context, buretteX - 12, height * 0.08, 24, height * 0.29, 5);
    context.fill();
    context.stroke();
    context.fillStyle = "rgba(127, 248, 255, 0.34)";
    context.fillRect(buretteX - 8, height * 0.11, 16, height * 0.18);
    drawArrow(context, buretteX, height * 0.37, buretteX, liquidLevel + 18, "#7ff8ff", 3);

    const scaleX = width * 0.75;
    const scaleY = height * 0.18;
    const scaleH = height * 0.55;
    const pHY = scaleY + (1 - state.pH / 14) * scaleH;
    const scaleGradient = context.createLinearGradient(scaleX, scaleY, scaleX, scaleY + scaleH);
    scaleGradient.addColorStop(0, "rgba(127, 248, 255, 0.76)");
    scaleGradient.addColorStop(0.5, "rgba(169, 239, 120, 0.72)");
    scaleGradient.addColorStop(1, "rgba(255, 77, 240, 0.76)");
    context.fillStyle = scaleGradient;
    roundedCanvasRect(context, scaleX, scaleY, 18, scaleH, 8);
    context.fill();
    context.strokeStyle = "rgba(233, 251, 255, 0.48)";
    context.stroke();
    context.fillStyle = pHTone;
    context.shadowColor = pHTone;
    context.shadowBlur = 16;
    context.beginPath();
    context.arc(scaleX + 9, pHY, 8, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    context.strokeStyle = "rgba(244, 201, 93, 0.46)";
    context.setLineDash([6, 8]);
    const eqProgress = clamp(state.equivalenceVolumeMl / Math.max(params.baseAddedMl + 1, state.equivalenceVolumeMl), 0.12, 0.92);
    const eqX = beakerX + beakerW * eqProgress;
    context.beginPath();
    context.moveTo(eqX, beakerY + beakerH);
    context.lineTo(eqX, beakerY + beakerH + 24);
    context.stroke();
    context.setLineDash([]);

    if (labelsVisible) {
      drawSceneLabel(context, "Base Added", buretteX + 18, height * 0.15, buretteX, height * 0.26, "#7ff8ff");
      drawSceneLabel(context, "Mixed Solution", beakerX + 12, liquidLevel - 36, beakerX + beakerW * 0.45, liquidLevel + liquidHeight * 0.46, pHTone);
      drawSceneLabel(context, "pH Scale", scaleX - 92, scaleY + 12, scaleX + 9, pHY, "#a9ef78");
      drawSceneLabel(context, "Equivalence Volume", clamp(eqX - 82, 12, width - 150), beakerY + beakerH + 48, eqX, beakerY + beakerH + 18, "#f4c95d");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `pH ${format(state.pH, 2)}`, scaleX - 76, pHY - 14, scaleX + 9, pHY, pHTone);
      drawSceneLabel(context, `${format(state.equivalenceVolumeMl, 1)} mL Eq.`, clamp(eqX - 82, 12, width - 140), beakerY + beakerH + 48, eqX, beakerY + beakerH + 18, "#f4c95d");
      drawSceneLabel(context, `${format(Math.abs(state.excessMoles) * 1000, 2)} mmol Excess`, beakerX - 12, liquidLevel + 36, beakerX + beakerW * 0.26, liquidLevel + liquidHeight * 0.5, "#ff4df0");
    }
    return;
  }

  if (kind === "dilution") {
    const state = dilutionState(params);
    const flaskX = width * 0.43;
    const flaskY = height * 0.2;
    const flaskW = width * 0.24;
    const flaskH = height * 0.56;
    const neckW = flaskW * 0.24;
    const neckX = flaskX + flaskW * 0.5 - neckW / 2;
    const neckH = flaskH * 0.28;
    const bodyY = flaskY + neckH * 0.72;
    const bodyH = flaskH - neckH * 0.36;
    const liquidFill = clamp(state.finalVolumeMl / 250, 0.18, 1);
    const liquidY = bodyY + bodyH * (1 - liquidFill * 0.82);
    const liquidH = bodyY + bodyH * 0.9 - liquidY;
    const concentrationTone = state.finalMolarity > 0.5 ? "#ff4df0" : state.finalMolarity > 0.15 ? "#f4c95d" : "#7ff8ff";
    const stockX = width * 0.18;
    const stockY = height * 0.28;
    const stockW = width * 0.14;
    const stockH = height * 0.36;
    const pipetteX = width * 0.36;

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.42)";
    context.lineWidth = 2.5;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 12;
    roundedCanvasRect(context, stockX, stockY, stockW, stockH, 8);
    context.stroke();
    context.shadowBlur = 0;
    const stockGradient = context.createLinearGradient(stockX, stockY, stockX + stockW, stockY + stockH);
    stockGradient.addColorStop(0, "rgba(255, 77, 240, 0.42)");
    stockGradient.addColorStop(1, "rgba(244, 201, 93, 0.26)");
    context.fillStyle = stockGradient;
    roundedCanvasRect(context, stockX + 8, stockY + stockH * 0.28, stockW - 16, stockH * 0.64, 6);
    context.fill();

    context.strokeStyle = "#f4c95d";
    context.lineWidth = 4;
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 14;
    context.beginPath();
    context.moveTo(pipetteX, height * 0.16);
    context.lineTo(pipetteX, height * 0.56);
    context.stroke();
    context.fillStyle = "rgba(244, 201, 93, 0.22)";
    roundedCanvasRect(context, pipetteX - 9, height * 0.28, 18, height * 0.16, 8);
    context.fill();
    context.shadowBlur = 0;
    for (let i = 0; i < 4; i += 1) {
      const dropY = height * (0.52 + ((frame * 0.006 + i * 0.22) % 0.18));
      context.fillStyle = "rgba(244, 201, 93, 0.78)";
      context.shadowColor = "#f4c95d";
      context.shadowBlur = 9;
      context.beginPath();
      context.arc(pipetteX + Math.sin(frame * 0.04 + i) * 4, dropY, 4.2, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    context.strokeStyle = "rgba(127, 248, 255, 0.46)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(neckX, flaskY);
    context.lineTo(neckX, bodyY);
    context.quadraticCurveTo(flaskX, bodyY + bodyH * 0.18, flaskX + flaskW * 0.12, bodyY + bodyH * 0.72);
    context.quadraticCurveTo(flaskX + flaskW * 0.5, bodyY + bodyH, flaskX + flaskW * 0.88, bodyY + bodyH * 0.72);
    context.quadraticCurveTo(flaskX + flaskW, bodyY + bodyH * 0.18, neckX + neckW, bodyY);
    context.lineTo(neckX + neckW, flaskY);
    context.stroke();

    const dilutionGradient = context.createLinearGradient(flaskX, liquidY, flaskX + flaskW, liquidY + liquidH);
    dilutionGradient.addColorStop(0, `rgba(127, 248, 255, ${0.12 + state.finalMolarity * 0.16})`);
    dilutionGradient.addColorStop(0.62, `rgba(244, 201, 93, ${0.1 + state.finalMolarity * 0.12})`);
    dilutionGradient.addColorStop(1, `rgba(255, 77, 240, ${0.08 + state.finalMolarity * 0.1})`);
    context.fillStyle = dilutionGradient;
    context.shadowColor = concentrationTone;
    context.shadowBlur = 16;
    context.beginPath();
    context.ellipse(flaskX + flaskW / 2, liquidY + liquidH * 0.52, flaskW * 0.36, liquidH * 0.5, 0, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    const lineY = bodyY + bodyH * 0.24;
    context.strokeStyle = "rgba(169, 239, 120, 0.48)";
    context.setLineDash([6, 7]);
    context.beginPath();
    context.moveTo(flaskX + flaskW * 0.24, lineY);
    context.lineTo(flaskX + flaskW * 0.76, lineY);
    context.stroke();
    context.setLineDash([]);

    const panelX = width * 0.72;
    const panelY = height * 0.2;
    const panelW = width * 0.18;
    const panelH = height * 0.42;
    context.fillStyle = "rgba(4, 12, 18, 0.6)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, panelX, panelY, panelW, panelH, 8);
    context.fill();
    context.stroke();
    context.strokeStyle = concentrationTone;
    context.lineWidth = 3;
    context.shadowColor = concentrationTone;
    context.shadowBlur = 12;
    context.beginPath();
    for (let i = 0; i <= 80; i += 1) {
      const volume = 50 + (i / 80) * 200;
      const concentration = (state.stockMolarity * state.aliquotMl) / volume;
      const px = panelX + (i / 80) * panelW;
      const py = panelY + panelH - clamp(concentration / state.stockMolarity, 0, 1) * panelH * 0.84 - panelH * 0.08;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();
    context.shadowBlur = 0;

    if (labelsVisible) {
      drawSceneLabel(context, "Stock Solution", stockX - 6, stockY - 42, stockX + stockW * 0.5, stockY + stockH * 0.58, "#ff4df0");
      drawSceneLabel(context, "Measured Aliquot", pipetteX + 16, height * 0.22, pipetteX, height * 0.38, "#f4c95d");
      drawSceneLabel(context, "Diluted Flask", flaskX + flaskW * 0.54, flaskY + flaskH + 20, flaskX + flaskW * 0.5, liquidY + liquidH * 0.45, concentrationTone);
      drawSceneLabel(context, "Calibration Mark", flaskX + flaskW * 0.66, lineY - 44, flaskX + flaskW * 0.72, lineY, "#a9ef78");
      drawSceneLabel(context, "Dilution Curve", panelX - 44, panelY + 20, panelX + panelW * 0.52, panelY + panelH * 0.44, "#7ff8ff");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.stockMolarity, 2)} M`, stockX - 6, stockY - 42, stockX + stockW * 0.5, stockY + stockH * 0.58, "#ff4df0");
      drawSceneLabel(context, `${format(state.aliquotMl, 1)} mL`, pipetteX + 16, height * 0.22, pipetteX, height * 0.38, "#f4c95d");
      drawSceneLabel(context, `${format(state.finalMolarity, 3)} M`, flaskX + flaskW * 0.54, flaskY + flaskH + 20, flaskX + flaskW * 0.5, liquidY + liquidH * 0.45, concentrationTone);
      drawSceneLabel(context, `${format(state.dilutionFactor, 1)}x`, flaskX + flaskW * 0.66, lineY - 44, flaskX + flaskW * 0.72, lineY, "#a9ef78");
    }
    context.restore();
    return;
  }

  if (kind === "stoichiometry") {
    const state = stoichiometryState(params);
    const leftX = width * 0.17;
    const rightX = width * 0.33;
    const chamberX = width * 0.48;
    const chamberY = height * 0.22;
    const chamberW = width * 0.24;
    const chamberH = height * 0.48;
    const vesselY = height * 0.28;
    const vesselW = width * 0.12;
    const vesselH = height * 0.36;
    const productTone = state.limiting === "A" ? "#ff4df0" : state.limiting === "B" ? "#7ff8ff" : "#f4c95d";

    const drawVessel = (x: number, amount: number, maxAmount: number, color: string, label: string) => {
      const fill = clamp(amount / maxAmount, 0.04, 1);
      context.strokeStyle = color;
      context.fillStyle = "rgba(4, 12, 18, 0.56)";
      context.lineWidth = 2.4;
      context.shadowColor = color;
      context.shadowBlur = 12;
      roundedCanvasRect(context, x, vesselY, vesselW, vesselH, 8);
      context.fill();
      context.stroke();
      context.shadowBlur = 0;
      context.fillStyle = color.replace(")", ", 0.32)").replace("rgb", "rgba");
      roundedCanvasRect(context, x + 9, vesselY + vesselH * (1 - fill) + 9, vesselW - 18, vesselH * fill - 18, 6);
      context.fill();
      context.fillStyle = "#e9fbff";
      context.font = '900 13px "Proxima Nova", "Source Sans 3", sans-serif';
      context.fillText(label, x + vesselW * 0.43, vesselY + vesselH + 24);
      for (let i = 0; i < 18; i += 1) {
        const particleFill = i / 17 < fill;
        if (!particleFill) continue;
        const px = x + vesselW * (0.18 + ((i * 29) % 62) / 100);
        const py = vesselY + vesselH * (0.18 + ((i * 43) % 62) / 100);
        context.fillStyle = color;
        context.shadowColor = color;
        context.shadowBlur = 7;
        context.beginPath();
        context.arc(px + Math.sin(frame * 0.03 + i) * 4, py + Math.cos(frame * 0.025 + i) * 3, 3.2, 0, TAU);
        context.fill();
      }
      context.shadowBlur = 0;
    };

    context.save();
    drawVessel(leftX, state.molesA, 8, "rgb(255, 77, 240)", "A");
    drawVessel(rightX, state.molesB, 8, "rgb(127, 248, 255)", "B");

    context.strokeStyle = "rgba(127, 248, 255, 0.42)";
    context.fillStyle = "rgba(4, 12, 18, 0.5)";
    context.lineWidth = 3;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 12;
    roundedCanvasRect(context, chamberX, chamberY, chamberW, chamberH, 10);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;

    drawArrow(context, leftX + vesselW, vesselY + vesselH * 0.42, chamberX, chamberY + chamberH * 0.36, "#ff4df0", 3);
    drawArrow(context, rightX + vesselW, vesselY + vesselH * 0.58, chamberX, chamberY + chamberH * 0.58, "#7ff8ff", 3);

    const productCount = Math.round(clamp(state.productMoles * 5, 4, 44));
    for (let i = 0; i < productCount; i += 1) {
      const angle = (i / productCount) * TAU + frame * 0.01;
      const ring = 0.14 + ((i * 19) % 84) / 120;
      const px = chamberX + chamberW * 0.5 + Math.cos(angle) * chamberW * ring;
      const py = chamberY + chamberH * 0.5 + Math.sin(angle * 1.2) * chamberH * ring * 0.58;
      context.fillStyle = i % 2 ? "rgba(244, 201, 93, 0.86)" : "rgba(169, 239, 120, 0.76)";
      context.shadowColor = productTone;
      context.shadowBlur = 10;
      context.beginPath();
      context.arc(px, py, 4.4, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    const railX = width * 0.75;
    const railY = height * 0.22;
    const railW = width * 0.14;
    const railH = height * 0.48;
    context.fillStyle = "rgba(4, 12, 18, 0.56)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, railX, railY, railW, railH, 8);
    context.fill();
    context.stroke();
    const ratioA = state.molesA / Math.max(state.coeffA, 0.1);
    const ratioB = state.molesB / Math.max(state.coeffB, 0.1);
    const maxRatio = Math.max(ratioA, ratioB, 0.1);
    const barA = clamp(ratioA / maxRatio, 0, 1);
    const barB = clamp(ratioB / maxRatio, 0, 1);
    context.fillStyle = "rgba(255, 77, 240, 0.52)";
    roundedCanvasRect(context, railX + railW * 0.18, railY + railH * (1 - barA) + 16, railW * 0.2, railH * barA - 24, 4);
    context.fill();
    context.fillStyle = "rgba(127, 248, 255, 0.52)";
    roundedCanvasRect(context, railX + railW * 0.62, railY + railH * (1 - barB) + 16, railW * 0.2, railH * barB - 24, 4);
    context.fill();
    context.strokeStyle = productTone;
    context.setLineDash([6, 7]);
    const extentY = railY + railH - clamp(state.extent / maxRatio, 0, 1) * railH;
    context.beginPath();
    context.moveTo(railX + 12, extentY);
    context.lineTo(railX + railW - 12, extentY);
    context.stroke();
    context.setLineDash([]);

    if (labelsVisible) {
      drawSceneLabel(context, "Reactant A", leftX - 18, vesselY - 40, leftX + vesselW * 0.5, vesselY + vesselH * 0.52, "#ff4df0");
      drawSceneLabel(context, "Reactant B", rightX - 18, vesselY - 40, rightX + vesselW * 0.5, vesselY + vesselH * 0.52, "#7ff8ff");
      drawSceneLabel(context, "Product", chamberX + chamberW * 0.42, chamberY + chamberH + 26, chamberX + chamberW * 0.52, chamberY + chamberH * 0.5, "#f4c95d");
      drawSceneLabel(context, "Limiting Reactant", railX - 62, extentY - 8, railX + railW * (state.limiting === "A" ? 0.28 : 0.72), extentY, productTone);
      drawSceneLabel(context, "Reaction Extent", railX + railW * 0.24, railY - 40, railX + railW * 0.5, extentY, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.molesA, 2)} mol`, leftX - 18, vesselY - 40, leftX + vesselW * 0.5, vesselY + vesselH * 0.52, "#ff4df0");
      drawSceneLabel(context, `${format(state.molesB, 2)} mol`, rightX - 18, vesselY - 40, rightX + vesselW * 0.5, vesselY + vesselH * 0.52, "#7ff8ff");
      drawSceneLabel(context, `${format(state.productMoles, 2)} mol P`, chamberX + chamberW * 0.42, chamberY + chamberH + 26, chamberX + chamberW * 0.52, chamberY + chamberH * 0.5, "#f4c95d");
      drawSceneLabel(context, `${state.limiting}`, railX - 34, extentY - 8, railX + railW * (state.limiting === "A" ? 0.28 : 0.72), extentY, productTone);
      drawSceneLabel(context, `xi ${format(state.extent, 2)}`, railX + railW * 0.24, railY - 40, railX + railW * 0.5, extentY, "#a9ef78");
    }
    context.restore();
    return;
  }

  if (kind === "idealgas") {
    const state = idealGasState(params);
    const chamberX = width * 0.19;
    const chamberY = height * 0.27;
    const chamberW = width * 0.48;
    const chamberH = height * 0.38;
    const normalizedVolume = clamp((params.volumeL - 1) / 9, 0, 1);
    const pistonX = chamberX + chamberW * (0.26 + normalizedVolume * 0.7);
    const gasW = pistonX - chamberX;
    const pressureTone = state.pressureKpa > 700 ? "#ff4df0" : state.pressureKpa > 350 ? "#f4c95d" : "#7ff8ff";
    const heatTone = params.temperatureK > 420 ? "#ff4df0" : params.temperatureK < 260 ? "#7ff8ff" : "#a9ef78";

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.45)";
    context.lineWidth = 3;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 12;
    roundedCanvasRect(context, chamberX, chamberY, chamberW, chamberH, 8);
    context.stroke();
    context.shadowBlur = 0;

    const gasGradient = context.createLinearGradient(chamberX, chamberY, pistonX, chamberY + chamberH);
    gasGradient.addColorStop(0, "rgba(127, 248, 255, 0.2)");
    gasGradient.addColorStop(0.55, "rgba(169, 239, 120, 0.15)");
    gasGradient.addColorStop(1, "rgba(255, 77, 240, 0.18)");
    context.fillStyle = gasGradient;
    roundedCanvasRect(context, chamberX + 7, chamberY + 7, Math.max(10, gasW - 12), chamberH - 14, 6);
    context.fill();

    const particleCount = Math.round(18 + params.amountMol * 11);
    const pace = 0.012 + state.speedIndex * 0.012;
    for (let i = 0; i < particleCount; i += 1) {
      const seedA = (i * 47) % 101;
      const seedB = (i * 73) % 97;
      const phase = frame * pace + i * 1.73;
      const x = chamberX + 18 + ((seedA / 101) * Math.max(24, gasW - 44) + Math.sin(phase) * 10) % Math.max(28, gasW - 36);
      const y = chamberY + 24 + ((seedB / 97) * (chamberH - 52) + Math.cos(phase * 1.16) * 9) % Math.max(28, chamberH - 48);
      context.fillStyle = i % 3 === 0 ? "rgba(244, 201, 93, 0.78)" : i % 3 === 1 ? "rgba(127, 248, 255, 0.78)" : "rgba(255, 77, 240, 0.72)";
      context.shadowColor = context.fillStyle.toString();
      context.shadowBlur = 8 + state.speedIndex * 4;
      context.beginPath();
      context.arc(clamp(x, chamberX + 18, pistonX - 18), clamp(y, chamberY + 18, chamberY + chamberH - 18), 3.2, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    context.fillStyle = "rgba(4, 12, 18, 0.92)";
    context.strokeStyle = "#f4c95d";
    context.lineWidth = 3;
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 16;
    roundedCanvasRect(context, pistonX - 10, chamberY - 10, 20, chamberH + 20, 5);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(pistonX + 10, chamberY + chamberH / 2);
    context.lineTo(chamberX + chamberW + 64, chamberY + chamberH / 2);
    context.stroke();
    context.shadowBlur = 0;

    const gaugeX = width * 0.78;
    const gaugeY = height * 0.32;
    const gaugeR = Math.min(width, height) * 0.08;
    context.strokeStyle = "rgba(127, 248, 255, 0.5)";
    context.fillStyle = "rgba(4, 12, 18, 0.72)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(gaugeX, gaugeY, gaugeR, 0, TAU);
    context.fill();
    context.stroke();
    const needleAngle = Math.PI * (0.78 + clamp(state.pressureKpa / 1000, 0, 1) * 1.45);
    drawArrow(
      context,
      gaugeX,
      gaugeY,
      gaugeX + Math.cos(needleAngle) * gaugeR * 0.7,
      gaugeY + Math.sin(needleAngle) * gaugeR * 0.7,
      pressureTone,
      3,
    );
    context.fillStyle = "#e9fbff";
    context.font = '800 11px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillText("kPa", gaugeX - 10, gaugeY + gaugeR + 18);

    const bathX = chamberX + chamberW * 0.04;
    const bathY = chamberY + chamberH + 34;
    const bathW = chamberW * 0.74;
    context.strokeStyle = heatTone;
    context.fillStyle = params.temperatureK > 420 ? "rgba(255, 77, 240, 0.16)" : "rgba(127, 248, 255, 0.12)";
    context.shadowColor = heatTone;
    context.shadowBlur = 13;
    roundedCanvasRect(context, bathX, bathY, bathW, 18, 8);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    for (let i = 0; i < 9; i += 1) {
      const x = bathX + 16 + i * (bathW - 32) / 8;
      context.strokeStyle = heatTone;
      context.globalAlpha = 0.32 + Math.sin(frame * 0.04 + i) * 0.18;
      context.beginPath();
      context.moveTo(x, bathY + 25);
      context.bezierCurveTo(x - 8, bathY + 36, x + 9, bathY + 44, x, bathY + 56);
      context.stroke();
    }
    context.globalAlpha = 1;

    if (labelsVisible) {
      drawSceneLabel(context, "Gas Particles", chamberX + 18, chamberY - 44, chamberX + gasW * 0.52, chamberY + chamberH * 0.42, "#7ff8ff");
      drawSceneLabel(context, "Movable Piston", clamp(pistonX - 56, 12, width - 132), chamberY + chamberH + 24, pistonX, chamberY + chamberH * 0.52, "#f4c95d");
      drawSceneLabel(context, "Pressure Gauge", gaugeX - 54, gaugeY - gaugeR - 42, gaugeX, gaugeY, pressureTone);
      drawSceneLabel(context, "Heat Bath", bathX + bathW * 0.42, bathY + 62, bathX + bathW * 0.52, bathY + 9, heatTone);
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.pressureKpa, 0)} kPa`, gaugeX - 54, gaugeY - gaugeR - 42, gaugeX, gaugeY, pressureTone);
      drawSceneLabel(context, `${format(params.volumeL, 1)} L`, clamp(pistonX - 52, 12, width - 92), chamberY + chamberH + 24, pistonX, chamberY + chamberH * 0.52, "#f4c95d");
      drawSceneLabel(context, `${format(params.temperatureK, 0)} K`, bathX + bathW * 0.42, bathY + 62, bathX + bathW * 0.52, bathY + 9, heatTone);
    }
    context.restore();
    return;
  }

  if (kind === "kinetics") {
    const state = kineticsState(params);
    const reactorX = width * 0.25;
    const reactorY = height * 0.2;
    const reactorW = width * 0.36;
    const reactorH = height * 0.54;
    const liquidY = reactorY + reactorH * 0.24;
    const liquidH = reactorH * 0.68;
    const productTone = "#7ff8ff";
    const reactantTone = "#ff4df0";
    const halfLifeX = width * 0.74;
    const timelineY = height * 0.76;
    const progressX = width * (0.68 + state.timeFraction * 0.22);

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.42)";
    context.lineWidth = 3;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 12;
    context.beginPath();
    context.moveTo(reactorX, reactorY);
    context.lineTo(reactorX + reactorW * 0.08, reactorY + reactorH);
    context.lineTo(reactorX + reactorW * 0.92, reactorY + reactorH);
    context.lineTo(reactorX + reactorW, reactorY);
    context.stroke();
    context.shadowBlur = 0;

    const liquidGradient = context.createLinearGradient(reactorX, liquidY, reactorX + reactorW, liquidY + liquidH);
    liquidGradient.addColorStop(0, `rgba(255, 77, 240, ${0.14 + state.reactantFraction * 0.22})`);
    liquidGradient.addColorStop(0.52, "rgba(127, 248, 255, 0.13)");
    liquidGradient.addColorStop(1, `rgba(169, 239, 120, ${0.1 + state.completion * 0.24})`);
    context.fillStyle = liquidGradient;
    context.shadowColor = state.completion > 0.5 ? productTone : reactantTone;
    context.shadowBlur = 18;
    roundedCanvasRect(context, reactorX + reactorW * 0.08, liquidY, reactorW * 0.84, liquidH, 9);
    context.fill();
    context.shadowBlur = 0;

    for (let i = 0; i < 44; i += 1) {
      const threshold = i / 43;
      const isReactant = threshold < state.reactantFraction;
      const phase = frame * (isReactant ? 0.024 : 0.017) + i * 1.37;
      const x = reactorX + reactorW * (0.15 + ((i * 29) % 70) / 100);
      const y = liquidY + liquidH * (0.14 + ((i * 41) % 70) / 100);
      context.fillStyle = isReactant ? "rgba(255, 77, 240, 0.76)" : "rgba(127, 248, 255, 0.74)";
      context.shadowColor = isReactant ? reactantTone : productTone;
      context.shadowBlur = 8;
      context.beginPath();
      context.arc(x + Math.sin(phase) * 7, y + Math.cos(phase * 0.83) * 5, isReactant ? 4.2 : 3.4, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    context.strokeStyle = "rgba(233, 251, 255, 0.3)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(width * 0.66, timelineY);
    context.lineTo(width * 0.92, timelineY);
    context.stroke();
    context.strokeStyle = "rgba(244, 201, 93, 0.62)";
    context.setLineDash([6, 7]);
    context.beginPath();
    context.moveTo(halfLifeX, timelineY - 44);
    context.lineTo(halfLifeX, timelineY + 18);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 16;
    context.beginPath();
    context.arc(progressX, timelineY, 7, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    const decayX = width * 0.67;
    const decayY = height * 0.2;
    const decayW = width * 0.24;
    const decayH = height * 0.34;
    context.strokeStyle = "rgba(127, 248, 255, 0.18)";
    context.strokeRect(decayX, decayY, decayW, decayH);
    context.beginPath();
    for (let i = 0; i <= 90; i += 1) {
      const t = i / 90;
      const y = Math.exp(-params.rateConstant * state.maxTime * t);
      const px = decayX + t * decayW;
      const py = decayY + decayH - y * decayH;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.strokeStyle = reactantTone;
    context.lineWidth = 2.6;
    context.shadowColor = reactantTone;
    context.shadowBlur = 14;
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = productTone;
    context.beginPath();
    context.arc(decayX + state.timeFraction * decayW, decayY + decayH - state.reactantFraction * decayH, 6, 0, TAU);
    context.fill();

    if (labelsVisible) {
      drawSceneLabel(context, "Reactant Pool", reactorX + 10, liquidY - 40, reactorX + reactorW * 0.36, liquidY + liquidH * 0.45, reactantTone);
      drawSceneLabel(context, "Product Formed", clamp(reactorX + reactorW * 0.64, 12, width - 136), liquidY + liquidH + 24, reactorX + reactorW * 0.62, liquidY + liquidH * 0.54, productTone);
      drawSceneLabel(context, "Half-Life Marker", halfLifeX - 68, timelineY - 78, halfLifeX, timelineY - 18, "#f4c95d");
      drawSceneLabel(context, "Exponential Decay", decayX - 52, decayY + 18, decayX + decayW * 0.42, decayY + decayH * 0.48, reactantTone);
    }
    if (valuesVisible) {
      drawSceneLabel(context, `[A] ${format(state.reactant, 3)} M`, reactorX + 10, liquidY - 40, reactorX + reactorW * 0.36, liquidY + liquidH * 0.45, reactantTone);
      drawSceneLabel(context, `[P] ${format(state.product, 3)} M`, clamp(reactorX + reactorW * 0.64, 12, width - 126), liquidY + liquidH + 24, reactorX + reactorW * 0.62, liquidY + liquidH * 0.54, productTone);
      drawSceneLabel(context, `${format(state.halfLife, 2)} min`, halfLifeX - 68, timelineY - 78, halfLifeX, timelineY - 18, "#f4c95d");
    }
    context.restore();
    return;
  }

  if (kind === "regression") {
    const state = regressionState(params);
    const plotX = width * 0.15;
    const plotY = height * 0.18;
    const plotW = width * 0.7;
    const plotH = height * 0.62;
    const yValues = state.points.flatMap((point) => [point.y, point.yHat]);
    const yMinRaw = Math.min(...yValues, state.intercept);
    const yMaxRaw = Math.max(...yValues, state.intercept + state.slope * 10);
    const yPad = Math.max(1, (yMaxRaw - yMinRaw) * 0.16);
    const yMin = yMinRaw - yPad;
    const yMax = yMaxRaw + yPad;
    const toX = (x: number) => plotX + (x / 10) * plotW;
    const toY = (y: number) => plotY + plotH - ((y - yMin) / Math.max(0.001, yMax - yMin)) * plotH;

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.3)";
    context.fillStyle = "rgba(4, 12, 18, 0.34)";
    context.lineWidth = 2;
    roundedCanvasRect(context, plotX, plotY, plotW, plotH, 8);
    context.fill();
    context.stroke();

    context.strokeStyle = "rgba(127, 248, 255, 0.14)";
    context.lineWidth = 1;
    for (let i = 1; i < 5; i += 1) {
      const x = plotX + (plotW * i) / 5;
      const y = plotY + (plotH * i) / 5;
      context.beginPath();
      context.moveTo(x, plotY);
      context.lineTo(x, plotY + plotH);
      context.moveTo(plotX, y);
      context.lineTo(plotX + plotW, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(255, 77, 240, 0.42)";
    context.lineWidth = 1.4;
    state.points.forEach((point) => {
      const x = toX(point.x);
      context.beginPath();
      context.moveTo(x, toY(point.y));
      context.lineTo(x, toY(point.yHat));
      context.stroke();
    });

    context.strokeStyle = "#7ff8ff";
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 16;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(toX(0), toY(state.intercept));
    context.lineTo(toX(10), toY(state.intercept + state.slope * 10));
    context.stroke();

    context.shadowColor = "#f4c95d";
    context.shadowBlur = 13;
    state.points.forEach((point, index) => {
      const pulse = 1 + Math.sin(frame * 0.05 + index) * 0.16;
      context.fillStyle = index % 2 ? "rgba(244, 201, 93, 0.86)" : "rgba(169, 239, 120, 0.84)";
      context.beginPath();
      context.arc(toX(point.x), toY(point.y), 4.2 * pulse, 0, TAU);
      context.fill();
    });
    context.shadowBlur = 0;

    const meanX = toX(state.meanX);
    const meanY = toY(state.meanY);
    context.strokeStyle = "rgba(244, 201, 93, 0.34)";
    context.setLineDash([6, 8]);
    context.beginPath();
    context.moveTo(meanX, plotY);
    context.lineTo(meanX, plotY + plotH);
    context.moveTo(plotX, meanY);
    context.lineTo(plotX + plotW, meanY);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#ff4df0";
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 16;
    context.beginPath();
    context.arc(meanX, meanY, 6, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    if (labelsVisible) {
      drawSceneLabel(context, "Least-Squares Line", clamp(toX(7.5), 12, width - 154), clamp(toY(state.intercept + state.slope * 7.5) - 48, 28, height - 40), toX(7.5), toY(state.intercept + state.slope * 7.5), "#7ff8ff");
      drawSceneLabel(context, "Residuals", plotX + plotW * 0.1, plotY + 24, toX(state.points[2]?.x ?? 2), toY(state.points[2]?.yHat ?? state.meanY), "#ff4df0");
      drawSceneLabel(context, "Data Cloud", clamp(toX(state.points[Math.floor(state.points.length * 0.72)]?.x ?? 7), 12, width - 110), plotY + plotH + 22, toX(state.points[Math.floor(state.points.length * 0.72)]?.x ?? 7), toY(state.points[Math.floor(state.points.length * 0.72)]?.y ?? state.meanY), "#f4c95d");
      drawSceneLabel(context, "Mean Point", clamp(meanX + 14, 12, width - 112), clamp(meanY + 18, 28, height - 40), meanX, meanY, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `Slope ${format(state.slope, 2)}`, clamp(toX(7.5), 12, width - 112), clamp(toY(state.intercept + state.slope * 7.5) - 48, 28, height - 40), toX(7.5), toY(state.intercept + state.slope * 7.5), "#7ff8ff");
      drawSceneLabel(context, `R2 ${format(state.r2, 3)}`, clamp(meanX + 14, 12, width - 92), clamp(meanY + 18, 28, height - 40), meanX, meanY, "#a9ef78");
      drawSceneLabel(context, `RMSE ${format(state.rmse, 2)}`, plotX + plotW * 0.1, plotY + 24, toX(state.points[2]?.x ?? 2), toY(state.points[2]?.yHat ?? state.meanY), "#ff4df0");
    }
    context.restore();
    return;
  }

  if (kind === "incline") {
    const angle = degToRad(params.angle);
    const baseX = width * 0.18;
    const baseY = height * 0.74;
    const verticalRoom = baseY - height * 0.12;
    const rampLen = Math.min(width * 0.58, verticalRoom / Math.max(Math.sin(angle), 0.16));
    const topX = baseX + Math.cos(angle) * rampLen;
    const topY = baseY - Math.sin(angle) * rampLen;
    context.fillStyle = "rgba(127, 248, 255, 0.1)";
    context.strokeStyle = "rgba(127, 248, 255, 0.62)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(baseX, baseY);
    context.lineTo(topX, topY);
    context.lineTo(topX, baseY);
    context.closePath();
    context.fill();
    context.stroke();
    const blockSurfaceX = baseX + Math.cos(angle) * rampLen * 0.52;
    const blockSurfaceY = baseY - Math.sin(angle) * rampLen * 0.52;
    const blockWidth = 68;
    const blockHeight = 56;
    const normalX = -Math.sin(angle);
    const normalY = -Math.cos(angle);
    const blockX = blockSurfaceX + normalX * (blockHeight / 2);
    const blockY = blockSurfaceY + normalY * (blockHeight / 2);
    context.save();
    context.translate(blockX, blockY);
    context.rotate(-angle);
    context.fillStyle = "rgba(255, 77, 240, 0.26)";
    context.strokeStyle = "#ff4df0";
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 18;
    context.fillRect(-blockWidth / 2, -blockHeight / 2, blockWidth, blockHeight);
    context.strokeRect(-blockWidth / 2, -blockHeight / 2, blockWidth, blockHeight);
    context.restore();
    const frictionLength = 34 + params.friction * 88;
    drawArrow(context, blockX, blockY, blockX, blockY + 115, "#f4c95d", 4);
    drawArrow(context, blockX, blockY, blockX + normalX * 100, blockY + normalY * 100, "#7ff8ff", 4);
    drawArrow(context, blockX, blockY, blockX - Math.cos(angle) * 98, blockY + Math.sin(angle) * 98, "#ff4df0", 4);
    drawArrow(context, blockX, blockY, blockX + Math.cos(angle) * frictionLength, blockY - Math.sin(angle) * frictionLength, "#a9ef78", 4);
    if (valuesVisible) {
      const weight = params.mass * params.gravity;
      const normal = weight * Math.cos(angle);
      drawSceneLabel(context, `${format(normal, 1)} N`, clamp(blockX + normalX * 112 - 28, 12, width - 92), clamp(blockY + normalY * 112 - 4, 28, height - 40), blockX + normalX * 100, blockY + normalY * 100, "#7ff8ff");
      drawSceneLabel(context, `${format(weight * Math.sin(angle), 1)} N`, clamp(blockX - Math.cos(angle) * 112 - 22, 12, width - 92), clamp(blockY + Math.sin(angle) * 112, 28, height - 40), blockX - Math.cos(angle) * 98, blockY + Math.sin(angle) * 98, "#ff4df0");
    }
    return;
  }

  if (kind === "newton2") {
    const state = newtonSecondState(params);
    const trackX = width * 0.14;
    const trackY = height * 0.68;
    const trackW = width * 0.62;
    const cartW = 82 + state.mass * 5.8;
    const cartH = 58;
    const travel = clamp(state.displacement / 18, -1, 1) * trackW * 0.36;
    const cartX = trackX + trackW * 0.42 + travel - cartW / 2;
    const cartY = trackY - cartH;
    const centerX = cartX + cartW / 2;
    const centerY = cartY + cartH / 2;
    const forceScale = 9;
    const forceTone = state.netForce > 0.01 ? "#a9ef78" : state.netForce < -0.01 ? "#ff4df0" : "#f4c95d";

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.36)";
    context.lineWidth = 3;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 10;
    context.beginPath();
    context.moveTo(trackX, trackY);
    context.lineTo(trackX + trackW, trackY);
    context.stroke();
    context.shadowBlur = 0;
    for (let i = 0; i <= 10; i += 1) {
      const x = trackX + (i / 10) * trackW;
      context.strokeStyle = "rgba(127, 248, 255, 0.16)";
      context.beginPath();
      context.moveTo(x, trackY - 10);
      context.lineTo(x, trackY + 14);
      context.stroke();
    }

    context.strokeStyle = "rgba(244, 201, 93, 0.26)";
    context.setLineDash([6, 7]);
    context.beginPath();
    for (let i = 0; i < 7; i += 1) {
      const trailX = cartX - 18 - i * 26 * Math.sign(state.velocity || state.netForce || 1);
      context.moveTo(trailX, cartY + 18 + i % 2 * 18);
      context.lineTo(trailX - 14 * Math.sign(state.velocity || state.netForce || 1), cartY + 18 + i % 2 * 18);
    }
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "rgba(4, 12, 18, 0.88)";
    context.strokeStyle = "#7ff8ff";
    context.lineWidth = 2.5;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 15;
    roundedCanvasRect(context, cartX, cartY, cartW, cartH, 7);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "rgba(244, 201, 93, 0.82)";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 10;
    [cartX + cartW * 0.24, cartX + cartW * 0.76].forEach((wheelX) => {
      context.beginPath();
      context.arc(wheelX, trackY + 2, 11, 0, TAU);
      context.fill();
      context.strokeStyle = "rgba(233, 251, 255, 0.55)";
      context.stroke();
    });
    context.shadowBlur = 0;

    if (Math.abs(state.appliedForce) > 0.01) {
      const direction = Math.sign(state.appliedForce);
      drawArrow(context, centerX, centerY - 8, centerX + direction * Math.min(132, 36 + Math.abs(state.appliedForce) * forceScale), centerY - 8, "#7ff8ff", 4);
    }
    if (Math.abs(state.frictionForce) > 0.01) {
      const direction = Math.sign(state.frictionForce);
      drawArrow(context, centerX, centerY + 18, centerX + direction * Math.min(112, 28 + Math.abs(state.frictionForce) * forceScale), centerY + 18, "#ff4df0", 4);
    }
    if (Math.abs(state.netForce) > 0.01) {
      const direction = Math.sign(state.netForce);
      drawArrow(context, centerX, cartY - 22, centerX + direction * Math.min(124, 32 + Math.abs(state.acceleration) * 30), cartY - 22, forceTone, 4);
    }
    drawArrow(context, centerX, centerY, centerX, centerY + 62, "#f4c95d", 3);
    drawArrow(context, centerX + 24, centerY + 34, centerX + 24, centerY - 28, "#a9ef78", 3);

    const panelX = width * 0.78;
    const panelY = height * 0.21;
    const panelW = width * 0.14;
    const panelH = height * 0.42;
    context.fillStyle = "rgba(4, 12, 18, 0.56)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, panelX, panelY, panelW, panelH, 8);
    context.fill();
    context.stroke();
    const maxForce = Math.max(Math.abs(state.appliedForce), Math.abs(state.frictionForce), Math.abs(state.netForce), 1);
    const drawForceBar = (index: number, value: number, color: string) => {
      const midX = panelX + panelW * (0.26 + index * 0.24);
      const midY = panelY + panelH * 0.52;
      const h = clamp(Math.abs(value) / maxForce, 0, 1) * panelH * 0.36;
      context.fillStyle = color;
      roundedCanvasRect(context, midX - 8, value >= 0 ? midY - h : midY, 16, h, 4);
      context.fill();
    };
    context.strokeStyle = "rgba(233, 251, 255, 0.22)";
    context.beginPath();
    context.moveTo(panelX + 14, panelY + panelH * 0.52);
    context.lineTo(panelX + panelW - 14, panelY + panelH * 0.52);
    context.stroke();
    drawForceBar(0, state.appliedForce, "#7ff8ff");
    drawForceBar(1, state.frictionForce, "#ff4df0");
    drawForceBar(2, state.netForce, forceTone);

    if (labelsVisible) {
      drawSceneLabel(context, "Applied Force", clamp(centerX + Math.sign(state.appliedForce || 1) * 98, 12, width - 132), centerY - 42, centerX, centerY - 8, "#7ff8ff");
      drawSceneLabel(context, "Friction", clamp(centerX + Math.sign(state.frictionForce || -1) * 96, 12, width - 92), centerY + 36, centerX, centerY + 18, "#ff4df0");
      drawSceneLabel(context, "Acceleration", clamp(centerX + Math.sign(state.netForce || 1) * 80, 12, width - 126), cartY - 58, centerX, cartY - 22, forceTone);
      drawSceneLabel(context, "Weight And Normal", clamp(centerX + 42, 12, width - 146), centerY + 72, centerX + 12, centerY + 30, "#f4c95d");
      drawSceneLabel(context, "Force Balance", panelX - 50, panelY + 20, panelX + panelW * 0.5, panelY + panelH * 0.52, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.appliedForce, 1)} N`, clamp(centerX + Math.sign(state.appliedForce || 1) * 98, 12, width - 92), centerY - 42, centerX, centerY - 8, "#7ff8ff");
      drawSceneLabel(context, `${format(state.frictionForce, 1)} N`, clamp(centerX + Math.sign(state.frictionForce || -1) * 96, 12, width - 92), centerY + 36, centerX, centerY + 18, "#ff4df0");
      drawSceneLabel(context, `${format(state.acceleration, 2)} m/s2`, clamp(centerX + Math.sign(state.netForce || 1) * 80, 12, width - 134), cartY - 58, centerX, cartY - 22, forceTone);
      drawSceneLabel(context, `${format(state.displacement, 2)} m`, clamp(centerX - 48, 12, width - 100), trackY + 34, centerX, trackY, "#f4c95d");
      drawSceneLabel(context, `${format(state.netForce, 1)} N`, panelX - 38, panelY + 20, panelX + panelW * 0.5, panelY + panelH * 0.52, "#a9ef78");
    }
    context.restore();
    return;
  }

  if (kind === "workenergy") {
    const state = workEnergyState(params);
    const trackX = width * 0.15;
    const trackY = height * 0.66;
    const trackW = width * 0.6;
    const blockW = 74 + state.mass * 4.8;
    const blockH = 54;
    const progress = clamp(state.displacement / 20, 0, 1);
    const pulse = 0.92 + Math.sin(frame * 0.045) * 0.08;
    const blockX = trackX + trackW * (0.16 + progress * 0.62) - blockW / 2;
    const blockY = trackY - blockH;
    const centerX = blockX + blockW / 2;
    const centerY = blockY + blockH / 2;
    const forceAngle = degToRad(state.forceAngleDeg);
    const forceLength = Math.min(132, 44 + Math.abs(state.force) * 2.6);
    const forceEnd = {
      x: centerX + Math.cos(forceAngle) * forceLength,
      y: centerY - Math.sin(forceAngle) * forceLength,
    };
    const barX = width * 0.78;
    const barY = height * 0.2;
    const barW = width * 0.14;
    const barH = height * 0.46;
    const maxEnergy = Math.max(state.initialKineticJ, state.finalKineticJ, Math.abs(state.appliedWorkJ), Math.abs(state.frictionWorkJ), 1);

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.36)";
    context.lineWidth = 3;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 10;
    context.beginPath();
    context.moveTo(trackX, trackY);
    context.lineTo(trackX + trackW, trackY);
    context.stroke();
    context.shadowBlur = 0;
    for (let i = 0; i <= 12; i += 1) {
      const x = trackX + (i / 12) * trackW;
      context.strokeStyle = "rgba(127, 248, 255, 0.14)";
      context.beginPath();
      context.moveTo(x, trackY - 9);
      context.lineTo(x, trackY + 13);
      context.stroke();
    }

    context.strokeStyle = "rgba(244, 201, 93, 0.52)";
    context.lineWidth = 2.4;
    context.setLineDash([7, 7]);
    context.beginPath();
    context.moveTo(trackX + trackW * 0.16, trackY + 36);
    context.lineTo(trackX + trackW * (0.16 + progress * 0.62), trackY + 36);
    context.stroke();
    context.setLineDash([]);
    drawArrow(context, trackX + trackW * 0.16, trackY + 36, trackX + trackW * (0.16 + progress * 0.62), trackY + 36, "#f4c95d", 2.5);

    context.fillStyle = "rgba(4, 12, 18, 0.88)";
    context.strokeStyle = "#7ff8ff";
    context.lineWidth = 2.6;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 14;
    roundedCanvasRect(context, blockX, blockY, blockW, blockH, 7);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "rgba(244, 201, 93, 0.82)";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 10;
    [blockX + blockW * 0.24, blockX + blockW * 0.76].forEach((wheelX) => {
      context.beginPath();
      context.arc(wheelX, trackY + 2, 10 * pulse, 0, TAU);
      context.fill();
    });
    context.shadowBlur = 0;

    drawArrow(context, centerX, centerY, forceEnd.x, forceEnd.y, "#7ff8ff", 4);
    drawArrow(context, centerX, centerY + 18, centerX - Math.min(110, 32 + state.frictionMagnitudeN * 4), centerY + 18, "#ff4df0", 3.5);
    drawArrow(context, centerX, centerY - 4, centerX + Math.min(126, 34 + state.finalSpeed * 18), centerY - 4, "#a9ef78", 3.5);

    context.fillStyle = "rgba(4, 12, 18, 0.56)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, barX, barY, barW, barH, 8);
    context.fill();
    context.stroke();
    const drawEnergyBar = (index: number, value: number, color: string) => {
      const x = barX + barW * (0.16 + index * 0.21);
      const midY = barY + barH * 0.64;
      const h = clamp(Math.abs(value) / maxEnergy, 0, 1) * barH * 0.42;
      context.fillStyle = color;
      roundedCanvasRect(context, x, value >= 0 ? midY - h : midY, barW * 0.12, h, 4);
      context.fill();
    };
    context.strokeStyle = "rgba(233, 251, 255, 0.22)";
    context.beginPath();
    context.moveTo(barX + 12, barY + barH * 0.64);
    context.lineTo(barX + barW - 12, barY + barH * 0.64);
    context.stroke();
    drawEnergyBar(0, state.initialKineticJ, "#7ff8ff");
    drawEnergyBar(1, state.appliedWorkJ, "#a9ef78");
    drawEnergyBar(2, state.frictionWorkJ, "#ff4df0");
    drawEnergyBar(3, state.finalKineticJ, "#f4c95d");

    if (labelsVisible) {
      drawSceneLabel(context, "Applied Force", clamp(forceEnd.x + 12, 12, width - 128), clamp(forceEnd.y - 14, 28, height - 40), forceEnd.x, forceEnd.y, "#7ff8ff");
      drawSceneLabel(context, "Displacement", clamp(trackX + trackW * 0.34, 12, width - 118), trackY + 62, trackX + trackW * (0.16 + progress * 0.62), trackY + 36, "#f4c95d");
      drawSceneLabel(context, "Kinetic Energy", clamp(centerX + 46, 12, width - 138), centerY - 48, centerX + 46, centerY - 4, "#a9ef78");
      drawSceneLabel(context, "Friction Loss", clamp(centerX - 128, 12, width - 118), centerY + 44, centerX - 44, centerY + 18, "#ff4df0");
      drawSceneLabel(context, "Energy Ledger", barX - 62, barY + 22, barX + barW * 0.52, barY + barH * 0.5, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.appliedWorkJ, 1)} J`, clamp(forceEnd.x + 12, 12, width - 94), clamp(forceEnd.y - 14, 28, height - 40), forceEnd.x, forceEnd.y, "#7ff8ff");
      drawSceneLabel(context, `${format(state.displacement, 1)} m`, clamp(trackX + trackW * 0.34, 12, width - 96), trackY + 62, trackX + trackW * (0.16 + progress * 0.62), trackY + 36, "#f4c95d");
      drawSceneLabel(context, `${format(state.finalKineticJ, 1)} J`, clamp(centerX + 46, 12, width - 96), centerY - 48, centerX + 46, centerY - 4, "#a9ef78");
      drawSceneLabel(context, `${format(state.frictionWorkJ, 1)} J`, clamp(centerX - 120, 12, width - 96), centerY + 44, centerX - 44, centerY + 18, "#ff4df0");
      drawSceneLabel(context, `${format(state.finalSpeed, 2)} m/s`, barX - 58, barY + 22, barX + barW * 0.78, barY + barH * 0.44, "#f4c95d");
    }
    context.restore();
    return;
  }

  if (kind === "snell") {
    const state = snellState(params);
    const hitX = width * 0.5;
    const hitY = height * 0.5;
    const rayLength = Math.min(width, height) * 0.39;
    const incidentDir = { x: Math.sin(state.incidentRad), y: Math.cos(state.incidentRad) };
    const refractedDir = {
      x: state.totalInternalReflection ? Math.sin(state.incidentRad) : Math.sin(state.refractedRad),
      y: state.totalInternalReflection ? -Math.cos(state.incidentRad) : Math.cos(state.refractedRad),
    };
    const incidentStart = { x: hitX - incidentDir.x * rayLength, y: hitY - incidentDir.y * rayLength };
    const refractedEnd = {
      x: hitX + refractedDir.x * rayLength * 0.92,
      y: hitY + refractedDir.y * rayLength * 0.92,
    };
    const reflectedEnd = {
      x: hitX + incidentDir.x * rayLength * 0.74,
      y: hitY - incidentDir.y * rayLength * 0.74,
    };
    const critical = Number.isFinite(state.criticalAngleDeg) ? state.criticalAngleDeg : null;
    const mediumTone = state.n2 >= state.n1 ? "#7ff8ff" : "#f4c95d";

    context.save();
    const topGradient = context.createLinearGradient(0, 0, 0, hitY);
    topGradient.addColorStop(0, "rgba(8, 18, 32, 0.58)");
    topGradient.addColorStop(1, "rgba(127, 248, 255, 0.05)");
    context.fillStyle = topGradient;
    context.fillRect(0, 0, width, hitY);
    const lowerGradient = context.createLinearGradient(0, hitY, 0, height);
    lowerGradient.addColorStop(0, state.n2 >= state.n1 ? "rgba(127, 248, 255, 0.12)" : "rgba(244, 201, 93, 0.12)");
    lowerGradient.addColorStop(1, "rgba(255, 77, 240, 0.05)");
    context.fillStyle = lowerGradient;
    context.fillRect(0, hitY, width, height - hitY);

    context.strokeStyle = "rgba(233, 251, 255, 0.3)";
    context.lineWidth = 2.4;
    context.shadowColor = mediumTone;
    context.shadowBlur = 10;
    context.beginPath();
    context.moveTo(width * 0.08, hitY);
    context.lineTo(width * 0.92, hitY);
    context.stroke();
    context.shadowBlur = 0;

    context.setLineDash([8, 8]);
    context.strokeStyle = "rgba(233, 251, 255, 0.28)";
    context.beginPath();
    context.moveTo(hitX, hitY - rayLength * 0.62);
    context.lineTo(hitX, hitY + rayLength * 0.62);
    context.stroke();
    context.setLineDash([]);

    context.strokeStyle = "rgba(244, 201, 93, 0.22)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(hitX, hitY, 54, -Math.PI / 2, -Math.PI / 2 + state.incidentRad);
    context.stroke();
    if (!state.totalInternalReflection) {
      context.strokeStyle = "rgba(127, 248, 255, 0.24)";
      context.beginPath();
      context.arc(hitX, hitY, 76, Math.PI / 2 - state.refractedRad, Math.PI / 2);
      context.stroke();
    }
    if (critical !== null) {
      const criticalRad = degToRad(critical);
      context.setLineDash([5, 8]);
      context.strokeStyle = "rgba(255, 77, 240, 0.24)";
      context.beginPath();
      context.moveTo(hitX, hitY);
      context.lineTo(hitX + Math.sin(criticalRad) * rayLength * 0.48, hitY - Math.cos(criticalRad) * rayLength * 0.48);
      context.stroke();
      context.setLineDash([]);
    }

    drawArrow(context, incidentStart.x, incidentStart.y, hitX, hitY, "#f4c95d", 4.2);
    if (state.totalInternalReflection) {
      drawArrow(context, hitX, hitY, reflectedEnd.x, reflectedEnd.y, "#ff4df0", 4.2);
    } else {
      drawArrow(context, hitX, hitY, refractedEnd.x, refractedEnd.y, "#7ff8ff", 4.2);
      if (state.reflectance > 0.03) drawArrow(context, hitX, hitY, reflectedEnd.x, reflectedEnd.y, "#ff4df0", 2.4);
    }

    for (let i = 0; i < 6; i += 1) {
      const t = 0.18 + i * 0.1;
      const px = incidentStart.x + (hitX - incidentStart.x) * t;
      const py = incidentStart.y + (hitY - incidentStart.y) * t;
      context.strokeStyle = `rgba(244, 201, 93, ${0.1 + i * 0.025})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(px - incidentDir.y * 16, py + incidentDir.x * 16);
      context.lineTo(px + incidentDir.y * 16, py - incidentDir.x * 16);
      context.stroke();
    }
    if (!state.totalInternalReflection) {
      for (let i = 0; i < 6; i += 1) {
        const t = 0.16 + i * 0.1;
        const px = hitX + (refractedEnd.x - hitX) * t;
        const py = hitY + (refractedEnd.y - hitY) * t;
        context.strokeStyle = `rgba(127, 248, 255, ${0.12 + i * 0.025})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(px - refractedDir.y * 15, py + refractedDir.x * 15);
        context.lineTo(px + refractedDir.y * 15, py - refractedDir.x * 15);
        context.stroke();
      }
    }

    context.fillStyle = "#e9fbff";
    context.shadowColor = "#e9fbff";
    context.shadowBlur = 16;
    context.beginPath();
    context.arc(hitX, hitY, 5, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    if (labelsVisible) {
      drawSceneLabel(context, "Incident Ray", clamp(incidentStart.x + 22, 12, width - 116), clamp(incidentStart.y + 26, 28, height - 40), incidentStart.x + incidentDir.x * 40, incidentStart.y + incidentDir.y * 40, "#f4c95d");
      drawSceneLabel(context, state.totalInternalReflection ? "Reflected Ray" : "Refracted Ray", clamp(refractedEnd.x - 80, 12, width - 132), clamp(refractedEnd.y - 22, 28, height - 40), refractedEnd.x, refractedEnd.y, state.totalInternalReflection ? "#ff4df0" : "#7ff8ff");
      drawSceneLabel(context, "Normal", hitX + 18, hitY - 130, hitX, hitY - 82, "#e9fbff");
      drawSceneLabel(context, "Boundary", width * 0.63, hitY + 16, width * 0.72, hitY, mediumTone);
      drawSceneLabel(context, "Medium 1", width * 0.12, height * 0.18, width * 0.22, height * 0.24, "#f4c95d");
      drawSceneLabel(context, "Medium 2", width * 0.12, height * 0.72, width * 0.22, height * 0.68, mediumTone);
    }
    context.restore();
    return;
  }

  if (kind === "thinlens") {
    const state = thinLensState(params);
    const lensX = width * 0.52;
    const axisY = height * 0.5;
    const leftRoom = lensX - width * 0.09;
    const rightRoom = width * 0.91 - lensX;
    const distanceScale = Math.min(
      leftRoom / Math.max(state.objectDistance, Math.abs(state.finiteImageDistance), Math.abs(state.focalLength), 12),
      rightRoom / Math.max(Math.abs(state.finiteImageDistance), Math.abs(state.focalLength), 12),
      9,
    );
    const heightScale = Math.min((height * 0.24) / Math.max(state.objectHeight, Math.abs(state.imageHeight), 1), 14);
    const objectX = lensX - state.objectDistance * distanceScale;
    const objectTopY = axisY - state.objectHeight * heightScale;
    const imageX = lensX + state.finiteImageDistance * distanceScale;
    const imageTopY = axisY - state.imageHeight * heightScale;
    const focalRightX = lensX + state.focalLength * distanceScale;
    const focalLeftX = lensX - state.focalLength * distanceScale;
    const aperturePx = clamp(state.aperture * 7, 68, height * 0.68);
    const rayTone = state.realImage ? "#7ff8ff" : "#ff4df0";

    context.save();
    context.strokeStyle = "rgba(233, 251, 255, 0.2)";
    context.lineWidth = 1.8;
    context.beginPath();
    context.moveTo(width * 0.07, axisY);
    context.lineTo(width * 0.93, axisY);
    context.stroke();

    context.strokeStyle = "rgba(244, 201, 93, 0.34)";
    context.setLineDash([7, 8]);
    context.beginPath();
    context.moveTo(focalLeftX, axisY - 32);
    context.lineTo(focalLeftX, axisY + 32);
    context.moveTo(focalRightX, axisY - 32);
    context.lineTo(focalRightX, axisY + 32);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#f4c95d";
    context.font = '760 11px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillText("F", focalLeftX - 4, axisY + 48);
    context.fillText("F", focalRightX - 4, axisY + 48);

    const lensGradient = context.createLinearGradient(lensX - 18, axisY - aperturePx / 2, lensX + 18, axisY + aperturePx / 2);
    lensGradient.addColorStop(0, "rgba(127, 248, 255, 0.1)");
    lensGradient.addColorStop(0.5, "rgba(127, 248, 255, 0.45)");
    lensGradient.addColorStop(1, "rgba(255, 77, 240, 0.08)");
    context.fillStyle = lensGradient;
    context.strokeStyle = "#7ff8ff";
    context.lineWidth = 2.4;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 18;
    context.beginPath();
    if (state.converging) {
      context.moveTo(lensX, axisY - aperturePx / 2);
      context.bezierCurveTo(lensX + 30, axisY - aperturePx * 0.25, lensX + 30, axisY + aperturePx * 0.25, lensX, axisY + aperturePx / 2);
      context.bezierCurveTo(lensX - 30, axisY + aperturePx * 0.25, lensX - 30, axisY - aperturePx * 0.25, lensX, axisY - aperturePx / 2);
    } else {
      context.moveTo(lensX - 22, axisY - aperturePx / 2);
      context.bezierCurveTo(lensX + 12, axisY - aperturePx * 0.24, lensX + 12, axisY + aperturePx * 0.24, lensX - 22, axisY + aperturePx / 2);
      context.lineTo(lensX + 22, axisY + aperturePx / 2);
      context.bezierCurveTo(lensX - 12, axisY + aperturePx * 0.24, lensX - 12, axisY - aperturePx * 0.24, lensX + 22, axisY - aperturePx / 2);
      context.closePath();
    }
    context.fill();
    context.stroke();
    context.shadowBlur = 0;

    drawArrow(context, objectX, axisY, objectX, objectTopY, "#f4c95d", 4);
    context.strokeStyle = state.realImage ? "#ff4df0" : "rgba(255, 77, 240, 0.66)";
    context.lineWidth = 3;
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 16;
    context.setLineDash(state.realImage ? [] : [8, 7]);
    drawArrow(context, imageX, axisY, imageX, imageTopY, "#ff4df0", 3.4);
    context.setLineDash([]);
    context.shadowBlur = 0;

    const topAtLens = { x: lensX, y: objectTopY };
    const centerRaySlope = (axisY - objectTopY) / (lensX - objectX);
    const centerRayEnd = { x: width * 0.9, y: objectTopY + centerRaySlope * (width * 0.9 - objectX) };
    context.strokeStyle = rayTone;
    context.lineWidth = 2.2;
    context.shadowColor = rayTone;
    context.shadowBlur = 12;
    context.beginPath();
    context.moveTo(objectX, objectTopY);
    context.lineTo(lensX, objectTopY);
    context.lineTo(imageX, imageTopY);
    context.stroke();
    context.beginPath();
    context.moveTo(objectX, objectTopY);
    context.lineTo(lensX, axisY);
    context.lineTo(centerRayEnd.x, centerRayEnd.y);
    context.stroke();

    if (!state.realImage) {
      context.setLineDash([6, 7]);
      context.strokeStyle = "rgba(255, 77, 240, 0.58)";
      context.beginPath();
      context.moveTo(topAtLens.x, topAtLens.y);
      context.lineTo(imageX, imageTopY);
      context.moveTo(lensX, axisY);
      context.lineTo(imageX, imageTopY);
      context.stroke();
      context.setLineDash([]);
    }
    context.shadowBlur = 0;

    context.fillStyle = "rgba(4, 12, 18, 0.5)";
    context.strokeStyle = "rgba(127, 248, 255, 0.24)";
    roundedCanvasRect(context, width * 0.08, height * 0.74, width * 0.27, 46, 7);
    context.fill();
    context.stroke();
    context.fillStyle = "#7ff8ff";
    context.fillRect(width * 0.1, height * 0.78, clamp(Math.abs(state.magnification) * 46, 8, 120), 8);
    context.fillStyle = "#ff4df0";
    context.fillRect(width * 0.1, height * 0.83, clamp(Math.abs(state.opticalPower) * 26, 8, 120), 8);

    if (labelsVisible) {
      drawSceneLabel(context, "Object", clamp(objectX - 36, 12, width - 94), clamp(objectTopY - 38, 28, height - 40), objectX, objectTopY, "#f4c95d");
      drawSceneLabel(context, state.realImage ? "Real Image" : "Virtual Image", clamp(imageX + 14, 12, width - 118), clamp(imageTopY - 22, 28, height - 40), imageX, imageTopY, "#ff4df0");
      drawSceneLabel(context, state.converging ? "Converging Lens" : "Diverging Lens", lensX + 20, axisY - aperturePx / 2 + 16, lensX, axisY - aperturePx / 2, "#7ff8ff");
      drawSceneLabel(context, "Focal Point", clamp(focalRightX + 10, 12, width - 112), axisY + 52, focalRightX, axisY, "#f4c95d");
      drawSceneLabel(context, "Principal Ray", clamp(lensX + 40, 12, width - 126), clamp(objectTopY - 44, 28, height - 40), topAtLens.x, topAtLens.y, rayTone);
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.objectDistance, 1)} cm`, clamp((objectX + lensX) / 2 - 40, 12, width - 96), axisY + 24, objectX, axisY, "#f4c95d");
      drawSceneLabel(context, `${format(state.imageDistance, 1)} cm`, clamp((imageX + lensX) / 2 - 40, 12, width - 104), axisY - 52, imageX, axisY, "#ff4df0");
      drawSceneLabel(context, `${format(state.focalLength, 1)} cm`, clamp(focalRightX + 10, 12, width - 96), axisY + 52, focalRightX, axisY, "#7ff8ff");
      drawSceneLabel(context, `${format(state.magnification, 2)}x`, clamp(imageX + 14, 12, width - 82), clamp(imageTopY - 22, 28, height - 40), imageX, imageTopY, "#a9ef78");
    }
    context.restore();
    return;
  }

  if (kind === "cooling") {
    const state = coolingState(params);
    const chamberX = width * 0.16;
    const chamberY = height * 0.17;
    const chamberW = width * 0.58;
    const chamberH = height * 0.62;
    const objectX = chamberX + chamberW * 0.43;
    const objectY = chamberY + chamberH * 0.54;
    const objectR = 42 + state.thermalMass * 5;
    const hot = state.gap > 0;
    const heatTone = hot ? "#ff4df0" : "#7ff8ff";
    const objectTone = hot ? "#f4c95d" : "#7ff8ff";
    const gapFraction = clamp(Math.abs(state.gap) / 120, 0, 1);
    const pulse = 0.88 + Math.sin(frame * 0.04) * 0.12;
    const scaleX = chamberX + chamberW + width * 0.08;
    const scaleY = chamberY + chamberH * 0.08;
    const scaleH = chamberH * 0.82;
    const tempMin = -20;
    const tempMax = 120;
    const tempToY = (temp: number) => scaleY + scaleH * (1 - clamp((temp - tempMin) / (tempMax - tempMin), 0, 1));
    const currentY = tempToY(state.currentTemp);
    const ambientY = tempToY(state.ambientTemp);

    context.save();
    context.fillStyle = "rgba(4, 12, 18, 0.42)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    context.lineWidth = 1.6;
    roundedCanvasRect(context, chamberX, chamberY, chamberW, chamberH, 10);
    context.fill();
    context.stroke();

    for (let i = 0; i < 18; i += 1) {
      const px = chamberX + ((i * 47 + frame * 0.18) % chamberW);
      const py = chamberY + 28 + ((i * 31) % (chamberH - 56));
      context.fillStyle = `rgba(127, 248, 255, ${0.05 + (i % 4) * 0.012})`;
      context.beginPath();
      context.arc(px, py, 2 + (i % 3), 0, TAU);
      context.fill();
    }

    context.strokeStyle = "rgba(169, 239, 120, 0.34)";
    context.setLineDash([7, 7]);
    context.beginPath();
    context.moveTo(chamberX + 20, ambientY);
    context.lineTo(chamberX + chamberW - 20, ambientY);
    context.stroke();
    context.setLineDash([]);

    const glow = context.createRadialGradient(objectX, objectY, objectR * 0.18, objectX, objectY, objectR * 2.2);
    glow.addColorStop(0, hot ? `rgba(244, 201, 93, ${0.34 + gapFraction * 0.26})` : `rgba(127, 248, 255, ${0.28 + gapFraction * 0.2})`);
    glow.addColorStop(1, "rgba(4, 12, 18, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(objectX, objectY, objectR * 2.2, 0, TAU);
    context.fill();

    context.fillStyle = hot ? "rgba(244, 201, 93, 0.24)" : "rgba(127, 248, 255, 0.22)";
    context.strokeStyle = objectTone;
    context.shadowColor = objectTone;
    context.shadowBlur = 24;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(objectX, objectY, objectR * pulse, 0, TAU);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "rgba(4, 12, 18, 0.62)";
    context.beginPath();
    context.arc(objectX, objectY, objectR * 0.48, 0, TAU);
    context.fill();

    const arrowCount = 6;
    for (let i = 0; i < arrowCount; i += 1) {
      const angle = -Math.PI * 0.82 + (i / (arrowCount - 1)) * Math.PI * 1.64;
      const inner = objectR * (hot ? 0.85 : 1.8);
      const outer = objectR * (hot ? 1.85 : 0.88);
      const x1 = objectX + Math.cos(angle) * inner;
      const y1 = objectY + Math.sin(angle) * inner;
      const x2 = objectX + Math.cos(angle) * outer;
      const y2 = objectY + Math.sin(angle) * outer;
      drawArrow(context, x1, y1, x2, y2, heatTone, 2.4 + gapFraction * 2);
    }

    context.strokeStyle = "rgba(233, 251, 255, 0.3)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(scaleX, scaleY);
    context.lineTo(scaleX, scaleY + scaleH);
    context.stroke();
    context.strokeStyle = "rgba(169, 239, 120, 0.5)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(scaleX - 18, ambientY);
    context.lineTo(scaleX + 44, ambientY);
    context.stroke();
    context.fillStyle = objectTone;
    context.shadowColor = objectTone;
    context.shadowBlur = 14;
    context.beginPath();
    context.arc(scaleX, currentY, 8, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "rgba(4, 12, 18, 0.72)";
    context.strokeStyle = "rgba(127, 248, 255, 0.24)";
    roundedCanvasRect(context, scaleX + 32, scaleY + scaleH * 0.18, width * 0.12, scaleH * 0.48, 8);
    context.fill();
    context.stroke();
    const rateH = clamp(Math.abs(state.rateDegPerMin) / 60, 0, 1) * scaleH * 0.34;
    context.fillStyle = heatTone;
    roundedCanvasRect(context, scaleX + 58, scaleY + scaleH * 0.54 - rateH, 16, rateH, 4);
    context.fill();
    context.fillStyle = "#a9ef78";
    roundedCanvasRect(context, scaleX + 90, scaleY + scaleH * 0.54 - clamp(state.equilibriumFraction, 0, 1) * scaleH * 0.34, 16, clamp(state.equilibriumFraction, 0, 1) * scaleH * 0.34, 4);
    context.fill();

    if (labelsVisible) {
      drawSceneLabel(context, "Object Temperature", objectX - 74, objectY - objectR - 50, objectX, objectY - objectR * 0.75, objectTone);
      drawSceneLabel(context, hot ? "Heat Flow Out" : "Heat Flow In", objectX + objectR + 28, objectY - 22, objectX + objectR * 1.56, objectY, heatTone);
      drawSceneLabel(context, "Ambient Temperature", chamberX + chamberW * 0.12, ambientY + 18, chamberX + chamberW * 0.32, ambientY, "#a9ef78");
      drawSceneLabel(context, "Temperature Scale", scaleX + 24, scaleY + 6, scaleX, currentY, "#7ff8ff");
      drawSceneLabel(context, "Cooling Rate", scaleX + 30, scaleY + scaleH * 0.72, scaleX + 66, scaleY + scaleH * 0.54 - rateH, heatTone);
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.currentTemp, 1)} °C`, objectX - 68, objectY - objectR - 50, objectX, objectY - objectR * 0.75, objectTone);
      drawSceneLabel(context, `${format(Math.abs(state.rateDegPerMin), 2)} °C/min`, objectX + objectR + 28, objectY - 22, objectX + objectR * 1.56, objectY, heatTone);
      drawSceneLabel(context, `${format(state.ambientTemp, 1)} °C`, chamberX + chamberW * 0.12, ambientY + 18, chamberX + chamberW * 0.32, ambientY, "#a9ef78");
      drawSceneLabel(context, `${format(state.halfTimeMin, 2)} min`, scaleX + 30, scaleY + scaleH * 0.72, scaleX + 98, scaleY + scaleH * 0.54, "#f4c95d");
    }
    context.restore();
    return;
  }

  if (kind === "carnot") {
    const state = carnotState(params);
    const hotColor = "#ff4df0";
    const coldColor = "#7ff8ff";
    const workColor = "#a9ef78";
    const heatColor = "#f4c95d";
    const engineX = cx;
    const engineY = cy;
    const engineR = Math.min(width, height) * 0.12;
    const hotY = height * 0.18;
    const coldY = height * 0.82;
    const phase = degToRad(params.cyclePhase);
    const rotorX = engineX + Math.cos(phase) * engineR * 0.52;
    const rotorY = engineY + Math.sin(phase) * engineR * 0.52;

    context.save();
    context.fillStyle = "rgba(4, 12, 18, 0.58)";
    context.strokeStyle = "rgba(255, 77, 240, 0.24)";
    roundedCanvasRect(context, width * 0.15, hotY - 34, width * 0.7, 56, 10);
    context.fill();
    context.stroke();
    const hotGradient = context.createLinearGradient(width * 0.15, hotY, width * 0.85, hotY);
    hotGradient.addColorStop(0, "rgba(255, 77, 240, 0.12)");
    hotGradient.addColorStop(0.5, "rgba(255, 77, 240, 0.44)");
    hotGradient.addColorStop(1, "rgba(244, 201, 93, 0.18)");
    context.fillStyle = hotGradient;
    roundedCanvasRect(context, width * 0.17, hotY - 20, width * 0.66, 28, 8);
    context.fill();

    context.fillStyle = "rgba(4, 12, 18, 0.58)";
    context.strokeStyle = "rgba(127, 248, 255, 0.24)";
    roundedCanvasRect(context, width * 0.15, coldY - 22, width * 0.7, 56, 10);
    context.fill();
    context.stroke();
    const coldGradient = context.createLinearGradient(width * 0.15, coldY, width * 0.85, coldY);
    coldGradient.addColorStop(0, "rgba(127, 248, 255, 0.12)");
    coldGradient.addColorStop(0.5, "rgba(127, 248, 255, 0.36)");
    coldGradient.addColorStop(1, "rgba(169, 239, 120, 0.1)");
    context.fillStyle = coldGradient;
    roundedCanvasRect(context, width * 0.17, coldY - 8, width * 0.66, 28, 8);
    context.fill();

    context.strokeStyle = "rgba(233, 251, 255, 0.13)";
    context.lineWidth = 1.4;
    context.beginPath();
    for (let x = width * 0.18; x <= width * 0.82; x += width * 0.08) {
      context.moveTo(x, height * 0.26);
      context.lineTo(x, height * 0.74);
    }
    context.stroke();

    drawArrow(context, engineX, hotY + 30, engineX, engineY - engineR - 8, heatColor, 4.2);
    drawArrow(context, engineX, engineY + engineR + 8, engineX, coldY - 28, coldColor, 4.2);
    drawArrow(context, engineX + engineR + 12, engineY, width * 0.82, engineY, workColor, 4.2);

    context.fillStyle = "rgba(4, 12, 18, 0.82)";
    context.strokeStyle = "rgba(244, 201, 93, 0.24)";
    context.lineWidth = 2;
    context.shadowColor = heatColor;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(engineX, engineY, engineR, 0, TAU);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;

    for (let i = 0; i < 4; i += 1) {
      const blade = phase + i * (Math.PI / 2);
      drawArrow(
        context,
        engineX + Math.cos(blade) * engineR * 0.18,
        engineY + Math.sin(blade) * engineR * 0.18,
        engineX + Math.cos(blade) * engineR * 0.72,
        engineY + Math.sin(blade) * engineR * 0.72,
        i % 2 === 0 ? hotColor : coldColor,
        2.2,
      );
    }
    context.fillStyle = workColor;
    context.shadowColor = workColor;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(rotorX, rotorY, 8, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    const plotX = width * 0.12;
    const plotY = height * 0.34;
    const plotW = width * 0.18;
    const plotH = height * 0.27;
    context.fillStyle = "rgba(4, 12, 18, 0.62)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, plotX, plotY, plotW, plotH, 8);
    context.fill();
    context.stroke();
    context.strokeStyle = "rgba(233, 251, 255, 0.22)";
    context.beginPath();
    context.moveTo(plotX + 26, plotY + plotH - 24);
    context.lineTo(plotX + plotW - 14, plotY + plotH - 24);
    context.moveTo(plotX + 26, plotY + plotH - 24);
    context.lineTo(plotX + 26, plotY + 18);
    context.stroke();
    const cyclePoints = Array.from({ length: 96 }, (_, index) => {
      const t = (index / 96) * TAU;
      const x = plotX + plotW * 0.52 + Math.cos(t) * plotW * (0.22 + 0.04 * Math.sin(t));
      const y = plotY + plotH * 0.5 + Math.sin(t) * plotH * (0.22 + 0.04 * Math.cos(t));
      return { x, y };
    });
    context.strokeStyle = "rgba(244, 201, 93, 0.9)";
    context.lineWidth = 2.4;
    context.beginPath();
    cyclePoints.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.stroke();
    const marker = cyclePoints[Math.floor(((params.cyclePhase % 360) / 360) * (cyclePoints.length - 1))];
    context.fillStyle = workColor;
    context.beginPath();
    context.arc(marker.x, marker.y, 5.5, 0, TAU);
    context.fill();

    const meterX = width * 0.73;
    const meterY = height * 0.34;
    const meterW = width * 0.14;
    const meterH = height * 0.26;
    context.fillStyle = "rgba(4, 12, 18, 0.62)";
    context.strokeStyle = "rgba(127, 248, 255, 0.2)";
    roundedCanvasRect(context, meterX, meterY, meterW, meterH, 8);
    context.fill();
    context.stroke();
    const bars = [
      { value: state.efficiency, color: workColor },
      { value: state.rejectedHeat / state.heatInput, color: coldColor },
      { value: Math.min(1, state.workOutput / Math.max(1, state.heatInput)), color: hotColor },
    ];
    bars.forEach((bar, index) => {
      const x = meterX + 28 + index * 30;
      const h = clamp(bar.value, 0, 1) * (meterH - 52);
      context.fillStyle = bar.color;
      roundedCanvasRect(context, x, meterY + meterH - 28 - h, 14, h, 5);
      context.fill();
    });

    if (labelsVisible) {
      drawSceneLabel(context, "Hot Reservoir", width * 0.2, hotY - 52, width * 0.35, hotY, hotColor);
      drawSceneLabel(context, "Reversible Engine", engineX + engineR + 18, engineY - 42, engineX, engineY, heatColor);
      drawSceneLabel(context, "Useful Work", width * 0.68, engineY - 42, width * 0.82, engineY, workColor);
      drawSceneLabel(context, "Cold Reservoir", width * 0.2, coldY + 42, width * 0.35, coldY, coldColor);
      drawSceneLabel(context, "P-V Cycle", plotX + plotW * 0.66, plotY + 18, marker.x, marker.y, heatColor);
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.hotK, 0)} K`, width * 0.2, hotY - 52, width * 0.35, hotY, hotColor);
      drawSceneLabel(context, `η ${format(state.efficiency * 100, 1)}%`, engineX + engineR + 18, engineY - 42, engineX, engineY, workColor);
      drawSceneLabel(context, `${format(state.workOutput, 1)} J`, width * 0.68, engineY - 42, width * 0.82, engineY, workColor);
      drawSceneLabel(context, `${format(state.coldK, 0)} K`, width * 0.2, coldY + 42, width * 0.35, coldY, coldColor);
      drawSceneLabel(context, `${format(state.rejectedHeat, 1)} J`, clamp(engineX + 16, 12, width - 118), engineY + engineR + 36, engineX, coldY - 28, coldColor);
    }
    context.restore();
    return;
  }

  if (kind === "circular") {
    const radius = params.radius;
    const omega = params.angularSpeed;
    const mass = params.mass;
    const theta = frame * 0.022 * omega + degToRad(params.phase);
    const orbitRadius = Math.min(width, height) * (0.15 + radius * 0.04);
    const tilt = viewMode === "3d" ? 0.42 : 1;
    const depth = Math.sin(theta);
    const pointScale = viewMode === "3d" ? 0.84 + depth * 0.18 : 1;
    const x = cx + Math.cos(theta) * orbitRadius;
    const y = cy + Math.sin(theta) * orbitRadius * tilt;
    const vx = -Math.sin(theta);
    const vy = Math.cos(theta) * tilt;
    const speed = radius * omega;
    const force = mass * radius * omega * omega;

    context.save();
    if (viewMode === "3d") {
      drawOrbitPlaneGrid(context, cx, cy, orbitRadius, tilt);
    }
    context.strokeStyle = "rgba(127, 248, 255, 0.34)";
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(cx, cy, orbitRadius, orbitRadius * tilt, 0, 0, TAU);
    context.stroke();

    if (viewMode === "3d") {
      context.strokeStyle = "rgba(255, 77, 240, 0.22)";
      context.setLineDash([8, 8]);
      context.beginPath();
      context.moveTo(cx, cy - orbitRadius * tilt);
      context.lineTo(cx, cy + orbitRadius * tilt);
      context.stroke();
      context.setLineDash([]);
      if (labelsVisible) {
        drawSceneLabel(context, "Tilted Orbit Plane", width * 0.06, height * 0.14, cx, cy - orbitRadius * tilt, "#ff4df0");
      }
    }

    context.strokeStyle = "rgba(244, 201, 93, 0.28)";
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(x, y);
    context.stroke();

    drawArrow(context, x, y, x - Math.cos(theta) * Math.min(90, 26 + force * 2.2), y - Math.sin(theta) * tilt * Math.min(90, 26 + force * 2.2), "#ff4df0", 3);
    drawArrow(context, x, y, x + vx * Math.min(92, 30 + speed * 14), y + vy * Math.min(92, 30 + speed * 14), "#7ff8ff", 4);

    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 24;
    context.beginPath();
    context.arc(x, y, (11 + mass * 2.2) * pointScale, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#e9fbff";
    context.beginPath();
    context.arc(cx, cy, 7, 0, TAU);
    context.fill();
    if (labelsVisible) {
      drawSceneLabel(context, "Velocity", clamp(x + vx * 70, 12, width - 92), clamp(y + vy * 70, 28, height - 40), x + vx * 34, y + vy * 34, "#7ff8ff");
      drawSceneLabel(context, "Centripetal Force", clamp((x + cx) / 2 - 14, 12, width - 150), clamp((y + cy) / 2 + 16, 28, height - 40), (x + cx) / 2, (y + cy) / 2, "#ff4df0");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(speed, 2)} m/s`, clamp(x + vx * 70, 12, width - 105), clamp(y + vy * 70, 28, height - 40), x + vx * 34, y + vy * 34, "#7ff8ff");
      drawSceneLabel(context, `${format(force, 2)} N`, clamp((x + cx) / 2 - 14, 12, width - 112), clamp((y + cy) / 2 + 16, 28, height - 40), (x + cx) / 2, (y + cy) / 2, "#ff4df0");
    }
    context.restore();
    return;
  }

  if (kind === "unitcircle") {
    const state = unitCircleState(params);
    const radiusPx = Math.min(width, height) * 0.24 * params.radius;
    const originX = width * 0.43;
    const originY = height * 0.52;
    const pointX = originX + Math.cos(state.theta) * radiusPx;
    const pointY = originY - Math.sin(state.theta) * radiusPx;
    const axisW = radiusPx * 1.25;
    const tangentX = originX + radiusPx;
    const tangentY = originY - state.tan * radiusPx;
    const phase = ((state.theta % TAU) + TAU) % TAU;

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.2)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(originX - axisW, originY);
    context.lineTo(originX + axisW, originY);
    context.moveTo(originX, originY + axisW);
    context.lineTo(originX, originY - axisW);
    context.stroke();

    context.strokeStyle = "rgba(127, 248, 255, 0.5)";
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 14;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(originX, originY, radiusPx, 0, TAU);
    context.stroke();
    context.shadowBlur = 0;

    for (let i = 18; i >= 1; i -= 1) {
      const trailTheta = state.theta - i * 0.055;
      const trailX = originX + Math.cos(trailTheta) * radiusPx;
      const trailY = originY - Math.sin(trailTheta) * radiusPx;
      context.fillStyle = `rgba(127, 248, 255, ${0.03 + (18 - i) * 0.012})`;
      context.beginPath();
      context.arc(trailX, trailY, 2.2 + (18 - i) * 0.08, 0, TAU);
      context.fill();
    }

    context.strokeStyle = "rgba(244, 201, 93, 0.44)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(originX, originY, radiusPx * 0.27, 0, -state.theta, state.theta > 0);
    context.stroke();

    context.setLineDash([6, 7]);
    context.strokeStyle = "rgba(244, 201, 93, 0.56)";
    context.beginPath();
    context.moveTo(pointX, pointY);
    context.lineTo(pointX, originY);
    context.lineTo(originX, originY);
    context.stroke();
    context.strokeStyle = "rgba(255, 77, 240, 0.52)";
    context.beginPath();
    context.moveTo(pointX, pointY);
    context.lineTo(originX, pointY);
    context.stroke();
    context.setLineDash([]);

    drawArrow(context, originX, originY, pointX, pointY, "#7ff8ff", 4);
    drawArrow(context, originX, originY, pointX, originY, "#f4c95d", 3);
    drawArrow(context, pointX, originY, pointX, pointY, "#ff4df0", 3);

    context.strokeStyle = "rgba(169, 239, 120, 0.42)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(tangentX, originY - radiusPx * 1.08);
    context.lineTo(tangentX, originY + radiusPx * 1.08);
    context.stroke();
    if (Math.abs(state.tan) < 3.2) {
      drawArrow(context, tangentX, originY, tangentX, tangentY, "#a9ef78", 3);
    }

    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(pointX, pointY, 8, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = "rgba(4, 12, 18, 0.68)";
    context.strokeStyle = "rgba(127, 248, 255, 0.28)";
    roundedCanvasRect(context, width * 0.72, height * 0.22, width * 0.2, height * 0.4, 8);
    context.fill();
    context.stroke();
    context.strokeStyle = "rgba(127, 248, 255, 0.16)";
    context.beginPath();
    for (let i = 1; i < 4; i += 1) {
      const y = height * 0.22 + (height * 0.4 * i) / 4;
      context.moveTo(width * 0.74, y);
      context.lineTo(width * 0.9, y);
    }
    context.stroke();
    const waveX = width * 0.74;
    const waveY = height * 0.42;
    const waveW = width * 0.16;
    const waveH = height * 0.13;
    const phaseX = waveX + (phase / TAU) * waveW;
    const sineMarkerY = waveY - Math.sin(phase) * waveH;
    const cosineMarkerY = waveY - Math.cos(phase) * waveH;
    context.beginPath();
    for (let i = 0; i <= 90; i += 1) {
      const t = (i / 90) * TAU;
      const x = waveX + (i / 90) * waveW;
      const y = waveY - Math.sin(t) * waveH;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = "#ff4df0";
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 11;
    context.stroke();
    context.beginPath();
    for (let i = 0; i <= 90; i += 1) {
      const t = (i / 90) * TAU;
      const x = waveX + (i / 90) * waveW;
      const y = waveY - Math.cos(t) * waveH;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.stroke();
    context.shadowBlur = 0;

    context.strokeStyle = "rgba(233, 251, 255, 0.32)";
    context.lineWidth = 1;
    context.setLineDash([4, 5]);
    context.beginPath();
    context.moveTo(phaseX, waveY - waveH * 1.1);
    context.lineTo(phaseX, waveY + waveH * 1.1);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#ff4df0";
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 12;
    context.beginPath();
    context.arc(phaseX, sineMarkerY, 4, 0, TAU);
    context.fill();
    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.beginPath();
    context.arc(phaseX, cosineMarkerY, 4, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = "rgba(233, 251, 255, 0.76)";
    context.font = '800 10px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillText("sin", waveX, waveY - waveH - 8);
    context.fillText("cos", waveX + waveW - 24, waveY + waveH + 18);

    if (labelsVisible) {
      drawSceneLabel(context, "Radius Vector", clamp(pointX + 18, 12, width - 128), clamp(pointY - 34, 28, height - 40), pointX, pointY, "#7ff8ff");
      drawSceneLabel(context, "Cosine Projection", clamp((originX + pointX) / 2 - 78, 12, width - 146), originY + 26, (originX + pointX) / 2, originY, "#f4c95d");
      drawSceneLabel(context, "Sine Projection", clamp(pointX + 16, 12, width - 126), clamp((originY + pointY) / 2 - 14, 28, height - 40), pointX, (originY + pointY) / 2, "#ff4df0");
      drawSceneLabel(context, "Linked Wave Phase", width * 0.68, height * 0.15, phaseX, sineMarkerY, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `cos ${format(state.cos, 3)}`, clamp((originX + pointX) / 2 - 72, 12, width - 116), originY + 26, (originX + pointX) / 2, originY, "#f4c95d");
      drawSceneLabel(context, `sin ${format(state.sin, 3)}`, clamp(pointX + 16, 12, width - 108), clamp((originY + pointY) / 2 - 14, 28, height - 40), pointX, (originY + pointY) / 2, "#ff4df0");
      drawSceneLabel(context, `${format(state.radians, 3)} rad`, clamp(pointX + 18, 12, width - 122), clamp(pointY - 34, 28, height - 40), pointX, pointY, "#7ff8ff");
      drawSceneLabel(context, `${format(params.angularSpeed, 0)} deg/s`, width * 0.7, height * 0.15, phaseX, cosineMarkerY, "#a9ef78");
    }
    context.restore();
    return;
  }

  if (kind === "pythagorean") {
    const state = pythagoreanState(params);
    const rightX = width * 0.36;
    const rightY = height * 0.66;
    const scale = Math.min(width * 0.31 / state.a, height * 0.38 / state.b);
    const ax = state.a * scale;
    const by = state.b * scale;
    const p0 = { x: rightX, y: rightY };
    const pA = { x: rightX + ax, y: rightY };
    const pB = { x: rightX, y: rightY - by };
    const hypDx = pB.x - pA.x;
    const hypDy = pB.y - pA.y;
    const hypLen = Math.hypot(hypDx, hypDy);
    const normal = { x: -hypDy / hypLen, y: hypDx / hypLen };
    const sA = ax;
    const sB = by;
    const sqA = [
      p0,
      pA,
      { x: pA.x, y: pA.y + sA },
      { x: p0.x, y: p0.y + sA },
    ];
    const sqB = [
      pB,
      p0,
      { x: p0.x - sB, y: p0.y },
      { x: pB.x - sB, y: pB.y },
    ];
    const sqC = [
      pA,
      pB,
      { x: pB.x + normal.x * hypLen, y: pB.y + normal.y * hypLen },
      { x: pA.x + normal.x * hypLen, y: pA.y + normal.y * hypLen },
    ];
    const drawPoly = (points: Array<{ x: number; y: number }>, fill: string, stroke: string) => {
      context.fillStyle = fill;
      context.strokeStyle = stroke;
      context.lineWidth = 2;
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
      context.fill();
      context.stroke();
    };

    context.save();
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 8;
    drawPoly(sqC, "rgba(127, 248, 255, 0.13)", "rgba(127, 248, 255, 0.52)");
    context.shadowColor = "#ff4df0";
    drawPoly(sqB, "rgba(255, 77, 240, 0.12)", "rgba(255, 77, 240, 0.5)");
    context.shadowColor = "#f4c95d";
    drawPoly(sqA, "rgba(244, 201, 93, 0.12)", "rgba(244, 201, 93, 0.5)");
    context.shadowBlur = 0;

    context.fillStyle = "rgba(4, 12, 18, 0.82)";
    context.strokeStyle = "#e9fbff";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(p0.x, p0.y);
    context.lineTo(pA.x, pA.y);
    context.lineTo(pB.x, pB.y);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = "rgba(169, 239, 120, 0.72)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(p0.x + 22, p0.y);
    context.lineTo(p0.x + 22, p0.y - 22);
    context.lineTo(p0.x, p0.y - 22);
    context.stroke();

    context.strokeStyle = "rgba(127, 248, 255, 0.64)";
    context.beginPath();
    context.arc(pA.x, pA.y, 34, Math.PI, Math.PI + state.angleC);
    context.stroke();

    const barX = width * 0.72;
    const barY = height * 0.24;
    const barW = width * 0.16;
    const barH = height * 0.42;
    context.fillStyle = "rgba(4, 12, 18, 0.58)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, barX, barY, barW, barH, 8);
    context.fill();
    context.stroke();
    const sumArea = state.areaA + state.areaB;
    const maxArea = Math.max(sumArea, state.areaC, 1);
    const leftH = (sumArea / maxArea) * (barH - 36);
    const rightH = (state.areaC / maxArea) * (barH - 36);
    context.fillStyle = "rgba(244, 201, 93, 0.52)";
    roundedCanvasRect(context, barX + barW * 0.18, barY + barH - leftH - 18, barW * 0.22, leftH, 4);
    context.fill();
    context.fillStyle = "rgba(127, 248, 255, 0.55)";
    roundedCanvasRect(context, barX + barW * 0.6, barY + barH - rightH - 18, barW * 0.22, rightH, 4);
    context.fill();
    context.strokeStyle = "rgba(169, 239, 120, 0.58)";
    context.setLineDash([5, 7]);
    context.beginPath();
    context.moveTo(barX + 12, barY + barH - rightH - 18);
    context.lineTo(barX + barW - 12, barY + barH - rightH - 18);
    context.stroke();
    context.setLineDash([]);

    if (labelsVisible) {
      drawSceneLabel(context, "Leg A", clamp((p0.x + pA.x) / 2 - 32, 12, width - 82), p0.y + 26, (p0.x + pA.x) / 2, p0.y, "#f4c95d");
      drawSceneLabel(context, "Leg B", clamp(p0.x - 96, 12, width - 82), (p0.y + pB.y) / 2, p0.x, (p0.y + pB.y) / 2, "#ff4df0");
      drawSceneLabel(context, "Hypotenuse", clamp((pA.x + pB.x) / 2 + 18, 12, width - 128), clamp((pA.y + pB.y) / 2 - 34, 28, height - 40), (pA.x + pB.x) / 2, (pA.y + pB.y) / 2, "#7ff8ff");
      drawSceneLabel(context, "Area Balance", barX - 64, barY + 18, barX + barW * 0.5, barY + barH * 0.42, "#a9ef78");
      drawSceneLabel(context, "Right Angle", p0.x + 28, p0.y - 46, p0.x + 14, p0.y - 14, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `a ${format(state.a, 2)}`, clamp((p0.x + pA.x) / 2 - 32, 12, width - 82), p0.y + 26, (p0.x + pA.x) / 2, p0.y, "#f4c95d");
      drawSceneLabel(context, `b ${format(state.b, 2)}`, clamp(p0.x - 96, 12, width - 82), (p0.y + pB.y) / 2, p0.x, (p0.y + pB.y) / 2, "#ff4df0");
      drawSceneLabel(context, `c ${format(state.c, 2)}`, clamp((pA.x + pB.x) / 2 + 18, 12, width - 104), clamp((pA.y + pB.y) / 2 - 34, 28, height - 40), (pA.x + pB.x) / 2, (pA.y + pB.y) / 2, "#7ff8ff");
      drawSceneLabel(context, `${format(state.areaC, 2)} u2`, barX - 46, barY + 18, barX + barW * 0.5, barY + barH * 0.42, "#a9ef78");
      drawSceneLabel(context, `${format(state.angleDeg, 1)} deg`, pA.x - 22, pA.y - 52, pA.x - 18, pA.y - 18, "#7ff8ff");
    }
    context.restore();
    return;
  }

  if (kind === "binomial") {
    const state = binomialState(params);
    const plotX = width * 0.13;
    const plotY = height * 0.18;
    const plotW = width * 0.72;
    const plotH = height * 0.56;
    const baseline = plotY + plotH;
    const barGap = Math.max(2, plotW / (state.n + 1) * 0.14);
    const barW = Math.max(5, plotW / (state.n + 1) - barGap);
    const maxProb = Math.max(...state.points.map((point) => point.probability), 0.01);
    const success = state.points[state.k];
    const meanX = plotX + (state.mean / state.n) * plotW;
    const selectedX = plotX + (state.k / state.n) * plotW;
    const selectedY = baseline - (success.probability / maxProb) * plotH;

    context.save();
    context.fillStyle = "rgba(4, 12, 18, 0.42)";
    context.strokeStyle = "rgba(127, 248, 255, 0.28)";
    context.lineWidth = 2;
    roundedCanvasRect(context, plotX - 10, plotY - 14, plotW + 20, plotH + 48, 8);
    context.fill();
    context.stroke();

    context.strokeStyle = "rgba(127, 248, 255, 0.14)";
    context.lineWidth = 1;
    for (let i = 1; i < 5; i += 1) {
      const y = plotY + (plotH * i) / 5;
      context.beginPath();
      context.moveTo(plotX, y);
      context.lineTo(plotX + plotW, y);
      context.stroke();
    }

    state.points.forEach((point) => {
      const x = plotX + (point.k / state.n) * plotW - barW / 2;
      const h = (point.probability / maxProb) * plotH;
      const isSelected = point.k === state.k;
      const isNearMean = Math.abs(point.k - state.mean) <= Math.max(0.6, state.sigma * 0.35);
      context.fillStyle = isSelected
        ? "rgba(244, 201, 93, 0.9)"
        : isNearMean
          ? "rgba(127, 248, 255, 0.64)"
          : "rgba(255, 77, 240, 0.38)";
      context.shadowColor = isSelected ? "#f4c95d" : isNearMean ? "#7ff8ff" : "#ff4df0";
      context.shadowBlur = isSelected ? 18 : 8;
      roundedCanvasRect(context, x, baseline - h, barW, h, 3);
      context.fill();
    });
    context.shadowBlur = 0;

    context.strokeStyle = "rgba(169, 239, 120, 0.6)";
    context.lineWidth = 2;
    context.setLineDash([6, 7]);
    context.beginPath();
    context.moveTo(meanX, plotY - 8);
    context.lineTo(meanX, baseline + 12);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 16;
    context.beginPath();
    context.arc(selectedX, selectedY, 7, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    const coinX = width * 0.78;
    const coinY = height * 0.28;
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * TAU + frame * 0.01;
      const orbit = 36 + (i % 3) * 12;
      const isSuccess = i / 12 < state.p;
      context.fillStyle = isSuccess ? "rgba(127, 248, 255, 0.82)" : "rgba(255, 77, 240, 0.58)";
      context.shadowColor = isSuccess ? "#7ff8ff" : "#ff4df0";
      context.shadowBlur = 10;
      context.beginPath();
      context.arc(coinX + Math.cos(angle) * orbit, coinY + Math.sin(angle) * orbit * 0.62, 6, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    if (labelsVisible) {
      drawSceneLabel(context, "Highlighted Outcome", clamp(selectedX + 14, 12, width - 150), clamp(selectedY - 42, 28, height - 40), selectedX, selectedY, "#f4c95d");
      drawSceneLabel(context, "Expected Count", clamp(meanX + 12, 12, width - 128), plotY + 14, meanX, plotY + 22, "#a9ef78");
      drawSceneLabel(context, "Outcome Distribution", plotX + 12, baseline + 22, plotX + plotW * 0.38, baseline - plotH * 0.38, "#7ff8ff");
      drawSceneLabel(context, "Success Chance", width * 0.68, height * 0.12, coinX, coinY, "#ff4df0");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `P ${format(success.probability * 100, 2)}%`, clamp(selectedX + 14, 12, width - 104), clamp(selectedY - 42, 28, height - 40), selectedX, selectedY, "#f4c95d");
      drawSceneLabel(context, `mu ${format(state.mean, 2)}`, clamp(meanX + 12, 12, width - 88), plotY + 14, meanX, plotY + 22, "#a9ef78");
      drawSceneLabel(context, `sigma ${format(state.sigma, 2)}`, plotX + 12, baseline + 22, plotX + plotW * 0.64, baseline - plotH * 0.34, "#7ff8ff");
      drawSceneLabel(context, `p ${format(state.p, 2)}`, width * 0.68, height * 0.12, coinX, coinY, "#ff4df0");
    }
    context.restore();
    return;
  }

  if (kind === "exponential") {
    const state = exponentialState(params);
    const plotX = width * 0.13;
    const plotY = height * 0.17;
    const plotW = width * 0.66;
    const plotH = height * 0.58;
    const maxTime = 20;
    const sampleValues = Array.from({ length: 100 }, (_, i) => {
      const time = (i / 99) * maxTime;
      return state.initial * Math.exp(state.rate * time);
    });
    const yMax = Math.max(...sampleValues, state.initial, state.current, 1) * 1.1;
    const toX = (time: number) => plotX + (time / maxTime) * plotW;
    const toY = (value: number) => plotY + plotH - (value / yMax) * plotH;
    const activeX = toX(state.time);
    const activeY = toY(state.current);
    const tangentSpan = 2.3;
    const tangentStartT = clamp(state.time - tangentSpan, 0, maxTime);
    const tangentEndT = clamp(state.time + tangentSpan, 0, maxTime);
    const tangentStartY = state.current + state.slope * (tangentStartT - state.time);
    const tangentEndY = state.current + state.slope * (tangentEndT - state.time);
    const tone = state.rate > 0.01 ? "#a9ef78" : state.rate < -0.01 ? "#ff4df0" : "#f4c95d";

    context.save();
    context.fillStyle = "rgba(4, 12, 18, 0.42)";
    context.strokeStyle = "rgba(127, 248, 255, 0.28)";
    context.lineWidth = 2;
    roundedCanvasRect(context, plotX - 10, plotY - 14, plotW + 20, plotH + 48, 8);
    context.fill();
    context.stroke();

    context.strokeStyle = "rgba(127, 248, 255, 0.14)";
    context.lineWidth = 1;
    for (let i = 1; i < 5; i += 1) {
      const y = plotY + (plotH * i) / 5;
      const x = plotX + (plotW * i) / 5;
      context.beginPath();
      context.moveTo(plotX, y);
      context.lineTo(plotX + plotW, y);
      context.moveTo(x, plotY);
      context.lineTo(x, plotY + plotH);
      context.stroke();
    }

    const gradient = context.createLinearGradient(plotX, plotY, plotX + plotW, plotY + plotH);
    gradient.addColorStop(0, state.rate >= 0 ? "rgba(127, 248, 255, 0.24)" : "rgba(255, 77, 240, 0.22)");
    gradient.addColorStop(1, state.rate >= 0 ? "rgba(169, 239, 120, 0.06)" : "rgba(244, 201, 93, 0.08)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(plotX, plotY + plotH);
    sampleValues.forEach((value, index) => {
      const time = (index / 99) * maxTime;
      context.lineTo(toX(time), toY(value));
    });
    context.lineTo(plotX + plotW, plotY + plotH);
    context.closePath();
    context.fill();

    context.strokeStyle = tone;
    context.lineWidth = 3;
    context.shadowColor = tone;
    context.shadowBlur = 16;
    context.beginPath();
    sampleValues.forEach((value, index) => {
      const time = (index / 99) * maxTime;
      const x = toX(time);
      const y = toY(value);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
    context.shadowBlur = 0;

    context.setLineDash([6, 7]);
    context.strokeStyle = "rgba(244, 201, 93, 0.5)";
    context.beginPath();
    context.moveTo(activeX, plotY - 8);
    context.lineTo(activeX, plotY + plotH + 18);
    context.stroke();
    context.setLineDash([]);

    context.strokeStyle = "#7ff8ff";
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 14;
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(toX(tangentStartT), toY(clamp(tangentStartY, 0, yMax)));
    context.lineTo(toX(tangentEndT), toY(clamp(tangentEndY, 0, yMax)));
    context.stroke();
    context.shadowBlur = 0;

    context.fillStyle = tone;
    context.shadowColor = tone;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(activeX, activeY, 7.5, 0, TAU);
    context.fill();
    context.shadowBlur = 0;

    const fieldX = width * 0.82;
    const fieldY = height * 0.26;
    const fieldR = Math.min(width, height) * 0.11;
    const particleCount = Math.round(clamp(10 + Math.log10(Math.max(state.current, 1)) * 18, 8, 58));
    context.strokeStyle = "rgba(127, 248, 255, 0.24)";
    context.fillStyle = "rgba(4, 12, 18, 0.34)";
    context.beginPath();
    context.arc(fieldX, fieldY, fieldR, 0, TAU);
    context.fill();
    context.stroke();
    for (let i = 0; i < particleCount; i += 1) {
      const ring = 0.18 + ((i * 17) % 83) / 100;
      const phase = frame * (state.rate >= 0 ? 0.012 : -0.009) + i * 2.399;
      const x = fieldX + Math.cos(phase) * fieldR * ring;
      const y = fieldY + Math.sin(phase * 1.13) * fieldR * ring * 0.72;
      context.fillStyle = i % 3 === 0 ? "rgba(127, 248, 255, 0.78)" : i % 3 === 1 ? "rgba(169, 239, 120, 0.76)" : "rgba(255, 77, 240, 0.58)";
      context.shadowColor = context.fillStyle.toString();
      context.shadowBlur = 8;
      context.beginPath();
      context.arc(x, y, state.rate >= 0 ? 3.5 : 3.1, 0, TAU);
      context.fill();
    }
    context.shadowBlur = 0;

    if (labelsVisible) {
      drawSceneLabel(context, state.rate >= 0 ? "Exponential Growth" : "Exponential Decay", clamp(activeX + 14, 12, width - 170), clamp(activeY - 42, 28, height - 40), activeX, activeY, tone);
      drawSceneLabel(context, "Initial Value", plotX - 4, clamp(toY(state.initial) - 44, 28, height - 40), plotX, toY(state.initial), "#f4c95d");
      drawSceneLabel(context, "Instant Rate", clamp(toX(tangentEndT) + 10, 12, width - 112), clamp(toY(clamp(tangentEndY, 0, yMax)) - 10, 28, height - 40), toX(tangentEndT), toY(clamp(tangentEndY, 0, yMax)), "#7ff8ff");
      drawSceneLabel(context, "Quantity Field", width * 0.72, height * 0.48, fieldX, fieldY, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `y ${format(state.current, 2)}`, clamp(activeX + 14, 12, width - 110), clamp(activeY - 42, 28, height - 40), activeX, activeY, tone);
      drawSceneLabel(context, `y0 ${format(state.initial, 2)}`, plotX - 4, clamp(toY(state.initial) - 44, 28, height - 40), plotX, toY(state.initial), "#f4c95d");
      drawSceneLabel(context, `dy/dt ${format(state.slope, 2)}`, clamp(toX(tangentEndT) + 10, 12, width - 126), clamp(toY(clamp(tangentEndY, 0, yMax)) - 10, 28, height - 40), toX(tangentEndT), toY(clamp(tangentEndY, 0, yMax)), "#7ff8ff");
      drawSceneLabel(context, `${format(state.multiplier, 2)}x`, width * 0.72, height * 0.48, fieldX, fieldY, "#a9ef78");
    }
    context.restore();
    return;
  }

  if (kind === "lorenz") {
    const points = lorenzTrace(params, frame);
    const tilt = viewMode === "3d" ? 0.56 : 0.18;
    const projected = points.map((point) => ({
      x: point.x - point.y * 0.18,
      y: -point.z * 1.04 + point.y * tilt,
    }));
    const minX = Math.min(...projected.map((point) => point.x));
    const maxX = Math.max(...projected.map((point) => point.x));
    const minY = Math.min(...projected.map((point) => point.y));
    const maxY = Math.max(...projected.map((point) => point.y));
    const scale = Math.min(
      Math.min(width, height) * 0.026,
      (width * 0.68) / Math.max(maxX - minX, 1),
      (height * 0.72) / Math.max(maxY - minY, 1),
    );
    const offsetX = cx - ((minX + maxX) / 2) * scale;
    const offsetY = cy - ((minY + maxY) / 2) * scale;
    const project = (point: { x: number; y: number; z: number }) => ({
      x: offsetX + (point.x - point.y * 0.18) * scale,
      y: offsetY + (-point.z * 1.04 + point.y * tilt) * scale,
    });
    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.2)";
    context.lineWidth = 1.5;
    drawArrow(context, cx - 180, cy + 112, cx + 180, cy + 112, "rgba(127, 248, 255, 0.42)", 2);
    drawArrow(context, cx, cy + 180, cx, cy - 170, "rgba(255, 77, 240, 0.38)", 2);
    context.beginPath();
    points.forEach((point, index) => {
      const p = project(point);
      if (index === 0) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    });
    context.strokeStyle = "#7ff8ff";
    context.lineWidth = 2.2;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 13;
    context.stroke();
    context.shadowColor = "#ff4df0";
    context.shadowBlur = 18;
    context.strokeStyle = "rgba(255, 77, 240, 0.7)";
    context.beginPath();
    points.slice(Math.max(0, points.length - 90)).forEach((point, index) => {
      const p = project(point);
      if (index === 0) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    });
    context.stroke();
    const head = project(points[points.length - 1]);
    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 22;
    context.beginPath();
    context.arc(head.x, head.y, 7, 0, TAU);
    context.fill();
    context.restore();
    if (labelsVisible) {
      drawSceneLabel(context, "State Trace", clamp(head.x + 14, 12, width - 110), clamp(head.y - 12, 28, height - 38), head.x, head.y, "#f4c95d");
      drawSceneLabel(context, "Strange Attractor", width * 0.14, height * 0.18, cx - 78, cy - 74, "#7ff8ff");
    }
    if (valuesVisible) {
      const spread = Math.sqrt(Math.max(0, params.beta * (params.rho - 1)));
      drawSceneLabel(context, `rho ${format(params.rho, 1)}`, width * 0.14, height * 0.18, cx - 78, cy - 74, "#7ff8ff");
      drawSceneLabel(context, `Wing Spread ${format(spread, 2)}`, clamp(head.x + 14, 12, width - 154), clamp(head.y - 12, 28, height - 38), head.x, head.y, "#a9ef78");
    }
    return;
  }

  if (kind === "orbital") {
    const periapsis = params.periapsis;
    const apoapsis = Math.max(params.apoapsis, periapsis + 0.2);
    const mu = params.centralMass;
    const a = (periapsis + apoapsis) / 2;
    const e = (apoapsis - periapsis) / (apoapsis + periapsis);
    const orbitA = Math.min(width, height) * 0.18 + a * 22;
    const orbitB = orbitA * Math.sqrt(1 - e * e);
    const tilt = viewMode === "3d" ? 0.5 : 1;
    const focusOffset = orbitA * e;
    const theta = frame * 0.006 * Math.sqrt(mu / Math.max(a ** 3, 0.1)) + degToRad(params.phase);
    const px = cx + Math.cos(theta) * orbitA - focusOffset;
    const py = cy + Math.sin(theta) * orbitB * tilt;
    const centralX = cx - focusOffset;
    const centralY = cy;
    const r = Math.max(0.2, a * (1 - e * e) / (1 + e * Math.cos(theta)));
    const speed = Math.sqrt(mu * (2 / r - 1 / a));
    const tangentX = -Math.sin(theta);
    const tangentY = Math.cos(theta) * tilt;
    context.save();
    context.translate(cx - focusOffset, cy);
    context.strokeStyle = "rgba(127, 248, 255, 0.38)";
    context.lineWidth = 2;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 12;
    context.beginPath();
    context.ellipse(focusOffset, 0, orbitA, orbitB * tilt, 0, 0, TAU);
    context.stroke();
    context.strokeStyle = "rgba(255, 77, 240, 0.44)";
    context.setLineDash([8, 8]);
    context.beginPath();
    context.ellipse(focusOffset, 0, orbitA * 0.72, orbitB * tilt * 0.72, 0, Math.PI * 0.05, Math.PI * 1.06);
    context.stroke();
    context.setLineDash([]);
    context.restore();
    context.fillStyle = "#f4c95d";
    context.shadowColor = "#f4c95d";
    context.shadowBlur = 24;
    context.beginPath();
    context.arc(centralX, centralY, 20, 0, TAU);
    context.fill();
    context.fillStyle = "#7ff8ff";
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(px, py, 9, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
    drawArrow(context, px, py, px + tangentX * 70, py + tangentY * 70, "#a9ef78", 3);
    drawArrow(context, px, py, px + (centralX - px) * 0.26, py + (centralY - py) * 0.26, "#ff4df0", 3);
    if (labelsVisible) {
      drawSceneLabel(context, "Central Body", centralX + 24, centralY + 24, centralX, centralY, "#f4c95d");
      drawSceneLabel(context, "Spacecraft", clamp(px + 22, 12, width - 112), clamp(py - 36, 28, height - 38), px, py, "#7ff8ff");
      drawSceneLabel(context, "Transfer Arc", width * 0.62, height * 0.24, cx + orbitA * 0.25, cy - orbitB * tilt * 0.62, "#ff4df0");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `e ${format(e, 2)}`, width * 0.62, height * 0.24, cx + orbitA * 0.25, cy - orbitB * tilt * 0.62, "#ff4df0");
      drawSceneLabel(context, `${format(speed, 2)} u/s`, clamp(px + 22, 12, width - 112), clamp(py - 36, 28, height - 38), px, py, "#a9ef78");
      drawSceneLabel(context, `${format(a, 2)} AU`, centralX + 24, centralY + 24, centralX, centralY, "#f4c95d");
    }
    return;
  }

  if (kind === "buoyancy") {
    const state = buoyancyState(params);
    const tankX = width * 0.18;
    const tankY = height * 0.16;
    const tankW = width * 0.48;
    const tankH = height * 0.62;
    const waterline = tankY + tankH * 0.28;
    const floorY = tankY + tankH * 0.88;
    const blockW = Math.min(tankW * 0.24 + state.volumeM3 * 880, tankW * 0.38);
    const blockH = Math.min(tankH * 0.28 + state.volumeM3 * 760, tankH * 0.42);
    const blockX = tankX + tankW * 0.48 - blockW / 2;
    const floatTop = waterline - blockH * (1 - state.submergedFraction);
    const sinkTop = floorY - blockH;
    const blockY = state.floating ? floatTop : sinkTop;
    const submergedTop = Math.max(waterline, blockY);
    const submergedHeight = Math.max(0, blockY + blockH - submergedTop);
    const densityTone = state.floating ? "#a9ef78" : state.neutral ? "#f4c95d" : "#ff4df0";
    const surfaceWave = Math.sin(frame * 0.035) * 3;

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.42)";
    context.lineWidth = 3;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 12;
    roundedCanvasRect(context, tankX, tankY, tankW, tankH, 8);
    context.stroke();
    context.shadowBlur = 0;

    const fluidGradient = context.createLinearGradient(tankX, waterline, tankX + tankW, tankY + tankH);
    fluidGradient.addColorStop(0, "rgba(127, 248, 255, 0.28)");
    fluidGradient.addColorStop(0.62, "rgba(127, 248, 255, 0.14)");
    fluidGradient.addColorStop(1, "rgba(255, 77, 240, 0.08)");
    context.fillStyle = fluidGradient;
    roundedCanvasRect(context, tankX + 8, waterline, tankW - 16, tankY + tankH - waterline - 8, 7);
    context.fill();

    context.strokeStyle = "rgba(127, 248, 255, 0.72)";
    context.lineWidth = 2;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 9;
    context.beginPath();
    for (let i = 0; i <= 90; i += 1) {
      const x = tankX + 12 + (i / 90) * (tankW - 24);
      const y = waterline + Math.sin(i * 0.36 + frame * 0.045) * 3 + surfaceWave;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    context.shadowBlur = 0;

    context.save();
    context.beginPath();
    roundedCanvasRect(context, tankX + 8, waterline, tankW - 16, tankY + tankH - waterline - 8, 7);
    context.clip();
    context.fillStyle = "rgba(244, 201, 93, 0.18)";
    roundedCanvasRect(context, blockX, submergedTop, blockW, submergedHeight, 5);
    context.fill();
    context.restore();

    context.fillStyle = state.floating ? "rgba(169, 239, 120, 0.22)" : "rgba(255, 77, 240, 0.22)";
    context.strokeStyle = densityTone;
    context.lineWidth = 3;
    context.shadowColor = densityTone;
    context.shadowBlur = 18;
    roundedCanvasRect(context, blockX, blockY, blockW, blockH, 6);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;

    const centerX = blockX + blockW / 2;
    const centerY = blockY + blockH / 2;
    const forceScale = clamp(Math.max(state.weightN, state.buoyantForceN) / 65, 1.1, 6);
    drawArrow(context, centerX, centerY + 8, centerX, centerY + 8 - state.buoyantForceN / forceScale, "#7ff8ff", 4);
    drawArrow(context, centerX + blockW * 0.22, centerY - 8, centerX + blockW * 0.22, centerY - 8 + state.weightN / forceScale, "#ff4df0", 4);

    const panelX = width * 0.72;
    const panelY = height * 0.2;
    const panelW = width * 0.17;
    const panelH = height * 0.44;
    context.fillStyle = "rgba(4, 12, 18, 0.58)";
    context.strokeStyle = "rgba(127, 248, 255, 0.22)";
    roundedCanvasRect(context, panelX, panelY, panelW, panelH, 8);
    context.fill();
    context.stroke();
    const ratioY = panelY + panelH - clamp(state.densityRatio / 1.6, 0, 1) * panelH;
    context.strokeStyle = "rgba(233, 251, 255, 0.18)";
    context.beginPath();
    context.moveTo(panelX + panelW * 0.5, panelY + 12);
    context.lineTo(panelX + panelW * 0.5, panelY + panelH - 12);
    context.stroke();
    context.fillStyle = densityTone;
    context.shadowColor = densityTone;
    context.shadowBlur = 14;
    context.beginPath();
    context.arc(panelX + panelW * 0.5, ratioY, 8, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(169, 239, 120, 0.58)";
    context.setLineDash([6, 7]);
    context.beginPath();
    context.moveTo(panelX + 18, panelY + panelH * (1 - 1 / 1.6));
    context.lineTo(panelX + panelW - 18, panelY + panelH * (1 - 1 / 1.6));
    context.stroke();
    context.setLineDash([]);

    if (labelsVisible) {
      drawSceneLabel(context, "Fluid Density", tankX + tankW * 0.07, waterline + 34, tankX + tankW * 0.24, waterline + tankH * 0.22, "#7ff8ff");
      drawSceneLabel(context, "Object", clamp(blockX + blockW + 18, 12, width - 92), clamp(blockY + 8, 28, height - 40), centerX, centerY, densityTone);
      drawSceneLabel(context, "Displaced Volume", clamp(blockX - 120, 12, width - 134), clamp(submergedTop + submergedHeight * 0.42, 28, height - 40), blockX, submergedTop + submergedHeight * 0.5, "#f4c95d");
      drawSceneLabel(context, "Buoyant Force", clamp(centerX - 132, 12, width - 130), clamp(centerY - state.buoyantForceN / forceScale - 26, 28, height - 40), centerX, centerY - state.buoyantForceN / forceScale, "#7ff8ff");
      drawSceneLabel(context, "Weight", clamp(centerX + blockW * 0.22 + 18, 12, width - 94), clamp(centerY + state.weightN / forceScale, 28, height - 40), centerX + blockW * 0.22, centerY + state.weightN / forceScale, "#ff4df0");
      drawSceneLabel(context, "Density Ratio", panelX - 64, ratioY - 8, panelX + panelW * 0.5, ratioY, densityTone);
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(state.fluidDensity, 0)} kg/m3`, tankX + tankW * 0.07, waterline + 34, tankX + tankW * 0.24, waterline + tankH * 0.22, "#7ff8ff");
      drawSceneLabel(context, `${format(state.objectDensity, 0)} kg/m3`, clamp(blockX + blockW + 18, 12, width - 124), clamp(blockY + 8, 28, height - 40), centerX, centerY, densityTone);
      drawSceneLabel(context, `${format(state.displacedVolumeL, 2)} L`, clamp(blockX - 96, 12, width - 108), clamp(submergedTop + submergedHeight * 0.42, 28, height - 40), blockX, submergedTop + submergedHeight * 0.5, "#f4c95d");
      drawSceneLabel(context, `${format(state.buoyantForceN, 1)} N`, clamp(centerX - 108, 12, width - 112), clamp(centerY - state.buoyantForceN / forceScale - 26, 28, height - 40), centerX, centerY - state.buoyantForceN / forceScale, "#7ff8ff");
      drawSceneLabel(context, `${format(state.weightN, 1)} N`, clamp(centerX + blockW * 0.22 + 18, 12, width - 88), clamp(centerY + state.weightN / forceScale, 28, height - 40), centerX + blockW * 0.22, centerY + state.weightN / forceScale, "#ff4df0");
    }
    context.restore();
    return;
  }

  if (kind === "hydrostatic") {
    const density = Math.max(1, params.fluidDensity);
    const depth = Math.max(0, params.depth);
    const gravity = Math.max(0.1, params.gravity);
    const surfacePressureKpa = Math.max(0, params.surfacePressure);
    const gaugeKpa = (density * gravity * depth) / 1000;
    const absoluteKpa = surfacePressureKpa + gaugeKpa;
    const forceKn = absoluteKpa;
    const tankX = width * 0.18;
    const tankY = height * 0.12;
    const tankW = width * 0.48;
    const tankH = height * 0.72;
    const fluidTop = tankY + tankH * 0.13;
    const fluidBottom = tankY + tankH - 12;
    const fluidH = fluidBottom - fluidTop;
    const depthFraction = clamp(depth / 30, 0, 1);
    const probeY = fluidTop + fluidH * depthFraction;
    const pressureTone = absoluteKpa > 300 ? "#ff4df0" : absoluteKpa > 160 ? "#f4c95d" : "#7ff8ff";

    context.save();
    context.strokeStyle = "rgba(127, 248, 255, 0.42)";
    context.lineWidth = 3;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 12;
    roundedCanvasRect(context, tankX, tankY, tankW, tankH, 8);
    context.stroke();
    context.shadowBlur = 0;

    const waterGradient = context.createLinearGradient(tankX, fluidTop, tankX, fluidBottom);
    waterGradient.addColorStop(0, "rgba(127, 248, 255, 0.22)");
    waterGradient.addColorStop(0.58, "rgba(57, 191, 255, 0.18)");
    waterGradient.addColorStop(1, "rgba(255, 77, 240, 0.16)");
    context.fillStyle = waterGradient;
    roundedCanvasRect(context, tankX + 8, fluidTop, tankW - 16, fluidH, 7);
    context.fill();

    context.strokeStyle = "rgba(127, 248, 255, 0.7)";
    context.lineWidth = 2;
    context.shadowColor = "#7ff8ff";
    context.shadowBlur = 8;
    context.beginPath();
    for (let i = 0; i <= 90; i += 1) {
      const x = tankX + 12 + (i / 90) * (tankW - 24);
      const y = fluidTop + Math.sin(i * 0.34 + frame * 0.045) * 2.8;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    context.shadowBlur = 0;

    for (let i = 0; i < 7; i += 1) {
      const y = fluidTop + fluidH * (i / 6);
      const fraction = i / 6;
      context.strokeStyle = `rgba(244, 201, 93, ${0.1 + fraction * 0.32})`;
      context.lineWidth = 2 + fraction * 2.4;
      context.beginPath();
      context.moveTo(tankX + 24, y);
      context.lineTo(tankX + tankW - 24, y);
      context.stroke();
    }

    context.setLineDash([7, 7]);
    context.strokeStyle = "rgba(233, 251, 255, 0.3)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(tankX + tankW + 28, fluidTop);
    context.lineTo(tankX + tankW + 28, probeY);
    context.stroke();
    context.setLineDash([]);
    drawArrow(context, tankX + tankW + 28, fluidTop + 8, tankX + tankW + 28, probeY - 8, "#f4c95d", 2.4);

    const probeX = tankX + tankW * 0.58;
    context.fillStyle = pressureTone;
    context.shadowColor = pressureTone;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(probeX, probeY, 11, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
    drawArrow(context, tankX + tankW * 0.22, probeY, probeX - 18, probeY, pressureTone, 3.4);
    drawArrow(context, tankX + tankW * 0.88, probeY, probeX + 18, probeY, pressureTone, 3.4);

    const gaugeX = width * 0.78;
    const gaugeY = height * 0.22;
    const gaugeR = Math.min(width, height) * 0.11;
    context.fillStyle = "rgba(4, 12, 18, 0.62)";
    context.strokeStyle = "rgba(127, 248, 255, 0.26)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(gaugeX, gaugeY, gaugeR, Math.PI * 0.8, Math.PI * 2.2);
    context.stroke();
    context.beginPath();
    context.arc(gaugeX, gaugeY, gaugeR * 0.78, 0, TAU);
    context.fill();
    context.stroke();
    const needleAngle = Math.PI * 0.78 + clamp(absoluteKpa / 420, 0, 1) * Math.PI * 1.44;
    drawArrow(
      context,
      gaugeX,
      gaugeY,
      gaugeX + Math.cos(needleAngle) * gaugeR * 0.72,
      gaugeY + Math.sin(needleAngle) * gaugeR * 0.72,
      pressureTone,
      3,
    );
    context.fillStyle = "#e9fbff";
    context.font = '900 11px "Proxima Nova", "Source Sans 3", sans-serif';
    context.fillText("kPa", gaugeX - 12, gaugeY + gaugeR * 0.46);

    const barX = width * 0.78;
    const barY = height * 0.5;
    const barW = width * 0.13;
    const barH = height * 0.28;
    context.fillStyle = "rgba(4, 12, 18, 0.58)";
    context.strokeStyle = "rgba(127, 248, 255, 0.2)";
    roundedCanvasRect(context, barX, barY, barW, barH, 8);
    context.fill();
    context.stroke();
    [
      { value: surfacePressureKpa, color: "#7ff8ff" },
      { value: gaugeKpa, color: "#f4c95d" },
      { value: absoluteKpa, color: pressureTone },
    ].forEach((bar, index) => {
      const x = barX + barW * (0.2 + index * 0.25);
      const h = clamp(bar.value / 420, 0, 1) * barH * 0.72;
      context.fillStyle = bar.color;
      roundedCanvasRect(context, x, barY + barH - 18 - h, 15, h, 4);
      context.fill();
    });

    if (labelsVisible) {
      drawSceneLabel(context, "Free Surface", tankX + 26, fluidTop - 32, tankX + tankW * 0.28, fluidTop, "#7ff8ff");
      drawSceneLabel(context, "Depth", tankX + tankW + 40, (fluidTop + probeY) / 2 - 12, tankX + tankW + 28, probeY, "#f4c95d");
      drawSceneLabel(context, "Pressure Probe", clamp(probeX + 24, 12, width - 132), clamp(probeY - 18, 28, height - 40), probeX, probeY, pressureTone);
      drawSceneLabel(context, "Absolute Pressure", gaugeX - 54, gaugeY - gaugeR - 24, gaugeX, gaugeY, pressureTone);
      drawSceneLabel(context, "Pressure Stack", barX - 72, barY + 22, barX + barW * 0.55, barY + barH * 0.5, "#a9ef78");
    }
    if (valuesVisible) {
      drawSceneLabel(context, `${format(surfacePressureKpa, 1)} kPa`, tankX + 26, fluidTop - 32, tankX + tankW * 0.28, fluidTop, "#7ff8ff");
      drawSceneLabel(context, `${format(depth, 1)} m`, tankX + tankW + 40, (fluidTop + probeY) / 2 - 12, tankX + tankW + 28, probeY, "#f4c95d");
      drawSceneLabel(context, `${format(gaugeKpa, 1)} kPa`, clamp(probeX + 24, 12, width - 112), clamp(probeY - 18, 28, height - 40), probeX, probeY, pressureTone);
      drawSceneLabel(context, `${format(absoluteKpa, 1)} kPa`, gaugeX - 54, gaugeY - gaugeR - 24, gaugeX, gaugeY, pressureTone);
      drawSceneLabel(context, `${format(forceKn, 1)} kN/m2`, barX - 78, barY + 22, barX + barW * 0.55, barY + barH * 0.5, "#a9ef78");
    }
    context.restore();
    return;
  }
}

function MicroCanvas({
  kind,
  params,
  paused,
  viewMode,
  labelsVisible,
  valuesVisible,
}: {
  kind: MicroKind;
  params: Params;
  paused: boolean;
  viewMode: ViewMode;
  labelsVisible: boolean;
  valuesVisible: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latest = useRef({ kind, params, paused, viewMode, labelsVisible, valuesVisible });

  useEffect(() => {
    latest.current = { kind, params, paused, viewMode, labelsVisible, valuesVisible };
  }, [kind, params, paused, viewMode, labelsVisible, valuesVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    let frame = 0;
    let animationId = 0;
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      const current = latest.current;
      if (!current.paused) frame += 1;
      drawMicroScene(
        context,
        canvas.clientWidth,
        canvas.clientHeight,
        current.kind,
        current.params,
        frame,
        current.viewMode,
        current.labelsVisible,
        current.valuesVisible,
      );
    };
    draw();
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return <canvas className="sceneMount canvasScene microScene" ref={canvasRef} aria-label={`${kind} Visualizer`} />;
}

function vectorState(params: Params) {
  const ax = params.magA * Math.cos(degToRad(params.angleA));
  const ay = params.magA * Math.sin(degToRad(params.angleA));
  const bx = params.magB * Math.cos(degToRad(params.angleB));
  const by = params.magB * Math.sin(degToRad(params.angleB));
  const rx = ax + bx;
  const ry = ay + by;
  return { ax, ay, bx, by, rx, ry, mag: Math.hypot(rx, ry), angle: (Math.atan2(ry, rx) * 180) / Math.PI };
}

function matrixTransformState(params: Params) {
  const a = params.a;
  const b = params.b;
  const c = params.c;
  const d = params.d;
  const x = params.x;
  const y = params.y;
  const tx = a * x + b * y;
  const ty = c * x + d * y;
  const det = a * d - b * c;
  const trace = a + d;
  const inputMag = Math.hypot(x, y);
  const outputMag = Math.hypot(tx, ty);
  return {
    a,
    b,
    c,
    d,
    x,
    y,
    tx,
    ty,
    det,
    trace,
    inputMag,
    outputMag,
    areaScale: Math.abs(det),
    orientation: det >= 0 ? "Preserved" : "Flipped",
  };
}

function dotProductState(params: Params) {
  const ax = params.ax;
  const ay = params.ay;
  const bx = params.bx;
  const by = params.by;
  const dot = ax * bx + ay * by;
  const magA = Math.hypot(ax, ay);
  const magB = Math.hypot(bx, by);
  const cosTheta = magA * magB > 1e-8 ? clamp(dot / (magA * magB), -1, 1) : 0;
  const theta = (Math.acos(cosTheta) * 180) / Math.PI;
  const projectionScalar = magB > 1e-8 ? dot / (magB * magB) : 0;
  const projX = projectionScalar * bx;
  const projY = projectionScalar * by;
  return {
    ax,
    ay,
    bx,
    by,
    dot,
    magA,
    magB,
    cosTheta,
    theta,
    projectionScalar,
    projX,
    projY,
    projLength: Math.hypot(projX, projY),
  };
}

function linearSystemState(params: Params) {
  const a1 = params.a1;
  const b1 = params.b1;
  const c1 = params.c1;
  const a2 = params.a2;
  const b2 = params.b2;
  const c2 = params.c2;
  const det = a1 * b2 - a2 * b1;
  const parallel = Math.abs(det) <= 1e-6;
  const x = parallel ? 0 : (c1 * b2 - c2 * b1) / det;
  const y = parallel ? 0 : (a1 * c2 - a2 * c1) / det;
  const residual1 = a1 * x + b1 * y - c1;
  const residual2 = a2 * x + b2 * y - c2;
  return { a1, b1, c1, a2, b2, c2, det, x, y, parallel, residual1, residual2 };
}

function eigenState(params: Params) {
  const a = params.a;
  const b = params.b;
  const d = params.d;
  const theta = degToRad(params.vectorAngle);
  const x = Math.cos(theta);
  const y = Math.sin(theta);
  const tx = a * x + b * y;
  const ty = b * x + d * y;
  const trace = a + d;
  const det = a * d - b * b;
  const delta = Math.sqrt(Math.max(0, (a - d) ** 2 + 4 * b * b));
  const lambda1 = (trace + delta) / 2;
  const lambda2 = (trace - delta) / 2;
  const eigAngle1 = Math.abs(b) > 1e-6 || Math.abs(lambda1 - a) > 1e-6 ? Math.atan2(lambda1 - a, b) : 0;
  const eigAngle2 = eigAngle1 + Math.PI / 2;
  const cross = x * ty - y * tx;
  const aligned = Math.abs(cross) / Math.max(Math.hypot(tx, ty), 1e-6);
  const stretch = Math.hypot(tx, ty);
  return { a, b, d, x, y, tx, ty, trace, det, lambda1, lambda2, eigAngle1, eigAngle2, aligned, stretch };
}

function projectileState(params: Params) {
  const angle = degToRad(params.angle);
  const g = Math.max(0.1, params.gravity);
  const vx = Math.max(0.01, params.velocity * Math.cos(angle));
  const vy = Math.max(0.01, params.velocity * Math.sin(angle));
  const restitution = clamp(params.restitution ?? 0.55, 0, 0.92);
  const rollingFriction = clamp(params.rollingFriction ?? 0.035, 0.004, 0.14);
  const firstFlightTime = (2 * vy) / g;
  const firstRange = vx * firstFlightTime;
  const maxHeight = (vy * vy) / (2 * g);
  const firstBounceHeight = maxHeight * restitution * restitution;
  const rollingDeceleration = rollingFriction * g;
  const rollStopDistance = (vx * vx) / (2 * rollingDeceleration);
  const rollStopTime = vx / rollingDeceleration;
  return {
    angle,
    g,
    vx,
    vy,
    restitution,
    rollingFriction,
    firstFlightTime,
    firstRange,
    maxHeight,
    firstBounceHeight,
    rollingDeceleration,
    rollStopDistance,
    rollStopTime,
  };
}

function acidBaseState(params: Params) {
  const acidMoles = params.acidMolarity * (params.acidVolumeMl / 1000);
  const baseMoles = params.baseMolarity * (params.baseAddedMl / 1000);
  const totalVolumeL = Math.max(0.001, (params.acidVolumeMl + params.baseAddedMl) / 1000);
  const excessMoles = acidMoles - baseMoles;
  const equivalenceVolumeMl = (params.acidMolarity * params.acidVolumeMl) / Math.max(params.baseMolarity, 0.001);
  const neutralizedFraction = acidMoles > 0 ? clamp(Math.min(acidMoles, baseMoles) / acidMoles, 0, 1) : 1;
  const excessConcentration = Math.abs(excessMoles) / totalVolumeL;
  let pH = 7;
  if (excessMoles > 1e-10) pH = -Math.log10(Math.max(excessConcentration, 1e-14));
  else if (excessMoles < -1e-10) pH = 14 + Math.log10(Math.max(excessConcentration, 1e-14));
  return {
    acidMoles,
    baseMoles,
    totalVolumeL,
    excessMoles,
    equivalenceVolumeMl,
    neutralizedFraction,
    excessConcentration,
    pH: clamp(pH, 0, 14),
  };
}

function dilutionState(params: Params) {
  const stockMolarity = Math.max(0.001, params.stockMolarity);
  const aliquotMl = Math.max(0.1, params.aliquotMl);
  const finalVolumeMl = Math.max(aliquotMl, params.finalVolumeMl);
  const finalMolarity = (stockMolarity * aliquotMl) / finalVolumeMl;
  const dilutionFactor = finalVolumeMl / aliquotMl;
  const soluteMmol = stockMolarity * aliquotMl;
  const solventAddedMl = Math.max(0, finalVolumeMl - aliquotMl);
  return { stockMolarity, aliquotMl, finalVolumeMl, finalMolarity, dilutionFactor, soluteMmol, solventAddedMl };
}

function stoichiometryState(params: Params) {
  const molesA = Math.max(0, params.molesA);
  const molesB = Math.max(0, params.molesB);
  const coeffA = Math.max(1, Math.round(params.coeffA));
  const coeffB = Math.max(1, Math.round(params.coeffB));
  const coeffP = Math.max(1, Math.round(params.coeffP));
  const extentA = molesA / coeffA;
  const extentB = molesB / coeffB;
  const extent = Math.min(extentA, extentB);
  const limiting = Math.abs(extentA - extentB) < 0.01 ? "Tie" : extentA < extentB ? "A" : "B";
  const productMoles = coeffP * extent;
  const consumedA = coeffA * extent;
  const consumedB = coeffB * extent;
  const excessA = Math.max(0, molesA - consumedA);
  const excessB = Math.max(0, molesB - consumedB);
  const excessMoles = excessA + excessB;
  const yieldRatio = clamp(productMoles / Math.max(coeffP * Math.max(extentA, extentB), 0.001), 0, 1);
  return {
    molesA,
    molesB,
    coeffA,
    coeffB,
    coeffP,
    extentA,
    extentB,
    extent,
    limiting,
    productMoles,
    consumedA,
    consumedB,
    excessA,
    excessB,
    excessMoles,
    yieldRatio,
  };
}

function idealGasState(params: Params) {
  const volumeL = Math.max(0.2, params.volumeL);
  const temperatureK = Math.max(1, params.temperatureK);
  const amountMol = Math.max(0.001, params.amountMol);
  const gasConstant = 8.314462618;
  const pressureKpa = (amountMol * gasConstant * temperatureK) / volumeL;
  const speedIndex = Math.sqrt(temperatureK / 300);
  const thermalEnergyJ = 1.5 * amountMol * gasConstant * temperatureK;
  return { volumeL, temperatureK, amountMol, gasConstant, pressureKpa, speedIndex, thermalEnergyJ };
}

function kineticsState(params: Params) {
  const initial = Math.max(0.001, params.initialConcentration);
  const rateConstant = Math.max(0.001, params.rateConstant);
  const time = Math.max(0, params.time);
  const reactant = initial * Math.exp(-rateConstant * time);
  const product = Math.max(0, initial - reactant);
  const halfLife = Math.LN2 / rateConstant;
  const completion = clamp(product / initial, 0, 1);
  const reactantFraction = clamp(reactant / initial, 0, 1);
  const maxTime = Math.max(1, halfLife * 4);
  const timeFraction = clamp(time / maxTime, 0, 1);
  const initialRate = rateConstant * initial;
  return { initial, rateConstant, time, reactant, product, halfLife, completion, reactantFraction, maxTime, timeFraction, initialRate };
}

function unitCircleState(params: Params) {
  const radians = degToRad(params.angle);
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const tan = Math.abs(cos) < 0.001 ? Math.sign(sin) * 99 : sin / cos;
  return { radians, theta: radians, sin, cos, tan };
}

function pythagoreanState(params: Params) {
  const a = Math.max(0.1, params.legA);
  const b = Math.max(0.1, params.legB);
  const c = Math.hypot(a, b);
  const areaA = a * a;
  const areaB = b * b;
  const areaC = c * c;
  const angleC = Math.atan2(b, a);
  const angleDeg = (angleC * 180) / Math.PI;
  const perimeter = a + b + c;
  const triangleArea = 0.5 * a * b;
  return { a, b, c, areaA, areaB, areaC, angleC, angleDeg, perimeter, triangleArea };
}

function binomialCoefficient(nValue: number, kValue: number) {
  const nInt = Math.round(nValue);
  const kInt = Math.min(Math.round(kValue), nInt - Math.round(kValue));
  if (kInt < 0) return 0;
  let result = 1;
  for (let i = 1; i <= kInt; i += 1) {
    result *= (nInt - kInt + i) / i;
  }
  return result;
}

function binomialState(params: Params) {
  const nTrials = Math.round(clamp(params.trials, 1, 40));
  const p = clamp(params.probability, 0.001, 0.999);
  const k = Math.round(clamp(params.successes, 0, nTrials));
  const points = Array.from({ length: nTrials + 1 }, (_, outcome) => ({
    k: outcome,
    probability: binomialCoefficient(nTrials, outcome) * p ** outcome * (1 - p) ** (nTrials - outcome),
  }));
  const selectedProbability = points[k]?.probability ?? 0;
  const cumulativeProbability = points
    .slice(0, k + 1)
    .reduce((sum, point) => sum + point.probability, 0);
  const mean = nTrials * p;
  const variance = nTrials * p * (1 - p);
  const sigma = Math.sqrt(variance);
  const mode = Math.floor((nTrials + 1) * p);
  return { n: nTrials, p, k, points, selectedProbability, cumulativeProbability, mean, variance, sigma, mode };
}

function exponentialState(params: Params) {
  const initial = Math.max(0.001, params.initialValue);
  const rate = clamp(params.rate, -0.8, 0.8);
  const time = clamp(params.time, 0, 20);
  const multiplier = Math.exp(rate * time);
  const current = initial * multiplier;
  const slope = rate * current;
  const characteristicTime = Math.abs(rate) > 0.001 ? Math.LN2 / Math.abs(rate) : Number.POSITIVE_INFINITY;
  const mode = rate > 0.001 ? "Doubling Time" : rate < -0.001 ? "Half-Life" : "Flat";
  return { initial, rate, time, multiplier, current, slope, characteristicTime, mode };
}

function buoyancyState(params: Params) {
  const objectDensity = Math.max(1, params.objectDensity);
  const fluidDensity = Math.max(1, params.fluidDensity);
  const volumeL = Math.max(0.01, params.volumeL);
  const gravity = Math.max(0.1, params.gravity);
  const volumeM3 = volumeL / 1000;
  const massKg = objectDensity * volumeM3;
  const weightN = massKg * gravity;
  const densityRatio = objectDensity / fluidDensity;
  const submergedFraction = clamp(densityRatio, 0, 1);
  const displacedVolumeM3 = volumeM3 * submergedFraction;
  const displacedVolumeL = displacedVolumeM3 * 1000;
  const buoyantForceN = fluidDensity * gravity * displacedVolumeM3;
  const netForceN = buoyantForceN - weightN;
  const floating = objectDensity < fluidDensity * 0.995;
  const neutral = Math.abs(densityRatio - 1) <= 0.005;
  const status = floating ? "Floating" : neutral ? "Neutral" : "Sinking";
  return {
    objectDensity,
    fluidDensity,
    volumeL,
    gravity,
    volumeM3,
    massKg,
    weightN,
    densityRatio,
    submergedFraction,
    displacedVolumeM3,
    displacedVolumeL,
    buoyantForceN,
    netForceN,
    floating,
    neutral,
    status,
  };
}

function newtonSecondState(params: Params) {
  const mass = Math.max(0.1, params.mass);
  const appliedForce = params.appliedForce;
  const frictionCoefficient = clamp(params.frictionCoefficient, 0, 1);
  const time = Math.max(0, params.time);
  const gravity = 9.8;
  const normalForce = mass * gravity;
  const maxFriction = frictionCoefficient * normalForce;
  const moving = Math.abs(appliedForce) > maxFriction;
  const frictionForce = moving ? -Math.sign(appliedForce) * maxFriction : -appliedForce;
  const netForce = appliedForce + frictionForce;
  const acceleration = netForce / mass;
  const velocity = acceleration * time;
  const displacement = 0.5 * acceleration * time * time;
  const momentum = mass * velocity;
  return {
    mass,
    appliedForce,
    frictionCoefficient,
    time,
    gravity,
    normalForce,
    maxFriction,
    moving,
    frictionForce,
    netForce,
    acceleration,
    velocity,
    displacement,
    momentum,
  };
}

function workEnergyState(params: Params) {
  const mass = Math.max(0.1, params.mass);
  const force = params.force;
  const displacement = Math.max(0, params.displacement);
  const forceAngleDeg = params.forceAngle;
  const forceAngle = degToRad(forceAngleDeg);
  const frictionCoefficient = clamp(params.frictionCoefficient, 0, 0.8);
  const initialSpeed = Math.max(0, params.initialSpeed);
  const initialKineticJ = 0.5 * mass * initialSpeed * initialSpeed;
  const appliedWorkJ = force * displacement * Math.cos(forceAngle);
  const normalForce = mass * 9.8;
  const frictionMagnitudeN = frictionCoefficient * normalForce;
  const frictionWorkJ = displacement > 0 ? -frictionMagnitudeN * displacement : 0;
  const netWorkJ = appliedWorkJ + frictionWorkJ;
  const finalKineticJ = Math.max(0, initialKineticJ + netWorkJ);
  const deltaKineticJ = finalKineticJ - initialKineticJ;
  const finalSpeed = Math.sqrt((2 * finalKineticJ) / mass);
  const efficiency = appliedWorkJ > 0 ? clamp(deltaKineticJ / appliedWorkJ, 0, 1) : 0;
  return {
    mass,
    force,
    displacement,
    forceAngleDeg,
    forceAngle,
    frictionCoefficient,
    initialSpeed,
    initialKineticJ,
    appliedWorkJ,
    normalForce,
    frictionMagnitudeN,
    frictionWorkJ,
    netWorkJ,
    finalKineticJ,
    deltaKineticJ,
    finalSpeed,
    efficiency,
  };
}

function snellState(params: Params) {
  const n1 = Math.max(1, params.n1);
  const n2 = Math.max(1, params.n2);
  const incidentAngleDeg = clamp(params.incidentAngle, 0, 89);
  const incidentRad = degToRad(incidentAngleDeg);
  const sinTransmit = (n1 / n2) * Math.sin(incidentRad);
  const totalInternalReflection = sinTransmit > 1;
  const refractedRad = totalInternalReflection ? 0 : Math.asin(clamp(sinTransmit, -1, 1));
  const refractedAngleDeg = totalInternalReflection ? 90 : (refractedRad * 180) / Math.PI;
  const criticalAngleDeg = n1 > n2 ? (Math.asin(clamp(n2 / n1, 0, 1)) * 180) / Math.PI : Number.POSITIVE_INFINITY;
  const r0 = ((n1 - n2) / (n1 + n2)) ** 2;
  const reflectance = totalInternalReflection ? 1 : clamp(r0 + (1 - r0) * (1 - Math.cos(incidentRad)) ** 5, 0, 1);
  const transmission = 1 - reflectance;
  const wavelengthVacuumNm = Math.max(380, params.wavelength);
  const wavelength1Nm = wavelengthVacuumNm / n1;
  const wavelength2Nm = wavelengthVacuumNm / n2;
  const speedRatio = n1 / n2;
  const bendDeg = totalInternalReflection ? 0 : refractedAngleDeg - incidentAngleDeg;
  return {
    n1,
    n2,
    incidentAngleDeg,
    incidentRad,
    refractedRad,
    refractedAngleDeg,
    criticalAngleDeg,
    totalInternalReflection,
    reflectance,
    transmission,
    wavelengthVacuumNm,
    wavelength1Nm,
    wavelength2Nm,
    speedRatio,
    bendDeg,
  };
}

function thinLensState(params: Params) {
  const focalLength = Math.abs(params.focalLength) < 1 ? (params.focalLength < 0 ? -1 : 1) : params.focalLength;
  const objectDistance = Math.max(4, params.objectDistance);
  const objectHeight = Math.max(1, params.objectHeight);
  const aperture = Math.max(2, params.aperture);
  const denominator = 1 / focalLength - 1 / objectDistance;
  const imageDistance = Math.abs(denominator) < 0.002 ? Math.sign(denominator || 1) * 500 : 1 / denominator;
  const magnification = -imageDistance / objectDistance;
  const imageHeight = magnification * objectHeight;
  const realImage = imageDistance > 0;
  const converging = focalLength > 0;
  const imageType = realImage ? "Real, Inverted" : "Virtual, Upright";
  const finiteImageDistance = Math.abs(imageDistance) > 420 ? Math.sign(imageDistance) * 420 : imageDistance;
  return {
    focalLength,
    objectDistance,
    objectHeight,
    aperture,
    imageDistance,
    finiteImageDistance,
    magnification,
    imageHeight,
    realImage,
    converging,
    imageType,
    opticalPower: 100 / focalLength,
  };
}

function coolingState(params: Params) {
  const initialTemp = params.initialTemp;
  const ambientTemp = params.ambientTemp;
  const coolingConstant = Math.max(0.001, params.coolingConstant);
  const thermalMass = Math.max(0.2, params.thermalMass);
  const time = Math.max(0, params.time);
  const effectiveK = coolingConstant / thermalMass;
  const initialGap = initialTemp - ambientTemp;
  const currentTemp = ambientTemp + initialGap * Math.exp(-effectiveK * time);
  const gap = currentTemp - ambientTemp;
  const rateDegPerMin = -effectiveK * gap;
  const halfTimeMin = Math.LN2 / effectiveK;
  const equilibriumFraction = initialGap === 0 ? 1 : clamp(1 - Math.abs(gap / initialGap), 0, 1);
  const heatFlowIndex = Math.abs(rateDegPerMin) * thermalMass;
  return {
    initialTemp,
    ambientTemp,
    coolingConstant,
    thermalMass,
    time,
    effectiveK,
    initialGap,
    currentTemp,
    gap,
    rateDegPerMin,
    halfTimeMin,
    equilibriumFraction,
    heatFlowIndex,
  };
}

function standingWaveState(params: Params) {
  const length = Math.max(0.2, params.length);
  const tension = Math.max(1, params.tension);
  const linearDensity = Math.max(0.001, params.linearDensity) / 1000;
  const harmonic = Math.max(1, Math.round(params.harmonic));
  const amplitude = Math.max(0, params.amplitude);
  const waveSpeed = Math.sqrt(tension / linearDensity);
  const wavelength = (2 * length) / harmonic;
  const frequency = waveSpeed / wavelength;
  const angularFrequency = TAU * frequency;
  const nodeSpacing = length / harmonic;
  const antinodeCount = harmonic;
  return {
    length,
    tension,
    linearDensity,
    harmonic,
    amplitude,
    waveSpeed,
    wavelength,
    frequency,
    angularFrequency,
    nodeSpacing,
    antinodeCount,
  };
}

function carnotState(params: Params) {
  const hotK = Math.max(1, params.hotTemperature);
  const coldK = Math.min(Math.max(1, params.coldTemperature), hotK - 1);
  const heatInput = Math.max(1, params.heatInput);
  const efficiency = clamp(1 - coldK / hotK, 0, 0.98);
  const workOutput = efficiency * heatInput;
  const rejectedHeat = heatInput - workOutput;
  const temperatureRatio = coldK / hotK;
  const phase = ((params.cyclePhase % 360) + 360) % 360;
  return {
    hotK,
    coldK,
    heatInput,
    efficiency,
    workOutput,
    rejectedHeat,
    temperatureRatio,
    phase,
  };
}

function rcState(params: Params) {
  const sourceVoltage = Math.max(0.1, params.sourceVoltage);
  const resistanceKohm = Math.max(0.1, params.resistance);
  const capacitanceUf = Math.max(0.1, params.capacitance);
  const timeMs = Math.max(0, params.time);
  const resistanceOhm = resistanceKohm * 1000;
  const capacitanceF = capacitanceUf * 1e-6;
  const tauS = Math.max(1e-6, resistanceOhm * capacitanceF);
  const tauMs = tauS * 1000;
  const tS = timeMs / 1000;
  const expTerm = Math.exp(-tS / tauS);
  const capacitorVoltage = sourceVoltage * (1 - expTerm);
  const resistorVoltage = sourceVoltage - capacitorVoltage;
  const currentA = (sourceVoltage / resistanceOhm) * expTerm;
  const chargeC = capacitanceF * capacitorVoltage;
  const energyJ = 0.5 * capacitanceF * capacitorVoltage * capacitorVoltage;
  return {
    sourceVoltage,
    resistanceKohm,
    capacitanceUf,
    timeMs,
    resistanceOhm,
    capacitanceF,
    tauS,
    tauMs,
    tS,
    expTerm,
    capacitorVoltage,
    resistorVoltage,
    currentA,
    currentMa: currentA * 1000,
    chargeUc: chargeC * 1e6,
    energyMj: energyJ * 1000,
    chargedFraction: clamp(capacitorVoltage / sourceVoltage, 0, 1),
  };
}

function coulombState(params: Params) {
  const q1MicroC = params.q1;
  const q2MicroC = params.q2;
  const separationCm = Math.max(1, params.separation);
  const probePositionCm = params.probePosition;
  const relativePermittivity = Math.max(1, params.relativePermittivity);
  const k = 8.9875517923e9 / relativePermittivity;
  const q1 = q1MicroC * 1e-6;
  const q2 = q2MicroC * 1e-6;
  const separationM = separationCm / 100;
  const forceSigned = (k * q1 * q2) / (separationM * separationM);
  const forceMagnitudeN = Math.abs(forceSigned);
  const potentialEnergyJ = (k * q1 * q2) / separationM;
  const q1X = -separationM / 2;
  const q2X = separationM / 2;
  const probeX = probePositionCm / 100;
  const minDistance = 0.008;
  const fieldContribution = (charge: number, sourceX: number) => {
    const dx = probeX - sourceX;
    const distance = Math.max(minDistance, Math.abs(dx));
    return (k * charge * Math.sign(dx || 1)) / (distance * distance);
  };
  const potentialContribution = (charge: number, sourceX: number) => {
    const distance = Math.max(minDistance, Math.abs(probeX - sourceX));
    return (k * charge) / distance;
  };
  const fieldAtProbe = fieldContribution(q1, q1X) + fieldContribution(q2, q2X);
  const potentialAtProbe = potentialContribution(q1, q1X) + potentialContribution(q2, q2X);
  const interaction = q1MicroC * q2MicroC >= 0 ? "Repulsion" : "Attraction";
  return {
    q1MicroC,
    q2MicroC,
    separationCm,
    probePositionCm,
    relativePermittivity,
    k,
    q1,
    q2,
    separationM,
    forceSigned,
    forceMagnitudeN,
    potentialEnergyJ,
    fieldAtProbe,
    potentialAtProbe,
    interaction,
  };
}

function gravityFieldState(params: Params) {
  const G = 6.6743e-11;
  const mass1Earth = Math.max(0.001, params.mass1);
  const mass2Earth = Math.max(0.001, params.mass2);
  const separationMm = Math.max(2, params.separation);
  const probePositionMm = params.probePosition;
  const mass1 = mass1Earth * 5.972e24;
  const mass2 = mass2Earth * 5.972e24;
  const separationM = separationMm * 1e6;
  const probeX = probePositionMm * 1e6;
  const source1X = -separationM / 2;
  const source2X = separationM / 2;
  const forceN = (G * mass1 * mass2) / (separationM * separationM);
  const potentialEnergyJ = (-G * mass1 * mass2) / separationM;
  const minDistance = 0.25e6;
  const fieldContribution = (mass: number, sourceX: number) => {
    const dx = sourceX - probeX;
    const distance = Math.max(minDistance, Math.abs(dx));
    return (G * mass * Math.sign(dx || 1)) / (distance * distance);
  };
  const potentialContribution = (mass: number, sourceX: number) => {
    const distance = Math.max(minDistance, Math.abs(sourceX - probeX));
    return (-G * mass) / distance;
  };
  const fieldAtProbe = fieldContribution(mass1, source1X) + fieldContribution(mass2, source2X);
  const potentialAtProbe = potentialContribution(mass1, source1X) + potentialContribution(mass2, source2X);
  const barycenterFromMass1Mm = (separationMm * mass2) / (mass1 + mass2);
  const barycenterXMm = -separationMm / 2 + barycenterFromMass1Mm;
  const orbitalPeriodDays = (TAU * Math.sqrt((separationM ** 3) / (G * (mass1 + mass2)))) / 86400;
  const acceleration1 = forceN / mass1;
  const acceleration2 = forceN / mass2;
  return {
    G,
    mass1Earth,
    mass2Earth,
    mass1,
    mass2,
    separationMm,
    separationM,
    probePositionMm,
    forceN,
    potentialEnergyJ,
    fieldAtProbe,
    potentialAtProbe,
    barycenterXMm,
    orbitalPeriodDays,
    acceleration1,
    acceleration2,
  };
}

function wireFieldState(params: Params) {
  const mu0 = 4 * Math.PI * 1e-7;
  const current = params.current;
  const radiusM = Math.max(0.003, params.probeRadius / 100);
  const relativePermeability = Math.max(0.2, params.relativePermeability);
  const earthFieldT = Math.max(1e-7, params.earthField * 1e-6);
  const mu = mu0 * relativePermeability;
  const fieldT = (mu * current) / (2 * Math.PI * radiusM);
  const fieldMicroT = fieldT * 1e6;
  const compassDeflectionDeg = (Math.atan2(fieldT, earthFieldT) * 180) / Math.PI;
  const energyDensity = (fieldT * fieldT) / (2 * mu);
  const direction = current >= 0 ? "CCW" : "CW";
  const wireRadiusMm = Math.max(0.5, params.wireRadius);
  return {
    mu0,
    mu,
    current,
    radiusM,
    relativePermeability,
    earthFieldT,
    fieldT,
    fieldMicroT,
    compassDeflectionDeg,
    energyDensity,
    direction,
    wireRadiusMm,
  };
}

function regressionState(params: Params) {
  const count = Math.round(clamp(params.sampleSize, 6, 60));
  const points = Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0 : index / (count - 1);
    const jitter = Math.sin(index * 12.9898 + params.noise * 0.81) * 0.32;
    const x = 0.4 + t * 9.2 + jitter;
    const noise = (Math.sin(index * 5.31 + 1.7) + Math.cos(index * 2.17 + 0.4)) * 0.5 * params.noise;
    const y = params.trueSlope * x + params.trueIntercept + noise;
    return { x, y };
  });
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / count;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / count;
  const sxx = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const sxy = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const slope = sxx > 1e-8 ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;
  const residuals = points.map((point) => ({ ...point, yHat: intercept + slope * point.x, residual: point.y - (intercept + slope * point.x) }));
  const ssRes = residuals.reduce((sum, point) => sum + point.residual ** 2, 0);
  const ssTot = points.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const r2 = ssTot > 1e-8 ? clamp(1 - ssRes / ssTot, 0, 1) : 1;
  const rmse = Math.sqrt(ssRes / count);
  return { points: residuals, slope, intercept, ssRes, ssTot, r2, rmse, meanX, meanY };
}

function microValueCallouts(kind: MicroKind, params: Params): ValueCallout[] {
  if (kind === "matrixtransform") {
    const state = matrixTransformState(params);
    return [
      { math: String.raw`\det(A)=${n(state.det)}`, x: 68, y: 27, targetX: 63, targetY: 42, color: "#f4c95d" },
      { math: String.raw`A\vec{x}=(${n(state.tx)},${n(state.ty)})`, x: 54, y: 68, targetX: 58, targetY: 54, color: "#a9ef78" },
      { math: String.raw`|\vec{x}'|=${n(state.outputMag)}`, x: 20, y: 25, targetX: 50, targetY: 50, color: "#7ff8ff" },
      { math: String.raw`\mathrm{area}\times${n(state.areaScale)}`, x: 64, y: 43, targetX: 58, targetY: 42, color: "#ff4df0" },
    ];
  }

  if (kind === "dotproduct") {
    const state = dotProductState(params);
    return [
      { math: String.raw`\vec{a}\cdot\vec{b}=${n(state.dot)}`, x: 62, y: 28, targetX: 56, targetY: 48, color: "#a9ef78" },
      { math: String.raw`\theta=${n(state.theta, 1)}^\circ`, x: 62, y: 46, targetX: 52, targetY: 50, color: "#f4c95d" },
      { math: String.raw`\mathrm{proj}_{\vec b}\vec a`, x: 58, y: 66, targetX: 55, targetY: 55, color: "#f4c95d" },
      { math: String.raw`\cos\theta=${n(state.cosTheta, 2)}`, x: 22, y: 26, targetX: 45, targetY: 50, color: "#7ff8ff" },
    ];
  }

  if (kind === "linearsystem") {
    const state = linearSystemState(params);
    return [
      { math: state.parallel ? String.raw`\det(A)\approx0` : String.raw`x=${n(state.x)}`, x: 62, y: 30, targetX: 54, targetY: 48, color: "#f4c95d" },
      { math: state.parallel ? String.raw`\mathrm{parallel}` : String.raw`y=${n(state.y)}`, x: 62, y: 46, targetX: 54, targetY: 48, color: "#f4c95d" },
      { math: String.raw`\det(A)=${n(state.det)}`, x: 20, y: 25, targetX: 50, targetY: 50, color: "#a9ef78" },
      { math: String.raw`A\vec{x}=\vec{b}`, x: 20, y: 68, targetX: 40, targetY: 58, color: "#7ff8ff" },
    ];
  }

  if (kind === "eigenvectors") {
    const state = eigenState(params);
    return [
      { math: String.raw`\lambda_1=${n(state.lambda1)}`, x: 66, y: 24, targetX: 62, targetY: 38, color: "#f4c95d" },
      { math: String.raw`\lambda_2=${n(state.lambda2)}`, x: 66, y: 42, targetX: 40, targetY: 62, color: "#ff4df0" },
      { math: String.raw`|A\vec v|=${n(state.stretch)}`, x: 21, y: 28, targetX: 52, targetY: 45, color: "#a9ef78" },
      { math: String.raw`\det(A)=${n(state.det)}`, x: 20, y: 68, targetX: 50, targetY: 50, color: "#7ff8ff" },
    ];
  }

  if (kind === "vector") {
    const state = vectorState(params);
    return [
      { math: String.raw`|\vec{R}|=${n(state.mag)}`, x: 68, y: 30, targetX: 58, targetY: 47, color: "#f4c95d" },
      { math: String.raw`\theta=${n(state.angle, 0)}^\circ`, x: 68, y: 42, targetX: 58, targetY: 47, color: "#a9ef78" },
    ];
  }

  if (kind === "spring") {
    return [
      { math: String.raw`|F_s|=${n(Math.abs(params.k * params.displacement))}\,\mathrm{N}`, x: 68, y: 54, targetX: 68, targetY: 50, color: "#f4c95d" },
      { math: String.raw`U=${n(0.5 * params.k * params.displacement ** 2)}\,\mathrm{J}`, x: 56, y: 30, targetX: 58, targetY: 40, color: "#ff4df0" },
    ];
  }

  if (kind === "projectile") {
    const state = projectileState(params);
    return [
      { math: String.raw`R_1=${n(state.firstRange, 1)}\,\mathrm{m}`, x: 66, y: 68, targetX: 61, targetY: 78, color: "#7ff8ff" },
      { math: String.raw`h_1=${n(state.firstBounceHeight, 1)}\,\mathrm{m}`, x: 44, y: 26, targetX: 52, targetY: 39, color: "#f4c95d" },
      { math: String.raw`d_r=${n(state.rollStopDistance, 1)}\,\mathrm{m}`, x: 72, y: 82, targetX: 86, targetY: 78, color: "#a9ef78" },
    ];
  }

  if (kind === "acidbase") {
    const state = acidBaseState(params);
    return [
      { math: String.raw`\mathrm{pH}=${n(state.pH, 2)}`, x: 70, y: 22, targetX: 74, targetY: 36, color: "#7ff8ff" },
      { math: String.raw`V_{eq}=${n(state.equivalenceVolumeMl, 1)}\,\mathrm{mL}`, x: 65, y: 74, targetX: 62, targetY: 78, color: "#f4c95d" },
      { math: String.raw`n_{excess}=${n(Math.abs(state.excessMoles) * 1000, 2)}\,\mathrm{mmol}`, x: 12, y: 68, targetX: 36, targetY: 68, color: "#ff4df0" },
    ];
  }

  if (kind === "dilution") {
    const state = dilutionState(params);
    return [
      { math: String.raw`C_2=${n(state.finalMolarity, 3)}\,\mathrm{M}`, x: 58, y: 69, targetX: 52, targetY: 54, color: "#7ff8ff" },
      { math: String.raw`D=${n(state.dilutionFactor, 1)}\times`, x: 62, y: 28, targetX: 55, targetY: 35, color: "#a9ef78" },
      { math: String.raw`n=${n(state.soluteMmol, 2)}\,\mathrm{mmol}`, x: 18, y: 30, targetX: 25, targetY: 48, color: "#ff4df0" },
      { math: String.raw`V_s=${n(state.solventAddedMl, 1)}\,\mathrm{mL}`, x: 70, y: 60, targetX: 52, targetY: 45, color: "#f4c95d" },
    ];
  }

  if (kind === "stoichiometry") {
    const state = stoichiometryState(params);
    const limitingMath = state.limiting === "Tie" ? String.raw`\mathrm{Tie}` : String.raw`\mathrm{${state.limiting}}`;
    return [
      { math: String.raw`\xi=${n(state.extent, 2)}\,\mathrm{mol}`, x: 63, y: 28, targetX: 55, targetY: 44, color: "#a9ef78" },
      { math: String.raw`n_P=${n(state.productMoles, 2)}\,\mathrm{mol}`, x: 58, y: 68, targetX: 55, targetY: 56, color: "#f4c95d" },
      { math: String.raw`\mathrm{lim}=${limitingMath}`, x: 18, y: 30, targetX: state.limiting === "B" ? 33 : 20, targetY: 48, color: state.limiting === "A" ? "#ff4df0" : state.limiting === "B" ? "#7ff8ff" : "#f4c95d" },
      { math: String.raw`n_{excess}=${n(state.excessMoles, 2)}\,\mathrm{mol}`, x: 72, y: 64, targetX: 79, targetY: 52, color: "#ff4df0" },
    ];
  }

  if (kind === "idealgas") {
    const state = idealGasState(params);
    return [
      { math: String.raw`P=${n(state.pressureKpa, 0)}\,\mathrm{kPa}`, x: 72, y: 20, targetX: 78, targetY: 32, color: "#7ff8ff" },
      { math: String.raw`V=${n(state.volumeL, 1)}\,\mathrm{L}`, x: 55, y: 69, targetX: 57, targetY: 47, color: "#f4c95d" },
      { math: String.raw`T=${n(state.temperatureK, 0)}\,\mathrm{K}`, x: 34, y: 80, targetX: 37, targetY: 72, color: "#ff4df0" },
      { math: String.raw`n=${n(state.amountMol, 2)}\,\mathrm{mol}`, x: 18, y: 24, targetX: 34, targetY: 44, color: "#a9ef78" },
    ];
  }

  if (kind === "kinetics") {
    const state = kineticsState(params);
    return [
      { math: String.raw`[A]=${n(state.reactant, 3)}\,\mathrm{M}`, x: 18, y: 31, targetX: 37, targetY: 49, color: "#ff4df0" },
      { math: String.raw`[P]=${n(state.product, 3)}\,\mathrm{M}`, x: 53, y: 74, targetX: 53, targetY: 58, color: "#7ff8ff" },
      { math: String.raw`t_{1/2}=${n(state.halfLife)}\,\mathrm{min}`, x: 70, y: 66, targetX: 74, targetY: 76, color: "#f4c95d" },
      { math: String.raw`\%=${n(state.completion * 100, 0)}`, x: 68, y: 24, targetX: 78, targetY: 41, color: "#a9ef78" },
    ];
  }

  if (kind === "unitcircle") {
    const state = unitCircleState(params);
    return [
      { math: String.raw`\theta=${n(state.radians, 3)}\,\mathrm{rad}`, x: 60, y: 23, targetX: 55, targetY: 35, color: "#7ff8ff" },
      { math: String.raw`\cos\theta=${n(state.cos, 3)}`, x: 34, y: 72, targetX: 43, targetY: 52, color: "#f4c95d" },
      { math: String.raw`\sin\theta=${n(state.sin, 3)}`, x: 57, y: 40, targetX: 55, targetY: 39, color: "#ff4df0" },
      { math: String.raw`\tan\theta=${Math.abs(state.tan) > 9 ? "\\infty" : n(state.tan, 3)}`, x: 68, y: 66, targetX: 67, targetY: 52, color: "#a9ef78" },
    ];
  }

  if (kind === "pythagorean") {
    const state = pythagoreanState(params);
    return [
      { math: String.raw`a=${n(state.a, 2)}`, x: 39, y: 74, targetX: 48, targetY: 66, color: "#f4c95d" },
      { math: String.raw`b=${n(state.b, 2)}`, x: 20, y: 44, targetX: 36, targetY: 50, color: "#ff4df0" },
      { math: String.raw`c=${n(state.c, 2)}`, x: 56, y: 35, targetX: 49, targetY: 48, color: "#7ff8ff" },
      { math: String.raw`a^2+b^2=${n(state.areaC, 2)}`, x: 70, y: 34, targetX: 78, targetY: 48, color: "#a9ef78" },
    ];
  }

  if (kind === "binomial") {
    const state = binomialState(params);
    return [
      { math: String.raw`P(X=${state.k})=${n(state.selectedProbability * 100, 2)}\%`, x: 62, y: 28, targetX: 58, targetY: 43, color: "#f4c95d" },
      { math: String.raw`\mu=${n(state.mean)}`, x: 46, y: 20, targetX: 48, targetY: 33, color: "#a9ef78" },
      { math: String.raw`\sigma=${n(state.sigma)}`, x: 48, y: 72, targetX: 62, targetY: 58, color: "#7ff8ff" },
      { math: String.raw`P(X\le ${state.k})=${n(state.cumulativeProbability * 100, 1)}\%`, x: 16, y: 68, targetX: 31, targetY: 58, color: "#ff4df0" },
    ];
  }

  if (kind === "exponential") {
    const state = exponentialState(params);
    return [
      { math: String.raw`y=${n(state.current, 2)}`, x: 62, y: 28, targetX: 58, targetY: 43, color: state.rate >= 0 ? "#a9ef78" : "#ff4df0" },
      { math: String.raw`e^{kt}=${n(state.multiplier, 2)}`, x: 66, y: 64, targetX: 58, targetY: 43, color: "#7ff8ff" },
      { math: String.raw`\frac{dy}{dt}=${n(state.slope, 2)}`, x: 36, y: 22, targetX: 48, targetY: 36, color: "#f4c95d" },
      { math: String.raw`${state.rate >= 0 ? "T_d" : "t_{1/2}"}=${Number.isFinite(state.characteristicTime) ? n(state.characteristicTime, 2) : "\\infty"}`, x: 18, y: 68, targetX: 28, targetY: 58, color: "#a9ef78" },
    ];
  }

  if (kind === "doppler") {
    const observed = params.frequency * ((params.waveSpeed + params.observerSpeed) / Math.max(1, params.waveSpeed - params.sourceSpeed));
    const mach = Math.abs(params.sourceSpeed) / Math.max(1, params.waveSpeed);
    return [
      { math: String.raw`f=${n(params.frequency, 0)}\,\mathrm{Hz}`, x: 33, y: 32, targetX: 42, targetY: 50, color: "#f4c95d" },
      { math: String.raw`f'=${n(observed, 0)}\,\mathrm{Hz}`, x: 73, y: 43, targetX: 74, targetY: 50, color: observed >= params.frequency ? "#ff4df0" : "#7ff8ff" },
      { math: String.raw`M=${n(mach, 2)}`, x: 22, y: 25, targetX: 35, targetY: 51, color: "#ff4df0" },
      { math: String.raw`v_s=${n(params.sourceSpeed, 0)}\,\mathrm{m\,s^{-1}}`, x: 41, y: 22, targetX: 42, targetY: 34, color: "#a9ef78" },
    ];
  }

  if (kind === "buoyancy") {
    const state = buoyancyState(params);
    return [
      { math: String.raw`\rho_o=${n(state.objectDensity, 0)}\,\mathrm{kg\,m^{-3}}`, x: 62, y: 30, targetX: 50, targetY: 48, color: state.floating ? "#a9ef78" : "#ff4df0" },
      { math: String.raw`F_b=${n(state.buoyantForceN, 1)}\,\mathrm{N}`, x: 34, y: 24, targetX: 50, targetY: 34, color: "#7ff8ff" },
      { math: String.raw`W=${n(state.weightN, 1)}\,\mathrm{N}`, x: 64, y: 66, targetX: 55, targetY: 64, color: "#ff4df0" },
      { math: String.raw`V_d=${n(state.displacedVolumeL, 2)}\,\mathrm{L}`, x: 18, y: 62, targetX: 38, targetY: 56, color: "#f4c95d" },
    ];
  }

  if (kind === "hydrostatic") {
    const gaugeKpa = (Math.max(1, params.fluidDensity) * Math.max(0.1, params.gravity) * Math.max(0, params.depth)) / 1000;
    const absoluteKpa = Math.max(0, params.surfacePressure) + gaugeKpa;
    return [
      { math: String.raw`h=${n(params.depth, 1)}\,\mathrm{m}`, x: 67, y: 44, targetX: 62, targetY: 52, color: "#f4c95d" },
      { math: String.raw`\Delta p=${n(gaugeKpa, 1)}\,\mathrm{kPa}`, x: 57, y: 55, targetX: 54, targetY: 52, color: "#ff4df0" },
      { math: String.raw`p=${n(absoluteKpa, 1)}\,\mathrm{kPa}`, x: 72, y: 22, targetX: 80, targetY: 29, color: "#7ff8ff" },
      { math: String.raw`\rho=${n(params.fluidDensity, 0)}\,\mathrm{kg\,m^{-3}}`, x: 22, y: 32, targetX: 36, targetY: 44, color: "#a9ef78" },
    ];
  }

  if (kind === "newton2") {
    const state = newtonSecondState(params);
    return [
      { math: String.raw`F_{\mathrm{net}}=${n(state.netForce, 1)}\,\mathrm{N}`, x: 62, y: 28, targetX: 55, targetY: 38, color: state.netForce >= 0 ? "#a9ef78" : "#ff4df0" },
      { math: String.raw`a=${n(state.acceleration, 2)}\,\mathrm{m\,s^{-2}}`, x: 66, y: 46, targetX: 55, targetY: 38, color: "#7ff8ff" },
      { math: String.raw`f=${n(Math.abs(state.frictionForce), 1)}\,\mathrm{N}`, x: 22, y: 58, targetX: 42, targetY: 56, color: "#ff4df0" },
      { math: String.raw`x=${n(state.displacement, 2)}\,\mathrm{m}`, x: 48, y: 76, targetX: 48, targetY: 68, color: "#f4c95d" },
    ];
  }

  if (kind === "workenergy") {
    const state = workEnergyState(params);
    return [
      { math: String.raw`W=${n(state.appliedWorkJ, 1)}\,\mathrm{J}`, x: 64, y: 28, targetX: 55, targetY: 44, color: "#7ff8ff" },
      { math: String.raw`\Delta K=${n(state.deltaKineticJ, 1)}\,\mathrm{J}`, x: 66, y: 48, targetX: 56, targetY: 48, color: "#a9ef78" },
      { math: String.raw`K_f=${n(state.finalKineticJ, 1)}\,\mathrm{J}`, x: 58, y: 68, targetX: 54, targetY: 57, color: "#f4c95d" },
      { math: String.raw`v_f=${n(state.finalSpeed, 2)}\,\mathrm{m\,s^{-1}}`, x: 20, y: 58, targetX: 43, targetY: 57, color: "#ff4df0" },
    ];
  }

  if (kind === "snell") {
    const state = snellState(params);
    return [
      { math: String.raw`\theta_1=${n(state.incidentAngleDeg, 1)}^\circ`, x: 25, y: 26, targetX: 42, targetY: 45, color: "#f4c95d" },
      { math: state.totalInternalReflection ? String.raw`\mathrm{TIR}` : String.raw`\theta_2=${n(state.refractedAngleDeg, 1)}^\circ`, x: 66, y: 68, targetX: 59, targetY: 61, color: state.totalInternalReflection ? "#ff4df0" : "#7ff8ff" },
      { math: String.raw`R=${n(state.reflectance * 100, 1)}\%`, x: 66, y: 29, targetX: 58, targetY: 44, color: "#ff4df0" },
      { math: String.raw`\lambda_2=${n(state.wavelength2Nm, 0)}\,\mathrm{nm}`, x: 22, y: 72, targetX: 39, targetY: 61, color: "#a9ef78" },
    ];
  }

  if (kind === "thinlens") {
    const state = thinLensState(params);
    return [
      { math: String.raw`f=${n(state.focalLength, 1)}\,\mathrm{cm}`, x: 62, y: 61, targetX: 65, targetY: 50, color: "#7ff8ff" },
      { math: String.raw`d_o=${n(state.objectDistance, 1)}\,\mathrm{cm}`, x: 23, y: 58, targetX: 36, targetY: 50, color: "#f4c95d" },
      { math: String.raw`d_i=${n(state.imageDistance, 1)}\,\mathrm{cm}`, x: state.realImage ? 72 : 28, y: state.realImage ? 38 : 33, targetX: state.realImage ? 72 : 38, targetY: 45, color: "#ff4df0" },
      { math: String.raw`m=${n(state.magnification, 2)}`, x: state.realImage ? 72 : 30, y: 25, targetX: state.realImage ? 72 : 38, targetY: 32, color: "#a9ef78" },
    ];
  }

  if (kind === "cooling") {
    const state = coolingState(params);
    return [
      { math: String.raw`T=${n(state.currentTemp, 1)}^\circ\mathrm{C}`, x: 28, y: 24, targetX: 42, targetY: 40, color: state.gap >= 0 ? "#f4c95d" : "#7ff8ff" },
      { math: String.raw`\Delta T=${n(state.gap, 1)}^\circ\mathrm{C}`, x: 65, y: 28, targetX: 55, targetY: 48, color: "#ff4df0" },
      { math: String.raw`\frac{dT}{dt}=${n(state.rateDegPerMin, 2)}^\circ\mathrm{C\,min^{-1}}`, x: 61, y: 67, targetX: 67, targetY: 58, color: "#7ff8ff" },
      { math: String.raw`t_{1/2}=${n(state.halfTimeMin, 2)}\,\mathrm{min}`, x: 22, y: 72, targetX: 39, targetY: 68, color: "#a9ef78" },
    ];
  }

  if (kind === "carnot") {
    const state = carnotState(params);
    return [
      { math: String.raw`T_h=${n(state.hotK, 0)}\,\mathrm{K}`, x: 23, y: 20, targetX: 35, targetY: 18, color: "#ff4df0" },
      { math: String.raw`\eta=${n(state.efficiency * 100, 1)}\%`, x: 63, y: 39, targetX: 51, targetY: 50, color: "#a9ef78" },
      { math: String.raw`W=${n(state.workOutput, 1)}\,\mathrm{J}`, x: 70, y: 47, targetX: 78, targetY: 50, color: "#a9ef78" },
      { math: String.raw`Q_c=${n(state.rejectedHeat, 1)}\,\mathrm{J}`, x: 56, y: 76, targetX: 50, targetY: 75, color: "#7ff8ff" },
    ];
  }

  if (kind === "regression") {
    const state = regressionState(params);
    return [
      { math: String.raw`b_1=${n(state.slope)}`, x: 66, y: 24, targetX: 62, targetY: 34, color: "#7ff8ff" },
      { math: String.raw`b_0=${n(state.intercept)}`, x: 18, y: 70, targetX: 28, targetY: 62, color: "#f4c95d" },
      { math: String.raw`R^2=${n(state.r2, 3)}`, x: 70, y: 66, targetX: 58, targetY: 52, color: "#a9ef78" },
      { math: String.raw`\mathrm{RMSE}=${n(state.rmse)}`, x: 18, y: 28, targetX: 38, targetY: 44, color: "#ff4df0" },
    ];
  }

  if (kind === "superposition") {
    return [
      { math: String.raw`A_{\max}=${n(params.ampA + params.ampB)}`, x: 18, y: 64, targetX: 42, targetY: 72, color: "#a9ef78" },
      { math: String.raw`\phi=${n(params.phase, 0)}^\circ`, x: 76, y: 44, targetX: 66, targetY: 50, color: "#ff4df0" },
    ];
  }

  if (kind === "standingwave") {
    const state = standingWaveState(params);
    return [
      { math: String.raw`f_${state.harmonic}=${n(state.frequency, 1)}\,\mathrm{Hz}`, x: 64, y: 27, targetX: 50, targetY: 50, color: "#7ff8ff" },
      { math: String.raw`\lambda=${n(state.wavelength, 2)}\,\mathrm{m}`, x: 68, y: 65, targetX: 62, targetY: 50, color: "#a9ef78" },
      { math: String.raw`v=${n(state.waveSpeed, 1)}\,\mathrm{m\,s^{-1}}`, x: 18, y: 68, targetX: 32, targetY: 72, color: "#ff4df0" },
      { math: String.raw`\Delta x_N=${n(state.nodeSpacing, 2)}\,\mathrm{m}`, x: 21, y: 30, targetX: 35, targetY: 50, color: "#f4c95d" },
    ];
  }

  if (kind === "pendulum") {
    const period = TAU * Math.sqrt(params.length / params.gravity);
    const peakSpeed = Math.sqrt(2 * params.gravity * params.length * (1 - Math.cos(degToRad(params.angle))));
    return [
      { math: String.raw`T=${n(period)}\,\mathrm{s}`, x: 38, y: 24, targetX: 50, targetY: 18, color: "#7ff8ff" },
      { math: String.raw`v_{\max}=${n(peakSpeed)}\,\mathrm{m\,s^{-1}}`, x: 64, y: 72, targetX: 54, targetY: 70, color: "#f4c95d" },
    ];
  }

  if (kind === "ohm") {
    const current = params.voltage / params.resistance;
    return [
      { math: String.raw`V=${n(params.voltage, 1)}\,\mathrm{V}`, x: 18, y: 64, targetX: 19, targetY: 50, color: "#f4c95d" },
      { math: String.raw`R=${n(params.resistance, 1)}\,\Omega`, x: 64, y: 42, targetX: 81, targetY: 50, color: "#ff4df0" },
      { math: String.raw`I=${n(current)}\,\mathrm{A}`, x: 42, y: 20, targetX: 48, targetY: 27, color: "#7ff8ff" },
      { math: String.raw`P=${n(params.voltage ** 2 / params.resistance)}\,\mathrm{W}`, x: 64, y: 62, targetX: 81, targetY: 63, color: "#a9ef78" },
    ];
  }

  if (kind === "rc") {
    const state = rcState(params);
    return [
      { math: String.raw`\tau=${n(state.tauMs, 1)}\,\mathrm{ms}`, x: 38, y: 72, targetX: 25, targetY: 59, color: "#f4c95d" },
      { math: String.raw`V_C=${n(state.capacitorVoltage, 2)}\,\mathrm{V}`, x: 66, y: 66, targetX: 82, targetY: 54, color: "#7ff8ff" },
      { math: String.raw`I=${n(state.currentMa, 2)}\,\mathrm{mA}`, x: 43, y: 18, targetX: 50, targetY: 24, color: "#a9ef78" },
      { math: String.raw`Q=${n(state.chargeUc, 1)}\,\mu\mathrm{C}`, x: 72, y: 42, targetX: 82, targetY: 48, color: "#ff4df0" },
    ];
  }

  if (kind === "coulomb") {
    const state = coulombState(params);
    return [
      { math: String.raw`F=${n(state.forceMagnitudeN * 1000, 3)}\,\mathrm{mN}`, x: 56, y: 24, targetX: 50, targetY: 36, color: state.forceSigned >= 0 ? "#ff4df0" : "#a9ef78" },
      { math: String.raw`E_p=${n(state.fieldAtProbe / 1000, 2)}\,\mathrm{kN\,C^{-1}}`, x: 64, y: 72, targetX: 60, targetY: 66, color: state.fieldAtProbe >= 0 ? "#f4c95d" : "#7ff8ff" },
      { math: String.raw`U=${n(state.potentialEnergyJ * 1000, 3)}\,\mathrm{mJ}`, x: 22, y: 27, targetX: 36, targetY: 50, color: "#7ff8ff" },
      { math: String.raw`r=${n(state.separationCm, 1)}\,\mathrm{cm}`, x: 44, y: 70, targetX: 50, targetY: 65, color: "#f4c95d" },
    ];
  }

  if (kind === "gravityfield") {
    const state = gravityFieldState(params);
    return [
      { math: String.raw`F_g=${n(state.forceN / 1e20, 2)}\times10^{20}\,\mathrm{N}`, x: 50, y: 24, targetX: 50, targetY: 36, color: "#a9ef78" },
      { math: String.raw`g_p=${n(state.fieldAtProbe, 2)}\,\mathrm{m\,s^{-2}}`, x: 65, y: 72, targetX: 61, targetY: 66, color: state.fieldAtProbe >= 0 ? "#ff4df0" : "#7ff8ff" },
      { math: String.raw`x_{cm}=${n(state.barycenterXMm, 2)}\,\mathrm{Mm}`, x: 45, y: 70, targetX: 50, targetY: 65, color: "#f4c95d" },
      { math: String.raw`T=${n(state.orbitalPeriodDays, 1)}\,\mathrm{d}`, x: 18, y: 28, targetX: 30, targetY: 46, color: "#7ff8ff" },
    ];
  }

  if (kind === "wirefield") {
    const state = wireFieldState(params);
    return [
      { math: String.raw`I=${n(state.current, 1)}\,\mathrm{A}`, x: 56, y: 29, targetX: 50, targetY: 50, color: state.current >= 0 ? "#7ff8ff" : "#ff4df0" },
      { math: String.raw`B=${n(Math.abs(state.fieldMicroT), 1)}\,\mu\mathrm{T}`, x: 68, y: 24, targetX: 63, targetY: 30, color: "#7ff8ff" },
      { math: String.raw`r=${n(params.probeRadius, 1)}\,\mathrm{cm}`, x: 34, y: 62, targetX: 41, targetY: 58, color: "#f4c95d" },
      { math: String.raw`\phi=${n(state.compassDeflectionDeg, 1)}^\circ`, x: 70, y: 62, targetX: 73, targetY: 55, color: "#a9ef78" },
    ];
  }

  if (kind === "incline") {
    const theta = degToRad(params.angle);
    const weight = params.mass * params.gravity;
    const normal = weight * Math.cos(theta);
    return [
      { math: String.raw`F_N=${n(normal, 1)}\,\mathrm{N}`, x: 54, y: 25, targetX: 48, targetY: 44, color: "#7ff8ff" },
      { math: String.raw`F_{\parallel}=${n(weight * Math.sin(theta), 1)}\,\mathrm{N}`, x: 28, y: 62, targetX: 43, targetY: 56, color: "#ff4df0" },
    ];
  }

  if (kind === "circular") {
    const speed = params.radius * params.angularSpeed;
    const force = params.mass * params.radius * params.angularSpeed ** 2;
    return [
      { math: String.raw`v=${n(speed)}\,\mathrm{m\,s^{-1}}`, x: 66, y: 30, targetX: 58, targetY: 42, color: "#7ff8ff" },
      { math: String.raw`F_c=${n(force)}\,\mathrm{N}`, x: 42, y: 61, targetX: 50, targetY: 50, color: "#ff4df0" },
    ];
  }

  if (kind === "capacitor") {
    const epsilon0 = 8.854e-12;
    const capacitancePf = ((epsilon0 * params.dielectric * (params.plateArea / 10000)) / (params.spacing / 1000)) * 1e12;
    const chargeNc = capacitancePf * params.voltage * 0.001;
    const energyNj = 0.5 * capacitancePf * 1e-12 * params.voltage ** 2 * 1e9;
    return [
      { math: String.raw`C=${n(capacitancePf)}\,\mathrm{pF}`, x: 46, y: 21, targetX: 50, targetY: 49, color: "#7ff8ff" },
      { math: String.raw`Q=${n(chargeNc)}\,\mathrm{nC}`, x: 22, y: 32, targetX: 38, targetY: 40, color: "#f4c95d" },
      { math: String.raw`E=${n(params.voltage / params.spacing)}\,\mathrm{kV\,m^{-1}}`, x: 63, y: 36, targetX: 55, targetY: 43, color: "#a9ef78" },
      { math: String.raw`U=${n(energyNj)}\,\mathrm{nJ}`, x: 70, y: 62, targetX: 82, targetY: 52, color: "#ff4df0" },
    ];
  }

  if (kind === "lorenz") {
    const spread = Math.sqrt(Math.max(0, params.beta * (params.rho - 1)));
    return [
      { math: String.raw`\rho=${n(params.rho, 1)}`, x: 22, y: 20, targetX: 42, targetY: 32, color: "#7ff8ff" },
      { math: String.raw`\sqrt{\beta(\rho-1)}=${n(spread)}`, x: 64, y: 34, targetX: 55, targetY: 46, color: "#a9ef78" },
    ];
  }

  if (kind === "orbital") {
    const apoapsis = Math.max(params.apoapsis, params.periapsis + 0.2);
    const a = (params.periapsis + apoapsis) / 2;
    const e = (apoapsis - params.periapsis) / (apoapsis + params.periapsis);
    const r = Math.max(0.2, a * (1 - e * e) / (1 + e * Math.cos(degToRad(params.phase))));
    const speed = Math.sqrt(params.centralMass * (2 / r - 1 / a));
    return [
      { math: String.raw`e=${n(e)}`, x: 68, y: 25, targetX: 62, targetY: 38, color: "#ff4df0" },
      { math: String.raw`v=${n(speed)}\,\mathrm{u\,s^{-1}}`, x: 66, y: 42, targetX: 57, targetY: 48, color: "#a9ef78" },
      { math: String.raw`a=${n(a)}\,\mathrm{AU}`, x: 38, y: 62, targetX: 45, targetY: 50, color: "#f4c95d" },
    ];
  }

  return [];
}

function MicroValueOverlay({ kind, params }: { kind: MicroKind; params: Params }) {
  const callouts = microValueCallouts(kind, params);

  return (
    <div className="microValueLayer" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {callouts.map((callout) => (
          <g key={`${callout.math}-${callout.x}-${callout.y}`} style={{ color: callout.color }}>
            <line x1={callout.targetX} y1={callout.targetY} x2={callout.x} y2={callout.y} />
            <circle cx={callout.targetX} cy={callout.targetY} r="0.72" />
          </g>
        ))}
      </svg>
      {callouts.map((callout) => (
        <span
          className="microValueTag"
          key={callout.math}
          style={{ left: `${callout.x}%`, top: `${callout.y}%`, color: callout.color }}
        >
          <InlineMath math={callout.math} />
        </span>
      ))}
    </div>
  );
}

const specs: Record<string, MicroSpec> = {
  "vector-addition": {
    kind: "vector",
    title: "Vector Addition",
    eyebrow: "Vector Micro Lab",
    status: "Resultant Vector",
    initial: { magA: 5.2, angleA: 28, magB: 4.1, angleB: 132 },
    controls: [
      { key: "magA", label: "Vector A Magnitude", min: 0.5, max: 8, step: 0.1, unit: "", description: "Sets the length of the cyan vector. Watch the yellow resultant stretch or shrink; it combines with Vector B through x and y components, so its effect depends strongly on Vector A Angle." },
      { key: "angleA", label: "Vector A Angle", min: -180, max: 180, step: 1, unit: "deg", description: "Rotates the cyan vector around the origin. Observe the resultant swing as the x and y components change; parallel vectors reinforce while opposing vectors cancel." },
      { key: "magB", label: "Vector B Magnitude", min: 0.5, max: 8, step: 0.1, unit: "", description: "Sets the length of the magenta vector. It changes the resultant most when it points near Vector A, and can reduce the resultant when it points against Vector A." },
      { key: "angleB", label: "Vector B Angle", min: -180, max: 180, step: 1, unit: "deg", description: "Rotates the magenta vector. Watch the chart: it maps how the resultant magnitude changes as this angle moves through reinforcement and cancellation." },
    ],
    metrics: (params) => {
      const state = vectorState(params);
      return [
        { label: "Result Magnitude", value: format(state.mag, 2), tone: "#f4c95d", icon: Compass },
        { label: "Result Angle", value: `${format(state.angle, 1)} deg`, tone: "#7ff8ff", icon: CircleGauge },
        { label: "X Component", value: format(state.rx, 2), tone: "#ff4df0", icon: Activity },
        { label: "Y Component", value: format(state.ry, 2), tone: "#a9ef78", icon: Activity },
      ];
    },
    chart: (params) => {
      const points = Array.from({ length: 90 }, (_, i) => {
        const angleB = -180 + (i / 89) * 360;
        const state = vectorState({ ...params, angleB });
        return { x: angleB, y: state.mag };
      });
      const active = vectorState(params);
      return { label: "Result Magnitude vs Vector B Angle", points, activeX: params.angleB, activeY: active.mag, color: "#f4c95d", xUnit: "deg", yUnit: "Mag." };
    },
    equations: [String.raw`\vec{R}=\vec{A}+\vec{B}`, String.raw`|\vec{R}|=\sqrt{R_x^2+R_y^2}`],
    explanation: "Drag the magnitudes and angles mentally through the controls: the yellow arrow is the component-wise sum of the cyan and magenta vectors.",
    history: {
      body: [
        "Vector thinking began as geometry and navigation: arrows for direction, length for magnitude, and graphical constructions for combining displacements and forces. Long before modern notation existed, surveyors, astronomers, and mechanics were already treating direction and amount as inseparable.",
        "In the nineteenth century, Hamilton's quaternions and Grassmann's algebra pushed the idea into formal mathematics. Gibbs and Heaviside then stripped the language down into the vector notation physicists still use for forces, fields, velocity, and electromagnetic theory.",
        "That history matters because vectors are not just bookkeeping. They are a compact way to say that nature often cares about components: east-west and north-south motion, perpendicular force components, or fields pointing through space.",
      ],
      cards: [historyCards.hamilton, historyCards.gibbs, historyCards.heaviside],
      links: [
        { label: "Vector Space", href: "https://en.wikipedia.org/wiki/Vector_space" },
        { label: "Josiah Willard Gibbs", href: "https://en.wikipedia.org/wiki/Josiah_Willard_Gibbs" },
      ],
    },
  },
  "matrix-transformation": {
    kind: "matrixtransform",
    title: "Matrix Transformation",
    eyebrow: "Linear Algebra Micro Lab",
    status: "Linear Map",
    initial: { a: 1.15, b: 0.65, c: -0.25, d: 1.05, x: 2.2, y: 1.1 },
    presets: [
      { label: "Identity", description: "Leaves every vector unchanged", values: { a: 1, b: 0, c: 0, d: 1, x: 2.2, y: 1.1 } },
      { label: "Shear", description: "Slides space sideways while preserving area", values: { a: 1, b: 0.9, c: 0, d: 1, x: 2.2, y: 1.1 } },
      { label: "Scale", description: "Stretches x and compresses y", values: { a: 1.7, b: 0, c: 0, d: 0.65, x: 2.2, y: 1.1 } },
      { label: "Rotate", description: "Approximate quarter-turn rotation", values: { a: 0, b: -1, c: 1, d: 0, x: 2.2, y: 1.1 } },
      { label: "Reflect", description: "Flips orientation across a diagonal", values: { a: 0, b: 1, c: 1, d: 0, x: 2.2, y: 1.1 } },
      { label: "Singular", description: "Collapses area onto a line", values: { a: 1, b: 1, c: 0.5, d: 0.5, x: 2.2, y: 1.1 } },
    ],
    controls: [
      { key: "a", label: "Matrix Entry A", min: -2, max: 2, step: 0.05, unit: "", description: "Sets the top-left matrix entry. It controls how much the input x-coordinate contributes to the output x-coordinate, so it stretches or flips the horizontal basis direction." },
      { key: "b", label: "Matrix Entry B", min: -2, max: 2, step: 0.05, unit: "", description: "Sets the top-right matrix entry. It controls how much the input y-coordinate contributes to the output x-coordinate, creating shear when it changes while the diagonal entries stay near one." },
      { key: "c", label: "Matrix Entry C", min: -2, max: 2, step: 0.05, unit: "", description: "Sets the bottom-left matrix entry. It controls how much the input x-coordinate contributes to the output y-coordinate, tilting the transformed grid vertically." },
      { key: "d", label: "Matrix Entry D", min: -2, max: 2, step: 0.05, unit: "", description: "Sets the bottom-right matrix entry. It controls how much the input y-coordinate contributes to the output y-coordinate, stretching or flipping the vertical basis direction." },
      { key: "x", label: "Input X", min: -3, max: 3, step: 0.05, unit: "", description: "Moves the input vector horizontally before the matrix acts. The output vector follows by combining x times the first column with y times the second column." },
      { key: "y", label: "Input Y", min: -3, max: 3, step: 0.05, unit: "", description: "Moves the input vector vertically before the matrix acts. Watch how changing y adds more of the transformed vertical basis vector to the result." },
    ],
    metrics: (p) => {
      const state = matrixTransformState(p);
      return [
        { label: "Determinant", value: format(state.det, 2), tone: "#f4c95d", icon: Sigma },
        { label: "Area Scale", value: `${format(state.areaScale, 2)}x`, tone: "#ff4df0", icon: Box },
        { label: "Output Length", value: format(state.outputMag, 2), tone: "#a9ef78", icon: Compass },
        { label: "Orientation", value: state.orientation, tone: "#7ff8ff", icon: CircleGauge },
      ];
    },
    chart: (p) => {
      const points = Array.from({ length: 120 }, (_, i) => {
        const angle = (i / 119) * 360;
        const x = Math.cos(degToRad(angle));
        const y = Math.sin(degToRad(angle));
        const state = matrixTransformState({ ...p, x, y });
        return { x: angle, y: state.outputMag };
      });
      const activeAngle = (Math.atan2(p.y, p.x) * 180) / Math.PI;
      const state = matrixTransformState(p);
      return { label: "Unit Vector Stretch vs Direction (deg)", points, activeX: activeAngle, activeY: state.outputMag / Math.max(state.inputMag, 0.001), color: "#a9ef78", xUnit: "deg", yUnit: "x" };
    },
    equations: [String.raw`A=\begin{bmatrix}a&b\\c&d\end{bmatrix}`, String.raw`\vec{x}'=A\vec{x}`, String.raw`\det(A)=ad-bc`],
    explanation: "A 2x2 matrix transforms the whole plane by moving the basis directions. Every vector follows as a weighted combination of the transformed basis vectors, and the determinant reports signed area scaling.",
    history: {
      body: [
        "Linear algebra grew from solving simultaneous equations and organizing many coefficients without losing track of them. Matrices made that bookkeeping visual and reusable: the same rectangular array can encode equations, coordinate changes, rotations, shears, projections, and data transformations.",
        "Cayley and other nineteenth-century mathematicians helped treat matrices as objects with their own algebra rather than just as shorthand for equations. That shift is why matrix multiplication, determinants, inverses, and eigenvectors can be studied as a coherent language.",
        "The geometric interpretation is the most teachable version: a matrix moves the grid. Once you can see where the basis vectors go, the formula Ax stops looking like a black box and starts looking like controlled space deformation.",
      ],
      cards: [historyCards.grassmann, historyCards.cayley, historyCards.matrix],
      links: [
        { label: "Matrix", href: "https://en.wikipedia.org/wiki/Matrix_(mathematics)" },
        { label: "Linear Map", href: "https://en.wikipedia.org/wiki/Linear_map" },
        { label: "Determinant", href: "https://en.wikipedia.org/wiki/Determinant" },
      ],
    },
  },
  "dot-product-projection": {
    kind: "dotproduct",
    title: "Dot Product Projection",
    eyebrow: "Linear Algebra Micro Lab",
    status: "Projection And Angle",
    initial: { ax: 3.2, ay: 1.4, bx: 2.1, by: 2.8 },
    presets: [
      { label: "Acute", description: "Positive dot product", values: { ax: 3.2, ay: 1.4, bx: 2.1, by: 2.8 } },
      { label: "Right Angle", description: "Zero dot product", values: { ax: 3, ay: 1.5, bx: -1.5, by: 3 } },
      { label: "Opposed", description: "Negative dot product", values: { ax: 3.2, ay: 0.8, bx: -2.8, by: -1.2 } },
      { label: "Parallel", description: "Maximum positive alignment", values: { ax: 3.4, ay: 1.7, bx: 2.4, by: 1.2 } },
    ],
    controls: [
      { key: "ax", label: "Vector A X", min: -5, max: 5, step: 0.1, unit: "", description: "Sets Vector A's horizontal component. The dot product changes by this component times Vector B X, so matching signs increase alignment." },
      { key: "ay", label: "Vector A Y", min: -5, max: 5, step: 0.1, unit: "", description: "Sets Vector A's vertical component. Watch the projection foot move as Vector A swings above or below Vector B." },
      { key: "bx", label: "Vector B X", min: -5, max: 5, step: 0.1, unit: "", description: "Sets Vector B's horizontal component. Vector B acts as the measuring direction for the projection, so rotating it changes the shadow cast by Vector A." },
      { key: "by", label: "Vector B Y", min: -5, max: 5, step: 0.1, unit: "", description: "Sets Vector B's vertical component. Together with Vector B X it controls the angle used in the cosine form of the dot product." },
    ],
    metrics: (p) => {
      const state = dotProductState(p);
      return [
        { label: "Dot Product", value: format(state.dot, 2), tone: "#a9ef78", icon: Sigma },
        { label: "Angle", value: `${format(state.theta, 1)} deg`, tone: "#f4c95d", icon: CircleGauge },
        { label: "Projection Length", value: format(state.projLength, 2), tone: "#7ff8ff", icon: Compass },
        { label: "Cosine", value: format(state.cosTheta, 3), tone: "#ff4df0", icon: Activity },
      ];
    },
    chart: (p) => {
      const magB = Math.max(0.1, Math.hypot(p.bx, p.by));
      const points = Array.from({ length: 120 }, (_, i) => {
        const angle = -180 + (i / 119) * 360;
        const bx = Math.cos(degToRad(angle)) * magB;
        const by = Math.sin(degToRad(angle)) * magB;
        return { x: angle, y: dotProductState({ ...p, bx, by }).dot };
      });
      const activeAngle = (Math.atan2(p.by, p.bx) * 180) / Math.PI;
      return { label: "Dot Product vs Vector B Angle (deg)", points, activeX: activeAngle, activeY: dotProductState(p).dot, color: "#a9ef78", xUnit: "deg", yUnit: "dot" };
    },
    equations: [String.raw`\vec{a}\cdot\vec{b}=a_xb_x+a_yb_y`, String.raw`\vec{a}\cdot\vec{b}=|\vec{a}||\vec{b}|\cos\theta`, String.raw`\mathrm{proj}_{\vec b}\vec a=\frac{\vec a\cdot\vec b}{\vec b\cdot\vec b}\vec b`],
    explanation: "The dot product measures how much two vectors point in the same direction. The projection is the shadow of Vector A onto Vector B, so perpendicular vectors give zero and opposite vectors give a negative value.",
    history: {
      body: [
        "The dot product became natural as vector notation matured in mechanics and electromagnetism. Work in physics already needed a way to say that only the component of force along a displacement contributes to energy transfer.",
        "Gibbs and Heaviside helped popularize the compact vector-analysis notation still used today. Their notation separated the scalar product from the vector product, making angle, projection, work, and component extraction easier to teach and calculate.",
        "The same operation now appears across machine learning and graphics: similarity scores, lighting calculations, projections, correlation-like measurements, and orthogonality tests are all variations of this one geometric idea.",
      ],
      cards: [historyCards.gibbs, historyCards.heaviside, historyCards.hamilton],
      links: [
        { label: "Dot Product", href: "https://en.wikipedia.org/wiki/Dot_product" },
        { label: "Projection", href: "https://en.wikipedia.org/wiki/Vector_projection" },
      ],
    },
  },
  "linear-system-2x2": {
    kind: "linearsystem",
    title: "2x2 Linear System",
    eyebrow: "Linear Algebra Micro Lab",
    status: "Line Intersection",
    initial: { a1: 1, b1: 1, c1: 3, a2: 1.5, b2: -0.7, c2: 1 },
    presets: [
      { label: "Single Point", description: "Two clean intersecting lines", values: { a1: 1, b1: 1, c1: 3, a2: 1.5, b2: -0.7, c2: 1 } },
      { label: "Steep Cross", description: "Nearly vertical and shallow lines", values: { a1: 2.8, b1: 0.7, c1: 2.4, a2: -0.4, b2: 1.4, c2: 1.6 } },
      { label: "Parallel", description: "No single intersection", values: { a1: 1, b1: 1, c1: 2, a2: 2, b2: 2, c2: 5 } },
      { label: "Shared Line", description: "Infinitely many solutions", values: { a1: 1, b1: -1, c1: 1, a2: 2, b2: -2, c2: 2 } },
    ],
    controls: [
      { key: "a1", label: "Line 1 X Coefficient", min: -4, max: 4, step: 0.05, unit: "", description: "Sets how strongly x contributes to the first equation. It rotates Line 1 and changes the determinant that decides whether a unique solution exists." },
      { key: "b1", label: "Line 1 Y Coefficient", min: -4, max: 4, step: 0.05, unit: "", description: "Sets how strongly y contributes to the first equation. Together with Line 1 X Coefficient it controls the line's normal direction." },
      { key: "c1", label: "Line 1 Constant", min: -8, max: 8, step: 0.1, unit: "", description: "Shifts Line 1 without changing its angle. Watch the solution point slide where the two equations remain simultaneously true." },
      { key: "a2", label: "Line 2 X Coefficient", min: -4, max: 4, step: 0.05, unit: "", description: "Sets how strongly x contributes to the second equation. If Line 2 becomes a scaled copy of Line 1, the determinant approaches zero." },
      { key: "b2", label: "Line 2 Y Coefficient", min: -4, max: 4, step: 0.05, unit: "", description: "Sets how strongly y contributes to the second equation. It rotates Line 2 and changes the intersection geometry." },
      { key: "c2", label: "Line 2 Constant", min: -8, max: 8, step: 0.1, unit: "", description: "Shifts Line 2. Parallel lines stay separated unless the constants also match as the same scale factor." },
    ],
    metrics: (p) => {
      const state = linearSystemState(p);
      return [
        { label: "Solution X", value: state.parallel ? "none" : format(state.x, 2), tone: "#f4c95d", icon: Compass },
        { label: "Solution Y", value: state.parallel ? "none" : format(state.y, 2), tone: "#7ff8ff", icon: Compass },
        { label: "Determinant", value: format(state.det, 2), tone: "#a9ef78", icon: Sigma },
        { label: "Residual", value: format(Math.abs(state.residual1) + Math.abs(state.residual2), 3), tone: "#ff4df0", icon: Activity },
      ];
    },
    chart: (p) => ({
      label: "Determinant vs Line 2 X Coefficient",
      points: Array.from({ length: 100 }, (_, i) => {
        const a2 = -4 + (i / 99) * 8;
        return { x: a2, y: linearSystemState({ ...p, a2 }).det };
      }),
      activeX: p.a2,
      activeY: linearSystemState(p).det,
      color: "#a9ef78",
      xUnit: "a2",
      yUnit: "det",
    }),
    equations: [String.raw`a_1x+b_1y=c_1`, String.raw`A\vec{x}=\vec{b}`, String.raw`\det(A)=a_1b_2-a_2b_1`],
    explanation: "A 2x2 linear system is two line constraints. A unique solution exists where the lines cross; a zero determinant means the constraints have become parallel or identical, so there is no single crossing point.",
    history: {
      body: [
        "Systems of linear equations are older than modern algebra notation. Ancient calculation traditions already solved collections of unknowns using tabular procedures that resemble elimination.",
        "Matrix notation made the structure visible: coefficients form A, unknowns form x, and constants form b. That compact representation allowed elimination, inverses, determinants, and later numerical methods to scale beyond two equations.",
        "The two-line picture remains useful because it shows what algebraic failure means geometrically. A determinant near zero is not just a small number; it means the two constraints almost point in the same direction, so the intersection becomes unstable.",
      ],
      cards: [historyCards.cayley, historyCards.matrix, historyCards.grassmann],
      links: [
        { label: "System Of Linear Equations", href: "https://en.wikipedia.org/wiki/System_of_linear_equations" },
        { label: "Gaussian Elimination", href: "https://en.wikipedia.org/wiki/Gaussian_elimination" },
      ],
    },
  },
  eigenvectors: {
    kind: "eigenvectors",
    title: "Eigenvectors",
    eyebrow: "Linear Algebra Micro Lab",
    status: "Invariant Directions",
    initial: { a: 1.6, b: 0.65, d: 0.75, vectorAngle: 34 },
    presets: [
      { label: "Diagonal", description: "Eigenvectors align with axes", values: { a: 1.8, b: 0, d: 0.7, vectorAngle: 28 } },
      { label: "Coupled", description: "Rotated eigen directions", values: { a: 1.6, b: 0.65, d: 0.75, vectorAngle: 34 } },
      { label: "Saddle", description: "One stretch and one flip", values: { a: 1.2, b: 0.5, d: -0.9, vectorAngle: 20 } },
      { label: "Near Equal", description: "Weak directional preference", values: { a: 1.1, b: 0.08, d: 1.0, vectorAngle: 58 } },
    ],
    controls: [
      { key: "a", label: "Matrix Entry A", min: -2, max: 3, step: 0.05, unit: "", description: "Sets the horizontal-axis stretch in the symmetric matrix. It moves the eigenvalues and can rotate the dominant eigen direction when combined with Coupling." },
      { key: "b", label: "Coupling Entry B", min: -2, max: 2, step: 0.05, unit: "", description: "Sets the off-diagonal coupling. Higher magnitude mixes x and y, rotating the eigenvectors away from the coordinate axes." },
      { key: "d", label: "Matrix Entry D", min: -2, max: 3, step: 0.05, unit: "", description: "Sets the vertical-axis stretch in the symmetric matrix. Compare it with Matrix Entry A to see which eigen direction dominates." },
      { key: "vectorAngle", label: "Test Vector Angle", min: -180, max: 180, step: 1, unit: "deg", description: "Rotates the test vector. When it lines up with an eigenvector, the transformed vector stays on the same line and only scales or flips." },
    ],
    metrics: (p) => {
      const state = eigenState(p);
      return [
        { label: "Lambda 1", value: format(state.lambda1, 2), tone: "#f4c95d", icon: Sigma },
        { label: "Lambda 2", value: format(state.lambda2, 2), tone: "#ff4df0", icon: Sigma },
        { label: "Stretch", value: format(state.stretch, 2), tone: "#a9ef78", icon: Compass },
        { label: "Alignment", value: `${format((1 - state.aligned) * 100, 0)}%`, tone: "#7ff8ff", icon: CircleGauge },
      ];
    },
    chart: (p) => ({
      label: "Stretch Factor vs Vector Angle (deg)",
      points: Array.from({ length: 120 }, (_, i) => {
        const vectorAngle = -180 + (i / 119) * 360;
        return { x: vectorAngle, y: eigenState({ ...p, vectorAngle }).stretch };
      }),
      activeX: p.vectorAngle,
      activeY: eigenState(p).stretch,
      color: "#a9ef78",
      xUnit: "deg",
      yUnit: "x",
    }),
    equations: [String.raw`A\vec{v}=\lambda\vec{v}`, String.raw`A=\begin{bmatrix}a&b\\b&d\end{bmatrix}`, String.raw`\lambda^2-\mathrm{tr}(A)\lambda+\det(A)=0`],
    explanation: "An eigenvector is a direction that a matrix does not rotate away from. The eigenvalue says how much that direction is stretched, compressed, or flipped.",
    history: {
      body: [
        "Eigenvalue ideas appeared in problems about axes, vibrations, conic sections, and differential equations before the modern word eigenvector became standard. The core question was practical: which directions or modes keep their identity under a transformation?",
        "In mechanics and physics, eigenvectors became indispensable because natural modes often decouple complicated motion. A vibrating string, a rotating rigid body, a quantum state, or a data covariance matrix can become clearer when expressed in its own preferred directions.",
        "The name comes from German mathematical language, where eigen means own or characteristic. That wording is apt: eigenvectors are the matrix's own directions, the directions that reveal what the transformation is intrinsically doing.",
      ],
      cards: [historyCards.cayley, historyCards.grassmann, historyCards.matrix],
      links: [
        { label: "Eigenvalues And Eigenvectors", href: "https://en.wikipedia.org/wiki/Eigenvalues_and_eigenvectors" },
        { label: "Principal Component Analysis", href: "https://en.wikipedia.org/wiki/Principal_component_analysis" },
      ],
    },
  },
  "linear-regression": {
    kind: "regression",
    title: "Linear Regression",
    eyebrow: "Statistics Micro Lab",
    status: "Least-Squares Fit",
    initial: { trueSlope: 1.35, trueIntercept: 1.2, noise: 1.4, sampleSize: 26 },
    controls: [
      { key: "trueSlope", label: "True Slope", min: -3, max: 3, step: 0.05, unit: "", description: "Sets the underlying trend used to generate the data cloud. Watch the fitted line chase this value, especially when Noise is low or Sample Size is high." },
      { key: "trueIntercept", label: "True Intercept", min: -5, max: 5, step: 0.1, unit: "", description: "Shifts the underlying line up or down. The fitted intercept follows it, while slope mostly controls tilt." },
      { key: "noise", label: "Noise", min: 0, max: 5, step: 0.1, unit: "", description: "Adds vertical scatter around the trend. Higher noise makes residuals longer, raises RMSE, and usually lowers R Squared." },
      { key: "sampleSize", label: "Sample Size", min: 6, max: 60, step: 1, unit: "", description: "Sets how many observations appear. Larger samples make the fitted line less sensitive to any one noisy point." },
    ],
    metrics: (p) => {
      const state = regressionState(p);
      return [
        { label: "Fitted Slope", value: format(state.slope, 2), tone: "#7ff8ff", icon: Activity },
        { label: "Intercept", value: format(state.intercept, 2), tone: "#f4c95d", icon: Compass },
        { label: "R Squared", value: format(state.r2, 3), tone: "#a9ef78", icon: CircleGauge },
        { label: "RMSE", value: format(state.rmse, 2), tone: "#ff4df0", icon: Zap },
      ];
    },
    chart: (p) => {
      const state = regressionState(p);
      const span = Math.max(1.2, Math.abs(state.slope) * 0.6 + 1.5);
      const points = Array.from({ length: 90 }, (_, i) => {
        const slope = state.slope - span + (i / 89) * span * 2;
        const intercept = state.meanY - slope * state.meanX;
        const sse = state.points.reduce((sum, point) => sum + (point.y - (intercept + slope * point.x)) ** 2, 0);
        return { x: slope, y: sse };
      });
      return { label: "Squared Error vs Candidate Slope", points, activeX: state.slope, activeY: state.ssRes, color: "#ff4df0", xUnit: "slope", yUnit: "SSE" };
    },
    equations: [String.raw`\hat{y}=b_0+b_1x`, String.raw`b_1=\frac{\sum(x_i-\bar{x})(y_i-\bar{y})}{\sum(x_i-\bar{x})^2}`, String.raw`R^2=1-\frac{SS_{res}}{SS_{tot}}`],
    explanation: "Linear regression finds the straight line that minimizes squared vertical residuals between observed points and predicted values. Noise makes residuals larger, sample size stabilizes the fit, and R Squared reports how much variation the line explains.",
    history: {
      body: [
        "Least squares emerged from astronomy and geodesy, where scientists had many imperfect observations and needed one defensible estimate. Legendre published the method in 1805 as a practical rule: choose the values that make the sum of squared errors as small as possible.",
        "Gauss argued that he had used the method earlier for orbit calculations and connected it to error theory. The link between measurement errors, the normal distribution, and least-squares fitting made regression part of a larger program: extracting structure from noisy data rather than pretending the noise was not there.",
        "The word regression became famous through Galton's nineteenth-century work on heredity, especially regression toward the mean. Modern regression is much broader than a single straight line, but the simple line remains the clearest entry point because slope, intercept, residuals, and explained variation are all visible at once.",
      ],
      cards: [historyCards.legendre, historyCards.gauss, historyCards.galton],
      links: [
        { label: "Linear Regression", href: "https://en.wikipedia.org/wiki/Linear_regression" },
        { label: "Least Squares", href: "https://en.wikipedia.org/wiki/Least_squares" },
        { label: "Regression Toward The Mean", href: "https://en.wikipedia.org/wiki/Regression_toward_the_mean" },
      ],
    },
  },
  "pythagorean-theorem": {
    kind: "pythagorean",
    title: "Pythagorean Theorem",
    eyebrow: "Geometry Micro Lab",
    status: "Right-Triangle Area",
    initial: { legA: 3, legB: 4 },
    presets: [
      { label: "3-4-5", description: "Classic integer triple", values: { legA: 3, legB: 4 } },
      { label: "5-12-13", description: "Longer exact triple", values: { legA: 5, legB: 12 } },
      { label: "8-15-17", description: "Steeper exact triple", values: { legA: 8, legB: 15 } },
      { label: "Isosceles", description: "Equal legs", values: { legA: 6, legB: 6 } },
      { label: "Shallow", description: "Small rise, long run", values: { legA: 11, legB: 3 } },
      { label: "Steep", description: "Tall rise, short run", values: { legA: 4, legB: 10 } },
    ],
    controls: [
      { key: "legA", label: "Leg A", min: 1, max: 15, step: 0.1, unit: "u", description: "Sets the horizontal leg of the right triangle. Increasing it grows the yellow square area by a squared amount and lengthens the hypotenuse." },
      { key: "legB", label: "Leg B", min: 1, max: 15, step: 0.1, unit: "u", description: "Sets the vertical leg of the right triangle. Increasing it grows the magenta square area and steepens the hypotenuse angle." },
    ],
    metrics: (p) => {
      const state = pythagoreanState(p);
      return [
        { label: "Hypotenuse", value: `${format(state.c, 2)} u`, tone: "#7ff8ff", icon: Compass },
        { label: "Area A Squared", value: `${format(state.areaA, 2)} u2`, tone: "#f4c95d", icon: Box },
        { label: "Area B Squared", value: `${format(state.areaB, 2)} u2`, tone: "#ff4df0", icon: Box },
        { label: "Triangle Area", value: `${format(state.triangleArea, 2)} u2`, tone: "#a9ef78", icon: Sigma },
      ];
    },
    chart: (p) => ({
      label: "Hypotenuse (u) vs Leg B (u)",
      points: Array.from({ length: 100 }, (_, i) => {
        const legB = 1 + (i / 99) * 14;
        return { x: legB, y: pythagoreanState({ ...p, legB }).c };
      }),
      activeX: p.legB,
      activeY: pythagoreanState(p).c,
      color: "#7ff8ff",
      xUnit: "u",
      yUnit: "u",
    }),
    equations: [String.raw`a^2+b^2=c^2`, String.raw`c=\sqrt{a^2+b^2}`, String.raw`A_{\triangle}=\frac{1}{2}ab`],
    explanation: "The Pythagorean theorem links side lengths in a right triangle. The two square areas built on the legs add exactly to the square area built on the hypotenuse.",
    history: {
      body: [
        "The relationship between right-triangle sides was known in several ancient mathematical cultures, including Babylonian and Indian traditions, before it became attached to Pythagoras in Greek mathematical memory. The theorem is therefore both a specific result and a marker of how geometry traveled between practical measurement and proof.",
        "Euclid's Elements gave the theorem a durable proof-based form. Instead of treating 3-4-5 as a useful builder's trick, Euclidean geometry made the area relationship general for every right triangle.",
        "The theorem remains foundational because it turns perpendicular directions into distance. It appears in coordinate geometry, vector length, complex numbers, physics resultants, computer graphics, surveying, navigation, and almost every later geometry system that uses a notion of straight-line distance.",
      ],
      cards: [historyCards.pythagoras, historyCards.euclid, historyCards.pythagoreanDiagram],
      links: [
        { label: "Pythagorean Theorem", href: "https://en.wikipedia.org/wiki/Pythagorean_theorem" },
        { label: "Euclid's Elements", href: "https://en.wikipedia.org/wiki/Euclid%27s_Elements" },
        { label: "Pythagorean Triple", href: "https://en.wikipedia.org/wiki/Pythagorean_triple" },
      ],
    },
  },
  "unit-circle": {
    kind: "unitcircle",
    title: "Unit Circle",
    eyebrow: "Trigonometry Micro Lab",
    status: "Angle Coordinates",
    initial: { angle: 42, radius: 1, angularSpeed: 36 },
    animation: { label: "Spin Angle", paramKey: "angle", speedPerSecond: 36, speedParamKey: "angularSpeed", min: 0, max: 360 },
    presets: [
      { label: "0°", description: "Positive X axis", values: { angle: 0 } },
      { label: "30°", description: "Common exact angle", values: { angle: 30 } },
      { label: "45°", description: "Equal sine and cosine", values: { angle: 45 } },
      { label: "60°", description: "Common exact angle", values: { angle: 60 } },
      { label: "90°", description: "Top of the circle", values: { angle: 90 } },
      { label: "180°", description: "Negative X axis", values: { angle: 180 } },
      { label: "270°", description: "Bottom of the circle", values: { angle: 270 } },
      { label: "360°", description: "One full turn", values: { angle: 360 } },
    ],
    controls: [
      { key: "angle", label: "Angle", min: -180, max: 360, step: 1, unit: "deg", description: "Rotates the point around the circle. Watch cosine track horizontal projection, sine track vertical projection, and tangent rise sharply near 90 degrees and 270 degrees." },
      { key: "radius", label: "Radius Scale", min: 0.6, max: 1.3, step: 0.01, unit: "x", description: "Scales the displayed circle without changing sine or cosine values. Use it to see that the unit-circle ratios are about angle, not drawing size." },
      { key: "angularSpeed", label: "Angular Speed", min: 6, max: 180, step: 1, unit: "deg/s", description: "Sets how quickly Spin Angle moves around the circle. Higher speed makes the rotating point and linked sine/cosine markers sweep faster; the instantaneous sine and cosine values still come only from angle." },
    ],
    metrics: (p) => {
      const state = unitCircleState(p);
      return [
        { label: "Radians", value: `${format(state.radians, 3)} rad`, tone: "#7ff8ff", icon: CircleGauge },
        { label: "Cosine", value: format(state.cos, 3), tone: "#f4c95d", icon: Activity },
        { label: "Sine", value: format(state.sin, 3), tone: "#ff4df0", icon: Waves },
        { label: "Tangent", value: Math.abs(state.tan) > 9 ? "undefined" : format(state.tan, 3), tone: "#a9ef78", icon: Compass },
      ];
    },
    chart: (p) => ({
      label: "Sine And Cosine vs Angle (deg)",
      points: Array.from({ length: 120 }, (_, i) => {
        const angle = -180 + (i / 119) * 540;
        return { x: angle, y: Math.sin(degToRad(angle)) };
      }),
      activeX: p.angle,
      activeY: Math.sin(degToRad(p.angle)),
      color: "#ff4df0",
      xUnit: "deg",
      yUnit: "sin",
    }),
    equations: [String.raw`x=\cos\theta`, String.raw`y=\sin\theta`, String.raw`\sin^2\theta+\cos^2\theta=1`, String.raw`\tan\theta=\frac{\sin\theta}{\cos\theta}`],
    explanation: "The unit circle turns angle into coordinates. Cosine is the horizontal coordinate, sine is the vertical coordinate, tangent is their ratio, and radians measure arc length on a radius-one circle.",
    history: {
      body: [
        "Trigonometry began as a practical tool for astronomy, surveying, navigation, and calendars. Ancient chord tables, including work associated with Ptolemy, solved geometric angle problems before sine and cosine notation took their modern form.",
        "Indian and Islamic mathematicians developed sine tables and computational techniques that moved trigonometry closer to the functions used today. The conceptual shift was gradual: angles stopped being only parts of triangles and became inputs to reusable mathematical functions.",
        "The unit circle became the clean organizing picture because it unifies triangles, radians, periodic waves, and coordinates. Euler's notation and identities later connected trigonometry to complex exponentials, making sine and cosine central to oscillations, Fourier analysis, and physics.",
      ],
      cards: [historyCards.ptolemy, historyCards.euler, historyCards.unitCircleDiagram],
      links: [
        { label: "Unit Circle", href: "https://en.wikipedia.org/wiki/Unit_circle" },
        { label: "Trigonometry", href: "https://en.wikipedia.org/wiki/Trigonometry" },
        { label: "Euler's Formula", href: "https://en.wikipedia.org/wiki/Euler%27s_formula" },
      ],
    },
  },
  "binomial-distribution": {
    kind: "binomial",
    title: "Binomial Distribution",
    eyebrow: "Probability Micro Lab",
    status: "Discrete Outcomes",
    initial: { trials: 12, probability: 0.5, successes: 6 },
    presets: [
      { label: "Coin 10", description: "10 fair flips", values: { trials: 10, probability: 0.5, successes: 5 } },
      { label: "Coin 20", description: "20 fair flips", values: { trials: 20, probability: 0.5, successes: 10 } },
      { label: "Rare 5%", description: "Rare event count", values: { trials: 30, probability: 0.05, successes: 1 } },
      { label: "Quality 2%", description: "Defect sampling", values: { trials: 40, probability: 0.02, successes: 0 } },
      { label: "Biased 70%", description: "Weighted success", values: { trials: 16, probability: 0.7, successes: 11 } },
      { label: "Quiz 25%", description: "Four-choice guess", values: { trials: 12, probability: 0.25, successes: 3 } },
    ],
    controls: [
      { key: "trials", label: "Trials", min: 1, max: 40, step: 1, unit: "", description: "Sets how many independent yes/no trials occur. More trials create more possible bars and usually spread the distribution over a wider count range." },
      { key: "probability", label: "Success Probability", min: 0.01, max: 0.99, step: 0.01, unit: "", description: "Sets the chance of success on each trial. Values near 0.5 make a balanced distribution; values near 0 or 1 skew outcomes toward one side." },
      { key: "successes", label: "Highlighted Successes", min: 0, max: 40, step: 1, unit: "", description: "Chooses the outcome count to highlight. The selected bar reports exact probability, while the cumulative value reports the chance of getting this many successes or fewer." },
    ],
    metrics: (p) => {
      const state = binomialState(p);
      return [
        { label: "Exact Probability", value: `${format(state.selectedProbability * 100, 2)}%`, tone: "#f4c95d", icon: CircleGauge },
        { label: "Expected Count", value: format(state.mean, 2), tone: "#a9ef78", icon: Activity },
        { label: "Std. Deviation", value: format(state.sigma, 2), tone: "#7ff8ff", icon: Waves },
        { label: "Cumulative", value: `${format(state.cumulativeProbability * 100, 1)}%`, tone: "#ff4df0", icon: Sigma },
      ];
    },
    chart: (p) => {
      const state = binomialState(p);
      return {
        label: "Probability (%) vs Success Count",
        points: state.points.map((point) => ({ x: point.k, y: point.probability * 100 })),
        activeX: state.k,
        activeY: state.selectedProbability * 100,
        color: "#f4c95d",
        xUnit: "k",
        yUnit: "%",
      };
    },
    equations: [String.raw`P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}`, String.raw`\mu=np`, String.raw`\sigma=\sqrt{np(1-p)}`],
    explanation: "The binomial distribution models the number of successes in a fixed number of independent trials when each trial has the same success probability. It is the natural model for coin flips, pass/fail checks, defect counts, and repeated yes/no experiments.",
    history: {
      body: [
        "Binomial thinking grew out of counting and games of chance. Pascal's triangle organizes the number of ways successes and failures can occur, which is why the middle outcomes in fair repeated trials have more combinations behind them.",
        "The correspondence between Pascal and Fermat helped turn gambling problems into formal probability. Bernoulli later used repeated trials to study long-run behavior, connecting binomial counts with the law of large numbers.",
        "Today the binomial distribution is a first model for discrete uncertainty: quality control, polling, genetics, reliability testing, medical trials, and simple machine-learning classifiers all use versions of the same repeated-trial logic.",
      ],
      cards: [historyCards.pascal, historyCards.bernoulli, historyCards.pascalTriangle],
      links: [
        { label: "Binomial Distribution", href: "https://en.wikipedia.org/wiki/Binomial_distribution" },
        { label: "Pascal's Triangle", href: "https://en.wikipedia.org/wiki/Pascal%27s_triangle" },
        { label: "Bernoulli Trial", href: "https://en.wikipedia.org/wiki/Bernoulli_trial" },
      ],
    },
  },
  "exponential-growth": {
    kind: "exponential",
    title: "Exponential Growth",
    eyebrow: "Functions Micro Lab",
    status: "Growth And Decay",
    initial: { initialValue: 10, rate: 0.18, time: 8 },
    presets: [
      { label: "Doubling", description: "Clean doubling-time example", values: { initialValue: 10, rate: 0.231, time: 3 } },
      { label: "Half-Life", description: "Symmetric exponential decay", values: { initialValue: 80, rate: -0.231, time: 3 } },
      { label: "Compound", description: "Slow compounding growth", values: { initialValue: 100, rate: 0.07, time: 10 } },
      { label: "Cooling", description: "Fast decay shape", values: { initialValue: 90, rate: -0.18, time: 8 } },
      { label: "Runaway", description: "Steep positive growth", values: { initialValue: 4, rate: 0.42, time: 9 } },
      { label: "Flat", description: "Zero rate, no change", values: { initialValue: 35, rate: 0, time: 12 } },
    ],
    controls: [
      { key: "initialValue", label: "Initial Value", min: 1, max: 120, step: 1, unit: "", description: "Sets the starting amount at time zero. Every later value is this starting amount multiplied by the exponential factor, so changing it scales the whole curve." },
      { key: "rate", label: "Growth Rate", min: -0.8, max: 0.8, step: 0.01, unit: "1/t", description: "Sets the continuous percent-like rate. Positive values make equal time steps multiply upward; negative values make equal time steps multiply downward; zero makes the curve flat." },
      { key: "time", label: "Elapsed Time", min: 0, max: 20, step: 0.1, unit: "t", description: "Moves the current marker along the curve. Notice that exponential change depends on both rate and elapsed time through the product kt." },
    ],
    metrics: (p) => {
      const state = exponentialState(p);
      const timeLabel = state.rate >= 0 ? "Doubling Time" : "Half-Life";
      return [
        { label: "Current Value", value: format(state.current, 2), tone: state.rate >= 0 ? "#a9ef78" : "#ff4df0", icon: Activity },
        { label: "Multiplier", value: `${format(state.multiplier, 2)}x`, tone: "#7ff8ff", icon: Sigma },
        { label: timeLabel, value: Number.isFinite(state.characteristicTime) ? `${format(state.characteristicTime, 2)} t` : "infinite", tone: "#f4c95d", icon: CircleGauge },
        { label: "Instant Slope", value: `${format(state.slope, 2)}/t`, tone: "#ff4df0", icon: Zap },
      ];
    },
    chart: (p) => {
      const state = exponentialState(p);
      return {
        label: "Quantity vs Time (t)",
        points: Array.from({ length: 100 }, (_, i) => {
          const time = (i / 99) * 20;
          return { x: time, y: exponentialState({ ...p, time }).current };
        }),
        activeX: state.time,
        activeY: state.current,
        color: state.rate >= 0 ? "#a9ef78" : "#ff4df0",
        xUnit: "t",
        yUnit: "y",
      };
    },
    equations: [String.raw`y=y_0e^{kt}`, String.raw`\frac{dy}{dt}=ky`, String.raw`T_d=\frac{\ln 2}{k}`],
    explanation: "Exponential change means the amount changes by a fixed fraction per unit time, not a fixed amount. Growth accelerates because the rate is proportional to what already exists; decay slows because there is less remaining to lose.",
    history: {
      body: [
        "Exponential relationships became visible when mathematicians learned to compare multiplication and addition through logarithms. Napier's logarithms turned difficult repeated multiplication into table lookup and addition, which made growth ratios, astronomy, navigation, and later engineering calculations much more practical.",
        "Euler's notation helped turn the exponential into a central function rather than only a table technique. The number e appears naturally when compounding is made continuous, and the equation dy/dt = ky captures the defining feature: the present amount determines the instantaneous change rate.",
        "Malthus made exponential growth famous outside pure mathematics by arguing that unchecked populations could multiply geometrically. The same curve now appears in compound interest, radioactive decay, cooling approximations, microbial growth before resources run out, viral spread before saturation, and first-order chemical kinetics.",
      ],
      cards: [historyCards.napier, historyCards.euler, historyCards.malthus, historyCards.exponentialCurve],
      links: [
        { label: "Exponential Function", href: "https://en.wikipedia.org/wiki/Exponential_function" },
        { label: "Logarithm", href: "https://en.wikipedia.org/wiki/Logarithm" },
        { label: "Malthusian Growth Model", href: "https://en.wikipedia.org/wiki/Malthusian_growth_model" },
      ],
    },
  },
  "hookes-law": {
    kind: "spring",
    title: "Hooke's Law Spring",
    eyebrow: "Oscillation Micro Lab",
    status: "Restoring Force",
    initial: { k: 4.8, mass: 2.2, damping: 1.3, displacement: 0.8 },
    controls: [
      { key: "k", label: "Spring Constant", min: 1, max: 9, step: 0.1, unit: "N/m", description: "Controls spring stiffness. Higher values make the spring force and stored energy rise faster for the same displacement, and shorten the oscillation period." },
      { key: "mass", label: "Mass", min: 0.5, max: 6, step: 0.1, unit: "kg", description: "Controls the block inertia. More mass makes the block larger and slows the oscillation, but does not change Hooke's law force for a fixed displacement." },
      { key: "damping", label: "Damping", min: 0.5, max: 4, step: 0.1, unit: "", description: "Controls how quickly motion is suppressed. Higher damping reduces visible oscillation; stiffness and mass still define the undamped natural period." },
      { key: "displacement", label: "Displacement", min: -2, max: 2, step: 0.05, unit: "m", description: "Sets how far the block starts from equilibrium. Watch the restoring-force arrow flip direction across zero and grow with both displacement and spring constant." },
    ],
    metrics: (p) => [
      { label: "Spring Force", value: `${format(Math.abs(p.k * p.displacement), 2)} N`, tone: "#f4c95d", icon: Zap },
      { label: "Period", value: `${format(TAU * Math.sqrt(p.mass / p.k), 2)} s`, tone: "#7ff8ff", icon: CircleGauge },
      { label: "Elastic Energy", value: `${format(0.5 * p.k * p.displacement ** 2, 2)} J`, tone: "#ff4df0", icon: BatteryCharging },
      { label: "Natural Frequency", value: `${format(Math.sqrt(p.k / p.mass), 2)} rad/s`, tone: "#a9ef78", icon: Waves },
    ],
    chart: (p) => ({
      label: "Spring Force (N) vs Displacement (m)",
      points: Array.from({ length: 80 }, (_, i) => {
        const x = -2 + (i / 79) * 4;
        return { x, y: -p.k * x };
      }),
      activeX: p.displacement,
      activeY: -p.k * p.displacement,
      color: "#f4c95d",
      xUnit: "m",
      yUnit: "N",
    }),
    equations: [String.raw`F=-kx`, String.raw`U=\frac{1}{2}kx^2`, String.raw`T=2\pi\sqrt{\frac{m}{k}}`],
    explanation: "The spring pulls opposite the displacement. Higher stiffness increases force and energy; higher mass slows the oscillation.",
    history: {
      body: [
        "Robert Hooke published the elastic law in the seventeenth century after studying springs, balances, and mechanical instruments. His phrase meant, in modern terms, that extension is proportional to load as long as the material stays in its elastic range.",
        "The law became useful far beyond metal springs. It gave scientists a simple linear model for restoring forces, which then made clocks, seismometers, vibration analysis, acoustics, and material testing mathematically manageable.",
        "Its simplicity is also its limitation: real materials eventually yield, creep, heat, or break. The simulator is showing the clean elastic core before those complications enter.",
      ],
      cards: [historyCards.hooke, historyCards.spring],
      links: [
        { label: "Hooke's Law", href: "https://en.wikipedia.org/wiki/Hooke%27s_law" },
        { label: "Robert Hooke", href: "https://en.wikipedia.org/wiki/Robert_Hooke" },
      ],
    },
  },
  "projectile-motion": {
    kind: "projectile",
    title: "Projectile Motion",
    eyebrow: "Trajectory Micro Lab",
    status: "Bounce And Roll",
    initial: { velocity: 28, angle: 42, gravity: 9.8, restitution: 0.55, rollingFriction: 0.035 },
    controls: [
      { key: "velocity", label: "Launch Speed", min: 8, max: 48, step: 1, unit: "m/s", description: "Sets initial speed. Higher speed increases range, height, and flight time; its effect is split into horizontal and vertical components by Launch Angle." },
      { key: "angle", label: "Launch Angle", min: 5, max: 85, step: 1, unit: "deg", description: "Sets how launch speed is divided between horizontal travel and vertical lift. Around 45° maximizes range when launch and landing heights match." },
      { key: "gravity", label: "Gravity", min: 1.6, max: 24, step: 0.1, unit: "m/s2", description: "Sets downward acceleration. Higher gravity pulls the arc down sooner, reducing height, flight time, and range for the same launch speed." },
      { key: "restitution", label: "Bounce Elasticity", min: 0, max: 0.92, step: 0.01, unit: "", description: "Sets the coefficient of restitution. A value of 0 kills vertical bounce at impact; a value near 1 preserves most vertical speed, making the bounce sequence taller and longer." },
      { key: "rollingFriction", label: "Rolling Friction", min: 0.004, max: 0.14, step: 0.001, unit: "", description: "Sets the rolling-resistance coefficient after bounces become tiny. Higher values decelerate the rolling object faster and shorten the stop distance." },
    ],
    metrics: (p) => {
      const state = projectileState(p);
      return [
        { label: "First Impact", value: `${format(state.firstRange, 1)} m`, tone: "#7ff8ff", icon: Compass },
        { label: "First Bounce Height", value: `${format(state.firstBounceHeight, 1)} m`, tone: "#f4c95d", icon: Activity },
        { label: "Roll Stop Distance", value: `${format(state.rollStopDistance, 1)} m`, tone: "#a9ef78", icon: Zap },
        { label: "Rolling Decel.", value: `${format(state.rollingDeceleration, 2)} m/s2`, tone: "#ff4df0", icon: CircleGauge },
      ];
    },
    chart: (p) => ({
      label: "Range (m) vs Launch Angle (deg)",
      points: Array.from({ length: 80 }, (_, i) => {
        const angle = 5 + (i / 79) * 80;
        return { x: angle, y: (p.velocity ** 2 * Math.sin(2 * degToRad(angle))) / p.gravity };
      }),
      activeX: p.angle,
      activeY: projectileState(p).firstRange,
      color: "#7ff8ff",
      xUnit: "deg",
      yUnit: "m",
    }),
    equations: [String.raw`x=v_0\cos(\theta)t`, String.raw`y=v_0\sin(\theta)t-\frac{1}{2}gt^2`, String.raw`v_y^+=e|v_y^-|`, String.raw`a_r=\mu_r g`, String.raw`d_r=\frac{v_x^2}{2\mu_r g}`],
    explanation: "Projectile motion splits into constant horizontal velocity and vertical acceleration from gravity. Impacts use a coefficient of restitution for vertical rebound, then rolling friction decelerates the object after bounces become visually tiny.",
    history: {
      body: [
        "Projectile motion was once explained through Aristotelian ideas of natural and violent motion. Galileo's key move was to separate horizontal motion from vertical falling, making the path a mathematical curve rather than a story about an object seeking its natural place.",
        "Inclined-plane experiments and timing arguments made it plausible that vertical motion accelerates uniformly while horizontal motion can remain steady. Newton's laws later turned that into a force model: gravity changes vertical velocity while inertia preserves horizontal velocity.",
        "The parabolic trajectory became a standard test case for mechanics because it joins geometry, measurement, and prediction. Artillery, sports, fountains, and spaceflight all extend the same component logic.",
      ],
      cards: [historyCards.galileo, historyCards.newton],
      links: [
        { label: "Projectile Motion", href: "https://en.wikipedia.org/wiki/Projectile_motion" },
        { label: "Galileo Galilei", href: "https://en.wikipedia.org/wiki/Galileo_Galilei" },
      ],
    },
  },
  "wave-superposition": {
    kind: "superposition",
    title: "Wave Superposition",
    eyebrow: "Wave Micro Lab",
    status: "Live Sum Wave",
    initial: { ampA: 1.0, ampB: 0.8, freqA: 2, freqB: 2, phase: 65 },
    controls: [
      { key: "ampA", label: "Wave A Amplitude", min: 0, max: 1.8, step: 0.05, unit: "", description: "Sets the height of the cyan wave. In the yellow sum, larger amplitude gives Wave A more influence over constructive and destructive interference." },
      { key: "ampB", label: "Wave B Amplitude", min: 0, max: 1.8, step: 0.05, unit: "", description: "Sets the height of the magenta wave. Equal amplitudes can cancel deeply when out of phase; unequal amplitudes leave a residual wave." },
      { key: "freqA", label: "Wave A Frequency", min: 1, max: 5, step: 0.1, unit: "Hz", description: "Controls how tightly Wave A oscillates across the display. When it differs from Wave B Frequency, the sum develops beats and shifting reinforcement zones." },
      { key: "freqB", label: "Wave B Frequency", min: 1, max: 5, step: 0.1, unit: "Hz", description: "Controls how tightly Wave B oscillates. Compare it with Wave A Frequency; the beat gap metric is the absolute difference between them." },
      { key: "phase", label: "Phase Offset", min: 0, max: 360, step: 1, unit: "deg", description: "Slides Wave B relative to Wave A. Near 0° the waves reinforce; near 180° equal waves cancel, making the yellow sum flatten." },
    ],
    metrics: (p) => [
      { label: "Max Sum", value: format(p.ampA + p.ampB, 2), tone: "#f4c95d", icon: Waves },
      { label: "Phase Offset", value: `${format(p.phase, 0)} deg`, tone: "#ff4df0", icon: CircleGauge },
      { label: "Beat Gap", value: `${format(Math.abs(p.freqA - p.freqB), 2)} Hz`, tone: "#7ff8ff", icon: Activity },
      { label: "Mean Amplitude", value: format((p.ampA + p.ampB) / 2, 2), tone: "#a9ef78", icon: Zap },
    ],
    chart: (p) => ({
      label: "Sum Wave Amplitude vs Position",
      points: Array.from({ length: 120 }, (_, i) => {
        const x = i / 119;
        return { x, y: p.ampA * Math.sin(TAU * p.freqA * x) + p.ampB * Math.sin(TAU * p.freqB * x + degToRad(p.phase)) };
      }),
      activeX: 0.5,
      activeY: p.ampA * Math.sin(Math.PI * p.freqA) + p.ampB * Math.sin(Math.PI * p.freqB + degToRad(p.phase)),
      color: "#f4c95d",
      xUnit: "x",
      yUnit: "Amp.",
    }),
    equations: [String.raw`y=y_1+y_2`, String.raw`y=A_1\sin(kx-\omega t)+A_2\sin(kx-\omega t+\phi)`],
    explanation: "Superposition means the displacement at each point is just the sum of the individual wave displacements.",
    history: {
      body: [
        "Superposition grew out of everyday wave observations: water ripples crossing, sound waves adding, and light producing bright and dark bands. The essential claim is restrained but powerful: in a linear medium, overlapping disturbances add at each point.",
        "Fourier's work made the idea deeper by showing that complicated shapes can be assembled from simple sine and cosine waves. That changed heat theory, acoustics, optics, signal processing, and eventually quantum mechanics.",
        "The principle is not universal; nonlinear systems can create new frequencies or distort the sum. That boundary is part of why superposition is such a useful diagnostic: when the rule fails, the system is telling you it is no longer linear.",
      ],
      cards: [historyCards.interference, historyCards.fourier],
      links: [
        { label: "Superposition Principle", href: "https://en.wikipedia.org/wiki/Superposition_principle" },
        { label: "Fourier Analysis", href: "https://en.wikipedia.org/wiki/Fourier_analysis" },
      ],
    },
  },
  "standing-wave": {
    kind: "standingwave",
    title: "Standing Wave On A String",
    eyebrow: "Resonance Micro Lab",
    status: "Fixed-End Harmonics",
    initial: { length: 1.2, tension: 64, linearDensity: 2.5, harmonic: 3, amplitude: 0.92, animationRate: 1 },
    presets: [
      { label: "Fundamental", description: "One loop between fixed ends", values: { length: 1.2, tension: 64, linearDensity: 2.5, harmonic: 1, amplitude: 0.9, animationRate: 1 } },
      { label: "Second Harmonic", description: "One central node divides the string", values: { length: 1.2, tension: 64, linearDensity: 2.5, harmonic: 2, amplitude: 0.9, animationRate: 1 } },
      { label: "Third Harmonic", description: "Three antinodes and four nodes", values: { length: 1.2, tension: 64, linearDensity: 2.5, harmonic: 3, amplitude: 0.92, animationRate: 1 } },
      { label: "High Tension", description: "Tighter string raises every mode", values: { length: 1.2, tension: 140, linearDensity: 2.5, harmonic: 3, amplitude: 0.74, animationRate: 1.15 } },
      { label: "Heavy String", description: "More mass per length lowers pitch", values: { length: 1.2, tension: 64, linearDensity: 8, harmonic: 3, amplitude: 0.86, animationRate: 0.75 } },
      { label: "Long String", description: "Longer length lowers frequency", values: { length: 2.4, tension: 64, linearDensity: 2.5, harmonic: 2, amplitude: 0.9, animationRate: 0.85 } },
    ],
    controls: [
      { key: "length", label: "String Length", min: 0.4, max: 3, step: 0.01, unit: "m", description: "Sets the distance between fixed ends. Longer strings fit longer wavelengths, so every resonant frequency drops when tension and density stay fixed." },
      { key: "tension", label: "Tension", min: 4, max: 220, step: 1, unit: "N", description: "Sets how tightly the string is pulled. Higher tension increases wave speed and raises the frequency of every harmonic." },
      { key: "linearDensity", label: "Linear Density", min: 0.5, max: 12, step: 0.1, unit: "g/m", description: "Sets mass per unit length. Heavier strings carry waves more slowly, lowering the resonant frequencies for the same length and tension." },
      { key: "harmonic", label: "Harmonic Number", min: 1, max: 8, step: 1, unit: "n", description: "Selects the standing-wave mode. Higher harmonics squeeze more half-wavelengths between the fixed ends, adding nodes and antinodes while raising frequency." },
      { key: "amplitude", label: "Amplitude", min: 0.1, max: 1.5, step: 0.01, unit: "", description: "Sets the visual oscillation height. It makes antinodes easier to see; in the ideal small-amplitude model it does not change frequency." },
      { key: "animationRate", label: "Animation Rate", min: 0.2, max: 2.4, step: 0.05, unit: "x", description: "Scales the visual motion speed only. Use it to inspect nodes and antinodes without changing the physical frequency calculation." },
    ],
    metrics: (p) => {
      const state = standingWaveState(p);
      return [
        { label: "Mode Frequency", value: `${format(state.frequency, 1)} Hz`, tone: "#7ff8ff", icon: Waves },
        { label: "Wave Speed", value: `${format(state.waveSpeed, 1)} m/s`, tone: "#ff4df0", icon: Zap },
        { label: "Wavelength", value: `${format(state.wavelength, 2)} m`, tone: "#a9ef78", icon: Activity },
        { label: "Node Spacing", value: `${format(state.nodeSpacing, 2)} m`, tone: "#f4c95d", icon: CircleGauge },
      ];
    },
    chart: (p) => {
      const harmonic = Math.max(1, Math.round(p.harmonic));
      const points = Array.from({ length: 100 }, (_, i) => {
        const tension = 4 + (i / 99) * 216;
        return { x: tension, y: standingWaveState({ ...p, tension, harmonic }).frequency };
      });
      const state = standingWaveState(p);
      return {
        label: "Mode Frequency (Hz) vs Tension (N)",
        points,
        activeX: state.tension,
        activeY: state.frequency,
        color: "#7ff8ff",
        xUnit: "N",
        yUnit: "Hz",
      };
    },
    equations: [
      String.raw`v=\sqrt{\frac{T}{\mu}}`,
      String.raw`\lambda_n=\frac{2L}{n}`,
      String.raw`f_n=\frac{n}{2L}\sqrt{\frac{T}{\mu}}`,
      String.raw`y(x,t)=A\sin\left(\frac{n\pi x}{L}\right)\cos(\omega_n t)`,
    ],
    explanation: "A string fixed at both ends can resonate only when an integer number of half-wavelengths fits between the endpoints. Tension and linear density set wave speed; length and harmonic number decide which wavelengths are allowed.",
    history: {
      body: [
        "Standing waves are one of the oldest bridges between music and physics. Plucked strings made it obvious that length, tension, and string thickness changed pitch, but the underlying pattern is spatial: fixed endpoints become nodes while the loops between them become antinodes.",
        "Mersenne's laws gave an early quantitative description of vibrating strings, connecting frequency to length, tension, and mass per length. Those relationships made musical pitch into something measurable rather than only craft knowledge.",
        "Fourier analysis later made the harmonic idea universal. A real string motion can be understood as a mixture of allowed modes, which is why the same mathematics appears in musical instruments, microwave cavities, quantum boxes, and structural vibration tests.",
      ],
      cards: [historyCards.interference, historyCards.fourier],
      links: [
        { label: "Standing Wave", href: "https://en.wikipedia.org/wiki/Standing_wave" },
        { label: "Mersenne's Laws", href: "https://en.wikipedia.org/wiki/Mersenne%27s_laws" },
        { label: "Vibrating String", href: "https://en.wikipedia.org/wiki/Vibrating_string" },
      ],
    },
  },
  "doppler-effect": {
    kind: "doppler",
    title: "Doppler Effect",
    eyebrow: "Waves Micro Lab",
    status: "Moving Wavefronts",
    initial: { frequency: 440, waveSpeed: 343, sourceSpeed: 92, observerSpeed: 0 },
    presets: [
      { label: "Stationary Tone", description: "No motion, no frequency shift", values: { frequency: 440, waveSpeed: 343, sourceSpeed: 0, observerSpeed: 0 } },
      { label: "Approaching Siren", description: "Moving source raises observed pitch", values: { frequency: 440, waveSpeed: 343, sourceSpeed: 92, observerSpeed: 0 } },
      { label: "Receding Source", description: "Negative source speed stretches the waves", values: { frequency: 440, waveSpeed: 343, sourceSpeed: -92, observerSpeed: 0 } },
      { label: "Moving Observer", description: "Observer motion shifts the received wave rate", values: { frequency: 440, waveSpeed: 343, sourceSpeed: 0, observerSpeed: 42 } },
      { label: "Fast Train", description: "Strong but subsonic compression ahead", values: { frequency: 520, waveSpeed: 343, sourceSpeed: 210, observerSpeed: 0 } },
      { label: "Supersonic", description: "Source outruns wavefronts into a shock cone", values: { frequency: 320, waveSpeed: 343, sourceSpeed: 420, observerSpeed: 0 } },
    ],
    controls: [
      { key: "frequency", label: "Source Frequency", min: 120, max: 900, step: 1, unit: "Hz", description: "Sets the emitted tone before motion shifts it. The observer hears this same value only when source and observer are not moving relative to the medium." },
      { key: "waveSpeed", label: "Wave Speed", min: 180, max: 760, step: 1, unit: "m/s", description: "Sets how fast wavefronts travel through the medium. Higher wave speed weakens Doppler shifts for the same source or observer speed." },
      { key: "sourceSpeed", label: "Source Speed", min: -520, max: 520, step: 1, unit: "m/s", description: "Moves the emitter. Positive speed moves toward the observer and compresses wavefronts ahead; negative speed makes the source recede and lowers observed pitch." },
      { key: "observerSpeed", label: "Observer Speed", min: -180, max: 180, step: 1, unit: "m/s", description: "Moves the observer through incoming wavefronts. Moving toward the source meets crests faster; moving away meets them slower." },
    ],
    metrics: (p) => {
      const observed = p.frequency * ((p.waveSpeed + p.observerSpeed) / Math.max(1, p.waveSpeed - p.sourceSpeed));
      const mach = Math.abs(p.sourceSpeed) / Math.max(1, p.waveSpeed);
      const frontWavelength = Math.max(0.001, (p.waveSpeed - p.sourceSpeed) / p.frequency);
      return [
        { label: "Observed Frequency", value: `${format(observed, 0)} Hz`, tone: observed >= p.frequency ? "#ff4df0" : "#7ff8ff", icon: Waves },
        { label: "Frequency Shift", value: `${format(observed - p.frequency, 0)} Hz`, tone: "#f4c95d", icon: Activity },
        { label: "Mach Number", value: format(mach, 2), tone: mach >= 1 ? "#ff4df0" : "#a9ef78", icon: Zap },
        { label: "Front Wavelength", value: `${format(frontWavelength, 2)} m`, tone: "#7ff8ff", icon: CircleGauge },
      ];
    },
    chart: (p) => ({
      label: "Observed Frequency (Hz) vs Source Speed (m/s)",
      points: Array.from({ length: 100 }, (_, i) => {
        const sourceSpeed = -280 + (i / 99) * 560;
        return { x: sourceSpeed, y: p.frequency * ((p.waveSpeed + p.observerSpeed) / Math.max(1, p.waveSpeed - sourceSpeed)) };
      }),
      activeX: p.sourceSpeed,
      activeY: p.frequency * ((p.waveSpeed + p.observerSpeed) / Math.max(1, p.waveSpeed - p.sourceSpeed)),
      color: "#7ff8ff",
      xUnit: "m/s",
      yUnit: "Hz",
    }),
    equations: [
      String.raw`f'=f\frac{v+v_o}{v-v_s}`,
      String.raw`\lambda_{\mathrm{front}}=\frac{v-v_s}{f}`,
      String.raw`M=\frac{|v_s|}{v}`,
    ],
    explanation: "The Doppler effect is the frequency shift caused by motion between a wave source, the medium, and an observer. Moving toward wavefronts compresses arrival spacing and raises observed frequency; moving away stretches arrivals and lowers it.",
    history: {
      body: [
        "Christian Doppler proposed the effect in 1842 while thinking about light from moving stars, but the same principle applies to sound, water waves, radar, medical ultrasound, and any wave with a source-observer motion relationship.",
        "The idea became convincing because sound made it immediately audible: a passing whistle or siren changes pitch as it approaches and recedes. That everyday pitch sweep is a direct measurement of wavefront spacing changing in front of and behind the source.",
        "Modern uses are broad. Astronomers infer stellar and galactic motion from spectral shifts, radar guns measure vehicle speed, Doppler ultrasound measures blood flow, and supersonic flight shows the extreme limit where wavefronts pile into a shock cone.",
      ],
      cards: [historyCards.doppler, historyCards.dopplerDiagram, historyCards.sonicBoom],
      links: [
        { label: "Doppler Effect", href: "https://en.wikipedia.org/wiki/Doppler_effect" },
        { label: "Christian Doppler", href: "https://en.wikipedia.org/wiki/Christian_Doppler" },
        { label: "Sonic Boom", href: "https://en.wikipedia.org/wiki/Sonic_boom" },
      ],
    },
  },
  pendulum: {
    kind: "pendulum",
    title: "Pendulum",
    eyebrow: "Period Micro Lab",
    status: "Energy Exchange",
    initial: { length: 4.2, angle: 28, gravity: 9.8, damping: 0.04 },
    controls: [
      { key: "length", label: "Length", min: 1, max: 7, step: 0.1, unit: "m", description: "Sets pendulum length. Longer pendulums swing more slowly and have a longer period; this dominates the timing more than starting angle for small swings." },
      { key: "angle", label: "Starting Angle", min: 2, max: 65, step: 1, unit: "deg", description: "Sets initial swing amplitude. Larger angles increase peak speed and arc size; very large angles depart from the small-angle period approximation." },
      { key: "gravity", label: "Gravity", min: 1.6, max: 24, step: 0.1, unit: "m/s2", description: "Sets downward acceleration. Higher gravity makes the pendulum swing faster, shortens the period, and raises peak speed for the same angle." },
      { key: "damping", label: "Damping", min: 0, max: 0.2, step: 0.01, unit: "", description: "Controls energy loss per swing. Higher damping shrinks the arc over time; length and gravity still set the underlying natural period." },
    ],
    metrics: (p) => [
      { label: "Period", value: `${format(TAU * Math.sqrt(p.length / p.gravity), 2)} s`, tone: "#7ff8ff", icon: CircleGauge },
      { label: "Frequency", value: `${format(1 / (TAU * Math.sqrt(p.length / p.gravity)), 2)} Hz`, tone: "#a9ef78", icon: Waves },
      { label: "Peak Speed", value: `${format(Math.sqrt(2 * p.gravity * p.length * (1 - Math.cos(degToRad(p.angle)))), 2)} m/s`, tone: "#f4c95d", icon: Zap },
      { label: "Arc Angle", value: `${format(p.angle, 0)} deg`, tone: "#ff4df0", icon: Compass },
    ],
    chart: (p) => ({
      label: "Period (s) vs Length (m)",
      points: Array.from({ length: 90 }, (_, i) => {
        const length = 1 + (i / 89) * 6;
        return { x: length, y: TAU * Math.sqrt(length / p.gravity) };
      }),
      activeX: p.length,
      activeY: TAU * Math.sqrt(p.length / p.gravity),
      color: "#7ff8ff",
      xUnit: "m",
      yUnit: "s",
    }),
    equations: [String.raw`T=2\pi\sqrt{\frac{L}{g}}`, String.raw`v_{max}=\sqrt{2gL(1-\cos\theta)}`],
    explanation: "For small swings, length and gravity set the period. The mass does not matter.",
    history: {
      body: [
        "Pendulums were studied as natural periodic systems before they became precision instruments. Galileo noticed their regularity, and later researchers used the pendulum as a way to connect motion, gravity, and time measurement.",
        "Christiaan Huygens built the first practical pendulum clock in the seventeenth century, dramatically improving timekeeping. That mattered for astronomy, navigation, experiments, and the ability to compare measurements made in different places.",
        "The small-angle formula is a deliberately idealized result. Real pendulums have air drag, finite amplitude corrections, pivot friction, and moving supports, but the simple model remains one of the cleanest entrances into oscillation theory.",
      ],
      cards: [historyCards.galileo, historyCards.huygens, historyCards.pendulumClock],
      links: [
        { label: "Pendulum", href: "https://en.wikipedia.org/wiki/Pendulum" },
        { label: "Christiaan Huygens", href: "https://en.wikipedia.org/wiki/Christiaan_Huygens" },
      ],
    },
  },
  "ohms-law": {
    kind: "ohm",
    title: "Ohm's Law Circuit",
    eyebrow: "Circuit Micro Lab",
    status: "Current Flow",
    initial: { voltage: 9, resistance: 6, pulse: 1 },
    controls: [
      { key: "voltage", label: "Voltage", min: 1, max: 24, step: 0.1, unit: "V", description: "Sets electrical push. With resistance fixed, higher voltage increases current and power, so the animated charge flow and current readout rise." },
      { key: "resistance", label: "Resistance", min: 1, max: 20, step: 0.1, unit: "ohm", description: "Sets opposition to current. Higher resistance lowers current at the same voltage and reduces power unless voltage is raised enough to compensate." },
      { key: "pulse", label: "Flow Pulse", min: 0.2, max: 2, step: 0.1, unit: "x", description: "Controls only the animation pacing of charge dots. It helps you inspect flow visually; it does not change Ohm's law values." },
    ],
    metrics: (p) => [
      { label: "Current", value: `${format(p.voltage / p.resistance, 2)} A`, tone: "#7ff8ff", icon: Zap },
      { label: "Power", value: `${format((p.voltage ** 2) / p.resistance, 2)} W`, tone: "#f4c95d", icon: BatteryCharging },
      { label: "Voltage", value: `${format(p.voltage, 1)} V`, tone: "#ff4df0", icon: Activity },
      { label: "Resistance", value: `${format(p.resistance, 1)} Ohm`, tone: "#a9ef78", icon: Magnet },
    ],
    chart: (p) => ({
      label: "Current (A) vs Voltage (V)",
      points: Array.from({ length: 80 }, (_, i) => {
        const voltage = 1 + (i / 79) * 23;
        return { x: voltage, y: voltage / p.resistance };
      }),
      activeX: p.voltage,
      activeY: p.voltage / p.resistance,
      color: "#7ff8ff",
      xUnit: "V",
      yUnit: "A",
    }),
    equations: [String.raw`V=IR`, String.raw`P=IV=\frac{V^2}{R}`],
    explanation: "Ohm's law says current rises with voltage and falls with resistance.",
    history: {
      body: [
        "Early electrical science had batteries, wires, shocks, and sparks before it had a clean quantitative language. Alessandro Volta's pile made steady current experiments possible, but scientists still needed a way to connect electrical push, material opposition, and measured flow.",
        "Georg Ohm's 1827 work proposed a simple proportional relation between voltage and current for conductors. The idea was not immediately celebrated, partly because electrical measurement was still difficult and the microscopic nature of current was not yet clear.",
        "Once standardized instruments and circuit theory matured, Ohm's law became one of the basic engineering laws. It is not a universal law of all materials, but it is the starting point for resistors, power calculations, sensors, and nearly every first circuit model.",
      ],
      cards: [historyCards.ohm, historyCards.volta, historyCards.voltaicPile, historyCards.resistor],
      links: [
        { label: "Ohm's Law", href: "https://en.wikipedia.org/wiki/Ohm%27s_law" },
        { label: "Georg Ohm", href: "https://en.wikipedia.org/wiki/Georg_Ohm" },
      ],
    },
  },
  "rc-circuit": {
    kind: "rc",
    title: "RC Circuit Charging",
    eyebrow: "Circuit Micro Lab",
    status: "Exponential Charging",
    initial: { sourceVoltage: 9, resistance: 4.7, capacitance: 100, time: 450 },
    presets: [
      { label: "Fast Sensor", description: "Small RC time constant", values: { sourceVoltage: 5, resistance: 1.5, capacitance: 47, time: 120 } },
      { label: "Timing Pulse", description: "Classic visible charge curve", values: { sourceVoltage: 9, resistance: 4.7, capacitance: 100, time: 450 } },
      { label: "Slow Fade", description: "Large capacitor and resistor", values: { sourceVoltage: 12, resistance: 18, capacitance: 330, time: 1600 } },
      { label: "Nearly Full", description: "Past several time constants", values: { sourceVoltage: 9, resistance: 6.8, capacitance: 220, time: 5200 } },
      { label: "Low Voltage", description: "Same timing with less stored energy", values: { sourceVoltage: 3.3, resistance: 4.7, capacitance: 100, time: 450 } },
      { label: "High Current", description: "Low resistance gives strong initial current", values: { sourceVoltage: 12, resistance: 0.82, capacitance: 220, time: 160 } },
    ],
    controls: [
      { key: "sourceVoltage", label: "Source Voltage", min: 1, max: 24, step: 0.1, unit: "V", description: "Sets the battery voltage the capacitor is charging toward. Higher voltage raises the final capacitor voltage, initial current, stored charge, and stored energy." },
      { key: "resistance", label: "Resistance", min: 0.5, max: 50, step: 0.1, unit: "kΩ", description: "Sets the resistor in series with the capacitor. Higher resistance lowers current and increases the time constant, so the capacitor approaches the final voltage more slowly." },
      { key: "capacitance", label: "Capacitance", min: 1, max: 1000, step: 1, unit: "µF", description: "Sets how much charge the capacitor stores per volt. Larger capacitance increases stored charge and energy, and with the same resistor it also lengthens the charging time constant." },
      { key: "time", label: "Elapsed Time", min: 0, max: 6000, step: 1, unit: "ms", description: "Moves the circuit clock along the exponential charge curve. At one time constant the capacitor reaches about 63 percent of the source voltage; after several time constants it is nearly full." },
    ],
    metrics: (p) => {
      const state = rcState(p);
      return [
        { label: "Time Constant", value: `${format(state.tauMs, 1)} ms`, tone: "#f4c95d", icon: CircleGauge },
        { label: "Capacitor Voltage", value: `${format(state.capacitorVoltage, 2)} V`, tone: "#7ff8ff", icon: BatteryCharging },
        { label: "Current", value: `${format(state.currentMa, 2)} mA`, tone: "#a9ef78", icon: Zap },
        { label: "Stored Energy", value: `${format(state.energyMj, 3)} mJ`, tone: "#ff4df0", icon: Activity },
      ];
    },
    chart: (p) => {
      const state = rcState(p);
      const maxTimeMs = Math.max(500, state.tauMs * 5, state.timeMs);
      return {
        label: "Capacitor Voltage (V) vs Time (ms)",
        points: Array.from({ length: 100 }, (_, i) => {
          const time = (i / 99) * maxTimeMs;
          return { x: time, y: rcState({ ...p, time }).capacitorVoltage };
        }),
        activeX: state.timeMs,
        activeY: state.capacitorVoltage,
        color: "#7ff8ff",
        xUnit: "ms",
        yUnit: "V",
      };
    },
    equations: [
      String.raw`V_C(t)=V_0\left(1-e^{-t/RC}\right)`,
      String.raw`I(t)=\frac{V_0}{R}e^{-t/RC}`,
      String.raw`\tau=RC`,
      String.raw`E_C=\frac{1}{2}CV_C^2`,
    ],
    explanation: "An RC charging circuit puts a resistor in series with a capacitor. Current starts high because the empty capacitor behaves almost like a short gap, then decays as the capacitor voltage rises toward the source voltage. The product RC is the time constant that sets the pace.",
    history: {
      body: [
        "RC circuits grew naturally from two older electrical ideas: resistive conduction and charge storage. Once batteries could provide a steady source and capacitors could store separated charge, experimenters could watch voltage evolve over time instead of treating circuits as only instant on-or-off networks.",
        "The time constant became important because many devices do not respond instantly. Telegraph lines, measurement instruments, filters, timing circuits, camera flashes, and sensor inputs all show some version of exponential charging or discharging when resistance and capacitance are present together.",
        "Modern electronics uses RC behavior everywhere: smoothing noisy power rails, delaying logic edges, setting analog filter cutoffs, debouncing switches, shaping pulses, and modeling cable or sensor response. The same exponential curve in this simulator is also the mathematical cousin of thermal cooling, first-order chemical kinetics, and radioactive decay.",
      ],
      cards: [historyCards.voltaicPile, historyCards.resistor, historyCards.capacitor, historyCards.ohm],
      links: [
        { label: "RC Circuit", href: "https://en.wikipedia.org/wiki/RC_circuit" },
        { label: "Time Constant", href: "https://en.wikipedia.org/wiki/Time_constant" },
        { label: "Capacitor", href: "https://en.wikipedia.org/wiki/Capacitor" },
      ],
    },
  },
  "wire-magnetic-field": {
    kind: "wirefield",
    title: "Magnetic Field Around A Wire",
    eyebrow: "Magnetism Micro Lab",
    status: "Circular Field Lines",
    initial: { current: 8, probeRadius: 12, wireRadius: 3, relativePermeability: 1, earthField: 50, compassAngle: 24 },
    presets: [
      { label: "Lab Wire", description: "Moderate current in air", values: { current: 8, probeRadius: 12, wireRadius: 3, relativePermeability: 1, earthField: 50, compassAngle: 24 } },
      { label: "Reverse Current", description: "Field direction flips", values: { current: -8, probeRadius: 12, wireRadius: 3, relativePermeability: 1, earthField: 50, compassAngle: 24 } },
      { label: "Near Probe", description: "Smaller radius strengthens field", values: { current: 8, probeRadius: 5, wireRadius: 3, relativePermeability: 1, earthField: 50, compassAngle: 45 } },
      { label: "High Current", description: "Field loops brighten and compass swings", values: { current: 18, probeRadius: 10, wireRadius: 5, relativePermeability: 1, earthField: 50, compassAngle: 330 } },
      { label: "Soft Iron Core", description: "Permeability amplifies field", values: { current: 5, probeRadius: 14, wireRadius: 6, relativePermeability: 6, earthField: 50, compassAngle: 310 } },
      { label: "Weak Current", description: "Earth field dominates compass", values: { current: 1.5, probeRadius: 18, wireRadius: 2, relativePermeability: 1, earthField: 50, compassAngle: 70 } },
    ],
    controls: [
      { key: "current", label: "Current", min: -20, max: 20, step: 0.1, unit: "A", description: "Sets current through the wire. Positive current points out of the screen and gives counterclockwise field loops; negative current points into the screen and reverses them." },
      { key: "probeRadius", label: "Probe Radius", min: 3, max: 30, step: 0.1, unit: "cm", description: "Sets how far the compass probe is from the wire. Magnetic field around a long wire falls as 1/r, so moving outward weakens the field quickly." },
      { key: "wireRadius", label: "Wire Radius", min: 0.8, max: 8, step: 0.1, unit: "mm", description: "Sets the drawn conductor thickness. It makes the central wire easier to inspect; outside the wire, the ideal field depends on current and distance from the center." },
      { key: "relativePermeability", label: "Relative Permeability", min: 0.5, max: 8, step: 0.05, unit: "µr", description: "Sets how strongly the surrounding medium supports magnetic field. Higher permeability increases B for the same current and radius." },
      { key: "earthField", label: "Earth Field", min: 10, max: 80, step: 1, unit: "µT", description: "Sets the background magnetic field used by the compass comparison. Larger Earth field makes the wire's deflection angle smaller." },
      { key: "compassAngle", label: "Compass Position", min: 0, max: 360, step: 1, unit: "deg", description: "Moves the compass around the wire without changing its radius. The needle follows the tangent direction of the circular field at that point." },
    ],
    metrics: (p) => {
      const state = wireFieldState(p);
      return [
        { label: "Field At Probe", value: `${format(Math.abs(state.fieldMicroT), 1)} µT`, tone: "#7ff8ff", icon: Magnet },
        { label: "Direction", value: state.direction, tone: state.current >= 0 ? "#7ff8ff" : "#ff4df0", icon: CircleGauge },
        { label: "Compass Deflection", value: `${format(state.compassDeflectionDeg, 1)} deg`, tone: "#a9ef78", icon: Compass },
        { label: "Energy Density", value: `${format(state.energyDensity, 4)} J/m³`, tone: "#ff4df0", icon: Activity },
      ];
    },
    chart: (p) => ({
      label: "Magnetic Field (µT) vs Radius (cm)",
      points: Array.from({ length: 90 }, (_, i) => {
        const probeRadius = 3 + (i / 89) * 27;
        const state = wireFieldState({ ...p, probeRadius });
        return { x: probeRadius, y: Math.abs(state.fieldMicroT) };
      }),
      activeX: p.probeRadius,
      activeY: Math.abs(wireFieldState(p).fieldMicroT),
      color: "#7ff8ff",
      xUnit: "cm",
      yUnit: "µT",
    }),
    equations: [
      String.raw`B=\frac{\mu I}{2\pi r}`,
      String.raw`\tan\phi=\frac{B}{B_E}`,
      String.raw`u_B=\frac{B^2}{2\mu}`,
    ],
    explanation: "A long straight current-carrying wire produces magnetic field lines that circle the wire. The field grows with current and permeability, weakens with distance, and reverses direction when current reverses.",
    history: {
      body: [
        "The link between electricity and magnetism became visible in 1820 when Hans Christian Oersted noticed that an electric current deflected a compass needle. That observation was decisive because it showed magnetism was not separate from electrical motion.",
        "Ampere quickly built a quantitative theory of forces between currents, treating current-carrying wires as magnetic sources. The circular field around a straight wire became one of the simplest ways to see that fields have direction in space, not just strength.",
        "Faraday later made field lines a central physical picture. Modern electromagnetism uses Ampere's law, the Biot-Savart law, and Maxwell's equations to generalize this simulator's simple wire into coils, motors, transformers, antennas, and magnetic sensors.",
      ],
      cards: [historyCards.ampere, historyCards.faraday, historyCards.rightHandRule],
      links: [
        { label: "Magnetic Field", href: "https://en.wikipedia.org/wiki/Magnetic_field" },
        { label: "Ampere's Circuital Law", href: "https://en.wikipedia.org/wiki/Amp%C3%A8re%27s_circuital_law" },
        { label: "Right-Hand Rule", href: "https://en.wikipedia.org/wiki/Right-hand_rule" },
      ],
    },
  },
  "parallel-plate-capacitor": {
    kind: "capacitor",
    title: "Parallel Plate Capacitor",
    eyebrow: "Electrostatics Micro Lab",
    status: "Field Storage",
    initial: { voltage: 36, plateArea: 72, spacing: 6, dielectric: 2.1 },
    viewToggle: true,
    presets: [
      { label: "Air Gap", description: "Low capacitance, sparse field storage", values: { voltage: 24, plateArea: 60, spacing: 8, dielectric: 1 } },
      { label: "Tight Plates", description: "Small spacing raises capacitance", values: { voltage: 36, plateArea: 72, spacing: 2.5, dielectric: 2.1 } },
      { label: "Large Area", description: "More overlapping area stores more charge", values: { voltage: 36, plateArea: 140, spacing: 6, dielectric: 2.1 } },
      { label: "High Dielectric", description: "Insulator polarization boosts capacitance", values: { voltage: 36, plateArea: 72, spacing: 6, dielectric: 7.5 } },
      { label: "High Voltage", description: "Same capacitance but more charge and energy", values: { voltage: 96, plateArea: 72, spacing: 6, dielectric: 2.1 } },
      { label: "Compact Sensor", description: "Small area and close gap for a light touch sensor", values: { voltage: 12, plateArea: 24, spacing: 1.5, dielectric: 3.2 } },
    ],
    controls: [
      { key: "voltage", label: "Voltage", min: 1, max: 120, step: 1, unit: "V", description: "Sets the potential difference between plates. Higher voltage increases stored charge linearly and stored energy quadratically for the same capacitance." },
      { key: "plateArea", label: "Plate Area", min: 12, max: 160, step: 1, unit: "cm2", description: "Sets overlapping conductor area. More area gives the field more surface to terminate on, so capacitance and stored charge increase directly." },
      { key: "spacing", label: "Plate Spacing", min: 1, max: 18, step: 0.1, unit: "mm", description: "Sets the distance between plates. Smaller spacing strengthens the field for the same voltage and raises capacitance through the inverse distance term." },
      { key: "dielectric", label: "Dielectric Constant", min: 1, max: 10, step: 0.1, unit: "εr", description: "Sets how strongly the insulating material polarizes. Higher dielectric constant increases capacitance without changing the plate geometry." },
    ],
    metrics: (p) => {
      const capacitancePf = ((8.854e-12 * p.dielectric * (p.plateArea / 10000)) / (p.spacing / 1000)) * 1e12;
      const chargeNc = capacitancePf * p.voltage * 0.001;
      const energyNj = 0.5 * capacitancePf * 1e-12 * p.voltage ** 2 * 1e9;
      return [
        { label: "Capacitance", value: `${format(capacitancePf, 2)} pF`, tone: "#7ff8ff", icon: BatteryCharging },
        { label: "Stored Charge", value: `${format(chargeNc, 2)} nC`, tone: "#f4c95d", icon: Zap },
        { label: "Electric Field", value: `${format(p.voltage / p.spacing, 2)} kV/m`, tone: "#a9ef78", icon: Activity },
        { label: "Stored Energy", value: `${format(energyNj, 2)} nJ`, tone: "#ff4df0", icon: CircleGauge },
      ];
    },
    chart: (p) => ({
      label: "Capacitance (pF) vs Plate Spacing (mm)",
      points: Array.from({ length: 90 }, (_, i) => {
        const spacing = 1 + (i / 89) * 17;
        return { x: spacing, y: ((8.854e-12 * p.dielectric * (p.plateArea / 10000)) / (spacing / 1000)) * 1e12 };
      }),
      activeX: p.spacing,
      activeY: ((8.854e-12 * p.dielectric * (p.plateArea / 10000)) / (p.spacing / 1000)) * 1e12,
      color: "#7ff8ff",
      xUnit: "mm",
      yUnit: "pF",
    }),
    equations: [
      String.raw`C=\varepsilon_0\varepsilon_r\frac{A}{d}`,
      String.raw`Q=CV`,
      String.raw`E=\frac{V}{d}`,
      String.raw`U=\frac{1}{2}CV^2`,
    ],
    explanation: "A parallel plate capacitor stores separated charge on two conductors. Larger plate area and stronger dielectric material raise capacitance, while wider spacing lowers it. Voltage then sets how much charge and energy are stored.",
    history: {
      body: [
        "Capacitors grew out of early electrostatic storage experiments. The Leyden jar, developed in the eighteenth century, showed that separated conductors with an insulator between them could hold charge and release it later as a strong shock or spark.",
        "The parallel plate model made that storage geometry mathematically clean. It strips the device down to two conducting surfaces, an insulating gap, and an electric field between them, which is why it remains the standard first model for capacitance.",
        "Faraday's work on fields and dielectrics explained why the material between conductors matters. Modern capacitors package the same idea into foils, ceramics, films, oxides, and microfabricated structures used for filtering, timing, sensing, power delivery, and memory.",
      ],
      cards: [historyCards.leydenJar, historyCards.faraday, historyCards.capacitor],
      links: [
        { label: "Capacitor", href: "https://en.wikipedia.org/wiki/Capacitor" },
        { label: "Leyden Jar", href: "https://en.wikipedia.org/wiki/Leyden_jar" },
        { label: "Dielectric", href: "https://en.wikipedia.org/wiki/Dielectric" },
      ],
    },
  },
  "coulombs-law": {
    kind: "coulomb",
    title: "Coulomb's Law",
    eyebrow: "Electrostatics Micro Lab",
    status: "Charge Interaction",
    initial: { q1: 4, q2: -3, separation: 9, probePosition: 0, relativePermittivity: 1 },
    presets: [
      { label: "Attraction", description: "Opposite charges pull together", values: { q1: 4, q2: -3, separation: 9, probePosition: 0, relativePermittivity: 1 } },
      { label: "Repulsion", description: "Like charges push apart", values: { q1: 3, q2: 3, separation: 8, probePosition: 2, relativePermittivity: 1 } },
      { label: "Close Pair", description: "Small distance boosts force", values: { q1: 2.5, q2: -2.5, separation: 3.5, probePosition: 0, relativePermittivity: 1 } },
      { label: "Water Medium", description: "High permittivity weakens force", values: { q1: 5, q2: -5, separation: 7, probePosition: -4, relativePermittivity: 8 } },
      { label: "Probe Left", description: "Field sampled near charge one", values: { q1: 5, q2: 2, separation: 11, probePosition: -8, relativePermittivity: 1 } },
      { label: "Weak Pair", description: "Small charges and broad spacing", values: { q1: 1.2, q2: -0.9, separation: 16, probePosition: 5, relativePermittivity: 2.5 } },
    ],
    controls: [
      { key: "q1", label: "Charge 1", min: -8, max: 8, step: 0.1, unit: "µC", description: "Sets the left charge. Its sign controls whether field lines leave or enter it, and its magnitude scales both the pair force and the probe field." },
      { key: "q2", label: "Charge 2", min: -8, max: 8, step: 0.1, unit: "µC", description: "Sets the right charge. Same signs repel, opposite signs attract, and doubling this charge doubles the interaction force." },
      { key: "separation", label: "Separation", min: 2, max: 18, step: 0.1, unit: "cm", description: "Sets the distance between charges. Coulomb force follows an inverse-square law, so halving separation makes the force about four times larger." },
      { key: "probePosition", label: "Probe Position", min: -16, max: 16, step: 0.1, unit: "cm", description: "Moves the small field probe along the charge axis. The probe reads the vector sum of both charges' electric fields, so cancellation can happen between opposite influences." },
      { key: "relativePermittivity", label: "Relative Permittivity", min: 1, max: 8, step: 0.05, unit: "εr", description: "Represents the medium between charges. Higher permittivity screens electric interaction, lowering force, potential energy, and field strength together." },
    ],
    metrics: (p) => {
      const state = coulombState(p);
      return [
        { label: "Force Magnitude", value: `${format(state.forceMagnitudeN * 1000, 3)} mN`, tone: state.forceSigned >= 0 ? "#ff4df0" : "#a9ef78", icon: Zap },
        { label: "Interaction", value: state.interaction, tone: state.forceSigned >= 0 ? "#ff4df0" : "#a9ef78", icon: Magnet },
        { label: "Probe Field", value: `${format(state.fieldAtProbe / 1000, 2)} kN/C`, tone: "#f4c95d", icon: Activity },
        { label: "Potential Energy", value: `${format(state.potentialEnergyJ * 1000, 3)} mJ`, tone: "#7ff8ff", icon: BatteryCharging },
      ];
    },
    chart: (p) => {
      const state = coulombState(p);
      return {
        label: "Force Magnitude (mN) vs Separation (cm)",
        points: Array.from({ length: 100 }, (_, i) => {
          const separation = 2 + (i / 99) * 16;
          return { x: separation, y: coulombState({ ...p, separation }).forceMagnitudeN * 1000 };
        }),
        activeX: state.separationCm,
        activeY: state.forceMagnitudeN * 1000,
        color: state.forceSigned >= 0 ? "#ff4df0" : "#a9ef78",
        xUnit: "cm",
        yUnit: "mN",
      };
    },
    equations: [String.raw`F=k\frac{q_1q_2}{r^2}`, String.raw`E=k\frac{q}{r^2}`, String.raw`U=k\frac{q_1q_2}{r}`],
    explanation: "Coulomb's law models the electrostatic force between point charges. Force grows with both charge magnitudes, flips between attraction and repulsion with sign, and weakens rapidly with distance or a higher-permittivity medium.",
    history: {
      body: [
        "Electrostatics began with rubbed amber, sparks, attraction, and repulsion long before charge had a modern mathematical definition. The key experimental challenge was measuring tiny forces without overwhelming them with friction, leakage, or humidity.",
        "Charles-Augustin de Coulomb used a torsion balance in the 1780s to quantify how electrical force changed with charge and distance. His inverse-square result made electrostatic force look mathematically similar to Newtonian gravity, but with two signs instead of only attraction.",
        "Faraday later changed the way physicists pictured the same interactions by emphasizing fields and lines of force. Modern electromagnetism keeps both views: Coulomb's law is the compact point-charge rule, while electric fields describe how influence fills space and combines from many charges.",
      ],
      cards: [historyCards.coulomb, historyCards.coulombsLawDiagram, historyCards.faraday],
      links: [
        { label: "Coulomb's Law", href: "https://en.wikipedia.org/wiki/Coulomb%27s_law" },
        { label: "Charles-Augustin De Coulomb", href: "https://en.wikipedia.org/wiki/Charles-Augustin_de_Coulomb" },
        { label: "Electric Field", href: "https://en.wikipedia.org/wiki/Electric_field" },
      ],
    },
  },
  "acid-base-ph": {
    kind: "acidbase",
    title: "Acid-Base pH",
    eyebrow: "Chemistry Micro Lab",
    status: "Neutralization Curve",
    initial: { acidMolarity: 0.1, baseMolarity: 0.1, acidVolumeMl: 50, baseAddedMl: 32 },
    controls: [
      { key: "acidMolarity", label: "Acid Molarity", min: 0.01, max: 0.5, step: 0.01, unit: "M", description: "Sets initial strong acid concentration. More acid moles lower the starting pH and require more base to reach equivalence." },
      { key: "baseMolarity", label: "Base Molarity", min: 0.01, max: 0.5, step: 0.01, unit: "M", description: "Sets strong base concentration. More concentrated base neutralizes the acid with less added volume and makes post-equivalence pH rise faster." },
      { key: "acidVolumeMl", label: "Acid Volume", min: 10, max: 120, step: 1, unit: "mL", description: "Sets the starting acid sample size. Larger acid volume means more acid moles, a larger equivalence volume, and more dilution." },
      { key: "baseAddedMl", label: "Base Added", min: 0, max: 140, step: 1, unit: "mL", description: "Adds base into the acid. Watch pH climb slowly at first, jump near equivalence, then become controlled by excess hydroxide." },
    ],
    metrics: (p) => {
      const state = acidBaseState(p);
      return [
        { label: "pH", value: format(state.pH, 2), tone: state.pH < 7 ? "#ff4df0" : "#7ff8ff", icon: Activity },
        { label: "Equivalence Vol.", value: `${format(state.equivalenceVolumeMl, 1)} mL`, tone: "#f4c95d", icon: CircleGauge },
        { label: "Neutralized", value: `${format(state.neutralizedFraction * 100, 0)}%`, tone: "#a9ef78", icon: Atom },
        { label: "Excess Ions", value: `${format(Math.abs(state.excessMoles) * 1000, 2)} mmol`, tone: "#ff4df0", icon: Zap },
      ];
    },
    chart: (p) => ({
      label: "pH vs Base Added (mL)",
      points: Array.from({ length: 100 }, (_, i) => {
        const baseAddedMl = (i / 99) * 140;
        return { x: baseAddedMl, y: acidBaseState({ ...p, baseAddedMl }).pH };
      }),
      activeX: p.baseAddedMl,
      activeY: acidBaseState(p).pH,
      color: "#7ff8ff",
      xUnit: "mL",
      yUnit: "pH",
    }),
    equations: [String.raw`\mathrm{pH}=-\log_{10}[H^+]`, String.raw`n=CV`, String.raw`n_{H^+}=n_{OH^-}`],
    explanation: "This strong acid-strong base model compares acid moles with added base moles. pH is set by excess hydrogen ion before equivalence, is neutral at equivalence, and is set by excess hydroxide after equivalence.",
    history: {
      body: [
        "Acid-base chemistry began as a practical classification of sour, caustic, reactive substances before it became an ion model. Arrhenius gave a clean aqueous definition: acids produce hydrogen ions in water, while bases produce hydroxide ions.",
        "Sorensen introduced the pH scale in 1909 to make acidity measurements manageable in brewing and biochemical work. The logarithmic scale compresses huge concentration changes into readable numbers, which is why a one-unit pH shift is a tenfold concentration change.",
        "Modern acid-base theory is broader than this strong acid-strong base model. Bronsted-Lowry theory describes proton transfer, Lewis theory describes electron-pair donation and acceptance, and pH meters made precise monitoring routine in laboratories, industry, medicine, and environmental science.",
      ],
      cards: [historyCards.arrhenius, historyCards.sorensen, historyCards.phMeter],
      links: [
        { label: "Acid-Base Reaction", href: "https://en.wikipedia.org/wiki/Acid%E2%80%93base_reaction" },
        { label: "pH", href: "https://en.wikipedia.org/wiki/PH" },
      ],
    },
  },
  "solution-dilution": {
    kind: "dilution",
    title: "Solution Dilution",
    eyebrow: "Analytical Chemistry Micro Lab",
    status: "Concentration Transfer",
    initial: { stockMolarity: 1.0, aliquotMl: 10, finalVolumeMl: 100 },
    presets: [
      { label: "1:10", description: "Classic tenfold dilution", values: { stockMolarity: 1, aliquotMl: 10, finalVolumeMl: 100 } },
      { label: "1:100", description: "Hundredfold dilution", values: { stockMolarity: 1, aliquotMl: 1, finalVolumeMl: 100 } },
      { label: "Lab Std.", description: "Prepare 0.1 M from 1 M", values: { stockMolarity: 1, aliquotMl: 25, finalVolumeMl: 250 } },
      { label: "Trace", description: "Small aliquot in large flask", values: { stockMolarity: 0.5, aliquotMl: 2, finalVolumeMl: 200 } },
      { label: "Gentle", description: "Twofold dilution", values: { stockMolarity: 0.2, aliquotMl: 50, finalVolumeMl: 100 } },
      { label: "Micro", description: "Small final volume", values: { stockMolarity: 2, aliquotMl: 5, finalVolumeMl: 50 } },
    ],
    controls: [
      { key: "stockMolarity", label: "Stock Molarity", min: 0.01, max: 2, step: 0.01, unit: "M", description: "Sets the starting concentration before dilution. Higher stock concentration raises final concentration unless aliquot or final volume changes compensate." },
      { key: "aliquotMl", label: "Aliquot Volume", min: 1, max: 50, step: 0.5, unit: "mL", description: "Sets the measured volume transferred from the stock. More aliquot carries more solute into the flask, so final concentration rises at fixed final volume." },
      { key: "finalVolumeMl", label: "Final Volume", min: 50, max: 250, step: 1, unit: "mL", description: "Sets the calibrated final flask volume after solvent is added. Larger final volume dilutes the same solute over more liquid, lowering final molarity." },
    ],
    metrics: (p) => {
      const state = dilutionState(p);
      return [
        { label: "Final Molarity", value: `${format(state.finalMolarity, 3)} M`, tone: "#7ff8ff", icon: Atom },
        { label: "Dilution Factor", value: `${format(state.dilutionFactor, 1)}x`, tone: "#a9ef78", icon: Activity },
        { label: "Solute Amount", value: `${format(state.soluteMmol, 2)} mmol`, tone: "#ff4df0", icon: Sigma },
        { label: "Solvent Added", value: `${format(state.solventAddedMl, 1)} mL`, tone: "#f4c95d", icon: CircleGauge },
      ];
    },
    chart: (p) => ({
      label: "Final Concentration (M) vs Final Volume (mL)",
      points: Array.from({ length: 100 }, (_, i) => {
        const finalVolumeMl = 50 + (i / 99) * 200;
        return { x: finalVolumeMl, y: dilutionState({ ...p, finalVolumeMl }).finalMolarity };
      }),
      activeX: p.finalVolumeMl,
      activeY: dilutionState(p).finalMolarity,
      color: "#7ff8ff",
      xUnit: "mL",
      yUnit: "M",
    }),
    equations: [String.raw`C_1V_1=C_2V_2`, String.raw`C_2=\frac{C_1V_1}{V_2}`, String.raw`D=\frac{V_2}{V_1}=\frac{C_1}{C_2}`],
    explanation: "Solution dilution conserves solute amount while solvent increases total volume. The stock concentration and aliquot set the transferred moles; the final calibrated volume determines the new molarity.",
    history: {
      body: [
        "Dilution is one of the quiet foundations of laboratory chemistry. Before modern instruments, reliable solution preparation depended on glassware that could transfer and contain repeatable volumes, making concentration a practical quantity rather than a vague strength.",
        "Volumetric flasks, pipettes, and burettes turned solution work into a measured craft. Analytical chemistry, titration, calibration standards, and biological assays all depend on the same conservation idea: solute amount stays fixed while volume changes.",
        "The dilution equation is simple because it hides the physical details of mixing. Real solutions can have temperature expansion, nonideal volume changes, or adsorption losses, but introductory dilution starts with the ideal volume bookkeeping that works well for many routine lab preparations.",
      ],
      cards: [historyCards.volumetricFlask, historyCards.pipette, historyCards.burette],
      links: [
        { label: "Dilution", href: "https://en.wikipedia.org/wiki/Dilution_(equation)" },
        { label: "Molar Concentration", href: "https://en.wikipedia.org/wiki/Molar_concentration" },
        { label: "Volumetric Flask", href: "https://en.wikipedia.org/wiki/Volumetric_flask" },
      ],
    },
  },
  stoichiometry: {
    kind: "stoichiometry",
    title: "Stoichiometry",
    eyebrow: "Mole Ratio Micro Lab",
    status: "Limiting Reactant",
    initial: { molesA: 4, molesB: 3, coeffA: 2, coeffB: 1, coeffP: 2 },
    presets: [
      { label: "Water", description: "2A + B -> 2P", values: { molesA: 4, molesB: 3, coeffA: 2, coeffB: 1, coeffP: 2 } },
      { label: "Balanced", description: "Exact stoichiometric mix", values: { molesA: 6, molesB: 3, coeffA: 2, coeffB: 1, coeffP: 2 } },
      { label: "A Limited", description: "Reactant A runs out", values: { molesA: 2.2, molesB: 5.2, coeffA: 2, coeffB: 1, coeffP: 2 } },
      { label: "B Limited", description: "Reactant B runs out", values: { molesA: 6.5, molesB: 1.4, coeffA: 2, coeffB: 1, coeffP: 2 } },
      { label: "Synthesis", description: "A + 3B -> 2P", values: { molesA: 3.4, molesB: 7.2, coeffA: 1, coeffB: 3, coeffP: 2 } },
      { label: "Precip.", description: "2A + 3B -> P", values: { molesA: 5.8, molesB: 5.1, coeffA: 2, coeffB: 3, coeffP: 1 } },
    ],
    controls: [
      { key: "molesA", label: "Reactant A Moles", min: 0.1, max: 8, step: 0.1, unit: "mol", description: "Sets how much Reactant A is available. Product can only form while both reactants remain in the balanced mole ratio." },
      { key: "molesB", label: "Reactant B Moles", min: 0.1, max: 8, step: 0.1, unit: "mol", description: "Sets how much Reactant B is available. If B divided by its coefficient is smaller than A divided by its coefficient, B limits the reaction." },
      { key: "coeffA", label: "Coefficient A", min: 1, max: 5, step: 1, unit: "", description: "Sets the balanced-equation coefficient for A. Larger coefficients require more A per reaction extent, so A becomes limiting more easily." },
      { key: "coeffB", label: "Coefficient B", min: 1, max: 5, step: 1, unit: "", description: "Sets the balanced-equation coefficient for B. Larger coefficients consume B faster relative to A and change the limiting-reactant comparison." },
      { key: "coeffP", label: "Coefficient Product", min: 1, max: 5, step: 1, unit: "", description: "Sets how many moles of product form per reaction extent. It scales product yield after the limiting reactant sets how far the reaction can go." },
    ],
    metrics: (p) => {
      const state = stoichiometryState(p);
      return [
        { label: "Limiting Reactant", value: state.limiting, tone: state.limiting === "A" ? "#ff4df0" : state.limiting === "B" ? "#7ff8ff" : "#f4c95d", icon: CircleGauge },
        { label: "Product Moles", value: `${format(state.productMoles, 2)} mol`, tone: "#f4c95d", icon: Atom },
        { label: "Reaction Extent", value: `${format(state.extent, 2)} mol`, tone: "#a9ef78", icon: Activity },
        { label: "Excess Moles", value: `${format(state.excessMoles, 2)} mol`, tone: "#ff4df0", icon: Sigma },
      ];
    },
    chart: (p) => ({
      label: "Product Moles vs Reactant B Moles",
      points: Array.from({ length: 90 }, (_, i) => {
        const molesB = 0.1 + (i / 89) * 7.9;
        return { x: molesB, y: stoichiometryState({ ...p, molesB }).productMoles };
      }),
      activeX: p.molesB,
      activeY: stoichiometryState(p).productMoles,
      color: "#f4c95d",
      xUnit: "mol B",
      yUnit: "mol P",
    }),
    equations: [String.raw`\xi=\min\left(\frac{n_A}{a},\frac{n_B}{b}\right)`, String.raw`n_P=c\xi`, String.raw`n_{excess}=n_i-\nu_i\xi`],
    explanation: "Stoichiometry uses the balanced equation as a mole recipe. Divide each available reactant amount by its coefficient; the smallest value is the reaction extent, which identifies the limiting reactant and sets product yield.",
    history: {
      body: [
        "Stoichiometry grew out of the shift from qualitative alchemy-like descriptions to measured chemistry. Lavoisier's conservation of mass made chemical equations accountable: matter was rearranged, not casually created or destroyed.",
        "Dalton's atomic theory gave fixed combining ratios a physical interpretation. If substances are made from atoms, then balanced equations are not arbitrary bookkeeping; they express countable relationships between particles.",
        "Avogadro's work helped connect gases, particle counts, and the mole concept. Modern stoichiometry uses that bridge constantly: grams convert to moles, mole ratios predict limiting reactants, and moles convert back to measurable product quantities.",
      ],
      cards: [historyCards.lavoisier, historyCards.dalton, historyCards.avogadro],
      links: [
        { label: "Stoichiometry", href: "https://en.wikipedia.org/wiki/Stoichiometry" },
        { label: "Limiting Reagent", href: "https://en.wikipedia.org/wiki/Limiting_reagent" },
        { label: "Mole", href: "https://en.wikipedia.org/wiki/Mole_(unit)" },
      ],
    },
  },
  "ideal-gas-law": {
    kind: "idealgas",
    title: "Ideal Gas Law",
    eyebrow: "Physical Chemistry Micro Lab",
    status: "Piston State",
    initial: { volumeL: 4.2, temperatureK: 315, amountMol: 1.1 },
    controls: [
      { key: "volumeL", label: "Volume", min: 1, max: 10, step: 0.1, unit: "L", description: "Moves the piston and changes container volume. With temperature and moles fixed, smaller volume raises pressure because the same particles hit the walls more often." },
      { key: "temperatureK", label: "Temperature", min: 180, max: 650, step: 1, unit: "K", description: "Sets absolute temperature. Higher temperature makes particles move faster and increases pressure at the same volume and amount of gas." },
      { key: "amountMol", label: "Amount", min: 0.2, max: 4, step: 0.05, unit: "mol", description: "Sets how much gas is in the chamber. More moles means more particles, more wall collisions, and higher pressure if volume and temperature are unchanged." },
    ],
    metrics: (p) => {
      const state = idealGasState(p);
      return [
        { label: "Pressure", value: `${format(state.pressureKpa, 0)} kPa`, tone: "#7ff8ff", icon: CircleGauge },
        { label: "Volume", value: `${format(state.volumeL, 1)} L`, tone: "#f4c95d", icon: Box },
        { label: "Temperature", value: `${format(state.temperatureK, 0)} K`, tone: "#ff4df0", icon: Activity },
        { label: "Thermal Energy", value: `${format(state.thermalEnergyJ, 0)} J`, tone: "#a9ef78", icon: Zap },
      ];
    },
    chart: (p) => ({
      label: "Pressure (kPa) vs Volume (L)",
      points: Array.from({ length: 90 }, (_, i) => {
        const volumeL = 1 + (i / 89) * 9;
        return { x: volumeL, y: idealGasState({ ...p, volumeL }).pressureKpa };
      }),
      activeX: p.volumeL,
      activeY: idealGasState(p).pressureKpa,
      color: "#7ff8ff",
      xUnit: "L",
      yUnit: "kPa",
    }),
    equations: [String.raw`PV=nRT`, String.raw`P_1V_1=P_2V_2`, String.raw`\frac{V}{T}=\mathrm{constant}`],
    explanation: "The ideal gas law links pressure, volume, temperature, and amount for a simplified gas. The piston shows the inverse pressure-volume relation, while temperature and moles scale pressure upward or downward.",
    history: {
      body: [
        "Gas laws came from making invisible air behave like a measurable laboratory object. Boyle and his collaborators used pneumatic apparatus to show that compressing a gas raises its pressure in a predictable inverse pattern, which made air feel less like an element and more like a physical system.",
        "Later temperature-volume work associated with Charles and Gay-Lussac showed that gases expand when heated if pressure is held fixed. Those empirical laws were eventually combined into a single state relation, and Clapeyron's thermodynamic framing connected them to heat engines and the wider language of pressure-volume work.",
        "The ideal gas law is not a microscopic proof; it is a clean macroscopic model. Kinetic theory later explained why it works: pressure comes from molecular collisions with container walls, temperature tracks average molecular kinetic energy, and deviations appear when particles attract, repel, or occupy a non-negligible volume.",
      ],
      cards: [historyCards.boyle, historyCards.charles, historyCards.boyleAirPump],
      links: [
        { label: "Ideal Gas Law", href: "https://en.wikipedia.org/wiki/Ideal_gas_law" },
        { label: "Boyle's Law", href: "https://en.wikipedia.org/wiki/Boyle%27s_law" },
        { label: "Charles's Law", href: "https://en.wikipedia.org/wiki/Charles%27s_law" },
      ],
    },
  },
  "reaction-kinetics": {
    kind: "kinetics",
    title: "Reaction Kinetics",
    eyebrow: "Chemistry Micro Lab",
    status: "First-Order Decay",
    initial: { initialConcentration: 1.0, rateConstant: 0.28, time: 3.2 },
    controls: [
      { key: "initialConcentration", label: "Initial Concentration", min: 0.1, max: 2.5, step: 0.05, unit: "M", description: "Sets the starting reactant concentration. Higher starting concentration raises the absolute amount of reactant and product, while the fraction remaining still follows the same exponential curve for a fixed rate constant." },
      { key: "rateConstant", label: "Rate Constant", min: 0.02, max: 1.2, step: 0.01, unit: "min^-1", description: "Controls how quickly a first-order reaction decays. Larger values shorten the half-life, steepen the concentration curve, and make product appear faster." },
      { key: "time", label: "Elapsed Time", min: 0, max: 20, step: 0.1, unit: "min", description: "Moves the reaction clock. Watch reactant particles fade into product particles, and compare the current time with the half-life marker." },
    ],
    metrics: (p) => {
      const state = kineticsState(p);
      return [
        { label: "Reactant", value: `${format(state.reactant, 3)} M`, tone: "#ff4df0", icon: Activity },
        { label: "Product", value: `${format(state.product, 3)} M`, tone: "#7ff8ff", icon: Atom },
        { label: "Half-Life", value: `${format(state.halfLife, 2)} min`, tone: "#f4c95d", icon: CircleGauge },
        { label: "Completion", value: `${format(state.completion * 100, 0)}%`, tone: "#a9ef78", icon: Zap },
      ];
    },
    chart: (p) => {
      const state = kineticsState(p);
      const points = Array.from({ length: 100 }, (_, i) => {
        const time = (i / 99) * 20;
        return { x: time, y: kineticsState({ ...p, time }).reactant };
      });
      return { label: "Reactant Concentration (M) vs Time (min)", points, activeX: p.time, activeY: state.reactant, color: "#ff4df0", xUnit: "min", yUnit: "M" };
    },
    equations: [String.raw`[A]=[A]_0e^{-kt}`, String.raw`t_{1/2}=\frac{\ln 2}{k}`, String.raw`\mathrm{rate}=-\frac{d[A]}{dt}=k[A]`],
    explanation: "This first-order kinetics lab shows a reactant decaying exponentially into product. The rate constant controls both the curve steepness and the half-life, while elapsed time shows how far the reaction has progressed.",
    history: {
      body: [
        "Chemical kinetics grew from the attempt to measure reactions as processes unfolding in time, not just before-and-after transformations. Early rate studies made concentration, temperature, and mechanism measurable variables rather than vague descriptions of a reaction being fast or slow.",
        "Guldberg and Waage's mass-action work gave chemists a mathematical way to connect reaction rate with the amounts of reacting substances. Van 't Hoff helped make chemical dynamics part of physical chemistry, showing that equilibrium, rate, and thermodynamic thinking could be treated with shared quantitative tools.",
        "First-order kinetics became a central teaching case because the mathematics is clean and the behavior is common: radioactive decay, many decompositions, some drug eliminations, and pseudo-first-order reactions all show exponential decay and a constant half-life.",
      ],
      cards: [historyCards.guldbergWaage, historyCards.vantHoff, historyCards.arrhenius],
      links: [
        { label: "Chemical Kinetics", href: "https://en.wikipedia.org/wiki/Chemical_kinetics" },
        { label: "Rate Equation", href: "https://en.wikipedia.org/wiki/Rate_equation" },
        { label: "Law Of Mass Action", href: "https://en.wikipedia.org/wiki/Law_of_mass_action" },
      ],
    },
  },
  "incline-force": {
    kind: "incline",
    title: "Normal Force On Incline",
    eyebrow: "Force Micro Lab",
    status: "Vector Breakdown",
    initial: { angle: 28, mass: 8, friction: 0.22, gravity: 9.8 },
    controls: [
      { key: "angle", label: "Ramp Angle", min: 0, max: 65, step: 1, unit: "deg", description: "Tilts the ramp. Higher angle reduces normal force, increases down-slope force, and can make friction less able to hold the block." },
      { key: "mass", label: "Mass", min: 1, max: 20, step: 0.5, unit: "kg", description: "Sets the block mass. Weight, normal force, down-slope force, and max friction all scale with mass, so ratios stay similar while forces grow." },
      { key: "friction", label: "Friction Coefficient", min: 0, max: 1, step: 0.01, unit: "", description: "Sets surface grip. Higher friction increases the maximum resisting force, but the available grip also depends on normal force from mass, gravity, and ramp angle." },
      { key: "gravity", label: "Gravity", min: 1.6, max: 24, step: 0.1, unit: "m/s2", description: "Sets gravitational acceleration. Higher gravity increases all weight-derived forces, including normal force, down-slope pull, and friction capacity." },
    ],
    metrics: (p) => {
      const theta = degToRad(p.angle);
      const weight = p.mass * p.gravity;
      const normal = weight * Math.cos(theta);
      return [
        { label: "Weight", value: `${format(weight, 1)} N`, tone: "#f4c95d", icon: Box },
        { label: "Normal Force", value: `${format(normal, 1)} N`, tone: "#7ff8ff", icon: Activity },
        { label: "Down-Slope Force", value: `${format(weight * Math.sin(theta), 1)} N`, tone: "#ff4df0", icon: Compass },
        { label: "Max Friction", value: `${format(p.friction * normal, 1)} N`, tone: "#a9ef78", icon: Magnet },
      ];
    },
    chart: (p) => ({
      label: "Normal Force (N) vs Ramp Angle (deg)",
      points: Array.from({ length: 80 }, (_, i) => {
        const angle = (i / 79) * 65;
        return { x: angle, y: p.mass * p.gravity * Math.cos(degToRad(angle)) };
      }),
      activeX: p.angle,
      activeY: p.mass * p.gravity * Math.cos(degToRad(p.angle)),
      color: "#7ff8ff",
      xUnit: "deg",
      yUnit: "N",
    }),
    equations: [String.raw`F_N=mg\cos\theta`, String.raw`F_{\parallel}=mg\sin\theta`, String.raw`F_f\leq\mu F_N`],
    explanation: "The block's weight splits into a component into the ramp and a component down the ramp.",
    history: {
      body: [
        "The inclined plane is one of the classical simple machines because it trades force for distance. Ancient engineers used ramps before they had modern force diagrams, and the concept became a bridge between practical construction and abstract mechanics.",
        "Galileo used inclined planes because they slowed falling motion enough to measure patterns with the tools of his time. That made ramps central to the transition from qualitative motion stories to quantitative kinematics.",
        "In Newtonian mechanics, the ramp became a component problem: weight splits into a part perpendicular to the surface and a part along it. That is why the simulator emphasizes normal force, down-slope force, and friction together.",
      ],
      cards: [historyCards.inclinedPlane, historyCards.simpleMachine, historyCards.galileo],
      links: [
        { label: "Inclined Plane", href: "https://en.wikipedia.org/wiki/Inclined_plane" },
        { label: "Classical Mechanics", href: "https://en.wikipedia.org/wiki/Classical_mechanics" },
      ],
    },
  },
  "newtons-second-law": {
    kind: "newton2",
    title: "Newton's Second Law",
    eyebrow: "Forces Micro Lab",
    status: "Net Force Motion",
    initial: { mass: 4, appliedForce: 24, frictionCoefficient: 0.18, time: 2.4 },
    presets: [
      { label: "Low Mass", description: "Same force, faster acceleration", values: { mass: 2, appliedForce: 24, frictionCoefficient: 0.12, time: 2.4 } },
      { label: "Heavy Cart", description: "Same force, slower acceleration", values: { mass: 8, appliedForce: 24, frictionCoefficient: 0.12, time: 2.4 } },
      { label: "Static Hold", description: "Friction cancels the push", values: { mass: 5, appliedForce: 12, frictionCoefficient: 0.35, time: 3 } },
      { label: "Left Push", description: "Negative force reverses motion", values: { mass: 4, appliedForce: -26, frictionCoefficient: 0.16, time: 2.5 } },
      { label: "Ice Track", description: "Almost frictionless acceleration", values: { mass: 4, appliedForce: 18, frictionCoefficient: 0.02, time: 3.2 } },
      { label: "Hard Push", description: "Large net force", values: { mass: 3, appliedForce: 48, frictionCoefficient: 0.12, time: 2.2 } },
    ],
    controls: [
      { key: "mass", label: "Mass", min: 0.5, max: 12, step: 0.1, unit: "kg", description: "Sets the cart inertia. More mass makes the same net force produce less acceleration, so velocity and displacement grow more slowly." },
      { key: "appliedForce", label: "Applied Force", min: -60, max: 60, step: 1, unit: "N", description: "Sets the horizontal push or pull. Positive force pushes right, negative force pushes left, and friction opposes whichever direction the force tries to move the cart." },
      { key: "frictionCoefficient", label: "Friction Coefficient", min: 0, max: 0.8, step: 0.01, unit: "", description: "Sets surface resistance. If the applied force is below the friction threshold, the cart stays held; above it, friction subtracts from the applied force." },
      { key: "time", label: "Elapsed Time", min: 0, max: 6, step: 0.1, unit: "s", description: "Moves the motion clock. At constant acceleration, velocity grows linearly with time and displacement grows with time squared." },
    ],
    metrics: (p) => {
      const state = newtonSecondState(p);
      return [
        { label: "Net Force", value: `${format(state.netForce, 1)} N`, tone: state.netForce >= 0 ? "#a9ef78" : "#ff4df0", icon: Magnet },
        { label: "Acceleration", value: `${format(state.acceleration, 2)} m/s2`, tone: "#7ff8ff", icon: Activity },
        { label: "Velocity", value: `${format(state.velocity, 2)} m/s`, tone: "#f4c95d", icon: Zap },
        { label: "Displacement", value: `${format(state.displacement, 2)} m`, tone: "#ff4df0", icon: Compass },
      ];
    },
    chart: (p) => ({
      label: "Acceleration (m/s2) vs Applied Force (N)",
      points: Array.from({ length: 100 }, (_, i) => {
        const appliedForce = -60 + (i / 99) * 120;
        return { x: appliedForce, y: newtonSecondState({ ...p, appliedForce }).acceleration };
      }),
      activeX: p.appliedForce,
      activeY: newtonSecondState(p).acceleration,
      color: "#7ff8ff",
      xUnit: "N",
      yUnit: "m/s2",
    }),
    equations: [String.raw`F_{\mathrm{net}}=ma`, String.raw`a=\frac{F_{\mathrm{net}}}{m}`, String.raw`x=x_0+v_0t+\frac{1}{2}at^2`],
    explanation: "Newton's second law says acceleration responds to net force, not just applied force. This cart model subtracts friction when the applied push exceeds the hold threshold, then uses the remaining net force to animate acceleration, velocity, and displacement.",
    history: {
      body: [
        "Newton's second law grew from the seventeenth-century effort to make motion quantitative. Galileo had already separated acceleration from simple speed, while Newton's framework made force the cause of changing motion rather than a vague tendency.",
        "The Principia organized this into a mathematical mechanics where forces add, masses resist acceleration, and the same laws apply to falling bodies, projectiles, planets, and machines. In modern notation, F = ma is compact, but it stands on a larger idea: vector net force determines vector acceleration.",
        "Laboratory devices such as carts, pulleys, and Atwood machines made the law teachable because they slow acceleration down enough to measure. The simulator follows that same tradition by separating applied force, friction, net force, mass, and motion readout.",
      ],
      cards: [historyCards.newton, historyCards.principia, historyCards.atwoodMachine],
      links: [
        { label: "Newton's Laws Of Motion", href: "https://en.wikipedia.org/wiki/Newton%27s_laws_of_motion" },
        { label: "Newton's Second Law", href: "https://en.wikipedia.org/wiki/Newton%27s_laws_of_motion#Newton's_second_law" },
        { label: "Atwood Machine", href: "https://en.wikipedia.org/wiki/Atwood_machine" },
      ],
    },
  },
  "work-energy": {
    kind: "workenergy",
    title: "Work And Energy",
    eyebrow: "Mechanics Micro Lab",
    status: "Energy Transfer",
    initial: { mass: 3, force: 24, displacement: 8, forceAngle: 18, frictionCoefficient: 0.08, initialSpeed: 1.2 },
    presets: [
      { label: "Clean Push", description: "Low friction, aligned force", values: { mass: 3, force: 24, displacement: 8, forceAngle: 0, frictionCoefficient: 0.02, initialSpeed: 1.2 } },
      { label: "Angled Pull", description: "Only horizontal force does work", values: { mass: 3, force: 28, displacement: 8, forceAngle: 35, frictionCoefficient: 0.06, initialSpeed: 1.2 } },
      { label: "Rough Track", description: "Friction drains energy", values: { mass: 4, force: 24, displacement: 8, forceAngle: 0, frictionCoefficient: 0.28, initialSpeed: 2.4 } },
      { label: "Heavy Load", description: "Same work, lower final speed", values: { mass: 8, force: 32, displacement: 7, forceAngle: 10, frictionCoefficient: 0.08, initialSpeed: 1 } },
      { label: "Brake", description: "Negative work slows motion", values: { mass: 3, force: -18, displacement: 7, forceAngle: 0, frictionCoefficient: 0.05, initialSpeed: 8 } },
      { label: "Sprint", description: "Large work transfer", values: { mass: 2.5, force: 48, displacement: 10, forceAngle: 12, frictionCoefficient: 0.04, initialSpeed: 0.5 } },
    ],
    controls: [
      { key: "mass", label: "Mass", min: 0.5, max: 12, step: 0.1, unit: "kg", description: "Sets object inertia. For the same final kinetic energy, a heavier object ends with lower speed because kinetic energy is shared across more mass." },
      { key: "force", label: "Applied Force", min: -60, max: 60, step: 1, unit: "N", description: "Sets the pull or push magnitude along the displayed force vector. Positive force adds energy when aligned with motion; negative force removes energy like braking." },
      { key: "displacement", label: "Displacement", min: 0, max: 20, step: 0.1, unit: "m", description: "Sets how far the object moves while force acts. Work grows with displacement, so a longer push transfers more energy if force has a motion-aligned component." },
      { key: "forceAngle", label: "Force Angle", min: -70, max: 70, step: 1, unit: "deg", description: "Tilts the applied force relative to motion. Only the component parallel to displacement does work, so large angles reduce useful energy transfer." },
      { key: "frictionCoefficient", label: "Friction Coefficient", min: 0, max: 0.6, step: 0.01, unit: "", description: "Sets roughness of the track. Friction does negative work proportional to normal force and distance, converting organized motion energy into thermal energy." },
      { key: "initialSpeed", label: "Initial Speed", min: 0, max: 10, step: 0.1, unit: "m/s", description: "Sets the starting kinetic energy. The work-energy theorem adds net work to this starting energy to predict final kinetic energy and speed." },
    ],
    metrics: (p) => {
      const state = workEnergyState(p);
      return [
        { label: "Applied Work", value: `${format(state.appliedWorkJ, 1)} J`, tone: "#7ff8ff", icon: Activity },
        { label: "Net Work", value: `${format(state.netWorkJ, 1)} J`, tone: state.netWorkJ >= 0 ? "#a9ef78" : "#ff4df0", icon: Sigma },
        { label: "Final Speed", value: `${format(state.finalSpeed, 2)} m/s`, tone: "#f4c95d", icon: Zap },
        { label: "Friction Loss", value: `${format(Math.abs(state.frictionWorkJ), 1)} J`, tone: "#ff4df0", icon: Magnet },
      ];
    },
    chart: (p) => ({
      label: "Final Kinetic Energy (J) vs Displacement (m)",
      points: Array.from({ length: 100 }, (_, i) => {
        const displacement = (i / 99) * 20;
        return { x: displacement, y: workEnergyState({ ...p, displacement }).finalKineticJ };
      }),
      activeX: p.displacement,
      activeY: workEnergyState(p).finalKineticJ,
      color: "#f4c95d",
      xUnit: "m",
      yUnit: "J",
    }),
    equations: [String.raw`W=Fd\cos\theta`, String.raw`K=\frac{1}{2}mv^2`, String.raw`W_{\mathrm{net}}=\Delta K`],
    explanation: "Work transfers energy when a force acts through a displacement. This model separates useful applied work, friction's negative work, and kinetic energy so the final speed follows from the work-energy theorem.",
    history: {
      body: [
        "The idea of energy took a long path through mechanics. Leibniz's vis viva emphasized a quantity proportional to mass times speed squared, while later debates clarified how this related to force, work, and useful mechanical effect.",
        "Emilie du Chatelet strongly defended the speed-squared interpretation and helped carry continental mechanics into a clearer energy language. The modern kinetic-energy expression includes the one-half factor, but the essential insight remains: doubling speed does more than double motion energy.",
        "Joule's nineteenth-century experiments connected mechanical work with heat, helping establish energy conservation across mechanical and thermal processes. That is why a rough track is not just a nuisance in this simulator: friction's negative work is energy transformed into heat rather than disappearing.",
      ],
      cards: [historyCards.leibniz, historyCards.duChatelet, historyCards.joule],
      links: [
        { label: "Work", href: "https://en.wikipedia.org/wiki/Work_(physics)" },
        { label: "Kinetic Energy", href: "https://en.wikipedia.org/wiki/Kinetic_energy" },
        { label: "Work-Energy Principle", href: "https://en.wikipedia.org/wiki/Work_(physics)#Work%E2%80%93energy_principle" },
      ],
    },
  },
  "snells-law": {
    kind: "snell",
    title: "Snell's Law Refraction",
    eyebrow: "Optics Micro Lab",
    status: "Boundary Bending",
    initial: { n1: 1, n2: 1.5, incidentAngle: 38, wavelength: 540 },
    presets: [
      { label: "Air To Glass", description: "Ray bends toward normal", values: { n1: 1, n2: 1.5, incidentAngle: 38, wavelength: 540 } },
      { label: "Air To Water", description: "Gentler refraction", values: { n1: 1, n2: 1.33, incidentAngle: 45, wavelength: 520 } },
      { label: "Glass To Air", description: "Bends away from normal", values: { n1: 1.5, n2: 1, incidentAngle: 34, wavelength: 590 } },
      { label: "Critical Edge", description: "Near total reflection", values: { n1: 1.5, n2: 1, incidentAngle: 42, wavelength: 540 } },
      { label: "Diamond", description: "Strong optical bending", values: { n1: 1, n2: 2.42, incidentAngle: 32, wavelength: 470 } },
      { label: "Shallow Ray", description: "Large incident angle", values: { n1: 1.33, n2: 1, incidentAngle: 62, wavelength: 610 } },
    ],
    controls: [
      { key: "n1", label: "Incident Index", min: 1, max: 2.6, step: 0.01, unit: "n", description: "Sets the refractive index of the upper medium the ray starts in. Larger values mean light travels slower before the boundary, and if this is larger than Medium 2 the simulator can reach total internal reflection." },
      { key: "n2", label: "Transmitted Index", min: 1, max: 2.6, step: 0.01, unit: "n", description: "Sets the refractive index of the lower medium. Increasing it bends the transmitted ray toward the normal and shortens the wavelength inside that medium." },
      { key: "incidentAngle", label: "Incident Angle", min: 0, max: 85, step: 0.5, unit: "deg", description: "Sets the angle from the normal, not from the surface. Larger angles amplify bending and can trigger total internal reflection when the ray tries to leave a higher-index medium." },
      { key: "wavelength", label: "Vacuum Wavelength", min: 380, max: 700, step: 1, unit: "nm", description: "Sets the color-scale wavelength in vacuum. Frequency stays fixed at the boundary, so the wavelength displayed inside each medium is divided by the refractive index." },
    ],
    metrics: (p) => {
      const state = snellState(p);
      return [
        { label: "Refracted Angle", value: state.totalInternalReflection ? "TIR" : `${format(state.refractedAngleDeg, 1)} deg`, tone: state.totalInternalReflection ? "#ff4df0" : "#7ff8ff", icon: Compass },
        { label: "Critical Angle", value: Number.isFinite(state.criticalAngleDeg) ? `${format(state.criticalAngleDeg, 1)} deg` : "none", tone: "#f4c95d", icon: CircleGauge },
        { label: "Reflection", value: `${format(state.reflectance * 100, 1)}%`, tone: "#ff4df0", icon: Waves },
        { label: "Medium 2 Wavelength", value: `${format(state.wavelength2Nm, 0)} nm`, tone: "#a9ef78", icon: Activity },
      ];
    },
    chart: (p) => {
      const points = Array.from({ length: 90 }, (_, i) => {
        const incidentAngle = (i / 89) * 85;
        const state = snellState({ ...p, incidentAngle });
        return { x: incidentAngle, y: state.totalInternalReflection ? 90 : state.refractedAngleDeg };
      });
      const state = snellState(p);
      return {
        label: "Refracted Angle (deg) vs Incident Angle (deg)",
        points,
        activeX: state.incidentAngleDeg,
        activeY: state.totalInternalReflection ? 90 : state.refractedAngleDeg,
        color: state.totalInternalReflection ? "#ff4df0" : "#7ff8ff",
        xUnit: "deg",
        yUnit: "deg",
      };
    },
    equations: [String.raw`n_1\sin\theta_1=n_2\sin\theta_2`, String.raw`v=\frac{c}{n}`, String.raw`\theta_c=\sin^{-1}\left(\frac{n_2}{n_1}\right)`],
    explanation: "Snell's law predicts how a light ray bends when it crosses between media with different refractive indices. The normal line is the reference, higher index means lower light speed, and total internal reflection appears when a ray inside a denser medium exceeds the critical angle.",
    history: {
      body: [
        "Refraction was first studied through practical optics: lenses, burning glasses, astronomy, and the way objects appear shifted under water. Ancient Greek and medieval Islamic optical writers treated bending light as both a geometric puzzle and an instrument-building problem.",
        "Ibn Sahl gave an early sine-based refraction rule around 984 while designing anaclastic lenses. His work shows that the mathematical structure of Snell's law existed well before the seventeenth-century European naming tradition, even if it was not transmitted as the standard classroom formula.",
        "In the seventeenth century, Willebrord Snellius and later Descartes connected refraction to a compact sine law. Newton's prism experiments then made wavelength-dependent refraction famous by splitting white light into colors. Modern optics interprets the same bending through wave speed, phase continuity, and Fermat's least-time principle.",
      ],
      cards: [historyCards.ibnSahl, historyCards.snellius, historyCards.dispersionPrism],
      links: [
        { label: "Snell's Law", href: "https://en.wikipedia.org/wiki/Snell%27s_law" },
        { label: "Ibn Sahl", href: "https://en.wikipedia.org/wiki/Ibn_Sahl_(mathematician)" },
        { label: "Refraction", href: "https://en.wikipedia.org/wiki/Refraction" },
      ],
    },
  },
  "thin-lens": {
    kind: "thinlens",
    title: "Thin Lens",
    eyebrow: "Optics Micro Lab",
    status: "Ray Formation",
    initial: { focalLength: 18, objectDistance: 42, objectHeight: 7, aperture: 16 },
    presets: [
      { label: "Beyond 2F", description: "Smaller real inverted image", values: { focalLength: 18, objectDistance: 48, objectHeight: 7, aperture: 16 } },
      { label: "At 2F", description: "Same-size real inverted image", values: { focalLength: 18, objectDistance: 36, objectHeight: 7, aperture: 16 } },
      { label: "Between F And 2F", description: "Magnified real inverted image", values: { focalLength: 18, objectDistance: 25, objectHeight: 7, aperture: 18 } },
      { label: "Magnifier", description: "Upright virtual image", values: { focalLength: 18, objectDistance: 12, objectHeight: 6, aperture: 18 } },
      { label: "Diverging Lens", description: "Reduced virtual upright image", values: { focalLength: -18, objectDistance: 38, objectHeight: 7, aperture: 15 } },
      { label: "Telephoto", description: "Long focal length compression", values: { focalLength: 30, objectDistance: 72, objectHeight: 6, aperture: 12 } },
    ],
    controls: [
      { key: "focalLength", label: "Focal Length", min: -30, max: 35, step: 0.5, unit: "cm", description: "Sets the lens focal length. Positive values make a converging lens, negative values make a diverging lens, and values near zero make the lens extremely strong." },
      { key: "objectDistance", label: "Object Distance", min: 6, max: 90, step: 0.5, unit: "cm", description: "Sets how far the object sits from the lens. Moving it through the focal length flips the result between real inverted images and virtual upright magnified images." },
      { key: "objectHeight", label: "Object Height", min: 2, max: 14, step: 0.1, unit: "cm", description: "Sets the height of the source object. Image height follows magnification, so changing this scales the formed image without changing where it appears." },
      { key: "aperture", label: "Aperture", min: 5, max: 24, step: 0.5, unit: "cm", description: "Sets the visible lens opening. Wider aperture makes the optic look physically larger; in this ideal thin-lens model it does not change focal distance." },
    ],
    metrics: (p) => {
      const state = thinLensState(p);
      const imageDistance = Math.abs(state.imageDistance) > 400 ? `${state.imageDistance > 0 ? ">" : "<"}400 cm` : `${format(state.imageDistance, 1)} cm`;
      return [
        { label: "Image Distance", value: imageDistance, tone: state.realImage ? "#7ff8ff" : "#ff4df0", icon: Compass },
        { label: "Magnification", value: `${format(state.magnification, 2)} x`, tone: "#a9ef78", icon: CircleGauge },
        { label: "Image Height", value: `${format(state.imageHeight, 1)} cm`, tone: "#f4c95d", icon: Activity },
        { label: "Optical Power", value: `${format(state.opticalPower, 2)} D`, tone: "#ff4df0", icon: Zap },
      ];
    },
    chart: (p) => {
      const minObject = Math.max(6, Math.abs(p.focalLength) * 0.45);
      const maxObject = Math.max(90, Math.abs(p.focalLength) * 4);
      const points = Array.from({ length: 100 }, (_, i) => {
        const objectDistance = minObject + (i / 99) * (maxObject - minObject);
        const state = thinLensState({ ...p, objectDistance });
        return { x: objectDistance, y: clamp(state.imageDistance, -140, 140) };
      });
      const state = thinLensState(p);
      return {
        label: "Image Distance (cm) vs Object Distance (cm)",
        points,
        activeX: state.objectDistance,
        activeY: clamp(state.imageDistance, -140, 140),
        color: state.realImage ? "#7ff8ff" : "#ff4df0",
        xUnit: "cm",
        yUnit: "cm",
      };
    },
    equations: [
      String.raw`\frac{1}{f}=\frac{1}{d_o}+\frac{1}{d_i}`,
      String.raw`m=-\frac{d_i}{d_o}`,
      String.raw`h_i=mh_o`,
    ],
    explanation: "The thin-lens model predicts where a simple lens forms an image from object distance and focal length. Real images form on the far side and invert; virtual images appear on the object side and stay upright.",
    history: {
      body: [
        "Lens optics grew from practical image-making: burning glasses, spectacles, camera obscuras, microscopes, and telescopes. Long before a compact lens equation became standard, instrument makers used ray geometry to predict where light would gather or appear to diverge from.",
        "Ibn Sahl's tenth-century work on burning lenses used a sine-based refraction rule to design shapes that focused light. Later European optics turned those geometric insights into practical telescopes and microscopes, where lens placement mattered as much as lens shape.",
        "Kepler's seventeenth-century optical work clarified how lenses form real inverted images and how the eye receives them. The thin-lens equation is a deliberately idealized limit, but it remains powerful because it gives the core tradeoff immediately: object distance, focal length, image distance, and magnification are tied together.",
      ],
      cards: [historyCards.ibnSahl, historyCards.keplerOptics, historyCards.cameraObscura],
      links: [
        { label: "Lens", href: "https://en.wikipedia.org/wiki/Lens" },
        { label: "Thin Lens", href: "https://en.wikipedia.org/wiki/Thin_lens" },
        { label: "Camera Obscura", href: "https://en.wikipedia.org/wiki/Camera_obscura" },
      ],
    },
  },
  "newton-cooling": {
    kind: "cooling",
    title: "Newton's Law Of Cooling",
    eyebrow: "Thermodynamics Micro Lab",
    status: "Thermal Relaxation",
    initial: { initialTemp: 92, ambientTemp: 22, coolingConstant: 0.18, time: 8, thermalMass: 1.4 },
    presets: [
      { label: "Hot Coffee", description: "Hot object cooling in room air", values: { initialTemp: 92, ambientTemp: 22, coolingConstant: 0.18, time: 8, thermalMass: 1.4 } },
      { label: "Ice Pack", description: "Cold object warming toward room", values: { initialTemp: -10, ambientTemp: 24, coolingConstant: 0.14, time: 10, thermalMass: 1.1 } },
      { label: "Thin Plate", description: "Low mass, rapid cooling", values: { initialTemp: 110, ambientTemp: 20, coolingConstant: 0.32, time: 6, thermalMass: 0.65 } },
      { label: "Thermos", description: "Insulated slow exchange", values: { initialTemp: 82, ambientTemp: 21, coolingConstant: 0.035, time: 28, thermalMass: 2.8 } },
      { label: "Cold Night", description: "Warm object in cold air", values: { initialTemp: 38, ambientTemp: -8, coolingConstant: 0.11, time: 18, thermalMass: 1.6 } },
      { label: "Large Block", description: "High thermal mass response", values: { initialTemp: 75, ambientTemp: 18, coolingConstant: 0.16, time: 16, thermalMass: 4.2 } },
    ],
    controls: [
      { key: "initialTemp", label: "Initial Temperature", min: -20, max: 120, step: 1, unit: "°C", description: "Sets the object's starting temperature. The object always moves from this value toward Ambient Temperature, and the initial gap controls how strong the early heat flow looks." },
      { key: "ambientTemp", label: "Ambient Temperature", min: -20, max: 60, step: 1, unit: "°C", description: "Sets the surrounding environment. The dashed ambient line is the equilibrium target; the object approaches it but does not mathematically cross it in this simple model." },
      { key: "coolingConstant", label: "Exchange Constant", min: 0.01, max: 0.6, step: 0.005, unit: "min⁻¹", description: "Sets how strongly the environment exchanges heat with the object. Higher values make the curve drop or rise faster and shorten the half-time." },
      { key: "time", label: "Elapsed Time", min: 0, max: 60, step: 0.25, unit: "min", description: "Moves along the cooling curve. Early changes are fastest because the temperature gap is largest; later changes slow as the object nears ambient temperature." },
      { key: "thermalMass", label: "Thermal Mass", min: 0.5, max: 5, step: 0.05, unit: "x", description: "Represents how much heat capacity the object has. Larger thermal mass slows the effective cooling constant, so the same environment changes the object's temperature more gradually." },
    ],
    metrics: (p) => {
      const state = coolingState(p);
      return [
        { label: "Current Temp", value: `${format(state.currentTemp, 1)} °C`, tone: state.gap >= 0 ? "#f4c95d" : "#7ff8ff", icon: Activity },
        { label: "Temperature Gap", value: `${format(state.gap, 1)} °C`, tone: "#ff4df0", icon: Waves },
        { label: "Heat Rate", value: `${format(state.rateDegPerMin, 2)} °C/min`, tone: "#7ff8ff", icon: Zap },
        { label: "Half Time", value: `${format(state.halfTimeMin, 2)} min`, tone: "#a9ef78", icon: CircleGauge },
      ];
    },
    chart: (p) => {
      const state = coolingState(p);
      const points = Array.from({ length: 100 }, (_, i) => {
        const time = (i / 99) * 60;
        return { x: time, y: coolingState({ ...p, time }).currentTemp };
      });
      return {
        label: "Temperature (°C) vs Time (min)",
        points,
        activeX: state.time,
        activeY: state.currentTemp,
        color: state.gap >= 0 ? "#f4c95d" : "#7ff8ff",
        xUnit: "min",
        yUnit: "°C",
      };
    },
    equations: [String.raw`T(t)=T_a+(T_0-T_a)e^{-kt}`, String.raw`\frac{dT}{dt}=-k(T-T_a)`, String.raw`t_{\mathrm{half}}=\frac{\ln 2}{k}`],
    explanation: "Newton's law of cooling models an object exchanging heat with a much larger environment. The heat-flow rate is proportional to the temperature difference, so the object changes quickly when far from ambient temperature and slowly as it approaches equilibrium.",
    history: {
      body: [
        "Cooling experiments sit at the border between mechanics, heat, and measurement. Before modern thermodynamics, investigators could still time how hot objects approached room temperature and compare curves using increasingly reliable thermometers.",
        "Newton published cooling observations in 1701 while studying heat and temperature scales. The simple proportional rule works best when the temperature difference is moderate, the environment is large, and the heat-transfer conditions stay roughly constant.",
        "Later heat theory made the model less mysterious. Fourier's heat equation described temperature spreading through bodies, while thermodynamics clarified heat capacity, thermal resistance, and energy conservation. Newton cooling remains valuable because it is the clean first-order version of a very broad relaxation idea.",
      ],
      cards: [historyCards.newton, historyCards.fourier, historyCards.thermometer],
      links: [
        { label: "Newton's Law Of Cooling", href: "https://en.wikipedia.org/wiki/Newton%27s_law_of_cooling" },
        { label: "Heat Transfer", href: "https://en.wikipedia.org/wiki/Heat_transfer" },
        { label: "Thermometer", href: "https://en.wikipedia.org/wiki/Thermometer" },
      ],
    },
  },
  "carnot-engine": {
    kind: "carnot",
    title: "Carnot Engine",
    eyebrow: "Thermodynamics Micro Lab",
    status: "Ideal Heat Engine",
    initial: { hotTemperature: 600, coldTemperature: 300, heatInput: 360, cyclePhase: 35 },
    animation: { label: "Cycle", paramKey: "cyclePhase", speedPerSecond: 72, min: 0, max: 360 },
    presets: [
      { label: "Textbook", description: "Classic 600 K to 300 K engine", values: { hotTemperature: 600, coldTemperature: 300, heatInput: 360, cyclePhase: 35 } },
      { label: "Steam Plant", description: "Hot boiler and warm condenser", values: { hotTemperature: 760, coldTemperature: 315, heatInput: 520, cyclePhase: 70 } },
      { label: "Small Gap", description: "Low efficiency with close reservoirs", values: { hotTemperature: 420, coldTemperature: 360, heatInput: 360, cyclePhase: 120 } },
      { label: "Deep Cold Sink", description: "Cold sink raises ideal efficiency", values: { hotTemperature: 600, coldTemperature: 90, heatInput: 360, cyclePhase: 180 } },
      { label: "High Heat Input", description: "Same efficiency, more work per cycle", values: { hotTemperature: 600, coldTemperature: 300, heatInput: 760, cyclePhase: 240 } },
      { label: "Near Limit", description: "Very hot source and cold sink", values: { hotTemperature: 950, coldTemperature: 80, heatInput: 500, cyclePhase: 300 } },
    ],
    controls: [
      { key: "hotTemperature", label: "Hot Temperature", min: 310, max: 1000, step: 1, unit: "K", description: "Sets the source reservoir temperature. Raising it increases the maximum possible efficiency because each unit of input heat can be converted into more work." },
      { key: "coldTemperature", label: "Cold Temperature", min: 40, max: 700, step: 1, unit: "K", description: "Sets the sink reservoir temperature. Lowering it raises ideal efficiency; if it approaches the hot temperature, useful work collapses." },
      { key: "heatInput", label: "Heat Input", min: 20, max: 900, step: 1, unit: "J", description: "Sets heat absorbed from the hot reservoir per ideal cycle. It scales work output and rejected heat without changing efficiency." },
      { key: "cyclePhase", label: "Cycle Phase", min: 0, max: 360, step: 1, unit: "deg", description: "Moves the marker around the ideal cycle. It is a visual timing control; reservoir temperatures and heat input set the thermodynamic values." },
    ],
    metrics: (p) => {
      const state = carnotState(p);
      return [
        { label: "Max Efficiency", value: `${format(state.efficiency * 100, 1)}%`, tone: "#a9ef78", icon: CircleGauge },
        { label: "Work Output", value: `${format(state.workOutput, 1)} J`, tone: "#f4c95d", icon: Zap },
        { label: "Rejected Heat", value: `${format(state.rejectedHeat, 1)} J`, tone: "#7ff8ff", icon: Waves },
        { label: "Temperature Ratio", value: format(state.temperatureRatio, 3), tone: "#ff4df0", icon: Activity },
      ];
    },
    chart: (p) => ({
      label: "Carnot Efficiency (%) vs Hot Temperature (K)",
      points: Array.from({ length: 90 }, (_, i) => {
        const hotTemperature = 310 + (i / 89) * 690;
        return { x: hotTemperature, y: carnotState({ ...p, hotTemperature }).efficiency * 100 };
      }),
      activeX: p.hotTemperature,
      activeY: carnotState(p).efficiency * 100,
      color: "#a9ef78",
      xUnit: "K",
      yUnit: "%",
    }),
    equations: [
      String.raw`\eta=1-\frac{T_c}{T_h}`,
      String.raw`W=\eta Q_h`,
      String.raw`Q_c=Q_h-W=Q_h\frac{T_c}{T_h}`,
    ],
    explanation: "A Carnot engine is the ideal reversible heat engine between a hot and cold reservoir. It gives the maximum possible efficiency any engine can have between those temperatures, so real engines can approach but never beat it.",
    history: {
      body: [
        "Heat engines were practical machines before thermodynamics had a clean theory. Steam engines pumped mines, drove factories, and made efficiency economically important because every improvement meant less fuel for the same useful work.",
        "Sadi Carnot's 1824 analysis asked a deliberately ideal question: what is the best possible engine between two temperatures? His reversible cycle showed that the limiting efficiency depends only on the hot and cold reservoir temperatures, not on the working fluid or mechanical details.",
        "Later thermodynamics reframed Carnot's result through entropy and the second law. The Carnot engine became less a blueprint for a literal machine and more a benchmark: if a proposed engine claims to beat the Carnot limit, it is claiming to violate the second law.",
      ],
      cards: [historyCards.sadiCarnot, historyCards.carnotEngineDiagram, historyCards.wattSteamEngine],
      links: [
        { label: "Carnot Heat Engine", href: "https://en.wikipedia.org/wiki/Carnot_heat_engine" },
        { label: "Carnot's Theorem", href: "https://en.wikipedia.org/wiki/Carnot%27s_theorem_(thermodynamics)" },
        { label: "Second Law Of Thermodynamics", href: "https://en.wikipedia.org/wiki/Second_law_of_thermodynamics" },
      ],
    },
  },
  buoyancy: {
    kind: "buoyancy",
    title: "Buoyancy",
    eyebrow: "Fluids Micro Lab",
    status: "Displaced Fluid",
    initial: { objectDensity: 620, fluidDensity: 1000, volumeL: 3.2, gravity: 9.8 },
    presets: [
      { label: "Cork", description: "Low-density floating object", values: { objectDensity: 240, fluidDensity: 1000, volumeL: 2.4, gravity: 9.8 } },
      { label: "Wood", description: "Partly submerged block", values: { objectDensity: 620, fluidDensity: 1000, volumeL: 3.2, gravity: 9.8 } },
      { label: "Ice", description: "Nearly neutral in water", values: { objectDensity: 917, fluidDensity: 1000, volumeL: 4.1, gravity: 9.8 } },
      { label: "Seawater", description: "Denser fluid increases float margin", values: { objectDensity: 920, fluidDensity: 1030, volumeL: 3.6, gravity: 9.8 } },
      { label: "Neutral", description: "Object density matches fluid", values: { objectDensity: 1000, fluidDensity: 1000, volumeL: 3.0, gravity: 9.8 } },
      { label: "Metal", description: "Dense object sinks", values: { objectDensity: 2700, fluidDensity: 1000, volumeL: 1.2, gravity: 9.8 } },
    ],
    controls: [
      { key: "objectDensity", label: "Object Density", min: 100, max: 2700, step: 10, unit: "kg/m3", description: "Sets mass packed into each cubic meter of the object. If object density is lower than fluid density, the object floats with only part of its volume submerged." },
      { key: "fluidDensity", label: "Fluid Density", min: 600, max: 1300, step: 10, unit: "kg/m3", description: "Sets how much mass the fluid has per cubic meter. Denser fluids create more buoyant force for the same displaced volume, so objects float higher." },
      { key: "volumeL", label: "Object Volume", min: 0.2, max: 8, step: 0.1, unit: "L", description: "Sets the object's physical volume. Larger objects displace more fluid and have larger buoyant forces, but they also weigh more at the same object density." },
      { key: "gravity", label: "Gravity", min: 1.6, max: 24, step: 0.1, unit: "m/s2", description: "Scales both weight and buoyant force. Changing gravity makes the forces larger or smaller, but the float-or-sink decision still depends mainly on the density ratio." },
    ],
    metrics: (p) => {
      const state = buoyancyState(p);
      return [
        { label: "Submerged", value: `${format(state.submergedFraction * 100, 1)}%`, tone: "#7ff8ff", icon: Waves },
        { label: "Buoyant Force", value: `${format(state.buoyantForceN, 1)} N`, tone: "#a9ef78", icon: Activity },
        { label: "Weight", value: `${format(state.weightN, 1)} N`, tone: "#ff4df0", icon: Box },
        { label: "Net Force", value: `${format(state.netForceN, 2)} N`, tone: state.floating ? "#a9ef78" : state.neutral ? "#f4c95d" : "#ff4df0", icon: CircleGauge },
      ];
    },
    chart: (p) => ({
      label: "Net Force (N) vs Object Density (kg/m3)",
      points: Array.from({ length: 90 }, (_, i) => {
        const objectDensity = 100 + (i / 89) * 2600;
        return { x: objectDensity, y: buoyancyState({ ...p, objectDensity }).netForceN };
      }),
      activeX: p.objectDensity,
      activeY: buoyancyState(p).netForceN,
      color: "#7ff8ff",
      xUnit: "kg/m3",
      yUnit: "N",
    }),
    equations: [String.raw`\rho=\frac{m}{V}`, String.raw`F_b=\rho_f g V_{\mathrm{disp}}`, String.raw`\rho_o\le\rho_f\Rightarrow\mathrm{float}`],
    explanation: "Buoyancy comes from displaced fluid. A floating object settles until the upward buoyant force equals its weight; a denser-than-fluid object can displace its full volume and still not get enough upward force.",
    history: {
      body: [
        "Buoyancy is usually introduced through the Archimedes story because the central idea is so visual: an object in fluid pushes fluid out of the way, and the displaced fluid's weight sets the upward force. Whether the famous bath story happened exactly as told is less important than the principle it preserves.",
        "The principle turned floating and sinking into a quantitative test of density. Ships, hydrometers, balloons, submarines, and simple classroom demonstrations all rely on the same comparison between object density, fluid density, displaced volume, and weight.",
        "Modern fluid mechanics explains the upward force through pressure differences: deeper fluid pushes harder than shallower fluid, so the bottom of an immersed object feels more pressure than the top. Archimedes' principle is the compact result of that pressure balance.",
      ],
      cards: [historyCards.archimedes, historyCards.hydrometer, historyCards.cartesianDiver],
      links: [
        { label: "Archimedes' Principle", href: "https://en.wikipedia.org/wiki/Archimedes%27_principle" },
        { label: "Buoyancy", href: "https://en.wikipedia.org/wiki/Buoyancy" },
        { label: "Hydrometer", href: "https://en.wikipedia.org/wiki/Hydrometer" },
      ],
    },
  },
  "hydrostatic-pressure": {
    kind: "hydrostatic",
    title: "Hydrostatic Pressure",
    eyebrow: "Fluids Micro Lab",
    status: "Pressure Gradient",
    initial: { fluidDensity: 1000, depth: 12, surfacePressure: 101.3, gravity: 9.81 },
    presets: [
      { label: "Fresh Water", description: "Standard water column under atmosphere", values: { fluidDensity: 1000, depth: 12, surfacePressure: 101.3, gravity: 9.81 } },
      { label: "Sea Water", description: "Denser fluid raises pressure faster", values: { fluidDensity: 1025, depth: 20, surfacePressure: 101.3, gravity: 9.81 } },
      { label: "Deep Pool", description: "Depth dominates gauge pressure", values: { fluidDensity: 1000, depth: 28, surfacePressure: 101.3, gravity: 9.81 } },
      { label: "Mercury", description: "Very dense fluid makes barometers compact", values: { fluidDensity: 13534, depth: 0.76, surfacePressure: 0, gravity: 9.81 } },
      { label: "Mountain Lake", description: "Lower air pressure shifts absolute pressure", values: { fluidDensity: 998, depth: 12, surfacePressure: 78, gravity: 9.81 } },
      { label: "Moon Tank", description: "Lower gravity weakens the pressure gradient", values: { fluidDensity: 1000, depth: 12, surfacePressure: 0, gravity: 1.62 } },
    ],
    controls: [
      { key: "fluidDensity", label: "Fluid Density", min: 200, max: 14000, step: 10, unit: "kg/m3", description: "Sets how much mass each cubic meter of fluid contains. Denser fluids add pressure faster with depth, so mercury produces a steep pressure gradient." },
      { key: "depth", label: "Depth", min: 0, max: 30, step: 0.1, unit: "m", description: "Sets how far below the free surface the probe sits. Gauge pressure grows linearly with depth, so doubling depth doubles the added fluid pressure." },
      { key: "surfacePressure", label: "Surface Pressure", min: 0, max: 180, step: 0.1, unit: "kPa", description: "Sets pressure already applied at the surface, usually atmospheric pressure. It shifts absolute pressure upward without changing the depth gradient." },
      { key: "gravity", label: "Gravity", min: 1, max: 24, step: 0.01, unit: "m/s2", description: "Sets gravitational acceleration. Stronger gravity makes the fluid column weigh more, increasing pressure at every depth below the surface." },
    ],
    metrics: (p) => {
      const gaugeKpa = (p.fluidDensity * p.gravity * p.depth) / 1000;
      const absoluteKpa = p.surfacePressure + gaugeKpa;
      return [
        { label: "Gauge Pressure", value: `${format(gaugeKpa, 1)} kPa`, tone: "#f4c95d", icon: Activity },
        { label: "Absolute Pressure", value: `${format(absoluteKpa, 1)} kPa`, tone: "#7ff8ff", icon: CircleGauge },
        { label: "Force On 1 m2", value: `${format(absoluteKpa, 1)} kN`, tone: "#ff4df0", icon: Box },
        { label: "Pressure Gradient", value: `${format((p.fluidDensity * p.gravity) / 1000, 2)} kPa/m`, tone: "#a9ef78", icon: Waves },
      ];
    },
    chart: (p) => ({
      label: "Absolute Pressure (kPa) vs Depth (m)",
      points: Array.from({ length: 90 }, (_, i) => {
        const depth = (i / 89) * 30;
        return { x: depth, y: p.surfacePressure + (p.fluidDensity * p.gravity * depth) / 1000 };
      }),
      activeX: p.depth,
      activeY: p.surfacePressure + (p.fluidDensity * p.gravity * p.depth) / 1000,
      color: "#7ff8ff",
      xUnit: "m",
      yUnit: "kPa",
    }),
    equations: [
      String.raw`p=p_0+\rho gh`,
      String.raw`\Delta p=\rho gh`,
      String.raw`F=pA`,
      String.raw`\frac{dp}{dh}=\rho g`,
    ],
    explanation: "Hydrostatic pressure is the pressure caused by the weight of fluid above a point. In a still fluid it grows linearly with depth, density, and gravity, while surface pressure shifts the whole pressure scale upward.",
    history: {
      body: [
        "Hydrostatic pressure became clear when scientists stopped treating fluids as mysterious substances and started treating a fluid column as weight stacked above an area. That simple balance explains why pressure rises with depth even when the fluid is motionless.",
        "Torricelli's mercury barometer turned the atmosphere itself into a measurable fluid-pressure problem. A short column of dense mercury could balance the weight of the air, proving that air pressure was real and variable.",
        "Pascal expanded the pressure concept into a broader hydrostatic principle: pressure applied to a confined fluid transmits throughout it. The same ideas support hydraulic machines, diving calculations, dams, manometers, barometers, and pressure sensors.",
      ],
      cards: [historyCards.torricelli, historyCards.barometer, historyCards.pascal],
      links: [
        { label: "Hydrostatics", href: "https://en.wikipedia.org/wiki/Hydrostatics" },
        { label: "Barometer", href: "https://en.wikipedia.org/wiki/Barometer" },
        { label: "Pascal's Law", href: "https://en.wikipedia.org/wiki/Pascal%27s_law" },
      ],
    },
  },
  "circular-motion": {
    kind: "circular",
    title: "Uniform Circular Motion",
    eyebrow: "Motion Micro Lab",
    status: "Radial Acceleration",
    initial: { radius: 2.4, angularSpeed: 1.4, mass: 2.2, phase: 20 },
    viewToggle: true,
    controls: [
      { key: "radius", label: "Radius", min: 0.5, max: 5, step: 0.1, unit: "m", description: "Sets the orbit size. Larger radius raises tangential speed at the same angular speed and increases centripetal acceleration and force." },
      { key: "angularSpeed", label: "Angular Speed", min: 0.2, max: 4, step: 0.05, unit: "rad/s", description: "Sets how fast the angle changes. Centripetal acceleration grows with angular speed squared, so this slider has a strong effect on force." },
      { key: "mass", label: "Mass", min: 0.5, max: 8, step: 0.1, unit: "kg", description: "Sets the orbiting object's mass. It changes centripetal force but not speed, period, or acceleration for the same radius and angular speed." },
      { key: "phase", label: "Start Phase", min: 0, max: 360, step: 1, unit: "deg", description: "Rotates the starting position around the orbit. It changes where the object begins visually, but not the speed, acceleration, force, or period." },
    ],
    metrics: (p) => [
      { label: "Tangential Speed", value: `${format(p.radius * p.angularSpeed, 2)} m/s`, tone: "#7ff8ff", icon: Zap },
      { label: "Centripetal Accel.", value: `${format(p.radius * p.angularSpeed ** 2, 2)} m/s2`, tone: "#ff4df0", icon: Activity },
      { label: "Centripetal Force", value: `${format(p.mass * p.radius * p.angularSpeed ** 2, 2)} N`, tone: "#f4c95d", icon: Magnet },
      { label: "Period", value: `${format(TAU / p.angularSpeed, 2)} s`, tone: "#a9ef78", icon: CircleGauge },
    ],
    chart: (p) => ({
      label: "Centripetal Acceleration (m/s2) vs Angular Speed (rad/s)",
      points: Array.from({ length: 80 }, (_, i) => {
        const angularSpeed = 0.2 + (i / 79) * 3.8;
        return { x: angularSpeed, y: p.radius * angularSpeed ** 2 };
      }),
      activeX: p.angularSpeed,
      activeY: p.radius * p.angularSpeed ** 2,
      color: "#ff4df0",
      xUnit: "rad/s",
      yUnit: "m/s2",
    }),
    equations: [String.raw`v=r\omega`, String.raw`a_c=\frac{v^2}{r}=r\omega^2`, String.raw`F_c=ma_c`, String.raw`T=\frac{2\pi}{\omega}`],
    explanation: "Uniform circular motion has constant speed but changing velocity direction. The acceleration always points inward toward the center.",
    history: {
      body: [
        "Circular motion was tied to astronomy long before it was tied to laboratory mechanics. Ancient models treated circular paths as natural or perfect, while later astronomers had to reconcile circular ideals with observed planetary motion.",
        "Huygens analyzed centripetal acceleration, and Newton supplied the force law that made circular and orbital motion part of the same mechanics. The important shift was realizing that constant speed can still require acceleration when direction keeps changing.",
        "Modern uses range from rotating machinery to satellites, centrifuges, and particle accelerators. The inward acceleration is the thread connecting all of them.",
      ],
      cards: [historyCards.huygens, historyCards.newton, historyCards.centripetalForce],
      links: [
        { label: "Circular Motion", href: "https://en.wikipedia.org/wiki/Circular_motion" },
        { label: "Centripetal Force", href: "https://en.wikipedia.org/wiki/Centripetal_force" },
      ],
    },
  },
  lorenz: {
    kind: "lorenz",
    title: "Lorenz Attractor",
    eyebrow: "Chaos Micro Lab",
    status: "Sensitive Dependence",
    initial: { sigma: 10, rho: 28, beta: 2.67, traceLength: 900 },
    viewToggle: true,
    controls: [
      { key: "sigma", label: "Sigma", min: 4, max: 18, step: 0.1, unit: "", description: "Sets how strongly x is pulled toward y. Higher sigma tightens the fast horizontal exchange and changes how quickly the trace flips between attractor wings." },
      { key: "rho", label: "Rho", min: 5, max: 45, step: 0.1, unit: "", description: "Acts like the driving temperature difference in Lorenz's fluid model. Around and above the classic value 28, the trace shows strong chaotic wing-switching." },
      { key: "beta", label: "Beta", min: 1, max: 5, step: 0.01, unit: "", description: "Controls vertical damping in the z direction. It changes attractor height, wing spread, and whether trajectories settle or keep folding." },
      { key: "traceLength", label: "Trace Length", min: 260, max: 1400, step: 20, unit: "pts", description: "Sets how much recent phase-space history remains visible. Longer traces reveal the attractor geometry; shorter traces make the current state easier to follow." },
    ],
    metrics: (p) => {
      const spread = Math.sqrt(Math.max(0, p.beta * (p.rho - 1)));
      return [
        { label: "Rayleigh Drive", value: format(p.rho, 1), tone: "#7ff8ff", icon: Waves },
        { label: "Wing Spread", value: format(spread, 2), tone: "#f4c95d", icon: Activity },
        { label: "Convection Rate", value: format(p.sigma, 1), tone: "#ff4df0", icon: Zap },
        { label: "Trace Points", value: format(p.traceLength, 0), tone: "#a9ef78", icon: CircleGauge },
      ];
    },
    chart: (p) => ({
      label: "Wing Spread vs Rho",
      points: Array.from({ length: 100 }, (_, i) => {
        const rho = 5 + (i / 99) * 40;
        return { x: rho, y: Math.sqrt(Math.max(0, p.beta * (rho - 1))) };
      }),
      activeX: p.rho,
      activeY: Math.sqrt(Math.max(0, p.beta * (p.rho - 1))),
      color: "#7ff8ff",
      xUnit: "rho",
      yUnit: "Spread",
    }),
    equations: [
      String.raw`\frac{dx}{dt}=\sigma(y-x)`,
      String.raw`\frac{dy}{dt}=x(\rho-z)-y`,
      String.raw`\frac{dz}{dt}=xy-\beta z`,
    ],
    explanation: "The Lorenz system shows how a deterministic set of equations can produce unpredictable, structured motion through phase space.",
    history: {
      body: [
        "Edward Lorenz was studying simplified atmospheric convection, not trying to create a visual icon. His equations compressed fluid motion into three coupled variables, enough to show that deterministic weather-like systems could behave unpredictably.",
        "The famous lesson was sensitive dependence on initial conditions: tiny changes in starting numbers can grow until long-term prediction fails. This was not randomness in the ordinary sense; the rules stayed fixed, but the trajectory became practically impossible to forecast far ahead.",
        "The butterfly-shaped attractor made chaos tangible. It showed that disorder can have structure, and it helped change how scientists think about weather, turbulence, ecology, nonlinear circuits, and any system where feedback folds behavior back on itself.",
      ],
      cards: [historyCards.lorenz, historyCards.lorenzSystem],
      links: [
        { label: "Lorenz System", href: "https://en.wikipedia.org/wiki/Lorenz_system" },
        { label: "Edward Norton Lorenz", href: "https://en.wikipedia.org/wiki/Edward_Norton_Lorenz" },
      ],
    },
  },
  "gravity-field": {
    kind: "gravityfield",
    title: "Newtonian Gravity Field",
    eyebrow: "Gravity Micro Lab",
    status: "Inverse-Square Attraction",
    initial: { mass1: 1, mass2: 0.012, separation: 384, probePosition: 0 },
    presets: [
      { label: "Earth-Moon", description: "Realistic separation and mass ratio", values: { mass1: 1, mass2: 0.012, separation: 384, probePosition: 0 } },
      { label: "Equal Worlds", description: "Barycenter halfway between masses", values: { mass1: 1, mass2: 1, separation: 120, probePosition: 0 } },
      { label: "Close Pair", description: "Distance dominates force", values: { mass1: 1, mass2: 0.2, separation: 25, probePosition: 0 } },
      { label: "Giant Companion", description: "Secondary mass shifts the center of mass", values: { mass1: 1, mass2: 5, separation: 180, probePosition: 30 } },
      { label: "Probe Near Primary", description: "Field rises sharply near mass one", values: { mass1: 1, mass2: 0.012, separation: 384, probePosition: -160 } },
      { label: "Wide Pair", description: "Weak attraction and long period", values: { mass1: 1, mass2: 1, separation: 500, probePosition: 0 } },
    ],
    controls: [
      { key: "mass1", label: "Primary Mass", min: 0.05, max: 8, step: 0.01, unit: "M⊕", description: "Sets the left body's mass in Earth masses. More mass strengthens the gravitational force, deepens the potential well, and pulls the barycenter toward the primary." },
      { key: "mass2", label: "Secondary Mass", min: 0.01, max: 8, step: 0.01, unit: "M⊕", description: "Sets the right body's mass in Earth masses. Raising it strengthens mutual attraction and shifts the shared center of mass toward the secondary." },
      { key: "separation", label: "Separation", min: 5, max: 500, step: 1, unit: "Mm", description: "Sets distance between the two centers in megameters. Gravity follows an inverse-square law, so smaller separation rapidly increases force and shortens orbital period." },
      { key: "probePosition", label: "Probe Position", min: -250, max: 250, step: 1, unit: "Mm", description: "Moves a small test probe along the line between and beyond the masses. The displayed field is the vector sum of both bodies' gravitational pulls." },
    ],
    metrics: (p) => {
      const state = gravityFieldState(p);
      return [
        { label: "Mutual Force", value: `${format(state.forceN / 1e20, 2)}e20 N`, tone: "#a9ef78", icon: Magnet },
        { label: "Probe Field", value: `${format(state.fieldAtProbe, 2)} m/s2`, tone: state.fieldAtProbe >= 0 ? "#ff4df0" : "#7ff8ff", icon: Activity },
        { label: "Orbital Period", value: `${format(state.orbitalPeriodDays, 1)} d`, tone: "#7ff8ff", icon: CircleGauge },
        { label: "Barycenter", value: `${format(state.barycenterXMm, 2)} Mm`, tone: "#f4c95d", icon: Compass },
      ];
    },
    chart: (p) => ({
      label: "Gravity Force (e20 N) vs Separation (Mm)",
      points: Array.from({ length: 90 }, (_, i) => {
        const separation = 5 + (i / 89) * 495;
        return { x: separation, y: gravityFieldState({ ...p, separation }).forceN / 1e20 };
      }),
      activeX: p.separation,
      activeY: gravityFieldState(p).forceN / 1e20,
      color: "#a9ef78",
      xUnit: "Mm",
      yUnit: "e20 N",
    }),
    equations: [
      String.raw`F_g=G\frac{m_1m_2}{r^2}`,
      String.raw`g=G\frac{M}{r^2}`,
      String.raw`U=-G\frac{m_1m_2}{r}`,
      String.raw`T=2\pi\sqrt{\frac{r^3}{G(m_1+m_2)}}`,
    ],
    explanation: "Newtonian gravity is always attractive and weakens with distance squared. This lab compares mutual force between two bodies, the field felt by a small probe, the shared barycenter, and the circular-orbit period scale for the same separation.",
    history: {
      body: [
        "Universal gravitation was powerful because it joined falling objects on Earth with the motion of the Moon and planets. Newton's law turned gravity into a single mathematical attraction between masses rather than a special tendency of objects to fall downward.",
        "The inverse-square form made gravity resemble light spreading over area and helped explain Kepler's orbital patterns. Newton could show that an inward force decreasing as distance squared naturally produces conic-section orbits under ideal two-body conditions.",
        "Measuring gravity directly in the laboratory was much harder because the force between ordinary masses is tiny. Cavendish-style torsion balances made the attraction visible through delicate twisting, allowing the gravitational constant and Earth's density to be estimated experimentally.",
      ],
      cards: [historyCards.newton, historyCards.principia, historyCards.cavendish, historyCards.torsionBalance],
      links: [
        { label: "Newton's Law Of Universal Gravitation", href: "https://en.wikipedia.org/wiki/Newton%27s_law_of_universal_gravitation" },
        { label: "Cavendish Experiment", href: "https://en.wikipedia.org/wiki/Cavendish_experiment" },
        { label: "Gravitational Field", href: "https://en.wikipedia.org/wiki/Gravitational_field" },
      ],
    },
  },
  orbital: {
    kind: "orbital",
    title: "Orbital Mechanics",
    eyebrow: "Gravity Micro Lab",
    status: "Elliptical Orbit",
    initial: { periapsis: 1.1, apoapsis: 3.2, centralMass: 1, phase: 40 },
    viewToggle: true,
    controls: [
      { key: "periapsis", label: "Periapsis", min: 0.5, max: 4, step: 0.05, unit: "AU", description: "Sets the closest approach. Lower periapsis makes the orbit more stretched and raises speed near the central body through the vis-viva relation." },
      { key: "apoapsis", label: "Apoapsis", min: 0.8, max: 6, step: 0.05, unit: "AU", description: "Sets the farthest point in the orbit. Larger apoapsis increases eccentricity, semi-major axis, and orbital period." },
      { key: "centralMass", label: "Central Mass", min: 0.2, max: 5, step: 0.05, unit: "M", description: "Sets the gravitational parameter in normalized units. More mass increases orbital speed and shortens period for the same ellipse." },
      { key: "phase", label: "Start Phase", min: 0, max: 360, step: 1, unit: "deg", description: "Moves the spacecraft around the orbit so you can compare speed and direction at different points. It changes the displayed state, not the orbit shape." },
    ],
    metrics: (p) => {
      const apoapsis = Math.max(p.apoapsis, p.periapsis + 0.2);
      const a = (p.periapsis + apoapsis) / 2;
      const e = (apoapsis - p.periapsis) / (apoapsis + p.periapsis);
      const period = TAU * Math.sqrt(a ** 3 / p.centralMass);
      const periSpeed = Math.sqrt(p.centralMass * (2 / p.periapsis - 1 / a));
      return [
        { label: "Eccentricity", value: format(e, 2), tone: "#ff4df0", icon: Compass },
        { label: "Semi-Major Axis", value: `${format(a, 2)} AU`, tone: "#f4c95d", icon: Activity },
        { label: "Period", value: `${format(period, 2)} TU`, tone: "#7ff8ff", icon: CircleGauge },
        { label: "Periapsis Speed", value: `${format(periSpeed, 2)} u/s`, tone: "#a9ef78", icon: Zap },
      ];
    },
    chart: (p) => ({
      label: "Orbital Period (TU) vs Semi-Major Axis (AU)",
      points: Array.from({ length: 90 }, (_, i) => {
        const a = 0.7 + (i / 89) * 4.8;
        return { x: a, y: TAU * Math.sqrt(a ** 3 / p.centralMass) };
      }),
      activeX: (p.periapsis + Math.max(p.apoapsis, p.periapsis + 0.2)) / 2,
      activeY: TAU * Math.sqrt((((p.periapsis + Math.max(p.apoapsis, p.periapsis + 0.2)) / 2) ** 3) / p.centralMass),
      color: "#f4c95d",
      xUnit: "AU",
      yUnit: "TU",
    }),
    equations: [
      String.raw`a=\frac{r_p+r_a}{2}`,
      String.raw`e=\frac{r_a-r_p}{r_a+r_p}`,
      String.raw`v=\sqrt{\mu\left(\frac{2}{r}-\frac{1}{a}\right)}`,
      String.raw`T=2\pi\sqrt{\frac{a^3}{\mu}}`,
    ],
    explanation: "This simplified two-body orbit shows how periapsis, apoapsis, central mass, speed, and period fit together.",
    history: {
      body: [
        "Orbital mechanics began with astronomy. Kepler described planetary motion with empirical laws, including elliptical orbits, before Newton explained why those laws follow from gravity and inertia.",
        "Once rockets and satellites became real engineering objects, orbital mechanics turned into a design language. Concepts such as periapsis, apoapsis, eccentricity, and transfer orbits let engineers plan motion without treating space as a flat map.",
        "The Hohmann transfer is a classic example: a carefully chosen ellipse can move a spacecraft between orbital radii using two burns. The simulator keeps the model simple, but it points at the same geometry used in mission planning.",
      ],
      cards: [historyCards.kepler, historyCards.newton, historyCards.orbitalMechanics, historyCards.hohmann],
      links: [
        { label: "Orbital Mechanics", href: "https://en.wikipedia.org/wiki/Orbital_mechanics" },
        { label: "Hohmann Transfer Orbit", href: "https://en.wikipedia.org/wiki/Hohmann_transfer_orbit" },
      ],
    },
  },
};

function MicroSimulator({ id }: { id: keyof typeof specs }) {
  const spec = specs[id];
  const [params, setParams] = useState<Params>(() => ({ ...spec.initial }));
  const [paused, setPaused] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [labelsVisible, setLabelsVisible] = useState(false);
  const [valuesVisible, setValuesVisible] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreenMode();
  const metrics = spec.metrics(params);
  const chart = useMemo(() => spec.chart(params), [params, spec]);
  const animation = spec.animation;
  const animationSpeed = animation?.speedParamKey
    ? (params[animation.speedParamKey] ?? animation.speedPerSecond)
    : (animation?.speedPerSecond ?? 0);

  useEffect(() => {
    if (!animation || !animationEnabled || paused) return;
    let animationFrame = 0;
    let lastTime = performance.now();
    const span = animation.max - animation.min;
    const tick = (now: number) => {
      const deltaSeconds = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;
      setParams((current) => {
        const currentValue = current[animation.paramKey] ?? animation.min;
        const shifted = currentValue + animationSpeed * deltaSeconds - animation.min;
        const wrapped = ((shifted % span) + span) % span;
        return { ...current, [animation.paramKey]: animation.min + wrapped };
      });
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [animation, animationEnabled, animationSpeed, paused]);

  const reset = () => {
    setParams({ ...spec.initial });
    setPaused(false);
    setViewMode("2d");
    setLabelsVisible(false);
    setValuesVisible(false);
    setAnimationEnabled(false);
  };

  const applyPreset = (preset: PresetSpec) => {
    setAnimationEnabled(false);
    setParams((current) => ({ ...current, ...preset.values }));
  };

  return (
    <>
      <section className={`stage microStage ${isFullscreen ? "immersiveMode" : ""}`}>
        <header className="topBar">
          <div>
            <span className="eyebrow">{spec.eyebrow}</span>
            <h2>{spec.title}</h2>
          </div>
          <div className="transport">
            <ExplanationButton
              title={spec.title}
              eyebrow="Full Explanation"
              sections={[
                {
                  title: "What This Simulates",
                  body: <p>{spec.explanation}</p>,
                },
                {
                  title: "Core Relationship",
                  body: (
                    <div className="microExplanationEquations">
                      {spec.equations.map((equation) => (
                        <BlockMath key={equation} math={equation} />
                      ))}
                    </div>
                  ),
                },
              ]}
            />
            <ExplanationButton
              title={spec.title}
              eyebrow="History"
              buttonLabel="History"
              icon={History}
              sections={[
                {
                  title: "How The Idea Developed",
                  body: <HistoryBody body={spec.history.body} />,
                },
                {
                  title: "People, Devices, And Evolution",
                  body: <HistoryGallery items={spec.history.cards} />,
                },
                {
                  title: "More Reading",
                  body: <HistoryLinks links={spec.history.links} />,
                },
              ]}
            />
            <button
              type="button"
              className={labelsVisible ? "activeTool" : ""}
              onClick={() => {
                setLabelsVisible((value) => {
                  const next = !value;
                  if (next) setValuesVisible(false);
                  return next;
                });
              }}
            >
              <Tags size={18} />
              <span>{labelsVisible ? "Hide Labels" : "Show Labels"}</span>
            </button>
            <button
              type="button"
              className={valuesVisible ? "activeTool" : ""}
              onClick={() => {
                setValuesVisible((value) => {
                  const next = !value;
                  if (next) setLabelsVisible(false);
                  return next;
                });
              }}
            >
              <CircleGauge size={18} />
              <span>{valuesVisible ? "Hide Values" : "Show Values"}</span>
            </button>
            <FullscreenButton active={isFullscreen} onToggle={toggleFullscreen} />
            {animation ? (
              <button
                type="button"
                className={animationEnabled ? "activeTool" : ""}
                onClick={() => setAnimationEnabled((value) => !value)}
              >
                <RotateCcw size={18} />
                <span>{animationEnabled ? "Stop Animation" : animation.label}</span>
              </button>
            ) : null}
            <button type="button" onClick={() => setPaused((value) => !value)}>
              {paused ? <Play size={18} /> : <Pause size={18} />}
              <span>{paused ? "Resume" : "Pause"}</span>
            </button>
            <button type="button" onClick={reset}>
              <RotateCcw size={18} />
              <span>Reset</span>
            </button>
          </div>
        </header>

        <div className="visualBand microVisual">
          <MicroCanvas
            kind={spec.kind}
            params={params}
            paused={paused}
            viewMode={viewMode}
            labelsVisible={labelsVisible}
            valuesVisible={false}
          />
          {valuesVisible ? <MicroValueOverlay kind={spec.kind} params={params} /> : null}
          <div className="sceneReadout">
            <span>{spec.status}</span>
            <strong>
              {paused
                ? "Paused"
                : animationEnabled
                  ? "Animating"
                  : spec.viewToggle
                    ? `${viewMode.toUpperCase()} View`
                    : "Live"}
            </strong>
          </div>
        </div>

        <div className="dataRail">
          {metrics.map((metric) => (
            <Metric
              key={metric.label}
              icon={metric.icon ?? Activity}
              label={metric.label}
              value={metric.value}
              tone={metric.tone}
            />
          ))}
        </div>

        <section className="analysisGrid microAnalysisGrid">
          <MiniChart
            points={chart.points}
            activeX={chart.activeX}
            activeY={chart.activeY}
            label={chart.label}
            color={chart.color}
            xUnit={chart.xUnit}
            yUnit={chart.yUnit}
          />
          <div className="equationPanel">
            <div className="chartHeader">
              <span>Equations</span>
              <Atom size={16} aria-hidden="true" />
            </div>
            {spec.equations.map((equation) => (
              <BlockMath key={equation} math={equation} />
            ))}
          </div>
        </section>
      </section>

      <aside className={`controlDock ${isFullscreen ? "immersiveControlDock" : ""}`}>
        <div className="dockTitle">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Parameters</span>
        </div>
        {spec.viewToggle ? (
          <div className="optionGrid twoCol viewModeGrid">
            <button
              type="button"
              className={viewMode === "2d" ? "selected" : ""}
              data-tooltip="Top-down view of the orbit. Use it to read radius, velocity tangent, and inward force without perspective distortion."
              onClick={() => setViewMode("2d")}
            >
              <strong>2D View</strong>
              <small>Top Down</small>
            </button>
            <button
              type="button"
              className={viewMode === "3d" ? "selected" : ""}
              data-tooltip="Tilted orbit-plane view. Use it to see the same circular motion as an angled spatial path; the physics values stay the same."
              onClick={() => setViewMode("3d")}
            >
              <strong>3D View</strong>
              <small>Tilted Plane</small>
            </button>
          </div>
        ) : null}
        {spec.presets?.length ? (
          <div className="presetBlock">
            <div className="dockTitle compactDockTitle">
              <CircleGauge size={16} aria-hidden="true" />
              <span>Popular Presets</span>
            </div>
            <div className="optionGrid twoCol presetGrid">
              {spec.presets.map((preset) => {
                const selected = Object.entries(preset.values).every(
                  ([key, value]) => Math.abs((params[key] ?? Number.NaN) - value) < 0.001,
                );
                return (
                  <button
                    type="button"
                    className={selected ? "selected" : ""}
                    data-tooltip={preset.description}
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                  >
                    <strong>{preset.label}</strong>
                    <small>{preset.description}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {spec.controls.map((control) => (
          <ControlSlider
            key={control.key}
            label={control.label}
            value={params[control.key]}
            min={control.min}
            max={control.max}
            step={control.step}
            unit={control.unit}
            description={control.description}
            onChange={(value) => setParams((current) => ({ ...current, [control.key]: value }))}
          />
        ))}
        <div className="statusPanel">
          <span>Micro Lab</span>
          <strong>{spec.title}</strong>
          <p>{spec.explanation}</p>
        </div>
      </aside>
    </>
  );
}

export function VectorAdditionSimulator() {
  return <MicroSimulator id="vector-addition" />;
}

export function MatrixTransformationSimulator() {
  return <MicroSimulator id="matrix-transformation" />;
}

export function DotProductProjectionSimulator() {
  return <MicroSimulator id="dot-product-projection" />;
}

export function LinearSystem2x2Simulator() {
  return <MicroSimulator id="linear-system-2x2" />;
}

export function EigenvectorsSimulator() {
  return <MicroSimulator id="eigenvectors" />;
}

export function LinearRegressionSimulator() {
  return <MicroSimulator id="linear-regression" />;
}

export function PythagoreanTheoremSimulator() {
  return <MicroSimulator id="pythagorean-theorem" />;
}

export function UnitCircleSimulator() {
  return <MicroSimulator id="unit-circle" />;
}

export function BinomialDistributionSimulator() {
  return <MicroSimulator id="binomial-distribution" />;
}

export function ExponentialGrowthSimulator() {
  return <MicroSimulator id="exponential-growth" />;
}

export function HookesLawSimulator() {
  return <MicroSimulator id="hookes-law" />;
}

export function ProjectileMotionSimulator() {
  return <MicroSimulator id="projectile-motion" />;
}

export function WaveSuperpositionSimulator() {
  return <MicroSimulator id="wave-superposition" />;
}

export function StandingWaveSimulator() {
  return <MicroSimulator id="standing-wave" />;
}

export function DopplerEffectSimulator() {
  return <MicroSimulator id="doppler-effect" />;
}

export function PendulumSimulator() {
  return <MicroSimulator id="pendulum" />;
}

export function OhmsLawSimulator() {
  return <MicroSimulator id="ohms-law" />;
}

export function RcCircuitSimulator() {
  return <MicroSimulator id="rc-circuit" />;
}

export function WireMagneticFieldSimulator() {
  return <MicroSimulator id="wire-magnetic-field" />;
}

export function ParallelPlateCapacitorSimulator() {
  return <MicroSimulator id="parallel-plate-capacitor" />;
}

export function CoulombsLawSimulator() {
  return <MicroSimulator id="coulombs-law" />;
}

export function AcidBasePhSimulator() {
  return <MicroSimulator id="acid-base-ph" />;
}

export function SolutionDilutionSimulator() {
  return <MicroSimulator id="solution-dilution" />;
}

export function StoichiometrySimulator() {
  return <MicroSimulator id="stoichiometry" />;
}

export function IdealGasLawSimulator() {
  return <MicroSimulator id="ideal-gas-law" />;
}

export function ReactionKineticsSimulator() {
  return <MicroSimulator id="reaction-kinetics" />;
}

export function InclineForceSimulator() {
  return <MicroSimulator id="incline-force" />;
}

export function NewtonsSecondLawSimulator() {
  return <MicroSimulator id="newtons-second-law" />;
}

export function WorkEnergySimulator() {
  return <MicroSimulator id="work-energy" />;
}

export function SnellsLawSimulator() {
  return <MicroSimulator id="snells-law" />;
}

export function ThinLensSimulator() {
  return <MicroSimulator id="thin-lens" />;
}

export function NewtonCoolingSimulator() {
  return <MicroSimulator id="newton-cooling" />;
}

export function CarnotEngineSimulator() {
  return <MicroSimulator id="carnot-engine" />;
}

export function BuoyancySimulator() {
  return <MicroSimulator id="buoyancy" />;
}

export function HydrostaticPressureSimulator() {
  return <MicroSimulator id="hydrostatic-pressure" />;
}

export function CircularMotionSimulator() {
  return <MicroSimulator id="circular-motion" />;
}

export function GravityFieldSimulator() {
  return <MicroSimulator id="gravity-field" />;
}

export function LorenzAttractorSimulator() {
  return <MicroSimulator id="lorenz" />;
}

export function OrbitalMechanicsSimulator() {
  return <MicroSimulator id="orbital" />;
}

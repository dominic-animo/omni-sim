import { useMemo, useState } from "react";
import {
  Activity,
  Atom,
  Gauge,
  History,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Tags,
  Zap,
} from "lucide-react";
import { PhotoelectricScene } from "../components/PhotoelectricScene";
import { ExplanationButton } from "../components/ExplanationButton";
import { FullscreenButton } from "../components/FullscreenButton";
import { HistoryGallery, type HistoryCard } from "../components/HistoryGallery";
import { BlockMath, InlineMath } from "../components/Equation";
import {
  ControlSlider,
  format,
  formatMathText,
  Metric,
  MiniChart,
} from "../components/WorkbenchControls";
import {
  calculatePhotoelectricState,
  currentVoltageSeries,
  energySpreadSeries,
  kineticEnergySeries,
  metalPresets,
  type MetalPreset,
  wavelengthCurrentSeries,
} from "../simulations/photoelectric";
import { useFullscreenMode } from "../hooks/useFullscreenMode";

const defaultMetal = metalPresets[0];

const metalHelp =
  "Selects the metal work function, the minimum photon energy needed to release an electron. Lower work function metals emit at longer wavelengths; higher work function metals need higher-frequency light.";

const photoelectricModes = [
  {
    label: "Near Threshold",
    detail: "Slow emission edge",
    values: {
      wavelengthNm: 528,
      intensity: 0.68,
      retardingVoltage: 0.08,
      quantumYield: 0.36,
      contactPotential: -0.05,
      collectorSpacingCm: 4.4,
      beamFocus: 0.72,
      surfaceTemperatureK: 330,
      simulationSpeed: 0.82,
    },
  },
  {
    label: "Stopping Voltage",
    detail: "Current collapse",
    values: {
      wavelengthNm: 365,
      intensity: 0.78,
      retardingVoltage: 1.34,
      quantumYield: 0.5,
      contactPotential: 0,
      collectorSpacingCm: 5.2,
      beamFocus: 0.8,
      surfaceTemperatureK: 300,
      simulationSpeed: 0.7,
    },
  },
  {
    label: "Ultraviolet Burst",
    detail: "Fast electron stream",
    values: {
      wavelengthNm: 248,
      intensity: 0.92,
      retardingVoltage: -0.7,
      quantumYield: 0.72,
      contactPotential: -0.16,
      collectorSpacingCm: 3.2,
      beamFocus: 0.94,
      surfaceTemperatureK: 420,
      simulationSpeed: 1.42,
    },
  },
  {
    label: "Thermal Edge",
    detail: "Weak tail below cutoff",
    values: {
      wavelengthNm: 590,
      intensity: 0.82,
      retardingVoltage: 0.02,
      quantumYield: 0.26,
      contactPotential: -0.28,
      collectorSpacingCm: 4.8,
      beamFocus: 0.58,
      surfaceTemperatureK: 930,
      simulationSpeed: 0.92,
    },
  },
];

const photoelectricHistoryCards: HistoryCard[] = [
  {
    name: "Heinrich Hertz",
    role: "Observed ultraviolet light assisting spark discharge in 1887.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Heinrich_Hertz",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/HEINRICH_HERTZ.JPG/330px-HEINRICH_HERTZ.JPG",
  },
  {
    name: "Philipp Lenard",
    role: "Measured emitted electrons and exposed the classical-wave mismatch.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Philipp_Lenard",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Phillipp_Lenard_in_1900.jpg/330px-Phillipp_Lenard_in_1900.jpg",
  },
  {
    name: "Albert Einstein",
    role: "Explained the effect using light quanta in 1905.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Albert_Einstein",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Albert_Einstein_Head_cleaned.jpg/330px-Albert_Einstein_Head_cleaned.jpg",
  },
  {
    name: "Robert Millikan",
    role: "Tested Einstein's equation and measured Planck's constant.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Robert_Andrews_Millikan",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Millikan.jpg/330px-Millikan.jpg",
  },
  {
    name: "Electroscope",
    role: "Early charge detector used in electrostatic and photoemission demonstrations.",
    kind: "Device",
    href: "https://en.wikipedia.org/wiki/Electroscope",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Gilberts_versorium_needle_electroscope.png/330px-Gilberts_versorium_needle_electroscope.png",
  },
  {
    name: "Photoelectric Effect",
    role: "The modern diagram: photons release electrons from a metal surface.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Photoelectric_effect",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Photoelectric_effect_in_a_solid_-_diagram.svg/330px-Photoelectric_effect_in_a_solid_-_diagram.svg.png",
  },
];

export default function PhotoelectricSimulator() {
  const [metal, setMetal] = useState<MetalPreset>(defaultMetal);
  const [wavelengthNm, setWavelengthNm] = useState(410);
  const [intensity, setIntensity] = useState(0.72);
  const [retardingVoltage, setRetardingVoltage] = useState(0.4);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [viewRotation, setViewRotation] = useState(0);
  const [viewZoom, setViewZoom] = useState(1);
  const [quantumYield, setQuantumYield] = useState(0.42);
  const [contactPotential, setContactPotential] = useState(0);
  const [collectorSpacingCm, setCollectorSpacingCm] = useState(4.2);
  const [beamFocus, setBeamFocus] = useState(0.75);
  const [surfaceTemperatureK, setSurfaceTemperatureK] = useState(310);
  const [labelsVisible, setLabelsVisible] = useState(false);
  const [valuesVisible, setValuesVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const { isFullscreen: isImmersive, toggleFullscreen } = useFullscreenMode();

  const inputs = useMemo(
    () => ({
      wavelengthNm,
      intensity,
      workFunction: metal.workFunction,
      retardingVoltage,
      simulationSpeed,
      quantumYield,
      contactPotential,
      collectorSpacingCm,
      beamFocus,
      surfaceTemperatureK,
    }),
    [
      wavelengthNm,
      intensity,
      metal.workFunction,
      retardingVoltage,
      simulationSpeed,
      quantumYield,
      contactPotential,
      collectorSpacingCm,
      beamFocus,
      surfaceTemperatureK,
    ],
  );

  const state = useMemo(
    () => calculatePhotoelectricState(inputs),
    [inputs],
  );

  const kineticSeries = useMemo(
    () => kineticEnergySeries(metal.workFunction, contactPotential),
    [metal.workFunction, contactPotential],
  );
  const voltageSeries = useMemo(() => currentVoltageSeries(inputs), [inputs]);
  const wavelengthSeries = useMemo(() => wavelengthCurrentSeries(inputs), [inputs]);
  const energySeries = useMemo(() => energySpreadSeries(state), [state]);
  const emissionStatus = !state.emission
    ? "Below Threshold"
    : state.collectionFraction < 0.02
      ? "Emission Stopped"
      : state.collectionFraction < 0.98
        ? "Partial Collection"
        : "Electrons Collected";
  const spectrumMinNm = 180;
  const spectrumMaxNm = 760;
  const wavelengthPosition = Math.max(
    0,
    Math.min(100, ((wavelengthNm - spectrumMinNm) / (spectrumMaxNm - spectrumMinNm)) * 100),
  );
  const thresholdPosition = Math.max(
    0,
    Math.min(100, ((state.thresholdWavelengthNm - spectrumMinNm) / (spectrumMaxNm - spectrumMinNm)) * 100),
  );
  const thresholdMode = wavelengthNm <= state.thresholdWavelengthNm ? "Above Threshold" : "Below Threshold";

  const modeState = {
    wavelengthNm,
    intensity,
    retardingVoltage,
    quantumYield,
    contactPotential,
    collectorSpacingCm,
    beamFocus,
    surfaceTemperatureK,
    simulationSpeed,
  };

  const applyMode = (values: (typeof photoelectricModes)[number]["values"]) => {
    setWavelengthNm(values.wavelengthNm);
    setIntensity(values.intensity);
    setRetardingVoltage(values.retardingVoltage);
    setQuantumYield(values.quantumYield);
    setContactPotential(values.contactPotential);
    setCollectorSpacingCm(values.collectorSpacingCm);
    setBeamFocus(values.beamFocus);
    setSurfaceTemperatureK(values.surfaceTemperatureK);
    setSimulationSpeed(values.simulationSpeed);
  };

  const isModeSelected = (values: (typeof photoelectricModes)[number]["values"]) =>
    Object.entries(values).every(([key, value]) => {
      const current = modeState[key as keyof typeof modeState];
      return Math.abs(current - value) < 0.01;
    });

  const reset = () => {
    setMetal(defaultMetal);
    setWavelengthNm(410);
    setIntensity(0.72);
    setRetardingVoltage(0.4);
    setSimulationSpeed(1);
    setViewRotation(0);
    setViewZoom(1);
    setQuantumYield(0.42);
    setContactPotential(0);
    setCollectorSpacingCm(4.2);
    setBeamFocus(0.75);
    setSurfaceTemperatureK(310);
    setLabelsVisible(false);
    setValuesVisible(false);
    setPaused(false);
  };

  return (
    <>
      <section className={`stage photoelectricStage ${isImmersive ? "immersiveMode" : ""}`}>
        <header className="topBar">
          <div>
            <span className="eyebrow">Quantum Emission Workbench</span>
            <h2>Photoelectric Effect</h2>
          </div>
          <div className="transport">
            <ExplanationButton
              title="Photoelectric Effect"
              eyebrow="Full Explanation"
              sections={[
                {
                  title: "What This Simulates",
                  body: (
                    <p>
                      Light arrives as photons. Each photon carries energy set by frequency,
                      not by intensity. A metal emits electrons only when one photon has enough
                      energy to overcome that metal surface's work function.
                    </p>
                  ),
                },
                {
                  title: "Core Equations",
                  body: (
                    <p>
                      Photon energy is <InlineMath math={String.raw`E = hf = \frac{hc}{\lambda}`} />.
                      The fastest emitted electrons have{" "}
                      <InlineMath math={String.raw`K_{max} = hf - \phi`} />, where{" "}
                      <InlineMath math={String.raw`\phi`} /> is the selected metal work function.
                      The stopping voltage satisfies <InlineMath math="eV_s = K_{max}" />.
                    </p>
                  ),
                },
                {
                  title: "How Controls Affect It",
                  body: (
                    <p>
                      Shorter wavelength means higher photon energy. Intensity changes the number
                      of emitted electrons only after the photon energy is above threshold. A
                      positive retarding voltage suppresses current; when it reaches the stopping
                      potential, even the fastest electrons are blocked. Contact potential shifts
                      the effective work function, while quantum yield and focus control how many
                      successful electron events reach the collector.
                    </p>
                  ),
                },
                {
                  title: "What To Watch",
                  body: (
                    <p>
                      Increase wavelength until emission stops, then switch metals and compare
                      threshold wavelength. The kinetic-energy graph responds to frequency, while
                      the current graph responds to voltage and intensity.
                    </p>
                  ),
                },
              ]}
            />
            <ExplanationButton
              title="Photoelectric Effect"
              eyebrow="History"
              buttonLabel="History"
              icon={History}
              sections={[
                {
                  title: "How The Idea Developed",
                  body: (
                    <>
                      <p>
                        Heinrich Hertz noticed in 1887 that ultraviolet light helped electric
                        sparks jump between metal terminals. The observation appeared while he was
                        testing electromagnetic waves, so the photoelectric effect first entered
                        physics as a curious side effect of experiments meant to confirm Maxwell's
                        theory.
                      </p>
                      <p>
                        Philipp Lenard then measured emitted electrons more directly. His results
                        sharpened the puzzle: brighter light could increase the number of emitted
                        electrons, but it did not increase their maximum energy. Frequency mattered
                        in a way classical wave theory could not make natural.
                      </p>
                      <p>
                        Einstein's 1905 light-quantum explanation treated light energy as arriving
                        in packets, with each electron absorbing one packet. Robert Millikan later
                        tested the equation very carefully, even while doubting Einstein's
                        interpretation, and found the linear frequency relation and Planck constant
                        embedded in the data.
                      </p>
                      <p>
                        The effect became more than a historical clue about quantum theory. It
                        underlies phototubes, photomultipliers, image sensors, solar cells, surface
                        spectroscopy, and the broader idea that light-matter interaction is often
                        counted event by event.
                      </p>
                    </>
                  ),
                },
                {
                  title: "People, Devices, And Evolution",
                  body: <HistoryGallery items={photoelectricHistoryCards} />,
                },
                {
                  title: "More Reading",
                  body: (
                    <p>
                      Start with{" "}
                      <a href="https://www.nobelprize.org/prizes/physics/1921/einstein/facts/" target="_blank" rel="noreferrer">
                        Einstein's Nobel Prize Page
                      </a>
                      , the{" "}
                      <a href="https://www.britannica.com/science/photoelectric-effect" target="_blank" rel="noreferrer">
                        Britannica Overview
                      </a>
                      , and the{" "}
                      <a href="https://en.wikipedia.org/wiki/Photoelectric_effect" target="_blank" rel="noreferrer">
                        Photoelectric Effect Article
                      </a>
                      .
                    </p>
                  ),
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
              <Gauge size={18} />
              <span>{valuesVisible ? "Hide Values" : "Show Values"}</span>
            </button>
            <FullscreenButton active={isImmersive} onToggle={toggleFullscreen} />
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

        <div className="visualBand photoelectricVisual">
          <PhotoelectricScene
            state={state}
            metalColor={metal.hue}
            paused={paused}
            speed={simulationSpeed}
            viewRotation={viewRotation}
            viewZoom={viewZoom}
            collectorSpacingCm={collectorSpacingCm}
            labelsVisible={labelsVisible}
            valuesVisible={valuesVisible}
          />
          <div className="sceneReadout">
            <span>{emissionStatus}</span>
            <strong>{state.color}</strong>
          </div>
          <div className="energyLedger" aria-label="Photoelectric Energy Balance">
            <span>Energy Balance</span>
            <div>
              <b style={{ color: state.color }}>{format(state.photonEnergyEv)} eV</b>
              <b>{format(state.effectiveWorkFunctionEv)} eV</b>
              <b className={state.thresholdMarginEv >= 0 ? "surplus" : "deficit"}>
                {state.thresholdMarginEv >= 0 ? "+" : ""}
                {format(state.thresholdMarginEv)} eV
              </b>
            </div>
            <small>Photon - Barrier = Kinetic Margin</small>
          </div>
          <div className="thresholdRibbon" aria-label="Photoelectric Threshold Wavelength">
            <div className="thresholdRibbonTop">
              <span>Threshold Wavelength</span>
              <strong className={thresholdMode === "Above Threshold" ? "open" : "closed"}>{thresholdMode}</strong>
            </div>
            <div className="spectrumTrack">
              <span className="emissionBand" style={{ width: `${thresholdPosition}%` }} />
              <i className="wavelengthMarker" style={{ left: `${wavelengthPosition}%` }} />
              <i className="thresholdMarker" style={{ left: `${thresholdPosition}%` }} />
            </div>
            <div className="thresholdRibbonBottom">
              <span>λ {format(wavelengthNm, 0)} nm</span>
              <span>λ₀ {format(state.thresholdWavelengthNm, 0)} nm</span>
            </div>
          </div>
        </div>

        <div className="dataRail">
          <Metric
            icon={Zap}
            label="Photon Energy"
            value={`${format(state.photonEnergyEv)} eV`}
            tone={state.color}
          />
          <Metric
            icon={Gauge}
            label="Max Kinetic Energy"
            value={`${format(state.maxKineticEnergyEv)} eV`}
            tone={state.emission ? "#7ff8ff" : "#ff8f70"}
          />
          <Metric
            icon={Activity}
            label="Relative Current"
            value={`${format(state.relativeCurrent * 100, 0)}%`}
            tone="#a9ef78"
          />
          <Metric
            icon={SlidersHorizontal}
            label="Stopping Potential"
            value={`${format(state.stoppingVoltage)} V`}
            tone="#f4c95d"
          />
          <Metric
            icon={Zap}
            label="Collector Current"
            value={`${format(state.collectorCurrentUa, 1)} µA`}
            tone="#ff4df0"
          />
          <Metric
            icon={Gauge}
            label="Field Strength"
            value={`${format(state.fieldStrengthVm, 1)} V/m`}
            tone="#39bfff"
          />
          <Metric
            icon={Activity}
            label="Electron Speed"
            value={`${format(state.electronVelocityMs / 1_000_000, 2)} Mm/s`}
            tone="#7ff8ff"
          />
          <Metric
            icon={Atom}
            label="De Broglie"
            value={`${format(state.deBrogliePm, 1)} pm`}
            tone="#f4c95d"
          />
        </div>

        <section className="analysisGrid">
          <MiniChart
            points={kineticSeries}
            activeX={state.frequencyThz}
            activeY={state.maxKineticEnergyEv}
            label="Kinetic Energy (eV) vs Frequency (THz)"
            color="#7ff8ff"
            xUnit="THz"
            yUnit="eV"
          />
          <MiniChart
            points={voltageSeries}
            activeX={retardingVoltage}
            activeY={state.collectorCurrentUa}
            label="Collector Current (µA) vs Voltage (V)"
            color="#ff4df0"
            xUnit="V"
            yUnit="µA"
          />
          <MiniChart
            points={wavelengthSeries}
            activeX={wavelengthNm}
            activeY={state.collectorCurrentUa}
            label="Collector Current (µA) vs Wavelength (nm)"
            color="#7ff8ff"
            xUnit="nm"
            yUnit="µA"
          />
          <MiniChart
            points={energySeries}
            activeX={state.maxKineticEnergyEv}
            activeY={Math.max(state.relativeCurrent, 0.01)}
            label="Emitted Electron Energy Spread (eV, Rel.)"
            color="#f4c95d"
            xUnit="eV"
            yUnit="Rel."
          />
          <div className="equationPanel">
            <div className="chartHeader">
              <span>Equations</span>
              <Atom size={16} aria-hidden="true" />
            </div>
            <BlockMath math={String.raw`E = hf = \frac{hc}{\lambda}`} />
            <BlockMath math={String.raw`K_{max} = hf - \phi`} />
            <BlockMath math={String.raw`V_s = \frac{K_{max}}{e}`} />
            <BlockMath math={String.raw`\lambda_0 = \frac{hc}{\phi_{eff}}`} />
            <p>
              Threshold Wavelength: <strong>{format(state.thresholdWavelengthNm, 0)} nm</strong>
            </p>
            <p>
              Threshold Margin: <strong>{format(state.thresholdMarginEv)} eV</strong>
            </p>
          </div>
        </section>
      </section>

      <aside className={`controlDock photoelectricControlDock ${isImmersive ? "immersiveControlDock" : ""}`}>
        <div className="dockTitle">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Parameters</span>
        </div>

        <div className="metalGrid">
          {metalPresets.map((preset) => (
            <button
              key={preset.symbol}
              type="button"
              className={preset.symbol === metal.symbol ? "selected" : ""}
              style={{ borderColor: preset.hue }}
              data-tooltip={metalHelp}
              onClick={() => setMetal(preset)}
            >
              <span style={{ background: preset.hue }} />
              <strong>{preset.symbol}</strong>
              <small>{formatMathText(`${format(preset.workFunction)} eV`)}</small>
            </button>
          ))}
        </div>

        <div className="presetBlock">
          <div className="dockTitle compactDockTitle">
            <Gauge size={15} aria-hidden="true" />
            <span>Scene Modes</span>
          </div>
          <div className="optionGrid twoCol presetGrid">
            {photoelectricModes.map((mode) => (
              <button
                key={mode.label}
                type="button"
                className={isModeSelected(mode.values) ? "selected" : ""}
                data-tooltip={`${mode.label} applies a coherent set of wavelength, voltage, intensity, spacing, and temperature values so the effect is easier to inspect quickly.`}
                onClick={() => applyMode(mode.values)}
              >
                <strong>{mode.label}</strong>
                <small>{mode.detail}</small>
              </button>
            ))}
          </div>
        </div>

        <ControlSlider
          label="Wavelength"
          value={wavelengthNm}
          min={180}
          max={760}
          step={1}
          unit="nm"
          description="Sets photon wavelength. Shorter wavelength means higher photon energy, so emission starts when this drops below the selected metal's threshold wavelength. Watch photon energy, threshold margin, and electron emission."
          onChange={setWavelengthNm}
        />
        <ControlSlider
          label="Intensity"
          value={intensity}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="Sets the incoming light intensity. Above threshold it raises the number of emitted electrons and collector current; below threshold it cannot make electrons emit because each photon is still too weak."
          onChange={setIntensity}
        />
        <ControlSlider
          label="Quantum Yield"
          value={quantumYield}
          min={0.02}
          max={1}
          step={0.01}
          unit=""
          description="Sets the fraction of above-threshold photon hits that successfully release an electron. It scales current and event density but does not change photon energy or the emission threshold."
          onChange={setQuantumYield}
        />
        <ControlSlider
          label="Beam Focus"
          value={beamFocus}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="Controls how concentrated the light beam is on the emitting plate. More focus increases successful collection and current density, interacting with intensity and quantum yield."
          onChange={setBeamFocus}
        />
        <ControlSlider
          label="Retarding Voltage"
          value={retardingVoltage}
          min={-3}
          max={5}
          step={0.05}
          unit="V"
          description="Applies voltage opposing or assisting electron collection. Positive retarding voltage suppresses current; when it reaches the stopping potential, even the fastest electrons are blocked."
          onChange={setRetardingVoltage}
        />
        <ControlSlider
          label="Contact Potential"
          value={contactPotential}
          min={-0.8}
          max={0.8}
          step={0.02}
          unit="eV"
          description="Shifts the effective barrier between emitter and collector. Raising it makes emission harder; lowering it makes emission easier, changing threshold wavelength and kinetic-energy margin."
          onChange={setContactPotential}
        />
        <ControlSlider
          label="Collector Spacing"
          value={collectorSpacingCm}
          min={1.2}
          max={9}
          step={0.1}
          unit="cm"
          description="Sets the distance between emitter and collector plates. Wider spacing weakens the electric field for the same voltage and stretches the electron flight path in the scene."
          onChange={setCollectorSpacingCm}
        />
        <ControlSlider
          label="Surface Temp"
          value={surfaceTemperatureK}
          min={120}
          max={1200}
          step={10}
          unit="K"
          description="Sets the emitter surface temperature. Higher temperature adds a small thermal tail near threshold, so you may see weak emission just below the clean photon-energy cutoff."
          onChange={setSurfaceTemperatureK}
        />
        <ControlSlider
          label="Simulation Speed"
          value={simulationSpeed}
          min={0.2}
          max={2.8}
          step={0.05}
          unit="x"
          description="Changes animation speed only. It helps inspect particle motion and waves without changing the physical energy, voltage, current, or threshold calculations."
          onChange={setSimulationSpeed}
        />
        <ControlSlider
          label="View Rotation"
          value={viewRotation}
          min={-65}
          max={65}
          step={1}
          unit="deg"
          description="Rotates the 3D camera view around the plates. Use it to inspect geometry and labels; it does not alter the physics or graph values."
          onChange={setViewRotation}
        />
        <ControlSlider
          label="View Zoom"
          value={viewZoom}
          min={0.7}
          max={1.45}
          step={0.01}
          unit="x"
          description="Zooms the 3D camera in or out. Use it to test readability and particle visibility; it does not change plate spacing or any physical measurement."
          onChange={setViewZoom}
        />

        <div className="statusPanel">
          <span>Selected Metal</span>
          <strong>{metal.name}</strong>
          <p>
            Work Function <b>{format(metal.workFunction)} eV</b>. Effective Barrier{" "}
            <b>{format(state.effectiveWorkFunctionEv)} eV</b> After Contact Potential.
          </p>
        </div>

        <div className="instrumentPanel">
          <span>Vacuum Telemetry</span>
          <strong>{emissionStatus}</strong>
          <p>
            Sat. Current{" "}
            <span className="mathValue">{formatMathText(`${format(state.saturationCurrentUa, 1)} µA`)}</span>
          </p>
          <p>
            Collection Gate <span className="mathValue">{format(state.collectionFraction * 100, 0)}%</span>
          </p>
          <p>
            Thermal Tail <span className="mathValue">{format(state.thermalTail * 100, 1)}%</span>
          </p>
        </div>
      </aside>
    </>
  );
}

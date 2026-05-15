import { useMemo, useState } from "react";
import {
  Aperture,
  Atom,
  CircleDot,
  History,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  SlidersHorizontal,
  Waves,
  Zap,
} from "lucide-react";
import { DoubleSlitScene } from "../components/DoubleSlitScene";
import { ExplanationButton } from "../components/ExplanationButton";
import { FullscreenButton } from "../components/FullscreenButton";
import { HistoryGallery, type HistoryCard } from "../components/HistoryGallery";
import { BlockMath, InlineMath } from "../components/Equation";
import {
  ControlSlider,
  format,
  Metric,
  MiniChart,
} from "../components/WorkbenchControls";
import {
  calculateDoubleSlitState,
  fringeSpacingSeries,
  screenProfile,
  type DoubleSlitInputs,
} from "../simulations/doubleSlit";
import { useFullscreenMode } from "../hooks/useFullscreenMode";

const doubleSlitHistoryCards: HistoryCard[] = [
  {
    name: "Thomas Young",
    role: "Used two-slit interference to argue for the wave theory of light.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Thomas_Young_(scientist)",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Thomas_Young_by_Briggs_cropped.jpg/330px-Thomas_Young_by_Briggs_cropped.jpg",
  },
  {
    name: "Augustin-Jean Fresnel",
    role: "Built the mathematical wave theory that made diffraction predictive.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Augustin-Jean_Fresnel",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Augustin_Fresnel.jpg/330px-Augustin_Fresnel.jpg",
  },
  {
    name: "Double-Slit Experiment",
    role: "The canonical setup: coherent wave, two apertures, interference screen.",
    kind: "Prototype",
    href: "https://en.wikipedia.org/wiki/Double-slit_experiment",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Double-slit.svg/330px-Double-slit.svg.png",
  },
];

const defaultInputs: DoubleSlitInputs = {
  wavelengthNm: 532,
  slitSeparationUm: 18,
  slitWidthUm: 5.5,
  screenDistanceM: 1.25,
  intensity: 0.82,
  coherence: 0.92,
  detectorYmm: 4,
  simulationSpeed: 1,
};

export default function DoubleSlitSimulator() {
  const [inputs, setInputs] = useState<DoubleSlitInputs>(defaultInputs);
  const [paused, setPaused] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(false);
  const [valuesVisible, setValuesVisible] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreenMode();

  const state = useMemo(() => calculateDoubleSlitState(inputs), [inputs]);
  const profile = useMemo(() => screenProfile(inputs), [inputs]);
  const fringeSeries = useMemo(() => fringeSpacingSeries(inputs), [inputs]);

  const update = <K extends keyof DoubleSlitInputs>(
    key: K,
    value: DoubleSlitInputs[K],
  ) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setInputs(defaultInputs);
    setPaused(false);
  };

  return (
    <>
      <section className={`stage ${isFullscreen ? "immersiveMode" : ""}`}>
        <header className="topBar">
          <div>
            <span className="eyebrow">Wave Interference Workbench</span>
            <h2>Double Slit</h2>
          </div>
          <div className="transport">
            <ExplanationButton
              title="Double Slit Interference"
              eyebrow="Full Explanation"
              sections={[
                {
                  title: "What This Simulates",
                  body: (
                    <p>
                      A coherent wavefront passes through two narrow slits. The two emerging
                      waves overlap at the screen, producing bright bands where their phases align
                      and dark bands where their phases cancel.
                    </p>
                  ),
                },
                {
                  title: "Interference And Diffraction",
                  body: (
                    <p>
                      The band spacing is approximated by{" "}
                      <InlineMath math={String.raw`\Delta y = \frac{\lambda L}{d}`} />, where{" "}
                      <InlineMath math={String.raw`\lambda`} /> is wavelength, <InlineMath math="L" /> is
                      screen distance, and <InlineMath math="d" /> is slit separation. Finite slit
                      width adds a diffraction envelope that dims outer fringes.
                    </p>
                  ),
                },
                {
                  title: "How Controls Affect It",
                  body: (
                    <p>
                      Increasing wavelength or screen distance spreads fringes apart. Increasing
                      slit separation compresses them. Increasing slit width narrows the diffraction
                      envelope. Lower coherence washes out contrast without necessarily changing
                      the broad shape of the envelope.
                    </p>
                  ),
                },
                {
                  title: "What To Watch",
                  body: (
                    <p>
                      Move the detector offset to sample bright and dark bands. Then lower
                      coherence and notice how the screen pattern flattens. The yellow detector
                      line shows the exact vertical position used for the intensity readout.
                    </p>
                  ),
                },
              ]}
            />
            <ExplanationButton
              title="Double Slit"
              eyebrow="History"
              buttonLabel="History"
              icon={History}
              sections={[
                {
                  title: "How The Idea Developed",
                  body: (
                    <>
                      <p>
                        Thomas Young's 1801 double-slit demonstration helped establish the wave
                        theory of light by showing stable interference bands. It challenged a
                        particle-only picture of light because two paths could combine to make
                        brightness in some places and darkness in others.
                      </p>
                      <p>
                        Fresnel and later nineteenth-century optics turned the idea into a mature
                        wave theory with diffraction, coherence, and phase. The experiment became
                        a clean way to see that the geometry of paths, not just the brightness of
                        a source, controls what appears on a screen.
                      </p>
                      <p>
                        In the twentieth century the same setup became stranger. Single photons,
                        electrons, neutrons, and even larger particles can build an interference
                        pattern statistically, even when the detections arrive one at a time. That
                        pushed the experiment into the center of quantum measurement, probability,
                        and wave-particle duality.
                      </p>
                    </>
                  ),
                },
                {
                  title: "People, Devices, And Evolution",
                  body: <HistoryGallery items={doubleSlitHistoryCards} />,
                },
                {
                  title: "More Reading",
                  body: (
                    <p>
                      Read more at{" "}
                      <a href="https://en.wikipedia.org/wiki/Double-slit_experiment" target="_blank" rel="noreferrer">
                        Double-Slit Experiment
                      </a>
                      ,{" "}
                      <a href="https://www.britannica.com/science/Youngs-experiment" target="_blank" rel="noreferrer">
                        Young's Experiment
                      </a>
                      , and{" "}
                      <a href="https://en.wikipedia.org/wiki/Thomas_Young_(scientist)" target="_blank" rel="noreferrer">
                        Thomas Young
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
              <Aperture size={18} />
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
              <ScanLine size={18} />
              <span>{valuesVisible ? "Hide Values" : "Show Values"}</span>
            </button>
            <FullscreenButton active={isFullscreen} onToggle={toggleFullscreen} />
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

        <div className="visualBand doubleSlitVisual">
          <DoubleSlitScene
            inputs={inputs}
            state={state}
            paused={paused}
            labelsVisible={labelsVisible}
            valuesVisible={valuesVisible}
          />
          <div className="sceneReadout">
            <span>Detector Intensity {format(state.detectorIntensity * 100, 0)}%</span>
            <strong>{state.color}</strong>
          </div>
        </div>

        <div className="dataRail">
          <Metric
            icon={Waves}
            label="Fringe Spacing"
            value={`${format(state.fringeSpacingMm)} mm`}
            tone={state.color}
          />
          <Metric
            icon={Aperture}
            label="Envelope Width"
            value={`${format(state.centralEnvelopeWidthMm)} mm`}
            tone="#7ff8ff"
          />
          <Metric
            icon={CircleDot}
            label="Phase Difference"
            value={`${format(state.phaseDifferenceCycles)} cycles`}
            tone="#f4c95d"
          />
          <Metric
            icon={Zap}
            label="Contrast"
            value={`${format(state.contrast * 100, 0)}%`}
            tone="#a9ef78"
          />
        </div>

        <section className="analysisGrid">
          <MiniChart
            points={profile}
            activeX={inputs.detectorYmm}
            activeY={state.detectorIntensity}
            label="Screen Intensity Profile (mm, Rel.)"
            color={state.color}
            xUnit="mm"
            yUnit="Rel."
          />
          <MiniChart
            points={fringeSeries}
            activeX={inputs.wavelengthNm}
            activeY={state.fringeSpacingMm}
            label="Fringe Spacing (mm) vs Wavelength (nm)"
            color="#7ff8ff"
            xUnit="nm"
            yUnit="mm"
          />
          <div className="equationPanel">
            <div className="chartHeader">
              <span>Equations</span>
              <Atom size={16} aria-hidden="true" />
            </div>
            <BlockMath math={String.raw`\Delta y = \frac{\lambda L}{d}`} />
            <BlockMath math={String.raw`I = I_0\cos^2(\beta)\operatorname{sinc}^2(\alpha)`} />
            <BlockMath math={String.raw`\beta = \frac{\pi d\sin\theta}{\lambda}`} />
            <p>
              Detector Offset: <strong>{format(inputs.detectorYmm)} mm</strong>
            </p>
          </div>
        </section>
      </section>

      <aside className={`controlDock ${isFullscreen ? "immersiveControlDock" : ""}`}>
        <div className="dockTitle">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Parameters</span>
        </div>

        <div className="statusPanel waveStatus">
          <span>Interference Mode</span>
          <strong>Coherent Wavefront</strong>
          <p>
            Slit separation controls fringe spacing. Slit width controls the diffraction
            envelope that suppresses outer bands.
          </p>
        </div>

        <ControlSlider
          label="Wavelength"
          value={inputs.wavelengthNm}
          min={380}
          max={720}
          step={1}
          unit="nm"
          description="Sets light wavelength. Longer wavelength spreads interference fringes farther apart and changes the beam color; shorter wavelength compresses the bands."
          onChange={(value) => update("wavelengthNm", value)}
        />
        <ControlSlider
          label="Slit Separation"
          value={inputs.slitSeparationUm}
          min={6}
          max={44}
          step={0.5}
          unit="um"
          description="Sets distance between the two slit centers. Larger separation makes fringes closer together; smaller separation spreads them out across the screen."
          onChange={(value) => update("slitSeparationUm", value)}
        />
        <ControlSlider
          label="Slit Width"
          value={inputs.slitWidthUm}
          min={1}
          max={14}
          step={0.25}
          unit="um"
          description="Sets each slit opening width. Wider slits narrow the diffraction envelope and dim outer fringes sooner; narrower slits broaden the envelope."
          onChange={(value) => update("slitWidthUm", value)}
        />
        <ControlSlider
          label="Screen Distance"
          value={inputs.screenDistanceM}
          min={0.4}
          max={2.5}
          step={0.05}
          unit="m"
          description="Sets how far the screen is from the barrier. A longer distance magnifies the interference pattern, increasing fringe spacing and envelope width."
          onChange={(value) => update("screenDistanceM", value)}
        />
        <ControlSlider
          label="Source Intensity"
          value={inputs.intensity}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="Scales wave brightness. It changes visible intensity and detector strength, but by itself does not change fringe spacing or phase geometry."
          onChange={(value) => update("intensity", value)}
        />
        <ControlSlider
          label="Coherence"
          value={inputs.coherence}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="Controls how phase-stable the two waves are. Lower coherence washes out bright and dark contrast while leaving the broad geometry largely intact."
          onChange={(value) => update("coherence", value)}
        />
        <ControlSlider
          label="Detector Offset"
          value={inputs.detectorYmm}
          min={-25}
          max={25}
          step={0.25}
          unit="mm"
          description="Moves the yellow detector probe up and down the screen. Watch detector intensity rise on bright bands and fall in dark bands."
          onChange={(value) => update("detectorYmm", value)}
        />
        <ControlSlider
          label="Simulation Speed"
          value={inputs.simulationSpeed}
          min={0.2}
          max={2.8}
          step={0.05}
          unit="x"
          description="Changes wave animation speed only. It helps inspect propagation and interference timing without changing wavelength, slit geometry, or detector readings."
          onChange={(value) => update("simulationSpeed", value)}
        />

        <div className="iconRow">
          <ScanLine size={18} aria-hidden="true" />
          <span>Live Detector Scan Follows The Yellow Probe Line On The Screen.</span>
        </div>
      </aside>
    </>
  );
}

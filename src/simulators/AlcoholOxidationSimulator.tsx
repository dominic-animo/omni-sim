import { useMemo, useState } from "react";
import {
  Atom,
  BadgeAlert,
  Beaker,
  FlaskConical,
  History,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Thermometer,
  Timer,
  Waves,
  Zap,
} from "lucide-react";
import { AlcoholOxidationScene } from "../components/AlcoholOxidationScene";
import { ExplanationButton } from "../components/ExplanationButton";
import { FullscreenButton } from "../components/FullscreenButton";
import { HistoryGallery, type HistoryCard } from "../components/HistoryGallery";
import { ChemBlock } from "../components/Equation";
import {
  ControlSlider,
  format,
  Metric,
  MiniChart,
} from "../components/WorkbenchControls";
import {
  acidYieldSeries,
  calculateAlcoholOxidationState,
  getOxidantPreset,
  oxidantPresets,
  reactionProgressSeries,
  type AlcoholOxidationInputs,
  type OxidantPresetId,
  type SubstrateClass,
} from "../simulations/alcoholOxidation";
import { useFullscreenMode } from "../hooks/useFullscreenMode";

const alcoholOxidationHistoryCards: HistoryCard[] = [
  {
    name: "Alcohol Oxidation",
    role: "The broad transformation from alcohols to carbonyls or acids.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Alcohol_oxidation",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Alcohol_to_aldehyde_or_ketone.svg/330px-Alcohol_to_aldehyde_or_ketone.svg.png",
  },
  {
    name: "Jones Oxidation",
    role: "Strong chromium-based aqueous oxidation used for robust acid-forming conditions.",
    kind: "Reagent",
    href: "https://en.wikipedia.org/wiki/Jones_oxidation",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Jones_Oxidation_Scheme.png/330px-Jones_Oxidation_Scheme.png",
  },
  {
    name: "Pyridinium Chlorochromate",
    role: "Milder chromium reagent often used to stop at aldehydes or ketones.",
    kind: "Reagent",
    href: "https://en.wikipedia.org/wiki/Pyridinium_chlorochromate",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Corey-Reagenz.svg/330px-Corey-Reagenz.svg.png",
  },
];

const defaultInputs: AlcoholOxidationInputs = {
  substrateClass: "secondary",
  oxidant: "jones",
  oxidantStrength: 0.78,
  waterFraction: 0.58,
  acidity: 0.68,
  temperatureC: 32,
  timeMinutes: 70,
  cleavageStress: 0.08,
  simulationSpeed: 1,
};

export default function AlcoholOxidationSimulator() {
  const [inputs, setInputs] = useState<AlcoholOxidationInputs>(defaultInputs);
  const [paused, setPaused] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreenMode();

  const state = useMemo(() => calculateAlcoholOxidationState(inputs), [inputs]);
  const progressSeries = useMemo(() => reactionProgressSeries(inputs), [inputs]);
  const acidSeries = useMemo(() => acidYieldSeries(inputs), [inputs]);
  const oxidant = getOxidantPreset(inputs.oxidant);

  const update = <K extends keyof AlcoholOxidationInputs>(
    key: K,
    value: AlcoholOxidationInputs[K],
  ) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const setSubstrate = (substrateClass: SubstrateClass) => {
    setInputs((current) => ({ ...current, substrateClass }));
  };

  const setOxidant = (oxidantId: OxidantPresetId) => {
    const next = getOxidantPreset(oxidantId);
    setInputs((current) => ({
      ...current,
      oxidant: oxidantId,
      oxidantStrength: next.strength,
      waterFraction: Math.max(current.waterFraction, next.aqueous * 0.7),
    }));
  };

  const reset = () => {
    setInputs(defaultInputs);
    setPaused(false);
  };

  const acidYield =
    inputs.substrateClass === "secondary" ? state.cleavageAcid : state.carboxylicAcid;
  const targetYield =
    inputs.substrateClass === "secondary" ? state.ketone : state.carboxylicAcid;

  return (
    <>
      <section className={`stage ${isFullscreen ? "immersiveMode" : ""}`}>
        <header className="topBar">
          <div>
            <span className="eyebrow">Organic Redox Workbench</span>
            <h2>Alcohol Oxidation</h2>
          </div>
          <div className="transport">
            <ExplanationButton
              title="Alcohol Oxidation"
              eyebrow="Full Explanation"
              sections={[
                {
                  title: "What This Simulates",
                  body: (
                    <p>
                      The simulator compares alcohol oxidation pathways under different oxidants
                      and conditions. It distinguishes selective oxidation from over-oxidation and
                      destructive cleavage.
                    </p>
                  ),
                },
                {
                  title: "Key Chemistry Correction",
                  body: (
                    <p>
                      A secondary alcohol normally oxidizes to a ketone. It does not directly
                      become a carboxylic acid because the carbon bearing the hydroxyl group has no
                      C-H bond left after ketone formation. Acid products from a secondary alcohol
                      imply harsh oxidative C-C cleavage, not the standard alcohol oxidation route.
                    </p>
                  ),
                },
                {
                  title: "Primary Alcohol Route",
                  body: (
                    <p>
                      A primary alcohol can oxidize first to an aldehyde. In aqueous, acidic,
                      strongly oxidizing conditions, the aldehyde hydrates and can continue onward
                      to a carboxylic acid. Dry selective oxidants favor stopping at the aldehyde.
                    </p>
                  ),
                },
                {
                  title: "How Controls Affect It",
                  body: (
                    <p>
                      Oxidant strength, acidity, temperature, and time increase conversion. Water
                      content encourages the aldehyde-to-acid route for primary alcohols. C-C
                      cleavage stress only matters as a destructive secondary-alcohol pathway.
                    </p>
                  ),
                },
                {
                  title: "What To Watch",
                  body: (
                    <p>
                      Start in secondary mode and observe ketone selectivity. Then switch to
                      primary mode, raise water content and reaction time, and watch the acid yield
                      rise through the aldehyde pathway.
                    </p>
                  ),
                },
              ]}
            />
            <ExplanationButton
              title="Alcohol Oxidation"
              eyebrow="History"
              buttonLabel="History"
              icon={History}
              sections={[
                {
                  title: "How The Idea Developed",
                  body: (
                    <>
                      <p>
                        Alcohol oxidation became a core synthetic transformation because it turns
                        common alcohol functional groups into carbonyl compounds. Once chemists
                        could reliably make aldehydes, ketones, and carboxylic acids, those products
                        became branching points for building larger molecules.
                      </p>
                      <p>
                        Chromium and manganese reagents gave early organic chemistry powerful
                        oxidation tools, with Jones oxidation making strong aqueous oxidation
                        routine. Later methods such as PCC, Swern oxidation, and Dess-Martin
                        periodinane gave chemists more control over stopping at aldehydes or
                        ketones instead of pushing every substrate to harsh endpoints.
                      </p>
                      <p>
                        The selectivity detail matters for teaching: primary alcohols can continue
                        from aldehydes to carboxylic acids under water-rich, strongly oxidizing
                        conditions, while secondary alcohols normally stop at ketones because there
                        is no remaining hydrogen on the oxidized carbon to continue the same path.
                        Modern practice also weighs toxicity, waste, safety, solvent choice, and
                        whether a milder catalyst can replace older heavy-metal reagents.
                      </p>
                    </>
                  ),
                },
                {
                  title: "People, Devices, And Evolution",
                  body: <HistoryGallery items={alcoholOxidationHistoryCards} />,
                },
                {
                  title: "More Reading",
                  body: (
                    <p>
                      Start with{" "}
                      <a href="https://en.wikipedia.org/wiki/Alcohol_oxidation" target="_blank" rel="noreferrer">
                        Alcohol Oxidation
                      </a>
                      ,{" "}
                      <a href="https://en.wikipedia.org/wiki/Jones_oxidation" target="_blank" rel="noreferrer">
                        Jones Oxidation
                      </a>
                      , and{" "}
                      <a href="https://en.wikipedia.org/wiki/Pyridinium_chlorochromate" target="_blank" rel="noreferrer">
                        Pyridinium Chlorochromate
                      </a>
                      .
                    </p>
                  ),
                },
              ]}
            />
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

        <div className="visualBand">
          <AlcoholOxidationScene inputs={inputs} state={state} paused={paused} />
          <div className="sceneReadout">
            <span>{state.mainProduct} Favored</span>
            <strong>{format(targetYield * 100, 0)}% Yield</strong>
          </div>
        </div>

        <div className="dataRail">
          <Metric
            icon={Zap}
            label="Conversion"
            value={`${format(state.conversion * 100, 0)}%`}
            tone={state.color}
          />
          <Metric
            icon={FlaskConical}
            label={inputs.substrateClass === "secondary" ? "Ketone Yield" : "Acid Yield"}
            value={`${format(targetYield * 100, 0)}%`}
            tone={state.color}
          />
          <Metric
            icon={BadgeAlert}
            label="Carboxylic Acid"
            value={`${format(acidYield * 100, 0)}%`}
            tone={inputs.substrateClass === "secondary" ? "#ff8a55" : "#a9ef78"}
          />
          <Metric
            icon={Thermometer}
            label="Redox Load"
            value={`${format(state.redoxUnits, 1)} e-`}
            tone="#f4c95d"
          />
        </div>

        <section className="analysisGrid">
          <MiniChart
            points={progressSeries}
            activeX={inputs.timeMinutes}
            activeY={
              inputs.substrateClass === "secondary"
                ? state.ketone + state.cleavageAcid
                : state.aldehyde + state.carboxylicAcid
            }
            label="Reaction Progress (Yield) vs Time (min)"
            color={state.color}
            xUnit="min"
            yUnit="Yield"
          />
          <MiniChart
            points={acidSeries}
            activeX={inputs.waterFraction}
            activeY={acidYield}
            label={
              inputs.substrateClass === "secondary"
                ? "Cleavage Acid (Yield) vs Water Fraction"
                : "Carboxylic Acid (Yield) vs Water Fraction"
            }
            color="#ff8a55"
            xUnit="Fraction"
            yUnit="Yield"
          />
          <div className="equationPanel">
            <div className="chartHeader">
              <span>Mechanism Check</span>
              <Atom size={16} aria-hidden="true" />
            </div>
            <ChemBlock math="R2CHOH -> R2C=O" />
            <ChemBlock math="RCH2OH -> RCHO -> RCO2H" />
            <ChemBlock math="harsh [O] -> acid fragments" />
            <p>{state.routeNote}</p>
          </div>
        </section>
      </section>

      <aside className={`controlDock ${isFullscreen ? "immersiveControlDock" : ""}`}>
        <div className="dockTitle">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Parameters</span>
        </div>

        <div className="optionGrid twoCol">
          <button
            type="button"
            className={inputs.substrateClass === "secondary" ? "selected" : ""}
            data-tooltip="Secondary alcohols normally oxidize to ketones. If acid appears here, it represents harsh C-C cleavage, not ordinary direct oxidation to a carboxylic acid."
            onClick={() => setSubstrate("secondary")}
          >
            <strong>Secondary</strong>
            <small>2 Deg Alcohol To Ketone</small>
          </button>
          <button
            type="button"
            className={inputs.substrateClass === "primary" ? "selected" : ""}
            data-tooltip="Primary alcohols can pass through an aldehyde and, under aqueous strong oxidizing conditions, continue to a carboxylic acid. Watch water, acidity, time, and oxidant strength."
            onClick={() => setSubstrate("primary")}
          >
            <strong>Primary</strong>
            <small>1 Deg Alcohol To Acid</small>
          </button>
        </div>

        <div className="optionGrid oxidantGrid">
          {oxidantPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={preset.id === inputs.oxidant ? "selected" : ""}
              style={{ borderColor: preset.tone }}
              data-tooltip="Selects the oxidant preset and its baseline strength/water behavior. Strong aqueous oxidants push conversion and acid formation; selective dry oxidants favor stopping earlier."
              onClick={() => setOxidant(preset.id)}
            >
              <span style={{ background: preset.tone }} />
              <strong>{preset.shortName}</strong>
              <small>{preset.name}</small>
            </button>
          ))}
        </div>

        <ControlSlider
          label="Oxidant Strength"
          value={inputs.oxidantStrength}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="Sets how forceful the oxidizing conditions are. Higher strength raises conversion and can push primary alcohols toward acid; with secondary alcohols it can contribute to cleavage only under harsh conditions."
          onChange={(value) => update("oxidantStrength", value)}
        />
        <ControlSlider
          label="Water Content"
          value={inputs.waterFraction}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="Sets how aqueous the reaction is. Water helps aldehydes hydrate, making primary alcohols more likely to continue to carboxylic acid; it has less direct value for normal secondary-to-ketone oxidation."
          onChange={(value) => update("waterFraction", value)}
        />
        <ControlSlider
          label="Acidity"
          value={inputs.acidity}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="Sets acid strength of the medium. More acidity accelerates many strong oxidations and supports hydrate/acid pathways, but can also make conditions less selective."
          onChange={(value) => update("acidity", value)}
        />
        <ControlSlider
          label="Temperature"
          value={inputs.temperatureC}
          min={0}
          max={120}
          step={1}
          unit="C"
          description="Sets reaction temperature. Higher temperature speeds conversion and side pathways; observe yield increase faster, but with harsher conditions selectivity can suffer."
          onChange={(value) => update("temperatureC", value)}
        />
        <ControlSlider
          label="Reaction Time"
          value={inputs.timeMinutes}
          min={1}
          max={180}
          step={1}
          unit="min"
          description="Sets elapsed reaction time. More time lets conversion advance; in primary alcohol mode, long times with water and strong oxidant increase acid yield."
          onChange={(value) => update("timeMinutes", value)}
        />
        <ControlSlider
          label="C-C Cleavage Stress"
          value={inputs.cleavageStress}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="Sets destructive C-C cleavage pressure. It mainly matters for secondary alcohol acid fragments; raising it should make the simulator show acid as breakdown, not normal alcohol oxidation."
          onChange={(value) => update("cleavageStress", value)}
        />
        <ControlSlider
          label="Simulation Speed"
          value={inputs.simulationSpeed}
          min={0.2}
          max={2.8}
          step={0.05}
          unit="x"
          description="Changes reaction animation speed only. It affects visual pacing, not calculated conversion, selectivity, or product distribution."
          onChange={(value) => update("simulationSpeed", value)}
        />

        <div className="statusPanel chemistryStatus">
          <span>Selected Oxidant</span>
          <strong>{oxidant.name}</strong>
          <p>{state.routeNote}</p>
        </div>

        <div className="iconRow">
          <Beaker size={18} aria-hidden="true" />
          <span>
            {inputs.substrateClass === "secondary"
              ? "For carboxylic acid products, switch to primary alcohol or raise cleavage stress to show destructive oxidation."
              : "Aqueous strong oxidants push the aldehyde intermediate onward to the acid."}
          </span>
        </div>
      </aside>
    </>
  );
}

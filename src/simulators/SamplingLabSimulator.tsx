import { useMemo, useState } from "react";
import {
  Activity,
  Atom,
  Bell,
  Brain,
  ChartNoAxesCombined,
  History,
  Pause,
  Play,
  RotateCcw,
  Sigma,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { BlockMath, InlineMath } from "../components/Equation";
import { ExplanationButton } from "../components/ExplanationButton";
import { FullscreenButton } from "../components/FullscreenButton";
import { HistoryGallery, type HistoryCard } from "../components/HistoryGallery";
import { SamplingLabScene } from "../components/SamplingLabScene";
import {
  calculateSamplingState,
  tCurveSeries,
  type PopulationShape,
  type SamplingInputs,
  type TailMode,
} from "../simulations/samplingLab";
import {
  ControlSlider,
  format,
  Metric,
  MiniChart,
} from "../components/WorkbenchControls";
import { useFullscreenMode } from "../hooks/useFullscreenMode";

const defaultInputs: SamplingInputs = {
  shape: "normal",
  mean: 100,
  sd: 15,
  sampleSize: 12,
  sampleCount: 220,
  nullMean: 100,
  confidence: 0.95,
  tailMode: "two",
  unknownSigma: true,
  seed: 4217,
};

const samplingHistoryCards: HistoryCard[] = [
  {
    name: "Abraham De Moivre",
    role: "Developed an early normal approximation for binomial probabilities.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Abraham_de_Moivre",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Abraham_de_Moivre_by_Joseph_Highmore.jpg/330px-Abraham_de_Moivre_by_Joseph_Highmore.jpg",
  },
  {
    name: "Pierre-Simon Laplace",
    role: "Extended probability theory and central-limit reasoning.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Pierre-Simon_Laplace",
    image: "https://upload.wikimedia.org/wikipedia/commons/3/39/Laplace%2C_Pierre-Simon%2C_marquis_de.jpg",
  },
  {
    name: "Carl Friedrich Gauss",
    role: "Made the error curve central to measurement and least squares.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/Carl_Friedrich_Gauss",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Carl_Friedrich_Gauss_1840_by_Jensen.jpg/330px-Carl_Friedrich_Gauss_1840_by_Jensen.jpg",
  },
  {
    name: "William Sealy Gosset",
    role: "Published Student's t distribution for small samples in 1908.",
    kind: "Person",
    href: "https://en.wikipedia.org/wiki/William_Sealy_Gosset",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/William_Sealy_Gosset.jpg/330px-William_Sealy_Gosset.jpg",
  },
  {
    name: "Normal Distribution",
    role: "The bell-curve model for measurement error and aggregate variation.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Normal_distribution",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Normal_Distribution_PDF.svg/330px-Normal_Distribution_PDF.svg.png",
  },
  {
    name: "Student's t-Distribution",
    role: "The small-sample reference curve when standard deviation is estimated.",
    kind: "Evolution",
    href: "https://en.wikipedia.org/wiki/Student%27s_t-distribution",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Student_t_pdf.svg/330px-Student_t_pdf.svg.png",
  },
];

const shapes: Array<{ id: PopulationShape; label: string; detail: string }> = [
  { id: "normal", label: "Normal", detail: "Single Symmetric Bell" },
  { id: "skewed", label: "Skewed", detail: "Long Right Tail" },
  { id: "bimodal", label: "Bimodal", detail: "Two Hidden Groups" },
  { id: "uniform", label: "Uniform", detail: "Flat Population" },
];

const tails: Array<{ id: TailMode; label: string }> = [
  { id: "two", label: "Two-Tailed" },
  { id: "left", label: "Left Tail" },
  { id: "right", label: "Right Tail" },
];

export default function SamplingLabSimulator() {
  const [inputs, setInputs] = useState<SamplingInputs>(defaultInputs);
  const [paused, setPaused] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreenMode();

  const state = useMemo(() => calculateSamplingState(inputs), [inputs]);
  const tSeries = useMemo(() => tCurveSeries(inputs.sampleSize - 1), [inputs.sampleSize]);

  const update = <K extends keyof SamplingInputs>(key: K, value: SamplingInputs[K]) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const resample = () => {
    setInputs((current) => ({ ...current, seed: current.seed + 101 }));
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
            <span className="eyebrow">Statistics Inference Workbench</span>
            <h2>Normal &amp; t-Test Lab</h2>
          </div>
          <div className="transport">
            <ExplanationButton
              title="Normal Distribution and t Values"
              eyebrow="Full Explanation"
              sections={[
                {
                  title: "What This Simulates",
                  body: (
                    <p>
                      This lab separates three ideas that are often confused: the population
                      distribution, one sample from that population, and the sampling distribution
                      made by repeating the sampling process many times.
                    </p>
                  ),
                },
                {
                  title: "Normal Distribution",
                  body: (
                    <p>
                      A normal distribution is a model for individual values. The mean{" "}
                      <InlineMath math={String.raw`\mu`} /> sets the center, and the standard deviation{" "}
                      <InlineMath math={String.raw`\sigma`} /> sets the spread. The bell curve is not the
                      test itself; it is the assumed shape of variation.
                    </p>
                  ),
                },
                {
                  title: "Sampling Distribution",
                  body: (
                    <p>
                      Every sample has its own mean. Repeated sample means form a new distribution.
                      Its spread is the standard error, approximately{" "}
                      <InlineMath math={String.raw`SE = s/\sqrt{n}`} />. Increasing sample size narrows this
                      distribution.
                    </p>
                  ),
                },
                {
                  title: "t Values",
                  body: (
                    <p>
                      A t value measures how far the sample mean is from a hypothesized null mean
                      in standard-error units:{" "}
                      <InlineMath math={String.raw`t = (\bar{x} - \mu_0) / SE`} />. Small samples use the t
                      distribution because the standard deviation is estimated from the sample.
                    </p>
                  ),
                },
                {
                  title: "What To Watch",
                  body: (
                    <p>
                      Increase <InlineMath math="n" /> and watch the sampling distribution tighten.
                      Move the null mean away from the population mean and watch the t statistic
                      grow. Change the population shape to see why inference is about the sampling
                      distribution, not just the raw population curve.
                    </p>
                  ),
                },
              ]}
            />
            <ExplanationButton
              title="Normal Distribution And t Values"
              eyebrow="History"
              buttonLabel="History"
              icon={History}
              sections={[
                {
                  title: "How The Idea Developed",
                  body: (
                    <>
                      <p>
                        The normal curve grew out of work by de Moivre, Laplace, and Gauss on
                        probability, errors, and averages. It became natural in astronomy and
                        measurement because many small independent errors tend to pile up into a
                        bell-shaped distribution.
                      </p>
                      <p>
                        Gauss connected the curve to least-squares estimation, while Laplace helped
                        develop the broader probability theory behind sums and averages. This is
                        why the normal distribution is not just a pretty curve: it is a model for
                        how repeated small influences accumulate and how averages stabilize.
                      </p>
                      <p>
                        Student's t distribution came later from William Sealy Gosset, who
                        published as Student in 1908 while working on small-sample quality problems
                        at Guinness. His problem was practical: real experiments often have too few
                        observations to know the population standard deviation, so the uncertainty
                        in the estimated spread has to be included.
                      </p>
                      <p>
                        Modern t values preserve that idea. They translate a sample mean's distance
                        from a hypothesized mean into standard-error units, then compare it to the
                        right reference distribution for the sample size. The simulator is meant to
                        make that chain visible: population, sample, sampling distribution, standard
                        error, and finally the t statistic.
                      </p>
                    </>
                  ),
                },
                {
                  title: "People, Devices, And Evolution",
                  body: <HistoryGallery items={samplingHistoryCards} />,
                },
                {
                  title: "More Reading",
                  body: (
                    <p>
                      Useful starting points are{" "}
                      <a href="https://en.wikipedia.org/wiki/Normal_distribution" target="_blank" rel="noreferrer">
                        Normal Distribution
                      </a>
                      ,{" "}
                      <a href="https://en.wikipedia.org/wiki/Student%27s_t-distribution" target="_blank" rel="noreferrer">
                        Student's t-Distribution
                      </a>
                      , and{" "}
                      <a href="https://en.wikipedia.org/wiki/William_Sealy_Gosset" target="_blank" rel="noreferrer">
                        William Sealy Gosset
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
            <button type="button" onClick={resample}>
              <Activity size={18} />
              <span>Resample</span>
            </button>
            <button type="button" onClick={reset}>
              <RotateCcw size={18} />
              <span>Reset</span>
            </button>
          </div>
        </header>

        <div className="visualBand">
          <SamplingLabScene inputs={inputs} state={state} paused={paused} />
          <div className="sceneReadout">
            <span>P-Value {format(state.latest.pValue, 3)}</span>
            <strong>T = {format(state.latest.statistic, 2)}</strong>
          </div>
        </div>

        <div className="dataRail">
          <Metric
            icon={Bell}
            label="Sample Mean"
            value={format(state.latest.mean)}
            tone="#7ff8ff"
          />
          <Metric
            icon={Sigma}
            label="Standard Error"
            value={format(state.latest.se)}
            tone="#f4c95d"
          />
          <Metric
            icon={Target}
            label="T Value"
            value={format(state.latest.statistic)}
            tone={Math.abs(state.latest.statistic) > state.rejectionCritical ? "#ff8a55" : "#a9ef78"}
          />
          <Metric
            icon={Brain}
            label="P-Value"
            value={format(state.latest.pValue, 3)}
            tone={state.latest.pValue < 0.05 ? "#ff8a55" : "#a9ef78"}
          />
        </div>

        <section className="analysisGrid">
          <MiniChart
            points={state.sampleMeans.map((mean, index) => ({ x: index, y: mean }))}
            activeX={state.sampleMeans.length - 1}
            activeY={state.latest.mean}
            label="Sample Means (Value) Over Repeated Samples"
            color="#a9ef78"
            xUnit="Sample #"
            yUnit="Value"
          />
          <MiniChart
            points={tSeries}
            activeX={state.latest.statistic}
            activeY={0.15}
            label={`T Distribution (Density), df = ${inputs.sampleSize - 1}`}
            color="#f4c95d"
            xUnit="t"
            yUnit="Density"
          />
          <div className="equationPanel">
            <div className="chartHeader">
              <span>Inference</span>
              <Atom size={16} aria-hidden="true" />
            </div>
            <BlockMath math={String.raw`SE = \frac{s}{\sqrt{n}}`} />
            <BlockMath math={String.raw`t = \frac{\bar{x} - \mu_0}{SE}`} />
            <BlockMath math={String.raw`CI = \bar{x} \pm t^* SE`} />
            <p>
              {format(inputs.confidence * 100, 0)}% CI:{" "}
              <strong>
                {format(state.latest.ciLow)} to {format(state.latest.ciHigh)}
              </strong>
            </p>
          </div>
        </section>
      </section>

      <aside className={`controlDock ${isFullscreen ? "immersiveControlDock" : ""}`}>
        <div className="dockTitle">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Parameters</span>
        </div>

        <div className="optionGrid twoCol">
          {shapes.map((shape) => (
            <button
              key={shape.id}
              type="button"
              className={inputs.shape === shape.id ? "selected" : ""}
              data-tooltip="Chooses the raw population shape being sampled. Watch how the population can be non-normal while the sample-means distribution becomes smoother as sample size grows."
              onClick={() => update("shape", shape.id)}
            >
              <strong>{shape.label}</strong>
              <small>{shape.detail}</small>
            </button>
          ))}
        </div>

        <ControlSlider
          label="Population Mean"
          value={inputs.mean}
          min={40}
          max={160}
          step={1}
          unit=""
          description="Sets the true population center. Moving it shifts the raw data and sample means; compare it with Null Mean to see the t value grow when the hypothesized center is wrong."
          onChange={(value) => update("mean", value)}
        />
        <ControlSlider
          label="Population SD"
          value={inputs.sd}
          min={4}
          max={35}
          step={1}
          unit=""
          description="Sets true population spread. Larger spread makes samples noisier, increases standard error, and makes it harder for the same mean difference to produce a large t value."
          onChange={(value) => update("sd", value)}
        />
        <ControlSlider
          label="Sample Size"
          value={inputs.sampleSize}
          min={2}
          max={120}
          step={1}
          unit=""
          description="Sets observations per sample. Larger samples narrow the sampling distribution, reduce standard error, increase degrees of freedom, and make t values more stable."
          onChange={(value) => update("sampleSize", value)}
        />
        <ControlSlider
          label="Repeated Samples"
          value={inputs.sampleCount}
          min={20}
          max={900}
          step={10}
          unit=""
          description="Sets how many repeated samples are drawn for the green sampling distribution. More repetitions make the pattern smoother; it does not change the underlying standard error formula."
          onChange={(value) => update("sampleCount", value)}
        />
        <ControlSlider
          label="Null Mean"
          value={inputs.nullMean}
          min={40}
          max={160}
          step={1}
          unit=""
          description="Sets the hypothesized mean being tested. Moving it away from the sample mean increases the t or z statistic because the numerator of the test statistic gets larger."
          onChange={(value) => update("nullMean", value)}
        />
        <ControlSlider
          label="Confidence"
          value={inputs.confidence}
          min={0.8}
          max={0.99}
          step={0.01}
          unit=""
          description="Sets confidence level for the interval. Higher confidence widens the interval by using a larger critical value; it does not change the sample mean or standard error."
          onChange={(value) => update("confidence", value)}
        />

        <div className="optionGrid">
          {tails.map((tail) => (
            <button
              key={tail.id}
              type="button"
              className={inputs.tailMode === tail.id ? "selected" : ""}
              data-tooltip="Chooses which tail area counts as evidence against the null. Two-tailed tests look for differences in either direction; one-tailed tests concentrate evidence on one side."
              onClick={() => update("tailMode", tail.id)}
            >
              <strong>{tail.label}</strong>
            </button>
          ))}
        </div>

        <div className="optionGrid twoCol">
          <button
            type="button"
            className={inputs.unknownSigma ? "selected" : ""}
            data-tooltip="Uses the t distribution because population sigma is unknown and standard error is estimated from the sample. This matters most for small sample sizes."
            onClick={() => update("unknownSigma", true)}
          >
            <strong>Use T</strong>
            <small>Unknown Sigma</small>
          </button>
          <button
            type="button"
            className={!inputs.unknownSigma ? "selected" : ""}
            data-tooltip="Uses the normal z model as if population sigma were known. Compare it with Use T to see how small-sample uncertainty changes critical values."
            onClick={() => update("unknownSigma", false)}
          >
            <strong>Use Z</strong>
            <small>Known Sigma</small>
          </button>
        </div>

        <div className="statusPanel">
          <span>Current Insight</span>
          <strong>{inputs.unknownSigma ? "T Statistic" : "Z Statistic"}</strong>
          <p>{state.insight}</p>
        </div>

        <div className="iconRow">
          <ChartNoAxesCombined size={18} aria-hidden="true" />
          <span>
            The green histogram is not the population. It is the distribution of sample means.
          </span>
        </div>
      </aside>
    </>
  );
}

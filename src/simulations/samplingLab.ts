export type PopulationShape = "normal" | "skewed" | "bimodal" | "uniform";
export type TailMode = "two" | "left" | "right";

export type SamplingInputs = {
  shape: PopulationShape;
  mean: number;
  sd: number;
  sampleSize: number;
  sampleCount: number;
  nullMean: number;
  confidence: number;
  tailMode: TailMode;
  unknownSigma: boolean;
  seed: number;
};

export type SampleSummary = {
  values: number[];
  mean: number;
  sd: number;
  se: number;
  statistic: number;
  pValue: number;
  ciLow: number;
  ciHigh: number;
};

export type SamplingState = {
  latest: SampleSummary;
  sampleMeans: number[];
  samplingMean: number;
  samplingSd: number;
  rejectionCritical: number;
  populationPoints: number[];
  insight: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalFromRandom(random: () => number) {
  const u1 = Math.max(random(), 1e-9);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function samplePopulation(
  inputs: SamplingInputs,
  random: () => number,
  count = inputs.sampleSize,
) {
  return Array.from({ length: count }, () => {
    if (inputs.shape === "normal") {
      return inputs.mean + normalFromRandom(random) * inputs.sd;
    }

    if (inputs.shape === "skewed") {
      const raw = Math.exp(normalFromRandom(random) * 0.55);
      return inputs.mean + (raw - 1.16) * inputs.sd * 0.95;
    }

    if (inputs.shape === "bimodal") {
      const side = random() < 0.5 ? -1 : 1;
      return inputs.mean + side * inputs.sd * 0.95 + normalFromRandom(random) * inputs.sd * 0.48;
    }

    return inputs.mean + (random() - 0.5) * inputs.sd * Math.sqrt(12);
  });
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function sampleSd(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function erf(x: number) {
  const sign = x >= 0 ? 1 : -1;
  const abs = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * abs);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-abs * abs));
  return sign * y;
}

export function normalCdf(x: number) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function normalPdf(x: number) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function tPdf(x: number, df: number) {
  const adjusted = Math.max(1, df);
  const tail = 1 + (x * x) / adjusted;
  return normalPdf(x) * Math.pow(tail, -(adjusted + 1) / 2 + 0.5);
}

export function tCriticalApprox(confidence: number, df: number) {
  const base = confidence >= 0.99 ? 2.576 : confidence >= 0.95 ? 1.96 : 1.645;
  return base + (base ** 3 + base) / (4 * Math.max(df, 1));
}

function pValueFromStatistic(statistic: number, df: number, tailMode: TailMode) {
  const zLike = statistic / Math.sqrt((df + statistic * statistic) / Math.max(df, 1));
  if (tailMode === "left") return clamp(normalCdf(zLike), 0, 1);
  if (tailMode === "right") return clamp(1 - normalCdf(zLike), 0, 1);
  return clamp(2 * (1 - normalCdf(Math.abs(zLike))), 0, 1);
}

function summarizeSample(inputs: SamplingInputs, values: number[]): SampleSummary {
  const mean = average(values);
  const sd = sampleSd(values);
  const denominator = inputs.unknownSigma ? sd : inputs.sd;
  const se = denominator / Math.sqrt(inputs.sampleSize);
  const statistic = (mean - inputs.nullMean) / Math.max(se, 1e-9);
  const df = inputs.sampleSize - 1;
  const critical = tCriticalApprox(inputs.confidence, df);
  return {
    values,
    mean,
    sd,
    se,
    statistic,
    pValue: pValueFromStatistic(statistic, df, inputs.tailMode),
    ciLow: mean - critical * se,
    ciHigh: mean + critical * se,
  };
}

export function calculateSamplingState(inputs: SamplingInputs): SamplingState {
  const random = mulberry32(inputs.seed);
  const safeInputs = {
    ...inputs,
    sd: Math.max(inputs.sd, 0.1),
    sampleSize: Math.round(clamp(inputs.sampleSize, 2, 200)),
    sampleCount: Math.round(clamp(inputs.sampleCount, 10, 1200)),
  };
  const populationPoints = samplePopulation(safeInputs, random, 900);
  const summaries = Array.from({ length: safeInputs.sampleCount }, () =>
    summarizeSample(safeInputs, samplePopulation(safeInputs, random)),
  );
  const latest = summaries[summaries.length - 1];
  const sampleMeans = summaries.map((summary) => summary.mean);
  const samplingMean = average(sampleMeans);
  const samplingSd = sampleSd(sampleMeans);
  const df = safeInputs.sampleSize - 1;
  const rejectionCritical = tCriticalApprox(safeInputs.confidence, df);

  let insight = "Sample means form their own distribution, narrower than individual values.";
  if (safeInputs.sampleSize < 10) {
    insight = "Small samples bounce around; t uses wider tails because the standard error is uncertain.";
  } else if (safeInputs.sampleSize >= 50) {
    insight = "Larger samples shrink standard error, so the sample mean lands closer to the population mean.";
  }
  if (latest.pValue < 0.05) {
    insight = "This sample mean would be unusual if the null mean were true.";
  }

  return {
    latest,
    sampleMeans,
    samplingMean,
    samplingSd,
    rejectionCritical,
    populationPoints,
    insight,
  };
}

export function tCurveSeries(df: number) {
  return Array.from({ length: 140 }, (_, index) => {
    const x = -4 + (index / 139) * 8;
    return { x, y: tPdf(x, df) };
  });
}

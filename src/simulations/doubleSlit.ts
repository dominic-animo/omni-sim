export type DoubleSlitInputs = {
  wavelengthNm: number;
  slitSeparationUm: number;
  slitWidthUm: number;
  screenDistanceM: number;
  intensity: number;
  coherence: number;
  detectorYmm: number;
  simulationSpeed: number;
};

export type DoubleSlitState = {
  fringeSpacingMm: number;
  centralEnvelopeWidthMm: number;
  detectorIntensity: number;
  phaseDifferenceCycles: number;
  contrast: number;
  color: string;
};

function sinc(value: number) {
  if (Math.abs(value) < 1e-6) return 1;
  return Math.sin(value) / value;
}

export function wavelengthToColor(wavelengthNm: number): string {
  if (wavelengthNm < 420) return "#787cff";
  if (wavelengthNm < 480) return "#46b8ff";
  if (wavelengthNm < 540) return "#62e6cf";
  if (wavelengthNm < 585) return "#d8ef6f";
  if (wavelengthNm < 635) return "#ffac52";
  return "#ff625d";
}

export function intensityAtY(inputs: DoubleSlitInputs, yMm: number) {
  const lambda = inputs.wavelengthNm * 1e-9;
  const separation = inputs.slitSeparationUm * 1e-6;
  const slitWidth = inputs.slitWidthUm * 1e-6;
  const y = yMm * 1e-3;
  const sinTheta = y / Math.sqrt(inputs.screenDistanceM ** 2 + y ** 2);
  const interference = Math.cos((Math.PI * separation * sinTheta) / lambda) ** 2;
  const diffraction = sinc((Math.PI * slitWidth * sinTheta) / lambda) ** 2;
  const coherentPattern =
    diffraction * (inputs.coherence * interference + (1 - inputs.coherence) * 0.5);
  return Math.max(0, Math.min(1, inputs.intensity * coherentPattern));
}

export function calculateDoubleSlitState(
  inputs: DoubleSlitInputs,
): DoubleSlitState {
  const lambda = inputs.wavelengthNm * 1e-9;
  const separation = inputs.slitSeparationUm * 1e-6;
  const slitWidth = inputs.slitWidthUm * 1e-6;
  const fringeSpacingMm = (lambda * inputs.screenDistanceM * 1000) / separation;
  const centralEnvelopeWidthMm = (2 * lambda * inputs.screenDistanceM * 1000) / slitWidth;
  const y = inputs.detectorYmm * 1e-3;
  const sinTheta = y / Math.sqrt(inputs.screenDistanceM ** 2 + y ** 2);
  const phaseDifferenceCycles = (separation * sinTheta) / lambda;

  return {
    fringeSpacingMm,
    centralEnvelopeWidthMm,
    detectorIntensity: intensityAtY(inputs, inputs.detectorYmm),
    phaseDifferenceCycles,
    contrast: inputs.coherence,
    color: wavelengthToColor(inputs.wavelengthNm),
  };
}

export function screenProfile(inputs: DoubleSlitInputs) {
  return Array.from({ length: 160 }, (_, index) => {
    const yMm = -25 + (index / 159) * 50;
    return {
      x: yMm,
      y: intensityAtY(inputs, yMm),
    };
  });
}

export function fringeSpacingSeries(inputs: DoubleSlitInputs) {
  return Array.from({ length: 90 }, (_, index) => {
    const wavelengthNm = 380 + (index / 89) * 340;
    const lambda = wavelengthNm * 1e-9;
    const separation = inputs.slitSeparationUm * 1e-6;
    return {
      x: wavelengthNm,
      y: (lambda * inputs.screenDistanceM * 1000) / separation,
    };
  });
}

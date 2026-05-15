export type MetalPreset = {
  name: string;
  symbol: string;
  workFunction: number;
  hue: string;
};

export type PhotoelectricInputs = {
  wavelengthNm: number;
  intensity: number;
  workFunction: number;
  retardingVoltage: number;
  simulationSpeed: number;
  quantumYield: number;
  contactPotential: number;
  collectorSpacingCm: number;
  beamFocus: number;
  surfaceTemperatureK: number;
};

export type PhotoelectricState = {
  photonEnergyEv: number;
  frequencyThz: number;
  thresholdWavelengthNm: number;
  effectiveWorkFunctionEv: number;
  maxKineticEnergyEv: number;
  stoppingVoltage: number;
  emission: boolean;
  relativeCurrent: number;
  saturationCurrentUa: number;
  collectorCurrentUa: number;
  fieldStrengthVm: number;
  electronVelocityMs: number;
  deBrogliePm: number;
  thresholdMarginEv: number;
  thermalTail: number;
  electronRate: number;
  collectionFraction: number;
  voltageGate: number;
  stoppingRatio: number;
  intensity: number;
  beamFocus: number;
  color: string;
};

export const PLANCK_EV_S = 4.135667696e-15;
export const SPEED_OF_LIGHT_M_S = 299_792_458;
const HC_EV_NM = 1239.841984;
const ELECTRON_CHARGE_C = 1.602176634e-19;
const ELECTRON_MASS_KG = 9.1093837015e-31;
const PLANCK_J_S = 6.62607015e-34;

export const metalPresets: MetalPreset[] = [
  { name: "Cesium", symbol: "Cs", workFunction: 2.14, hue: "#f4c95d" },
  { name: "Potassium", symbol: "K", workFunction: 2.3, hue: "#b2d76f" },
  { name: "Sodium", symbol: "Na", workFunction: 2.75, hue: "#62d8c8" },
  { name: "Zinc", symbol: "Zn", workFunction: 4.31, hue: "#a6b7ff" },
  { name: "Copper", symbol: "Cu", workFunction: 4.7, hue: "#e4845e" },
  { name: "Platinum", symbol: "Pt", workFunction: 6.35, hue: "#d8d8e2" },
];

export function wavelengthToColor(wavelengthNm: number): string {
  if (wavelengthNm < 380) return "#9b7cff";
  if (wavelengthNm < 450) return "#5468ff";
  if (wavelengthNm < 495) return "#39bfff";
  if (wavelengthNm < 570) return "#52e39f";
  if (wavelengthNm < 590) return "#f7e35b";
  if (wavelengthNm < 620) return "#ff9e4a";
  return "#ff5d52";
}

export function calculatePhotoelectricState(
  inputs: PhotoelectricInputs,
): PhotoelectricState {
  const photonEnergyEv = HC_EV_NM / inputs.wavelengthNm;
  const frequencyThz =
    (SPEED_OF_LIGHT_M_S / (inputs.wavelengthNm * 1e-9)) / 1e12;
  const effectiveWorkFunctionEv = Math.max(0.1, inputs.workFunction + inputs.contactPotential);
  const thresholdWavelengthNm = HC_EV_NM / effectiveWorkFunctionEv;
  const thresholdMarginEv = photonEnergyEv - effectiveWorkFunctionEv;
  const thermalTail = Math.max(
    0,
    Math.min(0.08, ((inputs.surfaceTemperatureK - 300) / 900) * 0.08),
  );
  const maxKineticEnergyEv = Math.max(0, thresholdMarginEv);
  const emission = maxKineticEnergyEv > 0 || thermalTail > 0.015;
  const stoppingVoltage = maxKineticEnergyEv;
  const voltageGate =
    inputs.retardingVoltage <= 0
      ? 1
      : Math.max(0, 1 - inputs.retardingVoltage / Math.max(stoppingVoltage, 0.01));
  const stoppingRatio =
    inputs.retardingVoltage <= 0
      ? 0
      : Math.max(0, Math.min(1.4, inputs.retardingVoltage / Math.max(stoppingVoltage, 0.01)));
  const focusGain = 0.55 + inputs.beamFocus * 0.85;
  const emissionGate = maxKineticEnergyEv > 0 ? 1 : thermalTail;
  const relativeCurrent =
    emission ? inputs.intensity * inputs.quantumYield * focusGain * emissionGate * voltageGate : 0;
  const incidentEmissionRate = emission
    ? Math.min(1, inputs.intensity * inputs.quantumYield * focusGain + thermalTail)
    : 0;
  const saturationCurrentUa = inputs.intensity * inputs.quantumYield * focusGain * 180;
  const collectorCurrentUa = relativeCurrent * 180;
  const fieldStrengthVm =
    inputs.retardingVoltage / Math.max(inputs.collectorSpacingCm / 100, 0.001);
  const electronVelocityMs =
    maxKineticEnergyEv > 0
      ? Math.sqrt((2 * maxKineticEnergyEv * ELECTRON_CHARGE_C) / ELECTRON_MASS_KG)
      : 0;
  const deBrogliePm =
    electronVelocityMs > 0
      ? (PLANCK_J_S / (ELECTRON_MASS_KG * electronVelocityMs)) * 1e12
      : 0;

  return {
    photonEnergyEv,
    frequencyThz,
    thresholdWavelengthNm,
    effectiveWorkFunctionEv,
    maxKineticEnergyEv,
    stoppingVoltage,
    emission,
    relativeCurrent,
    saturationCurrentUa,
    collectorCurrentUa,
    fieldStrengthVm,
    electronVelocityMs,
    deBrogliePm,
    thresholdMarginEv,
    thermalTail,
    electronRate: incidentEmissionRate,
    collectionFraction: incidentEmissionRate > 0 ? Math.max(0, Math.min(1, voltageGate)) : 0,
    voltageGate,
    stoppingRatio,
    intensity: inputs.intensity,
    beamFocus: inputs.beamFocus,
    color: wavelengthToColor(inputs.wavelengthNm),
  };
}

export function kineticEnergySeries(workFunction: number, contactPotential = 0) {
  const effectiveWorkFunctionEv = Math.max(0.1, workFunction + contactPotential);
  return Array.from({ length: 80 }, (_, index) => {
    const wavelengthNm = 180 + index * 7;
    const energy = HC_EV_NM / wavelengthNm;
    return {
      x: SPEED_OF_LIGHT_M_S / (wavelengthNm * 1e-9) / 1e12,
      y: Math.max(0, energy - effectiveWorkFunctionEv),
    };
  }).reverse();
}

export function currentVoltageSeries(inputs: PhotoelectricInputs) {
  return Array.from({ length: 80 }, (_, index) => {
    const voltage = -3 + index * 0.1;
    const state = calculatePhotoelectricState({
      ...inputs,
      retardingVoltage: voltage,
    });
    return {
      x: voltage,
      y: state.collectorCurrentUa,
    };
  });
}

export function wavelengthCurrentSeries(inputs: PhotoelectricInputs) {
  return Array.from({ length: 100 }, (_, index) => {
    const wavelengthNm = 190 + index * 5.8;
    const state = calculatePhotoelectricState({
      ...inputs,
      wavelengthNm,
    });
    return {
      x: wavelengthNm,
      y: state.collectorCurrentUa,
    };
  });
}

export function energySpreadSeries(state: PhotoelectricState) {
  return Array.from({ length: 90 }, (_, index) => {
    const energy = (index / 89) * Math.max(0.12, state.maxKineticEnergyEv * 1.15);
    const width = Math.max(0.05, state.maxKineticEnergyEv * 0.18 + state.thermalTail * 0.8);
    const center = Math.max(0.04, state.maxKineticEnergyEv * 0.72);
    return {
      x: energy,
      y:
        state.maxKineticEnergyEv > 0
          ? Math.exp(-((energy - center) ** 2) / (2 * width ** 2)) *
            Math.max(state.relativeCurrent, 0.01)
          : state.thermalTail * Math.exp(-energy * 14),
    };
  });
}

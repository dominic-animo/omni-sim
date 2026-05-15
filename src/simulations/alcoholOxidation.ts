export type SubstrateClass = "primary" | "secondary";
export type OxidantPresetId = "pcc" | "dess-martin" | "jones" | "permanganate";

export type OxidantPreset = {
  id: OxidantPresetId;
  name: string;
  shortName: string;
  strength: number;
  aqueous: number;
  tone: string;
};

export type AlcoholOxidationInputs = {
  substrateClass: SubstrateClass;
  oxidant: OxidantPresetId;
  oxidantStrength: number;
  waterFraction: number;
  acidity: number;
  temperatureC: number;
  timeMinutes: number;
  cleavageStress: number;
  simulationSpeed: number;
};

export type AlcoholOxidationState = {
  alcohol: number;
  aldehyde: number;
  ketone: number;
  carboxylicAcid: number;
  cleavageAcid: number;
  conversion: number;
  selectivity: number;
  mainProduct: string;
  routeNote: string;
  redoxUnits: number;
  color: string;
};

export const oxidantPresets: OxidantPreset[] = [
  {
    id: "pcc",
    name: "Pyridinium chlorochromate",
    shortName: "PCC",
    strength: 0.52,
    aqueous: 0.12,
    tone: "#f4c95d",
  },
  {
    id: "dess-martin",
    name: "Dess-Martin periodinane",
    shortName: "DMP",
    strength: 0.46,
    aqueous: 0.04,
    tone: "#c6f36d",
  },
  {
    id: "jones",
    name: "Jones reagent",
    shortName: "Jones",
    strength: 0.84,
    aqueous: 0.88,
    tone: "#ff8a55",
  },
  {
    id: "permanganate",
    name: "Potassium permanganate",
    shortName: "KMnO4",
    strength: 0.96,
    aqueous: 0.82,
    tone: "#a98cff",
  },
];

export function getOxidantPreset(id: OxidantPresetId) {
  return oxidantPresets.find((preset) => preset.id === id) ?? oxidantPresets[0];
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function progressCurve(force: number, timeMinutes: number) {
  return clamp01(1 - Math.exp(-force * Math.max(0, timeMinutes) / 42));
}

export function calculateAlcoholOxidationState(
  inputs: AlcoholOxidationInputs,
): AlcoholOxidationState {
  const preset = getOxidantPreset(inputs.oxidant);
  const heatFactor = 0.72 + Math.max(0, inputs.temperatureC - 10) / 95;
  const aqueousDrive = clamp01((inputs.waterFraction + preset.aqueous) / 2);
  const acidDrive = clamp01(inputs.acidity);
  const force =
    (0.18 + inputs.oxidantStrength * 0.82) *
    (0.35 + preset.strength * 0.75) *
    heatFactor *
    (0.72 + acidDrive * 0.38);
  const conversion = progressCurve(force, inputs.timeMinutes);

  if (inputs.substrateClass === "secondary") {
    const ketone = conversion * (1 - inputs.cleavageStress * 0.2);
    const cleavageGate =
      inputs.cleavageStress *
      preset.strength *
      aqueousDrive *
      acidDrive *
      clamp01((inputs.temperatureC - 45) / 75);
    const cleavageAcid = conversion * clamp01(cleavageGate) * 0.42;
    const alcohol = clamp01(1 - ketone - cleavageAcid);
    const selectivity = ketone / Math.max(conversion, 0.001);

    return {
      alcohol,
      aldehyde: 0,
      ketone,
      carboxylicAcid: 0,
      cleavageAcid,
      conversion,
      selectivity,
      mainProduct: "Ketone",
      routeNote:
        cleavageAcid > 0.06
          ? "Acid appears only as harsh oxidative cleavage fragments, not direct secondary-alcohol oxidation."
          : "Secondary alcohols oxidize to ketones; direct carboxylic acid formation is not the normal pathway.",
      redoxUnits: conversion * 2 + cleavageAcid * 5,
      color: cleavageAcid > 0.06 ? "#ff8a55" : "#7ff8ff",
    };
  }

  const aldehydeStop = clamp01((1 - aqueousDrive) * (1 - acidDrive * 0.55));
  const acidDriveTotal = clamp01(aqueousDrive * 0.62 + acidDrive * 0.38);
  const acidFraction = conversion * acidDriveTotal * (0.28 + preset.strength * 0.72);
  const aldehyde = conversion * aldehydeStop * (1 - acidFraction * 0.45);
  const carboxylicAcid = clamp01(acidFraction);
  const alcohol = clamp01(1 - aldehyde - carboxylicAcid);
  const selectivity = carboxylicAcid / Math.max(conversion, 0.001);

  return {
    alcohol,
    aldehyde,
    ketone: 0,
    carboxylicAcid,
    cleavageAcid: 0,
    conversion,
    selectivity,
    mainProduct: carboxylicAcid > aldehyde ? "Carboxylic acid" : "Aldehyde",
    routeNote:
      carboxylicAcid > aldehyde
        ? "Primary alcohol oxidation proceeds through aldehyde hydrate toward carboxylic acid."
        : "Dry or selective oxidants favor aldehyde before over-oxidation.",
    redoxUnits: aldehyde * 2 + carboxylicAcid * 4,
    color: carboxylicAcid > aldehyde ? "#ff8a55" : "#f4c95d",
  };
}

export function reactionProgressSeries(inputs: AlcoholOxidationInputs) {
  return Array.from({ length: 90 }, (_, index) => {
    const timeMinutes = (index / 89) * 180;
    const state = calculateAlcoholOxidationState({ ...inputs, timeMinutes });
    return {
      x: timeMinutes,
      y:
        inputs.substrateClass === "secondary"
          ? state.ketone + state.cleavageAcid
          : state.aldehyde + state.carboxylicAcid,
    };
  });
}

export function acidYieldSeries(inputs: AlcoholOxidationInputs) {
  return Array.from({ length: 90 }, (_, index) => {
    const waterFraction = index / 89;
    const state = calculateAlcoholOxidationState({ ...inputs, waterFraction });
    return {
      x: waterFraction,
      y:
        inputs.substrateClass === "secondary"
          ? state.cleavageAcid
          : state.carboxylicAcid,
    };
  });
}

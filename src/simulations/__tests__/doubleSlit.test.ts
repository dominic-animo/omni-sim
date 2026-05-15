import { describe, expect, it } from 'vitest';
import { calculateDoubleSlitState, intensityAtY } from '../doubleSlit';

const baseInputs = {
  wavelengthNm: 550,
  slitSeparationUm: 200,
  slitWidthUm: 60,
  screenDistanceM: 1.2,
  intensity: 0.8,
  coherence: 1,
  detectorYmm: 0,
  simulationSpeed: 1,
};

describe('double slit simulation', () => {
  it('has maximal central intensity at y=0 for coherent light', () => {
    const center = intensityAtY(baseInputs, 0);
    const offCenter = intensityAtY(baseInputs, 1.5);
    expect(center).toBeGreaterThan(offCenter);
  });

  it('computes positive spacing and envelope width', () => {
    const state = calculateDoubleSlitState(baseInputs);
    expect(state.fringeSpacingMm).toBeGreaterThan(0);
    expect(state.centralEnvelopeWidthMm).toBeGreaterThan(0);
  });
});

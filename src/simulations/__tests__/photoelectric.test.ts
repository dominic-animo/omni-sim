import { describe, expect, it } from 'vitest';
import { calculatePhotoelectricState, kineticEnergySeries } from '../photoelectric';

describe('photoelectric simulation', () => {
  it('shows no emission below threshold with room-temperature surface', () => {
    const state = calculatePhotoelectricState({
      wavelengthNm: 700,
      intensity: 1,
      workFunction: 4.7,
      retardingVoltage: 0,
      simulationSpeed: 1,
      quantumYield: 0.4,
      contactPotential: 0,
      collectorSpacingCm: 1,
      beamFocus: 0.5,
      surfaceTemperatureK: 300,
    });

    expect(state.maxKineticEnergyEv).toBe(0);
    expect(state.emission).toBe(false);
    expect(state.collectorCurrentUa).toBe(0);
  });

  it('kinetic energy series is non-negative and sorted by frequency', () => {
    const series = kineticEnergySeries(2.3);
    expect(series.length).toBe(80);
    expect(series[0].x).toBeLessThan(series[79].x);
    expect(Math.min(...series.map((p) => p.y))).toBeGreaterThanOrEqual(0);
  });
});

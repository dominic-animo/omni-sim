import { describe, expect, it } from 'vitest';
import { calculateAlcoholOxidationState } from '../alcoholOxidation';

describe('alcohol oxidation simulation', () => {
  it('keeps species fractions bounded between 0 and 1', () => {
    const state = calculateAlcoholOxidationState({
      substrateClass: 'primary',
      oxidant: 'jones',
      oxidantStrength: 0.9,
      waterFraction: 0.8,
      acidity: 0.8,
      temperatureC: 50,
      timeMinutes: 120,
      cleavageStress: 0.1,
      simulationSpeed: 1,
    });

    for (const value of [state.alcohol, state.aldehyde, state.carboxylicAcid]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

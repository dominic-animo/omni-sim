import { describe, expect, it } from 'vitest';
import { calculateSamplingState } from '../samplingLab';

describe('sampling lab simulation', () => {
  it('is deterministic for the same seed', () => {
    const inputs = {
      shape: 'normal' as const,
      mean: 100,
      sd: 15,
      sampleSize: 25,
      sampleCount: 60,
      nullMean: 100,
      confidence: 0.95,
      tailMode: 'two' as const,
      unknownSigma: true,
      seed: 1234,
    };

    const a = calculateSamplingState(inputs);
    const b = calculateSamplingState(inputs);

    expect(a.latest.mean).toBeCloseTo(b.latest.mean, 12);
    expect(a.samplingMean).toBeCloseTo(b.samplingMean, 12);
  });
});

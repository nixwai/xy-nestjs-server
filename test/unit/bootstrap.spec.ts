import { describe, expect, it } from 'vitest';
import { resolveCorsOrigin } from '../../src/bootstrap.js';

describe('resolveCorsOrigin', () => {
  it('disables CORS when no origin is configured', () => {
    expect(resolveCorsOrigin([])).toBe(false);
  });

  it('returns a copied allowlist when origins are configured', () => {
    const origins = ['http://localhost:5173'];
    const result = resolveCorsOrigin(origins);

    expect(result).toEqual(origins);
    expect(result).not.toBe(origins);
  });
});

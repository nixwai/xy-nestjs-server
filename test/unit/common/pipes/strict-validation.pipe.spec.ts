import { describe, expect, it } from 'vitest';
import { createStrictValidationPipe } from '../../../../src/common/pipes/strict-validation.pipe.js';

describe('createStrictValidationPipe', () => {
  it('creates a validation pipe for strict request boundaries', () => {
    expect(createStrictValidationPipe()).toBeDefined();
  });
});

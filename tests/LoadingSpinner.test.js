import { describe, it, expect } from 'vitest';
import { LoadingSpinner } from '../src/shared/components/ui/LoadingSpinner.js';

describe('LoadingSpinner', () => {
  it('può essere istanziato', () => {
    const spinner = new LoadingSpinner();
    expect(spinner).toBeInstanceOf(LoadingSpinner);
  });
});

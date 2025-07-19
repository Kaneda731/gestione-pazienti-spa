import { describe, it, expect } from 'vitest';
import { EmptyState } from '../src/shared/components/ui/EmptyState.js';

describe('EmptyState', () => {
  it('può essere istanziato', () => {
    const empty = new EmptyState();
    expect(empty).toBeInstanceOf(EmptyState);
  });
});

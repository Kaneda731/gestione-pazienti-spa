import { describe, it, expect } from 'vitest';
import { EmptyState } from '@/shared/components/ui/EmptyState.js';

describe('EmptyState', () => {
  it('può essere istanziato', () => {
    const empty = new EmptyState();
    expect(empty).toBeInstanceOf(EmptyState);
  });
});

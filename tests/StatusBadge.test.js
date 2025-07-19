import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../src/shared/components/ui/StatusBadge.js';

describe('StatusBadge', () => {
  it('può essere istanziato', () => {
    const badge = new StatusBadge({ status: 'active' });
    expect(badge).toBeInstanceOf(StatusBadge);
  });
});

import { describe, it, expect } from 'vitest';
import { ActionButtons } from '../src/shared/components/ui/ActionButtons.js';

describe('ActionButtons', () => {
  it('può essere istanziato', () => {
    const btns = new ActionButtons({});
    expect(btns).toBeInstanceOf(ActionButtons);
  });
});

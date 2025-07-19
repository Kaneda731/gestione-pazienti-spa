import { describe, it, expect } from 'vitest';
import { uiStateService } from '../src/core/services/uiStateService.js';

describe('uiStateService', () => {
  it('ha metodi principali definiti', () => {
    expect(uiStateService).toHaveProperty('showPageLoading');
    expect(uiStateService).toHaveProperty('hidePageLoading');
    expect(uiStateService).toHaveProperty('generateId');
    expect(uiStateService).toHaveProperty('withLoading');
    expect(uiStateService).toHaveProperty('renderConditional');
  });

  it('generateId genera id univoci', () => {
    const id1 = uiStateService.generateId();
    const id2 = uiStateService.generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toContain('loading_');
  });
});

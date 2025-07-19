import { describe, it, expect } from 'vitest';
import { showDeleteConfirmModal, showConfirmModal } from '../src/shared/services/modalService.js';

describe('modalService', () => {
  it('showDeleteConfirmModal è definita', () => {
    expect(showDeleteConfirmModal).toBeInstanceOf(Function);
  });
  it('showConfirmModal è definita', () => {
    expect(showConfirmModal).toBeInstanceOf(Function);
  });
});

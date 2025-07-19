import { describe, it, expect } from 'vitest';
import { PatientCard } from '../src/shared/components/ui/PatientCard.js';

describe('PatientCard', () => {
  it('può essere istanziato', () => {
    const card = new PatientCard({ nome: 'Mario' });
    expect(card).toBeInstanceOf(PatientCard);
  });
});

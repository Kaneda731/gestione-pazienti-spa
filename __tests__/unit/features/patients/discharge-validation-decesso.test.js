import { describe, it, expect } from 'vitest';
import { validateDischargeData } from '../../../../src/features/patients/services/patientValidation.js';

// Test mirati per il caso 'decesso'
describe('validateDischargeData - decesso', () => {
  it("accetta 'decesso' senza codice_dimissione", () => {
    const data = {
      data_dimissione: '2024-02-01',
      tipo_dimissione: 'decesso'
    };
    expect(() => validateDischargeData(data)).not.toThrow();
  });

  it("rifiuta 'decesso' senza data_dimissione", () => {
    const data = {
      tipo_dimissione: 'decesso'
    };
    expect(() => validateDischargeData(data))
      .toThrow('Il campo data_dimissione è obbligatorio');
  });

  it("rifiuta 'decesso' con data futura", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const data = {
      data_dimissione: futureDate.toISOString().split('T')[0],
      tipo_dimissione: 'decesso'
    };
    expect(() => validateDischargeData(data))
      .toThrow('La data di dimissione non può essere nel futuro');
  });

  it('rifiuta tipo_dimissione invalido', () => {
    const data = {
      data_dimissione: '2024-02-01',
      tipo_dimissione: 'invalid_type'
    };
    expect(() => validateDischargeData(data))
      .toThrow('Tipo dimissione non valido');
  });
});

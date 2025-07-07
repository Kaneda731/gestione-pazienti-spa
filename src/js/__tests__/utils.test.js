// src/js/__tests__/utils.test.js
import { describe, it, expect, vi } from 'vitest';
import { convertToCSV } from '../utils';

// Diciamo a Vitest di usare il nostro mock per supabase.js
vi.mock('../supabase.js');

describe('convertToCSV', () => {

  it('dovrebbe restituire una stringa vuota se i dati sono nulli o vuoti', () => {
    expect(convertToCSV(null)).toBe('');
    expect(convertToCSV([])).toBe('');
  });

  it('dovrebbe convertire correttamente un array di oggetti semplici', () => {
    const data = [
      {
        cognome: 'Rossi',
        nome: 'Mario',
        data_ricovero: '2023-01-10T00:00:00',
        data_dimissione: null,
        reparto_appartenenza: 'Cardiologia',
        reparto_provenienza: 'Pronto Soccorso',
        diagnosi: 'Infarto',
        livello_assistenza: 'Alto',
      },
    ];

    const result = convertToCSV(data);
    expect(result).toContain('Cognome,Nome,Data Ricovero');
    expect(result).toContain('Rossi,Mario');
    expect(result).toContain('Cardiologia,Pronto Soccorso,Infarto,Alto,Attivo');
  });

  it('dovrebbe gestire correttamente i pazienti dimessi', () => {
    const data = [
      {
        cognome: 'Verdi',
        nome: 'Anna',
        data_ricovero: '2023-02-15T00:00:00',
        data_dimissione: '2023-02-28T00:00:00',
        reparto_appartenenza: 'Neurologia',
        reparto_provenienza: 'Ambulatorio',
        diagnosi: 'Ictus',
        livello_assistenza: 'Medio',
      },
    ];

    const result = convertToCSV(data);
    expect(result).toContain('Verdi,Anna');
    expect(result).toContain('Neurologia,Ambulatorio,Ictus,Medio,Dimesso');
  });

  it('dovrebbe effettuare l-escape di campi contenenti virgole', () => {
    const data = [
      {
        cognome: 'Bianchi',
        nome: 'Luca',
        diagnosi: 'Frattura, scomposta',
      },
    ];
    
    const result = convertToCSV(data);
    const rows = result.split('\r\n');
    
    expect(rows[1]).toContain('"Frattura, scomposta"');
  });

  it('dovrebbe effettuare l-escape di campi contenenti virgolette', () => {
    const data = [
      {
        cognome: 'Neri',
        nome: 'Paolo',
        diagnosi: 'Paziente "difficile"',
      },
    ];

    const result = convertToCSV(data);
    const rows = result.split('\r\n');

    expect(rows[1]).toContain('"Paziente ""difficile"""');
  });
  
  it('dovrebbe gestire correttamente valori null o undefined nei campi', () => {
    const data = [
      {
        cognome: 'Gialli',
        nome: undefined,
        diagnosi: null,
      },
    ];

    const result = convertToCSV(data);
    const rows = result.split('\r\n');
    const values = rows[1].split(',');

    // Cognome, Nome, Data Ricovero, Data Dimissione...
    expect(values[0]).toBe('Gialli');
    expect(values[1]).toBe(''); // undefined diventa stringa vuota
    expect(values[6]).toBe(''); // null diventa stringa vuota
  });

});

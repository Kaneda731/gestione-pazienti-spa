/**
 * Test specifici per la logica di business dei pazienti
 * Focus su validazione e logica, non su integrazione DB
 */

import { describe, it, expect } from 'vitest';

// Test diretto della logica di validazione
describe('Patient Validation Logic', () => {
  describe('Patient Data Validation', () => {
    it('should validate required fields', () => {
      const validatePatientData = (data) => {
        const required = [
          "nome",
          "cognome", 
          "data_nascita",
          "data_ricovero",
          "diagnosi",
          "reparto_appartenenza",
        ];

        for (const field of required) {
          if (!data[field] || data[field].toString().trim() === "") {
            throw new Error(`Il campo ${field} è obbligatorio`);
          }
        }

        // Validazione date
        if (data.data_nascita) {
          const nascitaDate = new Date(data.data_nascita);
          const oggi = new Date();
          if (nascitaDate > oggi) {
            throw new Error("La data di nascita non può essere nel futuro");
          }
        }

        if (data.data_ricovero) {
          const ricoveroDate = new Date(data.data_ricovero);
          if (ricoveroDate > new Date()) {
            throw new Error("La data di ricovero non può essere nel futuro");
          }
        }

        if (data.data_dimissione) {
          const dimissioneDate = new Date(data.data_dimissione);
          const ricoveroDate = new Date(data.data_ricovero);
          if (dimissioneDate < ricoveroDate) {
            throw new Error("La data di dimissione non può essere precedente alla data di ricovero");
          }
        }

        if (data.codice_rad && data.codice_rad.trim() !== "" && data.codice_rad.length > 11) {
          throw new Error("Il codice RAD non può superare i 11 caratteri");
        }
      };

      const validData = {
        nome: 'Mario',
        cognome: 'Rossi',
        data_nascita: '1990-01-01',
        data_ricovero: '2024-01-01',
        diagnosi: 'Infarto',
        reparto_appartenenza: 'Cardiologia'
      };

      expect(() => validatePatientData(validData)).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const validatePatientData = (data) => {
        const required = ["nome", "cognome", "data_nascita", "data_ricovero", "diagnosi", "reparto_appartenenza"];
        for (const field of required) {
          if (!data[field] || data[field].toString().trim() === "") {
            throw new Error(`Il campo ${field} è obbligatorio`);
          }
        }
      };

      const invalidData = {
        nome: 'Mario',
        cognome: '',
        data_nascita: '1990-01-01',
        data_ricovero: '2024-01-01',
        diagnosi: 'Infarto',
        reparto_appartenenza: 'Cardiologia'
      };

      expect(() => validatePatientData(invalidData)).toThrow('Il campo cognome è obbligatorio');
    });

    it('should validate birth date is not in future', () => {
      const validateDate = (dateStr) => {
        const date = new Date(dateStr);
        if (date > new Date()) {
          throw new Error('La data non può essere nel futuro');
        }
      };

      expect(() => validateDate('1990-01-01')).not.toThrow();
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(() => validateDate(futureDate.toISOString().split('T')[0])).toThrow('La data non può essere nel futuro');
    });
  });

  describe('CSV Generation Logic', () => {
    it('should generate correct CSV format', () => {
      const generateCSV = (data) => {
        const headers = [
          "Nome", "Cognome", "Data Nascita", "Data Ricovero", "Data Dimissione",
          "Diagnosi", "Reparto Appartenenza", "Reparto Provenienza", "Livello Assistenza",
          "Codice RAD", "Infetto"
        ];

        const rows = data.map((p) => [
          p.nome || "",
          p.cognome || "",
          p.data_nascita ? new Date(p.data_nascita).toLocaleDateString() : "",
          p.data_ricovero ? new Date(p.data_ricovero).toLocaleDateString() : "",
          p.data_dimissione ? new Date(p.data_dimissione).toLocaleDateString() : "",
          p.diagnosi || "",
          p.reparto_appartenenza || "",
          p.reparto_provenienza || "",
          p.livello_assistenza || "",
          p.codice_rad || "",
          p.infetto ? "Sì" : "No"
        ]);

        return [headers, ...rows]
          .map((row) =>
            row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
          )
          .join("\n");
      };

      const mockData = [
        {
          nome: 'Mario',
          cognome: 'Rossi',
          data_nascita: '1990-01-01',
          data_ricovero: '2024-01-01',
          data_dimissione: null,
          diagnosi: 'Infarto',
          reparto_appartenenza: 'Cardiologia',
          reparto_provenienza: 'Pronto Soccorso',
          livello_assistenza: 'Alta',
          codice_rad: 'RAD123',
          infetto: true
        }
      ];

      const csv = generateCSV(mockData);
      
      expect(csv).toContain('"Nome","Cognome","Data Nascita","Data Ricovero","Data Dimissione"');
      expect(csv).toContain('"Mario","Rossi","01/01/1990","01/01/2024","","Infarto","Cardiologia","Pronto Soccorso","Alta","RAD123","Sì"');
    });

    it('should handle empty data', () => {
      const generateCSV = (data) => {
        const headers = ["Nome", "Cognome"];
        const rows = data.map((p) => [p.nome || "", p.cognome || ""]);
        return [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(","))
          .join("\n");
      };

      const csv = generateCSV([]);
      expect(csv).toBe('"Nome","Cognome"');
    });

    it('should escape quotes in CSV', () => {
      const generateCSV = (data) => {
        const rows = data.map((p) => [`"${p.nome.replace(/"/g, '""')}"`, `"${p.cognome.replace(/"/g, '""')}"`]);
        return rows.join('\n');
      };

      const mockData = [{ nome: 'Mario "Il Magnifico"', cognome: 'Rossi' }];
      const csv = generateCSV(mockData);
      expect(csv).toBe('"Mario ""Il Magnifico""","Rossi"');
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate patient statistics correctly', () => {
      const calculateStats = (data) => {
        const stats = {
          total: data.length,
          active: data.filter((p) => !p.data_dimissione).length,
          discharged: data.filter((p) => p.data_dimissione).length,
          byDiagnosis: {},
          byDepartment: {},
        };

        data.forEach((p) => {
          stats.byDiagnosis[p.diagnosi] = (stats.byDiagnosis[p.diagnosi] || 0) + 1;
          stats.byDepartment[p.reparto_appartenenza] = (stats.byDepartment[p.reparto_appartenenza] || 0) + 1;
        });

        return stats;
      };

      const mockData = [
        { data_dimissione: null, diagnosi: 'Infarto', reparto_appartenenza: 'Cardiologia' },
        { data_dimissione: '2024-01-01', diagnosi: 'Infarto', reparto_appartenenza: 'Cardiologia' },
        { data_dimissione: null, diagnosi: 'Pneumonia', reparto_appartenenza: 'Pneumologia' },
        { data_dimissione: null, diagnosi: 'Infarto', reparto_appartenenza: 'Neurologia' }
      ];

      const stats = calculateStats(mockData);
      
      expect(stats).toEqual({
        total: 4,
        active: 3,
        discharged: 1,
        byDiagnosis: { Infarto: 3, Pneumonia: 1 },
        byDepartment: { Cardiologia: 2, Pneumologia: 1, Neurologia: 1 }
      });
    });

    it('should handle empty data for statistics', () => {
      const calculateStats = (data) => {
        return {
          total: data.length,
          active: data.filter((p) => !p.data_dimissione).length,
          discharged: data.filter((p) => p.data_dimissione).length,
          byDiagnosis: {},
          byDepartment: {},
        };
      };

      const stats = calculateStats([]);
      
      expect(stats).toEqual({
        total: 0,
        active: 0,
        discharged: 0,
        byDiagnosis: {},
        byDepartment: {}
      });
    });
  });
});
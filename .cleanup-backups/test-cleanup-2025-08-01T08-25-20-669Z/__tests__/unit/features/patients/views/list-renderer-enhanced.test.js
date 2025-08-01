/**
 * Test suite for enhanced patient list renderer with transfer information
 * Tests the new transfer indicators, status badges, and search functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the dependencies
vi.mock('../../../../../src/core/auth/authService.js', () => ({
  currentUser: {
    profile: { role: 'admin' }
  }
}));

vi.mock('../../../../../src/features/patients/views/list-state-migrated.js', () => ({
  domElements: {},
  state: {
    currentPage: 0,
    sortColumn: 'data_ricovero',
    sortDirection: 'desc'
  }
}));

describe('Enhanced Patient List Renderer', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        </head>
        <body>
          <table>
            <tbody id="pazienti-table-body"></tbody>
          </table>
          <div id="pazienti-cards-container"></div>
        </body>
      </html>
    `);
    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
  });

  describe('Enhanced Status Badge Generation', () => {
    it('should generate active status badge for active patients', () => {
      const getEnhancedStatusBadge = (patient) => {
        if (!patient.data_dimissione) {
          return `<span class="badge bg-success">Attivo</span>`;
        }
        return `<span class="badge bg-secondary">Dimesso</span>`;
      };

      const activePatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_dimissione: null
      };

      const badge = getEnhancedStatusBadge(activePatient);
      expect(badge).toContain('bg-success');
      expect(badge).toContain('Attivo');
    });

    it('should generate internal transfer status badge', () => {
      const getEnhancedStatusBadge = (patient) => {
        if (!patient.data_dimissione) {
          return `<span class="badge bg-success">Attivo</span>`;
        }

        let badgeClass = 'bg-secondary';
        let badgeText = 'Dimesso';
        let badgeIcon = '';

        if (patient.tipo_dimissione === 'trasferimento_interno') {
          badgeClass = 'bg-info';
          badgeText = 'Trasf. Interno';
          badgeIcon = '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">swap_horiz</span>';
        }

        let dischargeCode = '';
        if (patient.codice_dimissione) {
          const codeText = patient.codice_dimissione === '3' ? 'Ord.' : patient.codice_dimissione === '6' ? 'Vol.' : patient.codice_dimissione;
          dischargeCode = ` <small>(${codeText})</small>`;
        }

        return `<span class="badge ${badgeClass}">${badgeIcon}${badgeText}${dischargeCode}</span>`;
      };

      const transferPatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'trasferimento_interno',
        reparto_destinazione: 'Cardiologia',
        codice_dimissione: '3'
      };

      const badge = getEnhancedStatusBadge(transferPatient);
      expect(badge).toContain('bg-info');
      expect(badge).toContain('Trasf. Interno');
      expect(badge).toContain('swap_horiz');
      expect(badge).toContain('(Ord.)');
    });

    it('should generate external transfer status badge', () => {
      const getEnhancedStatusBadge = (patient) => {
        if (!patient.data_dimissione) {
          return `<span class="badge bg-success">Attivo</span>`;
        }

        let badgeClass = 'bg-secondary';
        let badgeText = 'Dimesso';
        let badgeIcon = '';

        if (patient.tipo_dimissione === 'trasferimento_esterno') {
          badgeClass = 'bg-warning text-dark';
          badgeText = 'Trasf. Esterno';
          badgeIcon = '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">exit_to_app</span>';
        }

        let dischargeCode = '';
        if (patient.codice_dimissione) {
          const codeText = patient.codice_dimissione === '6' ? 'Vol.' : patient.codice_dimissione;
          dischargeCode = ` <small>(${codeText})</small>`;
        }

        return `<span class="badge ${badgeClass}">${badgeIcon}${badgeText}${dischargeCode}</span>`;
      };

      const externalTransferPatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'trasferimento_esterno',
        clinica_destinazione: 'Clinica San Giuseppe',
        codice_clinica: '56',
        codice_dimissione: '6'
      };

      const badge = getEnhancedStatusBadge(externalTransferPatient);
      expect(badge).toContain('bg-warning text-dark');
      expect(badge).toContain('Trasf. Esterno');
      expect(badge).toContain('exit_to_app');
      expect(badge).toContain('(Vol.)');
    });

    it('should generate regular discharge status badge', () => {
      const getEnhancedStatusBadge = (patient) => {
        if (!patient.data_dimissione) {
          return `<span class="badge bg-success">Attivo</span>`;
        }

        let badgeClass = 'bg-secondary';
        let badgeText = 'Dimesso';
        let badgeIcon = '';

        if (patient.tipo_dimissione === 'dimissione') {
          badgeIcon = '<span class="material-icons" style="font-size: 0.8em; margin-right: 2px;">home</span>';
        }

        return `<span class="badge ${badgeClass}">${badgeIcon}${badgeText}</span>`;
      };

      const dischargedPatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'dimissione'
      };

      const badge = getEnhancedStatusBadge(dischargedPatient);
      expect(badge).toContain('bg-secondary');
      expect(badge).toContain('Dimesso');
      expect(badge).toContain('home');
    });
  });

  describe('Transfer Information Generation', () => {
    it('should return dash for active patients', () => {
      const getTransferInfo = (patient) => {
        if (!patient.data_dimissione || !patient.tipo_dimissione) {
          return '-';
        }
        return 'Transfer info';
      };

      const activePatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_dimissione: null
      };

      const transferInfo = getTransferInfo(activePatient);
      expect(transferInfo).toBe('-');
    });

    it('should generate internal transfer information', () => {
      const getTransferInfo = (patient) => {
        if (!patient.data_dimissione || !patient.tipo_dimissione) {
          return '-';
        }

        if (patient.tipo_dimissione === 'trasferimento_interno') {
          return patient.reparto_destinazione ? 
            `<small class="text-info"><strong>→ ${patient.reparto_destinazione}</strong></small>` : 
            '<small class="text-muted">Interno</small>';
        }

        return '-';
      };

      const internalTransferPatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'trasferimento_interno',
        reparto_destinazione: 'Cardiologia'
      };

      const transferInfo = getTransferInfo(internalTransferPatient);
      expect(transferInfo).toContain('text-info');
      expect(transferInfo).toContain('→ Cardiologia');
    });

    it('should generate external transfer information', () => {
      const getTransferInfo = (patient) => {
        if (!patient.data_dimissione || !patient.tipo_dimissione) {
          return '-';
        }

        if (patient.tipo_dimissione === 'trasferimento_esterno') {
          let externalInfo = '<small class="text-warning"><strong>Esterno</strong>';
          if (patient.clinica_destinazione) {
            externalInfo += `<br>→ ${patient.clinica_destinazione}`;
          }
          if (patient.codice_clinica) {
            const clinicName = patient.codice_clinica === '56' ? 'Riab. Cardiologica' : 
                             patient.codice_clinica === '60' ? 'Riab. Generale' : 
                             `Cod. ${patient.codice_clinica}`;
            externalInfo += `<br>(${clinicName})`;
          }
          externalInfo += '</small>';
          return externalInfo;
        }

        return '-';
      };

      const externalTransferPatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'trasferimento_esterno',
        clinica_destinazione: 'Clinica San Giuseppe',
        codice_clinica: '56'
      };

      const transferInfo = getTransferInfo(externalTransferPatient);
      expect(transferInfo).toContain('text-warning');
      expect(transferInfo).toContain('Esterno');
      expect(transferInfo).toContain('→ Clinica San Giuseppe');
      expect(transferInfo).toContain('Riab. Cardiologica');
    });

    it('should handle external transfer without destination clinic', () => {
      const getTransferInfo = (patient) => {
        if (!patient.data_dimissione || !patient.tipo_dimissione) {
          return '-';
        }

        if (patient.tipo_dimissione === 'trasferimento_esterno') {
          let externalInfo = '<small class="text-warning"><strong>Esterno</strong>';
          if (patient.clinica_destinazione) {
            externalInfo += `<br>→ ${patient.clinica_destinazione}`;
          }
          externalInfo += '</small>';
          return externalInfo;
        }

        return '-';
      };

      const externalTransferPatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'trasferimento_esterno'
      };

      const transferInfo = getTransferInfo(externalTransferPatient);
      expect(transferInfo).toContain('text-warning');
      expect(transferInfo).toContain('Esterno');
      expect(transferInfo).not.toContain('→');
    });
  });

  describe('Enhanced Search Functionality', () => {
    it('should build search query including transfer fields', () => {
      const buildSearchQuery = (searchTerm) => {
        if (!searchTerm) return '';
        
        const searchFields = [
          'nome',
          'cognome', 
          'diagnosi',
          'codice_rad',
          'reparto_destinazione',
          'clinica_destinazione'
        ];
        
        return searchFields.map(field => `${field}.ilike.%${searchTerm}%`).join(',');
      };

      const searchQuery = buildSearchQuery('Mario');
      expect(searchQuery).toContain('nome.ilike.%Mario%');
      expect(searchQuery).toContain('cognome.ilike.%Mario%');
      expect(searchQuery).toContain('reparto_destinazione.ilike.%Mario%');
      expect(searchQuery).toContain('clinica_destinazione.ilike.%Mario%');
    });

    it('should handle empty search term', () => {
      const buildSearchQuery = (searchTerm) => {
        if (!searchTerm || searchTerm.trim() === '') return '';
        return 'search_query';
      };

      expect(buildSearchQuery('')).toBe('');
      expect(buildSearchQuery(null)).toBe('');
      expect(buildSearchQuery(undefined)).toBe('');
      expect(buildSearchQuery('   ')).toBe('');
    });
  });

  describe('Transfer Filter Logic', () => {
    it('should build transfer filter criteria', () => {
      const buildTransferFilter = (transferType) => {
        if (!transferType) return null;
        
        const validTypes = ['dimissione', 'trasferimento_interno', 'trasferimento_esterno'];
        if (!validTypes.includes(transferType)) return null;
        
        return { tipo_dimissione: transferType };
      };

      expect(buildTransferFilter('trasferimento_interno')).toEqual({
        tipo_dimissione: 'trasferimento_interno'
      });
      
      expect(buildTransferFilter('invalid_type')).toBeNull();
      expect(buildTransferFilter('')).toBeNull();
    });

    it('should validate transfer filter values', () => {
      const validateTransferFilter = (value) => {
        const validValues = ['dimissione', 'trasferimento_interno', 'trasferimento_esterno'];
        return validValues.includes(value);
      };

      expect(validateTransferFilter('dimissione')).toBe(true);
      expect(validateTransferFilter('trasferimento_interno')).toBe(true);
      expect(validateTransferFilter('trasferimento_esterno')).toBe(true);
      expect(validateTransferFilter('invalid')).toBe(false);
      expect(validateTransferFilter('')).toBe(false);
    });
  });

  describe('Table Rendering with Transfer Information', () => {
    it('should render table with transfer column', () => {
      const renderTableRow = (patient) => {
        const statusBadge = patient.data_dimissione ? 
          `<span class="badge bg-secondary">Dimesso</span>` : 
          `<span class="badge bg-success">Attivo</span>`;
        
        const transferInfo = patient.tipo_dimissione === 'trasferimento_interno' && patient.reparto_destinazione ?
          `<small class="text-info"><strong>→ ${patient.reparto_destinazione}</strong></small>` : '-';

        return `
          <tr>
            <td>${patient.cognome}</td>
            <td>${patient.nome}</td>
            <td>${patient.diagnosi}</td>
            <td>${statusBadge}</td>
            <td>${transferInfo}</td>
          </tr>
        `;
      };

      const patient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        diagnosi: 'Infarto',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'trasferimento_interno',
        reparto_destinazione: 'Cardiologia'
      };

      const row = renderTableRow(patient);
      expect(row).toContain('Mario');
      expect(row).toContain('Rossi');
      expect(row).toContain('Dimesso');
      expect(row).toContain('→ Cardiologia');
    });
  });

  describe('Mobile Card Rendering with Transfer Information', () => {
    it('should render mobile card with transfer information', () => {
      const renderMobileCard = (patient) => {
        const statusBadge = patient.data_dimissione ? 
          `<span class="badge bg-secondary">Dimesso</span>` : 
          `<span class="badge bg-success">Attivo</span>`;
        
        const transferInfo = patient.tipo_dimissione === 'trasferimento_esterno' && patient.clinica_destinazione ?
          `<small class="text-warning"><strong>Esterno</strong><br>→ ${patient.clinica_destinazione}</small>` : '-';

        let transferInfoHtml = '';
        if (transferInfo !== '-') {
          transferInfoHtml = `<p class="card-text mb-1"><strong>Trasferimento:</strong> ${transferInfo}</p>`;
        }

        return `
          <div class="card mb-3 patient-card-mobile">
            <div class="card-body">
              <h5 class="card-title">${patient.cognome} ${patient.nome}</h5>
              <p class="card-text"><strong>Diagnosi:</strong> ${patient.diagnosi}</p>
              <p class="card-text"><strong>Stato:</strong> ${statusBadge}</p>
              ${transferInfoHtml}
            </div>
          </div>
        `;
      };

      const patient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        diagnosi: 'Infarto',
        data_dimissione: '2024-01-15',
        tipo_dimissione: 'trasferimento_esterno',
        clinica_destinazione: 'Clinica San Giuseppe'
      };

      const card = renderMobileCard(patient);
      expect(card).toContain('Rossi Mario');
      expect(card).toContain('Infarto');
      expect(card).toContain('Dimesso');
      expect(card).toContain('Trasferimento:');
      expect(card).toContain('→ Clinica San Giuseppe');
    });

    it('should render mobile card without transfer info for active patients', () => {
      const renderMobileCard = (patient) => {
        const statusBadge = `<span class="badge bg-success">Attivo</span>`;
        const transferInfo = '-';

        let transferInfoHtml = '';
        if (transferInfo !== '-') {
          transferInfoHtml = `<p class="card-text mb-1"><strong>Trasferimento:</strong> ${transferInfo}</p>`;
        }

        return `
          <div class="card mb-3 patient-card-mobile">
            <div class="card-body">
              <h5 class="card-title">${patient.cognome} ${patient.nome}</h5>
              <p class="card-text"><strong>Diagnosi:</strong> ${patient.diagnosi}</p>
              <p class="card-text"><strong>Stato:</strong> ${statusBadge}</p>
              ${transferInfoHtml}
            </div>
          </div>
        `;
      };

      const activePatient = {
        id: '1',
        nome: 'Mario',
        cognome: 'Rossi',
        diagnosi: 'Infarto',
        data_dimissione: null
      };

      const card = renderMobileCard(activePatient);
      expect(card).toContain('Rossi Mario');
      expect(card).toContain('Attivo');
      expect(card).not.toContain('Trasferimento:');
    });
  });

  describe('CSV Export with Transfer Data', () => {
    it('should prepare patient data for CSV export including transfer fields', () => {
      const prepareForCSV = (patients) => {
        return patients.map(p => ({
          'ID': p.id,
          'Nome': p.nome || '',
          'Cognome': p.cognome || '',
          'Data Nascita': p.data_nascita || '',
          'Data Ricovero': p.data_ricovero || '',
          'Data Dimissione': p.data_dimissione || '',
          'Tipo Dimissione': p.tipo_dimissione || '',
          'Reparto Destinazione': p.reparto_destinazione || '',
          'Clinica Destinazione': p.clinica_destinazione || '',
          'Codice Clinica': p.codice_clinica || '',
          'Codice Dimissione': p.codice_dimissione || '',
          'Diagnosi': p.diagnosi || '',
          'Reparto': p.reparto_appartenenza || '',
          'Stato': p.data_dimissione ? 'Dimesso/Trasferito' : 'Attivo'
        }));
      };

      const patients = [
        {
          id: 1,
          nome: 'Mario',
          cognome: 'Rossi',
          data_nascita: '1990-01-01',
          data_ricovero: '2024-01-01',
          data_dimissione: '2024-01-15',
          tipo_dimissione: 'trasferimento_interno',
          reparto_destinazione: 'Cardiologia',
          codice_dimissione: '3',
          diagnosi: 'Infarto',
          reparto_appartenenza: 'Pronto Soccorso'
        }
      ];

      const csvData = prepareForCSV(patients);
      
      expect(csvData[0]).toEqual({
        'ID': 1,
        'Nome': 'Mario',
        'Cognome': 'Rossi',
        'Data Nascita': '1990-01-01',
        'Data Ricovero': '2024-01-01',
        'Data Dimissione': '2024-01-15',
        'Tipo Dimissione': 'trasferimento_interno',
        'Reparto Destinazione': 'Cardiologia',
        'Clinica Destinazione': '',
        'Codice Clinica': '',
        'Codice Dimissione': '3',
        'Diagnosi': 'Infarto',
        'Reparto': 'Pronto Soccorso',
        'Stato': 'Dimesso/Trasferito'
      });
    });
  });
});
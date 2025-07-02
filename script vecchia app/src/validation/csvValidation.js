/**
 * Validation Layer - CSV Validation Functions
 * Sistema di validazione per file CSV
 * 
 * @version 1.0.0
 * @since 2025-06-26
 * @requires validation/coreValidation.js
 */

/**
 * Servizio di validazione per file e dati CSV
 * Centralizza tutte le validazioni relative ai file CSV
 */
const CsvValidation = {

  /**
   * Valida la struttura di base di un file CSV
   * @param {Array} csvData - Dati CSV come array bidimensionale
   * @returns {Object} Risultato validazione
   */
  validateCsvStructure(csvData) {
    // Verifica che sia un array
    if (!csvData || !Array.isArray(csvData)) {
      return CoreValidation.createValidationResult(
        false,
        'Dati CSV non validi: deve essere un array.',
        csvData
      );
    }

    // Verifica che abbia almeno intestazioni + 1 riga dati
    if (csvData.length < 2) {
      return CoreValidation.createValidationResult(
        false,
        'File CSV deve contenere almeno una riga di intestazioni e una riga di dati.',
        csvData
      );
    }

    return CoreValidation.createValidationResult(
      true,
      'Struttura CSV valida.',
      csvData
    );
  },

  /**
   * Valida le intestazioni di un CSV
   * @param {Array} headers - Array delle intestazioni
   * @param {Array} requiredHeaders - Intestazioni richieste (opzionale)
   * @param {number} minColumns - Numero minimo di colonne
   * @returns {Object} Risultato validazione
   */
  validateCsvHeaders(headers, requiredHeaders = [], minColumns = 2) {
    if (!headers || !Array.isArray(headers)) {
      return CoreValidation.createValidationResult(
        false,
        'Intestazioni CSV non valide.',
        headers
      );
    }

    // Verifica numero minimo colonne
    if (headers.length < minColumns) {
      return CoreValidation.createValidationResult(
        false,
        `Le intestazioni del CSV devono contenere almeno ${minColumns} colonne.`,
        headers
      );
    }

    // Verifica intestazioni richieste se specificate
    if (requiredHeaders.length > 0) {
      const missingHeaders = requiredHeaders.filter(required => {
        return !headers.some(header => 
          String(header).toLowerCase().trim() === String(required).toLowerCase().trim()
        );
      });

      if (missingHeaders.length > 0) {
        return CoreValidation.createValidationResult(
          false,
          `Intestazioni mancanti: ${missingHeaders.join(', ')}`,
          headers
        );
      }
    }

    // Verifica che non ci siano intestazioni vuote
    const emptyHeaders = headers.filter(header => !CoreValidation.isNotEmpty(header));
    if (emptyHeaders.length > 0) {
      return CoreValidation.createValidationResult(
        false,
        'Alcune intestazioni sono vuote.',
        headers
      );
    }

    return CoreValidation.createValidationResult(
      true,
      'Intestazioni CSV valide.',
      headers
    );
  },

  /**
   * Valida il contenuto delle righe dati di un CSV
   * @param {Array} csvData - Dati CSV completi
   * @param {number} minValidRows - Numero minimo di righe valide
   * @returns {Object} Risultato validazione con statistiche
   */
  validateCsvContent(csvData, minValidRows = 1) {
    const structureResult = this.validateCsvStructure(csvData);
    if (!structureResult.isValid) {
      return structureResult;
    }

    const headers = csvData[0];
    const dataRows = csvData.slice(1);
    
    let validRows = 0;
    let emptyRows = 0;
    let invalidRows = 0;
    const errors = [];

    // Analizza ogni riga di dati
    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 perché partiamo dalla riga 2 (dopo header)
      
      if (!row || !Array.isArray(row)) {
        invalidRows++;
        errors.push(`Riga ${rowNumber}: formato non valido`);
        return;
      }

      // Verifica se la riga è vuota
      const rowContent = row.join('').trim();
      if (rowContent === '') {
        emptyRows++;
        return;
      }

      // Verifica che la riga abbia lo stesso numero di colonne delle intestazioni
      if (row.length !== headers.length) {
        invalidRows++;
        errors.push(`Riga ${rowNumber}: numero di colonne non corrispondente (${row.length} vs ${headers.length})`);
        return;
      }

      // Verifica che la riga abbia almeno alcuni dati non vuoti
      const nonEmptyCells = row.filter(cell => CoreValidation.isNotEmpty(cell));
      if (nonEmptyCells.length < Math.ceil(headers.length / 2)) {
        invalidRows++;
        errors.push(`Riga ${rowNumber}: troppi campi vuoti`);
        return;
      }

      validRows++;
    });

    // Verifica numero minimo di righe valide
    if (validRows < minValidRows) {
      return CoreValidation.createValidationResult(
        false,
        `Trovate solo ${validRows} righe valide, minimo richiesto: ${minValidRows}`,
        csvData,
        {
          validRows,
          emptyRows,
          invalidRows,
          totalDataRows: dataRows.length,
          errors
        }
      );
    }

    return CoreValidation.createValidationResult(
      true,
      `CSV valido: ${validRows} righe di dati processabili.`,
      csvData,
      {
        validRows,
        emptyRows,
        invalidRows,
        totalDataRows: dataRows.length,
        errors
      }
    );
  },

  /**
   * Valida un file CSV completo (struttura + intestazioni + contenuto)
   * @param {Array} csvData - Dati CSV
   * @param {Object} options - Opzioni di validazione
   * @returns {Object} Risultato validazione completa
   */
  validateFullCsv(csvData, options = {}) {
    const {
      requiredHeaders = [],
      minColumns = 2,
      minValidRows = 1,
      maxFileSize = null // per validazioni future
    } = options;

    // Validazione struttura
    const structureResult = this.validateCsvStructure(csvData);
    if (!structureResult.isValid) {
      return structureResult;
    }

    // Validazione intestazioni
    const headersResult = this.validateCsvHeaders(
      csvData[0], 
      requiredHeaders, 
      minColumns
    );
    if (!headersResult.isValid) {
      return headersResult;
    }

    // Validazione contenuto
    const contentResult = this.validateCsvContent(csvData, minValidRows);
    
    return contentResult;
  },

  /**
   * Normalizza i dati CSV rimuovendo righe vuote e pulendo i dati
   * @param {Array} csvData - Dati CSV da normalizzare
   * @returns {Array} Dati CSV normalizzati
   */
  normalizeCsvData(csvData) {
    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return [];
    }

    const headers = csvData[0];
    const normalizedData = [headers]; // Mantieni sempre le intestazioni

    // Processa le righe di dati
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];
      
      if (!row || !Array.isArray(row)) continue;
      
      // Skip righe completamente vuote
      const rowContent = row.join('').trim();
      if (rowContent === '') continue;
      
      // Normalizza ogni cella della riga
      const normalizedRow = row.map(cell => {
        if (cell === null || cell === undefined) return '';
        return String(cell).trim();
      });
      
      // Assicurati che la riga abbia lo stesso numero di colonne delle intestazioni
      while (normalizedRow.length < headers.length) {
        normalizedRow.push('');
      }
      if (normalizedRow.length > headers.length) {
        normalizedRow.splice(headers.length);
      }
      
      normalizedData.push(normalizedRow);
    }

    return normalizedData;
  },

  /**
   * Verifica la disponibilità del servizio
   * @returns {boolean} True se disponibile
   */
  isAvailable() {
    return typeof CoreValidation !== 'undefined' && CoreValidation.isAvailable();
  }
};

// Log del caricamento del modulo
if (typeof logAvanzato === 'function') {
  logAvanzato('CsvValidation caricato correttamente', 'INFO');
} else {
  console.log('✓ CsvValidation caricato');
}

/**
 * Fixtures per dati form e validazione
 */

/**
 * Dati form paziente per test
 */
export const patientFormData = {
  // Form valido completo
  valid: {
    nome: 'Mario',
    cognome: 'Rossi',
    data_nascita: '1980-01-15',
    luogo_nascita: 'Roma',
    codice_fiscale: 'RSSMRA80A15H501X',
    telefono: '+39 333 1234567',
    email: 'mario.rossi@example.com',
    indirizzo: 'Via Roma 123',
    citta: 'Roma',
    cap: '00100',
    reparto_appartenenza: 'Medicina',
    diagnosi: 'Ipertensione',
    medico_curante: 'Dr. Giovanni Medici',
    data_ricovero: '2024-01-10',
    note_mediche: 'Paziente con storia di ipertensione',
    allergie: 'Nessuna',
    terapia_attuale: 'Ramipril 5mg',
    contatto_emergenza: 'Maria Rossi - 333 7654321'
  },
  
  // Form con dati minimi richiesti
  minimal: {
    nome: 'Luigi',
    cognome: 'Verdi',
    data_nascita: '1975-05-22',
    reparto_appartenenza: 'Chirurgia',
    diagnosi: 'Appendicite'
  },
  
  // Form con errori di validazione
  invalid: {
    emptyRequired: {
      nome: '',
      cognome: '',
      data_nascita: '',
      reparto_appartenenza: '',
      diagnosi: ''
    },
    
    invalidEmail: {
      nome: 'Test',
      cognome: 'Patient',
      email: 'invalid-email'
    },
    
    invalidPhone: {
      nome: 'Test',
      cognome: 'Patient',
      telefono: '123'
    },
    
    invalidDate: {
      nome: 'Test',
      cognome: 'Patient',
      data_nascita: '2030-01-01' // Data futura
    },
    
    invalidPostalCode: {
      nome: 'Test',
      cognome: 'Patient',
      cap: '123' // CAP troppo corto
    }
  }
};

/**
 * Dati form ricerca per test
 */
export const searchFormData = {
  // Ricerca per nome
  byName: {
    query: 'Mario',
    searchType: 'name'
  },
  
  // Ricerca per reparto
  byDepartment: {
    reparto: 'Medicina',
    searchType: 'department'
  },
  
  // Ricerca per diagnosi
  byDiagnosis: {
    diagnosi: 'Ipertensione',
    searchType: 'diagnosis'
  },
  
  // Ricerca per range date
  byDateRange: {
    data_inizio: '2024-01-01',
    data_fine: '2024-01-31',
    searchType: 'dateRange'
  },
  
  // Ricerca combinata
  combined: {
    query: 'Mario',
    reparto: 'Medicina',
    data_inizio: '2024-01-01',
    data_fine: '2024-01-31'
  },
  
  // Ricerca vuota
  empty: {
    query: '',
    reparto: '',
    diagnosi: ''
  }
};

/**
 * Dati form filtri per test
 */
export const filterFormData = {
  // Filtro per stato paziente
  byStatus: {
    stato: 'ricoverato', // ricoverato, dimesso, trasferito
    includeInactive: false
  },
  
  // Filtro per età
  byAge: {
    eta_min: 18,
    eta_max: 65
  },
  
  // Filtro per periodo ricovero
  byAdmissionPeriod: {
    periodo: 'ultimo_mese', // oggi, ultima_settimana, ultimo_mese, ultimo_anno
    data_personalizzata_inizio: null,
    data_personalizzata_fine: null
  },
  
  // Filtro personalizzato
  custom: {
    periodo: 'personalizzato',
    data_personalizzata_inizio: '2024-01-01',
    data_personalizzata_fine: '2024-01-31',
    reparti: ['Medicina', 'Chirurgia'],
    diagnosi: ['Ipertensione', 'Diabete'],
    solo_attivi: true
  }
};

/**
 * Dati form login per test
 */
export const loginFormData = {
  // Login valido
  valid: {
    email: 'admin@hospital.com',
    password: 'SecurePassword123!',
    remember: false
  },
  
  // Login con remember me
  withRemember: {
    email: 'user@hospital.com',
    password: 'UserPass456!',
    remember: true
  },
  
  // Login invalido
  invalid: {
    emptyFields: {
      email: '',
      password: ''
    },
    
    invalidEmail: {
      email: 'invalid-email',
      password: 'password'
    },
    
    shortPassword: {
      email: 'user@hospital.com',
      password: '123'
    },
    
    wrongCredentials: {
      email: 'wrong@hospital.com',
      password: 'WrongPassword'
    }
  }
};

/**
 * Regole di validazione per test
 */
export const validationRules = {
  // Regole paziente
  patient: {
    nome: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s'.-]+$/
    },
    
    cognome: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s'.-]+$/
    },
    
    email: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    telefono: {
      required: false,
      pattern: /^(\+39\s?)?((3[0-9]{2}|32[0-9]|33[0-9]|34[0-9]|36[0-9]|37[0-9]|38[0-9]|39[0-9])\s?\d{6,7})$/
    },
    
    codice_fiscale: {
      required: false,
      pattern: /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/
    },
    
    cap: {
      required: false,
      pattern: /^[0-9]{5}$/
    },
    
    data_nascita: {
      required: true,
      type: 'date',
      maxDate: new Date().toISOString().split('T')[0]
    }
  },
  
  // Regole ricerca
  search: {
    query: {
      required: false,
      minLength: 2,
      maxLength: 100
    },
    
    data_inizio: {
      required: false,
      type: 'date'
    },
    
    data_fine: {
      required: false,
      type: 'date'
    }
  },
  
  // Regole login
  login: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    password: {
      required: true,
      minLength: 8,
      maxLength: 128
    }
  }
};

/**
 * Messaggi di errore per validazione
 */
export const validationMessages = {
  required: 'Questo campo è obbligatorio',
  email: 'Inserisci un indirizzo email valido',
  minLength: (min) => `Minimo ${min} caratteri richiesti`,
  maxLength: (max) => `Massimo ${max} caratteri consentiti`,
  pattern: 'Formato non valido',
  date: 'Inserisci una data valida',
  phone: 'Inserisci un numero di telefono valido',
  postalCode: 'Inserisci un CAP valido (5 cifre)',
  fiscalCode: 'Inserisci un codice fiscale valido',
  futureDate: 'La data non può essere nel futuro',
  pastDate: 'La data non può essere nel passato'
};

/**
 * Stati form per test
 */
export const formStates = {
  // Form iniziale
  initial: {
    data: {},
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
    isDirty: false
  },
  
  // Form con dati validi
  valid: {
    data: patientFormData.valid,
    errors: {},
    touched: {
      nome: true,
      cognome: true,
      data_nascita: true
    },
    isSubmitting: false,
    isValid: true,
    isDirty: true
  },
  
  // Form con errori
  withErrors: {
    data: patientFormData.invalid.emptyRequired,
    errors: {
      nome: 'Questo campo è obbligatorio',
      cognome: 'Questo campo è obbligatorio',
      data_nascita: 'Questo campo è obbligatorio'
    },
    touched: {
      nome: true,
      cognome: true,
      data_nascita: true
    },
    isSubmitting: false,
    isValid: false,
    isDirty: true
  },
  
  // Form in submit
  submitting: {
    data: patientFormData.valid,
    errors: {},
    touched: {},
    isSubmitting: true,
    isValid: true,
    isDirty: true
  }
};

/**
 * Opzioni select per form
 */
export const selectOptions = {
  // Reparti
  reparti: [
    { value: '', label: 'Seleziona reparto...' },
    { value: 'Medicina', label: 'Medicina Generale' },
    { value: 'Chirurgia', label: 'Chirurgia Generale' },
    { value: 'Cardiologia', label: 'Cardiologia' },
    { value: 'Pediatria', label: 'Pediatria' },
    { value: 'Ortopedia', label: 'Ortopedia' },
    { value: 'Neurologia', label: 'Neurologia' },
    { value: 'Ginecologia', label: 'Ginecologia' }
  ],
  
  // Diagnosi comuni
  diagnosi: [
    { value: '', label: 'Seleziona diagnosi...' },
    { value: 'Ipertensione', label: 'Ipertensione Arteriosa' },
    { value: 'Diabete', label: 'Diabete Mellito' },
    { value: 'Appendicite', label: 'Appendicite Acuta' },
    { value: 'Infarto', label: 'Infarto Miocardico' },
    { value: 'Frattura', label: 'Frattura Ossea' },
    { value: 'Polmonite', label: 'Polmonite' },
    { value: 'Gastrite', label: 'Gastrite' }
  ],
  
  // Periodi per filtri
  periodi: [
    { value: 'oggi', label: 'Oggi' },
    { value: 'ultima_settimana', label: 'Ultima settimana' },
    { value: 'ultimo_mese', label: 'Ultimo mese' },
    { value: 'ultimo_anno', label: 'Ultimo anno' },
    { value: 'personalizzato', label: 'Periodo personalizzato' }
  ],
  
  // Stati paziente
  stati: [
    { value: '', label: 'Tutti gli stati' },
    { value: 'ricoverato', label: 'Ricoverato' },
    { value: 'dimesso', label: 'Dimesso' },
    { value: 'trasferito', label: 'Trasferito' }
  ]
};

/**
 * Helper per creare form data personalizzati
 */
export function createFormData(baseData = {}, overrides = {}) {
  return { ...baseData, ...overrides };
}

/**
 * Helper per validare form data
 */
export function validateFormData(data, rules) {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    // Required validation
    if (fieldRules.required && (!value || value.trim() === '')) {
      errors[field] = validationMessages.required;
      continue;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') continue;
    
    // Pattern validation
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      if (field === 'email') {
        errors[field] = validationMessages.email;
      } else if (field === 'telefono') {
        errors[field] = validationMessages.phone;
      } else {
        errors[field] = validationMessages.pattern;
      }
      continue;
    }
    
    // Length validation
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = validationMessages.minLength(fieldRules.minLength);
      continue;
    }
    
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = validationMessages.maxLength(fieldRules.maxLength);
      continue;
    }
    
    // Date validation
    if (fieldRules.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors[field] = validationMessages.date;
        continue;
      }
      
      if (fieldRules.maxDate && date > new Date(fieldRules.maxDate)) {
        errors[field] = validationMessages.futureDate;
        continue;
      }
      
      if (fieldRules.minDate && date < new Date(fieldRules.minDate)) {
        errors[field] = validationMessages.pastDate;
        continue;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Dati per test edge cases form
 */
export const formEdgeCases = {
  // Caratteri speciali
  specialCharacters: {
    nome: "D'Angelo-Müller",
    cognome: "O'Connor-Schmidt",
    indirizzo: "Via dell'Università, 123/A"
  },
  
  // Campi molto lunghi
  longFields: {
    nome: 'A'.repeat(100),
    cognome: 'B'.repeat(100),
    note_mediche: 'Nota medica molto lunga che potrebbe causare problemi di visualizzazione o storage nel database. '.repeat(10)
  },
  
  // Valori limite
  boundaryValues: {
    data_nascita: '1900-01-01', // Data molto vecchia
    telefono: '+39 333 1234567', // Telefono al limite
    cap: '00100' // CAP valido
  }
};
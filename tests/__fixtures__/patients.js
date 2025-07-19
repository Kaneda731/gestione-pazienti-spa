/**
 * Fixtures per dati pazienti con struttura Supabase realistica
 */

/**
 * Pazienti di esempio con dati realistici
 */
export const samplePatients = {
  // Paziente base per test semplici
  basic: {
    id: 1,
    nome: 'Mario',
    cognome: 'Rossi',
    data_nascita: '1980-01-15',
    data_ricovero: '2024-01-10',
    reparto_appartenenza: 'Medicina',
    diagnosi: 'Ipertensione',
    data_dimissione: null,
    created_at: '2024-01-10T08:30:00Z',
    updated_at: '2024-01-10T08:30:00Z'
  },
  
  // Paziente dimesso
  discharged: {
    id: 2,
    nome: 'Luigi',
    cognome: 'Verdi',
    data_nascita: '1975-05-22',
    data_ricovero: '2024-01-12',
    reparto_appartenenza: 'Chirurgia',
    diagnosi: 'Appendicite Acuta',
    data_dimissione: '2024-01-15',
    created_at: '2024-01-12T10:15:00Z',
    updated_at: '2024-01-15T14:20:00Z'
  },
  
  // Paziente con caso complesso
  complex: {
    id: 3,
    nome: 'Anna',
    cognome: 'Bianchi',
    data_nascita: '1990-03-08',
    data_ricovero: '2024-01-14',
    reparto_appartenenza: 'Cardiologia',
    diagnosi: 'Infarto Miocardico',
    data_dimissione: null,
    note_mediche: 'Paziente con storia di ipertensione e diabete',
    allergie: 'Penicillina',
    terapia_attuale: 'Aspirina 100mg, Atorvastatina 20mg',
    created_at: '2024-01-14T12:45:00Z',
    updated_at: '2024-01-14T12:45:00Z'
  },
  
  // Paziente pediatrico
  pediatric: {
    id: 4,
    nome: 'Sofia',
    cognome: 'Gialli',
    data_nascita: '2018-07-12',
    data_ricovero: '2024-01-16',
    reparto_appartenenza: 'Pediatria',
    diagnosi: 'Bronchiolite',
    data_dimissione: null,
    tutore_legale: 'Maria Gialli',
    contatto_emergenza: '+39 333 1234567',
    created_at: '2024-01-16T09:20:00Z',
    updated_at: '2024-01-16T09:20:00Z'
  },
  
  // Paziente anziano
  elderly: {
    id: 5,
    nome: 'Giuseppe',
    cognome: 'Neri',
    data_nascita: '1940-11-30',
    data_ricovero: '2024-01-18',
    reparto_appartenenza: 'Geriatria',
    diagnosi: 'Frattura Femore',
    data_dimissione: null,
    comorbidita: 'Diabete, Ipertensione, Osteoporosi',
    mobilita: 'Limitata',
    created_at: '2024-01-18T15:10:00Z',
    updated_at: '2024-01-18T15:10:00Z'
  }
};

/**
 * Lista completa pazienti per test con dataset grandi
 */
export const patientList = [
  samplePatients.basic,
  samplePatients.discharged,
  samplePatients.complex,
  samplePatients.pediatric,
  samplePatients.elderly,
  
  // Pazienti aggiuntivi per test paginazione
  {
    id: 6,
    nome: 'Marco',
    cognome: 'Blu',
    data_nascita: '1985-04-20',
    data_ricovero: '2024-01-20',
    reparto_appartenenza: 'Ortopedia',
    diagnosi: 'Distorsione Caviglia',
    data_dimissione: '2024-01-22',
    created_at: '2024-01-20T11:30:00Z',
    updated_at: '2024-01-22T16:45:00Z'
  },
  
  {
    id: 7,
    nome: 'Francesca',
    cognome: 'Rosa',
    data_nascita: '1992-09-15',
    data_ricovero: '2024-01-21',
    reparto_appartenenza: 'Ginecologia',
    diagnosi: 'Parto Cesareo',
    data_dimissione: '2024-01-24',
    created_at: '2024-01-21T06:15:00Z',
    updated_at: '2024-01-24T10:30:00Z'
  },
  
  {
    id: 8,
    nome: 'Roberto',
    cognome: 'Viola',
    data_nascita: '1978-12-03',
    data_ricovero: '2024-01-22',
    reparto_appartenenza: 'Neurologia',
    diagnosi: 'Emicrania Severa',
    data_dimissione: null,
    created_at: '2024-01-22T14:20:00Z',
    updated_at: '2024-01-22T14:20:00Z'
  }
];

/**
 * Crea paziente personalizzato con override
 */
export function createPatient(overrides = {}) {
  const basePatient = {
    id: Math.floor(Math.random() * 10000),
    nome: 'Test',
    cognome: 'Patient',
    data_nascita: '1990-01-01',
    data_ricovero: new Date().toISOString().split('T')[0],
    reparto_appartenenza: 'Medicina',
    diagnosi: 'Test Diagnosis',
    data_dimissione: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return { ...basePatient, ...overrides };
}

/**
 * Crea lista pazienti per test performance
 */
export function createPatientList(count = 100) {
  const patients = [];
  const nomi = ['Mario', 'Luigi', 'Anna', 'Sofia', 'Giuseppe', 'Marco', 'Francesca', 'Roberto'];
  const cognomi = ['Rossi', 'Verdi', 'Bianchi', 'Gialli', 'Neri', 'Blu', 'Rosa', 'Viola'];
  const reparti = ['Medicina', 'Chirurgia', 'Cardiologia', 'Pediatria', 'Geriatria', 'Ortopedia'];
  const diagnosi = ['Ipertensione', 'Appendicite', 'Infarto', 'Bronchiolite', 'Frattura', 'Distorsione'];
  
  for (let i = 0; i < count; i++) {
    const nome = nomi[i % nomi.length];
    const cognome = cognomi[i % cognomi.length];
    const reparto = reparti[i % reparti.length];
    const diagnosi_paziente = diagnosi[i % diagnosi.length];
    
    patients.push(createPatient({
      id: i + 1,
      nome: `${nome}${i > 7 ? Math.floor(i / 8) : ''}`,
      cognome: `${cognome}${i > 7 ? Math.floor(i / 8) : ''}`,
      reparto_appartenenza: reparto,
      diagnosi: diagnosi_paziente,
      data_nascita: new Date(1950 + (i % 50), (i % 12), (i % 28) + 1).toISOString().split('T')[0]
    }));
  }
  
  return patients;
}

/**
 * Pazienti per test validazione
 */
export const validationTestCases = {
  // Casi validi
  valid: {
    complete: createPatient({
      nome: 'Valid',
      cognome: 'Patient',
      data_nascita: '1990-01-01',
      reparto_appartenenza: 'Medicina',
      diagnosi: 'Valid Diagnosis'
    }),
    
    minimal: createPatient({
      nome: 'Min',
      cognome: 'Patient'
    })
  },
  
  // Casi invalidi
  invalid: {
    emptyName: createPatient({
      nome: '',
      cognome: 'Patient'
    }),
    
    emptySurname: createPatient({
      nome: 'Patient',
      cognome: ''
    }),
    
    invalidDate: createPatient({
      nome: 'Patient',
      cognome: 'Test',
      data_nascita: 'invalid-date'
    }),
    
    futureDate: createPatient({
      nome: 'Patient',
      cognome: 'Test',
      data_nascita: '2030-01-01'
    }),
    
    missingRequired: {
      // Manca nome e cognome
      data_nascita: '1990-01-01'
    }
  }
};

/**
 * Pazienti per test filtri e ricerca
 */
export const searchTestData = {
  // Pazienti con nomi simili per test fuzzy search
  similarNames: [
    createPatient({ nome: 'Mario', cognome: 'Rossi' }),
    createPatient({ nome: 'Maria', cognome: 'Rossi' }),
    createPatient({ nome: 'Marco', cognome: 'Rosso' }),
    createPatient({ nome: 'Marta', cognome: 'Russo' })
  ],
  
  // Pazienti per test filtri reparto
  byDepartment: {
    medicina: [
      createPatient({ reparto_appartenenza: 'Medicina', diagnosi: 'Ipertensione' }),
      createPatient({ reparto_appartenenza: 'Medicina', diagnosi: 'Diabete' })
    ],
    chirurgia: [
      createPatient({ reparto_appartenenza: 'Chirurgia', diagnosi: 'Appendicite' }),
      createPatient({ reparto_appartenenza: 'Chirurgia', diagnosi: 'Ernia' })
    ]
  },
  
  // Pazienti per test filtri data
  byDate: {
    today: createPatient({ 
      data_ricovero: new Date().toISOString().split('T')[0] 
    }),
    yesterday: createPatient({ 
      data_ricovero: new Date(Date.now() - 86400000).toISOString().split('T')[0] 
    }),
    lastWeek: createPatient({ 
      data_ricovero: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] 
    })
  }
};

/**
 * Dati per test statistiche e grafici
 */
export const statisticsTestData = {
  // Distribuzione per reparto
  byDepartment: [
    ['Medicina', 15],
    ['Chirurgia', 12],
    ['Cardiologia', 8],
    ['Pediatria', 6],
    ['Ortopedia', 4]
  ],
  
  // Distribuzione per diagnosi
  byDiagnosis: [
    ['Ipertensione', 10],
    ['Diabete', 8],
    ['Appendicite', 6],
    ['Fratture', 5],
    ['Infarto', 3]
  ],
  
  // Trend ricoveri per mese
  admissionTrend: [
    ['Gennaio', 45],
    ['Febbraio', 38],
    ['Marzo', 52],
    ['Aprile', 41],
    ['Maggio', 47]
  ]
};

/**
 * Pazienti per test edge cases
 */
export const edgeCasePatients = {
  // Paziente con caratteri speciali
  specialCharacters: createPatient({
    nome: "D'Angelo",
    cognome: 'Müller-Schmidt',
    diagnosi: 'Diagnosi con àccenti è çaratteri spëciali'
  }),
  
  // Paziente con nomi molto lunghi
  longNames: createPatient({
    nome: 'Mariangela Giuseppina Francesca',
    cognome: 'Rossi-Bianchi-Verdi-Gialli',
    diagnosi: 'Diagnosi molto lunga che potrebbe causare problemi di visualizzazione'
  }),
  
  // Paziente con dati minimi
  minimal: {
    id: 999,
    nome: 'A',
    cognome: 'B'
  },
  
  // Paziente con tutti i campi opzionali
  complete: createPatient({
    nome: 'Complete',
    cognome: 'Patient',
    data_nascita: '1985-06-15',
    luogo_nascita: 'Roma',
    codice_fiscale: 'CMPPTNT85H15H501X',
    telefono: '+39 333 1234567',
    email: 'complete.patient@example.com',
    indirizzo: 'Via Roma 123, 00100 Roma',
    contatto_emergenza: 'Maria Patient - +39 333 7654321',
    medico_curante: 'Dr. Mario Medici',
    assicurazione: 'SSN',
    note_mediche: 'Paziente con storia clinica complessa',
    allergie: 'Penicillina, Lattosio',
    terapia_attuale: 'Aspirina 100mg 1cp/die, Ramipril 5mg 1cp/die'
  })
};
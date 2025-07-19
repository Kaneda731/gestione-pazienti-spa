/**
 * Mock centralizzato per Supabase client con dati realistici
 */

import { vi } from 'vitest';

/**
 * Dati realistici per tabelle database
 */
const MOCK_DATA = {
  pazienti: [
    {
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
    {
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
    {
      id: 3,
      nome: 'Anna',
      cognome: 'Bianchi',
      data_nascita: '1990-03-08',
      data_ricovero: '2024-01-14',
      reparto_appartenenza: 'Cardiologia',
      diagnosi: 'Infarto Miocardico',
      data_dimissione: null,
      created_at: '2024-01-14T12:45:00Z',
      updated_at: '2024-01-14T12:45:00Z'
    }
  ],
  
  reparti: [
    { id: 1, nome: 'Medicina', descrizione: 'Reparto di Medicina Generale', attivo: true },
    { id: 2, nome: 'Chirurgia', descrizione: 'Reparto di Chirurgia Generale', attivo: true },
    { id: 3, nome: 'Cardiologia', descrizione: 'Reparto di Cardiologia', attivo: true },
    { id: 4, nome: 'Neurologia', descrizione: 'Reparto di Neurologia', attivo: true },
    { id: 5, nome: 'Ortopedia', descrizione: 'Reparto di Ortopedia', attivo: true },
    { id: 6, nome: 'Pediatria', descrizione: 'Reparto di Pediatria', attivo: true },
    { id: 7, nome: 'Ginecologia', descrizione: 'Reparto di Ginecologia', attivo: false }
  ],
  
  diagnosi: [
    { id: 1, nome: 'Ipertensione', categoria: 'Cardiovascolare', codice_icd: 'I10', attivo: true },
    { id: 2, nome: 'Diabete Mellito', categoria: 'Endocrinologica', codice_icd: 'E11', attivo: true },
    { id: 3, nome: 'Appendicite Acuta', categoria: 'Chirurgica', codice_icd: 'K35', attivo: true },
    { id: 4, nome: 'Infarto Miocardico', categoria: 'Cardiovascolare', codice_icd: 'I21', attivo: true },
    { id: 5, nome: 'Frattura Femore', categoria: 'Ortopedica', codice_icd: 'S72', attivo: true },
    { id: 6, nome: 'Polmonite', categoria: 'Respiratoria', codice_icd: 'J18', attivo: true },
    { id: 7, nome: 'Gastrite', categoria: 'Gastroenterologica', codice_icd: 'K29', attivo: true }
  ],
  
  reparto_diagnosi_compatibilita: [
    { id: 1, reparto_id: 1, diagnosi_id: 1 }, // Medicina - Ipertensione
    { id: 2, reparto_id: 1, diagnosi_id: 2 }, // Medicina - Diabete
    { id: 3, reparto_id: 2, diagnosi_id: 3 }, // Chirurgia - Appendicite
    { id: 4, reparto_id: 3, diagnosi_id: 4 }, // Cardiologia - Infarto
    { id: 5, reparto_id: 5, diagnosi_id: 5 }  // Ortopedia - Frattura
  ]
};

/**
 * Crea chainable query builder mock
 */
function createQueryBuilder(data, tableName) {
  const builder = {
    _data: data,
    _tableName: tableName,
    _filters: [],
    _selectedFields: '*',
    _orderBy: null,
    _limit: null,
    _offset: null,
    _single: false,
    
    // SELECT
    select: vi.fn(function(fields = '*') {
      this._selectedFields = fields;
      return this;
    }),
    
    // FILTERS
    eq: vi.fn(function(column, value) {
      this._filters.push({ type: 'eq', column, value });
      return this;
    }),
    
    neq: vi.fn(function(column, value) {
      this._filters.push({ type: 'neq', column, value });
      return this;
    }),
    
    gt: vi.fn(function(column, value) {
      this._filters.push({ type: 'gt', column, value });
      return this;
    }),
    
    gte: vi.fn(function(column, value) {
      this._filters.push({ type: 'gte', column, value });
      return this;
    }),
    
    lt: vi.fn(function(column, value) {
      this._filters.push({ type: 'lt', column, value });
      return this;
    }),
    
    lte: vi.fn(function(column, value) {
      this._filters.push({ type: 'lte', column, value });
      return this;
    }),
    
    like: vi.fn(function(column, pattern) {
      this._filters.push({ type: 'like', column, pattern });
      return this;
    }),
    
    ilike: vi.fn(function(column, pattern) {
      this._filters.push({ type: 'ilike', column, pattern });
      return this;
    }),
    
    is: vi.fn(function(column, value) {
      this._filters.push({ type: 'is', column, value });
      return this;
    }),
    
    not: vi.fn(function(column, value) {
      this._filters.push({ type: 'not', column, value });
      return this;
    }),
    
    or: vi.fn(function(filters) {
      this._filters.push({ type: 'or', filters });
      return this;
    }),
    
    // ORDERING
    order: vi.fn(function(column, options = {}) {
      this._orderBy = { column, ...options };
      return this;
    }),
    
    // PAGINATION
    range: vi.fn(function(from, to) {
      this._offset = from;
      this._limit = to - from + 1;
      return this;
    }),
    
    limit: vi.fn(function(count) {
      this._limit = count;
      return this;
    }),
    
    // SINGLE RESULT
    single: vi.fn(function() {
      this._single = true;
      return this;
    }),
    
    // EXECUTION
    then: vi.fn(function(callback) {
      const result = this._executeQuery();
      return Promise.resolve(result).then(callback);
    }),
    
    catch: vi.fn(function(callback) {
      const result = this._executeQuery();
      return Promise.resolve(result).catch(callback);
    }),
    
    // Execute query with filters
    _executeQuery() {
      let filteredData = [...this._data];
      
      // Apply filters
      for (const filter of this._filters) {
        filteredData = this._applyFilter(filteredData, filter);
      }
      
      // Apply ordering
      if (this._orderBy) {
        filteredData = this._applyOrdering(filteredData, this._orderBy);
      }
      
      // Apply pagination
      if (this._offset !== null || this._limit !== null) {
        const start = this._offset || 0;
        const end = this._limit ? start + this._limit : undefined;
        filteredData = filteredData.slice(start, end);
      }
      
      // Apply field selection
      if (this._selectedFields !== '*') {
        filteredData = this._applyFieldSelection(filteredData, this._selectedFields);
      }
      
      // Return single or array
      if (this._single) {
        return {
          data: filteredData.length > 0 ? filteredData[0] : null,
          error: null
        };
      }
      
      return {
        data: filteredData,
        error: null
      };
    },
    
    _applyFilter(data, filter) {
      switch (filter.type) {
        case 'eq':
          return data.filter(item => item[filter.column] === filter.value);
        case 'neq':
          return data.filter(item => item[filter.column] !== filter.value);
        case 'gt':
          return data.filter(item => item[filter.column] > filter.value);
        case 'gte':
          return data.filter(item => item[filter.column] >= filter.value);
        case 'lt':
          return data.filter(item => item[filter.column] < filter.value);
        case 'lte':
          return data.filter(item => item[filter.column] <= filter.value);
        case 'like':
        case 'ilike':
          const pattern = filter.pattern.replace(/%/g, '.*');
          const regex = new RegExp(pattern, filter.type === 'ilike' ? 'i' : '');
          return data.filter(item => regex.test(String(item[filter.column])));
        case 'is':
          return data.filter(item => item[filter.column] === filter.value);
        case 'not':
          return data.filter(item => item[filter.column] !== filter.value);
        default:
          return data;
      }
    },
    
    _applyOrdering(data, orderBy) {
      return data.sort((a, b) => {
        const aVal = a[orderBy.column];
        const bVal = b[orderBy.column];
        
        if (aVal < bVal) return orderBy.ascending === false ? 1 : -1;
        if (aVal > bVal) return orderBy.ascending === false ? -1 : 1;
        return 0;
      });
    },
    
    _applyFieldSelection(data, fields) {
      if (typeof fields === 'string') {
        if (fields === '*') return data;
        
        const fieldList = fields.split(',').map(f => f.trim());
        return data.map(item => {
          const selected = {};
          for (const field of fieldList) {
            if (item.hasOwnProperty(field)) {
              selected[field] = item[field];
            }
          }
          return selected;
        });
      }
      
      return data;
    }
  };
  
  return builder;
}

/**
 * Crea mock Supabase client
 */
export function createSupabaseMock(tableOverrides = {}) {
  const mockData = { ...MOCK_DATA, ...tableOverrides };
  
  const supabaseMock = {
    // FROM - table selection
    from: vi.fn((tableName) => {
      const tableData = mockData[tableName] || [];
      
      return {
        // SELECT queries
        select: vi.fn((fields) => createQueryBuilder(tableData, tableName).select(fields)),
        
        // INSERT
        insert: vi.fn((data) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              const newId = Math.max(...tableData.map(item => item.id || 0)) + 1;
              const newRecord = Array.isArray(data) ? data[0] : data;
              const recordWithId = { id: newId, ...newRecord, created_at: new Date().toISOString() };
              
              // Add to mock data
              tableData.push(recordWithId);
              
              return Promise.resolve({
                data: recordWithId,
                error: null
              });
            })
          }))
        })),
        
        // UPDATE
        update: vi.fn((data) => ({
          eq: vi.fn((column, value) => ({
            select: vi.fn(() => ({
              single: vi.fn(() => {
                const itemIndex = tableData.findIndex(item => item[column] === value);
                if (itemIndex >= 0) {
                  const updatedItem = { 
                    ...tableData[itemIndex], 
                    ...data, 
                    updated_at: new Date().toISOString() 
                  };
                  tableData[itemIndex] = updatedItem;
                  
                  return Promise.resolve({
                    data: updatedItem,
                    error: null
                  });
                }
                
                return Promise.resolve({
                  data: null,
                  error: { message: 'Record not found' }
                });
              })
            }))
          }))
        })),
        
        // DELETE
        delete: vi.fn(() => ({
          eq: vi.fn((column, value) => {
            const itemIndex = tableData.findIndex(item => item[column] === value);
            if (itemIndex >= 0) {
              tableData.splice(itemIndex, 1);
              return Promise.resolve({ data: null, error: null });
            }
            
            return Promise.resolve({
              data: null,
              error: { message: 'Record not found' }
            });
          })
        }))
      };
    }),
    
    // AUTH
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: {
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            created_at: '2024-01-01T00:00:00Z'
          }
        },
        error: null
      })),
      
      getSession: vi.fn(() => Promise.resolve({
        data: {
          session: {
            access_token: 'mock-access-token',
            user: {
              id: 'mock-user-id',
              email: 'test@example.com'
            }
          }
        },
        error: null
      })),
      
      signInWithPassword: vi.fn(({ email, password }) => {
        if (email === 'test@example.com' && password === 'password') {
          return Promise.resolve({
            data: {
              user: { id: 'mock-user-id', email },
              session: { access_token: 'mock-token' }
            },
            error: null
          });
        }
        
        return Promise.resolve({
          data: null,
          error: { message: 'Invalid credentials' }
        });
      }),
      
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    },
    
    // STORAGE (se necessario)
    storage: {
      from: vi.fn((bucket) => ({
        upload: vi.fn(() => Promise.resolve({
          data: { path: 'mock-file-path' },
          error: null
        })),
        
        download: vi.fn(() => Promise.resolve({
          data: new Blob(['mock file content']),
          error: null
        })),
        
        remove: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }
  };
  
  return supabaseMock;
}

/**
 * Helper per creare mock con dati specifici
 */
export function createSupabaseMockWithData(customData) {
  return createSupabaseMock(customData);
}

/**
 * Helper per creare mock con errori
 */
export function createSupabaseMockWithError(errorMessage = 'Database error') {
  const mock = createSupabaseMock();
  
  // Override from per restituire errori
  mock.from = vi.fn(() => ({
    select: vi.fn(() => ({
      then: vi.fn((callback) => callback({ data: null, error: { message: errorMessage } }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: { message: errorMessage } }))
      }))
    }))
  }));
  
  return mock;
}

/**
 * Reset mock data to original state
 */
export function resetSupabaseMockData() {
  // Reset to original data
  Object.assign(MOCK_DATA, {
    pazienti: [...MOCK_DATA.pazienti],
    reparti: [...MOCK_DATA.reparti],
    diagnosi: [...MOCK_DATA.diagnosi],
    reparto_diagnosi_compatibilita: [...MOCK_DATA.reparto_diagnosi_compatibilita]
  });
}
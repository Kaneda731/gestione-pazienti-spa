/**
 * Mock centralizzato per Supabase client
 */

import { vi } from 'vitest';

// Dati mock di test
export const mockPatients = [
  {
    id: 1,
    nome: 'Mario',
    cognome: 'Rossi',
    data_nascita: '1990-01-01',
    data_ricovero: '2024-01-01',
    diagnosi: 'Infarto',
    reparto_appartenenza: 'Cardiologia',
    data_dimissione: null,
    attivo: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    nome: 'Luigi',
    cognome: 'Bianchi',
    data_nascita: '1985-05-05',
    data_ricovero: '2024-01-02',
    diagnosi: 'Polmonite',
    reparto_appartenenza: 'Pneumologia',
    data_dimissione: null,
    attivo: true,
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z'
  }
];

// Mock Supabase client configurato
export const createMockSupabase = () => ({
  from: vi.fn((table) => {
    const mockQuery = {
      select: vi.fn((columns = '*') => mockQuery),
      insert: vi.fn((values) => mockQuery),
      update: vi.fn((values) => mockQuery),
      delete: vi.fn(() => mockQuery),
      eq: vi.fn((column, value) => mockQuery),
      neq: vi.fn((column, value) => mockQuery),
      like: vi.fn((column, pattern) => mockQuery),
      ilike: vi.fn((column, pattern) => mockQuery),
      order: vi.fn((column, options = {}) => mockQuery),
      range: vi.fn((from, to) => mockQuery),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      
      // Mock per query con paginazione
      limit: vi.fn((count) => mockQuery),
      offset: vi.fn((count) => mockQuery),
      
      // Mock per count
      count: vi.fn((option = 'exact') => mockQuery)
    };
    
    // Configurazione base per tabella patients
    if (table === 'patients') {
      mockQuery.select.mockImplementation((columns) => {
        if (columns.includes('count')) {
          return Promise.resolve({ 
            data: [{ count: mockPatients.length }], 
            error: null 
          });
        }
        return Promise.resolve({ 
          data: mockPatients, 
          error: null 
        });
      });
      
      mockQuery.insert.mockImplementation((values) => 
        Promise.resolve({ 
          data: [{ ...values, id: Date.now() }], 
          error: null 
        })
      );
      
      mockQuery.update.mockImplementation((values) => 
        Promise.resolve({ 
          data: [{ ...mockPatients[0], ...values }], 
          error: null 
        })
      );
      
      mockQuery.delete.mockImplementation(() => 
        Promise.resolve({ 
          data: [mockPatients[0]], 
          error: null 
        })
      );
    }
    
    return mockQuery;
  }),
  
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-123', email: 'test@example.com' } },
      error: null
    }))
  }
});

// Mock per errori
export const createMockSupabaseWithError = (errorMessage) => ({
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.reject(new Error(errorMessage))),
    insert: vi.fn(() => Promise.reject(new Error(errorMessage))),
    update: vi.fn(() => Promise.reject(new Error(errorMessage))),
    delete: vi.fn(() => Promise.reject(new Error(errorMessage))),
    eq: vi.fn(() => Promise.reject(new Error(errorMessage)))
  })),
  auth: {
    getUser: vi.fn(() => Promise.reject(new Error('Authentication failed')))
  }
});
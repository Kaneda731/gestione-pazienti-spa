// src/js/__mocks__/supabase.js

// Esporta un oggetto finto che simula il client Supabase.
// Per ora basta che esista per non far fallire i test.
export const supabase = {
  from: () => ({
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  }),
};

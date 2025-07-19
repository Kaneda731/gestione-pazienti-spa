// tests/auth.test.js
import { describe, it, expect } from 'vitest';
import { supabase } from '../src/core/services/supabaseClient';

describe('Auth Service', () => {
  it('dovrebbe essere inizializzato correttamente', () => {
    expect(supabase).toBeDefined();
  });
});

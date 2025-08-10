/**
 * Configurazione condivisa per Vite e Vitest
 * 
 * Questo file contiene le configurazioni comuni utilizzate sia da Vite che da Vitest
 * per evitare duplicazioni e mantenere coerenza.
 */

import { resolve } from 'path';

/**
 * Alias condivisi per la risoluzione dei moduli
 */
export const sharedAliases = {
  '@': resolve(process.cwd(), 'src'),
  '@tests': resolve(process.cwd(), '__tests__'),
  '@fixtures': resolve(process.cwd(), '__tests__/fixtures'),
  '@mocks': resolve(process.cwd(), '__tests__/mocks')
};

/**
 * Configurazione di risoluzione condivisa
 */
export const sharedResolve = {
  alias: sharedAliases
};
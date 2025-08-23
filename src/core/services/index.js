/**
 * Export centralizzato per i servizi core
 */

// Servizi di lookup per dati normalizzati
export { codiciDimissioneService } from './codiciDimissioneService.js';
export { repartiService } from './repartiService.js';
export { clinicheService } from './clinicheService.js';
export { lookupService } from './lookupService.js';
export { timezoneService } from './timezoneService.js';

// Altri servizi esistenti
export { logger } from './logger/loggerService.js';
export { roleService } from './auth/roleService.js';
export { navigationService } from './navigation/navigationService.js';
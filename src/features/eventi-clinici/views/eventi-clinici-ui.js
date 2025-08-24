// src/features/eventi-clinici/views/eventi-clinici-ui.js
// Barrel module per compatibilità durante refactoring

import { logger } from "../../../core/services/logger/loggerService.js";

// Re-export functions from modular components  
export * from './ui-modules/renderer.js';
export * from './ui-modules/forms.js';
export * from './ui-modules/filters.js';
export * from './ui-modules/state.js';

// Re-export per reset filtri dalla UI
export { resetCurrentFiltersToDefaults } from '../api/eventi-clinici-api.js';

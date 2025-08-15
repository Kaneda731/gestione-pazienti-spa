// src/features/eventi-clinici/views/EventiCliniciUtils.js

/**
 * @deprecated Questo file è deprecato. Importa dalle utilità modularizzate in `./utils/index.js`.
 * Rimane come compat layer per una release per evitare breaking changes.
 */

/**
 * Utility function per debouncing
 */
export { debounce } from './utils/debounce.js';

/**
 * Converte data da dd/mm/yyyy a yyyy-mm-dd
 */
export { convertDateToISO } from './utils/date.js';

/**
 * Nasconde tutti i risultati di ricerca
 */
export { hideAllSearchResults } from './utils/dom.js';

/**
 * Nasconde i risultati di ricerca per un container specifico
 */
export { hideSearchResults } from './utils/dom.js';

/**
 * Ottiene i dati dal form
 */
export { getFormData } from './utils/form.js';

/**
 * Valida i dati del form
 */
export { validateFormData } from './utils/form.js';
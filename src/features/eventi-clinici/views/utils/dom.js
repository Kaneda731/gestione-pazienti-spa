// src/features/eventi-clinici/views/utils/dom.js
// Implementazioni locali di utilità DOM per i risultati di ricerca

/**
 * Nasconde i risultati di ricerca per un container specifico
 * @param {string} containerId
 */
export function hideSearchResults(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.style.display = 'none';
  }
}

/**
 * Nasconde tutti i risultati di ricerca
 */
export function hideAllSearchResults() {
  hideSearchResults('patient-search-results');
  hideSearchResults('evento-patient-search-results');
}


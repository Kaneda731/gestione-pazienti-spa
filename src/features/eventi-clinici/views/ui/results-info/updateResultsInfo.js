// src/features/eventi-clinici/views/ui/results-info/updateResultsInfo.js
import { sanitizeHtml } from "../../../../../shared/utils/sanitizeHtml.js";

/**
 * Aggiorna l'elemento UI che mostra il conteggio dei risultati filtrati.
 * Crea il container se assente e lo posiziona prima della timeline.
 * Non dipende da stato interno: cerca il container timeline per id.
 *
 * @param {number} count - eventi filtrati
 * @param {number} totalCount - totale eventi
 * @param {Record<string, any>} filters - filtri attivi
 */
export function updateSearchResultsCount(count, totalCount, filters) {
  let resultsInfo = document.getElementById('search-results-info');

  if (!resultsInfo) {
    resultsInfo = document.createElement('div');
    resultsInfo.id = 'search-results-info';
    resultsInfo.className = 'search-results-info text-muted mb-3';

    const timelineContainer = document.getElementById('eventi-timeline-container');
    if (timelineContainer && timelineContainer.parentNode) {
      timelineContainer.parentNode.insertBefore(resultsInfo, timelineContainer);
    }
  }

  const hasActiveFilters = Object.values(filters || {}).some(value =>
    value && value.toString().trim() !== ''
  );

  if (hasActiveFilters) {
    resultsInfo.innerHTML = sanitizeHtml(`
      <span class="material-icons me-1">filter_list</span>
      Trovati <strong>${count}</strong> eventi su ${totalCount} totali
      ${filters.paziente_search ? `per "${sanitizeHtml(filters.paziente_search)}"` : ''}
    `);
    resultsInfo.style.display = 'block';
  } else if (resultsInfo) {
    resultsInfo.style.display = 'none';
  }
}

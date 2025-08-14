// src/features/eventi-clinici/views/filters/populateDepartmentFilter.js

/**
 * Popola il select dei reparti.
 * Funzione pura che opera su un elemento <select> passato dall'esterno.
 * Supporta sia CustomSelect (con `customSelectInstance`) che select standard.
 *
 * @param {HTMLSelectElement|null} selectEl - elemento select del filtro reparto
 * @param {string[]} reparti - elenco reparti
 * @param {import('../../../core/services/logger/loggerService.js').logger} logger - logger opzionale
 */
export async function populateDepartmentFilterCore(selectEl, reparti, logger) {
  if (!selectEl) {
    logger && logger.warn('⚠️ Elemento filterReparto non trovato');
    return;
  }

  try {
    const customSelectInstance = selectEl.customSelectInstance;

    if (customSelectInstance) {
      // CustomSelect
      logger && logger.log('🔧 Popolamento CustomSelect reparto con', reparti.length, 'opzioni');

      const firstOption = selectEl.querySelector('option[value=""]');
      selectEl.innerHTML = '';
      if (firstOption) selectEl.appendChild(firstOption);

      reparti.forEach((reparto) => {
        const option = document.createElement('option');
        option.value = reparto;
        option.textContent = reparto;
        selectEl.appendChild(option);
      });

      if (typeof customSelectInstance.updateOptions === 'function') {
        customSelectInstance.updateOptions();
        logger && logger.log('🔧 CustomSelect options updated');
      } else if (typeof customSelectInstance.refresh === 'function') {
        customSelectInstance.refresh();
        logger && logger.log('🔧 CustomSelect refreshed');
      }
    } else {
      // Select standard
      logger && logger.log('🔧 Popolamento select standard reparto con', reparti.length, 'opzioni');

      const firstOption = selectEl.querySelector('option[value=""]');
      selectEl.innerHTML = '';
      if (firstOption) selectEl.appendChild(firstOption);

      reparti.forEach((reparto) => {
        const option = document.createElement('option');
        option.value = reparto;
        option.textContent = reparto;
        selectEl.appendChild(option);
      });
    }

    logger && logger.log('✅ Filtro reparti popolato con', reparti.length, 'opzioni');
  } catch (error) {
    logger && logger.error('❌ Errore popolamento filtro reparti:', error);
  }
}

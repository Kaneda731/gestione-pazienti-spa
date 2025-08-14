// src/features/eventi-clinici/views/filters/populateTipoInterventoFilter.js

/**
 * Popola il select dei tipi di intervento.
 * Funzione pura che opera su un elemento <select> passato dall'esterno.
 * Supporta sia CustomSelect (con `customSelectInstance`) che select standard.
 *
 * @param {HTMLSelectElement|null} selectEl - elemento select del filtro tipo intervento
 * @param {string[]} tipiIntervento - elenco tipi di intervento
 * @param {import('../../../core/services/logger/loggerService.js').logger} logger - logger opzionale
 */
export async function populateTipoInterventoFilterCore(selectEl, tipiIntervento, logger) {
  if (!selectEl) {
    logger && logger.warn('⚠️ Elemento filterTipoIntervento non trovato');
    return;
  }

  try {
    const customSelectInstance = selectEl.customSelectInstance;

    if (customSelectInstance) {
      // CustomSelect
      logger && logger.log('🔧 Popolamento CustomSelect tipo intervento con', tipiIntervento.length, 'opzioni');

      const firstOption = selectEl.querySelector('option[value=""]');
      selectEl.innerHTML = '';
      if (firstOption) selectEl.appendChild(firstOption);

      tipiIntervento.forEach((tipo) => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
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
      logger && logger.log('🔧 Popolamento select standard tipo intervento con', tipiIntervento.length, 'opzioni');

      const firstOption = selectEl.querySelector('option[value=""]');
      selectEl.innerHTML = '';
      if (firstOption) selectEl.appendChild(firstOption);

      tipiIntervento.forEach((tipo) => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        selectEl.appendChild(option);
      });
    }

    logger && logger.log('✅ Filtro tipi di intervento popolato con', tipiIntervento.length, 'opzioni');
  } catch (error) {
    logger && logger.error('❌ Errore popolamento filtro tipi di intervento:', error);
  }
}

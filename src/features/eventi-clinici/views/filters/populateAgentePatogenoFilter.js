// src/features/eventi-clinici/views/filters/populateAgentePatogenoFilter.js

/**
 * Popola il select degli agenti patogeni.
 * Funzione pura che opera su un elemento <select> passato dall'esterno.
 * Supporta sia CustomSelect (con `customSelectInstance`) che select standard.
 *
 * @param {HTMLSelectElement|null} selectEl - elemento select del filtro agente patogeno
 * @param {string[]} agentiPatogeni - elenco agenti patogeni
 * @param {import('../../../core/services/logger/loggerService.js').logger} logger - logger opzionale
 */
export async function populateAgentePatogenoFilterCore(selectEl, agentiPatogeni, logger) {
  if (!selectEl) {
    logger && logger.warn('⚠️ Elemento filterAgentePatogeno non trovato');
    return;
  }

  try {
    const customSelectInstance = selectEl.customSelectInstance;

    if (customSelectInstance) {
      // CustomSelect
      logger && logger.log('🔧 Popolamento CustomSelect agente patogeno con', agentiPatogeni.length, 'opzioni');

      const firstOption = selectEl.querySelector('option[value=""]');
      selectEl.innerHTML = '';
      if (firstOption) selectEl.appendChild(firstOption);

      agentiPatogeni.forEach((agente) => {
        const option = document.createElement('option');
        option.value = agente;
        option.textContent = agente;
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
      logger && logger.log('🔧 Popolamento select standard agente patogeno con', agentiPatogeni.length, 'opzioni');

      const firstOption = selectEl.querySelector('option[value=""]');
      selectEl.innerHTML = '';
      if (firstOption) selectEl.appendChild(firstOption);

      agentiPatogeni.forEach((agente) => {
        const option = document.createElement('option');
        option.value = agente;
        option.textContent = agente;
        selectEl.appendChild(option);
      });
    }

    logger && logger.log('✅ Filtro agenti patogeni popolato con', agentiPatogeni.length, 'opzioni');
  } catch (error) {
    logger && logger.error('❌ Errore popolamento filtro agenti patogeni:', error);
  }
}

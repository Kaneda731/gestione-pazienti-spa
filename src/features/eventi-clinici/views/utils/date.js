// src/features/eventi-clinici/views/utils/date.js
// Implementazione locale: conversione data da dd/mm/yyyy a yyyy-mm-dd

/**
 * Converte una data nel formato gg/mm/aaaa al formato ISO yyyy-mm-dd.
 * Se la stringa è già in formato ISO valido, la restituisce invariata.
 *
 * @param {string} dateString
 * @returns {string|null}
 * @throws {Error} se il formato o i valori non sono validi
 */
export function convertDateToISO(dateString) {
  if (!dateString) {
    return null;
  }

  // Se è già in formato ISO, restituiscilo così com'è
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  if (!dateString.includes('/')) {
    throw new Error('Formato data non valido. Utilizzare il formato gg/mm/aaaa');
  }

  const parts = dateString.split('/');
  if (parts.length !== 3) {
    throw new Error('Formato data non valido. Utilizzare il formato gg/mm/aaaa');
  }

  const [day, month, year] = parts;

  // Validazione dei componenti della data
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
    throw new Error('Formato data non valido. Utilizzare numeri validi');
  }

  if (dayNum < 1 || dayNum > 31) {
    throw new Error('Giorno non valido (1-31)');
  }

  if (monthNum < 1 || monthNum > 12) {
    throw new Error('Mese non valido (1-12)');
  }

  if (yearNum < 1900 || yearNum > 2100) {
    throw new Error('Anno non valido');
  }

  // Crea un oggetto Date per validare ulteriormente la data
  const dateObj = new Date(yearNum, monthNum - 1, dayNum);
  if (
    dateObj.getDate() !== dayNum ||
    dateObj.getMonth() !== monthNum - 1 ||
    dateObj.getFullYear() !== yearNum
  ) {
    throw new Error('Data non valida (es. 31/02/2025)');
  }

  // Formatta sempre con zero padding
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');

  return `${year}-${paddedMonth}-${paddedDay}`;
}


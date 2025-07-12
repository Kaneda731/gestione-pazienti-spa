// src/shared/components/forms/Datepicker.js
import { Datepicker } from 'vanillajs-datepicker';
import '../../../../node_modules/vanillajs-datepicker/dist/css/datepicker-bs5.min.css'; // Stile per Bootstrap 5

/**
 * Inizializza tutti gli input con l'attributo [data-datepicker] in modo asincrono,
 * gestendo correttamente il caricamento delle localizzazioni.
 * @param {HTMLElement} container - Il contenitore in cui cercare i datepicker (opzionale, default: document)
 */
export async function initDatepickers(container = document) {
    // 1. Rendi la classe Datepicker disponibile globalmente
    window.Datepicker = Datepicker;

    // 2. Usa un import dinamico per caricare la lingua DOPO che window.Datepicker è stato impostato.
    // Questo garantisce il corretto ordine di esecuzione.
    try {
        await import('../../../../node_modules/vanillajs-datepicker/dist/js/locales/it.js');
    } catch (e) {
        console.error("Errore durante il caricamento della localizzazione del datepicker:", e);
    }

    // 3. Ora che la lingua è caricata, inizializza i componenti
    const datepickerElements = container.querySelectorAll('input[data-datepicker]');
    
    datepickerElements.forEach(el => {
        // Previene la doppia inizializzazione
        if (el.datepicker) {
            return;
        }

        new Datepicker(el, {
            // Opzioni di configurazione
            format: 'dd/mm/yyyy',
            language: 'it',
            autohide: true,
            todayHighlight: true,
            buttonClass: 'btn',
            weekStart: 1, // La settimana inizia di Lunedì
        });
    });
}

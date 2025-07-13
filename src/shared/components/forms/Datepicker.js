// src/shared/components/forms/Datepicker.js
import flatpickr from 'flatpickr';
import { Italian } from 'flatpickr/dist/l10n/it.js';

// Importa il tema di default di Flatpickr. È pulito e funzionante.
import 'flatpickr/dist/flatpickr.min.css';

/**
 * Inizializza tutti gli input con l'attributo [data-datepicker] usando Flatpickr.
 * @param {HTMLElement} container - Il contenitore in cui cercare i datepicker.
 */
export function initDatepickers(container = document) {
    const datepickerElements = container.querySelectorAll('input[data-datepicker]');

    datepickerElements.forEach(el => {
        if (el._flatpickr) return; // Già inizializzato

        flatpickr(el, {
            locale: Italian,
            dateFormat: "d/m/Y",
            allowInput: true, // Permette di scrivere la data a mano
        });
    });
}
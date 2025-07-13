// src/shared/components/forms/Datepicker.js
import flatpickr from 'flatpickr';
import { Italian } from 'flatpickr/dist/l10n/it.js';

// Importa il tema di default di Flatpickr
import 'flatpickr/dist/flatpickr.min.css';

// Variabile per tracciare i CSS tematizzati caricati
let themeStylesheets = {
    light: null,
    dark: null
};

/**
 * Carica dinamicamente i CSS per i temi Flatpickr
 */
function loadThemeCSS() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    
    // Rimuovi i CSS del tema precedente se esistono
    Object.values(themeStylesheets).forEach(link => {
        if (link && link.parentNode) {
            link.parentNode.removeChild(link);
        }
    });
    
    // Resetta i riferimenti
    themeStylesheets.light = null;
    themeStylesheets.dark = null;
    
    // Carica il CSS appropriato per il tema corrente
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = currentTheme === 'dark' 
        ? '/src/css/modules/components/flatpickr-dark.scss'
        : '/src/css/modules/components/flatpickr-light.scss';
    
    document.head.appendChild(link);
    themeStylesheets[currentTheme] = link;
}

/**
 * Osserva i cambiamenti del tema e aggiorna i CSS Flatpickr di conseguenza
 */
function observeThemeChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-bs-theme') {
                loadThemeCSS();
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme']
    });
}

/**
 * Inizializza tutti gli input con l'attributo [data-datepicker] usando Flatpickr.
 * @param {HTMLElement} container - Il contenitore in cui cercare i datepicker.
 */
export function initDatepickers(container = document) {
    // Carica i CSS del tema al primo avvio
    loadThemeCSS();
    
    // Imposta l'observer per i cambiamenti del tema (solo una volta)
    if (!window.flatpickrThemeObserverInitialized) {
        observeThemeChanges();
        window.flatpickrThemeObserverInitialized = true;
    }
    
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
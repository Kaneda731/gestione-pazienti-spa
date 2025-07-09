// src/shared/utils/dom.js

/**
 * Utilities per manipolazione DOM
 */

/**
 * Seleziona un elemento dal DOM
 * @param {string} selector - Selettore CSS
 * @param {Element} context - Contesto di ricerca (default: document)
 * @returns {Element|null} Elemento trovato
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Seleziona tutti gli elementi dal DOM
 * @param {string} selector - Selettore CSS
 * @param {Element} context - Contesto di ricerca (default: document)
 * @returns {NodeList} Lista di elementi
 */
export function $$(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * Crea un elemento DOM
 * @param {string} tag - Tag dell'elemento
 * @param {Object} attributes - Attributi dell'elemento
 * @param {string} content - Contenuto dell'elemento
 * @returns {Element} Elemento creato
 */
export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    if (content) {
        element.innerHTML = content;
    }
    
    return element;
}

/**
 * Rimuove tutti i figli di un elemento
 * @param {Element} element - Elemento da svuotare
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Nasconde un elemento
 * @param {Element} element - Elemento da nascondere
 */
export function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Mostra un elemento
 * @param {Element} element - Elemento da mostrare
 * @param {string} display - Tipo di display (default: 'block')
 */
export function showElement(element, display = 'block') {
    if (element) {
        element.style.display = display;
    }
}

/**
 * Verifica se un elemento è visibile
 * @param {Element} element - Elemento da verificare
 * @returns {boolean} True se visibile
 */
export function isVisible(element) {
    return element && element.offsetParent !== null;
}

/**
 * Aggiunge una classe CSS a un elemento
 * @param {Element} element - Elemento
 * @param {string} className - Nome della classe
 */
export function addClass(element, className) {
    if (element && className) {
        element.classList.add(className);
    }
}

/**
 * Rimuove una classe CSS da un elemento
 * @param {Element} element - Elemento
 * @param {string} className - Nome della classe
 */
export function removeClass(element, className) {
    if (element && className) {
        element.classList.remove(className);
    }
}

/**
 * Verifica se un elemento ha una classe CSS
 * @param {Element} element - Elemento
 * @param {string} className - Nome della classe
 * @returns {boolean} True se ha la classe
 */
export function hasClass(element, className) {
    return element && element.classList.contains(className);
}

/**
 * Attende che il DOM sia pronto
 * @returns {Promise} Promise che si risolve quando il DOM è pronto
 */
export function ready() {
    return new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
}

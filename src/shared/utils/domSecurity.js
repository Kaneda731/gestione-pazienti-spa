/**
 * Utility per gestione sicura del DOM
 * Previene vulnerabilità XSS evitando innerHTML non sicuro
 */

/**
 * Imposta il contenuto di un elemento in modo sicuro usando textContent
 * @param {HTMLElement} element - Elemento di destinazione
 * @param {string} text - Testo da inserire
 */
export function setTextContent(element, text) {
    element.textContent = text || '';
}

/**
 * Imposta HTML sanitizzato in un elemento
 * @param {HTMLElement} element - Elemento di destinazione
 * @param {string} html - HTML da sanitizzare e inserire
 */
export function setSafeHTML(element, html) {
    let sanitizedHTML = html;
    
    // Usa DOMPurify se disponibile
    if (window.DOMPurify) {
        sanitizedHTML = window.DOMPurify.sanitize(html);
    }
    
    element.innerHTML = sanitizedHTML;
}

/**
 * Crea un elemento con testo sicuro
 * @param {string} tagName - Nome del tag
 * @param {string} textContent - Contenuto testuale
 * @param {string} className - Classe CSS opzionale
 * @returns {HTMLElement} - Elemento creato
 */
export function createElement(tagName, textContent = '', className = '') {
    const element = document.createElement(tagName);
    
    if (className) {
        element.className = className;
    }
    
    if (textContent) {
        element.textContent = textContent;
    }
    
    return element;
}

/**
 * Crea un elemento alert Bootstrap sicuro
 * @param {string} message - Messaggio da mostrare
 * @param {string} type - Tipo di alert (danger, success, warning, info)
 * @returns {HTMLElement} - Elemento alert
 */
export function createAlert(message, type = 'danger') {
    const alert = createElement('div', '', `alert alert-${type}`);
    
    if (type === 'danger') {
        const strong = createElement('strong', 'Errore:');
        alert.appendChild(strong);
        alert.appendChild(document.createTextNode(' ' + message));
    } else {
        alert.textContent = message;
    }
    
    return alert;
}

/**
 * Sostituisce tutto il contenuto di un container con un nuovo elemento
 * @param {HTMLElement} container - Container di destinazione
 * @param {HTMLElement} newElement - Nuovo elemento da inserire
 */
export function replaceContent(container, newElement) {
    container.innerHTML = '';
    container.appendChild(newElement);
}

/**
 * Mostra un messaggio di caricamento sicuro
 * @param {HTMLElement} container - Container dove mostrare il loading
 */
export function showLoading(container) {
    const loadingDiv = createElement('div', '', 'd-flex justify-content-center align-items-center h-100');
    const spinner = createElement('div', '', 'spinner-border text-primary');
    
    loadingDiv.appendChild(spinner);
    replaceContent(container, loadingDiv);
}

/**
 * Mostra un messaggio di errore sicuro
 * @param {HTMLElement} container - Container dove mostrare l'errore
 * @param {string} message - Messaggio di errore
 */
export function showError(container, message) {
    const alert = createAlert(message, 'danger');
    replaceContent(container, alert);
}

/**
 * Mostra un messaggio generico sicuro
 * @param {HTMLElement} container - Container dove mostrare il messaggio
 * @param {string} message - Messaggio da mostrare
 * @param {string} className - Classe CSS per il messaggio
 */
export function showMessage(container, message, className = 'text-muted') {
    const p = createElement('p', message, `${className} text-center mt-5`);
    replaceContent(container, p);
}

/**
 * Sanitizza HTML per prevenire attacchi XSS
 * @param {string} html - HTML da sanitizzare
 * @returns {string} - HTML sanitizzato
 */
export function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // Usa DOMPurify se disponibile
    if (window.DOMPurify) {
        return window.DOMPurify.sanitize(html);
    }

    // Fallback: rimuove i tag script e gestisce caratteri pericolosi
    let sanitized = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/<link\b[^>]*>/gi, '')
        .replace(/<meta\b[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');

    // Rimuove attributi potenzialmente pericolosi
    sanitized = sanitized.replace(/\s*(on\w+|javascript|vbscript|data|href)\s*=\s*["'][^"']*["']/gi, '');

    return sanitized;
}
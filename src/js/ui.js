// src/js/ui.js

// --- ELEMENTI DOM GLOBALI ---
export const authContainer = document.getElementById('auth-container');

// Controllo di sicurezza per gli elementi DOM
if (!authContainer) {
    console.error('Elemento auth-container non trovato nel DOM');
}

// --- TEMPLATES GLOBALI (per Auth) ---
export const templates = {
    login: document.getElementById('auth-login'),
    logout: document.getElementById('auth-logout'),
};

// Controllo di sicurezza per i templates
Object.keys(templates).forEach(key => {
    if (!templates[key]) {
        console.warn(`Template '${key}' non trovato nel DOM`);
    }
});

/**
 * Mostra un messaggio all'utente in un contenitore specifico.
 * @param {string} message - Il testo del messaggio.
 * @param {string} type - Il tipo di messaggio ('success', 'error', 'info').
 * @param {string} containerId - L'ID del contenitore del messaggio.
 */
export function mostraMessaggio(message, type = 'info', containerId = 'messaggio-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alertType = type === 'error' ? 'danger' : type; // Bootstrap usa 'danger' per gli errori
    const icon = {
        success: 'check_circle',
        error: 'error',
        info: 'info'
    }[type];

    container.innerHTML = `
        <div class="alert alert-${alertType} d-flex align-items-center" role="alert">
            <span class="material-icons me-2">${icon}</span>
            <div>${message}</div>
        </div>
    `;
}


/**
 * Mostra un loader/spinner in un contenitore specifico.
 * @param {string} containerId - L'ID del contenitore dove mostrare il loader.
 */
export function showLoader(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Caricamento...</span>
            </div>
        </div>
    `;
}

/**
 * Nasconde il loader da un contenitore specifico.
 * @param {string} containerId - L'ID del contenitore da cui nascondere il loader.
 */
export function hideLoader(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Gestisce lo stato di caricamento di un pulsante.
 * @param {string} buttonId - L'ID del pulsante.
 * @param {boolean} isLoading - True per mostrare lo stato di caricamento, false per rimuoverlo.
 */
export function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Attendere...
        `;
    } else {
        button.disabled = false;
        // Ripristina il testo originale (salvato in un attributo data)
        button.innerHTML = button.dataset.originalText || 'Azione';
    }
}

/**
 * Inizializza il testo originale di un pulsante per il ripristino dopo il loading.
 * @param {string} buttonId - L'ID del pulsante.
 */
export function initButtonText(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.dataset.originalText = button.innerHTML;
    }
}

/**
 * Gestisce la visibilità di un elemento.
 * @param {string} elementId - L'ID dell'elemento.
 * @param {boolean} isVisible - True per mostrare, false per nascondere.
 */
export function setElementVisibility(elementId, isVisible) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = isVisible ? '' : 'none';
    }
}

/**
 * Abilita o disabilita un form intero.
 * @param {string} formId - L'ID del form.
 * @param {boolean} isEnabled - True per abilitare, false per disabilitare.
 */
export function setFormEnabled(formId, isEnabled) {
    const form = document.getElementById(formId);
    if (!form) return;

    const elements = form.elements;
    for (let i = 0; i < elements.length; i++) {
        elements[i].disabled = !isEnabled;
    }
}

/**
 * Funzione di utilità per prevenire il comportamento di default e la propagazione di un evento.
 * @param {Event} e - L'oggetto evento.
 */
export function preventDefaultAndStopPropagation(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Aggiunge un listener per un evento "once" (eseguito una sola volta).
 * @param {EventTarget} element - L'elemento a cui aggiungere il listener.
 * @param {string} eventType - Il tipo di evento.
 * @param {Function} listener - La funzione da eseguire.
 */
export function addEventListenerOnce(element, eventType, listener) {
    element.addEventListener(eventType, listener, { once: true });
}

/**

 * Gestisce lo scroll della pagina per evitare "layout shift" quando si aprono modali.
 * @param {boolean} lock - True per bloccare lo scroll, false per sbloccarlo.
 */
export function lockBodyScroll(lock) {
    const body = document.body;
    if (lock) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        body.style.overflow = 'hidden';
        body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
        body.style.overflow = '';
        body.style.paddingRight = '';
    }
}


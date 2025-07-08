/**
 * ===================================
 * GESTORE UTILITY CARD MOBILE
 * ===================================
 * 
 * Questo modulo fornisce funzioni di utilità per migliorare
 * l'interazione con le card su dispositivi mobili.
 * 
 * Funzionalità incluse:
 * - Feedback tattile (vibrazione) al tocco.
 * - Gestione interazione utente per attivare funzionalità sensibili (es. vibrazione).
 * - Effetto "ripple" al click.
 * - Gestione stati di caricamento.
 * - Funzioni per cambiare layout dinamicamente.
 */

// Traccia se l'utente ha già interagito con la pagina per la vibrazione
let userHasInteracted = false;

/**
 * Inizializza il tracciamento della prima interazione utente.
 * Necessario per far funzionare la vibrazione, che richiede un'attivazione esplicita.
 */
export function initUserInteractionTracking() {
    if (userHasInteracted) return;

    const trackInteraction = () => {
        userHasInteracted = true;
        document.removeEventListener('touchstart', trackInteraction);
        document.removeEventListener('click', trackInteraction);
    };

    document.addEventListener('touchstart', trackInteraction, { once: true, passive: true });
    document.addEventListener('click', trackInteraction, { once: true, passive: true });
}

/**
 * Aggiunge un effetto "ripple" a un elemento card.
 * @param {HTMLElement} cardElement - L'elemento card a cui aggiungere l'effetto.
 * @param {MouseEvent|TouchEvent} event - L'evento che ha scatenato l'effetto.
 */
export function addRippleEffect(cardElement, event) {
    const rect = cardElement.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    cardElement.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

/**
 * Gestisce lo stato di caricamento di una card, mostrando/nascondendo un overlay.
 * @param {HTMLElement} cardElement - L'elemento card.
 * @param {boolean} isLoading - True per mostrare lo stato di caricamento, false per rimuoverlo.
 */
export function setLoadingState(cardElement, isLoading) {
    if (isLoading) {
        cardElement.classList.add('loading');
    } else {
        cardElement.classList.remove('loading');
    }
}

/**
 * Cambia dinamicamente il layout di un contenitore di card.
 * @param {HTMLElement} container - Il contenitore delle card.
 * @param {'horizontal' | 'grid' | 'compact' | 'scroll'} layoutType - Il tipo di layout da applicare.
 */
export function switchToLayout(container, layoutType) {
    const cards = container.querySelectorAll('.card');

    // Rimuovi classi di layout esistenti
    cards.forEach(card => {
        card.classList.remove('card-horizontal', 'card-list-compact');
    });
    container.classList.remove('cards-grid-mobile', 'cards-scroll-container');

    // Applica il nuovo layout
    switch (layoutType) {
        case 'horizontal':
            cards.forEach(card => card.classList.add('card-horizontal'));
            break;
        case 'grid':
            container.classList.add('cards-grid-mobile');
            break;
        case 'compact':
            cards.forEach(card => card.classList.add('card-list-compact'));
            break;
        case 'scroll':
            // Nota: per lo scroll layout, il wrapper potrebbe essere necessario esternamente
            container.classList.add('cards-scroll-container');
            break;
    }
}

/**
 * Inizializza le ottimizzazioni per il tocco sulle card, come la vibrazione.
 */
export function initTouchOptimizations() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('touchstart', (e) => {
            // Evita di attivare la vibrazione su elementi interattivi interni
            if (e.target.closest('button, a, input, select, .custom-select-wrapper')) {
                return;
            }

            try {
                if ('vibrate' in navigator && userHasInteracted) {
                    navigator.vibrate(10); // Vibrazione leggera di feedback
                }
            } catch (err) {
                console.debug('Vibrazione non disponibile o bloccata.', err.message);
            }
        }, { passive: true });
    });
}

/**
 * Funzione di inizializzazione globale per il modulo.
 * Da chiamare una sola volta al caricamento della pagina.
 */
function initializeMobileCardManager() {
    if (window.innerWidth > 767) return;

    document.addEventListener('DOMContentLoaded', () => {
        initUserInteractionTracking();
        initTouchOptimizations();

        // Esempio di gestione resize per layout responsivo
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 480) {
                document.querySelectorAll('.cards-grid-mobile').forEach(grid => {
                    // Adatta la griglia per schermi molto piccoli
                    grid.style.gridTemplateColumns = '1fr';
                });
            } else {
                 document.querySelectorAll('.cards-grid-mobile').forEach(grid => {
                    // Ripristina layout griglia
                    grid.style.gridTemplateColumns = ''; 
                });
            }
        }, { passive: true });
    });
}

// Auto-inizializzazione
initializeMobileCardManager();
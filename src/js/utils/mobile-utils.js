// src/js/utils/mobile-utils.js
// Utility functions specifiche per dispositivi mobili

/**
 * Rileva se siamo su dispositivo mobile
 */
export function isMobileDevice() {
    return window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Rileva se siamo su iOS
 */
export function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Rileva se siamo su Android
 */
export function isAndroidDevice() {
    return /Android/.test(navigator.userAgent);
}

/**
 * Ottimizza il viewport per mobile quando si apre un modal
 */
export function optimizeModalForMobile() {
    if (!isMobileDevice()) return;
    
    // Salva la posizione di scroll corrente
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    sessionStorage.setItem('modal.scroll.position', scrollTop.toString());
    
    // Prevent body scroll su mobile
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollTop}px`;
    document.body.style.width = '100%';
    
    // Aggiungi meta viewport specifico per il modal se necessario
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        sessionStorage.setItem('modal.original.viewport', viewport.content);
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
}

/**
 * Ripristina le impostazioni mobile quando si chiude un modal
 */
export function restoreMobileSettings() {
    if (!isMobileDevice()) return;
    
    // Ripristina body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // Ripristina posizione scroll
    const savedScrollTop = sessionStorage.getItem('modal.scroll.position');
    if (savedScrollTop) {
        window.scrollTo(0, parseInt(savedScrollTop, 10));
        sessionStorage.removeItem('modal.scroll.position');
    }
    
    // Ripristina viewport originale
    const originalViewport = sessionStorage.getItem('modal.original.viewport');
    if (originalViewport) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = originalViewport;
        }
        sessionStorage.removeItem('modal.original.viewport');
    }
}

/**
 * Gestisce il focus su mobile per migliore accessibilità
 */
export function manageMobileFocus(modal) {
    if (!isMobileDevice()) return;
    
    // Imposta focus sul primo campo input quando il modal è mostrato
    const firstInput = modal.querySelector('input[type="email"], input[type="text"], input[type="password"]');
    if (firstInput) {
        // Delay per permettere al modal di essere completamente renderizzato
        setTimeout(() => {
            firstInput.focus();
            firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}

/**
 * Gestisce il gesture di swipe per chiudere il modal
 */
export function handleSwipeGesture(modal, startY, endY) {
    const swipeThreshold = 100; // pixel
    const swipeDistance = startY - endY;
    
    // Swipe down per chiudere (solo se siamo nella parte superiore del modal)
    if (swipeDistance < -swipeThreshold) {
        const modalContent = modal.querySelector('.modal-content');
        const scrollTop = modalContent.scrollTop;
        
        // Chiudi solo se siamo in cima al modal
        if (scrollTop <= 10) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }
}

/**
 * Aggiunge gestione touch eventi per un modal
 */
export function addMobileTouchHandlers(modal) {
    if (!isMobileDevice() || !modal) return;
    
    modal.addEventListener('touchstart', (e) => {
        // Previeni il bounce scroll su iOS
        if (e.target.closest('.modal-content')) {
            e.stopPropagation();
        }
    });
    
    // Gestione swipe
    let touchStartY = 0;
    let touchEndY = 0;
    
    modal.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    });
    
    modal.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture(modal, touchStartY, touchEndY);
    });
}

/**
 * Previene il doppio tap zoom su elementi specifici
 */
export function preventDoubleTapZoom(element) {
    if (!element) return;
    
    let lastTouchEnd = 0;
    element.addEventListener('touchend', (e) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

/**
 * Ottimizza un form per mobile
 */
export function optimizeFormForMobile(form) {
    if (!isMobileDevice() || !form) return;
    
    // Trova tutti gli input email/password/text
    const inputs = form.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    
    inputs.forEach(input => {
        // Imposta font-size 16px per prevenire zoom iOS
        input.style.fontSize = '16px';
        
        // Aggiungi attributi per mobile
        input.setAttribute('autocapitalize', 'none');
        input.setAttribute('autocorrect', 'off');
        
        // Per input email
        if (input.type === 'email') {
            input.setAttribute('inputmode', 'email');
        }
        
        // Per input password
        if (input.type === 'password') {
            input.setAttribute('autocomplete', input.name || 'current-password');
        }
    });
    
    // Ottimizza i pulsanti
    const buttons = form.querySelectorAll('button');
    buttons.forEach(button => {
        preventDoubleTapZoom(button);
    });
}

/**
 * Gestisce la tastiera virtuale su mobile
 */
export function handleVirtualKeyboard() {
    if (!isMobileDevice()) return;
    
    // Rileva quando la tastiera virtuale si apre/chiude
    let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    
    function handleViewportChange() {
        const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        
        // Se la differenza è significativa, probabilmente la tastiera è aperta
        if (heightDifference > 150) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
    }
    
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
        window.addEventListener('resize', handleViewportChange);
    }
}

/**
 * Inizializza le ottimizzazioni mobile globali
 */
export function initMobileOptimizations() {
    if (!isMobileDevice()) return;
    
    // Gestisci tastiera virtuale
    handleVirtualKeyboard();
    
    // Aggiungi classe mobile al body
    document.body.classList.add('mobile-device');
    
    // Aggiungi classe specifica per iOS/Android
    if (isIOSDevice()) {
        document.body.classList.add('ios-device');
    } else if (isAndroidDevice()) {
        document.body.classList.add('android-device');
    }
    
    // Previeni bounce scroll globale su iOS
    if (isIOSDevice()) {
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.modal-content, .scrollable')) {
                return;
            }
            e.preventDefault();
        }, { passive: false });
    }
}

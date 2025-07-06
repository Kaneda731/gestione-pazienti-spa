/**
 * CustomSelect - Componente per dropdown personalizzati
 * Risolve i problemi di styling dei dropdown nativi del browser
 * v2.1.0 - Con gestione errori migliorata
 */

class CustomSelect {
    constructor(selectElement, options = {}) {
        this.selectElement = selectElement;
        this.options = {
            placeholder: 'Seleziona...',
            searchable: false,
            ...options
        };
        
        this.isOpen = false;
        this.selectedValue = '';
        this.selectedText = '';
        this.mobileModal = null;
        this.mobileOverlayHandler = null;
        
        try {
            this.init();
            window.appLogger?.debug('CustomSelect inizializzato', { element: selectElement.id || 'unnamed' });
        } catch (error) {
            window.appLogger?.error('Errore inizializzazione CustomSelect', error);
            throw error;
        }
    }
    
    init() {
        // Nascondi la select originale
        this.selectElement.style.display = 'none';
        
        // Crea il wrapper custom
        this.wrapper = this.createWrapper();
        this.selectElement.parentNode.insertBefore(this.wrapper, this.selectElement);
        
        // Popola le opzioni
        this.populateOptions();
        
        // Aggiungi event listeners
        this.bindEvents();
        
        // Imposta il valore iniziale se presente
        if (this.selectElement.value) {
            this.setValue(this.selectElement.value);
        }
    }
    
    createWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        wrapper.innerHTML = `
            <div class="custom-select-trigger">
                <span class="custom-select-label">${this.options.placeholder}</span>
                <span class="custom-select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            </div>
            <div class="custom-select-dropdown">
                <div class="custom-select-options"></div>
            </div>
        `;
        return wrapper;
    }
    
    populateOptions() {
        const optionsContainer = this.wrapper.querySelector('.custom-select-options');
        const selectOptions = this.selectElement.querySelectorAll('option');
        
        optionsContainer.innerHTML = '';
        
        let validOptionsCount = 0;
        selectOptions.forEach(option => {
            if (option.value === '') return; // Skip placeholder option
            validOptionsCount++;
            
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-select-option';
            optionElement.dataset.value = option.value;
            optionElement.textContent = option.textContent;
            
            // Gestione click opzioni - funziona sempre TRANNE quando siamo nel modal mobile
            optionElement.addEventListener('click', (e) => {
                // Blocca solo se il modal mobile è effettivamente attivo
                if (this.mobileModal) {
                    return; // Non fare nulla, lascia gestire al modal mobile
                }
                
                // Altrimenti funziona normalmente (desktop o mobile dropdown normale)
                this.selectOption(option.value, option.textContent);
            });
            
            optionsContainer.appendChild(optionElement);
        });
        
        // Aggiungi indicatore se ci sono molte opzioni (più di 4)
        if (validOptionsCount > 4) {
            this.addScrollIndicator();
        }
    }
    
    bindEvents() {
        const trigger = this.wrapper.querySelector('.custom-select-trigger');
        const dropdown = this.wrapper.querySelector('.custom-select-dropdown');
        
        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            window.appLogger?.debug('CustomSelect trigger clicked', { 
                isOpen: this.isOpen, 
                selectId: this.selectElement.id,
                isMobile: window.innerWidth <= 767 
            });
            this.toggle();
        });
        
        // Close on outside click/touch - usa listener specifici per questa istanza
        this.outsideClickHandler = (e) => {
            if (!this.wrapper.contains(e.target) && !this.mobileModal?.contains(e.target)) {
                this.close();
            }
        };
        
        this.outsideTouchHandler = (e) => {
            // Su mobile, chiudi solo se tocchi fuori E non è il primo touch dell'apertura
            if (this.isOpen && !this.wrapper.contains(e.target) && !this.mobileModal?.contains(e.target)) {
                // Aggiungi un piccolo delay per evitare chiusure immediate
                setTimeout(() => {
                    if (this.isOpen) {
                        this.close();
                    }
                }, 50);
            }
        };
        
        document.addEventListener('click', this.outsideClickHandler);
        document.addEventListener('touchstart', this.outsideTouchHandler, { passive: true });
        
        // Keyboard navigation
        this.wrapper.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Make focusable
        this.wrapper.setAttribute('tabindex', '0');
    }
    
    handleKeyboard(e) {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.toggle();
                break;
            case 'Escape':
                this.close();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (this.isOpen) {
                    this.navigateOptions(1);
                } else {
                    this.open();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (this.isOpen) {
                    this.navigateOptions(-1);
                }
                break;
        }
    }
    
    navigateOptions(direction) {
        const options = this.wrapper.querySelectorAll('.custom-select-option');
        const currentFocused = this.wrapper.querySelector('.custom-select-option.focused');
        let nextIndex = 0;
        
        if (currentFocused) {
            const currentIndex = Array.from(options).indexOf(currentFocused);
            nextIndex = currentIndex + direction;
            currentFocused.classList.remove('focused');
        }
        
        if (nextIndex < 0) nextIndex = options.length - 1;
        if (nextIndex >= options.length) nextIndex = 0;
        
        if (options[nextIndex]) {
            options[nextIndex].classList.add('focused');
            options[nextIndex].scrollIntoView({ block: 'nearest' });
        }
    }
    
    selectOption(value, text) {
        this.selectedValue = value;
        this.selectedText = text;
        
        // Aggiorna l'interfaccia
        const label = this.wrapper.querySelector('.custom-select-label');
        if (label) {
            label.textContent = text;
        }
        
        // Aggiorna la select originale
        this.selectElement.value = value;
        
        // Dispatch change event
        const changeEvent = new Event('change', { bubbles: true });
        this.selectElement.dispatchEvent(changeEvent);
        
        // Rimuovi focus da tutte le opzioni desktop
        this.wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('focused');
        });
        
        // Chiudi solo se non siamo in modalità mobile modal
        if (!this.mobileModal) {
            this.close();
        }
    }
    
    setValue(value) {
        const option = this.selectElement.querySelector(`option[value="${value}"]`);
        if (option) {
            this.selectOption(value, option.textContent);
        }
    }
    
    open() {
        window.appLogger?.debug('CustomSelect opening', { 
            selectId: this.selectElement.id, 
            isMobile: window.innerWidth <= 767,
            currentState: this.isOpen 
        });
        
        this.isOpen = true;
        this.wrapper.classList.add('open');
        
        // Su mobile usa sempre il modal mobile per migliore UX
        // Su desktop usa il dropdown normale
        if (window.innerWidth <= 767) {
            this.disableOtherCustomSelects();
            this.createMobileModal();
        } else {
            // Desktop: dropdown normale
            this.wrapper.querySelector('.custom-select-dropdown').style.display = 'block';
            
            // Forza overflow visibile sui contenitori parent per risolvere problemi di clipping
            this.forceOverflowVisible();
            
            // Focus sul primo elemento se nessuno è selezionato
            if (this.selectedValue === '') {
                const firstOption = this.wrapper.querySelector('.custom-select-option');
                if (firstOption) {
                    firstOption.classList.add('focused');
                }
            }
        }
    }
    
    disableOtherCustomSelects() {
        // Disabilita temporaneamente tutti gli altri custom select per evitare interferenze
        const allCustomSelects = document.querySelectorAll('.custom-select-wrapper');
        allCustomSelects.forEach(select => {
            if (select !== this.wrapper) {
                select.style.pointerEvents = 'none';
            }
        });
    }
    
    enableOtherCustomSelects() {
        // Riabilita tutti i custom select
        const allCustomSelects = document.querySelectorAll('.custom-select-wrapper');
        allCustomSelects.forEach(select => {
            select.style.pointerEvents = 'auto';
        });
    }

    createMobileModal() {
        // Rimuovi modal esistente se presente
        this.removeMobileModal();
        
        // Crea modal come elemento completamente esterno al form
        this.mobileModal = document.createElement('div');
        this.mobileModal.className = 'custom-select-mobile-modal';
        
        // Genera HTML delle opzioni
        const optionsHTML = this.getMobileOptionsHTML();
        
        this.mobileModal.innerHTML = `
            <div class="custom-select-mobile-overlay"></div>
            <div class="custom-select-mobile-content">
                <div class="custom-select-mobile-header">
                    <h3>Seleziona ${this.selectElement.getAttribute('data-label') || 'Opzione'}</h3>
                    <button type="button" class="custom-select-mobile-close">✕</button>
                </div>
                <div class="custom-select-mobile-options">
                    ${optionsHTML}
                </div>
            </div>
        `;
        
        // Inserisci direttamente nel body (completamente esterno al form)
        document.body.appendChild(this.mobileModal);
        
        // Aggiungi classe al body per nascondere scroll e bloccare interazioni
        document.body.classList.add('custom-select-modal-open');
        
        // Aggiungi listener globale per bloccare tutti i click esterni al modal
        this.addGlobalClickBlocker();
        
        // Bind eventi
        this.bindMobileModalEvents();
        
        // Mostra il modal con delay per evitare conflitti
        setTimeout(() => {
            this.mobileModal.classList.add('show');
        }, 10);
    }
    
    getMobileOptionsHTML() {
        const selectOptions = this.selectElement.querySelectorAll('option');
        let html = '';
        
        selectOptions.forEach(option => {
            if (option.value === '') return; // Skip placeholder
            
            const isSelected = option.value === this.selectedValue;
            const selectedClass = isSelected ? ' selected' : '';
            
            html += `
                <div class="custom-select-mobile-option${selectedClass}" data-value="${option.value}">
                    ${option.textContent}
                </div>
            `;
        });
        
        return html;
    }
    
    bindMobileModalEvents() {
        const closeBtn = this.mobileModal.querySelector('.custom-select-mobile-close');
        const overlay = this.mobileModal.querySelector('.custom-select-mobile-overlay');
        const content = this.mobileModal.querySelector('.custom-select-mobile-content');
        const optionsContainer = this.mobileModal.querySelector('.custom-select-mobile-options');
        const options = this.mobileModal.querySelectorAll('.custom-select-mobile-option');
        
        // Variabili per tracciare il touch e distinguere tap da scroll
        let touchStartData = null;
        
        // Chiudi con X - protezione da interferenze
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.close();
        }, { capture: true });
        
        // Protezione touch per la X
        closeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.close();
        }, { capture: true, passive: false });
        
        // SOLUZIONE: Overlay chiude SOLO se clicchi direttamente su di esso
        // NON sui suoi figli (content, opzioni, etc.)
        overlay.addEventListener('click', (e) => {
            // Chiudi SOLO se il target dell'evento è proprio l'overlay
            // e NON uno dei suoi elementi figli
            if (e.target === overlay) {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            }
        });
        
        overlay.addEventListener('touchend', (e) => {
            // Chiudi SOLO se il target dell'evento è proprio l'overlay
            if (e.target === overlay) {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            }
        }, { passive: false });
        
        // IMPORTANTE: Previeni propagazione degli eventi dal content verso l'overlay
        content.addEventListener('click', (e) => {
            // Ferma la propagazione verso l'overlay per evitare chiusure accidentali
            e.stopPropagation();
        });
        
        content.addEventListener('touchstart', (e) => {
            // Ferma la propagazione verso l'overlay
            e.stopPropagation();
        }, { passive: true });
        
        content.addEventListener('touchend', (e) => {
            // Ferma la propagazione verso l'overlay
            e.stopPropagation();
        }, { passive: true });
        
        // Container delle opzioni: permetti scroll naturale
        optionsContainer.addEventListener('touchstart', (e) => {
            e.stopPropagation(); // Non propagare all'overlay
        }, { passive: true });
        
        optionsContainer.addEventListener('touchmove', (e) => {
            e.stopPropagation(); // Non propagare all'overlay - scroll libero
        }, { passive: true });
        
        optionsContainer.addEventListener('touchend', (e) => {
            e.stopPropagation(); // Non propagare all'overlay
        }, { passive: true });
        
        // Seleziona opzioni con distinzione TAP vs SCROLL
        options.forEach(option => {
            // Click per desktop e touch devices senza movimento
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Non propagare all'overlay
                
                const value = option.dataset.value;
                const text = option.textContent.trim();
                
                this.selectOption(value, text);
                
                setTimeout(() => {
                    this.close();
                }, 50);
            });
            
            // Touch start: registra posizione iniziale
            option.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                
                const touch = e.touches[0];
                touchStartData = {
                    startX: touch.clientX,
                    startY: touch.clientY,
                    startTime: Date.now(),
                    target: option,
                    scrollTop: optionsContainer.scrollTop
                };
            }, { passive: true });
            
            // Touch end: distingui TAP da SCROLL
            option.addEventListener('touchend', (e) => {
                e.stopPropagation();
                
                if (!touchStartData || touchStartData.target !== option) {
                    touchStartData = null;
                    return;
                }
                
                const touch = e.changedTouches[0];
                const endX = touch.clientX;
                const endY = touch.clientY;
                const endTime = Date.now();
                const currentScrollTop = optionsContainer.scrollTop;
                
                // Calcola la distanza di movimento
                const deltaX = Math.abs(endX - touchStartData.startX);
                const deltaY = Math.abs(endY - touchStartData.startY);
                const deltaTime = endTime - touchStartData.startTime;
                const deltaScroll = Math.abs(currentScrollTop - touchStartData.scrollTop);
                
                // È un TAP se:
                // 1. Movimento minimo (< 10px in qualsiasi direzione)
                // 2. Tempo breve (< 300ms)  
                // 3. Nessun scroll del container
                const isTap = deltaX < 10 && deltaY < 10 && deltaTime < 300 && deltaScroll < 5;
                
                if (isTap) {
                    // È un tap veloce - seleziona l'opzione
                    const value = option.dataset.value;
                    const text = option.textContent.trim();
                    
                    this.selectOption(value, text);
                    
                    setTimeout(() => {
                        this.close();
                    }, 50);
                }
                // Se non è un tap, non fare nulla (era uno scroll)
                
                // Reset dei dati
                touchStartData = null;
            }, { passive: false });
        });
    }
    
    removeMobileModal() {
        if (this.mobileModal) {
            this.mobileModal.remove();
            this.mobileModal = null;
        }
        
        // Rimuovi classe dal body e blocchi globali
        document.body.classList.remove('custom-select-modal-open');
        this.removeGlobalClickBlocker();
    }
    
    close() {
        window.appLogger?.debug('CustomSelect closing', { 
            selectId: this.selectElement.id, 
            hasMobileModal: !!this.mobileModal,
            currentState: this.isOpen 
        });
        
        this.isOpen = false;
        this.wrapper.classList.remove('open');
        
        // Su mobile, rimuovi modal se presente
        if (window.innerWidth <= 767) {
            this.removeMobileModal();
            this.enableOtherCustomSelects();
        } else {
            // Desktop: dropdown normale
            this.wrapper.querySelector('.custom-select-dropdown').style.display = 'none';
            
            // Ripristina gli stili di overflow originali su desktop
            this.restoreOverflow();
            
            // Rimuovi focus da tutte le opzioni
            this.wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
                opt.classList.remove('focused');
            });
        }
        
        // Rimuovi listener mobile overlay
        if (this.mobileOverlayHandler) {
            document.removeEventListener('click', this.mobileOverlayHandler);
            document.removeEventListener('touchstart', this.mobileOverlayHandler);
            this.mobileOverlayHandler = null;
        }
        
        // Rimuovi blocco click/touch globale
        this.removeGlobalClickBlocker();
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    destroy() {
        // Pulisci listener mobile se presenti
        if (this.mobileOverlayHandler) {
            document.removeEventListener('click', this.mobileOverlayHandler);
            document.removeEventListener('touchstart', this.mobileOverlayHandler);
        }
        
        // Pulisci listener outside click/touch specifici
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
        }
        if (this.outsideTouchHandler) {
            document.removeEventListener('touchstart', this.outsideTouchHandler);
        }
        
        // Rimuovi modal mobile se presente
        this.removeMobileModal();
        
        this.wrapper.remove();
        this.selectElement.style.display = '';
    }
    
    addScrollIndicator() {
        const dropdown = this.wrapper.querySelector('.custom-select-dropdown');
        
        // Rimuovi indicatore esistente se presente
        const existingIndicator = dropdown.querySelector('.scroll-indicator-dot');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Crea indicatore elegante ma visibile
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'scroll-indicator-dot';
        
        dropdown.appendChild(scrollIndicator);
        
        // Gestisci comportamento durante lo scroll
        dropdown.addEventListener('scroll', () => {
            const isAtBottom = dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight - 5;
            const hasScrolled = dropdown.scrollTop > 0;
            
            if (isAtBottom) {
                // Nasconde quando arrivi in fondo
                scrollIndicator.style.opacity = '0';
            } else if (hasScrolled) {
                // Rimuove l'animazione dopo il primo scroll e lo rende più discreto
                scrollIndicator.style.animation = 'none';
                scrollIndicator.style.opacity = '0.5';
            } else {
                // Stato iniziale con animazione
                scrollIndicator.style.opacity = '0.8';
            }
        });
    }
    
    addGlobalClickBlocker() {
        // Versione semplificata - blocca SOLO click esterni, NON touch/scroll
        this.globalClickBlocker = (e) => {
            // Se il click non è all'interno del modal, bloccalo
            if (!this.mobileModal || !this.mobileModal.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };
        
        // SOLO click, nessun touch/scroll blocking
        document.addEventListener('click', this.globalClickBlocker, { 
            capture: true, 
            passive: false 
        });
    }
    
    removeGlobalClickBlocker() {
        if (this.globalClickBlocker) {
            document.removeEventListener('click', this.globalClickBlocker, { capture: true });
            this.globalClickBlocker = null;
        }
    }
    
    /**
     * Forza overflow visibile sui contenitori parent per risolvere problemi di clipping
     */
    forceOverflowVisible() {
        // Salva gli stili originali per ripristinarli dopo
        this.originalOverflowStyles = [];
        
        // Trova tutti i contenitori parent che potrebbero tagliare il dropdown
        let element = this.wrapper.parentElement;
        while (element && element !== document.body) {
            const computedStyle = window.getComputedStyle(element);
            
            // Salva lo stile originale
            this.originalOverflowStyles.push({
                element: element,
                overflow: element.style.overflow,
                overflowX: element.style.overflowX,
                overflowY: element.style.overflowY
            });
            
            // Se l'elemento ha overflow: hidden, forzalo a visible
            if (computedStyle.overflow === 'hidden' || 
                computedStyle.overflowX === 'hidden' || 
                computedStyle.overflowY === 'hidden') {
                
                element.style.setProperty('overflow', 'visible', 'important');
                element.style.setProperty('overflow-x', 'visible', 'important');
                element.style.setProperty('overflow-y', 'visible', 'important');
            }
            
            element = element.parentElement;
        }
    }
    
    /**
     * Ripristina gli stili di overflow originali
     */
    restoreOverflow() {
        if (this.originalOverflowStyles) {
            this.originalOverflowStyles.forEach(style => {
                if (style.overflow !== undefined) {
                    if (style.overflow === '') {
                        style.element.style.removeProperty('overflow');
                    } else {
                        style.element.style.overflow = style.overflow;
                    }
                }
                
                if (style.overflowX !== undefined) {
                    if (style.overflowX === '') {
                        style.element.style.removeProperty('overflow-x');
                    } else {
                        style.element.style.overflowX = style.overflowX;
                    }
                }
                
                if (style.overflowY !== undefined) {
                    if (style.overflowY === '') {
                        style.element.style.removeProperty('overflow-y');
                    } else {
                        style.element.style.overflowY = style.overflowY;
                    }
                }
            });
            
            this.originalOverflowStyles = null;
        }
    }
}

// Utility function per inizializzare automaticamente le custom select
window.initCustomSelects = function(selector = '.form-select[data-custom="true"]') {
    try {
        const selects = document.querySelectorAll(selector);
        let successCount = 0;
        let errorCount = 0;
        
        selects.forEach(select => {
            try {
                if (!select.customSelectInstance) {
                    select.customSelectInstance = new CustomSelect(select);
                    successCount++;
                }
            } catch (error) {
                errorCount++;
                window.appLogger?.error(`Errore inizializzazione custom select per elemento ${select.id || 'unnamed'}`, error);
            }
        });
        
        if (successCount > 0) {
            window.appLogger?.debug(`Custom selects inizializzate: ${successCount} successi, ${errorCount} errori`);
        }
        
        return { success: successCount, errors: errorCount };
    } catch (error) {
        window.appLogger?.error('Errore inizializzazione globale custom selects', error);
        return { success: 0, errors: 1 };
    }
};

// Auto-inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.initCustomSelects();
});

// Export per uso in moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomSelect;
}

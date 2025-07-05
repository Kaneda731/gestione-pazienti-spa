/**
 * CustomSelect - Componente per dropdown personalizzati
 * Risolve i problemi di styling dei dropdown nativi del browser
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
        
        this.init();
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
            
            optionElement.addEventListener('click', () => {
                this.selectOption(option.value, option.textContent);
            });
            
            // Supporto touch su mobile per le opzioni
            optionElement.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
            
            optionElement.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectOption(option.value, option.textContent);
            }, { passive: false });
            
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
        
        // Toggle dropdown - Supporto touch mobile
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Supporto touch su mobile
        trigger.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
        
        trigger.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        }, { passive: false });
        
        // Close on outside click/touch
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.close();
            }
        });
        
        document.addEventListener('touchstart', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.close();
            }
        }, { passive: true });
        
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
        console.log('selectOption chiamato:', value, text);
        this.selectedValue = value;
        this.selectedText = text;
        
        // Aggiorna l'interfaccia
        const label = this.wrapper.querySelector('.custom-select-label');
        if (label) {
            label.textContent = text;
            console.log('Label aggiornata con:', text);
        }
        
        // Aggiorna la select originale
        this.selectElement.value = value;
        console.log('Select element value impostato a:', value);
        
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
        this.isOpen = true;
        this.wrapper.classList.add('open');
        
        // Su mobile, crea un modal completamente esterno al DOM del form
        if (window.innerWidth <= 767) {
            this.disableOtherCustomSelects();
            this.createMobileModal();
            console.log('CustomSelect: Modal mobile esterno creato');
        } else {
            // Desktop: mantieni il bel design esistente
            this.wrapper.querySelector('.custom-select-dropdown').style.display = 'block';
            
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
        
        console.log('CustomSelect: Modal mobile aggiunto al body');
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
        const options = this.mobileModal.querySelectorAll('.custom-select-mobile-option');
        
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
        
        // Chiudi con overlay
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.close();
        });
        
        // Blocca completamente eventi touch sull'overlay
        overlay.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { passive: false });
        
        overlay.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.close();
        }, { passive: false });
        
        // Blocca scroll e altre interazioni sull'overlay
        overlay.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        overlay.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Seleziona opzioni
        options.forEach(option => {
            // Click normale
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const value = option.dataset.value;
                const text = option.textContent.trim();
                console.log('Modal mobile: Selezione opzione', value, text);
                
                // Seleziona l'opzione
                this.selectOption(value, text);
                
                // Chiudi il modal dopo la selezione
                setTimeout(() => {
                    this.close();
                }, 100);
            });
            
            // Touch events per mobile
            option.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const value = option.dataset.value;
                const text = option.textContent.trim();
                console.log('Modal mobile touch: Selezione opzione', value, text);
                
                // Seleziona l'opzione
                this.selectOption(value, text);
                
                // Chiudi il modal dopo la selezione
                setTimeout(() => {
                    this.close();
                }, 100);
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
        this.isOpen = false;
        this.wrapper.classList.remove('open');
        
        // Su mobile, rimuovi modal esterno
        if (window.innerWidth <= 767) {
            this.removeMobileModal();
            // Riabilita tutti gli altri custom select
            this.enableOtherCustomSelects();
            console.log('CustomSelect: Modal mobile esterno rimosso');
        } else {
            // Desktop: mantieni il comportamento esistente
            this.wrapper.querySelector('.custom-select-dropdown').style.display = 'none';
            
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
        // Blocca tutti i click/touch globali quando il modal è aperto
        this.globalClickBlocker = (e) => {
            // Se il click non è all'interno del modal, bloccalo
            if (!this.mobileModal || !this.mobileModal.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        };
        
        this.globalTouchBlocker = (e) => {
            // Se il touch non è all'interno del modal, bloccalo
            if (!this.mobileModal || !this.mobileModal.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        };
        
        // Aggiungi listener con capture per intercettare prima di tutto
        document.addEventListener('click', this.globalClickBlocker, { 
            capture: true, 
            passive: false 
        });
        document.addEventListener('touchstart', this.globalTouchBlocker, { 
            capture: true, 
            passive: false 
        });
        document.addEventListener('touchend', this.globalTouchBlocker, { 
            capture: true, 
            passive: false 
        });
        
        // Blocca anche scroll e wheel events
        this.globalScrollBlocker = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        
        document.addEventListener('wheel', this.globalScrollBlocker, { 
            capture: true, 
            passive: false 
        });
        document.addEventListener('touchmove', this.globalScrollBlocker, { 
            capture: true, 
            passive: false 
        });
    }
    
    removeGlobalClickBlocker() {
        if (this.globalClickBlocker) {
            document.removeEventListener('click', this.globalClickBlocker, { capture: true });
            document.removeEventListener('touchstart', this.globalTouchBlocker, { capture: true });
            document.removeEventListener('touchend', this.globalTouchBlocker, { capture: true });
            this.globalClickBlocker = null;
            this.globalTouchBlocker = null;
        }
        
        if (this.globalScrollBlocker) {
            document.removeEventListener('wheel', this.globalScrollBlocker, { capture: true });
            document.removeEventListener('touchmove', this.globalScrollBlocker, { capture: true });
            this.globalScrollBlocker = null;
        }
    }
}

// Utility function per inizializzare automaticamente le custom select
window.initCustomSelects = function(selector = '.form-select[data-custom="true"]') {
    const selects = document.querySelectorAll(selector);
    selects.forEach(select => {
        if (!select.customSelectInstance) {
            select.customSelectInstance = new CustomSelect(select);
        }
    });
};

// Auto-inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.initCustomSelects();
});

// Export per uso in moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomSelect;
}

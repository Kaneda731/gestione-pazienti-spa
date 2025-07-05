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
        
        selectOptions.forEach((option, index) => {
            if (option.value === '') {
                return; // Skip placeholder option
            }
            
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
        
        // Close on outside click/touch - IMPORTANTE: su mobile gestisce il click sull'overlay
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
        
        // Gestione chiusura con pulsante X su mobile
        dropdown.addEventListener('click', (e) => {
            // Se il click è sul pulsante chiudi (::after pseudo-element)
            const rect = dropdown.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Area approssimativa del pulsante chiudi (in alto a destra)
            if (clickX > rect.width - 50 && clickY < 50) {
                e.stopPropagation();
                this.close();
            }
        });
        
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
        label.textContent = text;
        
        // Aggiorna la select originale
        this.selectElement.value = value;
        
        // Dispatch change event
        const changeEvent = new Event('change', { bubbles: true });
        this.selectElement.dispatchEvent(changeEvent);
        
        // Rimuovi focus da tutte le opzioni
        this.wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('focused');
        });
        
        // Chiudi automaticamente dopo selezione (UX mobile migliorata)
        this.close();
        
        console.log('CustomSelect: Opzione selezionata:', value, '-', text);
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
            // Disabilita tutti gli altri custom select per evitare interferenze
            this.disableOtherCustomSelects();
            this.createMobileModal();
            console.log('CustomSelect: Modal mobile esterno creato');
        } else {
            // Desktop: usa dropdown normale
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
        const allCustomSelects = document.querySelectorAll('.custom-select');
        allCustomSelects.forEach(select => {
            if (select !== this.wrapper) {
                select.style.pointerEvents = 'none';
            }
        });
    }
    
    enableOtherCustomSelects() {
        // Riabilita tutti i custom select
        const allCustomSelects = document.querySelectorAll('.custom-select');
        allCustomSelects.forEach(select => {
            select.style.pointerEvents = 'auto';
        });
    }
    }
    
    createMobileModal() {
        // Rimuovi modal esistente se presente
        this.removeMobileModal();
        
        // Crea modal completamente esterno
        this.mobileModal = document.createElement('div');
        this.mobileModal.className = 'custom-select-mobile-modal';
        this.mobileModal.innerHTML = `
            <div class="custom-select-mobile-overlay"></div>
            <div class="custom-select-mobile-content">
                <div class="custom-select-mobile-header">
                    <h3>Seleziona opzione</h3>
                    <button type="button" class="custom-select-mobile-close">✕</button>
                </div>
                <div class="custom-select-mobile-options">
                    ${this.getMobileOptionsHTML()}
                </div>
            </div>
        `;
        
        // Aggiungi direttamente al body (NON al wrapper del form)
        document.body.appendChild(this.mobileModal);
        document.body.classList.add('custom-select-modal-open');
        document.body.style.overflow = 'hidden';
        
        // Bind eventi del modal mobile
        this.bindMobileModalEvents();
        
        // Animazione di entrata
        requestAnimationFrame(() => {
            this.mobileModal.classList.add('show');
        });
    }
    
    getMobileOptionsHTML() {
        const selectOptions = this.selectElement.querySelectorAll('option');
        let html = '';
        
        selectOptions.forEach(option => {
            if (option.value === '') return; // Skip placeholder
            
            html += `<div class="custom-select-mobile-option" data-value="${option.value}">
                ${option.textContent}
            </div>`;
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
            this.close();
        });
        
        // Seleziona opzioni
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const value = option.dataset.value;
                const text = option.textContent;
                this.selectOption(value, text);
            });
        });
    }
    
    removeMobileModal() {
        if (this.mobileModal) {
            this.mobileModal.remove();
            this.mobileModal = null;
        }
        document.body.classList.remove('custom-select-modal-open');
        document.body.style.overflow = '';
    }
    
    adjustMobilePosition() {
        const triggerRect = this.wrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        
        // Calcola altezza stimata dropdown in base al viewport
        let estimatedDropdownHeight;
        if (viewportHeight <= 500) {
            // Viewport basso (landscape mobile)
            estimatedDropdownHeight = Math.min(viewportHeight * 0.25, 150);
        } else {
            estimatedDropdownHeight = Math.min(viewportHeight * 0.4, 300);
        }
        
        // Considera anche l'header fisso (assumiamo 60-90px)
        const headerOffset = 90;
        const effectiveSpaceAbove = Math.max(0, spaceAbove - headerOffset);
        
        // Se c'è più spazio sopra che sotto e poco spazio sotto, 
        // apri verso l'alto (ma solo se c'è spazio sufficiente sopra)
        if (spaceBelow < estimatedDropdownHeight && 
            effectiveSpaceAbove > spaceBelow && 
            effectiveSpaceAbove >= estimatedDropdownHeight * 0.8) {
            
            this.wrapper.classList.add('dropdown-up');
            console.log('CustomSelect: Apertura verso l\'alto - spazio sotto:', spaceBelow, 
                       'spazio sopra (effettivo):', effectiveSpaceAbove, 
                       'altezza stimata:', estimatedDropdownHeight);
        } else {
            this.wrapper.classList.remove('dropdown-up');
            console.log('CustomSelect: Apertura verso il basso - spazio sotto:', spaceBelow, 
                       'spazio sopra (effettivo):', effectiveSpaceAbove,
                       'altezza stimata:', estimatedDropdownHeight);
        }
    }
    
    addMobileOverlayListener() {
        // Listener per chiudere quando si clicca sull'overlay mobile
        const overlay = this.wrapper.querySelector('::before');
        this.mobileOverlayHandler = (e) => {
            const dropdown = this.wrapper.querySelector('.custom-select-dropdown');
            if (!dropdown.contains(e.target) && this.wrapper.classList.contains('open')) {
                this.close();
            }
        };
        
        // Aggiungi listener al wrapper per intercettare click sull'overlay
        setTimeout(() => {
            document.addEventListener('click', this.mobileOverlayHandler);
            document.addEventListener('touchstart', this.mobileOverlayHandler);
        }, 100);
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
            // Desktop: nascondi dropdown normale
            this.wrapper.querySelector('.custom-select-dropdown').style.display = 'none';
            
            // Rimuovi focus da tutte le opzioni
            this.wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
                opt.classList.remove('focused');
            });
        }
        
        // Rimuovi listener mobile overlay (se esistenti)
        if (this.mobileOverlayHandler) {
            document.removeEventListener('click', this.mobileOverlayHandler);
            document.removeEventListener('touchstart', this.mobileOverlayHandler);
            this.mobileOverlayHandler = null;
        }
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

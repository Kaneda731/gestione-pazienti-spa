/**
 * CustomSelect - Componente per dropdown personalizzati
 * v2.2.0 - Aggiunto metodo updateOptions
 */

import { sanitizeHtml } from '../../utils/sanitizeHtml.js';

export class CustomSelect {
    constructor(selectElement, options = {}) {
        // ... (costruttore invariato)
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
        this.isScrolling = false;
        
        try {
            this.init();
            // Salva l'istanza sull'elemento per un facile accesso futuro
            this.selectElement.customSelectInstance = this;
            window.appLogger?.debug('CustomSelect inizializzato', { element: selectElement.id || 'unnamed' });
        } catch (error) {
            window.appLogger?.error('Errore inizializzazione CustomSelect', error);
            throw error;
        }
    }
    
    init() {
        this.selectElement.classList.add('custom-select-original');
        this.wrapper = this.createWrapper();
        this.selectElement.parentNode.insertBefore(this.wrapper, this.selectElement);
        this.populateOptions();
        this.bindEvents();
        if (this.selectElement.value) {
            this.setValue(this.selectElement.value);
        }
    }

    /**
     * NUOVO METODO: Aggiorna le opzioni del custom select
     * leggendo dal <select> originale.
     */
    updateOptions() {
        window.appLogger?.debug('Updating options for', { selectId: this.selectElement.id });
        this.populateOptions();
        // Se c'era un valore selezionato, prova a riapplicarlo SENZA scatenare eventi
        if (this.selectElement.value) {
            this.setValue(this.selectElement.value, true); // silent = true
        } else {
            // Altrimenti, resetta al placeholder
            const label = this.wrapper.querySelector('.custom-select-label');
            if (label) {
                label.textContent = this.options.placeholder;
            }
        }
    }
    
    createWrapper() {
        // ... (invariato)
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        const originalId = this.selectElement.id;
        const originalName = this.selectElement.name;
        if (originalId) {
            wrapper.id = `${originalId}-custom-select`;
        }
        if (originalName) {
            wrapper.setAttribute('data-name', originalName);
        }
        wrapper.innerHTML = sanitizeHtml(`
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
        `);
        return wrapper;
    }
    
    populateOptions() {
        // ... (invariato)
        const optionsContainer = this.wrapper.querySelector('.custom-select-options');
        const selectOptions = this.selectElement.querySelectorAll('option');
        optionsContainer.innerHTML = '';
        let validOptionsCount = 0;
        selectOptions.forEach((option, idx) => {
            // Mostra SEMPRE la prima opzione, anche se value="" (es. "Tutti")
            if (option.value === '' && idx !== 0) return;
            validOptionsCount++;
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-select-option';
            optionElement.dataset.value = option.value;
            // Supporta icone tramite data-icon attribute
            if (option.hasAttribute('data-icon')) {
                // Crea elementi DOM sicuri invece di usare innerHTML
                let iconHtml = option.getAttribute('data-icon');
                
                // Crea un container temporaneo per parsare l'HTML sanitizzato
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = sanitizeHtml(iconHtml);
                
                // Aggiungi tutti i nodi icona
                while (tempDiv.firstChild) {
                    optionElement.appendChild(tempDiv.firstChild);
                }
                
                // Aggiungi il testo in modo sicuro
                optionElement.appendChild(document.createTextNode(' ' + option.textContent));
            } else {
                optionElement.textContent = option.textContent;
            }
            optionElement.addEventListener('click', (e) => {
                if (this.mobileModal) return;
                this.selectOption(option.value, option.textContent);
            });
            optionsContainer.appendChild(optionElement);
        });
        if (validOptionsCount > 4) {
            this.addScrollIndicator();
        }
    }
    
    bindEvents() {
        // ... (invariato)
        const trigger = this.wrapper.querySelector('.custom-select-trigger');
        trigger.addEventListener('touchstart', () => { this.isScrolling = false; }, { passive: true });
        trigger.addEventListener('touchmove', () => { this.isScrolling = true; }, { passive: true });
        trigger.addEventListener('click', (e) => {
            try {
                if (this.isScrolling) {
                    this.isScrolling = false;
                    return;
                }
                e.stopPropagation();
                this.toggle();
            } catch (error) {
                window.appLogger?.error('Errore nel click handler del CustomSelect:', error);
            }
        });
        
        this.outsideClickHandler = (e) => {
            try {
                if (!this.wrapper.contains(e.target) && !this.mobileModal?.contains(e.target)) {
                    this.close();
                }
            } catch (error) {
                window.appLogger?.error('Errore nel outside click handler:', error);
            }
        };
        
        this.outsideTouchHandler = (e) => {
            try {
                if (this.isOpen && !this.wrapper.contains(e.target) && !this.mobileModal?.contains(e.target)) {
                    setTimeout(() => { 
                        try {
                            if (this.isOpen) this.close(); 
                        } catch (error) {
                            window.appLogger?.error('Errore nel timeout del touch handler:', error);
                        }
                    }, 50);
                }
            } catch (error) {
                window.appLogger?.error('Errore nel outside touch handler:', error);
            }
        };
        
        document.addEventListener('click', this.outsideClickHandler);
        document.addEventListener('touchstart', this.outsideTouchHandler, { passive: true });
        this.wrapper.addEventListener('keydown', (e) => { 
            try {
                this.handleKeyboard(e); 
            } catch (error) {
                window.appLogger?.error('Errore nel keyboard handler:', error);
            }
        });
        
        // Listener per il resize della finestra per ricalcolare la posizione del dropdown
        this.resizeHandler = () => {
            if (this.isOpen) {
                this.adjustDropdownPosition();
            }
        };
        window.addEventListener('resize', this.resizeHandler);
        
        // Listener per lo scroll per ricalcolare la posizione del dropdown
        this.scrollHandler = () => {
            if (this.isOpen) {
                this.adjustDropdownPosition();
            }
        };
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
        
        this.wrapper.setAttribute('tabindex', '0');
    }
    
    // ... (tutti gli altri metodi come handleKeyboard, selectOption, setValue, open, close, etc. rimangono invariati)
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
                if (this.isOpen) this.navigateOptions(1);
                else this.open();
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (this.isOpen) this.navigateOptions(-1);
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
        const label = this.wrapper.querySelector('.custom-select-label');
        if (label) {
            // Supporta icone tramite data-icon attribute
            const option = this.selectElement.querySelector(`option[value="${value}"]`);
            if (option && option.hasAttribute('data-icon')) {
                // Crea elementi DOM sicuri invece di usare innerHTML
                let iconHtml = option.getAttribute('data-icon');
                
                label.innerHTML = '';
                
                // Crea un container temporaneo per parsare l'HTML sanitizzato
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = sanitizeHtml(iconHtml);
                
                // Aggiungi tutti i nodi icona
                while (tempDiv.firstChild) {
                    label.appendChild(tempDiv.firstChild);
                }
                
                // Aggiungi il testo in modo sicuro
                label.appendChild(document.createTextNode(' ' + text));
            } else {
                label.textContent = text;
            }
        }
        this.selectElement.value = value;
        const changeEvent = new Event('change', { bubbles: true });
        this.selectElement.dispatchEvent(changeEvent);
        this.wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('focused');
        });
        if (!this.mobileModal) this.close();
    }
    
    setValue(value, silent = false) {
        const option = this.selectElement.querySelector(`option[value="${value}"]`);
        if (option) {
            if (silent) {
                // Aggiorna solo il valore senza scatenare eventi
                const label = this.wrapper.querySelector('.custom-select-label');
                if (label) {
                    if (option.hasAttribute('data-icon')) {
                        label.innerHTML = sanitizeHtml(`${option.getAttribute('data-icon')} ${option.textContent}`);
                    } else {
                        label.textContent = option.textContent;
                    }
                }
                this.selectElement.value = value;
            } else {
                this.selectOption(value, option.textContent);
            }
        }
    }
    
    open() {
        this.isOpen = true;
        this.wrapper.classList.add('open');

        // Gestione overflow della card genitore
        const parentCard = this.wrapper.closest('.card');
        if (parentCard) {
            parentCard.classList.add('overflow-visible');
        }
        
        // Controlla se c'è abbastanza spazio sotto per il dropdown
        this.adjustDropdownPosition();
        
        // Non usare più il modal mobile, apri sempre il dropdown
        if (this.selectedValue === '') {
            const firstOption = this.wrapper.querySelector('.custom-select-option');
            if (firstOption) {
                firstOption.classList.add('focused');
            }
        }
    }
    
    adjustDropdownPosition() {
        const dropdown = this.wrapper.querySelector('.custom-select-dropdown');
        const trigger = this.wrapper.querySelector('.custom-select-trigger');
        
        if (!dropdown || !trigger) return;
        
        // Reset delle classi di posizionamento
        this.wrapper.classList.remove('dropdown-up', 'dropdown-down');
        
        // Controlla se siamo dentro una modal
        const modal = this.wrapper.closest('.modal');
        const isInModal = !!modal;
        
        // Calcola le posizioni
        const triggerRect = trigger.getBoundingClientRect();
        let containerHeight, containerBottom;
        
        if (isInModal) {
            // Se siamo in una modal, usa i confini della modal
            const modalBody = modal.querySelector('.modal-body');
            const modalRect = modalBody ? modalBody.getBoundingClientRect() : modal.getBoundingClientRect();
            containerHeight = modalRect.height;
            containerBottom = modalRect.bottom;
        } else {
            // Altrimenti usa il viewport
            containerHeight = window.innerHeight;
            containerBottom = window.innerHeight;
        }
        
        const dropdownHeight = Math.min(isInModal ? 150 : 200, dropdown.scrollHeight || 200);
        const spaceBelow = containerBottom - triggerRect.bottom - 20;
        const spaceAbove = triggerRect.top - (isInModal ? modal.getBoundingClientRect().top : 0) - 20;
        
        // Preferisci aprire verso il basso, ma se non c'è spazio e c'è spazio sopra, apri verso l'alto
        if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
            this.wrapper.classList.add('dropdown-up');
            window.appLogger?.debug('Dropdown aperto verso l\'alto', { 
                spaceBelow, 
                spaceAbove, 
                dropdownHeight,
                isInModal,
                elementId: this.selectElement.id 
            });
        } else {
            this.wrapper.classList.add('dropdown-down');
            window.appLogger?.debug('Dropdown aperto verso il basso', { 
                spaceBelow, 
                spaceAbove, 
                dropdownHeight,
                isInModal,
                elementId: this.selectElement.id 
            });
        }
    }
    
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.wrapper.classList.remove('open');
        const parentCard = this.wrapper.closest('.card');
        if (parentCard) parentCard.classList.remove('overflow-visible');
        if (this.mobileModal) {
            this.removeMobileModal();
            this.enableOtherCustomSelects();
        } else {
            this.wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
                opt.classList.remove('focused');
            });
        }
        document.body.classList.remove('custom-select-modal-open');
        this.removeGlobalClickBlocker();
    }
    
    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }
    
    destroy() {
        if (this.outsideClickHandler) document.removeEventListener('click', this.outsideClickHandler);
        if (this.outsideTouchHandler) document.removeEventListener('touchstart', this.outsideTouchHandler);
        if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
        if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
        this.removeMobileModal();
        this.wrapper.remove();
        this.selectElement.style.display = '';
    }
    
    // ... (tutti i metodi per il mobile modal e gli helper rimangono invariati)
    disableOtherCustomSelects() {
        const allCustomSelects = document.querySelectorAll('.custom-select-wrapper');
        allCustomSelects.forEach(select => {
            if (select !== this.wrapper) select.style.pointerEvents = 'none';
        });
    }
    
    enableOtherCustomSelects() {
        const allCustomSelects = document.querySelectorAll('.custom-select-wrapper');
        allCustomSelects.forEach(select => {
            select.style.pointerEvents = 'auto';
        });
    }

    createMobileModal() {
        this.removeMobileModal();
        this.mobileModal = document.createElement('div');
        this.mobileModal.className = 'custom-select-mobile-modal';
        const optionsHTML = this.getMobileOptionsHTML();
        this.mobileModal.innerHTML = `...`; // Contenuto del modal
        document.body.appendChild(this.mobileModal);
        document.body.classList.add('custom-select-modal-open');
        this.addGlobalClickBlocker();
        this.bindMobileModalEvents();
        setTimeout(() => { this.mobileModal.classList.add('show'); }, 10);
    }
    
    getMobileOptionsHTML() {
        // ...
    }
    
    bindMobileModalEvents() {
        // ...
    }
    
    removeMobileModal() {
        if (this.mobileModal) {
            this.mobileModal.remove();
            this.mobileModal = null;
        }
        document.body.classList.remove('custom-select-modal-open');
        this.removeGlobalClickBlocker();
    }
    
    addScrollIndicator() {
        // ...
    }
    
    addGlobalClickBlocker() {
        // ...
    }
    
    removeGlobalClickBlocker() {
        // ...
    }
}

/**
 * NUOVA FUNZIONE: Aggiorna un custom select esistente.
 * @param {string} selector - Il selettore CSS per il <select> da aggiornare.
 */
export function updateCustomSelect(selector) {
    const select = document.querySelector(selector);
    if (select && select.customSelectInstance) {
        select.customSelectInstance.updateOptions();
    }
}

// Funzione di inizializzazione esistente
export function initCustomSelects(selector = '.form-select[data-custom="true"]') {
    // ... (invariata)
    try {
        const selects = document.querySelectorAll(selector);
        selects.forEach(select => {
            if (!select.customSelectInstance) {
                new CustomSelect(select);
            }
        });
    } catch (error) {
        window.appLogger?.error('Errore inizializzazione globale custom selects', error);
    }
};

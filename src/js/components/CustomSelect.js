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
        
        selectOptions.forEach(option => {
            if (option.value === '') return; // Skip placeholder option
            
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-select-option';
            optionElement.dataset.value = option.value;
            optionElement.textContent = option.textContent;
            
            optionElement.addEventListener('click', () => {
                this.selectOption(option.value, option.textContent);
            });
            
            optionsContainer.appendChild(optionElement);
        });
    }
    
    bindEvents() {
        const trigger = this.wrapper.querySelector('.custom-select-trigger');
        const dropdown = this.wrapper.querySelector('.custom-select-dropdown');
        
        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) {
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
        
        this.close();
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
        this.wrapper.querySelector('.custom-select-dropdown').style.display = 'block';
        
        // Focus sul primo elemento se nessuno è selezionato
        if (this.selectedValue === '') {
            const firstOption = this.wrapper.querySelector('.custom-select-option');
            if (firstOption) {
                firstOption.classList.add('focused');
            }
        }
    }
    
    close() {
        this.isOpen = false;
        this.wrapper.classList.remove('open');
        this.wrapper.querySelector('.custom-select-dropdown').style.display = 'none';
        
        // Rimuovi focus da tutte le opzioni
        this.wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('focused');
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    destroy() {
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

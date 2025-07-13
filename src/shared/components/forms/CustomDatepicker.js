import flatpickr from 'flatpickr';

class CustomDatepicker {
    constructor(selector, options = {}) {
        this.selector = selector;
        this.options = options;
        this.instances = [];
        
        // L'handler è ora legato all'istanza della classe
        this.handleIconClick = this.handleIconClick.bind(this);

        this.init();
    }

    init() {
        const elements = document.querySelectorAll(this.selector);
        
        elements.forEach(element => {
            if (element._flatpickr) {
                element._flatpickr.destroy();
            }

            const instance = flatpickr(element, {
                ...this.options,
                dateFormat: "d/m/Y",
                disableMobile: true, // Forza il calendario Flatpickr anche su mobile
            });
            
            // Associa l'istanza di flatpickr direttamente all'elemento input
            element._flatpickrInstance = instance;
            this.instances.push(instance);
        });

        // Aggiungi un solo listener sul documento
        document.addEventListener('click', this.handleIconClick);
    }

    handleIconClick(event) {
        // Controlla se l'elemento cliccato è un'icona del calendario
        const icon = event.target.closest('.input-icon');
        if (!icon) return;

        // Trova il wrapper e l'input associato
        const wrapper = icon.closest('.input-group-icon');
        if (!wrapper) return;

        const input = wrapper.querySelector(this.selector);
        if (input && input._flatpickrInstance) {
            // Usa l'istanza salvata per aprire il calendario
            input._flatpickrInstance.toggle();
        }
    }

    destroy() {
        // Rimuovi il listener globale
        document.removeEventListener('click', this.handleIconClick);

        // Pulisci le istanze salvate sugli elementi
        this.instances.forEach(instance => {
            if (instance.element) {
                delete instance.element._flatpickrInstance;
            }
            instance.destroy();
        });
        
        this.instances = [];
        console.log('CustomDatepicker instances and global handler destroyed.');
    }
}

export default CustomDatepicker;
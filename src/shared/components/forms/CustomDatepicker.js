import flatpickr from 'flatpickr';

class CustomDatepicker {
    constructor(selector, options = {}) {
        this.selector = selector;
        this.options = options;
        this.instances = [];

        // Bind 'this' per i metodi usati come event handler
        this.reinit = this.reinit.bind(this);

        this.init();
        
        // Aggiungi listener per il cambio di modalità
        window.addEventListener('mode:change', this.reinit);
    }

    init() {
        this.elements = document.querySelectorAll(this.selector);
        this.elements.forEach(element => {
            // Prevenire la doppia inizializzazione
            if (element._flatpickr) {
                element._flatpickr.destroy();
            }

            const instance = flatpickr(element, {
                ...this.options,
                // Aggiungi qui opzioni di default se necessario
            });
            this.instances.push(instance);
        });
    }

    /**
     * Distrugge e reinizializza le istanze di Flatpickr.
     * Utile quando la UI cambia dinamicamente (es. cambio modalità desktop/mobile).
     */
    reinit() {
        console.log('Reinitializing Flatpickr due to mode change.');
        this.destroyInstances();
        this.init();
    }

    /**
     * Distrugge solo le istanze di flatpickr, senza rimuovere l'event listener.
     */
    destroyInstances() {
        this.instances.forEach(instance => instance.destroy());
        this.instances = [];
    }

    /**
     * Distrugge completamente il componente, incluse le istanze e gli event listener.
     */
    destroy() {
        this.destroyInstances();
        window.removeEventListener('mode:change', this.reinit);
        console.log('CustomDatepicker destroyed completely.');
    }
}

export default CustomDatepicker;

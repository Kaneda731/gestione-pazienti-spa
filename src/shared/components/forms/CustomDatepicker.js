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
                // Configurazione timezone ottimizzata per l'Italia
                locale: {
                    firstDayOfWeek: 1, // Lunedì come primo giorno
                    weekdays: {
                        shorthand: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
                        longhand: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
                    },
                    months: {
                        shorthand: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
                        longhand: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
                    }
                },
                // Evita query timezone impostando timezone fisso per l'Italia
                parseDate: (datestr, format) => {
                    // Parsing personalizzato che evita conversioni timezone
                    if (!datestr) return null;
                    const parts = datestr.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
                        const year = parseInt(parts[2], 10);
                        return new Date(year, month, day);
                    }
                    return null;
                },
                formatDate: (date, format) => {
                    // Formatting personalizzato che evita conversioni timezone
                    if (!date) return '';
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                }
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

        const input = wrapper.querySelector('[data-datepicker]') || wrapper.querySelector('input[type="text"]');
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
    }
}

export default CustomDatepicker;

export function initCustomDatepickers(selector, options) {
    return new CustomDatepicker(selector, options);
}
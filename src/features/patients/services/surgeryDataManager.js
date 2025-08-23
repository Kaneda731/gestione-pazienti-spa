/**
 * Manager per i dati temporanei dell'intervento chirurgico
 * Gestisce la validazione e lo storage temporaneo dei dati di intervento
 * durante la creazione di un nuovo paziente
 */

class SurgeryDataManager {
    constructor() {
        this.surgeryData = null;
    }

    /**
     * Imposta i dati dell'intervento
     * @param {Object} data - Dati dell'intervento
     */
    setSurgeryData(data) {
        this.surgeryData = data ? { ...data } : null;
    }

    /**
     * Ottiene i dati dell'intervento
     * @returns {Object|null} Dati dell'intervento o null se non presenti
     */
    getSurgeryData() {
        return this.surgeryData ? { ...this.surgeryData } : null;
    }

    /**
     * Pulisce i dati dell'intervento
     */
    clearSurgeryData() {
        this.surgeryData = null;
    }

    /**
     * Verifica se ci sono dati di intervento presenti
     * @returns {boolean} True se ci sono dati presenti
     */
    hasSurgeryData() {
        return this.surgeryData !== null && typeof this.surgeryData === 'object';
    }

    /**
     * Verifica se i dati dell'intervento sono validi
     * @returns {boolean} True se i dati sono validi
     */
    hasValidSurgeryData() {
        if (!this.hasSurgeryData()) {
            return false;
        }

        const errors = this.getValidationErrors();
        return errors.length === 0;
    }

    /**
     * Ottiene gli errori di validazione dei dati dell'intervento
     * @returns {Array} Array di errori di validazione
     */
    getValidationErrors() {
        const errors = [];

        if (!this.hasSurgeryData()) {
            errors.push({ field: 'general', message: 'Nessun dato di intervento presente' });
            return errors;
        }

        const data = this.surgeryData;

        // Validazione campi obbligatori
        if (!data.data_evento || data.data_evento.toString().trim() === '') {
            errors.push({ field: 'data_evento', message: 'Data intervento obbligatoria' });
        }

        if (!data.tipo_intervento || data.tipo_intervento.toString().trim() === '') {
            errors.push({ field: 'tipo_intervento', message: 'Tipo intervento obbligatorio' });
        }

        // Validazione formato e valore data intervento
        if (data.data_evento) {
            try {
                const dataIntervento = new Date(data.data_evento);
                const oggi = new Date();
                oggi.setHours(23, 59, 59, 999);

                if (isNaN(dataIntervento.getTime())) {
                    errors.push({ field: 'data_evento', message: 'Formato data intervento non valido' });
                } else if (dataIntervento > oggi) {
                    errors.push({ field: 'data_evento', message: 'La data dell\'intervento non può essere nel futuro' });
                }
            } catch (error) {
                errors.push({ field: 'data_evento', message: 'Errore nella validazione della data intervento' });
            }
        }

        // Validazione dati infezione se presente
        if (data.has_infection) {
            if (!data.data_infezione || data.data_infezione.toString().trim() === '') {
                errors.push({ field: 'data_infezione', message: 'Data infezione obbligatoria se si indica un\'infezione' });
            } else {
                try {
                    const dataInfezione = new Date(data.data_infezione);
                    const dataIntervento = new Date(data.data_evento);

                    if (isNaN(dataInfezione.getTime())) {
                        errors.push({ field: 'data_infezione', message: 'Formato data infezione non valido' });
                    } else if (dataInfezione < dataIntervento) {
                        errors.push({ field: 'data_infezione', message: 'La data dell\'infezione non può essere precedente all\'intervento' });
                    }
                } catch (error) {
                    errors.push({ field: 'data_infezione', message: 'Errore nella validazione della data infezione' });
                }
            }
        }

        return errors;
    }

    /**
     * Prepara i dati per la creazione dell'evento clinico di intervento
     * @returns {Object|null} Dati formattati per l'evento clinico o null se non validi
     */
    prepareSurgeryEventData() {
        if (!this.hasValidSurgeryData()) {
            return null;
        }

        const data = this.getSurgeryData();
        
        return {
            tipo_evento: 'intervento',
            data_evento: data.data_evento,
            tipo_intervento: data.tipo_intervento,
            descrizione: data.descrizione || null
        };
    }

    /**
     * Prepara i dati per la creazione dell'evento clinico di infezione (se presente)
     * @returns {Object|null} Dati formattati per l'evento infezione o null se non presente/valido
     */
    prepareInfectionEventData() {
        if (!this.hasValidSurgeryData() || !this.surgeryData.has_infection) {
            return null;
        }

        const data = this.getSurgeryData();
        
        // Verifica che i dati di infezione siano presenti
        if (!data.data_infezione) {
            return null;
        }

        return {
            tipo_evento: 'infezione',
            data_evento: data.data_infezione,
            agente_patogeno: data.agente_patogeno || null,
            descrizione: data.descrizione_infezione || null
        };
    }

    /**
     * Verifica se l'intervento include anche un'infezione
     * @returns {boolean} True se c'è un'infezione associata
     */
    hasAssociatedInfection() {
        return this.hasSurgeryData() && 
               this.surgeryData.has_infection === true && 
               this.surgeryData.data_infezione;
    }

    /**
     * Ottiene un riassunto dei dati per il debug
     * @returns {Object} Riassunto dei dati
     */
    getDataSummary() {
        if (!this.hasSurgeryData()) {
            return { hasData: false };
        }

        const data = this.surgeryData;
        const errors = this.getValidationErrors();

        return {
            hasData: true,
            isValid: errors.length === 0,
            errorCount: errors.length,
            dataIntervento: data.data_evento || 'Non specificata',
            tipoIntervento: data.tipo_intervento || 'Non specificato',
            hasInfection: data.has_infection || false,
            dataInfezione: data.data_infezione || 'Non specificata',
            agentePatogeno: data.agente_patogeno || 'Non specificato'
        };
    }
}

// Esporta istanza singleton
const surgeryDataManager = new SurgeryDataManager();
export default surgeryDataManager;
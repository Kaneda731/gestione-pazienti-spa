/**
 * Servizio centralizzato per la gestione dei dati di lookup
 */
import { codiciDimissioneService } from './codiciDimissioneService.js';
import { repartiService } from './repartiService.js';
import { clinicheService } from './clinicheService.js';
import { logger } from './logger/loggerService.js';

class LookupService {
    constructor() {
        this.cache = {
            codiciDimissione: null,
            reparti: null,
            cliniche: null,
            lastUpdate: null
        };
        this.cacheTimeout = 5 * 60 * 1000; // 5 minuti
    }

    /**
     * Verifica se la cache è valida
     * @returns {boolean} True se la cache è valida
     */
    isCacheValid() {
        return this.cache.lastUpdate && 
               (Date.now() - this.cache.lastUpdate) < this.cacheTimeout;
    }

    /**
     * Carica tutti i dati di lookup
     * @param {boolean} forceRefresh - Forza il refresh della cache
     * @returns {Promise<Object>} Oggetto con tutti i dati di lookup
     */
    async loadAll(forceRefresh = false) {
        try {
            if (!forceRefresh && this.isCacheValid()) {
                return {
                    codiciDimissione: this.cache.codiciDimissione,
                    reparti: this.cache.reparti,
                    cliniche: this.cache.cliniche
                };
            }

            logger.info('Caricamento dati di lookup...');

            const [codiciDimissione, reparti, cliniche] = await Promise.all([
                codiciDimissioneService.getAll(),
                repartiService.getAll(),
                clinicheService.getAll()
            ]);

            // Aggiorna la cache
            this.cache = {
                codiciDimissione,
                reparti,
                cliniche,
                lastUpdate: Date.now()
            };

            logger.info('Dati di lookup caricati con successo');

            return {
                codiciDimissione,
                reparti,
                cliniche
            };
        } catch (error) {
            logger.error('Errore nel caricamento dati di lookup:', error);
            throw error;
        }
    }

    /**
     * Popola una select con i codici di dimissione
     * @param {HTMLSelectElement} selectElement - Elemento select da popolare
     * @param {string} selectedValue - Valore selezionato (opzionale)
     */
    async populateCodiciDimissioneSelect(selectElement, selectedValue = null) {
        try {
            const { codiciDimissione } = await this.loadAll();
            
            // Pulisce le opzioni esistenti (tranne la prima)
            const firstOption = selectElement.querySelector('option[value=""]');
            selectElement.innerHTML = '';
            if (firstOption) {
                selectElement.appendChild(firstOption);
            }

            codiciDimissione.forEach(codice => {
                const option = document.createElement('option');
                option.value = codice.id;
                option.textContent = `${codice.codice} - ${codice.descrizione}`;
                option.dataset.codice = codice.codice;
                
                if (selectedValue && (selectedValue == codice.id || selectedValue == codice.codice)) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });

            // Trigger change event per custom select
            selectElement.dispatchEvent(new Event('change'));
        } catch (error) {
            logger.error('Errore nel popolare select codici dimissione:', error);
        }
    }

    /**
     * Popola una select con i reparti
     * @param {HTMLSelectElement} selectElement - Elemento select da popolare
     * @param {string} selectedValue - Valore selezionato (opzionale)
     * @param {string} tipo - Tipo di reparto ('interno', 'esterno', null per tutti)
     */
    async populateRepartiSelect(selectElement, selectedValue = null, tipo = 'interno') {
        try {
            const reparti = tipo ? 
                await repartiService.getAll(tipo) : 
                (await this.loadAll()).reparti;
            
            // Pulisce le opzioni esistenti (tranne la prima)
            const firstOption = selectElement.querySelector('option[value=""]');
            selectElement.innerHTML = '';
            if (firstOption) {
                selectElement.appendChild(firstOption);
            }

            reparti.forEach(reparto => {
                const option = document.createElement('option');
                option.value = reparto.id;
                option.textContent = reparto.nome;
                option.dataset.nome = reparto.nome;
                
                if (selectedValue && (selectedValue == reparto.id || selectedValue == reparto.nome)) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });

            // Trigger change event per custom select
            selectElement.dispatchEvent(new Event('change'));
        } catch (error) {
            logger.error('Errore nel popolare select reparti:', error);
        }
    }

    /**
     * Popola una select con le cliniche
     * @param {HTMLSelectElement} selectElement - Elemento select da popolare
     * @param {string} selectedValue - Valore selezionato (opzionale)
     */
    async populateClinicheSelect(selectElement, selectedValue = null) {
        try {
            const { cliniche } = await this.loadAll();
            
            // Pulisce le opzioni esistenti (tranne la prima)
            const firstOption = selectElement.querySelector('option[value=""]');
            selectElement.innerHTML = '';
            if (firstOption) {
                selectElement.appendChild(firstOption);
            }

            cliniche.forEach(clinica => {
                const option = document.createElement('option');
                option.value = clinica.id;
                option.textContent = `${clinica.codice} - ${clinica.nome}`;
                option.dataset.codice = clinica.codice;
                
                if (selectedValue && (selectedValue == clinica.id || selectedValue == clinica.codice)) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });

            // Trigger change event per custom select
            selectElement.dispatchEvent(new Event('change'));
        } catch (error) {
            logger.error('Errore nel popolare select cliniche:', error);
        }
    }

    /**
     * Invalida la cache
     */
    invalidateCache() {
        this.cache = {
            codiciDimissione: null,
            reparti: null,
            cliniche: null,
            lastUpdate: null
        };
    }
}

export const lookupService = new LookupService();
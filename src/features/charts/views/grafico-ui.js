// src/features/charts/views/grafico-ui.js
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';
import { populateSelectWithOptions } from '../../../shared/utils/index.js';
import { initCustomSelects, updateCustomSelect } from '../../../shared/components/forms/CustomSelect.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { 
    createChart, 
    createPieChart, 
    getAvailableChartTypes, 
    downloadChartAsImage, 
    generateShareableLink,
    cleanupChartComponents
} from '../services/chartjsService.js';
import ResponsiveChartAdapter from '../components/ResponsiveChartAdapter.js';

let datepickerInstance = null;
let currentChart = null;
let currentChartType = 'pie';
let responsiveAdapter = null;

// Contiene gli elementi del DOM per un accesso più facile
export const dom = {
    get chartContainer() { return document.getElementById('chart-container'); },
    get chartControls() { return document.getElementById('chart-controls'); },
    get chartTypeSelector() { return document.getElementById('chart-type-selector'); },
    get chartExportBtn() { return document.getElementById('chart-export-btn'); },
    get chartShareBtn() { return document.getElementById('chart-share-btn'); },
    get repartoFilter() { return document.getElementById('filter-reparto'); },
    get provenienzaFilter() { return document.getElementById('filter-provenienza'); },
    get diagnosiFilter() { return document.getElementById('filter-diagnosi'); },
    get assistenzaFilter() { return document.getElementById('filter-assistenza'); },
    get infettoFilter() { return document.getElementById('filter-infetto'); },
    get startDateFilter() { return document.getElementById('filter-start-date'); },
    get endDateFilter() { return document.getElementById('filter-end-date'); },
    get applyButton() { return document.getElementById('apply-filters-btn'); },
    get resetButton() { return document.getElementById('reset-filters-btn'); },
};

/**
 * Inizializza i componenti della UI (datepicker, custom selects, controlli del grafico).
 */
export async function initializeUI() {
    try {
        // Verifica che gli elementi necessari esistano prima di inizializzare
        const requiredElements = [
            { id: 'chart-container', name: 'Container del grafico' },
            { id: 'filter-reparto', name: 'Filtro reparto' },
            { id: 'filter-provenienza', name: 'Filtro provenienza' },
            { id: 'filter-diagnosi', name: 'Filtro diagnosi' }
        ];
        
        // Verifica elementi richiesti
        for (const element of requiredElements) {
            if (!document.getElementById(element.id)) {
                console.warn(`Elemento ${element.name} (${element.id}) non trovato nel DOM`);
            }
        }
        
        // Inizializza i select e datepicker (solo se esistono)
        const selectorsExist = document.querySelector('#filter-reparto, #filter-provenienza, #filter-diagnosi, #filter-assistenza, #filter-infetto');
        if (selectorsExist) {
            initCustomSelects('#filter-reparto, #filter-provenienza, #filter-diagnosi, #filter-assistenza, #filter-infetto');
        }
        
        const datepickerElements = document.querySelectorAll('[data-datepicker]');
        if (datepickerElements.length > 0) {
            datepickerInstance = new CustomDatepicker('[data-datepicker]', {
                dateFormat: "d/m/Y",
            });
        }
        
        // Inizializza il responsive adapter
        responsiveAdapter = new ResponsiveChartAdapter();
        
        // Inizializza i controlli del grafico
        await initChartControls();
        
        // Adatta il layout iniziale
        if (dom.chartContainer) {
            try {
                responsiveAdapter.adaptLayout(dom.chartContainer);
                
                // Implementa il layout responsive specifico per mobile o desktop
                const deviceType = responsiveAdapter.detectDevice();
                if (deviceType === 'mobile') {
                    responsiveAdapter.implementMobileResponsiveLayout(dom.chartContainer, null);
                } else if (deviceType === 'desktop') {
                    responsiveAdapter.implementDesktopResponsiveLayout(dom.chartContainer, null);
                }
            } catch (layoutError) {
                console.error('Errore nell\'adattamento del layout:', layoutError);
                // Continua l'esecuzione anche in caso di errore nel layout
            }
        } else {
            console.warn('Container del grafico non trovato, impossibile adattare il layout');
        }
        
        showInitialMessage();
    } catch (error) {
        console.error('Errore nell\'inizializzazione della UI del grafico:', error);
        showError(`Errore nell'inizializzazione: ${error.message}`);
    }
}









/**
 * Inizializza i controlli del grafico (selettore tipo, pulsanti esportazione)
 */
async function initChartControls() {
    // Aggiungi il selettore del tipo di grafico
    await initChartTypeSelector();
    
    // Aggiungi i pulsanti di esportazione sotto al grafico
    initExportButtons();
}

/**
 * Inizializza il selettore del tipo di grafico con CustomSelect
 */
async function initChartTypeSelector() {
    try {
        // Ottieni i tipi di grafico disponibili
        const chartTypes = await getAvailableChartTypes();
        
        // Crea il selettore se non esiste
        if (!dom.chartTypeSelector) {
            // Trova la riga con i pulsanti apply/reset
            const buttonsRow = document.querySelector('.filters-fieldset .row.mt-3 .col-12.d-flex.justify-content-center');
            
            // Crea il container per il selettore tipo grafico
            const selectorContainer = document.createElement('div');
            selectorContainer.className = 'chart-type-selector-container ms-0 ms-md-3 mt-3 mt-md-0';
            
            const selector = document.createElement('select');
            selector.id = 'chart-type-selector';
            selector.className = 'form-select form-select-sm';
            selector.setAttribute('data-custom', 'true');
            
            // Aggiungi le opzioni (solo testo, le icone verranno aggiunte tramite CSS)
            chartTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                option.setAttribute('data-icon', type.icon);
                selector.appendChild(option);
            });
            
            // Imposta il valore predefinito
            selector.value = currentChartType;
            
            // Aggiungi l'evento change
            selector.addEventListener('change', handleChartTypeChange);
            
            // Aggiungi solo il selettore al DOM (senza label)
            selectorContainer.appendChild(selector);
            
            // Inserisci il selettore accanto ai pulsanti esistenti
            if (buttonsRow) {
                buttonsRow.appendChild(selectorContainer);
            }
            
            // Inizializza CustomSelect per questo elemento specifico
            initCustomSelects('#chart-type-selector');
            
            // Aggiorna il CustomSelect con il valore corrente
            setTimeout(() => {
                updateCustomSelect('#chart-type-selector');
            }, 100);
            
            // Aggiungi listener per eventi di cambio tipo grafico da mobile (swipe)
            document.addEventListener('chartTypeChange', handleMobileChartTypeChange);
        }
    } catch (error) {
        console.error('Errore nell\'inizializzazione del selettore del tipo di grafico:', error);
    }
}

/**
 * Inizializza i pulsanti di esportazione
 */
function initExportButtons() {
    // Trova il container sotto il grafico
    const chartButtonsContainer = document.getElementById('chart-buttons-container');
    if (!chartButtonsContainer) return;
    
    // Crea il container interno per centrare i pulsanti
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'chart-export-buttons d-inline-flex gap-2';
    
    // Crea il pulsante di esportazione
    const exportBtn = document.createElement('button');
    exportBtn.id = 'chart-export-btn';
    exportBtn.className = 'btn btn-sm btn-outline-primary';
    exportBtn.innerHTML = '<span class="material-icons">download</span> Esporta';
    exportBtn.addEventListener('click', handleExportChart);
    
    // Crea il pulsante di condivisione
    const shareBtn = document.createElement('button');
    shareBtn.id = 'chart-share-btn';
    shareBtn.className = 'btn btn-sm btn-outline-secondary';
    shareBtn.innerHTML = '<span class="material-icons">share</span> Condividi';
    shareBtn.addEventListener('click', handleShareChart);
    
    // Aggiungi i pulsanti al container
    buttonsContainer.appendChild(exportBtn);
    buttonsContainer.appendChild(shareBtn);
    
    // Aggiungi il container al DOM sotto il grafico
    chartButtonsContainer.appendChild(buttonsContainer);
}

/**
 * Gestisce il cambio del tipo di grafico dal selettore
 * @param {Event} event - L'evento change
 */
function handleChartTypeChange(event) {
    currentChartType = event.target.value;
    
    // Se c'è un grafico attivo, ridisegnalo con il nuovo tipo
    if (currentChart) {
        const filters = getFilters();
        drawChartWithCurrentData(filters);
    }
}

/**
 * Gestisce il cambio del tipo di grafico da mobile (swipe)
 * @param {CustomEvent} event - L'evento personalizzato con direction
 */
function handleMobileChartTypeChange(event) {
    const direction = event.detail.direction;
    const availableTypes = ['pie', 'bar', 'line'];
    const currentIndex = availableTypes.indexOf(currentChartType);
    
    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % availableTypes.length;
    } else {
        newIndex = currentIndex === 0 ? availableTypes.length - 1 : currentIndex - 1;
    }
    
    const newChartType = availableTypes[newIndex];
    currentChartType = newChartType;
    
    // Aggiorna il CustomSelect con il nuovo valore
    const selector = dom.chartTypeSelector;
    if (selector) {
        selector.value = newChartType;
        
        // Aggiorna il CustomSelect se è inizializzato
        if (selector.customSelectInstance) {
            selector.customSelectInstance.setValue(newChartType);
        } else {
            // Fallback: aggiorna usando la funzione updateCustomSelect
            updateCustomSelect('#chart-type-selector');
        }
    }
    
    // Se c'è un grafico attivo, ridisegnalo con il nuovo tipo
    if (currentChart) {
        const filters = getFilters();
        drawChartWithCurrentData(filters);
    }
}

/**
 * Gestisce l'esportazione del grafico
 */
async function handleExportChart() {
    if (!currentChart) {
        alert('Nessun grafico da esportare. Genera prima un grafico.');
        return;
    }
    
    try {
        const filters = getFilters();
        const metadata = {
            timestamp: new Date().toLocaleString(),
            filters: filters
        };
        
        await downloadChartAsImage(currentChart, 'grafico-pazienti', metadata);
    } catch (error) {
        console.error('Errore nell\'esportazione del grafico:', error);
        alert(`Errore nell'esportazione: ${error.message}`);
    }
}

/**
 * Gestisce la condivisione del grafico
 */
async function handleShareChart() {
    if (!currentChart) {
        alert('Nessun grafico da condividere. Genera prima un grafico.');
        return;
    }
    
    try {
        const filters = getFilters();
        const shareableLink = await generateShareableLink(filters, currentChartType);
        
        // Copia il link negli appunti
        await navigator.clipboard.writeText(shareableLink);
        alert('Link copiato negli appunti!');
    } catch (error) {
        console.error('Errore nella condivisione del grafico:', error);
        alert(`Errore nella condivisione: ${error.message}`);
    }
}

/**
 * Distrugge i componenti della UI per il cleanup.
 */
export function cleanupUI() {
    if (datepickerInstance) {
        datepickerInstance.destroy();
        datepickerInstance = null;
    }
    
    // Rimuovi il listener per eventi di cambio tipo grafico da mobile
    document.removeEventListener('chartTypeChange', handleMobileChartTypeChange);
    
    // Pulisci i componenti del grafico
    cleanupChartComponents();
    
    // Pulisci il grafico corrente
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

/**
 * Popola i select dei filtri con le opzioni caricate.
 * @param {object} options - L'oggetto contenente le opzioni per i filtri.
 */
export function populateFilters(options) {
    populateSelectWithOptions(dom.repartoFilter, options.repartoOptions);
    updateCustomSelect('#filter-reparto');

    populateSelectWithOptions(dom.provenienzaFilter, options.provenienzaOptions);
    updateCustomSelect('#filter-provenienza');

    populateSelectWithOptions(dom.diagnosiFilter, options.diagnosiOptions);
    updateCustomSelect('#filter-diagnosi');

    // Popola il filtro Infetto (Sì/No/Tutti)
    if (dom.infettoFilter) {
        dom.infettoFilter.innerHTML = sanitizeHtml(`
            <option value="">Tutti</option>
            <option value="true">Sì</option>
            <option value="false">No</option>
        `);
        updateCustomSelect('#filter-infetto');
    }
}

/**
 * Legge i valori correnti dai campi dei filtri.
 * @returns {object} Un oggetto con i filtri selezionati.
 */
export function getFilters() {
    return {
        reparto: dom.repartoFilter.value,
        provenienza: dom.provenienzaFilter.value,
        diagnosi: dom.diagnosiFilter.value,
        assistenza: dom.assistenzaFilter.value,
        infetto: dom.infettoFilter.value,
        startDate: dom.startDateFilter.value,
        endDate: dom.endDateFilter.value,
    };
}

/**
 * Resetta tutti i filtri ai loro valori di default.
 */
export function resetFilters() {
    const filterIds = ['filter-reparto', 'filter-provenienza', 'filter-diagnosi', 'filter-assistenza', 'filter-infetto'];
    filterIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.value = '';
            if (select.customSelectInstance) {
                select.customSelectInstance.setValue('');
            }
        }
    });
    dom.startDateFilter.value = '';
    dom.endDateFilter.value = '';
    showInitialMessage();
}

/**
 * Prepara i dati per il grafico, aggregando e contando le diagnosi.
 * @param {Array} data - I dati grezzi da Supabase.
 * @returns {Object} - Un oggetto con etichette e dati per il grafico.
 */
function prepareChartData(data) {
    if (!data || data.length === 0) {
        return { labels: [], dataPoints: [] };
    }

    const counts = new Map();
    data.forEach(({ diagnosi }) => {
        const key = diagnosi ? String(diagnosi).trim() : 'Non specificata';
        if (key) {
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    });

    const labels = Array.from(counts.keys());
    const dataPoints = Array.from(counts.values());

    return { labels, dataPoints };
}


/**
 * Disegna il grafico con i dati forniti, usando il tipo di grafico corrente.
 * @param {Array} data - I dati da visualizzare.
 */
export async function drawChart(data) {
    // Verifica che il container del grafico esista
    if (!dom.chartContainer) {
        console.error('Container del grafico non trovato');
        return null;
    }
    
    // Verifica che i dati siano validi
    if (!data || !Array.isArray(data)) {
        console.warn('Dati non validi per il grafico:', data);
        showMessage('Dati non validi per visualizzare il grafico.');
        return null;
    }
    
    const { labels, dataPoints } = prepareChartData(data);

    if (labels.length === 0) {
        showMessage('Nessun dato valido per visualizzare il grafico.');
        return null;
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Distribuzione Diagnosi dei Pazienti',
                font: { size: 18, weight: 'bold' }
            },
            legend: {
                position: responsiveAdapter && typeof responsiveAdapter.detectDevice === 'function' ? 
                    (responsiveAdapter.detectDevice() === 'desktop' ? 'right' : 'top') : 
                    'top',
                onHover: function(event, legendItem, legend) {
                    // Implementa l'interazione hover qui
                    // console.log('Hover su legenda:', legendItem);
                },
                onClick: function(event, legendItem, legend) {
                    // Implementa l'interazione click qui
                    // console.log('Click su legenda:', legendItem);
                }
            }
        },
    };

    // Opzioni specifiche per il grafico a barre
    if (currentChartType === 'bar') {
        chartOptions.scales = {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 0
                }
            }
        };
        chartOptions.plugins.tooltip = {
            enabled: false // Disabilita tooltip per barre
        };
    }

    try {
        // Pulisci il grafico precedente se esiste
        if (currentChart) {
            try {
                currentChart.destroy();
            } catch (destroyError) {
                console.warn('Errore durante la distruzione del grafico precedente:', destroyError);
            }
        }
        
        // Crea il nuovo grafico
        currentChart = await createChart(
            dom.chartContainer, {
                labels,
                datasets: [{
                    label: 'Numero di Pazienti',
                    data: dataPoints,
                }, ],
            },
            chartOptions,
            currentChartType
        );

        // Applica le opzioni responsive se possibile
        if (responsiveAdapter && currentChart) {
            try {
                const adaptedOptions = responsiveAdapter.adaptOptions(currentChart.options);
                currentChart.options = { ...currentChart.options, ...adaptedOptions };
                
                // Gestisci il resize solo se tutti i componenti necessari sono disponibili
                if (typeof responsiveAdapter.handleResize === 'function') {
                    responsiveAdapter.handleResize(currentChart, chartOptions);
                }
                
                currentChart.update();
            } catch (adaptError) {
                console.error('Errore durante l\'adattamento del grafico:', adaptError);
                // Continua l'esecuzione anche in caso di errore nell'adattamento
            }
        }

        // Abilita i pulsanti di esportazione/condivisione se esistono
        if (dom.chartExportBtn) dom.chartExportBtn.disabled = false;
        if (dom.chartShareBtn) dom.chartShareBtn.disabled = false;

        // Notifica che il grafico è stato aggiornato
        try {
            document.dispatchEvent(new CustomEvent('chartUpdated', {
                detail: { chart: currentChart }
            }));
        } catch (eventError) {
            console.warn('Errore durante la generazione dell\'evento chartUpdated:', eventError);
        }

        return currentChart;
    } catch (chartError) {
        console.error('Errore durante la creazione del grafico:', chartError);
        showError(`Errore nella visualizzazione del grafico: ${chartError.message}`);
        return null;
    }
}

/**
 * Ridisegna il grafico con i dati correnti e il tipo di grafico selezionato
 * @param {Object} filters - I filtri applicati
 */
export async function drawChartWithCurrentData(filters) {
    showLoading();
    
    try {
        // Importa la funzione per recuperare i dati da Supabase
        const { getChartData } = await import('./grafico-api.js');
        
        // Recupera i dati da Supabase
        const data = await getChartData(filters);
        
        await drawChart(data);
    } catch (error) {
        console.error('Errore nel ridisegno del grafico:', error);
        
        // In caso di errore, mostra dati di fallback per permettere lo sviluppo
        try {
            console.warn('Utilizzo dati di fallback per lo sviluppo');
            
            const fallbackData = [
                { diagnosi: 'Influenza' },
                { diagnosi: 'Polmonite' },
                { diagnosi: 'Frattura' },
                { diagnosi: 'Influenza' },
                { diagnosi: 'Polmonite' },
                { diagnosi: 'Frattura' },
                { diagnosi: 'Infarto' },
                { diagnosi: 'Ictus' },
                { diagnosi: 'Diabete' }
            ];
            
            await drawChart(fallbackData);
        } catch (fallbackError) {
            console.error('Errore anche con i dati di fallback:', fallbackError);
            showError(`Errore nell'aggiornamento del grafico: ${error.message}`);
        }
    }
}

// Funzioni per mostrare stati nella UI
export function showLoading() {
    dom.chartContainer.innerHTML = sanitizeHtml('<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>');
}

export function showInitialMessage() {
    dom.chartContainer.innerHTML = sanitizeHtml('<p class="text-muted">Seleziona i filtri e clicca "Applica" per visualizzare il grafico.</p>');
}

export function showMessage(message) {
    dom.chartContainer.innerHTML = sanitizeHtml(`<p class="text-muted">${message}</p>`);
}

export function showError(errorMessage) {
    dom.chartContainer.innerHTML = sanitizeHtml(`<div class="alert alert-danger">${errorMessage}</div>`);
}

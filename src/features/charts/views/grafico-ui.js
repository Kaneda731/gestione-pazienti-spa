// src/features/charts/views/grafico-ui.js
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
    // Inizializza i select e datepicker
    initCustomSelects('#filter-reparto, #filter-provenienza, #filter-diagnosi, #filter-assistenza, #filter-infetto');
    datepickerInstance = new CustomDatepicker('[data-datepicker]', {
        dateFormat: "d/m/Y",
    });
    
    // Inizializza il responsive adapter
    responsiveAdapter = new ResponsiveChartAdapter();
    
    // Inizializza i controlli del grafico
    await initChartControls();
    
    // Setup controlli touch per mobile
    if (dom.chartContainer) {
        responsiveAdapter.setupMobileTouchControls(dom.chartContainer);
        
        // Adatta il layout iniziale
        responsiveAdapter.adaptLayout(dom.chartContainer);
        
        // Implementa il layout responsive specifico per mobile
        if (responsiveAdapter.detectDevice() === 'mobile') {
            responsiveAdapter.implementMobileResponsiveLayout(dom.chartContainer, null);
        }
    }
    
    // Aggiungi listener per swipe gestures su mobile
    setupMobileSwipeListener();
    
    // Ottimizza il layout per mobile
    optimizeMobileLayout();
    
    // Setup listener per eventi di esportazione e condivisione da mobile
    setupMobileChartEventListeners();
    
    // Setup listener per orientamento su mobile
    setupOrientationChangeListener();
    
    showInitialMessage();
}


/**
 * Gestisce il cambio di tipo grafico tramite swipe
 * @param {string} direction - 'next' o 'previous'
 */
function handleChartTypeSwipe(direction) {
    if (!dom.chartTypeSelector) return;
    
    const currentIndex = dom.chartTypeSelector.selectedIndex;
    const options = dom.chartTypeSelector.options;
    let newIndex;
    
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % options.length;
    } else {
        newIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
    }
    
    dom.chartTypeSelector.selectedIndex = newIndex;
    dom.chartTypeSelector.dispatchEvent(new Event('change'));
    
    // Feedback visivo per mobile
    if (responsiveAdapter && responsiveAdapter.detectDevice() === 'mobile') {
        responsiveAdapter.showMobileToast(`Tipo grafico: ${options[newIndex].text}`);
    }
}


/**
 * Ottimizza i filtri per dispositivi mobile
 */
function optimizeFiltersForMobile() {
    const filterContainer = document.querySelector('.filters-container');
    if (!filterContainer) return;
    
    // Aggiungi classe per styling mobile
    filterContainer.classList.add('mobile-filters');
    
    // Ottimizza i select per touch
    const selects = filterContainer.querySelectorAll('select');
    selects.forEach(select => {
        select.style.minHeight = '44px';
        select.style.fontSize = '16px'; // Previene zoom su iOS
    });
    
    // Ottimizza i pulsanti per touch
    const buttons = filterContainer.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.minHeight = '44px';
        button.style.minWidth = '44px';
        button.classList.add('touch-optimized');
    });
}

/**
 * Ottimizza i controlli del grafico per mobile
 */
function optimizeChartControlsForMobile() {
    if (!dom.chartControls) return;
    
    // Aggiungi classe per styling mobile
    dom.chartControls.classList.add('mobile-chart-controls-optimized');
    
    // Nascondi controlli non essenziali su schermi molto piccoli
    if (window.innerWidth <= 480) {
        const exportButtons = dom.chartControls.querySelectorAll('.chart-export-buttons button');
        exportButtons.forEach(button => {
            const text = button.querySelector('.btn-text');
            if (text) {
                text.style.display = 'none';
            }
        });
    }
}



/**
 * Inizializza i controlli del grafico (selettore tipo, pulsanti esportazione)
 */
async function initChartControls() {
    // Verifica se i controlli del grafico esistono già
    if (!dom.chartControls) {
        // Crea il container dei controlli se non esiste
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'chart-controls';
        controlsContainer.className = 'chart-controls d-flex justify-content-between align-items-center mb-3';
        
        // Inserisci il container prima del container del grafico
        dom.chartContainer.parentNode.insertBefore(controlsContainer, dom.chartContainer);
    }
    
    // Aggiungi il selettore del tipo di grafico
    await initChartTypeSelector();
    
    // Aggiungi i pulsanti di esportazione
    initExportButtons();
}

/**
 * Inizializza il selettore del tipo di grafico
 */
async function initChartTypeSelector() {
    try {
        // Ottieni i tipi di grafico disponibili
        const chartTypes = await getAvailableChartTypes();
        
        // Crea il selettore se non esiste
        if (!dom.chartTypeSelector) {
            const selectorContainer = document.createElement('div');
            selectorContainer.className = 'chart-type-selector-container';
            
            const selectorLabel = document.createElement('label');
            selectorLabel.htmlFor = 'chart-type-selector';
            selectorLabel.className = 'me-2';
            selectorLabel.textContent = 'Tipo di grafico:';
            
            const selector = document.createElement('select');
            selector.id = 'chart-type-selector';
            selector.className = 'form-select form-select-sm';
            
            // Aggiungi le opzioni
            chartTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.innerHTML = `${type.icon} ${type.name}`;
                selector.appendChild(option);
            });
            
            // Imposta il valore predefinito
            selector.value = currentChartType;
            
            // Aggiungi l'evento change
            selector.addEventListener('change', handleChartTypeChange);
            
            // Aggiungi gli elementi al DOM
            selectorContainer.appendChild(selectorLabel);
            selectorContainer.appendChild(selector);
            dom.chartControls.appendChild(selectorContainer);
        }
    } catch (error) {
        console.error('Errore nell\'inizializzazione del selettore del tipo di grafico:', error);
    }
}

/**
 * Inizializza i pulsanti di esportazione
 */
function initExportButtons() {
    // Crea il container dei pulsanti se non esiste
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'chart-export-buttons';
    
    // Crea il pulsante di esportazione
    const exportBtn = document.createElement('button');
    exportBtn.id = 'chart-export-btn';
    exportBtn.className = 'btn btn-sm btn-outline-primary me-2';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Esporta';
    exportBtn.addEventListener('click', handleExportChart);
    
    // Crea il pulsante di condivisione
    const shareBtn = document.createElement('button');
    shareBtn.id = 'chart-share-btn';
    shareBtn.className = 'btn btn-sm btn-outline-secondary';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Condividi';
    shareBtn.addEventListener('click', handleShareChart);
    
    // Aggiungi i pulsanti al container
    buttonsContainer.appendChild(exportBtn);
    buttonsContainer.appendChild(shareBtn);
    
    // Aggiungi il container al DOM
    dom.chartControls.appendChild(buttonsContainer);
}

/**
 * Gestisce il cambio del tipo di grafico
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
        dom.infettoFilter.innerHTML = `
            <option value="">Tutti</option>
            <option value="true">Sì</option>
            <option value="false">No</option>
        `;
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

    const counts = data.reduce((acc, { diagnosi }) => {
        const key = diagnosi ? String(diagnosi).trim() : 'Non specificata';
        if (key) {
            acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
    }, {});

    const entries = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]); // Ordina per valore decrescente

    return {
        labels: entries.map(e => e[0]),
        dataPoints: entries.map(e => e[1])
    };
}


/**
 * Disegna il grafico con i dati forniti, usando il tipo di grafico corrente.
 * @param {Array} data - I dati da visualizzare.
 */
export async function drawChart(data) {
    const { labels, dataPoints } = prepareChartData(data);

    if (labels.length === 0) {
        showMessage('Nessun dato valido per visualizzare il grafico.');
        return;
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
                position: 'top',
            },
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
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y;
                    }
                    return label;
                }
            }
        };
    }

    try {
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

        if (responsiveAdapter && currentChart) {
            const adaptedOptions = responsiveAdapter.adaptOptions(currentChart.options);
            currentChart.options = { ...currentChart.options, ...adaptedOptions };
            responsiveAdapter.handleResize(currentChart, chartOptions);
            currentChart.update();
        }

        if (dom.chartExportBtn) dom.chartExportBtn.disabled = false;
        if (dom.chartShareBtn) dom.chartShareBtn.disabled = false;

        document.dispatchEvent(new CustomEvent('chartUpdated', {
            detail: { chart: currentChart }
        }));

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
    dom.chartContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
}

export function showInitialMessage() {
    dom.chartContainer.innerHTML = '<p class="text-muted">Seleziona i filtri e clicca "Applica" per visualizzare il grafico.</p>';
}

export function showMessage(message) {
    dom.chartContainer.innerHTML = `<p class="text-muted">${message}</p>`;
}

export function showError(errorMessage) {
    dom.chartContainer.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
}

/**
 * Setup del listener per i gesti di swipe su mobile
 */
function setupMobileSwipeListener() {
    // Ascolta l'evento personalizzato per il cambio tipo di grafico via swipe
    document.addEventListener('chartTypeSwipe', async (event) => {
        const direction = event.detail.direction;
        
        try {
            const chartTypes = await getAvailableChartTypes();
            const currentIndex = chartTypes.findIndex(type => type.id === currentChartType);
            
            let newIndex;
            if (direction === 'next') {
                newIndex = (currentIndex + 1) % chartTypes.length;
            } else {
                newIndex = currentIndex === 0 ? chartTypes.length - 1 : currentIndex - 1;
            }
            
            const newChartType = chartTypes[newIndex].id;
            
            // Aggiorna il selettore se esiste
            if (dom.chartTypeSelector) {
                dom.chartTypeSelector.value = newChartType;
            }
            
            // Aggiorna il tipo corrente
            currentChartType = newChartType;
            
            // Ridisegna il grafico se esiste
            if (currentChart) {
                const filters = getFilters();
                await drawChartWithCurrentData(filters);
                
                // Mostra feedback all'utente
                if (responsiveAdapter) {
                    responsiveAdapter.showMobileToast(`Grafico cambiato: ${chartTypes[newIndex].name}`);
                }
            }
        } catch (error) {
            console.error('Errore nel cambio tipo di grafico via swipe:', error);
        }
    });
}

/**
 * Ottimizza il layout per dispositivi mobile
 */
function optimizeMobileLayout() {
    if (!responsiveAdapter || responsiveAdapter.detectDevice() !== 'mobile') return;
    
    // Ottimizza il container principale
    const mainContainer = dom.chartContainer?.parentElement;
    if (mainContainer) {
        mainContainer.classList.add('mobile-chart-layout');
        
        // Aggiungi stili specifici per il layout mobile
        if (!document.getElementById('mobile-layout-styles')) {
            const styles = document.createElement('style');
            styles.id = 'mobile-layout-styles';
            styles.textContent = `
                .mobile-chart-layout {
                    padding: 0.5rem;
                    margin: 0;
                }
                
                .mobile-chart-layout .chart-controls {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: var(--bs-body-bg);
                    border-bottom: 1px solid var(--bs-border-color);
                    margin-bottom: 1rem;
                    border-radius: 0 0 12px 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                .mobile-chart-layout .chart-container {
                    margin-bottom: 1rem;
                }
                
                /* Ottimizzazioni per filtri su mobile */
                .mobile-chart-layout .filters-container {
                    background: var(--bs-body-bg);
                    border: 1px solid var(--bs-border-color);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }
                
                .mobile-chart-layout .filters-container .row {
                    gap: 0.75rem;
                }
                
                .mobile-chart-layout .filters-container .col-md-6,
                .mobile-chart-layout .filters-container .col-md-4 {
                    flex: 1 1 100%;
                    max-width: 100%;
                }
                
                /* Pulsanti di azione ottimizzati per mobile */
                .mobile-chart-layout .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                
                .mobile-chart-layout .action-buttons .btn {
                    flex: 1;
                    min-height: 44px;
                    font-weight: 500;
                    border-radius: 8px;
                }
                
                /* Miglioramenti per l'accessibilità su mobile */
                .mobile-chart-layout input,
                .mobile-chart-layout select,
                .mobile-chart-layout button {
                    min-height: 44px;
                }
                
                .mobile-chart-layout .form-label {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--bs-body-color);
                }
                
                /* Ottimizzazioni per il datepicker su mobile */
                .mobile-chart-layout .flatpickr-input {
                    font-size: 16px; /* Previene lo zoom su iOS */
                    padding: 0.75rem;
                }
                
                /* Messaggi di stato ottimizzati per mobile */
                .mobile-chart-layout .alert {
                    border-radius: 12px;
                    padding: 1rem;
                    margin: 1rem 0;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                
                .mobile-chart-layout .text-muted {
                    text-align: center;
                    padding: 2rem 1rem;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                
                /* Loading spinner ottimizzato per mobile */
                .mobile-chart-layout .spinner-border {
                    width: 3rem;
                    height: 3rem;
                    margin: 2rem auto;
                    display: block;
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    // Ottimizza i controlli del grafico per mobile
    optimizeMobileChartControls();
    
    // Ottimizza i filtri per mobile
    optimizeMobileFilters();
    
    // Aggiungi supporto per orientamento
    setupOrientationHandler();
}

/**
 * Ottimizza i controlli del grafico per mobile
 */
function optimizeMobileChartControls() {
    if (!dom.chartControls) return;
    
    // Riorganizza i controlli per mobile
    dom.chartControls.classList.add('mobile-optimized');
    
    // Trova i pulsanti di esportazione e aggiorna il testo per mobile
    const exportBtn = dom.chartExportBtn;
    const shareBtn = dom.chartShareBtn;
    
    if (exportBtn && window.innerWidth <= 480) {
        exportBtn.innerHTML = '<i class="fas fa-download"></i><span class="btn-text"> Esporta</span>';
    }
    
    if (shareBtn && window.innerWidth <= 480) {
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i><span class="btn-text"> Condividi</span>';
    }
    
    // Aggiungi tooltip per i pulsanti su mobile
    if (exportBtn) {
        exportBtn.setAttribute('title', 'Esporta grafico come immagine');
        exportBtn.setAttribute('aria-label', 'Esporta grafico come immagine');
    }
    
    if (shareBtn) {
        shareBtn.setAttribute('title', 'Condividi link del grafico');
        shareBtn.setAttribute('aria-label', 'Condividi link del grafico');
    }
}

/**
 * Ottimizza i filtri per mobile
 */
function optimizeMobileFilters() {
    const filtersContainer = document.querySelector('.filters-container, .card-body');
    if (!filtersContainer) return;
    
    filtersContainer.classList.add('mobile-filters');
    
    // Aggiungi stili specifici per i filtri mobile
    if (!document.getElementById('mobile-filters-styles')) {
        const styles = document.createElement('style');
        styles.id = 'mobile-filters-styles';
        styles.textContent = `
            .mobile-filters .form-group {
                margin-bottom: 1rem;
            }
            
            .mobile-filters .form-label {
                display: block;
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }
            
            .mobile-filters .form-control,
            .mobile-filters .form-select {
                font-size: 16px; /* Previene lo zoom su iOS */
                padding: 0.75rem;
                border-radius: 8px;
                border: 2px solid var(--bs-border-color);
                transition: border-color 0.2s ease;
            }
            
            .mobile-filters .form-control:focus,
            .mobile-filters .form-select:focus {
                border-color: var(--bs-primary);
                box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
            }
            
            /* Custom select ottimizzato per mobile */
            .mobile-filters .custom-select-wrapper {
                position: relative;
            }
            
            .mobile-filters .custom-select-wrapper::after {
                content: '▼';
                position: absolute;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
                pointer-events: none;
                color: var(--bs-secondary);
                font-size: 0.8rem;
            }
            
            /* Datepicker ottimizzato per mobile */
            .mobile-filters .flatpickr-wrapper {
                width: 100%;
            }
            
            .mobile-filters .flatpickr-input {
                width: 100%;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='%23666' d='M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1H2zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5z'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                background-size: 16px;
                padding-right: 3rem;
            }
        `;
        document.head.appendChild(styles);
    }
}




/**
 * Setup del listener per eventi di esportazione e condivisione da mobile
 */
function setupMobileChartEventListeners() {
    // Listener per eventi di esportazione da mobile
    document.addEventListener('chartExportRequested', async (event) => {
        const chart = event.detail.chart;
        if (chart) {
            try {
                await downloadChartAsImage(chart, 'png', {
                    timestamp: new Date().toLocaleString('it-IT'),
                    filters: getFilters()
                });
                
                if (responsiveAdapter) {
                    responsiveAdapter.showMobileToast('Grafico esportato con successo!');
                }
            } catch (error) {
                console.error('Errore nell\'esportazione da mobile:', error);
                if (responsiveAdapter) {
                    responsiveAdapter.showMobileToast('Errore nell\'esportazione');
                }
            }
        }
    });
    
    // Listener per eventi di condivisione da mobile
    document.addEventListener('chartShareRequested', async (event) => {
        const chart = event.detail.chart;
        if (chart) {
            try {
                const shareableLink = await generateShareableLink(getFilters(), currentChartType);
                
                // Usa Web Share API se disponibile
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Grafico Pazienti',
                            text: 'Visualizza questo grafico dei dati pazienti',
                            url: shareableLink
                        });
                        
                        if (responsiveAdapter) {
                            responsiveAdapter.showMobileToast('Condiviso con successo!');
                        }
                    } catch (shareError) {
                        // Fallback alla copia negli appunti
                        await navigator.clipboard.writeText(shareableLink);
                        if (responsiveAdapter) {
                            responsiveAdapter.showMobileToast('Link copiato negli appunti!');
                        }
                    }
                } else {
                    // Fallback per browser che non supportano Web Share API
                    await navigator.clipboard.writeText(shareableLink);
                    if (responsiveAdapter) {
                        responsiveAdapter.showMobileToast('Link copiato negli appunti!');
                    }
                }
            } catch (error) {
                console.error('Errore nella condivisione da mobile:', error);
                if (responsiveAdapter) {
                    responsiveAdapter.showMobileToast('Errore nella condivisione');
                }
            }
        }
    });
    
    // Listener per eventi personalizzati dal ResponsiveChartAdapter
    document.addEventListener('exportChart', () => {
        if (currentChart) {
            document.dispatchEvent(new CustomEvent('chartExportRequested', {
                detail: { chart: currentChart }
            }));
        }
    });
    
    document.addEventListener('shareChart', () => {
        if (currentChart) {
            document.dispatchEvent(new CustomEvent('chartShareRequested', {
                detail: { chart: currentChart }
            }));
        }
    });
    
    // Listener per il selettore del tipo di grafico da mobile
    document.addEventListener('showChartTypeSelector', () => {
        showMobileChartTypeSelector();
    });
}

/**
 * Setup del listener per il cambio di orientamento su mobile
 */
function setupOrientationChangeListener() {
    if (!responsiveAdapter) return;
    
    const handleOrientationChange = () => {
        setTimeout(() => {
            if (dom.chartContainer) {
                // Ottimizza per il nuovo orientamento
                responsiveAdapter.optimizeForOrientation(dom.chartContainer);
                
                // Aggiorna il grafico se esiste
                if (currentChart) {
                    // Adatta le opzioni per il nuovo orientamento
                    const adaptedOptions = responsiveAdapter.adaptOptions(currentChart.options);
                    currentChart.options = { ...currentChart.options, ...adaptedOptions };
                    
                    // Ridimensiona il grafico
                    currentChart.resize();
                    currentChart.update();
                }
                
                // Riposiziona la legenda se necessario
                if (currentChart && responsiveAdapter.detectDevice() === 'mobile') {
                    responsiveAdapter.positionLegendBelowChart(dom.chartContainer, currentChart);
                }
            }
        }, 150); // Delay per permettere al browser di aggiornare le dimensioni
    };
    
    // Ascolta i cambi di orientamento
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Ascolta anche i resize per dispositivi che non supportano orientationchange
    window.addEventListener('resize', responsiveAdapter.throttle(handleOrientationChange, 300));
}

/**
 * Mostra il selettore del tipo di grafico ottimizzato per mobile
 */
async function showMobileChartTypeSelector() {
    try {
        const chartTypes = await getAvailableChartTypes();
        
        // Rimuovi selettore esistente se presente
        const existingSelector = document.getElementById('mobile-chart-type-modal');
        if (existingSelector) {
            existingSelector.remove();
        }
        
        // Crea il modal per la selezione del tipo di grafico
        const modal = document.createElement('div');
        modal.id = 'mobile-chart-type-modal';
        modal.className = 'mobile-chart-type-modal';
        
        modal.innerHTML = `
            <div class="mobile-chart-type-modal-content">
                <div class="mobile-chart-type-modal-header">
                    <h3>Seleziona Tipo di Grafico</h3>
                    <button class="mobile-chart-type-modal-close" aria-label="Chiudi">&times;</button>
                </div>
                <div class="mobile-chart-type-modal-body">
                    ${chartTypes.map(type => `
                        <div class="chart-type-option ${type.id === currentChartType ? 'active' : ''}" data-type="${type.id}">
                            <div class="chart-type-icon">${type.icon}</div>
                            <div class="chart-type-info">
                                <h4>${type.name}</h4>
                                <p>${type.description || 'Visualizza i dati in formato ' + type.name.toLowerCase()}</p>
                            </div>
                            ${type.id === currentChartType ? '<i class="fas fa-check chart-type-check"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Aggiungi gli stili inline se non esistono già
        if (!document.getElementById('mobile-chart-type-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'mobile-chart-type-modal-styles';
            styles.textContent = `
                .mobile-chart-type-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1050;
                    padding: 1rem;
                }
                
                .mobile-chart-type-modal-content {
                    background: var(--bs-body-bg, white);
                    border-radius: 12px;
                    width: 100%;
                    max-width: 400px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.3s ease-out;
                }
                
                .mobile-chart-type-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--bs-border-color, #dee2e6);
                    position: sticky;
                    top: 0;
                    background: var(--bs-body-bg, white);
                    border-radius: 12px 12px 0 0;
                }
                
                .mobile-chart-type-modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--bs-body-color, #333);
                }
                
                .mobile-chart-type-modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: var(--bs-secondary, #6c757d);
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s ease;
                }
                
                .mobile-chart-type-modal-close:hover {
                    background: var(--bs-secondary-bg, #f8f9fa);
                }
                
                .mobile-chart-type-modal-body {
                    padding: 1rem;
                }
                
                .chart-type-option {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    border: 2px solid var(--bs-border-color, #dee2e6);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    min-height: 80px;
                }
                
                .chart-type-option:hover {
                    border-color: var(--bs-primary, #0d6efd);
                    background: var(--bs-primary-bg-subtle, #cfe2ff);
                    transform: translateY(-1px);
                }
                
                .chart-type-option.active {
                    border-color: var(--bs-primary, #0d6efd);
                    background: var(--bs-primary-bg-subtle, #cfe2ff);
                    box-shadow: 0 2px 8px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.3);
                }
                
                .chart-type-icon {
                    font-size: 2rem;
                    margin-right: 1rem;
                    flex-shrink: 0;
                    width: 50px;
                    text-align: center;
                }
                
                .chart-type-info {
                    flex: 1;
                }
                
                .chart-type-info h4 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--bs-body-color, #333);
                }
                
                .chart-type-info p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--bs-secondary, #6c757d);
                    line-height: 1.3;
                }
                
                .chart-type-check {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    color: var(--bs-primary, #0d6efd);
                    font-size: 1.2rem;
                }
                
                @media (prefers-color-scheme: dark) {
                    .mobile-chart-type-modal-content {
                        background: #212529;
                        color: #fff;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Aggiungi il modal al DOM
        document.body.appendChild(modal);
        
        // Aggiungi gli event listener
        const closeBtn = modal.querySelector('.mobile-chart-type-modal-close');
        const options = modal.querySelectorAll('.chart-type-option');
        
        const closeModal = () => {
            modal.style.animation = 'modalSlideOut 0.2s ease-in forwards';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 200);
        };
        
        closeBtn.addEventListener('click', closeModal);
        
        // Gestisci la selezione del tipo di grafico
        options.forEach(option => {
            option.addEventListener('click', async () => {
                const selectedType = option.dataset.type;
                
                if (selectedType !== currentChartType) {
                    // Aggiorna il tipo corrente
                    currentChartType = selectedType;
                    
                    // Aggiorna il selettore desktop se esiste
                    if (dom.chartTypeSelector) {
                        dom.chartTypeSelector.value = selectedType;
                    }
                    
                    // Ridisegna il grafico se esiste
                    if (currentChart) {
                        const filters = getFilters();
                        await drawChartWithCurrentData(filters);
                    }
                    
                    // Mostra feedback
                    if (responsiveAdapter) {
                        const selectedTypeName = chartTypes.find(t => t.id === selectedType)?.name || selectedType;
                        responsiveAdapter.showMobileToast(`Grafico cambiato: ${selectedTypeName}`);
                    }
                }
                
                closeModal();
            });
        });
        
        // Chiudi il modal cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Supporto per il tasto ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
    } catch (error) {
        console.error('Errore nella visualizzazione del selettore tipo grafico mobile:', error);
        if (responsiveAdapter) {
            responsiveAdapter.showMobileToast('Errore nel caricamento dei tipi di grafico');
        }
    }
}

/**
 * Setup handler per orientamento su mobile
 */
function setupOrientationHandler() {
    if (!responsiveAdapter) return;
    
    // Listener per cambio orientamento
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (dom.chartContainer) {
                responsiveAdapter.optimizeForOrientation(dom.chartContainer);
                
                // Aggiorna il grafico se presente
                if (currentChart) {
                    const adaptedOptions = responsiveAdapter.adaptOptions(currentChart.options);
                    currentChart.options = { ...currentChart.options, ...adaptedOptions };
                    currentChart.update();
                }
            }
        }, 100);
    });
}
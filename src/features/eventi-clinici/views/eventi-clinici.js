// src/features/eventi-clinici/views/eventi-clinici.js

import { eventiCliniciService } from '../services/eventiCliniciService.js';
import { patientService } from '../../patients/services/patientService.js';
import { logger } from '../../../core/services/loggerService.js';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal.js';
import { Modal } from '../../../core/services/bootstrapService.js';

let currentPatientId = null;
let currentEventId = null;
let eventiModal = null;
let detailModal = null;
let currentPage = 1;
const itemsPerPage = 10;
let currentFilters = {};

/**
 * Inizializza la vista eventi clinici
 * @param {URLSearchParams} urlParams - Parametri URL
 * @returns {Function} Funzione di cleanup
 */
export async function initEventiCliniciView(urlParams) {
    logger.log('Inizializzazione vista eventi clinici');
    
    try {
        // Inizializza i modali
        initModals();
        
        // Inizializza gli event listeners
        initEventListeners();
        
        // Carica i dati iniziali
        await loadEventiData();
        
        // Inizializza i date picker
        initDatePickers();
        
        logger.log('Vista eventi clinici inizializzata con successo');
        
        // Restituisce la funzione di cleanup
        return cleanup;
        
    } catch (error) {
        logger.error('Errore nell\'inizializzazione della vista eventi clinici:', error);
        showError('Errore nel caricamento della vista eventi clinici');
    }
}

/**
 * Inizializza i modali Bootstrap
 */
function initModals() {
    const eventoFormModalEl = document.getElementById('evento-form-modal');
    const eventoDetailModalEl = document.getElementById('evento-detail-modal');
    
    if (eventoFormModalEl && Modal) {
        eventiModal = new Modal(eventoFormModalEl);
    }
    
    if (eventoDetailModalEl && Modal) {
        detailModal = new Modal(eventoDetailModalEl);
    }
}

/**
 * Inizializza tutti gli event listeners
 */
function initEventListeners() {
    // Bottone per aggiungere nuovo evento
    const addBtn = document.getElementById('eventi-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openEventModal());
    }
    
    // Filtri
    const searchInput = document.getElementById('eventi-search-patient');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handlePatientSearch, 300));
    }
    
    const typeFilter = document.getElementById('eventi-filter-type');
    if (typeFilter) {
        typeFilter.addEventListener('change', handleFilterChange);
    }
    
    const dateFromFilter = document.getElementById('eventi-filter-date-from');
    if (dateFromFilter) {
        dateFromFilter.addEventListener('change', handleFilterChange);
    }
    
    const dateToFilter = document.getElementById('eventi-filter-date-to');
    if (dateToFilter) {
        dateToFilter.addEventListener('change', handleFilterChange);
    }
    
    // Reset filtri
    const resetBtn = document.getElementById('eventi-reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    // Export
    const exportBtn = document.getElementById('eventi-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportEvents);
    }
    
    // Paginazione
    const prevBtn = document.getElementById('eventi-prev-page-btn');
    const nextBtn = document.getElementById('eventi-next-page-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    }
    
    // Modal form listeners
    initModalListeners();
}

/**
 * Inizializza i listener per i modali
 */
function initModalListeners() {
    // Form submission
    const saveBtn = document.getElementById('evento-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveEvent);
    }
    
    // Tipo evento change per mostrare/nascondere campi specifici
    const tipoSelect = document.getElementById('evento-tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', handleEventTypeChange);
    }
    
    // Patient search nel modal
    const patientInput = document.getElementById('evento-paziente');
    if (patientInput) {
        patientInput.addEventListener('input', debounce(handleModalPatientSearch, 300));
    }
    
    // Detail modal buttons
    const editBtn = document.getElementById('evento-edit-btn');
    const deleteBtn = document.getElementById('evento-delete-btn');
    
    if (editBtn) {
        editBtn.addEventListener('click', handleEditEvent);
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteEvent);
    }
}

/**
 * Carica i dati degli eventi
 */
async function loadEventiData() {
    try {
        showLoading();
        
        const filters = {
            ...currentFilters,
            page: currentPage,
            limit: itemsPerPage
        };
        
        const result = await eventiCliniciService.getEventi(filters);
        
        if (result.success) {
            renderEventiTimeline(result.data.eventi);
            updatePagination(result.data.totalCount);
        } else {
            showError('Errore nel caricamento degli eventi');
        }
        
    } catch (error) {
        logger.error('Errore nel caricamento eventi:', error);
        showError('Errore nel caricamento degli eventi');
    } finally {
        hideLoading();
    }
}

/**
 * Renderizza la timeline degli eventi
 */
function renderEventiTimeline(eventi) {
    const container = document.getElementById('eventi-timeline-container');
    if (!container) return;
    
    if (!eventi || eventi.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <span class="material-icons" style="font-size: 48px; color: #ccc;">event_note</span>
                <p class="text-muted mt-2">Nessun evento trovato</p>
            </div>
        `;
        return;
    }
    
    const timelineHtml = eventi.map(evento => createEventCard(evento)).join('');
    container.innerHTML = `<div class="timeline">${timelineHtml}</div>`;
    
    // Aggiungi event listeners alle card
    container.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('click', () => {
            const eventId = card.dataset.eventId;
            showEventDetail(eventId);
        });
    });
}

/**
 * Crea una card per un evento
 */
function createEventCard(evento) {
    const eventIcon = evento.tipo_evento === 'intervento' ? 'medical_services' : 'warning';
    const eventClass = evento.tipo_evento === 'intervento' ? 'intervention' : 'infection';
    
    return `
        <div class="event-card ${eventClass}" data-event-id="${evento.id}">
            <div class="event-icon">
                <span class="material-icons">${eventIcon}</span>
            </div>
            <div class="event-content">
                <div class="event-header">
                    <h6 class="event-title">${evento.tipo_evento === 'intervento' ? 'Intervento' : 'Infezione'}</h6>
                    <small class="event-date">${formatDate(evento.data_evento)}</small>
                </div>
                <div class="event-patient">
                    <strong>${evento.paziente_nome} ${evento.paziente_cognome}</strong>
                    ${evento.paziente_codice_rad ? `<small>(${evento.paziente_codice_rad})</small>` : ''}
                </div>
                ${evento.descrizione ? `<p class="event-description">${evento.descrizione}</p>` : ''}
                ${evento.tipo_intervento ? `<small class="text-muted">Tipo: ${evento.tipo_intervento}</small>` : ''}
                ${evento.agente_patogeno ? `<small class="text-muted">Agente: ${evento.agente_patogeno}</small>` : ''}
            </div>
        </div>
    `;
}

/**
 * Mostra i dettagli di un evento
 */
async function showEventDetail(eventId) {
    try {
        const result = await eventiCliniciService.getEvento(eventId);
        
        if (result.success) {
            const evento = result.data;
            currentEventId = eventId;
            
            // Popola il modal con i dettagli
            const titleEl = document.getElementById('evento-detail-title');
            const contentEl = document.getElementById('evento-detail-content');
            const iconEl = document.getElementById('evento-detail-icon');
            
            if (titleEl) {
                titleEl.textContent = `${evento.tipo_evento === 'intervento' ? 'Intervento' : 'Infezione'} - ${evento.paziente_nome} ${evento.paziente_cognome}`;
            }
            
            if (iconEl) {
                iconEl.textContent = evento.tipo_evento === 'intervento' ? 'medical_services' : 'warning';
            }
            
            if (contentEl) {
                contentEl.innerHTML = createEventDetailHtml(evento);
            }
            
            if (detailModal) {
                detailModal.show();
            }
        } else {
            showError('Errore nel caricamento dei dettagli dell\'evento');
        }
    } catch (error) {
        logger.error('Errore nel caricamento dettagli evento:', error);
        showError('Errore nel caricamento dei dettagli');
    }
}

/**
 * Crea l'HTML per i dettagli dell'evento
 */
function createEventDetailHtml(evento) {
    return `
        <div class="row g-3">
            <div class="col-md-6">
                <strong>Paziente:</strong><br>
                ${evento.paziente_nome} ${evento.paziente_cognome}
                ${evento.paziente_codice_rad ? `<br><small class="text-muted">RAD: ${evento.paziente_codice_rad}</small>` : ''}
            </div>
            <div class="col-md-6">
                <strong>Data Evento:</strong><br>
                ${formatDate(evento.data_evento)}
            </div>
            <div class="col-md-6">
                <strong>Tipo:</strong><br>
                ${evento.tipo_evento === 'intervento' ? 'Intervento Chirurgico' : 'Infezione'}
            </div>
            ${evento.tipo_intervento ? `
                <div class="col-md-6">
                    <strong>Tipo Intervento:</strong><br>
                    ${evento.tipo_intervento}
                </div>
            ` : ''}
            ${evento.agente_patogeno ? `
                <div class="col-md-6">
                    <strong>Agente Patogeno:</strong><br>
                    ${evento.agente_patogeno}
                </div>
            ` : ''}
            ${evento.descrizione ? `
                <div class="col-12">
                    <strong>Descrizione:</strong><br>
                    ${evento.descrizione}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Utility functions
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
}

function showLoading() {
    const container = document.getElementById('eventi-timeline-container');
    if (container) {
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Caricamento...</span>
                </div>
            </div>
        `;
    }
}

function hideLoading() {
    // Loading viene nascosto quando i dati vengono renderizzati
}

function showError(message) {
    const container = document.getElementById('eventi-timeline-container');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <span class="material-icons me-2">error</span>
                ${message}
            </div>
        `;
    }
}

// Placeholder functions for features to be implemented in later tasks
function openEventModal() {
    logger.log('Apertura modal evento - da implementare');
}

function handlePatientSearch() {
    logger.log('Ricerca paziente - da implementare');
}

function handleFilterChange() {
    logger.log('Cambio filtri - da implementare');
}

function resetFilters() {
    logger.log('Reset filtri - da implementare');
}

function exportEvents() {
    logger.log('Export eventi - da implementare');
}

function changePage(page) {
    logger.log('Cambio pagina - da implementare');
}

function updatePagination(totalCount) {
    logger.log('Aggiornamento paginazione - da implementare');
}

function handleSaveEvent() {
    logger.log('Salvataggio evento - da implementare');
}

function handleEventTypeChange() {
    logger.log('Cambio tipo evento - da implementare');
}

function handleModalPatientSearch() {
    logger.log('Ricerca paziente nel modal - da implementare');
}

function handleEditEvent() {
    logger.log('Modifica evento - da implementare');
}

function handleDeleteEvent() {
    logger.log('Eliminazione evento - da implementare');
}

function initDatePickers() {
    logger.log('Inizializzazione date picker - da implementare');
}

/**
 * Funzione di cleanup
 */
function cleanup() {
    logger.log('Cleanup vista eventi clinici');
    
    // Reset variabili globali
    currentPatientId = null;
    currentEventId = null;
    currentPage = 1;
    currentFilters = {};
    
    // Chiudi modali se aperti
    if (eventiModal) {
        eventiModal.hide();
        eventiModal = null;
    }
    
    if (detailModal) {
        detailModal.hide();
        detailModal = null;
    }
}
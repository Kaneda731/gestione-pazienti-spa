// src/features/patients/views/eventi-clinici-tab.js
import { eventiCliniciService } from '../../eventi-clinici/services/eventiCliniciService.js';
import { postOperativeCalculator } from '../../eventi-clinici/utils/post-operative-calculator.js';
import { initCustomSelects, updateCustomSelect, CustomSelect } from '../../../shared/components/forms/CustomSelect.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { notificationService } from '../../../core/services/notifications/notificationService.js';
import { logger } from '../../../core/services/logger/loggerService.js';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';
import { ResolveInfectionModal } from '../../eventi-clinici/components/ResolveInfectionModal.js';

let eventiDatepicker = null;
let currentPatientId = null;
let currentEventi = [];
let onStatusChangeCallback = null;

/**
 * Inizializza il tab degli eventi clinici
 */
export function initEventiCliniciTab(onStatusChange) {
    onStatusChangeCallback = onStatusChange;
    setupEventListeners();
    initializeComponents();
}

/**
 * Configura gli event listener per il tab eventi clinici
 */
function setupEventListeners() {
    // Pulsante aggiungi evento
    const addEventoBtn = document.getElementById('add-evento-btn');
    if (addEventoBtn) {
        addEventoBtn.addEventListener('click', showEventoForm);
    }

    // Pulsanti annulla
    const cancelBtns = [
        document.getElementById('cancel-evento-btn'),
        document.getElementById('cancel-evento-btn-2')
    ];
    cancelBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', hideEventoForm);
        }
    });

    // Pulsante salva evento
    const saveEventoBtn = document.getElementById('save-evento-btn');
    if (saveEventoBtn) {
        saveEventoBtn.addEventListener('click', handleSaveEvento);
    }

    // Cambio tipo evento
    const eventoTipoSelect = document.getElementById('evento-tipo');
    if (eventoTipoSelect) {
        eventoTipoSelect.addEventListener('change', (e) => {
            handleEventoTypeChange(e.target.value);
        });
    }

    // Listener per il cambio tab
    const eventiTab = document.getElementById('eventi-clinici-tab');
    if (eventiTab) {
        eventiTab.addEventListener('shown.bs.tab', () => {
            loadEventiForCurrentPatient();
        });
    }
}

/**
 * Inizializza i componenti del form eventi
 */
function initializeComponents() {
    // Inizializza custom selects - inizializza solo quelli visibili inizialmente
    initCustomSelects('#evento-tipo');
    
    // Inizializza il select del tipo intervento anche se nascosto
    const tipoInterventoSelect = document.getElementById('evento-tipo-intervento');
    if (tipoInterventoSelect && !tipoInterventoSelect.customSelectInstance) {
        new CustomSelect(tipoInterventoSelect);
    }
    
    // Inizializza datepicker per eventi
    eventiDatepicker = new CustomDatepicker('#evento-data', {
        dateFormat: "d/m/Y",
        allowInput: true,
        maxDate: "today", // Non permettere date future
        onChange: function(selectedDates, dateStr, instance) {
            // Validazione aggiuntiva quando la data cambia
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                
                if (selectedDate > today) {
                    instance.clear();
                    notificationService.warning('La data dell\'evento non può essere nel futuro');
                }
            }
        }
    });
}

/**
 * Mostra il form per nuovo evento
 */
function showEventoForm() {
    const form = document.getElementById('nuovo-evento-form');
    if (form) {
        form.style.display = 'block';
        resetEventoForm();
        
        // Scroll al form
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Nasconde il form per nuovo evento
 */
function hideEventoForm() {
    const form = document.getElementById('nuovo-evento-form');
    if (form) {
        form.style.display = 'none';
        resetEventoForm();
    }
}

/**
 * Reset del form evento
 */
function resetEventoForm() {
    const form = document.getElementById('nuovo-evento-form');
    if (!form) return;

    // Reset campi
    document.getElementById('evento-id').value = '';
    document.getElementById('evento-tipo').value = '';
    document.getElementById('evento-data').value = '';
    document.getElementById('evento-tipo-intervento').value = '';
    document.getElementById('evento-agente-patogeno').value = '';
    document.getElementById('evento-descrizione').value = '';

    // Nascondi campi condizionali
    handleEventoTypeChange('');

    // Reset custom selects se esistenti
    const tipoEventoSelect = document.getElementById('evento-tipo');
    if (tipoEventoSelect?.customSelectInstance) {
        tipoEventoSelect.customSelectInstance.setValue('');
    }
    
    const tipoInterventoSelect = document.getElementById('evento-tipo-intervento');
    if (tipoInterventoSelect?.customSelectInstance) {
        tipoInterventoSelect.customSelectInstance.setValue('');
    }
}

/**
 * Gestisce il cambio di tipo evento
 */
function handleEventoTypeChange(tipoEvento) {
    const tipoInterventoContainer = document.getElementById('tipo-intervento-container');
    const agentePatogenoContainer = document.getElementById('agente-patogeno-container');

    // Nascondi tutti i campi condizionali
    if (tipoInterventoContainer) tipoInterventoContainer.style.display = 'none';
    if (agentePatogenoContainer) agentePatogenoContainer.style.display = 'none';

    // Pulisci i valori dei campi nascosti
    const tipoInterventoSelect = document.getElementById('evento-tipo-intervento');
    const agentePatogenoInput = document.getElementById('evento-agente-patogeno');
    
    if (tipoInterventoSelect) {
        tipoInterventoSelect.value = '';
        if (tipoInterventoSelect.customSelectInstance) {
            tipoInterventoSelect.customSelectInstance.setValue('');
        }
    }
    if (agentePatogenoInput) agentePatogenoInput.value = '';

    // Mostra i campi appropriati
    switch (tipoEvento) {
        case 'intervento':
            if (tipoInterventoContainer) {
                tipoInterventoContainer.style.display = 'block';
                console.log('Mostrando container tipo intervento');
                
                // Assicurati che il CustomSelect sia inizializzato
                if (tipoInterventoSelect && !tipoInterventoSelect.customSelectInstance) {
                    console.log('Inizializzando CustomSelect per tipo intervento');
                    new CustomSelect(tipoInterventoSelect);
                }
            }
            break;
        case 'infezione':
            if (agentePatogenoContainer) agentePatogenoContainer.style.display = 'block';
            break;
    }
}

/**
 * Gestisce il salvataggio di un evento
 */
async function handleSaveEvento() {
    try {
        const eventoData = getEventoFormData();
        
        // Validazione
        const validationResult = validateEventoData(eventoData);
        if (!validationResult.isValid) {
            notificationService.error(validationResult.message);
            return;
        }

        // Se non abbiamo un paziente corrente (nuovo paziente), gestisci come evento temporaneo
        if (!currentPatientId) {
            // Gestisci come evento temporaneo per nuovo paziente
            handleTemporaryEvent(eventoData);
            return;
        }

        // Aggiungi paziente ID per pazienti esistenti
        eventoData.paziente_id = currentPatientId;

        // Salva evento nel database per pazienti esistenti
        if (eventoData.id) {
            await eventiCliniciService.updateEvento(eventoData.id, eventoData);
        } else {
            // Rimuovi il campo id per permettere al database di generarlo automaticamente
            delete eventoData.id;
            await eventiCliniciService.createEvento(eventoData);
        }

        // Ricarica lista eventi e aggiorna la visualizzazione
        await loadEventiForCurrentPatient();
        
        // Nascondi form immediatamente dopo il reload
        hideEventoForm();
        
        // Sincronizza i checkbox dopo il salvataggio
        syncCheckboxesWithEvents();
        
        // Forza un refresh della visualizzazione per assicurarsi che l'evento appaia
        const eventiList = document.getElementById('eventi-list');
        if (eventiList) {
            // Trigger un piccolo flash per indicare che la lista è stata aggiornata
            eventiList.style.opacity = '0.7';
            setTimeout(() => {
                eventiList.style.opacity = '1';
            }, 150);
        }
        
        // La notifica di successo è già gestita da eventiCliniciService
    } catch (error) {
        // Error notification is already handled by eventiCliniciService.
        logger.error('Errore catturato in handleSaveEvento:', error.message);
    }
}

/**
 * Gestisce un evento temporaneo per un nuovo paziente
 */
function handleTemporaryEvent(eventoData) {
    try {
        // Crea un evento temporaneo con ID univoco
        const tempEvent = {
            ...eventoData,
            id: `temp_manual_${Date.now()}`,
            isTemporary: true
        };

        // Aggiungi l'evento alla lista temporanea
        if (!currentEventi) {
            currentEventi = [];
        }
        
        // Rimuovi eventuali eventi temporanei dello stesso tipo per evitare duplicati
        currentEventi = currentEventi.filter(evento => 
            !evento.isTemporary || evento.tipo_evento !== eventoData.tipo_evento
        );
        
        // Aggiungi il nuovo evento temporaneo
        currentEventi.push(tempEvent);
        
        // Renderizza la lista aggiornata
        renderEventiList(currentEventi);
        
        // Nascondi il form
        hideEventoForm();
        
        // Sincronizza i checkbox
        syncCheckboxesWithEvents();
        
        // Notifica successo
        notificationService.success('Evento aggiunto temporaneamente. Verrà salvato quando salvi il paziente.');
        
    } catch (error) {
        logger.error('Errore nella gestione evento temporaneo:', error.message);
        notificationService.error('Errore nell\'aggiungere l\'evento temporaneo');
    }
}

/**
 * Ottiene i dati dal form evento
 */
function getEventoFormData() {
    const rawDate = document.getElementById('evento-data').value;
    let convertedDate = null;
    
    // Converti la data solo se presente
    if (rawDate && rawDate.trim() !== '') {
        try {
            convertedDate = convertDateToISO(rawDate.trim());
        } catch (error) {
            throw new Error(error.message || 'Formato data non valido. Utilizzare il formato gg/mm/aaaa');
        }
    }
    
    const data = {
        id: document.getElementById('evento-id').value || null,
        tipo_evento: document.getElementById('evento-tipo').value,
        data_evento: convertedDate,
        descrizione: document.getElementById('evento-descrizione').value,
        tipo_intervento: document.getElementById('evento-tipo-intervento').value || null,
        agente_patogeno: document.getElementById('evento-agente-patogeno').value || null
    };

    // Pulisci campi vuoti
    Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] === null) {
            data[key] = null;
        }
    });

    return data;
}

/**
 * Valida i dati dell'evento
 */
function validateEventoData(data) {
    if (!data.tipo_evento) {
        return { isValid: false, message: 'Seleziona il tipo di evento' };
    }

    if (!data.data_evento) {
        return { isValid: false, message: 'Inserisci la data dell\'evento' };
    }

    // Verifica che la data non sia futura
    try {
        const eventDate = new Date(data.data_evento + 'T00:00:00');
        
        // Verifica che la data sia valida
        if (isNaN(eventDate.getTime())) {
            return { isValid: false, message: 'Formato data non valido' };
        }
        
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        if (eventDateOnly > todayDate) {
            return { isValid: false, message: 'La data dell\'evento non può essere nel futuro' };
        }
    } catch (error) {
        return { isValid: false, message: 'Errore nella validazione della data: ' + error.message };
    }

    if (data.tipo_evento === 'intervento' && !data.tipo_intervento) {
        return { isValid: false, message: 'Seleziona il tipo di intervento' };
    }

    return { isValid: true };
}

/**
 * Converte data da dd/mm/yyyy a yyyy-mm-dd
 */
function convertDateToISO(dateString) {
    if (!dateString) {
        return null;
    }
    
    // Se è già in formato ISO, restituiscilo così com'è
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    
    if (!dateString.includes('/')) {
        throw new Error('Formato data non valido. Utilizzare il formato gg/mm/aaaa');
    }
    
    const parts = dateString.split('/');
    if (parts.length !== 3) {
        throw new Error('Formato data non valido. Utilizzare il formato gg/mm/aaaa');
    }
    
    const [day, month, year] = parts;
    
    // Validazione dei componenti della data
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
        throw new Error('Formato data non valido. Utilizzare numeri validi');
    }
    
    if (dayNum < 1 || dayNum > 31) {
        throw new Error('Giorno non valido (1-31)');
    }
    
    if (monthNum < 1 || monthNum > 12) {
        throw new Error('Mese non valido (1-12)');
    }
    
    if (yearNum < 1900 || yearNum > 2100) {
        throw new Error('Anno non valido');
    }
    
    // Crea un oggetto Date per validare ulteriormente la data
    const dateObj = new Date(yearNum, monthNum - 1, dayNum);
    if (dateObj.getDate() !== dayNum || dateObj.getMonth() !== monthNum - 1 || dateObj.getFullYear() !== yearNum) {
        throw new Error('Data non valida (es. 31/02/2025)');
    }
    
    // Formatta sempre con zero padding
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    
    return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Converte data da yyyy-mm-dd a dd/mm/yyyy
 */
function convertDateFromISO(dateString) {
    if (!dateString || !dateString.includes('-')) return dateString;
    
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Carica gli eventi per il paziente corrente
 */
export async function loadEventiForCurrentPatient() {
    if (!currentPatientId) return;

    try {
        const eventi = await eventiCliniciService.getEventiByPaziente(currentPatientId);
        currentEventi = eventi;
        renderEventiList(eventi);
        updatePostOperativeInfo(eventi);
        syncInfectionStatusWithForm(); // Sincronizza lo stato con il form principale
        syncCheckboxesWithEvents(); // Sincronizza i checkbox con gli eventi
    } catch (error) {
        // Error notification is already handled by eventiCliniciService.
        logger.error('Errore nel caricamento eventi clinici per il paziente:', error);
    }
}

/**
 * Renderizza la lista degli eventi
 */
function renderEventiList(eventi) {
    const eventiList = document.getElementById('eventi-list');
    const noEventiMessage = document.getElementById('no-eventi-message');
    
    if (!eventi || eventi.length === 0) {
        if (noEventiMessage) {
            noEventiMessage.style.display = 'block';
        }
        eventiList.innerHTML = '<div class="text-center text-muted py-4">Nessun evento clinico registrato</div>';
        if (noEventiMessage) {
            eventiList.appendChild(noEventiMessage);
        }
        return;
    }

    if (noEventiMessage) {
        noEventiMessage.style.display = 'none';
    }
    
    let eventiHTML;
    try {
        eventiHTML = eventi.map(evento => {
        const dataFormatted = convertDateFromISO(evento.data_evento);
        const tipoIcon = evento.tipo_evento === 'intervento' ? 'medical_services' : 'coronavirus';
        const tipoClass = evento.tipo_evento === 'intervento' ? 'primary' : 'warning';

        let statusBadge = '';
        if (evento.tipo_evento === 'infezione' && evento.data_fine_evento) {
            statusBadge = `<span class="badge bg-success ms-2">Risolto il ${convertDateFromISO(evento.data_fine_evento)}</span>`;
        }

        // Badge per eventi temporanei
        if (evento.isTemporary) {
            statusBadge += `<span class="badge bg-info ms-2">
                <span class="material-icons me-1" style="font-size: 12px;">schedule</span>Da salvare
            </span>`;
        }

        const isRisolto = evento.tipo_evento === 'infezione' && evento.data_fine_evento;
        const isTemporary = evento.isTemporary;
        
        return `
            <div class="card mb-3 evento-card" data-evento-id="${evento.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-2">
                                <span class="badge bg-${tipoClass} me-2">
                                    <span class="material-icons me-1" style="font-size: 14px;">${tipoIcon}</span>
                                    ${evento.tipo_evento === 'intervento' ? 'Intervento' : 'Infezione'}
                                </span>
                                <small class="text-muted">${dataFormatted}</small>
                                ${statusBadge}
                            </div>
                            
                            ${evento.tipo_intervento ? `<p class="mb-1"><strong>Tipo:</strong> ${evento.tipo_intervento}</p>` : ''}
                            ${evento.agente_patogeno ? `<p class="mb-1"><strong>Agente:</strong> ${evento.agente_patogeno}</p>` : ''}
                            ${evento.descrizione ? `<p class="mb-0 text-muted">${evento.descrizione}</p>` : ''}
                        </div>
                        
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" ${isTemporary ? 'disabled' : ''}>
                                <span class="material-icons" style="font-size: 16px;">more_vert</span>
                            </button>
                            ${!isTemporary ? `
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item edit-evento" href="#" data-evento-id="${evento.id}">
                                    <span class="material-icons me-2" style="font-size: 16px;">edit</span>Modifica
                                </a></li>
                                ${evento.tipo_evento === 'infezione' && !isRisolto ? `
                                <li><a class="dropdown-item resolve-infezione" href="#" data-evento-id="${evento.id}" data-start-date="${evento.data_evento}">
                                    <span class="material-icons me-2" style="font-size: 16px;">check_circle</span>Risolvi
                                </a></li>
                                ` : ''}
                                <li><a class="dropdown-item delete-evento text-danger" href="#" data-evento-id="${evento.id}">
                                    <span class="material-icons me-2" style="font-size: 16px;">delete</span>Elimina
                                </a></li>
                            </ul>
                            ` : `
                            <ul class="dropdown-menu">
                                <li><span class="dropdown-item-text text-muted">
                                    <span class="material-icons me-2" style="font-size: 16px;">info</span>
                                    Evento temporaneo - Salva il paziente per renderlo definitivo
                                </span></li>
                            </ul>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        logger.error('Errore durante generazione HTML eventi:', error);
        eventiHTML = '<div class="alert alert-danger">Errore nel caricamento eventi</div>';
    }

    eventiList.innerHTML = sanitizeHtml(eventiHTML);

    // Aggiungi event listeners per modifica ed eliminazione
    eventiList.querySelectorAll('.edit-evento').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const eventoId = e.currentTarget.dataset.eventoId;
            editEvento(eventoId);
        });
    });

    eventiList.querySelectorAll('.delete-evento').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const eventoId = e.currentTarget.dataset.eventoId;
            deleteEvento(eventoId);
        });
    });

    eventiList.querySelectorAll('.resolve-infezione').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const eventoId = e.currentTarget.dataset.eventoId;
            const startDate = e.currentTarget.dataset.startDate;
            resolveInfezione(eventoId, startDate);
        });
    });
}

/**
 * Aggiorna le informazioni post-operatorie
 */
function updatePostOperativeInfo(eventi) {
    const postOpInfo = document.getElementById('post-op-info');
    const postOpText = document.getElementById('post-op-text');
    
    if (!eventi || eventi.length === 0) {
        postOpInfo.classList.add('d-none');
        return;
    }

    const calculation = postOperativeCalculator.calculatePostOperativeDays(eventi);
    
    if (calculation.hasInterventions) {
        postOpInfo.classList.remove('d-none');
        postOpText.textContent = calculation.displayText;
        
        // Cambia colore in base ai giorni
        postOpInfo.className = 'alert d-flex align-items-center';
        if (calculation.postOperativeDays <= 7) {
            postOpInfo.classList.add('alert-danger');
        } else if (calculation.postOperativeDays <= 30) {
            postOpInfo.classList.add('alert-warning');
        } else {
            postOpInfo.classList.add('alert-info');
        }
    } else {
        postOpInfo.classList.add('d-none');
    }
}

/**
 * Modifica un evento esistente
 */
function editEvento(eventoId) {
    const evento = currentEventi.find(e => e.id === eventoId);
    if (!evento) return;

    // Mostra il form prima di popolarlo
    showEventoForm();

    // Aspetta un momento per assicurarsi che il form sia visibile
    setTimeout(() => {
        // Popola il form con i dati dell'evento
        document.getElementById('evento-id').value = evento.id;
        document.getElementById('evento-data').value = convertDateFromISO(evento.data_evento);
        document.getElementById('evento-descrizione').value = evento.descrizione || '';
        document.getElementById('evento-tipo-intervento').value = evento.tipo_intervento || '';
        document.getElementById('evento-agente-patogeno').value = evento.agente_patogeno || '';

        // Aggiorna il custom select del tipo evento PRIMA di gestire i campi condizionali
        const tipoEventoSelect = document.getElementById('evento-tipo');
        if (tipoEventoSelect?.customSelectInstance && evento.tipo_evento) {
            tipoEventoSelect.customSelectInstance.setValue(evento.tipo_evento);
        } else {
            document.getElementById('evento-tipo').value = evento.tipo_evento;
        }

        // Gestisci campi condizionali DOPO aver impostato il tipo evento
        handleEventoTypeChange(evento.tipo_evento);

        // Aspetta un altro momento per i campi condizionali
        setTimeout(() => {
            const tipoInterventoSelect = document.getElementById('evento-tipo-intervento');
            if (tipoInterventoSelect?.customSelectInstance && evento.tipo_intervento) {
                tipoInterventoSelect.customSelectInstance.setValue(evento.tipo_intervento);
            }
        }, 100);
    }, 50);
}

/**
 * Elimina un evento
 */
async function deleteEvento(eventoId) {
    const { ConfirmModal } = await import('../../../shared/components/ui/ConfirmModal.js');
    
    const modal = ConfirmModal.forClinicalEventDeletion();
    const confirmed = await modal.show();
    
    if (!confirmed) {
        return;
    }

    try {
        await eventiCliniciService.deleteEvento(eventoId);
        await loadEventiForCurrentPatient();
        // syncInfectionStatusWithForm() è già chiamato da loadEventiForCurrentPatient
        // Sincronizza i checkbox dopo l'eliminazione
        syncCheckboxesWithEvents();
        // La notifica di successo è già gestita da eventiCliniciService
    } catch (error) {
        // La notifica di errore è già gestita da eventiCliniciService.
        logger.error('Errore catturato in deleteEvento:', error.message);
    }
}

/**
 * Apre il modal per risolvere un'infezione e gestisce il salvataggio.
 * @param {string} eventoId - L'ID dell'evento di infezione.
 * @param {string} startDate - La data di inizio dell'infezione, per validazione.
 */
async function resolveInfezione(eventoId, startDate) {
    const modal = new ResolveInfectionModal({ minDate: startDate });

    const dataFine = await modal.show();

    if (dataFine) {
        try {
            await eventiCliniciService.resolveInfezione(eventoId, dataFine);
            await loadEventiForCurrentPatient(); // Ricarica e sincronizza
        } catch (error) {
            // L'errore è già gestito e notificato dal service, non serve fare altro.
            logger.error("Errore catturato durante la risoluzione dell'infezione:", error);
        }
    }
}

/**
 * Controlla se il paziente ha infezioni attive (non risolte).
 * @returns {boolean} True se ci sono infezioni attive, altrimenti false.
 */
export function isPatientCurrentlyInfected() {
    if (!currentEventi || currentEventi.length === 0) return false;
    return currentEventi.some(e => e.tipo_evento === 'infezione' && !e.data_fine_evento);
}

/**
 * Chiama la funzione nel form-ui per aggiornare lo stato dei checkbox.
 */
function syncInfectionStatusWithForm() {
    if (typeof onStatusChangeCallback === 'function') {
        onStatusChangeCallback();
    }
}

/**
 * Sincronizza i checkbox del form principale con gli eventi clinici
 * Aggiorna i checkbox "infetto" e "ha_intervento" in base agli eventi presenti
 */
export function syncCheckboxesWithEvents() {
    const infettoCheckbox = document.getElementById('infetto');
    const interventoCheckbox = document.getElementById('ha_intervento');
    
    if (!infettoCheckbox || !interventoCheckbox) return;

    // Verifica se ci sono eventi di infezione attivi
    const hasActiveInfection = isPatientCurrentlyInfected();
    
    // Verifica se ci sono eventi di intervento
    const hasIntervention = currentEventi && currentEventi.some(e => e.tipo_evento === 'intervento');

    // Aggiorna checkbox infezione
    if (hasActiveInfection) {
        infettoCheckbox.checked = true;
        infettoCheckbox.disabled = true;
        
        const helper = document.getElementById('infetto-helper-text');
        if (helper) {
            helper.textContent = 'Stato gestito dagli eventi di infezione attivi.';
            helper.style.display = 'block';
        }
    } else {
        infettoCheckbox.disabled = false;
        const helper = document.getElementById('infetto-helper-text');
        if (helper) {
            helper.style.display = 'none';
        }
    }

    // Aggiorna checkbox intervento
    if (hasIntervention) {
        interventoCheckbox.checked = true;
        interventoCheckbox.disabled = true;
        
        const helper = document.getElementById('intervento-helper-text');
        if (helper) {
            helper.textContent = 'Stato gestito dagli eventi di intervento presenti.';
            helper.style.display = 'block';
        }
    } else {
        interventoCheckbox.disabled = false;
        const helper = document.getElementById('intervento-helper-text');
        if (helper) {
            helper.style.display = 'none';
        }
    }

    // Aggiorna gli indicatori visivi
    if (typeof window.updateInfectionIndicator === 'function') {
        window.updateInfectionIndicator();
    }
    if (typeof window.updateSurgeryIndicator === 'function') {
        window.updateSurgeryIndicator();
    }
}

/**
 * Imposta il paziente corrente per il tab eventi
 */
export function setCurrentPatient(patientId) {
    currentPatientId = patientId;
    
    // Se il tab eventi è attivo, carica gli eventi
    const eventiTab = document.getElementById('eventi-clinici-tab');
    if (eventiTab && eventiTab.classList.contains('active')) {
        loadEventiForCurrentPatient();
    }
}

/**
 * Crea eventi temporanei basati sui dati dei checkbox del form principale
 * Questa funzione viene chiamata quando i checkbox vengono selezionati
 */
export function createTemporaryEventsFromCheckboxes() {
    // Importa i manager dei dati temporanei
    import('../services/infectionDataManager.js').then(({ default: infectionDataManager }) => {
        import('../services/surgeryDataManager.js').then(({ default: surgeryDataManager }) => {
            const temporaryEvents = [];

            // Crea evento temporaneo per l'infezione se presente
            if (infectionDataManager.hasValidInfectionData()) {
                const infectionData = infectionDataManager.getInfectionData();
                temporaryEvents.push({
                    id: 'temp_infection',
                    tipo_evento: 'infezione',
                    data_evento: infectionData.data_evento,
                    agente_patogeno: infectionData.agente_patogeno,
                    descrizione: infectionData.descrizione,
                    data_fine_evento: null,
                    isTemporary: true
                });
            }

            // Crea evento temporaneo per l'intervento se presente
            if (surgeryDataManager.hasValidSurgeryData()) {
                const surgeryData = surgeryDataManager.getSurgeryData();
                temporaryEvents.push({
                    id: 'temp_surgery',
                    tipo_evento: 'intervento',
                    data_evento: surgeryData.data_evento,
                    tipo_intervento: surgeryData.tipo_intervento,
                    descrizione: surgeryData.descrizione,
                    isTemporary: true
                });

                // Se l'intervento include un'infezione, aggiungila
                if (surgeryData.has_infection && surgeryData.data_infezione) {
                    temporaryEvents.push({
                        id: 'temp_surgery_infection',
                        tipo_evento: 'infezione',
                        data_evento: surgeryData.data_infezione,
                        agente_patogeno: surgeryData.agente_patogeno,
                        descrizione: surgeryData.descrizione_infezione,
                        data_fine_evento: null,
                        isTemporary: true
                    });
                }
            }

            // Combina eventi esistenti con quelli temporanei
            const allEvents = [...(currentEventi || []), ...temporaryEvents];
            
            // Renderizza la lista aggiornata
            renderEventiList(allEvents);
            updatePostOperativeInfo(allEvents);
        });
    });
}

/**
 * Ottiene tutti gli eventi temporanei
 */
export function getTemporaryEvents() {
    if (!currentEventi) return [];
    return currentEventi.filter(evento => evento.isTemporary);
}

/**
 * Rimuove gli eventi temporanei dalla visualizzazione
 */
export function clearTemporaryEvents() {
    // Ricarica solo gli eventi reali dal database
    if (currentPatientId) {
        loadEventiForCurrentPatient();
    } else {
        // Se non c'è un paziente corrente, mostra lista vuota
        renderEventiList([]);
        updatePostOperativeInfo([]);
    }
}

/**
 * Cleanup del tab eventi clinici
 */
export function cleanupEventiCliniciTab() {
    if (eventiDatepicker) {
        eventiDatepicker.destroy();
        eventiDatepicker = null;
    }
    
    currentPatientId = null;
    currentEventi = [];
}
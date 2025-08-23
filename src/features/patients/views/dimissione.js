// src/features/patients/views/dimissione.js
import { dischargePatientWithTransfer } from '@/features/patients/views/dimissione-api.js';
import { 
    dom,
    initializeUI, 
    cleanupUI,
    displayDischargeForm,
    resetView,
    showFeedback,
    validateDischargeForm,
    getDischargeFormData
} from '@/features/patients/views/dimissione-ui.js';
import { logger } from '@/core/services/logger/loggerService.js';

let selectedPatient = null;

async function handleDischargeSubmit(event) {
    event.preventDefault();
    
    if (!selectedPatient) {
        showFeedback('Seleziona un paziente prima di procedere.', 'warning');
        return;
    }

    // Valida i dati del form
    const validation = validateDischargeForm();
    if (!validation.isValid) {
        showFeedback(`Errori di validazione: ${validation.errors.join(', ')}`, 'error');
        return;
    }

    // Raccoglie i dati del form
    const dischargeData = await getDischargeFormData();

    // Log strutturato (solo in dev/test) per tracciare payload effettivo sottomesso
    try {
        logger.group('[Dimissione] Submit payload');
        logger.log({
            patientId: selectedPatient?.id,
            tipo_dimissione: dischargeData?.tipo_dimissione,
            codice_dimissione: dischargeData?.codice_dimissione,
            reparto_destinazione: dischargeData?.reparto_destinazione || null,
            clinica_destinazione: dischargeData?.clinica_destinazione || null,
            codice_clinica: dischargeData?.codice_clinica || null,
            data_dimissione: dischargeData?.data_dimissione || null
        });
        logger.groupEnd();
    } catch (_) { /* no-op */ }

    try {
        await dischargePatientWithTransfer(selectedPatient.id, dischargeData);
        
        // Messaggio di successo personalizzato in base al tipo di dimissione
        let successMessage = 'Paziente dimesso con successo!';
        if (dischargeData.tipo_dimissione === 'trasferimento_interno') {
            successMessage = `Paziente trasferito con successo al reparto ${dischargeData.reparto_destinazione}!`;
        } else if (dischargeData.tipo_dimissione === 'trasferimento_esterno') {
            successMessage = `Paziente trasferito con successo alla clinica ${dischargeData.clinica_destinazione}!`;
        }
        
        showFeedback(successMessage, 'success');
        selectedPatient = null;
        resetView();
    // Evita import circolare con il router: usa direttamente l'hash
    setTimeout(() => { window.location.hash = 'home'; }, 1500);
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

function setupEventListeners() {
    if (dom.dischargeForm) {
        dom.dischargeForm.addEventListener('submit', handleDischargeSubmit);
    }
}

export async function initDimissioneView() {
    // Usa l'autocomplete centralizzato: la UI chiamerà onSelectPatient alla scelta
    await initializeUI((patient) => {
        selectedPatient = patient;
        displayDischargeForm(patient);
    });
    setupEventListeners();
    
    if (dom.searchInput) {
        dom.searchInput.focus();
    }

    // La funzione di cleanup viene restituita per essere chiamata dal router
    return () => {
        cleanupUI();
        selectedPatient = null;
    };
}
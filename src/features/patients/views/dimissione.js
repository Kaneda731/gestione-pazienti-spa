// src/features/patients/views/dimissione.js
import { navigateTo } from '../../../app/router.js';
import { searchActivePatients, dischargePatientWithTransfer } from './dimissione-api.js';
import { 
    dom,
    initializeUI, 
    cleanupUI,
    renderSearchResults,
    displayDischargeForm,
    setLoading,
    resetView,
    showFeedback,
    validateDischargeForm,
    getDischargeFormData
} from './dimissione-ui.js';

let selectedPatient = null;

async function handleSearch(query) {
    if (!dom.searchInput) {
        console.error('Elemento searchInput non trovato');
        return;
    }
    
    if (query.length < 2) {
        renderSearchResults([], () => {}); // Pulisce i risultati se la query è troppo corta
        return;
    }
    
    setLoading(true);
    try {
        const patients = await searchActivePatients(query);
        renderSearchResults(patients, (patient) => {
            selectedPatient = patient;
            displayDischargeForm(patient);
        });
    } catch (error) {
        showFeedback(error.message, 'error');
        setLoading(false); // Interrompi il caricamento solo in caso di errore
    }
}

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
    const dischargeData = getDischargeFormData();

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
        setTimeout(() => navigateTo('home'), 1500);
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

function setupEventListeners() {
    if (dom.dischargeForm) {
        dom.dischargeForm.addEventListener('submit', handleDischargeSubmit);
    }
}

export function initDimissioneView() {
    initializeUI(handleSearch);
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
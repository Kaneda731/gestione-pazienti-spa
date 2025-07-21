// src/features/patients/views/dimissione.js
import { navigateTo } from '../../../app/router.js';
import { searchActivePatients, dischargePatient } from './dimissione-api.js';
import { 
    dom,
    initializeUI, 
    cleanupUI,
    renderSearchResults,
    displayDischargeForm,
    setLoading,
    resetView,
    showFeedback
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
    
    if (!dom.dataDimissioneInput) {
        console.error('Elemento dataDimissioneInput non trovato');
        return;
    }
    
    const dischargeDate = dom.dataDimissioneInput.value;

    if (!selectedPatient || !dischargeDate) {
        showFeedback('Seleziona un paziente e una data di dimissione.', 'warning');
        return;
    }

    try {
        await dischargePatient(selectedPatient.id, dischargeDate);
        showFeedback('Paziente dimesso con successo!', 'success');
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
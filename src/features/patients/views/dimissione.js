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

async function handleSearch() {
    const searchTerm = dom.searchInput.value.trim();
    if (searchTerm.length < 2) {
        showFeedback('Inserisci almeno 2 caratteri per la ricerca.', 'info');
        return;
    }
    
    setLoading(true);
    try {
        const patients = await searchActivePatients(searchTerm);
        renderSearchResults(patients, (patient) => {
            selectedPatient = patient;
            displayDischargeForm(patient);
        });
    } catch (error) {
        showFeedback(error.message, 'error');
    } finally {
        // Se non ci sono risultati, setLoading(false) non è necessario
        // perché renderSearchResults gestisce il contenitore.
        if (dom.resultsContainer.innerHTML.includes('spinner')) {
             setLoading(false);
        }
    }
}

async function handleDischargeSubmit(event) {
    event.preventDefault();
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
    dom.searchButton.addEventListener('click', handleSearch);
    dom.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    
    dom.dischargeForm.addEventListener('submit', handleDischargeSubmit);
    
    // Il back button è gestito globalmente, ma se serve logica specifica va qui.
    // dom.backButton.addEventListener('click', () => navigateTo('home'));
}

export function initDimissioneView() {
    initializeUI();
    setupEventListeners();
    
    dom.searchInput.focus();

    // La funzione di cleanup viene restituita per essere chiamata dal router
    return () => {
        cleanupUI();
        selectedPatient = null;
        // Qui si potrebbero rimuovere gli event listener se necessario,
        // ma dato che la vista viene distrutta, non è strettamente obbligatorio.
    };
}
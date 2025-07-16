// src/features/patients/views/form.js
import { navigateTo } from '../../../app/router.js';
import { getFormState, clearFormState } from './form-state.js';
import { getDiagnosiOptions, getPatientById, savePatient } from './form-api.js';
import { 
    initializeFormComponents, 
    cleanupFormComponents,
    populateForm,
    renderDiagnosiOptions,
    getFormData,
    showFeedbackMessage
} from './form-ui.js';

async function handleFormSubmit(event, state) {
    event.preventDefault();
    const patientData = getFormData();
    console.log('Form: Dati paziente raccolti:', patientData);
    
    try {
        showFeedbackMessage('Salvataggio in corso...', 'info');
        const savedPatient = await savePatient(patientData, state.patientId);
        console.log('Form: Paziente salvato con successo:', savedPatient);
        
        const action = state.mode === 'edit' ? 'aggiornato' : 'inserito';
        showFeedbackMessage(`Paziente ${action} con successo!`, 'success');
        
        setTimeout(() => navigateTo('list'), 1500);

    } catch (error) {
        console.error('Form: Errore durante il salvataggio del paziente:', error);
        showFeedbackMessage(error.message, 'danger');
    }
}

export async function initInserimentoView() {
    const formElement = document.getElementById('form-inserimento');
    if (!formElement) {
        console.error('Elemento form #form-inserimento non trovato!');
        return;
    }

    const state = getFormState();
    const submitHandler = (event) => handleFormSubmit(event, state);

    try {
        // 1. Carica tutti i dati necessari in parallelo
        const [diagnosiOptions, patientToEdit] = await Promise.all([
            getDiagnosiOptions(),
            state.mode === 'edit' ? getPatientById(state.patientId) : Promise.resolve(null)
        ]);

        // 2. Manipola il DOM con i dati caricati
        renderDiagnosiOptions(diagnosiOptions);
        if (patientToEdit) {
            populateForm(patientToEdit);
        }

        // 3. Solo ora, inizializza i componenti (datepicker, custom select)
        initializeFormComponents();

        // 4. Aggiungi l'event listener per il submit
        formElement.addEventListener('submit', submitHandler);

    } catch (error) {
        showFeedbackMessage(error.message, 'danger');
    }

    // Restituisci una funzione di cleanup
    return () => {
        cleanupFormComponents();
        clearFormState();
        formElement.removeEventListener('submit', submitHandler);
    };
}
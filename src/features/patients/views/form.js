// src/features/patients/views/form.js
import { navigateTo } from "../../../app/router.js";
import { getFormState, clearFormState } from "./form-state.js";
import { getDiagnosiOptions, getPatientById, savePatient } from "./form-api.js";
import {
  initializeFormComponents,
  cleanupFormComponents,
  populateForm,
  renderDiagnosiOptions,
  getFormData,
  showFeedbackMessage,
} from "./form-ui.js";

async function handleFormSubmit(event, state) {
  event.preventDefault();

  // Con novalidate nel form HTML, non abbiamo più problemi di validazione
  const formData = await getFormData();

  try {
    showFeedbackMessage("Salvataggio in corso...", "info");
    
    // Separate patient data from temporary infection data
    const patientData = {};
    const tempData = {};
    
    Object.keys(formData).forEach(key => {
      if (key.startsWith('_')) {
        tempData[key] = formData[key];
      } else {
        patientData[key] = formData[key];
      }
    });

    let result;
    
    if (state.mode === "edit") {
      // Edit mode - use existing method
      result = await savePatient(patientData, state.patientId);
      
      // Se ci sono dati di infezione, gestiscili separatamente
      if (tempData._hasInfectionData && tempData._infectionData) {
        const { patientService } = await import('../services/patientService.js');
        await patientService.handleInfectionEventCreation(state.patientId, tempData._infectionData);
      }
    } else {
      // Modalità inserimento
      if (tempData._hasInfectionData && tempData._infectionData) {
        // Use coordinated creation method
        const { patientService } = await import('../services/patientService.js');
        const transactionResult = await patientService.createPatientWithInfection(
          patientData, 
          tempData._infectionData
        );
        result = transactionResult.patient;
      } else {
        // Creazione normale senza infezione
        result = await savePatient(patientData, null);
      }
    }

    // Aggiorna il currentPatientId per la tab eventi clinici
    if (result && result.id) {
      const { setCurrentPatient } = await import('./eventi-clinici-tab.js');
      setCurrentPatient(result.id);
    }

    const action = state.mode === "edit" ? "aggiornato" : "inserito";
    showFeedbackMessage(`Paziente ${action} con successo!`, "success");

    setTimeout(() => navigateTo("list"), 1500);
  } catch (error) {
    showFeedbackMessage(error.message, "danger");
  }
}

export async function initInserimentoView() {
  const formElement = document.getElementById("form-inserimento");
  if (!formElement) {
    console.error("Elemento form #form-inserimento non trovato!");
    return;
  }

  const state = getFormState();
  const submitHandler = (event) => handleFormSubmit(event, state);

  try {
    // 1. Carica tutti i dati necessari in parallelo
    const [diagnosiOptions, patientToEdit] = await Promise.all([
      getDiagnosiOptions(),
      state.mode === "edit"
        ? getPatientById(state.patientId)
        : Promise.resolve(null),
    ]);

    // 2. Manipola il DOM con i dati caricati
    renderDiagnosiOptions(diagnosiOptions);
    
    // Aggiorna il titolo del form in base alla modalità
    const titleElement = document.getElementById('inserimento-title');
    if (titleElement) {
      if (patientToEdit) {
        // Modalità modifica
        titleElement.innerHTML = `
          <span class="patient-name fw-bold">${patientToEdit.nome} ${patientToEdit.cognome}</span>
        `;
        populateForm(patientToEdit);
      } else {
        // Modalità creazione
        titleElement.innerHTML = `
          <span class="material-icons text-primary me-2">person_add</span>Inserimento Nuovo Paziente
        `;
      }
    }

    // 3. Solo ora, inizializza i componenti (datepicker, custom select)
    initializeFormComponents();

    // 4. Se siamo in modalità modifica, imposta il paziente corrente per la tab eventi clinici
    if (state.mode === "edit" && state.patientId) {
      const { setCurrentPatient } = await import('./eventi-clinici-tab.js');
      setCurrentPatient(state.patientId);
    }

    // 5. Aggiungi l'event listener per il submit
    formElement.addEventListener("submit", submitHandler);
  } catch (error) {
    showFeedbackMessage(error.message, "danger");
  }

  // Restituisci una funzione di cleanup
  return () => {
    cleanupFormComponents();
    clearFormState();
    formElement.removeEventListener("submit", submitHandler);
  };
}

// src/js/views/form.js
import { supabase } from '../core/services/supabaseClient.js';
import { mostraMessaggio } from '../shared/utils/helpers.js';
import { navigateTo } from '../app/router.js';
import { initCustomSelects } from '../shared/components/forms/CustomSelect.js';

// Oggetto per il caching degli elementi del DOM del form
const dom = {};

async function loadDiagnosiOptions() {
    const { data, error } = await supabase
        .from('diagnosi')
        .select('nome')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Error loading diagnosi options:', error.message);
        mostraMessaggio('Errore durante il caricamento delle opzioni di diagnosi.', 'danger');
        return;
    }

    const diagnosiSelect = dom.form.querySelector('#diagnosi');
    diagnosiSelect.innerHTML = '<option value="">Seleziona diagnosi...</option>';
    data.forEach(d => {
        const option = document.createElement('option');
        option.value = d.nome;
        option.textContent = d.nome;
        diagnosiSelect.appendChild(option);
    });
}

/**
 * Popola il form con i dati di un paziente per la modifica.
 * @param {string} editId - L'ID del paziente da modificare.
 */
async function populateFormForEdit(editId) {
    dom.title.innerHTML = '<span class="material-icons me-2">edit</span>Modifica Paziente';
    dom.submitButton.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Modifiche';
    dom.dataDimissioneContainer.style.display = 'block'; // Mostra il campo

    try {
        const { data, error } = await supabase.from('pazienti').select('*').eq('id', editId).single();
        if (error) throw error;
        
        // Popola dinamicamente i campi del form
        for (const key in data) {
            if (dom.form.elements[key]) {
                // Correzione per i campi di tipo 'date'
                if (dom.form.elements[key].type === 'date' && data[key]) {
                    dom.form.elements[key].value = data[key].split('T')[0];
                } else {
                    dom.form.elements[key].value = data[key];
                }
                
                // Se è una select con custom, aggiorna anche il custom select
                if (dom.form.elements[key].hasAttribute('data-custom') && dom.form.elements[key].customSelectInstance) {
                    dom.form.elements[key].customSelectInstance.setValue(data[key]);
                }
            }
        }
    } catch (error) {
        mostraMessaggio(`Errore nel caricamento dei dati del paziente: ${error.message}`, 'error');
        navigateTo('list'); // Torna alla lista se non si possono caricare i dati
    }
}

/**
 * Prepara il form per l'inserimento di un nuovo paziente.
 */
function setupFormForInsert() {
    dom.title.innerHTML = '<span class="material-icons me-2">person_add</span>Inserimento Nuovo Paziente';
    dom.submitButton.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Paziente';
    dom.form.reset();
    dom.idInput.value = '';
    dom.dataDimissioneContainer.style.display = 'none'; // Nasconde il campo
    // Imposta la data di ricovero di default a oggi
    dom.form.querySelector('#data_ricovero').value = new Date().toISOString().split('T')[0];
}

/**
 * Gestisce la logica di submit del form (sia inserimento che modifica).
 * @param {Event} e - L'evento di submit.
 * @param {string|null} editId - L'ID del paziente se in modalità modifica, altrimenti null.
 */
async function handleFormSubmit(e, editId) {
    e.preventDefault();
    if (!dom.form.checkValidity()) {
        mostraMessaggio('Per favore, compila tutti i campi obbligatori.', 'error');
        return;
    }
    
    dom.submitButton.disabled = true;
    const originalButtonHTML = dom.submitButton.innerHTML;
    dom.submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio...';
    
    const formData = Object.fromEntries(new FormData(dom.form));
    delete formData.id; // Rimuove l'ID dal corpo della richiesta in ogni caso

    // Se la data di dimissione è vuota, assicurati che venga inviato 'null'
    if (!formData.data_dimissione) {
        formData.data_dimissione = null;
    }

    try {
        let error;
        if (editId) {
            // Modalità Modifica
            const { error: updateError } = await supabase.from('pazienti').update(formData).eq('id', editId);
            error = updateError;
        } else {
            // Modalità Inserimento
            delete formData.data_dimissione; // Non si può inserire un nuovo paziente già dimesso
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utente non autenticato.');
            formData.user_id = user.id;
            const { error: insertError } = await supabase.from('pazienti').insert([formData]);
            error = insertError;
        }

        if (error) throw error;

        mostraMessaggio('Dati salvati con successo!', 'success');
        sessionStorage.removeItem('editPazienteId');
        setTimeout(() => navigateTo('list'), 1000);

    } catch (error) {
        mostraMessaggio(`Errore nel salvataggio: ${error.message}`, 'error');
    } finally {
        dom.submitButton.disabled = false;
        dom.submitButton.innerHTML = originalButtonHTML;
    }
}

/**
 * Inizializza gli event listener per il form.
 * @param {string|null} editId - L'ID del paziente se in modalità modifica.
 */
function setupFormEventListeners(editId) {
    dom.form.onsubmit = (e) => handleFormSubmit(e, editId);

    dom.backButton.addEventListener('click', () => {
        sessionStorage.removeItem('editPazienteId');
        navigateTo('home');
    });
}

/**
 * Inizializza la vista di inserimento/modifica paziente.
 */
export async function initInserimentoView() {
    const formElement = document.getElementById('form-inserimento');
    if (!formElement) return;

    // Caching degli elementi DOM
    dom.form = formElement;
    dom.backButton = formElement.closest('.card').querySelector('button[data-view="home"]');
    dom.title = document.getElementById('inserimento-title');
    dom.submitButton = formElement.querySelector('button[type="submit"]');
    dom.idInput = document.getElementById('paziente-id');
    dom.dataDimissioneContainer = document.getElementById('data-dimissione-container');

    // Carica le opzioni delle diagnosi in parallelo con il setup del form
    await loadDiagnosiOptions();

    const editId = sessionStorage.getItem('editPazienteId');

    if (editId) {
        await populateFormForEdit(editId);
    } else {
        setupFormForInsert();
    }

    // A questo punto, il form è stato popolato (in caso di modifica)
    // e le opzioni delle diagnosi sono state caricate.
    // Ora è sicuro inizializzare i custom select.
    initCustomSelects('#form-inserimento [data-custom="true"]');

    setupFormEventListeners(editId);
}

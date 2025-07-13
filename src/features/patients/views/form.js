// src/features/patients/views/form.js
import { supabase } from '../../../core/services/supabaseClient.js';
import { mostraMessaggio } from '../../../shared/utils/helpers.js';
import { navigateTo } from '../../../app/router.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';
import { initDatepickers } from '../../../shared/components/forms/Datepicker.js';

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

    return data || [];
}

async function loadPrenotazioniOptions() {
    const { data, error } = await supabase
        .from('prenotazioni')
        .select('*')
        .order('data', { ascending: true });

    if (error) {
        console.error('Error loading prenotazioni options:', error.message);
        mostraMessaggio('Errore durante il caricamento delle prenotazioni.', 'danger');
        return;
    }

    return data || [];
}

function buildFormsOptionsList(prenotazioni) {
    return prenotazioni.map(p => ({
        value: p.id,
        text: `${p.cognome} ${p.nome} - ${new Date(p.data).toLocaleDateString('it-IT')}`
    }));
}

async function loadEditingPatient(patientId) {
    if (!patientId) return null;

    const { data, error } = await supabase
        .from('pazienti')
        .select('*')
        .eq('id', patientId)
        .single();

    if (error) {
        console.error('Error loading patient for editing:', error.message);
        mostraMessaggio('Errore durante il caricamento del paziente.', 'danger');
        return null;
    }

    return data;
}

function populateFormForEdit(patient) {
    if (!patient) return;

    // Popola i campi del form con i dati del paziente
    dom.formElement.querySelector('#nome').value = patient.nome || '';
    dom.formElement.querySelector('#cognome').value = patient.cognome || '';
    dom.formElement.querySelector('#data_nascita').value = patient.data_nascita || '';
    dom.formElement.querySelector('#telefono').value = patient.telefono || '';
    dom.formElement.querySelector('#data_ricovero').value = patient.data_ricovero || '';
    dom.formElement.querySelector('#data_dimissione').value = patient.data_dimissione || '';
    dom.formElement.querySelector('#email').value = patient.email || '';
    dom.formElement.querySelector('#note').value = patient.note || '';

    // Seleziona la diagnosi corretta nel select
    const diagnosiSelect = dom.formElement.querySelector('select[data-custom-select="diagnosi"]');
    if (diagnosiSelect && patient.diagnosi) {
        diagnosiSelect.value = patient.diagnosi;
    }

    // Seleziona la prenotazione corretta nel select
    const prenotazioniSelect = dom.formElement.querySelector('select[data-custom-select="prenotazioni"]');
    if (prenotazioniSelect && patient.prenotazione_id) {
        prenotazioniSelect.value = patient.prenotazione_id;
    }

    // Aggiorna il titolo del form
    const titleElement = dom.formElement.querySelector('h2');
    if (titleElement) {
        titleElement.textContent = 'Modifica Paziente';
    }

    // Aggiorna il testo del pulsante di submit
    const submitButton = dom.formElement.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.innerHTML = '<span class="material-icons me-2">save</span>Aggiorna Paziente';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const patientData = {
        nome: formData.get('nome'),
        cognome: formData.get('cognome'),
        data_nascita: formData.get('data_nascita'),
        telefono: formData.get('telefono'),
        data_ricovero: formData.get('data_ricovero'),
        data_dimissione: formData.get('data_dimissione') || null,
        email: formData.get('email'),
        diagnosi: formData.get('diagnosi'),
        prenotazione_id: formData.get('prenotazioni') || null,
        note: formData.get('note')
    };

    // Verifica se siamo in modalità modifica o inserimento
    const patientId = new URLSearchParams(window.location.search).get('id');
    
    try {
        let result;
        if (patientId) {
            // Modalità modifica
            result = await supabase
                .from('pazienti')
                .update(patientData)
                .eq('id', patientId);
        } else {
            // Modalità inserimento
            result = await supabase
                .from('pazienti')
                .insert([patientData]);
        }

        if (result.error) {
            throw result.error;
        }

        const action = patientId ? 'aggiornato' : 'inserito';
        mostraMessaggio(`Paziente ${action} con successo!`, 'success');
        
        // Reindirizza alla home dopo un breve delay
        setTimeout(() => {
            navigateTo('#home');
        }, 1500);

    } catch (error) {
        console.error('Error saving patient:', error.message);
        mostraMessaggio('Errore durante il salvataggio del paziente.', 'danger');
    }
}

export async function initInserimentoView() {
    const formHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Inserimento Nuovo Paziente</h2>
            <button type="button" class="btn btn-outline-secondary" onclick="window.history.back()">
                <span class="material-icons me-2">arrow_back</span>
                Indietro
            </button>
        </div>

        <form id="patient-form" class="row g-3">
            <div class="col-md-6">
                <label for="nome" class="form-label">Nome *</label>
                <input type="text" class="form-control" id="nome" name="nome" required>
            </div>
            <div class="col-md-6">
                <label for="cognome" class="form-label">Cognome *</label>
                <input type="text" class="form-control" id="cognome" name="cognome" required>
            </div>
            <div class="col-md-6">
                <label for="data_nascita" class="form-label">Data di Nascita</label>
                <input type="text" class="form-control" id="data_nascita" name="data_nascita" data-datepicker placeholder="gg/mm/aaaa">
            </div>
            <div class="col-md-6">
                <label for="telefono" class="form-label">Telefono</label>
                <input type="tel" class="form-control" id="telefono" name="telefono">
            </div>
            <div class="col-md-6">
                <label for="data_ricovero" class="form-label">Data Ricovero *</label>
                <input type="text" class="form-control" id="data_ricovero" name="data_ricovero" data-datepicker placeholder="gg/mm/aaaa" required>
            </div>
            <div class="col-md-6">
                <label for="data_dimissione" class="form-label">Data Dimissione</label>
                <input type="text" class="form-control" id="data_dimissione" name="data_dimissione" data-datepicker placeholder="gg/mm/aaaa">
            </div>
            <div class="col-md-6">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" name="email">
            </div>
            <div class="col-md-6">
                <label for="diagnosi" class="form-label">Diagnosi</label>
                <select name="diagnosi" data-custom-select="diagnosi" data-placeholder="Seleziona una diagnosi">
                    <option value="">Seleziona una diagnosi</option>
                </select>
            </div>
            <div class="col-md-6">
                <label for="prenotazioni" class="form-label">Prenotazione</label>
                <select name="prenotazioni" data-custom-select="prenotazioni" data-placeholder="Seleziona una prenotazione">
                    <option value="">Seleziona una prenotazione</option>
                </select>
            </div>
            <div class="col-12">
                <label for="note" class="form-label">Note</label>
                <textarea class="form-control" id="note" name="note" rows="3"></textarea>
            </div>
            <div class="col-12">
                <button type="submit" class="btn btn-primary">
                    <span class="material-icons me-2">save</span>
                    Salva Paziente
                </button>
            </div>
        </form>
    `;

    // Cache degli elementi DOM
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = formHTML;
    
    dom.formElement = document.getElementById('patient-form');

    // Inizializza i componenti
    await initCustomSelects(dom.formElement);
    await initDatepickers(dom.formElement);

    // Carica e popola le opzioni
    try {
        const [diagnosiOptions, prenotazioniOptions] = await Promise.all([
            loadDiagnosiOptions(),
            loadPrenotazioniOptions()
        ]);

        // Popola il select delle diagnosi
        const diagnosiSelect = dom.formElement.querySelector('select[data-custom-select="diagnosi"]');
        if (diagnosiSelect && diagnosiOptions) {
            diagnosiOptions.forEach(diagnosi => {
                const option = document.createElement('option');
                option.value = diagnosi.nome;
                option.textContent = diagnosi.nome;
                diagnosiSelect.appendChild(option);
            });
        }

        // Popola il select delle prenotazioni
        const prenotazioniSelect = dom.formElement.querySelector('select[data-custom-select="prenotazioni"]');
        if (prenotazioniSelect && prenotazioniOptions) {
            const optionsList = buildFormsOptionsList(prenotazioniOptions);
            optionsList.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                prenotazioniSelect.appendChild(optionElement);
            });
        }

        // Reinizializza i custom selects dopo aver popolato le opzioni
        await initCustomSelects(dom.formElement);

    } catch (error) {
        console.error('Error loading form options:', error);
        mostraMessaggio('Errore durante il caricamento delle opzioni del form.', 'danger');
    }

    // Verifica se siamo in modalità modifica
    const patientId = new URLSearchParams(window.location.search).get('id');
    if (patientId) {
        const patient = await loadEditingPatient(patientId);
        populateFormForEdit(patient);
    }

    // Aggiungi l'event listener per il submit del form
    dom.formElement.addEventListener('submit', handleFormSubmit);

    return formHTML;
}
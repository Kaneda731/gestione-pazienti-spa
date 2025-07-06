// src/js/views/dimissione.js
import { supabase } from '../supabase.js';
import { mostraMessaggio } from '../ui.js';
import { navigateTo } from '../router.js';

// Caching degli elementi del DOM e stato
const dom = {};
let selectedPaziente = null;

/**
 * Mostra i risultati della ricerca dei pazienti.
 * @param {Array<Object>} pazienti - La lista dei pazienti trovati.
 */
function renderResults(pazienti) {
    dom.resultsContainer.innerHTML = '';
    if (pazienti.length === 0) {
        dom.resultsContainer.innerHTML = '<p class="text-center text-muted">Nessun paziente attivo trovato.</p>';
        return;
    }
    pazienti.forEach(p => {
        const item = document.createElement('button');
        item.className = 'list-group-item list-group-item-action';
        item.textContent = `${p.cognome} ${p.nome} (Ricovero: ${new Date(p.data_ricovero).toLocaleDateString()})`;
        item.onclick = () => selectPaziente(p);
        dom.resultsContainer.appendChild(item);
    });
}

/**
 * Seleziona un paziente dalla lista e mostra il form di dimissione.
 * @param {Object} paziente - L'oggetto paziente selezionato.
 */
function selectPaziente(paziente) {
    selectedPaziente = paziente;
    dom.selectedPazienteNome.textContent = `${paziente.cognome} ${paziente.nome}`;
    dom.selectedPazienteRicovero.textContent = new Date(paziente.data_ricovero).toLocaleDateString();
    dom.dimissioneForm.classList.remove('d-none');
    dom.resultsContainer.innerHTML = '';
    dom.searchInput.value = '';
    dom.searchInput.focus();
}

/**
 * Esegue la ricerca dei pazienti attivi per cognome.
 */
async function handleSearch() {
    const searchTerm = dom.searchInput.value.trim();
    if (searchTerm.length < 2) {
        mostraMessaggio('Inserisci almeno 2 caratteri per la ricerca.', 'info', 'messaggio-container-dimissione');
        return;
    }
    dom.resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    try {
        const { data, error } = await supabase
            .from('pazienti')
            .select('id, nome, cognome, data_ricovero')
            .ilike('cognome', `%${searchTerm}%`)
            .is('data_dimissione', null) // Cerca solo pazienti attivi
            .order('cognome');
        if (error) throw error;
        renderResults(data);
    } catch (error) {
        mostraMessaggio(`Errore nella ricerca: ${error.message}`, 'error', 'messaggio-container-dimissione');
    }
}

/**
 * Gestisce il submit del form di dimissione.
 * @param {Event} e - L'evento di submit.
 */
async function handleDimissioneSubmit(e) {
    e.preventDefault();
    const data_dimissione = dom.dataDimissioneInput.value;
    if (!selectedPaziente || !data_dimissione) {
        mostraMessaggio('Seleziona un paziente e una data di dimissione.', 'warning', 'messaggio-container-dimissione');
        return;
    }
    try {
        const { error } = await supabase.from('pazienti').update({ data_dimissione }).eq('id', selectedPaziente.id);
        if (error) throw error;
        mostraMessaggio('Paziente dimesso con successo!', 'success', 'messaggio-container-dimissione');
        dom.dimissioneForm.classList.add('d-none');
        selectedPaziente = null;
        setTimeout(() => navigateTo('home'), 1500);
    } catch (error) {
        mostraMessaggio(`Errore durante la dimissione: ${error.message}`, 'error', 'messaggio-container-dimissione');
    }
}

/**
 * Inizializza gli event listener per la vista.
 */
function setupEventListeners() {
    dom.searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    dom.searchButton.addEventListener('click', handleSearch);
    dom.dimissioneForm.addEventListener('submit', handleDimissioneSubmit);
    dom.backButton.addEventListener('click', () => navigateTo('home'));
}

/**
 * Inizializza la vista di dimissione paziente.
 */
export function initDimissioneView() {
    const view = document.querySelector('#app-container .view');
    if (!view) return;

    // Caching degli elementi DOM
    dom.searchInput = document.getElementById('search-paziente');
    dom.searchButton = document.getElementById('search-button');
    dom.resultsContainer = document.getElementById('search-results');
    dom.dimissioneForm = document.getElementById('form-dimissione');
    dom.selectedPazienteNome = document.getElementById('selected-paziente-nome');
    dom.selectedPazienteRicovero = document.getElementById('selected-paziente-ricovero');
    dom.dataDimissioneInput = document.getElementById('data_dimissione');
    dom.backButton = view.querySelector('button[data-view="home"]');

    // Reset dello stato all'inizializzazione
    dom.dimissioneForm.classList.add('d-none');
    dom.resultsContainer.innerHTML = '';
    dom.searchInput.value = '';
    selectedPaziente = null;

    setTimeout(() => {
        setupEventListeners();
        dom.searchInput.focus();
    }, 0);
}

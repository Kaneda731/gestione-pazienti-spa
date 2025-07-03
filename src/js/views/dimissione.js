// src/js/views/dimissione.js
import { supabase } from '../supabase.js';
import { mostraMessaggio } from '../ui.js';
import { navigateTo } from '../router.js';

export function initDimissioneView() {
    const searchInput = document.getElementById('search-paziente');
    if (!searchInput) return;

    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('search-results');
    const dimissioneForm = document.getElementById('form-dimissione');
    const backButton = dimissioneForm.closest('.card').querySelector('button[data-view="home"]');
    let selectedPazienteId = null;

    const handleSearch = async () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length < 2) {
            mostraMessaggio('Inserisci almeno 2 caratteri.', 'info', 'messaggio-container-dimissione');
            return;
        }
        resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
        try {
            const { data, error } = await supabase.from('pazienti').select('id, nome, cognome, data_ricovero').ilike('cognome', `%${searchTerm}%`).is('data_dimissione', null).order('cognome');
            if (error) throw error;
            resultsContainer.innerHTML = data.length === 0 ? '<p class="text-center text-muted">Nessun paziente trovato.</p>' : '';
            data.forEach(p => {
                const item = document.createElement('button');
                item.className = 'list-group-item list-group-item-action';
                item.textContent = `${p.cognome} ${p.nome} (Ricovero: ${new Date(p.data_ricovero).toLocaleDateString()})`;
                item.onclick = () => {
                    selectedPazienteId = p.id;
                    document.getElementById('selected-paziente-nome').textContent = `${p.cognome} ${p.nome}`;
                    document.getElementById('selected-paziente-ricovero').textContent = new Date(p.data_ricovero).toLocaleDateString();
                    dimissioneForm.classList.remove('d-none');
                    resultsContainer.innerHTML = '';
                    searchInput.value = '';
                };
                resultsContainer.appendChild(item);
            });
        } catch (error) {
            mostraMessaggio(`Errore nella ricerca: ${error.message}`, 'error', 'messaggio-container-dimissione');
        }
    };

    searchInput.addEventListener('keypress', e => e.key === 'Enter' && (e.preventDefault(), handleSearch()));
    searchButton.addEventListener('click', handleSearch);

    dimissioneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data_dimissione = document.getElementById('data_dimissione').value;
        if (!selectedPazienteId || !data_dimissione) return;
        try {
            const { error } = await supabase.from('pazienti').update({ data_dimissione }).eq('id', selectedPazienteId);
            if (error) throw error;
            mostraMessaggio('Paziente dimesso!', 'success', 'messaggio-container-dimissione');
            dimissioneForm.classList.add('d-none');
            setTimeout(() => navigateTo('home'), 2000);
        } catch (error) {
            mostraMessaggio(`Errore nella dimissione: ${error.message}`, 'error', 'messaggio-container-dimissione');
        }
    });
    backButton.addEventListener('click', () => navigateTo('home'));
}

// src/js/views/list.js
import { supabase } from '../supabase.js';
import { navigateTo } from '../router.js';

export async function initListView() {
    const tableBody = document.getElementById('pazienti-table-body');
    if (!tableBody) return;

    const searchInput = document.getElementById('list-search');
    const repartoFilter = document.getElementById('list-filter-reparto');
    const diagnosiFilter = document.getElementById('list-filter-diagnosi');
    const statoFilter = document.getElementById('list-filter-stato');
    const backButton = tableBody.closest('.card').querySelector('button[data-view="home"]');
    
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border"></div></td></tr>';

    try {
        const { data: pazienti, error } = await supabase
            .from('pazienti')
            .select('*')
            .order('cognome', { ascending: true });

        if (error) throw error;

        const populateFilter = (columnName, selectElement) => {
            const uniqueValues = [...new Set(pazienti.map(p => p[columnName]))].sort();
            selectElement.innerHTML = `<option value="">Tutti</option>`;
            uniqueValues.forEach(value => {
                if(value) selectElement.innerHTML += `<option value="${value}">${value}</option>`;
            });
        };
        populateFilter('reparto_appartenenza', repartoFilter);
        populateFilter('diagnosi', diagnosiFilter);

        const applyFilters = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const reparto = repartoFilter.value;
            const diagnosi = diagnosiFilter.value;
            const stato = statoFilter.value;

            const filteredPazienti = pazienti.filter(p => {
                const searchMatch = p.nome.toLowerCase().includes(searchTerm) || p.cognome.toLowerCase().includes(searchTerm);
                const repartoMatch = !reparto || p.reparto_appartenenza === reparto;
                const diagnosiMatch = !diagnosi || p.diagnosi === diagnosi;
                const statoMatch = !stato || (stato === 'attivo' && !p.data_dimissione) || (stato === 'dimesso' && p.data_dimissione);
                
                return searchMatch && repartoMatch && diagnosiMatch && statoMatch;
            });
            renderTable(filteredPazienti);
        };

        const renderTable = (pazientiToRender) => {
            tableBody.innerHTML = '';
            if (pazientiToRender.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nessun paziente trovato.</td></tr>';
                return;
            }
            pazientiToRender.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${p.cognome}</td>
                    <td>${p.nome}</td>
                    <td>${new Date(p.data_ricovero).toLocaleDateString()}</td>
                    <td>${p.diagnosi}</td>
                    <td>${p.reparto_appartenenza}</td>
                    <td>${p.data_dimissione ? `<span class="badge bg-secondary">Dimesso</span>` : `<span class="badge bg-success">Attivo</span>`}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${p.id}">Modifica</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${p.id}">Elimina</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        };

        renderTable(pazienti);

        [searchInput, repartoFilter, diagnosiFilter, statoFilter].forEach(el => {
            el.addEventListener('input', applyFilters);
        });

        tableBody.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;
            if (!action || !id) return;

            if (action === 'edit') {
                sessionStorage.setItem('editPazienteId', id);
                navigateTo('inserimento');
            } else if (action === 'delete') {
                const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
                const confirmBtn = document.getElementById('confirm-delete-btn');
                
                const handleDelete = async () => {
                    try {
                        const { error } = await supabase.from('pazienti').delete().eq('id', id);
                        if (error) throw error;
                        initListView();
                    } catch (error) {
                        console.error('Errore eliminazione paziente:', error);
                        alert(`Errore: ${error.message}`);
                    } finally {
                        deleteModal.hide();
                    }
                };

                confirmBtn.onclick = handleDelete;
                deleteModal.show();
            }
        });

    } catch (error) {
        console.error('Errore caricamento elenco pazienti:', error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Errore: ${error.message}</td></tr>`;
    }

    backButton.addEventListener('click', () => navigateTo('home'));
}

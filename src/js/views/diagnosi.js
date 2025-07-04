import { supabase } from '../supabase.js';
import { mostraMessaggio } from '../ui.js';

export function initDiagnosiView() {
    const diagnosiForm = document.getElementById('diagnosi-form');
    const diagnosiNameInput = document.getElementById('diagnosi-name');
    const diagnosiTableBody = document.getElementById('diagnosi-table-body');

    async function fetchDiagnosi() {
        const { data, error } = await supabase
            .from('diagnosi')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Errore nel recupero delle diagnosi:', error.message);
            mostraMessaggio('Errore nel recupero delle diagnosi.', 'danger');
            return;
        }

        diagnosiTableBody.innerHTML = '';
        data.forEach(diagnosi => {
            const row = diagnosiTableBody.insertRow();
            row.innerHTML = `
                <td>${diagnosi.nome}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-warning edit-diagnosi-btn" data-id="${diagnosi.id}" data-nome="${diagnosi.nome}">Modifica</button>
                    <button class="btn btn-sm btn-danger delete-diagnosi-btn" data-id="${diagnosi.id}">Elimina</button>
                </td>
            `;
        });

        addEventListeners();
    }

    async function addDiagnosi(event) {
        event.preventDefault();
        const nome = diagnosiNameInput.value.trim();
        if (!nome) return;

        const { error } = await supabase
            .from('diagnosi')
            .insert({ nome });

        if (error) {
            console.error('Errore nell\'aggiunta della diagnosi:', error.message);
            mostraMessaggio('Errore nell\'aggiunta della diagnosi.', 'danger');
            return;
        }

        diagnosiNameInput.value = '';
        mostraMessaggio('Diagnosi aggiunta con successo!', 'success');
        fetchDiagnosi();
    }

    function addEventListeners() {
        document.querySelectorAll('.edit-diagnosi-btn').forEach(button => {
            button.onclick = (e) => {
                const id = e.target.dataset.id;
                const nome = e.target.dataset.nome;
                // Implementa logica di modifica
                console.log('Modifica diagnosi:', id, nome);
            };
        });

        document.querySelectorAll('.delete-diagnosi-btn').forEach(button => {
            button.onclick = async (e) => {
                const id = e.target.dataset.id;
                if (confirm('Sei sicuro di voler eliminare questa diagnosi?')) {
                    const { error } = await supabase
                        .from('diagnosi')
                        .delete()
                        .eq('id', id);

                    if (error) {
                        console.error('Errore nell\'eliminazione della diagnosi:', error.message);
                        mostraMessaggio('Errore nell\'eliminazione della diagnosi.', 'danger');
                        return;
                    }
                    mostraMessaggio('Diagnosi eliminata con successo!', 'success');
                    fetchDiagnosi();
                }
            };
        });
    }

    diagnosiForm.addEventListener('submit', addDiagnosi);
    fetchDiagnosi();
}
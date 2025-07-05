import { supabase } from '../supabase.js';
import { mostraMessaggio } from '../ui.js';
import { navigateTo } from '../router.js';

let diagnosiTableBody;
let diagnosiForm;
let diagnosiInput;
let saveDiagnosiBtn;
let currentDiagnosiId = null;

export async function initDiagnosiView() {
    diagnosiTableBody = document.getElementById('diagnosi-table-body');
    diagnosiForm = document.getElementById('diagnosi-form');
    diagnosiInput = document.getElementById('diagnosi-name');
    saveDiagnosiBtn = document.getElementById('save-diagnosi-btn');

    if (diagnosiForm) {
        diagnosiForm.addEventListener('submit', handleSaveDiagnosi);
    }

    const backButton = document.querySelector('[data-view="home"]');
    if (backButton) {
        backButton.addEventListener('click', () => navigateTo('home'));
    }

    await loadDiagnosi();
}

async function loadDiagnosi() {
    const { data, error } = await supabase
        .from('diagnosi')
        .select('id, nome')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Error loading diagnosi:', error);
        mostraMessaggio('Errore durante il caricamento delle diagnosi.', 'error');
        return;
    }

    renderDiagnosiTable(data);
}

function renderDiagnosiTable(diagnosi) {
    diagnosiTableBody.innerHTML = '';
    if (diagnosi.length === 0) {
        diagnosiTableBody.innerHTML = '<tr><td colspan="2" class="text-center">Nessuna diagnosi trovata.</td></tr>';
        return;
    }

    diagnosi.forEach(d => {
        const row = diagnosiTableBody.insertRow();
        row.innerHTML = `
            <td data-label="Nome Diagnosi">${d.nome}</td>
            <td data-label="Azioni">
                <button class="btn btn-sm btn-warning edit-btn" data-id="${d.id}" data-name="${d.nome}" title="Modifica diagnosi">
                    <span class="material-icons">edit</span>
                    <span class="btn-text">Modifica</span>
                </button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${d.id}" title="Elimina diagnosi">
                    <span class="material-icons">delete</span>
                    <span class="btn-text">Elimina</span>
                </button>
            </td>
        `;
        row.querySelector('.edit-btn').addEventListener('click', handleEditDiagnosi);
        row.querySelector('.delete-btn').addEventListener('click', handleDeleteDiagnosi);
    });
}

async function handleSaveDiagnosi(event) {
    event.preventDefault();
    const name = diagnosiInput.value.trim();

    if (!name) {
        mostraMessaggio('Il nome della diagnosi non può essere vuoto.', 'error');
        return;
    }

    if (currentDiagnosiId) {
        const { error } = await supabase
            .from('diagnosi')
            .update({ nome: name })
            .eq('id', currentDiagnosiId);

        if (error) {
            console.error('Error updating diagnosis:', error.message);
            mostraMessaggio('Errore durante l\'aggiornamento della diagnosi.', 'error');
        } else {
            mostraMessaggio('Diagnosi aggiornata con successo!', 'success');
            resetForm();
            await loadDiagnosi();
        }
    } else {
        const { error } = await supabase
            .from('diagnosi')
            .insert({ nome: name });

        if (error) {
            console.error('Error adding diagnosis:', error.message);
            mostraMessaggio('Errore durante l\'aggiunta della diagnosi.', 'error');
        } else {
            mostraMessaggio('Diagnosi aggiunta con successo!', 'success');
            diagnosiInput.value = '';
            await loadDiagnosi();
        }
    }
}

function handleEditDiagnosi(event) {
    const button = event.currentTarget;
    currentDiagnosiId = button.dataset.id;
    diagnosiInput.value = button.dataset.name;
    saveDiagnosiBtn.textContent = 'Aggiorna Diagnosi';
}

async function handleDeleteDiagnosi(event) {
    const id = event.currentTarget.dataset.id;
    if (confirm('Sei sicuro di voler eliminare questa diagnosi? Questa azione è irreversibile.')) {
        const { error } = await supabase
            .from('diagnosi')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting diagnosis:', error.message);
            mostraMessaggio('Errore durante l\'eliminazione della diagnosi.', 'error');
        } else {
            mostraMessaggio('Diagnosi eliminata con successo!', 'success');
            await loadDiagnosi();
        }
    }
}

function resetForm() {
    currentDiagnosiId = null;
    diagnosiInput.value = '';
    saveDiagnosiBtn.textContent = 'Aggiungi Diagnosi';
}

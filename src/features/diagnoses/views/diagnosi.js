// src/features/diagnoses/views/diagnosi.js
import { getDiagnosi, saveDiagnosi, deleteDiagnosi } from './diagnosi-api.js';
import {
    dom,
    renderTable,
    populateFormForEdit,
    resetForm,
    showFeedback
} from './diagnosi-ui.js';

let currentDiagnosiId = null;

async function loadAndRenderDiagnosi() {
    try {
        const diagnosi = await getDiagnosi();
        renderTable(diagnosi);
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

async function handleSave(event) {
    event.preventDefault();
    const name = dom.input.value.trim();

    if (!name) {
        showFeedback('Il nome della diagnosi non può essere vuoto.', 'error');
        return;
    }

    try {
        await saveDiagnosi(currentDiagnosiId, name);
        const action = currentDiagnosiId ? 'aggiornata' : 'aggiunta';
        showFeedback(`Diagnosi ${action} con successo!`, 'success');
        resetForm();
        currentDiagnosiId = null;
        await loadAndRenderDiagnosi();
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

async function handleDelete(id) {
    const { ConfirmModal } = await import('../../../shared/components/ui/ConfirmModal.js');
    
    const modal = ConfirmModal.forDiagnosisDeletion();
    const confirmed = await modal.show();
    
    if (confirmed) {
        try {
            await deleteDiagnosi(id);
            showFeedback('Diagnosi eliminata con successo!', 'success');
            await loadAndRenderDiagnosi();
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }
}

function handleTableClick(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;

    if (target.classList.contains('edit-btn')) {
        currentDiagnosiId = id;
        populateFormForEdit(target.dataset.name);
    } else if (target.classList.contains('delete-btn')) {
        handleDelete(id);
    }
}

export async function initDiagnosiView() {
    dom.form.addEventListener('submit', handleSave);
    dom.tableBody.addEventListener('click', handleTableClick);

    // Carica i dati iniziali
    await loadAndRenderDiagnosi();

    // Cleanup function
    return () => {
        // Event listeners are automatically removed when the view is destroyed
    };
}
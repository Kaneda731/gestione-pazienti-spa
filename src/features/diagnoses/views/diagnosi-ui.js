// src/features/diagnoses/views/diagnosi-ui.js
import { mostraMessaggio } from '../../../shared/utils/helpers.js';

// Contiene gli elementi del DOM per un accesso più facile
export const dom = {
    get tableBody() { return document.getElementById('diagnosi-table-body'); },
    get form() { return document.getElementById('diagnosi-form'); },
    get input() { return document.getElementById('diagnosi-name'); },
    get saveButton() { return document.getElementById('save-diagnosi-btn'); },
};

/**
 * Renderizza la tabella delle diagnosi.
 * @param {Array<Object>} diagnosi - La lista delle diagnosi.
 * @param {object} eventHandlers - Oggetto con le funzioni per gestire i click.
 */
export function renderTable(diagnosi, eventHandlers) {
    dom.tableBody.innerHTML = '';
    if (diagnosi.length === 0) {
        dom.tableBody.innerHTML = '<tr><td colspan="2" class="text-center">Nessuna diagnosi trovata.</td></tr>';
        return;
    }

    diagnosi.forEach(d => {
        const row = dom.tableBody.insertRow();
        row.innerHTML = `
            <td data-label="Nome Diagnosi">${d.nome}</td>
            <td data-label="Azioni" class="text-end">
                <button class="btn btn-sm btn-warning edit-btn" data-id="${d.id}" data-name="${d.nome}" title="Modifica diagnosi">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${d.id}" title="Elimina diagnosi">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        `;
        // Usa event delegation nel controllore invece di aggiungere listener qui
    });
}

/**
 * Prepara il form per la modifica di una diagnosi.
 * @param {string} name - Il nome della diagnosi da modificare.
 */
export function populateFormForEdit(name) {
    dom.input.value = name;
    dom.saveButton.innerHTML = '<span class="material-icons">edit</span> Aggiorna';
    dom.input.focus();
}

/**
 * Resetta il form al suo stato iniziale.
 */
export function resetForm() {
    dom.form.reset();
    dom.saveButton.innerHTML = '<span class="material-icons">add</span> Aggiungi Diagnosi';
}

/**
 * Mostra un messaggio di feedback all'utente.
 * @param {string} message 
 * @param {'info'|'success'|'error'} type 
 */
export function showFeedback(message, type) {
    mostraMessaggio(message, type);
}
// src/features/diagnoses/views/diagnosi-ui.js
import { notificationService } from '../../../core/services/notifications/notificationService.js';

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
        const row = dom.tableBody.insertRow();
        const td = document.createElement('td');
        td.colSpan = 2;
        td.className = 'text-center';
        td.textContent = 'Nessuna diagnosi trovata.';
        row.appendChild(td);
        return;
    }

    diagnosi.forEach(d => {
        const row = dom.tableBody.insertRow();
        // Crea le celle in modo sicuro
        const tdNome = document.createElement('td');
        tdNome.setAttribute('data-label', 'Nome Diagnosi');
        tdNome.textContent = d.nome;
        row.appendChild(tdNome);

        const tdAzioni = document.createElement('td');
        tdAzioni.setAttribute('data-label', 'Azioni');
        tdAzioni.className = 'text-end';

        // Bottone modifica
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn btn-sm btn-warning edit-btn';
        btnEdit.setAttribute('data-id', d.id);
        btnEdit.setAttribute('data-name', d.nome);
        btnEdit.title = 'Modifica diagnosi';
        btnEdit.innerHTML = '<span class="material-icons">edit</span>';
        tdAzioni.appendChild(btnEdit);

        // Bottone elimina
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn btn-sm btn-danger delete-btn';
        btnDelete.setAttribute('data-id', d.id);
        btnDelete.title = 'Elimina diagnosi';
        btnDelete.innerHTML = '<span class="material-icons">delete</span>';
        tdAzioni.appendChild(btnDelete);

        row.appendChild(tdAzioni);
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
    switch(type) {
        case 'success':
            notificationService.success(message);
            break;
        case 'error':
            notificationService.error(message);
            break;
        case 'warning':
            notificationService.warning(message);
            break;
        default:
            notificationService.info(message);
    }
}
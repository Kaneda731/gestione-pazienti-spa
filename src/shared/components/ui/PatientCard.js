// src/js/components/ui/PatientCard.js

import { ActionButtons } from './ActionButtons.js';
import { StatusBadge } from './StatusBadge.js';
import { currentUser } from '../../services/authService.js';

/**
 * Componente per renderizzare le card dei pazienti
 */
export class PatientCard {
    constructor(patient, options = {}) {
        this.patient = patient;
        this.options = {
            isMobile: window.innerWidth <= 767,
            showActions: true,
            ...options
        };
    }

    /**
     * Renderizza la card del paziente
     * @returns {string} HTML della card
     */
    render() {
        const isDimesso = this.patient.data_dimissione;
        const statusClass = isDimesso ? 'error' : 'success';
        
        // Verifica permessi utente
        const userRole = currentUser.profile?.role;
        const canEdit = userRole === 'admin' || userRole === 'editor';
        
        if (this.options.isMobile) {
            return this.renderMobileCard(statusClass, canEdit);
        } else {
            return this.renderDesktopCard(statusClass, canEdit);
        }
    }

    /**
     * Renderizza la card per dispositivi mobili
     * @param {string} statusClass - Classe CSS per lo stato
     * @param {boolean} canEdit - Se l'utente può modificare
     * @returns {string} HTML della card mobile
     */
    renderMobileCard(statusClass, canEdit) {
        const actionButtons = this.options.showActions && canEdit 
            ? new ActionButtons(this.patient, { isMobile: true }).render()
            : '';

        return `
            <div class="card card-list-compact status-${statusClass}">
                <div class="card-body">
                    <div>
                        <div class="card-title">${this.patient.cognome} ${this.patient.nome}</div>
                        <div class="card-meta mobile-text-sm">
                            ${this.patient.diagnosi} • ${this.patient.reparto_appartenenza}
                        </div>
                    </div>
                    ${actionButtons ? `<div class="mobile-horizontal" style="gap: 0.25rem;">${actionButtons}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderizza la card per desktop
     * @param {string} statusClass - Classe CSS per lo stato
     * @param {boolean} canEdit - Se l'utente può modificare
     * @returns {string} HTML della card desktop
     */
    renderDesktopCard(statusClass, canEdit) {
        const statusBadge = new StatusBadge(this.patient).renderForCard();
        const actionButtons = this.options.showActions && canEdit 
            ? new ActionButtons(this.patient, { isMobile: false }).render()
            : '';

        return `
            <div class="patient-card">
                <div class="patient-card-header">
                    <h6 class="patient-name">${this.patient.cognome} ${this.patient.nome}</h6>
                    ${statusBadge}
                </div>
                <div class="patient-details">
                    <div class="patient-detail">
                        <span class="patient-detail-label">Data Ricovero</span>
                        <span class="patient-detail-value">${new Date(this.patient.data_ricovero).toLocaleDateString()}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="patient-detail-label">Diagnosi</span>
                        <span class="patient-detail-value">${this.patient.diagnosi}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="patient-detail-label">Reparto</span>
                        <span class="patient-detail-value">${this.patient.reparto_appartenenza}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="patient-detail-label">Livello</span>
                        <span class="patient-detail-value">${this.patient.livello_assistenza}</span>
                    </div>
                </div>
                ${actionButtons ? `<div class="patient-actions">${actionButtons}</div>` : ''}
            </div>
        `;
    }

    /**
     * Renderizza la riga della tabella per desktop
     * @returns {string} HTML della riga della tabella
     */
    renderTableRow() {
        const isDimesso = this.patient.data_dimissione;
        const statusBadge = new StatusBadge(this.patient).render();
        
        // Verifica permessi utente
        const userRole = currentUser.profile?.role;
        const canEdit = userRole === 'admin' || userRole === 'editor';
        
        const actionButtons = this.options.showActions && canEdit 
            ? new ActionButtons(this.patient, { isTable: true }).render()
            : '';

        return `
            <tr>
                <td data-label="Cognome">${this.patient.cognome}</td>
                <td data-label="Nome">${this.patient.nome}</td>
                <td data-label="Data Ricovero">${new Date(this.patient.data_ricovero).toLocaleDateString()}</td>
                <td data-label="Diagnosi">${this.patient.diagnosi}</td>
                <td data-label="Reparto">${this.patient.reparto_appartenenza}</td>
                <td data-label="Stato">${statusBadge}</td>
                <td class="text-nowrap">
                    ${actionButtons}
                </td>
            </tr>
        `;
    }
}

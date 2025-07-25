// src/shared/components/ui/PatientCard.js

import { ActionButtons } from './ActionButtons.js';
import { StatusBadge } from './StatusBadge.js';
import { currentUser } from '../../../core/auth/authService.js';
import { getPostOperativeStatus } from '../../../features/eventi-clinici/utils/post-operative-calculator.js';

/**
 * Componente per renderizzare le card dei pazienti
 */
export class PatientCard {
    constructor(patient, options = {}) {
        this.patient = patient;
        this.options = {
            isMobile: window.innerWidth <= 767,
            showActions: true,
            showClinicalEvents: false,
            showPostOperativeDays: true,
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

        // Get post-operative status for mobile display
        const postOpInfo = this.options.showPostOperativeDays && this.patient.eventi_clinici 
            ? getPostOperativeStatus(this.patient.eventi_clinici)
            : null;

        const postOpBadge = postOpInfo && postOpInfo.hasStatus 
            ? `<span class="badge bg-${postOpInfo.statusClass} ms-1" style="font-size: 0.7em;">${postOpInfo.badgeText}</span>`
            : '';

        const quickActionsSection = this.options.showClinicalEvents && canEdit
            ? this.renderMobileQuickActions()
            : '';

        return `
            <div class="card card-list-compact status-${statusClass}">
                <div class="card-body">
                    <div>
                        <div class="card-title">${this.patient.cognome} ${this.patient.nome}${postOpBadge}</div>
                        <div class="card-meta mobile-text-sm">
                            ${this.patient.diagnosi} • ${this.patient.reparto_appartenenza}
                            ${postOpInfo && postOpInfo.hasStatus ? ` • ${postOpInfo.statusText}` : ''}
                        </div>
                    </div>
                    <div class="mobile-actions-container">
                        ${actionButtons ? `<div class="mobile-horizontal" style="gap: 0.25rem;">${actionButtons}</div>` : ''}
                        ${quickActionsSection}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizza i pulsanti di azione rapida per mobile
     * @returns {string} HTML dei pulsanti di azione rapida per mobile
     */
    renderMobileQuickActions() {
        return `
            <div class="mobile-quick-actions mt-2">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary btn-add-intervention" 
                            data-patient-id="${this.patient.id}" 
                            title="Aggiungi Intervento">
                        <span class="material-icons" style="font-size: 12px;">medical_services</span>
                    </button>
                    <button type="button" class="btn btn-outline-warning btn-add-infection" 
                            data-patient-id="${this.patient.id}" 
                            title="Aggiungi Infezione">
                        <span class="material-icons" style="font-size: 12px;">warning</span>
                    </button>
                    <button type="button" class="btn btn-outline-info btn-view-events" 
                            data-patient-id="${this.patient.id}" 
                            title="Timeline Eventi">
                        <span class="material-icons" style="font-size: 12px;">timeline</span>
                    </button>
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

        // Get post-operative status if enabled
        const postOpInfo = this.options.showPostOperativeDays && this.patient.eventi_clinici 
            ? getPostOperativeStatus(this.patient.eventi_clinici)
            : null;

        const postOpBadge = postOpInfo && postOpInfo.hasStatus 
            ? `<span class="badge bg-${postOpInfo.statusClass} ms-2" title="${postOpInfo.statusText}">${postOpInfo.badgeText}</span>`
            : '';

        const clinicalEventsSection = this.options.showClinicalEvents && this.patient.eventi_clinici
            ? this.renderClinicalEventsTimeline()
            : '';

        const quickActionsSection = this.options.showClinicalEvents && canEdit
            ? this.renderQuickActions()
            : '';

        return `
            <div class="patient-card">
                <div class="patient-card-header">
                    <h6 class="patient-name">${this.patient.cognome} ${this.patient.nome}${postOpBadge}</h6>
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
                    ${postOpInfo && postOpInfo.hasStatus ? `
                    <div class="patient-detail">
                        <span class="patient-detail-label">Post-Operatorio</span>
                        <span class="patient-detail-value">${postOpInfo.statusText}</span>
                    </div>
                    ` : ''}
                </div>
                ${clinicalEventsSection}
                ${quickActionsSection}
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

        // Get post-operative status for table display
        const postOpInfo = this.options.showPostOperativeDays && this.patient.eventi_clinici 
            ? getPostOperativeStatus(this.patient.eventi_clinici)
            : null;

        const postOpCell = postOpInfo && postOpInfo.hasStatus 
            ? `<span class="badge bg-${postOpInfo.statusClass}" title="${postOpInfo.statusText}">${postOpInfo.badgeText}</span>`
            : '-';

        return `
            <tr>
                <td data-label="Cognome">${this.patient.cognome}</td>
                <td data-label="Nome">${this.patient.nome}</td>
                <td data-label="Data Ricovero">${new Date(this.patient.data_ricovero).toLocaleDateString()}</td>
                <td data-label="Diagnosi">${this.patient.diagnosi}</td>
                <td data-label="Reparto">${this.patient.reparto_appartenenza}</td>
                <td data-label="Post-Op">${postOpCell}</td>
                <td data-label="Stato">${statusBadge}</td>
                <td class="text-nowrap">
                    ${actionButtons}
                </td>
            </tr>
        `;
    }

    /**
     * Renderizza la timeline degli eventi clinici
     * @returns {string} HTML della timeline
     */
    renderClinicalEventsTimeline() {
        if (!this.patient.eventi_clinici || this.patient.eventi_clinici.length === 0) {
            return `
                <div class="clinical-events-section mt-3">
                    <h6 class="clinical-events-title">Eventi Clinici</h6>
                    <p class="text-muted small">Nessun evento clinico registrato</p>
                </div>
            `;
        }

        // Sort events by date (most recent first)
        const sortedEvents = [...this.patient.eventi_clinici].sort((a, b) => 
            new Date(b.data_evento) - new Date(a.data_evento)
        );

        // Show only the most recent 3 events in card view
        const recentEvents = sortedEvents.slice(0, 3);

        const eventsHtml = recentEvents.map(evento => {
            const eventDate = new Date(evento.data_evento).toLocaleDateString();
            const eventIcon = evento.tipo_evento === 'intervento' ? 'medical_services' : 'warning';
            const eventClass = evento.tipo_evento === 'intervento' ? 'text-primary' : 'text-warning';
            
            return `
                <div class="clinical-event-item d-flex align-items-center mb-2">
                    <span class="material-icons ${eventClass} me-2" style="font-size: 16px;">${eventIcon}</span>
                    <div class="flex-grow-1">
                        <div class="event-type small fw-bold">${evento.tipo_evento === 'intervento' ? 'Intervento' : 'Infezione'}</div>
                        <div class="event-details small text-muted">
                            ${eventDate} - ${evento.tipo_intervento || evento.agente_patogeno || 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const showMoreLink = sortedEvents.length > 3 
            ? `<a href="#eventi-clinici?paziente=${this.patient.id}" class="small text-primary">Vedi tutti (${sortedEvents.length})</a>`
            : '';

        return `
            <div class="clinical-events-section mt-3">
                <h6 class="clinical-events-title">Eventi Clinici Recenti</h6>
                <div class="clinical-events-timeline">
                    ${eventsHtml}
                </div>
                ${showMoreLink}
            </div>
        `;
    }

    /**
     * Renderizza i pulsanti di azione rapida per eventi clinici
     * @returns {string} HTML dei pulsanti di azione rapida
     */
    renderQuickActions() {
        return `
            <div class="quick-actions-section mt-3">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary btn-add-intervention" 
                            data-patient-id="${this.patient.id}" 
                            title="Aggiungi Intervento">
                        <span class="material-icons" style="font-size: 14px;">medical_services</span>
                        Intervento
                    </button>
                    <button type="button" class="btn btn-outline-warning btn-add-infection" 
                            data-patient-id="${this.patient.id}" 
                            title="Aggiungi Infezione">
                        <span class="material-icons" style="font-size: 14px;">warning</span>
                        Infezione
                    </button>
                    <button type="button" class="btn btn-outline-info btn-view-events" 
                            data-patient-id="${this.patient.id}" 
                            title="Vedi tutti gli eventi">
                        <span class="material-icons" style="font-size: 14px;">timeline</span>
                        Timeline
                    </button>
                </div>
            </div>
        `;
    }
}

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
     * Ottiene la data dell'ultimo intervento se esiste
     * @returns {string|null} Data formattata dell'ultimo intervento
     */
    getLastInterventionDate() {
        if (!this.patient.eventi_clinici || this.patient.eventi_clinici.length === 0) {
            return null;
        }

        const interventions = this.patient.eventi_clinici
            .filter(evento => evento.tipo_evento === 'intervento')
            .sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));

        return interventions.length > 0 
            ? new Date(interventions[0].data_evento).toLocaleDateString()
            : null;
    }

    /**
     * Verifica se il paziente è infetto
     * @returns {boolean} True se il paziente è infetto
     */
    isPatientInfected() {
        return this.patient.infetto === true || this.patient.infetto === 'true';
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

        // Get last intervention date
        const lastInterventionDate = this.getLastInterventionDate();
        
        // Check if patient is infected
        const isInfected = this.isPatientInfected();

        // Add infection badge to title if infected
        const infectionBadge = isInfected 
            ? `<span class="badge bg-warning text-dark ms-1" style="font-size: 0.7em;">
                 <span class="material-icons" style="font-size: 0.6em;">warning</span> Infetto
               </span>`
            : '';

        // Build additional info array
        const additionalInfo = [];
        if (postOpInfo && postOpInfo.hasStatus) {
            additionalInfo.push(postOpInfo.statusText);
        }
        if (lastInterventionDate) {
            additionalInfo.push(`Intervento: ${lastInterventionDate}`);
        }

        const quickActionsSection = this.options.showClinicalEvents && canEdit
            ? this.renderMobileQuickActions()
            : '';

        // Add infection class to card if patient is infected
        const cardClass = isInfected ? 'card-list-compact status-infected' : 'card-list-compact';

        return `
            <div class="card ${cardClass} status-${statusClass}">
                <div class="card-body">
                    <div class="card-info">
                        <div class="card-title d-flex align-items-center gap-2">
                            <span class="material-icons text-primary" style="font-size:1.4em;">person</span>
                            <span class="fw-bold">${this.patient.cognome} ${this.patient.nome}</span>
                            ${postOpBadge}${infectionBadge}
                        </div>
                        <div class="card-meta mobile-text-sm">
                            ${this.patient.diagnosi} • ${this.patient.reparto_appartenenza}
                            ${additionalInfo.length > 0 ? ` • ${additionalInfo.join(' • ')}` : ''}
                        </div>
                    </div>
                    <div class="mobile-actions-container">
                        ${actionButtons ? `<div class="mobile-primary-actions">${actionButtons}</div>` : ''}
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
                <div class="mobile-clinical-actions">
                    <button type="button" class="btn btn-outline-primary mobile-clinical-btn btn-add-intervention" 
                            data-patient-id="${this.patient.id}" 
                            title="Aggiungi Intervento">
                        <span class="material-icons">medical_services</span>
                        <span class="mobile-clinical-text">Intervento</span>
                    </button>
                    <button type="button" class="btn btn-outline-warning mobile-clinical-btn btn-add-infection" 
                            data-patient-id="${this.patient.id}" 
                            title="Aggiungi Infezione">
                        <span class="material-icons">warning</span>
                        <span class="mobile-clinical-text">Infezione</span>
                    </button>
                    <button type="button" class="btn btn-outline-info mobile-clinical-btn btn-view-events" 
                            data-patient-id="${this.patient.id}" 
                            title="Timeline Eventi">
                        <span class="material-icons">timeline</span>
                        <span class="mobile-clinical-text">Timeline</span>
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

        // Check if patient is infected
        const isInfected = this.isPatientInfected();
        const infectionBadge = isInfected 
            ? `<span class="badge bg-warning text-dark ms-2" title="Paziente infetto">
                 <span class="material-icons" style="font-size: 0.8em;">warning</span> Infetto
               </span>`
            : '';

        const clinicalEventsSection = this.options.showClinicalEvents && this.patient.eventi_clinici
            ? this.renderClinicalEventsTimeline()
            : '';

        const quickActionsSection = this.options.showClinicalEvents && canEdit
            ? this.renderQuickActions()
            : '';

        // Add infection class to card if patient is infected
        const cardClass = isInfected ? 'patient-card patient-card-infected' : 'patient-card';

        return `
            <div class="${cardClass}">
                <div class="patient-card-header d-flex align-items-center gap-2">
                    <span class="material-icons text-primary" style="font-size:1.7em;">person</span>
                    <h6 class="patient-name fw-bold mb-0">${this.patient.cognome} ${this.patient.nome}</h6>
                    ${postOpBadge}${infectionBadge}
                    <span class="flex-grow-1"></span>
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
                    ${isInfected ? `
                    <div class="patient-detail">
                        <span class="patient-detail-label">Stato Infezione</span>
                        <span class="patient-detail-value text-warning fw-bold">
                            <span class="material-icons" style="font-size: 1em; vertical-align: middle;">warning</span>
                            Paziente Infetto
                        </span>
                    </div>
                    ` : ''}
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
     * Genera informazioni di trasferimento per la colonna dedicata
     * @returns {string} HTML delle informazioni di trasferimento
     */
    getTransferInfo() {
        if (!this.patient.data_dimissione || !this.patient.tipo_dimissione) {
            return '-';
        }

        switch (this.patient.tipo_dimissione) {
            case 'trasferimento_interno':
                return this.patient.reparto_destinazione ? 
                    `<small class="text-info"><strong>→ ${this.patient.reparto_destinazione}</strong></small>` : 
                    '<small class="text-muted">Interno</small>';
            
            case 'trasferimento_esterno':
                let externalInfo = '<small class="text-warning"><strong>Esterno</strong>';
                if (this.patient.clinica_destinazione) {
                    externalInfo += `<br>→ ${this.patient.clinica_destinazione}`;
                }
                if (this.patient.codice_clinica) {
                    const clinicName = this.patient.codice_clinica === '56' ? 'Riab. Motoria' : 
                                     this.patient.codice_clinica === '60' ? 'Lunga Degenza' : 
                                     `Cod. ${this.patient.codice_clinica}`;
                    externalInfo += `<br>(${clinicName})`;
                }
                externalInfo += '</small>';
                return externalInfo;
            
            case 'dimissione':
            default:
                return '<small class="text-muted">-</small>';
        }
    }

    /**
     * Renderizza la riga della tabella per desktop
     * @returns {string} HTML della riga della tabella
     */
    renderTableRow() {
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

        // Get transfer info for transfer column
        const transferInfo = this.getTransferInfo();

        // Check if patient is infected and add visual indicator
        const isInfected = this.isPatientInfected();
        const infectionIndicator = isInfected 
            ? `<span class="badge bg-warning text-dark ms-1" title="Paziente infetto">
                 <span class="material-icons" style="font-size: 0.8em;">warning</span> Infetto
               </span>`
            : '';

        // Add infection class to row if patient is infected
        const rowClass = isInfected ? 'table-warning' : '';

        return `
            <tr class="${rowClass}">
                <td data-label="Cognome">${this.patient.cognome}</td>
                <td data-label="Nome">${this.patient.nome}</td>
                <td data-label="Data Nascita">${this.patient.data_nascita ? new Date(this.patient.data_nascita).toLocaleDateString() : '-'}</td>
                <td data-label="Data Ricovero">${new Date(this.patient.data_ricovero).toLocaleDateString()}</td>
                <td data-label="Diagnosi">${this.patient.diagnosi}</td>
                <td data-label="Reparto">${this.patient.reparto_appartenenza}</td>
                <td data-label="Post-Op">${postOpCell}</td>
                <td data-label="Stato">${statusBadge}${infectionIndicator}</td>
                <td data-label="Trasferimento">${transferInfo}</td>
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

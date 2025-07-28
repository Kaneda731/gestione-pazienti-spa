// src/features/eventi-clinici/views/EventiCliniciModalManager.js

import {
  fetchEventiClinici,
  createEventoClinico,
  updateEventoClinico,
  deleteEventoClinico,
  searchPazientiForEvents
} from './eventi-clinici-api.js';

import {
  populateEventForm,
  resetEventForm,
  clearFormMessages,
  showFormMessage,
  updateModalTitle,
  renderEventDetails,
  renderPatientSearchResults
} from './eventi-clinici-ui.js';

import { logger } from '../../../core/services/loggerService.js';
import { notificationService } from '../../../core/services/notificationService.js';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';
import { getFormData, validateFormData, hideSearchResults, debounce } from './EventiCliniciUtils.js';

/**
 * Gestione dei modali per gli eventi clinici
 */
export class EventiCliniciModalManager {
  constructor(state, domElements) {
    this.state = state;
    this.domElements = domElements;
    this.eventFormModal = null;
    this.eventDetailModal = null;
  }

  /**
   * Inizializza i modali Bootstrap
   */
  async initializeModals() {
    try {
      // Dynamically import Bootstrap Modal
      const { Modal } = await import('bootstrap');

      const eventFormModalEl = this.domElements.eventFormModal;
      const eventDetailModalEl = this.domElements.eventDetailModal;

      if (eventFormModalEl) {
        this.eventFormModal = new Modal(eventFormModalEl, {
          backdrop: 'static',
          keyboard: false
        });
      }

      if (eventDetailModalEl) {
        this.eventDetailModal = new Modal(eventDetailModalEl);
      }

      logger.log('✅ Modali inizializzati');
    } catch (error) {
      logger.error('❌ Errore inizializzazione modali:', error);
    }
  }

  /**
   * Apre il modal per nuovo evento
   */
  openEventModal(eventData = null) {
    try {
      // Reset form
      resetEventForm();
      clearFormMessages();

      if (eventData) {
        // Edit mode
        this.state.editingEventId = eventData.id;
        updateModalTitle('Modifica Evento Clinico', 'edit');
        populateEventForm(eventData);
      } else {
        // Create mode
        this.state.editingEventId = null;
        updateModalTitle('Nuovo Evento Clinico', 'add');
      }

      // Forza la reinizializzazione del datepicker per il modal
      setTimeout(() => {
        const eventDateInput = document.getElementById('evento-data');
        if (eventDateInput && eventDateInput._flatpickrInstance) {
          // L'istanza esiste già, assicuriamoci che sia funzionante
          eventDateInput._flatpickrInstance.redraw();
        } else {
          // Inizializza ex-novo se non esiste
          import('../../../shared/components/forms/CustomDatepicker.js').then(({ initCustomDatepickers }) => {
            initCustomDatepickers('[data-datepicker]', {
              maxDate: 'today',
              allowInput: true,
              locale: { firstDayOfWeek: 1 }
            });
          });
        }
      }, 100);

      if (this.eventFormModal) {
        this.eventFormModal.show();
      }

    } catch (error) {
      logger.error('❌ Errore apertura modal evento:', error);
      // Temporarily commented out to prevent notification flood
      // notificationService.error('Errore nell'apertura del form');
    }
  }

  /**
   * Gestisce il salvataggio dell'evento
   */
  async handleSaveEvent(onReloadData) {
    try {
      // Get form data
      const formData = getFormData(this.domElements);

      // Validate form
      const validation = validateFormData(formData);
      if (!validation.isValid) {
        showFormMessage(validation.errors);
        return;
      }

      // Show loading state
      if (this.domElements.saveBtn) {
        this.domElements.saveBtn.disabled = true;
        this.domElements.saveBtn.innerHTML = sanitizeHtml('<span class="spinner-border spinner-border-sm me-1"></span>Salvando...');
      }

      let result;
      if (this.state.editingEventId) {
        // Update existing event
        result = await updateEventoClinico(this.state.editingEventId, formData);
      } else {
        // Create new event
        result = await createEventoClinico(formData);
      }

      // Close modal and reload data
      if (this.eventFormModal) {
        this.eventFormModal.hide();
      }

      if (onReloadData) {
        await onReloadData();
      }

      const action = this.state.editingEventId ? 'aggiornato' : 'creato';
      // Temporarily commented out to prevent notification flood
      // notificationService.success(`Evento clinico ${action} con successo`);

    } catch (error) {
      logger.error('❌ Errore salvataggio evento:', error);
      showFormMessage(error.message || 'Errore nel salvataggio dell\'evento');
    } finally {
      // Reset button state
      if (this.domElements.saveBtn) {
        this.domElements.saveBtn.disabled = false;
        this.domElements.saveBtn.innerHTML = sanitizeHtml('<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Evento');
      }
    }
  }

  /**
   * Mostra i dettagli di un evento
   */
  async showEventDetail(eventId) {
    try {
      // Find event in current data or fetch it
      const eventsData = await fetchEventiClinici({ ...this.state.filters }, 0);
      const evento = eventsData.eventi.find(e => e.id === eventId);

      if (!evento) {
        notificationService.error('Evento non trovato');
        return;
      }

      // Populate detail modal
      renderEventDetails(evento);

      // Store current event ID for edit/delete actions
      this.state.editingEventId = eventId;

      // Show modal
      if (this.eventDetailModal) {
        this.eventDetailModal.show();
      }

    } catch (error) {
      logger.error('❌ Errore visualizzazione dettagli evento:', error);
      // La notifica di errore è già gestita dal service/api layer.
    }
  }

  /**
   * Modifica un evento
   */
  async editEvent(eventId) {
    try {
      // Find event data
      const eventsData = await fetchEventiClinici({ ...this.state.filters }, 0);
      const evento = eventsData.eventi.find(e => e.id === eventId);

      if (!evento) {
        notificationService.error('Evento non trovato');
        return;
      }

      // Close detail modal if open
      if (this.eventDetailModal) {
        this.eventDetailModal.hide();
      }

      // Open edit modal
      this.openEventModal(evento);

    } catch (error) {
      logger.error('❌ Errore modifica evento:', error);
      // La notifica di errore è già gestita dal service/api layer.
    }
  }

  /**
   * Gestisce la modifica evento dal detail modal
   */
  handleEditEvent() {
    if (this.state.editingEventId) {
      this.editEvent(this.state.editingEventId);
    }
  }

  /**
   * Conferma eliminazione evento
   */
  async confirmDeleteEvent(eventId) {
    const { ConfirmModal } = await import('../../../shared/components/ui/ConfirmModal.js');
    
    const modal = ConfirmModal.forClinicalEventDeletion();
    const confirmed = await modal.show();
    
    if (confirmed) {
      await this.deleteEvent(eventId);
    }
  }

  /**
   * Gestisce l'eliminazione evento dal detail modal
   */
  async handleDeleteEvent() {
    if (this.state.editingEventId) {
      await this.confirmDeleteEvent(this.state.editingEventId);
    }
  }

  /**
   * Elimina un evento
   */
  async deleteEvent(eventId, onReloadData) {
    try {
      await deleteEventoClinico(eventId);

      // Close detail modal if open
      if (this.eventDetailModal) {
        this.eventDetailModal.hide();
      }

      // Reload data
      if (onReloadData) {
        await onReloadData();
      }

      // La notifica di successo è già gestita da eventiCliniciService.

    } catch (error) {
      logger.error('❌ Errore eliminazione evento:', error);
      // La notifica di errore è già gestita a livello di service/api.
    }
  }

  /**
   * Gestisce la ricerca pazienti nel modal
   */
  async handleModalPatientSearch(searchTerm) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        hideSearchResults('evento-patient-search-results');
        return;
      }

      const patients = await searchPazientiForEvents(searchTerm);
      renderPatientSearchResults(patients, 'evento-patient-search-results');

    } catch (error) {
      logger.error('❌ Errore ricerca pazienti modal:', error);
    }
  }

  /**
   * Crea handler per la ricerca pazienti nel modal con debouncing
   */
  createModalPatientSearchHandler() {
    return debounce((e) => this.handleModalPatientSearch(e.target.value), 300);
  }

  /**
   * Pulisce i modali
   */
  cleanup() {
    // Close modals
    if (this.eventFormModal) {
      this.eventFormModal.hide();
      this.eventFormModal = null;
    }

    if (this.eventDetailModal) {
      this.eventDetailModal.hide();
      this.eventDetailModal = null;
    }
  }
}
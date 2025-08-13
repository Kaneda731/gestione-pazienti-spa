// src/app/main.js

/**
 * Entry point principale dell'applicazione
 */

// Configurazione
import { environment, isDevelopment } from "./config/environment.js";
import { STORAGE_KEYS } from "./config/constants.js";

// Importa tutti gli stili, nell'ordine corretto
import "flatpickr/dist/flatpickr.min.css";
import "/src/styles/desktop.scss";
import "/src/styles/mobile.scss";

// Core services
import { initErrorHandling } from "../core/services/errorService.js";
import { initAuth } from "../core/auth/authService.js";
import { initTheme } from "../core/services/themeService.js";
import { logger } from "../core/services/loggerService.js";

// Extension error handling
import "../core/utils/extensionErrorHandler.js";

// Shared services
import "../shared/components/ui/index.js";
import "../core/services/bootstrapService.js";
import { stateService } from "../core/services/stateService.js";
import { notificationService } from "../core/services/notificationService.js";
import "../core/services/uiStateService.js";

// Emergency commands (sempre disponibili per sicurezza)
import "../core/services/emergencyCommands.js";

// Expose notificationService globally for development testing
if (isDevelopment) {
  window.notificationService = notificationService;
}

// Components
import "../shared/components/forms/CustomSelect.js";

// Mobile support
import "../features/patients/components/mobile-card-manager.js";
import { initMobileUI } from "./mobile/mobile-navigation.js";
import { initializeAuthEventListeners } from "../shared/components/ui/AuthUI.js";

// Router
import { renderView } from "./router.js";
import { initBackToMenuButtons } from "../core/services/navigationService.js";

/**
 * Inizializza l'applicazione
 */
async function initializeApp() {
  try {
    logger.log(
      `🚀 Inizializzazione ${environment.APP_NAME} v${environment.APP_VERSION}`
    );

    initErrorHandling();
    initTheme();
    initBackToMenuButtons();
    initMobileUI();
    initializeAuthEventListeners();
    notificationService.init();

    window.addEventListener("hashchange", renderView);

    // Gestisce l'autenticazione e il rendering iniziale.
    // Questa è l'unica fonte di verità per il primo rendering.
    await initAuth((session) => {
      const redirectUrl = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_URL);
      sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_URL);

      if (session && redirectUrl) {
        window.location.hash = redirectUrl;
      } else {
        renderView();
      }
    });

    logger.log("✅ Applicazione inizializzata con successo");
  } catch (error) {
    console.error(
      "❌ Errore durante l'inizializzazione dell'applicazione:",
      error
    );

    if (isDevelopment) {
      console.log(
        "🚨 If you see infinite error loops, run: window.notificationEmergencyReset()"
      );
    }

    document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Errore di inizializzazione</h4>
                    <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
                    ${
                      isDevelopment
                        ? "<p><small>Dev: Controlla la console per comandi di debug</small></p>"
                        : ""
                    }
                    <hr>
                    <p class="mb-0">Ricarica la pagina per riprovare.</p>
                </div>
            </div>
        `;
  }
}

window.addEventListener("load", initializeApp);

/**
 * ========================================
 * DESIGN SYSTEM - SCRIPT PAZIENTI v2.0
 * ========================================
 * 
 * Unifica tutti gli stili CSS per garantire coerenza visiva
 * File organizzato in sezioni per manutenibilità migliorata
 * 
 * === SEZIONI ===
 * 1. CSS VARIABLES & THEMING
 * 2. BASE STYLES (reset, layout, animations)
 * 3. COMPONENTS (buttons, forms, dialogs)
 * 4. MODULES (graphs, import, tempo medio)
 * 5. UTILITIES & HELPERS
 * 6. PUBLIC API METHODS
 * 
 * === FEATURES ===
 * - CSS Variables per theming
 * - Dark mode support automatico
 * - Responsive design
 * - Componenti riutilizzabili
 * - Animazioni fluide
 * - Debug semplificato
 * 
 * === UTILIZZO ===
 * const css = DesignSystem.getMainCSS();
 * const dialogCSS = DesignSystem.getSelectionDialogCSS();
 */

const DesignSystem = {
  
  // ========================================
  // SECTION 1: CSS VARIABLES & THEMING
  // ========================================
  
  /**
   * CSS Variables centralizzate per theming e dark mode
   * @private
   * @returns {string} CSS variables complete
   */
  _getCSSVariables() {
    return `
      :root {
        /* Colori principali */
        --dialog-bg: #FFFFFF;
        --dialog-text: #202124;
        --primary-btn-bg: #1A73E8;
        --primary-btn-text: #FFFFFF;
        --secondary-btn-bg: #F8F9FA;
        --secondary-btn-text: #202124;
        --border-color: #DADCE0;
        
        /* Colori di stato */
        --success-color: #34A853;
        --error-color: #EA4335;
        --warning-color: #FBBC04;
        --info-color: #4285F4;
        
        /* Ombre */
        --shadow-1dp: 0 1px 1px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
        --shadow-2dp: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
        --shadow-4dp: 0 4px 6px rgba(32, 33, 36, 0.28);
        --shadow-8dp: 0 8px 10px 1px rgba(60,64,67,.14), 0 3px 14px 2px rgba(60,64,67,.12), 0 5px 5px -3px rgba(60,64,67,.2);
        
        /* Transition standard */
        --transition: all 0.2s ease;
      }

      /* Dark mode support automatico */
      @media (prefers-color-scheme: dark) {
        :root {
          --dialog-bg: #2B2B2B;
          --dialog-text: #E8EAED;
          --primary-btn-bg: #8AB4F8;
          --primary-btn-text: #202124;
          --secondary-btn-bg: #3C4043;
          --secondary-btn-text: #E8EAED;
          --border-color: #3C4043;
          --shadow-4dp: 0 4px 6px rgba(0, 0, 0, 0.3);
          --success-color: #81c995;
          --error-color: #f28b82;
          --warning-color: #fdd663;
          --info-color: #8ab4f8;
        }
      }
    `;
  },

  // ========================================
  // SECTION 2: BASE STYLES
  // ========================================
  
  /**
   * Reset CSS e stili base
   * @private
   * @returns {string} CSS reset e base
   */
  _getResetAndBaseStyles() {
    return `
      /* Reset e base styles */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: var(--dialog-bg);
        color: var(--dialog-text);
        padding: 24px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
  },

  /**
   * Animazioni e keyframes
   * @private
   * @returns {string} CSS animazioni
   */
  _getAnimationStyles() {
    return `
      /* Animazioni */
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
  },

  /**
   * Layout e container principali
   * @private
   * @returns {string} CSS layout
   */
  _getLayoutStyles() {
    return `
      /* Container principale */
      .dialog-container {
        width: 100%;
        max-width: 580px;
        background-color: var(--dialog-bg);
        border-radius: 12px;
        box-shadow: var(--shadow-4dp);
        overflow: hidden;
        animation: slideUp 0.4s ease-out;
      }

      .dialog-container.small {
        max-width: 450px;
      }

      .dialog-container.large {
        max-width: 700px;
      }

      /* Header dialogo */
      .dialog-header {
        background: linear-gradient(135deg, var(--primary-btn-bg) 0%, #4285F4 100%);
        color: var(--primary-btn-text);
        padding: 24px;
        text-align: center;
      }

      .dialog-header h2 {
        font-size: 1.5rem;
        font-weight: 500;
        margin: 0;
      }

      .dialog-header .subtitle {
        font-size: 0.875rem;
        opacity: 0.9;
        margin-top: 4px;
      }

      /* Contenuto dialogo */
      .dialog-content {
        padding: 24px;
      }

      .dialog-content.text-center {
        text-align: center;
      }
    `;
  },

  // ========================================
  // SECTION 3: COMPONENTS
  // ========================================
  
  /**
   * Stili per pulsanti unificati
   * @private
   * @returns {string} CSS pulsanti
   */
  _getButtonStyles() {
    return `
      /* Buttons - Unified styles */
      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: var(--transition);
        text-decoration: none;
        font-family: inherit;
        min-width: 100px;
        justify-content: center;
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-2dp);
      }

      .btn:active {
        transform: translateY(0);
      }

      .btn-primary {
        background: var(--primary-btn-bg);
        color: var(--primary-btn-text);
      }

      .btn-primary:hover {
        opacity: 0.9;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .btn-secondary {
        background: var(--secondary-btn-bg);
        color: var(--secondary-btn-text);
        border: 1px solid var(--border-color);
      }

      .btn-secondary:hover {
        background: var(--border-color);
      }

      .btn-success {
        background: var(--success-color);
        color: white;
      }

      .btn-danger {
        background: var(--error-color);
        color: white;
      }

      .btn-warning {
        background: var(--warning-color);
        color: #202124;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      /* Button groups */
      .btn-group {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 24px;
      }

      .btn-group.left {
        justify-content: flex-start;
      }

      .btn-group.right {
        justify-content: flex-end;
      }
    `;
  },

  /**
   * Stili per form e input
   * @private
   * @returns {string} CSS form
   */
  _getFormStyles() {
    return `
      /* Form elements */
      .form-group {
        margin-bottom: 20px;
      }

      .form-label {
        display: block;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--dialog-text);
      }

      .form-input, .form-select {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 14px;
        background-color: var(--dialog-bg);
        color: var(--dialog-text);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .form-input:focus, .form-select:focus {
        outline: none;
        border-color: var(--primary-btn-bg);
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
      }
    `;
  },

  /**
   * Stili per icone Material Design
   * @private
   * @returns {string} CSS icone
   */
  _getIconStyles() {
    return `
      /* Icons */
      .material-icons {
        font-size: 18px;
      }

      .icon-large .material-icons {
        font-size: 48px;
      }

      .icon-success .material-icons {
        color: var(--success-color);
      }

      .icon-error .material-icons {
        color: var(--error-color);
      }

      .icon-warning .material-icons {
        color: var(--warning-color);
      }

      .icon-info .material-icons {
        color: var(--info-color);
      }
    `;
  },

  /**
   * Stili per messaggi e notifiche
   * @private
   * @returns {string} CSS messaggi
   */
  _getMessageStyles() {
    return `
      /* Messages */
      .message {
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .message-success {
        background: rgba(52, 168, 83, 0.1);
        border: 1px solid var(--success-color);
        color: var(--success-color);
      }

      .message-error {
        background: rgba(234, 67, 53, 0.1);
        border: 1px solid var(--error-color);
        color: var(--error-color);
      }

      .message-warning {
        background: rgba(251, 188, 4, 0.1);
        border: 1px solid var(--warning-color);
        color: #B7400E;
      }

      .message-info {
        background: rgba(66, 133, 244, 0.1);
        border: 1px solid var(--info-color);
        color: var(--info-color);
      }

      /* Details section */
      .details {
        font-size: 0.875rem;
        opacity: 0.8;
        padding: 12px;
        background: rgba(0,0,0,0.05);
        border-radius: 6px;
        margin-top: 8px;
        max-height: 100px;
        overflow-y: auto;
        white-space: pre-wrap;
      }

      /* Loading state */
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 20px;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-color);
        border-top: 2px solid var(--primary-btn-bg);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    `;
  },

  // ========================================
  // SECTION 4: UTILITIES & RESPONSIVE
  // ========================================
  
  /**
   * Classi utility
   * @private
   * @returns {string} CSS utility
   */
  _getUtilityStyles() {
    return `
      /* Utility classes */
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      
      .mt-0 { margin-top: 0; }
      .mt-1 { margin-top: 8px; }
      .mt-2 { margin-top: 16px; }
      .mt-3 { margin-top: 24px; }
      
      .mb-0 { margin-bottom: 0; }
      .mb-1 { margin-bottom: 8px; }
      .mb-2 { margin-bottom: 16px; }
      .mb-3 { margin-bottom: 24px; }
      
      .hidden { display: none; }
      .visible { display: block; }
    `;
  },

  /**
   * Stili responsive per mobile
   * @private
   * @returns {string} CSS responsive
   */
  _getResponsiveStyles() {
    return `
      /* Responsive design */
      @media (max-width: 480px) {
        body {
          padding: 16px;
        }

        .dialog-container {
          max-width: none;
          width: 100%;
        }

        .dialog-header, .dialog-content {
          padding: 16px;
        }

        .btn-group {
          flex-direction: column;
        }

        .btn {
          width: 100%;
        }
      }
    `;
  },

  // ========================================
  // SECTION 5: PUBLIC API (UNCHANGED!)
  // ========================================
  
  /**
   * CSS principale per tutti i dialoghi del sistema
   * API PUBBLICA - MANTIENE COMPATIBILITÀ COMPLETA
   * @returns {string} CSS completo base
   */
  /**
   * CSS principale per tutti i dialoghi del sistema
   * API PUBBLICA - MANTIENE COMPATIBILITÀ COMPLETA
   * @returns {string} CSS completo base
   */
  getMainCSS() {
    return this._getCSSVariables() +
           this._getResetAndBaseStyles() +
           this._getAnimationStyles() +
           this._getLayoutStyles() +
           this._getButtonStyles() +
           this._getFormStyles() +
           this._getIconStyles() +
           this._getMessageStyles() +
           this._getUtilityStyles() +
           this._getResponsiveStyles();
  },

  // ========================================
  // SECTION 6: SPECIALIZED MODULES
  // ========================================
  
  /**
   * CSS per dialoghi di selezione con opzioni
   * @returns {string} CSS per dialoghi con liste
   */
  getSelectionDialogCSS() {
    return `
      .options-container {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin: 16px 0;
      }

      .option-item {
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .option-item:last-child {
        border-bottom: none;
      }

      .option-item:hover {
        background-color: rgba(26, 115, 232, 0.05);
      }

      .option-item:active {
        background-color: rgba(26, 115, 232, 0.1);
      }

      .option-icon {
        width: 24px;
        height: 24px;
        background: var(--primary-btn-bg);
        color: white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        flex-shrink: 0;
      }

      .option-content {
        flex: 1;
      }

      .option-name {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .option-description {
        font-size: 0.875rem;
        opacity: 0.7;
      }

      .option-meta {
        font-size: 0.75rem;
        opacity: 0.6;
        margin-top: 4px;
      }
    `;
  },

  /**
   * CSS per componenti grafici base
   * @returns {string} CSS per componenti grafici
   */
  getChartCSS() {
    return `
      .chart-container {
        padding: 16px;
        background: var(--dialog-bg);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        margin: 16px 0;
      }

      .chart-title {
        font-size: 1.125rem;
        font-weight: 500;
        margin-bottom: 16px;
        text-align: center;
      }

      .chart-controls {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .chart-control {
        flex: 1;
        min-width: 200px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin: 16px 0;
      }

      .stat-card {
        background: var(--secondary-btn-bg);
        padding: 16px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid var(--border-color);
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-btn-bg);
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 0.875rem;
        opacity: 0.8;
      }
    `;
  },

  // ========================================
  // SECTION 9B: PRIVATE MODULE METHODS - GRAFICI
  // ========================================

  /**
   * CSS per dialoghi di selezione grafici - PRIVATO
   * @returns {string} CSS per selezione grafici
   */
  _getGraphSelectionStyles() {
    return `
      /* Container fullscreen per grafici */
      body.graph-dialog {
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        max-width: none;
        width: 100%;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Header con gradiente */
      .header {
        background: linear-gradient(135deg, var(--primary-btn-bg) 0%, #4285F4 100%);
        color: white;
        padding: 24px;
        text-align: center;
        flex-shrink: 0;
        animation: slideUp 0.4s ease-out;
      }

      /* Contenuto scrollabile */
      .content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        background-color: var(--dialog-bg);
      }

      /* Sezioni */
      .section {
        background-color: var(--dialog-bg);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-1dp);
        animation: slideUp 0.4s ease-out;
      }

      .section-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--dialog-text);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Grid per opzioni */
      .options-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }

      .option-card {
        padding: 16px 12px;
        border: 2px solid var(--border-color);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        background-color: var(--dialog-bg);
        position: relative;
        overflow: hidden;
      }

      .option-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(26, 115, 232, 0.1), transparent);
        transition: left 0.5s;
      }

      .option-card:hover::before {
        left: 100%;
      }

      .option-card:hover {
        border-color: var(--primary-btn-bg);
        transform: translateY(-2px);
        box-shadow: var(--shadow-4dp);
      }

      .option-card.selected {
        border-color: var(--primary-btn-bg);
        background: linear-gradient(135deg, #e8f0fe 0%, #f1f8ff 100%);
        color: var(--primary-btn-bg);
        transform: translateY(-2px);
        box-shadow: var(--shadow-4dp);
      }

      .option-card .option-name {
        font-weight: 600;
        font-size: 0.95rem;
        position: relative;
        z-index: 1;
      }

      /* Toggle per filtri */
      .filter-toggle {
        display: flex;
        background-color: var(--secondary-btn-bg);
        border-radius: 10px;
        padding: 4px;
        margin-bottom: 16px;
      }

      .filter-option {
        flex: 1;
        padding: 12px 16px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--dialog-text);
      }

      .filter-option.selected {
        background-color: var(--dialog-bg);
        color: var(--primary-btn-bg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      /* Input per date con animazione */
      .date-inputs {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        background-color: var(--secondary-btn-bg);
        border-radius: 10px;
        padding: 0 16px;
        margin-top: 12px;
        transition: max-height 0.4s ease-in-out, opacity 0.3s ease-in-out, padding 0.4s ease-in-out;
      }

      .date-inputs.show {
        max-height: 200px;
        opacity: 1;
        padding: 16px;
      }

      .date-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .date-group {
        display: flex;
        flex-direction: column;
      }

      .date-label {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--dialog-text);
        opacity: 0.8;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .date-input {
        padding: 12px 16px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--dialog-bg);
        color: var(--dialog-text);
        font-family: inherit;
        font-size: 0.9rem;
        transition: all 0.2s ease;
      }

      .date-input:hover {
        border-color: var(--primary-btn-bg);
      }

      .date-input:focus {
        outline: none;
        border-color: var(--primary-btn-bg);
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
      }

      /* Actions bar */
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px;
        background-color: var(--secondary-btn-bg);
        border-top: 1px solid var(--border-color);
        flex-shrink: 0;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .options-grid {
          grid-template-columns: 1fr;
        }
        
        .date-row {
          grid-template-columns: 1fr;
        }
        
        .actions {
          flex-direction: column;
        }
      }
    `;
  },

  /**
   * CSS per visualizzazione grafici - PRIVATO
   * @returns {string} CSS per display grafici
   */
  _getGraphDisplayStyles() {
    return `
      /* Layout flexbox per il grafico */
      body.chart-display {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
        margin: 0;
        padding: 20px;
      }

      .chart-display .container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      /* Container del grafico responsive */
      .chart-container {
        flex: 1;
        min-height: 0;
        padding: 20px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        box-shadow: var(--shadow-2dp);
        background-color: var(--dialog-bg);
      }

      #myChart { 
        max-width: 100%; 
        max-height: 100%; 
      }

      /* Controlli grafico - MIGLIORATI per rimanere in linea */
      .controls {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 20px;
        animation: slideIn 0.3s ease-out 0.2s both;
        flex-shrink: 0;
        padding: 16px;
        background-color: var(--secondary-btn-bg);
        border-top: 1px solid var(--border-color);
        flex-wrap: wrap;
      }

      @keyframes slideIn {
        from { 
          transform: translateY(10px); 
          opacity: 0; 
        }
        to { 
          transform: translateY(0); 
          opacity: 1; 
        }
      }

      /* Messaggi di stato */
      #message {
        margin-top: 16px;
        text-align: center;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        transition: all 0.3s ease;
        min-height: 20px;
      }

      .message-success {
        background-color: var(--success-color);
        color: white;
      }

      .message-error {
        background-color: var(--error-color);
        color: white;
      }

      /* Responsive per mobile - MANTIENE CONTROLLI IN LINEA */
      @media (max-width: 768px) {
        body.chart-display {
          padding: 10px;
        }
        
        .controls {
          padding: 12px;
          gap: 6px;
          justify-content: center;
          /* NON cambia flex-direction - mantiene i bottoni in linea */
        }
        
        .btn {
          /* Bottoni più compatti su mobile ma restano in linea */
          padding: 8px 12px;
          font-size: 12px;
          min-width: auto;
        }
      }

      /* Responsive per schermi molto piccoli */
      @media (max-width: 480px) {
        .controls {
          gap: 4px;
          padding: 8px;
        }
        
        .btn {
          padding: 6px 8px;
          font-size: 11px;
        }
      }
    `;
  },

  /**
   * CSS per visualizzazione grafici con controlli in linea - METODO PRIVATO V2
   * @private
   * @returns {string} CSS completo per display grafico con controlli orizzontali
   */
  _getGraphDisplayStyles_v2() {
    return `
      .chart-display {
        margin: 0;
        padding: 20px;
        font-family: 'Roboto', sans-serif;
        background: var(--dialog-bg);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .container {
        width: 100%;
        max-width: 1000px;
        background: var(--dialog-bg);
        border-radius: 8px;
        box-shadow: var(--shadow-4dp);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .chart-container {
        padding: 32px;
        background: var(--dialog-bg);
        position: relative;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
      }

      #myChart {
        max-width: 100%;
        max-height: 500px;
        border-radius: 4px;
      }

      .controls {
        background: var(--secondary-btn-bg);
        padding: 20px;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap; /* CHIAVE: permette avvolgimento senza stack verticale */
        flex-shrink: 0;
      }

      #message {
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
        max-width: 300px;
      }

      .message-success {
        background: var(--success-color);
      }

      .message-error {
        background: var(--error-color);
      }

      .btn {
        padding: 10px 24px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-family: inherit;
        text-decoration: none;
        min-width: 140px;
        justify-content: center;
        background-color: var(--primary-btn-bg);
        color: var(--primary-btn-text);
      }

      .btn:hover {
        background-color: #1557b0;
        box-shadow: var(--shadow-2dp);
      }

      .btn-secondary {
        background-color: var(--secondary-btn-bg);
        color: var(--secondary-btn-text);
        border: 1px solid var(--border-color);
      }

      .btn-secondary:hover {
        background-color: #f8f9fa;
        border-color: var(--primary-btn-bg);
      }

      .btn .material-icons {
        font-size: 18px;
      }

      /* RESPONSIVE - CONTROLLI SEMPRE IN LINEA */
      @media (max-width: 768px) {
        .chart-display {
          padding: 12px;
        }

        .container {
          max-width: none;
          margin: 0;
        }

        .chart-container {
          padding: 20px;
          min-height: 300px;
        }

        .controls {
          padding: 16px;
          /* RIMOSSO: flex-direction: column - questo causava il problema! */
          /* I controlli rimangono in flex-wrap: wrap per mantenere linea orizzontale */
        }

        .btn {
          min-width: 120px; /* Ridotto ma non a width: 100% */
        }

        #message {
          top: 12px;
          right: 12px;
          left: 12px;
          max-width: none;
        }
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 16px;
        color: var(--dialog-text);
      }

      .loading .material-icons {
        font-size: 48px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
  },

  /**
   * CSS per visualizzazione grafici con controlli in linea - API PUBBLICA V2
   * Versione migliorata che mantiene i bottoni "Scarica grafico", "Inserisci in foglio" in linea orizzontale
   * @returns {string} CSS per visualizzazione grafico migliorato
   */
  getChartDisplayCSS_v2() {
    return this._getGraphDisplayStyles_v2();
  },

  /**
   * CSS unificato per grafici con controlli in linea - API PUBBLICA V2
   * @param {string} type - Tipo: 'selection', 'display', o 'both'
   * @returns {string} CSS completo per grafici migliorato
   */
  getUnifiedGraphCSS_v2(type = 'both') {
    let css = this.getMainCSS();
    
    if (type === 'selection' || type === 'both') {
      css += this._getGraphSelectionStyles();
    }
    if (type === 'display' || type === 'both') {
      css += this._getGraphDisplayStyles_v2(); // Usa la versione migliorata
    }
    
    return css;
  },

  /**
   * CSS per selezione tempo medio degenza - PRIVATO
   * @returns {string} CSS per selezione tempo medio
   */
  _getTempoMedioSelectionStyles() {
    return `
      /* Icone Material Icons */
      .material-icons {
        font-family: 'Material Icons';
        font-weight: normal;
        font-style: normal;
        font-size: 18px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        vertical-align: middle;
        margin-right: 8px;
        color: #5f6368;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
      }

      /* Layout body e container */
      body {
        font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: var(--dialog-bg);
        color: var(--dialog-text);
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        max-width: none;
        width: 100%;
        animation: slideUp 0.4s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Header con gradiente */
      .header {
        background: linear-gradient(135deg, var(--primary-btn-bg) 0%, #4285F4 100%);
        color: white;
        padding: 24px;
        text-align: center;
        flex-shrink: 0;
        animation: slideUp 0.4s ease-out;
      }

      /* Contenuto principale */
      .content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        background-color: var(--dialog-bg);
      }

      /* Sezioni */
      .section {
        background-color: var(--dialog-bg);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-1dp);
        animation: slideUp 0.4s ease-out;
      }

      .section-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--dialog-text);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      /* Select diagnosi */
      .diagnosi-select {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--dialog-bg);
        color: var(--dialog-text);
        font-family: inherit;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        margin-bottom: 16px;
      }
      
      .diagnosi-select:focus {
        outline: none;
        border-color: var(--primary-btn-bg);
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
      }

      /* Azioni (footer) */
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px;
        background-color: var(--secondary-btn-bg);
        border-top: 1px solid var(--border-color);
        flex-shrink: 0;
      }

      /* Bottoni con animazioni */
      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
        position: relative;
        overflow: hidden;
      }

      .btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
      }

      .btn:active::before {
        width: 300px;
        height: 300px;
      }

      .btn-secondary {
        background-color: var(--secondary-btn-bg);
        color: var(--secondary-btn-text);
        border: 1px solid var(--border-color);
      }

      .btn-secondary:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-2dp);
      }

      .btn-primary {
        background-color: var(--primary-btn-bg);
        color: var(--primary-btn-text);
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(26, 115, 232, 0.4);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      /* Responsive mobile */
      @media (max-width: 480px) {
        .actions {
          flex-direction: column;
        }
      }
    `;
  },

  /**
   * CSS per risultati tempo medio degenza - PRIVATO
   * @returns {string} CSS per risultati tempo medio
   */
  _getTempoMedioResultsStyles() {
    return `
      /* Layout body centrato */
      body {
        font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: var(--dialog-bg);
        color: var(--dialog-text);
        margin: 0;
        padding: 20px;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Container centrato */
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border-radius: 12px;
        background-color: var(--dialog-bg);
        box-shadow: var(--shadow-2dp);
      }

      /* Header risultati */
      .header {
        text-align: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border-color);
      }

      .title {
        font-size: 22px;
        font-weight: 500;
        color: var(--primary-btn-bg);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .subtitle {
        font-size: 16px;
        color: var(--dialog-text);
        opacity: 0.8;
        margin: 0;
      }

      /* Grid delle statistiche */
      .stats-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        padding: 16px;
        border-radius: 8px;
        background-color: var(--dialog-bg);
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-2dp);
      }

      .stat-label {
        font-size: 14px;
        color: var(--dialog-text);
        opacity: 0.7;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .stat-value {
        font-size: 22px;
        font-weight: 500;
        color: var(--primary-btn-bg);
        margin: 0;
      }

      .stat-card.secondary .stat-value {
        color: var(--success-color);
      }

      .stat-unit {
        font-size: 14px;
        font-weight: normal;
        opacity: 0.8;
        margin-left: 4px;
      }

      /* Info pazienti */
      .pazienti-info {
        background-color: rgba(26, 115, 232, 0.08);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .pazienti-icon {
        color: var(--primary-btn-bg);
      }

      .pazienti-text {
        font-size: 14px;
        line-height: 1.5;
      }

      /* Bottone azione */
      .action-button {
        display: block;
        width: 100%;
        padding: 12px 0;
        text-align: center;
        background-color: var(--primary-btn-bg);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-button:hover {
        opacity: 0.9;
        transform: translateY(-2px);
        box-shadow: var(--shadow-2dp);
      }

      /* Responsive mobile */
      @media (max-width: 480px) {
        .stats-container {
          grid-template-columns: 1fr;
        }
      }
    `;
  },

  // ========================================
  // SECTION 9C: PUBLIC API METHODS - GRAFICI E TEMPO MEDIO
  // ========================================

  /**
   * CSS per selezione tempo medio degenza - API PUBBLICA
   * @returns {string} CSS per selezione tempo medio
   */
  getTempoMedioSelectionCSS() {
    return this._getTempoMedioSelectionStyles();
  },

  /**
   * CSS per risultati tempo medio degenza - API PUBBLICA
   * @returns {string} CSS per risultati tempo medio
   */
  getTempoMedioResultsCSS() {
    return this._getTempoMedioResultsStyles();
  },

  /**
   * CSS unificato per tempo medio degenza - API PUBBLICA
   * @param {string} type - Tipo: 'selection', 'results', o 'both'
   * @returns {string} CSS completo per tempo medio
   */
  getUnifiedTempoMedioCSS(type = 'both') {
    let css = this.getMainCSS();
    
    if (type === 'selection' || type === 'both') {
      css += this._getTempoMedioSelectionStyles();
    }
    if (type === 'results' || type === 'both') {
      css += this._getTempoMedioResultsStyles();
    }
    
    return css;
  },

  /**
   * CSS per dialogo selezione grafici - API PUBBLICA
   * @returns {string} CSS per dialogo selezione
   */
  getGraphDialogCSS() {
    return this._getGraphSelectionStyles();
  },

  /**
   * CSS per visualizzazione grafici - API PUBBLICA
   * @returns {string} CSS per visualizzazione grafico
   */
  getChartDisplayCSS() {
    return this._getGraphDisplayStyles();
  },

  /**
   * CSS unificato per grafici - API PUBBLICA
   * @param {string} type - Tipo: 'selection', 'display', o 'both'
   * @returns {string} CSS completo per grafici
   */
  getUnifiedGraphCSS(type = 'both') {
    let css = this.getMainCSS();
    
    if (type === 'selection' || type === 'both') {
      css += this._getGraphSelectionStyles();
    }
    if (type === 'display' || type === 'both') {
      css += this._getGraphDisplayStyles();
    }
    
    return css;
  },

  /**
   * CSS per interfaccia di importazione dati - API PUBBLICA
   * @returns {string} CSS per import UI
   */
  getImportUICSS() {
    return `
      .import-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px;
      }

      .import-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .import-title {
        font-size: 24px;
        font-weight: 500;
        color: var(--dialog-text);
        margin-bottom: 8px;
      }

      .import-subtitle {
        font-size: 14px;
        color: var(--dialog-text);
        opacity: 0.7;
      }

      .upload-area {
        border: 2px dashed var(--border-color);
        border-radius: 12px;
        padding: 48px 24px;
        text-align: center;
        margin-bottom: 24px;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .upload-area:hover {
        border-color: var(--primary-btn-bg);
        background-color: rgba(26, 115, 232, 0.05);
      }

      .upload-area.dragover {
        border-color: var(--primary-btn-bg);
        background-color: rgba(26, 115, 232, 0.1);
      }

      .upload-icon {
        font-size: 48px;
        color: var(--primary-btn-bg);
        margin-bottom: 16px;
      }

      .upload-text {
        font-size: 16px;
        color: var(--dialog-text);
        margin-bottom: 8px;
      }

      .upload-hint {
        font-size: 12px;
        color: var(--dialog-text);
        opacity: 0.6;
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background-color: var(--secondary-btn-bg);
        border-radius: 8px;
        margin-bottom: 24px;
      }

      .file-icon {
        color: var(--success-color);
      }

      .file-details {
        flex: 1;
      }

      .file-name {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .file-size {
        font-size: 12px;
        opacity: 0.7;
      }

      .progress-container {
        margin-bottom: 24px;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background-color: var(--border-color);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background-color: var(--primary-btn-bg);
        transition: width 0.3s ease;
      }

      .progress-text {
        text-align: center;
        margin-top: 8px;
        font-size: 14px;
        color: var(--dialog-text);
      }

      .import-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .option-card {
        padding: 20px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .option-card:hover {
        border-color: var(--primary-btn-bg);
        transform: translateY(-2px);
        box-shadow: var(--shadow-2dp);
      }

      .option-card.selected {
        border-color: var(--primary-btn-bg);
        background-color: rgba(26, 115, 232, 0.05);
      }

      .option-title {
        font-weight: 500;
        margin-bottom: 8px;
      }

      .option-description {
        font-size: 14px;
        opacity: 0.7;
      }
    `;
  },

  /**
   * CSS per notifiche toast - API PUBBLICA
   * @returns {string} CSS per toast notifications
   */
  getToastCSS() {
    return `
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 16px 20px;
        background: var(--dialog-bg);
        border-radius: 8px;
        box-shadow: var(--shadow-8dp);
        border-left: 4px solid var(--info-color);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Roboto', sans-serif;
        font-size: 14px;
        line-height: 1.4;
        z-index: 10000;
        opacity: 1;
        transition: opacity 0.3s ease;
        animation: slideInRight 0.3s ease-out;
      }

      .toast.success {
        border-left-color: var(--success-color);
      }

      .toast.error {
        border-left-color: var(--error-color);
      }

      .toast.warning {
        border-left-color: var(--warning-color);
      }

      .toast.info {
        border-left-color: var(--info-color);
      }

      .toast-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-icon.success {
        color: var(--success-color);
      }

      .toast-icon.error {
        color: var(--error-color);
      }

      .toast-icon.warning {
        color: var(--warning-color);
      }

      .toast-icon.info {
        color: var(--info-color);
      }

      .toast-content {
        flex: 1;
      }

      .toast-title {
        font-weight: 500;
        margin-bottom: 4px;
        color: var(--dialog-text);
      }

      .toast-message {
        color: var(--dialog-text);
        opacity: 0.8;
      }

      .toast-close {
        flex-shrink: 0;
        background: none;
        border: none;
        color: var(--dialog-text);
        opacity: 0.5;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: opacity 0.2s ease;
      }

      .toast-close:hover {
        opacity: 1;
      }

      .toast.hide {
        opacity: 0;
        transform: translateX(100%);
      }

      @media (max-width: 480px) {
        .toast {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
      }
    `;
  },

  // ========================================
  // SECTION 10: DEBUG & DEVELOPMENT HELPERS
  // ========================================
  
  /**
   * Metodo per debug CSS - utile durante sviluppo
   * @param {string} section - Sezione da visualizzare
   * @returns {string} CSS della sezione specifica
   */
  _debugCSS(section) {
    const sections = {
      'variables': this._getCSSVariables(),
      'reset': this._getResetAndBaseStyles(),
      'animations': this._getAnimationStyles(),
      'layout': this._getLayoutStyles(),
      'buttons': this._getButtonStyles(),
      'forms': this._getFormStyles(),
      'icons': this._getIconStyles(),
      'messages': this._getMessageStyles(),
      'utilities': this._getUtilityStyles(),
      'responsive': this._getResponsiveStyles(),
      'graph-selection': this._getGraphSelectionStyles(),
      'graph-display': this._getGraphDisplayStyles(),
      'tempo-selection': this._getTempoMedioSelectionStyles(),
      'tempo-results': this._getTempoMedioResultsStyles()
    };
    
    console.log(`=== DEBUG CSS: ${section} ===`);
    const css = sections[section] || 'Section not found';
    console.log(css);
    return css;
  },

  /**
   * Test combinazioni CSS - utile per verificare output
   * @param {Array} modules - Array di moduli da testare
   * @returns {string} CSS combinato
   */
  _testCSSCombination(modules = []) {
    let css = this.getMainCSS();
    
    modules.forEach(module => {
      switch(module) {
        case 'selection':
          css += this.getSelectionDialogCSS();
          break;
        case 'chart':
          css += this.getChartCSS();
          break;
        case 'import':
          css += this.getImportUICSS();
          break;
        case 'toast':
          css += this.getToastCSS();
          break;
        case 'graph':
          css += this.getUnifiedGraphCSS();
          break;
        case 'tempo':
          css += this.getUnifiedTempoMedioCSS();
          break;
      }
    });
    
    console.log(`CSS combinato per moduli: ${modules.join(', ')}`);
    console.log(`Lunghezza totale: ${css.length} caratteri`);
    return css;
  },

  /**
   * Metodo helper per ottenere CSS combinato - API PUBBLICA
   * @param {Object} includes - Oggetto che specifica quali CSS includere
   * @returns {string} CSS unificato
   */
  getCombinedCSS(includes = {}) {
    let css = this.getMainCSS();
    
    if (includes.selection) css += this.getSelectionDialogCSS();
    if (includes.chart) css += this.getChartCSS();
    if (includes.import) css += this.getImportUICSS();
    if (includes.toast) css += this.getToastCSS();
    if (includes.tempoMedio) css += this.getUnifiedTempoMedioCSS();
    if (includes.graph) css += this.getUnifiedGraphCSS();
    
    return css;
  }
};

// Export per compatibilità se supportato
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DesignSystem;
}

# Coverage Analysis Report

## Sommario

- **File sorgente totali**: 70
- **File con test**: 27
- **File senza test**: 43
- **Coverage stimata**: 38.6%

## File senza test per priorità

### 🔴 Alta Priorità (38 file)

- `src/app/main.js`
- `src/app/mobile/mobile-navigation.js`
- `src/app/router.js`
- `src/core/services/bootstrapService.js`
- `src/core/services/navigationService.js`
- `src/core/services/viteSupabaseMiddleware.js`
- `src/core/utils/extensionErrorHandler.js`
- `src/core/utils/oauthDebug.js`
- `src/core/utils/oauthTest.js`
- `src/features/charts/adapters/ChartAdapterFactory.js`
- `src/features/charts/adapters/DesktopChartAdapter.js`
- `src/features/charts/adapters/MobileChartAdapter.js`
- `src/features/charts/adapters/TabletChartAdapter.js`
- `src/features/charts/components/ChartTypeManager.js`
- `src/features/charts/services/ChartExportService.js`
- `src/features/charts/services/chartService.js`
- `src/features/charts/services/chartjsService.js`
- `src/features/charts/ui/ChartModals.js`
- `src/features/charts/ui/ChartToasts.js`
- `src/features/charts/utils/ChartUtils.js`
- `src/features/charts/views/grafico-api.js`
- `src/features/charts/views/grafico-ui.js`
- `src/features/diagnoses/views/diagnosi-ui.js`
- `src/features/diagnoses/views/diagnosi.js`
- `src/features/patients/components/mobile-card-manager.js`
- `src/features/patients/views/dimissione-api.js`
- `src/features/patients/views/dimissione-ui.js`
- `src/features/patients/views/dimissione.js`
- `src/features/patients/views/form-api.js`
- `src/features/patients/views/form-ui.js`
- `src/features/patients/views/form.js`
- `src/features/patients/views/list-api.js`
- `src/features/patients/views/list-renderer.js`
- `src/features/patients/views/list-state-migrated.js`
- `src/features/patients/views/list.js`
- `src/shared/components/forms/CustomDatepicker.js`
- `src/shared/components/forms/CustomSelect.js`
- `src/shared/components/ui/AuthUI.js`

### 🟡 Media Priorità (0 file)

### 🟢 Bassa Priorità (5 file)

- `src/app/config/constants.js`
- `src/app/config/environment.js`
- `src/features/charts/views/grafico.js`
- `src/features/diagnoses/views/diagnosi-api.js`
- `src/features/patients/views/form-state.js`

## Raccomandazioni

### Prossimi passi per migliorare la coverage:

1. **Inizia dai file ad alta priorità** - Questi sono file critici per il funzionamento dell'applicazione
2. **Usa il TestSuiteGenerator** - Genera rapidamente boilerplate per i test:
   ```bash
   node tests/__helpers__/generate-test.js component NomeComponente path/to/component.js
   ```
3. **Focus sui file core e services** - Hanno il maggior impatto sulla stabilità
4. **Test incrementali** - Aggiungi test gradualmente, iniziando con i casi base

### Template per test mancanti:

Per ogni file ad alta priorità, considera di implementare:

- Test di istanziazione/inizializzazione
- Test dei metodi pubblici principali
- Test di gestione errori
- Test dei casi edge

## File di test esistenti

I seguenti test sono già implementati e funzionanti:

- `tests/ChartTypeManager-bar.test.js`
- `tests/ConfirmModal.test.js`
- `tests/EmptyState.test.js`
- `tests/ErrorMessage.test.js`
- `tests/FormField.test.js`
- `tests/PatientCard.test.js`
- `tests/ResponsiveChartAdapter-mobile.test.js`
- `tests/ResponsiveChartAdapter.test.js`
- `tests/StatusBadge.test.js`
- `tests/auth.test.js`
- `tests/authService.test.js`
- `tests/dom.test.js`
- `tests/errorService.test.js`
- `tests/features/charts/components/responsive-adapter/DeviceDetector.test.js`
- `tests/features/charts/components/responsive-adapter/EventHandler.test.js`
- `tests/features/charts/components/responsive-adapter/OptionsAdapter.test.js`
- `tests/features/charts/components/responsive-adapter/basic.test.js`
- `tests/features/charts/components/responsive-adapter/integration/advanced-scenarios.test.js`
- `tests/features/charts/components/responsive-adapter/integration/backward-compatibility.test.js`
- `tests/features/charts/components/responsive-adapter/integration/device-detection.test.js`
- `tests/features/charts/components/responsive-adapter/integration/error-handling.test.js`
- `tests/features/charts/components/responsive-adapter/integration/event-handling.test.js`
- `tests/features/charts/components/responsive-adapter/integration/index.test.js`
- `tests/features/charts/components/responsive-adapter/integration/memory-management.test.js`
- `tests/features/charts/components/responsive-adapter/integration/module-integration.test.js`
- `tests/features/charts/components/responsive-adapter/integration/regression.test.js`
- `tests/features/charts/components/responsive-adapter/integration.test.js`
- `tests/features/charts/services/chart-config/ChartConfigManager.test.js`
- `tests/features/charts/services/chart-config/ChartConfigManager.unit.test.js`
- `tests/features/charts/services/chart-factory/ChartFactory.test.js`
- `tests/features/charts/services/chart-factory/ChartFactory.unit.test.js`
- `tests/features/charts/services/chart-loader/ChartLoader.test.js`
- `tests/features/charts/services/chart-loader/ChartLoader.unit.test.js`
- `tests/features/charts/services/chartjsService.integration.test.js`
- `tests/features/patients/services/patient-cache/PatientCache.test.js`
- `tests/features/patients/services/patient-crud/PatientCRUD.test.js`
- `tests/features/patients/services/patient-validation/PatientValidator.supabase.test.js`
- `tests/features/patients/services/patient-validation/PatientValidator.test.js`
- `tests/helpers.test.js`
- `tests/loggerService.test.js`
- `tests/modalService.test.js`
- `tests/oauthService.test.js`
- `tests/patientService.test.js`
- `tests/themeService.test.js`
- `tests/uiStateService.test.js`
- `tests/unit/core/authService.test.js`
- `tests/unit/core/errorService.test.js`
- `tests/unit/core/notificationService.test.js`
- `tests/unit/core/stateService.test.js`
- `tests/unit/core/supabaseClient.test.js`
- `tests/unit/shared/components/ActionButtons.test.js`
- `tests/unit/shared/components/LoadingSpinner.test.js`
- `tests/unit/shared/components/StatusBadge.simple.test.js`
- `tests/unit/shared/components/StatusBadge.test.js`
- `tests/unit/shared/modalService.test.js`
- `tests/unit/shared/utils/formatting.test.js`
- `tests/unit/tools/TestSuiteGenerator.test.js`

---

_Report generato il 19/07/2025, 18:15:44_

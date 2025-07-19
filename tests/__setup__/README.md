# Test Setup Directory

Questa directory contiene la configurazione globale e il setup per l'intera suite di test.

## Files

- `vitest.config.js` - Configurazione ottimizzata per Vitest
- `global-setup.js` - Setup globale eseguito una volta prima di tutti i test
- `test-environment.js` - Configurazione ambiente test (DOM, globals, etc.)
- `TestConfigManager.js` - Gestore configurazioni test dinamiche
- `matchers.js` - Custom matchers per asserzioni specifiche

## Usage

La configurazione viene caricata automaticamente da Vitest e non richiede import espliciti nei test.
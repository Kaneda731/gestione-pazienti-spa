# Modulo Grafici Responsivi

Questo modulo fornisce un sistema completo per adattare i grafici a diverse dimensioni dello schermo e dispositivi, ottimizzando l'esperienza utente su mobile, tablet e desktop.

## Struttura del Modulo

```
src/features/charts/
├── adapters/                 # Adapter specifici per dispositivo
│   ├── ChartAdapterFactory.js  # Factory per la creazione degli adapter
│   ├── MobileChartAdapter.js   # Adapter per dispositivi mobili
│   ├── TabletChartAdapter.js   # Adapter per tablet
│   └── DesktopChartAdapter.js  # Adapter per desktop
├── components/               # Componenti principali
│   └── ResponsiveChartAdapter.js  # Classe principale
├── styles/                   # Stili CSS
│   ├── chart-responsive.css    # Stili responsivi
│   ├── chart-modals.css        # Stili per i modal
│   └── chart-toasts.css        # Stili per i toast
├── ui/                       # Componenti UI
│   ├── ChartModals.js          # Gestione dei modal
│   └── ChartToasts.js          # Gestione dei toast
├── utils/                    # Utility
│   ├── DeviceDetector.js       # Rilevamento del dispositivo
│   └── ChartUtils.js           # Funzioni di utilità
└── index.js                  # Punto di ingresso del modulo
```

## Utilizzo Base

```javascript
import ResponsiveChartAdapter from './features/charts';

// Inizializza l'adapter
const chartAdapter = new ResponsiveChartAdapter();

// Crea un grafico con Chart.js
const ctx = document.getElementById('myChart').getContext('2d');
const options = {
  // Opzioni base del grafico
};

// Adatta le opzioni al dispositivo corrente
const adaptedOptions = chartAdapter.adaptOptions(options);

// Crea il grafico con le opzioni adattate
const chart = new Chart(ctx, {
  type: 'bar',
  data: data,
  options: adaptedOptions
});

// Adatta il layout del container
chartAdapter.adaptLayout(chart.canvas.parentNode);

// Gestisci il ridimensionamento della finestra
chartAdapter.handleResize(chart, options);
```

## Funzionalità Principali

### Adattamento Automatico al Dispositivo

Il sistema rileva automaticamente il tipo di dispositivo (mobile, tablet, desktop) e applica le configurazioni ottimali per ciascuno.

### Ottimizzazioni Specifiche per Dispositivo

- **Mobile**: Legenda in basso, font più piccoli, tooltip ottimizzati per touch, modal dettagliati
- **Tablet**: Configurazioni intermedie, legenda in basso ma più grande
- **Desktop**: Legenda a destra, interazioni avanzate, supporto per zoom e pan

### Interazioni Avanzate

- **Mobile**: Supporto per gesti touch, feedback tattile (vibrazione)
- **Tablet**: Interazioni ottimizzate per touch e mouse
- **Desktop**: Hover avanzato, zoom con rotellina, pannello dettagli laterale

### UI Responsive

- Modal e toast adattati al dispositivo
- Feedback visivo per le interazioni
- Supporto per temi chiari e scuri

## Personalizzazione

### Breakpoint Personalizzati

```javascript
const chartAdapter = new ResponsiveChartAdapter({
  mobile: 600,   // Dispositivi fino a 600px
  tablet: 1024,  // Dispositivi fino a 1024px
  desktop: 1440  // Dispositivi fino a 1440px (oltre sono considerati large desktop)
});
```

### Notifiche e Feedback

```javascript
// Mostra una notifica
chartAdapter.showNotification('Grafico aggiornato', 'success');

// Mostra dettagli per un elemento del grafico
chartAdapter.showMobileDetailModal({
  label: 'Categoria A',
  value: 42,
  color: '#ff6384',
  total: 100
});
```

## Estensione

Per estendere il sistema con nuovi tipi di dispositivi o funzionalità:

1. Crea un nuovo adapter che implementi i metodi `adaptOptions` e `adaptLayout`
2. Aggiungi il nuovo adapter alla factory in `ChartAdapterFactory.js`
3. Aggiungi gli stili CSS specifici in un nuovo file nella cartella `styles`

## Compatibilità

- Supporta Chart.js v3.x e v4.x
- Funziona con tutti i tipi di grafici supportati da Chart.js
- Testato su browser moderni (Chrome, Firefox, Safari, Edge)
- Supporta temi chiari e scuri tramite `prefers-color-scheme`
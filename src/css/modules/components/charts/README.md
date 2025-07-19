# Modulo CSS per i Grafici

Questo modulo contiene tutti gli stili CSS necessari per i grafici dell'applicazione, organizzati in file separati per migliorare la manutenibilità e la leggibilità del codice.

## Struttura dei File

- **charts.scss**: File principale che importa tutti gli altri moduli
- **_base.scss**: Stili di base comuni a tutti i dispositivi
- **_mobile.scss**: Stili specifici per dispositivi mobili
- **_tablet.scss**: Stili specifici per tablet
- **_desktop.scss**: Stili specifici per desktop
- **_modals.scss**: Stili per modal e menu contestuali
- **_accessibility.scss**: Stili per accessibilità, tema scuro e stampa

## Utilizzo

Per utilizzare questi stili, è sufficiente importare il file principale `charts.scss` nel tuo file SCSS principale:

```scss
@import "modules/components/charts";
```

## Classi Principali

### Contenitori

- `.chart-container`: Contenitore base per tutti i grafici
- `.chart-mobile`: Contenitore per grafici su dispositivi mobili
- `.chart-tablet`: Contenitore per grafici su tablet
- `.chart-desktop`: Contenitore per grafici su desktop

### Controlli

- `.chart-controls`: Controlli per i grafici (selettore tipo, esportazione)
- `.mobile-chart-controls`: Controlli ottimizzati per mobile
- `.chart-type-selector`: Selettore del tipo di grafico
- `.chart-export-controls`: Controlli per l'esportazione

### Legenda

- `.chart-legend`: Legenda base
- `.mobile-chart-legend`: Legenda ottimizzata per mobile
- `.legend-item`: Elemento della legenda
- `.chart-legend-sidebar`: Sidebar della legenda per desktop

### Stati

- `.chart-loading`: Stato di caricamento
- `.chart-fullscreen`: Modalità a schermo intero
- `.chart-zoomed`: Stato di zoom
- `.chart-touching`: Stato di tocco
- `.chart-dragging`: Stato di trascinamento

### Accessibilità

- `.chart-high-dpi`: Ottimizzazioni per schermi ad alta densità di pixel
- `[data-bs-theme="dark"]`: Supporto per tema scuro

## Responsive Design

Il modulo include ottimizzazioni specifiche per:

- Dispositivi mobili (max-width: 767px)
- Tablet (768px - 991px)
- Desktop (992px e oltre)
- Orientamento portrait e landscape
- Schermi piccoli e ad alta densità

## Accessibilità

Sono incluse ottimizzazioni per:

- Riduzione del movimento (`prefers-reduced-motion`)
- Modalità alto contrasto (`prefers-contrast: high`)
- Stampa (`@media print`)
- Tema scuro (`[data-bs-theme="dark"]`)
- Dimensioni minime per elementi touch (44px)
# Card Mobile Moderne - Guida all'Uso

## 🚀 Nuovi Layout Mobile

Questo sistema introduce **5 layout moderni** per le card su dispositivi mobile:

### 1. **Layout Orizzontale Compatto** 
```html
<div class="card card-horizontal">
    <div class="card-header">ID: 123</div>
    <div class="card-body">
        <div class="card-title">Mario Rossi</div>
        <div class="card-meta">45 anni • Cardiologia</div>
    </div>
</div>
```

### 2. **Grid 2x2 per Statistiche**
```html
<div class="cards-grid-mobile">
    <div class="card">
        <div class="card-header">Pazienti</div>
        <div class="card-body">156</div>
    </div>
    <div class="card">
        <div class="card-header">Dimessi</div>
        <div class="card-body">23</div>
    </div>
    <!-- altre 2 card -->
</div>
```

### 3. **Lista Compatta con Status**
```html
<div class="card card-list-compact status-success">
    <div class="card-body">
        <div>
            <div class="card-title">Paziente Nome</div>
            <div class="card-meta">Info aggiuntive</div>
        </div>
        <div class="card-meta">Timestamp</div>
    </div>
</div>
```

### 4. **Scroll Orizzontale**
```html
<div class="cards-scroll-wrapper">
    <div class="cards-scroll-container">
        <div class="card"><!-- Card 1 --></div>
        <div class="card"><!-- Card 2 --></div>
        <div class="card"><!-- Card 3 --></div>
    </div>
</div>
```

### 5. **Card con Micro-interazioni**
- **Touch feedback**: Scale animation al tocco
- **Ripple effect**: Effetto onda al tap
- **Loading states**: Spinner automatico
- **Status indicators**: Barra colorata a sinistra

## 🎨 Status Colors

```css
.card.status-success  /* Verde - Attivo */
.card.status-warning  /* Giallo - Attenzione */
.card.status-error    /* Rosso - Critico */
.card.status-info     /* Blu - Informativo */
```

## 🛠 Utility Classes Mobile

```css
.mobile-horizontal    /* Layout orizzontale */
.mobile-vertical      /* Layout verticale */
.mobile-grid-2        /* Grid 2 colonne */
.mobile-hidden        /* Nasconde su mobile */
.mobile-compact       /* Padding ridotto */
.mobile-text-sm       /* Testo piccolo */
.mobile-text-xs       /* Testo molto piccolo */
.mobile-p-sm          /* Padding small */
.mobile-m-sm          /* Margin small */
```

## 📱 Breakpoints

- **Mobile**: ≤ 767px (layout compatti)
- **Small Mobile**: ≤ 480px (layout ultra-compatti)

## 🔧 JavaScript Manager

```javascript
// Aggiunge ripple effect
MobileCardManager.addRippleEffect(cardElement, event);

// Gestisce loading state
MobileCardManager.setLoadingState(cardElement, true);

// Cambia layout dinamicamente
MobileCardManager.switchToLayout(container, 'horizontal');

// Inizializza ottimizzazioni touch
MobileCardManager.initTouchOptimizations();
```

## 💡 Esempi Pratici

### Lista Pazienti Mobile
Il sistema rileva automaticamente mobile e applica il layout `card-list-compact` con:
- **Informazioni essenziali** in formato compatto
- **Azioni** con icone piccolissime
- **Status color** sulla sinistra
- **Touch feedback** ottimizzato

### Statistiche Dashboard
Usa `cards-grid-mobile` per mostrare 4 metriche in una griglia 2x2 compatta.

### Scroll Reparti
Usa `cards-scroll-container` per navigare orizzontalmente tra i reparti.

## 🎯 Performance

- **Hardware acceleration** per smooth scrolling
- **Backdrop-filter disabilitato** su mobile
- **Shadow ridotte** per performance
- **Animazioni semplificate** su movimento ridotto
- **Will-change ottimizzato**

## ♿ Accessibilità

- **Touch areas** ottimizzate (minimo 44px)
- **Focus indicators** visibili
- **Font smoothing** migliorato
- **Contrasti** rispettati
- **Screen reader** friendly

## 🔄 Auto-switching

Il sistema **rileva automaticamente** il viewport e applica:
- **Desktop** (>767px): Layout tradizionale con hover effects
- **Mobile** (≤767px): Layout compatti con touch optimization
- **Small Mobile** (≤480px): Layout ultra-compatti

## 🧪 Testing

```bash
# Server di sviluppo
npx live-server src --port=8080

# Test mobile
# Chrome DevTools → Device Mode → iPhone/Android
# Oppure dispositivo reale su localhost:8080
```

## 🚀 Prossimi Sviluppi

- [ ] Gesture swipe per azioni rapide
- [ ] Layout a schede scorrevoli
- [ ] Animazioni di transizione tra layout
- [ ] Temi personalizzabili per reparto
- [ ] Layout ibrido con intelligenza predittiva

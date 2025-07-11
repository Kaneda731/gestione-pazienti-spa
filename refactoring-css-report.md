# Report: Refactoring CSS e Caricamento Dinamico

Questo report documenta le recenti e significative modifiche strutturali apportate all'architettura CSS del progetto. L'obiettivo primario era risolvere le inconsistenze grafiche, migliorare la manutenibilità del codice e ottimizzare le performance di caricamento degli stili.

## 1. Passaggio a Sass (SCSS)

Il primo passo è stato migrare da file CSS standard a una struttura basata su Sass (`.scss`). Questo ci ha permesso di:
- **Utilizzare Variabili SCSS:** Sfruttare le variabili native di Sass per una gestione più potente e coerente dei temi.
- **Migliorare l'Organizzazione:** Strutturare gli stili in moduli più piccoli e leggibili.
- **Importazioni Gerarchiche:** Gestire le dipendenze di stile in modo più pulito, come l'importazione selettiva dei componenti di Bootstrap.

## 2. Logica di Caricamento Dinamico degli Stili

Per ottimizzare le performance, specialmente su dispositivi mobili, è stata abbandonata l'idea di caricare un unico, grande file CSS. È stata invece implementata una logica di **caricamento dinamico** basata sulla larghezza dello schermo.

### Come Funziona

La logica è implementata in `src/app/main.js` e si basa su un import dinamico di Vite:

```javascript
function loadStyles() {
    if (window.innerWidth <= 768) {
        import('/src/css/mobile.scss');
    } else {
        import('/src/css/desktop.scss');
    }
}
loadStyles();
```

Questo significa che:
- **Su schermi piccoli (<= 768px):** Viene caricato solo il file `mobile.scss`, che contiene gli stili ottimizzati per il mobile.
- **Su schermi grandi (> 768px):** Viene caricato solo il file `desktop.scss`, con gli stili per la versione desktop.

Questo approccio riduce drasticamente il peso del CSS iniziale sui dispositivi mobili, migliorando i tempi di caricamento e rendering.

## 3. Architettura dei Componenti Card

Per risolvere i conflitti e le inconsistenze, abbiamo adottato un'architettura CSS più robusta e basata su componenti per le card, seguendo il principio di separazione delle responsabilità.

### 1. `.card` (Componente Base)
- **Scopo:** Rappresenta la card standard utilizzata nella maggior parte delle pagine interne (es. Grafico, Diagnosi, Inserimento).
- **Stile:** Ha un aspetto pulito, con una **larghezza massima fissa di `900px`** e viene centrata orizzontalmente. Non ha effetti speciali al passaggio del mouse.
- **File:** `src/css/modules/components/cards.css`

### 2. `.card.card-full-width` (Modificatore)
- **Scopo:** È una classe **modificatore** da usare in aggiunta a `.card` per gestire eccezioni specifiche.
- **Stile:** Il suo unico scopo è sovrascrivere la larghezza massima, portandola a `1400px`. È stata creata appositamente per la pagina **Elenco Pazienti**, per dare più respiro alla tabella.
- **File:** `src/css/modules/components/cards.css`

### 3. `.menu-card` (Componente Speciale)
- **Scopo:** Utilizzata **esclusivamente** per le card della homepage.
- **Stile:** Ha stili completamente separati e complessi, inclusi effetti "glow", animazioni 3D al passaggio del mouse e un layout specifico per l'icona e il testo.
- **File:** `src/css/modules/components/menu-cards.css`

Questa separazione garantisce che le modifiche a un tipo di card non influenzino le altre.

## 4. Correzioni Specifiche all'Interfaccia Utente (UI)

Durante il refactoring, sono stati risolti numerosi problemi:

- **Navbar Mobile:** È stata completamente ricostruita da zero, correggendo il layout, i colori, e il posizionamento delle icone. È stato aggiunto l'effetto "pop-out" per l'icona Home e un indicatore visivo (colore e dimensione) per lo stato di "loggato".
- **Coerenza degli Header:** Il colore delle intestazioni delle card in modalità "light" è stato corretto per essere più coerente con la palette del progetto.
- **Rimozione Stili Inline:** Sono stati eliminati stili inline problematici che impedivano l'applicazione corretta delle regole CSS globali.

## Conclusione

Le modifiche apportate hanno reso la codebase CSS più **scalabile, performante e manutenibile**. La separazione netta tra stili desktop/mobile e tra i vari tipi di componenti ridurrà la probabilità di bug futuri e renderà più semplice l'implementazione di nuove funzionalità grafiche.

---

## Checklist di Omologazione Grafica

Questa checklist serve per verificare la coerenza visiva dell'applicazione dopo il refactoring:

- [ ] **Palette Colori**: Tutti i colori usati derivano dalle variabili SCSS centralizzate (`variables.scss`).
- [ ] **Tipografia**: Font, dimensioni e pesi sono uniformi su tutte le pagine e componenti.
- [ ] **Spaziature**: Padding e margin sono coerenti tra componenti simili (card, modals, tabelle).
- [ ] **Componenti Card**: Tutte le card rispettano border-radius, ombra e padding definiti. I modificatori sono usati solo dove necessario.
- [ ] **Bottoni**: Stile base, hover e focus sono identici su tutte le pagine.
- [ ] **Navbar/Header**: Stili, colori e icone sono uniformi su tutte le pagine.
- [ ] **Responsive Design**: Breakpoint e regole responsive sono applicati in modo coerente.
- [ ] **Icone**: Dimensioni e colori delle icone sono uniformi e derivano da una libreria o set condiviso.
- [ ] **Stili di Default**: Gli override di Bootstrap sono minimi e centralizzati nei file SCSS.
- [ ] **Modal/Form**: Bordo, sfondo e tipografia sono coerenti tra tutti i modali e form.
- [ ] **Stati Interattivi**: Errori, successi, hover e focus sono visivamente omogenei.

> Utilizzare questa checklist ad ogni rilascio o refactoring per garantire la qualità visiva.

## 5. Evoluzioni e Correzioni Post-Refactoring

A seguito del refactoring iniziale, sono state apportate ulteriori migliorie per risolvere problemi emersi durante l'utilizzo e per ottimizzare il comportamento dell'applicazione.

### 5.1. Analisi e Rimozione di Codice Morto
È stata condotta un'analisi approfondita della codebase alla ricerca di file non più utilizzati. Questo ha portato all'identificazione e alla rimozione definitiva dei seguenti file obsoleti:
- `src/features/patients/views/list-state.js`: Sostituito da `list-state-migrated.js`.
- `src/features/patients/components/mobile-navigation.js`: Duplicato non utilizzato.
- `src/css/mobile.css` e `src/css/style.css`: Sostituiti dalla nuova architettura SCSS.

Questa pulizia ha ridotto la complessità del progetto e il rischio di utilizzare codice non aggiornato.

### 5.2. Gestione Layout Responsivo Tabella/Card
Il sistema di visualizzazione della lista pazienti presentava un problema di transizione tra il layout a tabella (desktop) e quello a card (mobile). Per risolverlo, sono state implementate le seguenti modifiche:
- **Breakpoint Unificato:** Il punto di transizione tra tabella e card è stato spostato da `768px` a `992px` per allinearsi con il breakpoint `lg` di Bootstrap, eliminando una "zona grigia" intermedia in cui il layout della tabella risultava compromesso.
- **Listener per il Resize:** È stato introdotto un listener per l'evento `resize` della finestra. Questo permette alla funzione `ensureCorrectView()` di essere eseguita dinamicamente, garantendo che il passaggio da tabella a card (e viceversa) avvenga istantaneamente senza la necessità di ricaricare la pagina.

### 5.3. Correzione Layout Tabella Diagnosi
La tabella nella pagina "Gestione Diagnosi" presentava problemi di layout su schermi di medie dimensioni. Il problema è stato risolto applicando stili CSS più specifici per la colonna "Azioni" di quella tabella, garantendo che i pulsanti di modifica ed eliminazione si visualizzino sempre correttamente senza compromettere il layout generale.

### 5.4. Fix Definitivo Inizializzazione CustomSelect
È stato identificato e risolto un bug critico che impediva la corretta visualizzazione dei componenti `CustomSelect` nelle viste caricate dinamicamente (come la pagina dei filtri).
- **Causa:** Il componente veniva inizializzato automaticamente al caricamento della pagina (`DOMContentLoaded`), prima che la vista e i relativi elementi `<select>` fossero presenti nel DOM.
- **Soluzione:** L'inizializzazione automatica è stata rimossa. La funzione `initCustomSelects()` viene ora chiamata manualmente dallo script della vista (`list.js`) solo dopo che i dati sono stati caricati e gli elementi `<select>` sono stati popolati. Questo garantisce che il componente venga creato al momento giusto e con i dati corretti, ripristinando il suo corretto funzionamento e l'apertura del modal su mobile.

### 5.5. Correzione Stile Risultati Ricerca Dimissione
È stato corretto un problema di stile nella lista dei risultati di ricerca della pagina "Dimissione Paziente".
- **Causa:** Gli stili di default di Bootstrap per i `.list-group-item` creavano uno sfondo grigio e un colore del testo non coerenti con il tema dell'applicazione.
- **Soluzione:** Sono state aggiunte regole CSS specifiche in `forms.css` per sovrascrivere gli stili di default. Ora i risultati hanno uno sfondo trasparente a riposo e un colore di evidenziazione azzurro (in linea con la palette) al passaggio del mouse, garantendo coerenza visiva.
- **Ottimizzazione Mobile:** Per assicurare che gli stili migliorati siano visibili anche su dispositivi mobili, è stato aggiunto l'import di `forms.css` all'interno di `mobile.scss`. In questo modo la lista dei risultati di ricerca mantiene la stessa coerenza grafica su tutte le piattaforme.

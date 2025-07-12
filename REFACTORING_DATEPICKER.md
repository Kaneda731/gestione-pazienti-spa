# Report Refactoring Datepicker - Grafico Diagnosi

Questo documento descrive il processo di debugging e refactoring del componente datepicker nella vista "Grafico Diagnosi".

## 1. Problema Iniziale (Sintomo)

Il campo di input per la selezione della data presentava i seguenti problemi:

*   **Altezza Errata:** Il campo risultava visibilmente più basso rispetto agli altri controlli del form (es. i menu a tendina), creando un disallineamento visivo.
*   **Instabilità dell'Icona:** L'icona del calendario a volte non appariva o non era cliccabile.
*   **Conflitti Funzionali:** In alcuni tentativi di correzione, l'intera funzionalità dei filtri smetteva di funzionare a causa di errori JavaScript.

## 2. Diagnosi del Problema

Dopo numerosi tentativi, la causa principale è stata identificata in una serie di **conflitti tra le dipendenze esterne e il codice custom**:

1.  **Conflitto di Stili:** Le regole CSS delle librerie `flatpickr` e di Bootstrap entravano in conflitto con gli stili custom del progetto. I tentativi di forzare l'altezza con CSS non erano efficaci perché venivano sovrascritti.
2.  **Conflitto di Script:** Le librerie `flatpickr` e `IMask` manipolavano entrambe il DOM attorno allo stesso input. L'ordine di inizializzazione e il modo in cui creavano elementi "wrapper" generavano errori imprevedibili, che a loro volta bloccavano l'esecuzione di altro codice JavaScript (come l'applicazione dei filtri).
3.  **Approccio Errato:** I tentativi iniziali si concentravano sul "forzare" le librerie a funzionare, combattendo contro il loro comportamento nativo invece di collaborare con esso o, come si è rivelato necessario, sostituirlo.

## 3. Soluzione Definitiva Implementata

Data la persistenza dei conflitti, si è deciso di abbandonare le librerie esterne per questo specifico componente e di **creare un datepicker custom da zero**.

Questo approccio ha garantito il pieno controllo su ogni aspetto del componente.

### Fasi della Soluzione:

1.  **Rimozione delle Dipendenze:** Le librerie `flatpickr` e `imask` sono state disinstallate dal progetto (`npm uninstall`) e i relativi import sono stati rimossi dai file SCSS per eliminare ogni fonte di conflitto.
2.  **Struttura HTML Pulita:** In `grafico.html`, è stata definita una struttura HTML semplice e standard per il datepicker:
    ```html
    <div class="datepicker-wrapper">
        <input type="text" class="form-control" placeholder="gg/mm/aaaa">
        <span class="material-icons datepicker-icon">calendar_today</span>
    </div>
    ```
3.  **CSS Mirato e Semplice:** In `forms.scss`, sono state scritte nuove regole CSS basate sull'approccio `position: relative` per il contenitore e `position: absolute` per l'icona. Questo metodo, a differenza di flexbox complessi, non entra in conflitto con gli stili del `.form-control` e garantisce un posizionamento perfetto.
4.  **Logica JavaScript Custom:** Il file `CustomDatepicker.js` è stato riscritto da zero. La nuova logica gestisce:
    *   L'apertura e la chiusura di un calendario generato dinamicamente.
    *   La renderizzazione dei giorni, mesi e anni.
    *   La gestione degli eventi di click sull'icona e sulla selezione della data.
5.  **Reintegrazione della Maschera di Input:** Una volta che il calendario custom era stabile e funzionante, la libreria `IMask` è stata reinstallata e applicata all'input per gestire la formattazione automatica della data (`gg/mm/aaaa`), questa volta senza conflitti.

## 4. Lezione Appresa

Quando l'integrazione di una o più librerie esterne per un componente UI relativamente semplice causa continui conflitti di stile o di script, **costruire una soluzione custom leggera può essere più veloce, stabile e manutenibile a lungo termine**.

L'approccio corretto è partire da una struttura HTML pulita e controllata, per poi aggiungere stile e funzionalità, invece di tentare di "piegare" il comportamento di librerie complesse alle proprie esigenze.

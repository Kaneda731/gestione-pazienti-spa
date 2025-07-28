// src/features/patients/services/patientValidation.js

/**
 * Validazione dati paziente
 */
export function validatePatientData(data) {
    const required = [
      "nome",
      "cognome",
      "data_nascita",
      "data_ricovero",
      "diagnosi",
      "reparto_appartenenza",
    ];

    for (const field of required) {
      if (!data[field] || data[field].toString().trim() === "") {
        throw new Error(`Il campo ${field} è obbligatorio`);
      }
    }

    // Validazione data nascita
    if (data.data_nascita) {
      const nascitaDate = new Date(data.data_nascita);
      const oggi = new Date();
      if (nascitaDate > oggi) {
        throw new Error("La data di nascita non può essere nel futuro");
      }
    }

    // Validazione data ricovero
    if (data.data_ricovero) {
      const ricoveroDate = new Date(data.data_ricovero);
      if (ricoveroDate > new Date()) {
        throw new Error("La data di ricovero non può essere nel futuro");
      }
    }

    // Validazione data dimissione
    if (data.data_dimissione) {
      const dimissioneDate = new Date(data.data_dimissione);
      const ricoveroDate = new Date(data.data_ricovero);
      if (dimissioneDate < ricoveroDate) {
        throw new Error(
          "La data di dimissione non può essere precedente alla data di ricovero"
        );
      }
    }

    // Validazione data infezione
    if (data.data_infezione) {
      const infezioneDate = new Date(data.data_infezione);
      const ricoveroDate = new Date(data.data_ricovero);
      const oggi = new Date();
      
      if (infezioneDate < ricoveroDate) {
        throw new Error(
          "La data di infezione non può essere precedente alla data di ricovero"
        );
      }
      
      if (infezioneDate > oggi) {
        throw new Error("La data di infezione non può essere nel futuro");
      }

      // Se c'è una data dimissione, l'infezione deve essere precedente
      if (data.data_dimissione) {
        const dimissioneDate = new Date(data.data_dimissione);
        if (infezioneDate > dimissioneDate) {
          throw new Error(
            "La data di infezione non può essere successiva alla data di dimissione"
          );
        }
      }
    }

    // Validazione codice RAD (opzionale ma con formato specifico)
    if (data.codice_rad && data.codice_rad.trim() !== "") {
      if (data.codice_rad.length > 11) {
        throw new Error("Il codice RAD non può superare i 11 caratteri");
      }
    }

    // Validazione campi dimissione/trasferimento
    if (data.tipo_dimissione) {
      const tipiValidi = ["dimissione", "trasferimento_interno", "trasferimento_esterno"];
      if (!tipiValidi.includes(data.tipo_dimissione)) {
        throw new Error(`Tipo dimissione non valido. Valori ammessi: ${tipiValidi.join(", ")}`);
      }

      // Validazioni specifiche per tipo dimissione
      if (data.tipo_dimissione === "trasferimento_interno") {
        if (!data.reparto_destinazione || data.reparto_destinazione.trim() === "") {
          throw new Error("Il reparto di destinazione è obbligatorio per i trasferimenti interni");
        }
      }

      if (data.tipo_dimissione === "trasferimento_esterno") {
        if (!data.clinica_destinazione || data.clinica_destinazione.trim() === "") {
          throw new Error("La clinica di destinazione è obbligatoria per i trasferimenti esterni");
        }
        
        if (!data.codice_clinica) {
          throw new Error("Il codice clinica è obbligatorio per i trasferimenti esterni");
        }

        // Validazione codici clinica
        const codiciValidi = ["56", "60"];
        if (!codiciValidi.includes(data.codice_clinica)) {
          throw new Error(`Codice clinica non valido. Valori ammessi: ${codiciValidi.join(", ")}`);
        }
      }

      // Validazione codice dimissione (obbligatorio se c'è tipo dimissione)
      if (!data.codice_dimissione) {
        throw new Error("Il codice dimissione è obbligatorio quando si specifica il tipo dimissione");
      }

      const codiciDimissioneValidi = ["3", "6"];
      if (!codiciDimissioneValidi.includes(data.codice_dimissione)) {
        throw new Error(`Codice dimissione non valido. Valori ammessi: ${codiciDimissioneValidi.join(", ")}`);
      }
    }
}

/**
 * Valida i dati di dimissione/trasferimento
 */
export function validateDischargeData(dischargeData) {
    // Campi obbligatori base
    const required = ["data_dimissione", "tipo_dimissione"];

    for (const field of required) {
      if (!dischargeData[field] || dischargeData[field].toString().trim() === "") {
        throw new Error(`Il campo ${field} è obbligatorio`);
      }
    }

    // Validazione tipo dimissione
    const tipiValidi = ["dimissione", "trasferimento_interno", "trasferimento_esterno"];
    if (!tipiValidi.includes(dischargeData.tipo_dimissione)) {
      throw new Error(`Tipo dimissione non valido. Valori ammessi: ${tipiValidi.join(", ")}`);
    }

    // Validazione data dimissione
    if (dischargeData.data_dimissione) {
      const dimissioneDate = new Date(dischargeData.data_dimissione);
      const oggi = new Date();
      if (dimissioneDate > oggi) {
        throw new Error("La data di dimissione non può essere nel futuro");
      }
    }

    // Validazioni specifiche per tipo dimissione
    if (dischargeData.tipo_dimissione === "trasferimento_interno") {
      if (!dischargeData.reparto_destinazione || dischargeData.reparto_destinazione.trim() === "") {
        throw new Error("Il reparto di destinazione è obbligatorio per i trasferimenti interni");
      }
    }

    if (dischargeData.tipo_dimissione === "trasferimento_esterno") {
      if (!dischargeData.clinica_destinazione || dischargeData.clinica_destinazione.trim() === "") {
        throw new Error("La clinica di destinazione è obbligatoria per i trasferimenti esterni");
      }
      
      if (!dischargeData.codice_clinica) {
        throw new Error("Il codice clinica è obbligatorio per i trasferimenti esterni");
      }

      // Validazione codici clinica
      const codiciValidi = ["56", "60"];
      if (!codiciValidi.includes(dischargeData.codice_clinica)) {
        throw new Error(`Codice clinica non valido. Valori ammessi: ${codiciValidi.join(", ")}`);
      }
    }

    // Validazione codice dimissione (sempre obbligatorio)
    if (!dischargeData.codice_dimissione) {
      throw new Error("Il codice dimissione è obbligatorio");
    }

    const codiciDimissioneValidi = ["3", "6"];
    if (!codiciDimissioneValidi.includes(dischargeData.codice_dimissione)) {
      throw new Error(`Codice dimissione non valido. Valori ammessi: ${codiciDimissioneValidi.join(", ")}`);
    }
}

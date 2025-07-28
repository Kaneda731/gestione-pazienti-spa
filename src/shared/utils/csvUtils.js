// src/shared/utils/csvUtils.js

/**
 * Genera contenuto CSV
 * @param {Array<object>} data - I dati da convertire in CSV.
 * @returns {string} - Il contenuto del file CSV.
 */
export function generateCSV(data) {
    const headers = [
      "Nome",
      "Cognome",
      "Data Nascita",
      "Data Ricovero",
      "Data Dimissione",
      "Diagnosi",
      "Reparto Appartenenza",
      "Reparto Provenienza",
      "Livello Assistenza",
      "Codice RAD",
      "Infetto",
    ];

    const rows = data.map((p) => [
      p.nome || "",
      p.cognome || "",
      p.data_nascita ? new Date(p.data_nascita).toLocaleDateString() : "",
      p.data_ricovero ? new Date(p.data_ricovero).toLocaleDateString() : "",
      p.data_dimissione ? new Date(p.data_dimissione).toLocaleDateString() : "",
      p.diagnosi || "",
      p.reparto_appartenenza || "",
      p.reparto_provenienza || "",
      p.livello_assistenza || "",
      p.codice_rad || "",
      p.infetto ? "Sì" : "No",
    ]);

    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
}

/**
 * Avvia il download di un file CSV.
 * @param {string} content - Il contenuto del file.
 * @param {string} filename - Il nome del file da scaricare.
 */
export function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
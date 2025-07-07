/**
 * ===================================
 * ESEMPI DI CARD LAYOUT PER MOBILE
 * ===================================
 * 
 * Questo file contiene esempi di funzioni per generare dinamicamente 
 * diversi tipi di card per layout mobile.
 * 
 * Questi esempi non sono utilizzati direttamente nell'applicazione,
 * ma servono come documentazione e riferimento per futuri sviluppi.
 * 
 * Tipi di layout inclusi:
 * 1. Card orizzontali compatte (per liste)
 * 2. Griglia 2x2 (per statistiche)
 * 3. Lista compatta con status (per aggiornamenti rapidi)
 * 4. Scroll orizzontale (per categorie o reparti)
 */

/**
 * Esempio 1: Crea una card orizzontale per un paziente.
 * Ideale per liste dove lo spazio verticale è limitato.
 * @param {object} patient - L'oggetto paziente con id, nome, cognome, eta, diagnosi.
 * @returns {string} Il markup HTML per la card.
 */
function createHorizontalPatientCard(patient) {
    return `
        <div class="card card-horizontal">
            <div class="card-header">
                ID: ${patient.id}
            </div>
            <div class="card-body">
                <div class="card-title">${patient.nome} ${patient.cognome}</div>
                <div class="card-meta">${patient.eta} anni • ${patient.diagnosi}</div>
            </div>
        </div>
    `;
}

/**
 * Esempio 2: Crea una griglia di statistiche.
 * Utile per dashboard e viste riassuntive.
 * @param {object} stats - Oggetto con le statistiche (totalPatients, discharged, etc.).
 * @returns {string} Il markup HTML per la griglia.
 */
function createStatsGrid(stats) {
    return `
        <div class="cards-grid-mobile">
            <div class="card">
                <div class="card-header">Pazienti</div>
                <div class="card-body">${stats.totalPatients}</div>
            </div>
            <div class="card">
                <div class="card-header">Dimessi</div>
                <div class="card-body">${stats.discharged}</div>
            </div>
            <div class="card">
                <div class="card-header">Critici</div>
                <div class="card-body">${stats.critical}</div>
            </div>
            <div class="card">
                <div class="card-header">Stabili</div>
                <div class="card-body">${stats.stable}</div>
            </div>
        </div>
    `;
}

/**
 * Esempio 3: Crea una lista compatta di pazienti con indicatore di stato.
 * Ottimizzata per visualizzare molte informazioni in poco spazio.
 * @param {Array<object>} patients - Array di oggetti paziente.
 * @returns {string} Il markup HTML per la lista.
 */
function createCompactPatientList(patients) {
    return patients.map(patient => `
        <div class="card card-list-compact status-${patient.status}">
            <div class="card-body">
                <div>
                    <div class="card-title">${patient.nome} ${patient.cognome}</div>
                    <div class="card-meta">Letto ${patient.letto} • ${patient.reparto}</div>
                </div>
                <div class="card-meta">
                    ${patient.lastUpdate}
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Esempio 4: Crea un contenitore a scorrimento orizzontale per reparti.
 * Utile per navigare tra categorie senza occupare spazio verticale.
 * @param {Array<object>} departments - Array di oggetti reparto.
 * @returns {string} Il markup HTML per il contenitore a scorrimento.
 */
function createDepartmentScroll(departments) {
    return `
        <div class="cards-scroll-wrapper">
            <div class="cards-scroll-container">
                ${departments.map(dept => `
                    <div class="card">
                        <div class="card-header">${dept.name}</div>
                        <div class="card-body">
                            <div>Pazienti: ${dept.patientCount}</div>
                            <div>Disponibilità: ${dept.availability}%</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

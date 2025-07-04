/* ===================================
   ESEMPIO USO CARD MOBILE MODERNE
   =================================== */

/**
 * Esempi di utilizzo dei nuovi layout per card mobile
 */

// Esempio 1: Card orizzontali compatte per lista pazienti
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

// Esempio 2: Grid 2x2 per statistiche rapide
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

// Esempio 3: Lista compatta con status
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

// Esempio 4: Scroll orizzontale per reparti
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

// Funzioni helper per gestire le interazioni mobile
class MobileCardManager {
    
    // Aggiunge ripple effect programmaticamente
    static addRippleEffect(cardElement, event) {
        const rect = cardElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        cardElement.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    // Gestisce stati di loading
    static setLoadingState(cardElement, isLoading) {
        if (isLoading) {
            cardElement.classList.add('loading');
        } else {
            cardElement.classList.remove('loading');
        }
    }
    
    // Cambia layout dinamicamente
    static switchToLayout(container, layoutType) {
        const cards = container.querySelectorAll('.card');
        
        // Rimuovi classi esistenti
        cards.forEach(card => {
            card.classList.remove('card-horizontal', 'card-list-compact');
        });
        
        container.classList.remove('cards-grid-mobile', 'cards-scroll-container');
        
        // Applica nuovo layout
        switch (layoutType) {
            case 'horizontal':
                cards.forEach(card => card.classList.add('card-horizontal'));
                break;
            case 'grid':
                container.classList.add('cards-grid-mobile');
                break;
            case 'compact':
                cards.forEach(card => card.classList.add('card-list-compact'));
                break;
            case 'scroll':
                container.classList.add('cards-scroll-container');
                break;
        }
    }
    
    // Ottimizza per touch
    static initTouchOptimizations() {
        document.querySelectorAll('.card').forEach(card => {
            // Previene double-tap zoom solo sulle card, non sui pulsanti
            card.addEventListener('touchend', (e) => {
                // Non interferire con i pulsanti e link
                if (e.target.closest('button, a, input, select')) {
                    return; // Lascia il comportamento normale
                }
                e.preventDefault();
                card.click();
            });
            
            // Feedback tattile (solo se supportato e permesso)
            card.addEventListener('touchstart', (e) => {
                // Solo se non è un pulsante
                if (!e.target.closest('button, a, input, select')) {
                    try {
                        if ('vibrate' in navigator && document.hasStorageAccess) {
                            navigator.vibrate(10); // Vibrazione leggera
                        }
                    } catch (e) {
                        // Ignora errori di vibrazione
                    }
                }
            });
        });
    }
}

// Auto-inizializzazione per mobile
if (window.innerWidth <= 767) {
    document.addEventListener('DOMContentLoaded', () => {
        MobileCardManager.initTouchOptimizations();
        
        // Gestisci resize per layout responsivo
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 480) {
                // Passa a layout più compatto su schermi piccoli
                document.querySelectorAll('.cards-grid-mobile').forEach(grid => {
                    grid.style.gridTemplateColumns = '1fr';
                });
            }
        });
    });
}

// Esporta per uso globale
window.MobileCardManager = MobileCardManager;

/**
 * Post-Operative Calculator Utility
 * Calculates days since last surgical intervention for patients
 * Handles multiple interventions per patient scenarios
 */

export class PostOperativeCalculator {
    constructor() {
        this.interventionTypes = [
            'Chirurgia Ortopedica',
            'Chirurgia Plastica', 
            'Chirurgia Vascolare',
            'Chirurgia Generale',
            'Altro'
        ];
    }

    /**
     * Calculate post-operative days for a patient based on their clinical events
     * @param {Array} eventiClinici - Array of clinical events for the patient
     * @param {Date|string} referenceDate - Date to calculate from (defaults to today)
     * @returns {Object} Post-operative calculation result
     */
    calculatePostOperativeDays(eventiClinici, referenceDate = new Date()) {
        try {
            if (!Array.isArray(eventiClinici)) {
                throw new Error('eventiClinici must be an array');
            }

            const refDate = this.parseDate(referenceDate);
            if (!refDate) {
                throw new Error('Invalid reference date');
            }

            // Filter for surgical interventions only
            const interventions = this.filterInterventions(eventiClinici);
            
            if (interventions.length === 0) {
                return {
                    hasInterventions: false,
                    postOperativeDays: null,
                    lastIntervention: null,
                    displayText: null,
                    allInterventions: []
                };
            }

            // Sort interventions by date (most recent first)
            const sortedInterventions = this.sortInterventionsByDate(interventions);
            const lastIntervention = sortedInterventions[0];
            
            // Calculate days since last intervention
            const interventionDate = this.parseDate(lastIntervention.data_evento);
            if (!interventionDate) {
                throw new Error('Invalid intervention date');
            }

            const daysDifference = this.calculateDaysDifference(interventionDate, refDate);
            
            return {
                hasInterventions: true,
                postOperativeDays: daysDifference,
                lastIntervention: lastIntervention,
                displayText: this.formatDisplayText(daysDifference),
                allInterventions: sortedInterventions
            };

        } catch (error) {
            window.appLogger?.error('Error calculating post-operative days:', error);
            return {
                hasInterventions: false,
                postOperativeDays: null,
                lastIntervention: null,
                displayText: null,
                allInterventions: [],
                error: error.message
            };
        }
    }

    /**
     * Calculate post-operative days for multiple patients
     * @param {Array} patients - Array of patients with their clinical events
     * @param {Date|string} referenceDate - Date to calculate from (defaults to today)
     * @returns {Map} Map of patient ID to post-operative calculation result
     */
    calculateForMultiplePatients(patients, referenceDate = new Date()) {
        const results = new Map();
        
        if (!Array.isArray(patients)) {
            return results;
        }

        patients.forEach(patient => {
            if (patient.id && patient.eventi_clinici) {
                const calculation = this.calculatePostOperativeDays(
                    patient.eventi_clinici, 
                    referenceDate
                );
                results.set(patient.id, calculation);
            }
        });

        return results;
    }

    /**
     * Get post-operative status for display in patient lists
     * @param {Array} eventiClinici - Array of clinical events for the patient
     * @param {Date|string} referenceDate - Date to calculate from (defaults to today)
     * @returns {Object} Status object for UI display
     */
    getPostOperativeStatus(eventiClinici, referenceDate = new Date()) {
        const calculation = this.calculatePostOperativeDays(eventiClinici, referenceDate);
        
        if (!calculation.hasInterventions) {
            return {
                hasStatus: false,
                statusText: '',
                statusClass: '',
                badgeText: ''
            };
        }

        const days = calculation.postOperativeDays;
        let statusClass = 'success'; // Default green
        let badgeText = `PO ${days}`;

        // Color coding based on post-operative days
        if (days <= 7) {
            statusClass = 'danger'; // Red for first week
        } else if (days <= 30) {
            statusClass = 'warning'; // Yellow for first month
        } else if (days <= 90) {
            statusClass = 'info'; // Blue for first 3 months
        }

        return {
            hasStatus: true,
            statusText: calculation.displayText,
            statusClass: statusClass,
            badgeText: badgeText,
            days: days,
            lastIntervention: calculation.lastIntervention
        };
    }

    /**
     * Filter clinical events to get only surgical interventions
     * @param {Array} eventiClinici - Array of clinical events
     * @returns {Array} Array of intervention events
     */
    filterInterventions(eventiClinici) {
        return eventiClinici.filter(evento => {
            return evento.tipo_evento === 'intervento' && 
                   evento.data_evento && 
                   evento.tipo_intervento;
        });
    }

    /**
     * Sort interventions by date (most recent first)
     * @param {Array} interventions - Array of intervention events
     * @returns {Array} Sorted array of interventions
     */
    sortInterventionsByDate(interventions) {
        return interventions.sort((a, b) => {
            const dateA = this.parseDate(a.data_evento);
            const dateB = this.parseDate(b.data_evento);
            
            if (!dateA || !dateB) return 0;
            return dateB.getTime() - dateA.getTime(); // Most recent first
        });
    }

    /**
     * Calculate the difference in days between two dates
     * @param {Date} startDate - Start date (intervention date)
     * @param {Date} endDate - End date (reference date)
     * @returns {number} Number of days difference
     */
    calculateDaysDifference(startDate, endDate) {
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        return Math.max(0, daysDifference); // Ensure non-negative
    }

    /**
     * Format display text for post-operative days
     * @param {number} days - Number of post-operative days
     * @returns {string} Formatted display text
     */
    formatDisplayText(days) {
        if (days === 0) {
            return 'Giorno dell\'intervento';
        } else if (days === 1) {
            return 'Giorno post-operatorio 1';
        } else {
            return `Giorno post-operatorio ${days}`;
        }
    }

    /**
     * Get detailed post-operative information for a patient
     * @param {Array} eventiClinici - Array of clinical events for the patient
     * @param {Date|string} referenceDate - Date to calculate from (defaults to today)
     * @returns {Object} Detailed post-operative information
     */
    getDetailedPostOperativeInfo(eventiClinici, referenceDate = new Date()) {
        const calculation = this.calculatePostOperativeDays(eventiClinici, referenceDate);
        
        if (!calculation.hasInterventions) {
            return {
                hasInterventions: false,
                summary: 'Nessun intervento chirurgico registrato',
                details: []
            };
        }

        const details = calculation.allInterventions.map((intervention, index) => {
            const interventionDate = this.parseDate(intervention.data_evento);
            const daysSince = this.calculateDaysDifference(interventionDate, this.parseDate(referenceDate));
            
            return {
                date: intervention.data_evento,
                type: intervention.tipo_intervento,
                description: intervention.descrizione || '',
                daysSince: daysSince,
                displayText: this.formatDisplayText(daysSince),
                isLatest: index === 0
            };
        });

        return {
            hasInterventions: true,
            currentPostOpDay: calculation.postOperativeDays,
            currentDisplayText: calculation.displayText,
            lastInterventionDate: calculation.lastIntervention.data_evento,
            lastInterventionType: calculation.lastIntervention.tipo_intervento,
            totalInterventions: calculation.allInterventions.length,
            summary: `${calculation.displayText} (${calculation.allInterventions.length} interventi totali)`,
            details: details
        };
    }

    /**
     * Check if a patient is in critical post-operative period
     * @param {Array} eventiClinici - Array of clinical events for the patient
     * @param {number} criticalDays - Number of days considered critical (default: 7)
     * @param {Date|string} referenceDate - Date to calculate from (defaults to today)
     * @returns {Object} Critical period status
     */
    isInCriticalPostOpPeriod(eventiClinici, criticalDays = 7, referenceDate = new Date()) {
        const calculation = this.calculatePostOperativeDays(eventiClinici, referenceDate);
        
        if (!calculation.hasInterventions) {
            return {
                isCritical: false,
                reason: 'No interventions recorded'
            };
        }

        const isCritical = calculation.postOperativeDays <= criticalDays;
        
        return {
            isCritical: isCritical,
            postOpDays: calculation.postOperativeDays,
            criticalThreshold: criticalDays,
            reason: isCritical ? 
                `Patient is ${calculation.postOperativeDays} days post-operative (≤${criticalDays} days)` :
                `Patient is ${calculation.postOperativeDays} days post-operative (>${criticalDays} days)`
        };
    }

    /**
     * Parse date from various formats
     * @param {Date|string} dateInput - Date input in various formats
     * @returns {Date|null} Parsed date or null if invalid
     */
    parseDate(dateInput) {
        if (!dateInput) return null;
        
        if (dateInput instanceof Date) {
            return isNaN(dateInput.getTime()) ? null : dateInput;
        }
        
        if (typeof dateInput === 'string') {
            // Handle ISO date format (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                const date = new Date(dateInput + 'T00:00:00.000Z');
                return isNaN(date.getTime()) ? null : date;
            }
            
            // Handle DD/MM/YYYY format
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput)) {
                const parts = dateInput.split('/');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                const year = parseInt(parts[2], 10);
                const date = new Date(year, month, day);
                return isNaN(date.getTime()) ? null : date;
            }
            
            // Try parsing as general date string
            const date = new Date(dateInput);
            return isNaN(date.getTime()) ? null : date;
        }
        
        return null;
    }

    /**
     * Validate intervention event data
     * @param {Object} evento - Clinical event object
     * @returns {Object} Validation result
     */
    validateInterventionEvent(evento) {
        const errors = [];
        
        if (!evento) {
            errors.push('Event object is required');
            return { isValid: false, errors };
        }
        
        if (evento.tipo_evento !== 'intervento') {
            errors.push('Event type must be "intervento"');
        }
        
        if (!evento.data_evento) {
            errors.push('Event date is required');
        } else {
            const date = this.parseDate(evento.data_evento);
            if (!date) {
                errors.push('Invalid event date format');
            } else if (date > new Date()) {
                errors.push('Event date cannot be in the future');
            }
        }
        
        if (!evento.tipo_intervento) {
            errors.push('Intervention type is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get statistics for post-operative patients
     * @param {Array} patients - Array of patients with their clinical events
     * @param {Date|string} referenceDate - Date to calculate from (defaults to today)
     * @returns {Object} Statistics object
     */
    getPostOperativeStatistics(patients, referenceDate = new Date()) {
        if (!Array.isArray(patients)) {
            return {
                totalPatients: 0,
                patientsWithInterventions: 0,
                criticalPeriod: 0,
                earlyRecovery: 0,
                lateRecovery: 0,
                averagePostOpDays: 0
            };
        }

        let patientsWithInterventions = 0;
        let criticalPeriod = 0; // 0-7 days
        let earlyRecovery = 0;  // 8-30 days
        let lateRecovery = 0;   // 31+ days
        let totalPostOpDays = 0;

        patients.forEach(patient => {
            if (patient.eventi_clinici) {
                const calculation = this.calculatePostOperativeDays(
                    patient.eventi_clinici, 
                    referenceDate
                );
                
                if (calculation.hasInterventions) {
                    patientsWithInterventions++;
                    totalPostOpDays += calculation.postOperativeDays;
                    
                    if (calculation.postOperativeDays <= 7) {
                        criticalPeriod++;
                    } else if (calculation.postOperativeDays <= 30) {
                        earlyRecovery++;
                    } else {
                        lateRecovery++;
                    }
                }
            }
        });

        return {
            totalPatients: patients.length,
            patientsWithInterventions: patientsWithInterventions,
            criticalPeriod: criticalPeriod,
            earlyRecovery: earlyRecovery,
            lateRecovery: lateRecovery,
            averagePostOpDays: patientsWithInterventions > 0 ? 
                Math.round(totalPostOpDays / patientsWithInterventions) : 0
        };
    }
}

// Create a singleton instance for easy use
export const postOperativeCalculator = new PostOperativeCalculator();

// Export utility functions for direct use
export function calculatePostOperativeDays(eventiClinici, referenceDate) {
    return postOperativeCalculator.calculatePostOperativeDays(eventiClinici, referenceDate);
}

export function getPostOperativeStatus(eventiClinici, referenceDate) {
    return postOperativeCalculator.getPostOperativeStatus(eventiClinici, referenceDate);
}

export function formatPostOperativeText(days) {
    return postOperativeCalculator.formatDisplayText(days);
}

export function isInCriticalPostOpPeriod(eventiClinici, criticalDays, referenceDate) {
    return postOperativeCalculator.isInCriticalPostOpPeriod(eventiClinici, criticalDays, referenceDate);
}

export default PostOperativeCalculator;
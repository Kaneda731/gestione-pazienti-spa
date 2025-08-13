/**
 * Unit tests for PostOperativeCalculator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostOperativeCalculator, postOperativeCalculator, calculatePostOperativeDays, getPostOperativeStatus } from '../../../../../src/features/eventi-clinici/utils/post-operative-calculator.js';

describe('PostOperativeCalculator', () => {
    let calculator;
    let mockEventi;
    let referenceDate;

    beforeEach(() => {
        calculator = new PostOperativeCalculator();
        referenceDate = new Date('2024-03-20T12:00:00.000Z');
        
        // Mock window.appLogger
        global.window = {
            appLogger: {
                error: vi.fn()
            }
        };

        // Mock clinical events data
        mockEventi = [
            {
                id: '1',
                tipo_evento: 'intervento',
                data_evento: '2024-03-15',
                tipo_intervento: 'Chirurgia Ortopedica',
                descrizione: 'Intervento al ginocchio'
            },
            {
                id: '2',
                tipo_evento: 'infezione',
                data_evento: '2024-03-17',
                agente_patogeno: 'E. coli'
            },
            {
                id: '3',
                tipo_evento: 'intervento',
                data_evento: '2024-03-10',
                tipo_intervento: 'Chirurgia Plastica',
                descrizione: 'Ricostruzione'
            }
        ];
    });

    describe('Initialization', () => {
        it('should initialize with default intervention types', () => {
            expect(calculator.interventionTypes).toContain('Chirurgia Ortopedica');
            expect(calculator.interventionTypes).toContain('Chirurgia Plastica');
            expect(calculator.interventionTypes).toContain('Chirurgia Vascolare');
            expect(calculator.interventionTypes).toContain('Chirurgia Generale');
            expect(calculator.interventionTypes).toContain('Altro');
        });
    });

    describe('calculatePostOperativeDays', () => {
        it('should calculate post-operative days correctly', () => {
            const result = calculator.calculatePostOperativeDays(mockEventi, referenceDate);
            
            expect(result.hasInterventions).toBe(true);
            expect(result.postOperativeDays).toBe(5); // 2024-03-20 - 2024-03-15 = 5 days
            expect(result.lastIntervention.id).toBe('1'); // Most recent intervention
            expect(result.displayText).toBe('Giorno post-operatorio 5');
            expect(result.allInterventions).toHaveLength(2);
        });

        it('should return no interventions when none exist', () => {
            const eventiWithoutInterventions = [
                {
                    id: '1',
                    tipo_evento: 'infezione',
                    data_evento: '2024-03-17',
                    agente_patogeno: 'E. coli'
                }
            ];

            const result = calculator.calculatePostOperativeDays(eventiWithoutInterventions, referenceDate);
            
            expect(result.hasInterventions).toBe(false);
            expect(result.postOperativeDays).toBeNull();
            expect(result.lastIntervention).toBeNull();
            expect(result.displayText).toBeNull();
            expect(result.allInterventions).toHaveLength(0);
        });

        it('should handle empty events array', () => {
            const result = calculator.calculatePostOperativeDays([], referenceDate);
            
            expect(result.hasInterventions).toBe(false);
            expect(result.postOperativeDays).toBeNull();
        });

        it('should handle invalid input gracefully', () => {
            const result = calculator.calculatePostOperativeDays(null, referenceDate);
            
            expect(result.hasInterventions).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should use today as default reference date', () => {
            const today = new Date();
            const result = calculator.calculatePostOperativeDays(mockEventi);
            
            expect(result.hasInterventions).toBe(true);
            expect(typeof result.postOperativeDays).toBe('number');
        });

        it('should handle same-day intervention', () => {
            const sameDayEventi = [
                {
                    id: '1',
                    tipo_evento: 'intervento',
                    data_evento: '2024-03-20',
                    tipo_intervento: 'Chirurgia Ortopedica'
                }
            ];

            const result = calculator.calculatePostOperativeDays(sameDayEventi, referenceDate);
            
            expect(result.postOperativeDays).toBe(0);
            expect(result.displayText).toBe('Giorno dell\'intervento');
        });

        it('should handle one day post-operative', () => {
            const oneDayEventi = [
                {
                    id: '1',
                    tipo_evento: 'intervento',
                    data_evento: '2024-03-19',
                    tipo_intervento: 'Chirurgia Ortopedica'
                }
            ];

            const result = calculator.calculatePostOperativeDays(oneDayEventi, referenceDate);
            
            expect(result.postOperativeDays).toBe(1);
            expect(result.displayText).toBe('Giorno post-operatorio 1');
        });
    });

    describe('filterInterventions', () => {
        it('should filter only intervention events', () => {
            const interventions = calculator.filterInterventions(mockEventi);
            
            expect(interventions).toHaveLength(2);
            expect(interventions.every(e => e.tipo_evento === 'intervento')).toBe(true);
        });

        it('should exclude interventions without tipo_intervento', () => {
            const eventiWithIncomplete = [
                ...mockEventi,
                {
                    id: '4',
                    tipo_evento: 'intervento',
                    data_evento: '2024-03-18'
                    // Missing tipo_intervento
                }
            ];

            const interventions = calculator.filterInterventions(eventiWithIncomplete);
            
            expect(interventions).toHaveLength(2); // Should still be 2, not 3
        });
    });

    describe('sortInterventionsByDate', () => {
        it('should sort interventions by date (most recent first)', () => {
            const interventions = calculator.filterInterventions(mockEventi);
            const sorted = calculator.sortInterventionsByDate(interventions);
            
            expect(sorted[0].data_evento).toBe('2024-03-15'); // Most recent
            expect(sorted[1].data_evento).toBe('2024-03-10'); // Older
        });
    });

    describe('calculateDaysDifference', () => {
        it('should calculate correct day difference', () => {
            const startDate = new Date('2024-03-15');
            const endDate = new Date('2024-03-20');
            
            const days = calculator.calculateDaysDifference(startDate, endDate);
            
            expect(days).toBe(5);
        });

        it('should return 0 for negative differences', () => {
            const startDate = new Date('2024-03-20');
            const endDate = new Date('2024-03-15');
            
            const days = calculator.calculateDaysDifference(startDate, endDate);
            
            expect(days).toBe(0);
        });
    });

    describe('formatDisplayText', () => {
        it('should format day 0 correctly', () => {
            const text = calculator.formatDisplayText(0);
            expect(text).toBe('Giorno dell\'intervento');
        });

        it('should format day 1 correctly', () => {
            const text = calculator.formatDisplayText(1);
            expect(text).toBe('Giorno post-operatorio 1');
        });

        it('should format multiple days correctly', () => {
            const text = calculator.formatDisplayText(5);
            expect(text).toBe('Giorno post-operatorio 5');
        });
    });

    describe('getPostOperativeStatus', () => {
        it('should return correct status for critical period (≤7 days)', () => {
            const status = calculator.getPostOperativeStatus(mockEventi, referenceDate);
            
            expect(status.hasStatus).toBe(true);
            expect(status.statusClass).toBe('danger');
            expect(status.badgeText).toBe('PO 5');
            expect(status.days).toBe(5);
        });

        it('should return correct status for warning period (8-30 days)', () => {
            const warningEventi = [
                {
                    id: '1',
                    tipo_evento: 'intervento',
                    data_evento: '2024-03-05', // 15 days ago
                    tipo_intervento: 'Chirurgia Ortopedica'
                }
            ];

            const status = calculator.getPostOperativeStatus(warningEventi, referenceDate);
            
            expect(status.statusClass).toBe('warning');
            expect(status.days).toBe(15);
        });

        it('should return correct status for info period (31-90 days)', () => {
            const infoEventi = [
                {
                    id: '1',
                    tipo_evento: 'intervento',
                    data_evento: '2024-02-15', // ~34 days ago
                    tipo_intervento: 'Chirurgia Ortopedica'
                }
            ];

            const status = calculator.getPostOperativeStatus(infoEventi, referenceDate);
            
            expect(status.statusClass).toBe('info');
            expect(status.days).toBe(34);
        });

        it('should return correct status for success period (>90 days)', () => {
            const successEventi = [
                {
                    id: '1',
                    tipo_evento: 'intervento',
                    data_evento: '2023-12-01', // >90 days ago
                    tipo_intervento: 'Chirurgia Ortopedica'
                }
            ];

            const status = calculator.getPostOperativeStatus(successEventi, referenceDate);
            
            expect(status.statusClass).toBe('success');
            expect(status.days).toBeGreaterThan(90);
        });

        it('should return no status when no interventions', () => {
            const noInterventionEventi = [
                {
                    id: '1',
                    tipo_evento: 'infezione',
                    data_evento: '2024-03-17',
                    agente_patogeno: 'E. coli'
                }
            ];

            const status = calculator.getPostOperativeStatus(noInterventionEventi, referenceDate);
            
            expect(status.hasStatus).toBe(false);
            expect(status.statusText).toBe('');
            expect(status.statusClass).toBe('');
            expect(status.badgeText).toBe('');
        });
    });

    describe('getDetailedPostOperativeInfo', () => {
        it('should return detailed information for patients with interventions', () => {
            const info = calculator.getDetailedPostOperativeInfo(mockEventi, referenceDate);
            
            expect(info.hasInterventions).toBe(true);
            expect(info.currentPostOpDay).toBe(5);
            expect(info.totalInterventions).toBe(2);
            expect(info.details).toHaveLength(2);
            expect(info.details[0].isLatest).toBe(true);
            expect(info.details[1].isLatest).toBe(false);
        });

        it('should return appropriate message for patients without interventions', () => {
            const noInterventionEventi = [
                {
                    id: '1',
                    tipo_evento: 'infezione',
                    data_evento: '2024-03-17',
                    agente_patogeno: 'E. coli'
                }
            ];

            const info = calculator.getDetailedPostOperativeInfo(noInterventionEventi, referenceDate);
            
            expect(info.hasInterventions).toBe(false);
            expect(info.summary).toBe('Nessun intervento chirurgico registrato');
            expect(info.details).toHaveLength(0);
        });
    });

    describe('isInCriticalPostOpPeriod', () => {
        it('should identify patients in critical period', () => {
            const result = calculator.isInCriticalPostOpPeriod(mockEventi, 7, referenceDate);
            
            expect(result.isCritical).toBe(true);
            expect(result.postOpDays).toBe(5);
            expect(result.criticalThreshold).toBe(7);
        });

        it('should identify patients not in critical period', () => {
            const oldEventi = [
                {
                    id: '1',
                    tipo_evento: 'intervento',
                    data_evento: '2024-03-01', // 19 days ago
                    tipo_intervento: 'Chirurgia Ortopedica'
                }
            ];

            const result = calculator.isInCriticalPostOpPeriod(oldEventi, 7, referenceDate);
            
            expect(result.isCritical).toBe(false);
            expect(result.postOpDays).toBe(19);
        });

        it('should handle patients without interventions', () => {
            const noInterventionEventi = [
                {
                    id: '1',
                    tipo_evento: 'infezione',
                    data_evento: '2024-03-17',
                    agente_patogeno: 'E. coli'
                }
            ];

            const result = calculator.isInCriticalPostOpPeriod(noInterventionEventi, 7, referenceDate);
            
            expect(result.isCritical).toBe(false);
            expect(result.reason).toBe('No interventions recorded');
        });
    });

    describe('parseDate', () => {
        it('should parse ISO date strings', () => {
            const date = calculator.parseDate('2024-03-15');
            
            expect(date).toBeInstanceOf(Date);
            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(2); // March (0-indexed)
            expect(date.getDate()).toBe(15);
        });

        it('should parse DD/MM/YYYY format', () => {
            const date = calculator.parseDate('15/03/2024');
            
            expect(date).toBeInstanceOf(Date);
            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(2);
            expect(date.getDate()).toBe(15);
        });

        it('should handle Date objects', () => {
            const inputDate = new Date('2024-03-15');
            const date = calculator.parseDate(inputDate);
            
            expect(date).toBe(inputDate);
        });

        it('should return null for invalid dates', () => {
            expect(calculator.parseDate('invalid-date')).toBeNull();
            expect(calculator.parseDate('')).toBeNull();
            expect(calculator.parseDate(null)).toBeNull();
            expect(calculator.parseDate(undefined)).toBeNull();
        });

        it('should handle invalid Date objects', () => {
            const invalidDate = new Date('invalid');
            const result = calculator.parseDate(invalidDate);
            
            expect(result).toBeNull();
        });
    });

    describe('validateInterventionEvent', () => {
        it('should validate correct intervention event', () => {
            const validEvent = {
                tipo_evento: 'intervento',
                data_evento: '2024-03-15',
                tipo_intervento: 'Chirurgia Ortopedica'
            };

            const result = calculator.validateInterventionEvent(validEvent);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject null/undefined events', () => {
            const result = calculator.validateInterventionEvent(null);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Event object is required');
        });

        it('should reject non-intervention events', () => {
            const invalidEvent = {
                tipo_evento: 'infezione',
                data_evento: '2024-03-15',
                agente_patogeno: 'E. coli'
            };

            const result = calculator.validateInterventionEvent(invalidEvent);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Event type must be "intervento"');
        });

        it('should reject events without date', () => {
            const invalidEvent = {
                tipo_evento: 'intervento',
                tipo_intervento: 'Chirurgia Ortopedica'
            };

            const result = calculator.validateInterventionEvent(invalidEvent);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Event date is required');
        });

        it('should reject events without intervention type', () => {
            const invalidEvent = {
                tipo_evento: 'intervento',
                data_evento: '2024-03-15'
            };

            const result = calculator.validateInterventionEvent(invalidEvent);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Intervention type is required');
        });

        it('should reject future dates', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const futureDateString = futureDate.toISOString().split('T')[0];

            const invalidEvent = {
                tipo_evento: 'intervento',
                data_evento: futureDateString,
                tipo_intervento: 'Chirurgia Ortopedica'
            };

            const result = calculator.validateInterventionEvent(invalidEvent);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Event date cannot be in the future');
        });
    });

    describe('calculateForMultiplePatients', () => {
        it('should calculate for multiple patients', () => {
            const patients = [
                {
                    id: 'patient1',
                    eventi_clinici: mockEventi
                },
                {
                    id: 'patient2',
                    eventi_clinici: [
                        {
                            id: '1',
                            tipo_evento: 'intervento',
                            data_evento: '2024-03-10',
                            tipo_intervento: 'Chirurgia Plastica'
                        }
                    ]
                }
            ];

            const results = calculator.calculateForMultiplePatients(patients, referenceDate);
            
            expect(results.size).toBe(2);
            expect(results.get('patient1').hasInterventions).toBe(true);
            expect(results.get('patient2').hasInterventions).toBe(true);
            expect(results.get('patient1').postOperativeDays).toBe(5);
            expect(results.get('patient2').postOperativeDays).toBe(10);
        });

        it('should handle empty patients array', () => {
            const results = calculator.calculateForMultiplePatients([], referenceDate);
            
            expect(results.size).toBe(0);
        });

        it('should handle invalid input', () => {
            const results = calculator.calculateForMultiplePatients(null, referenceDate);
            
            expect(results.size).toBe(0);
        });
    });

    describe('getPostOperativeStatistics', () => {
        it('should calculate correct statistics', () => {
            const patients = [
                {
                    eventi_clinici: [
                        {
                            tipo_evento: 'intervento',
                            data_evento: '2024-03-18', // 2 days ago (critical)
                            tipo_intervento: 'Chirurgia Ortopedica'
                        }
                    ]
                },
                {
                    eventi_clinici: [
                        {
                            tipo_evento: 'intervento',
                            data_evento: '2024-03-05', // 15 days ago (early recovery)
                            tipo_intervento: 'Chirurgia Plastica'
                        }
                    ]
                },
                {
                    eventi_clinici: [
                        {
                            tipo_evento: 'intervento',
                            data_evento: '2024-01-15', // >60 days ago (late recovery)
                            tipo_intervento: 'Chirurgia Generale'
                        }
                    ]
                },
                {
                    eventi_clinici: [
                        {
                            tipo_evento: 'infezione',
                            data_evento: '2024-03-17',
                            agente_patogeno: 'E. coli'
                        }
                    ]
                }
            ];

            const stats = calculator.getPostOperativeStatistics(patients, referenceDate);
            
            expect(stats.totalPatients).toBe(4);
            expect(stats.patientsWithInterventions).toBe(3);
            expect(stats.criticalPeriod).toBe(1);
            expect(stats.earlyRecovery).toBe(1);
            expect(stats.lateRecovery).toBe(1);
            expect(stats.averagePostOpDays).toBeGreaterThan(0);
        });

        it('should handle empty patients array', () => {
            const stats = calculator.getPostOperativeStatistics([], referenceDate);
            
            expect(stats.totalPatients).toBe(0);
            expect(stats.patientsWithInterventions).toBe(0);
            expect(stats.averagePostOpDays).toBe(0);
        });

        it('should handle invalid input', () => {
            const stats = calculator.getPostOperativeStatistics(null, referenceDate);
            
            expect(stats.totalPatients).toBe(0);
        });
    });

    describe('Singleton and utility functions', () => {
        it('should provide singleton instance', () => {
            expect(postOperativeCalculator).toBeInstanceOf(PostOperativeCalculator);
        });

        it('should provide utility function for calculating post-operative days', () => {
            const result = calculatePostOperativeDays(mockEventi, referenceDate);
            
            expect(result.hasInterventions).toBe(true);
            expect(result.postOperativeDays).toBe(5);
        });

        it('should provide utility function for getting status', () => {
            const status = getPostOperativeStatus(mockEventi, referenceDate);
            
            expect(status.hasStatus).toBe(true);
            expect(status.statusClass).toBe('danger');
        });
    });

    describe('Edge cases and error handling', () => {
        it('should handle events with missing data gracefully', () => {
            const incompleteEventi = [
                {
                    id: '1',
                    tipo_evento: 'intervento',
                    // Missing data_evento and tipo_intervento
                }
            ];

            const result = calculator.calculatePostOperativeDays(incompleteEventi, referenceDate);
            
            expect(result.hasInterventions).toBe(false);
        });

        it('should handle malformed date strings', () => {
            const malformedEventi = [
                {
                    id: '1',
                    tipo_evento: 'intervento',
                    data_evento: 'not-a-date',
                    tipo_intervento: 'Chirurgia Ortopedica'
                }
            ];

            const result = calculator.calculatePostOperativeDays(malformedEventi, referenceDate);
            
            expect(result.hasInterventions).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should log errors appropriately', () => {
            calculator.calculatePostOperativeDays(null, referenceDate);
            
            expect(global.window.appLogger.error).toHaveBeenCalled();
        });
    });
});
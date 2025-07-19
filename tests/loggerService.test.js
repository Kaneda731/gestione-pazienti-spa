// tests/loggerService.test.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoggerService } from '../src/core/services/loggerService.js';

// Mock dell'environment
vi.mock('../src/app/config/environment.js', () => ({
    isDevelopment: false,
    isTest: false
}));

describe('LoggerService', () => {
    let logger;
    let consoleSpy;

    beforeEach(() => {
        logger = new LoggerService();
        // Spy sui metodi console
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {}),
            info: vi.spyOn(console, 'info').mockImplementation(() => {}),
            group: vi.spyOn(console, 'group').mockImplementation(() => {}),
            groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
            table: vi.spyOn(console, 'table').mockImplementation(() => {}),
            time: vi.spyOn(console, 'time').mockImplementation(() => {}),
            timeEnd: vi.spyOn(console, 'timeEnd').mockImplementation(() => {})
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('in production environment', () => {
        beforeEach(() => {
            // Mock production environment
            vi.doMock('../src/app/config/environment.js', () => ({
                isDevelopment: false,
                isTest: false
            }));
        });

        it('should not log debug messages', () => {
            logger.log('test message');
            expect(consoleSpy.log).not.toHaveBeenCalled();
        });

        it('should not log warning messages', () => {
            logger.warn('test warning');
            expect(consoleSpy.warn).not.toHaveBeenCalled();
        });

        it('should log error messages', () => {
            logger.error('test error');
            expect(consoleSpy.error).toHaveBeenCalledWith('test error');
        });

        it('should not log info messages', () => {
            logger.info('test info');
            expect(consoleSpy.info).not.toHaveBeenCalled();
        });
    });

    describe('logger methods', () => {
        it('should have all required methods', () => {
            expect(typeof logger.log).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.group).toBe('function');
            expect(typeof logger.table).toBe('function');
            expect(typeof logger.time).toBe('function');
            expect(typeof logger.timeEnd).toBe('function');
        });
    });
});
/**
 * Test per NotificationSoundManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationSoundManager } from '../../../../src/core/services/notificationSoundManager.js';

// Mock Web Audio API
const mockAudioContext = {
    state: 'running',
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null
    })),
    createGain: vi.fn(() => ({
        gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn(),
        disconnect: vi.fn()
    })),
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve())
};

// Mock HTML Audio
const mockAudio = {
    volume: 0.5,
    src: '',
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn()
};

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
};

describe('NotificationSoundManager', () => {
    let soundManager;
    
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock global objects
        global.window.AudioContext = vi.fn(() => mockAudioContext);
        global.window.webkitAudioContext = vi.fn(() => mockAudioContext);
        global.window.Audio = vi.fn(() => mockAudio);
        global.localStorage = mockLocalStorage;
        
        // Mock matchMedia
        global.window.matchMedia = vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }));
        
        // Mock btoa/atob
        global.btoa = vi.fn((str) => Buffer.from(str).toString('base64'));
        global.atob = vi.fn((str) => Buffer.from(str, 'base64').toString());
    });
    
    afterEach(() => {
        if (soundManager) {
            soundManager.destroy();
            soundManager = null;
        }
    });
    
    it('dovrebbe creare sound manager con opzioni default', async () => {
        soundManager = new NotificationSoundManager();
        await soundManager.init();
        
        expect(soundManager.options.enabled).toBe(true);
        expect(soundManager.options.volume).toBe(0.5);
        expect(soundManager.options.respectSystemSettings).toBe(true);
    });
    
    it('dovrebbe creare sound manager con opzioni personalizzate', async () => {
        const customOptions = {
            enabled: false,
            volume: 0.8,
            respectSystemSettings: false
        };
        
        soundManager = new NotificationSoundManager(customOptions);
        await soundManager.init();
        
        expect(soundManager.options.enabled).toBe(false);
        expect(soundManager.options.volume).toBe(0.8);
        expect(soundManager.options.respectSystemSettings).toBe(false);
    });
    
    it('dovrebbe rilevare supporto audio correttamente', () => {
        soundManager = new NotificationSoundManager();
        
        expect(soundManager.isAudioSupported()).toBe(true);
        
        // Test senza supporto audio
        delete global.window.AudioContext;
        delete global.window.webkitAudioContext;
        delete global.window.Audio;
        
        expect(soundManager.isAudioSupported()).toBe(false);
    });
    
    it('dovrebbe inizializzare AudioContext correttamente', async () => {
        soundManager = new NotificationSoundManager();
        await soundManager.initializeAudioContext();
        
        expect(global.window.AudioContext).toHaveBeenCalled();
        expect(soundManager.audioContext).toBeDefined();
    });
    
    it('dovrebbe caricare suoni predefiniti', async () => {
        soundManager = new NotificationSoundManager();
        await soundManager.loadDefaultSounds();
        
        expect(soundManager.sounds.has('success')).toBe(true);
        expect(soundManager.sounds.has('error')).toBe(true);
        expect(soundManager.sounds.has('warning')).toBe(true);
        expect(soundManager.sounds.has('info')).toBe(true);
    });
    
    it('dovrebbe riprodurre suono con Web Audio API', async () => {
        soundManager = new NotificationSoundManager();
        await soundManager.init();
        
        await soundManager.playSound('success');
        
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
    
    it('dovrebbe rispettare preferenze reduced motion', async () => {
        // Mock reduced motion preference
        global.window.matchMedia = vi.fn(() => ({
            matches: true, // reduced motion enabled
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }));
        
        soundManager = new NotificationSoundManager();
        await soundManager.init();
        
        const shouldPlay = soundManager.shouldPlaySound('success');
        expect(shouldPlay).toBe(false);
    });
    
    it('dovrebbe gestire preferenze utente da localStorage', () => {
        const mockPrefs = {
            enabled: false,
            volume: 0.3,
            success: true,
            error: false
        };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPrefs));
        
        soundManager = new NotificationSoundManager();
        const prefs = soundManager.getUserSoundPreferences();
        
        expect(prefs.enabled).toBe(false);
        expect(prefs.volume).toBe(0.3);
        expect(prefs.success).toBe(true);
        expect(prefs.error).toBe(false);
    });
    
    it('dovrebbe aggiornare impostazioni correttamente', () => {
        soundManager = new NotificationSoundManager();
        
        const newSettings = {
            enabled: false,
            volume: 0.8,
            success: false
        };
        
        soundManager.updateSettings(newSettings);
        
        expect(soundManager.options.enabled).toBe(false);
        expect(soundManager.options.volume).toBe(0.8);
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
    
    it('dovrebbe controllare volume correttamente', () => {
        soundManager = new NotificationSoundManager();
        
        soundManager.setVolume(0.7);
        expect(soundManager.getVolume()).toBe(0.7);
        
        // Test limiti
        soundManager.setVolume(-0.5);
        expect(soundManager.getVolume()).toBe(0);
        
        soundManager.setVolume(1.5);
        expect(soundManager.getVolume()).toBe(1);
    });
    
    it('dovrebbe abilitare/disabilitare suoni', () => {
        soundManager = new NotificationSoundManager();
        
        soundManager.disable();
        expect(soundManager.isEnabled()).toBe(false);
        
        soundManager.enable();
        expect(soundManager.isEnabled()).toBe(true);
    });
    
    it('dovrebbe generare data URL per suoni', () => {
        soundManager = new NotificationSoundManager();
        
        const dataUrl = soundManager.generateSoundDataUrl('success');
        
        expect(dataUrl).toContain('data:audio/wav;base64,');
        expect(global.btoa).toHaveBeenCalled();
    });
    
    it('dovrebbe gestire fallback HTML Audio', async () => {
        // Disabilita Web Audio API
        soundManager = new NotificationSoundManager();
        soundManager.audioContext = null;
        
        await soundManager.playSound('success');
        
        expect(global.window.Audio).toHaveBeenCalled();
        expect(mockAudio.play).toHaveBeenCalled();
    });
    
    it('dovrebbe testare tutti i suoni', async () => {
        soundManager = new NotificationSoundManager();
        await soundManager.init();
        
        const playSoundSpy = vi.spyOn(soundManager, 'playSound');
        
        soundManager.testAllSounds();
        
        // Verifica che setTimeout sia stato chiamato per ogni tipo
        expect(setTimeout).toHaveBeenCalledTimes(4);
    });
    
    it('dovrebbe pulire risorse alla distruzione', () => {
        soundManager = new NotificationSoundManager();
        soundManager.audioContext = mockAudioContext;
        soundManager.isInitialized = true;
        
        soundManager.destroy();
        
        expect(mockAudioContext.close).toHaveBeenCalled();
        expect(soundManager.audioContext).toBeNull();
        expect(soundManager.isInitialized).toBe(false);
    });
    
    it('dovrebbe gestire errori di riproduzione gracefully', async () => {
        soundManager = new NotificationSoundManager();
        await soundManager.init();
        
        // Mock errore
        mockAudioContext.createOscillator.mockImplementation(() => {
            throw new Error('Audio error');
        });
        
        // Non dovrebbe lanciare errore
        await expect(soundManager.playSound('success')).resolves.toBeUndefined();
    });
    
    it('dovrebbe rispettare impostazioni tipo-specifiche', async () => {
        const mockPrefs = {
            enabled: true,
            success: false, // Disabilita solo success
            error: true
        };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPrefs));
        
        soundManager = new NotificationSoundManager();
        await soundManager.init();
        
        expect(soundManager.shouldPlaySound('success')).toBe(false);
        expect(soundManager.shouldPlaySound('error')).toBe(true);
    });
});
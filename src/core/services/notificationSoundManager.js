/**
 * NotificationSoundManager - Gestione suoni per notifiche
 * Fornisce feedback audio per diversi tipi di notifiche con controllo volume e preferenze utente
 */

export class NotificationSoundManager {
    constructor(options = {}) {
        this.options = {
            enabled: true,
            volume: 0.5,
            respectSystemSettings: true,
            ...options
        };
        
        this.audioContext = null;
        this.sounds = new Map();
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Controlla se l'audio è supportato
            if (!this.isAudioSupported()) {
                return;
            }
            
            // Inizializza Web Audio API se disponibile
            await this.initializeAudioContext();
            
            // Carica i suoni predefiniti
            await this.loadDefaultSounds();
            
            this.isInitialized = true;
        } catch (error) {
            // Inizializzazione fallita silenziosamente
        }
    }
    
    isAudioSupported() {
        return !!(window.AudioContext || window.webkitAudioContext || window.Audio);
    }
    
    async initializeAudioContext() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
                
                // Resume context se necessario (policy browser)
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
            }
        } catch (error) {
            // AudioContext non disponibile
        }
    }
    
    async loadDefaultSounds() {
        const soundDefinitions = {
            success: {
                frequency: 800,
                duration: 0.2,
                type: 'sine',
                volume: 0.3
            },
            error: {
                frequency: 300,
                duration: 0.4,
                type: 'square',
                volume: 0.4
            },
            warning: {
                frequency: 600,
                duration: 0.3,
                type: 'triangle',
                volume: 0.35
            },
            info: {
                frequency: 500,
                duration: 0.25,
                type: 'sine',
                volume: 0.25
            }
        };
        
        for (const [type, config] of Object.entries(soundDefinitions)) {
            this.sounds.set(type, config);
        }
    }
    
    async playSound(type, options = {}) {
        if (!this.shouldPlaySound(type)) {
            return;
        }
        
        try {
            const soundConfig = this.sounds.get(type);
            if (!soundConfig) {
                return;
            }
            
            if (this.audioContext) {
                await this.playWebAudioSound(soundConfig, options);
            } else {
                await this.playHTMLAudioSound(type, options);
            }
        } catch (error) {
            // Riproduzione suono fallita silenziosamente
        }
    }
    
    async playWebAudioSound(config, options = {}) {
        if (!this.audioContext || this.audioContext.state !== 'running') {
            return;
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Configura oscillatore
        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
        
        // Configura volume con envelope
        const volume = (options.volume ?? config.volume) * this.options.volume;
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + config.duration);
        
        // Connetti nodi
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Avvia e ferma
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + config.duration);
        
        // Cleanup
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    }
    
    async playHTMLAudioSound(type, options = {}) {
        // Fallback usando HTML Audio con data URLs per suoni sintetici
        const audio = new Audio();
        audio.volume = this.options.volume * (options.volume ?? 0.3);
        
        // Genera data URL per suono sintetico semplice
        const dataUrl = this.generateSoundDataUrl(type);
        audio.src = dataUrl;
        
        try {
            await audio.play();
        } catch (error) {
            // Ignora errori di autoplay policy
            if (error.name !== 'NotAllowedError') {
                throw error;
            }
        }
    }
    
    generateSoundDataUrl(type) {
        // Genera un semplice beep usando data URL
        // Questo è un fallback molto basico
        const frequencies = {
            success: 800,
            error: 300,
            warning: 600,
            info: 500
        };
        
        const frequency = frequencies[type] || 500;
        const duration = 0.2;
        const sampleRate = 8000;
        const samples = Math.floor(sampleRate * duration);
        
        let data = '';
        for (let i = 0; i < samples; i++) {
            const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
            const byte = Math.floor((sample + 1) * 127);
            data += String.fromCharCode(byte);
        }
        
        return `data:audio/wav;base64,${btoa(data)}`;
    }
    
    shouldPlaySound(type) {
        if (!this.options.enabled || !this.isInitialized) {
            return false;
        }
        
        // Rispetta le preferenze di sistema per riduzione movimento/suoni
        if (this.options.respectSystemSettings) {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return false;
            }
        }
        
        // Controlla se l'utente ha disabilitato i suoni per questo tipo
        const userPrefs = this.getUserSoundPreferences();
        if (userPrefs && userPrefs[type] === false) {
            return false;
        }
        
        return true;
    }
    
    getUserSoundPreferences() {
        try {
            const prefs = localStorage.getItem('notification-sound-preferences');
            return prefs ? JSON.parse(prefs) : null;
        } catch (error) {
            return null;
        }
    }
    
    updateSettings(newSettings) {
        this.options = { ...this.options, ...newSettings };
        
        // Salva preferenze utente
        try {
            localStorage.setItem('notification-sound-preferences', JSON.stringify({
                enabled: this.options.enabled,
                volume: this.options.volume,
                success: newSettings.success !== false,
                error: newSettings.error !== false,
                warning: newSettings.warning !== false,
                info: newSettings.info !== false
            }));
        } catch (error) {
            // Salvataggio preferenze fallito silenziosamente
        }
    }
    
    setVolume(volume) {
        this.options.volume = Math.max(0, Math.min(1, volume));
    }
    
    enable() {
        this.options.enabled = true;
        this.updateSettings({ enabled: true });
    }
    
    disable() {
        this.options.enabled = false;
        this.updateSettings({ enabled: false });
    }
    
    isEnabled() {
        return this.options.enabled;
    }
    
    getVolume() {
        return this.options.volume;
    }
    
    // Method to test sounds
    async testSound(type = 'info') {
        await this.playSound(type, { volume: 0.5 });
    }
    
    // Method to test all sounds
    async testAllSounds() {
        const types = ['success', 'info', 'warning', 'error'];
        for (let i = 0; i < types.length; i++) {
            setTimeout(() => {
                this.testSound(types[i]);
            }, i * 500);
        }
    }
    
    destroy() {
        // Chiudi AudioContext se presente
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Pulisci riferimenti
        this.audioContext = null;
        this.sounds.clear();
        this.isInitialized = false;
    }
}

// Istanza singleton per uso globale
let soundManagerInstance = null;

export const getSoundManager = () => {
    if (!soundManagerInstance) {
        soundManagerInstance = new NotificationSoundManager();
    }
    return soundManagerInstance;
};

export default NotificationSoundManager;
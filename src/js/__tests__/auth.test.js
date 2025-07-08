// src/js/__tests__/auth.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock delle dipendenze prima di ogni import
vi.mock('../services/supabaseClient.js', () => ({
    supabase: {
        auth: {
            onAuthStateChange: vi.fn(),
            signInWithOAuth: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: { username: 'testuser', role: 'editor' }, error: null, status: 200 }),
                })),
            })),
        })),
    },
}));

vi.mock('../auth-ui.js', () => ({
    updateAuthUI: vi.fn(),
}));

// Import del modulo da testare DOPO i mock
import { authService } from '../auth.js';
import { supabase } from '../services/supabaseClient.js';
import { updateAuthUI } from '../auth-ui.js';

// Mock di localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock di history.replaceState
Object.defineProperty(window, 'history', {
    value: { replaceState: vi.fn() },
    writable: true,
});

// Mock di location.hash
Object.defineProperty(window, 'location', {
    value: { hash: '#access_token=123', pathname: '/', search: '' },
    writable: true,
});


describe('AuthService', () => {

    let onAuthStateChangeCallback;

    beforeEach(() => {
        // Resetta tutti i mock prima di ogni test
        vi.clearAllMocks();
        localStorage.clear();
        window.location.hash = ''; // Pulisce l'hash

        // Cattura il callback passato a onAuthStateChange per simularne l'attivazione
        supabase.auth.onAuthStateChange.mockImplementation((callback) => {
            onAuthStateChangeCallback = callback;
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });
    });

    it('Il costruttore dovrebbe pulire i token dall-URL e impostare il listener', () => {
        window.location.hash = '#access_token=test-token&other=param';
        
        // La semplice importazione di authService ne esegue il costruttore
        // Per testarlo di nuovo, dovremmo poter re-istanziarlo, ma il pattern singleton lo impedisce.
        // Verifichiamo che il mock sia stato chiamato (dovrebbe essere già avvenuto all'import iniziale)
        expect(history.replaceState).toHaveBeenCalledWith(null, '', '/');
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('onAuthStateChange dovrebbe registrare un callback e aggiornare la UI al cambio di stato', async () => {
        const mockSession = { user: { id: 'user-1', email: 'test@test.com' } };
        const appCallback = vi.fn();

        authService.onAuthStateChange(appCallback);

        // Simula un evento di login da Supabase
        await onAuthStateChangeCallback('SIGNED_IN', mockSession);

        expect(updateAuthUI).toHaveBeenCalledWith(mockSession);
        expect(appCallback).toHaveBeenCalledWith(mockSession);
        expect(authService.isAuthenticated()).toBe(true);
        expect(authService.getUser().email).toBe('test@test.com');
    });

    it('signOut dovrebbe chiamare supabase.auth.signOut', async () => {
        await authService.signOut();
        expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    describe('Development Bypass', () => {
        it('enableDevelopmentBypass dovrebbe impostare i dati corretti in localStorage', () => {
            authService.enableDevelopmentBypass();
            expect(localStorage.getItem('user.bypass.enabled')).toBe('true');
            expect(localStorage.getItem('supabase.auth.session')).toBeDefined();
        });

        it('Il costruttore dovrebbe attivare il bypass se user.bypass.enabled è true', async () => {
            // Imposta il bypass prima di "ricaricare" il modulo
            localStorage.setItem('user.bypass.enabled', 'true');
            
            // Per testare il costruttore in un nuovo stato, dobbiamo usare l'import dinamico
            const { authService: newAuthService } = await import('../auth.js?t=' + Date.now());
            
            // Usa un timeout per attendere l'esecuzione asincrona in #checkDevelopmentBypass
            await new Promise(res => setTimeout(res, 10));

            expect(newAuthService.isAuthenticated()).toBe(true);
            expect(newAuthService.getUserRole()).toBe('admin');
            expect(updateAuthUI).toHaveBeenCalled();
        });

        it('signOut in modalità bypass dovrebbe disabilitarlo e ricaricare la pagina', async () => {
            // Mock per window.location.reload
            const reloadMock = vi.fn();
            Object.defineProperty(window, 'location', {
                value: { ...window.location, reload: reloadMock },
                writable: true,
            });

            localStorage.setItem('user.bypass.enabled', 'true');
            const { authService: newAuthService } = await import('../auth.js?t=' + Date.now());
            await new Promise(res => setTimeout(res, 10));

            await newAuthService.signOut();

            expect(localStorage.getItem('user.bypass.enabled')).toBeNull();
            expect(reloadMock).toHaveBeenCalled();
        });
    });
});

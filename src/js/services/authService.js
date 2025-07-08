// src/js/auth.js
import { supabase } from './supabaseClient.js';
import { updateAuthUI } from '../auth-ui.js';
import { oauthManager } from './oauthService.js';

// Esporta una variabile per contenere lo stato dell'utente e del suo profilo
export let currentUser = {
    session: undefined, // Inizializza a undefined per il controllo iniziale
    profile: null
};

// ===================================
// GESTIONE PROFILO UTENTE
// ===================================

export async function fetchUserProfile(user) {
    if (!user) return null;

    try {
        const { data, error, status } = await supabase
            .from('profiles')
            .select(`username, full_name, role`)
            .eq('id', user.id)
            .single();

        if (error && status !== 406) {
            throw error;
        }
        
        console.log('Profilo utente recuperato:', data);
        return data;
    } catch (error) {
        console.error('Errore nel recuperare il profilo utente:', error);
        return null;
    }
}

// ===================================
// AUTENTICAZIONE
// ===================================

export async function signInWithGoogle() {
    return await oauthManager.signInWithGoogle();
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Pulisci lo stato utente locale
        currentUser.session = null;
        currentUser.profile = null;
        
        return { success: true };
    } catch (error) {
        console.error('Errore durante il signOut:', error);
        return { success: false, error: error.message };
    }
}

// ===================================
// INIZIALIZZAZIONE
// ===================================

export function initAuth(onAuthStateChange) {
    // Inizializza l'OAuth manager
    oauthManager.init();
    
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event, 'Session:', session); // <-- LOG DI DEBUG
        
        // Gestisce specificamente i problemi OAuth
        if (event === 'SIGNED_OUT' && oauthManager.getAuthState().state === 'error') {
            console.log('Logout dopo errore OAuth, pulisco stato...');
            oauthManager.clearCorruptedState();
        }

        if (session?.user) {
            // Utente loggato: recupera il profilo
            const profile = await fetchUserProfile(session.user);
            currentUser.session = session;
            currentUser.profile = profile || { role: 'editor' }; // Fallback a 'editor'
        } else {
            // Utente non loggato
            currentUser.session = null;
            currentUser.profile = null;
        }
        
        // Aggiorna sempre la UI
        updateAuthUI(session);

        // Chiama il callback per notificare il resto dell'app
        if (onAuthStateChange) {
            onAuthStateChange(session);
        }
    });
    
    console.log('Sistema di autenticazione inizializzato');
}
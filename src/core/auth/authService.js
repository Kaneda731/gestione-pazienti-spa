// src/core/auth/authService.js
import { supabase } from '../services/supabaseClient.js';
import { updateAuthUI } from '../../shared/components/ui/AuthUI.js';
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

export async function initAuth(onAuthStateChange) {
    // Inizializza l'OAuth manager
    oauthManager.init();

    // Recupera la sessione corrente all'avvio per garantire che la UI sia aggiornata subito
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Sessione iniziale recuperata:', session);

    if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        currentUser.session = session;
        currentUser.profile = profile || { role: 'editor' };
    } else {
        currentUser.session = null;
        currentUser.profile = null;
    }
    updateAuthUI(session);
    if (onAuthStateChange) {
        onAuthStateChange(session);
    }
    
    // Ora imposta il listener per i cambiamenti futuri
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event, 'Session:', session);
        
        if (event === 'SIGNED_OUT' && oauthManager.getAuthState().state === 'error') {
            console.log('Logout dopo errore OAuth, pulisco stato...');
            oauthManager.clearCorruptedState();
        }

        // Aggiorna lo stato solo se è cambiato rispetto a quello attuale
        if (session?.access_token !== currentUser.session?.access_token) {
            if (session?.user) {
                const profile = await fetchUserProfile(session.user);
                currentUser.session = session;
                currentUser.profile = profile || { role: 'editor' };
            } else {
                currentUser.session = null;
                currentUser.profile = null;
            }
            
            updateAuthUI(session);

            if (onAuthStateChange) {
                onAuthStateChange(session);
            }
        }
    });
    
    console.log('Sistema di autenticazione inizializzato');
}
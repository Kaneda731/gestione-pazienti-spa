import { supabase } from '../services/supabaseClient.js';
import { updateAuthUI } from '../../shared/components/ui/AuthUI.js';
import { oauthManager } from './oauthService.js';
import { logger } from '../services/loggerService.js';

// Esporta una variabile per contenere lo stato dell'utente e del suo profilo
export let currentUser = {
    session: undefined, // Inizializza a undefined per il controllo iniziale
    profile: null
};

// ===================================
// GESTIONE PROFILO UTENTE
// ===================================

async function fetchUserProfile(user) {
    if (!user) return null;
    try {
        const { data, error, status } = await supabase
            .from('profiles')
            .select(`username, full_name, role`)
            .eq('id', user.id)
            .single();
        if (error && status !== 406) throw error;
        return data;
    } catch (error) {
        console.error('Errore nel recuperare il profilo utente:', error);
        return null;
    }
}

async function updateUserState(session) {
    if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        currentUser.session = session;
        currentUser.profile = profile || { role: 'editor' }; // Fallback di sicurezza
    } else {
        currentUser.session = null;
        currentUser.profile = null;
    }
    
    updateAuthUI(session);
    
    // Annuncia a tutta l'app che il profilo è stato caricato (o è nullo)
    window.dispatchEvent(new CustomEvent('auth-profile-loaded'));
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
        return { success: true };
    } catch (error) {
        console.error('Errore durante il signOut:', error);
        return { success: false, error: error.message };
    }
}

// ===================================
// INIZIALIZZAZIONE
// ===================================

export async function initAuth(authCallback) {
    oauthManager.init();

    const { data: { session } } = await supabase.auth.getSession();
    logger.log('Sessione iniziale recuperata:', session);
    await updateUserState(session);
    if (authCallback) {
        authCallback(session);
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
        logger.log('Auth event:', event, 'Session:', session);
        
        if (event === 'SIGNED_OUT' && oauthManager.getAuthState().state === 'error') {
            oauthManager.clearCorruptedState();
        }

        if (session?.access_token !== currentUser.session?.access_token) {
            await updateUserState(session);
            if (authCallback) {
                authCallback(session);
            }
        }
    });
    
    logger.log('Sistema di autenticazione inizializzato');
}
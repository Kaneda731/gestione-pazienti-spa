import { supabase } from '../services/supabase/supabaseClient.js';
import { oauthManager } from './oauthService.js';
import { logger } from '../services/logger/loggerService.js';

// Esporta una variabile per contenere lo stato dell'utente e del suo profilo
export let currentUser = {
    session: undefined, // Inizializza a undefined per il controllo iniziale
    profile: null
};

// User Profile Management

async function fetchUserProfile(user) {
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
        
        return data;
        
    } catch (error) {
        console.error('Errore nel recuperare il profilo utente:', error);
        
        // Fallback leggero per errori imprevisti
        console.warn('🔄 Uso profilo di fallback per:', user.email);
        
        // Tenta di recuperare il ruolo usando la funzione sicura
        try {
            const { data: roleData } = await supabase.rpc('get_user_role_safe', {
                user_uuid: user.id
            });
            
            const safeRole = roleData || 'editor';
            console.info('✅ Ruolo recuperato con funzione sicura:', safeRole);
            
            return {
                id: user.id,
                username: user.email?.split('@')[0] || 'utente',
                full_name: user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email || 
                          'Utente',
                role: safeRole,
                email: user.email,
                fallback: true
            };
            
        } catch (roleError) {
            console.error('❌ Errore nel recupero ruolo sicuro, uso fallback minimo:', roleError);
            return null;
        }
    }
}

async function updateUserState(session) {
    if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        currentUser.session = session;
        
        // Fallback migliorato se il profilo non è disponibile
        if (!profile) {
            console.warn('⚠️ Profilo non disponibile, uso fallback per:', session.user.email);
            currentUser.profile = {
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'utente',
                full_name: session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          session.user.email || 
                          'Utente',
                role: 'editor',
                email: session.user.email,
                fallback: true
            };
        } else {
            currentUser.profile = profile;
        }
        
        // Log per debug
        if (currentUser.profile?.fallback) {
            console.info('✅ Utente autenticato con profilo di fallback:', currentUser.profile.username);
        } else {
            console.info('✅ Utente autenticato:', currentUser.profile?.username || 'sconosciuto');
        }
    } else {
        currentUser.session = null;
        currentUser.profile = null;
    }

    // Notifica il resto dell'app senza importare direttamente la UI per evitare cicli
    try {
        window.dispatchEvent(new CustomEvent('auth:session-changed', { detail: { session } }));
    } catch (_) {
        // no-op in ambienti non browser
    }

    // Annuncia a tutta l'app che il profilo è stato caricato (o è nullo)
    window.dispatchEvent(new CustomEvent('auth-profile-loaded'));
}

// Authentication

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

// Initialization

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
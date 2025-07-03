// src/js/auth.js
import { supabase } from './supabase.js';
import { authContainer, templates } from './ui.js';

/**
 * Aggiorna l'interfaccia utente di autenticazione in base alla sessione.
 * @param {object | null} session - La sessione utente di Supabase.
 */
export function updateAuthUI(session) {
    authContainer.innerHTML = '';
    const template = session ? templates.logout : templates.login;
    const content = template.content.cloneNode(true);

    if (session) {
        content.getElementById('user-email').textContent = session.user.email;
        content.getElementById('logout-button').addEventListener('click', () => supabase.auth.signOut());
    } else {
        content.getElementById('login-button').addEventListener('click', () => supabase.auth.signInWithOAuth({ provider: 'google' }));
    }

    authContainer.appendChild(content);
}

/**
 * Inizializza il listener per i cambiamenti di stato dell'autenticazione.
 * @param {function} onAuthStateChange - Callback da eseguire quando lo stato di autenticazione cambia.
 */
export function initAuth(onAuthStateChange) {
    supabase.auth.onAuthStateChange((_event, session) => {
        updateAuthUI(session);
        if (onAuthStateChange) {
            onAuthStateChange(session);
        }
    });
}

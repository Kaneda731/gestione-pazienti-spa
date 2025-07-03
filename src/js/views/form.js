// src/js/views/form.js
import { supabase } from '../supabase.js';
import { mostraMessaggio } from '../ui.js';
import { navigateTo } from '../router.js';

export async function initInserimentoView() {
    const form = document.getElementById('form-inserimento');
    if (!form) return;

    const backButton = form.closest('.card').querySelector('button[data-view="home"]');
    const title = document.getElementById('inserimento-title');
    const submitButton = form.querySelector('button[type="submit"]');
    const idInput = document.getElementById('paziente-id');

    const editId = sessionStorage.getItem('editPazienteId');

    if (editId) {
        // Modalità Modifica
        title.innerHTML = '<span class="material-icons me-2">edit</span>Modifica Paziente';
        submitButton.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Modifiche';

        try {
            const { data, error } = await supabase.from('pazienti').select('*').eq('id', editId).single();
            if (error) throw error;
            
            for (const key in data) {
                if (form.elements[key]) {
                    form.elements[key].value = data[key];
                }
            }
        } catch (error) {
            mostraMessaggio(`Errore nel caricamento dei dati: ${error.message}`, 'error');
        }

    } else {
        // Modalità Inserimento
        title.innerHTML = '<span class="material-icons me-2">person_add</span>Inserimento Nuovo Paziente';
        submitButton.innerHTML = '<span class="material-icons me-1" style="vertical-align: middle;">save</span>Salva Paziente';
        form.reset();
        idInput.value = '';
        form.querySelector('#data_ricovero').value = new Date().toISOString().split('T')[0];
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            mostraMessaggio('Per favore, compila tutti i campi obbligatori.', 'error');
            return;
        }
        
        submitButton.disabled = true;
        const originalButtonHTML = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio...';
        
        const formData = Object.fromEntries(new FormData(form));
        
        try {
            let error;
            if (editId) {
                const { error: updateError } = await supabase.from('pazienti').update(formData).eq('id', editId);
                error = updateError;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Utente non autenticato.');
                formData.user_id = user.id;
                const { error: insertError } = await supabase.from('pazienti').insert([formData]);
                error = insertError;
            }

            if (error) throw error;

            mostraMessaggio('Dati salvati con successo!', 'success');
            form.reset();
            sessionStorage.removeItem('editPazienteId');
            setTimeout(() => navigateTo('list'), 1500);

        } catch (error) {
            mostraMessaggio(`Errore nel salvataggio: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHTML;
        }
    };

    backButton.addEventListener('click', () => {
        sessionStorage.removeItem('editPazienteId');
        navigateTo('list');
    });
}

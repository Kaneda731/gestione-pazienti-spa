// src/js/auth/auth-validation.js
// Sistema di validazione per i form di autenticazione

import { isMobileDevice } from '../utils/mobile-utils.js';

/**
 * Configurazione validatori
 */
const validators = {
    email: {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Inserisci un\'email valida'
    },
    password: {
        minLength: 6,
        message: 'La password deve essere di almeno 6 caratteri'
    }
};

/**
 * Validazione email
 */
export function validateEmail(email) {
    return validators.email.regex.test(email);
}

/**
 * Validazione password
 */
export function validatePassword(password) {
    return password.length >= validators.password.minLength;
}

/**
 * Mostra errore di validazione su campo specifico
 */
export function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Rimuovi errori precedenti
    clearFieldError(fieldId);
    
    // Aggiungi classe di errore
    field.classList.add('is-invalid');
    
    // Crea elemento errore
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = message;
    errorElement.id = `${fieldId}-error`;
    
    // Inserisci dopo il campo
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    
    // Su mobile, fai scroll al campo con errore
    if (isMobileDevice()) {
        setTimeout(() => {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            field.focus();
        }, 100);
    }
}

/**
 * Rimuove errore di validazione da campo specifico
 */
export function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('is-invalid');
    
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Pulisce tutti gli errori da un form
 */
export function clearFormErrors(formElement) {
    if (!formElement) return;
    
    const invalidFields = formElement.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => {
        field.classList.remove('is-invalid');
    });
    
    const errorElements = formElement.querySelectorAll('.invalid-feedback');
    errorElements.forEach(error => error.remove());
}

/**
 * Valida form di login
 */
export function validateLoginForm(email, password) {
    let isValid = true;
    
    // Reset errori precedenti
    clearFieldError('modal-login-email');
    clearFieldError('modal-login-password');
    
    // Valida email
    if (!email) {
        showFieldError('modal-login-email', 'L\'email è obbligatoria');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('modal-login-email', validators.email.message);
        isValid = false;
    }
    
    // Valida password
    if (!password) {
        showFieldError('modal-login-password', 'La password è obbligatoria');
        isValid = false;
    } else if (!validatePassword(password)) {
        showFieldError('modal-login-password', validators.password.message);
        isValid = false;
    }
    
    return isValid;
}

/**
 * Valida form di registrazione
 */
export function validateSignupForm(email, password, passwordConfirm) {
    let isValid = true;
    
    // Reset errori precedenti
    clearFieldError('modal-signup-email');
    clearFieldError('modal-signup-password');
    clearFieldError('modal-signup-password-confirm');
    
    // Valida email
    if (!email) {
        showFieldError('modal-signup-email', 'L\'email è obbligatoria');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('modal-signup-email', validators.email.message);
        isValid = false;
    }
    
    // Valida password
    if (!password) {
        showFieldError('modal-signup-password', 'La password è obbligatoria');
        isValid = false;
    } else if (!validatePassword(password)) {
        showFieldError('modal-signup-password', validators.password.message);
        isValid = false;
    }
    
    // Valida conferma password
    if (!passwordConfirm) {
        showFieldError('modal-signup-password-confirm', 'Conferma la password');
        isValid = false;
    } else if (password !== passwordConfirm) {
        showFieldError('modal-signup-password-confirm', 'Le password non coincidono');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Crea validatore per campo specifico
 */
function createFieldValidator(fieldId, validatorFn, errorMessage) {
    return {
        fieldId,
        validate: validatorFn,
        errorMessage
    };
}

/**
 * Setup validazione in tempo reale per un campo
 */
function setupFieldRealTimeValidation(fieldId, validatorFn, errorMessage) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Validazione on blur
    field.addEventListener('blur', () => {
        const value = field.value.trim();
        if (value && !validatorFn(value)) {
            showFieldError(fieldId, errorMessage);
        } else if (value) {
            clearFieldError(fieldId);
        }
    });
    
    // Validazione on input (se il campo ha già errori)
    field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) {
            const value = field.value.trim();
            if (validatorFn(value)) {
                clearFieldError(fieldId);
            }
        }
    });
}

/**
 * Setup validazione per password confirm
 */
function setupPasswordConfirmValidation(passwordFieldId, confirmFieldId) {
    const passwordField = document.getElementById(passwordFieldId);
    const confirmField = document.getElementById(confirmFieldId);
    
    if (!passwordField || !confirmField) return;
    
    const validateMatch = () => {
        const password = passwordField.value;
        const confirm = confirmField.value;
        
        if (confirm && password !== confirm) {
            showFieldError(confirmFieldId, 'Le password non coincidono');
        } else if (confirm) {
            clearFieldError(confirmFieldId);
        }
    };
    
    confirmField.addEventListener('blur', validateMatch);
    confirmField.addEventListener('input', () => {
        if (confirmField.classList.contains('is-invalid')) {
            validateMatch();
        }
    });
    
    // Rivalidata anche quando cambia la password principale
    passwordField.addEventListener('input', () => {
        if (confirmField.value && confirmField.classList.contains('is-invalid')) {
            validateMatch();
        }
    });
}

/**
 * Configura validazione in tempo reale per tutti i campi del modal
 */
export function setupRealTimeValidation() {
    // Validazione email login
    setupFieldRealTimeValidation(
        'modal-login-email',
        validateEmail,
        validators.email.message
    );
    
    // Validazione password login
    setupFieldRealTimeValidation(
        'modal-login-password',
        validatePassword,
        validators.password.message
    );
    
    // Validazione email registrazione
    setupFieldRealTimeValidation(
        'modal-signup-email',
        validateEmail,
        validators.email.message
    );
    
    // Validazione password registrazione
    setupFieldRealTimeValidation(
        'modal-signup-password',
        validatePassword,
        validators.password.message
    );
    
    // Validazione conferma password
    setupPasswordConfirmValidation(
        'modal-signup-password',
        'modal-signup-password-confirm'
    );
}

/**
 * Valida tutti i campi di un form
 */
export function validateForm(formElement) {
    if (!formElement) return false;
    
    let isValid = true;
    const fields = formElement.querySelectorAll('input[required]');
    
    fields.forEach(field => {
        const value = field.value.trim();
        let fieldValid = true;
        let errorMessage = '';
        
        // Check required
        if (!value) {
            fieldValid = false;
            errorMessage = `Il campo ${field.name || field.id} è obbligatorio`;
        } else {
            // Check tipo specifico
            switch (field.type) {
                case 'email':
                    if (!validateEmail(value)) {
                        fieldValid = false;
                        errorMessage = validators.email.message;
                    }
                    break;
                case 'password':
                    if (!validatePassword(value)) {
                        fieldValid = false;
                        errorMessage = validators.password.message;
                    }
                    break;
            }
        }
        
        if (!fieldValid) {
            showFieldError(field.id, errorMessage);
            isValid = false;
        } else {
            clearFieldError(field.id);
        }
    });
    
    return isValid;
}

/**
 * Aggiorna configurazione validatori
 */
export function updateValidators(newValidators) {
    Object.assign(validators, newValidators);
}

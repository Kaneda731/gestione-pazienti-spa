// src/features/patients/views/form-state.js

/**
 * Determina lo stato del form (creazione o modifica)
 * basandosi sulla sessionStorage.
 * @returns {{mode: ('create'|'edit'), patientId: string|null}}
 */
export function getFormState() {
    const patientId = sessionStorage.getItem('editPazienteId');

    if (patientId) {
        return {
            mode: 'edit',
            patientId: patientId,
        };
    }

    return {
        mode: 'create',
        patientId: null,
    };
}

/**
 * Pulisce lo stato del form dalla sessionStorage.
 */
export function clearFormState() {
    sessionStorage.removeItem('editPazienteId');
}
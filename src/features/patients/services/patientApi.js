// src/features/patients/services/patientApi.js

import { supabase } from "../../../core/services/supabase/supabaseClient.js";
import { logger } from "../../../core/services/logger/loggerService.js";

/**
 * Costruisce una query Supabase per i pazienti applicando filtri comuni.
 * @param {object} filters - Oggetto con i filtri da applicare.
 * @returns {object} - L'oggetto query di Supabase.
 */
const buildPatientsQuery = (filters = {}) => {
  let query = supabase
    .from("pazienti")
    .select("*", { count: "exact" })
    .not("user_id", "is", null);

  const { reparto, diagnosi, stato, search } = filters;

  if (reparto) query = query.eq("reparto_appartenenza", reparto);
  if (diagnosi) query = query.eq("diagnosi", diagnosi);
  if (stato === "attivo") query = query.is("data_dimissione", null);
  if (stato === "dimesso") query = query.not("data_dimissione", "is", null);

  if (search) {
    query = query.or(`nome.ilike.%${search}%,cognome.ilike.%${search}%`);
  }

  return query;
};

/**
 * Ottiene una lista paginata di pazienti.
 */
const getPaginatedPatients = async (filters = {}, pagination = {}) => {
  const {
    page = 0,
    limit = 10,
    sortColumn = "data_ricovero",
    sortDirection = "desc",
  } = pagination;

  let query = buildPatientsQuery(filters);

  const startIndex = page * limit;
  const endIndex = startIndex + limit - 1;

  query = query
    .order(sortColumn, { ascending: sortDirection === "asc" })
    .range(startIndex, endIndex);

  const { data, error, count } = await query;

  if (error) throw error;

  // Debug logging: trace codice_clinica values for external transfers
  try {
    const sample = (data || [])
      .filter(p => p && p.tipo_dimissione === 'trasferimento_esterno')
      .slice(0, 5)
      .map(p => ({ id: p.id, codice_clinica: p.codice_clinica }));
    logger.group('[patientApi.getPaginatedPatients] Result summary');
    logger.log({ total: data?.length || 0, count, externalTransfersSample: sample });
    logger.groupEnd();
  } catch (_) { /* no-op */ }

  return {
    patients: data || [],
    totalCount: count || 0,
  };
};

/**
 * Ottiene tutti i pazienti che corrispondono ai filtri (non paginato).
 */
const getAllPatients = async (filters = {}) => {
    const { sortColumn = "data_ricovero", sortDirection = "desc" } = filters;
    let query = buildPatientsQuery(filters);

    query = query.order(sortColumn, {
        ascending: sortDirection === "asc",
    });

    const { data, error } = await query;
    if (error) throw error;
    try {
        const withCodes = (data || [])
          .filter(p => p && p.tipo_dimissione === 'trasferimento_esterno')
          .slice(0, 5)
          .map(p => ({ id: p.id, codice_clinica: p.codice_clinica }));
        logger.group('[patientApi.getAllPatients] Result sample');
        logger.log({ total: data?.length || 0, externalTransfersSample: withCodes });
        logger.groupEnd();
    } catch (_) { /* no-op */ }
    return data || [];
};


/**
 * Ottiene un singolo paziente per ID.
 */
const getPatientById = async (id) => {
  const { data, error } = await supabase
    .from("pazienti")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  try {
    logger.log('[patientApi.getPatientById] Loaded', { id: data?.id, tipo_dimissione: data?.tipo_dimissione, codice_clinica: data?.codice_clinica || null });
  } catch (_) { /* no-op */ }
  return data;
};

/**
 * Crea un nuovo paziente.
 */
const createPatient = async (patientData) => {
  const { data, error } = await supabase
    .from("pazienti")
    .insert([patientData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Aggiorna un paziente esistente.
 */
const updatePatient = async (id, patientData) => {
  // Debug logging: payload being sent
  try {
    logger.group('[patientApi.updatePatient] Update payload');
    logger.log({ id, codice_clinica: patientData?.codice_clinica ?? null, tipo_dimissione: patientData?.tipo_dimissione ?? null });
    logger.groupEnd();
  } catch (_) { /* no-op */ }

  const { data, error } = await supabase
    .from("pazienti")
    .update(patientData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  try {
    logger.group('[patientApi.updatePatient] Update result');
    logger.log({ id: data?.id, tipo_dimissione: data?.tipo_dimissione ?? null, codice_clinica: data?.codice_clinica ?? null });
    logger.groupEnd();
  } catch (_) { /* no-op */ }
  return data;
};

/**
 * Elimina un paziente.
 */
const deletePatient = async (id) => {
  const { error } = await supabase.from("pazienti").delete().eq("id", id);
  if (error) throw error;
};

/**
 * Cerca pazienti per termine di ricerca.
 */
const searchPatients = async (searchTerm, activeOnly = false) => {
    let query = supabase
      .from("pazienti")
      .select(
        "id, nome, cognome, codice_rad, data_ricovero, diagnosi, reparto_appartenenza"
      )
      .not("user_id", "is", null)
      .or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%,codice_rad.ilike.%${searchTerm}%`)
      .order("cognome");

    if (activeOnly) {
      query = query.is("data_dimissione", null);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
}

/**
 * Ottiene i dati grezzi per le statistiche.
 */
const getStatsData = async () => {
    const { data, error } = await supabase
        .from("pazienti")
        .select("data_dimissione, diagnosi, reparto_appartenenza")
        .not("user_id", "is", null);

    if (error) throw error;
    return data || [];
}


export const patientApi = {
  getPaginatedPatients,
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getStatsData,
};

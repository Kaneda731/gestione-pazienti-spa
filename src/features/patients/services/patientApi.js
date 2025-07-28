// src/features/patients/services/patientApi.js

import { supabase } from "/src/core/services/supabaseClient.js";

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
  const { data, error } = await supabase
    .from("pazienti")
    .update(patientData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
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
        "id, nome, cognome, data_ricovero, diagnosi, reparto_appartenenza"
      )
      .not("user_id", "is", null)
      .or(`nome.ilike.%${searchTerm}%,cognome.ilike.%${searchTerm}%`)
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

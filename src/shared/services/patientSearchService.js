// Shared Patient Search Service
// Centralizes search logic across features (Eventi Clinici, Dimissione, Lista)
// Minimal stub: safe defaults, no breaking imports.

import { logger } from '@/core/services/logger/loggerService.js';
import { notificationService } from '@/core/services/notifications/notificationService.js';
import { patientService } from '@/features/patients/services/patientService.js';

// In-memory cache with TTL
const CACHE_TTL_MS = 45_000; // 45s default
const _cache = new Map(); // key -> { data, expiresAt }

function toSearchKey(term, activeOnly) {
  const t = (term || '').trim().toLowerCase();
  return `${t}::${activeOnly ? '1' : '0'}`;
}

function getFromCache(key) {
  const hit = _cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCache(key, data, ttlMs = CACHE_TTL_MS) {
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Normalization util (keeps shape stable for UI consumers)
function normalizePatients(patients = []) {
  return patients.map(p => ({
    id: p.id,
    nome: p.nome,
    cognome: p.cognome,
    codice_rad: p.codice_rad,
    stato: p.stato ?? p.status ?? null,
    nomeCompleto: [p.cognome, p.nome].filter(Boolean).join(' '),
  }));
}

async function search(term, { activeOnly = false, limit = 20, signal } = {}) {
  try {
    const key = toSearchKey(term, activeOnly);
    const cached = getFromCache(key);
    if (cached) {
      logger?.log?.('🔍 patientSearchService cache hit', { term, activeOnly, count: cached.length });
      return cached;
    }

    const results = await patientService.searchPatients(term, activeOnly);
    const normalized = normalizePatients(Array.isArray(results) ? results.slice(0, limit) : []);
    setCache(key, normalized);
    return normalized;
  } catch (error) {
    logger?.error?.('❌ patientSearchService.search error', error);
    notificationService?.error?.(`Errore ricerca pazienti: ${error.message || error}`);
    throw error;
  }
}

// Realtime style search with debounce handled by caller if needed later.
// Here we implement a simple cancellable pattern using AbortController if passed.
function searchRealtime(term, { activeOnly = false, debounceMs = 250, onUpdate, onError } = {}) {
  let aborted = false;
  const handle = setTimeout(async () => {
    if (aborted) return;
    try {
      const data = await search(term, { activeOnly });
      if (!aborted) onUpdate?.(data);
    } catch (err) {
      if (!aborted) onError?.(err);
    }
  }, Math.max(0, debounceMs));

  return {
    cancel() {
      aborted = true;
      clearTimeout(handle);
    },
  };
}

export const patientSearchService = {
  search,
  searchRealtime,
  // Expose small helpers in case of custom UIs
  _normalize: normalizePatients,
};

export default patientSearchService;

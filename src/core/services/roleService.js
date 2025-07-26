// src/core/services/roleService.js

/**
 * Servizio per la gestione dei ruoli utente
 * Gestisce viewer, editor, admin permissions
 */

import { supabase } from '/src/core/services/supabaseClient.js';
import { logger } from '/src/core/services/loggerService.js';

class RoleService {
  constructor() {
    this.currentUserRole = null;
    this.roleCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minuti
  }

  /**
   * Ottiene il ruolo dell'utente corrente
   */
  async getCurrentUserRole() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utente non autenticato');
      }

      // Controlla cache
      const cacheKey = `role_${user.id}`;
      const cached = this.roleCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        this.currentUserRole = cached.role;
        return cached.role;
      }

      // Ottieni ruolo dal database
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        logger.warn('Errore nel caricamento ruolo utente:', error);
        // Default a viewer se non trovato
        this.currentUserRole = 'viewer';
        return 'viewer';
      }

      const role = data?.role || 'viewer';
      
      // Aggiorna cache
      this.roleCache.set(cacheKey, {
        role,
        timestamp: Date.now()
      });

      this.currentUserRole = role;
      return role;
    } catch (error) {
      logger.error('Errore nel caricamento ruolo:', error);
      this.currentUserRole = 'viewer';
      return 'viewer';
    }
  }

  /**
   * Verifica se l'utente ha un ruolo specifico o superiore
   */
  async hasRoleOrHigher(requiredRole) {
    const userRole = await this.getCurrentUserRole();
    return this.compareRoles(userRole, requiredRole);
  }

  /**
   * Confronta due ruoli per determinare la gerarchia
   */
  compareRoles(userRole, requiredRole) {
    const roleHierarchy = {
      'viewer': 1,
      'editor': 2,
      'admin': 3
    };

    const userLevel = roleHierarchy[userRole] || 1;
    const requiredLevel = roleHierarchy[requiredRole] || 1;

    return userLevel >= requiredLevel;
  }

  /**
   * Verifica se l'utente può leggere
   */
  async canRead() {
    return await this.hasRoleOrHigher('viewer');
  }

  /**
   * Verifica se l'utente può scrivere (creare/modificare)
   */
  async canWrite() {
    return await this.hasRoleOrHigher('editor');
  }

  /**
   * Verifica se l'utente può eliminare
   */
  async canDelete() {
    return await this.hasRoleOrHigher('admin');
  }

  /**
   * Verifica se l'utente è admin
   */
  async isAdmin() {
    const role = await this.getCurrentUserRole();
    return role === 'admin';
  }

  /**
   * Verifica se l'utente è editor o admin
   */
  async isEditorOrAdmin() {
    return await this.hasRoleOrHigher('editor');
  }

  /**
   * Ottiene tutti gli utenti con i loro ruoli (solo per admin)
   */
  async getAllUsersWithRoles() {
    if (!await this.isAdmin()) {
      throw new Error('Solo gli admin possono visualizzare tutti gli utenti');
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          role,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Errore nel caricamento utenti:', error);
      throw error;
    }
  }

  /**
   * Aggiorna il ruolo di un utente (solo per admin)
   */
  async updateUserRole(userId, newRole) {
    if (!await this.isAdmin()) {
      throw new Error('Solo gli admin possono modificare i ruoli');
    }

    const validRoles = ['viewer', 'editor', 'admin'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Ruolo non valido. Ruoli validi: ${validRoles.join(', ')}`);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      // Invalida cache per questo utente
      this.roleCache.delete(`role_${userId}`);

      logger.log(`Ruolo aggiornato per utente ${userId}: ${newRole}`);
      return data;
    } catch (error) {
      logger.error('Errore nell\'aggiornamento ruolo:', error);
      throw error;
    }
  }

  /**
   * Crea o aggiorna il profilo utente con ruolo
   */
  async ensureUserProfile(userId, role = 'viewer') {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          role: role
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) throw error;

      // Invalida cache
      this.roleCache.delete(`role_${userId}`);

      return data;
    } catch (error) {
      logger.error('Errore nella creazione profilo:', error);
      throw error;
    }
  }

  /**
   * Ottiene le statistiche dei ruoli (solo per admin)
   */
  async getRoleStats() {
    if (!await this.isAdmin()) {
      throw new Error('Solo gli admin possono visualizzare le statistiche');
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role');

      if (error) throw error;

      const stats = {
        total: data.length,
        viewer: 0,
        editor: 0,
        admin: 0,
        undefined: 0
      };

      data.forEach(profile => {
        const role = profile.role || 'undefined';
        stats[role] = (stats[role] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Errore nel caricamento statistiche ruoli:', error);
      throw error;
    }
  }

  /**
   * Invalida la cache dei ruoli
   */
  invalidateCache() {
    this.roleCache.clear();
    this.currentUserRole = null;
  }

  /**
   * Ottiene il ruolo corrente dalla cache (senza query al DB)
   */
  getCachedRole() {
    return this.currentUserRole;
  }

  /**
   * Verifica i permessi per un'azione specifica
   */
  async checkPermission(action, resource = null) {
    const role = await this.getCurrentUserRole();
    
    const permissions = {
      // Permessi di lettura
      'read_patients': ['viewer', 'editor', 'admin'],
      'read_events': ['viewer', 'editor', 'admin'],
      'read_profiles': ['admin'],
      
      // Permessi di scrittura
      'create_patients': ['editor', 'admin'],
      'update_patients': ['editor', 'admin'],
      'create_events': ['editor', 'admin'],
      'update_events': ['editor', 'admin'],
      
      // Permessi di eliminazione
      'delete_patients': ['admin'],
      'delete_events': ['admin'],
      
      // Permessi di gestione
      'manage_roles': ['admin'],
      'view_all_users': ['admin']
    };

    const allowedRoles = permissions[action] || [];
    return allowedRoles.includes(role);
  }

  /**
   * Middleware per verificare i permessi
   */
  requirePermission(action) {
    return async (req, res, next) => {
      try {
        const hasPermission = await this.checkPermission(action);
        if (!hasPermission) {
          throw new Error(`Permesso negato per l'azione: ${action}`);
        }
        next();
      } catch (error) {
        throw error;
      }
    };
  }
}

// Esporta istanza singleton
export const roleService = new RoleService();

// Funzioni di utilità per uso rapido
export const canRead = () => roleService.canRead();
export const canWrite = () => roleService.canWrite();
export const canDelete = () => roleService.canDelete();
export const isAdmin = () => roleService.isAdmin();
export const getCurrentRole = () => roleService.getCurrentUserRole();
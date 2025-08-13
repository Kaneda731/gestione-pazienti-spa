// __tests__/integration/features/eventi-clinici/eventi-clinici-filtering.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Setup mocks before imports
vi.mock(
  "../../../../src/features/eventi-clinici/services/eventiCliniciService.js",
  () => ({
    eventiCliniciService: {
      getAllEventi: vi.fn().mockResolvedValue({
        eventi: [],
        totalCount: 0,
        currentPage: 0,
        totalPages: 0,
      }),
      getEventiByPaziente: vi.fn(),
      createEvento: vi.fn(),
      updateEvento: vi.fn(),
      deleteEvento: vi.fn(),
      searchPazienti: vi.fn(),
      getGiorniPostOperatori: vi.fn(),
      getEventiStats: vi.fn(),
    },
  })
);

vi.mock("../../../../src/core/services/loggerService.js", () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../../../src/core/services/notificationService.js", () => ({
  notificationService: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../../../src/core/services/stateService.js", () => ({
  stateService: {
    setState: vi.fn(),
    getState: vi.fn().mockReturnValue(null),
    subscribe: vi.fn(() => () => {}),
    updateEventiCliniciFilters: vi.fn(),
    getEventiCliniciFilters: vi.fn(),
    resetEventiCliniciFilters: vi.fn(),
  },
}));

// Mock supabase client
vi.mock("../../../../src/core/services/supabaseClient.js", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
            })),
          })),
        })),
      })),
    })),
  },
}));

// Import after mocks
import {
  applyCombinedFilters,
  getSuggestedFilters,
  applySorting,
  exportFilteredEvents,
  saveFiltersToState,
  loadFiltersFromState,
  resetFiltersAndState,
  getFilterStats,
  getCurrentFilters,
} from "../../../../src/features/eventi-clinici/views/eventi-clinici-api.js";

import { eventiCliniciService } from "../../../../src/features/eventi-clinici/services/eventiCliniciService.js";
import { logger } from "../../../../src/core/services/loggerService.js";
import { notificationService } from "../../../../src/core/services/notificationService.js";
import { stateService } from "../../../../src/core/services/stateService.js";

describe("Eventi Clinici Comprehensive Filtering System", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset DOM
    document.body.innerHTML = "";

    // Mock URL and Blob for export tests
    global.URL = {
      createObjectURL: vi.fn(() => "mock-url"),
      revokeObjectURL: vi.fn(),
    };

    global.Blob = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
    delete global.URL;
    delete global.Blob;
  });

  describe("applyCombinedFilters", () => {
    it("should apply multiple filters simultaneously", async () => {
      const mockResponse = {
        eventi: [
          {
            id: "1",
            tipo_evento: "intervento",
            data_evento: "2024-01-15",
            tipo_intervento: "Chirurgia Ortopedica",
            pazienti: {
              id: "p1",
              nome: "Mario",
              cognome: "Rossi",
              reparto_appartenenza: "Ortopedia",
            },
          },
        ],
        totalCount: 1,
        currentPage: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      eventiCliniciService.getAllEventi.mockResolvedValue(mockResponse);

      const filters = {
        tipo_evento: "intervento",
        tipo_intervento: "Chirurgia Ortopedica",
        reparto: "Ortopedia",
        data_da: "2024-01-01",
        data_a: "2024-01-31",
      };

      const result = await applyCombinedFilters(filters);

      expect(eventiCliniciService.getAllEventi).toHaveBeenCalledWith(
        expect.objectContaining(filters),
        { page: 0, limit: 10 }
      );

      expect(result.eventi).toHaveLength(1);
      expect(result.eventi[0].tipo_evento).toBe("intervento");
      expect(result.eventi[0].tipo_intervento).toBe("Chirurgia Ortopedica");
    });

    it("should validate filter combinations", async () => {
      const invalidFilters = {
        data_da: "2024-01-31",
        data_a: "2024-01-01", // End date before start date
      };

      await expect(applyCombinedFilters(invalidFilters)).rejects.toThrow(
        "La data di inizio non può essere successiva alla data di fine"
      );
    });

    it("should validate type-specific filters", async () => {
      const invalidFilters = {
        tipo_evento: "infezione",
        tipo_intervento: "Chirurgia Ortopedica", // Intervention type with infection event
      };

      await expect(applyCombinedFilters(invalidFilters)).rejects.toThrow(
        "Il filtro tipo intervento può essere usato solo con eventi di tipo intervento"
      );
    });

    it("should validate future dates", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidFilters = {
        data_da: futureDate.toISOString().split("T")[0],
      };

      await expect(applyCombinedFilters(invalidFilters)).rejects.toThrow(
        "La data di inizio non può essere nel futuro"
      );
    });

    it("should validate date range not exceeding 2 years", async () => {
      const invalidFilters = {
        data_da: "2020-01-01",
        data_a: "2023-01-01", // More than 2 years
      };

      await expect(applyCombinedFilters(invalidFilters)).rejects.toThrow(
        "Il range di date non può superare i 2 anni"
      );
    });
  });

  describe("getSuggestedFilters", () => {
    it("should fetch filter suggestions from database", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              not: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { tipo_intervento: "Chirurgia Ortopedica" },
                      { tipo_intervento: "Chirurgia Plastica" },
                    ],
                  })
                ),
              })),
            })),
          })),
        })),
      };

      // Mock dynamic import
      vi.doMock("../../../../src/core/services/supabaseClient.js", () => ({
        supabase: mockSupabase,
      }));

      const suggestions = await getSuggestedFilters();

      expect(suggestions).toHaveProperty("tipiIntervento");
      expect(suggestions).toHaveProperty("agentiPatogeni");
      expect(suggestions).toHaveProperty("reparti");
      expect(Array.isArray(suggestions.tipiIntervento)).toBe(true);
    });

    it("should handle database errors gracefully", async () => {
      // Mock failed supabase import
      vi.doMock("../../../../src/core/services/supabaseClient.js", () => {
        throw new Error("Database connection failed");
      });

      const suggestions = await getSuggestedFilters();

      expect(suggestions).toEqual({
        tipiIntervento: [],
        agentiPatogeni: [],
        reparti: [],
      });
    });
  });

  describe("applySorting", () => {
    it("should apply sorting to results", async () => {
      const mockResponse = {
        eventi: [
          { id: "1", data_evento: "2024-01-15" },
          { id: "2", data_evento: "2024-01-10" },
        ],
        totalCount: 2,
        currentPage: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      eventiCliniciService.getAllEventi.mockResolvedValue(mockResponse);

      const result = await applySorting("data_evento", "asc");

      expect(eventiCliniciService.getAllEventi).toHaveBeenCalledWith(
        expect.objectContaining({
          sortColumn: "data_evento",
          sortDirection: "asc",
        }),
        { page: 0, limit: 10 }
      );

      expect(result.eventi).toHaveLength(2);
    });

    it("should validate sort column", async () => {
      await expect(applySorting("invalid_column", "asc")).rejects.toThrow(
        "Colonna di ordinamento non valida: invalid_column"
      );
    });

    it("should validate sort direction", async () => {
      await expect(applySorting("data_evento", "invalid")).rejects.toThrow(
        "Direzione di ordinamento non valida: invalid"
      );
    });
  });

  describe("exportFilteredEvents", () => {
    beforeEach(() => {
      // Mock DOM methods for export
      document.createElement = vi.fn(() => ({
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: { visibility: "" },
        download: true,
      }));

      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();
    });

    it("should export events in CSV format", async () => {
      const mockEvents = [
        {
          id: "1",
          tipo_evento: "intervento",
          data_evento: "2024-01-15",
          descrizione: "Test intervention",
          pazienti: {
            nome: "Mario",
            cognome: "Rossi",
            reparto_appartenenza: "Ortopedia",
          },
          tipo_intervento: "Chirurgia Ortopedica",
          created_at: "2024-01-15T10:00:00Z",
        },
      ];

      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: mockEvents,
        totalCount: 1,
      });

      const result = await exportFilteredEvents("csv");

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.filename).toMatch(/eventi_clinici_\d{4}-\d{2}-\d{2}\.csv/);
      expect(global.Blob).toHaveBeenCalledWith(expect.any(Array), {
        type: "text/csv;charset=utf-8;",
      });
    });

    it("should export events in JSON format", async () => {
      const mockEvents = [
        {
          id: "1",
          tipo_evento: "intervento",
          data_evento: "2024-01-15",
        },
      ];

      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: mockEvents,
        totalCount: 1,
      });

      const result = await exportFilteredEvents("json");

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.filename).toMatch(/eventi_clinici_\d{4}-\d{2}-\d{2}\.json/);
      expect(global.Blob).toHaveBeenCalledWith(expect.any(Array), {
        type: "application/json;charset=utf-8;",
      });
    });

    it("should handle empty results", async () => {
      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: [],
        totalCount: 0,
      });

      await expect(exportFilteredEvents("csv")).rejects.toThrow(
        "Nessun evento da esportare con i filtri correnti"
      );
    });

    it("should handle unsupported format", async () => {
      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: [{ id: "1" }],
        totalCount: 1,
      });

      await expect(exportFilteredEvents("xml")).rejects.toThrow(
        "Formato di esportazione non supportato: xml"
      );
    });
  });

  describe("Filter State Persistence", () => {
    it("should save filters to state service", async () => {
      // Mock dynamic import
      vi.doMock("../../../../src/core/services/stateService.js", () => ({
        stateService: {
          setState: vi.fn(),
        },
      }));

      await saveFiltersToState();

      // Since it's a dynamic import, we can't directly test the call
      // but we can verify no errors are thrown
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should load filters from state service", async () => {
      const mockFilters = {
        tipo_evento: "intervento",
        data_da: "2024-01-01",
        reparto: "Ortopedia",
      };

      // Mock the dynamic import
      vi.doMock("../../../../src/core/services/stateService.js", () => ({
        stateService: {
          getState: vi.fn().mockReturnValue(mockFilters),
        },
      }));

      const result = await loadFiltersFromState();

      // The function merges saved filters with current filters, so we check that saved filters are included
      expect(result).toMatchObject(mockFilters);
      expect(result.tipo_evento).toBe("intervento");
      expect(result.data_da).toBe("2024-01-01");
      expect(result.reparto).toBe("Ortopedia");
    });

    it("should handle missing saved filters", async () => {
      stateService.getState.mockReturnValue(null);

      const result = await loadFiltersFromState();

      expect(result).toHaveProperty("paziente_search");
      expect(result).toHaveProperty("tipo_evento");
      expect(result).toHaveProperty("sortColumn");
    });

    it("should reset filters and clear state", async () => {
      const mockResponse = {
        eventi: [],
        totalCount: 0,
        currentPage: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };

      eventiCliniciService.getAllEventi.mockResolvedValue(mockResponse);

      // Mock the dynamic import
      vi.doMock("../../../../src/core/services/stateService.js", () => ({
        stateService: {
          setState: vi.fn(),
        },
      }));

      const result = await resetFiltersAndState();

      expect(result.eventi).toEqual([]);
    });
  });

  describe("getFilterStats", () => {
    it("should calculate filter statistics", async () => {
      // Mock total count (no filters)
      eventiCliniciService.getAllEventi
        .mockResolvedValueOnce({ eventi: [], totalCount: 100 }) // Total
        .mockResolvedValueOnce({ eventi: [], totalCount: 25 }); // Filtered

      const stats = await getFilterStats();

      expect(stats.totalEvents).toBe(100);
      expect(stats.filteredEvents).toBe(25);
      expect(stats.filterEfficiency).toBe("75.0");
    });

    it("should handle zero total events", async () => {
      eventiCliniciService.getAllEventi
        .mockResolvedValueOnce({ eventi: [], totalCount: 0 })
        .mockResolvedValueOnce({ eventi: [], totalCount: 0 });

      const stats = await getFilterStats();

      expect(stats.totalEvents).toBe(0);
      expect(stats.filteredEvents).toBe(0);
      expect(stats.filterEfficiency).toBe(0);
    });

    it("should count active filters correctly", async () => {
      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: [],
        totalCount: 50,
      });

      // Set some filters
      await applyCombinedFilters({
        tipo_evento: "intervento",
        reparto: "Ortopedia",
        data_da: "2024-01-01",
      });

      const stats = await getFilterStats();

      expect(stats.activeFiltersCount).toBe(3);
      expect(stats.activeFilters).toHaveLength(3);
    });
  });

  describe("Filter Validation Edge Cases", () => {
    it("should handle empty filter values", async () => {
      const filters = {
        paziente_search: "",
        tipo_evento: "",
        data_da: "",
        data_a: "",
        reparto: "",
      };

      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: [],
        totalCount: 0,
      });

      const result = await applyCombinedFilters(filters);
      expect(result.eventi).toEqual([]);
    });

    it("should handle whitespace-only filter values", async () => {
      const filters = {
        paziente_search: "   ",
        tipo_evento: "infezione", // Add valid event type for pathogen filter
        agente_patogeno: "\t\n",
      };

      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: [],
        totalCount: 0,
      });

      const result = await applyCombinedFilters(filters);
      expect(result.eventi).toEqual([]);
    });

    it("should validate pathogen filter with infection type", async () => {
      const validFilters = {
        tipo_evento: "infezione",
        agente_patogeno: "E. coli",
      };

      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: [],
        totalCount: 0,
      });

      // Should not throw error
      await expect(applyCombinedFilters(validFilters)).resolves.toBeDefined();
    });
  });

  describe("CSV Generation", () => {
    it("should generate proper CSV format", async () => {
      const mockEvents = [
        {
          id: "1",
          tipo_evento: "intervento",
          data_evento: "2024-01-15",
          descrizione: 'Test "quoted" description',
          pazienti: {
            nome: "Mario",
            cognome: "Rossi",
            reparto_appartenenza: "Ortopedia",
          },
          tipo_intervento: "Chirurgia Ortopedica",
          created_at: "2024-01-15T10:00:00Z",
        },
      ];

      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: mockEvents,
        totalCount: 1,
      });

      await exportFilteredEvents("csv");

      const csvCall = global.Blob.mock.calls[0][0][0];

      // Check CSV headers
      expect(csvCall).toContain("ID,Tipo Evento,Data Evento,Paziente,Reparto");

      // Check CSV data
      expect(csvCall).toContain(
        '1,intervento,2024-01-15,"Mario Rossi",Ortopedia'
      );

      // Check quote escaping
      expect(csvCall).toContain('"Test ""quoted"" description"');
    });

    it("should handle missing patient data in CSV", async () => {
      const mockEvents = [
        {
          id: "1",
          tipo_evento: "intervento",
          data_evento: "2024-01-15",
          // No pazienti data
          created_at: "2024-01-15T10:00:00Z",
        },
      ];

      eventiCliniciService.getAllEventi.mockResolvedValue({
        eventi: mockEvents,
        totalCount: 1,
      });

      await exportFilteredEvents("csv");

      const csvCall = global.Blob.mock.calls[0][0][0];
      expect(csvCall).toContain("1,intervento,2024-01-15,,");
    });
  });

  describe("Error Handling", () => {
    it("should handle service errors in combined filters", async () => {
      eventiCliniciService.getAllEventi.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(applyCombinedFilters({})).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle service errors in export", async () => {
      eventiCliniciService.getAllEventi.mockRejectedValue(
        new Error("Export failed")
      );

      await expect(exportFilteredEvents("csv")).rejects.toThrow(
        "Export failed"
      );
    });

    it("should handle state service errors gracefully", async () => {
      stateService.getState.mockImplementation(() => {
        throw new Error("State service error");
      });

      const result = await loadFiltersFromState();

      // Should return default filters instead of throwing
      expect(result).toHaveProperty("paziente_search");
      expect(logger.error).toHaveBeenCalledWith(
        "❌ Errore caricamento filtri:",
        expect.any(Error)
      );
    });
  });
});

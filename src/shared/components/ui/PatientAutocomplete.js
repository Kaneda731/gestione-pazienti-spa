// Shared UI component: PatientAutocomplete
// Provides attach/destroy over an input + results container, uses patientSearchService

import { patientSearchService } from '@/shared/services/patientSearchService.js';
import { EmptyState } from '@/shared/components/ui/EmptyState.js';
import { debounce, highlight } from '@/shared/utils/searchUtils.js';
import { logger } from '@/core/services/logger/loggerService.js';

export class PatientAutocomplete {
  constructor({ input, resultsContainer, onSelect, activeOnly = false, minChars = 2, debounceMs = 250 } = {}) {
    this.input = input;
    this.results = resultsContainer;
    this.onSelect = onSelect;
    this.activeOnly = !!activeOnly;
    this.minChars = Math.max(0, minChars);
    this.debounceMs = Math.max(0, debounceMs);
    this._cleanup = [];
    this._currentCancel = null;
  }

  attach() {
    if (!this.input || !this.results) return { destroy: () => {} };
    this.results.style.display = 'none';
    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('aria-autocomplete', 'list');

    const onInput = debounce(async (e) => {
      const term = (e.target.value || '').trim();
      if (term.length < this.minChars) {
        this._clearResults();
        return;
      }
      this._showLoading();
      try {
        const data = await patientSearchService.search(term, { activeOnly: this.activeOnly });
        this._renderList(data, term);
      } catch (err) {
        logger.error('PatientAutocomplete search error', err);
        this._renderEmpty(`Errore durante la ricerca.`);
      }
    }, this.debounceMs);

    const onFocus = () => {
      if (this.results.childElementCount > 0) this._open();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') this._close();
    };

    const onBlur = (e) => {
      // Close after a tick to allow click on result
      setTimeout(() => this._close(), 100);
    };

    this.input.addEventListener('input', onInput);
    this.input.addEventListener('focus', onFocus);
    this.input.addEventListener('keydown', onKeyDown);
    this.input.addEventListener('blur', onBlur);

    this._cleanup.push(() => this.input.removeEventListener('input', onInput));
    this._cleanup.push(() => this.input.removeEventListener('focus', onFocus));
    this._cleanup.push(() => this.input.removeEventListener('keydown', onKeyDown));
    this._cleanup.push(() => this.input.removeEventListener('blur', onBlur));

    return { destroy: () => this.destroy() };
  }

  destroy() {
    this._cleanup.forEach(fn => fn());
    this._cleanup = [];
    this._clearResults();
  }

  _clearResults() {
    this.results.innerHTML = '';
    this.results.style.display = 'none';
  }

  _open() {
    this.results.style.display = 'block';
  }

  _close() {
    this.results.style.display = 'none';
  }

  _showLoading() {
    this.results.innerHTML = `
      <div class="px-3 py-2 text-muted small d-flex align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
        <span>Ricerca in corso...</span>
      </div>`;
    this._open();
  }

  _renderEmpty(desc = 'Nessun risultato') {
    const empty = EmptyState.forSearchResults(this.input.value || '');
    empty.options.description = desc || empty.options.description;
    this.results.innerHTML = `<div class="px-2">${empty.render()}</div>`;
    this._open();
  }

  _renderList(items = [], term = '') {
    if (!items.length) {
      this._renderEmpty();
      return;
    }
    const listHtml = items.map((p, idx) => {
      const label = highlight(`${p.cognome || ''} ${p.nome || ''}`.trim(), term);
      const rad = p.codice_rad ? highlight(`RAD: ${p.codice_rad}`, term) : '';
      const subtitle = rad ? `<small class="text-muted">${rad}</small>` : '';
      return `
        <button type="button" class="dropdown-item d-flex flex-column" data-id="${p.id}">
          <span>${label}</span>
          ${subtitle}
        </button>`;
    }).join('');

    this.results.innerHTML = listHtml;
    this._open();

    // Bind clicks
    Array.from(this.results.querySelectorAll('.dropdown-item')).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const match = items.find(x => String(x.id) === String(id));
        if (match) {
          const name = `${match.cognome || ''} ${match.nome || ''}`.trim();
          this.input.value = name;
          this.input.dataset.patientId = match.id;
          this._close();
          this.onSelect?.(match);
        }
      });
    });
  }
}

export function attach(options) {
  const comp = new PatientAutocomplete(options);
  return comp.attach();
}

export default PatientAutocomplete;

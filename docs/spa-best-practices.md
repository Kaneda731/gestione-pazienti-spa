# SPA Best Practices Knowledge Base

Questo documento raccoglie best practice autorevoli e framework-agnostiche per lo sviluppo di Single Page Applications (SPA) come `gestione-pazienti-spa`.

## Indice
- Performance
- Security
- Accessibilità (A11y)
- Architettura / Micro‑frontend
- Testing
- Checklist rapida

## Performance
Fonti principali:
- Preact PWA performance tips (Code splitting, SW caching, PRPL, Lighthouse)
  - https://github.com/preactjs/preact-www/blob/master/content/en/guide/v8/progressive-web-apps.md#performance-tips
- Rspack glossary (bundle splitting, code splitting, tree shaking)
  - https://github.com/web-infra-dev/rspack/blob/main/website/docs/en/misc/glossary.mdx#bundle-splitting
- Core Web Vitals e Lighthouse
  - https://svelte.dev/docs/kit/seo#Out-of-the-box-Performance

Linee guida:
- Code splitting per route/feature + lazy loading. Preferire async chunks; sfruttare tree shaking.
- Service Worker caching per asset statici e (se sicuro) per risposte API; valutare offline‑first.
- Pattern PRPL: Preload/PUSH risorse critiche → Render veloce route iniziale → Pre‑cache route successive → Lazy‑load resto.
- Monitorare CWV (LCP, INP, CLS). Eseguire Lighthouse localmente e in CI, definire budget di bundle/regressioni.

## Security
Fonti principali:
- OWASP XSS Prevention Cheat Sheet
  - https://github.com/owasp/cheatsheetseries/blob/master/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.md
- OWASP Content Security Policy Cheat Sheet
  - https://github.com/owasp/cheatsheetseries/blob/master/cheatsheets/Content_Security_Policy_Cheat_Sheet.md
- MDN CORS
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS

Linee guida:
- Prevenzione XSS: encoding contestuale, sanitizzazione HTML (es. DOMPurify) quando si rende HTML dinamico; evitare sink insicuri (`innerHTML`, `eval`, handler inline).
- CSP “strict”: `script-src` con nonce/hash + `strict-dynamic`, `object-src 'none'`, `base-uri 'none'`. Evitare inline script/style.
- CORS lato API: origin/headers/methods minimali; non usare `*` con credenziali; validare input; patchare dipendenze.
- Cookie: `Secure`, `HttpOnly`, `SameSite` appropriato. Evitare storage di segreti nel client.

## Accessibilità (A11y)
Fonti principali:
- Cypress Accessibility Testing (axe integration, strategie)
  - https://docs.cypress.io/app/guides/accessibility-testing
- Focus management su route change (rilevante per tutte le SPA)
  - https://github.com/ember-learn/guides-source/blob/master/guides/v5.0.0/accessibility/page-template-considerations.md#focus-management

Linee guida:
- Navigazione client: spostare il focus su `main`/`h1` alla variazione route; usare `aria-live` dove serve.
- Preferire HTML semantico (es. `<button>` vs `div role="button"`). Testare tastiera (Tab/Shift+Tab/Enter/Space).
- Automatizzare scansioni (axe) + asserzioni esplicite su ruoli/nome accessibile/label/contrasto.

## Architettura / Micro‑frontend
Fonte:
- single‑spa overview (coexist, lazy load)
  - https://github.com/single-spa/single-spa#single-spa

Linee guida:
- Valutare micro‑frontend solo se motivato (autonomia team, deploy indipendenti, boundary chiari). Altrimenti monolite per semplicità.

## Testing
Fonti principali:
- Cypress best practices e testing types
  - https://docs.cypress.io/app/core-concepts/best-practices
  - https://docs.cypress.io/app/core-concepts/testing-types

Linee guida:
- Piramide: unit + component + e2e essenziali. 
- Selettori stabili (`data-*`) per E2E; Testing Library solo se compreso impatto su stabilità.
- Aggiungere test A11y principali per form/flow critici. Ridurre ridondanza delle scansioni.

## Checklist rapida (da usare nelle PR)
- Performance
  - [ ] Route/feature split e lazy load applicati
  - [ ] Bundle size e CWV senza regressioni; Lighthouse ok
  - [ ] SW caching configurato (se previsto) e sicuro
- Security
  - [ ] Niente `innerHTML` non sanitizzato; usare DOMPurify quando serve
  - [ ] CSP strict (nonce/hash) applicata/valutata; niente inline script/style
  - [ ] CORS minimizzato; niente wildcard con credenziali
- Accessibilità
  - [ ] Focus gestito al cambio pagina; tastiera ok
  - [ ] Ruoli/nome accessibile/label corretti; axe scan principale
- Testing
  - [ ] Test unit/component/e2e aggiornati; selettori stabili

---
Aggiorna questo documento con note specifiche del progetto quando introduci nuove decisioni architetturali o policy.

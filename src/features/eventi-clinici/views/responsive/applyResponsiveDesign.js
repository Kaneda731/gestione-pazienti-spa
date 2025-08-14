// src/features/eventi-clinici/views/responsive/applyResponsiveDesign.js
// Pure responsive logic that operates on provided DOM elements

/**
 * Apply responsive design based on current window size.
 * This function is pure w.r.t. inputs (uses only provided domElements and global document/window).
 * @param {{
 *   tableContainer?: HTMLElement,
 *   timelineContainer?: HTMLElement,
 * }} domElements
 */
export function coreApplyResponsiveDesign(domElements = {}) {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;
  const useTable = window.innerWidth >= 1200;

  if (domElements.tableContainer) {
    domElements.tableContainer.style.display = useTable ? 'block' : 'none';
  }

  if (domElements.timelineContainer) {
    domElements.timelineContainer.style.display = useTable ? 'none' : 'block';
    domElements.timelineContainer.classList.toggle('mobile-layout', isMobile);
    domElements.timelineContainer.classList.toggle('tablet-layout', isTablet);
  }

  const eventCards = document.querySelectorAll('.timeline-event-card');
  eventCards.forEach((card) => {
    card.classList.toggle('mobile-card', isMobile);
    card.classList.toggle('tablet-card', isTablet);
  });
}

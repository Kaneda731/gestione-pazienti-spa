/**
 * Helper DOM compatibili con jsdom
 */

import { vi } from 'vitest';

/**
 * Crea un elemento DOM reale usando jsdom
 */
export function createJSDOMElement(tagName = 'div', properties = {}) {
  const element = document.createElement(tagName);
  
  // Applica proprietà
  Object.entries(properties).forEach(([key, value]) => {
    if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  return element;
}

/**
 * Simula eventi DOM in modo compatibile con jsdom
 */
export function simulateJSDOMEvent(element, eventType, eventData = {}) {
  const event = new Event(eventType, {
    bubbles: true,
    cancelable: true,
    ...eventData
  });
  
  // Aggiungi proprietà personalizzate
  Object.entries(eventData).forEach(([key, value]) => {
    if (key !== 'bubbles' && key !== 'cancelable') {
      Object.defineProperty(event, key, {
        value,
        writable: true
      });
    }
  });
  
  element.dispatchEvent(event);
  return event;
}

/**
 * Simula click compatibile con jsdom
 */
export function simulateJSDOMClick(element, options = {}) {
  return simulateJSDOMEvent(element, 'click', {
    button: 0,
    buttons: 1,
    clientX: 0,
    clientY: 0,
    ...options
  });
}

/**
 * Simula input change compatibile con jsdom
 */
export function simulateJSDOMChange(element, value, options = {}) {
  if (element.value !== undefined) {
    element.value = value;
  }
  
  return simulateJSDOMEvent(element, 'change', {
    target: element,
    ...options
  });
}

/**
 * Aspetta che un elemento appaia nel DOM
 */
export async function waitForJSDOMElement(selector, container = document, timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = container.querySelector(selector);
    if (element) {
      return element;
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

/**
 * Cleanup DOM per test
 */
export function cleanupJSDOM() {
  // Rimuovi tutti i figli dal body
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  
  // Reset attributi body
  document.body.className = '';
  document.body.style.cssText = '';
}

/**
 * Mock viewport per test responsive
 */
export function mockJSDOMViewport(width, height) {
  // jsdom non supporta window.innerWidth/Height nativamente
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
}

/**
 * Preset viewport comuni
 */
export const viewportPresets = {
  mobile: () => mockJSDOMViewport(375, 667),
  tablet: () => mockJSDOMViewport(768, 1024),
  desktop: () => mockJSDOMViewport(1920, 1080)
};
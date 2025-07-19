/**
 * Mock DOM utilities per test
 */

import { vi } from 'vitest';

/**
 * Crea mock element DOM con proprietà e metodi comuni
 */
export function createMockElement(tagName = 'div', properties = {}) {
  const element = {
    // Basic properties
    tagName: tagName.toUpperCase(),
    nodeName: tagName.toUpperCase(),
    nodeType: 1, // ELEMENT_NODE
    id: '',
    className: '',
    innerHTML: '',
    outerHTML: '',
    textContent: '',
    innerText: '',
    
    // Attributes
    attributes: new Map(),
    dataset: {},
    style: {},
    
    // Hierarchy
    parentNode: null,
    parentElement: null,
    children: [],
    childNodes: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
    
    // Custom properties
    ...properties,
    
    // DOM manipulation methods
    appendChild: vi.fn(function(child) {
      this.children.push(child);
      this.childNodes.push(child);
      child.parentNode = this;
      child.parentElement = this;
      
      if (this.children.length === 1) {
        this.firstChild = child;
      }
      this.lastChild = child;
      
      return child;
    }),
    
    removeChild: vi.fn(function(child) {
      const index = this.children.indexOf(child);
      if (index > -1) {
        this.children.splice(index, 1);
        this.childNodes.splice(index, 1);
        child.parentNode = null;
        child.parentElement = null;
        
        this.firstChild = this.children[0] || null;
        this.lastChild = this.children[this.children.length - 1] || null;
      }
      return child;
    }),
    
    insertBefore: vi.fn(function(newChild, referenceChild) {
      const index = this.children.indexOf(referenceChild);
      if (index > -1) {
        this.children.splice(index, 0, newChild);
        this.childNodes.splice(index, 0, newChild);
      } else {
        this.appendChild(newChild);
      }
      return newChild;
    }),
    
    replaceChild: vi.fn(function(newChild, oldChild) {
      const index = this.children.indexOf(oldChild);
      if (index > -1) {
        this.children[index] = newChild;
        this.childNodes[index] = newChild;
        newChild.parentNode = this;
        newChild.parentElement = this;
        oldChild.parentNode = null;
        oldChild.parentElement = null;
      }
      return oldChild;
    }),
    
    // Query methods
    querySelector: vi.fn(function(selector) {
      // Simple mock implementation
      if (selector.startsWith('#')) {
        const id = selector.substring(1);
        return this.children.find(child => child.id === id) || null;
      }
      if (selector.startsWith('.')) {
        const className = selector.substring(1);
        return this.children.find(child => 
          child.className && child.className.includes(className)
        ) || null;
      }
      return this.children.find(child => 
        child.tagName && child.tagName.toLowerCase() === selector.toLowerCase()
      ) || null;
    }),
    
    querySelectorAll: vi.fn(function(selector) {
      const results = [];
      if (selector.startsWith('#')) {
        const id = selector.substring(1);
        const found = this.children.find(child => child.id === id);
        if (found) results.push(found);
      } else if (selector.startsWith('.')) {
        const className = selector.substring(1);
        results.push(...this.children.filter(child => 
          child.className && child.className.includes(className)
        ));
      } else {
        results.push(...this.children.filter(child => 
          child.tagName && child.tagName.toLowerCase() === selector.toLowerCase()
        ));
      }
      return results;
    }),
    
    getElementById: vi.fn(function(id) {
      return this.children.find(child => child.id === id) || null;
    }),
    
    getElementsByClassName: vi.fn(function(className) {
      return this.children.filter(child => 
        child.className && child.className.includes(className)
      );
    }),
    
    getElementsByTagName: vi.fn(function(tagName) {
      return this.children.filter(child => 
        child.tagName && child.tagName.toLowerCase() === tagName.toLowerCase()
      );
    }),
    
    // Event methods
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    
    // Attribute methods
    setAttribute: vi.fn(function(name, value) {
      this.attributes.set(name, String(value));
      if (name === 'id') this.id = String(value);
      if (name === 'class') this.className = String(value);
    }),
    
    getAttribute: vi.fn(function(name) {
      return this.attributes.get(name) || null;
    }),
    
    removeAttribute: vi.fn(function(name) {
      this.attributes.delete(name);
      if (name === 'id') this.id = '';
      if (name === 'class') this.className = '';
    }),
    
    hasAttribute: vi.fn(function(name) {
      return this.attributes.has(name);
    }),
    
    // Focus methods
    focus: vi.fn(),
    blur: vi.fn(),
    
    // Click method
    click: vi.fn(),
    
    // Measurement methods
    getBoundingClientRect: vi.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      toJSON: vi.fn()
    })),
    
    getClientRects: vi.fn(() => []),
    
    scrollIntoView: vi.fn(),
    
    // classList mock
    classList: {
      _classes: new Set(),
      
      add: vi.fn(function(...classes) {
        classes.forEach(cls => this._classes.add(cls));
        element.className = Array.from(this._classes).join(' ');
      }),
      
      remove: vi.fn(function(...classes) {
        classes.forEach(cls => this._classes.delete(cls));
        element.className = Array.from(this._classes).join(' ');
      }),
      
      contains: vi.fn(function(className) {
        return this._classes.has(className);
      }),
      
      toggle: vi.fn(function(className, force) {
        if (force === true) {
          this.add(className);
          return true;
        } else if (force === false) {
          this.remove(className);
          return false;
        } else {
          if (this.contains(className)) {
            this.remove(className);
            return false;
          } else {
            this.add(className);
            return true;
          }
        }
      }),
      
      replace: vi.fn(function(oldClass, newClass) {
        if (this.contains(oldClass)) {
          this.remove(oldClass);
          this.add(newClass);
          return true;
        }
        return false;
      }),
      
      get length() {
        return this._classes.size;
      },
      
      item: vi.fn(function(index) {
        return Array.from(this._classes)[index] || null;
      })
    }
  };
  
  // Special handling per diversi tipi di elementi
  switch (tagName.toLowerCase()) {
    case 'canvas':
      setupCanvasElement(element);
      break;
    case 'input':
      setupInputElement(element);
      break;
    case 'form':
      setupFormElement(element);
      break;
    case 'select':
      setupSelectElement(element);
      break;
    case 'img':
      setupImageElement(element);
      break;
  }
  
  return element;
}

/**
 * Setup specifico per canvas
 */
function setupCanvasElement(element) {
  element.width = 800;
  element.height = 600;
  
  element.getContext = vi.fn((type) => {
    if (type === '2d') {
      return {
        // Drawing methods
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        
        // Path methods
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        
        // Fill and stroke
        fill: vi.fn(),
        stroke: vi.fn(),
        
        // Text
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        
        // Images
        drawImage: vi.fn(),
        
        // Transformations
        scale: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
        
        // State
        save: vi.fn(),
        restore: vi.fn(),
        
        // Properties
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic'
      };
    }
    return null;
  });
  
  element.toBlob = vi.fn((callback, type = 'image/png', quality) => {
    const blob = new Blob(['mock-canvas-data'], { type });
    if (callback) callback(blob);
  });
  
  element.toDataURL = vi.fn((type = 'image/png', quality) => {
    return `data:${type};base64,mock-canvas-data`;
  });
}

/**
 * Setup specifico per input
 */
function setupInputElement(element) {
  element.value = '';
  element.type = 'text';
  element.checked = false;
  element.disabled = false;
  element.readonly = false;
  
  element.select = vi.fn();
  element.setSelectionRange = vi.fn();
}

/**
 * Setup specifico per form
 */
function setupFormElement(element) {
  element.submit = vi.fn();
  element.reset = vi.fn();
  element.checkValidity = vi.fn(() => true);
  element.reportValidity = vi.fn(() => true);
}

/**
 * Setup specifico per select
 */
function setupSelectElement(element) {
  element.value = '';
  element.selectedIndex = -1;
  element.options = [];
  element.multiple = false;
  element.size = 1;
}

/**
 * Setup specifico per img
 */
function setupImageElement(element) {
  element.src = '';
  element.alt = '';
  element.width = 0;
  element.height = 0;
  element.naturalWidth = 0;
  element.naturalHeight = 0;
  element.complete = false;
  
  element.load = vi.fn();
}

/**
 * Crea mock document
 */
export function createMockDocument() {
  const mockDocument = createMockElement('document');
  
  // Document specific properties
  mockDocument.nodeType = 9; // DOCUMENT_NODE
  mockDocument.documentElement = createMockElement('html');
  mockDocument.head = createMockElement('head');
  mockDocument.body = createMockElement('body');
  
  // Document methods
  mockDocument.createElement = vi.fn((tagName) => createMockElement(tagName));
  mockDocument.createTextNode = vi.fn((text) => ({
    nodeType: 3, // TEXT_NODE
    textContent: text,
    nodeValue: text
  }));
  
  mockDocument.createDocumentFragment = vi.fn(() => createMockElement('fragment'));
  
  return mockDocument;
}

/**
 * Crea mock window
 */
export function createMockWindow(properties = {}) {
  return {
    // Dimensions
    innerWidth: 1024,
    innerHeight: 768,
    outerWidth: 1024,
    outerHeight: 768,
    
    // Location
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      reload: vi.fn(),
      assign: vi.fn(),
      replace: vi.fn()
    },
    
    // History
    history: {
      length: 1,
      state: null,
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn()
    },
    
    // Navigator
    navigator: {
      userAgent: 'Mozilla/5.0 (Test Environment)',
      language: 'en-US',
      languages: ['en-US', 'en'],
      platform: 'Test',
      cookieEnabled: true,
      onLine: true
    },
    
    // Screen
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24
    },
    
    // Storage
    localStorage: createMockStorage(),
    sessionStorage: createMockStorage(),
    
    // Methods
    alert: vi.fn(),
    confirm: vi.fn(() => true),
    prompt: vi.fn(() => ''),
    
    setTimeout: vi.fn((fn, delay) => setTimeout(fn, delay)),
    clearTimeout: vi.fn(clearTimeout),
    setInterval: vi.fn((fn, delay) => setInterval(fn, delay)),
    clearInterval: vi.fn(clearInterval),
    
    requestAnimationFrame: vi.fn((callback) => setTimeout(callback, 16)),
    cancelAnimationFrame: vi.fn(),
    
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    
    // Custom properties
    ...properties
  };
}

/**
 * Crea mock storage (localStorage/sessionStorage)
 */
export function createMockStorage() {
  const storage = new Map();
  
  return {
    getItem: vi.fn((key) => storage.get(key) || null),
    setItem: vi.fn((key, value) => storage.set(key, String(value))),
    removeItem: vi.fn((key) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    key: vi.fn((index) => Array.from(storage.keys())[index] || null),
    get length() { return storage.size; }
  };
}

/**
 * Simula eventi DOM
 */
export function simulateEvent(element, eventType, eventData = {}) {
  const event = {
    type: eventType,
    target: element,
    currentTarget: element,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    ...eventData
  };
  
  if (element.dispatchEvent) {
    element.dispatchEvent(event);
  }
  
  return event;
}

/**
 * Simula click
 */
export function simulateClick(element, eventData = {}) {
  return simulateEvent(element, 'click', {
    button: 0,
    buttons: 1,
    clientX: 0,
    clientY: 0,
    ...eventData
  });
}

/**
 * Simula input change
 */
export function simulateChange(element, value) {
  element.value = value;
  return simulateEvent(element, 'change', { target: { value } });
}

/**
 * Simula form submit
 */
export function simulateSubmit(form, formData = {}) {
  return simulateEvent(form, 'submit', {
    target: form,
    preventDefault: vi.fn()
  });
}
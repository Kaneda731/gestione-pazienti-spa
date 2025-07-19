/**
 * Helper per manipolazione DOM nei test
 */

import { vi } from 'vitest';

/**
 * Crea un elemento DOM mock con proprietà e metodi comuni
 */
export function createMockElement(tagName = 'div', properties = {}) {
  const element = {
    tagName: tagName.toUpperCase(),
    nodeName: tagName.toUpperCase(),
    nodeType: 1,
    id: '',
    className: '',
    innerHTML: '',
    textContent: '',
    
    // Hierarchy
    parentNode: null,
    parentElement: null,
    children: [],
    childNodes: [],
    
    // Custom properties
    ...properties,
    
    // Methods
    appendChild: vi.fn(function(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    }),
    
    removeChild: vi.fn(function(child) {
      const index = this.children.indexOf(child);
      if (index > -1) {
        this.children.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    }),
    
    querySelector: vi.fn(function(selector) {
      return this.children.find(child => 
        child.matches && child.matches(selector)
      ) || null;
    }),
    
    querySelectorAll: vi.fn(function(selector) {
      return this.children.filter(child => 
        child.matches && child.matches(selector)
      );
    }),
    
    matches: vi.fn(function(selector) {
      if (selector.startsWith('#')) {
        return this.id === selector.substring(1);
      }
      if (selector.startsWith('.')) {
        return this.className.includes(selector.substring(1));
      }
      return this.tagName.toLowerCase() === selector.toLowerCase();
    }),
    
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    
    setAttribute: vi.fn(function(name, value) {
      this[name] = value;
    }),
    
    getAttribute: vi.fn(function(name) {
      return this[name] || null;
    }),
    
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    
    getBoundingClientRect: vi.fn(() => ({
      x: 0, y: 0, width: 100, height: 100,
      top: 0, right: 100, bottom: 100, left: 0
    })),
    
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
      toggle: vi.fn()
    }
  };
  
  return element;
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
    bubbles: true,
    cancelable: true,
    ...eventData
  };
  
  // Trigger event listeners se presenti
  if (element.addEventListener.mock) {
    const listeners = element.addEventListener.mock.calls
      .filter(call => call[0] === eventType)
      .map(call => call[1]);
    
    listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(event);
      }
    });
  }
  
  return event;
}

/**
 * Simula click su elemento
 */
export function simulateClick(element, options = {}) {
  const clickEvent = simulateEvent(element, 'click', {
    button: 0,
    buttons: 1,
    clientX: 0,
    clientY: 0,
    ...options
  });
  
  if (element.click) {
    element.click();
  }
  
  return clickEvent;
}

/**
 * Simula input change
 */
export function simulateChange(element, value, options = {}) {
  if (element.value !== undefined) {
    element.value = value;
  }
  
  return simulateEvent(element, 'change', {
    target: { value },
    ...options
  });
}

/**
 * Simula input su campo di testo
 */
export function simulateInput(element, value, options = {}) {
  if (element.value !== undefined) {
    element.value = value;
  }
  
  return simulateEvent(element, 'input', {
    target: { value },
    inputType: 'insertText',
    data: value,
    ...options
  });
}

/**
 * Simula keydown/keyup
 */
export function simulateKeyPress(element, key, options = {}) {
  const keyEvent = {
    key,
    code: `Key${key.toUpperCase()}`,
    keyCode: key.charCodeAt(0),
    which: key.charCodeAt(0),
    ...options
  };
  
  simulateEvent(element, 'keydown', keyEvent);
  simulateEvent(element, 'keyup', keyEvent);
  
  return keyEvent;
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

/**
 * Simula mouse hover
 */
export function simulateHover(element, options = {}) {
  simulateEvent(element, 'mouseenter', options);
  simulateEvent(element, 'mouseover', options);
  
  return {
    leave: () => {
      simulateEvent(element, 'mouseleave', options);
      simulateEvent(element, 'mouseout', options);
    }
  };
}

/**
 * Simula focus/blur
 */
export function simulateFocus(element, options = {}) {
  simulateEvent(element, 'focus', options);
  
  if (element.focus) {
    element.focus();
  }
  
  return {
    blur: () => {
      simulateEvent(element, 'blur', options);
      if (element.blur) {
        element.blur();
      }
    }
  };
}

/**
 * Simula drag and drop
 */
export function simulateDragAndDrop(source, target, options = {}) {
  const dataTransfer = {
    data: {},
    setData: vi.fn((type, data) => {
      dataTransfer.data[type] = data;
    }),
    getData: vi.fn((type) => dataTransfer.data[type] || ''),
    clearData: vi.fn(),
    files: [],
    types: []
  };
  
  // Drag start
  simulateEvent(source, 'dragstart', {
    dataTransfer,
    ...options
  });
  
  // Drag over target
  simulateEvent(target, 'dragover', {
    dataTransfer,
    preventDefault: vi.fn(),
    ...options
  });
  
  // Drop
  simulateEvent(target, 'drop', {
    dataTransfer,
    preventDefault: vi.fn(),
    ...options
  });
  
  // Drag end
  simulateEvent(source, 'dragend', {
    dataTransfer,
    ...options
  });
  
  return { dataTransfer };
}

/**
 * Simula touch events per mobile
 */
export function simulateTouch(element, touches = [], options = {}) {
  const touchEvent = {
    touches,
    targetTouches: touches,
    changedTouches: touches,
    ...options
  };
  
  return {
    start: () => simulateEvent(element, 'touchstart', touchEvent),
    move: () => simulateEvent(element, 'touchmove', touchEvent),
    end: () => simulateEvent(element, 'touchend', touchEvent)
  };
}

/**
 * Crea touch point per eventi touch
 */
export function createTouchPoint(x = 0, y = 0, options = {}) {
  return {
    identifier: Math.random(),
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
    target: null,
    ...options
  };
}

/**
 * Utilities per gestione viewport
 */
export const viewport = {
  setSize: (width, height) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height
    });
    
    // Trigger resize event
    simulateEvent(window, 'resize');
  },
  
  mobile: () => viewport.setSize(375, 667),
  tablet: () => viewport.setSize(768, 1024),
  desktop: () => viewport.setSize(1920, 1080),
  
  simulateOrientationChange: () => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    viewport.setSize(currentHeight, currentWidth);
    simulateEvent(window, 'orientationchange');
  }
};

/**
 * Utilities per scroll
 */
export const scroll = {
  simulate: (element, scrollTop = 0, scrollLeft = 0) => {
    if (element.scrollTop !== undefined) {
      element.scrollTop = scrollTop;
    }
    if (element.scrollLeft !== undefined) {
      element.scrollLeft = scrollLeft;
    }
    
    simulateEvent(element, 'scroll');
  },
  
  toBottom: (element) => {
    const scrollHeight = element.scrollHeight || 1000;
    scroll.simulate(element, scrollHeight);
  },
  
  toTop: (element) => {
    scroll.simulate(element, 0);
  }
};

/**
 * Utilities per gestione CSS
 */
export const css = {
  mockComputedStyle: (element, styles = {}) => {
    const originalGetComputedStyle = window.getComputedStyle;
    
    window.getComputedStyle = vi.fn((el) => {
      if (el === element) {
        return {
          getPropertyValue: vi.fn((prop) => styles[prop] || ''),
          ...styles
        };
      }
      return originalGetComputedStyle(el);
    });
    
    return {
      restore: () => {
        window.getComputedStyle = originalGetComputedStyle;
      }
    };
  },
  
  hasClass: (element, className) => {
    return element.className && element.className.includes(className);
  },
  
  addClass: (element, className) => {
    if (!css.hasClass(element, className)) {
      element.className = (element.className + ' ' + className).trim();
    }
  },
  
  removeClass: (element, className) => {
    if (element.className) {
      element.className = element.className
        .replace(new RegExp(`\\b${className}\\b`, 'g'), '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
};

/**
 * Utilities per gestione form
 */
export const form = {
  fillField: (field, value) => {
    field.value = value;
    simulateInput(field, value);
    simulateChange(field, value);
  },
  
  selectOption: (select, value) => {
    select.value = value;
    simulateChange(select, value);
  },
  
  checkCheckbox: (checkbox, checked = true) => {
    checkbox.checked = checked;
    simulateChange(checkbox, checked);
  },
  
  submitForm: (formElement) => {
    return simulateSubmit(formElement);
  },
  
  getFormData: (formElement) => {
    const formData = {};
    const inputs = formElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (input.name) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          if (input.checked) {
            formData[input.name] = input.value;
          }
        } else {
          formData[input.name] = input.value;
        }
      }
    });
    
    return formData;
  }
};

/**
 * Utilities per accessibility testing
 */
export const accessibility = {
  checkAriaLabel: (element) => {
    return element.getAttribute('aria-label') || 
           element.getAttribute('aria-labelledby') ||
           element.textContent;
  },
  
  checkTabIndex: (element) => {
    const tabIndex = element.getAttribute('tabindex');
    return tabIndex !== null ? parseInt(tabIndex) : 0;
  },
  
  simulateKeyboardNavigation: (elements) => {
    let currentIndex = 0;
    
    return {
      next: () => {
        if (currentIndex < elements.length - 1) {
          currentIndex++;
          simulateFocus(elements[currentIndex]);
        }
      },
      
      previous: () => {
        if (currentIndex > 0) {
          currentIndex--;
          simulateFocus(elements[currentIndex]);
        }
      },
      
      current: () => elements[currentIndex]
    };
  }
};

/**
 * Cleanup utilities
 */
export const cleanup = {
  removeAllChildren: (element) => {
    while (element.children.length > 0) {
      element.removeChild(element.children[0]);
    }
  },
  
  resetElement: (element) => {
    element.innerHTML = '';
    element.className = '';
    element.id = '';
    
    // Reset event listeners
    if (element.addEventListener.mockClear) {
      element.addEventListener.mockClear();
    }
    if (element.removeEventListener.mockClear) {
      element.removeEventListener.mockClear();
    }
  },
  
  resetDocument: () => {
    if (document.body) {
      cleanup.removeAllChildren(document.body);
    }
    if (document.head) {
      // Rimuovi solo elementi aggiunti dai test
      const testElements = document.head.querySelectorAll('[data-test]');
      testElements.forEach(el => el.remove());
    }
  }
};
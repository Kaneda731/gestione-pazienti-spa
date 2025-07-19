import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeviceDetector } from '../../../../../src/features/charts/components/responsive-adapter/DeviceDetector.js';

describe('DeviceDetector', () => {
  let deviceDetector;
  let originalInnerWidth;
  let originalInnerHeight;
  let originalNavigator;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalNavigator = window.navigator;

    // Create new instance with default breakpoints
    deviceDetector = new DeviceDetector();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    });
    Object.defineProperty(window, 'navigator', {
      writable: true,
      configurable: true,
      value: originalNavigator
    });
  });

  describe('constructor', () => {
    it('should initialize with default breakpoints', () => {
      const detector = new DeviceDetector();
      expect(detector.breakpoints).toEqual({
        mobile: 767,
        tablet: 991,
        desktop: 1199
      });
    });

    it('should initialize with custom breakpoints', () => {
      const customBreakpoints = {
        mobile: 600,
        tablet: 900,
        desktop: 1200
      };
      const detector = new DeviceDetector(customBreakpoints);
      expect(detector.breakpoints).toEqual(customBreakpoints);
    });
  });

  describe('detectDevice', () => {
    it('should detect mobile device for width <= 767px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800
      });

      expect(deviceDetector.detectDevice()).toBe('mobile');
    });

    it('should detect tablet device for width between 768px and 991px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600
      });

      // Mock non-touch device
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: { maxTouchPoints: 0 }
      });
      delete window.ontouchstart;

      expect(deviceDetector.detectDevice()).toBe('tablet');
    });

    it('should detect desktop device for width > 991px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800
      });

      expect(deviceDetector.detectDevice()).toBe('desktop');
    });

    it('should treat touch device in landscape as mobile when width <= 1024px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600
      });

      // Mock touch device
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: { maxTouchPoints: 1 }
      });

      expect(deviceDetector.detectDevice()).toBe('mobile');
    });
  });

  describe('isTouchDevice', () => {
    it('should return true when ontouchstart is available', () => {
      window.ontouchstart = () => {};
      expect(deviceDetector.isTouchDevice()).toBe(true);
      delete window.ontouchstart;
    });

    it('should return true when maxTouchPoints > 0', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: { maxTouchPoints: 1 }
      });
      expect(deviceDetector.isTouchDevice()).toBe(true);
    });

    it('should return false when no touch support', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: { maxTouchPoints: 0 }
      });
      delete window.ontouchstart;
      expect(deviceDetector.isTouchDevice()).toBe(false);
    });
  });

  describe('getOrientation', () => {
    it('should return portrait when height > width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800
      });

      expect(deviceDetector.getOrientation()).toBe('portrait');
    });

    it('should return landscape when width > height', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 400
      });

      expect(deviceDetector.getOrientation()).toBe('landscape');
    });
  });

  describe('getViewportInfo', () => {
    it('should return complete viewport information', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800
      });
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2
      });

      const viewportInfo = deviceDetector.getViewportInfo();

      expect(viewportInfo).toEqual({
        width: 1200,
        height: 800,
        devicePixelRatio: 2,
        orientation: 'landscape',
        isTouchDevice: expect.any(Boolean),
        deviceType: 'desktop'
      });
    });

    it('should default devicePixelRatio to 1 if not available', () => {
      delete window.devicePixelRatio;

      const viewportInfo = deviceDetector.getViewportInfo();
      expect(viewportInfo.devicePixelRatio).toBe(1);
    });
  });

  describe('convenience methods', () => {
    it('should correctly identify mobile device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });

      expect(deviceDetector.isMobile()).toBe(true);
      expect(deviceDetector.isTablet()).toBe(false);
      expect(deviceDetector.isDesktop()).toBe(false);
    });

    it('should correctly identify tablet device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: { maxTouchPoints: 0 }
      });
      delete window.ontouchstart;

      expect(deviceDetector.isMobile()).toBe(false);
      expect(deviceDetector.isTablet()).toBe(true);
      expect(deviceDetector.isDesktop()).toBe(false);
    });

    it('should correctly identify desktop device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      expect(deviceDetector.isMobile()).toBe(false);
      expect(deviceDetector.isTablet()).toBe(false);
      expect(deviceDetector.isDesktop()).toBe(true);
    });
  });
});
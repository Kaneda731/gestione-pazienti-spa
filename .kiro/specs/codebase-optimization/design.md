# Design Document

## Overview

The codebase optimization project will systematically eliminate dead code, reduce bundle size, and implement performance optimizations for the Gestione Pazienti SPA. The design focuses on maintaining backward compatibility while achieving significant performance improvements through strategic code removal, CSS optimization, logging improvements, and build configuration enhancements.

## Architecture

### Current State Analysis
- **Bundle Size Issues**: Bootstrap CSS imported twice (full CSS + SCSS components)
- **Dead Code**: Empty files, unused feature flags, test artifacts
- **Logging Overhead**: Extensive console logging in production builds
- **Build Configuration**: Suboptimal Vite configuration with forced rebuilds
- **Deployment**: Missing Netlify optimizations for caching and compression

### Target Architecture
- **Optimized CSS Pipeline**: Single Bootstrap import through selective SCSS modules
- **Clean Codebase**: Removed dead code with maintained functionality
- **Smart Logging**: Environment-aware logging service
- **Efficient Build**: Optimized Vite configuration with proper chunking
- **Enhanced Deployment**: Netlify optimizations for performance

## Components and Interfaces

### 1. Dead Code Removal Component
**Purpose**: Identify and remove unused files and code

**Files to Remove**:
- `src/app/debug-theme.js` (empty file)
- Test HTML files in `/tests/` directory
- Unused feature flags from environment configuration
- Unreferenced environment variables

**Interface**:
```javascript
// Clean environment configuration
export const environment = {
    // Remove: API_TIMEOUT, TABLET_BREAKPOINT
    // Keep only used variables
    NODE_ENV: import.meta.env.MODE || 'development',
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    OAUTH_DEBUG: import.meta.env.VITE_OAUTH_DEBUG === 'true',
    // Keep only implemented features
    FEATURES: {
        ROLE_BASED_ACCESS: true
    }
};
```

### 2. CSS Optimization Component
**Purpose**: Eliminate duplicate Bootstrap imports and optimize CSS bundle

**Current Problem**:
```javascript
// main.js - Full Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// desktop.scss & mobile.scss - Selective Bootstrap SCSS
@import "bootstrap/scss/reboot";
@import "bootstrap/scss/containers";
// ... more imports
```

**Optimized Solution**:
```javascript
// main.js - Remove full Bootstrap import
// Keep only: flatpickr CSS and custom SCSS

// SCSS files - Keep selective imports only
// Ensure no duplication between desktop and mobile
```

**Interface**:
- Remove Bootstrap CSS import from `main.js`
- Maintain selective SCSS imports
- Create shared Bootstrap base for common components
- Separate desktop/mobile specific components

### 3. Logging Service Component
**Purpose**: Implement environment-aware logging

**Interface**:
```javascript
// src/core/services/loggerService.js
export const logger = {
    log: (...args) => isDevelopment && console.log(...args),
    warn: (...args) => isDevelopment && console.warn(...args),
    error: (...args) => console.error(...args), // Always log errors
    info: (...args) => isDevelopment && console.info(...args)
};

// Usage throughout codebase
import { logger } from '../core/services/loggerService.js';
logger.log('Debug message'); // Only in development
logger.error('Error message'); // Always logged
```

### 4. Build Optimization Component
**Purpose**: Optimize Vite configuration for better performance

**Enhanced vite.config.js**:
```javascript
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['bootstrap'],
                    supabase: ['@supabase/supabase-js'],
                    charts: ['google-charts'],
                    utils: ['flatpickr', 'imask']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    },
    plugins: [
        visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true
        })
    ],
    optimizeDeps: {
        include: ['bootstrap', 'google-charts', '@supabase/supabase-js']
        // Remove force: true
    }
});
```

### 5. Netlify Optimization Component
**Purpose**: Configure optimal deployment settings

**Enhanced netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[build.processing]
  skip_processing = false
[build.processing.css]
  bundle = true
  minify = true
[build.processing.js]
  bundle = true
  minify = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Data Models

### Bundle Analysis Model
```javascript
{
    totalSize: number,        // Total bundle size in bytes
    gzippedSize: number,     // Gzipped size
    chunks: {
        vendor: number,       // Vendor chunk size
        supabase: number,     // Supabase chunk size
        charts: number,       // Charts chunk size
        utils: number,        // Utils chunk size
        main: number          // Main application chunk
    },
    assets: {
        css: number,          // Total CSS size
        js: number,           // Total JS size
        images: number        // Total image assets
    }
}
```

### Optimization Metrics Model
```javascript
{
    before: {
        bundleSize: number,
        cssSize: number,
        jsSize: number,
        loadTime: number
    },
    after: {
        bundleSize: number,
        cssSize: number,
        jsSize: number,
        loadTime: number
    },
    improvements: {
        bundleSizeReduction: string,    // "30% reduction"
        cssSizeReduction: string,       // "40% reduction"
        loadTimeImprovement: string     // "25% faster"
    }
}
```

## Error Handling

### Build Process Errors
- **Missing Dependencies**: Graceful handling of import errors with fallbacks
- **SCSS Compilation**: Clear error messages for missing Bootstrap components
- **Bundle Analysis**: Fallback when visualizer plugin fails

### Runtime Errors
- **Logging Service**: Ensure logger doesn't break if environment detection fails
- **Import Failures**: Lazy loading with proper error boundaries
- **CSS Loading**: Fallback styles if optimized CSS fails to load

### Deployment Errors
- **Netlify Configuration**: Validation of header configurations
- **Asset Optimization**: Fallback if minification fails
- **Cache Headers**: Ensure proper cache invalidation

## Testing Strategy

### Unit Tests
- **Logger Service**: Test environment-based logging behavior
- **Environment Configuration**: Verify only necessary variables are present
- **Import Optimization**: Test that optimized imports work correctly

### Integration Tests
- **CSS Loading**: Verify styles load correctly after optimization
- **Bundle Analysis**: Test that analysis reports are generated
- **Build Process**: Ensure optimized build produces working application

### Performance Tests
- **Bundle Size**: Measure and verify size reductions
- **Load Time**: Test application loading performance
- **Cache Behavior**: Verify proper caching on Netlify

### Regression Tests
- **Functionality**: Ensure all features work after optimization
- **Responsive Design**: Verify mobile and desktop layouts
- **Authentication**: Test OAuth flow remains functional
- **Data Operations**: Verify CRUD operations work correctly

## Implementation Phases

### Phase 1: Dead Code Removal
1. Remove empty and unused files
2. Clean up environment configuration
3. Remove unused feature flags
4. Clean up test artifacts

### Phase 2: CSS Optimization
1. Remove duplicate Bootstrap import
2. Optimize SCSS structure
3. Test responsive layouts
4. Measure CSS bundle reduction

### Phase 3: Logging Implementation
1. Create logger service
2. Replace console statements
3. Configure production stripping
4. Test logging behavior

### Phase 4: Build Optimization
1. Update Vite configuration
2. Implement bundle analysis
3. Configure chunk splitting
4. Test build performance

### Phase 5: Deployment Optimization
1. Update Netlify configuration
2. Configure caching headers
3. Enable compression
4. Test deployment performance

## Success Metrics

- **Bundle Size Reduction**: Target 30-40% reduction in total bundle size
- **CSS Size Reduction**: Target 30-40% reduction in CSS bundle size
- **Load Time Improvement**: Target 20-30% faster initial load
- **Build Time**: Maintain or improve current build times
- **Functionality**: 100% feature parity maintained
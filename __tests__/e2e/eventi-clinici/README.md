# Clinical Events E2E Tests

This directory contains comprehensive end-to-end tests for the clinical events (eventi-clinici) feature, covering performance, accessibility, responsive design, and functional testing.

## Test Structure

### 1. Functional Tests

#### `discharge-transfer-workflow.spec.js`
Tests complete discharge and transfer workflows:
- Internal transfer workflow
- External transfer workflow  
- Regular discharge workflow
- Form validation

#### `clinical-events-crud.spec.js`
Tests clinical events CRUD operations:
- Creating surgical interventions
- Creating infection events
- Editing existing events
- Deleting events
- Form validation
- Post-operative day calculations

#### `cross-feature-integration.spec.js`
Tests integration between clinical events and patient management:
- Clinical events display in patient details
- Patient list updates after discharge/transfer
- Creating events from patient detail view
- Data consistency across features
- Patient deletion with associated events

#### `search-filtering.spec.js`
Tests search and filtering functionality:
- Patient name/ID search
- Event type filtering
- Date range filtering
- Department filtering
- Combined filters
- Filter reset functionality
- Filter state persistence

### 2. Quality Assurance Tests

#### `accessibility.spec.js`
Tests accessibility compliance:
- Keyboard navigation
- Screen reader support (ARIA labels)
- Focus management in modals
- Error announcements
- High contrast mode support
- Reduced motion preferences
- Heading hierarchy
- Live region announcements

#### `performance.spec.js`
Tests performance characteristics:
- Page load performance (Core Web Vitals)
- Large dataset handling (1000+ patients/events)
- Memory usage during long sessions
- Database query performance
- Concurrent user scenarios
- Form submission performance
- Pagination performance

#### `responsive-design.spec.js`
Tests responsive design across devices:
- Multiple viewport sizes (mobile, tablet, desktop)
- Event timeline display
- Modal responsiveness
- Search and filter controls
- Navigation adaptation
- Touch interactions
- Orientation changes
- Zoom level support

## Running the Tests

### Prerequisites

1. Install Playwright browsers:
```bash
npx playwright install
```

2. Ensure the development server is running:
```bash
npm run dev
```

### Test Commands

#### Run all clinical events E2E tests:
```bash
npm run test:e2e:eventi-clinici
```

#### Run specific test categories:
```bash
# Performance tests only
npm run test:e2e:performance

# Responsive design tests only
npm run test:e2e:responsive

# Accessibility tests only
npm run test:e2e:accessibility
```

#### Run with specific configuration:
```bash
# Performance-optimized configuration
npx playwright test --config=playwright-performance.config.js

# Debug mode
npm run test:e2e:debug

# Headed mode (visible browser)
npm run test:e2e:headed

# UI mode
npm run test:e2e:ui
```

### Browser Coverage

Tests run across multiple browsers and devices:
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome (Pixel 5), Safari (iPhone 12)
- **Tablet**: iPad Pro
- **Custom viewports**: Various screen sizes

## Test Data Management

### Setup and Teardown
- Each test creates its own test data (patients, events)
- Automatic cleanup after each test
- Isolated test environments to prevent interference

### Mock Data
- Authentication is mocked for consistent testing
- Test patients have predictable data patterns
- Events are created with known relationships

## Performance Benchmarks

### Load Time Targets
- Initial page load: < 2 seconds
- Search operations: < 1 second
- Filter operations: < 1 second
- Form submissions: < 2 seconds

### Memory Usage
- Memory increase during session: < 50%
- No significant memory leaks
- Efficient cleanup of event listeners

### Core Web Vitals
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

## Accessibility Standards

Tests ensure compliance with:
- WCAG 2.1 AA guidelines
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences
- Proper ARIA labeling
- Focus management

## Responsive Design Coverage

### Viewport Sizes Tested
- Mobile Portrait: 375x667
- Mobile Landscape: 667x375
- Tablet Portrait: 768x1024
- Tablet Landscape: 1024x768
- Desktop Small: 1280x720
- Desktop Large: 1920x1080

### Touch Interactions
- Tap gestures
- Swipe navigation (where applicable)
- Touch scrolling
- Modal interactions

## Troubleshooting

### Common Issues

1. **Browser not found**: Run `npx playwright install`
2. **Server not running**: Ensure `npm run dev` is active
3. **Port conflicts**: Check that port 5173 is available
4. **Test timeouts**: Increase timeout in playwright config for slow systems

### Debug Mode
```bash
# Run specific test in debug mode
npx playwright test __tests__/e2e/eventi-clinici/performance.spec.js --debug

# Run with trace
npx playwright test --trace on
```

### Performance Debugging
```bash
# Run performance tests with detailed logging
npx playwright test __tests__/e2e/eventi-clinici/performance.spec.js --reporter=line
```

## Continuous Integration

### CI Configuration
- Tests run on multiple OS (Ubuntu, macOS, Windows)
- Parallel execution for faster feedback
- Automatic retry on flaky tests
- Screenshot/video capture on failures

### Performance Monitoring
- Baseline performance metrics stored
- Regression detection for performance degradation
- Memory leak detection
- Database query performance tracking

## Contributing

### Adding New Tests
1. Follow existing test patterns
2. Include proper setup/teardown
3. Use descriptive test names
4. Add appropriate assertions
5. Consider cross-browser compatibility

### Test Maintenance
- Update selectors when UI changes
- Maintain performance benchmarks
- Review accessibility requirements
- Update responsive breakpoints as needed

## Reports

Test results are generated in multiple formats:
- HTML report: `playwright-report/index.html`
- JSON results: `playwright-report/results.json`
- Performance report: `playwright-report/performance/`
- Screenshots/videos: `test-results/`
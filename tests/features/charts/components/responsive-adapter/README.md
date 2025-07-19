# ResponsiveChartAdapter Tests

This directory contains tests for the ResponsiveChartAdapter component, which is responsible for adapting chart options and layout based on the device type and screen size.

## Test Structure

The tests are organized into the following directories:

- `integration/`: Integration tests that verify the interaction between different modules
- `unit/`: Unit tests for individual modules (to be implemented)

## Integration Tests

The integration tests are further divided into the following categories:

1. **Module Integration**: Tests that verify the correct initialization and interaction between modules
2. **Device Detection**: Tests that verify the correct detection of device types and adaptation of options
3. **Event Handling**: Tests that verify the correct handling of resize and orientation change events
4. **Backward Compatibility**: Tests that verify compatibility with the original ResponsiveChartAdapter
5. **Advanced Scenarios**: Tests that verify complex scenarios like chart lifecycle and data integrity
6. **Regression**: Tests that verify the maintenance of functionality and performance
7. **Error Handling**: Tests that verify the correct handling of errors
8. **Memory Management**: Tests that verify the correct cleanup of resources

## Running Tests

To run all tests:

```bash
npm test
```

To run only the integration tests:

```bash
npm test -- tests/features/charts/components/responsive-adapter/integration
```

To run a specific test file:

```bash
npm test -- tests/features/charts/components/responsive-adapter/integration/device-detection.test.js
```

## Test Coverage

The tests cover the following aspects of the ResponsiveChartAdapter:

- Initialization and configuration
- Device detection and adaptation
- Event handling and callbacks
- Backward compatibility
- Error handling and recovery
- Memory management and cleanup
- Performance and concurrency
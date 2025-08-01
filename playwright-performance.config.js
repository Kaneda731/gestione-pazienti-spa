import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e/eventi-clinici',
  testMatch: ['performance.spec.js', 'responsive-design.spec.js'],
  fullyParallel: false, // Run performance tests sequentially to avoid interference
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Fewer retries for performance tests
  workers: 1, // Single worker for consistent performance measurements
  timeout: 60000, // Longer timeout for performance tests
  reporter: [
    ['html', { outputFolder: 'playwright-report/performance' }],
    ['json', { outputFile: 'playwright-report/performance-results.json' }],
    ['line']
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Performance-specific settings
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  projects: [
    {
      name: 'performance-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Disable some features for consistent performance measurement
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-background-timer-throttling',
            '--disable-background-media-suspend',
            '--disable-low-res-tiling',
            '--disable-new-content-rendering-timeout',
            '--disable-threaded-animation',
            '--disable-threaded-scrolling',
            '--disable-partial-raster',
            '--disable-image-animation-resync'
          ]
        }
      }
    },
    {
      name: 'responsive-mobile',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'responsive-tablet',
      use: { ...devices['iPad Pro'] }
    },
    {
      name: 'responsive-desktop',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
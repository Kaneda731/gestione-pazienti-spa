// test-migration.js

console.log('Testing migration...');

// Test import dei servizi core
import { environment } from './src/app/config/environment.js';
import { STORAGE_KEYS } from './src/app/config/constants.js';

console.log('Environment:', environment);
console.log('Storage keys:', STORAGE_KEYS);

// Test completato
console.log('Migration test completed successfully!');

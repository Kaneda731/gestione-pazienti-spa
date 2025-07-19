// src/core/utils/oauthTest.js

import { logger } from '../services/loggerService.js';

/**
 * Test utilities per OAuth
 */

function testOAuthFlow() {
    logger.log('OAuth Test - Testing flow...');
    
    // Simula un test del flusso OAuth
    const testData = {
        redirectUrl: window.location.origin,
        provider: 'google',
        timestamp: new Date().toISOString()
    };
    
    logger.log('OAuth Test - Data:', testData);
    
    return testData;
}

function validateOAuthResponse(response) {
    logger.log('OAuth Test - Validating response:', response);
    
    const requiredFields = ['access_token', 'token_type', 'expires_in'];
    const hasRequiredFields = requiredFields.every(field => response[field]);
    
    logger.log('OAuth Test - Validation result:', hasRequiredFields);
    
    return hasRequiredFields;
}

// Auto-test all'avvio se in modalità debug
if (import.meta.env.VITE_OAUTH_DEBUG === 'true') {
    logger.log('OAuth Test mode enabled');
    testOAuthFlow();
}

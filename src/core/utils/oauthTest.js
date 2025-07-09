// src/core/utils/oauthTest.js

/**
 * Test utilities per OAuth
 */

export function testOAuthFlow() {
    console.log('OAuth Test - Testing flow...');
    
    // Simula un test del flusso OAuth
    const testData = {
        redirectUrl: window.location.origin,
        provider: 'google',
        timestamp: new Date().toISOString()
    };
    
    console.log('OAuth Test - Data:', testData);
    
    return testData;
}

export function validateOAuthResponse(response) {
    console.log('OAuth Test - Validating response:', response);
    
    const requiredFields = ['access_token', 'token_type', 'expires_in'];
    const hasRequiredFields = requiredFields.every(field => response[field]);
    
    console.log('OAuth Test - Validation result:', hasRequiredFields);
    
    return hasRequiredFields;
}

// Auto-test all'avvio se in modalità debug
if (import.meta.env.VITE_OAUTH_DEBUG === 'true') {
    console.log('OAuth Test mode enabled');
    testOAuthFlow();
}

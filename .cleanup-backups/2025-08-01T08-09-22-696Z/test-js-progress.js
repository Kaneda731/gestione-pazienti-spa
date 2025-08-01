// Test progress bar JavaScript
console.log('🧪 Testing JavaScript progress bar...');

// Crea una notifica di test
window.notificationService.show('success', 'Test progress bar con autoclose', {
    duration: 4000,
    title: 'Test JS Progress Bar'
});

console.log('✅ Test notification created - should show progress bar animation and auto-close after 4 seconds');

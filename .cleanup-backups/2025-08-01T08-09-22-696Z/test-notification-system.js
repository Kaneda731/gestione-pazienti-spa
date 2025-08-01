console.log('🧪 Testing notification system...');
window.notificationService.show('success', 'Test progress bar JavaScript con autoclose', {
    duration: 5000,
    title: 'Test Sistema'
});
console.log('✅ Notification created');

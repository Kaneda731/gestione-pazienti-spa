/**
 * Comandi di debug per testare la progress bar migliorata
 * Utilizzabili dalla console del browser
 */

// Comandi disponibili nella console
window.debugProgressBar = {
    
    // Test base
    testJS: (type = 'info', duration = 5000) => {
        console.log(`🧪 Testing JS progress bar: ${type}, ${duration}ms`);
        window.notificationService?.show(type, `Test JS Progress Bar - ${type}`, {
            useJavaScriptProgressBar: true,
            duration: duration,
            pauseOnHover: true,
            title: `JS Test ${type.toUpperCase()}`
        });
    },
    
    testCSS: (type = 'info', duration = 5000) => {
        console.log(`🧪 Testing CSS progress bar: ${type}, ${duration}ms`);
        window.notificationService?.show(type, `Test CSS Progress Bar - ${type}`, {
            useJavaScriptProgressBar: false,
            duration: duration,
            title: `CSS Test ${type.toUpperCase()}`
        });
    },
    
    // Test performance
    performanceTest: async (count = 10) => {
        console.log(`🚀 Running performance test with ${count} notifications...`);
        
        const startTime = performance.now();
        const promises = [];
        
        for (let i = 0; i < count; i++) {
            const type = ['success', 'warning', 'info'][i % 3];
            const duration = 3000 + (i * 200);
            
            setTimeout(() => {
                window.notificationService?.show(type, `Performance test ${i + 1}/${count}`, {
                    useJavaScriptProgressBar: true,
                    duration: duration,
                    title: `Perf ${i + 1}`
                });
            }, i * 100);
        }
        
        const endTime = performance.now();
        console.log(`✅ ${count} notifications created in ${(endTime - startTime).toFixed(2)}ms`);
        
        // Avvia monitoring automatico
        if (window.progressBarDebug) {
            window.progressBarDebug.start();
            
            setTimeout(() => {
                window.progressBarDebug.stop();
                window.progressBarDebug.logReport();
            }, Math.max(...Array.from({length: count}, (_, i) => 3000 + (i * 200))) + 1000);
        }
    },
    
    // Test interazioni
    testHover: () => {
        console.log('🖱️ Testing hover pause/resume...');
        window.notificationService?.show('info', 'Passa il mouse sopra per mettere in pausa! 🖱️', {
            useJavaScriptProgressBar: true,
            duration: 10000,
            pauseOnHover: true,
            title: 'Hover Test'
        });
    },
    
    testTouch: () => {
        console.log('👆 Testing touch interactions...');
        window.notificationService?.show('warning', 'Tocca e tieni premuto per mettere in pausa! 👆', {
            useJavaScriptProgressBar: true,
            duration: 8000,
            title: 'Touch Test'
        });
    },
    
    // Test durate diverse
    testDurations: () => {
        console.log('⏱️ Testing different durations...');
        const durations = [2000, 5000, 10000, 15000];
        const types = ['success', 'info', 'warning', 'info'];
        
        durations.forEach((duration, index) => {
            setTimeout(() => {
                window.notificationService?.show(types[index], `Durata: ${duration}ms`, {
                    useJavaScriptProgressBar: true,
                    duration: duration,
                    title: `${duration}ms`
                });
            }, index * 500);
        });
    },
    
    // Test memoria
    memoryTest: async () => {
        console.log('💾 Testing memory usage...');
        
        const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
        
        // Crea molte notifiche
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                window.notificationService?.show('info', `Memory test ${i + 1}/50`, {
                    useJavaScriptProgressBar: true,
                    duration: 2000,
                    title: `Mem ${i + 1}`
                });
            }, i * 50);
        }
        
        // Monitora memoria dopo 5 secondi
        setTimeout(() => {
            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryDelta = finalMemory - initialMemory;
            
            console.log(`Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
            console.log(`Memory delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
            
            if (memoryDelta > 10 * 1024 * 1024) { // 10MB
                console.warn('⚠️ High memory usage detected!');
            } else {
                console.log('✅ Memory usage within acceptable limits');
            }
        }, 5000);
    },
    
    // Confronto CSS vs JS
    comparePerformance: () => {
        console.log('⚖️ Comparing CSS vs JS progress bars...');
        
        // Test CSS
        console.time('CSS Progress Bar Creation');
        for (let i = 0; i < 10; i++) {
            window.notificationService?.show('success', `CSS Test ${i + 1}`, {
                useJavaScriptProgressBar: false,
                duration: 3000,
                title: `CSS ${i + 1}`
            });
        }
        console.timeEnd('CSS Progress Bar Creation');
        
        setTimeout(() => {
            // Test JS
            console.time('JS Progress Bar Creation');
            for (let i = 0; i < 10; i++) {
                window.notificationService?.show('info', `JS Test ${i + 1}`, {
                    useJavaScriptProgressBar: true,
                    duration: 3000,
                    title: `JS ${i + 1}`
                });
            }
            console.timeEnd('JS Progress Bar Creation');
        }, 1000);
    },
    
    // Cleanup e reset
    clear: () => {
        console.log('🧹 Clearing all notifications...');
        window.notificationService?.clearAll();
    },
    
    reset: () => {
        console.log('🔄 Resetting debug metrics...');
        if (window.progressBarDebug) {
            window.progressBarDebug.reset();
        }
    },
    
    // Modalità debug
    enableDebug: () => {
        document.body.setAttribute('data-debug', 'true');
        localStorage.setItem('debug-progress-bar', 'true');
        console.log('🔧 Debug mode enabled');
    },
    
    disableDebug: () => {
        document.body.removeAttribute('data-debug');
        localStorage.removeItem('debug-progress-bar');
        console.log('🔧 Debug mode disabled');
    },
    
    // Help
    help: () => {
        console.group('🆘 Debug Progress Bar Commands');
        console.log('testJS(type, duration) - Test JavaScript progress bar');
        console.log('testCSS(type, duration) - Test CSS progress bar');
        console.log('performanceTest(count) - Run performance test');
        console.log('testHover() - Test hover interactions');
        console.log('testTouch() - Test touch interactions');
        console.log('testDurations() - Test different durations');
        console.log('memoryTest() - Test memory usage');
        console.log('comparePerformance() - Compare CSS vs JS');
        console.log('clear() - Clear all notifications');
        console.log('reset() - Reset debug metrics');
        console.log('enableDebug() - Enable debug mode');
        console.log('disableDebug() - Disable debug mode');
        console.log('help() - Show this help');
        console.groupEnd();
        
        console.log('💡 Example usage:');
        console.log('debugProgressBar.testJS("success", 5000)');
        console.log('debugProgressBar.performanceTest(20)');
        console.log('debugProgressBar.comparePerformance()');
    }
};

// Mostra help automaticamente
console.log('🔧 Debug Progress Bar Commands loaded!');
console.log('Type "debugProgressBar.help()" for available commands');

// Auto-enable debug se richiesto
if (localStorage.getItem('debug-progress-bar') === 'true') {
    window.debugProgressBar.enableDebug();
}

export default window.debugProgressBar;
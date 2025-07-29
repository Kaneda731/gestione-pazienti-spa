// src/core/services/notificationErrorHandlerDemo.js

/**
 * Demo e esempi di utilizzo del NotificationErrorHandler
 * Questo file mostra come il sistema di error handling funziona in pratica
 */

import { NotificationErrorHandler } from './notificationErrorHandler.js';
import { notificationService } from './notificationService.js';

/**
 * Demo delle funzionalità di error handling
 */
export class NotificationErrorHandlerDemo {
    
    /**
     * Simula errori di rendering per testare il fallback
     */
    static async demoRenderErrors() {
        console.log('🧪 Demo: Testing render error handling...');
        
        try {
            // Simula un errore di rendering
            throw new Error('Simulated render error');
        } catch (error) {
            const notification = {
                id: 'demo-1',
                type: 'error',
                message: 'Questo è un test di fallback per errori di rendering',
                title: 'Errore di Rendering'
            };
            
            const fallbackElement = NotificationErrorHandler.handleRenderError(
                error,
                notification,
                (notif) => NotificationErrorHandler.createSimpleFallback(notif)
            );
            
            if (fallbackElement) {
                console.log('✅ Fallback element created successfully');
                
                // Aggiungi al DOM se possibile
                const container = document.querySelector('.notification-container') || document.body;
                if (container) {
                    container.appendChild(fallbackElement);
                    console.log('✅ Fallback notification added to DOM');
                    
                    // Rimuovi dopo 5 secondi
                    setTimeout(() => {
                        if (fallbackElement.parentNode) {
                            fallbackElement.remove();
                            console.log('🧹 Demo fallback notification removed');
                        }
                    }, 5000);
                }
            }
        }
    }
    
    /**
     * Simula errori di animazione
     */
    static demoAnimationErrors() {
        console.log('🧪 Demo: Testing animation error handling...');
        
        // Crea un elemento mock
        const mockElement = document.createElement('div');
        mockElement.className = 'notification notification--info';
        mockElement.style.animation = 'slideInRight 0.3s ease-out';
        
        try {
            // Simula errore di animazione
            throw new Error('Animation not supported');
        } catch (error) {
            NotificationErrorHandler.handleAnimationError(error, mockElement, 'entrance');
            console.log('✅ Animation error handled, fallback applied');
            console.log('Element styles:', {
                animation: mockElement.style.animation,
                opacity: mockElement.style.opacity,
                transform: mockElement.style.transform
            });
        }
    }
    
    /**
     * Dimostra il sistema di queue per DOM non ready
     */
    static demoQueueSystem() {
        console.log('🧪 Demo: Testing notification queue system...');
        
        // Simula DOM non ready
        const originalDOMReady = NotificationErrorHandler.isDOMReady;
        NotificationErrorHandler.isDOMReady = false;
        
        const renderFunction = (notification) => {
            console.log('📝 Rendering queued notification:', notification.message);
            return NotificationErrorHandler.createSimpleFallback(notification);
        };
        
        const notification = {
            id: 'demo-queue-1',
            type: 'info',
            message: 'Questa notifica è stata messa in queue'
        };
        
        // Aggiungi alla queue
        const result = NotificationErrorHandler.queueNotification(renderFunction, notification);
        console.log('📋 Notification queued, result:', result);
        console.log('📋 Queue size:', NotificationErrorHandler.notificationQueue.length);
        
        // Simula DOM ready dopo 2 secondi
        setTimeout(() => {
            console.log('🚀 Simulating DOM ready...');
            NotificationErrorHandler.isDOMReady = true;
            NotificationErrorHandler.processNotificationQueue();
            console.log('✅ Queue processed');
            
            // Ripristina stato originale
            NotificationErrorHandler.isDOMReady = originalDOMReady;
        }, 2000);
    }
    
    /**
     * Dimostra le strategie di recovery
     */
    static demoRecoveryStrategies() {
        console.log('🧪 Demo: Testing recovery strategies...');
        
        // Test recovery da errore di show
        console.log('🔄 Testing show error recovery...');
        const notification = {
            id: 'demo-recovery-1',
            type: 'warning',
            message: 'Test recovery da errore di show'
        };
        
        const showRecoveryResult = NotificationErrorHandler.recoverFromShowError(notification);
        console.log('✅ Show recovery result:', showRecoveryResult);
        
        // Test recovery da errore di init
        console.log('🔄 Testing init error recovery...');
        const initRecoveryResult = NotificationErrorHandler.recoverFromInitError();
        console.log('✅ Init recovery result:', initRecoveryResult);
    }
    
    /**
     * Mostra le statistiche degli errori
     */
    static demoErrorStatistics() {
        console.log('🧪 Demo: Error statistics tracking...');
        
        // Simula alcuni errori
        NotificationErrorHandler.handleRenderError(new Error('Test render error'), {});
        NotificationErrorHandler.handleAnimationError(new Error('Test animation error'), {});
        NotificationErrorHandler.handleServiceError(new Error('Test service error'), 'test');
        NotificationErrorHandler.handleDOMError(new Error('Test DOM error'), 'test');
        
        const stats = NotificationErrorHandler.getErrorStats();
        console.log('📊 Error statistics:', stats);
        
        // Reset statistiche
        NotificationErrorHandler.resetErrorStats();
        console.log('🧹 Statistics reset');
        console.log('📊 New statistics:', NotificationErrorHandler.getErrorStats());
    }
    
    /**
     * Testa il supporto per animazioni e reduced motion
     */
    static demoAnimationSupport() {
        console.log('🧪 Demo: Animation support detection...');
        
        NotificationErrorHandler.checkAnimationSupport();
        NotificationErrorHandler.checkReducedMotionPreference();
        
        console.log('🎬 Animation support:', NotificationErrorHandler.animationSupport);
        console.log('🎬 Reduced motion preference:', NotificationErrorHandler.reducedMotionPreference);
        console.log('🎬 Should disable animations:', NotificationErrorHandler.shouldDisableAnimations());
    }
    
    /**
     * Dimostra l'integrazione con il notification service
     */
    static async demoServiceIntegration() {
        console.log('🧪 Demo: Service integration...');
        
        try {
            // Inizializza il servizio
            notificationService.init();
            
            // Testa notifica normale
            console.log('📝 Creating normal notification...');
            notificationService.success('Notifica normale di test');
            
            // Simula errore nel servizio
            console.log('📝 Simulating service error...');
            try {
                throw new Error('Simulated service error');
            } catch (error) {
                NotificationErrorHandler.handleServiceError(error, 'show', {
                    type: 'error',
                    message: 'Errore simulato del servizio'
                });
            }
            
            console.log('✅ Service integration demo completed');
            
        } catch (error) {
            console.error('❌ Service integration demo failed:', error);
        }
    }
    
    /**
     * Esegue tutti i demo
     */
    static async runAllDemos() {
        console.log('🚀 Starting NotificationErrorHandler demos...');
        console.log('=====================================');
        
        await this.demoRenderErrors();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.demoAnimationErrors();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.demoQueueSystem();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        this.demoRecoveryStrategies();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.demoErrorStatistics();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.demoAnimationSupport();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.demoServiceIntegration();
        
        console.log('=====================================');
        console.log('✅ All demos completed successfully!');
    }
}

// Auto-esegui demo se in ambiente di sviluppo
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    // Esegui demo dopo che il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Aggiungi un piccolo delay per permettere l'inizializzazione
            setTimeout(() => {
                console.log('🎯 NotificationErrorHandler demo available');
                console.log('Run NotificationErrorHandlerDemo.runAllDemos() to see all demos');
            }, 1000);
        });
    } else {
        setTimeout(() => {
            console.log('🎯 NotificationErrorHandler demo available');
            console.log('Run NotificationErrorHandlerDemo.runAllDemos() to see all demos');
        }, 1000);
    }
}

export default NotificationErrorHandlerDemo;
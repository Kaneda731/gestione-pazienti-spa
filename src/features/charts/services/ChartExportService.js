// src/features/charts/services/ChartExportService.js

/**
 * Gestisce l'esportazione e la condivisione dei grafici
 */
class ChartExportService {
  /**
   * Esporta il grafico come immagine
   * @param {Chart} chart - L'istanza del grafico da esportare
   * @param {string} format - Il formato dell'immagine (png/jpg)
   * @param {Object} metadata - Metadati da includere nell'immagine
   * @returns {Promise<Blob>} - L'immagine come Blob
   */
  async exportAsImage(chart, format = 'png', metadata = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Verifica che il grafico sia valido
        if (!chart || !chart.canvas) {
          throw new Error('Grafico non valido per l\'esportazione');
        }
        
        // Create temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        
        // Imposta le dimensioni del canvas di esportazione
        const pixelRatio = window.devicePixelRatio || 1;
        const width = chart.canvas.width;
        const height = chart.canvas.height;
        
        exportCanvas.width = width * pixelRatio;
        exportCanvas.height = height * pixelRatio;
        
        // Scala il contesto per ottenere un'immagine di alta qualità
        ctx.scale(pixelRatio, pixelRatio);
        
        // Imposta lo sfondo bianco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Disegna il grafico sul canvas di esportazione
        ctx.drawImage(chart.canvas, 0, 0, width, height);
        
        // Aggiungi metadati se presenti
        if (metadata && Object.keys(metadata).length > 0) {
          ctx.fillStyle = '#f8f9fa';
          ctx.fillRect(0, height - 40, width, 40);
          
          ctx.font = '12px Arial';
          ctx.fillStyle = '#6c757d';
          
          // Aggiungi timestamp
          if (metadata.timestamp) {
            ctx.fillText(`Generato il: ${metadata.timestamp}`, 10, height - 25);
          }
          
          // Aggiungi filtri
          if (metadata.filters) {
            const filtersText = Object.entries(metadata.filters)
              .filter(([_, value]) => value)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            
            if (filtersText) {
              ctx.fillText(`Filtri: ${filtersText}`, 10, height - 10);
            }
          }
        }
        
        // Converti il canvas in Blob
        exportCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Impossibile generare l\'immagine'));
          }
        }, `image/${format}`, 0.95);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Genera un link condivisibile per il grafico
   * @param {Object} filters - I filtri applicati al grafico
   * @param {string} chartType - Il tipo di grafico
   * @returns {string} - URL condivisibile
   */
  generateShareableLink(filters, chartType) {
    // Crea un oggetto con i parametri da includere nell'URL
    const params = {
      ...filters,
      chartType
    };
    
    // Filtra i parametri vuoti
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    );
    
    // Crea la query string
    const queryString = new URLSearchParams(filteredParams).toString();
    
    // Ottieni l'URL base della pagina corrente
    const baseUrl = window.location.href.split('?')[0];
    
    // Restituisci l'URL completo
    return `${baseUrl}?${queryString}`;
  }
  
  /**
   * Invia il grafico via email
   * @param {Blob} imageBlob - L'immagine del grafico
   * @param {string} emailAddress - L'indirizzo email del destinatario
   * @param {Object} metadata - Metadati da includere nell'email
   * @returns {Promise<boolean>} - Esito dell'invio
   */
  async shareViaEmail(imageBlob, emailAddress, metadata = {}) {
    try {
      // Converti il Blob in una URL dati
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const dataUrl = reader.result;
            
            // Crea il corpo dell'email
            let body = 'Ecco il grafico richiesto.\n\n';
            
            // Aggiungi metadati se presenti
            if (metadata.timestamp) {
              body += `Generato il: ${metadata.timestamp}\n`;
            }
            
            if (metadata.filters) {
              const filtersText = Object.entries(metadata.filters)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
              
              if (filtersText) {
                body += `Filtri applicati: ${filtersText}\n`;
              }
            }
            
            // Crea l'URL mailto
            const subject = encodeURIComponent('Condivisione Grafico');
            const encodedBody = encodeURIComponent(body);
            const mailtoUrl = `mailto:${emailAddress}?subject=${subject}&body=${encodedBody}`;
            
            // Apri il client email predefinito
            window.open(mailtoUrl);
            
            // Nota: non possiamo allegare direttamente l'immagine usando mailto
            // Informiamo l'utente che dovrà allegare manualmente l'immagine
            alert('Si aprirà il tuo client email. Per allegare l\'immagine del grafico, salva prima l\'immagine usando la funzione "Esporta come immagine" e poi allegala manualmente all\'email.');
            
            resolve(true);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Errore nella lettura dell\'immagine'));
        };
        
        reader.readAsDataURL(imageBlob);
      });
    } catch (error) {
      console.error('Errore nella condivisione via email:', error);
      throw new Error('Impossibile condividere il grafico via email');
    }
  }
  
  /**
   * Scarica il grafico come immagine
   * @param {Blob} imageBlob - L'immagine del grafico
   * @param {string} fileName - Il nome del file
   */
  downloadImage(imageBlob, fileName = 'grafico') {
    // Crea un elemento <a> per il download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(imageBlob);
    link.download = `${fileName}.png`;
    
    // Aggiungi l'elemento al DOM e simula il click
    document.body.appendChild(link);
    link.click();
    
    // Rimuovi l'elemento dal DOM
    document.body.removeChild(link);
    
    // Rilascia l'URL oggetto
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  }
}

export default ChartExportService;
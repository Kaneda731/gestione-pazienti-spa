/**
 * Fixtures per dati grafici con diversi formati e scenari
 */

/**
 * Dati base per grafici a torta
 */
export const pieChartData = {
  // Dati semplici per test base
  simple: [
    ['Medicina', 15],
    ['Chirurgia', 12],
    ['Cardiologia', 8]
  ],
  
  // Dati completi per test avanzati
  complete: [
    ['Medicina Generale', 25],
    ['Chirurgia Generale', 18],
    ['Cardiologia', 15],
    ['Pediatria', 12],
    ['Ortopedia', 10],
    ['Neurologia', 8],
    ['Ginecologia', 6],
    ['Dermatologia', 4],
    ['Oculistica', 2]
  ],
  
  // Dati con valori zero per test edge cases
  withZeros: [
    ['Attivi', 20],
    ['Dimessi', 15],
    ['In Attesa', 0],
    ['Trasferiti', 3]
  ],
  
  // Dati con un solo elemento
  single: [
    ['Unico Reparto', 100]
  ],
  
  // Dati vuoti per test errori
  empty: []
};

/**
 * Dati per grafici a barre
 */
export const barChartData = {
  // Ricoveri per mese
  monthlyAdmissions: [
    ['Gennaio', 45],
    ['Febbraio', 38],
    ['Marzo', 52],
    ['Aprile', 41],
    ['Maggio', 47],
    ['Giugno', 55]
  ],
  
  // Confronto reparti
  departmentComparison: [
    ['Medicina', 25],
    ['Chirurgia', 18],
    ['Cardiologia', 15],
    ['Pediatria', 12],
    ['Ortopedia', 10]
  ],
  
  // Dati con valori negativi (per test edge cases)
  withNegatives: [
    ['Entrate', 50],
    ['Uscite', -30],
    ['Trasferimenti', -5],
    ['Netto', 15]
  ],
  
  // Dati con range molto diversi
  differentRanges: [
    ['Piccolo', 2],
    ['Medio', 150],
    ['Grande', 1500],
    ['Enorme', 15000]
  ]
};

/**
 * Dati per grafici a linee
 */
export const lineChartData = {
  // Trend pazienti nel tempo
  patientTrend: [
    ['01/01', 120],
    ['02/01', 125],
    ['03/01', 118],
    ['04/01', 132],
    ['05/01', 128],
    ['06/01', 135],
    ['07/01', 142]
  ],
  
  // Confronto multiple serie
  multiSeries: {
    labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag'],
    datasets: [
      {
        label: 'Ricoveri',
        data: [45, 38, 52, 41, 47],
        borderColor: '#FF6384',
        fill: false
      },
      {
        label: 'Dimissioni',
        data: [42, 35, 48, 39, 44],
        borderColor: '#36A2EB',
        fill: false
      }
    ]
  },
  
  // Dati con trend crescente
  growingTrend: [
    ['Q1', 100],
    ['Q2', 120],
    ['Q3', 145],
    ['Q4', 175]
  ],
  
  // Dati con fluttuazioni
  fluctuating: [
    ['Lun', 25],
    ['Mar', 45],
    ['Mer', 30],
    ['Gio', 55],
    ['Ven', 35],
    ['Sab', 20],
    ['Dom', 15]
  ]
};

/**
 * Configurazioni grafici per test
 */
export const chartConfigurations = {
  // Configurazione base pie chart
  pieBasic: {
    type: 'pie',
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  },
  
  // Configurazione pie chart con personalizzazioni
  pieCustom: {
    type: 'pie',
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Distribuzione Pazienti per Reparto'
        }
      },
      cutout: '30%' // Donut chart
    }
  },
  
  // Configurazione bar chart
  barBasic: {
    type: 'bar',
    options: {
      responsive: true,
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Reparti'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Numero Pazienti'
          },
          beginAtZero: true
        }
      }
    }
  },
  
  // Configurazione line chart
  lineBasic: {
    type: 'line',
    options: {
      responsive: true,
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Periodo'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Numero Pazienti'
          },
          beginAtZero: true
        }
      },
      elements: {
        line: {
          tension: 0.1
        }
      }
    }
  },
  
  // Configurazione responsive
  responsive: {
    type: 'pie',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    }
  }
};

/**
 * Dati per test performance con dataset grandi
 */
export function createLargeDataset(size = 1000) {
  const data = [];
  const categories = ['Cat A', 'Cat B', 'Cat C', 'Cat D', 'Cat E'];
  
  for (let i = 0; i < size; i++) {
    const category = categories[i % categories.length];
    const value = Math.floor(Math.random() * 100) + 1;
    data.push([`${category} ${Math.floor(i / categories.length) + 1}`, value]);
  }
  
  return data;
}

/**
 * Dati per test filtri e aggregazioni
 */
export const filterTestData = {
  // Dati con date per filtri temporali
  withDates: [
    { label: 'Gen 2024', value: 45, date: '2024-01-01' },
    { label: 'Feb 2024', value: 38, date: '2024-02-01' },
    { label: 'Mar 2024', value: 52, date: '2024-03-01' },
    { label: 'Apr 2024', value: 41, date: '2024-04-01' }
  ],
  
  // Dati con categorie per filtri
  withCategories: [
    { label: 'Medicina', value: 25, category: 'Medico', priority: 'high' },
    { label: 'Chirurgia', value: 18, category: 'Chirurgico', priority: 'high' },
    { label: 'Radiologia', value: 8, category: 'Diagnostico', priority: 'medium' },
    { label: 'Laboratorio', value: 12, category: 'Diagnostico', priority: 'low' }
  ],
  
  // Dati per aggregazioni
  forAggregation: [
    { reparto: 'Medicina', diagnosi: 'Ipertensione', count: 10 },
    { reparto: 'Medicina', diagnosi: 'Diabete', count: 8 },
    { reparto: 'Chirurgia', diagnosi: 'Appendicite', count: 6 },
    { reparto: 'Chirurgia', diagnosi: 'Ernia', count: 4 },
    { reparto: 'Cardiologia', diagnosi: 'Infarto', count: 5 }
  ]
};

/**
 * Dati per test responsive design
 */
export const responsiveTestData = {
  // Dati ottimali per mobile (pochi elementi)
  mobile: [
    ['Medicina', 35],
    ['Chirurgia', 25],
    ['Altro', 40]
  ],
  
  // Dati per tablet (elementi medi)
  tablet: [
    ['Medicina', 25],
    ['Chirurgia', 18],
    ['Cardiologia', 15],
    ['Pediatria', 12],
    ['Altro', 30]
  ],
  
  // Dati per desktop (molti elementi)
  desktop: [
    ['Medicina Generale', 25],
    ['Chirurgia Generale', 18],
    ['Cardiologia', 15],
    ['Pediatria', 12],
    ['Ortopedia', 10],
    ['Neurologia', 8],
    ['Ginecologia', 6],
    ['Dermatologia', 4],
    ['Oculistica', 2]
  ]
};

/**
 * Colori predefiniti per grafici
 */
export const chartColors = {
  // Palette base
  primary: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
  
  // Palette per tema scuro
  dark: ['#FF6B8A', '#4FACFE', '#FFD93D', '#6BCF7F', '#A855F7', '#FB923C'],
  
  // Palette per tema chiaro
  light: ['#DC2626', '#2563EB', '#D97706', '#059669', '#7C3AED', '#EA580C'],
  
  // Palette monocromatica
  monochrome: ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'],
  
  // Palette per accessibilità
  accessible: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
};

/**
 * Temi per grafici
 */
export const chartThemes = {
  light: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    gridColor: '#e5e5e5',
    colors: chartColors.light
  },
  
  dark: {
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    gridColor: '#374151',
    colors: chartColors.dark
  },
  
  highContrast: {
    backgroundColor: '#000000',
    textColor: '#ffffff',
    gridColor: '#666666',
    colors: ['#ffffff', '#ffff00', '#00ffff', '#ff00ff', '#00ff00', '#ff0000']
  }
};

/**
 * Helper per creare dati chart personalizzati
 */
export function createChartData(type, itemCount = 5, valueRange = [1, 100]) {
  const data = [];
  const [min, max] = valueRange;
  
  for (let i = 0; i < itemCount; i++) {
    const label = `Item ${i + 1}`;
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    data.push([label, value]);
  }
  
  return data;
}

/**
 * Helper per convertire dati in formato Chart.js
 */
export function toChartJsFormat(data, chartType = 'pie') {
  if (!Array.isArray(data) || data.length === 0) {
    return { labels: [], datasets: [] };
  }
  
  // Se è già in formato Chart.js
  if (data.labels && data.datasets) {
    return data;
  }
  
  // Se è array di array
  if (Array.isArray(data[0])) {
    const labels = data.map(item => item[0]);
    const values = data.map(item => item[1]);
    
    const dataset = {
      data: values,
      backgroundColor: chartColors.primary.slice(0, values.length)
    };
    
    if (chartType === 'bar' || chartType === 'line') {
      dataset.label = 'Dataset';
    }
    
    if (chartType === 'line') {
      dataset.fill = false;
      dataset.tension = 0.1;
      dataset.borderColor = chartColors.primary[0];
    }
    
    return {
      labels,
      datasets: [dataset]
    };
  }
  
  // Se è array di oggetti
  if (typeof data[0] === 'object') {
    const labels = data.map(item => item.label || item.name);
    const values = data.map(item => item.value || item.count);
    
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors.primary.slice(0, values.length),
        label: chartType === 'bar' || chartType === 'line' ? 'Dataset' : undefined
      }]
    };
  }
  
  return { labels: [], datasets: [] };
}

/**
 * Dati per test edge cases
 */
export const edgeCaseData = {
  // Valori molto grandi
  largeValues: [
    ['Item A', 1000000],
    ['Item B', 2500000],
    ['Item C', 750000]
  ],
  
  // Valori decimali
  decimals: [
    ['Item A', 12.5],
    ['Item B', 8.75],
    ['Item C', 15.25]
  ],
  
  // Etichette molto lunghe
  longLabels: [
    ['Reparto di Medicina Generale con Specializzazione in Cardiologia', 25],
    ['Reparto di Chirurgia Generale e Specialistica', 18],
    ['Reparto di Pediatria e Neonatologia', 12]
  ],
  
  // Caratteri speciali nelle etichette
  specialCharacters: [
    ['Reparto "Medicina"', 25],
    ['Chirurgia & Ortopedia', 18],
    ['Pediatria (0-14 anni)', 12],
    ['Geriatria 65+', 8]
  ]
};
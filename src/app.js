function main() {
  // Supabase Credentials
  const SUPABASE_URL = 'https://aiguzywadjzyrwandgba.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw';

  if (!window.supabase) {
    document.body.innerHTML = '<h1 style="color:red; text-align:center; padding-top: 50px;">Errore critico: La libreria Supabase non è stata caricata.</h1>';
    return;
  }
  
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: sessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  // DOM Elements
  const appContainer = document.getElementById('app-container');
  const authContainer = document.getElementById('auth-container');
  const homeButton = document.getElementById('home-button');

  // Templates
  const loginTemplate = document.getElementById('auth-template-login');
  const logoutTemplate = document.getElementById('auth-template-logout');

  const viewTemplates = {
    home: document.getElementById('view-home'),
    grafico: document.getElementById('view-grafico'),
    inserimento: document.getElementById('view-inserimento'),
    dimissione: document.getElementById('view-dimissione'),
  };

  // --- MENU ---
  const menuItems = [
    { hash: '#grafico', icon: 'pie_chart', text: 'Crea Grafico Avanzato' },
    { hash: '#tempo-media-degenza', icon: 'timelapse', text: 'Tempo Medio Degenza' },
    { hash: '#inserimento', icon: 'person_add', text: 'Nuovo Paziente' },
    { hash: '#dimissione', icon: 'event_available', text: 'Dimetti Paziente' },
    { hash: '#importa-csv', icon: 'upload_file', text: 'Avvia Importazione CSV' },
    { hash: '#crea-foglio-filtrato', icon: 'filter_alt', text: 'Crea Foglio Filtrato' },
    { hash: '#aggiorna-foglio', icon: 'refresh', text: 'Aggiorna Foglio Attivo' },
    { hash: '#formatta', icon: 'format_paint', text: 'Applica Formattazione Standard' },
    { hash: '#colori-alternati', icon: 'palette', text: 'Applica Colori Alternati' },
    { hash: '#copia-speciale', icon: 'content_copy', text: 'Copia Senza Formattazione' },
  ];

  function initHomeView() {
    const menuGrid = document.querySelector('.menu-grid');
    if (!menuGrid) return;

    menuGrid.innerHTML = ''; 

    menuItems.forEach(item => {
      const button = document.createElement('a');
      button.href = item.hash;
      button.className = 'menu-btn';
      button.innerHTML = `
        <span class="material-icons">${item.icon}</span>
        <p>${item.text}</p>
      `;
      menuGrid.appendChild(button);
    });
  }

  // --- ROUTER ---
  function handleRouteChange() {
    const hash = window.location.hash || '#home';
    const viewName = hash.substring(1);
    
    const template = viewTemplates[viewName] || viewTemplates.home;
    
    if (template) {
      appContainer.innerHTML = '';
      const viewContent = template.content.cloneNode(true);
      appContainer.appendChild(viewContent);
      
      if (viewName === 'home' || !viewTemplates[viewName]) {
        initHomeView();
      } else if (viewName === 'grafico') {
        initGraficoView();
      } else if (viewName === 'inserimento') {
        initInserimentoView();
      } else if (viewName === 'dimissione') {
        initDimissioneView();
      } else if (viewName === 'tempo-media-degenza') {
        initTempoMedioDegenzaView();
      } else if (viewName === 'importa-csv') {
        initImportaCsvView();
      } else if (viewName === 'crea-foglio-filtrato') {
        initCreaFoglioFiltratoView();
      } else if (viewName === 'aggiorna-foglio') {
        initAggiornaFoglioView();
      } else if (viewName === 'formatta') {
        initFormattaView();
      } else if (viewName === 'colori-alternati') {
        initColoriAlternatiView();
      } else if (viewName === 'copia-speciale') {
        initCopiaSpecialeView();
      }
    }
  }

  // --- AUTHENTICATION ---
  function updateAuthUI(session) {
    authContainer.innerHTML = '';
    if (session) {
      const logoutContent = logoutTemplate.content.cloneNode(true);
      logoutContent.getElementById('user-email').textContent = session.user.email;
      logoutContent.getElementById('logout-button').addEventListener('click', () => {
        supabase.auth.signOut();
      });
      authContainer.appendChild(logoutContent);
    } else {
      const loginContent = loginTemplate.content.cloneNode(true);
      loginContent.getElementById('login-button').addEventListener('click', () => {
        supabase.auth.signInWithOAuth({ provider: 'google' });
      });
      authContainer.appendChild(loginContent);
    }
    handleRouteChange();
  }

  // --- VIEW INITIALIZERS ---
  function initGraficoView() {
    if (typeof google === 'undefined' || !google.charts) {
      document.getElementById('chart-container').innerHTML = '<p>Grafici in caricamento...</p>';
      return;
    }
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    async function drawChart() {
      const chartContainer = document.getElementById('chart-container');
      if (!chartContainer) return;
      chartContainer.innerHTML = '<div class="loading-spinner"></div>';
      
      const { data, error } = await supabase.from('pazienti').select('diagnosi');
      
      if (error) {
        chartContainer.innerHTML = `<p style="color:red;">Errore: ${error.message}</p>`;
        return;
      }
      if (!data || data.length === 0) {
        chartContainer.innerHTML = `<p>Nessun dato da visualizzare.</p>`;
        return;
      }
      const counts = data.reduce((acc, { diagnosi }) => {
        acc[diagnosi] = (acc[diagnosi] || 0) + 1;
        return acc;
      }, {});
      const dataArray = [['Diagnosi', 'Numero Pazienti'], ...Object.entries(counts)];
      const dataTable = google.visualization.arrayToDataTable(dataArray);
      const options = { title: 'Distribuzione Diagnosi', pieHole: 0.4, chartArea: { width: '90%', height: '80%' } };
      const chart = new google.visualization.PieChart(chartContainer);
      chart.draw(dataTable, options);
    }
  }

  async function initInserimentoView() {
    const form = document.getElementById('form-inserimento');
    if (!form) return;
    const authPrompt = document.querySelector('.auth-prompt');
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      form.style.display = 'block';
      if (authPrompt) authPrompt.style.display = 'none';
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        submitButton.disabled = true;
        submitButton.innerHTML = '<div class="loading-spinner"></div> Salvataggio...';
        mostraMessaggio('Salvataggio in corso...', 'loading');

        const formData = new FormData(e.target);
        const paziente = Object.fromEntries(formData.entries());

        // Assicura che i campi vuoti non vengano inviati se non sono obbligatori
        for (const key in paziente) {
          if (paziente[key] === '') {
            delete paziente[key];
          }
        }

        const { error } = await supabase.from('pazienti').insert([paziente]);
        
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;

        if (error) {
          mostraMessaggio(`Errore: ${error.message}`, 'error');
        } else {
          mostraMessaggio('Paziente inserito con successo!', 'success');
          form.reset();
          setTimeout(() => {
            window.location.hash = '#home';
          }, 1500);
        }
      });
    } else {
      form.style.display = 'none';
      if (authPrompt) authPrompt.style.display = 'block';
    }
  }

  async function initDimissioneView() {
    const form = document.getElementById('form-dimissione');
    if (!form) return;
    const authPrompt = document.querySelector('.auth-prompt');
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      form.style.display = 'block';
      if (authPrompt) authPrompt.style.display = 'none';
      
      const pazienteSelect = document.getElementById('paziente-select');
      pazienteSelect.innerHTML = '<option>Caricamento...</option>';

      const { data: pazienti, error } = await supabase.from('pazienti').select('id, nome, cognome').is('data_dimissione', null);

      if (error) {
        pazienteSelect.innerHTML = '<option>Errore</option>';
        return;
      }
      pazienteSelect.innerHTML = '<option value="">Seleziona paziente</option>';
      pazienti.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.cognome} ${p.nome}`;
        pazienteSelect.appendChild(option);
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pazienteId = e.target['paziente-select'].value;
        const dataDimissione = e.target.dataDimissione.value;
        const { error } = await supabase.from('pazienti').update({ data_dimissione: dataDimissione }).eq('id', pazienteId);
        if (error) {
          alert(`Errore: ${error.message}`);
        } else {
          alert('Paziente dimesso!');
          window.location.hash = '#home';
        }
      });
    } else {
      form.style.display = 'none';
      if (authPrompt) authPrompt.style.display = 'block';
    }
  }

  function mostraMessaggio(testo, tipo = 'info') {
    const container = document.getElementById('messaggio-container');
    if (!container) return;

    const alertClasses = {
      success: 'alert-success',
      error: 'alert-danger',
      loading: 'alert-info',
      info: 'alert-secondary'
    };

    const alertClass = alertClasses[tipo] || 'alert-secondary';
    
    const iconHtml = {
        success: '<span class="material-icons">check_circle</span>',
        error: '<span class="material-icons">error</span>',
        loading: '<div class="loading-spinner-small"></div>',
        info: '<span class="material-icons">info</span>'
    }[tipo];

    const messageDiv = document.createElement('div');
    messageDiv.className = `alert ${alertClass} d-flex align-items-center`;
    messageDiv.innerHTML = `${iconHtml}<div class="ms-2">${testo}</div>`;
    
    container.innerHTML = '';
    container.appendChild(messageDiv);

    if (tipo === 'success' || tipo === 'error') {
      setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => container.innerHTML = '', 500);
      }, 5000);
    }
  }

  // Placeholder for new views
  function initTempoMedioDegenzaView() { appContainer.innerHTML = '<h2>Tempo Medio Degenza (da implementare)</h2>'; }
  function initImportaCsvView() { appContainer.innerHTML = '<h2>Importazione CSV (da implementare)</h2>'; }
  function initCreaFoglioFiltratoView() { appContainer.innerHTML = '<h2>Crea Foglio Filtrato (da implementare)</h2>'; }
  function initAggiornaFoglioView() { appContainer.innerHTML = '<h2>Aggiorna Foglio Attivo (da implementare)</h2>'; }
  function initFormattaView() { appContainer.innerHTML = '<h2>Applica Formattazione (da implementare)</h2>'; }
  function initColoriAlternatiView() { appContainer.innerHTML = '<h2>Applica Colori Alternati (da implementare)</h2>'; }
  function initCopiaSpecialeView() { appContainer.innerHTML = '<h2>Copia Senza Formattazione (da implementare)</h2>'; }

  // --- APP INITIALIZATION ---
  window.addEventListener('hashchange', handleRouteChange);
  homeButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#home';
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session);
  });

  // Initial Load
  updateAuthUI(supabase.auth.getSession());

}

window.addEventListener('load', main);

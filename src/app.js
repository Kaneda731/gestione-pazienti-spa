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
    { hash: '#grafico', icon: 'pie_chart', text: 'Grafico Diagnosi' },
    { hash: '#inserimento', icon: 'person_add', text: 'Inserimento Paziente' },
    { hash: '#dimissione', icon: 'event_available', text: 'Dimissione Paziente' },
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
        const formData = new FormData(e.target);
        const paziente = Object.fromEntries(formData.entries());
        const { error } = await supabase.from('pazienti').insert([paziente]);
        if (error) {
          alert(`Errore: ${error.message}`);
        } else {
          alert('Paziente inserito!');
          window.location.hash = '#home';
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

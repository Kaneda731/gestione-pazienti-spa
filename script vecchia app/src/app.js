// Supabase Credentials
const SUPABASE_URL = 'https://aiguzywadjzyrwandgba.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3V6eXdhZGp6eXJ3YW5kZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDM1MzQsImV4cCI6MjA2Njc3OTUzNH0.pezVt3-xxkHBYK2V6ryHUtj_givF_TA9xwEzuK2essw';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
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
const loginTemplate = document.getElementById('auth-template-login').innerHTML;
const logoutTemplate = document.getElementById('auth-template-logout').innerHTML;

const views = {
  home: document.getElementById('view-home').innerHTML,
  grafico: document.getElementById('view-grafico').innerHTML,
  inserimento: document.getElementById('view-inserimento').innerHTML,
  dimissione: document.getElementById('view-dimissione').innerHTML,
};

// --- ROUTER ---
function handleRouteChange() {
  const hash = window.location.hash || '#home';
  const viewName = hash.substring(1);
  
  if (views[viewName]) {
    appContainer.innerHTML = views[viewName];
    
    // After rendering, execute view-specific logic
    if (viewName === 'grafico') {
      initGraficoView();
    } else if (viewName === 'inserimento') {
      initInserimentoView();
    } else if (viewName === 'dimissione') {
      initDimissioneView();
    }
  } else {
    appContainer.innerHTML = views.home;
  }
}

// --- AUTHENTICATION ---
function updateAuthUI(session) {
  if (session) {
    authContainer.innerHTML = logoutTemplate;
    document.getElementById('user-email').textContent = session.user.email;
    document.getElementById('logout-button').addEventListener('click', () => {
      supabase.auth.signOut();
    });
  } else {
    authContainer.innerHTML = loginTemplate;
    document.getElementById('login-button').addEventListener('click', () => {
      supabase.auth.signInWithOAuth({ provider: 'google' });
    });
  }
  // Re-render the current view to update its auth-dependent state
  handleRouteChange();
}

// --- VIEW INITIALIZERS ---

function initGraficoView() {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawChart);

  async function drawChart() {
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    const { data, error } = await supabase.from('pazienti').select('diagnosi');
    
    if (error) {
      chartContainer.innerHTML = `<p style="color:red;">Errore caricamento dati: ${error.message}</p>`;
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

    const dataArray = [['Diagnosi', 'Numero Pazienti']];
    for (const [diagnosi, count] of Object.entries(counts)) {
      dataArray.push([diagnosi, count]);
    }

    const dataTable = google.visualization.arrayToDataTable(dataArray);
    const options = {
      title: 'Distribuzione Diagnosi Pazienti',
      pieHole: 0.4,
      chartArea: { width: '90%', height: '80%' },
    };

    const chart = new google.visualization.PieChart(chartContainer);
    chart.draw(dataTable, options);
  }
}

async function initInserimentoView() {
  const form = document.getElementById('form-inserimento');
  const authPrompt = form.previousElementSibling;
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    form.style.display = 'block';
    authPrompt.style.display = 'none';
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const paziente = Object.fromEntries(formData.entries());
      
      const { error } = await supabase.from('pazienti').insert([paziente]);
      
      if (error) {
        alert(`Errore: ${error.message}`);
      } else {
        alert('Paziente inserito con successo!');
        window.location.hash = '#home';
      }
    });
  } else {
    form.style.display = 'none';
    authPrompt.style.display = 'block';
  }
}

async function initDimissioneView() {
  const form = document.getElementById('form-dimissione');
  const authPrompt = form.previousElementSibling;
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    form.style.display = 'block';
    authPrompt.style.display = 'none';
    
    const pazienteSelect = document.getElementById('paziente-select');
    pazienteSelect.innerHTML = '<option>Caricamento...</option>';

    const { data: pazienti, error } = await supabase
      .from('pazienti')
      .select('id, nome, cognome')
      .is('data_dimissione', null);

    if (error) {
      pazienteSelect.innerHTML = '<option>Errore caricamento</option>';
      return;
    }

    pazienteSelect.innerHTML = '<option value="">Seleziona un paziente</option>';
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

      const { error } = await supabase
        .from('pazienti')
        .update({ data_dimissione: dataDimissione })
        .eq('id', pazienteId);

      if (error) {
        alert(`Errore: ${error.message}`);
      } else {
        alert('Paziente dimesso con successo!');
        window.location.hash = '#home';
      }
    });

  } else {
    form.style.display = 'none';
    authPrompt.style.display = 'block';
  }
}


// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Initial route handling
  handleRouteChange();

  // Listen for hash changes
  window.addEventListener('hashchange', handleRouteChange);
  
  // Go to home on title click
  homeButton.addEventListener('click', () => {
    window.location.hash = '#home';
  });

  // Handle auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session);
  });
});

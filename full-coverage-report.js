#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cartelle di output
const coverageDir = path.resolve(process.cwd(), "coverage");
const permanentCoverageDir = path.resolve(process.cwd(), "coverage-full-report");

// Assicurati che la directory di output esista
if (!fs.existsSync(permanentCoverageDir)) {
  fs.mkdirSync(permanentCoverageDir, { recursive: true });
}

console.log("🧪 Generazione del report di coverage completo...");

try {
  // Esegui i test con coverage e forza l'inclusione di tutti i file
  // L'opzione --coverage.all=true assicura che tutti i file sorgente siano inclusi
  try {
    execSync("npx vitest run --coverage.all=true", { stdio: "inherit" });
  } catch (testError) {
    console.log(
      "⚠️ Alcuni test sono falliti, ma continueremo a generare il report di coverage"
    );
    // Continuiamo comunque, anche se i test falliscono
  }

  // Verifica se la cartella coverage è stata creata
  if (fs.existsSync(coverageDir)) {
    console.log("✅ Report di coverage generato con successo!");

    // Copia tutti i file dalla cartella coverage alla cartella permanente
    console.log("📋 Copiando i report in una cartella permanente...");

    const copyRecursiveSync = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();

      if (isDirectory) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
          copyRecursiveSync(
            path.join(src, childItemName),
            path.join(dest, childItemName)
          );
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    copyRecursiveSync(coverageDir, permanentCoverageDir);

    // Migliora il report HTML
    console.log("🔍 Miglioramento del report di coverage...");

    try {
      // Modifica il file HTML per includere Chart.js e miglioramenti visivi
      const indexHtmlPath = path.resolve(permanentCoverageDir, "index.html");
      if (fs.existsSync(indexHtmlPath)) {
        let html = fs.readFileSync(indexHtmlPath, "utf8");

        // Aggiungi stili CSS per migliorare l'aspetto
        const cssStyles = `
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #2c3e50;
          }
          .pad1 {
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .clearfix {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
          }
          .fl {
            flex: 1;
            min-width: 200px;
            padding: 15px;
            border-radius: 5px;
            background-color: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .strong {
            font-weight: bold;
            font-size: 1.2em;
          }
          .high {
            color: #2ecc71;
          }
          .medium {
            color: #f39c12;
          }
          .low {
            color: #e74c3c;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #f8f9fa;
          }
          .file a {
            color: #3498db;
            text-decoration: none;
          }
          .file a:hover {
            text-decoration: underline;
          }
          .chart-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .chart {
            width: 48%;
            margin-bottom: 20px;
            background-color: white;
            border-radius: 5px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .progress-bar {
            height: 8px;
            background-color: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
          }
          .progress {
            height: 100%;
            border-radius: 4px;
          }
          .high-bg {
            background-color: #2ecc71;
          }
          .medium-bg {
            background-color: #f39c12;
          }
          .low-bg {
            background-color: #e74c3c;
          }
          .pct {
            font-weight: bold;
          }
          .coverage-summary {
            width: 100%;
          }
        </style>
        `;
        
        // Aggiungi gli stili e Chart.js
        if (!html.includes("chart.js")) {
          const chartJsScript = '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
          html = html.replace("</head>", `${cssStyles}${chartJsScript}</head>`);
          
          // Aggiungi un div per i grafici
          const chartDiv = `
            <div class="chart-container">
              <div class="chart">
                <canvas id="coverageChart"></canvas>
              </div>
              <div class="chart">
                <canvas id="fileTypeChart"></canvas>
              </div>
            </div>
            <script>
              // Funzione per estrarre i dati dalla tabella
              function extractDataFromTable() {
                const table = document.querySelector('.coverage-summary');
                if (!table) return null;
                
                const rows = table.querySelectorAll('tbody tr');
                const data = {
                  files: [],
                  statements: [],
                  branches: [],
                  functions: [],
                  lines: []
                };
                
                rows.forEach(row => {
                  const fileElement = row.querySelector('td.file');
                  if (!fileElement) return;
                  
                  const file = fileElement.textContent;
                  data.files.push(file);
                  
                  const statements = parseFloat(row.querySelector('td.pct:nth-of-type(1)').textContent);
                  data.statements.push(isNaN(statements) ? 0 : statements);
                  
                  const branches = parseFloat(row.querySelector('td.pct:nth-of-type(2)').textContent);
                  data.branches.push(isNaN(branches) ? 0 : branches);
                  
                  const functions = parseFloat(row.querySelector('td.pct:nth-of-type(3)').textContent);
                  data.functions.push(isNaN(functions) ? 0 : functions);
                  
                  const lines = parseFloat(row.querySelector('td.pct:nth-of-type(4)').textContent);
                  data.lines.push(isNaN(lines) ? 0 : lines);
                });
                
                return data;
              }
              
              // Funzione per aggiungere barre di progresso alle celle della tabella
              function addProgressBars() {
                const rows = document.querySelectorAll('.coverage-summary tbody tr');
                
                rows.forEach(row => {
                  const pctCells = row.querySelectorAll('td.pct');
                  
                  pctCells.forEach(cell => {
                    const value = parseFloat(cell.textContent);
                    if (isNaN(value)) return;
                    
                    let colorClass = 'low-bg';
                    if (value >= 75) {
                      colorClass = 'high-bg';
                    } else if (value >= 50) {
                      colorClass = 'medium-bg';
                    }
                    
                    const progressBar = document.createElement('div');
                    progressBar.className = 'progress-bar';
                    
                    const progress = document.createElement('div');
                    progress.className = 'progress ' + colorClass;
                    progress.style.width = value + '%';
                    
                    progressBar.appendChild(progress);
                    cell.appendChild(progressBar);
                  });
                });
              }
              
              // Aggiungi barre di progresso
              addProgressBars();
              
              // Estrai i dati dalla tabella
              const tableData = extractDataFromTable();
              
              if (tableData && tableData.files.length > 0) {
                // Grafico principale
                const ctxCoverage = document.getElementById('coverageChart').getContext('2d');
                new Chart(ctxCoverage, {
                  type: 'bar',
                  data: {
                    labels: ['Statements', 'Branches', 'Functions', 'Lines'],
                    datasets: [{
                      label: 'Coverage %',
                      data: [
                        parseFloat(document.querySelector('.clearfix .pad1y:nth-child(1) .strong').textContent),
                        parseFloat(document.querySelector('.clearfix .pad1y:nth-child(2) .strong').textContent),
                        parseFloat(document.querySelector('.clearfix .pad1y:nth-child(3) .strong').textContent),
                        parseFloat(document.querySelector('.clearfix .pad1y:nth-child(4) .strong').textContent)
                      ],
                      backgroundColor: [
                        'rgba(46, 204, 113, 0.6)',
                        'rgba(243, 156, 18, 0.6)',
                        'rgba(52, 152, 219, 0.6)',
                        'rgba(155, 89, 182, 0.6)'
                      ],
                      borderColor: [
                        'rgba(46, 204, 113, 1)',
                        'rgba(243, 156, 18, 1)',
                        'rgba(52, 152, 219, 1)',
                        'rgba(155, 89, 182, 1)'
                      ],
                      borderWidth: 1
                    }]
                  },
                  options: {
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: 'Coverage Summary'
                      }
                    }
                  }
                });
                
                // Prendi solo i primi 10 file per il grafico radar
                const topFiles = tableData.files.slice(0, 10).map(file => {
                  // Abbrevia i nomi dei file se troppo lunghi
                  if (file.length > 25) {
                    return file.substring(0, 22) + '...';
                  }
                  return file;
                });
                
                // Grafico per tipo di file
                const ctxFileType = document.getElementById('fileTypeChart').getContext('2d');
                new Chart(ctxFileType, {
                  type: 'radar',
                  data: {
                    labels: topFiles,
                    datasets: [{
                      label: 'Statements',
                      data: tableData.statements.slice(0, 10),
                      backgroundColor: 'rgba(46, 204, 113, 0.2)',
                      borderColor: 'rgba(46, 204, 113, 1)',
                      borderWidth: 1
                    }, {
                      label: 'Functions',
                      data: tableData.functions.slice(0, 10),
                      backgroundColor: 'rgba(52, 152, 219, 0.2)',
                      borderColor: 'rgba(52, 152, 219, 1)',
                      borderWidth: 1
                    }]
                  },
                  options: {
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100
                      }
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: 'File Coverage'
                      }
                    }
                  }
                });
              }
            </script>
          `;
          
          // Inserisci il div del grafico dopo l'intestazione
          html = html.replace(/<div class="pad1">[\s\S]*?<\/div>/, match => `${match}${chartDiv}`);
          
          // Scrivi il file HTML modificato
          fs.writeFileSync(indexHtmlPath, html);
        }
      }
      
      console.log("✅ Report migliorato con successo!");
      console.log(`📊 Puoi visualizzare il report completo in: ${path.join(permanentCoverageDir, "index.html")}`);
      
      // Apri automaticamente il report nel browser
      const platform = process.platform;
      let command;
      
      if (platform === "darwin") {  // macOS
        command = `open ${path.join(permanentCoverageDir, "index.html")}`;
      } else if (platform === "win32") {  // Windows
        command = `start ${path.join(permanentCoverageDir, "index.html")}`;
      } else {  // Linux
        command = `xdg-open ${path.join(permanentCoverageDir, "index.html")}`;
      }
      
      execSync(command, { stdio: "ignore" });
      console.log("🌐 Report aperto nel browser");
      
    } catch (enhanceError) {
      console.error(`❌ Errore durante il miglioramento del report: ${enhanceError.message}`);
    }
  } else {
    console.error("❌ La cartella coverage non è stata creata.");
    console.error("Verifica la configurazione di Vitest.");
    
    // Tenta di generare un report di base
    console.log("🔄 Tentativo di generare un report di base...");
    
    // Crea un file HTML di base
    const basicHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Coverage Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2 {
          color: #2c3e50;
        }
        .error-box {
          background-color: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .info-box {
          background-color: #d1ecf1;
          color: #0c5460;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        code {
          background-color: #f8f9fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
        }
        pre {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <h1>Coverage Report</h1>
      
      <div class="error-box">
        <h2>Errore nella generazione del report</h2>
        <p>Non è stato possibile generare il report di coverage completo. La cartella <code>coverage</code> non è stata creata.</p>
      </div>
      
      <div class="info-box">
        <h2>Possibili soluzioni</h2>
        <ol>
          <li>Verifica che la configurazione di Vitest sia corretta</li>
          <li>Assicurati che l'opzione <code>coverage.all</code> sia impostata su <code>true</code></li>
          <li>Controlla che ci siano file sorgente nella cartella <code>src</code></li>
          <li>Prova a eseguire manualmente il comando: <code>npx vitest run --coverage</code></li>
        </ol>
      </div>
      
      <h2>Configurazione attuale</h2>
      <pre>
coverage: {
  provider: "v8",
  reporter: ["text", "text-summary", "json", "html", "lcov", "cobertura"],
  reportsDirectory: "./coverage",
  all: true,
  include: ["src/**/*.{js,jsx,ts,tsx,vue}"],
  perFile: true,
  skipFull: false
}
      </pre>
    </body>
    </html>
    `;
    
    fs.writeFileSync(path.join(permanentCoverageDir, "index.html"), basicHtml);
    console.log(`⚠️ Creato un report di base in: ${path.join(permanentCoverageDir, "index.html")}`);
    
    // Apri il report di base nel browser
    const platform = process.platform;
    let command;
    
    if (platform === "darwin") {  // macOS
      command = `open ${path.join(permanentCoverageDir, "index.html")}`;
    } else if (platform === "win32") {  // Windows
      command = `start ${path.join(permanentCoverageDir, "index.html")}`;
    } else {  // Linux
      command = `xdg-open ${path.join(permanentCoverageDir, "index.html")}`;
    }
    
    execSync(command, { stdio: "ignore" });
  }
} catch (error) {
  console.error(`❌ Errore durante la generazione del report: ${error.message}`);
  process.exit(1);
}
#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 Esecuzione dei test con coverage...");

try {
  // Esegui i test con coverage
  try {
    execSync("npx vitest run --coverage", { stdio: "inherit" });
  } catch (testError) {
    console.log(
      "⚠️ Alcuni test sono falliti, ma continueremo a preservare i report di coverage"
    );
    // Continuiamo comunque, anche se i test falliscono
  }

  // Verifica se la cartella coverage è stata creata
  const coverageDir = path.resolve(process.cwd(), "coverage");
  const permanentCoverageDir = path.resolve(process.cwd(), "coverage-report");

  if (fs.existsSync(coverageDir)) {
    console.log("✅ La cartella coverage è stata creata con successo!");

    // Crea la cartella permanente se non esiste
    if (!fs.existsSync(permanentCoverageDir)) {
      fs.mkdirSync(permanentCoverageDir, { recursive: true });
    }

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

    // Migliora il report
    console.log("🔍 Miglioramento del report di coverage...");

    try {
      // Leggi il file JSON di coverage
      const coverageJsonPath = path.resolve(
        permanentCoverageDir,
        "coverage-final.json"
      );
      if (fs.existsSync(coverageJsonPath)) {
        // Crea la cartella history se non esiste
        const historyDir = path.resolve(process.cwd(), "coverage-history");
        if (!fs.existsSync(historyDir)) {
          fs.mkdirSync(historyDir, { recursive: true });
        }

        // Salva una copia nella cronologia con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const historyCopy = path.resolve(
          historyDir,
          `coverage-${timestamp}.json`
        );
        fs.copyFileSync(coverageJsonPath, historyCopy);

        // Modifica il file HTML per includere Chart.js
        const indexHtmlPath = path.resolve(permanentCoverageDir, "index.html");
        if (fs.existsSync(indexHtmlPath)) {
          let html = fs.readFileSync(indexHtmlPath, "utf8");

          // Aggiungi Chart.js
          if (!html.includes("chart.js")) {
            const chartJsScript =
              '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
            html = html.replace("</head>", `${chartJsScript}</head>`);

            // Aggiungi un div per i grafici
            const chartDiv = `
              <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
                <h2>Coverage Summary</h2>
                <div style="display: flex; justify-content: space-between;">
                  <div style="width: 48%;">
                    <canvas id="coverageChart"></canvas>
                  </div>
                  <div style="width: 48%;">
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
                      const file = row.querySelector('td.file').textContent;
                      data.files.push(file);
                      
                      const statements = parseFloat(row.querySelector('td.pct:nth-of-type(3)').textContent);
                      data.statements.push(statements);
                      
                      const branches = parseFloat(row.querySelector('td.pct:nth-of-type(5)').textContent);
                      data.branches.push(branches);
                      
                      const functions = parseFloat(row.querySelector('td.pct:nth-of-type(7)').textContent);
                      data.functions.push(functions);
                      
                      const lines = parseFloat(row.querySelector('td.pct:nth-of-type(9)').textContent);
                      data.lines.push(lines);
                    });
                    
                    return data;
                  }
                  
                  // Estrai i dati dalla tabella
                  const tableData = extractDataFromTable();
                  
                  if (tableData) {
                    // Grafico principale
                    const ctxCoverage = document.getElementById('coverageChart').getContext('2d');
                    new Chart(ctxCoverage, {
                      type: 'bar',
                      data: {
                        labels: ['Statements', 'Branches', 'Functions', 'Lines'],
                        datasets: [{
                          label: 'Coverage %',
                          data: [
                            document.querySelector('.clearfix .pad1y:nth-child(1) .strong').textContent,
                            document.querySelector('.clearfix .pad1y:nth-child(2) .strong').textContent,
                            document.querySelector('.clearfix .pad1y:nth-child(3) .strong').textContent,
                            document.querySelector('.clearfix .pad1y:nth-child(4) .strong').textContent
                          ],
                          backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)'
                          ],
                          borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
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
                    
                    // Grafico per tipo di file
                    const ctxFileType = document.getElementById('fileTypeChart').getContext('2d');
                    new Chart(ctxFileType, {
                      type: 'radar',
                      data: {
                        labels: tableData.files.slice(0, 10), // Limita a 10 file per leggibilità
                        datasets: [{
                          label: 'Statements',
                          data: tableData.statements.slice(0, 10),
                          backgroundColor: 'rgba(75, 192, 192, 0.2)',
                          borderColor: 'rgba(75, 192, 192, 1)',
                          borderWidth: 1
                        }, {
                          label: 'Functions',
                          data: tableData.functions.slice(0, 10),
                          backgroundColor: 'rgba(153, 102, 255, 0.2)',
                          borderColor: 'rgba(153, 102, 255, 1)',
                          borderWidth: 1
                        }]
                      },
                      options: {
                        scales: {
                          r: {
                            beginAtZero: true,
                            max: 100
                          }
                        }
                      }
                    });
                  }
                </script>
              </div>
            `;

            // Inserisci il div del grafico dopo l'intestazione
            html = html.replace(
              /<div class="pad1">[\s\S]*?<\/div>/,
              (match) => `${match}${chartDiv}`
            );

            // Scrivi il file HTML modificato
            fs.writeFileSync(indexHtmlPath, html);
          }
        }
      }

      console.log("✅ Report migliorato con successo!");
      console.log(
        `📊 Puoi visualizzare il report completo in: ${path.join(
          permanentCoverageDir,
          "index.html"
        )}`
      );

      // Apri automaticamente il report nel browser
      const platform = process.platform;
      let command;

      if (platform === "darwin") {
        // macOS
        command = `open ${path.join(permanentCoverageDir, "index.html")}`;
      } else if (platform === "win32") {
        // Windows
        command = `start ${path.join(permanentCoverageDir, "index.html")}`;
      } else {
        // Linux
        command = `xdg-open ${path.join(permanentCoverageDir, "index.html")}`;
      }

      execSync(command, { stdio: "ignore" });
      console.log("🌐 Report aperto nel browser");
    } catch (enhanceError) {
      console.error(
        `❌ Errore durante il miglioramento del report: ${enhanceError.message}`
      );
    }
  } else {
    console.error("❌ La cartella coverage non è stata creata.");
    console.error("Verifica la configurazione di Vitest.");
  }
} catch (error) {
  console.error(`❌ Errore durante l'esecuzione dei test: ${error.message}`);
  process.exit(1);
}

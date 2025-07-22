#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cartella di output per il report
const reportDir = path.resolve(process.cwd(), "manual-coverage-report");

// Assicurati che la directory esista
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

console.log("🔍 Analisi del codice sorgente...");

// Funzione per trovare tutti i file sorgente
function findSourceFiles(
  dir,
  extensions = [".js", ".jsx", ".ts", ".tsx", ".vue"]
) {
  let results = [];

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      // Ignora cartelle specifiche
      if (stat.isDirectory()) {
        if (
          !file.startsWith(".") &&
          !["node_modules", "dist", "coverage", "tests"].includes(file)
        ) {
          results = results.concat(findSourceFiles(filePath, extensions));
        }
      } else {
        const ext = path.extname(file);
        if (extensions.includes(ext)) {
          results.push(filePath);
        }
      }
    }
  } catch (error) {
    console.error(
      `Errore nella lettura della directory ${dir}: ${error.message}`
    );
  }

  return results;
}

// Funzione per trovare tutti i file di test
function findTestFiles(
  dir,
  extensions = [".test.js", ".spec.js", ".test.ts", ".spec.ts"]
) {
  let results = [];

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results = results.concat(findTestFiles(filePath, extensions));
      } else {
        if (
          file.includes(".test.") ||
          file.includes(".spec.") ||
          file.endsWith("Test.js") ||
          file.endsWith("Test.ts")
        ) {
          results.push(filePath);
        }
      }
    }
  } catch (error) {
    console.error(
      `Errore nella lettura della directory ${dir}: ${error.message}`
    );
  }

  return results;
}

// Funzione per analizzare un file sorgente
function analyzeSourceFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // Conta le funzioni nel file
    const functionMatches =
      content.match(
        /function\s+\w+\s*\(|const\s+\w+\s*=\s*\(|class\s+\w+|method\s+\w+\s*\(/g
      ) || [];
    const functionCount = functionMatches.length;

    // Conta i branch condizionali
    const branchMatches =
      content.match(
        /if\s*\(|else|switch|case|for\s*\(|while\s*\(|try|catch|conditional|ternary|\?.*:/g
      ) || [];
    const branchCount = branchMatches.length;

    return {
      path: filePath,
      lines: lines.length,
      functions: functionCount,
      branches: branchCount,
      statements: lines.filter(
        (line) =>
          line.trim() &&
          !line.trim().startsWith("//") &&
          !line.trim().startsWith("/*")
      ).length,
    };
  } catch (error) {
    console.error(`Errore nell'analisi del file ${filePath}: ${error.message}`);
    return {
      path: filePath,
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
      error: error.message,
    };
  }
}

// Funzione per analizzare un file di test e trovare i file sorgente testati
function analyzeTestFile(testFilePath, sourceFiles) {
  try {
    const content = fs.readFileSync(testFilePath, "utf8");

    // Trova i file importati nel test
    const importMatches =
      content.match(/import\s+.*from\s+['"](.+)['"]/g) || [];
    const testedFiles = [];

    for (const importMatch of importMatches) {
      const importPath = importMatch.match(/from\s+['"](.+)['"]/)[1];

      // Cerca di trovare il file sorgente corrispondente
      for (const sourceFile of sourceFiles) {
        const sourceFileName = path.basename(
          sourceFile,
          path.extname(sourceFile)
        );

        if (
          importPath.includes(sourceFileName) ||
          importPath.endsWith(sourceFileName) ||
          importPath.includes(path.basename(sourceFile))
        ) {
          testedFiles.push(sourceFile);
          break;
        }
      }
    }

    return {
      testFile: testFilePath,
      testedFiles: testedFiles,
    };
  } catch (error) {
    console.error(
      `Errore nell'analisi del file di test ${testFilePath}: ${error.message}`
    );
    return {
      testFile: testFilePath,
      testedFiles: [],
      error: error.message,
    };
  }
}

// Trova tutti i file sorgente e di test
console.log("📂 Ricerca dei file sorgente...");
const sourceFiles = findSourceFiles(path.resolve(process.cwd(), "src"));
console.log(`✅ Trovati ${sourceFiles.length} file sorgente.`);

console.log("📂 Ricerca dei file di test...");
const testFiles = findTestFiles(path.resolve(process.cwd(), "tests"));
console.log(`✅ Trovati ${testFiles.length} file di test.`);

// Analizza i file sorgente
console.log("🔍 Analisi dei file sorgente...");
const sourceAnalysis = sourceFiles.map((file) => analyzeSourceFile(file));

// Analizza i file di test
console.log("🔍 Analisi dei file di test...");
const testAnalysis = testFiles.map((file) =>
  analyzeTestFile(file, sourceFiles)
);

// Calcola la copertura
console.log("📊 Calcolo della copertura...");
const testedFiles = new Set();
testAnalysis.forEach((analysis) => {
  analysis.testedFiles.forEach((file) => testedFiles.add(file));
});

const coverage = {
  totalFiles: sourceFiles.length,
  testedFiles: testedFiles.size,
  filesCoverage: (testedFiles.size / sourceFiles.length) * 100,
  totalLines: sourceAnalysis.reduce((sum, file) => sum + file.lines, 0),
  totalFunctions: sourceAnalysis.reduce((sum, file) => sum + file.functions, 0),
  totalBranches: sourceAnalysis.reduce((sum, file) => sum + file.branches, 0),
  totalStatements: sourceAnalysis.reduce(
    (sum, file) => sum + file.statements,
    0
  ),
  // Stime approssimative basate sul numero di file testati
  linesCoverage: (testedFiles.size / sourceFiles.length) * 100,
  functionsCoverage: (testedFiles.size / sourceFiles.length) * 100,
  branchesCoverage: (testedFiles.size / sourceFiles.length) * 100,
  statementsCoverage: (testedFiles.size / sourceFiles.length) * 100,
  fileDetails: sourceAnalysis.map((file) => ({
    ...file,
    tested: testedFiles.has(file.path),
    relativePath: path.relative(process.cwd(), file.path),
  })),
};

// Genera il report HTML
console.log("📝 Generazione del report HTML...");
const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manual Coverage Report</title>
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
    .summary {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 30px;
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 20px;
    }
    .metric {
      flex: 1;
      min-width: 200px;
      margin: 10px;
      padding: 15px;
      border-radius: 5px;
      background-color: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .metric h3 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
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
    .file-link {
      color: #3498db;
      text-decoration: none;
    }
    .file-link:hover {
      text-decoration: underline;
    }
    .progress-bar {
      height: 10px;
      background-color: #ecf0f1;
      border-radius: 5px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress {
      height: 100%;
      border-radius: 5px;
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
    .tested {
      background-color: #e8f8f5;
    }
    .not-tested {
      background-color: #fdedec;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Manual Coverage Report</h1>
  
  <div class="summary">
    <div class="metric">
      <h3>Files</h3>
      <p class="${
        coverage.filesCoverage >= 75
          ? "high"
          : coverage.filesCoverage >= 50
          ? "medium"
          : "low"
      }">
        ${coverage.filesCoverage.toFixed(2)}% <span class="fraction">(${
  coverage.testedFiles
}/${coverage.totalFiles})</span>
      </p>
      <div class="progress-bar">
        <div class="progress ${
          coverage.filesCoverage >= 75
            ? "high-bg"
            : coverage.filesCoverage >= 50
            ? "medium-bg"
            : "low-bg"
        }" style="width: ${coverage.filesCoverage}%"></div>
      </div>
    </div>
    <div class="metric">
      <h3>Statements</h3>
      <p class="${
        coverage.statementsCoverage >= 75
          ? "high"
          : coverage.statementsCoverage >= 50
          ? "medium"
          : "low"
      }">
        ${coverage.statementsCoverage.toFixed(
          2
        )}% <span class="fraction">(estimated)</span>
      </p>
      <div class="progress-bar">
        <div class="progress ${
          coverage.statementsCoverage >= 75
            ? "high-bg"
            : coverage.statementsCoverage >= 50
            ? "medium-bg"
            : "low-bg"
        }" style="width: ${coverage.statementsCoverage}%"></div>
      </div>
    </div>
    <div class="metric">
      <h3>Branches</h3>
      <p class="${
        coverage.branchesCoverage >= 75
          ? "high"
          : coverage.branchesCoverage >= 50
          ? "medium"
          : "low"
      }">
        ${coverage.branchesCoverage.toFixed(
          2
        )}% <span class="fraction">(estimated)</span>
      </p>
      <div class="progress-bar">
        <div class="progress ${
          coverage.branchesCoverage >= 75
            ? "high-bg"
            : coverage.branchesCoverage >= 50
            ? "medium-bg"
            : "low-bg"
        }" style="width: ${coverage.branchesCoverage}%"></div>
      </div>
    </div>
    <div class="metric">
      <h3>Functions</h3>
      <p class="${
        coverage.functionsCoverage >= 75
          ? "high"
          : coverage.functionsCoverage >= 50
          ? "medium"
          : "low"
      }">
        ${coverage.functionsCoverage.toFixed(
          2
        )}% <span class="fraction">(estimated)</span>
      </p>
      <div class="progress-bar">
        <div class="progress ${
          coverage.functionsCoverage >= 75
            ? "high-bg"
            : coverage.functionsCoverage >= 50
            ? "medium-bg"
            : "low-bg"
        }" style="width: ${coverage.functionsCoverage}%"></div>
      </div>
    </div>
    <div class="metric">
      <h3>Lines</h3>
      <p class="${
        coverage.linesCoverage >= 75
          ? "high"
          : coverage.linesCoverage >= 50
          ? "medium"
          : "low"
      }">
        ${coverage.linesCoverage.toFixed(
          2
        )}% <span class="fraction">(estimated)</span>
      </p>
      <div class="progress-bar">
        <div class="progress ${
          coverage.linesCoverage >= 75
            ? "high-bg"
            : coverage.linesCoverage >= 50
            ? "medium-bg"
            : "low-bg"
        }" style="width: ${coverage.linesCoverage}%"></div>
      </div>
    </div>
  </div>
  
  <div class="chart-container">
    <div class="chart">
      <canvas id="coverageChart"></canvas>
    </div>
    <div class="chart">
      <canvas id="filesChart"></canvas>
    </div>
  </div>
  
  <h2>Files</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Lines</th>
        <th>Functions</th>
        <th>Branches</th>
        <th>Statements</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${coverage.fileDetails
        .map(
          (file) => `
        <tr class="${file.tested ? "tested" : "not-tested"}">
          <td><span class="file-link">${file.relativePath}</span></td>
          <td>${file.lines}</td>
          <td>${file.functions}</td>
          <td>${file.branches}</td>
          <td>${file.statements}</td>
          <td>${
            file.tested
              ? '<span class="high">Tested</span>'
              : '<span class="low">Not Tested</span>'
          }</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  
  <script>
    // Grafico principale
    const ctxCoverage = document.getElementById('coverageChart').getContext('2d');
    new Chart(ctxCoverage, {
      type: 'bar',
      data: {
        labels: ['Files', 'Statements', 'Branches', 'Functions', 'Lines'],
        datasets: [{
          label: 'Coverage %',
          data: [
            ${coverage.filesCoverage.toFixed(2)},
            ${coverage.statementsCoverage.toFixed(2)},
            ${coverage.branchesCoverage.toFixed(2)},
            ${coverage.functionsCoverage.toFixed(2)},
            ${coverage.linesCoverage.toFixed(2)}
          ],
          backgroundColor: [
            'rgba(46, 204, 113, 0.6)',
            'rgba(52, 152, 219, 0.6)',
            'rgba(155, 89, 182, 0.6)',
            'rgba(52, 152, 219, 0.6)',
            'rgba(46, 204, 113, 0.6)'
          ],
          borderColor: [
            'rgba(46, 204, 113, 1)',
            'rgba(52, 152, 219, 1)',
            'rgba(155, 89, 182, 1)',
            'rgba(52, 152, 219, 1)',
            'rgba(46, 204, 113, 1)'
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
    
    // Grafico dei file
    const ctxFiles = document.getElementById('filesChart').getContext('2d');
    new Chart(ctxFiles, {
      type: 'pie',
      data: {
        labels: ['Tested Files', 'Untested Files'],
        datasets: [{
          data: [${coverage.testedFiles}, ${
  coverage.totalFiles - coverage.testedFiles
}],
          backgroundColor: [
            'rgba(46, 204, 113, 0.6)',
            'rgba(231, 76, 60, 0.6)'
          ],
          borderColor: [
            'rgba(46, 204, 113, 1)',
            'rgba(231, 76, 60, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Files Coverage'
          }
        }
      }
    });
  </script>
</body>
</html>
`;

// Scrivi il report HTML
fs.writeFileSync(path.join(reportDir, "index.html"), htmlReport);
console.log(
  `✅ Report HTML generato in: ${path.join(reportDir, "index.html")}`
);

// Apri automaticamente il report nel browser
const platform = process.platform;
let command;

if (platform === "darwin") {
  // macOS
  command = `open ${path.join(reportDir, "index.html")}`;
} else if (platform === "win32") {
  // Windows
  command = `start ${path.join(reportDir, "index.html")}`;
} else {
  // Linux
  command = `xdg-open ${path.join(reportDir, "index.html")}`;
}

try {
  execSync(command, { stdio: "ignore" });
  console.log("🌐 Report aperto nel browser");
} catch (error) {
  console.log(
    `⚠️ Non è stato possibile aprire il browser automaticamente. Apri manualmente il file: ${path.join(
      reportDir,
      "index.html"
    )}`
  );
}

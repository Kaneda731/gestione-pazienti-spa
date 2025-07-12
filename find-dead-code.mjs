

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd: projectRoot });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => (stdout += data.toString()));
        child.stderr.on('data', (data) => (stderr += data.toString()));
        child.on('close', (code) => {
            // grep exits with 1 if no lines are selected, and 2 if an error occurred.
            if (code !== 0 && code !== 1) {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
                return;
            }
            resolve(stdout);
        });
    });
}

async function findExports() {
    const stdout = await runCommand('grep', ['-r', 'export ', 'src/']);
    const lines = stdout.split('\n');
    const exports = [];

    const exportRegex = /export\s+(?:async\s+)?(?:function\s+|class\s+|const\s+|let\s+)(\w+)/;

    for (const line of lines) {
        const match = line.match(exportRegex);
        if (match && match[1]) {
            const filePath = line.split(':')[0];
            exports.push({ name: match[1], file: filePath });
        }
    }
    return exports;
}

async function findUsage(exportName, fileToExclude) {
    try {
        const stdout = await runCommand('grep', ['-r', exportName, 'src/']);
        const lines = stdout.split('\n').filter(line => line.trim() !== '');
        // Filter out the original export and any self-references within the same file
        const usages = lines.filter(line => !line.startsWith(fileToExclude));
        return usages.length > 0;
    } catch (error) {
        // Grep returns non-zero if no matches are found
        return false;
    }
}


async function main() {
    console.log('Analyzing codebase for dead code...');
    const exports = await findExports();
    const deadCode = [];

    for (const exp of exports) {
        const hasUsage = await findUsage(exp.name, exp.file);
        if (!hasUsage) {
            deadCode.push(exp);
        }
    }

    if (deadCode.length > 0) {
        console.log('\nPotential dead code found:');
        deadCode.forEach(code => {
            console.log(`- ${code.name} in ${code.file}`);
        });
    } else {
        console.log('\nNo obvious dead code found.');
    }
}

main().catch(console.error);


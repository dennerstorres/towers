const { readdirSync, statSync } = require('node:fs');
const { join, extname } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = join(__dirname, '..');
const ignoredDirs = new Set(['.git', 'node_modules', 'coverage', 'playwright-report', 'test-results']);
const files = [];

function collect(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      collect(fullPath);
    } else if (extname(entry) === '.js' || extname(entry) === '.cjs') {
      files.push(fullPath);
    }
  }
}

collect(root);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: root,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log(`Syntax OK (${files.length} files)`);

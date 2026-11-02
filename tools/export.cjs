const { readFileSync, writeFileSync, statSync } = require('node:fs');
const { resolve } = require('node:path');
const { parse, generate } = require('../src/layout.js');
try {
  const [input, output, ...extra] = process.argv.slice(2);
  if (!input || !output || extra.length || !output.endsWith('.luau') || resolve(input) === resolve(output)) throw new Error('Usage: node tools/export.cjs layout.json output.luau (different files required)');
  if (statSync(input).size > 1048576) throw new Error('Input exceeds 1 MiB.');
  const layout = parse(new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(input)));
  writeFileSync(output, generate(layout), 'utf8');
  console.log('Exported ' + layout.name + ' to ' + output);
} catch (error) {
  console.error('flash-canvas: ' + error.message);
  process.exitCode = 1;
}

const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { join, resolve, dirname, basename } = require('node:path');
const { tmpdir } = require('node:os');
const { spawnSync } = require('node:child_process');
const { normalize, parse, geometry, generate } = require('../src/layout.js');
function sample() { return { version: 1, name: 'Example', viewport: { width: 800, height: 450 }, root: { type: 'Frame', id: 'Root', size: [1, -20, 1, -20], position: [0, 10, 0, 10], children: [] } }; }

test('normalization is deterministic and does not mutate input', () => {
  const data = sample(); const before = JSON.stringify(data);
  assert.deepEqual(normalize(normalize(data)), normalize(data));
  assert.equal(JSON.stringify(data), before);
  assert.equal(generate(data), generate(data));
});
test('nested scale, offset and anchor math', () => {
  const data = sample(); data.root.children.push({ id: 'Child', type: 'TextLabel', position: [0.5, 0, 0.5, 0], size: [0, 100, 0, 20], anchor: [0.5, 0.5], text: 'Hi' });
  const rows = geometry(data);
  assert.equal(rows[0].width, 780); assert.equal(rows[0].height, 430);
  assert.equal(rows[1].absoluteX, 350); assert.equal(rows[1].absoluteY, 215);
});
test('unknown fields, classes and repeated IDs are refused', () => {
  let data = sample(); data.root.script = 'print(1)'; assert.throws(() => normalize(data));
  data = sample(); data.root.type = 'ImageLabel'; assert.throws(() => normalize(data));
  data = sample(); data.root.children.push({ id: 'Root', type: 'Frame' }); assert.throws(() => normalize(data));
});
test('bad colors, fonts, booleans and alignments are refused', () => {
  for (const change of [{ background: 'url(https://example.com)' }, { visible: 'true' }, { anchor: [2, 0] }, { size: [0, -1, 0, 20] }]) {
    const data = sample(); Object.assign(data.root, change); assert.throws(() => normalize(data));
  }
  for (const change of [{ font: 'Unknown' }, { align: 'Bottom' }, { wrap: 1 }]) {
    const data = sample(); data.root.children.push({ id: 'Label', type: 'TextLabel', ...change }); assert.throws(() => normalize(data));
  }
});
test('depth, node, viewport and input limits are enforced', () => {
  let data = sample(); let node = data.root;
  for (let i = 0; i < 9; i++) { node.children = [{ id: 'N' + i, type: 'Frame' }]; node = node.children[0]; }
  assert.throws(() => normalize(data));
  data = sample(); data.root.children = Array.from({ length: 200 }, (_, i) => ({ id: 'N' + i, type: 'Frame' })); assert.throws(() => normalize(data));
  data = sample(); data.viewport.width = 0; assert.throws(() => normalize(data));
  assert.throws(() => parse(' '.repeat(1048577)));
});
test('shrinking the design viewport rejects negative resolved sizes', () => {
  const data = sample(); data.root.size = [1, -300, 1, 0];
  assert.doesNotThrow(() => normalize(data)); data.viewport.width = 240; assert.throws(() => normalize(data));
});
test('Unicode and Lua control characters are escaped as UTF-8 bytes', () => {
  const data = sample(); data.root.children.push({ id: 'Text', type: 'TextLabel', text: '"\\\n🍃' });
  const source = generate(data);
  assert.ok(source.includes('\\034\\092\\010\\240\\159\\141\\131'));
  data.root.children[0].text = '\ud800'; assert.throws(() => normalize(data));
});
test('BOM JSON and literal markup text are accepted as data', () => {
  const data = sample(); data.root.children.push({ id: 'Text', type: 'TextLabel', text: '<img src=x onerror=alert(1)>' });
  assert.equal(parse('\ufeff' + JSON.stringify(data)).root.children[0].text, '<img src=x onerror=alert(1)>');
});
test('export includes parent validation, clipping and decorations', () => {
  const data = sample(); data.root.clip = true; data.root.corner = 5; data.root.stroke = { color: '#112233', thickness: 1 };
  const source = generate(data);
  assert.ok(source.includes('Enum.ApplyStrokeMode.Border'));
  assert.ok(source.includes('.ClipsDescendants = true'));
  assert.ok(source.indexOf('node1.Parent = parent') > source.indexOf('stroke1.Parent = node1'));
});
test('CLI validates before replacing an existing output', () => {
  const folder = mkdtempSync(join(tmpdir(), 'flash-canvas-'));
  try {
    const input = join(folder, 'layout.json'), output = join(folder, 'layout.luau');
    writeFileSync(input, JSON.stringify(sample()));
    const cli = resolve(__dirname, '../tools/export.cjs');
    let result = spawnSync(process.execPath, [cli, input, output]); assert.equal(result.status, 0);
    const before = readFileSync(output, 'utf8'); writeFileSync(input, '{bad json');
    result = spawnSync(process.execPath, [cli, input, output]); assert.notEqual(result.status, 0); assert.equal(readFileSync(output, 'utf8'), before);
    result = spawnSync(process.execPath, [cli, output, output]); assert.notEqual(result.status, 0);
  } finally {
    assert.equal(dirname(folder), resolve(tmpdir()));
    assert.ok(basename(folder).startsWith('flash-canvas-'));
    rmSync(folder, { recursive: true, force: true });
  }
});

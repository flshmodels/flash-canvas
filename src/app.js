'use strict';
const byId = id => document.getElementById(id);
const editor = byId('source');
const screen = byId('screen');
let current = null;
let revision = 0;
const sample = FlashCanvasSample;

function message(text, error = false) {
  byId('status').textContent = text;
  byId('status').className = error ? 'error' : '';
}
function invalidate() {
  revision += 1;
  current = null;
  byId('save-json').disabled = true;
  byId('save-luau').disabled = true;
  byId('generated').value = '';
  screen.classList.add('stale');
}
function createNode(node, geometry) {
  const element = document.createElement('div');
  element.className = 'preview-node';
  element.dataset.nodeId = node.id;
  const rect = geometry.get(node.id);
  element.style.left = rect.x + 'px'; element.style.top = rect.y + 'px';
  element.style.width = rect.width + 'px'; element.style.height = rect.height + 'px';
  const rgb = [1, 3, 5].map(i => parseInt(node.background.slice(i, i + 2), 16));
  element.style.backgroundColor = `rgba(${rgb.join(',')},${1 - node.transparency})`;
  element.style.borderRadius = node.corner + 'px';
  element.style.overflow = node.clip ? 'hidden' : 'visible';
  element.style.display = node.visible ? 'block' : 'none';
  if (node.stroke) element.style.boxShadow = `inset 0 0 0 ${node.stroke.thickness}px ${node.stroke.color}`;
  if (node.type !== 'Frame') {
    const text = document.createElement('span');
    text.className = 'node-text'; text.textContent = node.text;
    text.style.color = node.textColor; text.style.fontSize = node.textSize + 'px';
    text.style.fontFamily = node.font === 'Code' ? 'Consolas, monospace' : 'Arial, sans-serif';
    text.style.fontWeight = node.font === 'SourceSansSemibold' ? '600' : '400';
    text.style.justifyContent = { Left: 'flex-start', Center: 'center', Right: 'flex-end' }[node.align];
    text.style.whiteSpace = node.wrap ? 'pre-wrap' : 'pre';
    element.append(text);
  }
  for (const child of node.children) element.append(createNode(child, geometry));
  return element;
}
function render() {
  invalidate();
  try {
    const layout = FlashCanvas.parse(editor.value);
    const rows = FlashCanvas.geometry(layout);
    const output = FlashCanvas.generate(layout);
    screen.style.width = layout.viewport.width + 'px'; screen.style.height = layout.viewport.height + 'px';
    screen.replaceChildren(createNode(layout.root, new Map(rows.map(row => [row.id, row]))));
    screen.classList.remove('stale');
    byId('width').value = layout.viewport.width; byId('height').value = layout.viewport.height;
    byId('generated').value = output;
    current = layout;
    byId('save-json').disabled = false; byId('save-luau').disabled = false;
    message(rows.length + ' nodes rendered. Preview is approximate. Export creates a function that builds the GUI in Roblox.');
  } catch (error) { message(error.message, true); }
}
function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
byId('sample').addEventListener('click', () => { editor.value = JSON.stringify(sample, null, 2); render(); });
editor.addEventListener('input', () => { invalidate(); message('Edited. Render before exporting.'); });
editor.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); render(); } });
byId('render').addEventListener('click', render);
byId('resize').addEventListener('click', () => {
  invalidate();
  try {
    const layout = FlashCanvas.parse(editor.value);
    layout.viewport = { width: Number(byId('width').value), height: Number(byId('height').value) };
    editor.value = JSON.stringify(layout, null, 2); render();
  } catch (error) { message(error.message, true); }
});
byId('file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  invalidate();
  const ticket = revision;
  try {
    if (file.size > 1048576) throw new Error('File exceeds 1 MiB.');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    if (ticket !== revision) return;
    editor.value = text; render();
  } catch (error) { if (ticket === revision) message(error.message, true); }
  event.target.value = '';
});
byId('save-json').addEventListener('click', () => { if (current) download(JSON.stringify(current, null, 2) + '\n', current.name + '.json', 'application/json'); });
byId('save-luau').addEventListener('click', () => { if (current) download(FlashCanvas.generate(current), current.name + '.luau', 'text/plain'); });
editor.value = JSON.stringify(sample, null, 2);
render();

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlashCanvas = api;
})(globalThis, function () {
  'use strict';
  const common = ['id', 'type', 'position', 'size', 'anchor', 'background', 'transparency', 'corner', 'stroke', 'clip', 'visible', 'children'];
  const textFields = ['text', 'textSize', 'textColor', 'font', 'align', 'wrap'];
  function object(value, path) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(path + ' must be an object.');
  }
  function fields(value, allowed, path) {
    object(value, path);
    for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(path + ': unsupported field ' + key);
  }
  function number(value, minimum, maximum, path, integer = false) {
    if (!Number.isFinite(value) || value < minimum || value > maximum || (integer && !Number.isInteger(value))) throw new Error(path + ': number out of range.');
    return value;
  }
  function string(value, max, path) {
    if (typeof value !== 'string' || value.length > max) throw new Error(path + ': invalid or oversized text.');
    for (const character of value) {
      const code = character.codePointAt(0);
      if (code >= 0xd800 && code <= 0xdfff) throw new Error(path + ': isolated Unicode surrogate.');
    }
    return value;
  }
  function color(value, path) {
    if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(path + ': use #RRGGBB.');
    return value.toLowerCase();
  }
  function boolean(value, path) {
    if (typeof value !== 'boolean') throw new Error(path + ' must be true or false.');
    return value;
  }
  function dimension(value, size, path) {
    if (!Array.isArray(value) || value.length !== 4) throw new Error(path + ': use [xScale, xOffset, yScale, yOffset].');
    return value.map((n, i) => number(n, i % 2 ? -4096 : (size ? 0 : -2), i % 2 ? 4096 : 2, path));
  }
  function normalize(input) {
    fields(input, ['version', 'name', 'viewport', 'root'], 'layout');
    if (input.version !== 1) throw new Error('version must be 1.');
    const name = string(input.name, 64, 'name');
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) throw new Error('name must be an ASCII identifier.');
    fields(input.viewport, ['width', 'height'], 'viewport');
    const viewport = { width: number(input.viewport.width, 240, 1920, 'viewport.width', true), height: number(input.viewport.height, 200, 1080, 'viewport.height', true) };
    let count = 0;
    const ids = new Set();
    function visit(node, depth, path, parentWidth, parentHeight) {
      if (++count > 200 || depth > 8) throw new Error('Layout exceeds 200 nodes or 8 child levels.');
      object(node, path);
      if (!['Frame', 'TextLabel', 'TextButton'].includes(node.type)) throw new Error(path + ': unsupported type.');
      fields(node, node.type === 'Frame' ? common : [...common, ...textFields], path);
      const id = string(node.id, 64, path + '.id');
      if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id) || ids.has(id)) throw new Error(path + ': IDs must be distinct ASCII identifiers.');
      ids.add(id);
      const anchor = node.anchor ?? [0, 0];
      if (!Array.isArray(anchor) || anchor.length !== 2) throw new Error(path + ': anchor must be [x, y].');
      const value = {
        id, type: node.type,
        position: dimension(node.position ?? [0, 0, 0, 0], false, path + '.position'),
        size: dimension(node.size ?? [0, 200, 0, 48], true, path + '.size'),
        anchor: anchor.map(n => number(n, 0, 1, path + '.anchor')),
        background: color(node.background ?? '#252b29', path + '.background'),
        transparency: number(node.transparency ?? (node.type === 'TextLabel' ? 1 : 0), 0, 1, path + '.transparency'),
        corner: number(node.corner ?? 0, 0, 256, path + '.corner'),
        clip: boolean(node.clip ?? false, path + '.clip'),
        visible: boolean(node.visible ?? true, path + '.visible'),
      };
      if (node.stroke !== undefined) {
        fields(node.stroke, ['color', 'thickness'], path + '.stroke');
        value.stroke = { color: color(node.stroke.color, path + '.stroke.color'), thickness: number(node.stroke.thickness, 0.1, 8, path + '.stroke.thickness') };
      }
      if (node.type !== 'Frame') {
        value.text = string(node.text ?? '', 1000, path + '.text');
        value.textSize = number(node.textSize ?? 16, 8, 72, path + '.textSize', true);
        value.textColor = color(node.textColor ?? '#f0f2ed', path + '.textColor');
        value.font = node.font ?? 'SourceSans';
        value.align = node.align ?? 'Left';
        if (!['SourceSans', 'SourceSansSemibold', 'Code'].includes(value.font)) throw new Error(path + ': unsupported font.');
        if (!['Left', 'Center', 'Right'].includes(value.align)) throw new Error(path + ': unsupported alignment.');
        value.wrap = boolean(node.wrap ?? false, path + '.wrap');
      }
      if (node.children !== undefined && !Array.isArray(node.children)) throw new Error(path + '.children must be an array.');
      const width = value.size[0] * parentWidth + value.size[1];
      const height = value.size[2] * parentHeight + value.size[3];
      if (width < 0 || height < 0) throw new Error(path + ': size becomes negative at this viewport.');
      value.children = (node.children ?? []).map((child, i) => visit(child, depth + 1, path + '.children[' + i + ']', width, height));
      return value;
    }
    const node = visit(input.root, 0, 'root', viewport.width, viewport.height);
    if (node.type !== 'Frame') throw new Error('The root must be a Frame.');
    return { version: 1, name, viewport, root: node };
  }
  function parse(text) {
    if (typeof text !== 'string' || new TextEncoder().encode(text).length > 1048576) throw new Error('Layout text exceeds 1 MiB.');
    return normalize(JSON.parse(text.replace(/^\uFEFF/, '')));
  }
  function geometry(input) {
    const layout = normalize(input);
    const rows = [];
    function visit(node, pw, ph, ax, ay) {
      const width = node.size[0] * pw + node.size[1];
      const height = node.size[2] * ph + node.size[3];
      const x = node.position[0] * pw + node.position[1] - width * node.anchor[0];
      const y = node.position[2] * ph + node.position[3] - height * node.anchor[1];
      rows.push({ id: node.id, x, y, width, height, absoluteX: ax + x, absoluteY: ay + y });
      for (const child of node.children) visit(child, width, height, ax + x, ay + y);
    }
    visit(layout.root, layout.viewport.width, layout.viewport.height, 0, 0);
    return rows;
  }
  function quote(text) {
    string(text, 1000, 'export text');
    let output = '"';
    for (const byte of new TextEncoder().encode(text)) output += byte >= 32 && byte <= 126 && byte !== 34 && byte !== 92 ? String.fromCharCode(byte) : '\\' + String(byte).padStart(3, '0');
    return output + '"';
  }
  function rgb(value) {
    return [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16)).join(', ');
  }
  function generate(input) {
    const layout = normalize(input);
    const lines = ['-- Generated by Flash Canvas. Browser layout is an approximation; verify in Studio.', 'return function(parent)', '    assert(parent:IsA("GuiObject") or parent:IsA("LayerCollector"), "Pass a GUI parent")'];
    let index = 0;
    function visit(node, parent) {
      const variable = 'node' + (++index);
      lines.push(`    local ${variable} = Instance.new(${quote(node.type)})`, `    ${variable}.Name = ${quote(node.id)}`, `    ${variable}.Position = UDim2.new(${node.position.join(', ')})`, `    ${variable}.Size = UDim2.new(${node.size.join(', ')})`, `    ${variable}.AnchorPoint = Vector2.new(${node.anchor.join(', ')})`, `    ${variable}.BackgroundColor3 = Color3.fromRGB(${rgb(node.background)})`, `    ${variable}.BackgroundTransparency = ${node.transparency}`, `    ${variable}.BorderSizePixel = 0`, `    ${variable}.ClipsDescendants = ${node.clip}`, `    ${variable}.Visible = ${node.visible}`);
      if (node.type !== 'Frame') lines.push(`    ${variable}.Text = ${quote(node.text)}`, `    ${variable}.TextSize = ${node.textSize}`, `    ${variable}.TextColor3 = Color3.fromRGB(${rgb(node.textColor)})`, `    ${variable}.Font = Enum.Font.${node.font}`, `    ${variable}.TextXAlignment = Enum.TextXAlignment.${node.align}`, `    ${variable}.TextYAlignment = Enum.TextYAlignment.Center`, `    ${variable}.TextWrapped = ${node.wrap}`);
      if (node.corner) lines.push(`    local corner${index} = Instance.new("UICorner")`, `    corner${index}.CornerRadius = UDim.new(0, ${node.corner})`, `    corner${index}.Parent = ${variable}`);
      if (node.stroke) lines.push(`    local stroke${index} = Instance.new("UIStroke")`, `    stroke${index}.Color = Color3.fromRGB(${rgb(node.stroke.color)})`, `    stroke${index}.Thickness = ${node.stroke.thickness}`, `    stroke${index}.ApplyStrokeMode = Enum.ApplyStrokeMode.Border`, `    stroke${index}.Parent = ${variable}`);
      for (const child of node.children) visit(child, variable);
      if (parent) lines.push(`    ${variable}.Parent = ${parent}`);
      return variable;
    }
    const root = visit(layout.root, null);
    lines.push(`    ${root}.Parent = parent`, `    return ${root}`, 'end', '');
    return lines.join('\n');
  }
  return { normalize, parse, geometry, generate };
});

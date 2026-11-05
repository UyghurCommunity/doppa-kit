const BASE = { cloth: '#173c33', thread: '#e9e2bf', detail: '#8aa894', trim: '#d0a85f' };
export function validateColors(colors) {
  if (!colors || typeof colors !== 'object' || Array.isArray(colors)) throw new TypeError('Colors must be an object');
  for (const [key, value] of Object.entries(colors)) {
    if (!Object.hasOwn(BASE, key) || typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) throw new TypeError(`Invalid color: ${key}; use #RRGGBB`);
  }
}
/** Generate an original, repeatable SVG textile pattern. No DOM required. */
export function createPattern(options = {}) {
  const { type = 'almond', width = 512, height = 512, tileSize = 96, seed = 1, colors = {} } = options;
  if (!['almond', 'atlas', 'rosette'].includes(type)) throw new TypeError('Unknown pattern type');
  for (const [key, n] of Object.entries({ width, height, tileSize, seed })) if (!Number.isFinite(n)) throw new TypeError(`${key} must be finite`);
  if (width < 1 || height < 1 || width > 2048 || height > 2048 || tileSize < 24 || tileSize > 512) throw new RangeError('Use dimensions 1–2048 and tileSize 24–512');
  validateColors(colors);
  const c = { ...BASE, ...colors };
  const pieces = [`<rect width="100%" height="100%" fill="${c.cloth}"/>`];
  const scale = tileSize / 100;
  const offset = ((Math.trunc(seed) % 7) + 7) % 7;
  for (let row = -1; row <= Math.ceil(height / tileSize); row++) {
    for (let col = -1; col <= Math.ceil(width / tileSize); col++) {
      const x = col * tileSize, y = row * tileSize;
      const alternate = ((row + col + offset) % 2 + 2) % 2;
      const stroke = alternate ? c.thread : c.trim;
      const open = `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${stroke}" stroke-width="1.3">`;
      if (type === 'almond') pieces.push(`${open}<path d="M50 8C14 28 19 77 50 92C81 77 86 28 50 8ZM50 18C27 37 30 69 50 81C70 69 73 37 50 18Z"/><path d="M50 74C31 52 69 48 50 26M41 57l-8-7m22-9 9-7" stroke="${c.detail}"/></g>`);
      if (type === 'rosette') pieces.push(`${open}<path d="M50 48C18 36 26 10 50 14C74 10 82 36 50 48ZM52 50C64 18 90 26 86 50C90 74 64 82 52 50ZM50 52C82 64 74 90 50 86C26 90 18 64 50 52ZM48 50C36 82 10 74 14 50C10 26 36 18 48 50Z"/><path d="m50 40 10 10-10 10-10-10Z" stroke="${c.trim}"/></g>`);
      if (type === 'atlas') pieces.push(`${open}<path d="m50 2 7 13 8-4 3 20 7-4 6 22-9 8-3 24-9-3-10 20-10-20-9 3-3-24-9-8 6-22 7 4 3-20 8 4Z" fill="${alternate ? c.detail : c.thread}" stroke="${c.trim}"/><path d="m50 22 15 28-15 28-15-28Z" fill="${c.cloth}"/></g>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>Textile-inspired ${type} pattern</title>${pieces.join('')}</svg>`;
}

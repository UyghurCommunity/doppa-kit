import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDoppa, createPattern } from '../src/index.js';
class Target {
  events = new Map();
  addEventListener(type, fn) { if (!this.events.has(type)) this.events.set(type, new Set()); this.events.get(type).add(fn); }
  removeEventListener(type, fn) { this.events.get(type)?.delete(fn); }
  emit(type, data = {}) { for (const fn of this.events.get(type) || []) fn(data); }
  count() { return [...this.events.values()].reduce((n, set) => n + set.size, 0); }
}
function fixture(reduced = false) {
  const doc = new Target(), win = new Target(), motion = new Target();
  motion.matches = reduced; doc.hidden = false; doc.defaultView = win;
  const frames = new Map(), observers = []; let id = 0, draws = 0, threadStrokes = 0;
  win.matchMedia = () => motion; win.devicePixelRatio = 3;
  win.requestAnimationFrame = (fn) => { frames.set(++id, fn); return id; };
  win.cancelAnimationFrame = (key) => frames.delete(key);
  class Observer { constructor(fn) { this.fn = fn; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } }
  win.ResizeObserver = Observer; win.IntersectionObserver = Observer;
  const drawingState = {};
  const context = new Proxy(drawingState, { get(_, key) {
    if (key === 'createRadialGradient') return () => ({ addColorStop() {} });
    return (...args) => { if (key === 'clearRect') draws++; if (key === 'stroke' && drawingState.strokeStyle === '#e9e2bf') threadStrokes++; for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg)); };
  }, set(target, key, value) { target[key] = value; return true; } });
  const canvas = new Target(); canvas.ownerDocument = doc; canvas.width = 300; canvas.height = 150; canvas.style = { touchAction: 'auto' };
  const attrs = new Map([['role', 'presentation']]);
  canvas.getAttribute = (key) => attrs.get(key) ?? null; canvas.hasAttribute = (key) => attrs.has(key);
  canvas.setAttribute = (key, value) => attrs.set(key, String(value)); canvas.removeAttribute = (key) => attrs.delete(key);
  canvas.getContext = () => context; canvas.getBoundingClientRect = () => ({ width: 400, height: 300 });
  let captured = null; canvas.setPointerCapture = (id) => { captured = id; }; canvas.hasPointerCapture = (id) => captured === id; canvas.releasePointerCapture = () => { captured = null; };
  return { doc, win, motion, canvas, attrs, frames, observers, draws: () => draws, threadStrokes: () => threadStrokes };
}
test('SVG patterns are deterministic and types differ', () => {
  const options = { seed: 12, width: 240, height: 180, type: 'atlas' };
  assert.equal(createPattern(options), createPattern(options));
  assert.notEqual(createPattern(options), createPattern({ ...options, seed: 13 }));
  assert.match(createPattern({ type: 'rosette' }), /viewBox="0 0 512 512"/);
});
test('SVG generation rejects markup injection and unbounded work', () => {
  assert.throws(() => createPattern({ colors: { thread: '"><script>' } }), /Invalid color/);
  assert.throws(() => createPattern({ colors: { unknown: '#000000' } }), /Invalid color/);
  assert.throws(() => createPattern({ width: Infinity }), /finite/);
  assert.throws(() => createPattern({ width: 5000 }), RangeError);
  assert.throws(() => createPattern({ tileSize: 0 }), RangeError);
  assert.throws(() => createPattern({ type: 'unknown' }), /Unknown/);
});
test('renderer mounts independently, exports finite SVG and rejects duplicate mount', () => {
  const a = fixture(), b = fixture(); const one = createDoppa(a.canvas, { paused: true }), two = createDoppa(b.canvas, { paused: true });
  assert.throws(() => createDoppa(a.canvas), /already/);
  one.setPalette('golden'); assert.equal(two.getState().palette, 'badam');
  const svg = one.toSVG(); assert.match(svg, /^<svg/); assert.match(svg, /<path/); assert.ok(!/NaN|Infinity|undefined/.test(svg));
  assert.equal(a.canvas.width, 800); assert.equal(a.canvas.height, 600);
  one.destroy(); two.destroy();
});
test('pause, resume, reduced motion and visibility control scheduled frames', () => {
  const f = fixture(); const art = createDoppa(f.canvas);
  assert.equal(f.frames.size, 1); art.pause(); assert.equal(f.frames.size, 0); art.resume(); assert.equal(f.frames.size, 1);
  f.motion.matches = true; f.motion.emit('change'); assert.equal(f.frames.size, 0); assert.equal(art.getState().reducedMotion, true);
  f.motion.matches = false; f.motion.emit('change'); assert.equal(f.frames.size, 1);
  f.doc.hidden = true; f.doc.emit('visibilitychange'); assert.equal(f.frames.size, 0);
  f.doc.hidden = false; f.doc.emit('visibilitychange'); assert.equal(f.frames.size, 1);
  art.destroy(); assert.equal(f.frames.size, 0);
});
test('pointer rotation, tilt constraints and keyboard shortcuts work', () => {
  const f = fixture(); const art = createDoppa(f.canvas, { paused: true }); const original = art.getState().yaw;
  f.canvas.emit('pointerdown', { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
  f.canvas.emit('pointermove', { pointerId: 2, clientX: 500, clientY: 500 }); assert.equal(art.getState().yaw, original);
  f.canvas.emit('pointermove', { pointerId: 1, clientX: 100, clientY: -10000 }); assert.ok(art.getState().yaw > original); assert.equal(art.getState().elevation, 1.12);
  f.canvas.emit('pointercancel', { pointerId: 1 });
  let prevented = false; f.canvas.emit('keydown', { key: 'Home', preventDefault() { prevented = true; } });
  assert.equal(art.getState().yaw, original); assert.ok(prevented);
  f.canvas.emit('keydown', { key: ' ', preventDefault() {} }); assert.equal(art.getState().paused, false);
  art.destroy();
});
test('destroy restores attributes and disconnects everything, then permits remount', () => {
  const f = fixture(); const art = createDoppa(f.canvas, { paused: true }); art.destroy(); art.destroy();
  assert.equal(f.canvas.count(), 0); assert.equal(f.doc.count(), 0); assert.equal(f.motion.count(), 0);
  assert.ok(f.observers.every((o) => o.disconnected)); assert.equal(f.attrs.get('role'), 'presentation'); assert.equal(f.attrs.has('tabindex'), false);
  assert.equal(f.canvas.width, 300); assert.equal(f.canvas.style.touchAction, 'auto'); assert.throws(() => art.rotate(1), /destroyed/);
  createDoppa(f.canvas, { paused: true }).destroy();
});
test('renderer validates palettes and colors and has no server-side DOM requirement', () => {
  assert.throws(() => createDoppa(null), /canvas/);
  const f = fixture(); const art = createDoppa(f.canvas, { paused: true });
  assert.throws(() => art.setPalette('constructor'), /Unknown/); assert.throws(() => art.setColors({ cloth: 'red' }), /Invalid/);
  art.setColors({ cloth: '#123456', thread: '#abcdef' }); assert.match(art.toSVG(), /#abcdef/);
  assert.throws(() => art.rotate(NaN), /finite/); art.destroy();
});

test('still instances show complete embroidery immediately', () => {
  for (const options of [{ paused: true }, { autoRotate: false }]) {
    const f = fixture(); const art = createDoppa(f.canvas, options);
    assert.equal(f.frames.size, 0); assert.ok(f.threadStrokes() > 100); art.destroy();
  }
});

test('custom velvet colors tint atlas SVG and preset selection restores the palette', () => {
  const f = fixture(); const art = createDoppa(f.canvas, { paused: true, palette: 'atlas' });
  const original = art.toSVG(); art.setColors({ cloth: '#dd3366' });
  assert.notEqual(art.toSVG(), original); art.setPalette('atlas'); assert.equal(art.toSVG(), original); art.destroy();
});

test('second pointers do not replace the active drag', () => {
  const f = fixture(); const art = createDoppa(f.canvas, { paused: true });
  const initial = art.getState().yaw;
  f.canvas.emit('pointerdown', { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
  f.canvas.emit('pointerdown', { button: 0, pointerId: 2, clientX: 100, clientY: 100 });
  f.canvas.emit('pointermove', { pointerId: 1, clientX: 50, clientY: 0 });
  assert.ok(art.getState().yaw > initial); art.destroy(); assert.equal(f.canvas.hasPointerCapture(1), false);
});

test('initial render failure cleans up and allows mounting again', () => {
  const f = fixture(); const measure = f.canvas.getBoundingClientRect;
  f.canvas.getBoundingClientRect = () => { throw new Error('measurement failed'); };
  assert.throws(() => createDoppa(f.canvas, { paused: true }), /measurement failed/);
  assert.equal(f.canvas.count(), 0); assert.equal(f.doc.count(), 0);
  f.canvas.getBoundingClientRect = measure; createDoppa(f.canvas, { paused: true }).destroy();
});

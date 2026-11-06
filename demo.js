import { createDoppa, createPattern } from './src/index.js';
const $ = (id) => document.getElementById(id);
function setBilingualText(target, text) {
  const runs = text.split(/([\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]+(?: +[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]+)*)/u);
  target.replaceChildren(...runs.filter(Boolean).map((run) => {
    if (!/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u.test(run)) return document.createTextNode(run);
    const span = document.createElement('span'); span.lang = 'ug'; span.className = 'alkatip-basma'; span.textContent = run; return span;
  }));
}
const art = createDoppa($('art'), { onChange(state) {
  setBilingualText($('pause'), state.paused ? 'داۋاملاشتۇرۇش / Resume' : 'توختىتىش / Pause');
  $('pause').setAttribute('aria-pressed', String(state.paused));
} });
const defaults = { badam: ['#e9e2bf', '#132b27'], atlas: ['#68d3cc', '#181f31'], golden: ['#ecc97b', '#2d1828'] };
let lastTextileColors = '';
function updatePattern() {
  const svg = createPattern({ type: $('pattern').value, width: 1024, height: 256, colors: { cloth: $('cloth').value, thread: $('thread').value } });
  $('pattern-preview').innerHTML = svg; // Only validated colors and fixed generator paths enter this SVG.
  const signature = `${$('cloth').value}/${$('thread').value}`;
  document.querySelectorAll('[data-textile]').forEach((sheet) => {
    if (lastTextileColors !== signature) sheet.innerHTML = createPattern({ type: sheet.dataset.textile, width: 288, height: 216, tileSize: 72, colors: { cloth: $('cloth').value, thread: $('thread').value } });
    sheet.classList.toggle('is-selected', sheet.dataset.textile === $('pattern').value);
  });
  document.querySelectorAll('[data-hero-pattern]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.heroPattern === $('pattern').value)));
  $('weave-sculpture').style.setProperty('--silk-glow', $('thread').value);
  lastTextileColors = signature;
  return svg;
}
document.querySelectorAll('[data-hero-pattern]').forEach((button) => button.addEventListener('click', () => { $('pattern').value = button.dataset.heroPattern; updatePattern(); }));
$('palette').addEventListener('change', () => {
  art.setPalette($('palette').value);
  [$('thread').value, $('cloth').value] = defaults[$('palette').value];
  updatePattern();
});
['thread', 'cloth'].forEach((id) => $(id).addEventListener('input', () => { art.setColors({ thread: $('thread').value, cloth: $('cloth').value }); updatePattern(); }));
$('pause').addEventListener('click', () => art.getState().paused ? art.resume() : art.pause());
$('reset').addEventListener('click', () => art.reset());
function download(svg, filename) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setBilingualText($('status'), `${filename} تەييارلاندى. / Download prepared.`);
}
$('export').addEventListener('click', () => download(art.toSVG(), 'doppa.svg'));
$('pattern-export').addEventListener('click', () => download(updatePattern(), `doppa-${$('pattern').value}.svg`));
$('pattern').addEventListener('change', updatePattern);
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('example').textContent); setBilingualText($('status'), 'كۆچۈرۈلدى / Copied'); }
  catch { $('status').textContent = 'Please select and copy the example manually.'; }
});
window.addEventListener('pagehide', (event) => { if (!event.persisted) art.destroy(); });
updatePattern();

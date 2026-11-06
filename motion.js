const scene = document.getElementById('weave-sculpture');
const toggle = document.getElementById('weave-motion');
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = false, visible = true;
function syncMotion() {
  const stopped = paused || preference.matches;
  scene.dataset.motion = stopped || document.hidden || !visible ? 'paused' : 'running';
  document.documentElement.dataset.decorativeMotion = stopped ? 'paused' : 'running';
  toggle.disabled = preference.matches;
  toggle.setAttribute('aria-pressed', String(stopped));
  toggle.textContent = preference.matches ? 'ھەرىكەت ئازايتىلغان' : paused ? 'داۋاملاشتۇرۇش ▷' : 'توختىتىش Ⅱ';
  toggle.setAttribute('aria-label', preference.matches ? 'سىستېما ھەرىكەتنى ئازايتقان' : paused ? 'نەقىش ھەرىكىتىنى داۋاملاشتۇرۇش' : 'نەقىش ھەرىكىتىنى توختىتىش');
  if (stopped) { scene.style.removeProperty('--tilt-x'); scene.style.removeProperty('--tilt-y'); }
}
toggle.hidden = false;
toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
preference.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
scene.addEventListener('pointermove', (event) => {
  if (scene.dataset.motion !== 'running' || event.pointerType === 'touch') return;
  const rect = scene.getBoundingClientRect();
  scene.style.setProperty('--tilt-x', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 13}deg`);
  scene.style.setProperty('--tilt-y', `${(event.clientY - rect.top - rect.height / 2) / rect.height * -9}deg`);
});
scene.addEventListener('pointerleave', () => { scene.style.removeProperty('--tilt-x'); scene.style.removeProperty('--tilt-y'); });
if ('IntersectionObserver' in window) {
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncMotion(); }, { threshold: .05 });
  visibility.observe(scene);
  const entrance = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    if (!paused && !preference.matches) entry.target.classList.add('motion-enter');
    entrance.unobserve(entry.target);
  }), { threshold: .08 });
  document.querySelectorAll('.studio,.patterns,.docs').forEach((element) => entrance.observe(element));
  window.addEventListener('pagehide', (event) => { if (!event.persisted) { visibility.disconnect(); entrance.disconnect(); } });
}
syncMotion();

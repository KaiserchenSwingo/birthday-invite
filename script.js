// PIN-Gate + RSVP submit (Formspree) + brighter confetti
(function() {
  const PIN_HASH = '93e2a45037eb149bd13e633f2cdd848b0caaa04a4f048df7c49de10fb41a3d16'; // 2412
  const KEY = 'invite-unlocked-v1';
  const app = document.getElementById('app');
  const gate = document.getElementById('gate');
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-input');
  const error = document.getElementById('gate-error');

  function showApp(){ if (gate){ gate.classList.add('hidden'); gate.style.display='none'; } if (app) app.classList.remove('hidden'); }
  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  try { if (localStorage.getItem(KEY) === '1') showApp(); } catch(e){}
  if (form){
    form.setAttribute('novalidate','true');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault(); if (error) error.textContent='';
      const pin = (input.value||'').trim(); if (!pin) return;
      try {
        const digest = await sha256Hex(pin);
        if (digest === PIN_HASH){ try{ localStorage.setItem(KEY,'1'); }catch(e){} showApp(); }
        else { if (error) error.textContent='Falscher PIN. Versuch es bitte nochmal.'; input.focus(); input.select(); }
      } catch (err) { if (error) error.textContent='Dein Browser unterstützt diese Funktion nicht.'; }
      return false;
    });
  }

  // Countdown
  const target = new Date('2025-12-21T19:00:00+01:00');
  const el = document.getElementById('countdown');
  function update(){
    if (!el) return;
    const diff = target - new Date();
    if (diff <= 0){ el.textContent = 'Es geht los!'; return; }
    const days  = Math.floor(diff/(1000*60*60*24));
    const hours = Math.floor(diff/(1000*60*60)) % 24;
    const mins  = Math.floor(diff/(1000*60)) % 60;
    el.textContent = `${days} Tage, ${hours} Std, ${mins} Min`;
  }
  update(); setInterval(update, 60*1000);
})();

(function () {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  const status = document.getElementById('rsvp-status');
  const submitBtn = document.getElementById('rsvp-submit');
  const thanks = document.getElementById('thanks');
  const confettiRoot = document.getElementById('confetti');

  function launchConfetti() {
    if (!confettiRoot) return;
    confettiRoot.innerHTML = '';
    const colors = ['#FFFFFF','#2BD2FF','#87E8FF','#8266FF','#A28DFF','#FF3CAC','#FF64B7'];
    const pieces = 120;
    for (let i = 0; i < pieces; i++) {
      const p = document.createElement('span');
      p.className = 'p';
      const size = 6 + Math.random()*12;
      const color = colors[Math.floor(Math.random()*colors.length)];
      const left = Math.random()*100;
      const delay = Math.random()*0.8;
      const fall = 3 + Math.random()*2.5;
      const spin = 1.2 + Math.random()*1.6;

      p.style.setProperty('--c', color);
      p.style.width = `${size}px`;
      p.style.height = `${size*1.4}px`;
      p.style.left = `${left}%`;
      p.style.top = `-10%`;
      p.style.opacity = `${0.88 + Math.random()*0.12}`;
      // Zwei Animationen explizit setzen
      p.style.animation = `conf-fall ${fall}s linear ${delay}s 1 forwards, conf-spin ${spin}s ease-in-out ${delay/2}s infinite alternate`;

      if (Math.random() < 0.35) p.style.borderRadius = '50%/30%';
      if (Math.random() < 0.35) p.style.transform = `rotate(${Math.random()*360}deg)`;
      confettiRoot.appendChild(p);
    }
  }

  function showThanks() {
    const controls = document.querySelectorAll('#rsvp-form input, #rsvp-form select, #rsvp-form textarea, #rsvp-form button, #rsvp-form p, #rsvp-form label, #rsvp-form h2');
    controls.forEach(el => { el.disabled = true; });
    const wrapperChildren = document.querySelectorAll('#rsvp-form > *:not(.thanks)');
    wrapperChildren.forEach(el => { el.setAttribute('aria-hidden','true'); });
    const root = document.getElementById('rsvp-form');
    if (root) root.classList.add('success');
    if (thanks) thanks.setAttribute('aria-hidden','false');
    launchConfetti();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (status) status.textContent = 'Sende …';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (resp.ok) {
        if (status) status.textContent = '';
        form.reset();
        showThanks();
      } else {
        if (status) status.textContent = 'Uff, da ging was schief. Versuch es später erneut.';
      }
    } catch (err) {
      if (status) status.textContent = 'Keine Verbindung. Prüfe kurz dein Internet.';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
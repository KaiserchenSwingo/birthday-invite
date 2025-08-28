// === PIN-Gate + Countdown ===
(function(){
  const PIN_HASH = '93e2a45037eb149bd13e633f2cdd848b0caaa04a4f048df7c49de10fb41a3d16'; // PIN: 2412
  const KEY = 'invite-unlocked-v1';
  const app = document.getElementById('app');
  const gate = document.getElementById('gate');
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-input');
  const error = document.getElementById('gate-error');

  function showApp(){
    if (gate){ gate.classList.add('hidden'); gate.style.display='none'; }
    if (app) app.classList.remove('hidden');
  }

  async function sha256Hex(str){
    if (!window.crypto || !window.crypto.subtle) return null;
    const enc = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  try { if (localStorage.getItem(KEY) === '1') showApp(); } catch(e){}

  if (form){
    form.setAttribute('novalidate','true');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if (error) error.textContent = '';
      const pin = (input.value||'').trim();
      if (!pin) return;

      try {
        let digest = await sha256Hex(pin);
        const ok = (digest ? (digest === PIN_HASH) : (pin === '2412'));
        if (ok){
          try { localStorage.setItem(KEY,'1'); } catch(e){}
          showApp();
        } else {
          if (error) error.textContent = 'Falscher PIN. Versuch es bitte nochmal.';
          input.focus(); input.select();
        }
      } catch (err){
        if (pin === '2412'){ try{ localStorage.setItem(KEY,'1'); }catch(e){} showApp(); }
        else { if (error) error.textContent = 'Falscher PIN. Versuch es bitte nochmal.'; }
      }
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

// === RSVP + Danke-Konfetti (robust, ohne :scope) ===
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
    const pieces = 140;
    for (let i = 0; i < pieces; i++) {
      const p = document.createElement('span');
      p.className = 'p';
      const size = 6 + Math.random()*12;
      const color = colors[Math.floor(Math.random()*colors.length)];
      const left = Math.random()*100;
      const delay = Math.random()*0.8;
      const fall = 3 + Math.random()*2.8;
      const spin = 1.1 + Math.random()*1.8;

      p.style.setProperty('--c', color);
      p.style.width = `${size}px`;
      p.style.height = `${size*1.4}px`;
      p.style.left = `${left}%`;
      p.style.top = `-10%`;
      p.style.opacity = `${0.90 + Math.random()*0.10}`;
      p.style.animation = `conf-fall ${fall}s linear ${delay}s 1 forwards, conf-spin ${spin}s ease-in-out ${delay/2}s infinite alternate`;

      if (Math.random() < 0.35) p.style.borderRadius = '50%/30%';
      if (Math.random() < 0.35) p.style.transform = `rotate(${Math.random()*360}deg)`;
      confettiRoot.appendChild(p);
    }
  }

  function hideFormFields() {
    try {
      const toDisable = form.querySelectorAll('input, select, textarea, button');
      toDisable.forEach(el => { el.disabled = true; });
      Array.from(form.children).forEach(el => {
        if (!el.classList.contains('thanks')) el.setAttribute('aria-hidden','true');
      });
    } catch (e) {
      const toDisable = form.querySelectorAll('input, select, textarea, button');
      toDisable.forEach(el => { el.disabled = true; });
    }
  }

  function showThanks() {
    hideFormFields();
    form.classList.add('success');
    if (thanks) thanks.setAttribute('aria-hidden','false');
    setTimeout(launchConfetti, 40);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (status) status.textContent = 'Sende …';
    if (submitBtn) submitBtn.disabled = true;

    let done = false;
    const finish = () => { if (done) return; done = true; showThanks(); if (status) status.textContent = ''; };

    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (resp.ok || resp.type === 'opaque' || resp.status === 0) {
        form.reset();
        finish();
      } else {
        if (status) status.textContent = 'Uff, da ging was schief. Versuch es später erneut.';
      }
    } catch (err) {
      form.reset();
      finish();
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();

// === Robust Countdown: DD:HH:MM:SS (1s), persistent <span class="cd"> ===
(function(){
  const el = document.getElementById('countdown');
  if (!el) return;
  let target = new Date('2025-12-22T00:00:00+01:00');
  if (el.dataset && el.dataset.target){
    const t = new Date(el.dataset.target);
    if (!isNaN(+t)) target = t;
  }
  let cd = el.querySelector('.cd');
  if (!cd){ cd = document.createElement('span'); cd.className = 'cd'; el.appendChild(cd); }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function pad3(n){ return String(n).padStart(3,'0'); }
  function update(){
    const now = new Date();
    let diff = target - now;
    if (diff <= 0){ cd.textContent = '000:00:00:00'; return; }
    const totalSec = Math.floor(diff/1000);
    const days = Math.floor(totalSec / (24*3600));
    const hours = Math.floor((totalSec % (24*3600))/3600);
    const mins  = Math.floor((totalSec % 3600)/60);
    const secs  = totalSec % 60;
    cd.textContent = `${pad3(days)}:${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;
  }
  update(); setInterval(update, 1000);
})();
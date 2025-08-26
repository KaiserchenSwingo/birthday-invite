(function() {
  const PIN_HASH = '93e2a45037eb149bd13e633f2cdd848b0caaa04a4f048df7c49de10fb41a3d16'; // SHA-256('2412') – anpassen
  const KEY = 'invite-unlocked-v1';

  const app = document.getElementById('app');
  const gate = document.getElementById('gate');
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-input');
  const error = document.getElementById('gate-error');

  function showApp(){
    if (gate){ gate.classList.add('hidden'); gate.style.display='none'; }
    if (app) app.classList.remove('hidden');
    document.body.classList.add('unlocked');
  }

  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  try{ if (localStorage.getItem(KEY) === '1') showApp(); }catch(e){}

  if (form){
    form.setAttribute('novalidate','true');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if (error) error.textContent='';
      const pin = (input.value||'').trim();
      if (!pin) return;
      try{
        const digest = await sha256Hex(pin);
        if (digest === PIN_HASH){ try{ localStorage.setItem(KEY,'1'); }catch(e){} showApp(); }
        else { if (error) error.textContent='Falscher PIN. Versuch es bitte nochmal.'; input.focus(); input.select(); }
      }catch(err){ if (error) error.textContent='Dein Browser unterstützt diese Funktion nicht.'; }
      return false;
    });
  }

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

(function(){
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  const status = document.getElementById('rsvp-status');
  const submitBtn = document.getElementById('rsvp-submit');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if (status) status.textContent='Sende …';
    if (submitBtn) submitBtn.disabled = true;
    try{
      const resp = await fetch(form.action, { method:'POST', body:new FormData(form), headers:{'Accept':'application/json'} });
      if (resp.ok){ if (status) status.textContent='Danke! Deine Antwort ist angekommen.'; form.reset(); }
      else { if (status) status.textContent='Uff, da ging was schief. Versuch es später erneut.'; }
    }catch(err){ if (status) status.textContent='Keine Verbindung. Prüfe kurz dein Internet.'; }
    finally{ if (submitBtn) submitBtn.disabled = false; }
  });
})();
// Robust RSVP + Confetti trigger (Formspree, CORS/opaque fallback)
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
    const toDisable = form.querySelectorAll('input, select, textarea, button');
    toDisable.forEach(el => { el.disabled = true; });
    const toHide = form.querySelectorAll(':scope > *:not(.thanks)');
    toHide.forEach(el => { el.setAttribute('aria-hidden','true'); });
  }

  function showThanks() {
    hideFormFields();
    form.classList.add('success');
    if (thanks) thanks.setAttribute('aria-hidden','false');
    setTimeout(launchConfetti, 50);
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
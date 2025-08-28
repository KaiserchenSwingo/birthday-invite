// === PIN-Gate + Countdown ===
(function(){
  
// === SHA-256 polyfill (works without crypto.subtle / HTTPS) ===
function sha256_polyfill(ascii){
  function R(n,x){ return (x>>>n) | (x<<(32-n)); }
  var maxWord = Math.pow(2,32), result = '', i, j;
  var words = [], asciiBitLength = ascii.length*8;
  var hash = [], k = [], primeCounter = 0;
  function isPrime(n){ for (var i=2,s=Math.sqrt(n); i<=s; i++) if(n%i===0) return false; return true; }
  function frac(n){ return ((n - Math.floor(n)) * maxWord) | 0; }
  for (var candidate=2; primeCounter<64; candidate++){
    if (isPrime(candidate)){ 
      if (primeCounter<8) hash[primeCounter] = frac(Math.pow(candidate, 1/2));
      k[primeCounter++] = frac(Math.pow(candidate, 1/3));
    }
  }
  ascii += '\x80';
  while (ascii.length%64 - 56) ascii += '\x00';
  for (i=0; i<ascii.length; i++){
    j = ascii.charCodeAt(i);
    words[i>>2] |= j << ((3 - i)%4)*8;
  }
  words[words.length] = ((asciiBitLength/ maxWord) | 0);
  words[words.length] = (asciiBitLength) & 0xffffffff;
  for (j=0; j<words.length;){
    var w = words.slice(j, j += 16);
    var oldHash = hash.slice(0);
    for (i=0; i<64; i++){
      var w15 = w[i-15], w2 = w[i-2];
      var s0 = (R(7,w15)) ^ (R(18,w15)) ^ (w15>>>3);
      var s1 = (R(17,w2)) ^ (R(19,w2)) ^ (w2>>>10);
      w[i] = (i<16) ? w[i] : (((w[i-16] + s0 |0) + (w[i-7] |0) + s1) |0);
      var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      var S0 = R(2,hash[0]) ^ R(13,hash[0]) ^ R(22,hash[0]);
      var S1 = R(6,hash[4]) ^ R(11,hash[4]) ^ R(25,hash[4]);
      var t1 = (((((hash[7] + S1 |0) + ch |0) + k[i] |0) + w[i]) |0);
      var t2 = (S0 + maj) |0;
      hash = [(t1 + t2 |0) + hash[0] |0].concat(hash);
      hash[4] = (hash[4] + t1) |0;
      hash.pop();
    }
    for (i=0; i<8; i++){ hash[i] = (hash[i] + oldHash[i]) |0; }
  }
  for (i=0; i<8; i++){
    for (j=3; j+1; j--){
      var b = (hash[i] >> (j*8)) & 255;
      result += ((b<16) ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

async function sha256Hex(str){
  try{
    if (window.crypto && window.crypto.subtle){
      const data = new TextEncoder().encode(str);
      const buf  = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
  }catch(e){}
  // Fallback
  return Promise.resolve(sha256_polyfill(str));
}

const PIN_HASH = '05c8bd5d4dcdb18b690e160fd7a5c5190ee9ce7eb565d88f8e7b1f81b5f25bf6'; // PIN: 2212
  const KEY = 'invite-unlocked-v1';
  const app = document.getElementById('app');
  const gate = document.getElementById('gate');
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-input');
  const error = document.getElementById('gate-error');

  function showApp(){
  if (gate){ gate.classList.add('hidden'); gate.style.display='none'; try{document.body.classList.remove('pin-locked');}catch(e){} }
  if (app){ app.classList.remove('hidden'); try{app.style.removeProperty('display');}catch(e){} }
}catch(e){} }
    if (app) app.classList.remove('hidden');
  }

  async function sha256Hex(str){
    if (!window.crypto || !window.crypto.subtle) return null;
    const enc = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  try { if (localStorage.getItem(KEY) === '1') showApp(); else { document.body.classList.add('pin-locked'); } } catch(e){ document.body.classList.add('pin-locked'); }

  if (form){
    form.setAttribute('novalidate','true');
    form.setAttribute('novalidate','true');
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if (error) error.textContent='';
  const pin = (input && input.value ? input.value.trim() : '');
  if (!pin) return;
  try{
    const digest = await sha256Hex(pin);
    const ok = !!(digest && digest === PIN_HASH);
    if (ok){ try{localStorage.setItem(KEY,'1');}catch(e){} try{sessionStorage.setItem(KEY,'1');}catch(e){} showApp(); }
    else { if (error) error.textContent='Falscher PIN. Versuch es bitte nochmal.'; if (input){ input.focus(); input.select(); } }
  }catch(err){ if (error) error.textContent='Technischer Fehler – probier’s nochmal.'; }
}, { once:false });
      if (error) error.textContent = '';
      const pin = (input.value||'').trim();
      if (!pin) return;

      try {
        let digest = await sha256Hex(pin);
        const ok = !!(digest && digest === PIN_HASH);
        if (ok){
          try { localStorage.setItem(KEY,'1'); } catch(e){}
          showApp();
        } else {
          if (error) error.textContent = 'Falscher PIN. Versuch es bitte nochmal.';
          input.focus(); input.select();
        }
      } catch(err){ if (error) error.textContent = 'Technischer Fehler – probier’s nochmal.'; return false; }); }

  // Countdown (DD:HH:MM:SS to 22.12.2025 00:00; 1s updates)
  (function(){
    const el = document.getElementById('countdown');
    if (!el) return;
    let target = new Date('2025-12-22T00:00:00+01:00');
    if (el.dataset && el.dataset.target){
      const t = new Date(el.dataset.target);
      if (!isNaN(+t)) target = t;
    }
    el.textContent = '';
    const cd = document.createElement('span'); cd.className = 'cd'; el.appendChild(cd);
    const pad2 = n => String(n).padStart(2,'0');
    const pad3 = n => String(n).padStart(3,'0');
    function tick(){
      const diff = target - new Date();
      if (diff <= 0){ cd.textContent = '000:00:00:00'; return; }
      const total = Math.floor(diff/1000);
      const d = Math.floor(total/86400);
      const h = Math.floor((total%86400)/3600);
      const m = Math.floor((total%3600)/60);
      const s = total%60;
      cd.textContent = `${pad3(d)}:${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    }
    tick(); setInterval(tick, 1000);
  })();});
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
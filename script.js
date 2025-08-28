// === SHA-256 polyfill + helper ===
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
  for (i=0; i<ascii.length; i++){ j = ascii.charCodeAt(i); words[i>>2] |= j << ((3 - i)%4)*8; }
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
    if (window.crypto?.subtle){
      const data = new TextEncoder().encode(str);
      const buf  = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
  }catch(_){}
  return Promise.resolve(sha256_polyfill(str));
}

// === PIN-Gate (hash-only; PIN 2212) ===
(function(){
  const KEY='pin_ok_v1';
  const PIN_HASH='05c8bd5d4dcdb18b690e160fd7a5c5190ee9ce7eb565d88f8e7b1f81b5f25bf6'; // sha256('2212')

  const app=document.getElementById('app');
  const gate=document.getElementById('gate');
  const form=document.getElementById('gate-form');
  const input=document.getElementById('gate-input');
  const error=document.getElementById('gate-error');

  function showApp(){
    gate?.classList.add('hidden'); if (gate) gate.style.display='none';
    app?.classList.remove('hidden'); if (app) app.style.removeProperty('display');
    document.body.classList.remove('pin-locked');
  }
  function showGate(){
    gate?.classList.remove('hidden'); if (gate) gate.style.removeProperty('display');
    app?.classList.add('hidden'); if (app) app.style.display='none';
    document.body.classList.add('pin-locked');
  }

  try{ localStorage.getItem(KEY)==='1' ? showApp() : showGate(); }
  catch(_){ showGate(); }

  if (form){
    form.addEventListener('submit', async (e)=>{
      e.preventDefault(); if(error) error.textContent='';
      const pin=(input?.value||'').trim(); if(!pin) return;
      try{
        const digest=await sha256Hex(pin);
        const ok = !!(digest && digest===PIN_HASH);
        if(ok){
          try{ localStorage.setItem(KEY,'1'); }catch(_){}
          try{ sessionStorage.setItem(KEY,'1'); }catch(_){}
          showApp();
        }else{
          if(error) error.textContent='Falscher PIN. Versuch es bitte nochmal.';
          input?.focus(); input?.select();
        }
      }catch(_){ if(error) error.textContent='Technischer Fehler – bitte nochmal.'; }
    });
  }
})();

// === Countdown (DDD:HH:MM:SS) → Ziel: 22.12.2025 00:00 ===
(function(){
  const el = document.getElementById('countdown'); if(!el) return;
  const cd = el.querySelector('.cd') || (function(){ const s=document.createElement('span'); s.className='cd'; el.appendChild(s); return s; })();
  let target = new Date('2025-12-22T00:00:00+01:00');
  const p2=n=>String(n).padStart(2,'0'), p3=n=>String(n).padStart(3,'0');
  function tick(){
    let diff=target.getTime()-Date.now(); if(diff<0) diff=0;
    const T=Math.floor(diff/1000);
    const d=Math.floor(T/86400), h=Math.floor((T%86400)/3600), m=Math.floor((T%3600)/60), s=T%60;
    cd.textContent=`${p3(d)}:${p2(h)}:${p2(m)}:${p2(s)}`;
  }
  tick(); setInterval(tick, 1000);
})();

// Antwort-Form: simples Feedback (kein Backend)
(function(){
  const form=document.getElementById('antwort-form');
  if(!form) return;
  const fb=document.getElementById('antwort-feedback');
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    fb && (fb.textContent='Danke! Deine Antwort wurde notiert (lokal).');
    setTimeout(()=> fb && (fb.textContent=''), 4000);
    form.reset();
  });
})();
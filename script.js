// === PIN-Gate + Countdown ===
(function(){
  // Read PIN from dataset (optional), keep hash as default for backward compat
  const GATE_EL = document.getElementById('gate');
  const PIN_PLAIN = (GATE_EL && GATE_EL.dataset && GATE_EL.dataset.pinPlain) ? GATE_EL.dataset.pinPlain : null;
  const PIN_HASH = (GATE_EL && GATE_EL.dataset && GATE_EL.dataset.pinHash)
    ? GATE_EL.dataset.pinHash
    : '93e2a45037eb149bd13e633f2cdd848b0caaa04a4f048df7c49de10fb41a3d16'; // default: sha256('2412')
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

  try { if (localStorage.getItem(KEY) === '1' || sessionStorage.getItem(KEY) === '1') showApp(); } catch(e){}

  if (form){
    form.setAttribute('novalidate','true');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if (error) error.textContent = '';
      const pin = (input.value||'').trim();
      if (!pin) return;

      try {
        let digest = await sha256Hex(pin);
        const ok = !!(digest && PIN_HASH && (digest === PIN_HASH));
        if (ok){
          try { localStorage.setItem(KEY,'1'); } catch(e){} try { sessionStorage.setItem(KEY,'1'); } catch(e){}
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
  let target = new Date('2025-12-21T19:00:00+01:00');
  const el = document.getElementById('countdown');
  let cd = (el ? el.querySelector('.cd') : null);
if (el && !cd) { cd = document.createElement('span'); cd.className = 'cd'; el.appendChild(cd); }
if (el && el.dataset && el.dataset.target) {
    const t = new Date(el.dataset.target);
    if (!isNaN(+t)) target = t;
  }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function pad3(n){ return String(n).padStart(3,'0'); }
  function update(){ 
    if (!el) return; 
    const now = new Date();
    const diff = target - now;
    if (diff <= 0){ if (cd) cd.textContent = '00:00:00:00'; return; }
    const totalSec = Math.floor(diff/1000);
    const days = Math.floor(totalSec / (24*3600));
    const hours = Math.floor((totalSec % (24*3600)) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (cd) cd.textContent = `${pad3(days)}:${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;
  }
  update(); setInterval(update, 1000);

// Lightweight SHA-256 polyfill (hex) for environments without Crypto Subtle
function jsSha256Hex(str){
  function rrot(n,x){return (x>>>n)|(x<<(32-n));}
  function toHex(n){return ('00000000'+(n>>>0).toString(16)).slice(-8);}
  var i,j,t,w=new Array(64), H=[1779033703,-1150833019,1013904242,-1521486534,1359893119,-1694144372,528734635,1541459225],
      K=[1116352408,1899447441,-1245643825,-373957723,961987163,1508970993,-1841331548,-1424204075,-670586216,310598401,607225278,1426881987,1925078388,-2132889090,-1680079193,-1046744716,-459576895,-272742522,264347078,604807628,770255983,1249150122,1555081692,1996064986,-1740746414,-1473132947,-1341970488,-1084653625,-958395405,-710438585,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,-2117940946,-1838011259,-1564481375,-1474664885,-1035236496,-949202525,-778901479,-694614492,-200395387,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,-2067236844,-1933114872,-1866530822,-1538233109,-1090935817,-965641998];
  // UTF-8 encode
  var s=unescape(encodeURIComponent(str)), l=s.length, bytes=[],H0=H.slice(0);
  for(i=0;i<l;i++) bytes.push(s.charCodeAt(i));
  bytes.push(0x80);
  while((bytes.length%64)!==56) bytes.push(0);
  var bitLen=l*8; for(i=7;i>=0;i--) bytes.push((bitLen>>(i*8))&255);
  for(i=0;i<bytes.length;i+=64){
    for(j=0;j<16;j++) w[j]= (bytes[i+4*j]<<24)|(bytes[i+4*j+1]<<16)|(bytes[i+4*j+2]<<8)|(bytes[i+4*j+3]);
    for(;j<64;j++){ t=w[j-2]; var s1=rrot(17,t)^rrot(19,t)^(t>>>10); t=w[j-15]; var s0=rrot(7,t)^rrot(18,t)^(t>>>3); w[j]=(w[j-16]+s0|0)+(w[j-7]+s1|0)|0; }
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(j=0;j<64;j++){
      var S1=rrot(6,e)^rrot(11,e)^rrot(25,e), ch=(e&f)^(~e&g);
      var temp1=h+S1+ch+K[j]+w[j]|0;
      var S0=rrot(2,a)^rrot(13,a)^rrot(22,a), maj=(a&b)^(a&c)^(b&c);
      var temp2=S0+maj|0;
      h=g; g=f; f=e; e=d+temp1|0; d=c; c=b; b=a; a=temp1+temp2|0;
    }
    H[0]=H[0]+a|0; H[1]=H[1]+b|0; H[2]=H[2]+c|0; H[3]=H[3]+d|0; H[4]=H[4]+e|0; H[5]=H[5]+f|0; H[6]=H[6]+g|0; H[7]=H[7]+h|0;
  }
  return toHex(H[0])+toHex(H[1])+toHex(H[2])+toHex(H[3])+toHex(H[4])+toHex(H[5])+toHex(H[6])+toHex(H[7]);
}

  // --- HARDENED FALLBACK ---
  // If anything above throws, we still bind a super-simple plain-PIN check.
  try {
    if (form && !form.__fallbackBound){
      form.__fallbackBound = true;
      form.addEventListener('submit', function(ev){
        try{
          ev.preventDefault();
          const pin = (input && input.value ? input.value.trim() : '');
          let digest = null;
          try {
            if (window.crypto && window.crypto.subtle){
              const enc = new TextEncoder().encode(pin);
              return window.crypto.subtle.digest('SHA-256', enc).then(buf=>{
                const hex=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
                if (PIN_HASH && hex === PIN_HASH){ try{ localStorage.setItem(KEY,'1'); }catch(e){} try{ sessionStorage.setItem(KEY,'1'); }catch(e){} showApp(); }
                else { if (error) error.textContent = 'Falscher PIN. Versuch es bitte nochmal.'; }
                return false;
              });
            } else {
              const hex = jsSha256Hex(pin);
              if (PIN_HASH && hex === PIN_HASH){ try{ localStorage.setItem(KEY,'1'); }catch(e){} try{ sessionStorage.setItem(KEY,'1'); }catch(e){} showApp(); }
              else { if (error) error.textContent = 'Falscher PIN. Versuch es bitte nochmal.'; }
            }
          } catch(e){
            if (error) error.textContent = 'Technischer Fehler – probier’s nochmal.';
          }
          return false;
        }catch(e){ if (error) error.textContent = 'Technischer Fehler – probier’s nochmal.'; return false; }
      }, { once:false });
    }
  } catch(e){ /* swallow */ }

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

  
// Lightweight SHA-256 polyfill (hex) for environments without Crypto Subtle
function jsSha256Hex(str){
  function rrot(n,x){return (x>>>n)|(x<<(32-n));}
  function toHex(n){return ('00000000'+(n>>>0).toString(16)).slice(-8);}
  var i,j,t,w=new Array(64), H=[1779033703,-1150833019,1013904242,-1521486534,1359893119,-1694144372,528734635,1541459225],
      K=[1116352408,1899447441,-1245643825,-373957723,961987163,1508970993,-1841331548,-1424204075,-670586216,310598401,607225278,1426881987,1925078388,-2132889090,-1680079193,-1046744716,-459576895,-272742522,264347078,604807628,770255983,1249150122,1555081692,1996064986,-1740746414,-1473132947,-1341970488,-1084653625,-958395405,-710438585,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,-2117940946,-1838011259,-1564481375,-1474664885,-1035236496,-949202525,-778901479,-694614492,-200395387,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,-2067236844,-1933114872,-1866530822,-1538233109,-1090935817,-965641998];
  // UTF-8 encode
  var s=unescape(encodeURIComponent(str)), l=s.length, bytes=[],H0=H.slice(0);
  for(i=0;i<l;i++) bytes.push(s.charCodeAt(i));
  bytes.push(0x80);
  while((bytes.length%64)!==56) bytes.push(0);
  var bitLen=l*8; for(i=7;i>=0;i--) bytes.push((bitLen>>(i*8))&255);
  for(i=0;i<bytes.length;i+=64){
    for(j=0;j<16;j++) w[j]= (bytes[i+4*j]<<24)|(bytes[i+4*j+1]<<16)|(bytes[i+4*j+2]<<8)|(bytes[i+4*j+3]);
    for(;j<64;j++){ t=w[j-2]; var s1=rrot(17,t)^rrot(19,t)^(t>>>10); t=w[j-15]; var s0=rrot(7,t)^rrot(18,t)^(t>>>3); w[j]=(w[j-16]+s0|0)+(w[j-7]+s1|0)|0; }
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(j=0;j<64;j++){
      var S1=rrot(6,e)^rrot(11,e)^rrot(25,e), ch=(e&f)^(~e&g);
      var temp1=h+S1+ch+K[j]+w[j]|0;
      var S0=rrot(2,a)^rrot(13,a)^rrot(22,a), maj=(a&b)^(a&c)^(b&c);
      var temp2=S0+maj|0;
      h=g; g=f; f=e; e=d+temp1|0; d=c; c=b; b=a; a=temp1+temp2|0;
    }
    H[0]=H[0]+a|0; H[1]=H[1]+b|0; H[2]=H[2]+c|0; H[3]=H[3]+d|0; H[4]=H[4]+e|0; H[5]=H[5]+f|0; H[6]=H[6]+g|0; H[7]=H[7]+h|0;
  }
  return toHex(H[0])+toHex(H[1])+toHex(H[2])+toHex(H[3])+toHex(H[4])+toHex(H[5])+toHex(H[6])+toHex(H[7]);
}

  // --- HARDENED FALLBACK ---
  // If anything above throws, we still bind a super-simple plain-PIN check.
  try {
    if (form && !form.__fallbackBound){
      form.__fallbackBound = true;
      form.addEventListener('submit', function(ev){
        try{
          ev.preventDefault();
          const pin = (input && input.value ? input.value.trim() : '');
          let digest = null;
          try {
            if (window.crypto && window.crypto.subtle){
              const enc = new TextEncoder().encode(pin);
              return window.crypto.subtle.digest('SHA-256', enc).then(buf=>{
                const hex=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
                if (PIN_HASH && hex === PIN_HASH){ try{ localStorage.setItem(KEY,'1'); }catch(e){} try{ sessionStorage.setItem(KEY,'1'); }catch(e){} showApp(); }
                else { if (error) error.textContent = 'Falscher PIN. Versuch es bitte nochmal.'; }
                return false;
              });
            } else {
              const hex = jsSha256Hex(pin);
              if (PIN_HASH && hex === PIN_HASH){ try{ localStorage.setItem(KEY,'1'); }catch(e){} try{ sessionStorage.setItem(KEY,'1'); }catch(e){} showApp(); }
              else { if (error) error.textContent = 'Falscher PIN. Versuch es bitte nochmal.'; }
            }
          } catch(e){
            if (error) error.textContent = 'Technischer Fehler – probier’s nochmal.';
          }
          return false;
        }catch(e){ if (error) error.textContent = 'Technischer Fehler – probier’s nochmal.'; return false; }
      }, { once:false });
    }
  } catch(e){ /* swallow */ }

})();
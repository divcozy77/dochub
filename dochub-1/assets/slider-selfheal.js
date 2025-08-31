(function(){
  const PLACEHOLDER = "data:image/svg+xml;utf8,"+encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#101826'/><stop offset='1' stop-color='#293247'/></linearGradient></defs>
      <rect width='1280' height='720' fill='url(#g)'/>
      <g fill='rgba(255,255,255,.92)' font-family='Arial' text-anchor='middle'>
        <text x='640' y='380' font-size='44' font-weight='700'>Drop assets/preview-{1..3}.png</text>
      </g>
    </svg>`);

  function ensureCSS(){
    if (document.getElementById("dh-slider-css")) return;
    const css = document.createElement("style");
    css.id = "dh-slider-css";
    css.textContent = `
    /* --- Self-healing slider --- */
    .slider{position:relative;aspect-ratio:16/9;min-height:280px}
    .slide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s ease}
    .slide.active{opacity:1}
    .dots{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:8px;z-index:2}
    .dots button{width:9px;height:9px;border-radius:999px;border:1px solid var(--border,rgba(255,255,255,.15));background:rgba(0,0,0,.3);padding:0}
    .dots button[aria-selected="true"]{background:var(--accent,#7aa2ff);border-color:transparent}
    `;
    document.head.appendChild(css);
  }

  function buildSlider(frame){
    if (frame.id === "demo-slider" || frame.classList.contains("slider")) return frame;
    frame.classList.add("slider");
    frame.id = "demo-slider";
    frame.innerHTML = `
      <img class="shot slide active" src="${PLACEHOLDER}" alt="DocHub preview 1" data-srcs='["assets/preview-1.png","assets/preview-1.svg","assets/preview.png"]'>
      <img class="shot slide" src="${PLACEHOLDER}" alt="DocHub preview 2" data-srcs='["assets/preview-2.png","assets/preview-2.svg","assets/preview.png"]'>
      <img class="shot slide" src="${PLACEHOLDER}" alt="DocHub preview 3" data-srcs='["assets/preview-3.png","assets/preview-3.svg","assets/preview.png"]'>
      <div class="dots" role="tablist" aria-label="Demo slides"></div>`;
    return frame;
  }

  function upgradeSources(root){
    const imgs = root.querySelectorAll('img[data-srcs]');
    imgs.forEach(function(img){
      let list = [];
      try { list = JSON.parse(img.getAttribute('data-srcs') || '[]'); } catch(_) { list = []; }
      if (!list.length) return;
      let i = 0;
      (function tryNext(){
        if (i >= list.length) return;
        const url = list[i++];
        const test = new Image();
        test.onload = function(){ img.src = url; };
        test.onerror = function(){ tryNext(); };
        test.src = url + (url.includes('?')?'&':'?') + 'v=' + Date.now();
      })();
    });
  }

  function enhance(root){
    const slides = Array.from(root.querySelectorAll('.slide'));
    const dotsWrap = root.querySelector('.dots') || (()=>{ const d=document.createElement('div'); d.className='dots'; root.appendChild(d); return d; })();
    dotsWrap.innerHTML = "";
    slides.forEach((_, i)=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to slide ' + (i+1));
      b.setAttribute('aria-selected', String(i===0));
      b.addEventListener('click', ()=>{ go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    let cur = slides.findIndex(s=>s.classList.contains('active'));
    if (cur < 0) { slides[0].classList.add('active'); cur = 0; }

    function go(i){
      slides[cur]?.classList.remove('active');
      cur = (i + slides.length) % slides.length;
      slides[cur]?.classList.add('active');
      Array.from(dotsWrap.children).forEach((b, idx)=> b.setAttribute('aria-selected', String(idx===cur)));
    }
    function next(){ go(cur+1); }
    let timer=null, delay=3800;
    function start(){ timer = setInterval(next, delay); }
    function stop(){ if (timer) clearInterval(timer); timer=null; }
    function restart(){ stop(); start(); }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    start();

    document.addEventListener('keydown', function(e){
      const tag=(document.activeElement&&document.activeElement.tagName)||'';
      if(/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if(e.key==='ArrowRight'){ e.preventDefault(); next(); }
      if(e.key==='ArrowLeft'){ e.preventDefault(); go(cur-1); }
    });

    let sx=0, sy=0, dx=0, dy=0, touching=false;
    root.addEventListener('touchstart', (e)=>{ if(!e.touches[0]) return; touching=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; dx=dy=0; }, {passive:true});
    root.addEventListener('touchmove',  (e)=>{ if(!touching||!e.touches[0]) return; dx=e.touches[0].clientX - sx; dy=e.touches[0].clientY - sy; }, {passive:true});
    root.addEventListener('touchend',   ()=>{ if(!touching) return; touching=false; if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else go(cur-1); } });
  }

  function run(){
    ensureCSS();
    let frame = document.querySelector('.hero-card .frame') || document.querySelector('.frame');
    if (!frame) return;
    if (!frame.id && !frame.classList.contains('slider')) frame = buildSlider(frame);
    frame.querySelectorAll('.shot.slide').forEach((img, idx)=>{
      const i = (idx+1);
      if (!img.hasAttribute('data-srcs')) img.setAttribute('data-srcs', JSON.stringify([
        `assets/preview-${i}.png`, `assets/preview-${i}.svg`, `assets/preview.png`
      ]));
      if (!img.getAttribute('src') || img.getAttribute('src').startsWith('assets/preview-')) {
        img.setAttribute('src', PLACEHOLDER);
      }
    });
    upgradeSources(frame);
    enhance(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
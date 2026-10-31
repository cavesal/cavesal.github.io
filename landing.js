/* CaVeSal® — visor de imágenes compartido */
(function(){
  var all=[].slice.call(document.querySelectorAll('[data-lb]'));
  if(!all.length)return;
  var group=all.filter(function(e){return !e.hasAttribute('data-solo')}),items=group;
  var lb=document.createElement('div');
  lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Imagen ampliada');
  lb.innerHTML='<button type="button" class="lb-btn lb-close" aria-label="Cerrar">&times;</button><button type="button" class="lb-btn lb-prev" aria-label="Anterior">&#8249;</button><img alt=""/><button type="button" class="lb-btn lb-next" aria-label="Siguiente">&#8250;</button><div class="lb-cap"></div>';
  document.body.appendChild(lb);
  var img=lb.querySelector('img'),cap=lb.querySelector('.lb-cap'),i=0,last=null;
  function data(el){var im=el.querySelector('img');return{src:el.getAttribute('data-lb')||(im&&im.getAttribute('src')),cap:el.getAttribute('data-cap')||(im&&im.alt)||''};}
  function show(n){i=(n+items.length)%items.length;var d=data(items[i]);img.src=d.src;img.alt=d.cap;cap.textContent=d.cap;}
  function open(n){last=document.activeElement;show(n);lb.classList.add('open');document.body.style.overflow='hidden';lb.querySelector('.lb-close').focus();}
  function close(){lb.classList.remove('open');document.body.style.overflow='';if(last)last.focus();}
  all.forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();items=b.hasAttribute('data-solo')?[b]:group;lb.classList.toggle('solo',items.length<2);open(items.indexOf(b));});});
  lb.querySelector('.lb-close').onclick=close;
  lb.querySelector('.lb-prev').onclick=function(){show(i-1)};
  lb.querySelector('.lb-next').onclick=function(){show(i+1)};
  lb.addEventListener('click',function(e){if(e.target===lb)close();});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(i-1);if(e.key==='ArrowRight')show(i+1);});
  var x0=null;
  lb.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
  lb.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)show(i+(dx<0?1:-1));x0=null;});
})();

/* Música entre páginas: Canon (portada y Profesionales) y Claro de luna (Para la mujer) */
(function(){
  var mujer=/mujer\.html$/.test(location.pathname);
  var src=mujer?'img/landing/cavesal-musica-mujer.m4a':'img/landing/cavesal-musica.m4a';
  var key=mujer?'luna':'canon';
  var LS='cvs-musica',POS='cvs-musica-pos-'+key;
  function get(k,s){try{return (s?sessionStorage:localStorage).getItem(k)}catch(e){return null}}
  function put(k,v,s){try{(s?sessionStorage:localStorage).setItem(k,v)}catch(e){}}
  var a=new Audio();a.src=src;a.loop=true;a.preload='none';a.volume=.7;
  var btns=[].slice.call(document.querySelectorAll('[data-music-btn]'));
  var inVid=btns[0]||null;
  {var b=document.createElement('button');b.type='button';b.className='hv-snd hv-float';b.setAttribute('data-music-btn','');
    b.innerHTML='<svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg><svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg><span>Activar música</span>';
    document.body.appendChild(b);btns.push(b);
    if(inVid&&'IntersectionObserver' in window){b.hidden=true;new IntersectionObserver(function(es){b.hidden=es[0].isIntersecting;}).observe(inVid);}}
  function ui(on){btns.forEach(function(b){b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Silenciar música':'Activar música');var l=b.querySelector('span');if(l)l.textContent=on?'Silenciar':'Activar música';});}
  var wanted=get(LS)==='1',started=false;
  function play(){var p0=parseFloat(get(POS,1));if(!started&&p0>0){try{a.currentTime=p0}catch(e){} a.addEventListener('loadedmetadata',function f(){a.removeEventListener('loadedmetadata',f);try{if(a.currentTime<1)a.currentTime=p0}catch(e){}});}
    var p=a.play();started=true;if(p&&p.catch)p.catch(function(){});}
  function save(){if(!a.paused||a.currentTime>0)put(POS,String(a.currentTime||0),1);}
  ui(wanted);
  btns.forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();
    if(a.paused){wanted=true;put(LS,'1');play();ui(true);}else{wanted=false;put(LS,'0');a.pause();save();ui(false);}});});
  if(wanted){
    play();
    var go=function(e){if(e&&e.target&&e.target.closest&&e.target.closest('[data-music-btn]'))return;
      if(wanted&&a.paused)play();rm();};
    var rm=function(){['pointerdown','keydown','touchstart'].forEach(function(t){document.removeEventListener(t,go,true)})};
    ['pointerdown','keydown','touchstart'].forEach(function(t){document.addEventListener(t,go,true)});
  }
  setInterval(function(){if(!a.paused)save();},1000);
  window.addEventListener('pagehide',save);
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(!a.paused){save();a.pause();}}else if(wanted&&started)play();});
})();

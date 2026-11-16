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
  document.addEventListener('cvs:pausar-musica',function(){if(!a.paused){wanted=false;a.pause();save();ui(false);}});
  setInterval(function(){if(!a.paused)save();},1000);
  window.addEventListener('pagehide',save);
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(!a.paused){save();a.pause();}}else if(wanted&&started)play();});
})();

/* Tina Tin: videos que arrancan sin sonido al verse; un solo video con sonido a la vez */
(function(){
  var vs=[].slice.call(document.querySelectorAll('video[data-tina]'));
  if(!vs.length)return;
  var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lbl(b,on){b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Silenciar':'Activar sonido');var l=b.querySelector('span');if(l)l.textContent=on?'Silenciar':'Activar sonido';}
  function play(v){var p=v.play();if(p&&p.catch)p.catch(function(){});}
  vs.forEach(function(v){
    var b=v.parentNode.querySelector('.tina-snd');
    if(b)b.addEventListener('click',function(e){e.stopPropagation();
      if(v.muted){vs.forEach(function(o){if(o!==v){o.muted=true;var ob=o.parentNode.querySelector('.tina-snd');if(ob)lbl(ob,false);}});
        document.dispatchEvent(new Event('cvs:pausar-musica'));v.muted=false;try{v.currentTime=0}catch(_){}play(v);lbl(b,true);}
      else{v.muted=true;lbl(b,false);}});
  });
  if(!('IntersectionObserver' in window)){vs.forEach(function(v){v.preload='metadata';});return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(en){var v=en.target;
    if(en.isIntersecting){if(!calm||!v.muted)play(v);}else{v.pause();if(!v.muted){v.muted=true;var b=v.parentNode.querySelector('.tina-snd');if(b)lbl(b,false);}}});},{threshold:.4});
  vs.forEach(function(v){io.observe(v);});
})();

/* Tina Tin: subtítulos ES / PT / EN (los botones cambian todos los videos a la vez) */
(function(){
  var vs=[].slice.call(document.querySelectorAll('video[data-tina]'));
  if(!vs.length)return;
  var K='cvs-tina-sub',lang='es';
  try{lang=localStorage.getItem(K)||((navigator.language||'es').slice(0,2)==='pt'?'pt':(navigator.language||'es').slice(0,2)==='en'?'en':'es')}catch(e){}
  function apply(l){lang=l;try{localStorage.setItem(K,l)}catch(e){}
    vs.forEach(function(v){for(var i=0;i<v.textTracks.length;i++){var t=v.textTracks[i];t.mode=(t.language===l)?'showing':'disabled';}});
    [].forEach.call(document.querySelectorAll('.tina-langs button'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-sub')===l?'true':'false');});
    if(window.cvsTinaTexto)window.cvsTinaTexto(l);}
  [].forEach.call(document.querySelectorAll('.tina-langs button'),function(b){b.addEventListener('click',function(){apply(b.getAttribute('data-sub'));});});
  vs.forEach(function(v){v.addEventListener('loadedmetadata',function(){apply(lang);});v.addEventListener('play',function(){apply(lang);});});
  apply(lang);
})();

/* Tina Tin: textos de la sección #tina en ES / PT / EN (sigue al selector de subtítulos) */
(function(){
  var els=[].slice.call(document.querySelectorAll('#tina [data-ti]'));
  if(!els.length)return;
  var es={};els.forEach(function(e){es[e.getAttribute('data-ti')]=e.textContent;});
  var T={
  pt:{eyebrow:"Conheça a Tina Tin",h2:"Tina usa a CaVeSal® e conta como",
  bio:"Tina tem 28 anos, nasceu em Concepción e mora em Assunção. É cantora, está esperando o primeiro bebê e usa a CaVeSal® Mamá para acompanhar a gravidez semana a semana. Na casa dela, todas usam a CaVeSal® Mujer: a mãe cuida dos ossos e do coração, a irmã mais velha anota os exames e a irmãzinha de 14 anos aprende a conhecer o próprio ciclo. E a CaVeSal® IA, nossa robozinha com inteligência artificial integrada, a acompanha em cada passo com um cuidado integral da saúde feminina.",
  capMujer:"A saúde ginecológica dela em cada etapa",capMama:"A gravidez dela, semana a semana",
  casosT:"Os casos didáticos da Tina Tin e sua família",casosP:"Histórias curtas para entender a sua saúde: cada caso abre na CaVeSal® Mujer.",
  cta:"Ler os casos didáticos da Tina Tin →",catMujer:"Casos de Saúde Feminina (Ciclo, SOP, Menopausa)",catMama:"Casos de Gravidez, Parto e Bebê",
  chipsT:"Ir direto a um caso",ia:"Tina Tin é uma personagem virtual criada com IA pela CaVeSal®.",
  "c:tina-busca-embarazo-sop":"Tina tenta engravidar com SOP","c:tina-amenaza-aborto":"Sangramento no primeiro trimestre",
  "c:tina-edad-gestacional":"De quantas semanas estou?","c:tina-peso-bebe":"Peso do bebê no ultrassom",
  "c:tina-presion-glucemia":"Pressão alta e glicemia","c:tina-preparto":"Semana 37: já é o parto?",
  "c:tina-lactancia-colicos":"Amamentação e cólicas do bebê","c:tina-neurodesarrollo-juego":"Brincadeiras e estimulação precoce",
  "c:tina-glp1-anticoncepcion":"Tirzepatida e pílula anticoncepcional","c:tina-sop":"SOP e metabolismo",
  "c:tina-agenda-jornada":"Tina organiza o dia na Mi Agenda"},
  en:{eyebrow:"Meet Tina Tin",h2:"Tina uses CaVeSal® and tells you how",
  bio:"Tina is 28, was born in Concepción and lives in Asunción. She is a singer, is expecting her first baby and uses CaVeSal® Mamá to follow her pregnancy week by week. At home, all the women use CaVeSal® Mujer: her mom looks after her bones and heart, her older sister keeps track of her checkups and her 14-year-old little sister is learning about her cycle. And CaVeSal® IA, our little robot with built-in artificial intelligence, supports her every step of the way with comprehensive care for her women's health.",
  capMujer:"Her gynecological health at every stage",capMama:"Her pregnancy, week by week",
  casosT:"Educational cases of Tina Tin and her family",casosP:"Short stories to understand your health: each case opens in CaVeSal® Mujer.",
  cta:"Read Tina Tin's educational cases →",catMujer:"Women's Health Cases (Cycle, PCOS, Menopause)",catMama:"Pregnancy, Birth and Baby Cases",
  chipsT:"Go straight to a case",ia:"Tina Tin is a virtual character created with AI by CaVeSal®.",
  "c:tina-busca-embarazo-sop":"Tina tries to conceive with PCOS","c:tina-amenaza-aborto":"Bleeding in the first trimester",
  "c:tina-edad-gestacional":"How many weeks along am I?","c:tina-peso-bebe":"Baby's weight on ultrasound",
  "c:tina-presion-glucemia":"High blood pressure and blood sugar","c:tina-preparto":"Week 37: is it labor yet?",
  "c:tina-lactancia-colicos":"Breastfeeding and baby colic","c:tina-neurodesarrollo-juego":"Play and early stimulation",
  "c:tina-glp1-anticoncepcion":"Tirzepatide and the birth control pill","c:tina-sop":"PCOS and metabolism",
  "c:tina-agenda-jornada":"Tina plans her day in Mi Agenda"}};
  window.cvsTinaTexto=function(l){var t=T[l]||es;els.forEach(function(e){var k=e.getAttribute('data-ti');e.textContent=t[k]||es[k];});
    var s=document.getElementById('tina');if(s)s.setAttribute('lang',T[l]?l:'es');};
  var l='es';try{l=localStorage.getItem('cvs-tina-sub')||((navigator.language||'es').slice(0,2));}catch(e){}
  window.cvsTinaTexto(l);
})();

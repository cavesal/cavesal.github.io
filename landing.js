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

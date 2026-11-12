(function(){
  var d = document, root = d.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = location.search.indexOf('still') >= 0 || navigator.webdriver;

  // ---- contacts: fill these two lines, every button on the site picks them up
  var CONTACT = { tg: 'xxx1098', wa: '79255942909' };   // tg: 'username' (без @), wa: '79XXXXXXXXX'
  function contactUrl(text, prefer){
    var q = text ? encodeURIComponent(text) : '';
    var tg = CONTACT.tg ? 'https://t.me/' + CONTACT.tg + (q ? '?text=' + q : '') : '';
    var wa = CONTACT.wa ? 'https://wa.me/' + CONTACT.wa + (q ? '?text=' + q : '') : '';
    return prefer === 'wa' ? (wa || tg) : (tg || wa);
  }
  function wire(a, url){ if (url){ a.href = url; a.target = '_blank'; a.rel = 'noopener'; } }
  [].forEach.call(d.querySelectorAll('[data-contact]'), function(a){
    wire(a, contactUrl(a.getAttribute('data-text') || '', a.getAttribute('data-contact')));
  });

  // ---- wordmark fitted to the width
  function fit(){
    [].forEach.call(d.querySelectorAll('.js-fit'), function(el){
      var box = el.parentNode, avail = box.clientWidth; if (!avail) return;
      var tf = el.style.transform; el.style.transform = 'none';
      el.style.fontSize = '100px';
      var rg = d.createRange(); rg.selectNodeContents(el);
      var w = rg.getBoundingClientRect().width;
      el.style.transform = tf;
      if (w) el.style.fontSize = (100 * avail / w * 0.985) + 'px';
    });
  }
  fit(); addEventListener('resize', fit);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit);
  setTimeout(fit, 1500);

  // ---- reveal
  function reveal(){
    var vh = innerHeight || 800;
    [].forEach.call(d.querySelectorAll('.rv:not(.in), .ln:not(.in)'), function(el){
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) el.classList.add('in');
    });
  }
  if (reduce){ [].forEach.call(d.querySelectorAll('.rv, .ln'), function(el){ el.classList.add('in'); }); }
  else if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -5% 0px', threshold:.05});
    [].forEach.call(d.querySelectorAll('.rv, .ln'), function(el){ io.observe(el); });
  }
  addEventListener('scroll', reveal, {passive:true}); addEventListener('load', reveal);
  setTimeout(reveal, 350);
  var poll = setInterval(function(){ reveal(); if (!d.querySelector('.rv:not(.in), .ln:not(.in)')) clearInterval(poll); }, 500);

  // ---- Moscow clock and status
  function tick(){
    try {
      var p = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Moscow', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date());
      var h = p.filter(function(x){ return x.type === 'hour'; })[0].value, m = p.filter(function(x){ return x.type === 'minute'; })[0].value;
      [].forEach.call(d.querySelectorAll('.js-time'), function(n){ n.textContent = h + ':' + m; });
      var on = (+h % 24) >= 9 && (+h % 24) < 22;
      [].forEach.call(d.querySelectorAll('.js-status'), function(n){ n.textContent = on ? 'На связи, отвечу в течение часа' : 'Ночь по Москве, отвечу утром'; });
    } catch(e){}
  }
  tick(); setInterval(tick, 20000);

  // ---- menu
  var menu = d.getElementById('menu'), burger = d.getElementById('burger'), mclose = d.getElementById('mclose');
  function setMenu(open){
    menu.classList.toggle('open', open); d.body.classList.toggle('lock', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (window.__lenis){ open ? window.__lenis.stop() : window.__lenis.start(); }
    if (open) mclose.focus(); else burger.focus({preventScroll:true});
  }
  if (menu && burger){
    burger.addEventListener('click', function(){ setMenu(true); });
    mclose.addEventListener('click', function(){ setMenu(false); });
    d.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
  }

  // ---- page transition: the veil closes, then the next page opens it
  // the new page starts covered (set in <head>) and the veil slides up off it
  if (root.classList.contains('enter')){
    var open = function(){ root.classList.remove('enter'); };
    requestAnimationFrame(function(){ requestAnimationFrame(open); });
    setTimeout(open, 350);
  }
  if (!reduce && !still){
    d.addEventListener('click', function(e){
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.defaultPrevented) return;
      var href = a.getAttribute('href') || '';
      if (!/\.html(#.*)?$/.test(href) || /^https?:/.test(href)) return;
      e.preventDefault();
      try { sessionStorage.setItem('zv', '1'); } catch(err){}
      root.classList.add('leave');
      setTimeout(function(){ location.href = href; }, 120);
      setTimeout(function(){ root.classList.remove('leave'); }, 8000);
    });
    // load the next page in advance when the pointer or finger reaches a link
    var done = {};
    var pre = function(e){
      var a = e.target.closest ? e.target.closest('a') : null; if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!/^[a-z0-9-]+\.html/.test(href) || done[href]) return;
      done[href] = 1;
      var l = d.createElement('link'); l.rel = 'prefetch'; l.href = href.split('#')[0]; d.head.appendChild(l);
    };
    d.addEventListener('mouseover', pre, {passive:true});
    d.addEventListener('touchstart', pre, {passive:true});
    addEventListener('pageshow', function(e){ if (e.persisted) root.classList.remove('leave'); });
  }

  // ---- hover preview that follows the cursor (index rows)
  var peek = d.getElementById('peek');
  if (peek && matchMedia('(hover:hover) and (min-width:1001px)').matches){
    var px = 0, py = 0, tx = 0, ty = 0, raf = 0, imgs = peek.querySelectorAll('img');
    function loop(){ px += (tx - px) * .16; py += (ty - py) * .16; peek.style.left = px + 'px'; peek.style.top = py + 'px'; raf = requestAnimationFrame(loop); }
    [].forEach.call(d.querySelectorAll('[data-peek]'), function(row){
      row.addEventListener('mouseenter', function(e){
        var k = row.getAttribute('data-peek');
        [].forEach.call(imgs, function(im){ im.classList.toggle('on', im.getAttribute('data-k') === k); });
        tx = px = e.clientX + 180; ty = py = e.clientY; peek.classList.add('on'); if (!raf) loop();
      });
      row.addEventListener('mousemove', function(e){ tx = Math.min(e.clientX + 260, innerWidth - 250); ty = e.clientY; });
      row.addEventListener('mouseleave', function(){ peek.classList.remove('on'); cancelAnimationFrame(raf); raf = 0; });
    });
  }

  // ---- "try it" tool
  var tf = d.getElementById('tryf');
  if (tf){
    var N = {
      barber:  ['Барбершоп', 'Стрижки и бороды. Запись онлайн, без звонков.', 'Записаться', 'Открыто до 21:00'],
      coffee:  ['Кофейня', 'Кофе и свежая выпечка каждое утро.', 'Смотреть меню', 'Открыто с 8:00'],
      flowers: ['Цветы', 'Букеты на любой повод, соберём за час.', 'Выбрать букет', 'Открыто до 20:00'],
      beauty:  ['Салон красоты', 'Маникюр, брови и ресницы рядом с домом.', 'Записаться', 'Открыто до 21:00'],
      repair:  ['Ремонт', 'Чиним быстро, цену называем сразу.', 'Оставить заявку', 'Сегодня до 19:00']
    };
    var S = {strict:'строгий', warm:'тёплый', loud:'яркий'};
    var TR = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
    var slug = function(s){ var o = s.toLowerCase().split('').map(function(c){ return TR[c] !== undefined ? TR[c] : c; }).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); return (o || 'vashe-delo') + '.ru'; };
    var nm = d.getElementById('nm'), pv = d.getElementById('pv'), want = d.getElementById('want');
    var upd = function(){
      var name = nm.value.trim(), n = tf.querySelector('input[name=n]:checked').value, s = tf.querySelector('input[name=s]:checked').value, k = N[n];
      d.getElementById('pv-name').textContent = name || 'Ваше дело';
      d.getElementById('pv-url').textContent = slug(name);
      d.getElementById('pv-kind').textContent = k[0];
      d.getElementById('pv-hours').textContent = k[3];
      d.getElementById('pv-tag').textContent = k[1];
      d.getElementById('pv-btn').textContent = k[2];
      pv.setAttribute('data-s', s);
      wire(want, contactUrl('Здравствуйте! Хочу сайт' + (name ? ' для «' + name + '»' : '') + ' (' + k[0].toLowerCase() + ', ' + S[s] + ' стиль). Пишу с сайта zabytov.'));
    };
    tf.addEventListener('input', upd); tf.addEventListener('change', upd); upd();
  }

  // ---- brief builder (contact page)
  var bf = d.getElementById('brief');
  if (bf){
    var box = d.getElementById('brief-msg'), send = d.getElementById('brief-send'), send2 = d.getElementById('brief-send-wa');
    var bupd = function(){
      var v = function(n){ var c = bf.querySelector('input[name=' + n + ']:checked'); return c ? c.value : ''; };
      var what = [].map.call(bf.querySelectorAll('input[name=what]:checked'), function(c){ return c.value; });
      var about = d.getElementById('about-biz').value.trim();
      var lines = ['Здравствуйте! Пишу с сайта zabytov.'];
      if (what.length) lines.push('Нужно: ' + what.join(', ') + '.');
      if (about) lines.push('О деле: ' + about + '.');
      if (v('when')) lines.push('Срок: ' + v('when') + '.');
      if (v('mat')) lines.push('Материалы: ' + v('mat') + '.');
      var text = lines.join('\n');
      box.textContent = text;
      wire(send, contactUrl(text, 'tg')); wire(send2, contactUrl(text, 'wa'));
    };
    bf.addEventListener('input', bupd); bf.addEventListener('change', bupd); bupd();
  }

  // ---- smooth scroll and scroll-linked moves (optional layer)
  addEventListener('load', function(){
    if (reduce || still) return;
    if (window.Lenis){
      var lenis = new Lenis({duration: 1.05, smoothWheel: true});
      window.__lenis = lenis;
      if (window.gsap && window.ScrollTrigger){
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        (function rf(t){ lenis.raf(t); requestAnimationFrame(rf); })(performance.now());
      }
      [].forEach.call(d.querySelectorAll('a[href^="#"]'), function(a){
        a.addEventListener('click', function(e){
          var id = a.getAttribute('href'); if (id.length < 2) return;
          var t = d.querySelector(id); if (!t) return;
          e.preventDefault(); lenis.scrollTo(t, {offset: -70});
        });
      });
    }
    if (window.gsap && window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
      [].forEach.call(d.querySelectorAll('.js-par'), function(el){
        gsap.fromTo(el, {yPercent: -6}, {yPercent: 6, ease: 'none', scrollTrigger: {trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: true}});
      });
      [].forEach.call(d.querySelectorAll('.foot .wm'), function(el){
        gsap.fromTo(el, {yPercent: 28}, {yPercent: 0, ease: 'none', scrollTrigger: {trigger: el.parentNode, start: 'top bottom', end: 'bottom bottom', scrub: true}});
      });
      [].forEach.call(d.querySelectorAll('.hero .wm'), function(el){
        gsap.to(el, {xPercent: -6, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});
      });
    }
  });
})();

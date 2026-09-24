// Icarus offer pages: reveal, the self-driving stepper, ticking checks, tabs, timeline, typing.
(function(){
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onView(el, fn, threshold){
    if(!('IntersectionObserver' in window)){ fn(el); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ io.unobserve(e.target); fn(e.target); } });
    }, {threshold: threshold || .18});
    io.observe(el);
  }

  // Reveal
  document.querySelectorAll('.rv').forEach(function(el){ onView(el, function(t){ t.classList.add('in'); }, .12); });

  // Typing lines: types when its panel is shown (or on view if not in a panel)
  function type(el){
    var txt = el.getAttribute('data-type') || '';
    if(reduce){ el.textContent = txt; return; }
    clearInterval(el._t); el.textContent = ''; var i = 0;
    el._t = setInterval(function(){ i++; el.textContent = txt.slice(0, i); if(i >= txt.length) clearInterval(el._t); }, 18);
  }
  document.querySelectorAll('.typer').forEach(function(el){ if(!el.closest('.panel')) onView(el, type); });

  // Stepper: steps drive the screen; advances by itself, pauses on hover, stops once the visitor picks
  document.querySelectorAll('.stepper').forEach(function(st){
    var steps = [].slice.call(st.querySelectorAll('.step'));
    var panels = [].slice.call(st.querySelectorAll('.panel'));
    var dur = parseInt(st.getAttribute('data-dur') || '8000', 10);
    st.style.setProperty('--dur', dur + 'ms');
    var cur = 0, timer = null, left = dur, started = 0, visible = false, held = false;
    function show(i){
      cur = i;
      steps.forEach(function(s, k){ s.classList.toggle('on', k === i); s.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      panels.forEach(function(p, k){ p.classList.toggle('on', k === i); });
      var p = panels[i]; if(p) p.querySelectorAll('.typer').forEach(type);
      left = dur; arm();
    }
    function arm(){
      clearTimeout(timer);
      if(held || !visible || st.classList.contains('paused') || reduce) return;
      started = Date.now();
      timer = setTimeout(function(){ show((cur + 1) % steps.length); }, left);
    }
    steps.forEach(function(s, k){
      s.addEventListener('click', function(){ held = true; st.classList.add('held'); clearTimeout(timer); show(k); });
    });
    st.addEventListener('mouseenter', function(){ if(held) return; st.classList.add('paused'); clearTimeout(timer); left = Math.max(400, left - (Date.now() - started)); });
    st.addEventListener('mouseleave', function(){ if(held) return; st.classList.remove('paused'); arm(); });
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          var was = visible; visible = e.isIntersecting;
          if(visible && !was){ if(!st._began){ st._began = true; show(0); } else arm(); }
          if(!visible){ clearTimeout(timer); }
        });
      }, {threshold: .3}).observe(st);
    } else { visible = true; show(0); }
    if(reduce){ held = true; st.classList.add('held'); }
  });

  // Checks tick through one by one; the human press is always last
  document.querySelectorAll('.gates').forEach(function(g){
    onView(g, function(){
      var items = [].slice.call(g.querySelectorAll('.gate'));
      var out = document.querySelector(g.getAttribute('data-count-into') || '#none');
      items.forEach(function(it, k){
        setTimeout(function(){
          it.classList.add('done');
          if(out) out.textContent = Math.min(k + 1, items.length - (g.querySelector('.gate-human') ? 1 : 0));
        }, reduce ? 0 : 180 + k * 190);
      });
    }, .25);
  });

  // Tabs
  document.querySelectorAll('[role="tablist"]').forEach(function(list){
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    function pick(t){
      tabs.forEach(function(x){
        var on = x === t; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        var pane = document.getElementById(x.getAttribute('aria-controls')); if(pane) pane.hidden = !on;
        if(on && pane) pane.querySelectorAll('.timeline').forEach(runTimeline);
      });
    }
    tabs.forEach(function(t, k){
      t.addEventListener('click', function(){ pick(t); });
      t.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if(d){ e.preventDefault(); var n = tabs[(k + d + tabs.length) % tabs.length]; n.focus(); pick(n); }
      });
    });
  });

  // Timeline fills and lights each milestone as it passes
  function runTimeline(tl){
    var fill = tl.querySelector('.tl-fill'); var dots = tl.querySelectorAll('.tl-dot');
    if(!fill) return;
    fill.classList.remove('full'); dots.forEach(function(d){ d.classList.remove('hit'); });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ fill.classList.add('full'); }); });
    dots.forEach(function(d){
      var at = parseFloat(d.style.left) / 100;
      setTimeout(function(){ d.classList.add('hit'); }, reduce ? 0 : 1800 * at);
    });
  }
  document.querySelectorAll('.timeline').forEach(function(tl){ if(!tl.closest('[hidden]')) onView(tl, runTimeline); });

  // Year in the footer
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });
})();

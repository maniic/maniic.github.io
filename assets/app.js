/* Shared site runtime: loads content.json, renders the page, wires up effects. */
(function () {
  'use strict';

  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.body.getAttribute('data-page') || 'home';

  /* ---------- Theme ---------- */
  function initTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    updateThemeIcon(btn);
    btn.addEventListener('click', function () {
      toggleTheme();
      updateThemeIcon(btn);
    });
  }

  function toggleTheme() {
    var root = document.documentElement;
    var dark = root.getAttribute('data-theme') === 'dark';
    if (dark) { root.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); }
    else { root.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
    var btn = document.getElementById('themeToggle');
    if (btn) updateThemeIcon(btn);
  }

  function updateThemeIcon(btn) {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  }

  /* ---------- Cursor glow ---------- */
  function initGlow() {
    if (isTouch) return;
    document.addEventListener('mousemove', function (e) {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    });
  }

  /* ---------- Scroll progress ---------- */
  function initProgress() {
    var bar = document.getElementById('progress');
    if (!bar) return;
    var update = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    if (reduceMotion) {
      document.querySelectorAll('.reveal, .stagger-child').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        var children = e.target.querySelectorAll('.stagger-child');
        children.forEach(function (child, i) {
          child.style.transitionDelay = (i * 120) + 'ms';
          setTimeout(function () { child.classList.add('visible'); }, 10);
        });
      });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (isTouch) return;
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + x * 0.25 + 'px, ' + y * 0.25 + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ---------- Local time in footer ---------- */
  function initTime() {
    var el = document.getElementById('localTime');
    if (!el) return;
    var tick = function () {
      var now = new Date().toLocaleTimeString('en-CA', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto'
      });
      el.textContent = 'Toronto — ' + now;
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Hero name scramble ---------- */
  function scrambleHero(first, last) {
    var el = document.getElementById('heroName');
    if (!el) return;
    if (reduceMotion) {
      el.innerHTML = first + '<br /><span>' + last + '</span>';
      el.classList.add('scramble-done');
      el.style.opacity = '1';
      return;
    }
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var totalLen = first.length + last.length;
    var resolved = 0;
    var frame = 0;

    el.style.opacity = '1';

    function randomChar() { return chars[Math.floor(Math.random() * chars.length)]; }

    function render() {
      var a = '', b = '';
      for (var i = 0; i < first.length; i++) a += i < resolved ? first[i] : randomChar();
      var sr = Math.max(0, resolved - first.length);
      for (var j = 0; j < last.length; j++) b += j < sr ? last[j] : randomChar();
      el.innerHTML = a + '<br /><span>' + b + '</span>';
    }

    function tick() {
      frame++;
      if (frame % 2 === 0 && resolved < totalLen) resolved++;
      render();
      if (resolved < totalLen) requestAnimationFrame(tick);
      else {
        el.innerHTML = first + '<br /><span>' + last + '</span>';
        el.classList.add('scramble-done');
      }
    }

    setTimeout(function () { requestAnimationFrame(tick); }, 300);
  }

  /* ---------- Typed role rotator ---------- */
  function initRoles(roles) {
    var target = document.getElementById('roleText');
    if (!target || !roles || !roles.length) return;
    if (reduceMotion) {
      target.textContent = roles[0];
      return;
    }
    var idx = 0, len = 0, deleting = false;

    function step() {
      var word = roles[idx % roles.length];
      if (!deleting) {
        len++;
        target.textContent = word.slice(0, len);
        if (len === word.length) { deleting = true; return setTimeout(step, 2200); }
        return setTimeout(step, 55 + Math.random() * 45);
      }
      len--;
      target.textContent = word.slice(0, len);
      if (len === 0) { deleting = false; idx++; return setTimeout(step, 350); }
      return setTimeout(step, 30);
    }

    setTimeout(step, 1400);
  }

  /* ---------- Command palette ---------- */
  function initPalette(content) {
    var overlay = document.getElementById('palette');
    if (!overlay) return;
    var input = overlay.querySelector('.palette-input');
    var list = overlay.querySelector('.palette-list');
    var selected = 0;

    var socials = (content && content.socials) || {};
    var resume = (content && content.meta && content.meta.resumeFile) || '';
    var commands = [
      { label: 'Home', hint: 'page', run: function () { location.href = '/'; } },
      { label: 'Projects', hint: 'page', run: function () { location.href = '/projects.html'; } },
      { label: 'Photography', hint: 'page', run: function () { location.href = '/photography.html'; } },
      { label: 'Resume', hint: 'pdf', run: function () { if (resume) window.open('/' + resume, '_blank'); } },
      { label: 'Toggle theme', hint: 'ui', run: function () { toggleTheme(); } },
      { label: 'GitHub', hint: 'link', run: function () { if (socials.github) window.open(socials.github, '_blank'); } },
      { label: 'LinkedIn', hint: 'link', run: function () { if (socials.linkedin) window.open(socials.linkedin, '_blank'); } },
      { label: 'Copy email', hint: 'action', run: function () { if (socials.email) navigator.clipboard.writeText(socials.email); } }
    ];

    var sysLink = localStorage.getItem('sys.link');
    if (sysLink) {
      commands.push({ label: '~', hint: 'sys', run: function () { location.href = sysLink; } });
    }

    var filtered = commands.slice();

    function renderList() {
      list.innerHTML = '';
      if (!filtered.length) {
        list.innerHTML = '<li class="palette-empty">no matches</li>';
        return;
      }
      filtered.forEach(function (cmd, i) {
        var li = document.createElement('li');
        li.className = 'palette-item' + (i === selected ? ' selected' : '');
        li.innerHTML = '<span>' + cmd.label + '</span><span class="hint">' + cmd.hint + '</span>';
        li.addEventListener('click', function () { close(); cmd.run(); });
        li.addEventListener('mousemove', function () { selected = i; renderList(); });
        list.appendChild(li);
      });
    }

    function open() {
      overlay.classList.add('open');
      input.value = '';
      filtered = commands.slice();
      selected = 0;
      renderList();
      setTimeout(function () { input.focus(); }, 20);
    }

    function close() { overlay.classList.remove('open'); }

    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      filtered = commands.filter(function (c) { return c.label.toLowerCase().indexOf(q) !== -1; });
      selected = 0;
      renderList();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        overlay.classList.contains('open') ? close() : open();
        return;
      }
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') return close();
      if (e.key === 'ArrowDown') { e.preventDefault(); selected = Math.min(selected + 1, filtered.length - 1); renderList(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); selected = Math.max(selected - 1, 0); renderList(); }
      if (e.key === 'Enter') {
        var raw = input.value.trim();
        if (raw.indexOf('sys set ') === 0) {
          localStorage.setItem('sys.link', raw.slice(8).trim());
          close();
          return;
        }
        if (raw === 'sys clear') {
          localStorage.removeItem('sys.link');
          close();
          return;
        }
        if (filtered[selected]) { close(); filtered[selected].run(); }
      }
    });

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    var trigger = document.getElementById('paletteTrigger');
    if (trigger) trigger.addEventListener('click', open);
  }

  /* ---------- Renderers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderHome(c) {
    scrambleHero(c.hero.firstName, c.hero.lastName);
    initRoles(c.hero.roles);

    var avatar = document.getElementById('heroAvatar');
    if (avatar && c.hero.avatar) {
      avatar.src = c.hero.avatar;
      avatar.classList.add('show');
    }

    var tagline = document.getElementById('heroTagline');
    if (tagline) tagline.innerHTML = c.hero.tagline;

    var gh = document.getElementById('socialGithub');
    var li = document.getElementById('socialLinkedin');
    var em = document.getElementById('socialEmail');
    if (gh) gh.href = c.socials.github;
    if (li) li.href = c.socials.linkedin;
    if (em) em.href = 'mailto:' + c.socials.email;

    var eduList = document.getElementById('eduList');
    if (eduList) {
      eduList.innerHTML = c.education.map(function (e) {
        return '<div class="edu-item reveal">' +
          '<div><p class="edu-period">' + esc(e.period) + '</p></div>' +
          '<div><p class="edu-degree">' + esc(e.degree) + '</p>' +
          '<p class="edu-school">' + esc(e.school) + '</p>' +
          e.details.map(function (d, i) {
            return '<p class="edu-detail"' + (i > 0 ? ' style="margin-top:0.4rem;"' : '') + '>' + d + '</p>';
          }).join('') +
          '</div></div>';
      }).join('');
    }

    var expList = document.getElementById('expList');
    if (expList) {
      expList.innerHTML = c.experience.map(function (x) {
        return '<div class="exp-item reveal">' +
          '<div><p class="exp-period">' + esc(x.period) + '</p></div>' +
          '<div><p class="exp-role">' + esc(x.role) + '</p>' +
          '<p class="exp-company">' + esc(x.company) + '</p>' +
          '<div class="exp-desc"><ul>' +
          x.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') +
          '</ul></div></div></div>';
      }).join('');
    }

    var skillsGrid = document.getElementById('skillsGrid');
    if (skillsGrid) {
      skillsGrid.innerHTML = c.skills.map(function (s) {
        return '<div><p class="skills-category-label">' + esc(s.category) + '</p>' +
          '<div class="skills-tags">' +
          s.items.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
          '</div></div>';
      }).join('');
    }
  }

  function renderProjects(c) {
    var listEl = document.getElementById('projectsList');
    if (!listEl) return;
    listEl.innerHTML = c.projects.map(function (p, i) {
      var num = String(i + 1).padStart(2, '0');
      var name = p.link
        ? '<a class="project-name" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.name) + ' ↗</a>'
        : '<p class="project-name">' + esc(p.name) + '</p>';
      return '<div class="project-card stagger-child">' +
        '<div class="project-head"><span class="project-index">' + num + '</span>' + name + '</div>' +
        '<div class="project-desc"><ul>' +
        p.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') +
        '</ul></div>' +
        '<div class="project-tags">' +
        p.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
        '</div></div>';
    }).join('');
  }

  function renderPhotos(c) {
    var gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = c.photos.map(function (p, i) {
      return '<div class="gallery-item" data-index="' + i + '">' +
        '<img src="' + esc(p.src) + '" alt="' + esc(p.alt) + '" loading="lazy" /></div>';
    }).join('');
    initLightbox(c.photos);
  }

  /* ---------- Lightbox ---------- */
  function initLightbox(photos) {
    var box = document.getElementById('lightbox');
    if (!box) return;
    var img = box.querySelector('img');
    var caption = box.querySelector('.lightbox-caption');
    var current = 0;

    function show(i) {
      current = (i + photos.length) % photos.length;
      img.src = photos[current].src;
      img.alt = photos[current].alt;
      caption.textContent = photos[current].alt + ' · ' + (current + 1) + '/' + photos.length;
      // preload neighbours so swiping feels instant
      [current + 1, current - 1].forEach(function (n) {
        var pre = new Image();
        pre.src = photos[(n + photos.length) % photos.length].src;
      });
    }

    function open(i) { show(i); box.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { box.classList.remove('open'); document.body.style.overflow = ''; }

    document.querySelectorAll('.gallery-item').forEach(function (item) {
      item.addEventListener('click', function () { open(parseInt(item.getAttribute('data-index'), 10)); });
    });

    box.querySelector('.lightbox-prev').addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
    box.querySelector('.lightbox-next').addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });
    box.querySelector('.lightbox-close').addEventListener('click', function (e) { e.stopPropagation(); close(); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });

    // Touch: swipe left/right to navigate, swipe down to close
    var touchX = 0, touchY = 0;
    box.addEventListener('touchstart', function (e) {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        show(dx > 0 ? current - 1 : current + 1);
      } else if (dy > 60 && Math.abs(dy) > Math.abs(dx)) {
        close();
      }
    }, { passive: true });
  }

  /* ---------- Boot ---------- */
  initTheme();
  initGlow();
  initProgress();
  initMagnetic();
  initTime();

  // Platform-appropriate palette trigger label
  var paletteTrigger = document.getElementById('paletteTrigger');
  if (paletteTrigger) {
    paletteTrigger.textContent = isTouch
      ? '>_'
      : (/Mac/.test(navigator.platform || '') ? '⌘K' : 'ctrl K');
  }

  // ?t= busts the GitHub Pages CDN cache (max-age=600) so edits show up fast
  fetch('content.json?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (content) {
      var resumeLink = document.getElementById('resumeLink');
      if (resumeLink && content.meta.resumeFile) resumeLink.href = '/' + content.meta.resumeFile;

      if (page === 'home') renderHome(content);
      if (page === 'projects') renderProjects(content);
      if (page === 'photography') renderPhotos(content);

      initReveal();
      initPalette(content);
    })
    .catch(function (err) {
      console.error('content load failed', err);
      initReveal();
    });
})();

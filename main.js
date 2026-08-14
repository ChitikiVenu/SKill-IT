// SKILL IT EDUCATION — shared site behaviour

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundNetwork();
  initHeroVisual();

  // Mobile drawer
  const drawer = document.querySelector('.mobile-drawer');
  const openBtn = document.querySelector('.hamburger');
  const closeBtn = document.querySelector('.close-drawer');
  if (openBtn && drawer) {
    openBtn.addEventListener('click', () => drawer.classList.add('open'));
  }
  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
  }
  if (drawer) {
    drawer.querySelector('.backdrop')?.addEventListener('click', () => drawer.classList.remove('open'));
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.closest('.faq-list')?.querySelectorAll('.faq-item.open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  // Lead forms — placeholder submit handling (no backend wired yet)
  document.querySelectorAll('form.lead-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Request received';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        form.reset();
      }, 2600);
    });
  });
});

// ---------------------------------------------------------------
// Site-wide interactive dot-network background.
// Dots drift slowly and connect with faint lines when close together.
// Moving the cursor near a dot gently pushes it away — no click needed.
// ---------------------------------------------------------------
function initBackgroundNetwork() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-network';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let width, height, dpr;
  let dots = [];
  const mouse = { x: -9999, y: -9999, active: false };
  const REPEL_RADIUS = 130;
  const CONNECT_DISTANCE = 120;
  const FRICTION = 0.94;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedDots();
  }

  function seedDots() {
    const area = width * height;
    const count = Math.max(24, Math.min(70, Math.round(area / 22000)));
    dots = new Array(count).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      baseVx: (Math.random() - 0.5) * 0.18,
      baseVy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.3 + 1.1,
    }));
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.active = false; });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.active = false; });

  window.addEventListener('resize', resize);
  resize();

  const dotColor = '36,87,224';
  const lineColor = '36,87,224';

  function tick() {
    ctx.clearRect(0, 0, width, height);

    for (const d of dots) {
      // gentle repel from cursor, no click required
      if (mouse.active) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.001) {
          const force = (1 - dist / REPEL_RADIUS) * 1.6;
          d.vx += (dx / dist) * force;
          d.vy += (dy / dist) * force;
        }
      }
      // drift back toward base wander velocity
      d.vx += (d.baseVx - d.vx) * 0.01;
      d.vy += (d.baseVy - d.vy) * 0.01;
      d.vx *= FRICTION;
      d.vy *= FRICTION;
      d.x += d.vx;
      d.y += d.vy;

      if (d.x < -20) d.x = width + 20;
      if (d.x > width + 20) d.x = -20;
      if (d.y < -20) d.y = height + 20;
      if (d.y > height + 20) d.y = -20;
    }

    // connections
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DISTANCE) {
          const alpha = (1 - dist / CONNECT_DISTANCE) * 0.16;
          ctx.strokeStyle = `rgba(${lineColor},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // dots
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotColor},0.4)`;
      ctx.fill();
    }
  }

  let hidden = false;
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    if (!hidden) requestAnimationFrame(tick);
  });

  function loop() {
    if (hidden) return;
    tick();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------
// Full-bleed hero background visual — a fixed technical topology
// (distinct per course) that sits behind the hero copy and glows
// near the cursor. No click needed, just move your mouse over it.
// ---------------------------------------------------------------
function initHeroVisual() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const theme = document.body.getAttribute('data-course') || (document.body.getAttribute('data-hero') === 'home' ? 'home' : null);
  if (!theme) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-visual';
  hero.prepend(canvas);
  const fade = document.createElement('div');
  fade.className = 'hero-visual-fade';
  hero.insertBefore(fade, canvas.nextSibling);
  const ctx = canvas.getContext('2d');

  const THEMES = {
    home: {
      colors: ['36,87,224', '106,75,214', '14,143,166', '200,121,15'],
      nodes: [
        { x: 0.14, y: 0.22, r: 8, c: 0 }, { x: 0.24, y: 0.55, r: 6, c: 0 },
        { x: 0.34, y: 0.14, r: 7, c: 1 }, { x: 0.40, y: 0.48, r: 9, c: 1 },
        { x: 0.30, y: 0.72, r: 6, c: 1 },
        { x: 0.52, y: 0.28, r: 12, c: -1 },
        { x: 0.64, y: 0.10, r: 6, c: 2 }, { x: 0.70, y: 0.42, r: 8, c: 2 },
        { x: 0.60, y: 0.62, r: 6, c: 2 },
        { x: 0.82, y: 0.24, r: 7, c: 3 }, { x: 0.90, y: 0.52, r: 9, c: 3 },
        { x: 0.78, y: 0.68, r: 6, c: 3 },
      ],
      edges: [[0,1],[1,3],[2,3],[3,4],[3,5],[5,6],[5,7],[5,8],[7,9],[7,10],[8,10],[9,10],[10,11]],
    },
    cyber: {
      colors: ['36,87,224'],
      nodes: [
        { x: 0.5, y: 0.42, r: 15, c: 0 },
        { x: 0.18, y: 0.16, r: 7, c: 0 }, { x: 0.80, y: 0.14, r: 7, c: 0 },
        { x: 0.14, y: 0.62, r: 7, c: 0 }, { x: 0.84, y: 0.66, r: 7, c: 0 },
        { x: 0.32, y: 0.78, r: 6, c: 0 }, { x: 0.66, y: 0.82, r: 6, c: 0 },
      ],
      edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
    },
    soc: {
      colors: ['106,75,214'],
      nodes: [
        { x: 0.16, y: 0.22, r: 8, c: 0 }, { x: 0.16, y: 0.44, r: 8, c: 0 }, { x: 0.16, y: 0.66, r: 8, c: 0 },
        { x: 0.42, y: 0.18, r: 6, c: 0 }, { x: 0.50, y: 0.34, r: 6, c: 0 }, { x: 0.44, y: 0.52, r: 6, c: 0 }, { x: 0.52, y: 0.68, r: 6, c: 0 },
        { x: 0.74, y: 0.24, r: 9, c: 0 }, { x: 0.84, y: 0.44, r: 7, c: 0 }, { x: 0.74, y: 0.64, r: 9, c: 0 },
      ],
      edges: [[0,3],[1,4],[2,5],[3,4],[4,5],[5,6],[4,7],[7,8],[8,9],[6,9]],
    },
    ai: {
      colors: ['14,143,166'],
      nodes: [
        { x: 0.12, y: 0.20, r: 6 }, { x: 0.12, y: 0.45, r: 6 }, { x: 0.12, y: 0.70, r: 6 },
        { x: 0.38, y: 0.14, r: 7 }, { x: 0.38, y: 0.36, r: 7 }, { x: 0.38, y: 0.58, r: 7 }, { x: 0.38, y: 0.80, r: 7 },
        { x: 0.64, y: 0.24, r: 7 }, { x: 0.64, y: 0.50, r: 7 }, { x: 0.64, y: 0.74, r: 7 },
        { x: 0.88, y: 0.46, r: 13 },
      ],
      edges: [
        [0,3],[0,4],[1,3],[1,4],[1,5],[2,5],[2,6],
        [3,7],[4,7],[4,8],[5,8],[5,9],[6,9],
        [7,10],[8,10],[9,10],
      ],
    },
    data: {
      colors: ['200,121,15'],
      nodes: [
        { x: 0.16, y: 0.66, r: 7 }, { x: 0.28, y: 0.50, r: 7 }, { x: 0.40, y: 0.72, r: 7 },
        { x: 0.52, y: 0.32, r: 7 }, { x: 0.64, y: 0.56, r: 7 }, { x: 0.76, y: 0.20, r: 7 }, { x: 0.88, y: 0.44, r: 7 },
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]],
    },
  };

  const cfg = THEMES[theme];
  if (!cfg) return;

  let width, height, dpr;
  const mouse = { x: -9999, y: -9999 };
  let t = 0;

  function resize() {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = Math.max(rect.height, 420);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });
  resize();

  function colorFor(node) {
    if (node.c === -1) return '15,20,40';
    if (node.c === undefined) return cfg.colors[0];
    return cfg.colors[node.c] || cfg.colors[0];
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const pts = cfg.nodes.map((n) => {
      const bob = reduceMotion ? 0 : Math.sin(t * 0.0006 + n.x * 10) * 4;
      return { x: n.x * width, y: n.y * height + bob, r: n.r, color: colorFor(n) };
    });

    // edges
    ctx.lineWidth = 1.2;
    cfg.edges.forEach(([i, j]) => {
      const a = pts[i], b = pts[j];
      ctx.strokeStyle = `rgba(${a.color},0.16)`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    // nodes with cursor-proximity glow
    pts.forEach((p) => {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const near = Math.max(0, 1 - dist / 170);

      if (near > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 14 * near, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${0.14 * near})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + near * 0.35), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 1.6 + near * 1.2;
      ctx.strokeStyle = `rgba(${p.color},${0.55 + near * 0.35})`;
      ctx.stroke();
    });

    t += 16;
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  draw();
}

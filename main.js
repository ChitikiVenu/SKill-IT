// SKILL IT EDUCATION — shared site behaviour

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundNetwork();

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

window.ENGINE_JS={
"enter-24":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2600)),
    size: num('size', 1.8),
    speed: num('speed', 1.1),
    trail: num('trail', 0.1),
    hue: num('hue', 74),
    glow: num('glow', 12),
    seed: num('seed', 11),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"exit-11":function (R) {

  var el = R.querySelector('.fx-exit-11__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'projectile' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"exit-12":function (R) {

  var el = R.querySelector('.fx-exit-12__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"exit-20":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2600)),
    size: num('size', 1.8),
    speed: num('speed', 1.2),
    trail: num('trail', 0.08),
    hue: num('hue', 74),
    glow: num('glow', 12),
    seed: num('seed', 12),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"accent-22":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1400)),
    size: num('size', 2.2),
    speed: num('speed', 1.8),
    trail: num('trail', 0.04),
    hue: num('hue', 96),
    glow: num('glow', 16),
    seed: num('seed', 13),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-01":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 1.2),
    speed: num('speed', 0.5),
    trail: num('trail', 0.0),
    hue: num('hue', 210),
    glow: num('glow', 8),
    seed: num('seed', 21),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-02":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 900)),
    size: num('size', 1.0),
    speed: num('speed', 1.3),
    trail: num('trail', 0.02),
    hue: num('hue', 140),
    glow: num('glow', 4),
    seed: num('seed', 22),
    mode: 'rain'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-03":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 2.4),
    speed: num('speed', 0.6),
    trail: num('trail', 0.16),
    hue: num('hue', 168),
    glow: num('glow', 22),
    seed: num('seed', 23),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-04":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1200)),
    size: num('size', 1.6),
    speed: num('speed', 0.7),
    trail: num('trail', 0.06),
    hue: num('hue', 196),
    glow: num('glow', 12),
    seed: num('seed', 24),
    mode: 'orbit'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-05":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2200)),
    size: num('size', 2.0),
    speed: num('speed', 0.8),
    trail: num('trail', 0.2),
    hue: num('hue', 268),
    glow: num('glow', 18),
    seed: num('seed', 25),
    mode: 'swirl'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-06":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 2.2),
    speed: num('speed', 1.2),
    trail: num('trail', 0.14),
    hue: num('hue', 24),
    glow: num('glow', 20),
    seed: num('seed', 26),
    mode: 'rise'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-07":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1400)),
    size: num('size', 3.4),
    speed: num('speed', 0.4),
    trail: num('trail', 0.24),
    hue: num('hue', 220),
    glow: num('glow', 26),
    seed: num('seed', 27),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-08":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 2.8),
    speed: num('speed', 0.5),
    trail: num('trail', 0.22),
    hue: num('hue', 188),
    glow: num('glow', 24),
    seed: num('seed', 28),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-09":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 3200)),
    size: num('size', 1.1),
    speed: num('speed', 0.9),
    trail: num('trail', 0.18),
    hue: num('hue', 150),
    glow: num('glow', 6),
    seed: num('seed', 29),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-10":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2600)),
    size: num('size', 1.6),
    speed: num('speed', 1.4),
    trail: num('trail', 0.12),
    hue: num('hue', 300),
    glow: num('glow', 14),
    seed: num('seed', 30),
    mode: 'swirl'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-11":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 1.4),
    speed: num('speed', 0.7),
    trail: num('trail', 0.1),
    hue: num('hue', 206),
    glow: num('glow', 10),
    seed: num('seed', 31),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-12":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 700)),
    size: num('size', 3.6),
    speed: num('speed', 0.35),
    trail: num('trail', 0.06),
    hue: num('hue', 52),
    glow: num('glow', 28),
    seed: num('seed', 32),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-13":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 2.6),
    speed: num('speed', 0.4),
    trail: num('trail', 0.18),
    hue: num('hue', 258),
    glow: num('glow', 20),
    seed: num('seed', 33),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-14":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1300)),
    size: num('size', 1.8),
    speed: num('speed', 0.8),
    trail: num('trail', 0.12),
    hue: num('hue', 44),
    glow: num('glow', 18),
    seed: num('seed', 34),
    mode: 'rise'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-15":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 1.6),
    speed: num('speed', 0.7),
    trail: num('trail', 0.04),
    hue: num('hue', 200),
    glow: num('glow', 8),
    seed: num('seed', 35),
    mode: 'fall'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-16":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 900)),
    size: num('size', 1.0),
    speed: num('speed', 0.9),
    trail: num('trail', 0.1),
    hue: num('hue', 62),
    glow: num('glow', 18),
    seed: num('seed', 36),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-17":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1500)),
    size: num('size', 1.2),
    speed: num('speed', 0.9),
    trail: num('trail', 0.08),
    hue: num('hue', 174),
    glow: num('glow', 10),
    seed: num('seed', 37),
    mode: 'orbit'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-18":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2400)),
    size: num('size', 0.9),
    speed: num('speed', 1.0),
    trail: num('trail', 0.02),
    hue: num('hue', 40),
    glow: num('glow', 4),
    seed: num('seed', 38),
    mode: 'fall'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-19":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 1.0),
    speed: num('speed', 1.9),
    trail: num('trail', 0.03),
    hue: num('hue', 192),
    glow: num('glow', 5),
    seed: num('seed', 39),
    mode: 'rain'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-20":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1400)),
    size: num('size', 1.8),
    speed: num('speed', 0.6),
    trail: num('trail', 0.1),
    hue: num('hue', 186),
    glow: num('glow', 14),
    seed: num('seed', 40),
    mode: 'orbit'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-21":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 1.6),
    speed: num('speed', 1.1),
    trail: num('trail', 0.14),
    hue: num('hue', 320),
    glow: num('glow', 12),
    seed: num('seed', 41),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-22":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1200)),
    size: num('size', 1.2),
    speed: num('speed', 0.8),
    trail: num('trail', 0.02),
    hue: num('hue', 120),
    glow: num('glow', 8),
    seed: num('seed', 42),
    mode: 'scan'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-23":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 3000)),
    size: num('size', 2.4),
    speed: num('speed', 0.3),
    trail: num('trail', 0.26),
    hue: num('hue', 282),
    glow: num('glow', 28),
    seed: num('seed', 43),
    mode: 'swirl'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-24":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1200)),
    size: num('size', 2.6),
    speed: num('speed', 0.6),
    trail: num('trail', 0.06),
    hue: num('hue', 176),
    glow: num('glow', 16),
    seed: num('seed', 44),
    mode: 'rise'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"ambient-25":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1700)),
    size: num('size', 2.0),
    speed: num('speed', 0.9),
    trail: num('trail', 0.2),
    hue: num('hue', 232),
    glow: num('glow', 20),
    seed: num('seed', 45),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"physics-01":function (R) {

  var el = R.querySelector('.fx-physics-01__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-02":function (R) {

  var el = R.querySelector('.fx-physics-02__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'inertia' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-03":function (R) {

  var el = R.querySelector('.fx-physics-03__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-04":function (R) {

  var el = R.querySelector('.fx-physics-04__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'drag' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-05":function (R) {

  var el = R.querySelector('.fx-physics-05__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'gravity' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-06":function (R) {

  var el = R.querySelector('.fx-physics-06__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'gravity' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-07":function (R) {

  var el = R.querySelector('.fx-physics-07__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'pendulum' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-08":function (R) {

  var el = R.querySelector('.fx-physics-08__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'wave' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-09":function (R) {

  var el = R.querySelector('.fx-physics-09__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'orbit' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-10":function (R) {

  var el = R.querySelector('.fx-physics-10__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'gravity' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-11":function (R) {

  var el = R.querySelector('.fx-physics-11__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'drag' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-12":function (R) {

  var el = R.querySelector('.fx-physics-12__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-13":function (R) {

  var el = R.querySelector('.fx-physics-13__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'wave' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-14":function (R) {

  var el = R.querySelector('.fx-physics-14__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'inertia' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-15":function (R) {

  var el = R.querySelector('.fx-physics-15__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'drag' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-16":function (R) {

  var el = R.querySelector('.fx-physics-16__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-17":function (R) {

  var el = R.querySelector('.fx-physics-17__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'drag' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-18":function (R) {

  var el = R.querySelector('.fx-physics-18__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-19":function (R) {

  var el = R.querySelector('.fx-physics-19__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'orbit' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-20":function (R) {

  var el = R.querySelector('.fx-physics-20__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'orbit' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"swarm-01":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2200)),
    size: num('size', 1.4),
    speed: num('speed', 1.3),
    trail: num('trail', 0.06),
    hue: num('hue', 74),
    glow: num('glow', 10),
    seed: num('seed', 51),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-02":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2200)),
    size: num('size', 1.4),
    speed: num('speed', 1.0),
    trail: num('trail', 0.08),
    hue: num('hue', 74),
    glow: num('glow', 10),
    seed: num('seed', 52),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-03":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 1.6),
    speed: num('speed', 0.9),
    trail: num('trail', 0.1),
    hue: num('hue', 96),
    glow: num('glow', 10),
    seed: num('seed', 53),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-04":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 1.6),
    speed: num('speed', 1.1),
    trail: num('trail', 0.08),
    hue: num('hue', 120),
    glow: num('glow', 10),
    seed: num('seed', 54),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-05":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1400)),
    size: num('size', 1.5),
    speed: num('speed', 0.7),
    trail: num('trail', 0.06),
    hue: num('hue', 148),
    glow: num('glow', 8),
    seed: num('seed', 55),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-06":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 1.7),
    speed: num('speed', 0.8),
    trail: num('trail', 0.1),
    hue: num('hue', 176),
    glow: num('glow', 10),
    seed: num('seed', 56),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-07":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 1.3),
    speed: num('speed', 1.4),
    trail: num('trail', 0.14),
    hue: num('hue', 200),
    glow: num('glow', 8),
    seed: num('seed', 57),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-08":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2400)),
    size: num('size', 1.5),
    speed: num('speed', 1.6),
    trail: num('trail', 0.04),
    hue: num('hue', 40),
    glow: num('glow', 10),
    seed: num('seed', 58),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-09":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2200)),
    size: num('size', 1.6),
    speed: num('speed', 1.5),
    trail: num('trail', 0.12),
    hue: num('hue', 300),
    glow: num('glow', 12),
    seed: num('seed', 59),
    mode: 'swirl'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-10":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1500)),
    size: num('size', 1.6),
    speed: num('speed', 1.2),
    trail: num('trail', 0.12),
    hue: num('hue', 56),
    glow: num('glow', 10),
    seed: num('seed', 60),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-11":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2400)),
    size: num('size', 1.4),
    speed: num('speed', 1.7),
    trail: num('trail', 0.1),
    hue: num('hue', 190),
    glow: num('glow', 8),
    seed: num('seed', 61),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-12":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 1.6),
    speed: num('speed', 0.7),
    trail: num('trail', 0.1),
    hue: num('hue', 84),
    glow: num('glow', 10),
    seed: num('seed', 62),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-13":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2600)),
    size: num('size', 1.2),
    speed: num('speed', 0.9),
    trail: num('trail', 0.08),
    hue: num('hue', 214),
    glow: num('glow', 8),
    seed: num('seed', 63),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-14":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 1.5),
    speed: num('speed', 1.0),
    trail: num('trail', 0.1),
    hue: num('hue', 132),
    glow: num('glow', 10),
    seed: num('seed', 64),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-15":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 1.4),
    speed: num('speed', 1.0),
    trail: num('trail', 0.1),
    hue: num('hue', 168),
    glow: num('glow', 10),
    seed: num('seed', 65),
    mode: 'orbit'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-16":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1900)),
    size: num('size', 1.4),
    speed: num('speed', 1.2),
    trail: num('trail', 0.12),
    hue: num('hue', 108),
    glow: num('glow', 10),
    seed: num('seed', 66),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-17":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 1.6),
    speed: num('speed', 0.9),
    trail: num('trail', 0.12),
    hue: num('hue', 76),
    glow: num('glow', 12),
    seed: num('seed', 67),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-18":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2800)),
    size: num('size', 1.8),
    speed: num('speed', 2.0),
    trail: num('trail', 0.04),
    hue: num('hue', 16),
    glow: num('glow', 14),
    seed: num('seed', 68),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-19":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2400)),
    size: num('size', 1.3),
    speed: num('speed', 1.6),
    trail: num('trail', 0.14),
    hue: num('hue', 288),
    glow: num('glow', 10),
    seed: num('seed', 69),
    mode: 'swirl'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-20":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 1.8),
    speed: num('speed', 1.2),
    trail: num('trail', 0.46),
    hue: num('hue', 100),
    glow: num('glow', 12),
    seed: num('seed', 70),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-21":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1700)),
    size: num('size', 1.4),
    speed: num('speed', 0.8),
    trail: num('trail', 0.06),
    hue: num('hue', 156),
    glow: num('glow', 8),
    seed: num('seed', 71),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-22":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2100)),
    size: num('size', 1.6),
    speed: num('speed', 1.0),
    trail: num('trail', 0.12),
    hue: num('hue', 204),
    glow: num('glow', 10),
    seed: num('seed', 72),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-23":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 1.5),
    speed: num('speed', 0.9),
    trail: num('trail', 0.08),
    hue: num('hue', 240),
    glow: num('glow', 10),
    seed: num('seed', 73),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-24":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1900)),
    size: num('size', 1.7),
    speed: num('speed', 1.1),
    trail: num('trail', 0.1),
    hue: num('hue', 88),
    glow: num('glow', 12),
    seed: num('seed', 74),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"swarm-25":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1700)),
    size: num('size', 1.9),
    speed: num('speed', 0.6),
    trail: num('trail', 0.14),
    hue: num('hue', 70),
    glow: num('glow', 16),
    seed: num('seed', 75),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-21":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2200)),
    size: num('size', 1.0),
    speed: num('speed', 0.4),
    trail: num('trail', 0.02),
    hue: num('hue', 210),
    glow: num('glow', 8),
    seed: num('seed', 101),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-22":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1400)),
    size: num('size', 2.0),
    speed: num('speed', 2.0),
    trail: num('trail', 0.02),
    hue: num('hue', 32),
    glow: num('glow', 18),
    seed: num('seed', 102),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-23":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 3.0),
    speed: num('speed', 0.5),
    trail: num('trail', 0.22),
    hue: num('hue', 220),
    glow: num('glow', 24),
    seed: num('seed', 103),
    mode: 'rise'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-24":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2400)),
    size: num('size', 1.6),
    speed: num('speed', 1.1),
    trail: num('trail', 0.1),
    hue: num('hue', 168),
    glow: num('glow', 14),
    seed: num('seed', 104),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-25":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1500)),
    size: num('size', 2.2),
    speed: num('speed', 0.7),
    trail: num('trail', 0.03),
    hue: num('hue', 46),
    glow: num('glow', 8),
    seed: num('seed', 105),
    mode: 'fall'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-26":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 900)),
    size: num('size', 2.6),
    speed: num('speed', 1.6),
    trail: num('trail', 0.04),
    hue: num('hue', 190),
    glow: num('glow', 16),
    seed: num('seed', 106),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-27":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2400)),
    size: num('size', 0.9),
    speed: num('speed', 1.3),
    trail: num('trail', 0.06),
    hue: num('hue', 40),
    glow: num('glow', 4),
    seed: num('seed', 107),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-28":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1500)),
    size: num('size', 1.2),
    speed: num('speed', 0.8),
    trail: num('trail', 0.1),
    hue: num('hue', 62),
    glow: num('glow', 18),
    seed: num('seed', 108),
    mode: 'boids'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-29":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2600)),
    size: num('size', 1.4),
    speed: num('speed', 1.6),
    trail: num('trail', 0.02),
    hue: num('hue', 200),
    glow: num('glow', 6),
    seed: num('seed', 109),
    mode: 'fall'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-30":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2200)),
    size: num('size', 1.0),
    speed: num('speed', 2.0),
    trail: num('trail', 0.02),
    hue: num('hue', 192),
    glow: num('glow', 5),
    seed: num('seed', 110),
    mode: 'rain'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-31":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 3000)),
    size: num('size', 1.1),
    speed: num('speed', 0.9),
    trail: num('trail', 0.12),
    hue: num('hue', 96),
    glow: num('glow', 12),
    seed: num('seed', 111),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-32":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 1.0),
    speed: num('speed', 0.9),
    trail: num('trail', 0.06),
    hue: num('hue', 140),
    glow: num('glow', 10),
    seed: num('seed', 112),
    mode: 'orbit'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-33":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2600)),
    size: num('size', 1.6),
    speed: num('speed', 1.8),
    trail: num('trail', 0.04),
    hue: num('hue', 24),
    glow: num('glow', 12),
    seed: num('seed', 113),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-34":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2800)),
    size: num('size', 1.4),
    speed: num('speed', 1.5),
    trail: num('trail', 0.12),
    hue: num('hue', 300),
    glow: num('glow', 12),
    seed: num('seed', 114),
    mode: 'swirl'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-35":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 1.8),
    speed: num('speed', 0.6),
    trail: num('trail', 0.16),
    hue: num('hue', 196),
    glow: num('glow', 14),
    seed: num('seed', 115),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-36":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 1.6),
    speed: num('speed', 1.2),
    trail: num('trail', 0.08),
    hue: num('hue', 74),
    glow: num('glow', 14),
    seed: num('seed', 116),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-37":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1200)),
    size: num('size', 1.5),
    speed: num('speed', 1.4),
    trail: num('trail', 0.55),
    hue: num('hue', 100),
    glow: num('glow', 12),
    seed: num('seed', 117),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-38":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 0.8),
    speed: num('speed', 0.3),
    trail: num('trail', 0.02),
    hue: num('hue', 44),
    glow: num('glow', 6),
    seed: num('seed', 118),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-39":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 1.8),
    speed: num('speed', 1.3),
    trail: num('trail', 0.1),
    hue: num('hue', 84),
    glow: num('glow', 20),
    seed: num('seed', 119),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-40":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2200)),
    size: num('size', 2.0),
    speed: num('speed', 2.2),
    trail: num('trail', 0.04),
    hue: num('hue', 60),
    glow: num('glow', 20),
    seed: num('seed', 120),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-41":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 2.0),
    speed: num('speed', 1.7),
    trail: num('trail', 0.04),
    hue: num('hue', 26),
    glow: num('glow', 10),
    seed: num('seed', 121),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-42":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2400)),
    size: num('size', 2.6),
    speed: num('speed', 0.3),
    trail: num('trail', 0.22),
    hue: num('hue', 282),
    glow: num('glow', 26),
    seed: num('seed', 122),
    mode: 'swirl'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-43":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 900)),
    size: num('size', 2.0),
    speed: num('speed', 2.4),
    trail: num('trail', 0.3),
    hue: num('hue', 48),
    glow: num('glow', 18),
    seed: num('seed', 123),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-44":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 2.4),
    speed: num('speed', 0.5),
    trail: num('trail', 0.16),
    hue: num('hue', 168),
    glow: num('glow', 20),
    seed: num('seed', 124),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-45":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1500)),
    size: num('size', 2.2),
    speed: num('speed', 1.9),
    trail: num('trail', 0.05),
    hue: num('hue', 196),
    glow: num('glow', 14),
    seed: num('seed', 125),
    mode: 'explode'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-46":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1600)),
    size: num('size', 2.4),
    speed: num('speed', 0.9),
    trail: num('trail', 0.18),
    hue: num('hue', 220),
    glow: num('glow', 20),
    seed: num('seed', 126),
    mode: 'converge'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-47":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2600)),
    size: num('size', 2.4),
    speed: num('speed', 0.4),
    trail: num('trail', 0.14),
    hue: num('hue', 18),
    glow: num('glow', 18),
    seed: num('seed', 127),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-48":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1200)),
    size: num('size', 1.0),
    speed: num('speed', 1.2),
    trail: num('trail', 0.04),
    hue: num('hue', 140),
    glow: num('glow', 8),
    seed: num('seed', 128),
    mode: 'wave'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-49":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1400)),
    size: num('size', 1.0),
    speed: num('speed', 0.5),
    trail: num('trail', 0.02),
    hue: num('hue', 56),
    glow: num('glow', 10),
    seed: num('seed', 129),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-50":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2000)),
    size: num('size', 2.6),
    speed: num('speed', 0.5),
    trail: num('trail', 0.2),
    hue: num('hue', 240),
    glow: num('glow', 20),
    seed: num('seed', 130),
    mode: 'swirl'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-51":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1200)),
    size: num('size', 1.0),
    speed: num('speed', 0.6),
    trail: num('trail', 0.04),
    hue: num('hue', 52),
    glow: num('glow', 12),
    seed: num('seed', 131),
    mode: 'rise'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-52":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1800)),
    size: num('size', 1.0),
    speed: num('speed', 1.6),
    trail: num('trail', 0.1),
    hue: num('hue', 160),
    glow: num('glow', 8),
    seed: num('seed', 132),
    mode: 'drift'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-53":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1500)),
    size: num('size', 1.4),
    speed: num('speed', 0.9),
    trail: num('trail', 0.08),
    hue: num('hue', 180),
    glow: num('glow', 12),
    seed: num('seed', 133),
    mode: 'orbit'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-54":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 2400)),
    size: num('size', 1.2),
    speed: num('speed', 1.8),
    trail: num('trail', 0.02),
    hue: num('hue', 206),
    glow: num('glow', 6),
    seed: num('seed', 134),
    mode: 'rain'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"particle-55":function (R) {

  var cv = R.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var cs = getComputedStyle(R);
  function num(n, d) { var v = parseFloat(cs.getPropertyValue('--' + n)); return isNaN(v) ? d : v; }
  var P = {
    count: Math.round(num('count', 1000)),
    size: num('size', 2.0),
    speed: num('speed', 1.5),
    trail: num('trail', 0.02),
    hue: num('hue', 40),
    glow: num('glow', 14),
    seed: num('seed', 135),
    mode: 'rise'
  };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    W = R.clientWidth; H = R.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  var s = P.seed || 1;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

  var ps = [];
  var N = Math.max(60, Math.min(P.count, 4000));
  for (var i = 0; i < N; i++) {
    ps.push({
      x: rnd() * W, y: rnd() * H,
      vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2,
      r: 0.4 + rnd() * P.size,
      a: 0.25 + rnd() * 0.75,
      ph: rnd() * Math.PI * 2,
      sp: 0.4 + rnd() * 0.9
    });
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  var t = 0;
  function step(dt) {
    t += dt;
    var m = P.mode, sp = P.speed, i, p;
    for (i = 0; i < N; i++) {
      p = ps[i];
      if (m === 'drift') {
        p.x += p.vx * sp * 26 * dt; p.y += p.vy * sp * 26 * dt;
      } else if (m === 'rise') {
        p.y -= p.sp * sp * 46 * dt;
        p.x += Math.sin(t + p.ph) * 10 * dt * sp;
      } else if (m === 'fall') {
        p.y += p.sp * sp * 52 * dt;
        p.x += Math.cos(t * 0.8 + p.ph) * 14 * dt * sp;
      } else if (m === 'rain') {
        p.y += p.sp * sp * 190 * dt;
        p.x += 6 * dt * sp;
      } else if (m === 'swirl') {
        var dx = p.x - W / 2, dy = p.y - H / 2;
        var ang = 0.9 * sp * dt * (0.6 + p.sp * 0.6);
        p.x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang);
        p.y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang);
        p.x += dx * 0.06 * dt; p.y += dy * 0.06 * dt;
      } else if (m === 'wave') {
        p.x += p.vx * sp * 18 * dt;
        p.y = p.y + Math.sin(t * 1.4 + p.ph + p.x * 0.02) * 22 * dt * sp;
      } else if (m === 'converge') {
        p.x += (W / 2 - p.x) * (1.2 + p.sp) * dt * sp;
        p.y += (H / 2 - p.y) * (1.2 + p.sp) * dt * sp;
      } else if (m === 'explode') {
        var ex = p.x - W / 2, ey = p.y - H / 2;
        var len = Math.max(1, Math.sqrt(ex * ex + ey * ey));
        p.x += (ex / len) * (60 + p.sp * 80) * dt * sp;
        p.y += (ey / len) * (60 + p.sp * 80) * dt * sp;
      } else if (m === 'orbit') {
        var ox = p.x - W / 2, oy = p.y - H / 2;
        var oa = 0.7 * sp * dt * (0.5 + p.sp);
        p.x = W / 2 + ox * Math.cos(oa) - oy * Math.sin(oa) * 0.62;
        p.y = H / 2 + ox * Math.sin(oa) * 0.62 + oy * Math.cos(oa);
      } else if (m === 'boids') {
        var cx = 0, cy = 0, ax = 0, ay = 0, k = 0;
        for (var j = 0; j < N; j += 7) {
          var q = ps[j];
          var dx2 = q.x - p.x, dy2 = q.y - p.y;
          if (dx2 * dx2 + dy2 * dy2 < 2200) {
            cx += q.x; cy += q.y; ax += q.vx; ay += q.vy;
            p.x -= dx2 * 0.05 * dt; p.y -= dy2 * 0.05 * dt;
            k++;
          }
        }
        if (k) {
          cx /= k; cy /= k;
          p.vx += (cx - p.x) * 0.05 * dt * sp + (ax / k) * 0.1 * dt;
          p.vy += (cy - p.y) * 0.05 * dt * sp + (ay / k) * 0.1 * dt;
        }
        p.vx += Math.sin(t * 0.7 + p.ph) * 0.5 * dt;
        p.vy += Math.cos(t * 0.6 + p.ph) * 0.5 * dt;
        p.x += p.vx * sp * 22 * dt; p.y += p.vy * sp * 22 * dt;
        p.vx = Math.max(-2, Math.min(2, p.vx));
        p.vy = Math.max(-2, Math.min(2, p.vy));
      } else if (m === 'scan') {
        p.x = (p.ph / (Math.PI * 2)) * W;
        p.y += 0;
      }
      if (m !== 'converge' && m !== 'explode') {
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      } else {
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rnd() * W; p.y = rnd() * H;
        }
      }
    }
  }

  function draw() {
    var m = P.mode;
    if (P.trail > 0.01) {
      ctx.fillStyle = 'rgba(15,18,22,' + Math.min(0.9, 0.1 + P.trail * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      var hue = (P.hue + (i % 24) * 1.5) % 360;
      ctx.fillStyle = 'hsla(' + hue + ',72%,62%,' + p.a + ')';
      if (P.glow > 0.5) {
        ctx.shadowBlur = P.glow;
        ctx.shadowColor = 'hsla(' + hue + ',80%,60%,.7)';
      }
      if (m === 'rain') {
        ctx.fillRect(p.x, p.y, 1, 6 + p.sp * 10);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (var i = 0; i < N; i++) {
      var p = ps[i];
      ctx.fillStyle = 'hsla(' + ((P.hue + (i % 24) * 1.5) % 360) + ',70%,60%,' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function visible() {
    var r = R.getBoundingClientRect();
    return r.bottom > -160 && r.top < (window.innerHeight || 0) + 160;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { staticFrame(); return; }
    if (!visible()) { last = now; return; }
    if (!last) { last = now; draw(); return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt); draw();
  }
  // 首帧同步画出：后台标签页或隐藏容器里 RAF 会被节流，不能只依赖它
  if (reduced()) { staticFrame(); } else { step(0.016); draw(); }
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { resize(); });
},
"physics-21":function (R) {

  var el = R.querySelector('.fx-physics-21__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-22":function (R) {

  var el = R.querySelector('.fx-physics-22__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-23":function (R) {

  var el = R.querySelector('.fx-physics-23__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'inertia' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-24":function (R) {

  var el = R.querySelector('.fx-physics-24__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'projectile' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-25":function (R) {

  var el = R.querySelector('.fx-physics-25__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'gravity' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-26":function (R) {

  var el = R.querySelector('.fx-physics-26__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'pendulum' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-27":function (R) {

  var el = R.querySelector('.fx-physics-27__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'orbit' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-28":function (R) {

  var el = R.querySelector('.fx-physics-28__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'drag' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-29":function (R) {

  var el = R.querySelector('.fx-physics-29__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'gravity' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-30":function (R) {

  var el = R.querySelector('.fx-physics-30__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'gravity' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-31":function (R) {

  var el = R.querySelector('.fx-physics-31__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'pendulum' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-32":function (R) {

  var el = R.querySelector('.fx-physics-32__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'drag' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
},
"physics-33":function (R) {

  var el = R.querySelector('.fx-physics-33__el');
  var cfg = { stiffness: 180, damping: 22, mass: 1, gravity: 0, duration: 900, kind: 'spring' };
  var cs = getComputedStyle(R);
  function num(name, dft) {
    var v = parseFloat(cs.getPropertyValue('--' + name));
    return isNaN(v) ? dft : v;
  }
  cfg.stiffness = num('stiffness', 180);
  cfg.damping = num('damping', 22);
  cfg.mass = num('mass', 1);
  cfg.gravity = num('gravity', 0);
  var W = R.clientWidth || 340, H = R.clientHeight || 240;
  var x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0, t = 0, phase = 0;
  var last = 0, raf = 0, wait = 0;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !document.documentElement.hasAttribute('data-force-motion');
  }

  function reset() {
    x = 0; y = 0; vx = 0; vy = 0; ang = 0; va = 0; t = 0; wait = 0;
    phase = (phase + 1) % 4;
    var k = cfg.kind;
    if (k === 'spring' || k === 'inertia') {
      x = (phase % 2 ? 1 : -1) * W * 0.28;
      if (k === 'inertia') vx = (phase % 2 ? -1 : 1) * 520;
    } else if (k === 'gravity') {
      y = -H * 0.34; vy = 0;
    } else if (k === 'pendulum') {
      ang = (phase % 2 ? 1 : -1) * 0.9;
    } else if (k === 'wave') {
      y = 0;
    } else if (k === 'drag' || k === 'orbit') {
      x = -W * 0.24; y = H * 0.18;
    } else if (k === 'projectile') {
      x = -W * 0.2; y = H * 0.2; vx = 260; vy = -420;
    }
  }

  function step(dt) {
    var k = cfg.kind;
    if (k === 'spring') {
      var ax = (-cfg.stiffness * x - cfg.damping * vx) / cfg.mass;
      vx += ax * dt; x += vx * dt;
      if (Math.abs(x) < 0.4 && Math.abs(vx) < 4) { wait += dt; }
    } else if (k === 'inertia') {
      x += vx * dt; vx *= Math.pow(0.02, dt);
      if (Math.abs(vx) < 3) wait += dt;
    } else if (k === 'gravity') {
      vy += (cfg.gravity + 1800) * dt;
      y += vy * dt;
      if (y > H * 0.3) { y = H * 0.3; vy = -vy * 0.58; if (Math.abs(vy) < 40) wait += dt; }
      if (y < -H * 0.42) { y = -H * 0.42; vy = Math.abs(vy) * 0.5; }
    } else if (k === 'pendulum') {
      var aa = -(cfg.gravity + 9) * Math.sin(ang) - cfg.damping * 0.02 * va;
      va += aa * dt; ang += va * dt;
      if (Math.abs(ang) < 0.01 && Math.abs(va) < 0.02) wait += dt;
    } else if (k === 'wave') {
      t += dt;
      y = Math.sin(t * 7) * 26 * Math.exp(-t * 1.1);
      ang = Math.sin(t * 6.4) * 0.08 * Math.exp(-t * 1.1);
      if (t > 2.2) wait += dt;
    } else if (k === 'drag') {
      t += dt;
      x = Math.sin(t * 1.4) * W * 0.26;
      y = Math.cos(t * 1.1) * H * 0.18;
      if (t > 2.6) wait += dt;
    } else if (k === 'orbit') {
      t += dt;
      var r = 64;
      x = Math.cos(t * 1.6) * r;
      y = Math.sin(t * 1.6) * r * 0.62;
      if (t > 3) wait += dt;
    } else if (k === 'projectile') {
      vy += 1200 * dt; x += vx * dt; y += vy * dt;
      if (x > W * 0.7) wait += dt;
    }
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' +
      (ang * 57.2958).toFixed(2) + 'deg)';
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!R.isConnected) { cancelAnimationFrame(raf); return; }
    if (reduced()) { el.style.transform = 'none'; return; }
    var rb = R.getBoundingClientRect();
    if (rb.bottom < -160 || rb.top > (window.innerHeight || 0) + 160) { last = now; return; }
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (wait > 0.45) { reset(); }
    else step(dt);
  }

  reset();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { W = R.clientWidth; H = R.clientHeight; });
}
};

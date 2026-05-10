import { useEffect, useRef, useState } from 'react';
import './index.css';

const MAP = [
  '111111111111111',
  '100000000000001',
  '101111010111101',
  '100001010100001',
  '101101000101101',
  '100100111100001',
  '100000000001001',
  '101111011101001',
  '100000010000001',
  '101101110111101',
  '100100000000001',
  '101111011111101',
  '100000000000001',
  '111111111111111',
];

const coinsStart = [
  { x: 2.5, y: 2.5 }, { x: 7.5, y: 1.5 }, { x: 12.5, y: 3.5 },
  { x: 4.5, y: 8.5 }, { x: 10.5, y: 8.5 }, { x: 2.5, y: 12.5 },
  { x: 13.2, y: 12.2 }, { x: 7.4, y: 10.4 }
];

const enemiesStart = [
  { x: 12.2, y: 2.2, hp: 2, alive: true },
  { x: 3.3, y: 10.4, hp: 2, alive: true },
  { x: 11.4, y: 11.4, hp: 3, alive: true },
];

function wallAt(x, y) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  return MAP[my]?.[mx] === '1';
}

export default function App() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    x: 1.7, y: 1.7, a: 0,
    hp: 100, ammo: 40, score: 0, quality: 'auto', running: false, won: false,
    keys: {}, moveStick: { x: 0, y: 0 }, turnStick: { x: 0, y: 0 },
    coins: coinsStart.map(c => ({ ...c, taken: false })),
    enemies: enemiesStart.map(e => ({ ...e })),
    lastShot: 0, message: 'Нажми PLAY и собери все кристаллы'
  });
  const [ui, setUi] = useState({ hp: 100, ammo: 40, score: 0, message: 'Нажми PLAY и собери все кристаллы' });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    let raf = 0;
    let last = performance.now();

    const keyDown = e => { stateRef.current.keys[e.key.toLowerCase()] = true; if (e.code === 'Space') shoot(); };
    const keyUp = e => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    const onMove = e => {
      if (document.pointerLockElement === canvas) stateRef.current.a += e.movementX * 0.0025;
    };
    document.addEventListener('mousemove', onMove);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const low = window.innerWidth < 850;
      const scale = low ? 0.72 : 1;
      canvas.width = Math.max(360, Math.floor(innerWidth * dpr * scale));
      canvas.height = Math.max(360, Math.floor(innerHeight * dpr * scale));
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    }
    window.addEventListener('resize', resize);
    resize();

    function movePlayer(dt) {
      const s = stateRef.current;
      if (!s.running || s.hp <= 0) return;
      const k = s.keys;
      let f = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0) + -s.moveStick.y;
      let r = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0) + s.moveStick.x;
      s.a += (s.turnStick.x + (k.q ? -1 : 0) + (k.e ? 1 : 0)) * dt * 2.4;
      const len = Math.hypot(f, r) || 1;
      f /= len; r /= len;
      const speed = 3.1;
      const nx = s.x + (Math.cos(s.a) * f + Math.cos(s.a + Math.PI / 2) * r) * speed * dt;
      const ny = s.y + (Math.sin(s.a) * f + Math.sin(s.a + Math.PI / 2) * r) * speed * dt;
      if (!wallAt(nx, s.y)) s.x = nx;
      if (!wallAt(s.x, ny)) s.y = ny;

      for (const c of s.coins) {
        if (!c.taken && Math.hypot(c.x - s.x, c.y - s.y) < 0.55) {
          c.taken = true; s.score += 100; s.message = '+100 кристалл!';
        }
      }
      if (s.coins.every(c => c.taken) && !s.won) {
        s.won = true; s.message = 'Победа! Все кристаллы собраны.';
      }
    }

    function updateEnemies(dt, now) {
      const s = stateRef.current;
      if (!s.running || s.hp <= 0) return;
      for (const e of s.enemies) {
        if (!e.alive) continue;
        const dx = s.x - e.x, dy = s.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 7 && dist > 0.01) {
          const nx = e.x + (dx / dist) * dt * 0.8;
          const ny = e.y + (dy / dist) * dt * 0.8;
          if (!wallAt(nx, e.y)) e.x = nx;
          if (!wallAt(e.x, ny)) e.y = ny;
        }
        if (dist < 0.75 && now - (e.hitAt || 0) > 700) {
          e.hitAt = now; s.hp = Math.max(0, s.hp - 9); s.message = s.hp ? 'Враг ударил! Стреляй!' : 'Ты проиграл. Нажми RESTART.';
        }
      }
    }

    function shoot() {
      const s = stateRef.current;
      const now = performance.now();
      if (!s.running || s.ammo <= 0 || now - s.lastShot < 180) return;
      s.lastShot = now; s.ammo -= 1; s.message = 'Бах!';
      let best = null;
      for (const e of s.enemies) {
        if (!e.alive) continue;
        const dx = e.x - s.x, dy = e.y - s.y;
        const dist = Math.hypot(dx, dy);
        let ang = Math.atan2(dy, dx) - s.a;
        ang = Math.atan2(Math.sin(ang), Math.cos(ang));
        if (Math.abs(ang) < 0.13 && dist < 8 && (!best || dist < best.dist)) best = { e, dist };
      }
      if (best) {
        best.e.hp -= 1;
        if (best.e.hp <= 0) { best.e.alive = false; s.score += 250; s.message = '+250 враг убит!'; }
        else s.message = 'Попал!';
      }
    }
    window.gameShoot = shoot;

    function renderSprite(obj, color, size, bob, zBuffer) {
      const s = stateRef.current;
      const w = canvas.width, h = canvas.height;
      const dx = obj.x - s.x, dy = obj.y - s.y;
      const dist = Math.hypot(dx, dy);
      let angle = Math.atan2(dy, dx) - s.a;
      angle = Math.atan2(Math.sin(angle), Math.cos(angle));
      const fov = Math.PI / 3;
      if (Math.abs(angle) > fov / 1.1 || dist < 0.2) return;
      const x = w / 2 + (angle / (fov / 2)) * w / 2;
      const sz = Math.min(h, (h / dist) * size);
      const top = h / 2 - sz / 2 + Math.sin(performance.now() / 220 + bob) * 8;
      const col = Math.floor(x);
      if (zBuffer[col] && zBuffer[col] < dist) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - sz / 2, top, sz, sz, Math.max(4, sz * 0.18));
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.fillRect(x - sz * .18, top + sz * .18, sz * .36, sz * .12);
    }

    function draw() {
      const s = stateRef.current;
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#6ec8ff'; ctx.fillRect(0, 0, w, h / 2);
      ctx.fillStyle = '#222b38'; ctx.fillRect(0, h / 2, w, h / 2);
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      for (let y = h / 2; y < h; y += 34) ctx.fillRect(0, y, w, 1);

      const rays = Math.floor(w / 3);
      const fov = Math.PI / 3;
      const zBuffer = new Array(w).fill(99);
      for (let i = 0; i < rays; i++) {
        const rayA = s.a - fov / 2 + (i / rays) * fov;
        let dist = 0, hit = false;
        while (!hit && dist < 18) {
          dist += 0.045;
          const x = s.x + Math.cos(rayA) * dist;
          const y = s.y + Math.sin(rayA) * dist;
          if (wallAt(x, y)) hit = true;
        }
        const corrected = dist * Math.cos(rayA - s.a);
        const wallH = Math.min(h, h / corrected);
        const shade = Math.max(35, 210 - corrected * 24);
        ctx.fillStyle = `rgb(${Math.floor(shade * .45)},${Math.floor(shade * .58)},${Math.floor(shade)})`;
        const x = Math.floor(i * 3), cw = 4;
        ctx.fillRect(x, h / 2 - wallH / 2, cw, wallH);
        for (let j = x; j < x + cw && j < w; j++) zBuffer[j] = corrected;
      }

      s.coins.filter(c => !c.taken).forEach((c, i) => renderSprite(c, '#ffd84a', 0.5, i, zBuffer));
      s.enemies.filter(e => e.alive).forEach((e, i) => renderSprite(e, '#ff4b67', 0.8, i + 4, zBuffer));

      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w / 2 - 13, h / 2); ctx.lineTo(w / 2 + 13, h / 2); ctx.moveTo(w / 2, h / 2 - 13); ctx.lineTo(w / 2, h / 2 + 13); ctx.stroke();
      ctx.fillStyle = 'rgba(20,24,35,.45)'; ctx.fillRect(w - 150, 20, 120, 120);
      const scale = 7;
      MAP.forEach((row, y) => [...row].forEach((cell, x) => { if (cell === '1') { ctx.fillStyle = '#7aa7ff'; ctx.fillRect(w - 145 + x * scale, 25 + y * scale, scale - 1, scale - 1); } }));
      ctx.fillStyle = '#fff'; ctx.fillRect(w - 145 + s.x * scale - 2, 25 + s.y * scale - 2, 4, 4);
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      movePlayer(dt); updateEnemies(dt, now); draw();
      const s = stateRef.current;
      setUi({ hp: s.hp, ammo: s.ammo, score: s.score, message: s.message });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      document.removeEventListener('mousemove', onMove);
    };
  }, []);

  function start() {
    stateRef.current.running = true;
    stateRef.current.message = 'Игра началась! WASD / стики, SPACE / FIRE';
    canvasRef.current?.requestPointerLock?.();
  }

  function restart() {
    Object.assign(stateRef.current, {
      x: 1.7, y: 1.7, a: 0, hp: 100, ammo: 40, score: 0, running: true, won: false,
      coins: coinsStart.map(c => ({ ...c, taken: false })), enemies: enemiesStart.map(e => ({ ...e })), message: 'Новый раунд!'
    });
  }

  function bindStick(name) {
    return {
      onPointerMove: e => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        stateRef.current[name] = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
      },
      onPointerUp: () => { stateRef.current[name] = { x: 0, y: 0 }; },
      onPointerCancel: () => { stateRef.current[name] = { x: 0, y: 0 }; }
    };
  }

  return (
    <main className="gameShell">
      <canvas ref={canvasRef} className="gameCanvas" onClick={start} />
      <section className="hud topHud">
        <b>Crystal FPS</b><span>HP {ui.hp}</span><span>Ammo {ui.ammo}</span><span>Score {ui.score}</span>
      </section>
      <section className="hud msg">{ui.message}</section>
      <section className="menu">
        <h1>Crystal FPS</h1>
        <p>Блочная FPS-арена: собери кристаллы, уничтожь врагов и не дай HP упасть до нуля.</p>
        <div className="buttons">
          <button onClick={start}>PLAY</button>
          <button onClick={restart}>RESTART</button>
        </div>
        <small>ПК: WASD, мышь, SPACE. iPhone/Android: левый стик ходьба, правый стик поворот, FIRE стрелять.</small>
      </section>
      <div className="mobileControls">
        <div className="stick" {...bindStick('moveStick')}><span>MOVE</span></div>
        <button className="fire" onPointerDown={() => window.gameShoot?.()}>FIRE</button>
        <div className="stick" {...bindStick('turnStick')}><span>LOOK</span></div>
      </div>
    </main>
  );
}

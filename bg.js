(function(){
  const canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = Math.max(1, window.devicePixelRatio || 1);

  // scene controller
  let current = 'raining';
  const scenes = {};

  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    Object.values(scenes).forEach(s=> s.init && s.init());
  }

  function clear(){ ctx.clearRect(0,0,W,H); }

  /* ---------------- Helpers ---------------- */
  function rand(min,max){ return min + Math.random()*(max-min); }
  function lerp(a,b,t){ return a + (b-a)*t }

  /* ---------------- Raining (mountains + rain) ---------------- */
  scenes.raining = (function(){
    let drops = [];
    let mountainLayers = [];
    function createMountains(){
      mountainLayers = [];
      const colors = ['rgba(10,16,36,0.9)','rgba(20,28,50,0.8)','rgba(40,50,90,0.75)'];
      for(let i=0;i<3;i++){
        const detail = 6 + i*4;
        const peaks = [];
        for(let j=0;j<detail;j++){
          const x = (j/(detail-1))*W;
          const y = H*0.35 + (i*40) + Math.sin(j*1.5 + i*2)*40 + (Math.random()*40-20);
          peaks.push({x,y});
        }
        mountainLayers.push({peaks, color: colors[i], offset: i*0.6 + 0.2});
      }
    }
    function createDrops(){
      drops = [];
      const density = Math.max(80, Math.floor(W * 0.12));
      for(let i=0;i<density;i++){
        drops.push({ x: Math.random()*W, y: Math.random()*H, len: 8 + Math.random()*18, speed: 200 + Math.random()*600, alpha: 0.05 + Math.random()*0.25 });
      }
    }
    function drawSky(t){
      const g = ctx.createLinearGradient(0,0,0,H);
      const shift = Math.sin(t*0.0002) * 10;
      g.addColorStop(0, `hsl(${215+shift} 80% 12%)`);
      g.addColorStop(0.6, `hsl(${225+shift} 80% 8%)`);
      g.addColorStop(1, `#03040a`);
      ctx.fillStyle = g;
      ctx.fillRect(0,0,W,H);
    }
    function drawMountains(t){
      mountainLayers.forEach((layer, idx) => {
        ctx.beginPath();
        const offsetX = Math.sin(t*0.0006 + idx)*40*layer.offset;
        ctx.moveTo(0, H);
        for(let i=0;i<layer.peaks.length;i++){
          const p = layer.peaks[i];
          const x = p.x + offsetX* (i/layer.peaks.length - 0.5);
          const y = p.y + Math.sin(t*0.001 + i)*8*layer.offset;
          if(i===0) ctx.lineTo(x,y);
          else ctx.quadraticCurveTo(x, y-30, x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
      });
    }
    function drawDrops(dt){
      ctx.lineWidth = 1;
      for(let i=0;i<drops.length;i++){
        const d = drops[i];
        d.y += d.speed * dt;
        d.x += Math.sin(d.y*0.01 + i)*0.2;
        if(d.y - d.len > H){ d.y = -Math.random()*50; d.x = Math.random()*W; }
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${d.alpha})`;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1.5, d.y - d.len);
        ctx.stroke();
      }
    }
    return {
      init(){ createMountains(); createDrops(); },
      draw(dt, t){ drawSky(t); drawMountains(t); ctx.fillStyle='rgba(8,12,20,0.12)'; ctx.fillRect(0,0,W,H); drawDrops(dt); }
    };
  })();

  /* ---------------- Techy room (grid + nodes) ---------------- */
  scenes.techy = (function(){
    let nodes = [];
    function init(){ nodes = []; const cols = Math.max(6, Math.floor(W/120)); const rows = Math.max(4, Math.floor(H/140));
      for(let x=0;x<cols;x++) for(let y=0;y<rows;y++) nodes.push({x: (x+0.5)/(cols)*W + rand(-20,20), y: (y+0.5)/rows*H + rand(-10,10), r: rand(1.6,3.6), phase: Math.random()*Math.PI*2}); }
    function draw(dt,t){ ctx.fillStyle='linear-gradient(0,0,0,1)'; ctx.fillStyle='rgba(6,8,16,1)'; ctx.fillRect(0,0,W,H);
      // grid lines
      ctx.strokeStyle='rgba(124,92,255,0.06)'; ctx.lineWidth=1;
      for(let i=0;i<20;i++){ const x=i/19*W; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      // nodes
      nodes.forEach(n=>{ const glow = 0.6 + Math.sin(t*0.005 + n.phase)*0.4; ctx.beginPath(); ctx.fillStyle = `rgba(124,92,255,${0.2+glow*0.25})`; ctx.arc(n.x,n.y,n.r*3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.fillStyle=`rgba(124,92,255,${0.9*glow})`; ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill(); });
    }
    return { init, draw };
  })();

  /* ---------------- Fire wood burning (flicker + embers) ---------------- */
  scenes.fire = (function(){
    let embers = [];
    function init(){ embers = []; for(let i=0;i<60;i++) embers.push({x:rand(W*0.2,W*0.8), y:rand(H*0.6,H), r:rand(1,4), vx:rand(-10,10), vy:rand(-60,-20), alpha:rand(0.2,0.9)});
    }
    function draw(dt,t){ // warm gradient
      const g = ctx.createLinearGradient(0,0,H,0); g.addColorStop(0,'#050204'); g.addColorStop(1,'#2b0f00'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // hearth glow
      const glow = 0.3 + Math.abs(Math.sin(t*0.003))*0.7;
      ctx.beginPath(); ctx.fillStyle = `rgba(255,110,50,${0.06*glow})`; ctx.ellipse(W*0.5,H*0.9,W*0.7,150,0,0,Math.PI*2); ctx.fill();
      // embers
      embers.forEach(e=>{ e.x += e.vx*dt; e.y += e.vy*dt; e.alpha *= 0.995; if(e.y < -20 || e.alpha < 0.02){ e.x = rand(W*0.2,W*0.8); e.y = rand(H*0.6,H); e.r = rand(1,4); e.vx = rand(-10,10); e.vy = rand(-80,-30); e.alpha = rand(0.3,0.9);} ctx.beginPath(); ctx.fillStyle = `rgba(255,${120+Math.floor(Math.random()*80)},${40+Math.floor(Math.random()*40)},${e.alpha})`; ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill(); });
    }
    return { init, draw };
  })();

  /* ---------------- Cloudy ---------------- */
  scenes.cloudy = (function(){
    let clouds = [];
    function init(){ clouds = []; const count = Math.max(6, Math.floor(W/180)); for(let i=0;i<count;i++) clouds.push({x:rand(-200,W+200), y: rand(50,H*0.5), s: rand(0.6,1.6), vx: rand(10,40)});
    }
    function draw(dt,t){ ctx.fillStyle='linear-gradient'; const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#6b7f94'); g.addColorStop(1,'#334455'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      clouds.forEach(c=>{ c.x += c.vx*dt; if(c.x > W+300) c.x = -300; drawCloud(c.x, c.y, c.s); });
      function drawCloud(x,y,s){ ctx.beginPath(); ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.ellipse(x,y,60*s,36*s,0,0,Math.PI*2); ctx.ellipse(x+40*s,y-10*s,52*s,30*s,0,0,Math.PI*2); ctx.ellipse(x-40*s,y-6*s,48*s,28*s,0,0,Math.PI*2); ctx.fill(); }
    }
    return { init, draw };
  })();

  /* ---------------- Birds ---------------- */
  scenes.birds = (function(){
    let birds = [];
    function init(){ birds = []; const count = Math.max(6, Math.floor(W/180)); for(let i=0;i<count;i++) birds.push({x:rand(-200,W), y:rand(50,H*0.6), vx:rand(60,160), s:rand(0.6,1.2), phase:Math.random()*Math.PI*2}); }
    function draw(dt,t){ // soft sky
      const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#88b5d9'); g.addColorStop(1,'#5d8fb4'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      birds.forEach(b=>{ b.x += b.vx*dt; b.y += Math.sin((t+b.phase)*0.002)*6* b.s; if(b.x > W+100) { b.x = -100; b.y = rand(40,H*0.7); }
        drawBird(b.x,b.y,b.s); });
      function drawBird(x,y,s){ ctx.beginPath(); ctx.strokeStyle='rgba(8,8,8,0.9)'; ctx.lineWidth=2*s; ctx.moveTo(x-8*s,y); ctx.quadraticCurveTo(x,y-6*s,x+8*s,y); ctx.stroke(); }
    }
    return { init, draw };
  })();

  /* ---------------- Sea view / Beach ---------------- */
  scenes.sea = (function(){
    function init(){ }
    function draw(dt,t){ // horizon gradient
      const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#87ceeb'); g.addColorStop(0.6,'#51a1d8'); g.addColorStop(1,'#05283a'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // sun
      ctx.beginPath(); ctx.fillStyle='rgba(255,220,120,0.9)'; ctx.arc(W*0.85, H*0.25, 36 + 6*Math.sin(t*0.001), 0, Math.PI*2); ctx.fill();
      // waves
      ctx.fillStyle='rgba(255,255,255,0.04)'; for(let i=0;i<5;i++){ ctx.beginPath(); const amp = 8 + i*6; ctx.moveTo(0,H*0.6 + i*18); for(let x=0;x<=W;x+=10){ ctx.lineTo(x, H*0.6 + i*18 + Math.sin((x*0.01) + t*0.002 + i)*amp); } ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill(); }
    }
    return { init, draw };
  })();

  /* ---------------- Bridge covered with cloud ---------------- */
  scenes.bridge = (function(){
    let bridge = [];
    function init(){ bridge = []; const span = 8; for(let i=0;i<=span;i++){ bridge.push({x: i/span*W, y: H*0.6 + Math.sin(i/span*Math.PI)*40}); } }
    function draw(dt,t){ // moody sky
      const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2b3a4a'); g.addColorStop(1,'#0b1220'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // bridge
      ctx.beginPath(); ctx.strokeStyle='rgba(200,200,200,0.12)'; ctx.lineWidth=4; ctx.moveTo(bridge[0].x, bridge[0].y); for(let i=1;i<bridge.length;i++) ctx.lineTo(bridge[i].x, bridge[i].y); ctx.stroke();
      // fog
      ctx.fillStyle='rgba(255,255,255,0.06)'; for(let i=0;i<3;i++){ ctx.fillRect(0, H*0.58 + i*20 + Math.sin(t*0.0005+i)*8, W, 60); }
    }
    return { init, draw };
  })();

  /* ---------------- Snowfall ---------------- */
  scenes.snow = (function(){
    let flakes = [];
    function init(){ flakes = []; const count = Math.max(80, Math.floor(W*0.08)); for(let i=0;i<count;i++) flakes.push({x:rand(0,W), y:rand(0,H), r:rand(1,3), vy:rand(10,60), vx:rand(-10,10)}); }
    function draw(dt,t){ ctx.fillStyle='linear-gradient'; const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#6b7f94'); g.addColorStop(1,'#2b3a45'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      flakes.forEach(f=>{ f.y += f.vy*dt; f.x += f.vx*dt; if(f.y>H+10){ f.y=-10; f.x=rand(0,W);} ctx.beginPath(); ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill(); });
    }
    return { init, draw };
  })();

  /* ---------------- Space ---------------- */
  scenes.space = (function(){
    let stars = [];
    function init(){ stars = []; const count = Math.max(150, Math.floor(W*0.1)); for(let i=0;i<count;i++) stars.push({x:rand(0,W), y:rand(0,H), r:rand(0.3,1.8), tw:Math.random()*2+0.5}); }
    function draw(dt,t){ ctx.fillStyle='#02020a'; ctx.fillRect(0,0,W,H); stars.forEach(s=>{ const tw = 0.5 + 0.5*Math.sin(t*0.005 + s.tw); ctx.beginPath(); ctx.fillStyle=`rgba(255,255,255,${tw})`; ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }); }
    return { init, draw };
  })();

  // select handling
  const select = document.getElementById('bgSelect');
  if(select){
    select.addEventListener('change', e=>{ current = e.target.value; scenes[current] && scenes[current].init(); });
    // set default from select if present
    current = select.value || current;
  }

  let last = performance.now();
  function loop(now){
    const dt = Math.max(0, (now - last)/1000); last = now;
    clear();
    const scene = scenes[current] || scenes.raining;
    scene.draw(dt, now);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  // init current scene explicitly
  scenes[current] && scenes[current].init();
  requestAnimationFrame(loop);
})();

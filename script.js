// Utility for formatting
const pad = (n, d=2) => String(n).padStart(d, '0');

// Date display
function updateDate(){
  const el = document.getElementById('date');
  const now = new Date();
  const opts = {weekday:'short', month:'short', day:'numeric'};
  el.textContent = now.toLocaleDateString(undefined, opts) + ' · ' + now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}
setInterval(updateDate, 1000);
updateDate();

// Mode toggle
document.querySelectorAll('.mode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const mode = btn.dataset.mode;
    document.getElementById('timerPane').classList.toggle('hidden', mode !== 'timer');
    document.getElementById('stopwatchPane').classList.toggle('hidden', mode !== 'stopwatch');
  });
});

/* ------------------ Timer ------------------ */
let timerRemaining = 0; // seconds
let timerInterval = null;
const timerDisplay = document.getElementById('timerDisplay');
const th = document.getElementById('th');
const tm = document.getElementById('tm');
const ts = document.getElementById('ts');
const tStart = document.getElementById('tStart');
const tPause = document.getElementById('tPause');
const tReset = document.getElementById('tReset');

function renderTimer(sec){
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  timerDisplay.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function enableTimerButtons(running){
  tStart.disabled = running;
  tPause.disabled = !running;
  tReset.disabled = !(timerRemaining < initialTimer || running);
}

let initialTimer = 0;

tStart.addEventListener('click', ()=>{
  // compute seconds from inputs
  const seconds = Math.max(0, (Number(th.value)||0)*3600 + (Number(tm.value)||0)*60 + (Number(ts.value)||0));
  if(seconds <= 0) return;
  initialTimer = seconds;
  timerRemaining = seconds;
  renderTimer(timerRemaining);
  startTimerLoop();
});

function startTimerLoop(){
  if(timerInterval) return;
  document.getElementById('timerPane').classList.remove('pulse');
  timerInterval = setInterval(()=>{
    timerRemaining -= 1;
    if(timerRemaining <= 0){
      renderTimer(0);
      stopTimerLoop();
      onTimerEnd();
      return;
    }
    renderTimer(timerRemaining);
  }, 1000);
  tStart.disabled = true; tPause.disabled = false; tReset.disabled = false;
}

function stopTimerLoop(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  tStart.disabled = false; tPause.disabled = true;
}

tPause.addEventListener('click', ()=>{
  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval = null;
    tPause.textContent = 'Resume';
    tStart.disabled = true; tPause.disabled = false; tReset.disabled = false;
  } else {
    startTimerLoop();
    tPause.textContent = 'Pause';
  }
});

tReset.addEventListener('click', ()=>{
  stopTimerLoop();
  timerRemaining = initialTimer || 0;
  renderTimer(timerRemaining);
  tReset.disabled = true; tPause.disabled = true; tStart.disabled = false;
});

function onTimerEnd(){
  // visual
  const pane = document.getElementById('timerPane');
  pane.classList.add('pulse');
  // sound
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime+0.02);
    o.connect(g); g.connect(ctx.destination); o.start();
    o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime+0.5);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+1.2);
    setTimeout(()=>{o.stop(); ctx.close();}, 1400);
  }catch(e){
    // fallback
    alert('Timer finished');
  }
  tStart.disabled = false; tPause.disabled = true; tReset.disabled = false;
}

renderTimer(0);

/* ------------------ Stopwatch ------------------ */
let swStart = 0, swElapsed = 0, swTimer = null;
const swDisplay = document.getElementById('swDisplay');
const sStart = document.getElementById('sStart');
const sPause = document.getElementById('sPause');
const sReset = document.getElementById('sReset');
const lapsEl = document.getElementById('laps');

function formatStopwatch(ms){
  const total = Math.floor(ms/10); // centiseconds
  const cs = total % 100;
  const totalSec = Math.floor(total/100);
  const s = totalSec % 60;
  const m = Math.floor(totalSec/60);
  return `${pad(m)}:${pad(s)}.${pad(cs,2)}`;
}

function renderStopwatch(){
  const now = performance.now();
  const elapsed = swElapsed + (swStart? now - swStart : 0);
  swDisplay.textContent = formatStopwatch(elapsed);
}

function startSW(){
  if(swTimer) return;
  swStart = performance.now();
  swTimer = requestAnimationFrame(loop);
  sStart.disabled = true; sPause.disabled = false; sReset.disabled = false;
}
function loop(){
  renderStopwatch();
  swTimer = requestAnimationFrame(loop);
}
function pauseSW(){
  if(swTimer){
    cancelAnimationFrame(swTimer); swTimer = null;
    swElapsed += performance.now() - swStart; swStart = 0;
    sPause.textContent = 'Resume';
  } else {
    startSW();
    sPause.textContent = 'Pause';
  }
}
function resetSW(){
  if(swTimer) cancelAnimationFrame(swTimer);
  swStart = 0; swElapsed = 0; swTimer = null; lapsEl.innerHTML = '';
  swDisplay.textContent = '00:00.00';
  sStart.disabled = false; sPause.disabled = true; sPause.textContent = 'Pause'; sReset.disabled = true;
}

sStart.addEventListener('click', ()=>{
  startSW();
});
sPause.addEventListener('click', ()=>{
  if(sPause.disabled) return;
  pauseSW();
});
sReset.addEventListener('click', ()=>{
  // if stopwatch stopped, reset. if running, record lap
  if(swTimer){
    // lap
    const now = performance.now();
    const elapsed = swElapsed + (swStart? now - swStart : 0);
    const node = document.createElement('div'); node.className='lap';
    const count = lapsEl.children.length + 1;
    node.innerHTML = `<div>Lap ${count}</div><div>${formatStopwatch(elapsed)}</div>`;
    lapsEl.prepend(node);
  } else {
    resetSW();
  }
});


// initial states
sPause.disabled = true; sReset.disabled = true;

// ensure displays accurate when page hidden/visible
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible') renderStopwatch();
});

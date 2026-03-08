// ============================================================
// KaTeX auto-render configuration
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
  renderMathInElement(document.body, {
    delimiters: [
      {left: "\\[", right: "\\]", display: true},
      {left: "\\(", right: "\\)", display: false}
    ],
    throwOnError: false
  });
  buildSetsDiagram();
  drawInterval();
  drawCentered();
  drawGeo();
  computeEncadrement();
  showDecExpansion();
  setTimeout(generateQCM, 100);
});

// Helper : render KaTeX in a node
function renderKatex(el) {
  renderMathInElement(el, {
    delimiters: [
      {left: "\\[", right: "\\]", display: true},
      {left: "\\(", right: "\\)", display: false}
    ],
    throwOnError: false
  });
}

// ============================================================
// 01 — SETS DIAGRAM
// Hiérarchie CORRECTE : N ⊂ Z ⊂ D ⊂ Q ⊂ R
// ============================================================
function buildSetsDiagram() {
  const wrap = document.getElementById('sets-svg-wrap');
  const W = Math.min(wrap.offsetWidth || 700, 700);
  const H = 200;
  const cx = W / 2, cy = H / 2;
  // Ordre CORRECT : ℝ (plus grand) → ℚ → 𝔻 → ℤ → ℕ (plus petit)
  const data = [
    { sym:'ℝ', color:'#3d5a80', r: Math.min(cx - 10, 88), desc: 'Réels — tous les points de la droite numérique', ex: '√2, π, −3, 1/3, 0,25…' },
    { sym:'ℚ', color:'#b8860b', r: Math.min(cx - 10, 70), desc: 'Rationnels — fractions p/q avec q ≠ 0 (contient 𝔻)', ex: '1/3, −2/5, 7, 0,25…' },
    { sym:'𝔻', color:'#4a7c59', r: Math.min(cx - 10, 52), desc: 'Décimaux — fractions de dénominateur puissance de 10', ex: '0,25 ; −1,5 ; 3,14 ; 0,1' },
    { sym:'ℤ', color:'#c0392b', r: Math.min(cx - 10, 36), desc: 'Entiers relatifs — positifs, négatifs et zéro', ex: '…−2, −1, 0, 1, 2…' },
    { sym:'ℕ', color:'#6c3483', r: Math.min(cx - 10, 20), desc: 'Entiers naturels — positifs et zéro', ex: '0, 1, 2, 3, 4…' },
  ];

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:auto;">`;
  data.forEach(d => {
    const safeDesc = d.desc.replace(/'/g, '&apos;');
    const safeEx = d.ex.replace(/'/g, '&apos;');
    svg += `<circle cx="${cx}" cy="${cy}" r="${d.r}" fill="none" stroke="${d.color}" stroke-width="2.5"
      style="cursor:pointer;" onclick="showSetInfo('${d.sym}','${safeDesc}','${safeEx}','${d.color}')"/>`;
    svg += `<text x="${cx}" y="${cy - d.r + 15}" text-anchor="middle"
      font-family="Playfair Display,serif" font-size="13" font-weight="700" fill="${d.color}"
      style="cursor:pointer;" onclick="showSetInfo('${d.sym}','${safeDesc}','${safeEx}','${d.color}')">${d.sym}</text>`;
  });
  svg += '</svg>';
  wrap.innerHTML = svg;
}

function showSetInfo(sym, desc, ex, color) {
  const el = document.getElementById('set-info');
  el.style.borderLeftColor = color;
  el.innerHTML = `<strong>${sym}</strong> — ${desc}<br><span style="color:#888">Exemples : ${ex}</span>`;
}

// ============================================================
// Classify number
// ============================================================
function classifyNumber() {
  const raw = document.getElementById('classify-input').value.trim().toLowerCase();
  const el = document.getElementById('classify-result');

  // Special irrationals
  const specials = { 'sqrt2':'√2', 'sqrt(2)':'√2', '√2':'√2', 'sqrt3':'√3', 'sqrt(3)':'√3', '√3':'√3', 'pi':'π', 'π':'π', 'e':'e' };
  if (specials[raw]) {
    el.innerHTML = `<strong>${specials[raw]}</strong> est <em>irrationnel</em> : appartient à ℝ uniquement (pas dans ℚ).`;
    el.style.borderLeftColor = 'var(--slate)';
    return;
  }

  if (raw.includes('/')) {
    const parts = raw.split('/');
    const p = parseInt(parts[0]), q = parseInt(parts[1]);
    if (isNaN(p) || isNaN(q) || q === 0) { el.innerHTML = 'Entrée invalide.'; return; }
    const val = p / q;
    // Is decimal? Simplify fraction, check if denominator = 2^a * 5^b
    let den = Math.abs(q); const gcd = pgcd(Math.abs(p), den); den = den / gcd;
    while (den % 2 === 0) den /= 2;
    while (den % 5 === 0) den /= 5;
    const isDec = (den === 1);
    const isInt = Number.isInteger(val);
    let sets, msg;
    if (isInt) {
      sets = val >= 0 ? 'ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ' : 'ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ';
      msg = isInt && val >= 0 ? 'Entier naturel.' : 'Entier relatif négatif.';
    } else if (isDec) {
      sets = '𝔻 ⊂ ℚ ⊂ ℝ'; msg = 'Nombre décimal (rationnel non entier).';
    } else {
      sets = 'ℚ ⊂ ℝ (mais ∉ 𝔻)'; msg = 'Rationnel non décimal : développement décimal périodique infini.';
    }
    el.innerHTML = `<strong>${p}/${q}</strong> appartient à : <strong>${sets}</strong><br><span style="color:#666;font-size:0.82rem;">${msg}</span>`;
    el.style.borderLeftColor = isDec ? 'var(--sage)' : 'var(--gold)';
    return;
  }

  const val = parseFloat(raw);
  if (isNaN(val)) { el.innerHTML = 'Entrée invalide. Essaie : 0.25, 1/3, sqrt2, pi, -5'; return; }
  const isInt = Number.isInteger(val);
  if (isInt) {
    const sets = val >= 0 ? 'ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ' : 'ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ';
    el.innerHTML = `<strong>${val}</strong> ∈ ${sets}<br><span style="color:#666;font-size:0.82rem;">${val >= 0 ? 'Entier naturel.' : 'Entier relatif négatif.'}</span>`;
  } else {
    el.innerHTML = `<strong>${val}</strong> ∈ 𝔻 ⊂ ℚ ⊂ ℝ<br><span style="color:#666;font-size:0.82rem;">Nombre décimal (rationnel).</span>`;
  }
  el.style.borderLeftColor = 'var(--sage)';
}

function pgcd(a, b) { return b === 0 ? a : pgcd(b, a % b); }

// ============================================================
// Canvas helpers
// ============================================================
function initCanvas(c) {
  const dpr = window.devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  const logW = rect.width || 600;
  const logH = parseInt(c.getAttribute('height')) || 90;
  c.width = logW * dpr;
  c.height = logH * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  c._logW = logW; c._logH = logH;
  return ctx;
}

function drawAxis(ctx, W, H, minV, maxV) {
  const pad = 32, midY = H / 2 + 10;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pad - 10, midY); ctx.lineTo(W - pad + 12, midY); ctx.stroke();
  ctx.fillStyle = '#1a1410';
  ctx.beginPath(); ctx.moveTo(W-pad+12, midY); ctx.lineTo(W-pad+6, midY-4); ctx.lineTo(W-pad+6, midY+4); ctx.closePath(); ctx.fill();
  for (let i = Math.ceil(minV); i <= Math.floor(maxV); i++) {
    const xx = pad + (i - minV) / (maxV - minV) * (W - 2 * pad);
    ctx.beginPath(); ctx.moveTo(xx, midY - 5); ctx.lineTo(xx, midY + 5); ctx.stroke();
    ctx.fillStyle = '#1a1410';
    ctx.font = '11px DM Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(i, xx, midY + 18);
  }
  return {pad, midY};
}

function xToCanvas(v, minV, maxV, W, pad) {
  return pad + (v - minV) / (maxV - minV) * (W - 2 * pad);
}

// ============================================================
// 02 — Interval drawing
// ============================================================
function drawInterval() {
  const canvas = document.getElementById('nlCanvas');
  const ctx = initCanvas(canvas);
  const W = canvas._logW, H = canvas._logH;
  const a = parseFloat(document.getElementById('nl-a').value);
  const b = parseFloat(document.getElementById('nl-b').value);
  const type = document.getElementById('nl-type').value;
  const minV = -10, maxV = 10;
  const {pad, midY} = drawAxis(ctx, W, H, minV, maxV);

  let x1, x2, leftClosed, rightClosed, leftInf = false, rightInf = false;
  if (type==='cc'){x1=a;x2=b;leftClosed=true;rightClosed=true;}
  else if(type==='oo'){x1=a;x2=b;leftClosed=false;rightClosed=false;}
  else if(type==='co'){x1=a;x2=b;leftClosed=true;rightClosed=false;}
  else if(type==='oc'){x1=a;x2=b;leftClosed=false;rightClosed=true;}
  else if(type==='ci'){x1=a;x2=maxV;leftClosed=true;rightClosed=false;rightInf=true;}
  else if(type==='oi'){x1=a;x2=maxV;leftClosed=false;rightClosed=false;rightInf=true;}
  else if(type==='ic'){x1=minV;x2=b;leftClosed=false;rightClosed=true;leftInf=true;}
  else {x1=minV;x2=b;leftClosed=false;rightClosed=false;leftInf=true;}

  const px1 = leftInf ? pad - 8 : xToCanvas(x1, minV, maxV, W, pad);
  const px2 = rightInf ? W - pad + 10 : xToCanvas(x2, minV, maxV, W, pad);

  ctx.fillStyle = 'rgba(192,57,43,0.13)';
  ctx.fillRect(px1, midY - 8, px2 - px1, 16);
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(px1, midY); ctx.lineTo(px2, midY); ctx.stroke();

  function dot(x, closed) {
    ctx.beginPath(); ctx.arc(x, midY, 5, 0, 2 * Math.PI);
    if (closed) { ctx.fillStyle = '#c0392b'; ctx.fill(); }
    else {
      ctx.fillStyle = 'white'; ctx.fill();
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  if (!leftInf) dot(xToCanvas(x1, minV, maxV, W, pad), leftClosed);
  if (!rightInf) dot(xToCanvas(x2, minV, maxV, W, pad), rightClosed);

  const notations = {cc:`[${a} ; ${b}]`, oo:`]${a} ; ${b}[`, co:`[${a} ; ${b}[`, oc:`]${a} ; ${b}]`,
    ci:`[${a} ; +∞[`, oi:`]${a} ; +∞[`, ic:`]−∞ ; ${b}]`, io:`]−∞ ; ${b}[`};
  document.getElementById('nl-notation').textContent = notations[type];
}

function checkMembership() {
  const x = parseFloat(document.getElementById('mem-x').value);
  const a = parseFloat(document.getElementById('nl-a').value);
  const b = parseFloat(document.getElementById('nl-b').value);
  const type = document.getElementById('nl-type').value;
  const checks = {cc:x>=a&&x<=b, oo:x>a&&x<b, co:x>=a&&x<b, oc:x>a&&x<=b, ci:x>=a, oi:x>a, ic:x<=b, io:x<b};
  const belongs = checks[type];
  const notation = document.getElementById('nl-notation').textContent;
  const el = document.getElementById('mem-result');
  el.className = 'mem-result ' + (belongs ? 'mem-ok' : 'mem-ko');
  el.textContent = belongs ? `✓  ${x} ∈ ${notation}` : `✗  ${x} ∉ ${notation}`;
}

// ============================================================
// 03 — Centered interval
// ============================================================
function drawCentered() {
  const canvas = document.getElementById('nlCanvas2');
  const ctx = initCanvas(canvas);
  const W = canvas._logW, H = canvas._logH;
  const a = parseFloat(document.getElementById('ci-a').value);
  const r = Math.abs(parseFloat(document.getElementById('ci-r').value));
  const minV = -10, maxV = 10;
  const {pad, midY} = drawAxis(ctx, W, H, minV, maxV);

  const px_lo = xToCanvas(a - r, minV, maxV, W, pad);
  const px_hi = xToCanvas(a + r, minV, maxV, W, pad);
  const px_a  = xToCanvas(a, minV, maxV, W, pad);

  ctx.fillStyle = 'rgba(61,90,128,0.13)';
  ctx.fillRect(px_lo, midY - 8, px_hi - px_lo, 16);
  ctx.strokeStyle = '#3d5a80'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(px_lo, midY); ctx.lineTo(px_hi, midY); ctx.stroke();

  [px_lo, px_hi].forEach(px => {
    ctx.beginPath(); ctx.arc(px, midY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#3d5a80'; ctx.fill();
  });
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(px_a, midY - 10); ctx.lineTo(px_a, midY + 10); ctx.stroke();
  ctx.fillStyle = '#c0392b'; ctx.font = '11px DM Mono'; ctx.textAlign = 'center';
  ctx.fillText('a', px_a, midY - 14);

  const lo = (a - r), hi = (a + r);
  document.getElementById('ci-result').textContent =
    `[${lo.toFixed(2)} ; ${hi.toFixed(2)}] — centre a = ${a}, rayon r = ${r} — condition : |x − ${a}| ≤ ${r}`;
}

function checkCentered() {
  const a = parseFloat(document.getElementById('ci-a').value);
  const r = parseFloat(document.getElementById('ci-r').value);
  const x = parseFloat(document.getElementById('ci-x').value);
  const dist = Math.abs(x - a);
  const ok = dist <= r;
  const el = document.getElementById('ci-check');
  el.style.background = ok ? '#e8f5ec' : '#fde8e7';
  el.style.color = ok ? 'var(--sage)' : 'var(--rust)';
  el.textContent = `|${x} − ${a}| = ${dist.toFixed(4)} ${ok ? '≤' : '>'} ${r}  →  x ${ok ? '∈' : '∉'} [${(a-r).toFixed(2)} ; ${(a+r).toFixed(2)}]`;
}

function calcDist() {
  const a = parseFloat(document.getElementById('dist-a').value);
  const b = parseFloat(document.getElementById('dist-b').value);
  document.getElementById('dist-result').textContent =
    `d(${a}, ${b}) = |${b} − ${a}| = |${(b-a).toFixed(4)}| = ${Math.abs(b-a).toFixed(4)}`;
}

// ============================================================
// 04 — Encadrement
// ============================================================
const numVals = { sqrt2:Math.sqrt(2), sqrt3:Math.sqrt(3), sqrt5:Math.sqrt(5), pi:Math.PI, e:Math.E, sqrt7:Math.sqrt(7) };
const numLabels = { sqrt2:'√2', sqrt3:'√3', sqrt5:'√5', pi:'π', e:'e', sqrt7:'√7' };

function computeEncadrement() {
  const key = document.getElementById('enc-num').value;
  const n = parseInt(document.getElementById('enc-prec').value);
  const val = numVals[key];
  const step = Math.pow(10, -n);
  const lo = Math.floor(val / step) * step;
  const hi = lo + step;
  const d = n;
  document.getElementById('enc-result').innerHTML =
    `<div class="enc-result">
      <span class="enc-val">${lo.toFixed(d)}</span>
      <span>≤</span>
      <span class="enc-num">${numLabels[key]}</span>
      <span>&lt;</span>
      <span class="enc-val">${hi.toFixed(d)}</span>
      <span style="color:#888;font-size:0.78rem;">amplitude&nbsp;10<sup>−${n}</sup></span>
    </div>
    <p style="font-size:0.82rem;color:#666;margin-top:0.5rem;">
      Valeur approchée : ${numLabels[key]} ≈ ${val.toFixed(n + 3)}
    </p>`;
}

function doRound() {
  const v = parseFloat(document.getElementById('round-val').value);
  const d = parseInt(document.getElementById('round-dec').value);
  if (isNaN(v)) { document.getElementById('round-result').textContent = 'Valeur invalide.'; return; }
  document.getElementById('round-result').textContent =
    `${v} arrondi à ${d} décimale(s) : ${v.toFixed(d)}`;
}

// ============================================================
// 05 — Geo canvas
// ============================================================
function drawGeo() {
  const c = document.getElementById('geoCanvas');
  const rect = c.getBoundingClientRect();
  const W = rect.width || 600, H = c.height;
  c.width = W; // no DPR here for simplicity
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const scale = Math.min(W / 3.8, H * 0.75);

  // Square side 1
  const ox = W * 0.1, oy = H / 2 + scale / 2;
  ctx.fillStyle = 'rgba(61,90,128,0.08)'; ctx.strokeStyle = '#3d5a80'; ctx.lineWidth = 2;
  ctx.fillRect(ox, oy - scale, scale, scale);
  ctx.strokeRect(ox, oy - scale, scale, scale);
  // Diagonal
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + scale, oy - scale); ctx.stroke();
  // Labels
  ctx.fillStyle = '#3d5a80'; ctx.font = 'bold 13px DM Mono'; ctx.textAlign = 'center';
  ctx.fillText('1', ox + scale / 2, oy + 16);
  ctx.fillText('1', ox - 14, oy - scale / 2);
  ctx.fillStyle = '#c0392b';
  ctx.save();
  ctx.translate(ox + scale / 2 + 12, oy - scale / 2 + 10);
  ctx.rotate(-Math.PI / 4);
  ctx.fillText('√2', 0, 0);
  ctx.restore();

  // Circle diameter 1
  const cx2 = W * 0.65, cy2 = H / 2;
  const r = scale * 0.38;
  ctx.fillStyle = 'rgba(74,124,89,0.08)'; ctx.strokeStyle = '#4a7c59'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#4a7c59'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx2 - r, cy2); ctx.lineTo(cx2 + r, cy2); ctx.stroke();
  ctx.fillStyle = '#4a7c59'; ctx.font = 'bold 13px DM Mono'; ctx.textAlign = 'center';
  ctx.fillText('1', cx2, cy2 + 16);
  ctx.fillText('π', cx2, cy2 - r - 12);
  ctx.font = '11px DM Sans'; ctx.fillStyle = '#888';
  ctx.fillText('(périmètre = π)', cx2, cy2 - r - 28);
}

// ============================================================
// Decimal expansions
// ============================================================
function showDecExpansion() {
  const v = document.getElementById('dec-num').value;
  const el = document.getElementById('dec-expansion');
  const info = document.getElementById('dec-info');

  if (v === '1/3') {
    el.innerHTML = `1/3 = 0,<span class="period" title="Période : 3">3̄</span> = 0,<span class="period">333333333333333333333333333333333333333333333333...</span>`;
    info.textContent = '→ Développement décimal périodique de période 1 : le chiffre 3 se répète indéfiniment. Rationnel non décimal.';
  } else if (v === '1/7') {
    el.innerHTML = `1/7 = 0,<span class="period">142857</span><span class="period"> 142857</span><span class="period"> 142857</span><span class="period"> 142857</span><span class="period"> 142857</span>...`;
    info.textContent = '→ Développement périodique de période 6 : (142857) se répète. Rationnel non décimal.';
  } else if (v === '1/6') {
    el.innerHTML = `1/6 = 0,1<span class="period">6666666666666666666666666666666666666666666666...</span>`;
    info.textContent = '→ Partie non périodique : 1, puis 6̄. Rationnel non décimal.';
  } else if (v === '0.25') {
    el.innerHTML = `0,25 = 0,250000000000000000000000000000000000000000000000...`;
    info.textContent = '→ Développement décimal fini (puis zéros). C\'est un nombre décimal : 0,25 = 25/10² ∈ 𝔻 ⊂ ℚ ⊂ ℝ.';
  } else if (v === 'sqrt2') {
    const s = Math.sqrt(2).toFixed(50);
    const int = s.split('.')[0], frac = s.split('.')[1] || '';
    el.innerHTML = `√2 = ${int},<span class="irrational">${frac.slice(0,15)}</span>${frac.slice(15,30)}<span style="color:#aaa">${frac.slice(30)}...</span>`;
    info.textContent = '→ Développement décimal infini et non périodique. Nombre irrationnel : √2 ∉ ℚ.';
  } else if (v === 'pi') {
    const piStr = '14159265358979323846264338327950288419716939937510';
    el.innerHTML = `π = 3,<span class="irrational">${piStr.slice(0,15)}</span>${piStr.slice(15,30)}<span style="color:#aaa">${piStr.slice(30)}...</span>`;
    info.textContent = '→ Irrationnel transcendant. Développement non périodique, infini. π ∉ ℚ.';
  } else if (v === 'sqrt3') {
    const s = Math.sqrt(3).toFixed(50);
    const int = s.split('.')[0], frac = s.split('.')[1] || '';
    el.innerHTML = `√3 = ${int},<span class="irrational">${frac.slice(0,15)}</span>${frac.slice(15,30)}<span style="color:#aaa">${frac.slice(30)}...</span>`;
    info.textContent = '→ Développement décimal infini et non périodique. Nombre irrationnel : √3 ∉ ℚ.';
  }
}

// ============================================================
// 06 — Algorithm
// ============================================================
let algoRunning = false;
function resetAlgo() {
  document.getElementById('algo-cells').innerHTML = '';
  document.getElementById('algo-result').innerHTML = '';
  algoRunning = false;
}

async function runAlgo() {
  if (algoRunning) return;
  algoRunning = true;
  const n = parseInt(document.getElementById('algo-n').value);
  const step = Math.pow(10, -n);
  const container = document.getElementById('algo-cells');
  const resEl = document.getElementById('algo-result');
  container.innerHTML = ''; resEl.innerHTML = '';

  let x = 1;
  const steps = [];
  while (x * x <= 2 + 1e-12 && steps.length < 250) {
    steps.push(parseFloat(x.toFixed(n + 2)));
    x = parseFloat((x + step).toFixed(n + 2));
  }
  steps.push(parseFloat(x.toFixed(n + 2)));

  const cells = steps.map(v => {
    const div = document.createElement('div');
    div.className = 'algo-cell';
    div.textContent = v.toFixed(n);
    container.appendChild(div);
    return div;
  });

  const delay = Math.max(20, 250 - steps.length * 3);
  for (let i = 0; i < cells.length - 1 && algoRunning; i++) {
    if (i > 0) cells[i - 1].className = 'algo-cell';
    cells[i].className = 'algo-cell active';
    await new Promise(r => setTimeout(r, delay));
  }

  cells.forEach(c => c.className = 'algo-cell');
  if (cells.length >= 2) {
    cells[cells.length - 2].className = 'algo-cell found';
    cells[cells.length - 1].className = 'algo-cell active';
    const lo = steps[steps.length - 2].toFixed(n);
    const hi = steps[steps.length - 1].toFixed(n);
    resEl.innerHTML = `Encadrement : <strong>${lo} ≤ √2 &lt; ${hi}</strong>  ·  amplitude 10⁻${n}<br>
      <span style="color:#666;font-size:0.82rem;">√2 ≈ ${Math.sqrt(2).toFixed(n + 3)} (valeur exacte irrationnelle)</span>`;
  }
  algoRunning = false;
}

// ============================================================
// Proof toggles
// ============================================================
function toggleProof(id, btn) {
  const body = document.getElementById(id);
  body.classList.toggle('visible');
  btn.classList.toggle('open');
  if (body.classList.contains('visible')) renderKatex(body);
}

// ============================================================
// Chrono
// ============================================================
let chronoInterval = null, chronoSecs = 0, chronoPaused = false, chronoVisible = false;
function toggleChronoVisibility() {
  chronoVisible = !chronoVisible;
  document.getElementById('chrono-bar').classList.toggle('hidden', !chronoVisible);
  document.getElementById('chrono-toggle-btn').textContent = chronoVisible ? '⏱ Masquer chronomètre' : '⏱ Afficher chronomètre';
  if (chronoVisible && !chronoInterval) {
    chronoInterval = setInterval(() => { if (!chronoPaused) { chronoSecs++; updateChronoDisplay(); } }, 1000);
  }
}
function toggleChrono() {
  chronoPaused = !chronoPaused;
  document.getElementById('chrono-pause-btn').textContent = chronoPaused ? 'Reprendre' : 'Pause';
}
function resetChrono() {
  chronoSecs = 0; chronoPaused = false;
  document.getElementById('chrono-pause-btn').textContent = 'Pause';
  updateChronoDisplay();
}
function updateChronoDisplay() {
  const m = String(Math.floor(chronoSecs / 60)).padStart(2, '0');
  const s = String(chronoSecs % 60).padStart(2, '0');
  document.getElementById('chrono-display').textContent = `${m}:${s}`;
}

// ============================================================
// 07 — QCM
// ============================================================
let qcmScore = 0, qcmTotal = 0;

function generateQCM() {
  qcmScore = 0; qcmTotal = 0; updateScore();
  const container = document.getElementById('qcm-container');
  container.innerHTML = '';
  buildQuestions().forEach((q, i) => container.appendChild(renderQuestion(q, i)));
  renderKatex(container);
}

function updateScore() {
  document.getElementById('qcm-score').textContent = `${qcmScore} / ${qcmTotal}`;
}

function buildQuestions() {
  const qs = [];

  // Q1 — Appartenance
  const itvList = [
    {tex:'[2\\,;\\,5]',   fn: x=>x>=2&&x<=5},
    {tex:']\\!-1\\,;\\,3[', fn:x=>x>-1&&x<3},
    {tex:'[0\\,;\\,+\\infty[', fn:x=>x>=0},
    {tex:']-\\infty\\,;\\,4]', fn:x=>x<=4},
    {tex:'[-3\\,;\\,3]', fn:x=>x>=-3&&x<=3},
  ];
  const itv = itvList[Math.floor(Math.random() * itvList.length)];
  const cands = [-4,-3,-2,-1,0,1,2,3,4,5,6,-0.5,0.5,2.5];
  const x1 = cands[Math.floor(Math.random() * cands.length)];
  const inside = itv.fn(x1);
  qs.push({
    q: `Le réel \\(${x1}\\) appartient-il à \\(${itv.tex}\\)&nbsp;?`,
    choices: ['Oui', 'Non'],
    correct: inside ? 0 : 1,
    explanation: inside
      ? `\\(${x1}\\) vérifie bien la condition de l'intervalle \\(${itv.tex}\\).`
      : `\\(${x1}\\) ne vérifie pas la condition de l'intervalle \\(${itv.tex}\\).`
  });

  // Q2 — Ensembles (hiérarchie CORRECTE N⊂Z⊂D⊂Q⊂R)
  const setQs = [
    { q:'\\(\\dfrac{1}{3}\\) est-il un nombre décimal&nbsp;?', choices:['Oui','Non'], correct:1,
      explanation:'\\(\\dfrac{1}{3}\\) est rationnel mais pas décimal : 3 ne se décompose pas en facteurs 2 et 5 uniquement. \\(\\dfrac{1}{3} \\in \\mathbb{Q}\\) mais \\(\\dfrac{1}{3} \\notin \\mathbb{D}\\).'},
    { q:'\\(\\sqrt{2}\\) est-il rationnel&nbsp;?', choices:['Oui','Non'], correct:1,
      explanation:'\\(\\sqrt{2}\\) est irrationnel (démonstration au programme) : \\(\\sqrt{2} \\in \\mathbb{R}\\) mais \\(\\sqrt{2} \\notin \\mathbb{Q}\\).'},
    { q:'\\(0{,}25\\) est-il un nombre décimal&nbsp;?', choices:['Oui','Non'], correct:0,
      explanation:'\\(0{,}25 = \\dfrac{25}{10^2} \\in \\mathbb{D}\\) : c\'est bien un décimal. De plus \\(\\mathbb{D} \\subset \\mathbb{Q} \\subset \\mathbb{R}\\).'},
    { q:'Tout nombre décimal est-il rationnel&nbsp;?', choices:['Oui','Non'], correct:0,
      explanation:'Oui : \\(\\mathbb{D} \\subset \\mathbb{Q}\\). Tout décimal \\(\\dfrac{p}{10^n}\\) est bien un rationnel.'},
    { q:'\\(0{,}25\\) appartient-il à \\(\\mathbb{Q}\\)&nbsp;?', choices:['Oui','Non'], correct:0,
      explanation:'\\(0{,}25 \\in \\mathbb{D} \\subset \\mathbb{Q}\\) : oui, et même \\(0{,}25 \\in \\mathbb{D}\\).'},
    { q:'La hiérarchie \\(\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{D} \\subset \\mathbb{Q} \\subset \\mathbb{R}\\) est-elle correcte&nbsp;?', choices:['Oui','Non'], correct:0,
      explanation:'Oui, c\'est la hiérarchie correcte. \\(\\mathbb{D} \\subset \\mathbb{Q}\\) (tout décimal est rationnel) et non l\'inverse.'},
  ];
  qs.push(setQs[Math.floor(Math.random() * setQs.length)]);

  // Q3 — Valeur absolue
  const absCands = [-7,-5,-3,-1,2,4,6];
  const av = absCands[Math.floor(Math.random() * absCands.length)];
  const absVal = Math.abs(av);
  qs.push({
    q: `Quelle est la valeur de \\(|${av}|\\)&nbsp;?`,
    choices: [String(absVal), String(absVal + 1), String(av)],
    correct: 0,
    explanation: `\\(|${av}| = ${absVal}\\) car la valeur absolue est toujours positive ou nulle.`
  });

  // Q4 — Distance
  const pa = Math.floor(Math.random() * 10) - 5;
  let pb = Math.floor(Math.random() * 10) - 2;
  if (pb === pa) pb++;
  const dist = Math.abs(pb - pa);
  qs.push({
    q: `Quelle est la distance \\(d(${pa},\\,${pb})\\) sur la droite numérique&nbsp;?`,
    choices: [String(dist), String(dist + 1), String(Math.abs(pa + pb))],
    correct: 0,
    explanation: `\\(d(${pa},\\,${pb}) = |${pb} - ${pa}| = |${pb-pa}| = ${dist}\\)`
  });

  // Q5 — Encadrement
  const vals = [{k:'sqrt2',v:Math.sqrt(2),s:'\\sqrt{2}'},{k:'pi',v:Math.PI,s:'\\pi'},{k:'sqrt3',v:Math.sqrt(3),s:'\\sqrt{3}'}];
  const ev = vals[Math.floor(Math.random() * vals.length)];
  const prec = [1,2][Math.floor(Math.random() * 2)];
  const estep = Math.pow(10, -prec);
  const elo = Math.floor(ev.v / estep) * estep;
  const ehi = elo + estep;
  const eloS = elo.toFixed(prec), ehiS = ehi.toFixed(prec);
  const wrong1S = (elo + estep).toFixed(prec);
  const wrong2S = (elo - estep).toFixed(prec);
  qs.push({
    q: `Quel encadrement à \\(10^{-${prec}}\\) près est correct pour \\(${ev.s}\\)&nbsp;?`,
    choices: [`\\(${eloS} \\leq ${ev.s} < ${ehiS}\\)`, `\\(${wrong1S} \\leq ${ev.s} < ${(elo + 2*estep).toFixed(prec)}\\)`, `\\(${wrong2S} \\leq ${ev.s} < ${eloS}\\)`],
    correct: 0,
    explanation: `\\(${ev.v.toFixed(prec+2)}\\ldots\\) est bien compris entre \\(${eloS}\\) et \\(${ehiS}\\). Encadrement correct : \\(${eloS} \\leq ${ev.s} < ${ehiS}\\).`
  });

  // Q6 — Intervalle centré
  const ca = [-2,-1,0,1,2][Math.floor(Math.random() * 5)];
  const cr = [1,2,3][Math.floor(Math.random() * 3)];
  qs.push({
    q: `L'intervalle \\([${ca-cr}\\,;\\,${ca+cr}]\\) se caractérise-t-il par \\(|x - ${ca}| \\leq ${cr}\\)&nbsp;?`,
    choices: ['Oui', 'Non'],
    correct: 0,
    explanation: `Oui : \\([${ca}-${cr}\\,;\\,${ca}+${cr}] = [${ca-cr}\\,;\\,${ca+cr}]\\) correspond exactement à \\(|x - ${ca}| \\leq ${cr}\\).`
  });

  // Shuffle choices (track correct answer index)
  return qs.map(q => {
    const indexed = q.choices.map((c, i) => ({c, i}));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return { ...q, choices: indexed.map(it => it.c), correct: indexed.findIndex(it => it.i === q.correct) };
  });
}

function renderQuestion(q, idx) {
  qcmTotal++; updateScore();
  const div = document.createElement('div');
  div.className = 'qcm-question';

  const qEl = document.createElement('div');
  qEl.className = 'qcm-q';
  qEl.innerHTML = `<strong>${idx + 1}.</strong> ${q.q}`;
  div.appendChild(qEl);

  const choicesEl = document.createElement('div');
  choicesEl.className = 'qcm-choices';
  q.choices.forEach((c, ci) => {
    const btn = document.createElement('button');
    btn.className = 'qcm-choice';
    btn.innerHTML = c;
    btn.onclick = () => answerQ(ci, q, div, choicesEl);
    choicesEl.appendChild(btn);
  });
  div.appendChild(choicesEl);
  return div;
}

function answerQ(chosen, q, div, choicesEl) {
  const btns = choicesEl.querySelectorAll('.qcm-choice');
  btns.forEach(b => b.disabled = true);
  const correct = chosen === q.correct;
  btns[chosen].classList.add(correct ? 'correct' : 'wrong');
  if (!correct) btns[q.correct].classList.add('correct');
  div.classList.add(correct ? 'answered-ok' : 'answered-ko');
  if (correct) qcmScore++;
  updateScore();
  const exp = document.createElement('div');
  exp.className = 'qcm-explanation';
  exp.innerHTML = (correct ? '✓ ' : '✗ ') + q.explanation;
  div.appendChild(exp);
  renderKatex(exp);
}

// ============================================================
// Resize
// ============================================================
window.addEventListener('resize', () => {
  buildSetsDiagram();
  drawInterval();
  drawCentered();
  drawGeo();
});
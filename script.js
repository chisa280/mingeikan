// ── 民芸品データ ──────────────────────────────────────────
const ARTIFACTS = {
  "artifact_001": { name: "虎の置物1", src: "images/001.PNG", desc: "", scale: 1 },
  "artifact_002": { name: "脱穀機", src: "images/002.PNG", desc: "", scale: 2 },
  "artifact_003": { name: "木彫りのだるま", src: "images/003.PNG", desc: "", scale: 0.7 },
  "artifact_004": { name: "塑像", src: "images/004.PNG", desc: "", scale: 3 },
  "artifact_005": { name: "絵画", src: "images/006.PNG", desc: "", scale: 2.5 },
  "artifact_006": { name: "虎の置物2", src: "images/007.PNG", desc: "", scale: 1 },
  "artifact_007": { name: "日本兵のヘルメット", src: "images/008.PNG", desc: "", scale: 0.6 },
  "artifact_008": { name: "ガラスのブイ", src: "images/009.PNG", desc: "", scale: 0.7 },
};

const MESSAGES = [
  "QRコードをスキャンして民芸品を集めよう",
  "最初の一点が、空間に現れた",
  "誰かの記憶が、静かに漂い始める",
  "この空間の空気が、少し変わった",
  "不用品たちが、ここで息を吹き返す",
  "もう、最初の空間ではない",
  "記憶が積み重なっていく",
  "あと少しで、満ちる",
  "すべてが集まった。ここは、もう別の場所だ"
];

let placed = [];
let pendingArtifact = null;

// ── localStorage ──────────────────────────────────────────
function savePlaced() {
  localStorage.setItem('mingeikan_placed', JSON.stringify(placed));
}
function loadPlaced() {
  try {
    const saved = localStorage.getItem('mingeikan_placed');
    return saved ? JSON.parse(saved) : [];
  } catch(e) { return []; }
}

// ── 起動 ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadPlaced().forEach(id => placeArtifact(id, false));
  checkUrlParam();
  document.getElementById('btn-place').addEventListener('click', onPlace);
  document.getElementById('btn-reset').addEventListener('click', onReset);
});

// ── URLパラメータ ─────────────────────────────────────────
function checkUrlParam() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (id && ARTIFACTS[id]) {
    showOverlay(id);
    history.replaceState({}, '', location.pathname);
  }
}

// ── オーバーレイ ──────────────────────────────────────────
function showOverlay(id) {
  const a = ARTIFACTS[id];
  pendingArtifact = id;
  document.getElementById('overlay-name').textContent = a.name;
  document.getElementById('overlay-img').src = a.src;
  document.getElementById('overlay-desc').textContent = a.desc;
  document.getElementById('scan-overlay').classList.remove('hide');
}

function onPlace() {
  if (!pendingArtifact) return;
  placeArtifact(pendingArtifact, true);
  document.getElementById('scan-overlay').classList.add('hide');
  pendingArtifact = null;
}

// ── リセット ──────────────────────────────────────────────
function onReset() {
  if (!confirm('集めた民芸品を全部削除しますか？')) return;
  localStorage.removeItem('mingeikan_placed');
  placed = [];
  document.querySelectorAll('.artifact').forEach(el => el.remove());
  updateUI();
}

// ── 民芸品を配置 ──────────────────────────────────────────
function placeArtifact(id, save = true) {
  const a = ARTIFACTS[id];
  if (!a) return;
  const room = document.getElementById('room');
  const W = room.offsetWidth;
  const H = room.offsetHeight;

  const baseSize = 80 + Math.random() * 60;
  const size = baseSize * (a.scale || 1);
  const x = 0.1 * W + Math.random() * 0.8 * W - size / 2;
  const y = 0.1 * H + Math.random() * 0.7 * H - size / 2;
  const initRot = (Math.random() - 0.5) * 24;

  const el = document.createElement('div');
  el.className = 'artifact';
  el.style.cssText = `left:${x}px; top:${y}px; width:${size}px; height:${size}px;`;
  el.innerHTML = `<img src="${a.src}" alt="${a.name}" title="${a.name}">`;

  // 状態をelに持たせる
  el._state = { rot: initRot, scale: 1 };
  applyTransform(el);

  makeInteractive(el);
  room.appendChild(el);
  placed.push(id);
  if (save) savePlaced();
  updateUI();
}

function applyTransform(el) {
  const { rot, scale } = el._state;
  el.style.transform = `rotate(${rot}deg) scale(${scale})`;
}

// ── ドラッグ＆ダブルタップ拡大縮小 ───────────────────────
function makeInteractive(el) {
  let dragStartX, dragStartY, origLeft, origTop;
  let lastTapTime = 0;
  let tapCount = 0;
  const SCALES = [1, 1.8, 0.5]; // タップするたびに切り替わるサイズ

  let hasMoved = false;

  el.addEventListener('touchstart', e => {
    e.preventDefault();
    el.style.zIndex = Date.now();
    hasMoved = false;
    if (e.touches.length === 1) {
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      origLeft   = parseFloat(el.style.left);
      origTop    = parseFloat(el.style.top);
    }
  }, { passive: false });

  el.addEventListener('touchmove', e => {
    e.preventDefault();
    hasMoved = true;
    if (e.touches.length === 1 && dragStartX !== undefined) {
      el.style.left = (origLeft + e.touches[0].clientX - dragStartX) + 'px';
      el.style.top  = (origTop  + e.touches[0].clientY - dragStartY) + 'px';
    }
  }, { passive: false });

  el.addEventListener('touchend', e => {
    if (hasMoved) return;
    const now = Date.now();
    if (now - lastTapTime < 300) {
      tapCount = (tapCount + 1) % SCALES.length;
      el._state.scale = SCALES[tapCount];
      applyTransform(el);
    }
    lastTapTime = now;
  });

  // マウス用ドラッグ
  el.addEventListener('mousedown', e => {
    e.preventDefault();
    el.style.zIndex = Date.now();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    origLeft   = parseFloat(el.style.left);
    origTop    = parseFloat(el.style.top);

    function onMove(e) {
      el.style.left = (origLeft + e.clientX - dragStartX) + 'px';
      el.style.top  = (origTop  + e.clientY - dragStartY) + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── UI更新 ────────────────────────────────────────────────
function updateUI() {
  const n = placed.length;
  document.getElementById('count-num').textContent = n + ' 点';
  document.getElementById('msg').textContent = MESSAGES[Math.min(n, MESSAGES.length - 1)];
}

// ── 民芸品データ ──────────────────────────────────────────
const ARTIFACTS = {
  "artifact_001": { name: "虎の置物1", src: "images/001.PNG", desc: "", scale: 1 },
  "artifact_002": { name: "脱穀機", src: "images/002.PNG", desc: "", scale: 1 },
  "artifact_003": { name: "木彫りのだるま", src: "images/003.PNG", desc: "", scale: 1 },
  "artifact_004": { name: "塑像", src: "images/004.PNG", desc: "", scale: 1 },
  "artifact_005": { name: "絵画", src: "images/006.PNG", desc: "", scale: 1 },
  "artifact_006": { name: "虎の置物2", src: "images/007.PNG", desc: "", scale: 1 },
  "artifact_007": { name: "日本兵のヘルメット", src: "images/008.PNG", desc: "", scale: 1 },
  "artifact_008": { name: "ガラスのブイ", src: "images/009.PNG", desc: "", scale: 1 },
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

// ── 状態 ──────────────────────────────────────────────────
let placed = [];
let pendingArtifact = null;

// ── localStorageで配置を永続保持 ──────────────────────────
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
  // 保存済みの民芸品を復元
  const savedPlaced = loadPlaced();
  savedPlaced.forEach(id => placeArtifact(id, false));

  // URLパラメータからスキャン検出
  checkUrlParam();

  document.getElementById('btn-place').addEventListener('click', onPlace);
});

// ── URLパラメータからスキャンを検出 ───────────────────────
function checkUrlParam() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (id && ARTIFACTS[id]) {
    showOverlay(id);
    history.replaceState({}, '', location.pathname);
  }
}

// ── 民芸品オーバーレイを表示 ──────────────────────────────
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

// ── 民芸品を空間に配置 ────────────────────────────────────
function placeArtifact(id, save = true) {
  const a = ARTIFACTS[id];
  if (!a) return;
  const room = document.getElementById('room');
  const W = room.offsetWidth;
  const H = room.offsetHeight;

  const base = 80 + Math.random() * 60;
  const size = base * (a.scale || 1);
  const x = 0.1 * W + Math.random() * 0.8 * W - size / 2;
  const y = 0.1 * H + Math.random() * 0.7 * H - size / 2;
  const rot = (Math.random() - 0.5) * 24;

  const el = document.createElement('div');
  el.className = 'artifact';
  el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;transform:rotate(${rot}deg)`;
  el.innerHTML = `<img src="${a.src}" alt="${a.name}" title="${a.name}">`;

  makeDraggable(el);
  room.appendChild(el);
  placed.push(id);
  if (save) savePlaced();
  updateUI();
}

// ── ドラッグ＆ピンチ（マウス＆タッチ） ───────────────────
function makeDraggable(el) {
  let startX, startY, origLeft, origTop;
  let currentScale = 1;
  let pinchStartDist = null;
  let pinchStartScale = 1;
  let origWidth, origHeight;

  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onStart(e) {
    e.preventDefault();
    el.style.zIndex = Date.now();

    if (e.touches && e.touches.length === 2) {
      // ピンチ開始
      pinchStartDist = getDistance(e.touches);
      pinchStartScale = currentScale;
      origWidth  = el.offsetWidth;
      origHeight = el.offsetHeight;
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    } else {
      // 1本指ドラッグ開始
      const p = e.touches ? e.touches[0] : e;
      startX = p.clientX;
      startY = p.clientY;
      origLeft = parseInt(el.style.left);
      origTop  = parseInt(el.style.top);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    }
  }

  function onMove(e) {
    e.preventDefault();

    if (e.touches && e.touches.length === 2 && pinchStartDist) {
      // ピンチで拡大縮小
      const dist = getDistance(e.touches);
      currentScale = Math.min(Math.max(pinchStartScale * (dist / pinchStartDist), 0.2), 5);
      el.style.width  = (origWidth  / pinchStartScale * currentScale) + 'px';
      el.style.height = (origHeight / pinchStartScale * currentScale) + 'px';
    } else {
      // 1本指ドラッグ
      const p = e.touches ? e.touches[0] : e;
      el.style.left = (origLeft + p.clientX - startX) + 'px';
      el.style.top  = (origTop  + p.clientY - startY) + 'px';
    }
  }

  function onEnd(e) {
    if (!e.touches || e.touches.length < 2) {
      pinchStartDist = null;
    }
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  }

  el.addEventListener('mousedown', onStart);
  el.addEventListener('touchstart', onStart, { passive: false });
}

// ── UI更新 ────────────────────────────────────────────────
function updateUI() {
  const n = placed.length;
  document.getElementById('count-num').textContent = n + ' 点';
  const idx = Math.min(n, MESSAGES.length - 1);
  document.getElementById('msg').textContent = MESSAGES[idx];
}

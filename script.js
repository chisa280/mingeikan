// ── 民芸品データ ──────────────────────────────────────────
const ARTIFACTS = {
  "artifact_001": { name: "虎の置物1",       src: "images/001.PNG", desc: "", scale: 1   },
  "artifact_002": { name: "脱穀機",           src: "images/002.PNG", desc: "", scale: 2   },
  "artifact_003": { name: "木彫りのだるま",   src: "images/003.PNG", desc: "", scale: 0.7 },
  "artifact_004": { name: "塑像",             src: "images/004.PNG", desc: "", scale: 3   },
  "artifact_005": { name: "絵画",             src: "images/006.PNG", desc: "", scale: 2.5 },
  "artifact_006": { name: "虎の置物2",       src: "images/007.PNG", desc: "", scale: 1   },
  "artifact_007": { name: "日本兵のヘルメット", src: "images/008.PNG", desc: "", scale: 0.6 },
  "artifact_008": { name: "ガラスのブイ",     src: "images/009.PNG", desc: "", scale: 0.7 },
};

const MESSAGES = [
  "QRコードをスキャンして民芸品を集めよう",
];

// ── 状態 ──────────────────────────────────────────────────
// placed = [{ id, x, y, size, rot }, ...]
let placed = [];
let pendingArtifact = null;

// ── localStorage（位置・サイズ・回転も保存） ──────────────
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
  loadPlaced().forEach(data => placeArtifact(data, false));
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
  const room = document.getElementById('room');
  const W = room.offsetWidth;
  const H = room.offsetHeight;
  const a = ARTIFACTS[pendingArtifact];
  const size = 80 * (a.scale || 1); // ランダムなし・固定サイズ
  const x = 0.1 * W + Math.random() * 0.8 * W - size / 2;
  const y = 0.1 * H + Math.random() * 0.7 * H - size / 2;
  const rot = (Math.random() - 0.5) * 24;

  const data = { id: pendingArtifact, x, y, size, rot };
  placeArtifact(data, true);
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
// data = { id, x, y, size, rot }
function placeArtifact(data, save = true) {
  const a = ARTIFACTS[data.id];
  if (!a) return;
  const room = document.getElementById('room');

  const el = document.createElement('div');
  el.className = 'artifact';
  el.style.cssText = `left:${data.x}px; top:${data.y}px; width:${data.size}px; height:${data.size}px;`;
  el.innerHTML = `<img src="${a.src}" alt="${a.name}" title="${a.name}">`;
  el._state = { rot: data.rot };
  applyTransform(el);

  makeInteractive(el);
  room.appendChild(el);
  placed.push(data);
  if (save) savePlaced();
  updateUI();
}

function applyTransform(el) {
  el.style.transform = `rotate(${el._state.rot}deg)`;
}

// ── ドラッグ ──────────────────────────────────────────────
function makeInteractive(el) {
  let dragStartX, dragStartY, origLeft, origTop;

  el.addEventListener('touchstart', e => {
    e.preventDefault();
    el.style.zIndex = Date.now();
    if (e.touches.length === 1) {
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      origLeft   = parseFloat(el.style.left);
      origTop    = parseFloat(el.style.top);
    }
  }, { passive: false });

  el.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      el.style.left = (origLeft + e.touches[0].clientX - dragStartX) + 'px';
      el.style.top  = (origTop  + e.touches[0].clientY - dragStartY) + 'px';
    }
  }, { passive: false });

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

const addBtn = document.getElementById('addSoundBtn');
const modal = document.getElementById('soundModal');
const close = modal.querySelector('.close');
const form = document.getElementById('soundForm');
const buttonsDiv = document.getElementById('buttons');

addBtn.onclick = () => modal.style.display = 'block';
close.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; };

// --- IndexedDB ---
let db;
function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('soundboard', 1);
    request.onerror = () => reject('Erreur d\'ouverture IndexedDB');
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = e => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('sounds')) {
        db.createObjectStore('sounds', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function addSoundToDB(name, imgFile, audioFile) {
  return new Promise(async (resolve, reject) => {
    // On stocke les blobs directement
    const tx = db.transaction('sounds', 'readwrite');
    const store = tx.objectStore('sounds');
    const req = store.add({ name, img: imgFile, audio: audioFile });
    req.onsuccess = () => resolve();
    req.onerror = () => reject('Erreur d\'ajout dans IndexedDB');
  });
}

function getAllSoundsFromDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sounds', 'readonly');
    const store = tx.objectStore('sounds');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('Erreur de lecture IndexedDB');
  });
}

// Utilitaire pour obtenir un blob URL (plus efficace que base64)
function fileToBlobURL(file) {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      resolve(url);
    } catch (e) {
      reject(e);
    }
  });
}

// Image par défaut (base64 ou URL d'une icône générique)
const DEFAULT_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="50" fill="%23ccc"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="%23666" font-family="Arial">♪</text></svg>';

function deleteSoundFromDB(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sounds', 'readwrite');
    const store = tx.objectStore('sounds');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject('Erreur de suppression dans IndexedDB');
  });
}

function updateSoundInDB(id, name, imgFile, audioFile) {
  return new Promise(async (resolve, reject) => {
    let img = imgFile;
    let audio = audioFile;
    if (!imgFile) {
      // On récupère l'ancien son pour garder l'image si non modifiée
      const tx = db.transaction('sounds', 'readonly');
      const store = tx.objectStore('sounds');
      const req = store.get(id);
      req.onsuccess = () => {
        img = req.result.img;
        if (!audioFile) audio = req.result.audio;
        const tx2 = db.transaction('sounds', 'readwrite');
        const store2 = tx2.objectStore('sounds');
        const req2 = store2.put({ id, name, img, audio });
        req2.onsuccess = () => resolve();
        req2.onerror = () => reject('Erreur de modification dans IndexedDB');
      };
      req.onerror = () => reject('Erreur de lecture pour édition');
      return;
    }
    const tx = db.transaction('sounds', 'readwrite');
    const store = tx.objectStore('sounds');
    const req = store.put({ id, name, img, audio });
    req.onsuccess = () => resolve();
    req.onerror = () => reject('Erreur de modification dans IndexedDB');
  });
}

// Palette de couleurs pour les sons sans image
const BG_COLORS = [
  '#FFB300', '#FF7043', '#AB47BC', '#29B6F6', '#66BB6A', '#EC407A', '#8D6E63', '#789262', '#FFA726', '#26A69A'
];
function getColorForName(name) {
  // Génère un index basé sur le nom pour une couleur stable
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

function createSoundButton(name, imgSrc, audioSrc, id, hasImage) {
  const audio = new Audio(audioSrc);
  const btn = document.createElement('div');
  btn.className = 'button-sound';
  if (!hasImage) {
    btn.style.background = getColorForName(name);
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
  }
  if (hasImage) {
    btn.innerHTML = `<img src="${imgSrc}" alt="${name}">\n                    <p>${name}</p>`;
  } else {
    btn.innerHTML = `<div style='width:80px;height:80px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:#fff;user-select:none;'>♪</div><p>${name}</p>`;
  }
  // Suppression
  const delBtn = document.createElement('button');
  delBtn.textContent = '🗑️';
  delBtn.title = 'Supprimer';
  delBtn.style.marginTop = '0.5rem';
  delBtn.onclick = async (e) => {
    e.stopPropagation();
    await deleteSoundFromDB(id);
    btn.remove();
  };
  btn.appendChild(delBtn);
  btn.onclick = () => {
    if (!audio.paused && !audio.ended) {
      audio.pause();
      audio.currentTime = 0;
      btn.classList.remove('playing');
    } else {
      audio.currentTime = 0;
      audio.play();
      btn.classList.add('playing');
      audio.onended = () => btn.classList.remove('playing');
    }
  };
  buttonsDiv.appendChild(btn);
}

// --- Initialisation et chargement ---
window.addEventListener('DOMContentLoaded', async () => {
  await openDB();
  const sounds = await getAllSoundsFromDB();
  sounds.forEach(sound => {
    const hasImage = !!sound.img;
    const imgURL = hasImage ? URL.createObjectURL(sound.img) : null;
    const audioURL = URL.createObjectURL(sound.audio);
    createSoundButton(sound.name, imgURL, audioURL, sound.id, hasImage);
  });
});

form.onsubmit = async e => {
  e.preventDefault();
  const name = document.getElementById('soundName').value;
  const imgFile = document.getElementById('soundImage').files[0];
  const audioFile = document.getElementById('soundFile').files[0];
  if (!name || !audioFile) return alert('Le nom et le fichier audio sont requis');
  await addSoundToDB(name, imgFile || null, audioFile);
  const hasImage = !!imgFile;
  const imgURL = hasImage ? URL.createObjectURL(imgFile) : null;
  const audioURL = URL.createObjectURL(audioFile);
  createSoundButton(name, imgURL, audioURL, undefined, hasImage);
  form.reset();
  modal.style.display = 'none';
};

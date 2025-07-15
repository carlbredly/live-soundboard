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

// Fonction pour créer un bouton-son à partir de données (base64 ou URL)
function createSoundButton(name, imgSrc, audioSrc) {
  const audio = new Audio(audioSrc);
  const btn = document.createElement('div');
  btn.className = 'button-sound';
  btn.innerHTML = `<img src="${imgSrc}" alt="${name}">\n                    <p>${name}</p>`;
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
    // On crée des blob URLs à la volée
    const imgURL = URL.createObjectURL(sound.img);
    const audioURL = URL.createObjectURL(sound.audio);
    createSoundButton(sound.name, imgURL, audioURL);
  });
});

form.onsubmit = async e => {
  e.preventDefault();

  const name = document.getElementById('soundName').value;
  const imgFile = document.getElementById('soundImage').files[0];
  const audioFile = document.getElementById('soundFile').files[0];
  if (!name || !imgFile || !audioFile) return alert('Tous les champs sont requis');

  await addSoundToDB(name, imgFile, audioFile);

  // Création du bouton avec les URLs temporaires pour usage immédiat
  const imgURL = URL.createObjectURL(imgFile);
  const audioURL = URL.createObjectURL(audioFile);
  createSoundButton(name, imgURL, audioURL);

  form.reset();
  modal.style.display = 'none';
};

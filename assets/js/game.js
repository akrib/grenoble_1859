// Chargement ou création du personnage
function loadCharacter() {
  let char = localStorage.getItem("character");
  if (!char) {
    char = {
      name: "Aventurier",
      level: 1,
      xp: 0,
      hp: 20,
      gold: 0,
      inventory: [],
      position: { x: 0, y: 0 } // coordonnées de départ
    };
    localStorage.setItem("character", JSON.stringify(char));
  } else {
    char = JSON.parse(char);
  }
  return char;
}

function saveCharacter(char) {
  localStorage.setItem("character", JSON.stringify(char));
}urn char;
}

function updateCharacterSheet(char) {
  document.getElementById("char-name").textContent = char.name;
  document.getElementById("char-level").textContent = char.level;
  document.getElementById("char-xp").textContent = char.xp;
  document.getElementById("char-hp").textContent = char.hp;
  document.getElementById("char-gold").textContent = char.gold;

  // Position
  const posEl = document.getElementById("char-position");
  if (posEl) {
    posEl.textContent = `(${char.position.x}, ${char.position.y})`;
  }

  // Inventaire
  const inv = document.getElementById("char-inventory");
  inv.innerHTML = "";
  char.inventory.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    inv.appendChild(li);
  });
}


// Exemple simple de rendu mini-map
function drawMinimap() {
  const canvas = document.getElementById("map-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Exemple : joueur au centre
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, 5, 0, 2 * Math.PI);
  ctx.fill();
}

function getLevelId(char) {
  return `level_${char.position.x}_${char.position.y}`;
}

function movePlayer(char, dx, dy) {
  char.position.x += dx;
  char.position.y += dy;
  saveCharacter(char);

  const levelId = getLevelId(char);
  // Exemple : redirige vers level_-23_42.html
  window.location.href = `${levelId}.html`;
}
// Au chargement
document.addEventListener("DOMContentLoaded", () => {
  const char = loadCharacter();
  updateCharacterSheet(char);
  drawMinimap();
});

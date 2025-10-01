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


function drawMinimap() {
  const canvas = document.getElementById("map-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const size = 20; // taille de chaque carré
  const gridSize = 3; // 3x3 autour du joueur
  const half = Math.floor(gridSize / 2);

  const char = loadCharacter();
  const x0 = char.position.x;
  const y0 = char.position.y;
  const z0 = char.position.z || 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const lx = x0 + dx;
      const ly = y0 + dy;
      const levelId = `level_${lx}_${ly}_${z0}`;
      const level = levels[levelId];

      let color = "#000"; // par défaut noir si la case n'existe pas
      if (level) {
        switch(level.type) {
          case "ville": color = "gray"; break;
          case "foret": color = "green"; break;
          case "eau": color = "blue"; break;
          case "plaine": color = "#7cfc00"; break; // vert clair pour plaine
        }
      }

      // Calcul position dans la mini-map
      const px = (dx + half) * size;
      const py = (dy + half) * size;

      ctx.fillStyle = color;
      ctx.fillRect(px, py, size, size);

      // Joueur au centre
      if (dx === 0 && dy === 0) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(px + 4, py + 4, size - 8, size - 8);
      }
    }
  }
}

function getLevelId(char) {
  return `level_${char.position.x}_${char.position.y}`;
}

function movePlayer(char, dx, dy, dz = 0) {
  if (!char.position.z) char.position.z = 0; // ajouter z si absent

  char.position.x += dx;
  char.position.y += dy;
  char.position.z += dz;
  saveCharacter(char);

  const levelId = `level_${char.position.x}_${char.position.y}_${char.position.z}`;
  window.location.href = `${levelId}.html`;
}

// Au chargement
document.addEventListener("DOMContentLoaded", () => {
  const char = loadCharacter();
  updateCharacterSheet(char);
  drawMinimap();
});

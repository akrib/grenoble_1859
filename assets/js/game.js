// ----------------------
// Gestion du personnage
// ----------------------
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
      position: { x: 0, y: 0, z: 0 }
    };
    localStorage.setItem("character", JSON.stringify(char));
  } else {
    char = JSON.parse(char);
  }
  return char;
}

function saveCharacter(char) {
  localStorage.setItem("character", JSON.stringify(char));
}

function updateCharacterSheet(char) {
  const el = document.getElementById("character-sheet");
  if (!el) return;
  el.innerHTML = `
    <h2>${char.name}</h2>
    <p>HP: ${char.hp}</p>
    <p>XP: ${char.xp}</p>
    <p>Or: ${char.gold}</p>
    <p>Niveau: ${char.level}</p>
    <p>Position: (${char.position.x}, ${char.position.y}, ${char.position.z})</p>
    <p>Inventaire: ${char.inventory.join(", ") || "Vide"}</p>
  `;
}

// ----------------------
// Gestion des niveaux
// ----------------------
function getLevelDir(x) {
  return `_site/assets/levels/x_${x}`;
}

async function loadYAMLLevel(levelId, x) {
  const dir = getLevelDir(x);
  const url = `${dir}/${levelId}.yml`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    return jsyaml.load(text);
  } catch (e) {
    console.error("Erreur chargement level:", levelId, e);
    return null;
  }
}

async function loadSurroundingLevels(char) {
  const x0 = char.position.x;
  const y0 = char.position.y;
  const z0 = char.position.z || 0;

  const dirs = [
    [0,0,0],[0,1,0],[1,1,0],[1,0,0],[1,-1,0],[0,-1,0],[-1,-1,0],[-1,0,0],[-1,1,0],
    [0,0,-1],[0,0,1]
  ];

  const levels = {};
  for (const [dx, dy, dz] of dirs) {
    const x = x0 + dx;
    const y = y0 + dy;
    const z = z0 + dz;
    const levelId = `level_${x}_${y}_${z}`;
    const lvl = await loadYAMLLevel(levelId, x);
    if (lvl) levels[levelId] = lvl;
  }
  return levels;
}

// ----------------------
// Navigation et déplacements
// ----------------------
const directions = {
  n:  [0, 1, 0, "Nord"],
  ne: [1, 1, 0, "Nord-Est"],
  e:  [1, 0, 0, "Est"],
  se: [1,-1, 0, "Sud-Est"],
  s:  [0,-1, 0, "Sud"],
  sw: [-1,-1,0, "Sud-Ouest"],
  w:  [-1,0, 0, "Ouest"],
  nw: [-1,1, 0, "Nord-Ouest"],
  up: [0,0, 1, "Monter"],
  down:[0,0,-1,"Descendre"]
};

async function renderLevel(char) {
  const levels = await loadSurroundingLevels(char);
  const levelId = `level_${char.position.x}_${char.position.y}_${char.position.z}`;
  const level = levels[levelId];

  // Affichage titre et description
  const titleEl = document.getElementById("level-title");
  const descEl  = document.getElementById("level-description");
  if (level) {
    titleEl.textContent = level.title;
    descEl.textContent = level.description;
  } else {
    titleEl.textContent = "Salle inconnue";
    descEl.textContent = "Il n'y a rien ici...";
  }

  // Navigation
  const nav = document.getElementById("navigation");
  nav.innerHTML = "";
  if (level && level.exits) {
    for (let dir in directions) {
      if (level.exits[dir]) {
        const [dx, dy, dz, label] = directions[dir];
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.onclick = async () => {
          char.position.x += dx;
          char.position.y += dy;
          char.position.z += dz;
          saveCharacter(char);
          updateCharacterSheet(char);
          await renderLevel(char);
          await drawMinimap(char);
        };
        nav.appendChild(btn);
      }
    }
  }
}

// ----------------------
// Mini-map
// ----------------------
async function drawMinimap(char) {
  const surrounding = await loadSurroundingLevels(char);

  const canvas = document.getElementById("map-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const size = 20;
  const half = 1; // 3x3 mini-map
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let dy=-half; dy<=half; dy++) {
    for (let dx=-half; dx<=half; dx++) {
      const levelId = `level_${char.position.x+dx}_${char.position.y+dy}_${char.position.z}`;
      const level = surrounding[levelId];

      let color = "#000";
      if (level) {
        switch(level.type) {
          case "ville": color="gray"; break;
          case "foret": color="green"; break;
          case "eau": color="blue"; break;
          case "plaine": color="#7cfc00"; break;
        }
      }

      const px = (dx + half)*size;
      const py = (dy + half)*size;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, size, size);

      // Joueur au centre
      if (dx===0 && dy===0) {
        ctx.fillStyle="yellow";
        ctx.fillRect(px+4, py+4, size-8, size-8);

        if (level.exits && level.exits.up) {
          ctx.fillStyle="white";
          ctx.beginPath();
          ctx.moveTo(px+size/2, py+5);
          ctx.lineTo(px+size/2-3, py+10);
          ctx.lineTo(px+size/2+3, py+10);
          ctx.closePath();
          ctx.fill();
        }
        if (level.exits && level.exits.down) {
          ctx.fillStyle="white";
          ctx.beginPath();
          ctx.moveTo(px+size/2, py+size-5);
          ctx.lineTo(px+size/2-3, py+size-10);
          ctx.lineTo(px+size/2+3, py+size-10);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
}

// ----------------------
// Initialisation
// ----------------------
document.addEventListener("DOMContentLoaded", async () => {
  const char = loadCharacter();
  updateCharacterSheet(char);
  await renderLevel(char);
  await drawMinimap(char);
});

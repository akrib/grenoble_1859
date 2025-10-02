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
  // URL absolue basée sur l'origine du site
  //return window.location.origin + "/grenoble_1859/assets/levels/x_" + x;
  return `${BASE_URL}/assets/levels/x_${x}`;

}

async function loadYAMLLevel(levelId, x) {
  const dir = getLevelDir(x);
  const url = `${dir}/${levelId}.yml`; // absolu par rapport à la racine
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Level introuvable:", url);
      return null;
    }
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
async function drawMinimap(player, surroundingLevels) {
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  const size = 20; // taille d'une case
  const halfMap = 1; // pour une mini-map 3x3 centrée sur le joueur

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Boucle sur les 3x3 cases autour du joueur
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const levelX = player.position.x + dx;
      const levelY = player.position.y + dy;
      const levelZ = player.position.z;

      const levelId = `level_${levelX}_${levelY}_${levelZ}`;
      const level = surroundingLevels[levelId];

      const px = (dx + halfMap) * size;
      const py = (halfMap - dy) * size; // <- inversion Y

      // Fond selon biome
      if (level && level.type) {
        switch(level.type) {
          case "ville":
            ctx.fillStyle = "grey";
            break;
          case "foret":
            ctx.fillStyle = "green";
            break;
          case "eau":
            ctx.fillStyle = "blue";
            break;
          case "plaine":
          default:
            ctx.fillStyle = "#a0d080";
        }
      } else {
        ctx.fillStyle = "#333"; // level inconnu
      }

      ctx.fillRect(px, py, size, size);
      ctx.strokeStyle = "#000";
      ctx.strokeRect(px, py, size, size);

      // Joueur au centre
      if (dx === 0 && dy === 0) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(px+4, py+4, size-8, size-8);

        if (level && level.exits) {
          // flèche up
          if (level.exits.up) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(px + size/2, py + 3);
            ctx.lineTo(px + size/2 - 3, py + 10);
            ctx.lineTo(px + size/2 + 3, py + 10);
            ctx.closePath();
            ctx.fill();
          }
          // flèche down
          if (level.exits.down) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(px + size/2, py + size - 3);
            ctx.lineTo(px + size/2 - 3, py + size - 10);
            ctx.lineTo(px + size/2 + 3, py + size - 10);
            ctx.closePath();
            ctx.fill();
          }
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

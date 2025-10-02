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
      gold: 0,
      inventory: [],

      // --- Caractéristiques (bonus appliqués aux jets)
      stats: {
        force: 1,
        dex: 1,
        con: 0,
        int: 0,
        sag: 0,
        cha: 0
      },

      // --- Compétences clés (COC)
      skills: {
        corpsACorps: 2,
        distance: 1,
        magie: 0,
        discretion: 1,
        perception: 1
      },

      // --- Combat
      hpMax: 20,
      hp: 20,
      defense: 12,      // DEF = 10 + Dex + bonus armure
      initiative: 1,    // mod Dex
      attackBonus: 3,   // mod Force + progression
      damageDice: "1d8",
      damageBonus: 1
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
    <p><strong>Niveau:</strong> ${char.level} (${char.xp} XP)</p>
    <p><strong>Or:</strong> ${char.gold}</p>
    <p><strong>PV:</strong> ${char.hp}/${char.hpMax}</p>
    <p><strong>Défense:</strong> ${char.defense}</p>
    <p><strong>Initiative:</strong> +${char.initiative}</p>
    <p><strong>Attaque:</strong> +${char.attackBonus} (${char.damageDice}+${char.damageBonus})</p>
    
    <h3>Caractéristiques</h3>
    <ul>
      <li>Force: ${char.stats.force}</li>
      <li>Dextérité: ${char.stats.dex}</li>
      <li>Constitution: ${char.stats.con}</li>
      <li>Intelligence: ${char.stats.int}</li>
      <li>Sagesse: ${char.stats.sag}</li>
      <li>Charisme: ${char.stats.cha}</li>
    </ul>

    <h3>Compétences</h3>
    <ul>
      <li>Corps-à-corps: +${char.skills.corpsACorps}</li>
      <li>Distance: +${char.skills.distance}</li>
      <li>Magie: +${char.skills.magie}</li>
      <li>Discrétion: +${char.skills.discretion}</li>
      <li>Perception: +${char.skills.perception}</li>
    </ul>

    <h3>Inventaire</h3>
    <p>${char.inventory.join(", ") || "Vide"}</p>
    
    <p><em>Position: (${char.position.x}, ${char.position.y}, ${char.position.z})</em></p>
  `;
}


// ----------------------
// Gestion des niveaux
// ----------------------
function getLevelDir(x) {
  return `${BASE_URL}/assets/levels/x_${x}`;
}

async function loadYAMLLevel(levelId, x) {
  const dir = getLevelDir(x);
  const url = `${dir}/${levelId}.yml`;
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

  const titleEl = document.getElementById("level-title");
  const descEl  = document.getElementById("level-description");
  if (level) {
    titleEl.textContent = level.title;
    descEl.textContent = level.description;
  } else {
    titleEl.textContent = "Salle inconnue";
    descEl.textContent = "Il n'y a rien ici...";
  }

  const dirs = ["n","ne","e","se","s","sw","w","nw","up","down"];
  dirs.forEach(dir => {
    const btn = document.querySelector(`.nav-btn[data-dir="${dir}"]`);
    if (!btn) return;

    if (level && level.exits && level.exits[dir]) {
      btn.disabled = false;
      btn.onclick = async () => {
        switch(dir) {
          case "n": char.position.y += 1; break;
          case "ne": char.position.y += 1; char.position.x += 1; break;
          case "e": char.position.x += 1; break;
          case "se": char.position.y -= 1; char.position.x += 1; break;
          case "s": char.position.y -= 1; break;
          case "sw": char.position.y -= 1; char.position.x -= 1; break;
          case "w": char.position.x -= 1; break;
          case "nw": char.position.y += 1; char.position.x -= 1; break;
          case "up": char.position.z += 1; break;
          case "down": char.position.z -= 1; break;
        }
        saveCharacter(char);
        updateCharacterSheet(char);
        await renderLevel(char);
        const newLevels = await loadSurroundingLevels(char);
        await drawMinimap(char, newLevels);
      };
    } else {
      btn.disabled = true;
      btn.onclick = null;
    }
  });

  await drawMinimap(char, levels);

if (level && level.type) {
  maybeTriggerEncounter(level.type, char);
}
  
}

// ----------------------
// Mini-map améliorée
// ----------------------
async function drawMinimap(player, surroundingLevels) {
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  const size = 20;
  const halfMap = 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const levelX = player.position.x + dx;
      const levelY = player.position.y + dy;
      const levelZ = player.position.z;

      const levelId = `level_${levelX}_${levelY}_${levelZ}`;
      const level = surroundingLevels[levelId];

      const px = (dx + halfMap) * size;
      const py = (halfMap - dy) * size;

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
            ctx.fillStyle = "#a0d080";
            break;
          case "montagne":
            ctx.fillStyle = "#888"; // gris foncé
            break;
          case "desert":
            ctx.fillStyle = "#edc9af"; // sable clair
            break;
          case "route":
            ctx.fillStyle = "#b5651d"; // marron route
            break;
          default:
            ctx.fillStyle = "#333";
        }
      } else {
        ctx.fillStyle = "#333";
      }

      ctx.fillRect(px, py, size, size);
      ctx.strokeStyle = "#000";
      ctx.strokeRect(px, py, size, size);

      if (dx === 0 && dy === 0) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(px+4, py+4, size-8, size-8);

        if (level && level.exits) {
          if (level.exits.up) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(px + size/2, py + 3);
            ctx.lineTo(px + size/2 - 3, py + 10);
            ctx.lineTo(px + size/2 + 3, py + 10);
            ctx.closePath();
            ctx.fill();
          }
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
});

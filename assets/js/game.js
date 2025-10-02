// ----------------------
// Gestion du personnage
// ----------------------
function loadCharacter() {
  const defaultChar = {
    name: "Aventurier",
    level: 1,
    xp: 0,
    gold: 0,
    inventory: [],
    position: { x: 0, y: 0, z: 0 },

    // Caractéristiques COC
    stats: { force: 1, dex: 1, con: 0, int: 0, sag: 0, cha: 0 },

    // Compétences
    skills: { corpsACorps: 2, distance: 1, magie: 0, discretion: 1, perception: 1 },

    // Combat
    hpMax: 20,
    hp: 20,
    defense: 12,
    initiative: 1,
    attackBonus: 3,
    damageDice: "1d8",
    damageBonus: 1
  };

  let char = localStorage.getItem("character");
  if (!char) {
    char = defaultChar;
    localStorage.setItem("character", JSON.stringify(char));
  } else {
    char = JSON.parse(char);
    char = { ...defaultChar, ...char };
    char.stats = { ...defaultChar.stats, ...char.stats };
    char.skills = { ...defaultChar.skills, ...char.skills };
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

// ----------------------
// Combat
// ----------------------
const combatLogEl = document.getElementById("combat-log");
const encounterButtonsEl = document.getElementById("encounter-buttons");

function logCombat(message) {
  if (!combatLogEl) return;
  const p = document.createElement("p");
  p.textContent = message;
  combatLogEl.appendChild(p);
  combatLogEl.scrollTop = combatLogEl.scrollHeight;
}

function rollDice(diceStr) {
  const [count, sides] = diceStr.split("d").map(Number);
  let total = 0;
  for(let i=0;i<count;i++) total += Math.floor(Math.random()*sides)+1;
  return total;
}

async function runCombat(player, monster) {
  logCombat(`Un ${monster.name} apparaît !`);
  encounterButtonsEl.style.display = "none";

  while(player.hp > 0 && monster.hp > 0) {
    const playerDamage = rollDice(player.damageDice) + player.damageBonus;
    monster.hp -= playerDamage;
    logCombat(`${player.name} inflige ${playerDamage} dégâts à ${monster.name} (${Math.max(monster.hp,0)} PV restants)`);

    if(monster.hp <= 0) {
      logCombat(`${monster.name} est vaincu !`);
      player.xp += monster.xp;
      logCombat(`${player.name} gagne ${monster.xp} XP !`);
      updateCharacterSheet(player);
      break;
    }

    const monsterDamage = rollDice(monster.damageDice) + monster.damageBonus;
    player.hp -= monsterDamage;
    logCombat(`${monster.name} attaque ${player.name} et inflige ${monsterDamage} dégâts (${Math.max(player.hp,0)} PV restants)`);

    if(player.hp <= 0) {
      logCombat(`${player.name} est vaincu !`);
      break;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  saveCharacter(player);
}

// ----------------------
// Gestion des rencontres
// ----------------------
async function maybeTriggerEncounter(levelType, char) {
  // Exemple : 20% chance de rencontre en plaine ou foret
  if(!["plaine","foret","montagne"].includes(levelType)) return;
  if(Math.random() > 0.2) return;

  const monster = {
    name: "Gobelin",
    hp: 10,
    damageDice: "1d6",
    damageBonus: 1,
    xp: 5
  };

  // Affichage des boutons combattre/fuir
  encounterButtonsEl.innerHTML = "";
  encounterButtonsEl.style.display = "block";

  const fightBtn = document.createElement("button");
  fightBtn.textContent = "Combattre";
  fightBtn.onclick = async () => {
    await runCombat(char, monster);
    encounterButtonsEl.style.display = "none";
    await renderLevel(char);
  };
  encounterButtonsEl.appendChild(fightBtn);

  const fleeBtn = document.createElement("button");
  fleeBtn.textContent = "Fuir";
  fleeBtn.onclick = async () => {
    logCombat(`${char.name} fuit le combat !`);
    encounterButtonsEl.style.display = "none";
  };
  encounterButtonsEl.appendChild(fleeBtn);
}

// ----------------------
// Affichage du niveau et navigation
// ----------------------
async function renderLevel(char) {
  const levels = await loadSurroundingLevels(char);
  const levelId = `level_${char.position.x}_${char.position.y}_${char.position.z}`;
  const level = levels[levelId];

  const titleEl = document.getElementById("level-title");
  const descEl  = document.getElementById("level-description");
  if(level) {
    titleEl.textContent = level.title;
    descEl.textContent = level.description;
  } else {
    titleEl.textContent = "Salle inconnue";
    descEl.textContent = "Il n'y a rien ici...";
  }

  const dirs = ["n","ne","e","se","s","sw","w","nw","up","down"];
  dirs.forEach(dir => {
    const btn = document.querySelector(`.nav-btn[data-dir="${dir}"]`);
    if(!btn) return;

    if(level && level.exits && level.exits[dir]) {
      btn.disabled = false;
      btn.onclick = async () => {
        const [dx, dy, dz] = directions[dir];
        char.position.x += dx;
        char.position.y += dy;
        char.position.z += dz;
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

  if(level && level.type) {
    maybeTriggerEncounter(level.type, char);
  }
}

// ----------------------
// Mini-map
// ----------------------
async function drawMinimap(player, surroundingLevels) {
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  const size = 20;
  const halfMap = 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for(let dy=-1; dy<=1; dy++) {
    for(let dx=-1; dx<=1; dx++) {
      const levelX = player.position.x + dx;
      const levelY = player.position.y + dy;
      const levelZ = player.position.z;

      const levelId = `level_${levelX}_${levelY}_${levelZ}`;
      const level = surroundingLevels[levelId];

      const px = (dx + halfMap)*size;
      const py = (halfMap - dy)*size;

      if(level && level.type) {
        switch(level.type) {
          case "ville": ctx.fillStyle="grey"; break;
          case "foret": ctx.fillStyle="green"; break;
          case "eau": ctx.fillStyle="blue"; break;
          case "plaine": ctx.fillStyle="#a0d080"; break;
          case "montagne": ctx.fillStyle="#888"; break;
          case "desert": ctx.fillStyle="#edc9af"; break;
          case "route": ctx.fillStyle="#b5651d"; break;
          default: ctx.fillStyle="#333";
        }
      } else ctx.fillStyle="#333";

      ctx.fillRect(px, py, size, size);
      ctx.strokeStyle="#000";
      ctx.strokeRect(px, py, size, size);

      if(dx===0 && dy===0) {
        ctx.fillStyle="yellow";
        ctx.fillRect(px+4, py+4, size-8, size-8);
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

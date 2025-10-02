// gameloader.js
import { loadCharacter, updateCharacterSheet, saveCharacter } from './character.js';
import { drawMinimap } from './minimap.js';
import { directions } from './move.js';
import { maybeTriggerEncounter } from './encounter.js';

const BASE_URL="https://github.com/akrib/grenoble_1859"

async function loadYAMLLevel(levelId, x) {
  const url = `${BASE_URL}/assets/levels/x_${x}/${levelId}.yml`;
  try {
    const res = await fetch(url);
    if(!res.ok) return null;
    const text = await res.text();
    return jsyaml.load(text);
  } catch(e) { console.error(e); return null; }
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
  for(const [dx,dy,dz] of dirs) {
    const x = x0+dx;
    const y = y0+dy;
    const z = z0+dz;
    const levelId = `level_${x}_${y}_${z}`;
    const lvl = await loadYAMLLevel(levelId, x);
    if(lvl) levels[levelId] = lvl;
  }
  return levels;
}

export async function renderLevel(char) {
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

  Object.keys(directions).forEach(dir => {
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
    maybeTriggerEncounter(level.type, char, updateCharacterSheet, renderLevel);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const char = loadCharacter();
  updateCharacterSheet(char);
  await renderLevel(char);
});

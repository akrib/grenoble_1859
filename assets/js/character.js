// character.js
export function loadCharacter() {
  const defaultChar = {
    name: "Aventurier",
    level: 1,
    xp: 0,
    gold: 0,
    inventory: [],
    position: { x: 0, y: 0, z: 0 },

    stats: { force: 1, dex: 1, con: 0, int: 0, sag: 0, cha: 0 },
    skills: { corpsACorps: 2, distance: 1, magie: 0, discretion: 1, perception: 1 },

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

export function saveCharacter(char) {
  localStorage.setItem("character", JSON.stringify(char));
}

export function updateCharacterSheet(char) {
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

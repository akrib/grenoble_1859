// Chargement ou création du personnage
function loadCharacter() {
  let char = localStorage.getItem("character");
  if (!char) {
    char = {
      name: "Aventurier",
      level: 1,
      hp: 20,
      gold: 0
    };
    localStorage.setItem("character", JSON.stringify(char));
  } else {
    char = JSON.parse(char);
  }
  return char;
}

// Mise à jour de la fiche
function updateCharacterSheet(char) {
  document.getElementById("char-name").textContent = char.name;
  document.getElementById("char-level").textContent = char.level;
  document.getElementById("char-hp").textContent = char.hp;
  document.getElementById("char-gold").textContent = char.gold;
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

// Au chargement
document.addEventListener("DOMContentLoaded", () => {
  const char = loadCharacter();
  updateCharacterSheet(char);
  drawMinimap();
});

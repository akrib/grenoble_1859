document.addEventListener("DOMContentLoaded", () => {
  const continueBtn = document.getElementById("continue-game");
  const newBtn = document.getElementById("new-game");

  // Vérifie s'il existe une sauvegarde
  const saved = localStorage.getItem("character");
  if (saved) {
    continueBtn.style.display = "inline-block";
  }

  // Nouvelle partie
  newBtn.addEventListener("click", () => {
    const char = {
      name: "Aventurier",
      level: 1,
      hp: 20,
      gold: 0
    };
    localStorage.setItem("character", JSON.stringify(char));
    window.location.href = "{{ '/niveau1/' | relative_url }}"; // redirige vers le premier niveau
  });

  // Continuer
  continueBtn.addEventListener("click", () => {
    window.location.href = "{{ '/niveau1/' | relative_url }}";
  });
});

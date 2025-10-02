// encounter.js
import { runCombat, Combatant, logCombat, encounterButtonsEl } from './combat.js';
import { saveCharacter } from './character.js';

export const encounterTables = {
  plaine: [
    () => new Combatant("Loup affamé", 8, 3, 12, "1d6", 1, 5, ["Peau de loup"]),
    () => new Combatant("Brigand", 12, 4, 13, "1d8", 2, 8, ["Dague"])
  ],
  foret: [
    () => new Combatant("Gobelin", 10, 3, 12, "1d6", 1, 5, ["Petit sac"]),
    () => new Combatant("Ours", 20, 5, 14, "1d10", 3, 10, ["Griffe d'ours"])
  ]
};

export function maybeTriggerEncounter(biome, char, updateUI, renderLevel) {
  if(!encounterTables[biome]) return;
  if(Math.random() > 0.3) return;

  const monster = encounterTables[biome][Math.floor(Math.random() * encounterTables[biome].length)]();

  encounterButtonsEl.innerHTML = "";
  encounterButtonsEl.style.display = "block";

  const fightBtn = document.createElement("button");
  fightBtn.textContent = "Combattre";
  fightBtn.onclick = async () => {
    const player = new Combatant(char.name, char.hp, char.attackBonus, char.defense, char.damageDice, char.damageBonus, char.xp, char.inventory);
    await runCombat(player, monster, () => updateUI(player, monster));
    char.hp = player.hp;
    char.xp = player.xp;
    char.inventory = player.inventory;
    saveCharacter(char);
    encounterButtonsEl.style.display = "none";
    await renderLevel(char);
  };
  encounterButtonsEl.appendChild(fightBtn);

  const fleeBtn = document.createElement("button");
  fleeBtn.textContent = "Fuir";
  fleeBtn.onclick = () => {
    logCombat(`${char.name} fuit le combat !`);
    encounterButtonsEl.style.display = "none";
  };
  encounterButtonsEl.appendChild(fleeBtn);
}

// combat.js
const encounterTables = {
  plaine: [
    () => new CombatSystem.Combatant("Loup affamé", 8, 3, 12, "1d6", 1),
    () => new CombatSystem.Combatant("Brigand", 12, 4, 13, "1d8", 2)
  ],
  foret: [
    () => new CombatSystem.Combatant("Gobelin", 10, 3, 12, "1d6", 1),
    () => new CombatSystem.Combatant("Ours", 20, 5, 14, "1d10", 3)
  ],
  ville: [
    () => new CombatSystem.Combatant("Voleur", 10, 4, 13, "1d6", 2)
  ],
  montagne: [
    () => new CombatSystem.Combatant("Orc", 15, 5, 14, "1d8", 2),
    () => new CombatSystem.Combatant("Aigle géant", 18, 6, 15, "1d10", 3)
  ],
  desert: [
    () => new CombatSystem.Combatant("Serpent géant", 14, 5, 13, "1d8", 2)
  ],
  eau: [
    () => new CombatSystem.Combatant("Crocodile", 16, 5, 14, "1d10", 3)
  ]
};

function maybeTriggerEncounter(biome, char) {
  // 30% de chance de rencontre
  if (Math.random() < 0.3 && encounterTables[biome]) {
    const enemies = [ encounterTables[biome][Math.floor(Math.random() * encounterTables[biome].length)]() ];

    // Fenêtre de choix
    if (confirm(`Un ${enemies[0].name} apparaît ! Voulez-vous combattre ?`)) {
      const player = new CombatSystem.Combatant(
        char.name,
        char.hp,
        char.attackBonus,
        char.defense,
        char.damageDice,
        char.damageBonus
      );
      CombatSystem.startCombat(player, enemies);
      char.hp = player.hp; // mise à jour des PV restants
      saveCharacter(char);
    } else {
      console.log("Vous fuyez...");
    }
  }
}
// Conteneur log
const combatLogEl = document.getElementById("combat-log");

// Ajoute un message au log
function logCombat(message) {
  if (!combatLogEl) return;
  const p = document.createElement("p");
  p.textContent = message;
  combatLogEl.appendChild(p);
  combatLogEl.scrollTop = combatLogEl.scrollHeight; // scroll automatique
}

// Combat automatique entre player et monstre
async function runCombat(player, monster) {
  logCombat(`Un ${monster.name} apparaît !`);

  while(player.hp > 0 && monster.hp > 0) {
    // Tour joueur
    const playerDamage = rollDice(player.damageDice) + player.damageBonus;
    monster.hp -= playerDamage;
    logCombat(`${player.name} inflige ${playerDamage} points de dégâts à ${monster.name} (${Math.max(monster.hp,0)} PV restants)`);

    if(monster.hp <= 0) {
      logCombat(`${monster.name} est vaincu !`);
      player.xp += monster.xp;
      logCombat(`${player.name} gagne ${monster.xp} XP !`);
      updateCharacterSheet(player);
      break;
    }

    // Tour monstre
    const monsterDamage = rollDice(monster.damageDice) + monster.damageBonus;
    player.hp -= monsterDamage;
    logCombat(`${monster.name} attaque ${player.name} et inflige ${monsterDamage} dégâts (${Math.max(player.hp,0)} PV restants)`);

    if(player.hp <= 0) {
      logCombat(`${player.name} est vaincu !`);
      break;
    }

    // Petite pause pour lisibilité
    await new Promise(r => setTimeout(r, 500));
  }
}

// Fonction simple pour lancer un dé type "1d8", "2d6"...
function rollDice(diceStr) {
  const [count, sides] = diceStr.split("d").map(Number);
  let total = 0;
  for(let i=0;i<count;i++) total += Math.floor(Math.random()*sides)+1;
  return total;
}
// Représentation d'un personnage ou ennemi
class Combatant {
  constructor(name, hp, attackBonus, defense, damageDice, damageBonus) {
    this.name = name;
    this.hp = hp;
    this.attackBonus = attackBonus;
    this.defense = defense;
    this.damageDice = damageDice;   // ex: "1d6", "2d8"
    this.damageBonus = damageBonus;
    this.initiative = 0;
  }

  isAlive() {
    return this.hp > 0;
  }
}

// --------- Outils ---------

// function rollDice(formula) {
//   // Exemple : "2d6+3"
//   let match = formula.match(/(\d+)d(\d+)/);
//   if (!match) return 0;
//   let nb = parseInt(match[1], 10);
//   let faces = parseInt(match[2], 10);
//   let total = 0;
//   for (let i = 0; i < nb; i++) {
//     total += Math.floor(Math.random() * faces) + 1;
//   }
//   return total;
// }

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

// --------- Combat ---------

function rollInitiative(combatants) {
  combatants.forEach(c => {
    c.initiative = rollD20() + c.attackBonus; // simple : bonus attaque comme init
  });
  return combatants.sort((a, b) => b.initiative - a.initiative);
}

function attack(attacker, defender) {
  let d20 = rollD20();
  let total = d20 + attacker.attackBonus;
  let isCrit = d20 === 20;

  if (isCrit || total >= defender.defense) {
    let dmg = rollDice(attacker.damageDice) + attacker.damageBonus;
    if (isCrit) dmg *= 2; // critique
    defender.hp -= dmg;
    console.log(`${attacker.name} touche ${defender.name} pour ${dmg} dégâts !`);
    if (defender.hp <= 0) {
      console.log(`${defender.name} est KO !`);
    }
  } else {
    console.log(`${attacker.name} rate son attaque contre ${defender.name}.`);
  }
}

// --------- Exemple de boucle ---------

// async function startCombat(player, enemies) {
//   let combatants = [player, ...enemies];
//   combatants = rollInitiative(combatants);

//   console.log("Ordre d'initiative :", combatants.map(c => c.name).join(", "));

//   while (combatants.some(c => c.isAlive() && c !== player) && player.isAlive()) {
//     for (let c of combatants) {
//       if (!c.isAlive()) continue;

//       if (c === player) {
//         // ici on pourrait brancher sur une UI (choix de l’action)
//         console.log("C'est à toi de jouer !");
//         // pour test : attaquer le premier ennemi vivant
//         let target = enemies.find(e => e.isAlive());
//         if (target) attack(player, target);
//       } else {
//         // ennemi attaque le joueur
//         if (player.isAlive()) attack(c, player);
//       }
//     }
//   }

//   if (player.isAlive()) {
//     console.log("Victoire !");
//   } else {
//     console.log("Défaite...");
//   }
// }

// --------- Export ---------

window.CombatSystem = {
  Combatant,
  startCombat
};

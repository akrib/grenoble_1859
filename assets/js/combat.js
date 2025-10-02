// combat.js
export const combatLogEl = document.getElementById("combat-log");
export const encounterButtonsEl = document.getElementById("encounter-buttons");

export function logCombat(message) {
  if (!combatLogEl) return;
  const p = document.createElement("p");
  p.textContent = message;
  combatLogEl.appendChild(p);
  combatLogEl.scrollTop = combatLogEl.scrollHeight;
}

export function rollDice(diceStr) {
  const [count, sides] = diceStr.split("d").map(Number);
  let total = 0;
  for(let i=0;i<count;i++) total += Math.floor(Math.random()*sides)+1;
  return total;
}

export class Combatant {
  constructor(name, hp, attackBonus, defense, damageDice, damageBonus, xp=0, loot=[]) {
    this.name = name;
    this.hp = hp;
    this.attackBonus = attackBonus;
    this.defense = defense;
    this.damageDice = damageDice;
    this.damageBonus = damageBonus;
    this.initiative = 0;
    this.xp = xp;
    this.loot = loot;
  }

  isAlive() { return this.hp > 0; }
}

export async function runCombat(player, monster, updateUI) {
  logCombat(`Un ${monster.name} apparaît !`);
  encounterButtonsEl.style.display = "none";

  while(player.hp > 0 && monster.hp > 0) {
    // Tour joueur
    const playerDamage = rollDice(player.damageDice) + player.damageBonus;
    monster.hp -= playerDamage;
    logCombat(`${player.name} inflige ${playerDamage} dégâts à ${monster.name} (${Math.max(monster.hp,0)} PV restants)`);

    if(monster.hp <= 0) {
      logCombat(`${monster.name} est vaincu !`);
      player.xp += monster.xp || 0;
      if(monster.loot) player.inventory.push(...monster.loot);
      if(updateUI) updateUI(player, monster);
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

    await new Promise(r => setTimeout(r, 500));
  }
}

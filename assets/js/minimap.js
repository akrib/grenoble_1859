// minimap.js
export async function drawMinimap(player, surroundingLevels) {
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  const size = 20;
  const halfMap = 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let dy=-1; dy<=1; dy++) {
    for (let dx=-1; dx<=1; dx++) {
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

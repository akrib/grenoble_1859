// move.js
export const directions = {
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

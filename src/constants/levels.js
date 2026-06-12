export const LEVELS = [
  { level: 1, xp: 0, title: 'Novato' },
  { level: 2, xp: 1000, title: 'Corredor' },
  { level: 3, xp: 3000, title: 'Atleta' },
  { level: 4, xp: 6000, title: 'Elite' },
  { level: 5, xp: 10000, title: 'Leyenda' },
  { level: 6, xp: 15000, title: 'Imparable' },
  { level: 7, xp: 21000, title: 'Inquebrantable' },
  { level: 8, xp: 28000, title: 'Titan' },
  { level: 9, xp: 36000, title: 'Inmortal' },
  { level: 10, xp: 50000, title: 'Pace God' },
];

export const getLevelByXp = (xp) => {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xp) level = l;
  }
  return level;
};

export default LEVELS;

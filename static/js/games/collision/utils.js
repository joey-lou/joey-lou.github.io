export function getRandomVelocity(maxSpeed) {
  return (Math.random() - 0.5) * 2 * maxSpeed;
}

export function isOverlapping(obj1, obj2) {
  const [left1, right1, top1, bottom1] = obj1.getBoundaries();
  const [left2, right2, top2, bottom2] = obj2.getBoundaries();
  return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
}

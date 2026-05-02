export function createFruit(levelFruit, spawn, duration) {
  return {
    ...levelFruit,
    spawn: { ...spawn },
    active: false,
    timer: 0,
    duration
  };
}

export function resetFruit(fruit, levelFruit, duration) {
  fruit.id = levelFruit.id;
  fruit.name = levelFruit.name;
  fruit.value = levelFruit.value;
  fruit.color = levelFruit.color;
  fruit.active = false;
  fruit.timer = 0;
  fruit.duration = duration;
  return fruit;
}

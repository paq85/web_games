const FRUITS = [
  { id: 'cherry', name: 'Cherry', value: 100, color: '#ff5d73' },
  { id: 'strawberry', name: 'Strawberry', value: 200, color: '#ff3f63' },
  { id: 'orange', name: 'Orange', value: 300, color: '#ffb347' },
  { id: 'apple', name: 'Apple', value: 400, color: '#ff5555' },
  { id: 'melon', name: 'Melon', value: 500, color: '#64ff9b' },
  { id: 'galaxian', name: 'Galaxian', value: 700, color: '#4df7ff' },
  { id: 'bell', name: 'Bell', value: 1000, color: '#ffe84a' },
  { id: 'key', name: 'Key', value: 1500, color: '#f6f6ff' }
];

export function getFruitForLevel(level = 1) {
  return FRUITS[Math.min(FRUITS.length - 1, Math.max(0, level - 1))];
}

export function getFruitCollectionCaption(level) {
  const fruit = getFruitForLevel(level);
  return `${fruit.name} collected for ${fruit.value} points.`;
}

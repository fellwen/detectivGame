// Координаты центров и размеры зон — проценты полного изображения, без обрезки.
// Один предмет соответствует одному доказательству; декор не открывает документы.
const roomImage = name => `assets/images/rooms/${name}-illustrated.webp`;
const itemImage = name => `assets/images/evidence/${name}-illustrated.webp`;
export const scenesByRoom = {
  office: [
    { id: 'interior', title: 'Кабинет', src: roomImage('office'), width: 1586, height: 992, alt: 'Иллюстрированный кабинет Аркадия: стол, книжные шкафы, кресло и диван.', targets: [
      { id: 'drink', evidence: 'decanter', x: 35.2, y: 40.2, w: 9.6, h: 15.5 },
      { id: 'paper', evidence: 'note', x: 51.1, y: 49.8, w: 8.3, h: 5.4 },
      { id: 'button', evidence: 'button', x: 22.1, y: 90.1, w: 3.5, h: 4.2 },
      { id: 'cloth', evidence: 'handkerchief', x: 88.3, y: 54.2, w: 6.5, h: 7.5 },
      { id: 'wire', evidence: 'lock', x: 88.5, y: 85.6, w: 8.5, h: 8.5, regions: [{ x: 94.6, y: 53.3, w: 5, h: 29 }] },
      { id: 'rug', label: 'Ковёр', image: itemImage('carpet'), description: 'У края кресла ковёр смят. Это деталь обстановки: само положение ковра не устанавливает ни виновного, ни время событий.', x: 9, y: 81.5, w: 15, h: 15 }
    ] },
    { id: 'window', title: 'Снаружи у окна', src: roomImage('footprints'), width: 1586, height: 992, alt: 'Снежный двор у закрытого окна отеля. На снегу видны следы.', targets: [
      { id: 'tracks', evidence: 'footprints', x: 43, y: 88, w: 15, h: 19, regions: [{ x: 54.8, y: 73.9, w: 10, h: 11 }, { x: 51.1, y: 68.7, w: 9, h: 10 }, { x: 59.6, y: 62.4, w: 17, h: 10 }] }
    ] }
  ],
  lounge: [
    { id: 'table', title: 'Карточный стол', src: roomImage('lounge'), width: 1586, height: 992, alt: 'Иллюстрированная гостиная: пустой карточный стол, кресла и камин.', targets: [
      { id: 'cards', label: 'Карты на столе', description: 'Гости оставили карты на столе. По их расположению нельзя установить, кто присутствовал непрерывно. Для проверки алиби нужны показания.', x: 51, y: 81, w: 15, h: 21, regions: [{ x: 32.6, y: 63.6, w: 20, h: 13 }, { x: 52.8, y: 57.3, w: 17.5, h: 10 }, { x: 70, y: 71.3, w: 23, h: 16 }, { x: 85.9, y: 88.5, w: 23, h: 21 }] }
    ] }
  ],
  kotroom: [
    { id: 'study', title: 'Письменный стол', src: roomImage('kot-study'), width: 1586, height: 992, alt: 'Рабочий кабинет сыщика: письменный стол, книги и доски с материалами дел.', targets: [
      { id: 'folder', evidence: 'forged', x: 51.9, y: 73.5, w: 16.5, h: 8.5 }
    ] },
    { id: 'drawer', title: 'Рабочий уголок', src: roomImage('kot-desk'), width: 1586, height: 992, alt: 'Другой ракурс комнаты сыщика: стол у окна и деревянные ящики.', targets: [
      { id: 'glove', evidence: 'glove', x: 35.2, y: 78.7, w: 12, h: 9.5 }
    ] }
  ],
  bedroom: [
    { id: 'bed', title: 'Комната Плюшкина', src: roomImage('plyushkin-room'), width: 1586, height: 992, alt: 'Иллюстрированная спальня Плюшкина: кровать, покрывало, зеркало и свечи.', targets: [
      { id: 'receipt', evidence: 'dues', x: 29.7, y: 65.2, w: 10.5, h: 6.6 }
    ] }
  ]
};
export const sceneKey = (roomId, sceneId) => `${roomId}:${sceneId}`;
export const targetKey = (roomId, sceneId, targetId) => `${roomId}:${sceneId}:${targetId}`;
export const sceneByKey = new Map();
export const targetByKey = new Map();
for (const [roomId, scenes] of Object.entries(scenesByRoom)) for (const scene of scenes) {
  sceneByKey.set(sceneKey(roomId, scene.id), { ...scene, roomId });
  for (const target of scene.targets) {
    const key = targetKey(roomId, scene.id, target.id);
    targetByKey.set(key, { ...target, roomId, sceneId: scene.id, key });
  }
}

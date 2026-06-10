import { CITIES_V2 } from './src/data/cities_v2.ts';

const targetCities = [
  '郅支城', '千泉', '乌兹干', '奥什', '休循', '伊尔克什坦', '莎车', '西夜', 
  '玛旁雍错', '普兰', '日土宗', '多玛', '逻些', '甲玛赤康', '羊苴咩城', '蒙舍城', 
  '象林', '美山', '僰王山', '僰道', '哈拉和林', '窝鲁朵城', '盛乐', '归化城', 
  '赫图阿拉', '佟佳江', '全州', '泗沘', '鹿头关', '茂州'
];

CITIES_V2.forEach(c => {
  if (targetCities.includes(c.name)) {
    console.log(`${c.name}: lat ${c.lat}, lng ${c.lng}`);
  }
});

export const destinationCities = [
  {
    value: 'Tokyo',
    label: '日本 · 東京 Tokyo',
    weatherName: 'Tokyo',
    center: [35.6812, 139.7671],
    aliases: ['tokyo', '東京', '日本東京'],
  },
  {
    value: 'Osaka',
    label: '日本 · 大阪 Osaka',
    weatherName: 'Osaka',
    center: [34.6937, 135.5023],
    aliases: ['osaka', '大阪', '日本大阪'],
  },
  {
    value: 'Kyoto',
    label: '日本 · 京都 Kyoto',
    weatherName: 'Kyoto',
    center: [35.0116, 135.7681],
    aliases: ['kyoto', '京都', '日本京都'],
  },
  {
    value: 'Seoul',
    label: '韓國 · 首爾 Seoul',
    weatherName: 'Seoul',
    center: [37.5665, 126.978],
    aliases: ['seoul', '首爾', '首尔', '韓國首爾', '韩国首尔'],
  },
  {
    value: 'Busan',
    label: '韓國 · 釜山 Busan',
    weatherName: 'Busan',
    center: [35.1796, 129.0756],
    aliases: ['busan', '釜山', '韓國釜山', '韩国釜山'],
  },
  {
    value: 'Jeju',
    label: '韓國 · 濟州 Jeju',
    weatherName: 'Jeju City',
    center: [33.4996, 126.5312],
    aliases: ['jeju', '濟州', '济州', '韓國濟州', '韩国济州'],
  },
  {
    value: 'Taipei',
    label: '台灣 · 台北 Taipei',
    weatherName: 'Taipei',
    center: [25.033, 121.5654],
    aliases: ['taipei', '台北', '臺北', '台灣台北', '台湾台北'],
  },
  {
    value: 'Tainan',
    label: '台灣 · 台南 Tainan',
    weatherName: 'Tainan',
    center: [22.9999, 120.2269],
    aliases: ['tainan', '台南', '臺南', '台灣台南', '台湾台南'],
  },
  {
    value: 'Kaohsiung',
    label: '台灣 · 高雄 Kaohsiung',
    weatherName: 'Kaohsiung',
    center: [22.6273, 120.3014],
    aliases: ['kaohsiung', '高雄', '台灣高雄', '台湾高雄'],
  },
  {
    value: 'Bangkok',
    label: '泰國 · 曼谷 Bangkok',
    weatherName: 'Bangkok',
    center: [13.7563, 100.5018],
    aliases: ['bangkok', '曼谷', '泰國曼谷', '泰国曼谷'],
  },
  {
    value: 'ChiangMai',
    label: '泰國 · 清邁 Chiang Mai',
    weatherName: 'Chiang Mai',
    center: [18.7883, 98.9853],
    aliases: ['chiang mai', 'chiangmai', '清邁', '清迈', '泰國清邁', '泰国清迈'],
  },
  {
    value: 'Hanoi',
    label: '越南 · 河內 Hanoi',
    weatherName: 'Hanoi',
    center: [21.0278, 105.8342],
    aliases: ['hanoi', '河內', '河内', '越南河內', '越南河内'],
  },
  {
    value: 'HoChiMinh',
    label: '越南 · 胡志明市 Ho Chi Minh City',
    weatherName: 'Ho Chi Minh City',
    center: [10.8231, 106.6297],
    aliases: ['ho chi minh', 'saigon', '胡志明', '胡志明市', '西貢', '西贡'],
  },
  {
    value: 'DaNang',
    label: '越南 · 峴港 Da Nang',
    weatherName: 'Da Nang',
    center: [16.0544, 108.2022],
    aliases: ['da nang', 'danang', '峴港', '岘港', '越南峴港', '越南岘港'],
  },
  {
    value: 'Singapore',
    label: '新加坡 Singapore',
    weatherName: 'Singapore',
    center: [1.3521, 103.8198],
    aliases: ['singapore', '新加坡'],
  },
  {
    value: 'HongKong',
    label: '香港 Hong Kong',
    weatherName: 'Hong Kong',
    center: [22.3193, 114.1694],
    aliases: ['hong kong', 'hongkong', '香港'],
  },
  {
    value: 'Macau',
    label: '澳門 Macau',
    weatherName: 'Macau',
    center: [22.1987, 113.5439],
    aliases: ['macau', 'macao', '澳門', '澳门'],
  },
  {
    value: 'KualaLumpur',
    label: '馬來西亞 · 吉隆坡 Kuala Lumpur',
    weatherName: 'Kuala Lumpur',
    center: [3.139, 101.6869],
    aliases: ['kuala lumpur', 'kl', '吉隆坡', '馬來西亞吉隆坡', '马来西亚吉隆坡'],
  },
  {
    value: 'Bali',
    label: '印尼 · 峇里島 Bali',
    weatherName: 'Denpasar',
    center: [-8.6705, 115.2126],
    aliases: ['bali', 'denpasar', '峇里', '峇里島', '巴厘岛', '印尼峇里'],
  },
  {
    value: 'Shanghai',
    label: '中國 · 上海 Shanghai',
    weatherName: 'Shanghai',
    center: [31.2304, 121.4737],
    aliases: ['shanghai', '上海', '中國上海', '中国上海'],
  },
];

export function getCityByValue(value) {
  return destinationCities.find((city) => city.value === value);
}

export function getCityByDestination(destination) {
  const query = destination.trim().toLowerCase();
  if (!query) return null;

  return destinationCities.find(
    (city) =>
      city.value.toLowerCase() === query ||
      city.aliases.some((alias) => alias.toLowerCase() === query),
  );
}

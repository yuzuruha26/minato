
import { Zone, FeedingPoint, Cat, Member } from './types';

export const ZONES: Zone[] = [
  { id: 'zone1', name: '第1区画', description: '丘陵・工場エリア' },
  { id: 'zone2', name: '第2区画', description: '港湾・倉庫エリア' },
  { id: 'zone3', name: '第3区画', description: '住宅・公園エリア' },
  { id: 'zone4', name: '第4区画', description: '海岸・防波堤エリア' },
];

export const FEEDING_POINTS: FeedingPoint[] = [
  // Zone 1 (①～⑦)
  { id: 'p01', name: '①', zoneId: 'zone1' },
  { id: 'p02', name: '②', zoneId: 'zone1' },
  { id: 'p03', name: '③', zoneId: 'zone1' },
  { id: 'p04', name: '④', zoneId: 'zone1' },
  { id: 'p05', name: '⑤', zoneId: 'zone1' },
  { id: 'p06', name: '⑥', zoneId: 'zone1' },
  { id: 'p07', name: '⑦', zoneId: 'zone1' },

  // Zone 2 (⑧～⑮)
  { id: 'p08', name: '⑧ 高フェンス', zoneId: 'zone2' },
  { id: 'p09', name: '⑨ JA', zoneId: 'zone2' },
  { id: 'p10', name: '⑩ 第二の丘', zoneId: 'zone2' },
  { id: 'p11', name: '⑪ センコー', zoneId: 'zone2' },
  { id: 'p12', name: '⑫ どんつき', zoneId: 'zone2' },
  { id: 'p13', name: '⑬ 木材置き場', zoneId: 'zone2' },
  { id: 'p14', name: '⑭ 日通', zoneId: 'zone2' },
  { id: 'p15', name: '⑮ ガラス工場', zoneId: 'zone2' },

  // Zone 3 (⑯～㉓)
  { id: 'p16', name: '⑯ イスズ', zoneId: 'zone3' },
  { id: 'p17', name: '⑰ 山口水産', zoneId: 'zone3' },
  { id: 'p18', name: '⑱ 船三艘', zoneId: 'zone3' },
  { id: 'p19', name: '⑲ マキタ', zoneId: 'zone3' },
  { id: 'p20', name: '⑳ ヤクルト', zoneId: 'zone3' },
  { id: 'p21', name: '㉑ テヅカ', zoneId: 'zone3' },
  { id: 'p22', name: '㉒ シャープ', zoneId: 'zone3' },
  { id: 'p23', name: '㉓ 駐車場', zoneId: 'zone3' },

  // Zone 4 (㉔～㉕)
  { id: 'p24', name: '㉔', zoneId: 'zone4' },
  { id: 'p25', name: '㉕', zoneId: 'zone4' },
];

// 固定のネコデータ（第2、第3区画のみ）
export const MOCK_CATS: Cat[] = [
  // --- Zone 2 - Point 8 (⑧ 高フェンス) ---
  { id: 'cat-p08-1', name: '黒っぽいキジ', features: 'キジトラ (黒っぽい)', imageUrl: 'https://picsum.photos/seed/cat-p08-0/400/400', zoneId: 'zone2', pointId: 'p08', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p08-2', name: '白シャム', features: 'シャム系 (白)', imageUrl: 'https://picsum.photos/seed/cat-p08-1/400/400', zoneId: 'zone2', pointId: 'p08', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p08-3', name: 'シャム黒', features: 'シャム系 (黒)', imageUrl: 'https://picsum.photos/seed/cat-p08-2/400/400', zoneId: 'zone2', pointId: 'p08', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p08-4', name: '黒1カギ尻尾', features: '黒猫 (カギ尻尾)', imageUrl: 'https://picsum.photos/seed/cat-p08-3/400/400', zoneId: 'zone2', pointId: 'p08', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p08-5', name: 'パンチョ', features: 'ハチワレ (白多め)', imageUrl: 'https://picsum.photos/seed/cat-p08-4/400/400', zoneId: 'zone2', pointId: 'p08', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p08-6', name: '黒2', features: '黒猫 (新規)', imageUrl: 'https://picsum.photos/seed/cat-p08-5/400/400', zoneId: 'zone2', pointId: 'p08', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p08-7', name: 'ハチワレ黒多め', features: 'ハチワレ (黒多め)', imageUrl: 'https://picsum.photos/seed/cat-p08-6/400/400', zoneId: 'zone2', pointId: 'p08', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 2 - Point 9 (⑨ JA) ---
  { id: 'cat-p09-1', name: '新規グレーキジ', features: 'キジトラ (グレー)', imageUrl: 'https://picsum.photos/seed/cat-p09-0/400/400', zoneId: 'zone2', pointId: 'p09', subPointIds: ['p11'], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 2 - Point 10 (⑩ 第二の丘) ---
  { id: 'cat-p10-1', name: '鼻むけちゃん', features: 'キジトラ 白 鼻に特徴', imageUrl: 'https://picsum.photos/seed/cat-p10-0/400/400', zoneId: 'zone2', pointId: 'p10', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p10-2', name: '姫ちゃん', features: '三毛', imageUrl: 'https://picsum.photos/seed/cat-p10-1/400/400', zoneId: 'zone2', pointId: 'p10', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p10-3', name: '黒', features: '黒猫 単色', imageUrl: 'https://picsum.photos/seed/cat-p10-2/400/400', zoneId: 'zone2', pointId: 'p10', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p10-4', name: '新規キジ（茶色）', features: 'キジトラ 茶色', imageUrl: 'https://picsum.photos/seed/cat-p10-3/400/400', zoneId: 'zone2', pointId: 'p10', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p10-5', name: 'キーちゃん', features: 'キジ白', imageUrl: 'https://picsum.photos/seed/cat-p10-4/400/400', zoneId: 'zone2', pointId: 'p10', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p10-6', name: '尾長いキジ', features: 'キジトラ 尻尾長い', imageUrl: 'https://picsum.photos/seed/cat-p10-5/400/400', zoneId: 'zone2', pointId: 'p10', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p10-7', name: '銀ちゃん', features: '銀色 (サバトラ?)', imageUrl: 'https://picsum.photos/seed/cat-p10-6/400/400', zoneId: 'zone2', pointId: 'p10', subPointIds: ['p15'], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 2 - Point 12 (⑫ どんつき) ---
  { id: 'cat-p12-1', name: 'マーブル', features: 'マーブル柄', imageUrl: 'https://picsum.photos/seed/cat-p12-0/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p12-2', name: '茶トラ', features: '茶トラ', imageUrl: 'https://picsum.photos/seed/cat-p12-1/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p12-3', name: 'サビ', features: 'サビ', imageUrl: 'https://picsum.photos/seed/cat-p12-2/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p12-4', name: '白キジ濃い', features: 'キジ白 (濃いめ)', imageUrl: 'https://picsum.photos/seed/cat-p12-3/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p12-5', name: '白キジ薄い', features: 'キジ白 (薄め)', imageUrl: 'https://picsum.photos/seed/cat-p12-4/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p12-6', name: 'カリン様', features: '特徴不明', imageUrl: 'https://picsum.photos/seed/cat-p12-5/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p12-7', name: 'ミケ', features: '三毛', imageUrl: 'https://picsum.photos/seed/cat-p12-6/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p12-8', name: '新規グレー', features: 'グレー', imageUrl: 'https://picsum.photos/seed/cat-p12-7/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: ['p13'], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p12-9', name: '新規ネコ', features: '特徴不明', imageUrl: 'https://picsum.photos/seed/cat-p12-8/400/400', zoneId: 'zone2', pointId: 'p12', subPointIds: ['p13', 'p14'], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 2 - Point 13 (⑬ 木材置き場) ---
  { id: 'cat-p13-1', name: '白', features: '白猫', imageUrl: 'https://picsum.photos/seed/cat-p13-0/400/400', zoneId: 'zone2', pointId: 'p13', subPointIds: ['p14'], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p13-2', name: 'コアラ', features: 'コアラ顔', imageUrl: 'https://picsum.photos/seed/cat-p13-1/400/400', zoneId: 'zone2', pointId: 'p13', subPointIds: ['p14'], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p13-3', name: 'グレーと白のキジ', features: 'キジ白 (グレー)', imageUrl: 'https://picsum.photos/seed/cat-p13-2/400/400', zoneId: 'zone2', pointId: 'p13', subPointIds: ['p14'], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p13-4', name: 'キジ', features: 'キジトラ', imageUrl: 'https://picsum.photos/seed/cat-p13-3/400/400', zoneId: 'zone2', pointId: 'p13', subPointIds: ['p11'], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 2 - Point 14 (⑭ 日通) ---
  { id: 'cat-p14-1', name: 'ほくろくん', features: '顔にほくろ模様', imageUrl: 'https://picsum.photos/seed/cat-p14-0/400/400', zoneId: 'zone2', pointId: 'p14', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p14-2', name: 'リノ母', features: 'メス', imageUrl: 'https://picsum.photos/seed/cat-p14-1/400/400', zoneId: 'zone2', pointId: 'p14', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p14-3', name: 'マスク', features: 'マスク模様', imageUrl: 'https://picsum.photos/seed/cat-p14-2/400/400', zoneId: 'zone2', pointId: 'p14', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p14-4', name: 'グイちゃん', features: '特徴不明', imageUrl: 'https://picsum.photos/seed/cat-p14-3/400/400', zoneId: 'zone2', pointId: 'p14', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 2 - Point 15 (⑮ ガラス工場) ---
  { id: 'cat-p15-1', name: '黒ハート', features: '黒猫 (ハート模様?)', imageUrl: 'https://picsum.photos/seed/cat-p15-0/400/400', zoneId: 'zone2', pointId: 'p15', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p15-2', name: '黒中毛', features: '黒猫 (中毛)', imageUrl: 'https://picsum.photos/seed/cat-p15-1/400/400', zoneId: 'zone2', pointId: 'p15', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p15-3', name: 'ラブちゃん', features: '特徴不明', imageUrl: 'https://picsum.photos/seed/cat-p15-2/400/400', zoneId: 'zone2', pointId: 'p15', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 3 - Point 16 (⑯ イスズ) ---
  { id: 'cat-p16-1', name: 'こんぶちゃん', features: '黒系', imageUrl: 'https://picsum.photos/seed/cat-p16-0/400/400', zoneId: 'zone3', pointId: 'p16', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p16-2', name: 'ミケ', features: '三毛', imageUrl: 'https://picsum.photos/seed/cat-p16-1/400/400', zoneId: 'zone3', pointId: 'p16', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 3 - Point 17 (⑰ 山口水産) ---
  { id: 'cat-p17-1', name: 'パウチくん', features: 'パウチ好き', imageUrl: 'https://picsum.photos/seed/cat-p17-0/400/400', zoneId: 'zone3', pointId: 'p17', subPointIds: ['p16', 'p20'], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 3 - Point 18 (⑱ 船三艘) ---
  { id: 'cat-p18-1', name: '三ちゃん', features: 'キジトラ', imageUrl: 'https://picsum.photos/seed/cat-p18-0/400/400', zoneId: 'zone3', pointId: 'p18', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 3 - Point 19 (⑲ マキタ) ---
  { id: 'cat-p19-1', name: 'ウーロン', features: 'うろうろ', imageUrl: 'https://picsum.photos/seed/cat-p19-0/400/400', zoneId: 'zone3', pointId: 'p19', subPointIds: ['p16'], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p19-2', name: 'おはぎちゃん', features: '黒/サビ (おはぎ)', imageUrl: 'https://picsum.photos/seed/cat-p19-1/400/400', zoneId: 'zone3', pointId: 'p19', subPointIds: ['p23'], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p19-3', name: 'あずきちゃん', features: '特徴不明', imageUrl: 'https://picsum.photos/seed/cat-p19-2/400/400', zoneId: 'zone3', pointId: 'p19', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p19-4', name: 'だんごちゃん', features: '特徴不明', imageUrl: 'https://picsum.photos/seed/cat-p19-3/400/400', zoneId: 'zone3', pointId: 'p19', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 3 - Point 20 (⑳ ヤクルト) ---
  { id: 'cat-p20-1', name: 'パインくん', features: '茶白', imageUrl: 'https://picsum.photos/seed/cat-p20-0/400/400', zoneId: 'zone3', pointId: 'p20', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p20-2', name: '白キジ濃い', features: 'キジ白 (濃いめ)', imageUrl: 'https://picsum.photos/seed/cat-p20-1/400/400', zoneId: 'zone3', pointId: 'p20', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p20-3', name: 'キジ', features: 'キジトラ', imageUrl: 'https://picsum.photos/seed/cat-p20-2/400/400', zoneId: 'zone3', pointId: 'p20', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 3 - Point 21 (㉑ テヅカ) ---
  { id: 'cat-p21-1', name: 'キジ', features: 'キジトラ', imageUrl: 'https://picsum.photos/seed/cat-p21-0/400/400', zoneId: 'zone3', pointId: 'p21', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p21-2', name: 'シャム', features: 'シャム系', imageUrl: 'https://picsum.photos/seed/cat-p21-1/400/400', zoneId: 'zone3', pointId: 'p21', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p21-3', name: 'みかん', features: '茶トラ', imageUrl: 'https://picsum.photos/seed/cat-p21-2/400/400', zoneId: 'zone3', pointId: 'p21', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },

  // --- Zone 3 - Point 22 (㉒ シャープ) ---
  { id: 'cat-p22-1', name: '黒猫スマート2', features: '黒猫', imageUrl: 'https://picsum.photos/seed/cat-p22-0/400/400', zoneId: 'zone3', pointId: 'p22', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p22-2', name: '黒猫スマート1', features: '黒猫 (男子)', imageUrl: 'https://picsum.photos/seed/cat-p22-1/400/400', zoneId: 'zone3', pointId: 'p22', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p22-3', name: '黒猫', features: '黒猫 (しっぽ短)', imageUrl: 'https://picsum.photos/seed/cat-p22-2/400/400', zoneId: 'zone3', pointId: 'p22', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p22-4', name: 'もなか', features: '三毛 (ハッキリ)', imageUrl: 'https://picsum.photos/seed/cat-p22-3/400/400', zoneId: 'zone3', pointId: 'p22', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
  { id: 'cat-p22-5', name: 'うす茶', features: '薄茶 (女子)', imageUrl: 'https://picsum.photos/seed/cat-p22-4/400/400', zoneId: 'zone3', pointId: 'p22', subPointIds: [], status: 'healthy', lastFed: new Date().toISOString() },
];

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'admin-01',
    name: '管理者 (港 太郎)',
    role: 'admin',
    phoneModel: 'iPhone 15 Pro',
    availableHours: '全日 9:00 - 18:00',
    membershipExpiry: '2030-12-31',
    contactMethod: '携帯電話 (090-XXXX-XXXX)'
  },
  {
    id: 'user-01',
    name: 'ボランティア (猫田 花子)',
    role: 'general',
    phoneModel: 'Xperia 1 V',
    availableHours: '平日 18:00以降, 土日祝',
    membershipExpiry: '2025-03-31',
    contactMethod: 'LINE'
  },
  {
    id: 'user-02',
    name: '鈴木 一郎',
    role: 'general',
    phoneModel: 'AQUOS sense8',
    availableHours: '月・水・金 午前中',
    membershipExpiry: '2024-12-31', // Expired example
    contactMethod: 'メール'
  }
];

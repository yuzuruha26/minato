
import { db } from './firebase';
// Fix: Correct standard modular imports for Firestore operations
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Report, Cat, FeedingPoint } from '../types';

/**
 * 給餌記録の型定義
 */
export type FeedingRecord = {
  photoUrl: string;
  memo: string;
};

/**
 * 給餌記録を保存します（新規追加）
 */
export async function saveFeedingRecord(record: FeedingRecord) {
  try {
    await addDoc(collection(db, "feedingRecords"), {
      ...record,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to save feeding record:", error);
    throw error;
  }
}

/**
 * 指定された日付の全レポート（reportsコレクション）を取得します
 */
export const getDailyReports = async (date: Date): Promise<Report[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const q = query(
      collection(db, 'reports'),
      where('timestamp', '>=', startOfDay.getTime()),
      where('timestamp', '<=', endOfDay.getTime()),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Report);
  } catch (error) {
    console.error("Failed to fetch reports for date:", date, error);
    return [];
  }
};

/**
 * 指定された日付の活動サマリー（給餌済み、未完了、異常あり）を計算します
 */
export const getDailySummary = async (date: Date, allCats: Cat[]) => {
  const reports = await getDailyReports(date);
  
  // 給餌済みのネコID（重複排除）
  const fedCatIds = new Set(
    reports.filter(r => r.fed).map(r => r.catId)
  );

  // 異常報告（怪我・病気）
  const sickReports = reports.filter(r => 
    r.condition === 'injured' || r.condition === 'bad' || r.urgentDetail
  );

  // 未完了のネコ
  const unfedCats = allCats.filter(cat => !fedCatIds.has(cat.id));

  return {
    reports,
    sickReports,
    unfedCats,
    totalFed: fedCatIds.size,
    totalUnfed: unfedCats.length
  };
};

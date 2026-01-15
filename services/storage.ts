
import { Cat, FeedingPoint, Zone, Member, Report } from '../types';
import { FEEDING_POINTS, ZONES, MOCK_MEMBERS, MOCK_CATS } from '../constants';
import { db, storage as firebaseStorage, isConfigured, waitForAuth } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch, 
  Firestore,
  addDoc
} from "firebase/firestore";
import { 
  ref, 
  uploadString, 
  getDownloadURL, 
  FirebaseStorage 
} from "firebase/storage";

class DataService {
  private _isReady: boolean = false;
  private _initPromise: Promise<void>;

  constructor() {
    this._initPromise = this.checkStatus();
  }

  private async checkStatus() {
    const user = await waitForAuth();
    this._isReady = !!user && isConfigured;
    if (this._isReady) {
      console.log("Storage: Cloud Mode (Firebase)");
      await this.seedDatabase().catch(() => {});
    } else {
      console.log("Storage: Local Mode (Mock Data)");
    }
  }

  public async ensureReady() {
    await this._initPromise;
  }

  public get useCloud(): boolean {
    return this._isReady;
  }

  private getMockData<T>(collectionName: string): T[] {
    switch (collectionName) {
      case 'cats': return MOCK_CATS as unknown as T[];
      case 'zones': return ZONES as unknown as T[];
      case 'points': return FEEDING_POINTS as unknown as T[];
      case 'members': return MOCK_MEMBERS as unknown as T[];
      default: return [];
    }
  }

  public async seedDatabase(force: boolean = false) {
    if (!isConfigured) return;

    try {
      const user = await waitForAuth();
      if (!user) return;

      const catsRef = collection(db as Firestore, 'cats');
      const catsSnapshot = await getDocs(catsRef);

      // すでにデータがある場合は上書きしない（force時を除く）
      if (catsSnapshot.empty || force) {
        const batch = writeBatch(db as Firestore);
        for (const zone of ZONES) batch.set(doc(db as Firestore, 'zones', zone.id), zone);
        for (const point of FEEDING_POINTS) batch.set(doc(db as Firestore, 'points', point.id), point);
        for (const cat of MOCK_CATS) batch.set(doc(db as Firestore, 'cats', cat.id), cat);
        for (const member of MOCK_MEMBERS) batch.set(doc(db as Firestore, 'members', member.id), member);

        await batch.commit();
        if (force) alert("デモデータを復元しました。");
      }
    } catch (e) {
      console.warn("Seeding failed (permissions):", e);
    }
  }

  private async uploadImage(path: string, dataUrl: string): Promise<string> {
    if (!this.useCloud) return dataUrl;
    try {
      const storageRef = ref(firebaseStorage as FirebaseStorage, path);
      await uploadString(storageRef, dataUrl, 'data_url');
      return await getDownloadURL(storageRef);
    } catch (e) {
      return dataUrl;
    }
  }

  async getCats(): Promise<Cat[]> {
    await this.ensureReady();
    if (!this.useCloud) return this.getMockData<Cat>('cats');
    try {
      const snapshot = await getDocs(collection(db as Firestore, 'cats'));
      return snapshot.docs.map(doc => doc.data() as Cat);
    } catch (e) {
      return this.getMockData<Cat>('cats');
    }
  }

  async saveCat(cat: Cat, isNew: boolean): Promise<void> {
    await this.ensureReady();
    if (this.useCloud && cat.imageUrl?.startsWith('data:')) {
      const url = await this.uploadImage(`cats/${cat.id}/profile.jpg`, cat.imageUrl);
      cat.imageUrl = url;
    }
    if (!this.useCloud) return;
    try {
      await setDoc(doc(db as Firestore, 'cats', cat.id), cat);
    } catch (e) {
      console.error("Failed to save cat to Firebase", e);
    }
  }

  async saveReport(report: Report): Promise<void> {
    await this.ensureReady();
    if (!this.useCloud) {
      console.log("Local Mode: Report not saved to cloud", report);
      return;
    }

    try {
      // 画像がある場合はストレージに保存
      if (report.urgentPhoto?.startsWith('data:')) {
        const url = await this.uploadImage(`reports/${report.catId}/${report.timestamp}.jpg`, report.urgentPhoto);
        report.urgentPhoto = url;
      }

      const reportsRef = collection(db as Firestore, 'reports');
      await addDoc(reportsRef, {
        ...report,
        createdAt: new Date().toISOString()
      });
      console.log("Report saved to Firebase");
    } catch (e) {
      console.error("Failed to save report to Firebase", e);
    }
  }

  async getZones(): Promise<Zone[]> {
    await this.ensureReady();
    if (!this.useCloud) return this.getMockData<Zone>('zones');
    try {
      const snapshot = await getDocs(collection(db as Firestore, 'zones'));
      return snapshot.docs.map(doc => doc.data() as Zone);
    } catch (e) {
      return this.getMockData<Zone>('zones');
    }
  }

  async saveZone(zone: Zone, isNew: boolean): Promise<void> {
    await this.ensureReady();
    if (!this.useCloud) return;
    try {
      await setDoc(doc(db as Firestore, 'zones', zone.id), zone);
    } catch (e) {}
  }

  async getPoints(): Promise<FeedingPoint[]> {
    await this.ensureReady();
    if (!this.useCloud) return this.getMockData<FeedingPoint>('points');
    try {
      const snapshot = await getDocs(collection(db as Firestore, 'points'));
      return snapshot.docs.map(doc => doc.data() as FeedingPoint);
    } catch (e) {
      return this.getMockData<FeedingPoint>('points');
    }
  }

  async savePoint(point: FeedingPoint, isNew: boolean): Promise<void> {
    await this.ensureReady();
    if (!this.useCloud) return;
    try {
      await setDoc(doc(db as Firestore, 'points', point.id), point);
    } catch (e) {}
  }

  async getMembers(): Promise<Member[]> {
    await this.ensureReady();
    if (!this.useCloud) return this.getMockData<Member>('members');
    try {
      const snapshot = await getDocs(collection(db as Firestore, 'members'));
      return snapshot.docs.map(doc => doc.data() as Member);
    } catch (e) {
      return this.getMockData<Member>('members');
    }
  }
}

export const storage = new DataService();

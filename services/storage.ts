
import { Cat, FeedingPoint, Zone, Member, Report } from '../types';
import { FEEDING_POINTS, ZONES, MOCK_MEMBERS, MOCK_CATS } from '../constants';
import { db, storage as firebaseStorage, isConfigured, waitForAuth } from './firebase';
// Fix: Use standard modular imports for Firestore functions and types
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch, 
  Firestore,
  addDoc,
  updateDoc
} from "firebase/firestore";
// Fix: Use standard modular imports for Storage functions and types
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
    try {
      const user = await waitForAuth();
      this._isReady = !!user && isConfigured;
      if (this._isReady) {
        console.log("Storage: Cloud Mode Active (Firebase)");
        await this.seedDatabase().catch(e => console.warn("Seed check error:", e));
      } else {
        console.log("Storage: Local Mode Active (Mock Data Only)");
      }
    } catch (e) {
      console.warn("Auth check failed, defaulting to local mode", e);
      this._isReady = false;
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
    if (!this.useCloud) return;

    try {
      const catsRef = collection(db as any, 'cats');
      const catsSnapshot = await getDocs(catsRef);

      if (catsSnapshot.empty || force) {
        console.log("Initializing database with seed data...");
        const batch = writeBatch(db as any);
        
        ZONES.forEach(z => batch.set(doc(db as any, 'zones', z.id), z));
        FEEDING_POINTS.forEach(p => batch.set(doc(db as any, 'points', p.id), p));
        MOCK_CATS.forEach(c => batch.set(doc(db as any, 'cats', c.id), c));
        MOCK_MEMBERS.forEach(m => batch.set(doc(db as any, 'members', m.id), m));

        await batch.commit();
        if (force) alert("クラウドデータを初期状態に復元しました。");
      }
    } catch (e) {
      console.error("Database seeding failed:", e);
    }
  }

  // Fix: Explicitly use modular ref and uploadString functions
  private async uploadImage(path: string, dataUrl: string): Promise<string> {
    if (!this.useCloud) return dataUrl;
    try {
      const storageRef = ref(firebaseStorage as any, path);
      await uploadString(storageRef, dataUrl, 'data_url');
      return await getDownloadURL(storageRef);
    } catch (e) {
      console.error("Image upload failed:", e);
      return dataUrl;
    }
  }

  async getCats(): Promise<Cat[]> {
    await this.ensureReady();
    if (!this.useCloud) return this.getMockData<Cat>('cats');
    try {
      const snapshot = await getDocs(collection(db as any, 'cats'));
      return snapshot.docs.map(doc => ({ ...doc.data() } as Cat));
    } catch (e) {
      console.error("Failed to fetch cats:", e);
      return this.getMockData<Cat>('cats');
    }
  }

  async saveCat(cat: Cat, isNew: boolean): Promise<void> {
    await this.ensureReady();
    if (this.useCloud && cat.imageUrl?.startsWith('data:')) {
      const url = await this.uploadImage(`cats/${cat.id}/profile.jpg`, cat.imageUrl);
      cat.imageUrl = url;
    }
    
    if (!this.useCloud) {
      console.log("Local Save (Cat):", cat);
      return;
    }

    try {
      await setDoc(doc(db as any, 'cats', cat.id), cat);
      console.log("Firebase Save Success (Cat):", cat.name);
    } catch (e) {
      console.error("Firebase Save Error (Cat):", e);
      throw e;
    }
  }

  async saveReport(report: Report): Promise<void> {
    await this.ensureReady();
    
    if (this.useCloud && report.urgentPhoto?.startsWith('data:')) {
      const url = await this.uploadImage(`reports/${report.catId}/${report.timestamp}.jpg`, report.urgentPhoto);
      report.urgentPhoto = url;
    }

    if (!this.useCloud) {
      console.log("Local Save (Report):", report);
      return;
    }

    try {
      await addDoc(collection(db as any, 'reports'), {
        ...report,
        createdAt: new Date().toISOString()
      });
      console.log("Firebase Save Success (Report)");
    } catch (e) {
      console.error("Firebase Save Error (Report):", e);
      throw e;
    }
  }

  async getZones(): Promise<Zone[]> {
    await this.ensureReady();
    if (!this.useCloud) return this.getMockData<Zone>('zones');
    try {
      const snapshot = await getDocs(collection(db as any, 'zones'));
      return snapshot.docs.map(doc => doc.data() as Zone);
    } catch (e) {
      return this.getMockData<Zone>('zones');
    }
  }

  async saveZone(zone: Zone, isNew: boolean): Promise<void> {
    await this.ensureReady();
    if (!this.useCloud) return;
    try {
      await setDoc(doc(db as any, 'zones', zone.id), zone);
      console.log("Firebase Save Success (Zone):", zone.name);
    } catch (e) {
      console.error("Firebase Save Error (Zone):", e);
      throw e;
    }
  }

  async getPoints(): Promise<FeedingPoint[]> {
    await this.ensureReady();
    if (!this.useCloud) return this.getMockData<FeedingPoint>('points');
    try {
      const snapshot = await getDocs(collection(db as any, 'points'));
      return snapshot.docs.map(doc => doc.data() as FeedingPoint);
    } catch (e) {
      return this.getMockData<FeedingPoint>('points');
    }
  }

  async savePoint(point: FeedingPoint, isNew: boolean): Promise<void> {
    await this.ensureReady();
    if (!this.useCloud) return;
    try {
      await setDoc(doc(db as any, 'points', point.id), point);
      console.log("Firebase Save Success (Point):", point.name);
    } catch (e) {
      console.error("Firebase Save Error (Point):", e);
      throw e;
    }
  }

  async getMembers(): Promise<Member[]> {
    await this.ensureReady();
    if (!this.useCloud) return this.getMockData<Member>('members');
    try {
      const snapshot = await getDocs(collection(db as any, 'members'));
      return snapshot.docs.map(doc => doc.data() as Member);
    } catch (e) {
      return this.getMockData<Member>('members');
    }
  }

  async saveMember(member: Member, isNew: boolean): Promise<void> {
    await this.ensureReady();
    if (!this.useCloud) return;
    try {
      await setDoc(doc(db as any, 'members', member.id), member);
      console.log("Firebase Save Success (Member):", member.name);
    } catch (e) {
      console.error("Firebase Save Error (Member):", e);
      throw e;
    }
  }
}

export const storage = new DataService();


// Fix: Import standard modular functions for Firebase Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * 画像を指定されたサイズと品質に圧縮・リサイズします。
 * Firestoreのドキュメントサイズ制限（1MB）やGemini APIの効率的な処理のために使用します。
 * 
 * @param source 圧縮対象のFileオブジェクトまたはデータURL
 * @param maxSize 長辺の最大ピクセル数（デフォルト800px）
 * @param quality JPEG圧縮品質 0.0〜1.0（デフォルト0.6）
 * @returns 圧縮後のデータURL（Base64）
 */
export const compressImage = (source: File | string, maxSize = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const processImage = (img: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context could not be created'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    if (typeof source === 'string') {
      const img = new Image();
      img.onload = () => processImage(img);
      img.onerror = () => reject(new Error('Failed to load image from string'));
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImage(img);
        img.onerror = () => reject(new Error('Failed to load image from file'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(source);
    }
  });
};

/**
 * Firebase Storageにファイルをアップロードし、公開URLを取得します。
 * 
 * @param file アップロードするファイルオブジェクト
 * @returns アップロードされたファイルのダウンロードURL
 */
// Fix: Use modular ref and uploadBytes functions correctly
export async function uploadPhoto(file: File): Promise<string> {
  const filePath = `photos/${Date.now()}_${file.name}`;
  // storage passed here is the FirebaseStorage instance from firebase.ts
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

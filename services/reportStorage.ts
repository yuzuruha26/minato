
// Fix: Correct standard modular imports for Firestore operations
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const saveCatReport = async (params: {
  catId: string;
  photoPath: string;
  memo: string;
}) => {
  await addDoc(collection(db, "reports"), {
    catId: params.catId,
    photoPath: params.photoPath,
    memo: params.memo,
    createdAt: serverTimestamp(),
  });
};

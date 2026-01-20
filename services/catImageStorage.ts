
// Fix: Correct standard modular imports for Storage
import { ref, uploadString } from "firebase/storage";
import { storage } from "./firebase";

// Fix: Use ref and uploadString as modular functions
export const uploadCatMainImage = async (
  catId: string,
  base64: string
): Promise<string> => {
  const imageRef = ref(storage, `cats/${catId}/main.jpg`);
  await uploadString(imageRef, base64, 'data_url');
  return `cats/${catId}/main.jpg`;
};


// Fix: Import standard modular functions for Firebase v9+
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDVLj6PmtiMSW07qnzU4zhXYMvkqBqKOlg",
  authDomain: "minato-cat-support.firebaseapp.com",
  projectId: "minato-cat-support",
  storageBucket: "minato-cat-support.firebasestorage.app",
  messagingSenderId: "372711881728",
  appId: "1:372711881728:web:cd73fc6cd8a31f3abaece5"
};

// Fix: Safely initialize Firebase App for modular SDK
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Fix: Initialize services using the modular pattern correctly
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export let isConfigured = false;

const AUTH_TIMEOUT = 3000;

const signInWithTimeout = async () => {
  try {
    const authPromise = signInAnonymously(auth);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Firebase Auth Timeout")), AUTH_TIMEOUT)
    );

    return await Promise.race([authPromise, timeoutPromise]);
  } catch (e) {
    throw e;
  }
};

let authPromise: Promise<any>;

try {
  authPromise = signInWithTimeout()
    .then((userCredential: any) => {
      console.log("Firebase: 接続成功 (minato-cat-support)");
      isConfigured = true;
      return userCredential?.user || null;
    })
    .catch((error) => {
      console.warn("Firebase: 接続スキップ (ローカルモードで動作します)", error.message);
      isConfigured = false;
      return null;
    });
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  authPromise = Promise.resolve(null);
}

export const waitForAuth = () => authPromise;
export { app };

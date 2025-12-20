
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

// Firebase Configuration
// 注意: このAPIキーが正しくない場合、Firebase機能は自動的に無効化され、ローカルデータが使用されます。
const firebaseConfig = {
  apiKey: "AIzaSyCaatIg7_OrkfN2xDUaTzHPmcg62M1wQdI",
  authDomain: "minatoneko-5dce6.firebaseapp.com",
  projectId: "minatoneko-5dce6",
  storageBucket: "minatoneko-5dce6.firebasestorage.app",
  messagingSenderId: "782417830132",
  appId: "1:782417830132:web:2197d509202bc202b77ea1"
};

let app: any;
let db: any;
let storage: any;
let auth: any;
let isConfigured = false;
let authPromise: Promise<any> = Promise.resolve(null);

try {
  // 基本的な設定形式のチェック
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_")) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    
    // 匿名認証を試行
    authPromise = signInAnonymously(auth)
      .then((userCredential) => {
        console.log("Firebase: 匿名ログイン成功", userCredential.user.uid);
        isConfigured = true;
        return userCredential.user;
      })
      .catch((error) => {
        console.warn("Firebase: 認証エラー（ローカルモードで動作します）", error.message);
        isConfigured = false;
        return null;
      });
  } else {
    console.log("Firebase: 設定が未完了です。ローカルモードで起動します。");
  }
} catch (error) {
  console.error("Firebase: 初期化失敗", error);
}

// 認証完了を待つヘルパー
export const waitForAuth = () => authPromise;

export { app, db, storage, auth, isConfigured };

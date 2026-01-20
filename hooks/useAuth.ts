
import { useState, useEffect } from 'react';
import { User } from '../types';
import { auth, waitForAuth } from '../services/firebase';
// Fix: Correct standard modular import for onAuthStateChanged
import { onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Firebaseの初期化と認証状態の初期確定を待つ
      await waitForAuth();
      
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          // FirebaseユーザーをアプリのUser型にマッピング
          // 本来はFirestoreからrole等を取得するが、ここでは簡易的に設定
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'ゲスト活動員' : '会員'),
            role: firebaseUser.isAnonymous ? 'general' : 'admin' // 匿名は一般権限
          });
        } else {
          // ❌ 仮ユーザー生成は削除
          setCurrentUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    let unsub: (() => void) | undefined;
    init().then(u => unsub = u);

    return () => {
      if (unsub) unsub();
    };
  }, []);

  return { currentUser, loading };
};

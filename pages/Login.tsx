
import React from 'react';
import { Login as LoginComponent } from '../services/components/Login';
import { auth } from '../services/firebase';
// Fix: Correct standard modular import for signInAnonymously
import { signInAnonymously } from 'firebase/auth';

export const Login: React.FC = () => {
  const handleLogin = async (userData: any) => {
    // 既存のコンポーネントはモック認証だが、ここで実際のFirebase認証を行う
    try {
      await signInAnonymously(auth);
      // onAuthStateChangedが発火し、useAuth経由でMainへ遷移する
    } catch (error) {
      console.error("Login failed", error);
      alert("ログインに失敗しました");
    }
  };

  return <LoginComponent onLogin={handleLogin} />;
};

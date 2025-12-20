import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { KeyRound, User as UserIcon, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock Authentication Logic
    if (id === 'admin' && password === 'admin') {
      onLogin({ id: 'admin-01', name: '管理者', role: 'admin' });
    } else if (id === 'volunteer' && password === '0000') {
      onLogin({ id: 'user-01', name: 'ボランティア', role: 'general' });
    } else {
      setError('IDまたはパスワードが間違っています。(Demo: admin/admin, volunteer/0000)');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
        <div className="bg-orange-500 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">港のネコを守る会</h1>
          <p className="text-orange-100 text-sm">関係者ログイン</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">ログインID</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type="text" 
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors font-bold text-gray-700"
                  placeholder="IDを入力"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">パスワード</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors font-bold text-gray-700"
                  placeholder="パスワード"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 group"
          >
            ログイン
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">
              ※ デモ用アカウント:<br/>
              管理者: admin / admin<br/>
              一般: volunteer / 0000
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
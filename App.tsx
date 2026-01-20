
import { Login } from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { Main } from "./pages/Main";

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center text-orange-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="font-bold text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // 🔴 未ログイン時は必ずログイン画面
  if (!currentUser) {
    return <Login />;
  }

  // ✅ ログイン後のみアプリ本体
  return <Main />;
}

export default App;

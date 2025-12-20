
import React, { useState, useEffect } from 'react';
import { Zone, FeedingPoint, Cat, User, Member } from './types';
import { ZoneMap } from './components/ZoneMap';
import { CatStatus } from './components/CatStatus';
import { PhotoUpload } from './components/PhotoUpload';
import { Login } from './components/Login';
import { Calendar } from './components/Calendar';
import { DailyReport } from './components/DailyReport';
import { AdminDashboard } from './components/AdminDashboard';
import { WeatherWidget } from './components/WeatherWidget';
import { BottomNavigation } from './components/BottomNavigation';
import { storage } from './services/storage';
import { Map, Camera, HeartHandshake, LogOut, User as UserIcon, AlertCircle, MapPin, Plus, X, Save, Settings, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // View State: 'home' is Dashboard (Desktop default). 
  // 'sick', 'unchecked', 'zones', 'calendar' are Mobile Tab views.
  const [view, setView] = useState<'home' | 'zone' | 'point' | 'report' | 'admin-dashboard' | 'sick' | 'unchecked' | 'zones' | 'calendar'>('home');
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<FeedingPoint | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [wateredPoints, setWateredPoints] = useState<string[]>([]);
  
  const [cats, setCats] = useState<Cat[]>([]);
  const [points, setPoints] = useState<FeedingPoint[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Add Zone State
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDesc, setNewZoneDesc] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedCats, fetchedPoints, fetchedZones, fetchedMembers] = await Promise.all([
          storage.getCats(),
          storage.getPoints(),
          storage.getZones(),
          storage.getMembers()
        ]);
        
        setCats(fetchedCats);
        setPoints(fetchedPoints);
        setZones(fetchedZones);
        setMembers(fetchedMembers);
      } catch (e) {
        console.error("Failed to load data", e);
        // Error handling would go here
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
    setSelectedZone(null);
    setSelectedPoint(null);
    setSelectedDate(null);
  };

  const handleSelectZone = (zone: Zone) => {
    const currentZone = zones.find(z => z.id === zone.id) || zone;
    setSelectedZone(currentZone);
    setView('zone');
  };

  const handleSelectPoint = (point: FeedingPoint) => {
    const currentPoint = points.find(p => p.id === point.id) || point;
    setSelectedPoint(currentPoint);
    setView('point');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setView('report');
  };

  const goBack = () => {
    if (view === 'point') {
      setView('zone');
      setSelectedPoint(null);
    } else if (view === 'zone') {
      // Return to 'zones' tab if on mobile view, otherwise home
      setView('zones'); // Or smart detection
      setSelectedZone(null);
    } else if (view === 'report') {
      setView('calendar'); // Return to calendar tab
      setSelectedDate(null);
    } else if (view === 'admin-dashboard') {
      setView('home');
    }
  };

  const goHome = () => {
    setView('home');
    setSelectedZone(null);
    setSelectedPoint(null);
    setSelectedDate(null);
  };

  const handleToggleWater = (pointId: string) => {
    setWateredPoints(prev => 
      prev.includes(pointId) 
        ? prev.filter(id => id !== pointId) 
        : [...prev, pointId]
    );
  };

  // --- Mobile Navigation Handler ---
  const handleMobileNav = (action: string) => {
    if (action === 'upload') {
      setShowUpload(true);
      return;
    }
    // Switch View
    setView(action as any);
    
    // Reset selections if switching top-level tabs
    setSelectedZone(null);
    setSelectedPoint(null);
    setSelectedDate(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- CRUD Operations ---
  const handleUpdateCat = async (updatedCat: Cat) => {
    setCats(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
    await storage.saveCat(updatedCat, false);
  };

  const handleAddCat = async (newCat: Cat) => {
    setCats(prev => [...prev, newCat]);
    await storage.saveCat(newCat, true);
  };

  const handleUpdatePoint = async (updatedPoint: FeedingPoint) => {
    setPoints(prev => prev.map(p => p.id === updatedPoint.id ? updatedPoint : p));
    await storage.savePoint(updatedPoint, false);
  };

  const handleAddPoint = async (newPoint: FeedingPoint) => {
    setPoints(prev => [...prev, newPoint]);
    await storage.savePoint(newPoint, true);
  };

  const handleUpdateZone = async (updatedZone: Zone) => {
    setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
    if (selectedZone && selectedZone.id === updatedZone.id) {
      setSelectedZone(updatedZone);
    }
    await storage.saveZone(updatedZone, false);
  };
  
  const handleAddZone = async (newZone?: Zone) => {
    if (newZone) {
      setZones(prev => [...prev, newZone]);
      await storage.saveZone(newZone, true);
      return;
    }

    if (!newZoneName) return;
    const zoneToAdd: Zone = {
      id: `zone-${Date.now()}`,
      name: newZoneName,
      description: newZoneDesc || '新規エリア'
    };
    setZones(prev => [...prev, zoneToAdd]);
    await storage.saveZone(zoneToAdd, true);
    setIsAddingZone(false);
    setNewZoneName('');
    setNewZoneDesc('');
  };

  const handleUpdateMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const handleAddMember = (newMember: Member) => {
    setMembers(prev => [...prev, newMember]);
  };

  const isCheckedToday = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const uncheckedCats = cats.filter(cat => !isCheckedToday(cat.lastFed));
  const sickCats = cats.filter(cat => cat.status === 'injured' || cat.status === 'sick');

  const handleNavigateToCat = (cat: Cat) => {
    const point = points.find(p => p.id === cat.pointId);
    const zone = zones.find(z => z.id === point?.zoneId);
    
    if (point && zone) {
      setSelectedZone(zone);
      setSelectedPoint(point);
      setView('point');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center text-orange-500">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-bold text-gray-600">データを読み込み中...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // --- ADMIN DASHBOARD RENDER ---
  if (view === 'admin-dashboard') {
    if (currentUser.role !== 'admin') {
        setView('home');
        return null;
    }

    return (
      <>
        <AdminDashboard 
          cats={cats}
          points={points}
          zones={zones}
          members={members}
          onUpdateCat={handleUpdateCat}
          onAddCat={handleAddCat}
          onUpdatePoint={handleUpdatePoint}
          onAddPoint={handleAddPoint}
          onUpdateZone={handleUpdateZone}
          onAddZone={handleAddZone}
          onUpdateMember={handleUpdateMember}
          onAddMember={handleAddMember}
          onClose={() => setView('home')}
        />
        <BottomNavigation 
          currentView={view}
          onAction={handleMobileNav}
          userRole={currentUser.role}
        />
      </>
    );
  }

  // Helper to determine visibility based on current view AND screen size
  // On Mobile: Only show if view matches the section (or 'home' shows mostly everything in a specific layout)
  // On Desktop (md): Always show ('block')
  const getVisibilityClass = (isVisibleOnMobile: boolean) => {
    return isVisibleOnMobile ? 'block' : 'hidden md:block';
  };

  // Determine which sections are active for Mobile View
  const isHome = view === 'home';
  const isSickActive = isHome || view === 'sick';
  const isUncheckedActive = isHome || view === 'unchecked';
  const isZonesActive = isHome || view === 'zones';
  const isCalendarActive = isHome || view === 'calendar';
  const isWeatherActive = isHome || view === 'zones' || view === 'unchecked';
  const isStatusActive = isHome || view === 'unchecked';

  const isMainView = ['home', 'sick', 'unchecked', 'zones', 'calendar'].includes(view);

  // Layout Logic:
  // Mobile Home: Horizontal Scroll (flex overflow-x-auto)
  // Mobile Tab: Grid (grid grid-cols-2)
  // Desktop: Always Grid (md:grid md:grid-cols-...)
  const getLayoutClass = (isMobileHome: boolean, gridCols: string = 'grid-cols-2') => {
    return isMobileHome 
      ? `flex overflow-x-auto snap-x pb-4 px-1 no-scrollbar md:grid md:${gridCols} md:overflow-visible md:gap-4 md:px-0`
      : `grid ${gridCols} gap-4 pb-4 md:grid md:${gridCols} md:gap-4`;
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] shadow-2xl relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
      
      {isMainView && (
        <div className="p-4 md:p-8 pt-12 pb-24">
          <header className="mb-8 flex flex-col items-center relative">
            <button 
              onClick={handleLogout}
              className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="ログアウト"
            >
              <LogOut size={20} />
            </button>

            {currentUser.role === 'admin' && (
              <button 
                onClick={() => setView('admin-dashboard')}
                className="absolute top-0 left-0 p-2 text-gray-400 hover:text-orange-500 md:hidden"
                title="管理画面"
              >
                <Settings size={20} />
              </button>
            )}

            <div className="inline-block p-3 bg-orange-100 rounded-full mb-4">
              <HeartHandshake size={32} className="text-orange-500" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">港のネコを守る会</h1>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm mt-2">
              <UserIcon size={14} className={currentUser.role === 'admin' ? 'text-orange-500' : 'text-blue-500'} />
              <p className="text-xs font-bold text-gray-600">
                {currentUser.name} ({currentUser.role === 'admin' ? '管理者' : 'ボランティア'})
              </p>
            </div>
            {storage['useCloud'] && (
              <span className="mt-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle size={10} /> クラウド接続中
              </span>
            )}
          </header>

          <div className="space-y-8">
            
            {/* Admin Dashboard Button - Desktop Only */}
            {currentUser.role === 'admin' && view === 'home' && (
              <button 
                onClick={() => setView('admin-dashboard')}
                className="hidden md:flex w-full bg-gray-900 text-white p-4 rounded-xl shadow-lg shadow-gray-300 hover:bg-gray-800 transition-transform active:scale-[0.98] items-center justify-between group max-w-2xl mx-auto"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-gray-600 transition-colors">
                    <Settings className="text-orange-400" size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg leading-tight">管理ダッシュボード</h3>
                    <p className="text-xs text-gray-400">データ・会員の一括管理</p>
                  </div>
                </div>
                <div className="bg-gray-700 p-2 rounded-full">
                  <Plus size={16} />
                </div>
              </button>
            )}

            {/* Weather Widget */}
            <div className={getVisibilityClass(isWeatherActive)}>
              <WeatherWidget />
            </div>

            {/* Today's Status */}
            <div className={`bg-blue-50 p-6 rounded-2xl border border-blue-100 max-w-4xl mx-auto animate-fade-in-up ${getVisibilityClass(isStatusActive)}`}>
               <h3 className="font-bold text-blue-800 mb-2">本日の状況</h3>
               <div className="flex justify-between text-sm text-blue-600">
                 <span>餌やり達成率</span>
                 <span className="font-bold text-xl">
                   {cats.length > 0 ? Math.round(((cats.length - uncheckedCats.length) / cats.length) * 100) : 0}%
                 </span>
               </div>
               <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                 <div 
                   className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                   style={{ width: `${cats.length > 0 ? ((cats.length - uncheckedCats.length) / cats.length) * 100 : 0}%` }}
                 ></div>
               </div>
            </div>

            {/* Section: Sick Cats (Action Required) */}
            <section className={`max-w-5xl mx-auto animate-fade-in-up ${getVisibilityClass(isSickActive)}`}>
              <h2 className="text-lg font-bold text-gray-700 border-l-4 border-yellow-500 pl-3 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                   【要対応報告】
                   <span className="text-xs font-normal text-gray-500">(体調不良・怪我)</span>
                </span>
                {sickCats.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                    {sickCats.length}件
                  </span>
                )}
              </h2>
              {sickCats.length > 0 ? (
                <div className={getLayoutClass(isHome, 'grid-cols-2 md:grid-cols-3')}>
                  {sickCats.map(cat => {
                    const pointName = points.find(p => p.id === cat.pointId)?.name || '不明';
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleNavigateToCat(cat)}
                        className={`${isHome ? 'min-w-[200px] snap-start' : 'w-full'} bg-yellow-50 rounded-xl overflow-hidden shadow-sm border border-yellow-200 hover:border-orange-300 transition-all group flex-shrink-0 text-left`}
                      >
                         <div className="flex gap-3 p-3">
                           <img 
                            src={cat.imageUrl} 
                            alt={cat.name} 
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                           />
                           <div className="min-w-0 flex-1">
                             <h3 className="font-bold text-gray-800 text-sm truncate mb-1">{cat.name}</h3>
                             <p className="text-xs text-gray-500 flex items-center gap-1 truncate mb-2">
                                <MapPin size={10} /> {pointName}
                             </p>
                             <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${cat.status === 'injured' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                {cat.status === 'injured' ? '怪我' : '病気/不調'}
                             </span>
                           </div>
                         </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-800 text-sm font-bold">
                   <CheckCircle className="text-green-600" size={20} />
                   現在、要対応の報告はありません。
                </div>
              )}
            </section>
            
            {/* Section: Unchecked Cats (Absent) */}
            <section className={`max-w-5xl mx-auto animate-fade-in-up ${getVisibilityClass(isUncheckedActive)}`}>
              <h2 className="text-lg font-bold text-gray-700 border-l-4 border-red-500 pl-3 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                   【本日不在ネコ】
                   <span className="text-xs font-normal text-gray-500">(未チェック)</span>
                </span>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                  残り {uncheckedCats.length}匹
                </span>
              </h2>
              
              {uncheckedCats.length > 0 ? (
                <div className={getLayoutClass(isHome, 'grid-cols-2 md:grid-cols-5')}>
                  {uncheckedCats.map(cat => {
                    const pointName = points.find(p => p.id === cat.pointId)?.name || '不明';
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleNavigateToCat(cat)}
                        className={`${isHome ? 'min-w-[140px] snap-start' : 'w-full'} bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:border-orange-300 transition-all group flex-shrink-0 text-left`}
                      >
                        <div className="h-24 w-full relative overflow-hidden">
                          <img 
                            src={cat.imageUrl} 
                            alt={cat.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-1 right-1">
                             <AlertCircle size={16} className="text-red-500 fill-white" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-bold text-gray-800 text-sm truncate mb-1">{cat.name}</h3>
                          <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                             <MapPin size={10} /> {pointName}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center text-green-800 text-sm font-bold">
                  🎉 すべてのネコの確認が完了しました！
                </div>
              )}
            </section>

            {/* Section: Zones */}
            <section className={`max-w-4xl mx-auto animate-fade-in-up ${getVisibilityClass(isZonesActive)}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-700 border-l-4 border-orange-500 pl-3">
                  餌やり区画を選択
                </h2>
                {currentUser.role === 'admin' && (
                  <button 
                    onClick={() => setIsAddingZone(true)}
                    className="text-orange-500 bg-orange-50 hover:bg-orange-100 p-2 rounded-full transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => handleSelectZone(zone)}
                    className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 transition-all text-left w-full"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Map size={64} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{zone.name}</h3>
                    <p className="text-sm text-gray-500">{zone.description}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Section: Calendar */}
            <section className={`max-w-4xl mx-auto animate-fade-in-up ${getVisibilityClass(isCalendarActive)}`}>
              <Calendar 
                currentUser={currentUser} 
                onDateSelect={handleDateSelect} 
              />
            </section>

          </div>
        </div>
      )}

      {isAddingZone && currentUser.role === 'admin' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Plus size={20} className="text-orange-500" /> 新規区画を追加
              </h3>
              <button onClick={() => setIsAddingZone(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">区画名</label>
                <input 
                  type="text" 
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="例: 第3区画"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">説明・サブタイトル</label>
                <input 
                  type="text" 
                  value={newZoneDesc}
                  onChange={(e) => setNewZoneDesc(e.target.value)}
                  placeholder="例: 住宅街エリア"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                />
              </div>
              <button 
                onClick={() => handleAddZone()}
                className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Save size={18} /> 追加する
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'zone' && selectedZone && (
        <ZoneMap 
          zone={selectedZone}
          points={points.filter(p => p.zoneId === selectedZone.id)}
          cats={cats}
          wateredPoints={wateredPoints}
          onBack={goBack}
          onHome={goHome}
          onSelectPoint={handleSelectPoint}
          currentUser={currentUser}
          onUpdateZone={handleUpdateZone}
          onUpdatePoint={handleUpdatePoint}
          onAddPoint={handleAddPoint}
        />
      )}

      {view === 'point' && selectedPoint && (
        <CatStatus 
          point={points.find(p => p.id === selectedPoint.id) || selectedPoint}
          onUpdatePoint={handleUpdatePoint}
          cats={cats}
          onUpdateCat={handleUpdateCat}
          onAddCat={handleAddCat}
          isWatered={wateredPoints.includes(selectedPoint.id)}
          onToggleWater={() => handleToggleWater(selectedPoint.id)}
          onBack={goBack}
          onHome={goHome}
          currentUser={currentUser}
          points={points}
          zones={zones}
        />
      )}

      {view === 'report' && selectedDate && (
        <DailyReport 
          date={selectedDate}
          onBack={goBack}
          onHome={goHome}
          cats={cats}
          points={points}
          zones={zones}
        />
      )}

      {/* Floating Action Button - Desktop Only */}
      {view !== 'report' && (
        <div className="hidden md:flex fixed bottom-6 right-6 max-w-md w-full px-6 justify-end pointer-events-none z-30">
          <button 
            onClick={() => setShowUpload(true)}
            className="pointer-events-auto bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg shadow-gray-400/50 transform hover:scale-105 transition-all flex items-center justify-center gap-2"
            aria-label="Upload Photo"
          >
            <Camera size={24} />
            <span className="font-bold text-sm pr-1">写真判定</span>
          </button>
        </div>
      )}

      {/* Mobile Navigation - Mobile Only */}
      <BottomNavigation 
        currentView={view}
        onAction={handleMobileNav}
        userRole={currentUser.role}
      />

      {showUpload && (
        <PhotoUpload onClose={() => setShowUpload(false)} />
      )}

      </div>
    </div>
  );
};

export default App;
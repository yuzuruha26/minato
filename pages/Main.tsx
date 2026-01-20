
import React, { useState, useEffect } from 'react';
import { Zone, FeedingPoint, Cat, User, Member } from '../types';
import { ZoneMap } from '../services/components/ZoneMap';
import { CatStatus } from '../services/components/CatStatus';
import PhotoUpload from '../services/components/PhotoUpload';
import { Calendar } from '../services/components/Calendar';
import { DailyReport } from '../services/components/DailyReport';
import { AdminDashboard } from '../services/components/AdminDashboard';
import { WeatherWidget } from '../services/components/WeatherWidget';
import { BottomNavigation } from '../services/components/BottomNavigation';
import { storage as dataStorage } from '../services/storage';
import { auth } from '../services/firebase';
// Fix: Correct standard modular import for signOut
import { signOut } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { HeartHandshake, LogOut, User as UserIcon, AlertCircle, CheckCircle, Loader2, Settings } from 'lucide-react';

const isToday = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const Main: React.FC = () => {
  const { currentUser } = useAuth();
  const [view, setView] = useState<'home' | 'zone' | 'point' | 'report' | 'admin-dashboard' | 'sick' | 'unchecked' | 'zones' | 'calendar'>('home');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<FeedingPoint | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [wateredPoints, setWateredPoints] = useState<string[]>([]);
  
  const [cats, setCats] = useState<Cat[]>([]);
  const [points, setPoints] = useState<FeedingPoint[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedCats, fetchedPoints, fetchedZones, fetchedMembers] = await Promise.all([
          dataStorage.getCats(),
          dataStorage.getPoints(),
          dataStorage.getZones(),
          dataStorage.getMembers()
        ]);
        
        setCats(fetchedCats);
        setPoints(fetchedPoints);
        setZones(fetchedZones);
        setMembers(fetchedMembers);

        const initialWatered = fetchedPoints
          .filter(p => isToday(p.lastWatered))
          .map(p => p.id);
        setWateredPoints(initialWatered);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout failed", e);
    }
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
      setView('home');
      setSelectedZone(null);
    } else if (view === 'report') {
      setView('calendar');
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

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center text-orange-500">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-bold text-gray-600">データを同期中...</p>
      </div>
    );
  }

  const handleUpdateCat = async (updatedCat: Cat) => {
    setCats(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
    await dataStorage.saveCat(updatedCat, false);
  };

  const handleAddCat = async (newCat: Cat) => {
    setCats(prev => [...prev, newCat]);
    await dataStorage.saveCat(newCat, true);
  };

  const handleUpdatePoint = async (updatedPoint: FeedingPoint) => {
    setPoints(prev => prev.map(p => p.id === updatedPoint.id ? updatedPoint : p));
    await dataStorage.savePoint(updatedPoint, false);
  };

  const handleAddPoint = async (newPoint: FeedingPoint) => {
    setPoints(prev => [...prev, newPoint]);
    await dataStorage.savePoint(newPoint, true);
  };

  const handleUpdateZone = async (updatedZone: Zone) => {
    setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
    if (selectedZone && selectedZone.id === updatedZone.id) {
      setSelectedZone(updatedZone);
    }
    await dataStorage.saveZone(updatedZone, false);
  };
  
  const handleAddZone = async (newZone: Zone) => {
    setZones(prev => [...prev, newZone]);
    await dataStorage.saveZone(newZone, true);
  };

  const handleToggleWater = async (pointId: string) => {
    const isWatered = wateredPoints.includes(pointId);
    setWateredPoints(prev => isWatered ? prev.filter(id => id !== pointId) : [...prev, pointId]);

    const point = points.find(p => p.id === pointId);
    if (point) {
      const updatedPoint = { 
        ...point, 
        lastWatered: !isWatered ? new Date().toISOString() : undefined 
      };
      await handleUpdatePoint(updatedPoint);
    }
  };

  const handleUpdateMember = async (updatedMember: Member) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    await dataStorage.saveMember(updatedMember, false);
  };

  const handleAddMember = async (newMember: Member) => {
    setMembers(prev => [...prev, newMember]);
    await dataStorage.saveMember(newMember, true);
  };

  const handleMobileNav = (action: string) => {
    if (action === 'upload') {
      setShowUpload(true);
      return;
    }
    setView(action as any);
    setSelectedZone(null);
    setSelectedPoint(null);
    setSelectedDate(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uncheckedCats = cats.filter(cat => !isToday(cat.lastFed));
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

  const isMainView = ['home', 'sick', 'unchecked', 'zones', 'calendar'].includes(view);

  return (
    <div className="min-h-screen bg-[#fdfbf7] shadow-2xl relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
      
      {isMainView && (
        <div className="p-4 md:p-8 pt-12 pb-24">
          <header className="mb-8 flex flex-col items-center relative">
            <button onClick={handleLogout} className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><LogOut size={20} /></button>
            {currentUser.role === 'admin' && (<button onClick={() => setView('admin-dashboard')} className="absolute top-0 left-0 p-2 text-gray-400 hover:text-orange-500 md:hidden"><Settings size={20} /></button>)}
            <div className="inline-block p-3 bg-orange-100 rounded-full mb-4"><HeartHandshake size={32} className="text-orange-500" /></div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">港のネコを守る会</h1>
            <div className="flex flex-col items-center gap-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
                <UserIcon size={14} className={currentUser.role === 'admin' ? 'text-orange-500' : 'text-blue-500'} />
                <p className="text-xs font-bold text-gray-600">{currentUser.name}</p>
              </div>
              {dataStorage.useCloud ? (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold animate-pulse"><CheckCircle size={10} /> クラウド同期中</span>
              ) : (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><AlertCircle size={10} /> ローカルモード</span>
              )}
            </div>
          </header>

          <div className="space-y-8">
            <WeatherWidget />
            <div className={`bg-blue-50 p-6 rounded-2xl border border-blue-100 max-w-4xl mx-auto animate-fade-in-up`}>
               <h3 className="font-bold text-blue-800 mb-2">本日の達成率</h3>
               <div className="flex justify-between text-sm text-blue-600">
                 <span>餌やりチェック</span>
                 <span className="font-bold text-xl">{cats.length > 0 ? Math.round(((cats.length - uncheckedCats.length) / cats.length) * 100) : 0}%</span>
               </div>
               <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                 <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${cats.length > 0 ? ((cats.length - uncheckedCats.length) / cats.length) * 100 : 0}%` }}></div>
               </div>
            </div>

            <section className={`max-w-5xl mx-auto animate-fade-in-up`}>
              <h2 className="text-lg font-bold text-gray-700 border-l-4 border-yellow-500 pl-3 mb-4 flex items-center justify-between">
                <span>【要対応】</span>
                {sickCats.length > 0 && <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">{sickCats.length}件</span>}
              </h2>
              {sickCats.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sickCats.map(cat => (
                    <button key={cat.id} onClick={() => handleNavigateToCat(cat)} className="bg-yellow-50 rounded-xl overflow-hidden shadow-sm border border-yellow-200 text-left p-3 flex gap-3">
                       <img src={cat.imageUrl} className="w-12 h-12 rounded object-cover" />
                       <div className="min-w-0 flex-1">
                         <h3 className="font-bold text-sm truncate">{cat.name}</h3>
                         <span className={`text-[10px] px-1 rounded font-bold ${cat.status === 'injured' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{cat.status === 'injured' ? '怪我' : '不調'}</span>
                       </div>
                    </button>
                  ))}
                </div>
              ) : <div className="text-xs text-gray-400 text-center py-4">現在異常報告はありません。</div>}
            </section>
            
            <section className={`max-w-4xl mx-auto animate-fade-in-up`}>
              <h2 className="text-lg font-bold text-gray-700 border-l-4 border-orange-500 pl-3 mb-4">餌やり区画を選択</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map(zone => (
                  <button key={zone.id} onClick={() => handleSelectZone(zone)} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 text-left w-full transition-all">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{zone.name}</h3>
                    <p className="text-sm text-gray-500">{zone.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <Calendar currentUser={currentUser} onDateSelect={handleDateSelect} />
          </div>
        </div>
      )}

      {view === 'zone' && selectedZone && (<ZoneMap zone={selectedZone} points={points.filter(p => p.zoneId === selectedZone.id)} cats={cats} wateredPoints={wateredPoints} onBack={goBack} onHome={goHome} onSelectPoint={handleSelectPoint} currentUser={currentUser} onUpdateZone={handleUpdateZone} onUpdatePoint={handleUpdatePoint} onAddPoint={handleAddPoint} />)}
      {view === 'point' && selectedPoint && (<CatStatus point={points.find(p => p.id === selectedPoint.id) || selectedPoint} onUpdatePoint={handleUpdatePoint} cats={cats} onUpdateCat={handleUpdateCat} onAddCat={handleAddCat} isWatered={wateredPoints.includes(selectedPoint.id)} onToggleWater={() => handleToggleWater(selectedPoint.id)} onBack={goBack} onHome={goHome} currentUser={currentUser} points={points} zones={zones} />)}
      {view === 'report' && selectedDate && (<DailyReport date={selectedDate} onBack={goBack} onHome={goHome} cats={cats} points={points} zones={zones} />)}
      <BottomNavigation currentView={view} onAction={handleMobileNav} userRole={currentUser.role} />
      {showUpload && <PhotoUpload onClose={() => setShowUpload(false)} />}
      </div>
    </div>
  );
};

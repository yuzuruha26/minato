
import React from 'react';
import { Camera, Map, AlertTriangle, Calendar, Search } from 'lucide-react';
import { UserRole } from '../types';

interface BottomNavigationProps {
  currentView: string;
  onAction: (action: string) => void;
  userRole: UserRole;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentView,
  onAction,
  userRole 
}) => {
  const getButtonClass = (viewName: string, activeColor: string) => {
    const isActive = currentView === viewName;
    return `flex flex-col items-center gap-1 p-2 w-14 lg:w-16 transition-colors mb-2 active:scale-95 ${
      isActive ? activeColor : 'text-gray-400 hover:text-gray-600'
    }`;
  };

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 pb-2 pt-2 px-2 flex justify-between items-end z-40 md:hidden h-20 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
      
      {/* 1. 要対応 (Action Required) */}
      <button 
        onClick={() => onAction('sick')}
        className={getButtonClass('sick', 'text-red-500')}
      >
        <div className="relative">
           <AlertTriangle size={22} className={currentView === 'sick' ? 'fill-red-100' : ''} />
           <span className="absolute -top-1 -right-1 flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
           </span>
        </div>
        <span className="text-[9px] font-bold whitespace-nowrap">要対応</span>
      </button>

      {/* 2. 本日不在 (Absent) */}
      <button 
        onClick={() => onAction('unchecked')}
        className={getButtonClass('unchecked', 'text-orange-500')}
      >
        <Search size={22} strokeWidth={currentView === 'unchecked' ? 3 : 2} />
        <span className="text-[9px] font-bold whitespace-nowrap">本日不在</span>
      </button>

      {/* 3. Camera (Center) */}
      <div className="relative -top-8 px-1">
        <button 
          onClick={() => onAction('upload')}
          className="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-4 rounded-full shadow-xl shadow-orange-200 border-4 border-[#fdfbf7] active:scale-95 transition-all flex flex-col items-center justify-center group"
        >
          <Camera size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
        <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-bold text-gray-500 whitespace-nowrap bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-orange-50 pointer-events-none">
          写真判定
        </span>
      </div>

      {/* 4. 餌やり区画 (Zones) */}
      <button 
        onClick={() => onAction('zones')}
        className={getButtonClass('zones', 'text-orange-500')}
      >
        <Map size={22} className={currentView === 'zones' ? 'fill-orange-100' : ''} />
        <span className="text-[9px] font-bold whitespace-nowrap">餌やり区画</span>
      </button>

      {/* 5. 活動記録 (Activity Log) */}
      <button 
        onClick={() => onAction('calendar')}
        className={getButtonClass('calendar', 'text-blue-500')}
      >
        <Calendar size={22} className={currentView === 'calendar' ? 'fill-blue-100' : ''} />
        <span className="text-[9px] font-bold whitespace-nowrap">活動記録</span>
      </button>

    </div>
  );
};

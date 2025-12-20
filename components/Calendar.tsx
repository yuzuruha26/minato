import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Lock } from 'lucide-react';
import { User } from '../types';

interface CalendarProps {
  currentUser: User;
  onDateSelect: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ currentUser, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Constants
  const START_DATE = new Date('2025-01-01');
  const TODAY = new Date();
  
  // Role-based Access Limit (4 weeks ago for general users)
  const getAccessLimitDate = () => {
    if (currentUser.role === 'admin') return START_DATE;
    const limit = new Date();
    limit.setDate(limit.getDate() - 28);
    // Ensure we don't go before the global start date even for general users
    return limit < START_DATE ? START_DATE : limit;
  };

  const accessLimit = getAccessLimitDate();

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newDate >= new Date(START_DATE.getFullYear(), START_DATE.getMonth(), 1)) {
      setCurrentMonth(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (newDate <= TODAY) {
      setCurrentMonth(newDate);
    }
  };

  const isDateSelectable = (date: Date) => {
    // Basic validity checks
    if (date < START_DATE) return false;
    if (date > TODAY) return false;

    // Role check
    if (currentUser.role === 'admin') return true;
    
    // General user check (must be after accessLimit - setting hours to 0 for comparison)
    const checkDate = new Date(date);
    checkDate.setHours(0,0,0,0);
    const limit = new Date(accessLimit);
    limit.setHours(0,0,0,0);
    
    return checkDate >= limit;
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const selectable = isDateSelectable(date);
      const isToday = date.toDateString() === TODAY.toDateString();
      
      // Mock status for visual interest (random for past days)
      const mockStatus = selectable && day % 3 === 0 ? 'good' : (selectable && day % 5 === 0 ? 'bad' : 'neutral');

      days.push(
        <button
          key={day}
          onClick={() => selectable && onDateSelect(date)}
          disabled={!selectable}
          className={`
            h-10 w-full rounded-full flex items-center justify-center text-sm font-bold relative transition-all
            ${isToday ? 'bg-orange-100 text-orange-600 border border-orange-200' : ''}
            ${selectable 
              ? 'hover:bg-gray-100 text-gray-700' 
              : 'text-gray-300 bg-gray-50 cursor-not-allowed'}
          `}
        >
          {day}
          {/* Status Dot */}
          {selectable && !isToday && (
            <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
              mockStatus === 'good' ? 'bg-green-400' : 
              mockStatus === 'bad' ? 'bg-red-400' : 'bg-gray-300'
            }`}></span>
          )}
          {/* Lock Icon for restricted days */}
          {!selectable && date >= START_DATE && date <= TODAY && (
             <Lock size={10} className="absolute bottom-1 opacity-20" />
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <CalendarIcon size={18} className="text-orange-500" />
          活動記録
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth} 
            disabled={currentMonth <= START_DATE}
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold w-20 text-center">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </span>
          <button 
            onClick={handleNextMonth}
            disabled={currentMonth.getMonth() === TODAY.getMonth() && currentMonth.getFullYear() === TODAY.getFullYear()}
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
          <span key={i} className={`text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
      
      <div className="mt-3 text-xs text-gray-400 text-right">
        閲覧可能期間: {currentUser.role === 'admin' ? '全期間' : '過去4週間'}
      </div>
    </div>
  );
};
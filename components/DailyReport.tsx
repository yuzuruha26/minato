
import React, { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Home, MapPin, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Cat, FeedingPoint, Zone } from '../types';

interface DailyReportProps {
  date: Date;
  onBack: () => void;
  onHome: () => void;
  cats: Cat[];
  points: FeedingPoint[];
  zones: Zone[];
}

export const DailyReport: React.FC<DailyReportProps> = ({ date, onBack, onHome, cats, points, zones }) => {
  // Format Date: 2025年1月1日 (水)
  const formattedDate = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  // State for expanded zones in the unfed list
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});

  const toggleZone = (zoneId: string) => {
    setExpandedZones(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  // --- MOCK HISTORICAL DATA GENERATION ---
  // Since we don't have a real backend with historical logs, we simulate the status
  // of each cat for the selected DATE using the date timestamp as a seed.
  // This ensures the data looks consistent for the same date if revisited.
  
  const { sickReports, unfedCatsByZone, unfedTotal } = useMemo(() => {
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    
    // Pseudo-random generator based on seed
    const pseudoRandom = (input: number) => {
      const x = Math.sin(seed + input) * 10000;
      return x - Math.floor(x);
    };

    const sick: Array<{ cat: Cat, pointName: string, note: string }> = [];
    const unfed: Record<string, Cat[]> = {};
    let totalUnfedCount = 0;

    cats.forEach((cat, index) => {
      const rand = pseudoRandom(index);
      const point = points.find(p => p.id === cat.pointId);
      const pointName = point?.name || '不明';
      const zoneId = point?.zoneId || 'unknown';

      // 1. Determine "Sick/Injured" status (approx 5% chance)
      // Note: This mocks a PAST report.
      if (rand < 0.05) {
        sick.push({
          cat,
          pointName,
          note: rand < 0.02 ? '足を引きずっている様子。食欲はある。' : '目ヤニがひどい。ぐったりしている。'
        });
      }

      // 2. Determine "Unfed" status (approx 30% chance)
      if (rand > 0.6) {
        if (!unfed[zoneId]) unfed[zoneId] = [];
        unfed[zoneId].push(cat);
        totalUnfedCount++;
      }
    });

    return { sickReports: sick, unfedCatsByZone: unfed, unfedTotal: totalUnfedCount };
  }, [date, cats, points]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 pb-20">
      <div className="max-w-4xl mx-auto w-full">
        <div className="sticky top-0 bg-[#fdfbf7]/90 backdrop-blur-sm z-10 py-4 mb-4 border-b border-orange-100 flex items-center gap-3">
          <div className="flex gap-2">
            <button onClick={onBack} className="p-2 hover:bg-orange-100 rounded-full text-orange-600">
              <ArrowLeft />
            </button>
            <button onClick={onHome} className="p-2 hover:bg-orange-100 rounded-full text-orange-600">
              <Home />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{formattedDate}</h1>
            <p className="text-xs text-gray-500 font-medium">活動実績詳細</p>
          </div>
        </div>

        <div className="space-y-8 animate-fade-in-up">
          
          {/* Section 1: Health Alerts (Priority) */}
          <section>
            <h2 className="text-lg font-bold text-gray-700 border-l-4 border-red-500 pl-3 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              要対応報告
              <span className="text-sm font-normal text-gray-500">({sickReports.length}件)</span>
            </h2>

            {sickReports.length > 0 ? (
              <div className="space-y-4">
                {sickReports.map((report, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm flex gap-4">
                    <img src={report.cat.imageUrl} alt={report.cat.name} className="w-16 h-16 rounded-lg object-cover bg-gray-200 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-red-900">{report.cat.name}</h3>
                        <span className="text-xs bg-white text-red-600 px-2 py-0.5 rounded border border-red-100 font-bold">要確認</span>
                      </div>
                      <p className="text-xs text-red-700 font-bold mt-1 flex items-center gap-1">
                        <MapPin size={12} /> {report.pointName}
                      </p>
                      <div className="mt-2 p-2 bg-white/60 rounded text-xs text-gray-700 border border-red-100 flex items-start gap-2">
                        <FileText size={12} className="mt-0.5 text-red-400" />
                        {report.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-800">
                  <CheckCircle size={20} />
                  <span className="font-bold text-sm">この日の体調不良・怪我の報告はありません。</span>
              </div>
            )}
          </section>

          {/* Section 2: Unfed Cats by Zone */}
          <section>
            <h2 className="text-lg font-bold text-gray-700 border-l-4 border-orange-500 pl-3 mb-4 flex items-center justify-between">
              <span>餌やり未完了ネコ</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold">合計 {unfedTotal}匹</span>
            </h2>

            <div className="space-y-4">
              {zones.map(zone => {
                const unfedList = unfedCatsByZone[zone.id] || [];
                const isExpanded = expandedZones[zone.id];
                
                if (unfedList.length === 0) {
                  return (
                    <div key={zone.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center opacity-70">
                        <span className="font-bold text-gray-500">{zone.name}</span>
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle size={12} /> 全頭完了
                        </span>
                    </div>
                  );
                }

                return (
                  <div key={zone.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <button 
                        onClick={() => toggleZone(zone.id)}
                        className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-800">{zone.name}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                            未完了: {unfedList.length}匹
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="divide-y divide-gray-100">
                          {unfedList.map(cat => {
                            const pointName = points.find(p => p.id === cat.pointId)?.name || '不明';
                            return (
                              <div key={cat.id} className="p-3 flex items-center gap-3 pl-6">
                                <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                <div>
                                  <p className="font-bold text-sm text-gray-700">{cat.name}</p>
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <MapPin size={10} /> {pointName}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
